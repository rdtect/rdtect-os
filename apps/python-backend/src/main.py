import logging
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from src.routers import chat, knowledge, vps, agents

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])


@asynccontextmanager
async def lifespan(_app: FastAPI):
    logger.info("rdtect OS API starting up")
    yield
    logger.info("rdtect OS API shutting down")


app = FastAPI(
    title="rdtect OS API",
    description="Agentic backend for rdtect OS — AI, knowledge, VPS monitoring",
    version="1.0.0",
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

allowed_origins = os.getenv("ALLOWED_ORIGINS", "https://rdtect.com,http://localhost:5176").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(knowledge.router, prefix="/api/knowledge", tags=["knowledge"])
app.include_router(vps.router, prefix="/api/vps", tags=["vps"])
app.include_router(agents.router, prefix="/api/agents", tags=["agents"])


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "rdtect-os-api", "version": "1.0.0"}


@app.get("/")
async def root() -> dict:
    return {
        "service": "rdtect OS API",
        "docs": "/docs",
        "endpoints": ["/api/chat", "/api/knowledge", "/api/vps", "/api/agents"],
    }
