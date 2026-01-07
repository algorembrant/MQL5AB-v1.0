# ✅ MQL5 Algo Bot Builder - Setup Checklist

Use this checklist to verify your installation is complete and working correctly.

## 📋 Pre-Installation Checklist

- [ ] MetaTrader 5 installed and running
- [ ] Logged into Exness account in MT5
- [ ] Python 3.10+ installed (`python --version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] PostgreSQL 15+ or Docker installed
- [ ] Git installed (`git --version`)
- [ ] Code editor installed (VS Code recommended)

---

## 📁 File Structure Checklist

### Backend Files
- [ ] `backend/app/__init__.py` (empty)
- [ ] `backend/app/main.py` (FastAPI entry)
- [ ] `backend/app/config.py` (configuration)
- [ ] `backend/app/database.py` (models)
- [ ] `backend/app/api/__init__.py` (empty)
- [ ] `backend/app/api/routes.py` (endpoints)
- [ ] `backend/app/services/__init__.py` (empty)
- [ ] `backend/app/services/mt5_service.py`
- [ ] `backend/app/services/mql5_generator.py`
- [ ] `backend/app/services/backtest_engine.py`
- [ ] `backend/migrations/init_db.sql`
- [ ] `backend/requirements.txt`
- [ ] `backend/.env` (copied from .env.example)

### Frontend Files
- [ ] `frontend/public/index.html`
- [ ] `frontend/src/index.js`
- [ ] `frontend/src/index.css`
- [ ] `frontend/src/App.jsx`
- [ ] `frontend/src/components/Chart.jsx`
- [ ] `frontend/src/components/DrawingTools.jsx`
- [ ] `frontend/src/components/StrategyBuilder.jsx`
- [ ] `frontend/src/components/BacktestPanel.jsx`
- [ ] `frontend/src/components/CodePreview.jsx`
- [ ] `frontend/src/services/api.js`
- [ ] `frontend/src/services/websocket.js`
- [ ] `frontend/src/styles/terminal.css`
- [ ] `frontend/package.json`
- [ ] `frontend/vite.config.js`
- [ ] `frontend/tailwind.config.js`
- [ ] `frontend/postcss.config.js`

### Root Files
- [ ] `docker-compose.yml`
- [ ] `.gitignore`
- [ ] `QUICKSTART.sh` (Linux/Mac)
- [ ] `QUICKSTART.bat` (Windows)
- [ ] `README.md`

---

## 🔧 Installation Checklist

### Backend Setup
- [ ] Created virtual environment (`python -m venv venv`)
- [ ] Activated virtual environment
- [ ] Installed dependencies (`pip install -r requirements.txt`)
- [ ] Created `.env` file from `.env.example`
- [ ] Verified DATABASE_URL in `.env`

### Database Setup
- [ ] PostgreSQL is running (Docker or native)
- [ ] Database `mql5_algobot` exists
- [ ] Can connect: `psql -h localhost -U postgres -d mql5_algobot`
- [ ] Tables created (happens on first backend start)

### Frontend Setup
- [ ] Installed Node dependencies (`npm install`)
- [ ] `node_modules` folder exists
- [ ] All package.json dependencies installed
- [ ] No vulnerability warnings (or acceptable)

---

## 🚀 Runtime Checklist

### Backend Running
- [ ] Virtual environment activated
- [ ] Backend starts without errors: `python -m app.main`
- [ ] Server listening on port 8000
- [ ] Health check passes: `curl http://localhost:8000/health`
- [ ] API docs accessible: http://localhost:8000/docs
- [ ] MT5 connection successful (check logs)

### Frontend Running
- [ ] Development server starts: `npm run dev`
- [ ] Server listening on port 3000
- [ ] No compilation errors
- [ ] Browser opens automatically
- [ ] Loading screen appears then disappears

### MT5 Integration
- [ ] MT5 is running
- [ ] Logged into broker account
- [ ] Python can access MT5 (check backend logs)
- [ ] Account info displays in header
- [ ] Green "MT5: Connected" indicator shows

---

## 🧪 Functional Testing Checklist

### Basic Functionality
- [ ] Application loads without errors
- [ ] Header displays correctly
- [ ] MT5 status shows "Connected"
- [ ] Sidebar controls are responsive
- [ ] Tabs switch correctly (Build, Backtest, Code)

### Data Loading
- [ ] Symbol input accepts text (e.g., EURUSD)
- [ ] Timeframe selector has options
- [ ] "Load Data" button is clickable
- [ ] Chart loads with candlesticks
- [ ] Volume bars appear below chart
- [ ] Chart is interactive (zoom, pan)

### Drawing Tools
- [ ] "Horizontal Line" button activates
- [ ] Cursor changes to crosshair
- [ ] Click on chart places line
- [ ] Line appears on chart
- [ ] Element shows in "Active Elements" list
- [ ] Can delete elements

### Strategy Creation
- [ ] Strategy name input works
- [ ] Description textarea works
- [ ] Symbol and timeframe set
- [ ] Risk % slider adjusts
- [ ] Stop loss input accepts numbers
- [ ] Take profit input accepts numbers
- [ ] "Create Strategy" button enables with valid data
- [ ] Strategy creation succeeds
- [ ] Success message appears

### Backtesting
- [ ] "Run Backtest" button enables after strategy creation
- [ ] Backtest executes without errors
- [ ] Results display in cards:
  - [ ] P&L shows
  - [ ] Win Rate displays
  - [ ] Total Trades count
  - [ ] Profit Factor shown
- [ ] Performance metrics populated
- [ ] Trade history table shows (if trades exist)

### Code Generation
- [ ] "MQL5 Code" tab loads
- [ ] Code displays in preview
- [ ] Code has line numbers
- [ ] Syntax highlighting works
- [ ] "Copy" button works
- [ ] "Download .mq5" button works
- [ ] Downloaded file opens in text editor
- [ ] Code compiles in MetaEditor without errors

---

## 🔍 Verification Tests

### API Endpoints Test
```bash
# Health check
curl http://localhost:8000/health

# MT5 status
curl http://localhost:8000/api/mt5/status

# List symbols
curl http://localhost:8000/api/mt5/symbols

# List strategies
curl http://localhost:8000/api/strategies
```

Expected: All return JSON responses without errors

### Database Connection Test
```bash
# Connect to database
psql -h localhost -U postgres -d mql5_algobot

# Inside psql:
\dt  # List tables
SELECT * FROM strategies LIMIT 1;
\q   # Quit
```

Expected: Tables exist (strategies, backtests, market_data, etc.)

### Python MT5 Connection Test
```python
# Run in Python shell with venv activated
import MetaTrader5 as mt5

# Initialize
if mt5.initialize():
    print("✅ MT5 Connected")
    print(f"Account: {mt5.account_info().login}")
    mt5.shutdown()
else:
    print("❌ MT5 Connection Failed")
```

Expected: "✅ MT5 Connected" with account number

---

## 🎯 Feature Verification

### Chart Features
- [ ] Candlestick chart displays
- [ ] Volume histogram shows
- [ ] Crosshair works
- [ ] Zoom in/out functional
- [ ] Time axis shows dates/times
- [ ] Price axis shows values
- [ ] Chart responsive to resize

### Drawing Features
- [ ] Can draw horizontal lines
- [ ] Lines persist after drawing
- [ ] Can select entry action
- [ ] Multiple lines allowed
- [ ] Can delete individual lines
- [ ] Can clear all lines
- [ ] Lines show on chart with colors

### Strategy Features
- [ ] Risk calculation works
- [ ] Position sizing calculates
- [ ] R:R ratio displays
- [ ] Risk warning shows for high %
- [ ] Multiple strategies can be saved
- [ ] Strategies persist in database

### Backtest Features
- [ ] Executes on historical data
- [ ] Processes all candles
- [ ] Calculates metrics correctly
- [ ] Shows equity curve data
- [ ] Lists all trades
- [ ] Shows entry/exit reasons
- [ ] Performance metrics accurate

### Code Features
- [ ] MQL5 code is valid
- [ ] No MT4 functions used
- [ ] Compiles without errors
- [ ] Includes risk management
- [ ] Has proper headers
- [ ] Comments are clear
- [ ] Code is well-formatted

---

## 🚨 Error Checks

### No Errors In:
- [ ] Browser console (F12)
- [ ] Backend terminal
- [ ] Frontend terminal
- [ ] PostgreSQL logs
- [ ] MT5 terminal (Experts tab)

### Performance:
- [ ] Frontend loads in < 3 seconds
- [ ] Chart renders smoothly
- [ ] API responses < 1 second
- [ ] Backtest executes < 10 seconds (30 days)
- [ ] No memory leaks
- [ ] No excessive CPU usage

---

## ✨ Optional Enhancements

- [ ] WebSocket connects successfully
- [ ] Real-time price updates work
- [ ] Account info updates in real-time
- [ ] Multiple symbols supported
- [ ] Strategy templates available
- [ ] Export backtest results
- [ ] Strategy comparison feature

---

## 📝 Final Verification

### Complete Test Workflow:
1. [ ] Start all services (database, backend, frontend)
2. [ ] Check MT5 connection status
3. [ ] Load chart data for EURUSD H1
4. [ ] Draw horizontal line at current price + 50 pips
5. [ ] Set entry action to "Buy Above"
6. [ ] Configure risk: 2%, SL: 50, TP: 100
7. [ ] Create strategy named "Test Strategy"
8. [ ] Run backtest
9. [ ] Verify results display
10. [ ] Download MQL5 code
11. [ ] Compile in MetaEditor
12. [ ] Attach to MT5 chart
13. [ ] Verify EA runs without errors

If ALL steps complete successfully: **✅ Installation Verified!**

---

## 🆘 If Any Step Fails

1. **Check this checklist** for missed steps
2. **Review logs** (backend, frontend, database)
3. **Consult troubleshooting** section in main README
4. **Verify versions** of Python, Node, PostgreSQL
5. **Test individual components** in isolation
6. **Search error messages** online
7. **Create GitHub issue** with detailed error logs

---

## 🎉 Success Criteria

Your installation is successful when:
- ✅ All services start without errors
- ✅ MT5 connects automatically
- ✅ Chart loads and displays data
- ✅ Can create and save strategies
- ✅ Backtests run and show results
- ✅ MQL5 code generates and compiles
- ✅ EA runs in MT5 without errors

**Congratulations! You're ready to build algorithmic trading strategies!** 🚀

---

## 📊 Performance Benchmarks

Your setup should meet these benchmarks:
- Frontend load time: < 3 seconds
- Chart render time: < 1 second
- API response time: < 500ms
- Backtest execution (30 days H1): < 10 seconds
- Code generation: < 1 second
- Database query time: < 100ms

If performance is slower, check:
- System resources (CPU, RAM)
- Database optimization
- Network latency
- MT5 data availability