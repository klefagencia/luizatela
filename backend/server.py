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

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Calculadora de Desperdício API")
api_router = APIRouter(prefix="/api")


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
    label: str
    value: float
    included: bool = True


class LossItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    description: str
    unit_cost: float
    category: str = ""  # optional Lean waste id


class CalculationInput(BaseModel):
    model_config = ConfigDict(extra="ignore")
    historical: List[HistoricalPoint] = Field(default_factory=list)
    performance_atual: Optional[float] = None
    valor_referencia: float
    volume_periodo: float
    loss_items: List[LossItem] = Field(default_factory=list)


class LossItemResult(BaseModel):
    id: str
    description: str
    unit_cost: float
    category: str
    impacto_mensal: float
    impacto_anual: float


class CalculationResult(BaseModel):
    performance_atual: float
    valor_referencia: float
    gap_eficiencia: float
    gap_direction: str
    volume_periodo: float
    soma_perdas: float
    items: List[LossItemResult]
    impacto_mensal: float
    impacto_anual: float
    perdas_por_categoria: dict
    nivel_desperdicio: str


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


def compute(payload: CalculationInput) -> CalculationResult:
    # Performance Atual = AVG of included historical points
    if payload.performance_atual is not None:
        perf_atual = float(payload.performance_atual)
    elif payload.historical:
        included = [p.value for p in payload.historical if p.included]
        source = included if included else [p.value for p in payload.historical]
        perf_atual = sum(source) / len(source) if source else 0.0
    else:
        perf_atual = 0.0

    ref = float(payload.valor_referencia)
    # Bidirectional GAP (always positive)
    gap = abs(ref - perf_atual)
    gap_direction = "below_ref" if ref >= perf_atual else "above_ref"

    volume = float(payload.volume_periodo or 0)
    soma_perdas = sum(it.unit_cost for it in payload.loss_items)

    # Impact formula: Volume × (GAP/100) × Σ unit costs
    impacto_mensal = volume * (gap / 100.0) * soma_perdas
    impacto_anual = impacto_mensal * 12

    items_result: List[LossItemResult] = []
    perdas_cat: dict = {w: 0.0 for w in LEAN_WASTES}
    perdas_cat["_SEM_CATEGORIA"] = 0.0

    for it in payload.loss_items:
        share = (it.unit_cost / soma_perdas) if soma_perdas > 0 else 0.0
        item_mensal = impacto_mensal * share
        item_anual = item_mensal * 12
        items_result.append(LossItemResult(
            id=it.id,
            description=it.description,
            unit_cost=it.unit_cost,
            category=it.category or "",
            impacto_mensal=round(item_mensal, 2),
            impacto_anual=round(item_anual, 2),
        ))
        if it.category and it.category in perdas_cat:
            perdas_cat[it.category] += item_anual
        else:
            perdas_cat["_SEM_CATEGORIA"] += item_anual

    if gap > 20:
        nivel = "critico"
    elif gap > 5:
        nivel = "atencao"
    else:
        nivel = "ok"

    return CalculationResult(
        performance_atual=round(perf_atual, 4),
        valor_referencia=round(ref, 4),
        gap_eficiencia=round(gap, 4),
        gap_direction=gap_direction,
        volume_periodo=volume,
        soma_perdas=round(soma_perdas, 2),
        items=items_result,
        impacto_mensal=round(impacto_mensal, 2),
        impacto_anual=round(impacto_anual, 2),
        perdas_por_categoria={k: round(v, 2) for k, v in perdas_cat.items()},
        nivel_desperdicio=nivel,
    )


@api_router.get("/")
async def root():
    return {"message": "Calculadora de Desperdício API", "version": "2.0"}


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


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
