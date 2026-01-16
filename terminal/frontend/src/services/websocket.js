class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectInterval = 3000;
    this.reconnectTimer = null;
    this.isConnecting = false;
  }

  connect(url = 'ws://localhost:8080/ws') {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.emit('connected', true);
        
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit(data.type, data);
          this.emit('message', data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.emit('connected', false);
        
        // Auto reconnect
        this.reconnectTimer = setTimeout(() => {
          console.log('Attempting to reconnect...');
          this.connect(url);
        }, this.reconnectInterval);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.isConnecting = false;
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws.send(message);
      return true;
    }
    console.warn('WebSocket not connected');
    return false;
  }

  subscribe(symbol, timeframe) {
    return this.send({
      type: 'subscribe',
      symbol,
      timeframe,
    });
  }

  unsubscribe(symbol) {
    return this.send({
      type: 'unsubscribe',
      symbol,
    });
  }

  runBacktest(params) {
    return this.send({
      type: 'backtest',
      ...params,
    });
  }

  placeOrder(orderData) {
    return this.send({
      type: 'place_order',
      ...orderData,
    });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return;
    
    this.listeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

export default new WebSocketService();