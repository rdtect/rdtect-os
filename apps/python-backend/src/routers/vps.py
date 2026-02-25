import logging
from fastapi import APIRouter, HTTPException
from src.services.vps_monitor import vps_monitor

router = APIRouter()
_logger = logging.getLogger(__name__)


@router.get("/")
async def health_check() -> dict:
    try:
        return {
            "status": "ok",
            "docker_available": vps_monitor.docker_client is not None,
            "ollama_url": vps_monitor.ollama_url,
        }
    except Exception as e:
        _logger.error("Health check failed: %s", e)
        raise HTTPException(status_code=500, detail="Health check failed")


@router.get("/metrics")
async def get_metrics() -> dict:
    try:
        return await vps_monitor.get_all()
    except Exception as e:
        _logger.error("Failed to collect metrics: %s", e)
        raise HTTPException(500, "Failed to collect metrics")


@router.get("/system")
async def get_system() -> dict:
    try:
        return await vps_monitor.get_system_metrics()
    except Exception as e:
        _logger.error("Failed to collect system metrics: %s", e)
        raise HTTPException(500, "Failed to collect system metrics")


@router.get("/containers")
async def get_containers() -> list:
    try:
        return await vps_monitor.get_docker_containers()
    except Exception as e:
        _logger.error("Failed to list containers: %s", e)
        raise HTTPException(500, "Failed to list containers")


@router.get("/ollama")
async def get_ollama() -> dict:
    try:
        return await vps_monitor.get_ollama_status()
    except Exception as e:
        _logger.error("Failed to check Ollama: %s", e)
        raise HTTPException(500, "Failed to check Ollama")
