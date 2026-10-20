import { z } from 'zod';

export const symbolSchema = z.string().trim().toUpperCase()
  .regex(/^[A-Z0-9]{2,30}$/, 'Use a market symbol such as BTCUSDT');

const aggregateTimeframes = z.enum(['15m', '30m', '1h', '4h', '12h', '1d']);

export function priceTable(symbol: string, timeframe?: string): string {
  const base = `price_klines_${symbolSchema.parse(symbol).toLowerCase()}`;
  return timeframe === undefined ? base : `${base}_${aggregateTimeframes.parse(timeframe)}`;
}
