import type { Position, Order, Trade, TradingStats } from '~/types/trade';

// Mock active position
export const mockPositions: Position[] = [];

// Mock open orders
export const mockOrders: Order[] = [];

// Mock recent trades
export const mockTrades: Trade[] = [];

// Mock trading statistics
export const mockStats: TradingStats = {
  totalPnl: 175.20,
  winRate: 65.5,
  averageWin: 85.30,
  averageLoss: -45.20,
  largestWin: 250.00,
  largestLoss: -120.00,
  profitFactor: 1.85,
  totalTrades: 24,
};

// Simulate real-time price updates
export function simulatePriceUpdate(currentPrice: number): number {
  const change = (Math.random() - 0.5) * 10; // Random price change between -5 and 5
  return Number((currentPrice + change).toFixed(1));
}

// Update position with new mark price
export function updatePosition(position: Position, newMarkPrice: number): Position {
  const priceDiff = newMarkPrice - position.entryPrice;
  const multiplier = position.side === 'Buy' ? 1 : -1;
  const newUnrealisedPnl = Number((priceDiff * position.size * multiplier).toFixed(2));

  return {
    ...position,
    markPrice: newMarkPrice,
    unrealisedPnl: newUnrealisedPnl,
    updatedAt: Date.now(),
  };
}

// Mock WebSocket events
type TradeDataCallback = (data: Position) => void;
let intervalId: NodeJS.Timeout | null = null;

export function subscribeToTradeUpdates(callback: TradeDataCallback) {
  if (intervalId) return;

  intervalId = setInterval(() => {
    const newMarkPrice = simulatePriceUpdate(mockPosition.markPrice);
    const updatedPosition = updatePosition(mockPosition, newMarkPrice);
    callback(updatedPosition);
  }, 1000); // Update every second

  return () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
} 