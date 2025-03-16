import { WebsocketClient } from 'bybit-api';
import type { Time } from 'lightweight-charts';
import type { Timeframe } from '~/db/schema';
import type { VWAPCandle } from '~/utils/vwap';

export interface ChartCandle {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ChartDataHandlers {
  onCandleUpdate: (candle: ChartCandle) => void;
  onVWAPUpdate: (data: { time: Time; value: number }[]) => void;
  onNewCandle: (candle: ChartCandle) => void;
}

export class ChartDataService {
  private wsClient: WebsocketClient | null = null;
  private symbol: string;
  private timeframe: Timeframe;
  private handlers: ChartDataHandlers;
  public lastCandleTime: Time | null = null;

  constructor(symbol: string, timeframe: Timeframe, handlers: ChartDataHandlers) {
    this.symbol = symbol;
    this.timeframe = timeframe;
    this.handlers = handlers;
  }

  private getWsInterval(tf: Timeframe): string {
    switch (tf) {
      case '5m': return '5';
      case '15m': return '15';
      case '30m': return '30';
      case '1h': return '60';
      case '4h': return '240';
      case '1d': return 'D';
      default: return '30';
    }
  }

  async loadHistoricalData(): Promise<ChartCandle[]> {
    try {
      const end = new Date();
      const start = new Date(end.getTime() - (14 * 24 * 60 * 60 * 1000)); // Last 14 days

      const response = await fetch(
        `/api/price-klines?symbol=${this.symbol}&timeframe=${this.timeframe}&start=${start.toISOString()}&end=${end.toISOString()}`
      );
      const data = await response.json();

      if (!data.klines) {
        throw new Error('No historical data received');
      }

      return data.klines.map((kline: any) => ({
        time: Math.floor(new Date(kline.ts).getTime() / 1000) as Time,
        open: Number(kline.open),
        high: Number(kline.high),
        low: Number(kline.low),
        close: Number(kline.close),
        volume: Number(kline.volume),
      }));
    } catch (err) {
      console.error('Failed to load historical data:', err);
      throw err;
    }
  }

  initializeWebSocket(): void {
    if (this.wsClient) {
      this.wsClient.closeAll();
    }

    this.wsClient = new WebsocketClient({
      market: 'linear',
      testnet: false,
      reconnectTimeout: 500,
      restOptions: {
        recv_window: 5000,
      },
      wsUrl: 'wss://stream.bybit.com/v5/public/linear',
    });

    this.wsClient.on('update', (data) => {
      if (data.topic?.startsWith('kline.') && data.data?.[0]) {
        const candle = data.data[0];
        const time = Math.floor(Number(candle.start) / 1000) as Time;

        const chartCandle: ChartCandle = {
          time,
          open: Number(candle.open),
          high: Number(candle.high),
          low: Number(candle.low),
          close: Number(candle.close),
          volume: Number(candle.volume),
        };

        // Always update the current candle
        this.handlers.onCandleUpdate(chartCandle);

        // If it's a new candle, trigger the new candle handler
        if (this.isNewCandle(time)) {
          this.handlers.onNewCandle(chartCandle);
        }
      }
    });

    // Subscribe to the kline topic
    this.wsClient.subscribeV5(`kline.${this.getWsInterval(this.timeframe)}.${this.symbol}`, 'linear');
  }

  private isNewCandle(time: Time): boolean {
    if (!this.lastCandleTime || this.lastCandleTime !== time) {
      this.lastCandleTime = time;
      return true;
    }
    return false;
  }

  async changeTimeframe(newTimeframe: Timeframe): Promise<void> {
    if (this.wsClient) {
      // Unsubscribe from current timeframe
      await this.wsClient.unsubscribeV5(
        `kline.${this.getWsInterval(this.timeframe)}.${this.symbol}`,
        'linear'
      );
    }

    this.timeframe = newTimeframe;
    this.lastCandleTime = null;

    // Subscribe to new timeframe
    if (this.wsClient) {
      await this.wsClient.subscribeV5(
        `kline.${this.getWsInterval(this.timeframe)}.${this.symbol}`,
        'linear'
      );
    }
  }

  cleanup(): void {
    if (this.wsClient) {
      this.wsClient.closeAll();
      this.wsClient = null;
    }
  }
} 