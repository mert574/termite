import { useEffect, useRef, useState } from 'react';
import { CandlestickSeries, createChart, LineSeries } from 'lightweight-charts';
import { ClientOnly } from 'remix-utils/client-only';
import type { 
  DeepPartial, 
  ChartOptions, 
  IChartApi, 
  Time,
  ISeriesApi,
} from 'lightweight-charts';
import type { Position } from '~/types/trade';
import { VWAPCalculator } from '~/utils/vwap';
import type { Timeframe } from '~/db/schema';
import { ChartDataService } from '~/services/chartData';

interface LightweightChartProps {
  symbol?: string;
  autosize?: boolean;
  position?: Position | null;
}

interface VWAPData {
  time: Time;
  value: number;
}

const TIMEFRAMES: { label: string; value: Timeframe }[] = [
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '30m', value: '30m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1d', value: '1d' },
];

function SSRFallback() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-2 border-b border-gray-800">
        {TIMEFRAMES.map(({ label, value }) => (
          <button
            key={value}
            disabled
            className="px-3 py-1 text-sm rounded bg-gray-700 text-gray-300"
          >
            {label}
          </button>
        ))}
      </div>
      <div 
        className="flex-1 w-full bg-[#1a1a1a]"
        style={{ minHeight: '0' }}
      />
    </div>
  );
}

