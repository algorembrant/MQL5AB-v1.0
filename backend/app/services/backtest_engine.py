import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List, Tuple
from loguru import logger

class BacktestEngine:
    """
    High-performance backtest engine for strategy validation
    """
    
    def __init__(self, initial_balance: float = 10000.0):
        self.initial_balance = initial_balance
        self.balance = initial_balance
        self.equity = initial_balance
        self.trades = []
        self.equity_curve = []
        self.position = None
        
    def run_backtest(
        self,
        data: pd.DataFrame,
        strategy: Dict,
        symbol_info: Dict
    ) -> Dict:
        """
        Execute backtest on historical data
        
        Args:
            data: DataFrame with columns [timestamp, open, high, low, close, volume]
            strategy: Strategy definition with entry/exit rules
            symbol_info: Symbol specifications (digits, point, etc.)
        
        Returns:
            Dictionary with backtest results and metrics
        """
        start_time = datetime.now()
        
        # Reset state
        self._reset()
        
        # Extract strategy parameters
        entry_rules = strategy.get('entry_rules', {})
        exit_rules = strategy.get('exit_rules', {})
        risk_mgmt = strategy.get('risk_management', {})
        visual_elements = strategy.get('visual_elements', [])
        
        risk_percent = risk_mgmt.get('risk_percent', 2.0)
        sl_pips = exit_rules.get('stop_loss_pips', 50)
        tp_pips = exit_rules.get('take_profit_pips', 100)
        
        # Calculate pip size
        digits = symbol_info.get('digits', 5)
        point = symbol_info.get('point', 0.00001)
        pip_size = point * 10 if digits in [3, 5] else point
        
        # Process each bar
        for i in range(1, len(data)):
            current_bar = data.iloc[i]
            prev_bar = data.iloc[i-1]
            
            timestamp = current_bar['timestamp']
            open_price = current_bar['open']
            high = current_bar['high']
            low = current_bar['low']
            close = current_bar['close']
            
            # Update equity curve
            if self.position:
                self._update_position_value(close, symbol_info)
            else:
                self.equity = self.balance
            
            self.equity_curve.append({
                'timestamp': timestamp,
                'equity': self.equity,
                'balance': self.balance
            })
            
            # Check exit conditions first
            if self.position:
                exit_result = self._check_exit(
                    current_bar,
                    self.position,
                    sl_pips * pip_size,
                    tp_pips * pip_size
                )
                
                if exit_result:
                    self._close_position(timestamp, exit_result['price'], exit_result['reason'])
            
            # Check entry conditions if no position
            if not self.position:
                signal = self._check_entry(
                    prev_bar,
                    current_bar,
                    visual_elements,
                    entry_rules
                )
                
                if signal:
                    self._open_position(
                        timestamp=timestamp,
                        signal=signal,
                        price=open_price,
                        sl_pips=sl_pips,
                        tp_pips=tp_pips,
                        pip_size=pip_size,
                        risk_percent=risk_percent,
                        symbol_info=symbol_info
                    )
        
        # Close any remaining position
        if self.position:
            last_bar = data.iloc[-1]
            self._close_position(
                last_bar['timestamp'],
                last_bar['close'],
                'backtest_end'
            )
        
        # Calculate metrics
        execution_time = (datetime.now() - start_time).total_seconds() * 1000
        metrics = self._calculate_metrics()
        
        return {
            'initial_balance': self.initial_balance,
            'final_balance': self.balance,
            'total_trades': len(self.trades),
            'winning_trades': sum(1 for t in self.trades if t['profit'] > 0),
            'losing_trades': sum(1 for t in self.trades if t['profit'] < 0),
            'win_rate': metrics['win_rate'],
            'profit_factor': metrics['profit_factor'],
            'max_drawdown': metrics['max_drawdown'],
            'sharpe_ratio': metrics['sharpe_ratio'],
            'trades': self.trades,
            'equity_curve': self.equity_curve,
            'execution_time_ms': int(execution_time)
        }
    
    def _reset(self):
        """Reset backtest state"""
        self.balance = self.initial_balance
        self.equity = self.initial_balance
        self.trades = []
        self.equity_curve = []
        self.position = None
    
    def _check_entry(
        self,
        prev_bar: pd.Series,
        current_bar: pd.Series,
        visual_elements: List[Dict],
        entry_rules: Dict
    ) -> str:
        """
        Check if entry conditions are met
        Returns: 'buy', 'sell', or None
        """
        close = prev_bar['close']
        
        # Evaluate visual elements
        for element in visual_elements:
            if element['type'] == 'horizontal_line':
                price = element['price']
                action = element.get('action', '')
                
                if action == 'buy_above' and close > price:
                    return 'buy'
                elif action == 'sell_below' and close < price:
                    return 'sell'
            
            elif element['type'] == 'zone':
                upper = element['upper']
                lower = element['lower']
                action = element.get('action', '')
                
                if action == 'buy_in_zone' and lower <= close <= upper:
                    return 'buy'
                elif action == 'sell_in_zone' and lower <= close <= upper:
                    return 'sell'
            
            elif element['type'] == 'trendline':
                # Calculate trendline value at current bar
                # Implementation depends on trendline definition
                pass
        
        return None
    
    def _check_exit(
        self,
        current_bar: pd.Series,
        position: Dict,
        sl_distance: float,
        tp_distance: float
    ) -> Dict:
        """
        Check if exit conditions are met (SL or TP)
        """
        high = current_bar['high']
        low = current_bar['low']
        close = current_bar['close']
        
        if position['type'] == 'buy':
            # Check stop loss
            if low <= position['stop_loss']:
                return {'price': position['stop_loss'], 'reason': 'stop_loss'}
            # Check take profit
            if high >= position['take_profit']:
                return {'price': position['take_profit'], 'reason': 'take_profit'}
        
        elif position['type'] == 'sell':
            # Check stop loss
            if high >= position['stop_loss']:
                return {'price': position['stop_loss'], 'reason': 'stop_loss'}
            # Check take profit
            if low <= position['take_profit']:
                return {'price': position['take_profit'], 'reason': 'take_profit'}
        
        return None
    
    def _open_position(
        self,
        timestamp: datetime,
        signal: str,
        price: float,
        sl_pips: float,
        tp_pips: float,
        pip_size: float,
        risk_percent: float,
        symbol_info: Dict
    ):
        """Open a new position with risk management"""
        # Calculate stop loss and take profit
        if signal == 'buy':
            stop_loss = price - (sl_pips * pip_size)
            take_profit = price + (tp_pips * pip_size)
        else:
            stop_loss = price + (sl_pips * pip_size)
            take_profit = price - (tp_pips * pip_size)
        
        # Calculate position size based on risk
        sl_distance = abs(price - stop_loss)
        risk_amount = self.balance * (risk_percent / 100.0)
        
        # Simplified lot calculation
        tick_value = symbol_info.get('tick_value', 1.0)
        tick_size = symbol_info.get('tick_size', 0.00001)
        pip_value = (tick_value / tick_size) * pip_size
        
        lot_size = risk_amount / (sl_pips * pip_value)
        lot_size = max(symbol_info.get('min_lot', 0.01), 
                      min(lot_size, symbol_info.get('max_lot', 100)))
        
        self.position = {
            'type': signal,
            'entry_price': price,
            'stop_loss': stop_loss,
            'take_profit': take_profit,
            'lot_size': lot_size,
            'entry_time': timestamp,
            'pip_value': pip_value
        }
        
        logger.debug(f"Opened {signal} position at {price}, SL: {stop_loss}, TP: {take_profit}")
    
    def _close_position(self, timestamp: datetime, price: float, reason: str):
        """Close current position and record trade"""
        if not self.position:
            return
        
        # Calculate profit/loss
        if self.position['type'] == 'buy':
            pip_diff = (price - self.position['entry_price']) / (self.position['pip_value'] / self.position['lot_size'])
        else:
            pip_diff = (self.position['entry_price'] - price) / (self.position['pip_value'] / self.position['lot_size'])
        
        profit = pip_diff * self.position['pip_value'] * self.position['lot_size']
        
        # Update balance
        self.balance += profit
        
        # Record trade
        trade = {
            'entry_time': self.position['entry_time'],
            'exit_time': timestamp,
            'type': self.position['type'],
            'entry_price': self.position['entry_price'],
            'exit_price': price,
            'lot_size': self.position['lot_size'],
            'profit': profit,
            'pips': pip_diff,
            'exit_reason': reason
        }
        
        self.trades.append(trade)
        self.position = None
        
        logger.debug(f"Closed position at {price}, Profit: {profit:.2f}, Reason: {reason}")
    
    def _update_position_value(self, current_price: float, symbol_info: Dict):
        """Update floating equity"""
        if not self.position:
            return
        
        if self.position['type'] == 'buy':
            pip_diff = (current_price - self.position['entry_price']) / (self.position['pip_value'] / self.position['lot_size'])
        else:
            pip_diff = (self.position['entry_price'] - current_price) / (self.position['pip_value'] / self.position['lot_size'])
        
        floating_pl = pip_diff * self.position['pip_value'] * self.position['lot_size']
        self.equity = self.balance + floating_pl
    
    def _calculate_metrics(self) -> Dict:
        """Calculate performance metrics"""
        if not self.trades:
            return {
                'win_rate': 0,
                'profit_factor': 0,
                'max_drawdown': 0,
                'sharpe_ratio': 0
            }
        
        # Win rate
        winning_trades = [t for t in self.trades if t['profit'] > 0]
        win_rate = (len(winning_trades) / len(self.trades)) * 100
        
        # Profit factor
        gross_profit = sum(t['profit'] for t in winning_trades)
        gross_loss = abs(sum(t['profit'] for t in self.trades if t['profit'] < 0))
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else 0
        
        # Max drawdown
        equity_values = [e['equity'] for e in self.equity_curve]
        peak = equity_values[0]
        max_dd = 0
        
        for equity in equity_values:
            if equity > peak:
                peak = equity
            dd = ((peak - equity) / peak) * 100
            max_dd = max(max_dd, dd)
        
        # Sharpe ratio (simplified)
        returns = [t['profit'] / self.initial_balance for t in self.trades]
        if len(returns) > 1:
            avg_return = np.mean(returns)
            std_return = np.std(returns)
            sharpe = (avg_return / std_return) * np.sqrt(252) if std_return > 0 else 0
        else:
            sharpe = 0
        
        return {
            'win_rate': round(win_rate, 2),
            'profit_factor': round(profit_factor, 2),
            'max_drawdown': round(max_dd, 2),
            'sharpe_ratio': round(sharpe, 4)
        }