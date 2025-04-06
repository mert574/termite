import type { PanelProps } from '~/types/layout';
import BasePanel from '~/components/layout/BasePanel';

export default function AlertsPanel({ container, config }: PanelProps) {
  return (
    <BasePanel container={container} config={config}>
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-200">Alerts</h3>
        </div>
        <div className="flex flex-col space-y-2">
          {/* Alert items will go here */}
        </div>
      </div>
    </BasePanel>
  );
} 