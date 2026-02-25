import logging
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from src.services.rag import rag_service


class SearchResult(BaseModel):
    content: str
    source: str
    score: float


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]
    count: int
    rag_available: bool


router = APIRouter()
_logger = logging.getLogger(__name__)


@router.get("/")
async def knowledge_status() -> dict:
    return {
        "status": "ok",
        "available": rag_service.is_available(),
        "collection": "obsidian_vault",
    }


@router.get("/search", response_model=SearchResponse)
async def search_knowledge(
    q: str = Query(..., description="Search query", min_length=1, max_length=500),
    top_k: int = Query(5, ge=1, le=20, description="Number of results"),
) -> SearchResponse:
    if not rag_service.is_available():
        raise HTTPException(status_code=503, detail="Knowledge base not available")
    try:
        results = await rag_service.retrieve(q, top_k=top_k)
        return SearchResponse(
            query=q,
            results=[SearchResult(**r) for r in results],
            count=len(results),
            rag_available=True,
        )
    except Exception as exc:
        _logger.error("Knowledge search failed for query %r: %s", q, exc)
        raise HTTPException(status_code=500, detail="Search failed")


class ContextRequest(BaseModel):
    query: str
    top_k: int = 5


@router.post("/context")
async def get_context(request: ContextRequest) -> dict:
    if not rag_service.is_available():
        return {"context": "", "available": False}
    try:
        context = await rag_service.build_context(request.query, top_k=request.top_k)
        return {"context": context, "available": True}
    except Exception as exc:
        _logger.error("Context build failed for query %r: %s", request.query, exc)
        return {"context": "", "available": False}
