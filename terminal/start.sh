#!/bin/bash

echo "🚀 Starting MT5 Trading Terminal..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if MT5 is running (optional)
echo "📊 Checking prerequisites..."

# Check Go
if ! command -v go &> /dev/null; then
    echo -e "${RED}❌ Go is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Go installed${NC}"

# Check Python
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python installed${NC}"

# Check Node
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js installed${NC}"

echo ""
echo "Starting services..."
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start Go backend
echo "🔧 Starting Go backend..."
cd backend
go run main.go > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

sleep 2

# Start Python bridge
echo "🐍 Starting Python MT5 bridge..."
cd mt5-bridge
if [ -d "venv" ]; then
    source venv/bin/activate
fi
python mt5_server.py > ../logs/python.log 2>&1 &
PYTHON_PID=$!
cd ..

sleep 2

# Start React frontend
echo "⚛️  Starting React frontend..."
cd frontend
npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo ""
echo -e "${GREEN}✅ All services started!${NC}"
echo ""
echo "📍 Service URLs:"
echo "   - Frontend:  http://localhost:3000"
echo "   - Backend:   http://localhost:8080"
echo "   - MT5 Bridge: http://localhost:5000"
echo ""
echo "📝 Logs are in ./logs/ directory"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for all background jobs
wait