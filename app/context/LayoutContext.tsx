import { createContext, useContext, type ReactNode } from 'react';
import type { PanelComponent } from '~/types/layout';

interface LayoutContextType {
  closedPanels: string[];
  restorePanel: (type: string) => void;
  isReady: boolean;
}

const LayoutContext = createContext<LayoutContextType | null>(null);

interface LayoutProviderProps {
  children: ReactNode;
  value: LayoutContextType;
}

export function LayoutProvider({ children, value }: LayoutProviderProps) {
  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
} 