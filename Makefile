# ==============================================
# rdtect OS - Makefile
# ==============================================

.PHONY: dev dev-docker dev-services dev-full build build-docker \
        start stop preview clean check typecheck db-admin db-backup help

.DEFAULT_GOAL := help

# --- Development ---

dev: ## Start frontend dev server (bun)
	bun run dev

dev-services: ## Start PocketBase + Python backend
	docker compose up pocketbase python-backend

dev-full: ## Start full stack in Docker
	docker compose --profile full up

dev-all: ## Start everything including federation apps
	docker compose --profile all up

# --- Build ---

build: ## Build frontend for production
	bun run build

build-docker: ## Build Docker images for production
	docker compose -f docker-compose.prod.yml build

# --- Production ---

start: ## Start production stack (detached)
	docker compose -f docker-compose.prod.yml up -d

stop: ## Stop production stack
	docker compose -f docker-compose.prod.yml down

preview: ## Preview production build locally
	bun run preview

# --- Database ---

db-admin: ## Open PocketBase admin panel URL
	@echo "Open http://localhost:8090/_/ in your browser"

db-backup: ## Create PocketBase backup
	docker compose exec pocketbase ./pocketbase backup

# --- Quality ---

check: ## Run Svelte type checking
	bun run check

typecheck: ## Run TypeScript type checking
	bun run typecheck

clean: ## Clean build artifacts and caches
	bun run clean

install: ## Install dependencies
	bun install

# --- Help ---

help: ## Show this help
	@echo "rdtect OS — Available Commands"
	@echo "=============================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
