package backtest

import (
	"fmt"
	"math"
	"time"
)

type Candle struct {
	Time   time.Time
	Open   float64
	High   float64
	Low    float64
	Close  float64
	Volume int64
}

type Trade struct {
	EntryTime  time.Time
	ExitTime   time.Time
	Type       string // "BUY" or "SELL"
	EntryPrice float64
	ExitPrice  float64
	Volume     float64
	Profit     float64
	ProfitPips float64
}

type BacktestResult struct {
	TotalTrades   int     `json:"totalTrades"`
	WinningTrades int     `json:"winningTrades"`
	LosingTrades  int     `json:"losingTrades"`
	WinRate       float64 `json:"winRate"`
	GrossProfit   float64 `json:"grossProfit"`
	GrossLoss     float64 `json:"grossLoss"`
	NetProfit     float64 `json:"profit"`
	ProfitFactor  float64 `json:"profitFactor"`
	MaxDrawdown   float64 `json:"maxDrawdown"`
	SharpeRatio   float64 `json:"sharpeRatio"`
	EquityCurve   []float64 `json:"equityCurve"`
	Trades        []Trade   `json:"trades"`
}

type Engine struct {
	InitialBalance float64
	CurrentBalance float64
	Equity         float64
	MaxEquity      float64
	Trades         []Trade
	Candles        []Candle
	PointValue     float64
}

func NewEngine(initialBalance float64) *Engine {
	return &Engine{
		InitialBalance: initialBalance,
		CurrentBalance: initialBalance,
		Equity:         initialBalance,
		MaxEquity:      initialBalance,
		Trades:         make([]Trade, 0),
		PointValue:     0.0001, // For forex pairs
	}
}

func (e *Engine) Run(candles []Candle, strategy Strategy) *BacktestResult {
	e.Candles = candles

	for i := 0; i < len(candles); i++ {
		// Run strategy logic
		signal := strategy.OnTick(candles[:i+1])

		if signal != nil {
			e.executeTrade(signal, candles[i:])
		}

		// Update equity
		e.updateEquity()
	}

	return e.calculateResults()
}

func (e *Engine) executeTrade(signal *Signal, remainingCandles []Candle) {
	if len(remainingCandles) < 2 {
		return
	}

	trade := Trade{
		EntryTime:  remainingCandles[0].Time,
		Type:       signal.Type,
		EntryPrice: remainingCandles[0].Close,
		Volume:     signal.Volume,
	}

	// Find exit point
	for i := 1; i < len(remainingCandles); i++ {
		candle := remainingCandles[i]

		// Check stop loss
		if signal.StopLoss > 0 {
			if (signal.Type == "BUY" && candle.Low <= signal.StopLoss) ||
				(signal.Type == "SELL" && candle.High >= signal.StopLoss) {
				trade.ExitTime = candle.Time
				trade.ExitPrice = signal.StopLoss
				break
			}
		}

		// Check take profit
		if signal.TakeProfit > 0 {
			if (signal.Type == "BUY" && candle.High >= signal.TakeProfit) ||
				(signal.Type == "SELL" && candle.Low <= signal.TakeProfit) {
				trade.ExitTime = candle.Time
				trade.ExitPrice = signal.TakeProfit
				break
			}
		}

		// Exit after N candles if no SL/TP hit
		if i >= 50 {
			trade.ExitTime = candle.Time
			trade.ExitPrice = candle.Close
			break
		}
	}

	// Calculate profit
	if !trade.ExitTime.IsZero() {
		priceDiff := trade.ExitPrice - trade.EntryPrice
		if trade.Type == "SELL" {
			priceDiff = -priceDiff
		}

		trade.ProfitPips = priceDiff / e.PointValue
		trade.Profit = trade.ProfitPips * trade.Volume * 10 // Simplified

		e.CurrentBalance += trade.Profit
		e.Trades = append(e.Trades, trade)
	}
}

func (e *Engine) updateEquity() {
	e.Equity = e.CurrentBalance
	if e.Equity > e.MaxEquity {
		e.MaxEquity = e.Equity
	}
}

