from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Calculadora de Desperdício API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ============================================================
# MODELS
# ============================================================

LEAN_WASTES = [
    "DEFEITO",
    "SUPERPRODUCAO",
    "ESPERA",
    "RECURSOS",
    "TRANSPORTE",
    "ESTOQUE",
    "MOVIMENTACAO",
    "SUPERPROCESSAMENTO",
]


class HistoricalPoint(BaseModel):
    model_config = ConfigDict(extra="ignore")
    label: str  # e.g. "Jan/24"
    value: float  # Productivity %


class CostItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    description: str
    unit_cost: float  # R$ per unit
    category: str  # one of LEAN_WASTES


class CalculationInput(BaseModel):
    model_config = ConfigDict(extra="ignore")
    historical: List[HistoricalPoint] = Field(default_factory=list)
    performance_atual: Optional[float] = None  # if None -> avg of historical
    valor_referencia: float
    volume_periodo: float  # production volume in period (e.g. monthly)
    revenue_monthly: Optional[float] = None  # for % faturamento
    selected_wastes: List[str] = Field(default_factory=list)
    cost_items: List[CostItem] = Field(default_factory=list)


class CostItemResult(BaseModel):
    id: str
    description: str
    unit_cost: float
    category: str
    perda_atual: float
    perda_referencia: float
    perda_real_mensal: float
    perda_real_anual: float


class CalculationResult(BaseModel):
    performance_atual: float
    valor_referencia: float
    gap_eficiencia: float  # reference - actual
    volume_periodo: float
    items: List[CostItemResult]
    total_perda_atual_mensal: float
    total_perda_referencia_mensal: float
    total_perda_real_mensal: float
    total_perda_real_anual: float
    perdas_por_categoria: dict  # category -> perda_real_anual
    pct_faturamento: Optional[float] = None
    nivel_desperdicio: str  # ok | atencao | critico


class Simulation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    name: Optional[str] = None
    input: CalculationInput
    result: CalculationResult


class SimulationCreate(BaseModel):
    name: Optional[str] = None
    input: CalculationInput
    result: CalculationResult


# ============================================================
# CALCULATION LOGIC (Faithful to spreadsheet)
# ============================================================

def compute(payload: CalculationInput) -> CalculationResult:
    # Performance Atual = AVERAGE of historical productivity %
    if payload.performance_atual is not None:
        perf_atual = float(payload.performance_atual)
    elif payload.historical:
        vals = [p.value for p in payload.historical]
        perf_atual = sum(vals) / len(vals) if vals else 0.0
    else:
        perf_atual = 0.0

    ref = float(payload.valor_referencia)
    gap = ref - perf_atual

    volume = float(payload.volume_periodo or 0)

    items_result: List[CostItemResult] = []
    total_atual = 0.0
    total_ref = 0.0
    perdas_cat: dict = {w: 0.0 for w in LEAN_WASTES}

    for it in payload.cost_items:
        # Faithful to spreadsheet logic:
        # PERDA ATUAL R$ = Volume × Custo Unitário × (1 - PerfAtual/100)
        # PERDA REFERÊNCIA R$ = Volume × Custo Unitário × (1 - Referência/100)
        # PERDA REAL MENSAL = PERDA ATUAL - PERDA REFERÊNCIA
        # PERDA REAL ANUAL = MENSAL × 12
        perda_atual = volume * it.unit_cost * max(0.0, (1 - perf_atual / 100))
        perda_ref = volume * it.unit_cost * max(0.0, (1 - ref / 100))
        perda_mensal = max(0.0, perda_atual - perda_ref)
        perda_anual = perda_mensal * 12

        items_result.append(CostItemResult(
            id=it.id,
            description=it.description,
            unit_cost=it.unit_cost,
            category=it.category,
            perda_atual=round(perda_atual, 2),
            perda_referencia=round(perda_ref, 2),
            perda_real_mensal=round(perda_mensal, 2),
            perda_real_anual=round(perda_anual, 2),
        ))

        total_atual += perda_atual
        total_ref += perda_ref
        if it.category in perdas_cat:
            perdas_cat[it.category] += perda_anual

    total_mensal = max(0.0, total_atual - total_ref)
    total_anual = total_mensal * 12

    pct_fat = None
    if payload.revenue_monthly and payload.revenue_monthly > 0:
        pct_fat = round((total_mensal / payload.revenue_monthly) * 100, 2)

    # Nível de desperdício (baseado no GAP)
    if gap <= 5:
        nivel = "ok"
    elif gap <= 20:
        nivel = "atencao"
    else:
        nivel = "critico"

    return CalculationResult(
        performance_atual=round(perf_atual, 4),
        valor_referencia=round(ref, 4),
        gap_eficiencia=round(gap, 4),
        volume_periodo=volume,
        items=items_result,
        total_perda_atual_mensal=round(total_atual, 2),
        total_perda_referencia_mensal=round(total_ref, 2),
        total_perda_real_mensal=round(total_mensal, 2),
        total_perda_real_anual=round(total_anual, 2),
        perdas_por_categoria={k: round(v, 2) for k, v in perdas_cat.items()},
        pct_faturamento=pct_fat,
        nivel_desperdicio=nivel,
    )


# ============================================================
# ROUTES
# ============================================================

@api_router.get("/")
async def root():
    return {"message": "Calculadora de Desperdício API", "version": "1.0"}


@api_router.get("/lean-wastes")
async def get_lean_wastes():
    return {"wastes": LEAN_WASTES}


@api_router.post("/calculate", response_model=CalculationResult)
async def calculate(payload: CalculationInput):
    return compute(payload)


@api_router.post("/simulations", response_model=Simulation)
async def create_simulation(payload: SimulationCreate):
    sim = Simulation(name=payload.name, input=payload.input, result=payload.result)
    doc = sim.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.simulations.insert_one(doc)
    return sim


@api_router.get("/simulations", response_model=List[Simulation])
async def list_simulations():
    docs = await db.simulations.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    for d in docs:
        if isinstance(d.get('created_at'), str):
            d['created_at'] = datetime.fromisoformat(d['created_at'])
    return docs


@api_router.get("/simulations/{sim_id}", response_model=Simulation)
async def get_simulation(sim_id: str):
    doc = await db.simulations.find_one({"id": sim_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Simulação não encontrada")
    if isinstance(doc.get('created_at'), str):
        doc['created_at'] = datetime.fromisoformat(doc['created_at'])
    return doc


@api_router.delete("/simulations/{sim_id}")
async def delete_simulation(sim_id: str):
    res = await db.simulations.delete_one({"id": sim_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Simulação não encontrada")
    return {"deleted": True}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
