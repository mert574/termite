import { useRef } from 'react';
import 'golden-layout/dist/css/goldenlayout-base.css';
import 'golden-layout/dist/css/themes/goldenlayout-dark-theme.css';
import { useGoldenLayout } from '~/hooks/useGoldenLayout';
import ChartPanel from '~/components/panels/ChartPanel';
import TradesPanel from '~/components/panels/TradesPanel';
import AlertsPanel from '~/components/panels/AlertsPanel';
import StatusBar from './StatusBar';
import { LayoutProvider } from '~/context/LayoutContext';
import type { PanelComponent } from '~/types/layout';

const PANEL_COMPONENTS: PanelComponent[] = [
  { type: 'chart', component: ChartPanel },
  { type: 'trades', component: TradesPanel },
  { type: 'alerts', component: AlertsPanel },
];

export default function DashboardLayout() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isReady, closedPanels, restorePanel } = useGoldenLayout(containerRef, PANEL_COMPONENTS);

  return (
    <LayoutProvider value={{ isReady, closedPanels, restorePanel }}>
      <div className="flex h-screen w-full flex-col bg-gray-900">
        <StatusBar />
        <div className="h-[calc(100vh-4rem)] p-4">
          <div ref={containerRef} className="h-full w-full rounded-lg border border-gray-800">
            {!isReady && (
              <div className="flex h-full items-center justify-center">
                <span className="text-gray-500">Loading...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </LayoutProvider>
  );
} 