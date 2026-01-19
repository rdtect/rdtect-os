from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.ai import AIService
import json

router = APIRouter()
ai_service = AIService()

class ConnectionManager:
    """Manages WebSocket connections"""

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"Client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        print(f"Client disconnected. Total connections: {len(self.active_connections)}")

    async def send_text(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def send_json(self, data: dict, websocket: WebSocket):
        await websocket.send_json(data)

manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for AI chat with streaming"""
    await manager.connect(websocket)

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            user_message = message_data.get("message", "")

            # Send acknowledgment
            await manager.send_json({
                "type": "start",
                "message": "Generating response..."
            }, websocket)

            # Stream AI response
            full_response = ""
            async for chunk in ai_service.stream_response(user_message):
                full_response += chunk
                await manager.send_json({
                    "type": "chunk",
                    "content": chunk
                }, websocket)

            # Send completion
            await manager.send_json({
                "type": "done"
            }, websocket)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        await manager.send_json({
            "type": "error",
            "message": str(e)
        }, websocket)
        manager.disconnect(websocket)

@router.get("/")
async def chat_info():
    """Chat endpoint info"""
    return {
        "endpoint": "/api/chat/ws",
        "type": "websocket",
        "description": "Connect via WebSocket for AI chat"
    }
