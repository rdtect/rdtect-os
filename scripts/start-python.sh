#!/bin/bash

# Python Backend Startup Script for Desktop OS
# This script starts the FastAPI backend for AI Chat

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PYTHON_DIR="$PROJECT_ROOT/apps/python-backend"

echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Desktop OS Python Backend       ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""

# Check if Python backend directory exists
if [ ! -d "$PYTHON_DIR" ]; then
    echo -e "${RED}Error: Python backend directory not found at $PYTHON_DIR${NC}"
    exit 1
fi

cd "$PYTHON_DIR"

# Function to check for Docker
check_docker() {
    if command -v docker &> /dev/null && docker info &> /dev/null; then
        return 0
    fi
    return 1
}

# Function to check for Python/uvicorn
check_python() {
    if command -v python3 &> /dev/null || command -v python &> /dev/null; then
        return 0
    fi
    return 1
}

# Function to run with Docker
run_with_docker() {
    echo -e "${YELLOW}Starting Python backend with Docker...${NC}"

    if [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
        cd "$PROJECT_ROOT"
        docker-compose up python-backend
    elif [ -f "$PYTHON_DIR/Dockerfile" ]; then
        cd "$PYTHON_DIR"
        docker build -t desktop-os-python .
        docker run -it --rm \
            -p 8000:8000 \
            -e OPENAI_API_KEY="${OPENAI_API_KEY:-}" \
            --name desktop-os-python \
            desktop-os-python
    else
        echo -e "${RED}No Docker configuration found${NC}"
        return 1
    fi
}

# Function to run with Python directly
run_with_python() {
    echo -e "${YELLOW}Starting Python backend directly...${NC}"

    # Determine Python command
    if command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
    else
        PYTHON_CMD="python"
    fi

    # Check if virtual environment exists
    if [ -d "venv" ]; then
        echo "Activating virtual environment..."
        source venv/bin/activate
    elif [ -d ".venv" ]; then
        echo "Activating virtual environment..."
        source .venv/bin/activate
    else
        echo -e "${YELLOW}No virtual environment found. Creating one...${NC}"
        $PYTHON_CMD -m venv venv
        source venv/bin/activate

        echo "Installing dependencies..."
        if [ -f "requirements.txt" ]; then
            pip install -r requirements.txt
        else
            pip install fastapi uvicorn openai python-dotenv
        fi
    fi

    # Check for OPENAI_API_KEY
    if [ -z "$OPENAI_API_KEY" ] && [ ! -f ".env" ]; then
        echo -e "${YELLOW}Warning: OPENAI_API_KEY not set.${NC}"
        echo "AI Chat features will not work without it."
        echo "Set it with: export OPENAI_API_KEY=your-key"
        echo ""
    fi

    # Start the server
    echo -e "${GREEN}Starting uvicorn server on http://localhost:8000${NC}"
    echo ""

    if [ -f "main.py" ]; then
        uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    elif [ -f "app/main.py" ]; then
        uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    else
        echo -e "${RED}Error: Could not find main.py${NC}"
        exit 1
    fi
}

# Main logic
echo "Checking available runtimes..."
echo ""

# Parse arguments
USE_DOCKER=false
USE_PYTHON=false

for arg in "$@"; do
    case $arg in
        --docker)
            USE_DOCKER=true
            ;;
        --python)
            USE_PYTHON=true
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --docker    Force using Docker (even if Python is available)"
            echo "  --python    Force using Python directly (even if Docker is available)"
            echo "  --help,-h   Show this help message"
            echo ""
            echo "By default, Docker is preferred if available."
            exit 0
            ;;
    esac
done

# Determine which method to use
if [ "$USE_PYTHON" = true ]; then
    if check_python; then
        run_with_python
    else
        echo -e "${RED}Error: Python not found${NC}"
        exit 1
    fi
elif [ "$USE_DOCKER" = true ]; then
    if check_docker; then
        run_with_docker
    else
        echo -e "${RED}Error: Docker not available${NC}"
        exit 1
    fi
else
    # Auto-detect: prefer Docker
    if check_docker; then
        echo -e "${GREEN}Docker detected${NC}"
        run_with_docker
    elif check_python; then
        echo -e "${GREEN}Python detected${NC}"
        run_with_python
    else
        echo -e "${RED}Error: Neither Docker nor Python found${NC}"
        echo ""
        echo "Please install one of the following:"
        echo "  - Docker: https://docs.docker.com/get-docker/"
        echo "  - Python 3.10+: https://www.python.org/downloads/"
        exit 1
    fi
fi
