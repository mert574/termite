import type { PositionSideV5 } from 'bybit-api';

export interface RiskTableRow {
  stopLossPercentage: number;
  positionSize: number;
  riskAmount: number;
}

/**
 * Calculate position size based on account balance, risk amount, and stop loss percentage
 */
export function calculatePositionSize(params: {
  accountBalance: number;
  riskAmount: number;
  stopLossPercentage: number;
}): number {
  const { accountBalance, riskAmount, stopLossPercentage } = params;
  return (riskAmount / stopLossPercentage) * 100;
}

/**
 * Calculate stop loss price based on entry price, stop loss percentage, and position side
 */
export function calculateStopLossPrice(params: {
  entryPrice: number;
  stopLossPercentage: number;
  side: PositionSideV5;
}): number {
  const { entryPrice, stopLossPercentage, side } = params;
  const multiplier = side === 'Buy' ? 1 - stopLossPercentage / 100 : 1 + stopLossPercentage / 100;
  return entryPrice * multiplier;
}

/**
 * Generate risk table rows based on account balance and risk amount
 */
export function generateRiskTable(params: {
  accountBalance: number;
  riskAmount: number;
  minStopPercentage?: number;
  maxStopPercentage?: number;
  stepSize?: number;
}): RiskTableRow[] {
  const {
    accountBalance,
    riskAmount,
    minStopPercentage = 1.0,
    maxStopPercentage = 3.0,
    stepSize = 0.5,
  } = params;

  const rows: RiskTableRow[] = [];
  let currentStop = minStopPercentage;

  while (currentStop <= maxStopPercentage) {
    const positionSize = calculatePositionSize({
      accountBalance,
      riskAmount,
      stopLossPercentage: currentStop,
    });

    rows.push({
      stopLossPercentage: currentStop,
      positionSize,
      riskAmount,
    });

    currentStop += stepSize;
  }

  return rows;
}

/**
 * Format currency value for display
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage value for display
 */
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
} 