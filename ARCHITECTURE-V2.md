# rdtect OS -- Complete System Architecture (V2)

> Designed for: Anthropic Solutions Architect Director application
> Author: rdtect
> Date: 2026-02-25
> Status: PROPOSED -- awaiting implementation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Service Topology](#2-service-topology)
3. [API Contract (api.rdtect.com)](#3-api-contract)
4. [PocketBase Schema](#4-pocketbase-schema)
5. [Plugin Responsibility Matrix](#5-plugin-responsibility-matrix)
6. [Data Flow Diagrams](#6-data-flow-diagrams)
7. [Frontend Architecture Decisions](#7-frontend-architecture-decisions)
   - [ADR-F07: Error & Degradation Strategy](#adr-f07-error--degradation-strategy)
   - [ADR-F08: Anonymous User Cost Controls](#adr-f08-anonymous-user-cost-controls)
   - [ADR-F09: Mobile / Responsive Strategy](#adr-f09-mobile--responsive-strategy)
   - [ADR-F10: Testing Strategy](#adr-f10-testing-strategy)
8. [The Showcase Angle](#8-the-showcase-angle)
9. [Implementation Phases](#9-implementation-phases)

---

## 1. Executive Summary

rdtect OS is a web-based desktop environment that serves three simultaneous purposes:

1. **Creative portfolio** -- Visitors explore projects, blog posts, and an "About Me" experience by interacting with a desktop OS, not a static page. The portfolio IS the artifact.
2. **Working workspace** -- Authenticated users get a real productivity environment: AI chat (RAG-powered), knowledge base, terminal, file system.
3. **Mission-control dashboard** -- The System Monitor and Agent Manager plugins become a live observatory into the VPS infrastructure (Ollama, n8n, ChromaDB, PocketBase).

### Architectural Thesis

The system is a **thin client** (Svelte 5 SPA with IndexedDB-backed VFS) that talks to a **smart API gateway** (Python FastAPI at `api.rdtect.com`) which orchestrates existing VPS services. The frontend never talks to Ollama, ChromaDB, or n8n directly. The API gateway owns all server-side state, secrets, and orchestration.

```
Browser (rdtect.com)          VPS (api.rdtect.com)
+-----------------------+     +----------------------------------+
| SvelteKit SSR/SPA     |     | FastAPI Gateway                  |
| +---------+           |     |   +----------+                   |
| | Plugins |           |---->|   | Routers  |                   |
| +---------+           |     |   +----+-----+                   |
| | Shell   |           |     |        |                         |
| +---------+           |     |   +----v-----------+             |
| | Core    |           |     |   | Service Layer  |             |
| |  VFS    |           |     |   |  ai_service    +---> Ollama  |
| |  Agents |           |     |   |  rag_service   +---> ChromaDB|
| |  Events |           |     |   |  content_svc   +---> PB      |
| +---------+           |     |   |  vps_monitor   +---> n8n     |
+-----------------------+     |   +----------------+             |
                              +----------------------------------+
```

### What Stays (Current Strengths)

- Three-layer architecture (Core -> Shell -> Plugins) -- clean, fractal, deletable
- Svelte 5 runes-only reactive classes as singletons
- VFS with `/proc` and `/dev` virtual filesystems -- genuine Unix thinking
- Plugin discovery via `import.meta.glob` -- zero-registration
- EventBus (typed system events) + MessageBus (inter-plugin IPC) -- two distinct concerns
- Agent runtime with capability-based permissions and tool definitions
- PocketBase typed client with real-time subscriptions

### What Already Exists (More Than Expected)

The Python backend (`apps/python-backend/`) is further along than a minimal proxy. The following are **already implemented and functional**:

- **AI service** (`services/ai.py`) -- Anthropic Claude SDK with 3-tier fallback: Claude via Cloudflare AI Gateway → Claude direct → CF Workers AI (Llama 3.1 8B)
- **RAG service** (`services/rag.py`) -- ChromaDB client with `retrieve()` and `build_context()`, L2 distance filtering, graceful degradation
- **Agent executor** (`services/agent_executor.py`) -- Full Claude tool-use agentic loop with 4 tools, SSE streaming, configurable max iterations
- **VPS monitor** (`services/vps_monitor.py`) -- psutil system metrics + Docker container stats + Ollama model listing, all with graceful degradation
- **4 mounted routers** -- `/api/chat` (SSE streaming with RAG), `/api/knowledge` (search + context), `/api/vps` (system/containers/ollama), `/api/agents` (agentic execution)
- **2 unmounted routers** (implemented but dead code) -- `routers/vfs.py` (14 POSIX-like endpoints over SQLite), `routers/pocketbase.py` (8 proxy endpoints)

### What Actually Needs to Change

- **Frontend AI path is wrong** -- ai-chat plugin hits SvelteKit `/api/ai/stream` which proxies to OpenAI. Needs to switch to the Python gateway (which already uses Claude)
- **Unmounted routers need activation** -- VFS and PocketBase routers exist but aren't registered in `main.py`, and CORS only allows GET/POST (VFS needs PUT/DELETE)
- **Chat session persistence** -- No conversation history; add PocketBase collections + gateway endpoints
- **Content pipeline** -- No blog/project content endpoints; no Obsidian indexing pipeline
- **Plugin integration** -- Most plugins are self-contained islands that don't use core systems (terminal has mock FS, knowledge-base is local-only, system-monitor is browser-only)
- **Agent runtime client-server bridge** -- `runAutonomousLoop` is a placeholder; needs to call `/api/agents/run`
- **VFS server sync** -- `vfs.sync()` logs "not implemented"
- **Docker import bug** -- `main.py` uses `from src.routers import ...` but Dockerfile flattens `src/` into `/app/`, breaking imports in container

---

## 2. Service Topology

### Physical Deployment

```
+----------------------------------------------------------+
|  VPS (Coolify-managed, single Hetzner box)               |
|                                                          |
|  +------------------+  +-----------------------------+   |
|  | rdtect.com       |  | api.rdtect.com              |   |
|  | SvelteKit        |  | FastAPI Gateway              |   |
|  | (Node adapter)   |  |                             |   |
|  | Port: 3000       |  | Port: 8000                  |   |
|  +------------------+  +-----------------------------+   |
|                                                          |
|  +------------------+  +-----------------------------+   |
|  | pb.rdtect.com    |  | ai.rdtect.com               |   |
|  | PocketBase       |  | Open WebUI                  |   |
|  | Port: 8090       |  | (human interface to Ollama) |   |
|  +------------------+  +-----------------------------+   |
|                                                          |
|  +------------------+  +-----------------------------+   |
|  | Ollama           |  | n8n                          |   |
|  | (internal only)  |  | (internal + webhooks)       |   |
|  | Port: 11434      |  | Port: 5678                  |   |
|  +------------------+  +-----------------------------+   |
|                                                          |
|  +------------------+                                    |
|  | ChromaDB         |                                    |
|  | Port: 8000       |                                    |
|  | (chroma.rdtect)  |                                    |
|  +------------------+                                    |
+----------------------------------------------------------+
```

### Data Ownership

| Service | Owns | Accessed By |
|---------|------|-------------|
| **PocketBase** | Users, projects, blog_posts, contact_messages, app_settings, files_metadata, chat_sessions, chat_messages, agent_configs | Frontend (SDK), API gateway (httpx) |
| **ChromaDB** | Obsidian vault embeddings, blog post embeddings, project description embeddings | API gateway only |
| **Ollama** | Model weights (qwen2.5:7b, llama3.1:8b) | API gateway only |
| **API Gateway** | VFS SQLite (server-side sync), RAG orchestration state, WebSocket connections | Frontend (HTTP/WS) |
| **IndexedDB** | Client-side VFS (files, dirs), window state, config cache | Browser only |
| **n8n** | Workflow definitions, automation state | API gateway (webhook triggers) |

### Network Rules

```
Frontend (rdtect.com)
  --> api.rdtect.com    (HTTP REST + WebSocket, public)
  --> pb.rdtect.com     (PocketBase SDK, public, auth-gated)

API Gateway (api.rdtect.com)
  --> pocketbase:8090   (internal Docker network)
  --> ollama:11434      (internal Docker network)
  --> chromadb:8000     (internal Docker network)
  --> n8n:5678          (internal Docker network)

Nothing else is publicly accessible.
```

---

## 3. API Contract (api.rdtect.com)

The Python FastAPI gateway **extends the existing backend** (which already has 14 live endpoints across 4 routers, plus 22 additional endpoints in 2 unmounted routers). All endpoints use JSON. Authentication is via PocketBase token passed in `Authorization: Bearer <token>` header.

> **Auth enforcement**: The gateway validates PocketBase tokens by calling `POST /api/collections/users/auth-refresh` on the internal PocketBase instance. Tokens are stateless JWTs; the gateway does not maintain sessions. Expired tokens return 401; the frontend refreshes via the PocketBase SDK and retries. Anonymous access (no token) is allowed for Tier 1 plugin endpoints with stricter rate limits (see Section 7.7).

> **Existing provider chain**: The current `ai.py` service supports a 3-tier fallback: Claude via Cloudflare AI Gateway (logging + caching) -> Claude direct Anthropic API -> CF Workers AI (Llama 3.1 8B). This fallback chain is preserved. The CF Gateway tier is preferred in production because it provides request logging, response caching, and rate limiting at the edge for free.

### 3.1 Health and Meta

```
GET  /health
Response: { "status": "ok", "version": "1.0.0", "services": { "pocketbase": "healthy", "ollama": "healthy", "chromadb": "healthy", "n8n": "healthy" } }

GET  /
Response: { "name": "rdtect-os-api", "version": "1.0.0", "docs": "/docs" }
```

### 3.2 AI Chat (`/api/chat`)

Extends the existing `/api/chat/stream` endpoint. The current endpoint already streams Claude responses with RAG context injection. Changes: rename path for clarity, add session persistence, add model selection, unify SSE event format with the agent endpoint (Section 3.7).

> **SSE Event Format (unified across chat and agents)**: All streaming endpoints use the same event schema. This matches the existing `AgentEvent` types in `agent_executor.py`: `thinking`, `tool_call`, `tool_result`, `text`, `done`, `error`. The frontend parses one event vocabulary regardless of whether it's a chat response or agent execution.

```
POST /api/chat/completions
Headers: Authorization: Bearer <pb_token> (optional -- anonymous gets limited access)
Body: {
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "Tell me about this project" }
  ],
  "model": "claude-sonnet-4-20250514",   // or "local/qwen2.5:7b"
  "stream": true,
  "session_id": "sess_abc123",           // optional, for persistence
  "tools": ["rag_search", "vfs_read"],   // optional, enable tool use
  "rag_context": {                       // optional, for RAG
    "collections": ["obsidian", "blog"],
    "query": "MRAX architecture pattern"
  }
}
Response (stream=true): Server-Sent Events
  data: {"type":"start","session_id":"sess_abc123"}
  data: {"type":"text","content":"The MRAX..."}
  data: {"type":"tool_call","tool":"rag_search","input":{"query":"..."}}
  data: {"type":"tool_result","content":"...relevant chunks..."}
  data: {"type":"text","content":"...continuing..."}
  data: {"type":"done","usage":{"input_tokens":150,"output_tokens":342}}

Response (stream=false): {
  "content": "The MRAX pattern...",
  "model": "claude-sonnet-4-20250514",
  "usage": { "input_tokens": 150, "output_tokens": 342 },
  "session_id": "sess_abc123"
}

GET  /api/chat/sessions
Headers: Authorization: Bearer <pb_token>
Response: { "sessions": [{ "id": "sess_abc", "title": "MRAX Discussion", "updated_at": "...", "message_count": 12 }] }

GET  /api/chat/sessions/{session_id}
Headers: Authorization: Bearer <pb_token>
Response: { "id": "sess_abc", "messages": [...], "created_at": "...", "updated_at": "..." }

DELETE /api/chat/sessions/{session_id}
Headers: Authorization: Bearer <pb_token>

GET  /api/chat/models
Response: { "models": [
  { "id": "claude-sonnet-4-20250514", "provider": "anthropic", "available": true },
  { "id": "local/qwen2.5:7b", "provider": "ollama", "available": true }
] }
```

### 3.3 RAG / Knowledge (`/api/knowledge`)

Powers the Knowledge Base plugin and provides context to AI Chat.

```
POST /api/knowledge/search
Body: {
  "query": "event-driven architecture patterns",
  "collections": ["obsidian", "blog", "projects"],
  "n_results": 10,
  "where": { "tags": { "$contains": "architecture" } }
}
Response: {
  "results": [
    {
      "id": "doc_xyz",
      "content": "chunk text...",
      "metadata": {
        "source": "obsidian",
        "path": "2_Rules/architecture/event-driven.md",
        "title": "Event-Driven Architecture",
        "tags": ["architecture", "patterns"],
        "score": 0.87
      }
    }
  ]
}

POST /api/knowledge/index
Headers: Authorization: Bearer <pb_token> (admin only)
Body: {
  "source": "obsidian",        // "obsidian" | "blog" | "projects" | "custom"
  "force_reindex": false
}
Response: { "status": "indexing", "job_id": "job_123", "estimated_docs": 450 }

GET  /api/knowledge/status
Response: {
  "collections": {
    "obsidian": { "count": 1247, "last_indexed": "2026-02-25T10:00:00Z" },
    "blog": { "count": 23, "last_indexed": "2026-02-25T09:00:00Z" },
    "projects": { "count": 15, "last_indexed": "2026-02-24T14:00:00Z" }
  }
}

GET  /api/knowledge/graph
Query: ?root=MRAX&depth=2
Response: {
  "nodes": [
    { "id": "mrax", "label": "MRAX", "type": "concept" },
    { "id": "model", "label": "Model", "type": "layer" }
  ],
  "edges": [
    { "source": "mrax", "target": "model", "type": "contains" }
  ]
}
```

> **Implementation note for `/api/knowledge/graph`**: ChromaDB is a vector store, not a graph database. The graph is constructed during indexing by parsing Obsidian `[[backlinks]]` and `#tags` from markdown files. Relationships are stored as metadata in ChromaDB documents (`links_to: ["page-a", "page-b"]`) and as a lightweight adjacency list in a `knowledge_graph` PocketBase collection (or JSON file). The graph endpoint reads this pre-built adjacency data -- it does not compute relationships at query time. **Phase 2 deliverable**: backlink/tag extraction during indexing. **Deferred**: Full entity extraction via NLP.

### 3.4 Content (`/api/content`)

Dedicated content endpoints for blog posts and projects. Complements the PocketBase SDK (which the frontend uses directly for CRUD) by adding server-side processing.

```
GET  /api/content/blog
Query: ?page=1&per_page=10&tag=architecture&status=published
Response: { "items": [...], "total": 23, "page": 1, "pages": 3 }

GET  /api/content/blog/{slug}
Response: { "post": {...}, "related": [...], "reading_time": 5 }

POST /api/content/blog/sync
Headers: Authorization: Bearer <pb_token> (admin only)
Body: { "source": "obsidian", "path": "4_Logs/blog/" }
Response: { "synced": 3, "created": 1, "updated": 2, "unchanged": 0 }

GET  /api/content/projects
Query: ?featured=true&status=published
Response: { "items": [...] }

GET  /api/content/projects/{slug}
Response: { "project": {...}, "github_stats": { "stars": 42, "forks": 7 } }

POST /api/content/projects/sync-github
Headers: Authorization: Bearer <pb_token> (admin only)
Body: { "repos": ["rdtect/desktop-os", "rdtect/dotfiles"] }
Response: { "synced": 2, "stats_updated": true }
```

### 3.5 VPS Monitor (`/api/vps`)

Powers the System Monitor plugin with real server metrics.

```
GET  /api/vps/health
Response: {
  "services": {
    "pocketbase": { "status": "healthy", "uptime": "5d 3h", "memory_mb": 45 },
    "ollama": { "status": "healthy", "models_loaded": ["qwen2.5:7b"], "vram_used_mb": 4200 },
    "chromadb": { "status": "healthy", "collections": 3, "total_docs": 1285 },
    "n8n": { "status": "healthy", "active_workflows": 4, "executions_24h": 127 },
    "open_webui": { "status": "healthy" }
  },
  "system": {
    "cpu_percent": 23.4,
    "memory_percent": 67.2,
    "disk_percent": 41.0,
    "uptime_seconds": 454320,
    "load_avg": [0.8, 1.2, 1.0]
  }
}

GET  /api/vps/metrics
Query: ?period=1h&resolution=1m
Response: {
  "timestamps": ["2026-02-25T10:00:00Z", ...],
  "cpu": [23.4, 24.1, ...],
  "memory": [67.2, 67.5, ...],
  "network_in": [1024, 2048, ...],
  "network_out": [512, 1024, ...]
}

GET  /api/vps/ollama/models
Response: { "models": [
  { "name": "qwen2.5:7b", "size": "4.7GB", "loaded": true, "last_used": "..." }
] }

GET  /api/vps/n8n/workflows
Response: { "workflows": [
  { "id": "wf_1", "name": "Obsidian Sync", "active": true, "last_run": "...", "status": "success" }
] }

POST /api/vps/n8n/trigger/{workflow_id}
Headers: Authorization: Bearer <pb_token> (admin only)
Response: { "execution_id": "exec_123", "status": "running" }
```

### 3.6 VFS Sync (`/api/vfs`)

Server-side VFS persistence. Already partially implemented. Extends with delta-sync.

```
GET    /api/vfs/stat?path=/home/user/Documents
GET    /api/vfs/exists?path=/home/user/notes.md
GET    /api/vfs/read?path=/home/user/notes.md&encoding=text
PUT    /api/vfs/write?path=/home/user/notes.md
GET    /api/vfs/readdir?path=/home/user/Documents
POST   /api/vfs/mkdir?path=/home/user/new-folder
DELETE /api/vfs/rm?path=/home/user/old-file.txt
DELETE /api/vfs/rmdir?path=/home/user/old-folder&recursive=true
POST   /api/vfs/cp?path=/home/user/file.txt
POST   /api/vfs/mv?path=/home/user/old.txt
POST   /api/vfs/sync  (batch sync from client)
GET    /api/vfs/dump  (debug: full filesystem dump)

NEW:
POST   /api/vfs/delta-sync
Body: {
  "client_version": 42,
  "changes": [
    { "path": "/home/user/notes.md", "checksum": "abc123", "modified_at": "...", "action": "write" }
  ]
}
Response: {
  "server_version": 43,
  "accepted": [...],
  "conflicts": [...],
  "server_changes": [...]   // Changes client needs to pull
}
```

### 3.7 Agents (`/api/agents`)

Extends the existing `/api/agents/run` endpoint. The current endpoint already implements a full Claude tool-use agentic loop with 4 tools (`search_knowledge_base`, `get_vps_status`, `list_projects`, `get_current_time`) and SSE streaming. Changes: rename path for consistency, add config CRUD via PocketBase, wire `list_projects` to real data.

> **SSE events use the same unified format as chat** (Section 3.2): `thinking`, `tool_call`, `tool_result`, `text`, `done`, `error`.

```
POST /api/agents/execute
Headers: Authorization: Bearer <pb_token>
Body: {
  "agent_id": "assistant",
  "action": {
    "type": "think",
    "params": {
      "goal": "Summarize the last 5 blog posts",
      "context": {
        "current_directory": "/home/user",
        "open_windows": ["blog", "ai-chat"]
      }
    }
  },
  "model": "claude-sonnet-4-20250514",
  "tools": ["read_file", "list_directory", "rag_search", "open_app"],
  "stream": true
}
Response (SSE):
  data: {"type":"thinking","content":"I need to read the blog posts..."}
  data: {"type":"tool_call","tool":"rag_search","input":{"query":"blog posts","collections":["blog"]}}
  data: {"type":"tool_result","content":"Found 5 posts: ..."}
  data: {"type":"text","content":"Here is a summary of your 5 most recent blog posts:\n\n1. ..."}
  data: {"type":"done"}

GET  /api/agents/configs
Headers: Authorization: Bearer <pb_token>
Response: { "agents": [
  { "id": "assistant", "name": "Assistant", "model": "claude-sonnet-4-20250514", "capabilities": [...] }
] }

PUT  /api/agents/configs/{agent_id}
Headers: Authorization: Bearer <pb_token>
Body: { "name": "...", "model": "...", "system_prompt": "...", "capabilities": [...] }
```

### 3.8 Contact (`/api/contact`)

Public endpoint, no auth required. Rate-limited.

```
POST /api/contact
Body: {
  "name": "Jane Smith",
  "email": "jane@example.com",
  "subject": "SA Director Role",
  "message": "I saw your desktop OS portfolio..."
}
Response: { "id": "msg_123", "status": "sent" }
```

---

## 4. PocketBase Schema

### Existing Collections (keep as-is)

| Collection | Type | Fields |
|-----------|------|--------|
| `users` | auth | name, avatar, bio, title, social_links (JSON), resume_url |
| `projects` | base | title, slug, description, long_description, technologies (JSON), github_url, live_url, demo_url, thumbnail (file), screenshots (files), featured, order, status, user (rel) |
| `blog_posts` | base | title, slug, content (editor), excerpt, cover_image (file), tags (JSON), status, published_at, user (rel) |
| `contact_messages` | base | name, email, subject, message, status |
| `app_settings` | base | user (rel), app_id, settings (JSON) |
| `files_metadata` | base | path, name, mime_type, size, user (rel), synced_at, checksum, is_directory, parent_path |

### New Collections

#### `chat_sessions`

Persists AI chat conversations.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| user | relation (users) | yes | Owner |
| title | text | yes | Auto-generated from first message |
| model | text | yes | e.g., "claude-sonnet-4-20250514" |
| system_prompt | text | no | Custom system prompt |
| message_count | number | no | Denormalized count |
| total_tokens | number | no | Running token total |
| last_message_at | date | no | For sorting |

API rules:
- listRule: `@request.auth.id = user`
- viewRule: `@request.auth.id = user`
- createRule: `@request.auth.id != ""`
- updateRule: `@request.auth.id = user`
- deleteRule: `@request.auth.id = user`

#### `chat_messages`

Individual messages within sessions.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| session | relation (chat_sessions) | yes | Parent session |
| role | select (user, assistant, system, tool) | yes | Message role |
| content | text | yes | Message content |
| tool_calls | JSON | no | Tool use requests |
| tool_results | JSON | no | Tool execution results |
| model | text | no | Model used for this response |
| tokens_in | number | no | Input tokens for this exchange |
| tokens_out | number | no | Output tokens |

API rules:
- listRule: `session.user = @request.auth.id`
- viewRule: `session.user = @request.auth.id`
- createRule: `session.user = @request.auth.id`
- updateRule: `session.user = @request.auth.id`
- deleteRule: `session.user = @request.auth.id`

> **Pragmatic alternative**: For a single-user portfolio, chat persistence via IndexedDB (which the VFS already provides at `/home/user/.config/ai-chat/`) may be sufficient for V1. PocketBase chat persistence is warranted if cross-device session continuity or recruiter-visible conversation history is desired. Start with IndexedDB; add PocketBase persistence as a Phase 3 enhancement.

#### `agent_configs`

Persisted agent definitions (supplements in-memory agentRuntime).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| agent_id | text (unique) | yes | e.g., "assistant", "researcher" |
| user | relation (users) | yes | Owner |
| name | text | yes | Display name |
| description | text | no | Agent purpose |
| avatar | text | no | Emoji or URL |
| model | text | yes | Default model |
| system_prompt | text | no | System prompt |
| capabilities | JSON | yes | Array of capability names |
| tools | JSON | no | Custom tool definitions |
| is_active | bool | yes | Whether agent appears in UI |

#### `knowledge_sources`

Tracks indexing status for RAG collections.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | text (unique) | yes | "obsidian", "blog", "projects" |
| collection_name | text | yes | ChromaDB collection name |
| source_type | select | yes | obsidian, pocketbase, github, custom |
| config | JSON | yes | Source-specific config |
| doc_count | number | no | Number of indexed documents |
| last_indexed_at | date | no | Last successful index |
| status | select | yes | idle, indexing, error |
| error_message | text | no | Last error |

---

## 5. Plugin Responsibility Matrix

### Plugin Categories

**Tier 1: Portfolio (Public, Free Access)**
These are what visitors see first. They demonstrate technical capability through their existence.

| Plugin | API Calls | PocketBase | VFS | EventBus | MessageBus | Notes |
|--------|-----------|------------|-----|----------|------------|-------|
| **welcome** | None | None | None | theme:changed | None | Auto-opens for first visitors |
| **about-me** | None | users.getCurrent() | None | None | None | Reads user profile from PB |
| **project-gallery** | `/api/content/projects` | projects.getPublished(), projects.getFeatured() | None | app:launched | None | GitHub stats via API |
| **blog** | `/api/content/blog` | blogPosts.getPublished() | None | file:open (to open post in editor) | None | Obsidian-synced via API |
| **contact** | `/api/contact` | contactMessages.submit() | None | notification:show | None | Rate-limited, public |
| **github-globe** | None (static/GH API client-side) | None | None | None | None | Visual showcase |

**Tier 2: Workspace (Protected, Auth Required)**
These are the "it actually works" plugins -- a real environment, not a demo.

| Plugin | API Calls | PocketBase | VFS | EventBus | MessageBus | Notes |
|--------|-----------|------------|-----|----------|------------|-------|
| **ai-chat** | `/api/chat/completions` (SSE), `/api/chat/sessions` | chat_sessions, chat_messages | None | notification:show | Sends to knowledge-base for context | Primary AI interface |
| **knowledge-base** | `/api/knowledge/search`, `/api/knowledge/graph` | None | Reads /home/user/Documents | file:open | Receives from ai-chat | RAG-powered search |
| **terminal** | `/api/vfs/*` (sync), `/api/agents/execute` | None | Full VFS access | file:operation | None | Real commands against VFS |
| **file-browser** | `/api/vfs/sync` | files_metadata | Full VFS access | file:open, file:operation | None | IndexedDB + server sync |
| **markdown-editor** | `/api/vfs/write` (sync) | None | readFile, writeFile | file:open (receives) | None | Opens .md files from VFS |
| **notes** | `/api/notes` (SvelteKit API) | None | VFS write | None | None | Quick notes, VFS-backed |
| **code-editor** | None | None | readFile, writeFile | file:open (receives) | None | Syntax-highlighted editor |
| **excalidraw** | None (federation) | None | VFS save/load .excalidraw | file:open (receives) | None | Module Federation remote |
| **prompt-manager** | None | appSettings (prompt templates) | None | None | Sends prompts to ai-chat | Manage AI prompt templates |

**Tier 3: System (Protected, Admin/Power User)**
The "meta" layer -- observing and controlling the system itself.

| Plugin | API Calls | PocketBase | VFS | EventBus | MessageBus | Notes |
|--------|-----------|------------|-----|----------|------------|-------|
| **system-monitor** | `/api/vps/health`, `/api/vps/metrics` | None | /proc/* reads | window:*, app:* | None | Real VPS metrics + browser stats |
| **agent-manager** | `/api/agents/configs`, `/api/agents/execute` | agent_configs | /proc/agents | agent:* events | Sends commands to agents | Agent CRUD and monitoring |
| **pocketbase-admin** | None (iframe) | Direct PB admin | None | None | None | Iframe to pb.rdtect.com/_/ |
| **plugin-registry** | None | None | None | None | None | Plugin metadata viewer |

**Tier 4: Utility (Mixed Access)**

| Plugin | API Calls | PocketBase | VFS | Notes |
|--------|-----------|------------|-----|-------|
| **calculator** | None | None | None | Pure client-side |
| **clock** | None | None | None | Widget + window |
| **weather** | None (client-side weather API) | None | None | Widget |
| **image-filter** | None | None | VFS read/write | Client-side processing |
| **flappy-bird** | None | None | None | Fun easter egg |

---

## 6. Data Flow Diagrams

### 6.1 Blog / Obsidian Sync

> **Transfer mechanism**: The Obsidian vault lives on the dev machine (`D:\rdtect` on Windows). It is synced to the VPS via a **private Git repository** (`github.com/rdtect/vault`, private). The flow:
> 1. Local: Obsidian Git plugin auto-commits and pushes changes on a schedule (or manually)
> 2. VPS: n8n workflow triggers `git pull` on the vault clone at `/data/obsidian-vault/`
> 3. VPS: n8n then calls `POST /api/content/blog/sync` to process new/changed files
>
> **Alternative** (simpler, deferred): Skip n8n. Run a cron job on the VPS that pulls the vault repo and calls the sync endpoint. n8n adds observability but isn't strictly required for Phase 2.
>
> **Prerequisite**: The `scripts/index-vault-chromadb.py` file referenced below does NOT exist in the current repo. The embedding generation logic must be written from scratch in `services/embeddings.py`, using `all-MiniLM-L6-v2` via the `sentence-transformers` library or ONNX runtime.

```
Private Git Repo (github.com/rdtect/vault)
     ^                              |
     | [Obsidian Git plugin push]   | [n8n: git pull on schedule / webhook]
     |                              v
Obsidian Vault (D:\rdtect)    VPS clone (/data/obsidian-vault/)
                                    |
                                    | [n8n triggers, or cron]
                                    v
                              POST /api/content/blog/sync
                                    |
Python API Gateway (/api/content/blog/sync)
     |
     +---> 1. Read .md files from Obsidian vault path (4_Logs/blog/)
     |
     +---> 2. Parse frontmatter (title, tags, date, status)
     |
     +---> 3. Render Markdown to HTML
     |
     +---> 4. Upsert into PocketBase (blog_posts collection)
     |         - Match on slug
     |         - Create if new, update if modified_at changed
     |
     +---> 5. Generate embeddings (all-MiniLM-L6-v2 via ONNX)
     |
     +---> 6. Upsert into ChromaDB ("blog" collection)
     |         - doc_id = slug
     |         - metadata = { title, tags, published_at, source: "obsidian" }
     |
     v
  Blog plugin reads from PocketBase SDK (blogPosts.getPublished())
  Knowledge Base plugin searches ChromaDB (/api/knowledge/search)
```

### 6.2 AI Chat with RAG

```
User types message in AI Chat plugin
     |
     v
Frontend: POST /api/chat/completions (SSE)
  body: {
    messages: [...conversation history...],
    model: "claude-sonnet-4-20250514",
    stream: true,
    session_id: "sess_abc",
    rag_context: { collections: ["obsidian", "blog"], query: "user's message" }
  }
     |
     v
API Gateway receives request
     |
     +---> 1. Authenticate user via PB token
     |
     +---> 2. RAG Retrieval (if rag_context present)
     |         |
     |         +---> Query ChromaDB with user's message
     |         |     collection: "obsidian" + "blog"
     |         |     n_results: 5
     |         |
     |         +---> Receive ranked chunks with metadata
     |         |
     |         +---> Construct augmented system prompt:
     |               "You have access to the following knowledge:
     |                [chunk 1: MRAX architecture pattern...]
     |                [chunk 2: Event-driven design in rdtect OS...]
     |                Answer based on this context when relevant."
     |
     +---> 3. Call Anthropic Claude API
     |         model: claude-sonnet-4-20250514
     |         messages: [augmented_system, ...history, user_message]
     |         tools: [rag_search, vfs_read] (if enabled)
     |         stream: true
     |
     +---> 4. Stream response tokens back via SSE
     |         |
     |         +---> If tool_use detected:
     |         |       Execute tool server-side
     |         |       (e.g., rag_search -> query ChromaDB again)
     |         |       (e.g., vfs_read -> read from server VFS)
     |         |       Return tool result, continue generation
     |         |
     |         +---> Stream content_block_delta events
     |
     +---> 5. Persist conversation
              |
              +---> Upsert chat_session in PocketBase
              +---> Create chat_message records (user + assistant)
              +---> Update session.message_count, session.total_tokens
     |
     v
Frontend receives SSE events, renders streaming response
```

### 6.3 VPS Monitor

```
System Monitor plugin opens
     |
     v
Frontend: GET /api/vps/health (poll every 30s)
     |
     v
API Gateway
     |
     +---> Docker API (or psutil on host):
     |       CPU, memory, disk, network
     |
     +---> GET ollama:11434/api/tags
     |       Models loaded, VRAM usage
     |
     +---> GET pocketbase:8090/api/health
     |       PocketBase status
     |
     +---> GET chromadb:8000/api/v1/heartbeat
     |       ChromaDB status, collection counts
     |
     +---> GET n8n:5678/api/v1/workflows (with API key)
     |       Active workflows, recent executions
     |
     v
Response aggregated into single JSON
     |
     v
System Monitor plugin renders:
  - Service health cards (green/yellow/red)
  - CPU/Memory line charts (from /api/vps/metrics)
  - Ollama model status
  - n8n workflow execution log
  - Browser-side stats (from /proc/meminfo, FPS counter)
```

### 6.4 Agent Execution Flow

```
User in Agent Manager: "Summarize my Documents folder"
     |
     v
agentRuntime.start("assistant", "Summarize my Documents folder")
     |
     v
Frontend: POST /api/agents/execute (SSE)
  body: {
    agent_id: "assistant",
    action: { type: "think", params: { goal: "Summarize Documents folder" } },
    tools: ["list_directory", "read_file", "rag_search"],
    stream: true
  }
     |
     v
API Gateway:
     |
     +---> 1. Load agent config from PocketBase (agent_configs)
     |
     +---> 2. Construct tool definitions for Claude API:
     |         - list_directory: { path: string } -> FileStat[]
     |         - read_file: { path: string } -> { content: string }
     |         - rag_search: { query: string, collections: string[] } -> results
     |
     +---> 3. Call Claude with tools + system prompt + goal
     |
     +---> 4. Agentic loop:
     |         Claude says: tool_use("list_directory", { path: "/home/user/Documents" })
     |           -> Execute against server VFS
     |           -> Return: [notes.md, project-plan.md, ideas.txt]
     |         Claude says: tool_use("read_file", { path: "/home/user/Documents/notes.md" })
     |           -> Execute against server VFS
     |           -> Return: file content
     |         Claude says: "Here is a summary of your Documents folder..."
     |
     +---> 5. Stream all events back to frontend:
              thinking, tool_use, tool_result, response
     |
     v
Agent Manager plugin:
  - Shows thinking indicator
  - Renders tool calls in real-time (like Claude Code)
  - Displays final response
  - Emits agent:action, agent:result events via agentRuntime
```

---

## 7. Frontend Architecture Decisions

### ADR-F01: Keep IndexedDB as Primary VFS, Add Lazy Server Sync

**Context**: The VFS currently uses IndexedDB only. Server-side VFS exists but is not connected.

**Decision**: IndexedDB remains the primary storage for low-latency local operations. Server-side sync happens asynchronously on a debounced write schedule. Conflicts use last-write-wins with checksums.

**Rationale**: The desktop must feel instant. Network latency in file operations would ruin the UX. The server copy is for backup and cross-device sync, not for primary access.

**Implementation**:
```typescript
// In vfs.svelte.ts, extend the existing sync() method:
async sync(): Promise<SyncResult> {
  const localChanges = await this.getChangesSinceLastSync();
  const response = await fetch('/api/vfs/delta-sync', {
    method: 'POST',
    body: JSON.stringify({ client_version: this.syncVersion, changes: localChanges })
  });
  const { server_version, accepted, conflicts, server_changes } = await response.json();
  // Apply server_changes to local IndexedDB
  // Handle conflicts (last-write-wins + notification)
  this.syncVersion = server_version;
}
```

### ADR-F02: AI Chat Uses SvelteKit API Route as Proxy to Gateway

**Context**: The AI Chat plugin currently has two paths: a SvelteKit SSE endpoint (`/api/ai/stream`) and a Python WebSocket (`/api/chat/ws`). Both talk to OpenAI.

**Decision**: Remove the SvelteKit AI route. AI Chat plugin talks directly to `api.rdtect.com/api/chat/completions` via SSE. The SvelteKit server routes remain only for non-AI purposes (notes CRUD, static data).

**Rationale**: Having two AI paths creates confusion. The Python gateway is where RAG, tool execution, and conversation persistence live. Putting AI logic in SvelteKit would mean duplicating the RAG pipeline in TypeScript.

**Deletable**: The SvelteKit `/api/ai/stream` route can be deleted. AI Chat plugin changes one URL.

### ADR-F03: Agent Runtime Split -- Client Orchestration, Server Execution

**Context**: The current agentRuntime has a `runAutonomousLoop` that is a TODO placeholder. Tools execute client-side against the browser VFS.

**Decision**: Keep the agentRuntime singleton on the client for state management (agents list, messages, status). When an agent needs to "think" or use tools, the client calls `/api/agents/execute`. Server-side tools operate on the server VFS and ChromaDB. Client-side tools (open_app, focus_window, emit_event) remain browser-only.

**Implementation**: Two tool categories:
- **Server tools**: read_file, write_file, list_directory, rag_search, http_request -- executed by API gateway
- **Client tools**: open_app, close_app, focus_window, emit_event, send_to_app -- executed by browser agentRuntime

```typescript
// In runtime.svelte.ts, modify executeAction:
private async executeAction(agent: Agent, action: AgentAction): Promise<unknown> {
  if (SERVER_TOOLS.has(action.type)) {
    // Delegate to API gateway
    const response = await fetch('/api/agents/execute', {
      method: 'POST',
      body: JSON.stringify({ agent_id: agent.id, action, tools: [...] })
    });
    return response.json();
  }
  // Client-side execution
  const tool = this.tools.get(action.type);
  return tool?.execute(action.params, agent);
}
```

### ADR-F04: Plugin Access Tiers (Already in Manifests, Enforce at Shell Level)

**Context**: Manifests have `access: 'free' | 'protected'` but enforcement is not implemented.

**Decision**: The Shell layer (AuthGate.svelte) checks `manifest.access` before rendering a plugin window. "free" plugins render for everyone. "protected" plugins show a login prompt if not authenticated.

**Rationale**: Visitors see the portfolio experience immediately. Signing in unlocks the workspace. This creates a natural funnel.

### ADR-F05: Switch AI Provider to Anthropic Claude

**Context**: Current backend uses OpenAI GPT-4o-mini. This is a portfolio for an Anthropic SA Director role.

**Decision**: Primary model is `claude-sonnet-4-20250514` via Anthropic API. Fallback is `local/qwen2.5:7b` via Ollama. OpenAI support removed.

**Rationale**: Demonstrates direct experience with the Anthropic API, tool use patterns, streaming, and model selection. Using Claude in the portfolio for Anthropic is both practical and meta-demonstrative.

### ADR-F06: System Monitor Reads Real VPS Metrics

**Context**: Current System Monitor shows browser performance.memory only.

**Decision**: System Monitor calls `/api/vps/health` and `/api/vps/metrics` for real server data. Browser metrics (FPS, heap size, window count) remain as a "Client" tab. Server metrics appear in a "Server" tab.

**Implementation**: Add two tabs to SystemMonitor.svelte. The /proc virtual filesystem gets new server-backed entries:
- `/proc/vps/cpu` -- real CPU usage from API
- `/proc/vps/memory` -- real memory from API
- `/proc/vps/services` -- service health from API

These virtual proc entries are populated by polling the API gateway.

### ADR-F07: Error & Degradation Strategy

**Context**: The API gateway (Python backend on VPS) will occasionally be unreachable -- during deployments, VPS restarts, or network issues. Plugins must degrade gracefully rather than showing broken UIs to portfolio visitors.

**Decision**: Each plugin defines a degradation behavior based on its server dependency:

| Plugin | Gateway Down Behavior |
|--------|-----------------------|
| **ai-chat** | Show "AI service temporarily unavailable" banner. Disable send button. Preserve local message history (IndexedDB). |
| **knowledge-base** | Fall back to local notes (IndexedDB). RAG search disabled with "offline" badge. Graph view shows local-only data. |
| **system-monitor** | Server tab shows "VPS unreachable" with last-known values (cached). Client/browser tab works normally. |
| **terminal** | Works locally -- VFS is IndexedDB-primary. Remote commands (`curl`, `ssh`) show connection errors naturally. |
| **file-browser** | Works fully -- VFS is IndexedDB-primary. Sync indicator shows "offline" if sync is enabled. |
| **agent-manager** | Local agent CRUD works. Server execution shows "gateway offline". Client-side tool execution still available. |
| **blog** | Show cached/sample posts (already implemented as fallback). |
| **contact** | Show form but disable submit with "service offline" message. Or fall back to mailto: link. |
| **project-gallery** | Show cached project data. GitHub stats show "last updated: [date]". |

**Implementation**: Create a shared `$lib/core/gateway-status.svelte.ts` singleton that polls `/api/health` every 30s. Plugins import `gatewayStatus.isOnline` (reactive) and conditionally render degraded UI. This is a Svelte 5 `$state` value, so reactivity is automatic.

### ADR-F08: Anonymous User Cost Controls

**Context**: Claude API calls cost money. Anonymous portfolio visitors will trigger AI chat interactions. Without controls, a viral HN post could generate thousands of dollars in API costs overnight.

**Decision**: Implement tiered rate limiting and cost controls:

| Control | Value | Env Var |
|---------|-------|---------|
| Anonymous message limit | 10 messages/hour per IP | `CHAT_RATE_LIMIT_ANON` |
| Anonymous model | claude-haiku (cheapest) | `CHAT_MODEL_ANON` |
| Authenticated model | claude-sonnet (default) | `CHAT_MODEL_AUTH` |
| Max tokens per response | 1024 (anon) / 4096 (auth) | `CHAT_MAX_TOKENS_ANON`, `CHAT_MAX_TOKENS_AUTH` |
| Monthly budget alert | $50 | `CHAT_BUDGET_ALERT_USD` |
| Monthly hard cap | $100 (disable API) | `CHAT_BUDGET_CAP_USD` |

**Additional measures**:
- **Canned responses**: For common portfolio questions ("tell me about yourself", "what is this project", "what tech do you use"), return pre-written responses without hitting Claude. Detection via simple keyword matching in the gateway, not the LLM.
- **Token budget monitoring**: VPS monitor tracks daily/monthly spend via Anthropic usage API. Surface in System Monitor's Server tab.
- **Abuse detection**: If a single IP sends >50 messages/hour, block for 24h. Log to `/var/log/abuse.log` in VFS.

### ADR-F09: Mobile / Responsive Strategy

**Context**: `mobile.svelte.ts` exists in the codebase (30 lines, viewport detection via `$state`) but no plugin adapts to it. The desktop window manager metaphor breaks on mobile screens.

**Decision**: Adopt a progressive degradation approach rather than building a separate mobile UI:

**Tier 1 plugins (portfolio-facing)** -- full mobile support:
- `blog`, `project-gallery`, `contact`, `about`, `ai-chat`
- On mobile: plugins render full-screen, no window chrome (title bar, resize handles)
- Taskbar becomes a bottom navigation bar with icons for Tier 1 plugins
- Window stacking/tiling disabled; one plugin visible at a time
- Swipe gestures: left/right to switch between open plugins

**Tier 2 plugins (workspace)** -- "best on desktop" prompt:
- `terminal`, `file-browser`, `knowledge-base`, `agent-manager`, `system-monitor`
- On mobile: show a centered card with plugin icon + "This app works best on desktop" + option to open anyway in full-screen mode
- If opened: render full-screen with simplified controls

**Implementation**: `WindowManager` checks `mobileState.isMobile` before applying window positioning. Shell layout component switches between desktop layout and mobile layout. Each plugin's manifest can declare `mobileSupport: 'full' | 'limited' | 'none'`.

### ADR-F10: Testing Strategy

**Context**: The codebase currently has zero automated tests. For a portfolio project, exhaustive test coverage is not the goal -- but demonstrating testing competence and preventing regressions during V2 implementation is.

**Decision**: Implement a minimal but meaningful test suite across three layers:

**CI checks (already passing locally, add to GitHub Actions)**:
- `bun run check` -- svelte-check (type errors in Svelte components)
- `bun run typecheck` -- tsc --noEmit (TypeScript type checking)
- `ruff check` -- Python linting for API gateway

**API gateway tests (pytest)**:
- Health endpoint returns 200
- Chat endpoint streams SSE events in correct format
- Knowledge search returns results (requires ChromaDB test fixture)
- VPS metrics returns valid JSON shape (mock psutil)
- Agent execution streams events in unified format
- Rate limiting blocks after threshold

**Frontend smoke tests (Playwright)**:
- Desktop boots and renders taskbar with plugin icons
- Clicking a plugin icon opens a window
- Window can be moved, resized, minimized, closed
- File browser can navigate VFS directories
- AI chat renders (even if gateway is offline -- tests degradation)

**Not in scope (explicitly deferred)**:
- Unit tests for individual plugins (plugin architecture makes these independently testable later)
- E2E tests for full chat flow (requires live Claude API key)
- Visual regression tests (premature for active UI development)

---

## 8. The Showcase Angle

### What an Anthropic SA Director Would Notice

An SA Director evaluates technical depth, system design thinking, and the ability to communicate complex architectures to customers. Here is what this system specifically demonstrates:

#### 8.1 Agent Runtime (Tool Use as First-Class Citizen)

The agent system mirrors Claude's own tool use protocol. The `AgentTool` interface maps directly to Anthropic's tool definition schema:

```typescript
// This is literally the Anthropic tool schema, implemented in the browser
interface AgentTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string; }>;
    required: string[];
  };
  execute: (params, agent) => Promise<unknown>;
}
```

The agentic loop in `/api/agents/execute` implements the think-act-observe cycle:
1. Claude receives the goal + available tools + system context
2. Claude decides which tool to call (or responds directly)
3. Server executes the tool (VFS read, RAG search, etc.)
4. Result fed back to Claude as tool_result
5. Loop continues until Claude produces a final response

This demonstrates understanding of:
- Anthropic's tool use API
- The agentic loop pattern
- Capability-based permissions (agents only get tools matching their capabilities)
- Client-server tool split (some tools run in browser, some on server)
- Streaming tool use with SSE

#### 8.2 RAG Pipeline (Production-Grade, Not a Demo)

The RAG system is not a toy:
- **Corpus**: Real Obsidian vault (450+ notes, MRAX-structured), blog posts, project descriptions
- **Embeddings**: `all-MiniLM-L6-v2` via ONNX (already deployed for vault indexing)
- **Vector store**: ChromaDB at `chroma.rdtect.com` (already running)
- **Retrieval**: Semantic search with metadata filtering (by source, tags, date)
- **Augmentation**: Retrieved chunks injected into system prompt, not raw-concatenated
- **Evaluation path**: Token usage tracking per session enables future cost/quality analysis

The `/api/knowledge/search` endpoint shows how RAG fits into a larger system -- it is a service, not a monolith. The AI Chat plugin calls it, the Agent runtime calls it, and the Knowledge Base plugin calls it independently.

#### 8.3 Event-Driven Architecture (Everything Observable)

The system has three event/messaging layers, each at a different scope:

| Layer | Scope | Pattern | Example |
|-------|-------|---------|---------|
| EventBus | System internals | Typed pub/sub | `window:opened`, `theme:changed` |
| MessageBus | Plugin-to-plugin IPC | Addressed pub/sub with request/response | AI Chat -> Knowledge Base: "search for X" |
| Agent Events | Agent lifecycle | Observable stream | `agent:action`, `agent:result`, `agent:error` |

This separation of concerns mirrors how production systems handle events at different layers (system events vs. business events vs. audit events).

#### 8.4 Unix Metaphors as Architecture Patterns

The VFS is not a gimmick. It is a demonstration of how Unix patterns solve real problems:

- `/proc/agents` = runtime introspection (like `ps aux` but for AI agents)
- `/dev/clipboard` = device abstraction (clipboard is just a file)
- `/home/user/.config/` = XDG config standard (app settings are files, watchable)
- File associations = MIME type registry (like `xdg-open`)
- VFS watchers = inotify (filesystem events for reactive UI)

This shows the candidate can take abstract patterns (everything-is-a-file, process-as-data) and apply them in a completely different domain (web browser).

#### 8.5 Clean Abstractions (Deletable at Every Level)

Every major component can be deleted without breaking unrelated code:

- Delete a plugin: Just remove the folder. `import.meta.glob` stops finding it.
- Delete the Python backend: Frontend degrades gracefully (VFS still works client-side, AI Chat shows "service unavailable").
- Delete ChromaDB: RAG stops working, AI Chat still functions without retrieval.
- Delete a VFS virtual filesystem: Remove one line from the VFS constructor. Other paths unaffected.
- Delete the agent system: Plugins that used agents degrade to manual mode.

This is the "best abstraction is deletable" principle made concrete.

#### 8.6 Thin Client / Smart Gateway

The architecture demonstrates a production pattern: the browser is a rendering engine, not a data store. The API gateway is the brain:

- Secrets (API keys, DB passwords) never reach the browser
- RAG orchestration happens server-side (no exposing ChromaDB to the internet)
- Agent tool execution is sandboxed on the server
- Rate limiting and auth happen at the gateway

This is exactly how a Solutions Architect would design a customer deployment.

---

## 9. Implementation Phases

### Phase 1: API Gateway Foundation (Week 1)

**Goal**: Activate and extend the existing Python backend into a complete API gateway.

> **Prerequisite (Day 0)**: Fix the Docker import path bug. `main.py` uses `from src.routers import ...` but the Dockerfile copies `src/` contents into `/app/`, breaking the `src.` package prefix. Fix: either restructure imports to be relative, or adjust the Dockerfile to preserve the `src/` directory.

Files to create/modify in `apps/python-backend/src/`:
```
main.py            -> MODIFY  (mount vfs + pocketbase routers, add PUT/DELETE to CORS, fix imports)
routers/
  chat.py          -> MODIFY: Rename /stream to /completions, add /sessions CRUD, add /models
  vfs.py           -> ACTIVATE: Already implemented (14 endpoints), just mount in main.py
  pocketbase.py    -> ACTIVATE: Already implemented (8 endpoints), fix auth Header() pattern, mount
  knowledge.py     -> EXISTS: Add /index and /status endpoints (search + context already work)
  vps.py           -> EXISTS: Already has /metrics, /system, /containers, /ollama -- add /health aggregate
  agents.py        -> EXISTS: Rename /run to /execute, add /configs CRUD endpoints
  contact.py       -> NEW: Extract from pocketbase.py for independent rate limiting
services/
  ai.py            -> KEEP: Already uses Anthropic SDK with 3-tier CF Gateway fallback -- no rewrite needed
  rag.py           -> KEEP: Already connects to ChromaDB with retrieve() + build_context()
  vps_monitor.py   -> KEEP: Already has psutil + Docker + Ollama metrics
  agent_executor.py -> MODIFY: Wire list_projects tool to PocketBase (currently hardcoded)
models/
  chat.py          -> NEW: Extract inline Pydantic models from routers into shared models/
  knowledge.py     -> NEW
  agents.py        -> NEW
  vps.py           -> NEW
```

Deliverables:
- [ ] Fix Docker import path bug (Day 0 blocker)
- [ ] Mount VFS and PocketBase routers, add PUT/DELETE to CORS allowed methods
- [ ] `/api/chat/completions` (renamed from `/stream`, same Claude SSE implementation)
- [ ] `/api/chat/models` listing available models from provider chain
- [ ] `/api/vps/health` aggregated service health (compose existing per-service checks)
- [ ] `/health` with aggregated service status (already exists, extend)
- [ ] SvelteKit `/api/ai/stream` route kept alive until Phase 4 (do NOT delete yet)

### Phase 2: RAG Pipeline (Week 2)

**Goal**: Add document indexing to the existing RAG search infrastructure. Search and context-building already work via `rag.py`; what's missing is the ingestion pipeline.

Files to create/modify:
```
services/
  rag.py           -> KEEP: Already has ChromaDB client, retrieve(), build_context()
  indexer.py       -> NEW: Document processing pipeline (markdown parsing, frontmatter extraction, chunking)
  embeddings.py    -> NEW: Embedding generation via sentence-transformers or ONNX (all-MiniLM-L6-v2)
routers/
  knowledge.py     -> MODIFY: Add /index trigger and /status endpoints (search already works)
  content.py       -> NEW: Blog and project content endpoints with server-side enrichment
```

> **Note**: `scripts/index-vault-chromadb.py` does NOT exist in the repo. The embedding logic must be written from scratch. Consider using `sentence-transformers` (simpler) over raw ONNX for Phase 2, with ONNX optimization deferred to Phase 6.

Deliverables:
- [ ] `/api/knowledge/search` with multi-collection search
- [ ] `/api/knowledge/index` with Obsidian vault indexing
- [ ] `/api/knowledge/status` with collection stats
- [ ] AI Chat integrated with RAG (rag_context parameter)
- [ ] n8n workflow for scheduled re-indexing

### Phase 3: PocketBase Schema + Chat Persistence (Week 2-3)

**Goal**: New collections, conversation persistence.

Files to create/modify:
```
data/pb_migrations/
  create_chat_sessions.js    -> PB migration
  create_chat_messages.js    -> PB migration
  create_agent_configs.js    -> PB migration
  create_knowledge_sources.js -> PB migration
apps/desktop/src/lib/core/pocketbase/
  types.ts                   -> Add new collection types
  client.ts                  -> Add chatSessions, chatMessages accessors
```

Deliverables:
- [ ] PocketBase migrations for 4 new collections
- [ ] Chat session persistence (create/list/delete)
- [ ] Chat message persistence (per-session)
- [ ] TypeScript types for new collections

### Phase 4: Frontend Plugin Updates (Week 3-4)

**Goal**: Connect plugins to the API gateway. Some plugins need minor wiring; others need substantial rewrites.

> **Scope reality check**: ai-chat and knowledge-base are not "connect existing" tasks -- they are **rewrites**. terminal needs VFS integration it never had. Budget accordingly.

| Plugin | Effort | Changes |
|--------|--------|---------|
| **ai-chat** | **REWRITE (2-3 days)** | Currently hits SvelteKit `/api/ai/stream` which proxies to OpenAI. Must switch to Python gateway `/api/chat/completions` (Claude), adopt unified SSE event format, add session selector, model selector, RAG toggle. Delete SvelteKit `/api/ai/stream` route after this plugin is migrated. |
| **knowledge-base** | **REWRITE (2-3 days)** | Currently a local IndexedDB note-taking app with `[[backlinks]]` and `#tags`. V2 wants a RAG search interface backed by `/api/knowledge/search` + graph view from `/api/knowledge/graph`. These are fundamentally different applications. Consider keeping the local note-taking as a separate mode ("My Notes" tab + "Knowledge Search" tab). |
| **terminal** | **REWRITE (1-2 days)** | Currently has a hardcoded mock filesystem object with ~20 paths. Does NOT import `$lib/core/vfs`. Must be rewired to use the real VFS for `ls`, `cd`, `cat`, `mkdir`, etc. This is a prerequisite for the "working workspace" story. |
| **system-monitor** | **Medium (1 day)** | Add "Server" tab calling `/api/vps/health` and `/api/vps/metrics`. Keep existing browser-only tabs (FPS, memory, network). Fix hardcoded plugin stats to query dynamically. |
| **agent-manager** | **Medium (1 day)** | Already imports `agentRuntime` and has full CRUD UI. Wire "Execute" to `/api/agents/execute` SSE stream. Add PocketBase load/save for `agent_configs`. |
| **blog** | **Small (0.5 days)** | Currently tries PocketBase, falls back to sample data. Switch to `/api/content/blog` for enriched data (related posts, reading time). PocketBase fallback can stay as degraded mode. |
| **project-gallery** | **Small (0.5 days)** | Currently fetches GitHub API client-side. Add server-side GitHub stats from `/api/content/projects/{slug}`. |
| **contact** | **Trivial** | Switch from direct PocketBase SDK to `/api/contact` (adds rate limiting at gateway). |
| **file-browser** | **Small (0.5 days)** | Already uses VFS + EventBus. Add "Sync" button that calls `vfs.sync()` once delta-sync is implemented. |

### Phase 5: Agent Runtime Integration (Week 4)

**Goal**: Make the agentic loop real.

Files to modify:
```
apps/desktop/src/lib/core/agents/
  runtime.svelte.ts    -> Connect runAutonomousLoop to /api/agents/execute
  tools.ts             -> Split into client-tools.ts and server-tools.ts
  types.ts             -> Add server execution types
```

Deliverables:
- [ ] Agent "think" command hits Claude API via gateway
- [ ] Server-side tools (VFS, RAG) execute on the server
- [ ] Client-side tools (window management) execute in the browser
- [ ] Real-time streaming of agent actions back to Agent Manager UI
- [ ] Capability enforcement (agent only gets tools matching its capabilities)

### Phase 6: Polish and Showcase (Week 5)

**Goal**: Make it visitor-ready.

- [ ] Welcome wizard guides visitors through the portfolio experience
- [ ] Blog posts synced from Obsidian (initial batch)
- [ ] Projects populated from GitHub repos
- [ ] System Monitor shows real VPS metrics
- [ ] AI Chat demonstrates RAG against the knowledge base
- [ ] Agent Manager shows a demo agent that can be started
- [ ] Performance audit: lighthouse score, bundle size, TTFB
- [ ] Mobile responsiveness verified for all Tier 1 plugins
- [ ] Error boundaries on all plugin windows
- [ ] Graceful degradation when API gateway is unreachable

---

## Appendix A: Environment Variables

> **Naming convention**: Use the existing variable names where they already exist in the codebase. New variables follow the same patterns. The root `.env.example` needs cleanup: remove legacy `OPENAI_API_KEY`, `OPENAI_MODEL`, `DB_*` (MySQL), and `PISTON_PORT` vars.

### Frontend (.env at repo root)

```env
# PocketBase (public, no secrets)
PUBLIC_POCKETBASE_URL=https://pb.rdtect.com

# API Gateway (public URL) -- replaces current PUBLIC_PYTHON_API_URL
PUBLIC_API_URL=https://api.rdtect.com

# Only used by SvelteKit server routes (notes, filesystem-backed)
MARKDOWN_DIR=./data/markdown
```

### API Gateway (Docker env or .env)

```env
# Anthropic (existing var name from apps/python-backend/.env.example)
ANTHROPIC_API_KEY=sk-ant-...

# Cloudflare AI Gateway -- existing 3-tier fallback chain, keep these
CF_AI_GATEWAY_URL=https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}
CF_ACCOUNT_ID=...
CF_WORKERS_AI_API_KEY=...

# Claude model selection (existing var names)
CLAUDE_CHAT_MODEL=claude-haiku-4-5-20251001
CLAUDE_AGENT_MODEL=claude-sonnet-4-6

# Ollama (internal)
OLLAMA_URL=http://ollama:11434

# ChromaDB (existing var names from apps/python-backend/.env.example)
CHROMA_URL=http://chromadb:8000
CHROMA_BEARER_TOKEN=...
CHROMA_COLLECTION=obsidian_vault
RAG_TOP_K=5
RAG_MIN_SCORE=1.2

# PocketBase (internal -- for gateway to auth-validate and proxy)
POCKETBASE_URL=http://pocketbase:8090
POCKETBASE_ADMIN_EMAIL=admin@rdtect.dev
POCKETBASE_ADMIN_PASSWORD=...

# n8n (internal -- NEW, not in current .env.example)
N8N_URL=http://n8n:5678
N8N_API_KEY=...

# VFS (NEW)
VFS_DB_PATH=./data/vfs.db

# Docker socket for container monitoring (existing var name)
DOCKER_SOCKET=/var/run/docker.sock

# Agent config (existing var name)
AGENT_MAX_ITERATIONS=10

# CORS (existing var name)
ALLOWED_ORIGINS=https://rdtect.com,http://localhost:5176

# Rate limiting (NEW)
CONTACT_RATE_LIMIT=5/hour
CHAT_RATE_LIMIT_ANON=10/hour
CHAT_RATE_LIMIT_AUTH=100/hour
```

---

## Appendix B: Docker Compose (Production, Updated)

```yaml
services:
  frontend:
    build:
      context: .
      dockerfile: apps/desktop/Dockerfile
    environment:
      SERVICE_FQDN_FRONTEND_3000: ''
      NODE_ENV: production
      PUBLIC_POCKETBASE_URL: https://pb.rdtect.com
      PUBLIC_API_URL: https://api.rdtect.com
      ORIGIN: https://rdtect.com
    expose:
      - '3000'
    depends_on:
      pocketbase:
        condition: service_healthy
    networks:
      - coolify

  api-gateway:
    build:
      context: ./apps/python-backend
      dockerfile: Dockerfile
    environment:
      SERVICE_FQDN_API_8000: ''
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      OLLAMA_URL: http://ollama:11434
      CHROMADB_URL: http://chromadb:8000
      CHROMADB_AUTH_TOKEN: ${CHROMADB_AUTH_TOKEN}
      POCKETBASE_URL: http://pocketbase:8090
      POCKETBASE_ADMIN_EMAIL: ${POCKETBASE_ADMIN_EMAIL}
      POCKETBASE_ADMIN_PASSWORD: ${POCKETBASE_ADMIN_PASSWORD}
      N8N_URL: http://n8n:5678
      N8N_API_KEY: ${N8N_API_KEY}
      VFS_DB_PATH: /data/vfs.db
      PYTHONUNBUFFERED: '1'
    expose:
      - '8000'
    volumes:
      - api_data:/data
    depends_on:
      pocketbase:
        condition: service_healthy
    networks:
      - coolify

  pocketbase:
    image: ghcr.io/muchobien/pocketbase:latest
    environment:
      SERVICE_FQDN_POCKETBASE_8090: ''
    expose:
      - '8090'
    volumes:
      - pocketbase_data:/pb_data
      - pocketbase_public:/pb_public
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://127.0.0.1:8090/api/health"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - coolify

networks:
  coolify:
    external: true

volumes:
  pocketbase_data:
  pocketbase_public:
  api_data:
```

Note: Ollama, ChromaDB, n8n, and Open WebUI are managed as separate Coolify services on the same VPS. They share the `coolify` Docker network and are addressable by container name.

---

## Appendix C: File Tree Summary (What Changes)

> **Labels corrected** to reflect actual codebase state (Feb 2026 audit).
> KEEP = file exists and works, no changes needed. MODIFY = file exists, needs targeted changes.
> ACTIVATE = file exists but is not mounted/wired. NEW = file does not exist yet. REWRITE = file exists but needs fundamental rework.

```
apps/python-backend/src/
  main.py                      MODIFY  (mount vfs + pocketbase routers, fix CORS methods, fix Docker import path)
  routers/
    chat.py                    MODIFY  (already uses Anthropic via ai.py; add session persistence + PocketBase writes)
    vfs.py                     ACTIVATE (14 endpoints exist, not mounted in main.py; add delta-sync endpoint)
    pocketbase.py              ACTIVATE (8 endpoints exist, not mounted in main.py)
    knowledge.py               MODIFY  (exists with /search + /context; add /index trigger + /status)
    vps.py                     MODIFY  (exists with /health + /metrics; add /services breakdown)
    agents.py                  MODIFY  (exists with /run SSE; align event format with unified spec)
    contact.py                 NEW     (extracted from pocketbase.py proxy)
    content.py                 NEW     (blog + project enrichment endpoints)
  services/
    ai.py                      KEEP    (already has Anthropic SDK + 3-tier fallback via CF Gateway)
    rag.py                     KEEP    (already has ChromaDB client with retrieve() + build_context())
    vps_monitor.py             KEEP    (already has psutil + Docker + Ollama metric collection)
    agent_executor.py          MODIFY  (exists with Claude tool-use loop + 4 tools; add persistent memory + more tools)
    indexer.py                 NEW     (document processing pipeline for Obsidian/blog/projects)
    embeddings.py              NEW     (ONNX embedding generation -- or use ChromaDB default embeddings)
  models/
    chat.py                    NEW     (Pydantic models)
    knowledge.py               NEW
    agents.py                  NEW
    vps.py                     NEW
  scripts/
    index-vault-chromadb.py    NEW     (CLI script: git-pull Obsidian vault -> chunk -> embed -> ChromaDB)

apps/desktop/src/lib/core/
  agents/
    runtime.svelte.ts          MODIFY  (connect runAutonomousLoop to /api/agents/run SSE)
    tools.ts                   SPLIT   (-> client-tools.ts + server-tools.ts)
  pocketbase/
    types.ts                   MODIFY  (add chat_sessions, chat_messages, agent_configs, knowledge_sources)
    client.ts                  MODIFY  (add typed accessors for new collections)
  vfs/
    vfs.svelte.ts              MODIFY  (implement sync() stub with delta-sync)
    proc.ts                    MODIFY  (add /proc/vps/* entries backed by API polling)

apps/desktop/plugins/
  ai-chat/src/AIChat.svelte    REWRITE (currently hits OpenAI via SvelteKit; needs Anthropic gateway + sessions + RAG toggle)
  knowledge-base/src/          REWRITE (currently IndexedDB-only local notes; needs RAG search + graph visualization)
  terminal/src/                REWRITE (hardcoded mock fs; needs to use VFS + real command execution)
  system-monitor/src/          MODIFY  (add Server tab with VPS metrics alongside existing browser metrics)
  agent-manager/src/           MODIFY  (connect to /api/agents/run for server-side execution)
  file-browser/src/            KEEP    (already uses VFS + EventBus correctly)
  blog/src/                    MODIFY  (use /api/content/blog for enriched data; currently falls back to samples)
  project-gallery/src/         MODIFY  (add GitHub stats via /api/content/projects)
  contact/src/                 MODIFY  (use /api/contact instead of direct PocketBase)

apps/desktop/src/routes/api/
  ai/stream/+server.ts         KEEP-THEN-DELETE (keep alive until ai-chat plugin is rewritten in Phase 4)

data/pb_migrations/            NEW     (4 new collections)
```

---

## Appendix D: MRAX Mapping

The architecture follows MRAX at the system level:

| MRAX | System Component | What It Contains |
|------|-----------------|------------------|
| **Model** | PocketBase schema, TypeScript types, VFS types, Agent types | Pure data shapes -- what the system knows |
| **Rules** | Plugin access tiers, capability-based permissions, API rate limits, VFS permissions (mode bits), RAG retrieval logic | Business logic -- how the system decides |
| **Actions** | API Gateway routers, Agent executor, VFS sync, Plugin lifecycle (load/mount/destroy), EventBus/MessageBus dispatch | Mutations -- what the system does |
| **Logs** | chat_messages (conversation history), agent memory, /var/log (VFS logs), /proc (system state), knowledge_sources status | Reflection -- what happened |

The fractal repeats at the plugin level:
```
Plugin (e.g., ai-chat)
  Model:   ChatMessage type, SessionState type
  Rules:   Message validation, token limits, model selection
  Actions: Send message, create session, toggle RAG
  Logs:    Persisted conversation history in PocketBase
```
