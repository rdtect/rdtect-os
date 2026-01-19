import os
from typing import AsyncGenerator
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

class AIService:
    """AI service using OpenAI API"""

    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=os.getenv("OPENAI_API_KEY", "")
        )
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.system_prompt = """You are a helpful AI assistant running inside rdtect OS,
a web-based desktop environment. Be concise and helpful. You can help with:
- Coding questions
- General knowledge
- Creative tasks
- Problem solving
Keep responses focused and actionable."""

    async def stream_response(self, prompt: str) -> AsyncGenerator[str, None]:
        """Stream AI response token by token"""

        # Check if API key is configured
        if not os.getenv("OPENAI_API_KEY"):
            yield "⚠️ OpenAI API key not configured. "
            yield "Set OPENAI_API_KEY in your environment. "
            yield "For now, here's an echo: " + prompt
            return

        try:
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": prompt}
                ],
                stream=True,
                max_tokens=1024,
                temperature=0.7
            )

            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

        except Exception as e:
            yield f"Error: {str(e)}"

    async def get_response(self, prompt: str) -> str:
        """Get complete AI response (non-streaming)"""
        response = ""
        async for chunk in self.stream_response(prompt):
            response += chunk
        return response
