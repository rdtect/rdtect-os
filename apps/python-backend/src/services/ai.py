import json
import logging
import os
from collections.abc import AsyncIterator

import anthropic
import httpx

_logger = logging.getLogger(__name__)

DEFAULT_SYSTEM_PROMPT = (
    "You are an AI assistant embedded in rdtect OS — a web-based agentic desktop environment "
    "built with SvelteKit 5, PocketBase, and Cloudflare. You run at rdtect.com as both a "
    "creative portfolio and a working developer workspace. You have access to the user's "
    "knowledge base (Obsidian vault), can monitor VPS infrastructure, and can execute agentic "
    "tasks. Be precise, technically rigorous, and concise. Prefer code over prose when "
    "answering technical questions."
)

_CF_WORKERS_AI_RUN_URL = (
    "https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run"
    "/@cf/meta/llama-3.1-8b-instruct"
)


class AIService:
    """
    Multi-model AI service for rdtect OS.

    Routing priority:
        1. Claude via Cloudflare AI Gateway (if ANTHROPIC_API_KEY + CF_AI_GATEWAY_URL)
        2. Claude direct Anthropic API (if ANTHROPIC_API_KEY, no gateway URL)
        3. Cloudflare Workers AI llama-3.1-8b (if CF_WORKERS_AI_API_KEY + CF_ACCOUNT_ID)
        4. Warning message — no keys configured

    All streaming is done via AsyncIterator[str].  Callers must use
    ``async for token in service.stream_chat(...):`` to consume the stream.
    """

    def __init__(self) -> None:
        self.anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")
        self.cf_ai_gateway_url: str = os.getenv("CF_AI_GATEWAY_URL", "")
        self.cf_workers_ai_api_key: str = os.getenv("CF_WORKERS_AI_API_KEY", "")
        self.cf_account_id: str = os.getenv("CF_ACCOUNT_ID", "")
        self.chat_model: str = os.getenv("CLAUDE_CHAT_MODEL", "claude-haiku-4-5-20251001")
        self.agent_model: str = os.getenv("CLAUDE_AGENT_MODEL", "claude-sonnet-4-6")

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _to_anthropic_messages(messages: list[dict]) -> list[dict]:
        """
        Pass through OpenAI-format messages unchanged.

        Anthropic's messages API accepts the same ``role``/``content`` shape
        (``user`` / ``assistant``).  System messages must be passed separately
        via the ``system`` parameter, so callers should strip them from the list
        before calling this — ``stream_chat`` handles that automatically.
        """
        return [{"role": m["role"], "content": m["content"]} for m in messages]

    # ------------------------------------------------------------------
    # Claude streaming
    # ------------------------------------------------------------------

    async def _stream_claude(
        self,
        messages: list[dict],
        system: str,
        model: str,
    ) -> AsyncIterator[str]:
        """Stream tokens from Claude (direct API or via CF AI Gateway)."""
        kwargs: dict = {}
        if self.cf_ai_gateway_url:
            kwargs["base_url"] = self.cf_ai_gateway_url

        # Separate out any system messages embedded in the list
        non_system = [m for m in messages if m.get("role") != "system"]

        # Merge any system content prepended as a message into the system param
        embedded_system = " ".join(
            m["content"] for m in messages if m.get("role") == "system"
        )
        effective_system = (embedded_system + "\n\n" + system).strip() if embedded_system else system

        anthropic_messages = self._to_anthropic_messages(non_system)

        async with anthropic.AsyncAnthropic(api_key=self.anthropic_api_key, **kwargs) as client:
            async with client.messages.stream(
                model=model,
                max_tokens=2048,
                system=effective_system,
                messages=anthropic_messages,
            ) as stream:
                async for text in stream.text_stream:
                    yield text

    # ------------------------------------------------------------------
    # CF Workers AI fallback streaming
    # ------------------------------------------------------------------

    async def _stream_workers_ai(
        self,
        messages: list[dict],
        system: str,
    ) -> AsyncIterator[str]:
        """
        Stream tokens from Cloudflare Workers AI (llama-3.1-8b-instruct).

        The Workers AI REST API returns newline-delimited ``data:`` SSE events.
        Each event is either ``data: {"response":"<token>"}`` or the terminal
        ``data: [DONE]``.
        """
        url = _CF_WORKERS_AI_RUN_URL.format(account_id=self.cf_account_id)

        # Build the payload with an injected system message
        payload_messages = [{"role": "system", "content": system}]
        payload_messages.extend(
            {"role": m["role"], "content": m["content"]}
            for m in messages
            if m.get("role") != "system"
        )

        headers = {
            "Authorization": f"Bearer {self.cf_workers_ai_api_key}",
            "Content-Type": "application/json",
        }
        body = {"messages": payload_messages, "stream": True}

        async with httpx.AsyncClient(timeout=60.0) as http:
            async with http.stream("POST", url, headers=headers, json=body) as response:
                async for line in response.aiter_lines():
                    line = line.strip()
                    if not line or not line.startswith("data:"):
                        continue
                    data = line[len("data:"):].strip()
                    if data == "[DONE]":
                        return
                    try:
                        event = json.loads(data)
                        token = event.get("response", "")
                        if token:
                            yield token
                    except json.JSONDecodeError:
                        continue

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def stream_chat(
        self,
        messages: list[dict],
        system: str | None = None,
        model: str | None = None,
    ) -> AsyncIterator[str]:
        """
        Stream a chat completion, routing to the best available provider.

        Args:
            messages: OpenAI-format message list, e.g.
                      ``[{"role": "user", "content": "Hello"}]``
            system:   System prompt override.  Defaults to DEFAULT_SYSTEM_PROMPT.
            model:    Model override.  Defaults to ``self.chat_model``.

        Yields:
            Text tokens as they arrive from the model.

        Note:
            Exceptions are caught internally; an error token is yielded instead
            of re-raising so that SSE callers always receive a well-formed stream.
        """
        effective_system = system if system is not None else DEFAULT_SYSTEM_PROMPT
        effective_model = model if model is not None else self.chat_model

        try:
            if self.anthropic_api_key:
                async for token in self._stream_claude(messages, effective_system, effective_model):
                    yield token

            elif self.cf_workers_ai_api_key and self.cf_account_id:
                async for token in self._stream_workers_ai(messages, effective_system):
                    yield token

            else:
                yield (
                    "[WARNING] No AI provider configured. "
                    "Set ANTHROPIC_API_KEY (recommended) or "
                    "CF_WORKERS_AI_API_KEY + CF_ACCOUNT_ID in your environment."
                )

        except Exception as e:
            _logger.error("stream_chat failed: %s", e, exc_info=True)
            yield f"[ERROR] {type(e).__name__}: request failed"

    async def get_response(
        self,
        messages: list[dict],
        system: str | None = None,
    ) -> str:
        """
        Non-streaming convenience wrapper around ``stream_chat``.

        Accumulates all tokens and returns the complete response as a string.
        Useful for server-side agentic tasks that do not need SSE.
        """
        tokens: list[str] = []
        async for token in self.stream_chat(messages, system=system):
            tokens.append(token)
        return "".join(tokens)


# Module-level singleton — import and use directly:
#   from src.services.ai import ai_service
ai_service = AIService()
