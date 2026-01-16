import React, { useState } from 'react';
import { Code, Save, Upload, Trash2 } from 'lucide-react';

const StrategyManager = ({ onStrategyChange }) => {
  const [strategies, setStrategies] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [strategyCode, setStrategyCode] = useState('');
  const [strategyName, setStrategyName] = useState('');

  const saveStrategy = () => {
    if (!strategyName || !strategyCode) {
      alert('Please provide strategy name and code');
      return;
    }

    const newStrategy = {
      id: Date.now(),
      name: strategyName,
      code: strategyCode,
      createdAt: new Date().toISOString(),
    };

    setStrategies([...strategies, newStrategy]);
    setStrategyName('');
    alert('Strategy saved successfully!');
  };

  const loadStrategy = (strategy) => {
    setSelectedStrategy(strategy);
    setStrategyCode(strategy.code);
    setStrategyName(strategy.name);
    if (onStrategyChange) {
      onStrategyChange(strategy.code);
    }
  };

  const deleteStrategy = (id) => {
    if (window.confirm('Are you sure you want to delete this strategy?')) {
      setStrategies(strategies.filter(s => s.id !== id));
      if (selectedStrategy?.id === id) {
        setSelectedStrategy(null);
        setStrategyCode('');
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setStrategyCode(event.target.result);
      setStrategyName(file.name.replace('.mq5', ''));
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 h-full">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Code className="w-5 h-5" />
        Strategy Manager
      </h3>

      {/* Saved Strategies List */}
      {strategies.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Saved Strategies
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {strategies.map((strategy) => (
              <div
                key={strategy.id}
                className={`flex items-center justify-between p-2 rounded cursor-pointer transition ${
                  selectedStrategy?.id === strategy.id
                    ? 'bg-blue-600'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                onClick={() => loadStrategy(strategy)}
              >
                <div>
                  <div className="text-sm font-medium text-white">
                    {strategy.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(strategy.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteStrategy(strategy.id);
                  }}
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strategy Name Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Strategy Name
        </label>
        <input
          type="text"
          value={strategyName}
          onChange={(e) => setStrategyName(e.target.value)}
          placeholder="My Trading Strategy"
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
        />
      </div>

      {/* Code Editor */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-400">
            MQL5 Code
          </label>
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-4 h-4 text-blue-400 hover:text-blue-300" />
            <input
              id="file-upload"
              type="file"
              accept=".mq5"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
        <textarea
          value={strategyCode}
          onChange={(e) => {
            setStrategyCode(e.target.value);
            if (onStrategyChange) {
              onStrategyChange(e.target.value);
            }
          }}
          placeholder="// Paste your MQL5 strategy code here
// Example:
void OnTick() {
   // Your strategy logic
}"
          className="w-full h-64 bg-gray-900 border border-gray-600 rounded p-3 text-green-400 font-mono text-sm resize-none"
          spellCheck="false"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={saveStrategy}
          disabled={!strategyName || !strategyCode}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded font-semibold text-white transition flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Strategy
        </button>
      </div>

      {/* Quick Reference */}
      <div className="mt-4 p-3 bg-gray-900 border border-gray-700 rounded">
        <h4 className="text-xs font-semibold text-gray-400 mb-2">
          Quick Reference
        </h4>
        <div className="text-xs text-gray-500 space-y-1 font-mono">
          <div>OnInit() - Initialization</div>
          <div>OnTick() - Every tick</div>
          <div>OrderSend() - Place order</div>
          <div>iMA() - Moving Average</div>
          <div>iRSI() - RSI Indicator</div>
        </div>
      </div>
    </div>
  );
};

export default StrategyManager;