from pydantic_settings import BaseSettings
from functools import lru_cache
import os

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "MQL5 Algo Bot Builder"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/mql5_algobot"
    
    # MT5 - No credentials needed, automatically discovers running instance
    MT5_TIMEOUT: int = 60000  # milliseconds
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ]
    
    # WebSocket
    WS_HEARTBEAT_INTERVAL: int = 30  # seconds
    
    # Backtest
    MAX_BACKTEST_DAYS: int = 365
    DEFAULT_INITIAL_BALANCE: float = 10000.0
    
    # Risk Management
    DEFAULT_RISK_PERCENT: float = 2.0
    MAX_RISK_PERCENT: float = 10.0
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()