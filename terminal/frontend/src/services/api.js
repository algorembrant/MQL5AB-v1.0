const API_BASE_URL = 'http://localhost:5000';
const GO_API_URL = 'http://localhost:8080';

class ApiService {
  async request(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // MT5 Bridge API calls
  async connectMT5(credentials) {
    return this.request(`${API_BASE_URL}/connect`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async disconnectMT5() {
    return this.request(`${API_BASE_URL}/disconnect`, {
      method: 'POST',
    });
  }

  async getSymbolInfo(symbol) {
    return this.request(`${API_BASE_URL}/symbol/${symbol}`);
  }

  async getRates(symbol, timeframe, count = 100) {
    const params = new URLSearchParams({ symbol, timeframe, count });
    return this.request(`${API_BASE_URL}/rates?${params}`);
  }

  async getAccountInfo() {
    return this.request(`${API_BASE_URL}/account`);
  }

  async getPositions() {
    return this.request(`${API_BASE_URL}/positions`);
  }

  async startStream(symbol) {
    return this.request(`${API_BASE_URL}/stream/start`, {
      method: 'POST',
      body: JSON.stringify({ symbol }),
    });
  }

  async stopStream() {
    return this.request(`${API_BASE_URL}/stream/stop`, {
      method: 'POST',
    });
  }

  async checkHealth() {
    try {
      const mt5Health = await this.request(`${API_BASE_URL}/health`);
      const goHealth = await this.request(`${GO_API_URL}/health`);
      return {
        mt5: mt5Health,
        backend: goHealth,
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Go Backend API calls
  async placeOrder(orderData) {
    return this.request(`${GO_API_URL}/order`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async closePosition(ticket) {
    return this.request(`${GO_API_URL}/position/${ticket}`, {
      method: 'DELETE',
    });
  }

  async getHistoricalData(symbol, timeframe, startDate, endDate) {
    const params = new URLSearchParams({
      symbol,
      timeframe,
      start: startDate,
      end: endDate,
    });
    return this.request(`${GO_API_URL}/historical?${params}`);
  }
}

export default new ApiService();