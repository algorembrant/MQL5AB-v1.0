import React, { useState } from 'react';
import { Play, Pause, BarChart2, Calendar } from 'lucide-react';

const BacktestPanel = ({ onRunBacktest, results, isRunning }) => {
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  const [initialBalance, setInitialBalance] = useState(10000);
  const [strategyFile, setStrategyFile] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.mq5')) {
      setStrategyFile(file);
    } else {
      alert('Please upload a valid .mq5 file');
    }
  };

  const handleRunBacktest = () => {
    if (!strategyFile) {
      alert('Please upload a strategy file first');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const strategyCode = e.target.result;
      onRunBacktest({
        strategyCode,
        startDate,
        endDate,
        initialBalance,
      });
    };
    reader.readAsText(strategyFile);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <BarChart2 className="w-5 h-5" />
        Backtesting Engine
      </h3>

      {/* Strategy File Upload */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Upload MQ5 Strategy
        </label>
        <div className="relative">
          <input
            type="file"
            accept=".mq5"
            onChange={handleFileUpload}
            className="hidden"
            id="strategy-upload"
          />
          <label
            htmlFor="strategy-upload"
            className="flex items-center justify-center w-full px-4 py-3 bg-gray-700 border-2 border-dashed border-gray-600 rounded cursor-pointer hover:bg-gray-600 transition"
          >
            <span className="text-sm text-gray-400">
              {strategyFile ? strategyFile.name : 'Click to upload .mq5 file'}
            </span>
          </label>
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
          />
        </div>
      </div>

      {/* Initial Balance */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Initial Balance ($)
        </label>
        <input
          type="number"
          step="100"
          value={initialBalance}
          onChange={(e) => setInitialBalance(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
        />
      </div>

      {/* Run Button */}
      <button
        onClick={handleRunBacktest}
        disabled={isRunning || !strategyFile}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-3 rounded font-semibold text-white transition flex items-center justify-center gap-2"
      >
        {isRunning ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            Running Backtest...
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Run Backtest
          </>
        )}
      </button>

      {/* Results Display */}
      {results && (
        <div className="mt-6 space-y-4">
          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-md font-semibold text-white mb-3">Results</h4>
            
            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-700 rounded p-3">
                <div className="text-xs text-gray-400 mb-1">Total Trades</div>
                <div className="text-xl font-bold text-white">
                  {results.totalTrades}
                </div>
              </div>

              <div className="bg-gray-700 rounded p-3">
                <div className="text-xs text-gray-400 mb-1">Win Rate</div>
                <div className={`text-xl font-bold ${
                  results.winRate >= 50 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {results.winRate.toFixed(1)}%
                </div>
              </div>

              <div className="bg-gray-700 rounded p-3">
                <div className="text-xs text-gray-400 mb-1">Net Profit</div>
                <div className={`text-xl font-bold ${
                  results.profit >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  ${results.profit.toFixed(2)}
                </div>
              </div>

              <div className="bg-gray-700 rounded p-3">
                <div className="text-xs text-gray-400 mb-1">Max Drawdown</div>
                <div className="text-xl font-bold text-red-400">
                  {results.maxDrawdown.toFixed(2)}%
                </div>
              </div>

              <div className="bg-gray-700 rounded p-3">
                <div className="text-xs text-gray-400 mb-1">Profit Factor</div>
                <div className="text-xl font-bold text-white">
                  {results.profitFactor?.toFixed(2) || 'N/A'}
                </div>
              </div>

              <div className="bg-gray-700 rounded p-3">
                <div className="text-xs text-gray-400 mb-1">Sharpe Ratio</div>
                <div className="text-xl font-bold text-white">
                  {results.sharpeRatio?.toFixed(2) || 'N/A'}
                </div>
              </div>
            </div>

            {/* Equity Curve Preview */}
            {results.equityCurve && (
              <div className="mt-4 bg-gray-700 rounded p-3">
                <div className="text-xs text-gray-400 mb-2">Equity Curve</div>
                <div className="text-sm text-gray-300">
                  Initial: ${initialBalance} → Final: $
                  {(parseFloat(initialBalance) + results.profit).toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BacktestPanel;