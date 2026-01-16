## Project Stucture

```
trading-terminal/
├── .gitignore
├── .env.example
├── package.json
├── README.md
├── COMPLETE_SETUP.md
├── FILE_CHECKLIST.md
├── Makefile              
├── start.sh              
├── start.bat             
├── docker-compose.yml    
│
├── frontend/
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── index.js
│       ├── index.css
│       ├── App.jsx
│       ├── components/
│       │   ├── Chart.jsx
│       │   ├── OrderPanel.jsx
│       │   ├── BacktestPanel.jsx
│       │   └── StrategyManager.jsx
│       └── services/
│           ├── websocket.js
│           └── api.js
│
├── backend/
│   ├── go.mod
│   ├── main.go
│   ├── mt5/
│   │   └── bridge.go
│   ├── websocket/
│   │   └── server.go
│   └── backtest/
│       └── engine.go
│
├── mt5-bridge/
│   ├── requirements.txt
│   └── mt5_server.py
│
└── mql5/
    └── DataProvider.mq5
    ```

