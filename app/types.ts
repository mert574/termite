export type Trade = {
  id: number;
  exchangeName: string;
  currencyPair: string;
  positionType: 'Long' | 'Short';
  quantity: number;
  filledQuantity: number;
  entryPrice: number;
  currentPrice: number;
  leverage: number;
  collateral: number;
  status: 'Filled' | 'Partial' | 'Cancelled'
};

export type Account = {
  id: number;
  exchangeName: string;
  availableBalance: number;
  currency: string;
};
