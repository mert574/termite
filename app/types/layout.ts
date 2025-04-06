import type { ComponentContainer, JsonValue } from 'golden-layout';

export type PanelType = 
  | 'chart'      // TradingView chart panel
  | 'trades'     // Trade management panel
  | 'alerts'     // Alerts panel
  | 'notes'      // Trade notes panel
  | 'monitor'    // Monitoring panel
  | 'history'    // Position log/history panel
  | 'lightChart'; // Lightweight chart panel with Bybit data

export interface PanelProps {
  container: ComponentContainer;
  config: JsonValue;
}

export interface PanelConfig {
  id: string;
  type: PanelType;
  title: string;
  componentState?: Record<string, unknown>;
}

export interface PanelComponent {
  type: PanelType;
  component: React.ComponentType<PanelProps>;
}

export interface Panel {
  id: string;
  title: string;
  type: 'default' | 'chart' | 'trades' | 'alerts';
  isMinimized?: boolean;
  isMaximized?: boolean;
  originalLayout?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
} 