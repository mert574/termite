import { useCallback, useState, useEffect } from 'react';
import type { OrderTypeV5, PositionSideV5 } from 'bybit-api';
import type { RiskTableRow } from '~/utils/riskCalculator';
import { calculatePositionSize, calculateStopLossPrice, formatCurrency, formatPercentage } from '~/utils/riskCalculator';
import { usePositionBuilder } from '~/context/PositionBuilderContext';

// Constants
const INITIAL_BALANCE = 1200; // $1,200
const RISK_PERCENTAGE = 0.03; // 3% of account balance
const DEFAULT_STOP_LOSS = 1.5;

interface OrderFormProps {
  onSubmit: (values: OrderFormValues) => void;
}

export interface OrderFormValues {
  symbol: string;
  side: PositionSideV5;
  orderType: OrderTypeV5;
  price: number;
  stopLoss: number;
  takeProfit?: number;
  positionSize: number;
  tpAtVwap: boolean;
  tpAtNextFib: boolean;
  moveSlToBreakEven: boolean;
}

export default function OrderForm({
  onSubmit,
}: OrderFormProps) {
  const {
    formState: { symbol, side, stopLossPercentage, riskMultiplier },
    setStopLoss,
  } = usePositionBuilder();

  const [orderType, setOrderType] = useState<OrderTypeV5>('Limit');
  const [price, setPrice] = useState<number>(43250.5); // Default price
  const [tpAtVwap, setTpAtVwap] = useState(false);
  const [tpAtNextFib, setTpAtNextFib] = useState(false);
  const [moveSlToBreakEven, setMoveSlToBreakEven] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default stop loss
  useEffect(() => {
    if (!stopLossPercentage) {
      setStopLoss(DEFAULT_STOP_LOSS);
    }
  }, [stopLossPercentage, setStopLoss]);

  if (!stopLossPercentage) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
        <p className="text-center text-gray-400">Select a stop loss percentage first</p>
      </div>
    );
  }

  const riskAmount = INITIAL_BALANCE * RISK_PERCENTAGE * riskMultiplier;
  const positionSize = calculatePositionSize({
    accountBalance: INITIAL_BALANCE,
    riskAmount,
    stopLossPercentage,
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const stopLoss = calculateStopLossPrice({
      entryPrice: price,
      stopLossPercentage,
      side,
    });

    setIsSubmitting(true);
    try {
      await onSubmit({
        symbol,
        side,
        orderType,
        price,
        stopLoss,
        positionSize,
        tpAtVwap,
        tpAtNextFib,
        moveSlToBreakEven,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [symbol, side, orderType, price, stopLossPercentage, onSubmit, positionSize, tpAtVwap, tpAtNextFib, moveSlToBreakEven]);

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-gray-700 bg-gray-800 p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-gray-200">Create Order</h3>
        <div className="text-sm text-gray-400">
          <span>{riskMultiplier.toFixed(1)}R</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Order Type */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">Order Type</label>
          <div className="flex rounded-md">
            <button
              type="button"
              onClick={() => setOrderType('Market')}
              className={`flex-1 rounded-l-md px-3 py-1.5 text-sm ${
                orderType === 'Market'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Market
            </button>
            <button
              type="button"
              onClick={() => setOrderType('Limit')}
              className={`flex-1 rounded-r-md px-3 py-1.5 text-sm ${
                orderType === 'Limit'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Limit
            </button>
          </div>
        </div>

        {/* Entry Price */}
        <div>
          <label htmlFor="price" className="mb-1 block text-sm font-medium text-gray-300">
            Entry Price
          </label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            disabled={orderType === 'Market'}
            className="block w-full rounded-md border-gray-600 bg-gray-700 py-1.5 text-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-800 sm:text-sm"
          />
        </div>

        {/* Take Profit Options */}
        <div className="col-span-2 space-y-1">
          <label className="block text-sm font-medium text-gray-300">Take Profit</label>
          <div className="space-y-1">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={tpAtVwap}
                onChange={(e) => setTpAtVwap(e.target.checked)}
                className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">TP at VWAP</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={tpAtNextFib}
                onChange={(e) => setTpAtNextFib(e.target.checked)}
                className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">TP at next Fib level</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={moveSlToBreakEven}
                onChange={(e) => setMoveSlToBreakEven(e.target.checked)}
                className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">Move SL to entry after TP</span>
            </label>
          </div>
        </div>
      </div>

      {/* Position Summary */}
      <div className="rounded-md bg-gray-900 p-3 text-sm">
        <div className="mb-2 flex items-center justify-between border-b border-gray-700 pb-2">
          <span className="font-medium text-gray-300">Position Summary</span>
          <span className="font-medium text-gray-300">{symbol}</span>
        </div>
        <div className="space-y-2">
          <div>
            <div className="text-gray-400">Stop Loss</div>
            <div className="font-medium text-gray-200">
              {formatPercentage(stopLossPercentage)}
              <div className="text-sm text-gray-400">
                {formatCurrency(calculateStopLossPrice({
                  entryPrice: price,
                  stopLossPercentage,
                  side,
                }))}
              </div>
            </div>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-gray-400">Position Size</div>
              <div className="font-medium text-gray-200">
                {formatCurrency(positionSize)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-400">Risk Amount</div>
              <div className="font-medium text-gray-200">
                {formatCurrency(riskAmount)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`relative w-full rounded-md px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:cursor-not-allowed disabled:opacity-50
          ${side === 'Buy'
            ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
            : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
          }`}
      >
        {isSubmitting ? (
          <span className="absolute inset-0 flex items-center justify-center">
            <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
        ) : (
          `${side === 'Buy' ? 'Open Long Position' : 'Open Short Position'} (${riskMultiplier.toFixed(1)}R)`
        )}
      </button>
    </form>
  );
} 