import { useEffect, useState, useCallback } from 'react';
import type { Position, Order } from '~/types/trade';
import { mockPosition, mockOrders, subscribeToTradeUpdates } from '~/mocks/tradeData';

interface TradeVisualizationState {
  position: Position | null;
  orders: Order[];
  isLoading: boolean;
  error: Error | null;
}

export function useTradeVisualization(symbol: string) {
  const [state, setState] = useState<TradeVisualizationState>({
    position: null,
    orders: [],
    isLoading: true,
    error: null,
  });

  // Initialize with mock data
  useEffect(() => {
    setState({
      position: mockPosition,
      orders: mockOrders,
      isLoading: false,
      error: null,
    });
  }, []);

  // Subscribe to position updates
  useEffect(() => {
    const unsubscribe = subscribeToTradeUpdates((updatedPosition) => {
      setState((prev) => ({
        ...prev,
        position: updatedPosition,
      }));
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  // Update take profit
  const updateTakeProfit = useCallback((price: number) => {
    setState((prev) => ({
      ...prev,
      position: prev.position
        ? {
            ...prev.position,
            takeProfit: price,
            updatedAt: Date.now(),
          }
        : null,
    }));
  }, []);

  // Update stop loss
  const updateStopLoss = useCallback((price: number) => {
    setState((prev) => ({
      ...prev,
      position: prev.position
        ? {
            ...prev.position,
            stopLoss: price,
            updatedAt: Date.now(),
          }
        : null,
    }));
  }, []);

  // Calculate risk/reward ratio
  const getRiskRewardRatio = useCallback(() => {
    if (!state.position?.takeProfit || !state.position?.stopLoss) return null;

    const { entryPrice, takeProfit, stopLoss, side } = state.position;
    const isLong = side === 'Long';

    const reward = Math.abs(takeProfit - entryPrice);
    const risk = Math.abs(stopLoss - entryPrice);

    return Number((reward / risk).toFixed(2));
  }, [state.position]);

  return {
    ...state,
    updateTakeProfit,
    updateStopLoss,
    getRiskRewardRatio,
  };
} 