import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const OrderPanel = ({ symbol, currentPrice, onPlaceOrder }) => {
  const [orderType, setOrderType] = useState('buy');
  const [volume, setVolume] = useState(0.01);
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [orderExecuting, setOrderExecuting] = useState(false);

  const handlePlaceOrder = async () => {
    setOrderExecuting(true);
    
    const order = {
      symbol: symbol,
      type: orderType,
      volume: parseFloat(volume),
      price: currentPrice,
      sl: stopLoss ? parseFloat(stopLoss) : 0,
      tp: takeProfit ? parseFloat(takeProfit) : 0,
    };

    try {
      await onPlaceOrder(order);
    } catch (error) {
      console.error('Order failed:', error);
    } finally {
      setOrderExecuting(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <DollarSign className="w-5 h-5" />
        Quick Order
      </h3>

      {/* Order Type Selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setOrderType('buy')}
          className={`flex-1 py-3 rounded font-semibold transition ${
            orderType === 'buy'
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <TrendingUp className="w-4 h-4" />
            BUY
          </div>
        </button>
        <button
          onClick={() => setOrderType('sell')}
          className={`flex-1 py-3 rounded font-semibold transition ${
            orderType === 'sell'
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <TrendingDown className="w-4 h-4" />
            SELL
          </div>
        </button>
      </div>

      {/* Volume Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Volume (Lots)
        </label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={volume}
          onChange={(e) => setVolume(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
        />
      </div>

      {/* Current Price Display */}
      <div className="mb-4 p-3 bg-gray-700 rounded">
        <div className="text-sm text-gray-400 mb-1">Current Price</div>
        <div className="text-xl font-mono font-bold text-white">
          {currentPrice ? currentPrice.toFixed(5) : 'N/A'}
        </div>
      </div>

      {/* Stop Loss */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Stop Loss (Optional)
        </label>
        <input
          type="number"
          step="0.00001"
          value={stopLoss}
          onChange={(e) => setStopLoss(e.target.value)}
          placeholder="0.00000"
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
        />
      </div>

      {/* Take Profit */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Take Profit (Optional)
        </label>
        <input
          type="number"
          step="0.00001"
          value={takeProfit}
          onChange={(e) => setTakeProfit(e.target.value)}
          placeholder="0.00000"
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
        />
      </div>

      {/* Place Order Button */}
      <button
        onClick={handlePlaceOrder}
        disabled={orderExecuting || !currentPrice}
        className={`w-full py-3 rounded font-semibold transition ${
          orderType === 'buy'
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-red-600 hover:bg-red-700'
        } text-white disabled:bg-gray-600 disabled:cursor-not-allowed`}
      >
        {orderExecuting ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            Placing Order...
          </div>
        ) : (
          `Place ${orderType.toUpperCase()} Order`
        )}
      </button>

      {/* Risk Warning */}
      <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded">
        <p className="text-xs text-yellow-500">
          ⚠️ Trading involves risk. Only trade with money you can afford to lose.
        </p>
      </div>
    </div>
  );
};

export default OrderPanel;