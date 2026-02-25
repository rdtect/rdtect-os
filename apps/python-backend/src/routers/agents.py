import json
import logging
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from src.services.agent_executor import AGENT_TOOLS, agent_executor

router = APIRouter()
_logger = logging.getLogger(__name__)


class AgentRequest(BaseModel):
    task: str
    system: str | None = None


@router.get("/")
async def agent_status() -> dict:
    return {
        "status": "ok",
        "model": agent_executor.model,
        "max_iterations": agent_executor.max_iterations,
        "tools": [t["name"] for t in AGENT_TOOLS],
    }


@router.post("/run")
async def run_agent(request: AgentRequest) -> StreamingResponse:
    async def event_generator():
        try:
            async for event in agent_executor.run(request.task, system=request.system):
                payload = {
                    "type": event.type,
                    "content": event.content,
                }
                if event.tool_name:
                    payload["tool_name"] = event.tool_name
                yield f"data: {json.dumps(payload)}\n\n"
        except Exception as e:
            _logger.error("Agent run stream error: %s", e, exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'content': 'Stream failed'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
