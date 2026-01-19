"""
PocketBase Proxy/Helper Router

Provides server-side helper endpoints for PocketBase operations:
- Health checks
- Admin operations
- File upload preprocessing
- Batch operations
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
import httpx
import os
import hashlib
from datetime import datetime

router = APIRouter()

# Configuration
POCKETBASE_URL = os.getenv("POCKETBASE_URL", "http://localhost:8090")
POCKETBASE_ADMIN_EMAIL = os.getenv("POCKETBASE_ADMIN_EMAIL", "")
POCKETBASE_ADMIN_PASSWORD = os.getenv("POCKETBASE_ADMIN_PASSWORD", "")


# ============================================
# Pydantic Models
# ============================================

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    pocketbase_url: str
    pocketbase_status: str
    timestamp: str


class ContactMessageCreate(BaseModel):
    """Contact message submission"""
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=5000)


class ContactMessageResponse(BaseModel):
    """Contact message response"""
    id: str
    name: str
    email: str
    subject: str
    message: str
    status: str
    created: str


class FileMetadataCreate(BaseModel):
    """File metadata for VFS sync"""
    path: str = Field(..., min_length=1, max_length=1000)
    name: str = Field(..., min_length=1, max_length=255)
    mime_type: Optional[str] = None
    size: Optional[int] = None
    is_directory: bool = False
    parent_path: Optional[str] = None
    checksum: Optional[str] = None


class BatchFileMetadata(BaseModel):
    """Batch file metadata upload"""
    files: List[FileMetadataCreate]


class AppSettingsUpdate(BaseModel):
    """App settings update"""
    app_id: str = Field(..., pattern=r"^[a-z0-9\-\.]+$")
    settings: dict


# ============================================
# Helper Functions
# ============================================

async def get_pocketbase_client() -> httpx.AsyncClient:
    """Create an async HTTP client for PocketBase"""
    return httpx.AsyncClient(base_url=POCKETBASE_URL, timeout=30.0)


async def get_admin_token() -> Optional[str]:
    """Get admin authentication token"""
    if not POCKETBASE_ADMIN_EMAIL or not POCKETBASE_ADMIN_PASSWORD:
        return None

    async with await get_pocketbase_client() as client:
        try:
            response = await client.post(
                "/api/admins/auth-with-password",
                json={
                    "identity": POCKETBASE_ADMIN_EMAIL,
                    "password": POCKETBASE_ADMIN_PASSWORD
                }
            )
            if response.status_code == 200:
                return response.json().get("token")
        except Exception:
            pass
    return None


def calculate_checksum(content: bytes) -> str:
    """Calculate SHA-256 checksum of content"""
    return hashlib.sha256(content).hexdigest()


# ============================================
# Endpoints
# ============================================

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Check PocketBase connectivity and health
    """
    pb_status = "unknown"

    try:
        async with await get_pocketbase_client() as client:
            response = await client.get("/api/health")
            if response.status_code == 200:
                pb_status = "healthy"
            else:
                pb_status = f"unhealthy ({response.status_code})"
    except httpx.ConnectError:
        pb_status = "unreachable"
    except Exception as e:
        pb_status = f"error: {str(e)}"

    return HealthResponse(
        status="ok",
        pocketbase_url=POCKETBASE_URL,
        pocketbase_status=pb_status,
        timestamp=datetime.utcnow().isoformat()
    )


@router.get("/collections")
async def list_collections():
    """
    List available PocketBase collections (public info only)
    """
    return {
        "collections": [
            {
                "name": "users",
                "type": "auth",
                "description": "User profiles with authentication"
            },
            {
                "name": "projects",
                "type": "base",
                "description": "Portfolio projects"
            },
            {
                "name": "blog_posts",
                "type": "base",
                "description": "Blog posts and articles"
            },
            {
                "name": "contact_messages",
                "type": "base",
                "description": "Contact form submissions"
            },
            {
                "name": "app_settings",
                "type": "base",
                "description": "Per-user application settings"
            },
            {
                "name": "files_metadata",
                "type": "base",
                "description": "VFS file metadata for sync"
            }
        ]
    }


@router.post("/contact", response_model=ContactMessageResponse)
async def submit_contact_message(message: ContactMessageCreate):
    """
    Submit a contact form message (public endpoint, no auth required)
    """
    async with await get_pocketbase_client() as client:
        try:
            response = await client.post(
                "/api/collections/contact_messages/records",
                json={
                    "name": message.name,
                    "email": message.email,
                    "subject": message.subject,
                    "message": message.message,
                    "status": "new"
                }
            )

            if response.status_code == 200:
                data = response.json()
                return ContactMessageResponse(
                    id=data["id"],
                    name=data["name"],
                    email=data["email"],
                    subject=data["subject"],
                    message=data["message"],
                    status=data["status"],
                    created=data["created"]
                )
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.json().get("message", "Failed to submit message")
                )
        except httpx.ConnectError:
            raise HTTPException(
                status_code=503,
                detail="PocketBase service unavailable"
            )


