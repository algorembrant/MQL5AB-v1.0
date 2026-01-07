# 🚀 MQL5 Algo Bot Builder - Complete Setup Guide

## 🔧 Prerequisites

### Required Software
- **MetaTrader 5** (running with Exness account)
- **Python 3.10+** with pip
- **Node.js 18+** with npm
- **PostgreSQL 15+**
- **Git**
- **Docker** (optional, for easier PostgreSQL setup)

### For GitHub Codespaces
- All except MT5 are pre-installed
- MT5 must run on your local machine

---

## 📁 Project Structure

```
mql5-algo-builder/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI entry point
│   │   ├── config.py                  # Configuration
│   │   ├── database.py                # Database models
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes.py              # API endpoints
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── mt5_service.py         # MT5 integration
│   │       ├── mql5_generator.py      # Code generator
│   │       └── backtest_engine.py     # Backtesting
│   ├── migrations/
│   │   └── init_db.sql                # Database schema
│   ├── requirements.txt               # Python dependencies
│   └── .env.example
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chart.jsx              # Chart component
│   │   │   ├── DrawingTools.jsx       # Drawing interface
│   │   │   ├── StrategyBuilder.jsx    # Strategy config
│   │   │   ├── BacktestPanel.jsx      # Results display
│   │   │   └── CodePreview.jsx        # MQL5 code viewer
│   │   ├── services/
│   │   │   ├── api.js                 # API client
│   │   │   └── websocket.js           # WebSocket client
│   │   ├── styles/
│   │   │   └── terminal.css           # Terminal styling
│   │   ├── App.jsx                    # Main component
│   │   ├── index.js                   # React entry
│   │   └── index.css                  # Global styles
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── docker-compose.yml                 # PostgreSQL container
├── QUICKSTART.sh                      # Linux/Mac setup script
├── QUICKSTART.bat                     # Windows setup script
├── .gitignore
└── README.md
```

---

## 🛠️ Installation Steps

### Step 1: Clone/Create Project

#### In GitHub Codespaces:
```bash
# Create new Codespace from repository
# Or clone if working locally
git clone https://github.com/yourusername/mql5-algo-builder.git
cd mql5-algo-builder
```

### Step 2: Create All Files

Create the directory structure as shown above, then add all the code from the artifacts:

#### Backend Files:

**`backend/app/__init__.py`** (empty file)

**`backend/app/main.py`** - Copy from "main.py - FastAPI Application Entry Point" artifact

**`backend/app/config.py`** - Copy from "config.py - Backend Configuration" artifact

**`backend/app/database.py`** - Copy from "database.py & models/strategy.py" artifact

**`backend/app/api/__init__.py`** (empty file)

**`backend/app/api/routes.py`** - Copy from "routes.py - API Endpoints" artifact

**`backend/app/services/__init__.py`** (empty file)

**`backend/app/services/mt5_service.py`** - Copy from "mt5_service.py" artifact

**`backend/app/services/mql5_generator.py`** - Copy from "mql5_generator.py" artifact

**`backend/app/services/backtest_engine.py`** - Copy from "backtest_engine.py" artifact

**`backend/migrations/init_db.sql`** - Copy from "init_db.sql" artifact

**`backend/requirements.txt`** - Copy from "requirements.txt" artifact