func (e *Engine) calculateResults() *BacktestResult {
	result := &BacktestResult{
		TotalTrades: len(e.Trades),
		Trades:      e.Trades,
	}

	if len(e.Trades) == 0 {
		return result
	}

	var grossProfit, grossLoss float64
	var returns []float64
	equityCurve := []float64{e.InitialBalance}

	for _, trade := range e.Trades {
		if trade.Profit > 0 {
			result.WinningTrades++
			grossProfit += trade.Profit
		} else {
			result.LosingTrades++
			grossLoss += math.Abs(trade.Profit)
		}

		// Calculate return
		if len(equityCurve) > 0 {
			lastEquity := equityCurve[len(equityCurve)-1]
			returns = append(returns, trade.Profit/lastEquity)
			equityCurve = append(equityCurve, lastEquity+trade.Profit)
		}
	}

	result.WinRate = (float64(result.WinningTrades) / float64(result.TotalTrades)) * 100
	result.GrossProfit = grossProfit
	result.GrossLoss = grossLoss
	result.NetProfit = e.CurrentBalance - e.InitialBalance

	if grossLoss > 0 {
		result.ProfitFactor = grossProfit / grossLoss
	}

	// Calculate max drawdown
	result.MaxDrawdown = e.calculateMaxDrawdown(equityCurve)

	// Calculate Sharpe ratio
	if len(returns) > 1 {
		result.SharpeRatio = e.calculateSharpeRatio(returns)
	}

	result.EquityCurve = equityCurve

	return result
}

func (e *Engine) calculateMaxDrawdown(equityCurve []float64) float64 {
	var maxDrawdown float64
	peak := equityCurve[0]

	for _, equity := range equityCurve {
		if equity > peak {
			peak = equity
		}

		drawdown := ((peak - equity) / peak) * 100
		if drawdown > maxDrawdown {
			maxDrawdown = drawdown
		}
	}

	return maxDrawdown
}

func (e *Engine) calculateSharpeRatio(returns []float64) float64 {
	// Calculate mean return
	var sum float64
	for _, r := range returns {
		sum += r
	}
	mean := sum / float64(len(returns))

	// Calculate standard deviation
	var variance float64
	for _, r := range returns {
		variance += math.Pow(r-mean, 2)
	}
	stdDev := math.Sqrt(variance / float64(len(returns)))

	if stdDev == 0 {
		return 0
	}

	// Annualized Sharpe ratio (assuming 252 trading days)
	return (mean / stdDev) * math.Sqrt(252)
}

// Strategy interface
type Strategy interface {
	OnTick(candles []Candle) *Signal
}

// Signal represents a trading signal
type Signal struct {
	Type       string  // "BUY" or "SELL"
	Volume     float64
	StopLoss   float64
	TakeProfit float64
}

// Simple moving average crossover strategy
type SMAStrategy struct {
	FastPeriod int
	SlowPeriod int
}

func (s *SMAStrategy) OnTick(candles []Candle) *Signal {
	if len(candles) < s.SlowPeriod {
		return nil
	}

	fastSMA := s.calculateSMA(candles, s.FastPeriod)
	slowSMA := s.calculateSMA(candles, s.SlowPeriod)

	if len(candles) < s.SlowPeriod+1 {
		return nil
	}

	prevFastSMA := s.calculateSMA(candles[:len(candles)-1], s.FastPeriod)
	prevSlowSMA := s.calculateSMA(candles[:len(candles)-1], s.SlowPeriod)

	// Bullish crossover
	if prevFastSMA <= prevSlowSMA && fastSMA > slowSMA {
		return &Signal{
			Type:       "BUY",
			Volume:     0.01,
			StopLoss:   candles[len(candles)-1].Close - 0.001,
			TakeProfit: candles[len(candles)-1].Close + 0.002,
		}
	}

	// Bearish crossover
	if prevFastSMA >= prevSlowSMA && fastSMA < slowSMA {
		return &Signal{
			Type:       "SELL",
			Volume:     0.01,
			StopLoss:   candles[len(candles)-1].Close + 0.001,
			TakeProfit: candles[len(candles)-1].Close - 0.002,
		}
	}

	return nil
}

func (s *SMAStrategy) calculateSMA(candles []Candle, period int) float64 {
	if len(candles) < period {
		return 0
	}

	var sum float64
	start := len(candles) - period
	for i := start; i < len(candles); i++ {
		sum += candles[i].Close
	}

	return sum / float64(period)
}

// Example usage
func RunExample() {
	// Create engine
	engine := NewEngine(10000)

	// Create sample candles
	candles := []Candle{
		// Add your candle data here
	}

	// Create strategy
	strategy := &SMAStrategy{
		FastPeriod: 10,
		SlowPeriod: 20,
	}

	// Run backtest
	results := engine.Run(candles, strategy)

	fmt.Printf("Backtest Results:\n")
	fmt.Printf("Total Trades: %d\n", results.TotalTrades)
	fmt.Printf("Win Rate: %.2f%%\n", results.WinRate)
	fmt.Printf("Net Profit: $%.2f\n", results.NetProfit)
	fmt.Printf("Max Drawdown: %.2f%%\n", results.MaxDrawdown)
}