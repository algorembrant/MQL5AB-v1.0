-- PostgreSQL Database Schema for MQL5 Algo Bot Builder

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Strategies table: stores strategy metadata and definitions
CREATE TABLE strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    symbol VARCHAR(20) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    
    -- Strategy logic stored as JSONB for flexibility
    visual_elements JSONB NOT NULL DEFAULT '[]'::jsonb,
    entry_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
    exit_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
    risk_management JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Generated MQL5 code
    mql5_code TEXT,
    
    -- Version control
    version INTEGER DEFAULT 1,
    parent_id UUID REFERENCES strategies(id),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    
    -- Indexing for fast queries
    CONSTRAINT unique_strategy_name UNIQUE(name, version)
);

-- Backtests table: stores backtest results and performance metrics
CREATE TABLE backtests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_id UUID NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
    
    -- Backtest parameters
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    initial_balance DECIMAL(15, 2) NOT NULL,
    
    -- Performance metrics
    final_balance DECIMAL(15, 2),
    total_trades INTEGER,
    winning_trades INTEGER,
    losing_trades INTEGER,
    win_rate DECIMAL(5, 2),
    profit_factor DECIMAL(10, 2),
    max_drawdown DECIMAL(10, 2),
    sharpe_ratio DECIMAL(10, 4),
    
    -- Trade details stored as JSONB
    trades JSONB NOT NULL DEFAULT '[]'::jsonb,
    equity_curve JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Execution info
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexing
    INDEX idx_strategy_backtests (strategy_id, created_at DESC)
);

-- Market data cache: stores historical data for quick backtesting
CREATE TABLE market_data (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    
    -- OHLCV data
    open DECIMAL(15, 5) NOT NULL,
    high DECIMAL(15, 5) NOT NULL,
    low DECIMAL(15, 5) NOT NULL,
    close DECIMAL(15, 5) NOT NULL,
    tick_volume BIGINT NOT NULL,
    
    -- Ensure unique candles
    CONSTRAINT unique_candle UNIQUE(symbol, timeframe, timestamp)
);

-- Index for fast time-series queries
CREATE INDEX idx_market_data_lookup ON market_data(symbol, timeframe, timestamp DESC);

-- Strategy revisions: git-style version history
CREATE TABLE strategy_revisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_id UUID NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    
    -- Snapshot of strategy at this version
    snapshot JSONB NOT NULL,
    mql5_code TEXT,
    
    -- Commit-style metadata
    commit_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_revision UNIQUE(strategy_id, version)
);

-- Drawing templates: reusable visual patterns
CREATE TABLE drawing_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    elements JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamps
CREATE TRIGGER update_strategies_updated_at
    BEFORE UPDATE ON strategies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default risk management template
INSERT INTO drawing_templates (name, description, elements) VALUES
('Default Risk Management', 'Standard 2% risk per trade', 
 '{"risk_percent": 2.0, "use_trailing_stop": false, "max_daily_loss": 5.0}'::jsonb);

-- Views for common queries
CREATE VIEW strategy_performance AS
SELECT 
    s.id as strategy_id,
    s.name,
    s.version,
    COUNT(b.id) as total_backtests,
    AVG(b.win_rate) as avg_win_rate,
    AVG(b.profit_factor) as avg_profit_factor,
    AVG(b.max_drawdown) as avg_max_drawdown
FROM strategies s
LEFT JOIN backtests b ON s.id = b.strategy_id
WHERE s.is_active = true
GROUP BY s.id, s.name, s.version;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;