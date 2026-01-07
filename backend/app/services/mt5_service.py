import MetaTrader5 as mt5
from datetime import datetime, timedelta
import pandas as pd
from typing import Optional, List, Dict
from loguru import logger
from config import settings

class MT5Service:
    def __init__(self):
        self.connected = False
        self.account_info = None
        
    def connect(self) -> bool:
        """
        Auto-connect to running MT5 instance (no credentials needed)
        """
        if self.connected:
            return True
            
        try:
            # Initialize MT5 connection to running instance
            if not mt5.initialize():
                logger.error(f"MT5 initialization failed: {mt5.last_error()}")
                return False
            
            # Get account info from running instance
            self.account_info = mt5.account_info()
            if self.account_info is None:
                logger.error("Failed to get account info")
                mt5.shutdown()
                return False
            
            self.connected = True
            logger.info(f"Connected to MT5 - Account: {self.account_info.login}, Server: {self.account_info.server}")
            return True
            
        except Exception as e:
            logger.error(f"MT5 connection error: {e}")
            return False
    
    def disconnect(self):
        """Disconnect from MT5"""
        if self.connected:
            mt5.shutdown()
            self.connected = False
            logger.info("Disconnected from MT5")
    
    def get_account_info(self) -> Optional[Dict]:
        """Get account information"""
        if not self.connected:
            if not self.connect():
                return None
        
        info = mt5.account_info()
        if info is None:
            return None
        
        return {
            "login": info.login,
            "server": info.server,
            "balance": info.balance,
            "equity": info.equity,
            "margin": info.margin,
            "free_margin": info.margin_free,
            "margin_level": info.margin_level,
            "currency": info.currency,
            "leverage": info.leverage,
            "profit": info.profit
        }
    
    def get_symbols(self) -> List[str]:
        """Get all available symbols"""
        if not self.connected:
            if not self.connect():
                return []
        
        symbols = mt5.symbols_get()
        if symbols is None:
            return []
        
        return [s.name for s in symbols if s.visible]
    
    def get_symbol_info(self, symbol: str) -> Optional[Dict]:
        """Get symbol specifications"""
        if not self.connected:
            if not self.connect():
                return None
        
        info = mt5.symbol_info(symbol)
        if info is None:
            return None
        
        return {
            "name": info.name,
            "digits": info.digits,
            "point": info.point,
            "tick_size": info.trade_tick_size,
            "tick_value": info.trade_tick_value,
            "contract_size": info.trade_contract_size,
            "min_lot": info.volume_min,
            "max_lot": info.volume_max,
            "lot_step": info.volume_step,
            "spread": info.spread,
            "bid": info.bid,
            "ask": info.ask
        }
    
    def get_historical_data(
        self,
        symbol: str,
        timeframe: str,
        start_date: datetime,
        end_date: datetime
    ) -> Optional[pd.DataFrame]:
        """
        Fetch historical OHLCV data from MT5
        """
        if not self.connected:
            if not self.connect():
                return None
        
        # Map timeframe strings to MT5 constants
        timeframe_map = {
            "M1": mt5.TIMEFRAME_M1,
            "M5": mt5.TIMEFRAME_M5,
            "M15": mt5.TIMEFRAME_M15,
            "M30": mt5.TIMEFRAME_M30,
            "H1": mt5.TIMEFRAME_H1,
            "H4": mt5.TIMEFRAME_H4,
            "D1": mt5.TIMEFRAME_D1,
            "W1": mt5.TIMEFRAME_W1,
            "MN1": mt5.TIMEFRAME_MN1
        }
        
        tf = timeframe_map.get(timeframe.upper(), mt5.TIMEFRAME_H1)
        
        try:
            # Fetch data
            rates = mt5.copy_rates_range(symbol, tf, start_date, end_date)
            
            if rates is None or len(rates) == 0:
                logger.warning(f"No data returned for {symbol} {timeframe}")
                return None
            
            # Convert to DataFrame
            df = pd.DataFrame(rates)
            df['time'] = pd.to_datetime(df['time'], unit='s')
            df = df.rename(columns={
                'time': 'timestamp',
                'tick_volume': 'volume'
            })
            
            return df[['timestamp', 'open', 'high', 'low', 'close', 'volume']]
            
        except Exception as e:
            logger.error(f"Error fetching historical data: {e}")
            return None
    
    def get_tick_data(self, symbol: str, count: int = 1000) -> Optional[pd.DataFrame]:
        """Get recent tick data"""
        if not self.connected:
            if not self.connect():
                return None
        
        try:
            ticks = mt5.copy_ticks_from(symbol, datetime.now(), count, mt5.COPY_TICKS_ALL)
            
            if ticks is None or len(ticks) == 0:
                return None
            
            df = pd.DataFrame(ticks)
            df['time'] = pd.to_datetime(df['time'], unit='s')
            
            return df
            
        except Exception as e:
            logger.error(f"Error fetching tick data: {e}")
            return None
    
    def get_current_price(self, symbol: str) -> Optional[Dict]:
        """Get current bid/ask prices"""
        if not self.connected:
            if not self.connect():
                return None
        
        tick = mt5.symbol_info_tick(symbol)
        if tick is None:
            return None
        
        return {
            "symbol": symbol,
            "bid": tick.bid,
            "ask": tick.ask,
            "last": tick.last,
            "volume": tick.volume,
            "time": datetime.fromtimestamp(tick.time)
        }
    
    def calculate_position_size(
        self,
        symbol: str,
        account_balance: float,
        risk_percent: float,
        stop_loss_pips: float
    ) -> float:
        """
        Calculate position size based on risk percentage
        """
        symbol_info = self.get_symbol_info(symbol)
        if not symbol_info:
            return 0.0
        
        # Risk amount in account currency
        risk_amount = account_balance * (risk_percent / 100.0)
        
        # Calculate pip value
        tick_value = symbol_info['tick_value']
        tick_size = symbol_info['tick_size']
        point = symbol_info['point']
        
        # Convert pips to points
        if symbol_info['digits'] == 3 or symbol_info['digits'] == 5:
            pip_size = point * 10
        else:
            pip_size = point
        
        # Calculate position size
        pip_value = (tick_value / tick_size) * pip_size
        position_size = risk_amount / (stop_loss_pips * pip_value)
        
        # Round to lot step
        lot_step = symbol_info['lot_step']
        position_size = round(position_size / lot_step) * lot_step
        
        # Ensure within min/max lot constraints
        position_size = max(symbol_info['min_lot'], min(position_size, symbol_info['max_lot']))
        
        return position_size

# Singleton instance
mt5_service = MT5Service()