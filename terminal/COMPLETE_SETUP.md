# MT5 Trading Terminal - Complete Setup Guide

## 📁 Project Structure

```
trading-terminal/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chart.jsx
│   │   │   ├── OrderPanel.jsx
│   │   │   ├── BacktestPanel.jsx
│   │   │   └── StrategyManager.jsx
│   │   ├── services/
│   │   │   ├── websocket.js
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── index.js
│   ├── public/
│   │   └── index.html
│   └── package.json
├── backend/
│   ├── main.go
│   ├── mt5/
│   │   └── bridge.go
│   ├── websocket/
│   │   └── server.go
│   ├── backtest/
│   │   └── engine.go
│   └── go.mod
├── mt5-bridge/
│   ├── mt5_server.py
│   └── requirements.txt
└── mql5/
    └── DataProvider.mq5
```

## 🚀 Step-by-Step Setup

### Step 1: Create Project Directory

```bash
mkdir trading-terminal
cd trading-terminal
```

### Step 2: Setup Go Backend

```bash
mkdir -p backend/mt5 backend/websocket backend/backtest
cd backend

# Create go.mod
cat > go.mod << 'EOF'
module trading-terminal

go 1.21

require (
	github.com/google/uuid v1.5.0
	github.com/gorilla/websocket v1.5.1
)
EOF

# Install dependencies
go mod download
```

**Copy these files to backend/:**
- `main.go` → backend/main.go
- `bridge.go` → backend/mt5/bridge.go
- `server.go` → backend/websocket/server.go
- `engine.go` → backend/backtest/engine.go

### Step 3: Setup Python MT5 Bridge

```bash
cd ..
mkdir mt5-bridge
cd mt5-bridge

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Create requirements.txt
cat > requirements.txt << 'EOF'
MetaTrader5==5.0.45
pandas==2.0.3
flask==3.0.0
flask-cors==4.0.0
requests==2.31.0
numpy==1.24.3
EOF

# Install dependencies
pip install -r requirements.txt
```

**Copy:** `mt5_server.py` → mt5-bridge/mt5_server.py

### Step 4: Setup React Frontend

```bash
cd ..
npx create-react-app frontend
cd frontend

# Install dependencies
npm install recharts lucide-react
```

**Create directory structure:**
```bash
mkdir -p src/components src/services
```

**Copy these files:**
- `Chart.jsx` → src/components/Chart.jsx
- `OrderPanel.jsx` → src/components/OrderPanel.jsx
- `BacktestPanel.jsx` → src/components/BacktestPanel.jsx
- `StrategyManager.jsx` → src/components/StrategyManager.jsx
- `websocket.js` → src/services/websocket.js
- `api.js` → src/services/api.js
- `App.jsx` → src/App.jsx

**Update src/index.js:**
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Add Tailwind CSS to src/index.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
```

**Install Tailwind (optional, for better styling):**
```bash
npm install -D tailwindcss
npx tailwindcss init

# Create tailwind.config.js
cat > tailwind.config.js << 'EOF'
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF
```

### Step 5: Setup MQL5 (Optional)

```bash
cd ..
mkdir mql5
```

**Copy:** `DataProvider.mq5` → mql5/DataProvider.mq5

Open MT5 MetaEditor:
1. Press F4 in MT5
2. File → Open → Select DataProvider.mq5
3. Compile (F7)
4. Add URL to allowed list: Tools → Options → Expert Advisors → Allow WebRequest for: `http://localhost:8080`

## 🎯 Running the Application

### Terminal 1: Start Go Backend

```bash
cd backend
go run main.go
```

✅ Server running on: `http://localhost:8080`

### Terminal 2: Start Python MT5 Bridge

**Make sure MT5 is running first!**

```bash
cd mt5-bridge
# Activate venv first
python mt5_server.py
```

✅ Bridge running on: `http://localhost:5000`

### Terminal 3: Start React Frontend

```bash
cd frontend
npm start
```

✅ UI opens at: `http://localhost:3000`

## 📋 Verification Checklist

1. **Backend Health Check:**
```bash
curl http://localhost:8080/health
# Should return: {"status":"healthy","mt5_bridge":true,...}
```

2. **Python Bridge Health:**
```bash
curl http://localhost:5000/health
# Should return: {"status":"healthy","connected":true,...}
```

3. **Get MT5 Data:**
```bash
curl "http://localhost:5000/rates?symbol=EURUSD&timeframe=M5&count=10"
# Should return array of candles
```

## 🎮 Using the Terminal

1. **Connect**: System auto-connects when all services are running
2. **Change Symbol**: Use dropdown to switch between EUR/USD, GBP/USD, etc.
3. **Change Timeframe**: Select M1, M5, H1, etc.
4. **Place Orders**: Use the Order Panel on the right
5. **Run Backtest**: 
   - Upload or paste MQL5 strategy code
   - Set date range
   - Click "Run Backtest"

## 🐛 Troubleshooting

### "WebSocket connection failed"
- Check if Go backend is running on port 8080
- Check browser console for errors

### "MT5 not connected"
- Make sure MT5 terminal is running
- Check Python bridge logs
- Verify MetaTrader5 package: `pip list | grep MetaTrader5`

### "No data showing in chart"
- Check if Python bridge is connected to MT5
- Verify symbol is available in MT5 Market Watch
- Check browser network tab for WebSocket messages

### "Cannot place orders"
- This is normal - order placement requires MT5 connection
- Check if you're logged into a trading account in MT5

## 📝 Development Notes

### Adding New Features

1. **New Indicator**: Add to `backtest/engine.go`
2. **New Order Type**: Modify `websocket/server.go`
3. **New UI Component**: Add to `frontend/src/components/`

### File Upload for Strategies

The BacktestPanel accepts `.mq5` files. Example strategy:

```mql5
//+------------------------------------------------------------------+
//| Simple MA Crossover Strategy                                      |
//+------------------------------------------------------------------+
input int FastMA = 10;
input int SlowMA = 20;

void OnTick()
{
   double fast = iMA(_Symbol, _Period, FastMA, 0, MODE_SMA, PRICE_CLOSE);
   double slow = iMA(_Symbol, _Period, SlowMA, 0, MODE_SMA, PRICE_CLOSE);
   
   if(fast > slow)
   {
      // Buy signal
      OrderSend(_Symbol, OP_BUY, 0.01, Ask, 3, 0, 0);
   }
   else if(fast < slow)
   {
      // Sell signal
      OrderSend(_Symbol, OP_SELL, 0.01, Bid, 3, 0, 0);
   }
}
```

## 🔐 Security Notes

- This is a development setup - DO NOT use in production without:
  - Authentication
  - HTTPS/WSS
  - API rate limiting
  - Input validation
  - Error handling improvements

## 📚 Additional Resources

- Go WebSocket: https://github.com/gorilla/websocket
- MetaTrader5 Python: https://www.mql5.com/en/docs/integration/python_metatrader5
- React Recharts: https://recharts.org/
- MQL5 Reference: https://www.mql5.com/en/docs

## ✅ Success Indicators

You've set everything up correctly when you see:

1. ✅ Green "Connected" badge in UI header
2. ✅ Real-time price updates in chart
3. ✅ Account balance showing in header
4. ✅ All three servers running without errors
5. ✅ Can upload and save strategies

## 🎉 You're Ready!

Your MT5 trading terminal is now fully operational. Start by:
1. Watching the live price chart
2. Uploading a simple strategy
3. Running your first backtest
4. Analyzing the results

Good luck with your trading!