@router.post("/files/batch-metadata")
async def batch_create_file_metadata(
    batch: BatchFileMetadata,
    authorization: str = None
):
    """
    Batch create file metadata records for VFS sync.
    Requires authentication token in Authorization header.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")

    async with await get_pocketbase_client() as client:
        headers = {"Authorization": authorization}
        results = []
        errors = []

        for file_meta in batch.files:
            try:
                response = await client.post(
                    "/api/collections/files_metadata/records",
                    json={
                        "path": file_meta.path,
                        "name": file_meta.name,
                        "mime_type": file_meta.mime_type,
                        "size": file_meta.size,
                        "is_directory": file_meta.is_directory,
                        "parent_path": file_meta.parent_path,
                        "checksum": file_meta.checksum,
                        "synced_at": datetime.utcnow().isoformat()
                    },
                    headers=headers
                )

                if response.status_code == 200:
                    results.append({
                        "path": file_meta.path,
                        "status": "created",
                        "id": response.json().get("id")
                    })
                else:
                    errors.append({
                        "path": file_meta.path,
                        "status": "error",
                        "error": response.json().get("message", "Unknown error")
                    })
            except Exception as e:
                errors.append({
                    "path": file_meta.path,
                    "status": "error",
                    "error": str(e)
                })

        return {
            "total": len(batch.files),
            "created": len(results),
            "failed": len(errors),
            "results": results,
            "errors": errors
        }


@router.post("/files/calculate-checksum")
async def calculate_file_checksum(file: UploadFile = File(...)):
    """
    Calculate checksum for uploaded file without storing it.
    Useful for checking if a file needs to be synced.
    """
    content = await file.read()
    checksum = calculate_checksum(content)

    return {
        "filename": file.filename,
        "size": len(content),
        "checksum": checksum,
        "content_type": file.content_type
    }


@router.get("/settings/{app_id}")
async def get_app_settings(app_id: str, authorization: str = None):
    """
    Get settings for a specific app.
    Requires authentication.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")

    async with await get_pocketbase_client() as client:
        headers = {"Authorization": authorization}

        try:
            # Get current user from token
            auth_response = await client.get(
                "/api/collections/users/auth-refresh",
                headers=headers
            )

            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid token")

            user_id = auth_response.json().get("record", {}).get("id")

            # Get settings for this user and app
            response = await client.get(
                "/api/collections/app_settings/records",
                params={
                    "filter": f'user = "{user_id}" && app_id = "{app_id}"'
                },
                headers=headers
            )

            if response.status_code == 200:
                items = response.json().get("items", [])
                if items:
                    return items[0]
                return {"app_id": app_id, "settings": {}}
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Failed to fetch settings"
                )
        except httpx.ConnectError:
            raise HTTPException(
                status_code=503,
                detail="PocketBase service unavailable"
            )


@router.put("/settings/{app_id}")
async def update_app_settings(
    app_id: str,
    settings: AppSettingsUpdate,
    authorization: str = None
):
    """
    Update or create settings for a specific app.
    Requires authentication.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")

    if settings.app_id != app_id:
        raise HTTPException(status_code=400, detail="App ID mismatch")

    async with await get_pocketbase_client() as client:
        headers = {"Authorization": authorization}

        try:
            # Get current user from token
            auth_response = await client.get(
                "/api/collections/users/auth-refresh",
                headers=headers
            )

            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid token")

            user_id = auth_response.json().get("record", {}).get("id")

            # Check if settings exist
            existing = await client.get(
                "/api/collections/app_settings/records",
                params={
                    "filter": f'user = "{user_id}" && app_id = "{app_id}"'
                },
                headers=headers
            )

            existing_items = existing.json().get("items", []) if existing.status_code == 200 else []

            if existing_items:
                # Update existing
                record_id = existing_items[0]["id"]
                response = await client.patch(
                    f"/api/collections/app_settings/records/{record_id}",
                    json={"settings": settings.settings},
                    headers=headers
                )
            else:
                # Create new
                response = await client.post(
                    "/api/collections/app_settings/records",
                    json={
                        "user": user_id,
                        "app_id": app_id,
                        "settings": settings.settings
                    },
                    headers=headers
                )

            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.json().get("message", "Failed to update settings")
                )
        except httpx.ConnectError:
            raise HTTPException(
                status_code=503,
                detail="PocketBase service unavailable"
            )


@router.get("/")
async def pocketbase_info():
    """PocketBase proxy endpoint info"""
    return {
        "service": "pocketbase-proxy",
        "pocketbase_url": POCKETBASE_URL,
        "endpoints": {
            "health": "/api/pb/health",
            "collections": "/api/pb/collections",
            "contact": "/api/pb/contact (POST)",
            "settings": "/api/pb/settings/{app_id}",
            "files": {
                "batch_metadata": "/api/pb/files/batch-metadata (POST)",
                "checksum": "/api/pb/files/calculate-checksum (POST)"
            }
        },
        "note": "For direct PocketBase access, use the PocketBase SDK on the frontend"
    }
