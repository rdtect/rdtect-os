import json
import logging
import os
from collections.abc import AsyncIterator
from dataclasses import dataclass
from datetime import datetime, timezone

import anthropic

_logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# SSE event type constants
# ---------------------------------------------------------------------------

EVENT_THINKING = "thinking"
EVENT_TOOL_CALL = "tool_call"
EVENT_TOOL_RESULT = "tool_result"
EVENT_TEXT = "text"
EVENT_DONE = "done"
EVENT_ERROR = "error"

# ---------------------------------------------------------------------------
# Tool definitions
# ---------------------------------------------------------------------------

AGENT_TOOLS: list[dict] = [
    {
        "name": "search_knowledge_base",
        "description": "Search the user's Obsidian vault knowledge base for relevant notes and information.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "The search query"},
                "top_k": {
                    "type": "integer",
                    "description": "Number of results (1-10)",
                    "default": 5,
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "get_vps_status",
        "description": "Get current VPS system metrics, Docker containers, and Ollama model status.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "list_projects",
        "description": "List the user's projects from the portfolio.",
        "input_schema": {
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "description": "Max number to return",
                    "default": 10,
                }
            },
            "required": [],
        },
    },
    {
        "name": "get_current_time",
        "description": "Get the current date and time.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
]

# ---------------------------------------------------------------------------
# Default system prompt
# ---------------------------------------------------------------------------

DEFAULT_AGENT_SYSTEM_PROMPT = (
    "You are an intelligent agent running inside rdtect OS. You have access to tools to search "
    "the user's knowledge base, monitor VPS infrastructure, and retrieve portfolio data. "
    "Use tools when they help answer the question. Be concise and factual."
)

# ---------------------------------------------------------------------------
# AgentEvent dataclass
# ---------------------------------------------------------------------------


@dataclass
class AgentEvent:
    type: str
    content: str
    tool_name: str | None = None


# ---------------------------------------------------------------------------
# AgentExecutorService
# ---------------------------------------------------------------------------


class AgentExecutorService:
    """
    Agentic execution service for rdtect OS.

    Implements Claude's tool-use loop:
        Claude thinks → calls tools → receives results → thinks again → repeats

    Streams AgentEvent objects as Claude works through a task. Callers can
    convert these to SSE events for real-time frontend updates.
    """

    def __init__(self) -> None:
        self.api_key: str = os.getenv("ANTHROPIC_API_KEY", "")
        self.cf_gateway_url: str = os.getenv("CF_AI_GATEWAY_URL", "")
        self.model: str = os.getenv("CLAUDE_AGENT_MODEL", "claude-sonnet-4-6")
        self.max_iterations: int = int(os.getenv("AGENT_MAX_ITERATIONS", "10"))

    # ------------------------------------------------------------------
    # Tool execution
    # ------------------------------------------------------------------

    async def _execute_tool(self, name: str, inputs: dict) -> str:
        """Route a tool call to the appropriate handler and return a string result."""
        if name == "search_knowledge_base":
            from src.services.rag import rag_service

            results = await rag_service.retrieve(
                inputs["query"], top_k=inputs.get("top_k", 5)
            )
            return json.dumps(results)

        if name == "get_vps_status":
            from src.services.vps_monitor import vps_monitor

            result = await vps_monitor.get_all()
            return json.dumps(result)

        if name == "list_projects":
            # Static placeholder — will be wired to PocketBase later
            projects = [
                {
                    "name": "rdtect OS",
                    "description": "Web-based agentic desktop environment",
                    "url": "https://rdtect.com",
                },
                {
                    "name": "dotfiles",
                    "description": "Personal dotfiles managed with GNU Stow",
                    "url": "https://github.com/rdtect/dotfiles",
                },
            ]
            limit = inputs.get("limit", 10)
            return json.dumps(projects[:limit])

        if name == "get_current_time":
            return datetime.now(timezone.utc).isoformat()

        return f"Unknown tool: {name}"

    # ------------------------------------------------------------------
    # Agentic loop
    # ------------------------------------------------------------------

    async def run(
        self, task: str, system: str | None = None
    ) -> AsyncIterator[AgentEvent]:
        """
        Execute an agentic task, yielding AgentEvent objects as work progresses.

        Runs up to ``self.max_iterations`` iterations of the Claude tool-use
        loop. Each iteration: call Claude → process content blocks → execute
        any tool calls → feed results back → repeat until stop_reason is
        ``end_turn`` or the iteration cap is reached.

        Args:
            task:   The user task or question for the agent.
            system: Optional system prompt override.

        Yields:
            AgentEvent instances with type, content, and optional tool_name.
        """
        effective_system = system if system is not None else DEFAULT_AGENT_SYSTEM_PROMPT
        messages: list[dict] = [{"role": "user", "content": task}]

        kwargs: dict = {}
        if self.cf_gateway_url:
            kwargs["base_url"] = self.cf_gateway_url

        try:
            async with anthropic.AsyncAnthropic(
                api_key=self.api_key, **kwargs
            ) as client:
                for _ in range(self.max_iterations):
                    response = await client.messages.create(
                        model=self.model,
                        max_tokens=4096,
                        system=effective_system,
                        tools=AGENT_TOOLS,
                        messages=messages,
                    )

                    # Collect tool results in this pass so we can build the
                    # user follow-up message after processing all content blocks.
                    tool_results: list[dict] = []

                    for block in response.content:
                        if block.type == "text":
                            yield AgentEvent(EVENT_TEXT, block.text)

                        elif block.type == "tool_use":
                            yield AgentEvent(
                                EVENT_TOOL_CALL,
                                json.dumps({"name": block.name, "inputs": block.input}),
                                tool_name=block.name,
                            )

                            result = await self._execute_tool(block.name, block.input)

                            yield AgentEvent(EVENT_TOOL_RESULT, result, tool_name=block.name)

                            tool_results.append(
                                {
                                    "type": "tool_result",
                                    "tool_use_id": block.id,
                                    "content": result,
                                }
                            )

                    # Append assistant turn to message history
                    messages.append({"role": "assistant", "content": response.content})

                    if response.stop_reason == "end_turn":
                        break

                    if response.stop_reason == "tool_use" and tool_results:
                        messages.append({"role": "user", "content": tool_results})

            yield AgentEvent(EVENT_DONE, "Agent completed")

        except Exception as e:
            _logger.error("agent run failed: %s", e, exc_info=True)
            yield AgentEvent(EVENT_ERROR, f"{type(e).__name__}: agent failed")


# ---------------------------------------------------------------------------
# Module-level singleton — import and use directly:
#   from src.services.agent_executor import agent_executor
# ---------------------------------------------------------------------------

agent_executor = AgentExecutorService()
