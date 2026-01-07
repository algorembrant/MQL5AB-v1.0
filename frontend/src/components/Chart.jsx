import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';

const Chart = ({ data, visualElements, onChartClick, drawingMode }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const drawingsRef = useRef([]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 600,
      layout: {
        background: { color: '#0a0a0a' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#1a1a1a' },
        horzLines: { color: '#1a1a1a' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#00ffff',
          labelBackgroundColor: '#00ffff',
        },
        horzLine: {
          color: '#00ffff',
          labelBackgroundColor: '#00ffff',
        },
      },
      rightPriceScale: {
        borderColor: '#2a2a2a',
        scaleMargins: {
          top: 0.1,
          bottom: 0.3,
        },
      },
      timeScale: {
        borderColor: '#2a2a2a',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Add candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#00ff88',
      downColor: '#ff0066',
      borderVisible: false,
      wickUpColor: '#00ff88',
      wickDownColor: '#ff0066',
    });

    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ 
          width: chartContainerRef.current.clientWidth 
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Handle click
    const handleClick = (param) => {
      if (!param.point || !drawingMode) return;

      const price = candleSeries.coordinateToPrice(param.point.y);
      const time = param.time;

      if (onChartClick) {
        onChartClick({ price, time, point: param.point });
      }
    };

    chart.subscribeClick(handleClick);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.unsubscribeClick(handleClick);
      chart.remove();
    };
  }, [drawingMode, onChartClick]);

  // Update data
  useEffect(() => {
    if (!candleSeriesRef.current || !data || data.length === 0) return;

    const formattedData = data.map(d => ({
      time: new Date(d.timestamp).getTime() / 1000,
      open: parseFloat(d.open),
      high: parseFloat(d.high),
      low: parseFloat(d.low),
      close: parseFloat(d.close),
    }));

    const volumeData = data.map(d => ({
      time: new Date(d.timestamp).getTime() / 1000,
      value: parseFloat(d.volume),
      color: d.close >= d.open ? '#00ff8844' : '#ff006644',
    }));

    candleSeriesRef.current.setData(formattedData);
    volumeSeriesRef.current.setData(volumeData);

    // Fit content
    chartRef.current.timeScale().fitContent();
  }, [data]);

  // Draw visual elements
  useEffect(() => {
    if (!candleSeriesRef.current || !visualElements) return;

    // Clear previous drawings
    drawingsRef.current.forEach(drawing => {
      if (drawing.remove) drawing.remove();
    });
    drawingsRef.current = [];

    // Draw new elements
    visualElements.forEach(element => {
      if (element.type === 'horizontal_line') {
        const color = element.action === 'buy_above' ? '#00ff88' : '#ff0066';
        const priceLine = candleSeriesRef.current.createPriceLine({
          price: element.price,
          color: color,
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: element.action === 'buy_above' ? 'Buy >' : 'Sell <',
        });
        drawingsRef.current.push(priceLine);
      } else if (element.type === 'zone') {
        // Create upper and lower lines for zone
        const upperLine = candleSeriesRef.current.createPriceLine({
          price: element.upper,
          color: '#ffaa00',
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: 'Zone Upper',
        });
        const lowerLine = candleSeriesRef.current.createPriceLine({
          price: element.lower,
          color: '#ffaa00',
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: 'Zone Lower',
        });
        drawingsRef.current.push(upperLine, lowerLine);
      }
    });
  }, [visualElements]);

  return (
    <div className="relative">
      <div 
        ref={chartContainerRef} 
        className={`w-full ${drawingMode ? 'cursor-crosshair' : 'cursor-default'}`}
      />
      {drawingMode && (
        <div className="absolute top-4 left-4 bg-cyan-500/20 border border-cyan-500/50 px-4 py-2 rounded-lg backdrop-blur-sm">
          <span className="text-cyan-400 text-sm font-bold">
            Drawing Mode: {drawingMode.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
};

export default Chart;