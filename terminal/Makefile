.PHONY: help install start stop clean test build

# Variables
BACKEND_DIR = backend
FRONTEND_DIR = frontend
PYTHON_DIR = mt5-bridge

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

install: ## Install all dependencies
	@echo "Installing frontend dependencies..."
	cd $(FRONTEND_DIR) && npm install
	@echo "Installing backend dependencies..."
	cd $(BACKEND_DIR) && go mod download
	@echo "Installing Python dependencies..."
	cd $(PYTHON_DIR) && pip install -r requirements.txt
	@echo "✅ All dependencies installed!"

install-frontend: ## Install frontend dependencies only
	cd $(FRONTEND_DIR) && npm install

install-backend: ## Install backend dependencies only
	cd $(BACKEND_DIR) && go mod download

install-python: ## Install Python dependencies only
	cd $(PYTHON_DIR) && pip install -r requirements.txt

start: ## Start all services (use tmux or screen recommended)
	@echo "Starting services..."
	@echo "Note: Run each in separate terminal:"
	@echo "  Terminal 1: make start-backend"
	@echo "  Terminal 2: make start-python"
	@echo "  Terminal 3: make start-frontend"

start-backend: ## Start Go backend
	cd $(BACKEND_DIR) && go run main.go

start-python: ## Start Python MT5 bridge
	cd $(PYTHON_DIR) && python mt5_server.py

start-frontend: ## Start React frontend
	cd $(FRONTEND_DIR) && npm start

build: ## Build all services
	@echo "Building backend..."
	cd $(BACKEND_DIR) && go build -o bin/server main.go
	@echo "Building frontend..."
	cd $(FRONTEND_DIR) && npm run build
	@echo "✅ Build complete!"

build-backend: ## Build backend only
	cd $(BACKEND_DIR) && go build -o bin/server main.go

build-frontend: ## Build frontend only
	cd $(FRONTEND_DIR) && npm run build

test: ## Run all tests
	@echo "Testing backend..."
	cd $(BACKEND_DIR) && go test ./...
	@echo "Testing frontend..."
	cd $(FRONTEND_DIR) && npm test -- --watchAll=false

test-backend: ## Test backend only
	cd $(BACKEND_DIR) && go test ./...

test-frontend: ## Test frontend only
	cd $(FRONTEND_DIR) && npm test -- --watchAll=false

clean: ## Clean all build artifacts and dependencies
	@echo "Cleaning..."
	rm -rf $(FRONTEND_DIR)/node_modules
	rm -rf $(FRONTEND_DIR)/build
	rm -rf $(BACKEND_DIR)/bin
	rm -rf $(PYTHON_DIR)/venv
	rm -rf $(PYTHON_DIR)/__pycache__
	@echo "✅ Cleaned!"

clean-cache: ## Clean cache files only
	rm -rf $(FRONTEND_DIR)/node_modules/.cache
	rm -rf $(PYTHON_DIR)/__pycache__

logs: ## Create logs directory
	mkdir -p logs

health: ## Check health of all services
	@echo "Checking backend health..."
	@curl -s http://localhost:8080/health || echo "❌ Backend not running"
	@echo ""
	@echo "Checking Python bridge health..."
	@curl -s http://localhost:5000/health || echo "❌ Python bridge not running"

dev: logs ## Start all services in development mode (requires tmux)
	tmux new-session -d -s mt5 'cd $(BACKEND_DIR) && go run main.go | tee ../logs/backend.log' \; \
		split-window -v 'cd $(PYTHON_DIR) && python mt5_server.py | tee ../logs/python.log' \; \
		split-window -h 'cd $(FRONTEND_DIR) && npm start | tee ../logs/frontend.log' \; \
		select-layout even-vertical \; \
		attach

stop: ## Stop all services (tmux session)
	tmux kill-session -t mt5 2>/dev/null || echo "No tmux session found"

docker-build: ## Build Docker images
	docker-compose build

docker-up: ## Start services with Docker
	docker-compose up -d

docker-down: ## Stop Docker services
	docker-compose down

docker-logs: ## View Docker logs
	docker-compose logs -f

format: ## Format code
	cd $(BACKEND_DIR) && go fmt ./...
	cd $(FRONTEND_DIR) && npm run format || echo "Add format script to package.json"

lint: ## Lint code
	cd $(BACKEND_DIR) && go vet ./...
	cd $(FRONTEND_DIR) && npm run lint || echo "Add lint script to package.json"