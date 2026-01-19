# ==============================================
# rdtect OS - Makefile
# ==============================================
# Common development and build commands

.PHONY: dev dev-docker dev-services dev-full build build-docker build-all \
        start stop preview clean check typecheck db-admin db-backup help

# Default target
.DEFAULT_GOAL := help

# ----------------------------------------------
# Development Commands
# ----------------------------------------------

dev: ## Start frontend development server
	bun run dev

dev-docker: ## Start full dev environment via Docker
	docker compose -f docker-compose.dev.yml up

dev-services: ## Start only backend services (PocketBase + Python)
	docker compose up pocketbase python-backend

dev-full: ## Start full stack with all services
	docker compose -f docker-compose.dev.yml --profile full up

dev-all: ## Start frontend + federation apps
	bun run dev:all

# ----------------------------------------------
# Build Commands
# ----------------------------------------------

build: ## Build frontend for production
	bun run build

build-docker: ## Build Docker images for production
	docker compose -f docker-compose.prod.yml build

build-all: ## Build frontend and all federation apps
	bun run build:all

# ----------------------------------------------
# Production Commands
# ----------------------------------------------

start: ## Start production environment (detached)
	docker compose -f docker-compose.prod.yml up -d

stop: ## Stop production environment
	docker compose -f docker-compose.prod.yml down

preview: ## Preview production build locally
	bun run preview

# ----------------------------------------------
# Database Commands
# ----------------------------------------------

db-admin: ## Open PocketBase admin panel URL
	@echo "Open http://localhost:8090/_/ in your browser"

db-backup: ## Create PocketBase backup
	docker compose exec pocketbase ./pocketbase backup

# ----------------------------------------------
# Quality & Utilities
# ----------------------------------------------

check: ## Run Svelte type checking
	bun run check

typecheck: ## Run TypeScript type checking
	bun run typecheck

clean: ## Clean build artifacts and caches
	bun run clean

install: ## Install dependencies
	bun install

# ----------------------------------------------
# Federation Apps
# ----------------------------------------------

dev-excalidraw: ## Start Excalidraw remote app
	bun run dev:excalidraw

build-excalidraw: ## Build Excalidraw remote app
	bun run build:excalidraw

dev-ai-chat: ## Start AI Chat remote app
	bun run dev:ai-chat

build-ai-chat: ## Build AI Chat remote app
	bun run build:ai-chat

dev-prompt-manager: ## Start Prompt Manager remote app
	bun run dev:prompt-manager

build-prompt-manager: ## Build Prompt Manager remote app
	bun run build:prompt-manager

# ----------------------------------------------
# Help
# ----------------------------------------------

help: ## Show this help message
	@echo "rdtect OS - Available Commands"
	@echo "=============================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