**`backend/.env.example`**:
```env
APP_NAME=MQL5 Algo Bot Builder
DEBUG=True
HOST=0.0.0.0
PORT=8000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mql5_algobot
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

#### Frontend Files:

**`frontend/public/index.html`** - Copy from "index.html" artifact

**`frontend/src/index.js`** - Copy from "index.js" artifact

**`frontend/src/index.css`** - Copy from "index.css" artifact

**`frontend/src/App.jsx`** - Copy from "Complete App.jsx" artifact

**`frontend/src/components/Chart.jsx`** - Copy from "Chart.jsx" artifact

**`frontend/src/components/DrawingTools.jsx`** - Copy from "DrawingTools.jsx" artifact

**`frontend/src/components/StrategyBuilder.jsx`** - Copy from "StrategyBuilder.jsx" artifact

**`frontend/src/components/BacktestPanel.jsx`** - Copy from "BacktestPanel.jsx" artifact

**`frontend/src/components/CodePreview.jsx`** - Copy from "CodePreview.jsx" artifact

**`frontend/src/services/api.js`** - Copy from "api.js" artifact

**`frontend/src/services/websocket.js`** - Copy from "websocket.js" artifact

**`frontend/src/styles/terminal.css`** - Copy from "terminal.css" artifact

**`frontend/package.json`** - Copy from "package.json" artifact

**`frontend/vite.config.js`**, **`tailwind.config.js`**, **`postcss.config.js`** - Copy from config files artifact

#### Root Files:

**`docker-compose.yml`** - Copy from Docker configuration artifact

**`.gitignore`** - Copy from Docker configuration artifact

**`QUICKSTART.sh`** - Copy from QUICKSTART.sh artifact

**`QUICKSTART.bat`** - Copy from QUICKSTART.bat artifact

### Step 3: Automated Setup

#### On Linux/Mac (in Codespaces):
```bash
chmod +x QUICKSTART.sh
./QUICKSTART.sh
```

#### On Windows:
```batch
QUICKSTART.bat
```

### Step 4: Manual Setup (if scripts fail)

#### Backend Setup:
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Linux/Mac)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env
cp .env.example .env
```

#### Database Setup:
```bash
# Start PostgreSQL with Docker
docker-compose up -d postgres

# Wait 5 seconds for PostgreSQL to start
# Database migrations run automatically on first backend start
```

#### Frontend Setup:
```bash
cd frontend

# Install dependencies
npm install
```

---

## 🚀 Running Locally

### Method 1: Automated (Recommended)

#### Linux/Mac:
```bash
./run-all.sh
```

#### Windows:
```batch
run-all.bat
```

### Method 2: Manual (3 Terminals)

#### Terminal 1 - Database:
```bash
docker-compose up postgres
```

#### Terminal 2 - Backend:
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python -m app.main
```

#### Terminal 3 - Frontend:
```bash
cd frontend
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

---

## 🌐 Deployment Guide

### Option 1: Local Backend + Vercel Frontend (Best for MT5 Access)

#### Deploy Frontend to Vercel:
```bash
cd frontend

# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variable in Vercel dashboard:
# VITE_API_URL=http://your-ngrok-url
```

#### Expose Local Backend:
```bash
# Install ngrok
# https://ngrok.com/download

# Expose backend
ngrok http 8000

# Update CORS_ORIGINS in backend/.env with ngrok URL
```

### Option 2: Full Cloud Deployment

#### Backend on Railway.app:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
railway init

# Add PostgreSQL
railway add

# Deploy
railway up

# Set environment variables in Railway dashboard
```

#### Frontend on Vercel:
```bash
cd frontend
vercel --prod

