import asyncio
import hashlib
import logging
import os

import chromadb

from src.services.embeddings import embedding_service

_logger = logging.getLogger(__name__)


class IndexerService:
    """
    Document indexing service backed by ChromaDB.

    Chunks documents, generates embeddings via EmbeddingService,
    and upserts into the configured ChromaDB collection.
    """

    def __init__(self) -> None:
        self.chroma_url: str = os.getenv("CHROMA_URL", "https://chroma.rdtect.com")
        self.bearer_token: str = os.getenv("CHROMA_BEARER_TOKEN", "")
        self.collection_name: str = os.getenv("CHROMA_COLLECTION", "obsidian_vault")

        self.client: chromadb.HttpClient | None = None
        self.collection: chromadb.Collection | None = None

        try:
            self.client = chromadb.HttpClient(
                host=self.chroma_url,
                headers={"Authorization": f"Bearer {self.bearer_token}"},
            )
        except Exception as e:
            _logger.warning("IndexerService: ChromaDB unreachable at %s — %s", self.chroma_url, e)
            return

        if self.client is None:
            return

        try:
            self.collection = self.client.get_or_create_collection(self.collection_name)
        except Exception as e:
            _logger.warning(
                "IndexerService: collection '%s' unavailable — %s", self.collection_name, e
            )
            self.collection = None

    def _chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 100) -> list[str]:
        """Split text into chunks with overlap."""
        if len(text) <= chunk_size:
            return [text]
        chunks: list[str] = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunks.append(text[start:end])
            start += chunk_size - overlap
        return chunks

    async def index_documents(self, documents: list[dict]) -> dict:
        """
        Index a list of documents into ChromaDB.

        Each document: {"content": str, "source": str, "metadata": dict}

        Returns: {"indexed": int, "chunks": int, "errors": list[str]}
        """
        if self.collection is None:
            return {"indexed": 0, "chunks": 0, "errors": ["ChromaDB collection unavailable"]}

        all_chunks: list[str] = []
        all_metadatas: list[dict] = []
        all_ids: list[str] = []
        errors: list[str] = []

        for doc in documents:
            try:
                content: str = doc["content"]
                source: str = doc["source"]
                metadata: dict = doc.get("metadata", {})

                chunks = self._chunk_text(content)
                for i, chunk in enumerate(chunks):
                    chunk_id = hashlib.sha256(f"{source}:{i}:{chunk[:50]}".encode()).hexdigest()
                    all_chunks.append(chunk)
                    all_metadatas.append({**metadata, "source": source, "chunk_index": i})
                    all_ids.append(chunk_id)
            except Exception as e:
                errors.append(f"Error processing document '{doc.get('source', '?')}': {e}")

        if not all_chunks:
            return {"indexed": 0, "chunks": 0, "errors": errors}

        try:
            embeddings = await embedding_service.generate(all_chunks)
        except Exception as e:
            errors.append(f"Embedding generation failed: {e}")
            return {"indexed": 0, "chunks": 0, "errors": errors}

        try:
            await asyncio.to_thread(
                self.collection.add,
                documents=all_chunks,
                embeddings=embeddings,
                metadatas=all_metadatas,
                ids=all_ids,
            )
        except Exception as e:
            errors.append(f"ChromaDB upsert failed: {e}")
            return {"indexed": 0, "chunks": 0, "errors": errors}

        return {"indexed": len(documents), "chunks": len(all_chunks), "errors": errors}

    async def get_collection_stats(self) -> dict:
        """Return collection statistics."""
        if self.collection is None:
            return {"count": 0, "collection": self.collection_name, "available": False}

        try:
            count = await asyncio.to_thread(self.collection.count)
            return {"count": count, "collection": self.collection_name, "available": True}
        except Exception as e:
            _logger.error("IndexerService.get_collection_stats failed: %s", e)
            return {"count": 0, "collection": self.collection_name, "available": False}


# Module-level singleton — import and use directly:
#   from src.services.indexer import indexer_service
indexer_service = IndexerService()
