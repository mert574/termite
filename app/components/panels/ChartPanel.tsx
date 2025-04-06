import type { PanelProps } from '~/types/layout';
import BasePanel from '~/components/layout/BasePanel';
import TradingViewChart from '~/components/tradingview/TradingViewChart';

export default function ChartPanel(props: PanelProps) {
  return (
    <BasePanel {...props}>
      <div className="flex h-full w-full">
        <TradingViewChart
          symbol="BYBIT:BTCUSDT.P"
          interval="30"
        />
      </div>
    </BasePanel>
  );
} 