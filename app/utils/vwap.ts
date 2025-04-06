import type { Time } from 'lightweight-charts';

export interface VWAPCandle {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface VWAPData {
  time: Time;
  value: number;
}

export class VWAPCalculator {
  private sessions: Map<string, VWAPCandle[]> = new Map();
  private lastDate: string = '';
  private currentCandle: VWAPCandle | null = null;

  public addCandle(candle: VWAPCandle): VWAPData[] {
    const candleDate = new Date(Number(candle.time) * 1000).toDateString();
    
    // Initialize new session if needed
    if (!this.sessions.has(candleDate)) {
      this.sessions.set(candleDate, []);
    }

    // Store current candle for real-time updates
    this.currentCandle = candle;

    // Add candle to current session
    const sessionCandles = this.sessions.get(candleDate);
    if (sessionCandles) {
      // Update or add the candle
      const existingIndex = sessionCandles.findIndex(c => c.time === candle.time);
      if (existingIndex !== -1) {
        sessionCandles[existingIndex] = candle;
      } else {
        sessionCandles.push(candle);
      }
    }

    this.lastDate = candleDate;
    return this.calculateAll();
  }

  public addCandles(candles: VWAPCandle[]): VWAPData[] {
    // Group candles by session
    candles.forEach(candle => {
      const candleDate = new Date(Number(candle.time) * 1000).toDateString();
      if (!this.sessions.has(candleDate)) {
        this.sessions.set(candleDate, []);
      }
      const sessionCandles = this.sessions.get(candleDate);
      if (sessionCandles) {
        // Update or add the candle
        const existingIndex = sessionCandles.findIndex(c => c.time === candle.time);
        if (existingIndex !== -1) {
          sessionCandles[existingIndex] = candle;
        } else {
          sessionCandles.push(candle);
        }
      }
    });

    // Set last date to today
    const now = new Date();
    this.lastDate = now.toDateString();

    return this.calculateAll();
  }

  private calculateAll(): VWAPData[] {
    const allVwapPoints: VWAPData[] = [];

    // Sort sessions by date
    const sortedDates = Array.from(this.sessions.keys()).sort();

    // Calculate VWAP for each session
    sortedDates.forEach(date => {
      const sessionCandles = this.sessions.get(date) || [];
      // Sort candles by time within each session
      sessionCandles.sort((a, b) => Number(a.time) - Number(b.time));

      let cumulativeTPV = 0;
      let cumulativeVolume = 0;

      const sessionPoints = sessionCandles.map(candle => {
        const typicalPrice = (candle.high + candle.low + candle.close) / 3;
        const volume = candle.volume || 0;

        cumulativeTPV += typicalPrice * volume;
        cumulativeVolume += volume;

        return {
          time: candle.time,
          value: cumulativeVolume ? cumulativeTPV / cumulativeVolume : typicalPrice
        };
      });

      allVwapPoints.push(...sessionPoints);
    });

    // Sort all points by time to ensure ascending order
    return allVwapPoints.sort((a, b) => Number(a.time) - Number(b.time));
  }
} 