export const timeframes = ['5m', '15m', '30m', '1h', '4h', '12h', '1d'] as const;
export type Timeframe = typeof timeframes[number];

export interface Kline {
    ts: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface KlineAggregate extends Kline {}

export interface PriceKline extends Kline {
    symbol: string;
    timeframe: Timeframe;
}

export interface PriceKlineAggregate extends PriceKline {}