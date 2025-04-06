import type {
  OrderSideV5 as BybitOrderSide,
  OrderStatusV5 as BybitOrderStatus,
  OrderTimeInForceV5 as BybitTimeInForce,
  PositionSideV5,
  ExecTypeV5,
} from 'bybit-api';

export type OrderSide = BybitOrderSide;
export type OrderStatus = BybitOrderStatus;
export type PositionSide = PositionSideV5;
export type TimeInForce = BybitTimeInForce;

export interface Position {
  symbol: string;
  side: PositionSide;
  size: number;
  entryPrice: number;
  markPrice: number;
  unrealisedPnl: number;
  takeProfit?: number;
  stopLoss?: number;
  leverage: number;
  liquidationPrice: number;
}

export interface Order {
  orderId: string;
  symbol: string;
  side: OrderSide;
  orderType: 'Limit' | 'Market';
  price: number;
  qty: number;
  orderStatus: OrderStatus;
  takeProfit?: number;
  stopLoss?: number;
}

export interface Trade {
  id: string;
  symbol: string;
  side: OrderSide;
  price: number;
  qty: number;
  realizedPnl: number;
  orderType: 'Market' | 'Limit';
  execType: ExecTypeV5;
  execTime: number;
}

export interface TradingStats {
  totalPnl: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  totalTrades: number;
} 