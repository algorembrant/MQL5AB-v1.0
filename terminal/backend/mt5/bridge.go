package mt5

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const (
	PythonBridgeURL = "http://localhost:5000"
)

type Bridge struct {
	baseURL string
	client  *http.Client
}

type SymbolInfo struct {
	Name   string  `json:"name"`
	Bid    float64 `json:"bid"`
	Ask    float64 `json:"ask"`
	Spread int     `json:"spread"`
	Digits int     `json:"digits"`
	Point  float64 `json:"point"`
}

type Rate struct {
	Time   time.Time `json:"time"`
	Open   float64   `json:"open"`
	High   float64   `json:"high"`
	Low    float64   `json:"low"`
	Close  float64   `json:"close"`
	Volume int64     `json:"tick_volume"`
}

type AccountInfo struct {
	Balance    float64 `json:"balance"`
	Equity     float64 `json:"equity"`
	Margin     float64 `json:"margin"`
	FreeMargin float64 `json:"free_margin"`
	Profit     float64 `json:"profit"`
	Leverage   int     `json:"leverage"`
}

type Position struct {
	Ticket       int64   `json:"ticket"`
	Symbol       string  `json:"symbol"`
	Type         string  `json:"type"`
	Volume       float64 `json:"volume"`
	PriceOpen    float64 `json:"price_open"`
	PriceCurrent float64 `json:"price_current"`
	Profit       float64 `json:"profit"`
	SL           float64 `json:"sl"`
	TP           float64 `json:"tp"`
}

func NewBridge() *Bridge {
	return &Bridge{
		baseURL: PythonBridgeURL,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (b *Bridge) request(method, endpoint string, body interface{}) ([]byte, error) {
	var reqBody io.Reader
	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		reqBody = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequest(method, b.baseURL+endpoint, reqBody)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := b.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("request failed with status: %d", resp.StatusCode)
	}

	return io.ReadAll(resp.Body)
}

func (b *Bridge) GetSymbolInfo(symbol string) (*SymbolInfo, error) {
	data, err := b.request("GET", "/symbol/"+symbol, nil)
	if err != nil {
		return nil, err
	}

	var info SymbolInfo
	if err := json.Unmarshal(data, &info); err != nil {
		return nil, err
	}

	return &info, nil
}

func (b *Bridge) GetRates(symbol, timeframe string, count int) ([]Rate, error) {
	endpoint := fmt.Sprintf("/rates?symbol=%s&timeframe=%s&count=%d", symbol, timeframe, count)
	data, err := b.request("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}

	var rates []Rate
	if err := json.Unmarshal(data, &rates); err != nil {
		return nil, err
	}

	return rates, nil
}

func (b *Bridge) GetAccountInfo() (*AccountInfo, error) {
	data, err := b.request("GET", "/account", nil)
	if err != nil {
		return nil, err
	}

	var info AccountInfo
	if err := json.Unmarshal(data, &info); err != nil {
		return nil, err
	}

	return &info, nil
}

func (b *Bridge) GetPositions() ([]Position, error) {
	data, err := b.request("GET", "/positions", nil)
	if err != nil {
		return nil, err
	}

	var positions []Position
	if err := json.Unmarshal(data, &positions); err != nil {
		return nil, err
	}

	return positions, nil
}

func (b *Bridge) StartStream(symbol string) error {
	body := map[string]string{"symbol": symbol}
	_, err := b.request("POST", "/stream/start", body)
	return err
}

func (b *Bridge) StopStream() error {
	_, err := b.request("POST", "/stream/stop", nil)
	return err
}

func (b *Bridge) CheckHealth() (bool, error) {
	data, err := b.request("GET", "/health", nil)
	if err != nil {
		return false, err
	}

	var health map[string]interface{}
	if err := json.Unmarshal(data, &health); err != nil {
		return false, err
	}

	connected, ok := health["connected"].(bool)
	if !ok {
		return false, nil
	}

	return connected, nil
}