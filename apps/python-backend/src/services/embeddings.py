import asyncio
import logging
import os

import httpx

_logger = logging.getLogger(__name__)


class EmbeddingService:
    """
    Multi-provider embedding service.

    Routing priority:
      1. Cloudflare Workers AI (@cf/baai/bge-small-en-v1.5)
      2. Ollama (nomic-embed-text)
      3. RuntimeError
    """

    def __init__(self) -> None:
        self.cf_api_key: str = os.getenv("CF_WORKERS_AI_API_KEY", "")
        self.cf_account_id: str = os.getenv("CF_ACCOUNT_ID", "")
        self.ollama_url: str = os.getenv("OLLAMA_URL", "http://localhost:11434")

    async def generate(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for a list of texts using the first available provider."""
        if self.cf_api_key and self.cf_account_id:
            try:
                return await self._generate_cf(texts)
            except Exception as e:
                _logger.warning("CF Workers AI embedding failed, trying Ollama: %s", e)

        try:
            return await self._generate_ollama(texts)
        except Exception as e:
            _logger.error("Ollama embedding failed: %s", e)
            raise RuntimeError("No embedding provider available") from e

    async def _generate_cf(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings via Cloudflare Workers AI."""
        url = (
            f"https://api.cloudflare.com/client/v4/accounts/"
            f"{self.cf_account_id}/ai/run/@cf/baai/bge-small-en-v1.5"
        )
        headers = {"Authorization": f"Bearer {self.cf_api_key}"}
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(url, headers=headers, json={"text": texts})
            resp.raise_for_status()
            data = resp.json()
        result: list[list[float]] = data["result"]["data"]
        return result

    async def _generate_ollama(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings via Ollama (one text at a time)."""
        url = f"{self.ollama_url}/api/embeddings"

        async def _embed_one(text: str) -> list[float]:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    url, json={"model": "nomic-embed-text", "prompt": text}
                )
                resp.raise_for_status()
                data = resp.json()
            return data["embedding"]

        results = await asyncio.gather(*[_embed_one(t) for t in texts])
        return list(results)


# Module-level singleton — import and use directly:
#   from src.services.embeddings import embedding_service
embedding_service = EmbeddingService()
