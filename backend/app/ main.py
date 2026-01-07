from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from loguru import logger
import sys
import json

from config import settings
from database import init_db
from api.routes import router
from services.mt5_service import mt5_service

# Configure logging
logger.remove()
logger.add(
    sys.stderr,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level="INFO"
)

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting MQL5 Algo Bot Builder...")
    
    # Initialize database
    try:
        init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
    
    # Connect to MT5
    if mt5_service.connect():
        logger.info("Connected to MT5")
        account_info = mt5_service.get_account_info()
        logger.info(f"Account: {account_info['login']}, Balance: {account_info['balance']}")
    else:
        logger.warning("MT5 connection failed - some features will be unavailable")
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    mt5_service.disconnect()
    logger.info("Shutdown complete")

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(router, prefix="/api")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Total: {len(self.active_connections)}")
    
    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time data streaming
    Sends live price updates and account info
    """
    await manager.connect(websocket)
    
    try:
        # Send initial connection success
        await websocket.send_json({
            "type": "connected",
            "message": "WebSocket connected successfully"
        })
        
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get('type') == 'subscribe_symbol':
                symbol = message.get('symbol')
                
                # Send current price
                price_data = mt5_service.get_current_price(symbol)
                if price_data:
                    await websocket.send_json({
                        "type": "price_update",
                        "data": price_data
                    })
            
            elif message.get('type') == 'get_account':
                account_info = mt5_service.get_account_info()
                if account_info:
                    await websocket.send_json({
                        "type": "account_update",
                        "data": account_info
                    })
            
            elif message.get('type') == 'ping':
                await websocket.send_json({"type": "pong"})
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "mt5_connected": mt5_service.connected
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    mt5_status = "connected" if mt5_service.connected else "disconnected"
    account_info = mt5_service.get_account_info() if mt5_service.connected else None
    
    return {
        "status": "healthy",
        "mt5_status": mt5_status,
        "account": account_info
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )