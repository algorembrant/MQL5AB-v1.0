#!/bin/bash

# MQL5 Algo Bot Builder - Quick Start Script
# This script automates the entire setup process

echo "🚀 MQL5 Algo Bot Builder - Quick Start"
echo "======================================"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

command -v python3 >/dev/null 2>&1 || { echo "❌ Python 3 is required but not installed."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed."; exit 1; }

echo "✅ All prerequisites found"
echo ""

# Backend setup
echo "🔧 Setting up backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null

echo "Installing Python dependencies..."
pip install -q -r requirements.txt

if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
fi

echo "✅ Backend setup complete"
echo ""

# Database setup
echo "🗄️  Setting up database..."
cd ..

# Start PostgreSQL
docker-compose up -d postgres

echo "Waiting for PostgreSQL to be ready..."
sleep 5

echo "✅ Database setup complete"
echo ""

# Frontend setup
echo "🎨 Setting up frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies..."
    npm install
fi

# Create index.css if it doesn't exist
if [ ! -f "src/index.css" ]; then
    echo "Creating Tailwind CSS file..."
    cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF
fi

# Create index.html if it doesn't exist
if [ ! -f "index.html" ]; then
    echo "Creating index.html..."
    cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MQL5 Algo Bot Builder</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.js"></script>
  </body>
</html>
EOF
fi

# Create index.js if it doesn't exist
if [ ! -f "src/index.js" ]; then
    echo "Creating index.js..."
    cat > src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF
fi

echo "✅ Frontend setup complete"
echo ""

cd ..

# Create run script
echo "📝 Creating run scripts..."

# Run script for backend
cat > run-backend.sh << 'EOF'
#!/bin/bash
cd backend
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate
python -m app.main
EOF

chmod +x run-backend.sh

# Run script for frontend
cat > run-frontend.sh << 'EOF'
#!/bin/bash
cd frontend
npm run dev
EOF

chmod +x run-frontend.sh

# Combined run script
cat > run-all.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting MQL5 Algo Bot Builder..."
echo ""
echo "Starting backend on http://localhost:8000"
echo "Starting frontend on http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Start backend in background
./run-backend.sh &
BACKEND_PID=$!

# Start frontend in background
./run-frontend.sh &
FRONTEND_PID=$!

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT

wait
EOF

chmod +x run-all.sh

echo "✅ Setup complete!"
echo ""
echo "======================================"
echo "🎉 Installation Successful!"
echo "======================================"
echo ""
echo "📌 IMPORTANT: Make sure MetaTrader 5 is running and connected to Exness"
echo ""
echo "To start the application:"
echo ""
echo "  Option 1 - Start all services:"
echo "    ./run-all.sh"
echo ""
echo "  Option 2 - Start services separately:"
echo "    Terminal 1: ./run-backend.sh"
echo "    Terminal 2: ./run-frontend.sh"
echo ""
echo "  Option 3 - Manual start:"
echo "    Backend:  cd backend && source venv/bin/activate && python -m app.main"
echo "    Frontend: cd frontend && npm run dev"
echo ""
echo "Access the application at: http://localhost:3000"
echo "API documentation at: http://localhost:8000/docs"
echo ""
echo "======================================"
echo ""

# Optional: Ask if user wants to start now
read -p "Would you like to start the application now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ./run-all.sh
fi