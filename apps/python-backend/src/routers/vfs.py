"""
Virtual File System API

REST API for persistent file storage backed by SQLite.
Syncs with the client-side IndexedDB VFS.
"""

from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
import sqlite3
import json
import os
import base64

router = APIRouter()

# Database setup
DB_PATH = os.environ.get("VFS_DB_PATH", "./data/vfs.db")

def get_db():
    """Get database connection"""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database schema"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS files (
            path TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            size INTEGER DEFAULT 0,
            mime_type TEXT,
            mode INTEGER DEFAULT 420,
            uid TEXT DEFAULT 'user',
            gid TEXT DEFAULT 'users',
            content BLOB,
            created_at TEXT NOT NULL,
            modified_at TEXT NOT NULL,
            accessed_at TEXT NOT NULL,
            xattr TEXT
        )
    """)

    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_parent ON files(
            substr(path, 1, length(path) - length(name) - 1)
        )
    """)

    conn.commit()
    conn.close()

# Initialize on module load
init_db()

# Pydantic models
class FileStat(BaseModel):
    name: str
    path: str
    type: str
    size: int
    mimeType: Optional[str] = None
    mode: int = 0o644
    uid: str = "user"
    gid: str = "users"
    createdAt: datetime
    modifiedAt: datetime
    accessedAt: datetime
    xattr: Optional[dict] = None

class FileEntry(FileStat):
    content: Optional[str] = None  # Base64 encoded
    children: Optional[List[str]] = None
    target: Optional[str] = None

class WriteFileRequest(BaseModel):
    content: str  # Base64 encoded or plain text
    encoding: str = "base64"  # "base64" or "text"
    mimeType: Optional[str] = None

class MkdirRequest(BaseModel):
    recursive: bool = False

class CopyMoveRequest(BaseModel):
    dest: str

class ChmodRequest(BaseModel):
    mode: int

class ChownRequest(BaseModel):
    uid: str
    gid: Optional[str] = None

class SyncRequest(BaseModel):
    """Batch sync from client"""
    files: List[FileEntry]

def get_parent_path(path: str) -> str:
    """Get parent directory path"""
    parts = path.rstrip('/').rsplit('/', 1)
    return parts[0] if len(parts) > 1 and parts[0] else '/'

def row_to_stat(row: sqlite3.Row) -> dict:
    """Convert database row to FileStat dict"""
    return {
        "name": row["name"],
        "path": row["path"],
        "type": row["type"],
        "size": row["size"],
        "mimeType": row["mime_type"],
        "mode": row["mode"],
        "uid": row["uid"],
        "gid": row["gid"],
        "createdAt": row["created_at"],
        "modifiedAt": row["modified_at"],
        "accessedAt": row["accessed_at"],
        "xattr": json.loads(row["xattr"]) if row["xattr"] else None
    }

# === API Endpoints ===

@router.get("/stat")
async def stat(path: str):
    """Get file stats"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM files WHERE path = ?", (path,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail=f"ENOENT: {path}")

    return row_to_stat(row)

@router.get("/exists")
async def exists(path: str):
    """Check if file exists"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM files WHERE path = ?", (path,))
    exists = cursor.fetchone() is not None
    conn.close()
    return {"exists": exists}

