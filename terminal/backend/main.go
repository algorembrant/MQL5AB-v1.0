package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	
	"trading-terminal/backtest"
	"trading-terminal/mt5"
	ws "trading-terminal/websocket"
)

var (
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
	hub    *ws.Hub
	bridge *mt5.Bridge
)

func main() {
	// Initialize hub and bridge
	hub = ws.NewHub()
	bridge = mt5.NewBridge()

	// Start hub
	go hub.Run()

	// Start market data simulator
	go simulateMarketData()

	// Setup routes
	http.HandleFunc("/ws", handleWebSocket)
	http.HandleFunc("/health", handleHealth)
	http.HandleFunc("/api/historical", handleHistoricalData)

	// Enable CORS
	handler := enableCORS(http.DefaultServeMux)

	// Start server
	port := ":8080"
	log.Printf("Trading terminal server starting on %s", port)
	log.Printf("WebSocket endpoint: ws://localhost%s/ws", port)
	
	if err := http.ListenAndServe(port, handler); err != nil {
		log.Fatal("Server error:", err)
	}
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Upgrade error: %v", err)
		return
	}

	client := &ws.Client{
		ID:   uuid.New().String(),
		Conn: conn,
		Send: make(chan []byte, 256),
		Hub:  hub,
	}

	hub.Register <- client

	go client.WritePump()
	go client.ReadPump()
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	// Check MT5 bridge health
	mt5Healthy, _ := bridge.CheckHealth()

	health := map[string]interface{}{
		"status":       "healthy",
		"mt5_bridge":   mt5Healthy,
		"clients":      len(hub.Clients),
		"timestamp":    time.Now().Unix(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(health)
}

func handleHistoricalData(w http.ResponseWriter, r *http.Request) {
	symbol := r.URL.Query().Get("symbol")
	timeframe := r.URL.Query().Get("timeframe")

	if symbol == "" || timeframe == "" {
		http.Error(w, "Missing symbol or timeframe", http.StatusBadRequest)
		return
	}

	// Get rates from MT5 bridge
	rates, err := bridge.GetRates(symbol, timeframe, 500)
	if err != nil {
		log.Printf("Error getting rates: %v", err)
		http.Error(w, "Failed to get rates", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(rates)
}

func simulateMarketData() {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	basePrice := 1.08500
	symbols := []string{"EURUSD", "GBPUSD", "USDJPY"}

	for range ticker.C {
		for _, symbol := range symbols {
			// Simulate price movement
			change := (float64(time.Now().UnixNano()%200) - 100) / 100000
			price := basePrice + change

			msg := ws.Message{
				Type:  "tick",
				Symbol: symbol,
				Time:  time.Now().UnixMilli(),
				Price: price,
				Open:  price - 0.00005,
				High:  price + 0.0001,
				Low:   price - 0.0001,
				Close: price,
			}

			hub.BroadcastMessage(msg)
		}
	}
}

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}