# Set VITE_API_URL to Railway backend URL
```

---

## 📖 Usage Tutorial

### 1. Initial Setup

1. **Start MT5**: Ensure MetaTrader 5 is running and logged into Exness
2. **Check Status**: Look for green "MT5: Connected" indicator in header
3. **Load Data**: Enter symbol (EURUSD), select timeframe (H1), click "Load Data"

### 2. Build Strategy

1. **Name Strategy**: Enter unique strategy name
2. **Add Visual Elements**:
   - Click "Horizontal Line" button
   - Select entry action (Buy Above/Sell Below)
   - Click on chart at desired price level
   - Repeat for multiple levels

3. **Configure Risk**:
   - Set risk % per trade (default: 2%)
   - Set stop loss in pips (e.g., 50)
   - Set take profit in pips (e.g., 100)

4. **Create**: Click "Create Strategy" button

### 3. Backtest Strategy

1. Click "Backtest" tab
2. Click "Run Backtest" button
3. View performance metrics:
   - Final Balance
   - Win Rate
   - Profit Factor
   - Max Drawdown
   - Trade history

### 4. Generate MQL5 Code

1. Click "MQL5 Code" tab
2. Review generated code
3. Click "Download .mq5"
4. Copy to `MT5_DATA_FOLDER/MQL5/Experts/`
5. Open in MetaEditor
6. Compile (F7)
7. Attach to chart in MT5

### 5. Deploy to MT5

1. Open MetaEditor (F4 in MT5)
2. File → Open Data Folder
3. Navigate to `MQL5/Experts/`
4. Paste downloaded .mq5 file
5. Right-click → Compile
6. Check for errors in "Errors" tab
7. Close MetaEditor
8. In MT5: Navigator → Expert Advisors → Your Strategy
9. Drag onto chart
10. Configure inputs, enable AutoTrading

---

## 🐛 Troubleshooting

### MT5 Not Connecting

**Problem**: "MT5: Disconnected" status

**Solutions**:
1. Ensure MT5 is running and logged in
2. Check MetaTrader5 Python package: `pip install MetaTrader5`
3. Run Python as administrator if MT5 is admin
4. Restart both MT5 and backend

### Database Connection Failed

**Problem**: Database errors in backend logs

**Solutions**:
1. Check PostgreSQL is running: `docker-compose ps`
2. Verify DATABASE_URL in `.env`
3. Test connection: `psql -h localhost -U postgres -d mql5_algobot`
4. Restart PostgreSQL: `docker-compose restart postgres`

### Frontend Can't Reach Backend

**Problem**: API errors, network failures

**Solutions**:
1. Verify backend is running on port 8000
2. Check CORS settings in `backend/app/config.py`
3. Test API: `curl http://localhost:8000/health`
4. Check browser console for errors
5. Disable browser extensions (ad blockers)

### Backtest Returns No Data

**Problem**: Backtest fails or returns empty results

**Solutions**:
1. Ensure chart data is loaded first
2. Verify symbol exists in MT5
3. Check date range has trading data
4. Test with different timeframe
5. Check backend logs for errors

### Import Errors

**Problem**: Python module not found errors

**Solutions**:
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt --upgrade
```

### Port Already in Use

**Problem**: Port 8000 or 3000 already occupied

**Solutions**:
```bash
# Find process using port
# Linux/Mac:
lsof -i :8000
kill -9 <PID>

# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or change ports in config
```

### Chart Not Loading

**Problem**: Chart appears empty or blank

**Solutions**:
1. Check browser console for errors
2. Verify data is loaded: Look at network tab
3. Try different symbol or timeframe
4. Clear browser cache
5. Check Lightweight Charts is loaded

---

## 🎯 Best Practices

### Strategy Development
- Start with simple strategies (1-2 conditions)
- Test on demo account first
- Use conservative risk (1-2%)
- Backtest multiple timeframes
- Validate on different symbols

### Risk Management
- Never risk more than 2% per trade
- Use stop losses always
- Maintain 1.5:1 or better R:R ratio
- Diversify across symbols
- Monitor max drawdown

### Code Quality
- Review generated MQL5 code before deployment
- Test in Strategy Tester first
- Keep strategy logic simple
- Document your strategies
- Version control (Git)

### Performance
- Load only necessary data
- Limit backtest date range
- Close unused strategies
- Monitor server resources
- Regular database maintenance

---

## 📚 Additional Resources

- [MQL5 Documentation](https://www.mql5.com/en/docs)
- [MetaTrader 5 Python](https://www.mql5.com/en/docs/integration/python_metatrader5)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Lightweight Charts](https://tradingview.github.io/lightweight-charts/)

---

## 🤝 Support

For issues:
1. Check this troubleshooting section
2. Review API documentation at `/docs`
3. Check MT5 terminal logs
4. Create GitHub issue with full error details

---

## 📄 License

MIT License - See LICENSE file

---

**Built for algorithmic traders who demand precision, speed, and visual clarity** 🚀