@router.get("/read")
async def read_file(path: str, encoding: str = "base64"):
    """Read file content"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM files WHERE path = ?", (path,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail=f"ENOENT: {path}")

    if row["type"] == "directory":
        raise HTTPException(status_code=400, detail=f"EISDIR: {path}")

    content = row["content"]
    if content is None:
        content = b""

    if encoding == "text":
        try:
            return {"content": content.decode("utf-8"), "encoding": "text"}
        except:
            return {"content": base64.b64encode(content).decode(), "encoding": "base64"}

    return {"content": base64.b64encode(content).decode(), "encoding": "base64"}

@router.put("/write")
async def write_file(path: str, request: WriteFileRequest):
    """Write file content"""
    conn = get_db()
    cursor = conn.cursor()

    # Decode content
    if request.encoding == "base64":
        content = base64.b64decode(request.content)
    else:
        content = request.content.encode("utf-8")

    # Check parent exists
    parent = get_parent_path(path)
    cursor.execute("SELECT type FROM files WHERE path = ?", (parent,))
    parent_row = cursor.fetchone()

    if not parent_row and parent != '/':
        conn.close()
        raise HTTPException(status_code=404, detail=f"ENOENT: parent {parent} does not exist")

    now = datetime.utcnow().isoformat()
    name = path.rsplit('/', 1)[-1]

    # Upsert file
    cursor.execute("""
        INSERT INTO files (path, name, type, size, mime_type, content, created_at, modified_at, accessed_at)
        VALUES (?, ?, 'file', ?, ?, ?, ?, ?, ?)
        ON CONFLICT(path) DO UPDATE SET
            size = excluded.size,
            mime_type = COALESCE(excluded.mime_type, mime_type),
            content = excluded.content,
            modified_at = excluded.modified_at,
            accessed_at = excluded.accessed_at
    """, (path, name, len(content), request.mimeType, content, now, now, now))

    conn.commit()
    conn.close()

    return {"success": True, "path": path, "size": len(content)}

@router.post("/mkdir")
async def mkdir(path: str, request: MkdirRequest = MkdirRequest()):
    """Create directory"""
    conn = get_db()
    cursor = conn.cursor()

    if request.recursive:
        parts = path.strip('/').split('/')
        current = ""
        for part in parts:
            current = f"{current}/{part}"
            cursor.execute("SELECT 1 FROM files WHERE path = ?", (current,))
            if not cursor.fetchone():
                now = datetime.utcnow().isoformat()
                cursor.execute("""
                    INSERT INTO files (path, name, type, created_at, modified_at, accessed_at)
                    VALUES (?, ?, 'directory', ?, ?, ?)
                """, (current, part, now, now, now))
    else:
        parent = get_parent_path(path)
        cursor.execute("SELECT type FROM files WHERE path = ?", (parent,))
        if not cursor.fetchone() and parent != '/':
            conn.close()
            raise HTTPException(status_code=404, detail=f"ENOENT: parent {parent}")

        cursor.execute("SELECT 1 FROM files WHERE path = ?", (path,))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=409, detail=f"EEXIST: {path}")

        now = datetime.utcnow().isoformat()
        name = path.rsplit('/', 1)[-1]
        cursor.execute("""
            INSERT INTO files (path, name, type, created_at, modified_at, accessed_at)
            VALUES (?, ?, 'directory', ?, ?, ?)
        """, (path, name, now, now, now))

    conn.commit()
    conn.close()

    return {"success": True, "path": path}

@router.get("/readdir")
async def readdir(path: str):
    """List directory contents"""
    conn = get_db()
    cursor = conn.cursor()

    # Check directory exists
    cursor.execute("SELECT type FROM files WHERE path = ?", (path,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"ENOENT: {path}")

    if row["type"] != "directory":
        conn.close()
        raise HTTPException(status_code=400, detail=f"ENOTDIR: {path}")

    # Get children (find all files where parent path matches)
    if path == '/':
        pattern = '/%'
        not_pattern = '/%/%'
    else:
        pattern = f'{path}/%'
        not_pattern = f'{path}/%/%'

    cursor.execute("""
        SELECT * FROM files
        WHERE path LIKE ? AND path NOT LIKE ?
    """, (pattern, not_pattern))

    children = [row_to_stat(row) for row in cursor.fetchall()]
    conn.close()

    return {"path": path, "children": children}

@router.delete("/rm")
async def rm(path: str):
    """Remove file"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT type FROM files WHERE path = ?", (path,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"ENOENT: {path}")

    if row["type"] == "directory":
        conn.close()
        raise HTTPException(status_code=400, detail=f"EISDIR: use rmdir for directories")

    cursor.execute("DELETE FROM files WHERE path = ?", (path,))
    conn.commit()
    conn.close()

    return {"success": True, "path": path}

