import { useState, useCallback } from 'react';
import type { Layout } from 'react-grid-layout';
import type { Panel } from '~/types/layout';

interface PanelState {
  isMinimized: boolean;
  isMaximized: boolean;
  layout: Layout;
}

export function usePanels(initialPanels: Panel[], initialLayout: Layout[]) {
  const [panels, setPanels] = useState(initialPanels);
  const [panelStates, setPanelStates] = useState<Record<string, PanelState>>(() => {
    // Initialize panel states with their initial layouts
    const states: Record<string, PanelState> = {};
    initialLayout.forEach((layout) => {
      states[layout.i] = {
        isMinimized: false,
        isMaximized: false,
        layout,
      };
    });
    return states;
  });

  const updateLayout = useCallback((id: string, newLayout: Partial<Layout>) => {
    setPanelStates((prev) => {
      const state = prev[id];
      if (!state) return prev;

      return {
        ...prev,
        [id]: {
          ...state,
          layout: { ...state.layout, ...newLayout },
        },
      };
    });
  }, []);

  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    setPanelStates((prev) => {
      const next = { ...prev };
      newLayout.forEach((layout) => {
        const state = prev[layout.i];
        if (state && !state.isMinimized && !state.isMaximized) {
          next[layout.i] = {
            ...state,
            layout,
          };
        }
      });
      return next;
    });
  }, []);

  const toggleMinimize = useCallback((id: string) => {
    setPanelStates((prev) => {
      const state = prev[id];
      if (!state) return prev;

      const isMinimized = !state.isMinimized;
      return {
        ...prev,
        [id]: {
          ...state,
          isMinimized,
          isMaximized: false,
          layout: {
            ...state.layout,
            h: isMinimized ? 1 : state.layout.h,
            isDraggable: true,
            isResizable: !isMinimized,
          },
        },
      };
    });
  }, []);

  const toggleMaximize = useCallback((id: string) => {
    setPanelStates((prev) => {
      const state = prev[id];
      if (!state) return prev;

      const isMaximized = !state.isMaximized;
      return {
        ...prev,
        [id]: {
          ...state,
          isMaximized,
          isMinimized: false,
          layout: {
            ...state.layout,
            x: isMaximized ? 0 : state.layout.x,
            y: isMaximized ? 0 : state.layout.y,
            w: isMaximized ? 12 : state.layout.w,
            h: isMaximized ? 12 : state.layout.h,
            isDraggable: !isMaximized,
            isResizable: !isMaximized,
          },
        },
      };
    });
  }, []);

  const removePanel = useCallback((id: string) => {
    setPanels((prev) => prev.filter(panel => panel.id !== id));
    setPanelStates((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const getProcessedLayout = useCallback(() => {
    return Object.values(panelStates).map(state => state.layout);
  }, [panelStates]);

  return {
    panels,
    panelStates,
    toggleMinimize,
    toggleMaximize,
    removePanel,
    handleLayoutChange,
    getProcessedLayout,
  };
} 