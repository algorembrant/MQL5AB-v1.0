# database.py
from sqlalchemy import create_engine, Column, String, Integer, DateTime, Boolean, Text, DECIMAL, BigInteger, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid
from config import settings

# Database engine
engine = create_engine(settings.DATABASE_URL, echo=settings.DEBUG)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==================== MODELS ====================

class Strategy(Base):
    __tablename__ = "strategies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    symbol = Column(String(20), nullable=False)
    timeframe = Column(String(10), nullable=False)
    
    # Strategy logic
    visual_elements = Column(JSONB, nullable=False, default=[])
    entry_rules = Column(JSONB, nullable=False, default={})
    exit_rules = Column(JSONB, nullable=False, default={})
    risk_management = Column(JSONB, nullable=False, default={})
    
    # Generated code
    mql5_code = Column(Text)
    
    # Versioning
    version = Column(Integer, default=1)
    parent_id = Column(UUID(as_uuid=True), ForeignKey('strategies.id'))
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    backtests = relationship("Backtest", back_populates="strategy", cascade="all, delete-orphan")
    revisions = relationship("StrategyRevision", back_populates="strategy", cascade="all, delete-orphan")


class Backtest(Base):
    __tablename__ = "backtests"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    strategy_id = Column(UUID(as_uuid=True), ForeignKey('strategies.id'), nullable=False)
    
    # Parameters
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    initial_balance = Column(DECIMAL(15, 2), nullable=False)
    
    # Results
    final_balance = Column(DECIMAL(15, 2))
    total_trades = Column(Integer)
    winning_trades = Column(Integer)
    losing_trades = Column(Integer)
    win_rate = Column(DECIMAL(5, 2))
    profit_factor = Column(DECIMAL(10, 2))
    max_drawdown = Column(DECIMAL(10, 2))
    sharpe_ratio = Column(DECIMAL(10, 4))
    
    # Detailed data
    trades = Column(JSONB, nullable=False, default=[])
    equity_curve = Column(JSONB, nullable=False, default=[])
    
    # Execution
    execution_time_ms = Column(Integer)
    status = Column(String(20), default='pending')
    error_message = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    strategy = relationship("Strategy", back_populates="backtests")


class MarketData(Base):
    __tablename__ = "market_data"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    symbol = Column(String(20), nullable=False)
    timeframe = Column(String(10), nullable=False)
    timestamp = Column(DateTime, nullable=False)
    
    # OHLCV
    open = Column(DECIMAL(15, 5), nullable=False)
    high = Column(DECIMAL(15, 5), nullable=False)
    low = Column(DECIMAL(15, 5), nullable=False)
    close = Column(DECIMAL(15, 5), nullable=False)
    tick_volume = Column(BigInteger, nullable=False)


class StrategyRevision(Base):
    __tablename__ = "strategy_revisions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    strategy_id = Column(UUID(as_uuid=True), ForeignKey('strategies.id'), nullable=False)
    version = Column(Integer, nullable=False)
    
    # Snapshot
    snapshot = Column(JSONB, nullable=False)
    mql5_code = Column(Text)
    
    # Metadata
    commit_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    strategy = relationship("Strategy", back_populates="revisions")


class DrawingTemplate(Base):
    __tablename__ = "drawing_templates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text)
    elements = Column(JSONB, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# Create all tables
def init_db():
    Base.metadata.create_all(bind=engine)