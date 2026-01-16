import MetaTrader5 as mt5
from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
from datetime import datetime, timedelta
import threading
import time
import requests

app = Flask(__name__)
CORS(app)

# Configuration
GO_BACKEND_URL = "http://localhost:8080"
MT5_LOGIN = None  # Your MT5 account login
MT5_PASSWORD = None  # Your MT5 password
MT5_SERVER = None  # Your broker server

class MT5Bridge:
    def __init__(self):
        self.connected = False
        self.streaming = False
        
    def connect(self, login=None, password=None, server=None):
        """Connect to MT5 terminal"""
        if not mt5.initialize():
            print(f"initialize() failed, error code = {mt5.last_error()}")
            return False
        
        if login and password and server:
            authorized = mt5.login(login, password=password, server=server)
            if not authorized:
                print(f"login failed, error code = {mt5.last_error()}")
                mt5.shutdown()
                return False
        
        self.connected = True
        print("Connected to MT5")
        print(f"MT5 version: {mt5.version()}")
        return True
    
    def disconnect(self):
        """Disconnect from MT5"""
        mt5.shutdown()
        self.connected = False
        print("Disconnected from MT5")
    
    def get_symbol_info(self, symbol):
        """Get symbol information"""
        if not self.connected:
            return None
        
        symbol_info = mt5.symbol_info(symbol)
        if symbol_info is None:
            print(f"Symbol {symbol} not found")
            return None
        
        return {
            'name': symbol_info.name,
            'bid': symbol_info.bid,
            'ask': symbol_info.ask,
            'spread': symbol_info.spread,
            'digits': symbol_info.digits,
            'point': symbol_info.point,
        }
    
    def get_rates(self, symbol, timeframe, count=100):
        """Get historical rates"""
        if not self.connected:
            return None
        
        # Map timeframe string to MT5 constant
        timeframe_map = {
            'M1': mt5.TIMEFRAME_M1,
            'M5': mt5.TIMEFRAME_M5,
            'M15': mt5.TIMEFRAME_M15,
            'M30': mt5.TIMEFRAME_M30,
            'H1': mt5.TIMEFRAME_H1,
            'H4': mt5.TIMEFRAME_H4,
            'D1': mt5.TIMEFRAME_D1,
            'W1': mt5.TIMEFRAME_W1,
            'MN1': mt5.TIMEFRAME_MN1,
        }
        
        tf = timeframe_map.get(timeframe, mt5.TIMEFRAME_M5)
        
        rates = mt5.copy_rates_from_pos(symbol, tf, 0, count)
        
        if rates is None:
            print(f"Failed to get rates for {symbol}")
            return None
        
        df = pd.DataFrame(rates)
        df['time'] = pd.to_datetime(df['time'], unit='s')
        
        return df.to_dict('records')
    
    def get_account_info(self):
        """Get account information"""
        if not self.connected:
            return None
        
        account_info = mt5.account_info()
        if account_info is None:
            return None
        
        return {
            'balance': account_info.balance,
            'equity': account_info.equity,
            'margin': account_info.margin,
            'free_margin': account_info.margin_free,
            'profit': account_info.profit,
            'leverage': account_info.leverage,
        }
    
    def get_positions(self):
        """Get open positions"""
        if not self.connected:
            return []
        
        positions = mt5.positions_get()
        if positions is None:
            return []
        
        return [{
            'ticket': pos.ticket,
            'symbol': pos.symbol,
            'type': 'BUY' if pos.type == 0 else 'SELL',
            'volume': pos.volume,
            'price_open': pos.price_open,
            'price_current': pos.price_current,
            'profit': pos.profit,
            'sl': pos.sl,
            'tp': pos.tp,
        } for pos in positions]
    
    def stream_ticks(self, symbol, callback):
        """Stream real-time ticks"""
        print(f"Starting tick stream for {symbol}")
        
        while self.streaming:
            tick = mt5.symbol_info_tick(symbol)
            if tick is not None:
                callback({
                    'symbol': symbol,
                    'time': tick.time * 1000,  # Convert to milliseconds
                    'bid': tick.bid,
                    'ask': tick.ask,
                    'last': tick.last,
                    'volume': tick.volume,
                })
            time.sleep(0.1)  # 100ms interval

# Global bridge instance
bridge = MT5Bridge()

@app.route('/connect', methods=['POST'])
def connect():
    """Connect to MT5"""
    data = request.json
    login = data.get('login')
    password = data.get('password')
    server = data.get('server')
    
    success = bridge.connect(login, password, server)
    return jsonify({'connected': success})

@app.route('/disconnect', methods=['POST'])
def disconnect():
    """Disconnect from MT5"""
    bridge.disconnect()
    return jsonify({'disconnected': True})

@app.route('/symbol/<symbol>', methods=['GET'])
def get_symbol(symbol):
    """Get symbol info"""
    info = bridge.get_symbol_info(symbol)
    if info is None:
        return jsonify({'error': 'Symbol not found'}), 404
    return jsonify(info)

@app.route('/rates', methods=['GET'])
def get_rates():
    """Get historical rates"""
    symbol = request.args.get('symbol', 'EURUSD')
    timeframe = request.args.get('timeframe', 'M5')
    count = int(request.args.get('count', 100))
    
    rates = bridge.get_rates(symbol, timeframe, count)
    if rates is None:
        return jsonify({'error': 'Failed to get rates'}), 500
    
    return jsonify(rates)

@app.route('/account', methods=['GET'])
def get_account():
    """Get account info"""
    info = bridge.get_account_info()
    if info is None:
        return jsonify({'error': 'Failed to get account info'}), 500
    return jsonify(info)

@app.route('/positions', methods=['GET'])
def get_positions():
    """Get open positions"""
    positions = bridge.get_positions()
    return jsonify(positions)

@app.route('/stream/start', methods=['POST'])
def start_stream():
    """Start streaming ticks"""
    data = request.json
    symbol = data.get('symbol', 'EURUSD')
    
    bridge.streaming = True
    
    def send_to_backend(tick_data):
        try:
            # Send tick to Go backend
            requests.post(f"{GO_BACKEND_URL}/tick", json=tick_data, timeout=1)
        except Exception as e:
            print(f"Error sending tick: {e}")
    
    threading.Thread(target=bridge.stream_ticks, args=(symbol, send_to_backend), daemon=True).start()
    
    return jsonify({'streaming': True})

@app.route('/stream/stop', methods=['POST'])
def stop_stream():
    """Stop streaming ticks"""
    bridge.streaming = False
    return jsonify({'streaming': False})

@app.route('/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        'status': 'healthy',
        'connected': bridge.connected,
        'streaming': bridge.streaming
    })

if __name__ == '__main__':
    # Auto-connect on startup (no credentials required for demo)
    bridge.connect()
    
    print("MT5 Bridge Server starting on http://localhost:5000")
    print("Endpoints:")
    print("  POST /connect - Connect to MT5")
    print("  GET  /symbol/<symbol> - Get symbol info")
    print("  GET  /rates - Get historical rates")
    print("  GET  /account - Get account info")
    print("  GET  /positions - Get positions")
    print("  POST /stream/start - Start tick streaming")
    print("")
    
    app.run(host='0.0.0.0', port=5000, debug=True)