import { useCallback, useState } from 'react';
import type { PanelProps } from '~/types/layout';
import type { OrderFormValues } from '~/components/position/OrderForm';
import type { PositionV5 } from 'bybit-api';
import BasePanel from '~/components/layout/BasePanel';
import PositionCreation from '~/components/position/PositionCreation';
import { PositionBuilderProvider } from '~/context/PositionBuilderContext';

const LEVERAGE = 10; // Fixed 10x leverage

export default function TradesPanel(props: PanelProps) {
  const [, setPositions] = useState<PositionV5[]>([]);

  const handleCreatePosition = useCallback(
    (values: OrderFormValues) => {
      const newPosition: PositionV5 = {
        symbol: values.symbol,
        side: values.side,
        size: values.positionSize.toString(),
        avgPrice: values.price.toString(),
        markPrice: values.price.toString(),
        leverage: LEVERAGE.toString(),
        takeProfit: values.takeProfit?.toString() || '',
        stopLoss: values.stopLoss.toString(),
        unrealisedPnl: '0',
        createdTime: Date.now().toString(),
        updatedTime: Date.now().toString(),
        positionIdx: 0,
        positionStatus: 'Normal',
        riskId: 1,
        riskLimitValue: '0',
        positionValue: (values.price * values.positionSize).toString(),
        tradeMode: 0,
        autoAddMargin: 0,
        liqPrice: '',
        bustPrice: '0',
        positionIM: '0',
        positionMM: '0',
        tpslMode: 'Full',
        sessionAvgPrice: '',
        delta: '0',
        gamma: '0',
        vega: '0',
        theta: '0',
        curRealisedPnl: '0',
        cumRealisedPnl: '0',
        adlRankIndicator: 0,
        isReduceOnly: false,
        mmrSysUpdatedTime: '',
        leverageSysUpdatedTime: '',
        seq: 0,
        openTime: Date.now(),
        positionIMByMp: '0',
        positionMMByMp: '0',
      };

      setPositions((prev) => [...prev, newPosition]);
    },
    []
  );

  return (
    <BasePanel {...props}>
      <div className="h-full overflow-y-auto p-4">
        <PositionBuilderProvider
          initialSymbol="BTCUSDT"
        >
          <PositionCreation onCreatePosition={handleCreatePosition} />
        </PositionBuilderProvider>
      </div>
    </BasePanel>
  );
}
