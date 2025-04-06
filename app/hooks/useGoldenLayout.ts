import { useEffect, useRef, useState, useCallback } from 'react';
import {
  GoldenLayout,
  ComponentContainer,
  JsonValue,
  LayoutConfig,
  ComponentItemConfig,
  RowOrColumnItemConfig,
  ComponentItem,
  ContentItem,
} from 'golden-layout';
import type { PanelComponent, PanelType } from '~/types/layout';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import capitalize from 'lodash/capitalize';
import ChartPanel from '~/components/panels/ChartPanel';
import TradesPanel from '~/components/panels/TradesPanel';
import AlertsPanel from '~/components/panels/AlertsPanel';
import LightweightChartPanel from '~/components/panels/LightweightChartPanel';
import type { ComponentType } from 'react';

const DEFAULT_CONFIG = {
  settings: {
    showPopoutIcon: false,
    showMaximiseIcon: true,
    showCloseIcon: true,
    reorderEnabled: false,
    constrainDragToContainer: true,
    dragEnabled: false,
  },
  root: {
    type: 'row',
    content: [
      {
        type: 'column',
        content: [
          {
            type: 'component',
            componentType: 'chart',
            title: 'Chart',
          },
          {
            type: 'component',
            componentType: 'lightChart',
            title: 'Lightweight Chart',
          }
        ],
      },
      {
        type: 'column',
        content: [
          {
            type: 'component',
            componentType: 'trades',
            title: 'Trades',
          },
          // {
          //   type: 'component',
          //   componentType: 'alerts',
          //   title: 'Alerts',
          // },
        ],
      },
    ],
  },
} as const;

// Define available panels
const AVAILABLE_PANELS: PanelComponent[] = [
  { type: 'chart', component: ChartPanel },
  { type: 'trades', component: TradesPanel },
  { type: 'alerts', component: AlertsPanel },
  { type: 'lightChart', component: LightweightChartPanel },
];

export function useGoldenLayout(containerRef: React.RefObject<HTMLElement>) {
  const layoutRef = useRef<GoldenLayout>();
  const [isReady, setIsReady] = useState(false);
  const [closedPanels, setClosedPanels] = useState<string[]>([]);
  const isInitializing = useRef(true);

  const restorePanel = useCallback((type: string) => {
    if (!layoutRef.current) return;

    const panel = AVAILABLE_PANELS.find(p => p.type === type);
    if (!panel) return;

    const rootItem = (layoutRef.current as any).root.contentItems[0] as ContentItem;
    const stack = rootItem.contentItems.find((item: ContentItem) => item.type === 'stack');
    if (!stack) return;

    (stack as any).addComponent(type, {}, capitalize(type));
    setClosedPanels(prev => prev.filter(p => p !== type));
  }, []);

  useEffect(() => {
    if (!containerRef.current || layoutRef.current) return;

    const layout = new GoldenLayout(containerRef.current);
    layoutRef.current = layout;

    AVAILABLE_PANELS.forEach(({ type, component: Component }) => {
      layout.registerComponentFactoryFunction(type, (container: ComponentContainer, state: JsonValue = {}) => {
        const root = createRoot(container.element);
        const reactElement = createElement(Component, {
          container,
          config: state,
        });
        
        root.render(reactElement);

        return {
          element: container.element,
          destroy: () => {
            root.unmount();
          },
        };
      });
    });

    layout.on('itemDestroyed', (e) => {
      if (isInitializing.current) return;

      const event = e as unknown as { _target: ComponentItem };
      const item = event._target;
      if (item.type === 'component' && item.componentType) {
        setClosedPanels(prev => {
          if (prev.includes(item.componentType as string)) {
            return prev;
          }
          return [...prev, item.componentType as string];
        });
      }
    });

    layout.loadLayout(DEFAULT_CONFIG as unknown as LayoutConfig);

    const resizeListener = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      layout.setSize(width, height);
    };
    window.addEventListener('resize', resizeListener);
    resizeListener();

    setIsReady(true);
    setTimeout(() => {
      isInitializing.current = false;
    }, 100);

    return () => {
      window.removeEventListener('resize', resizeListener);
      layout.destroy();
      layoutRef.current = undefined;
      setIsReady(false);
      isInitializing.current = true;
    };
  }, []);

  return {
    layout: layoutRef.current,
    isReady,
    closedPanels,
    restorePanel,
  };
} 