@router.delete("/rmdir")
async def rmdir(path: str, recursive: bool = False):
    """Remove directory"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT type FROM files WHERE path = ?", (path,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"ENOENT: {path}")

    if row["type"] != "directory":
        conn.close()
        raise HTTPException(status_code=400, detail=f"ENOTDIR: {path}")

    # Check if directory has children
    pattern = f'{path}/%' if path != '/' else '/%'
    cursor.execute("SELECT COUNT(*) as count FROM files WHERE path LIKE ?", (pattern,))
    count = cursor.fetchone()["count"]

    if count > 0 and not recursive:
        conn.close()
        raise HTTPException(status_code=400, detail=f"ENOTEMPTY: {path}")

    if recursive:
        cursor.execute("DELETE FROM files WHERE path LIKE ? OR path = ?", (pattern, path))
    else:
        cursor.execute("DELETE FROM files WHERE path = ?", (path,))

    conn.commit()
    conn.close()

    return {"success": True, "path": path}

@router.post("/cp")
async def copy_file(path: str, request: CopyMoveRequest):
    """Copy file or directory"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM files WHERE path = ?", (path,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"ENOENT: {path}")

    now = datetime.utcnow().isoformat()
    dest_name = request.dest.rsplit('/', 1)[-1]

    # Copy file
    cursor.execute("""
        INSERT INTO files (path, name, type, size, mime_type, mode, uid, gid, content, created_at, modified_at, accessed_at, xattr)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        request.dest, dest_name, row["type"], row["size"], row["mime_type"],
        row["mode"], row["uid"], row["gid"], row["content"],
        now, now, now, row["xattr"]
    ))

    # If directory, copy children recursively
    if row["type"] == "directory":
        pattern = f'{path}/%'
        cursor.execute("SELECT * FROM files WHERE path LIKE ?", (pattern,))
        children = cursor.fetchall()

        for child in children:
            child_dest = request.dest + child["path"][len(path):]
            child_name = child_dest.rsplit('/', 1)[-1]
            cursor.execute("""
                INSERT INTO files (path, name, type, size, mime_type, mode, uid, gid, content, created_at, modified_at, accessed_at, xattr)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                child_dest, child_name, child["type"], child["size"], child["mime_type"],
                child["mode"], child["uid"], child["gid"], child["content"],
                now, now, now, child["xattr"]
            ))

    conn.commit()
    conn.close()

    return {"success": True, "src": path, "dest": request.dest}

@router.post("/mv")
async def move_file(path: str, request: CopyMoveRequest):
    """Move/rename file or directory"""
    # Copy then delete
    await copy_file(path, request)

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT type FROM files WHERE path = ?", (path,))
    row = cursor.fetchone()

    if row["type"] == "directory":
        pattern = f'{path}/%'
        cursor.execute("DELETE FROM files WHERE path LIKE ? OR path = ?", (pattern, path))
    else:
        cursor.execute("DELETE FROM files WHERE path = ?", (path,))

    conn.commit()
    conn.close()

    return {"success": True, "src": path, "dest": request.dest}

@router.put("/chmod")
async def chmod(path: str, request: ChmodRequest):
    """Change file permissions"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("UPDATE files SET mode = ?, modified_at = ? WHERE path = ?",
                   (request.mode, datetime.utcnow().isoformat(), path))

    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail=f"ENOENT: {path}")

    conn.commit()
    conn.close()

    return {"success": True, "path": path, "mode": request.mode}

@router.put("/chown")
async def chown(path: str, request: ChownRequest):
    """Change file ownership"""
    conn = get_db()
    cursor = conn.cursor()

    if request.gid:
        cursor.execute("UPDATE files SET uid = ?, gid = ?, modified_at = ? WHERE path = ?",
                       (request.uid, request.gid, datetime.utcnow().isoformat(), path))
    else:
        cursor.execute("UPDATE files SET uid = ?, modified_at = ? WHERE path = ?",
                       (request.uid, datetime.utcnow().isoformat(), path))

    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail=f"ENOENT: {path}")

    conn.commit()
    conn.close()

    return {"success": True, "path": path, "uid": request.uid, "gid": request.gid}

@router.post("/sync")
async def sync_from_client(request: SyncRequest):
    """Batch sync files from client IndexedDB"""
    conn = get_db()
    cursor = conn.cursor()

    synced = 0
    for file in request.files:
        content = None
        if file.content:
            try:
                content = base64.b64decode(file.content)
            except:
                content = file.content.encode('utf-8')

        xattr = json.dumps(file.xattr) if file.xattr else None

        cursor.execute("""
            INSERT INTO files (path, name, type, size, mime_type, mode, uid, gid, content, created_at, modified_at, accessed_at, xattr)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(path) DO UPDATE SET
                name = excluded.name,
                type = excluded.type,
                size = excluded.size,
                mime_type = excluded.mime_type,
                mode = excluded.mode,
                uid = excluded.uid,
                gid = excluded.gid,
                content = excluded.content,
                modified_at = excluded.modified_at,
                xattr = excluded.xattr
        """, (
            file.path, file.name, file.type, file.size, file.mimeType,
            file.mode, file.uid, file.gid, content,
            file.createdAt.isoformat(), file.modifiedAt.isoformat(), file.accessedAt.isoformat(),
            xattr
        ))
        synced += 1

    conn.commit()
    conn.close()

    return {"success": True, "synced": synced}

@router.get("/dump")
async def dump_all():
    """Dump all files (for debugging/sync)"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM files ORDER BY path")

    files = []
    for row in cursor.fetchall():
        stat = row_to_stat(row)
        if row["content"]:
            stat["content"] = base64.b64encode(row["content"]).decode()
        files.append(stat)

    conn.close()
    return {"files": files}
