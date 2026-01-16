package websocket

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type Client struct {
	ID        string
	Conn      *websocket.Conn
	Send      chan []byte
	Hub       *Hub
	Symbol    string
	Timeframe string
}

type Hub struct {
	Clients    map[*Client]bool
	Broadcast  chan []byte
	Register   chan *Client
	Unregister chan *Client
	mu         sync.RWMutex
}

type Message struct {
	Type         string      `json:"type"`
	Symbol       string      `json:"symbol,omitempty"`
	Timeframe    string      `json:"timeframe,omitempty"`
	Time         int64       `json:"time,omitempty"`
	Price        float64     `json:"price,omitempty"`
	Open         float64     `json:"open,omitempty"`
	High         float64     `json:"high,omitempty"`
	Low          float64     `json:"low,omitempty"`
	Close        float64     `json:"close,omitempty"`
	Volume       int64       `json:"volume,omitempty"`
	Data         interface{} `json:"data,omitempty"`
	Results      interface{} `json:"results,omitempty"`
	StrategyCode string      `json:"strategyCode,omitempty"`
	StartDate    string      `json:"startDate,omitempty"`
	EndDate      string      `json:"endDate,omitempty"`
}

func NewHub() *Hub {
	return &Hub{
		Clients:    make(map[*Client]bool),
		Broadcast:  make(chan []byte, 256),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			h.Clients[client] = true
			h.mu.Unlock()
			log.Printf("Client %s registered. Total clients: %d", client.ID, len(h.Clients))

		case client := <-h.Unregister:
			h.mu.Lock()
			if _, ok := h.Clients[client]; ok {
				delete(h.Clients, client)
				close(client.Send)
				log.Printf("Client %s unregistered. Total clients: %d", client.ID, len(h.Clients))
			}
			h.mu.Unlock()

		case message := <-h.Broadcast:
			h.mu.RLock()
			for client := range h.Clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.Clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *Hub) BroadcastMessage(msg Message) {
	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Error marshaling message: %v", err)
		return
	}
	h.Broadcast <- data
}

func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		var msg Message
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("Error unmarshaling message: %v", err)
			continue
		}

		c.handleMessage(msg)
	}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *Client) handleMessage(msg Message) {
	switch msg.Type {
	case "subscribe":
		c.Symbol = msg.Symbol
		c.Timeframe = msg.Timeframe
		log.Printf("Client %s subscribed to %s %s", c.ID, msg.Symbol, msg.Timeframe)

	case "unsubscribe":
		log.Printf("Client %s unsubscribed from %s", c.ID, msg.Symbol)

	case "place_order":
		log.Printf("Client %s placing order: %v", c.ID, msg)
		// Handle order placement

	case "backtest":
		log.Printf("Client %s running backtest", c.ID)
		// Handle backtest request
		go c.runBacktest(msg)

	default:
		log.Printf("Unknown message type: %s", msg.Type)
	}
}

func (c *Client) runBacktest(msg Message) {
	// Simulate backtest processing
	time.Sleep(2 * time.Second)

	// Mock results
	results := map[string]interface{}{
		"totalTrades":  150,
		"winRate":      62.5,
		"profit":       1250.75,
		"maxDrawdown":  8.3,
		"profitFactor": 2.1,
		"sharpeRatio":  1.8,
	}

	response := Message{
		Type:    "backtest_result",
		Results: results,
	}

	data, _ := json.Marshal(response)
	c.Send <- data
}

func (c *Client) SendMessage(msg Message) error {
	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	select {
	case c.Send <- data:
		return nil
	default:
		return websocket.ErrCloseSent
	}
}