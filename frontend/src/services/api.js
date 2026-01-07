import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.detail || error.message || 'An error occurred';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  }
);

// MT5 Services
export const mt5Service = {
  getStatus: () => api.get('/mt5/status'),
  
  getSymbols: () => api.get('/mt5/symbols'),
  
  getSymbolInfo: (symbol) => api.get(`/mt5/symbol/${symbol}`),
  
  getHistoricalData: (symbol, timeframe, days = 30) => 
    api.get('/mt5/historical-data', {
      params: { symbol, timeframe, days }
    }),
  
  getCurrentPrice: (symbol) => api.get(`/mt5/current-price/${symbol}`),
};

// Strategy Services
export const strategyService = {
  create: (strategyData) => api.post('/strategies', strategyData),
  
  list: (skip = 0, limit = 100) => 
    api.get('/strategies', { params: { skip, limit } }),
  
  get: (strategyId) => api.get(`/strategies/${strategyId}`),
  
  update: (strategyId, updates) => 
    api.put(`/strategies/${strategyId}`, updates),
  
  delete: (strategyId) => api.delete(`/strategies/${strategyId}`),
  
  getCode: (strategyId) => api.get(`/strategies/${strategyId}/code`),
  
  getBacktests: (strategyId) => 
    api.get(`/strategies/${strategyId}/backtests`),
};

// Backtest Services
export const backtestService = {
  run: (backtestData) => api.post('/backtests', backtestData),
  
  get: (backtestId) => api.get(`/backtests/${backtestId}`),
};

// Health Check
export const healthCheck = () => api.get('/health');

export default api;