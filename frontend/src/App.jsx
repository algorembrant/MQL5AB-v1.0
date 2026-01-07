import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Activity } from 'lucide-react';
import Chart from './components/Chart';
import DrawingTools from './components/DrawingTools';
import StrategyBuilder from './components/StrategyBuilder';
import BacktestPanel from './components/BacktestPanel';
import CodePreview from './components/CodePreview';
import { mt5Service, strategyService, backtestService, healthCheck } from './services/api';
import wsService from './services/websocket';
import './styles/terminal.css';

function App() {
  // State Management
  const [mt5Status, setMt5Status] = useState({ connected: false });
  const [chartData, setChartData] = useState([]);
  const [symbolInfo, setSymbolInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('build');

  // Strategy State
  const [strategies, setStrategies] = useState([]);
  const [currentStrategy, setCurrentStrategy] = useState(null);
  const [strategyForm, setStrategyForm] = useState({
    name: '',
    description: '',
    symbol: 'EURUSD',
    timeframe: 'H1'
  });

  // Drawing State
  const [drawingMode, setDrawingMode] = useState(null);
  const [visualElements, setVisualElements] = useState([]);
  const [entryRules, setEntryRules] = useState({ type: 'buy_above' });
  const [exitRules, setExitRules] = useState({ 
    stop_loss_pips: 50, 
    take_profit_pips: 100 
  });
  const [riskManagement, setRiskManagement] = useState({ risk_percent: 2.0 });

  // Results State
  const [backtestResults, setBacktestResults] = useState(null);
  const [mql5Code, setMql5Code] = useState('');

  // Initialize
  useEffect(() => {
    checkMT5Status();
    loadStrategies();
    
    // Setup WebSocket
    wsService.connect();
    wsService.on('connected', () => {
      console.log('WebSocket connected');
    });
    
    return () => {
      wsService.disconnect();
    };
  }, []);

  // Check MT5 connection
  const checkMT5Status = async () => {
    try {
      const status = await mt5Service.getStatus();
      setMt5Status(status);
    } catch (error) {
      console.error('MT5 status check failed:', error);
      setMt5Status({ connected: false });
    }
  };

  // Load historical data
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await mt5Service.getHistoricalData(
        strategyForm.symbol,
        strategyForm.timeframe,
        30
      );
      setChartData(data.data);

      const info = await mt5Service.getSymbolInfo(strategyForm.symbol);
      setSymbolInfo(info);
    } catch (error) {
      alert(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle chart click for drawing
  const handleChartClick = ({ price, time, point }) => {
    if (!drawingMode) return;

    if (drawingMode === 'horizontal_line') {
      const newElement = {
        type: 'horizontal_line',
        price: price,
        action: entryRules.type,
        id: Date.now()
      };
      setVisualElements([...visualElements, newElement]);
      setDrawingMode(null);
    }
  };

  // Create strategy
  const createStrategy = async () => {
    if (!strategyForm.name) {
      alert('Please enter a strategy name');
      return;
    }

    if (visualElements.length === 0) {
      alert('Please add at least one visual element to your strategy');
      return;
    }

    try {
      setLoading(true);
      const result = await strategyService.create({
        ...strategyForm,
        visual_elements: visualElements,
        entry_rules: entryRules,
        exit_rules: exitRules,
        risk_management: riskManagement
      });

      setCurrentStrategy(result);
      setMql5Code(result.mql5_code);
      alert('✅ Strategy created successfully!');
      loadStrategies();
      setActiveTab('code');
    } catch (error) {
      alert(`Failed to create strategy: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Run backtest
  const runBacktest = async () => {
    if (!currentStrategy) {
      alert('Please create a strategy first');
      return;
    }

    if (chartData.length === 0) {
      alert('Please load chart data first');
      return;
    }

    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const result = await backtestService.run({
        strategy_id: currentStrategy.id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        initial_balance: 10000
      });

      setBacktestResults(result.results);
      setActiveTab('backtest');
      alert('✅ Backtest completed!');
    } catch (error) {
      alert(`Backtest failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load strategies
  const loadStrategies = async () => {
    try {
      const data = await strategyService.list();
      setStrategies(data);
    } catch (error) {
      console.error('Failed to load strategies:', error);
    }
  };

  const tabs = [
    { id: 'build', label: 'Build Strategy', icon: '🎨' },
    { id: 'backtest', label: 'Backtest', icon: '📊' },
    { id: 'code', label: 'MQL5 Code', icon: '💻' }
  ];

  return (
    <div className="min-h-screen bg-black text-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 via-black to-gray-900 border-b border-cyan-500/20 px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Activity size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                MQL5 Algo Bot Builder
              </h1>
              <p className="text-sm text-gray-400">Visual Algorithm Construction Terminal</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* MT5 Status */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className={`status-indicator ${mt5Status.connected ? 'online pulse' : 'offline'}`} />
              <span className="text-sm">
                MT5: {mt5Status.connected ? 'Connected' : 'Disconnected'}
              </span>
              <button
                onClick={checkMT5Status}
                className="ml-2 p-1 hover:bg-gray-700 rounded"
                title="Refresh status"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load Data'}
            </button>

            <button
              onClick={createStrategy}
              disabled={loading || !strategyForm.name || visualElements.length === 0}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={18} />
              Create Strategy
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <aside className="w-96 bg-gray-900/50 border-r border-gray-800 overflow-y-auto">
          <div className="p-6 space-y-6">
            <StrategyBuilder
              strategyForm={strategyForm}
              setStrategyForm={setStrategyForm}
              exitRules={exitRules}
              setExitRules={setExitRules}
              riskManagement={riskManagement}
              setRiskManagement={setRiskManagement}
              onSave={createStrategy}
              loading={loading}
            />

            <div className="border-t border-gray-800 pt-6">
              <DrawingTools
                drawingMode={drawingMode}
                setDrawingMode={setDrawingMode}
                visualElements={visualElements}
                setVisualElements={setVisualElements}
                entryRules={entryRules}
                setEntryRules={setEntryRules}
              />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Chart Section */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">
                    {strategyForm.symbol} - {strategyForm.timeframe}
                  </h2>
                  {symbolInfo && (
                    <p className="text-sm text-gray-400 mt-1">
                      Spread: {symbolInfo.spread} | Bid: {symbolInfo.bid} | Ask: {symbolInfo.ask}
                    </p>
                  )}
                </div>
              </div>

              <Chart
                data={chartData}
                visualElements={visualElements}
                onChartClick={handleChartClick}
                drawingMode={drawingMode}
              />
            </div>

            {/* Tabs */}
            <div className="bg-gray-900/50 rounded-lg border border-gray-800 overflow-hidden">
              <div className="flex border-b border-gray-800">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2
                      ${activeTab === tab.id
                        ? 'bg-cyan-500/20 border-b-2 border-cyan-500 text-cyan-400'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                      }
                    `}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'build' && (
                  <div className="text-center py-12">
                    <p className="text-gray-400">
                      Use the sidebar to configure your strategy and draw on the chart above
                    </p>
                  </div>
                )}

                {activeTab === 'backtest' && (
                  <BacktestPanel
                    results={backtestResults}
                    onRun={runBacktest}
                    loading={loading}
                    currentStrategy={currentStrategy}
                  />
                )}

                {activeTab === 'code' && (
                  <CodePreview
                    code={mql5Code}
                    strategyName={strategyForm.name}
                  />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;