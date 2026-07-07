from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any
import uuid
import secrets
import bcrypt
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
    numerator: float = 0
    denominator: float = 0
    included: bool = True


class LossItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    description: str
    unit_cost: float = 0
    ocorrencia_mensal: float = 1
    category: str = ""  # optional Lean waste id


class CalculationInput(BaseModel):
    model_config = ConfigDict(extra="ignore")
    efficiency_type: Optional[str] = None
    unidade_medida: Optional[str] = None
    indicator_name: Optional[str] = None
    denominator_name: Optional[str] = None
    historical: List[HistoricalPoint] = Field(default_factory=list)
    performance_atual: Optional[float] = None
    valor_referencia: float
    loss_items: List[LossItem] = Field(default_factory=list)
    meta_reducao_pct: Optional[float] = 0


class LossItemResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    description: str
    unit_cost: float
    ocorrencia_mensal: float = 0
    category: str
    custo_mensal: float
    custo_anual: float


class CalculationResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    performance_atual: float
    valor_referencia: float
    gap_eficiencia: float
    gap_direction: str
    fator_ponderacao_atual: float
    perda_financeira_mensal: float
    perda_financeira_anual: float
    soma_perdas: float
    items: List[LossItemResult]
    impacto_mensal: float
    impacto_anual: float
    meta_reducao_pct: float = 0
    valor_recuperavel_mensal: float = 0
    valor_recuperavel_anual: float = 0
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


def pct_of(num: float, den: float) -> float:
    if not den:
        return 0.0
    return (num / den) * 100


def compute(payload: CalculationInput) -> CalculationResult:
    included = [p for p in payload.historical if p.included]
    source = included if included else list(payload.historical)

    if payload.performance_atual is not None:
        perf_atual = float(payload.performance_atual)
    else:
        pcts = [pct_of(p.numerator, p.denominator) for p in source]
        perf_atual = sum(pcts) / len(pcts) if pcts else 0.0

    avg_den = float(source[-1].denominator) if source else 0.0

    ref = float(payload.valor_referencia)
    gap = abs(ref - perf_atual)
    gap_direction = "below_ref" if ref >= perf_atual else "above_ref"

    perda_financeira_mensal = (gap / 100.0) * avg_den
    perda_financeira_anual = perda_financeira_mensal * 12

    items_result: List[LossItemResult] = []
    perdas_cat: dict = {w: 0.0 for w in LEAN_WASTES}
    perdas_cat["_SEM_CATEGORIA"] = 0.0

    for it in payload.loss_items:
        custo_mensal = float(it.unit_cost) * float(it.ocorrencia_mensal)
        custo_anual = custo_mensal * 12
        items_result.append(LossItemResult(
            id=it.id,
            description=it.description,
            unit_cost=it.unit_cost,
            ocorrencia_mensal=it.ocorrencia_mensal,
            category=it.category or "",
            custo_mensal=round(custo_mensal, 2),
            custo_anual=round(custo_anual, 2),
        ))
        if it.category and it.category in perdas_cat:
            perdas_cat[it.category] += custo_anual
        else:
            perdas_cat["_SEM_CATEGORIA"] += custo_anual

    soma_perdas = sum(i.custo_mensal for i in items_result)
    impacto_mensal = soma_perdas
    impacto_anual = impacto_mensal * 12

    meta_pct = max(0.0, min(100.0, float(payload.meta_reducao_pct or 0)))
    valor_recuperavel_mensal = (meta_pct / 100.0) * perda_financeira_mensal
    valor_recuperavel_anual = valor_recuperavel_mensal * 12

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
        fator_ponderacao_atual=round(avg_den, 2),
        perda_financeira_mensal=round(perda_financeira_mensal, 2),
        perda_financeira_anual=round(perda_financeira_anual, 2),
        soma_perdas=round(soma_perdas, 2),
        items=items_result,
        impacto_mensal=round(impacto_mensal, 2),
        impacto_anual=round(impacto_anual, 2),
        meta_reducao_pct=round(meta_pct, 2),
        valor_recuperavel_mensal=round(valor_recuperavel_mensal, 2),
        valor_recuperavel_anual=round(valor_recuperavel_anual, 2),
        perdas_por_categoria={k: round(v, 2) for k, v in perdas_cat.items()},
        nivel_desperdicio=nivel,
    )


@api_router.get("/")
async def root():
    return {"message": "Calculadora de Desperdício API", "version": "3.0"}


@api_router.get("/lean-wastes")
async def get_lean_wastes():
    return {"wastes": LEAN_WASTES}

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    

def verify_password(password: str, password_hash: str) -> bool:
    return bool(password_hash) and bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))

class LoginRequest(BaseModel):
    username: str
    password: str


@api_router.post("/auth/login")
async def login(payload: LoginRequest):
expected_user = os.environ.get("CALC_LOGIN_USER", "admin")
expected_pass = os.environ.get("CALC_LOGIN_PASSWORD", "")
is_admin = bool(expected_pass) and secrets.compare_digest(payload.username, expected_user) and secrets.compare_digest(payload.password, expected_pass)
user_doc = None if is_admin else await db.users.find_one({"username": payload.username})
is_user = (not is_admin) and bool(user_doc) and verify_password(payload.password, (user_doc or {}).get("password_hash", ""))
if not (is_admin or is_user):
    raise HTTPException(status_code=401, detail="Usuário ou senha inválidos.")
return {"ok": True, "role": "admin" if is_admin else "user"}
class RegisterRequest(BaseModel):
    username: str
    password: str
@api_router.post("/auth/register")
async def register(payload: RegisterRequest):
    username = payload.username.strip()
    password = payload.password
    admin_user = os.environ.get("CALC_LOGIN_USER", "admin")
    is_admin_name = bool(username) and username.lower() == admin_user.lower()
    existing = None if (not username or is_admin_name) else await db.users.find_one({"username": username})
    if not username or not password or len(password) < 6 or is_admin_name or existing:
        raise HTTPException(status_code=400, detail="Não foi possível criar o usuário. Verifique os dados e tente outro nome de usuário.")
    user_doc = {"id": str(uuid.uuid4()), "username": username, "password_hash": hash_password(password), "created_at": datetime.utcnow().isoformat()}
    await db.users.insert_one(user_doc)
    return {"ok": True}

            
            

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