function ChartComponent({ symbol = 'BTCUSDT', autosize = true, position }: LightweightChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('30m');
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const vwapSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const chartDataServiceRef = useRef<ChartDataService | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const vwapCalculatorRef = useRef<VWAPCalculator>(new VWAPCalculator());

  // Function to update countdown
  const updateCountdown = () => {
    if (!chartDataServiceRef.current?.lastCandleTime || !mainSeriesRef.current) return;

    const currentTime = Math.floor(Date.now() / 1000);
    const barStartTime = Number(chartDataServiceRef.current.lastCandleTime);
    const barEndTime = barStartTime + (getIntervalSeconds(timeframe));
    const timeLeft = barEndTime - currentTime;

    if (timeLeft > 0) {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      const countdownText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      mainSeriesRef.current.applyOptions({
        title: countdownText,
      });
    }
  };

  // Function to get interval in seconds from timeframe
  const getIntervalSeconds = (tf: Timeframe): number => {
    switch (tf) {
      case '5m': return 5 * 60;
      case '15m': return 15 * 60;
      case '30m': return 30 * 60;
      case '1h': return 60 * 60;
      case '4h': return 4 * 60 * 60;
      case '1d': return 24 * 60 * 60;
      default: return 30 * 60;
    }
  };

  // Function to handle timeframe change
  const handleTimeframeChange = async (newTimeframe: Timeframe) => {
    setTimeframe(newTimeframe);
    
    if (!chartDataServiceRef.current) return;

    // Reset VWAP calculator
    vwapCalculatorRef.current = new VWAPCalculator();

    // Change timeframe in service
    await chartDataServiceRef.current.changeTimeframe(newTimeframe);

    // Load new historical data
    try {
      const candles = await chartDataServiceRef.current.loadHistoricalData();
      if (mainSeriesRef.current && vwapSeriesRef.current && chartRef.current) {
        // Calculate and set VWAP
        const vwapData = vwapCalculatorRef.current.addCandles(candles);
        vwapSeriesRef.current.setData(vwapData);

        // Set candlestick data
        mainSeriesRef.current.setData(candles);
        
        // Set visible range to last 50 candles
        const timeRange = {
          from: candles[candles.length - 50].time,
          to: candles[candles.length - 1].time,
        };
        chartRef.current.timeScale().setVisibleRange(timeRange);
      }
    } catch (err) {
      console.error('Failed to load historical data:', err);
    }
  };

  useEffect(() => {
    let chart: IChartApi | null = null;
    let mainSeries: ISeriesApi<'Candlestick'> | null = null;
    let vwapSeries: ISeriesApi<'Line'> | null = null;

    const initChart = () => {
      if (!chartContainerRef.current) return;

      // Chart configuration
      const chartOptions: DeepPartial<ChartOptions> = {
        layout: {
          background: { color: '#1a1a1a' },
          textColor: '#d1d4dc',
        },
        grid: {
          vertLines: { color: '#363c4e' },
          horzLines: { color: '#363c4e' },
        },
        crosshair: {
          mode: 0,
          vertLine: {
            color: '#758696',
            width: 1,
            style: 3,
            labelBackgroundColor: '#758696',
          },
          horzLine: {
            color: '#758696',
            width: 1,
            style: 3,
            labelBackgroundColor: '#758696',
          },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderColor: '#485c7b',
          tickMarkFormatter(time: number) {
            const date = new Date(time * 1000);
            return date.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            });
          },
        },
        rightPriceScale: {
          borderColor: '#485c7b',
          scaleMargins: {
            top: 0.15,
            bottom: 0.1,
          },
        },
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
      };

      // Create chart instance
      chart = createChart(chartContainerRef.current, chartOptions);
      chartRef.current = chart;

      // Remove watermark by setting its color to transparent
      const watermark = chartContainerRef.current.querySelector('#tv-attr-logo');
      if (watermark) {
        (watermark as HTMLElement).style.display = 'none';
      }

      // Add candlestick series
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
        title: symbol,
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        },
        wickVisible: true,
        borderColor: '#26a69a',
        borderUpColor: '#26a69a',
        borderDownColor: '#ef5350',
        wickColor: '#737375',
      });
      mainSeriesRef.current = mainSeries;

      // Add VWAP series
      vwapSeries = chart.addSeries(LineSeries, {
        color: '#ffeb3b',
        lineWidth: 2,
        title: 'VWAP',
        priceLineVisible: false,
        lineStyle: 0,
        lineType: 0,
        lineVisible: true,
        pointMarkersVisible: false,
        lastPriceAnimation: 0,
      });
      vwapSeriesRef.current = vwapSeries;

      // Initialize chart data service
      const chartDataService = new ChartDataService(symbol, timeframe, {
        onCandleUpdate: (candle: ChartCandle) => {
          if (mainSeriesRef.current) {
            mainSeriesRef.current.update(candle);
          }
        },
        onNewCandle: (candle: ChartCandle) => {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          countdownIntervalRef.current = setInterval(updateCountdown, 1000);
          updateCountdown();

          // Update VWAP with new candle
          if (vwapSeriesRef.current) {
            const vwapData = vwapCalculatorRef.current.addCandle(candle);
            vwapSeriesRef.current.setData(vwapData);
          }
        },
        onVWAPUpdate: (data) => {
          if (vwapSeriesRef.current) {
            vwapSeriesRef.current.setData(data);
          }
        }
      });
      chartDataServiceRef.current = chartDataService;

      // Load initial data and start WebSocket
      chartDataService.loadHistoricalData()
        .then(candles => {
          if (mainSeriesRef.current && vwapSeriesRef.current && chartRef.current) {
            // Calculate and set VWAP
            const vwapData = vwapCalculatorRef.current.addCandles(candles);
            vwapSeriesRef.current.setData(vwapData);

            // Set candlestick data
            mainSeriesRef.current.setData(candles);
            
            // Set visible range to last 50 candles
            const timeRange = {
              from: candles[candles.length - 50].time,
              to: candles[candles.length - 1].time,
            };
            chartRef.current.timeScale().setVisibleRange(timeRange);
          }
        })
        .catch(err => console.error('Failed to load initial data:', err));

      chartDataService.initializeWebSocket();
    };

    // Initialize chart after a small delay to ensure container is ready
    const timer = setTimeout(initChart, 0);

    // Add event listeners
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      if (chartDataServiceRef.current) {
        chartDataServiceRef.current.cleanup();
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (chart) {
        chart.remove();
      }
    };
  }, [symbol]);

  const handleResize = () => {
    if (chartContainerRef.current && chartRef.current) {
      chartRef.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
      });
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center gap-2 p-2 border-b border-gray-800">
        {TIMEFRAMES.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => handleTimeframeChange(value)}
            className={`px-3 py-1 text-sm rounded ${
              timeframe === value
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div 
        ref={chartContainerRef} 
        className="flex-1 w-full bg-[#1a1a1a]"
        style={{ minHeight: '0' }}
      />
    </div>
  );
}

export default function LightweightChart(props: LightweightChartProps) {
  return (
    <ClientOnly fallback={<SSRFallback />}>
      {() => <ChartComponent {...props} />}
    </ClientOnly>
  );
} 