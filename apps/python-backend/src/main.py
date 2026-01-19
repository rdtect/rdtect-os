from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat, vfs, pocketbase

app = FastAPI(
    title="rdtect OS Backend",
    description="Backend services for rdtect OS - AI chat, VFS, and agents",
    version="0.2.0"
)

# CORS for development (allow all origins)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(vfs.router, prefix="/api/vfs", tags=["vfs"])
app.include_router(pocketbase.router, prefix="/api/pb", tags=["pocketbase"])

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok", "service": "rdtect-os-backend"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "rdtect OS AI Backend", "docs": "/docs"}
