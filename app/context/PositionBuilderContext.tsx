import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { PositionSideV5 } from 'bybit-api';

interface PositionFormState {
  // Core position values
  symbol: string;
  side: PositionSideV5;
  stopLossPercentage: number | null;
  riskMultiplier: number;
}

interface PositionBuilderContextType {
  // Form state
  formState: PositionFormState;
  
  // Form actions
  setSymbol: (symbol: string) => void;
  setSide: (side: PositionSideV5) => void;
  setStopLoss: (percentage: number | null) => void;
  setRiskMultiplier: (r: number) => void;
  reset: () => void;
}

const defaultFormState: PositionFormState = {
  symbol: 'BTCUSDT',
  side: 'Buy',
  stopLossPercentage: null,
  riskMultiplier: 1.0,
};

const PositionBuilderContext = createContext<PositionBuilderContextType | null>(null);

interface PositionBuilderProviderProps {
  children: React.ReactNode;
  initialSymbol?: string;
}

export function PositionBuilderProvider({
  children,
  initialSymbol = 'BTCUSDT',
}: PositionBuilderProviderProps) {
  const [formState, setFormState] = useState<PositionFormState>(() => ({
    ...defaultFormState,
    symbol: initialSymbol,
  }));

  const setSymbol = useCallback((symbol: string) => {
    setFormState(prev => ({ ...prev, symbol }));
  }, []);

  const setSide = useCallback((side: PositionSideV5) => {
    setFormState(prev => {
      const newState = { ...prev, side };
      return newState;
    });
  }, []);

  const setStopLoss = useCallback((percentage: number | null) => {
    setFormState(prev => ({ ...prev, stopLossPercentage: percentage }));
  }, []);

  const setRiskMultiplier = useCallback((riskMultiplier: number) => {
    setFormState(prev => ({ ...prev, riskMultiplier }));
  }, []);

  const reset = useCallback(() => {
    setFormState(defaultFormState);
  }, []);

  const value = useMemo(() => ({
    formState,
    setSymbol,
    setSide,
    setStopLoss,
    setRiskMultiplier,
    reset,
  }), [formState, setSymbol, setSide, setStopLoss, setRiskMultiplier, reset]);

  return (
    <PositionBuilderContext.Provider value={value}>
      {children}
    </PositionBuilderContext.Provider>
  );
}

export function usePositionBuilder() {
  const context = useContext(PositionBuilderContext);
  if (!context) {
    throw new Error('usePositionBuilder must be used within a PositionBuilderProvider');
  }
  return context;
} 