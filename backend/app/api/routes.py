from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
import json

from database import get_db, Strategy, Backtest, MarketData
from services.mt5_service import mt5_service
from services.mql5_generator import MQL5Generator
from services.backtest_engine import BacktestEngine

router = APIRouter()

# ==================== REQUEST/RESPONSE MODELS ====================

class StrategyCreate(BaseModel):
    name: str
    description: Optional[str] = None
    symbol: str
    timeframe: str
    visual_elements: list = []
    entry_rules: dict = {}
    exit_rules: dict = {}
    risk_management: dict = {}

class StrategyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    visual_elements: Optional[list] = None
    entry_rules: Optional[dict] = None
    exit_rules: Optional[dict] = None
    risk_management: Optional[dict] = None

class BacktestRequest(BaseModel):
    strategy_id: str
    start_date: datetime
    end_date: datetime
    initial_balance: float = 10000.0

# ==================== MT5 ENDPOINTS ====================

@router.get("/mt5/status")
async def get_mt5_status():
    """Get MT5 connection status"""
    if mt5_service.connect():
        account_info = mt5_service.get_account_info()
        return {
            "connected": True,
            "account": account_info
        }
    return {"connected": False}

@router.get("/mt5/symbols")
async def get_symbols():
    """Get available trading symbols"""
    symbols = mt5_service.get_symbols()
    return {"symbols": symbols}

@router.get("/mt5/symbol/{symbol}")
async def get_symbol_info(symbol: str):
    """Get symbol specifications"""
    info = mt5_service.get_symbol_info(symbol)
    if not info:
        raise HTTPException(status_code=404, detail="Symbol not found")
    return info

@router.get("/mt5/historical-data")
async def get_historical_data(
    symbol: str,
    timeframe: str,
    days: int = 30
):
    """Fetch historical market data"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    data = mt5_service.get_historical_data(symbol, timeframe, start_date, end_date)
    
    if data is None:
        raise HTTPException(status_code=500, detail="Failed to fetch data from MT5")
    
    return {
        "symbol": symbol,
        "timeframe": timeframe,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "data": data.to_dict('records')
    }

@router.get("/mt5/current-price/{symbol}")
async def get_current_price(symbol: str):
    """Get current market price"""
    price = mt5_service.get_current_price(symbol)
    if not price:
        raise HTTPException(status_code=404, detail="Price not available")
    return price

# ==================== STRATEGY ENDPOINTS ====================

@router.post("/strategies")
async def create_strategy(strategy: StrategyCreate, db: Session = Depends(get_db)):
    """Create a new strategy"""
    db_strategy = Strategy(
        name=strategy.name,
        description=strategy.description,
        symbol=strategy.symbol,
        timeframe=strategy.timeframe,
        visual_elements=strategy.visual_elements,
        entry_rules=strategy.entry_rules,
        exit_rules=strategy.exit_rules,
        risk_management=strategy.risk_management
    )
    
    # Generate MQL5 code
    try:
        generator = MQL5Generator(strategy.dict())
        mql5_code = generator.generate()
        db_strategy.mql5_code = mql5_code
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code generation failed: {str(e)}")
    
    db.add(db_strategy)
    db.commit()
    db.refresh(db_strategy)
    
    return {
        "id": str(db_strategy.id),
        "name": db_strategy.name,
        "mql5_code": db_strategy.mql5_code
    }

@router.get("/strategies")
async def list_strategies(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all strategies"""
    strategies = db.query(Strategy).filter(Strategy.is_active == True).offset(skip).limit(limit).all()
    return [
        {
            "id": str(s.id),
            "name": s.name,
            "description": s.description,
            "symbol": s.symbol,
            "timeframe": s.timeframe,
            "version": s.version,
            "created_at": s.created_at.isoformat(),
            "updated_at": s.updated_at.isoformat()
        }
        for s in strategies
    ]

@router.get("/strategies/{strategy_id}")
async def get_strategy(strategy_id: str, db: Session = Depends(get_db)):
    """Get strategy details"""
    strategy = db.query(Strategy).filter(Strategy.id == strategy_id).first()
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    return {
        "id": str(strategy.id),
        "name": strategy.name,
        "description": strategy.description,
        "symbol": strategy.symbol,
        "timeframe": strategy.timeframe,
        "visual_elements": strategy.visual_elements,
        "entry_rules": strategy.entry_rules,
        "exit_rules": strategy.exit_rules,
        "risk_management": strategy.risk_management,
        "mql5_code": strategy.mql5_code,
        "version": strategy.version,
        "created_at": strategy.created_at.isoformat()
    }

@router.put("/strategies/{strategy_id}")
async def update_strategy(
    strategy_id: str,
    updates: StrategyUpdate,
    db: Session = Depends(get_db)
):
    """Update strategy"""
    strategy = db.query(Strategy).filter(Strategy.id == strategy_id).first()
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    # Update fields
    update_data = updates.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(strategy, field, value)
    
    # Regenerate MQL5 code
    try:
        strategy_dict = {
            "name": strategy.name,
            "description": strategy.description,
            "symbol": strategy.symbol,
            "timeframe": strategy.timeframe,
            "visual_elements": strategy.visual_elements,
            "entry_rules": strategy.entry_rules,
            "exit_rules": strategy.exit_rules,
            "risk_management": strategy.risk_management
        }
        generator = MQL5Generator(strategy_dict)
        strategy.mql5_code = generator.generate()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code generation failed: {str(e)}")
    
    db.commit()
    db.refresh(strategy)
    
    return {"message": "Strategy updated", "mql5_code": strategy.mql5_code}

