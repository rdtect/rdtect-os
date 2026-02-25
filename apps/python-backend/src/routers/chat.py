import json
import logging
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from src.services.ai import ai_service
from src.services.rag import rag_service

_logger = logging.getLogger(__name__)

router = APIRouter()

_DEFAULT_SYSTEM = (
    "You are an AI assistant embedded in rdtect OS — a web-based agentic desktop environment "
    "at rdtect.com. You have access to the user's knowledge base. Be precise and concise."
)


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    use_rag: bool = True       # whether to inject RAG context
    system: str | None = None  # optional system prompt override


@router.get("/")
async def chat_info():
    """Health / info endpoint for the chat router."""
    return {
        "status": "ok",
        "rag_available": rag_service.is_available(),
        "model": "Claude via Anthropic API",
    }


@router.post("/stream")
async def stream_chat(request: ChatRequest) -> StreamingResponse:
    """Stream a Claude response as Server-Sent Events."""
    try:
        # 1. Convert Pydantic models to plain dicts
        messages = [{"role": m.role, "content": m.content} for m in request.messages]

        # 2. Build RAG context from the last user message
        rag_context = ""
        if request.use_rag and rag_service.is_available():
            last_user_messages = [m for m in request.messages if m.role == "user"]
            if last_user_messages:
                query = last_user_messages[-1].content
                rag_context = await rag_service.build_context(query)
                _logger.debug("RAG context built (%d chars)", len(rag_context))

        # 3. Build system prompt
        system = request.system or _DEFAULT_SYSTEM
        if rag_context:
            system = system + "\n\n" + rag_context

        # 4. SSE generator
        async def event_generator():
            try:
                async for token in ai_service.stream_chat(messages, system=system):
                    yield f"data: {json.dumps({'token': token})}\n\n"
                yield f"data: {json.dumps({'done': True})}\n\n"
            except Exception as inner_exc:
                _logger.exception("Error inside SSE stream: %s", inner_exc)
                yield f"data: {json.dumps({'error': str(inner_exc)})}\n\n"

        # 5. Return streaming response
        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )

    except Exception as exc:
        _logger.exception("Failed to initialise chat stream: %s", exc)

        async def error_generator():
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"

        return StreamingResponse(
            error_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )
