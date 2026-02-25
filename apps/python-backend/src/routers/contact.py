import logging
import os

import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
_logger = logging.getLogger(__name__)
_limiter = Limiter(key_func=get_remote_address)


class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str


@router.post("/")
@_limiter.limit("3/hour")
async def submit_contact(http_request: Request, body: ContactRequest) -> dict:
    pb_url = os.getenv("PUBLIC_POCKETBASE_URL", "https://pb.rdtect.com")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{pb_url}/api/collections/contact_messages/records",
                json=body.model_dump(),
            )
            resp.raise_for_status()
        return {"success": True}
    except Exception as e:
        _logger.error("Contact submission failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to submit contact form")
