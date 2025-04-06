import type { PanelProps } from '~/types/layout';
import BasePanel from '~/components/layout/BasePanel';
import LightweightChart from '~/components/tradingview/LightweightChart';

export default function LightweightChartPanel(props: PanelProps) {
  return (
    <BasePanel {...props}>
      <div className="flex h-full w-full">
        <LightweightChart
          symbol="BTCUSDT"
          theme="dark"
        />
      </div>
    </BasePanel>
  );
} 