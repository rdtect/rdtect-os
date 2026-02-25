import asyncio
import logging
import os

import chromadb

_logger = logging.getLogger(__name__)


class RAGService:
    """
    Retrieval-Augmented Generation service backed by ChromaDB.

    Queries the user's Obsidian vault (pre-indexed into ChromaDB) and returns
    relevant chunks to inject as context into Claude prompts.

    ChromaDB uses L2 distance — lower score = more relevant.
    Results are filtered by ``RAG_MIN_SCORE`` (max distance threshold) and
    sorted ascending so the most relevant chunk comes first.
    """

    def __init__(self) -> None:
        self.chroma_url: str = os.getenv("CHROMA_URL", "https://chroma.rdtect.com")
        self.bearer_token: str = os.getenv("CHROMA_BEARER_TOKEN", "")
        self.collection_name: str = os.getenv("CHROMA_COLLECTION", "obsidian_vault")
        self.top_k: int = int(os.getenv("RAG_TOP_K", "5"))
        self.min_score: float = float(os.getenv("RAG_MIN_SCORE", "1.2"))

        self.client: chromadb.HttpClient | None = None
        self.collection: chromadb.Collection | None = None

        try:
            self.client = chromadb.HttpClient(
                host=self.chroma_url,
                headers={"Authorization": f"Bearer {self.bearer_token}"},
            )
        except Exception as e:
            _logger.warning("RAGService: ChromaDB unreachable at %s — %s", self.chroma_url, e)
            self.collection = None
            return

        if self.client is None:
            return

        try:
            self.collection = self.client.get_collection(self.collection_name)
        except Exception as e:
            _logger.warning(
                "RAGService: collection '%s' not found — %s", self.collection_name, e
            )
            self.collection = None

    def is_available(self) -> bool:
        """Return True if the ChromaDB collection is reachable and loaded."""
        return self.collection is not None

    async def retrieve(self, query: str, top_k: int | None = None) -> list[dict]:
        """
        Query the vault and return the top-k most relevant chunks.

        Args:
            query:  Natural-language query string.
            top_k:  Override the default ``RAG_TOP_K`` env setting.

        Returns:
            List of ``{"content": str, "source": str, "score": float}`` dicts,
            sorted by score ascending (most relevant first).  Returns ``[]`` when
            the collection is unavailable or the query fails.
        """
        if self.collection is None:
            return []

        n = top_k or self.top_k

        try:
            results = await asyncio.to_thread(
                self.collection.query,
                query_texts=[query],
                n_results=n,
            )
        except Exception as e:
            _logger.error("RAGService.retrieve failed: %s", e, exc_info=True)
            return []

        documents: list[str] = (results.get("documents") or [[]])[0]
        metadatas: list[dict] = (results.get("metadatas") or [[]])[0]
        distances: list[float] = (results.get("distances") or [[]])[0]

        chunks: list[dict] = []
        for i, distance in enumerate(distances):
            if distance > self.min_score:
                continue
            if i >= len(documents) or i >= len(metadatas):
                continue
            chunks.append(
                {
                    "content": documents[i],
                    "source": metadatas[i].get("source", ""),
                    "score": distance,
                }
            )

        chunks.sort(key=lambda c: c["score"])
        return chunks

    async def build_context(self, query: str, top_k: int | None = None) -> str:
        """
        Retrieve relevant vault chunks and format them as a markdown block
        ready for injection into a Claude system prompt.

        Each chunk is truncated to 500 chars to control token usage.
        Returns ``""`` when no relevant chunks are found.
        """
        chunks = await self.retrieve(query, top_k=top_k)
        if not chunks:
            return ""

        lines: list[str] = ["## Relevant Knowledge Base Context\n"]
        for i, chunk in enumerate(chunks, start=1):
            content = chunk["content"][:500]
            lines.append(f"[{i}] {chunk['source']}\n{content}\n")

        return "\n".join(lines)


# Module-level singleton — import and use directly:
#   from src.services.rag import rag_service
rag_service = RAGService()
