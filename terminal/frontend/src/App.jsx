import React, { useState, useEffect } from 'react';
import { Activity, Settings, TrendingUp } from 'lucide-react';
import Chart from './components/Chart';
import OrderPanel from './components/OrderPanel';
import BacktestPanel from './components/BacktestPanel';
import StrategyManager from './components/StrategyManager';
import websocketService from './services/websocket';
import apiService from './services/api';

function App() {
  const [connected, setConnected] = useState(false);
  const [symbol, setSymbol] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState('M5');
  const [chartData, setChartData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [accountInfo, setAccountInfo] = useState(null);
  const [positions, setPositions] = useState([]);
  const [backtestResults, setBacktestResults] = useState(null);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [strategyCode, setStrategyCode] = useState('');

  useEffect(() => {
    // Connect to WebSocket
    websocketService.connect();

    // Setup listeners
    websocketService.on('connected', (status) => {
      setConnected(status);
      if (status) {
        websocketService.subscribe(symbol, timeframe);
        loadInitialData();
      }
    });

    websocketService.on('tick', (data) => {
      setChartData(prev => {
        const newData = [...prev, {
          time: data.time,
          open: data.open || data.price,
          high: data.high || data.price,
          low: data.low || data.price,
          close: data.close || data.price,
        }];
        return newData.slice(-100);
      });
      setCurrentPrice(data.close || data.price);
    });

    websocketService.on('candles', (data) => {
      if (data.data && Array.isArray(data.data)) {
        setChartData(data.data.slice(-100));
      }
    });

    websocketService.on('backtest_result', (data) => {
      setBacktestResults(data.results);
      setIsBacktesting(false);
    });

    websocketService.on('account', (data) => {
      setAccountInfo(data);
    });

    websocketService.on('positions', (data) => {
      if (data.data) {
        setPositions(data.data);
      }
    });

    return () => {
      websocketService.disconnect();
    };
  }, []);

  const loadInitialData = async () => {
    try {
      const [rates, account, positionsData] = await Promise.all([
        apiService.getRates(symbol, timeframe, 100),
        apiService.getAccountInfo(),
        apiService.getPositions(),
      ]);

      if (rates && Array.isArray(rates)) {
        const formattedRates = rates.map(r => ({
          time: new Date(r.time).getTime(),
          open: r.open,
          high: r.high,
          low: r.low,
          close: r.close,
        }));
        setChartData(formattedRates);
        if (formattedRates.length > 0) {
          setCurrentPrice(formattedRates[formattedRates.length - 1].close);
        }
      }

      setAccountInfo(account);
      setPositions(positionsData);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const handleSymbolChange = (newSymbol) => {
    setSymbol(newSymbol);
    setChartData([]);
    websocketService.subscribe(newSymbol, timeframe);
    apiService.getRates(newSymbol, timeframe, 100).then(rates => {
      if (rates && Array.isArray(rates)) {
        const formattedRates = rates.map(r => ({
          time: new Date(r.time).getTime(),
          open: r.open,
          high: r.high,
          low: r.low,
          close: r.close,
        }));
        setChartData(formattedRates);
      }
    });
  };

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
    setChartData([]);
    websocketService.subscribe(symbol, newTimeframe);
  };

  const handlePlaceOrder = async (orderData) => {
    try {
      websocketService.placeOrder(orderData);
      alert('Order placed successfully!');
    } catch (error) {
      alert('Failed to place order: ' + error.message);
    }
  };

  const handleRunBacktest = (params) => {
    setIsBacktesting(true);
    setBacktestResults(null);
    websocketService.runBacktest({
      symbol,
      timeframe,
      ...params,
    });
  };

  const handleStrategyChange = (code) => {
    setStrategyCode(code);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <TrendingUp className="w-8 h-8 text-blue-500" />
            <h1 className="text-2xl font-bold">MT5 Trading Terminal</h1>
            <div className={`flex items-center gap-2 px-3 py-1 rounded ${
              connected ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
            }`}>
              <Activity className={`w-4 h-4 ${connected ? 'animate-pulse' : ''}`} />
              {connected ? 'Connected' : 'Disconnected'}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {accountInfo && (
              <div className="flex items-center gap-4 px-4 py-2 bg-gray-700 rounded">
                <div>
                  <div className="text-xs text-gray-400">Balance</div>
                  <div className="text-sm font-bold">${accountInfo.balance?.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Equity</div>
                  <div className="text-sm font-bold">${accountInfo.equity?.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Profit</div>
                  <div className={`text-sm font-bold ${
                    accountInfo.profit >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    ${accountInfo.profit?.toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            <select
              value={symbol}
              onChange={(e) => handleSymbolChange(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-4 py-2"
            >
              <option value="EURUSD">EUR/USD</option>
              <option value="GBPUSD">GBP/USD</option>
              <option value="USDJPY">USD/JPY</option>
              <option value="AUDUSD">AUD/USD</option>
              <option value="XAUUSD">XAU/USD</option>
            </select>

            <select
              value={timeframe}
              onChange={(e) => handleTimeframeChange(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-4 py-2"
            >
              <option value="M1">M1</option>
              <option value="M5">M5</option>
              <option value="M15">M15</option>
              <option value="M30">M30</option>
              <option value="H1">H1</option>
              <option value="H4">H4</option>
              <option value="D1">D1</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-4 gap-6">
          {/* Chart - Takes 3 columns */}
          <div className="col-span-3">
            <Chart 
              data={chartData} 
              symbol={symbol} 
              timeframe={timeframe}
            />

            {/* Positions Table */}
            {positions.length > 0 && (
              <div className="mt-6 bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Open Positions</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-gray-400 border-b border-gray-700">
                      <tr>
                        <th className="text-left py-2">Ticket</th>
                        <th className="text-left py-2">Symbol</th>
                        <th className="text-left py-2">Type</th>
                        <th className="text-right py-2">Volume</th>
                        <th className="text-right py-2">Open Price</th>
                        <th className="text-right py-2">Current</th>
                        <th className="text-right py-2">Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map((pos) => (
                        <tr key={pos.ticket} className="border-b border-gray-700">
                          <td className="py-2">{pos.ticket}</td>
                          <td className="py-2">{pos.symbol}</td>
                          <td className="py-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              pos.type === 'BUY' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                            }`}>
                              {pos.type}
                            </span>
                          </td>
                          <td className="text-right py-2">{pos.volume}</td>
                          <td className="text-right py-2">{pos.price_open?.toFixed(5)}</td>
                          <td className="text-right py-2">{pos.price_current?.toFixed(5)}</td>
                          <td className={`text-right py-2 font-bold ${
                            pos.profit >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            ${pos.profit?.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - 1 column */}
          <div className="space-y-6">
            <OrderPanel
              symbol={symbol}
              currentPrice={currentPrice}
              onPlaceOrder={handlePlaceOrder}
            />
          </div>
        </div>

        {/* Bottom Section - Strategy & Backtest */}
        <div className="grid grid-cols-2 gap-6 mt-6">
          <StrategyManager onStrategyChange={handleStrategyChange} />
          <BacktestPanel
            onRunBacktest={handleRunBacktest}
            results={backtestResults}
            isRunning={isBacktesting}
          />
        </div>
      </div>
    </div>
  );
}

export default App;