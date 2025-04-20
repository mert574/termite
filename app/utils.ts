import { Trade } from './types';

export function calculateTotalUnrealizedPnL(positions: Trade[]) {
  return positions.reduce((total, position) => {
    const PnL = (position.currentPrice - position.entryPrice) * position.quantity * (position.positionType === 'Short' ? -1 : 1);
    return total + PnL;
  }, 0);
}

export function calculateTotalPositionAmount(positions: Trade[]) {
  return positions.reduce((total, position) => total + Math.abs(position.quantity) * position.currentPrice, 0);
}

export function calculateTotalLongPositions(positions: Trade[]) {
  return positions.filter(position => position.positionType === 'Long').length;
}

export function calculateTotalShortPositions(positions: Trade[]) {
  return positions.filter(position => position.positionType === 'Short').length;
}

export function calculateTotalUsedCollateral(positions: Trade[]) {
  return positions.reduce((total, position) => total + position.collateral, 0);
}
