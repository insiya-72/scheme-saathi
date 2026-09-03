from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.database import init_db
from routes.schemes import router as schemes_router
from routes.auth import router as auth_router
from routes.ai_assistant import router as ai_router
from routes.emi_calculator import router as emi_router
from routes.channel_partner import router as partner_router
from routes.locations import router as locations_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database and tables
    init_db()
    yield


app = FastAPI(
    title="Scheme Saathi API",
    description="AI-driven government scheme matching platform",
    version="1.0.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# ROOT
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "Scheme Saathi backend is running",
        "status": "ok",
    }


# ---------------------------------------------------------
# HEALTH
# ---------------------------------------------------------

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "scheme-saathi-backend",
    }


# ---------------------------------------------------------
# ROUTERS
# ---------------------------------------------------------

app.include_router(schemes_router)
app.include_router(auth_router)
app.include_router(ai_router)
app.include_router(emi_router)
app.include_router(partner_router)
app.include_router(locations_router)