@router.delete("/strategies/{strategy_id}")
async def delete_strategy(strategy_id: str, db: Session = Depends(get_db)):
    """Delete strategy (soft delete)"""
    strategy = db.query(Strategy).filter(Strategy.id == strategy_id).first()
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    strategy.is_active = False
    db.commit()
    
    return {"message": "Strategy deleted"}

@router.get("/strategies/{strategy_id}/code")
async def get_strategy_code(strategy_id: str, db: Session = Depends(get_db)):
    """Get generated MQL5 code"""
    strategy = db.query(Strategy).filter(Strategy.id == strategy_id).first()
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    return {
        "strategy_id": str(strategy.id),
        "name": strategy.name,
        "mql5_code": strategy.mql5_code
    }

# ==================== BACKTEST ENDPOINTS ====================

@router.post("/backtests")
async def run_backtest(request: BacktestRequest, db: Session = Depends(get_db)):
    """Run backtest on strategy"""
    # Get strategy
    strategy = db.query(Strategy).filter(Strategy.id == request.strategy_id).first()
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    # Fetch historical data
    data = mt5_service.get_historical_data(
        strategy.symbol,
        strategy.timeframe,
        request.start_date,
        request.end_date
    )
    
    if data is None or len(data) == 0:
        raise HTTPException(status_code=500, detail="Failed to fetch historical data")
    
    # Get symbol info
    symbol_info = mt5_service.get_symbol_info(strategy.symbol)
    if not symbol_info:
        raise HTTPException(status_code=500, detail="Failed to get symbol info")
    
    # Run backtest
    try:
        engine = BacktestEngine(initial_balance=request.initial_balance)
        
        strategy_dict = {
            "visual_elements": strategy.visual_elements,
            "entry_rules": strategy.entry_rules,
            "exit_rules": strategy.exit_rules,
            "risk_management": strategy.risk_management
        }
        
        results = engine.run_backtest(data, strategy_dict, symbol_info)
        
        # Save backtest to database
        backtest = Backtest(
            strategy_id=strategy.id,
            start_date=request.start_date,
            end_date=request.end_date,
            initial_balance=request.initial_balance,
            final_balance=results['final_balance'],
            total_trades=results['total_trades'],
            winning_trades=results['winning_trades'],
            losing_trades=results['losing_trades'],
            win_rate=results['win_rate'],
            profit_factor=results['profit_factor'],
            max_drawdown=results['max_drawdown'],
            sharpe_ratio=results['sharpe_ratio'],
            trades=results['trades'],
            equity_curve=results['equity_curve'],
            execution_time_ms=results['execution_time_ms'],
            status='completed'
        )
        
        db.add(backtest)
        db.commit()
        db.refresh(backtest)
        
        return {
            "backtest_id": str(backtest.id),
            "results": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backtest failed: {str(e)}")

@router.get("/backtests/{backtest_id}")
async def get_backtest(backtest_id: str, db: Session = Depends(get_db)):
    """Get backtest results"""
    backtest = db.query(Backtest).filter(Backtest.id == backtest_id).first()
    if not backtest:
        raise HTTPException(status_code=404, detail="Backtest not found")
    
    return {
        "id": str(backtest.id),
        "strategy_id": str(backtest.strategy_id),
        "start_date": backtest.start_date.isoformat(),
        "end_date": backtest.end_date.isoformat(),
        "initial_balance": float(backtest.initial_balance),
        "final_balance": float(backtest.final_balance),
        "total_trades": backtest.total_trades,
        "winning_trades": backtest.winning_trades,
        "losing_trades": backtest.losing_trades,
        "win_rate": float(backtest.win_rate),
        "profit_factor": float(backtest.profit_factor),
        "max_drawdown": float(backtest.max_drawdown),
        "sharpe_ratio": float(backtest.sharpe_ratio),
        "trades": backtest.trades,
        "equity_curve": backtest.equity_curve,
        "execution_time_ms": backtest.execution_time_ms,
        "status": backtest.status
    }

@router.get("/strategies/{strategy_id}/backtests")
async def list_strategy_backtests(strategy_id: str, db: Session = Depends(get_db)):
    """List all backtests for a strategy"""
    backtests = db.query(Backtest).filter(Backtest.strategy_id == strategy_id).all()
    return [
        {
            "id": str(b.id),
            "start_date": b.start_date.isoformat(),
            "end_date": b.end_date.isoformat(),
            "final_balance": float(b.final_balance),
            "total_trades": b.total_trades,
            "win_rate": float(b.win_rate),
            "created_at": b.created_at.isoformat()
        }
        for b in backtests
    ]