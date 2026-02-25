import asyncio
import logging
import os
import time

import docker
import httpx
import psutil

_logger = logging.getLogger(__name__)

_DOCKER_SOCKET = os.getenv("DOCKER_SOCKET", "/var/run/docker.sock")
_OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")


class VPSMonitorService:
    """
    Live VPS infrastructure metrics service for rdtect OS.

    Provides CPU, memory, disk, network, Docker container stats, and
    Ollama status. Powers the System Monitor plugin and /proc/vps/* VFS
    entries in the frontend.
    """

    def __init__(self) -> None:
        self.docker_client = None
        try:
            self.docker_client = docker.from_env(timeout=5)
            _logger.info("Docker client connected via %s", _DOCKER_SOCKET)
        except Exception as exc:
            _logger.warning("Docker unavailable — container metrics disabled: %s", exc)

        self.ollama_url = _OLLAMA_URL

    # ------------------------------------------------------------------
    # System metrics
    # ------------------------------------------------------------------

    async def get_system_metrics(self) -> dict:
        """Snapshot of CPU, memory, disk, network, and uptime."""
        cpu_percent, cpu_count, memory, disk, network, boot_time = await asyncio.gather(
            asyncio.to_thread(psutil.cpu_percent, 0.1),
            asyncio.to_thread(psutil.cpu_count),
            asyncio.to_thread(psutil.virtual_memory),
            asyncio.to_thread(psutil.disk_usage, "/"),
            asyncio.to_thread(psutil.net_io_counters),
            asyncio.to_thread(psutil.boot_time),
        )

        return {
            "cpu_percent": cpu_percent,
            "cpu_count": cpu_count,
            "memory": {
                "total": memory.total,
                "available": memory.available,
                "percent": memory.percent,
                "used": memory.used,
            },
            "disk": {
                "total": disk.total,
                "used": disk.used,
                "free": disk.free,
                "percent": disk.percent,
            },
            "network": {
                "bytes_sent": network.bytes_sent,
                "bytes_recv": network.bytes_recv,
            },
            "uptime_seconds": int(time.time() - boot_time),
        }

    # ------------------------------------------------------------------
    # Docker containers
    # ------------------------------------------------------------------

    def _parse_container_cpu(self, stats: dict) -> float | None:
        """Extract CPU percentage from raw Docker stats dict."""
        try:
            cpu_delta = (
                stats["cpu_stats"]["cpu_usage"]["total_usage"]
                - stats["precpu_stats"]["cpu_usage"]["total_usage"]
            )
            system_delta = (
                stats["cpu_stats"]["system_cpu_usage"]
                - stats["precpu_stats"]["system_cpu_usage"]
            )
            cpu_count = (
                stats["cpu_stats"].get("online_cpus")
                or len(stats["cpu_stats"]["cpu_usage"].get("percpu_usage", []))
                or 1
            )
            if system_delta <= 0:
                return None
            return (cpu_delta / system_delta) * cpu_count * 100
        except (KeyError, TypeError, ZeroDivisionError):
            return None

    async def get_docker_containers(self) -> list[dict]:
        """Return a list of running containers with basic stats."""
        if self.docker_client is None:
            return []

        containers = await asyncio.to_thread(self.docker_client.containers.list)

        async def _container_info(container) -> dict:
            image_tag = (
                container.image.tags[0]
                if container.image.tags
                else container.image.short_id
            )
            cpu_percent: float | None = None
            try:
                raw_stats = await asyncio.to_thread(container.stats, stream=False)
                cpu_percent = self._parse_container_cpu(raw_stats)
            except Exception as exc:
                _logger.debug(
                    "Could not retrieve stats for container %s: %s",
                    container.short_id,
                    exc,
                )

            return {
                "id": container.short_id,
                "name": container.name,
                "image": image_tag,
                "status": container.status,
                "cpu_percent": cpu_percent,
            }

        return await asyncio.gather(*[_container_info(c) for c in containers])

    # ------------------------------------------------------------------
    # Ollama status
    # ------------------------------------------------------------------

    async def get_ollama_status(self) -> dict:
        """Check Ollama availability, installed models, and version."""
        available = False
        models: list[str] = []
        version = ""

        async with httpx.AsyncClient(timeout=3.0) as client:
            try:
                resp = await client.get(f"{self.ollama_url}/api/tags")
                resp.raise_for_status()
                data = resp.json()
                available = True
                models = [m["name"] for m in data.get("models", [])]
            except Exception as exc:
                _logger.debug("Ollama /api/tags unavailable: %s", exc)
                # Early return; async context manager still guarantees client cleanup
                return {"available": False, "models": [], "version": ""}

            try:
                v_resp = await client.get(f"{self.ollama_url}/api/version")
                v_resp.raise_for_status()
                version = v_resp.json().get("version", "")
            except Exception as exc:
                _logger.debug("Ollama /api/version unavailable: %s", exc)

        return {"available": available, "models": models, "version": version}

    # ------------------------------------------------------------------
    # Aggregate
    # ------------------------------------------------------------------

    async def get_all(self) -> dict:
        """Gather all metrics in parallel and return a single snapshot."""
        system, containers, ollama = await asyncio.gather(
            self.get_system_metrics(),
            self.get_docker_containers(),
            self.get_ollama_status(),
        )
        return {
            "system": system,
            "containers": containers,
            "ollama": ollama,
            "timestamp": time.time(),
        }


vps_monitor = VPSMonitorService()
