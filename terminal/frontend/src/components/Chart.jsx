import React, { useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const Chart = ({ data, symbol, timeframe }) => {
  const chartRef = useRef(null);

  const formatXAxis = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatYAxis = (value) => {
    return value.toFixed(5);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-600 p-3 rounded shadow-lg">
          <p className="text-xs text-gray-400 mb-1">
            {new Date(data.time).toLocaleString()}
          </p>
          <div className="space-y-1 text-sm">
            <p className="text-green-400">O: {data.open?.toFixed(5)}</p>
            <p className="text-blue-400">H: {data.high?.toFixed(5)}</p>
            <p className="text-red-400">L: {data.low?.toFixed(5)}</p>
            <p className="text-white font-bold">C: {data.close?.toFixed(5)}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full bg-gray-900 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          {symbol} - {timeframe}
        </h3>
        {data.length > 0 && (
          <div className="text-sm text-gray-400">
            <span className="text-white font-mono">
              {data[data.length - 1]?.close?.toFixed(5)}
            </span>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="time" 
            stroke="#9CA3AF"
            tickFormatter={formatXAxis}
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#9CA3AF"
            domain={['auto', 'auto']}
            tickFormatter={formatYAxis}
            style={{ fontSize: '12px' }}
            orientation="right"
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="close" 
            stroke="#3B82F6" 
            strokeWidth={2}
            fill="url(#colorPrice)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      {data.length === 0 && (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>Waiting for market data...</p>
        </div>
      )}
    </div>
  );
};

export default Chart;