import { useEffect, useRef, useCallback } from 'react';
import type { Position } from '~/types/trade';

type TradingViewInterval = 
  | '1'   // 1 minute
  | '5'   // 5 minutes
  | '15'  // 15 minutes
  | '30'  // 30 minutes
  | '60'  // 1 hour
  | '240' // 4 hours
  | '1D'  // 1 day
  | '1W'  // 1 week
  | '1M'; // 1 month

interface TradingViewChartProps {
  symbol?: string;
  theme?: 'light' | 'dark';
  autosize?: boolean;
  interval?: TradingViewInterval;
  position?: Position | null;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

export default function TradingViewChart({
  symbol = 'BYBIT:BTCUSD.P',
  autosize = true,
  interval = '30',
  position,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerId = useRef(`tradingview_${Math.random().toString(36).substring(7)}`);
  const widgetRef = useRef<any>(null);

  const initializeWidget = () => {
    try {
      const widget = new window.TradingView.widget({
        // Core settings
        symbol,
        interval,
        container_id: containerId.current,

        // Size settings
        width: '100%',
        height: '100%',
        autosize,

        // Appearance
        theme: 'dark',
        style: '1',
        backgroundColor: '#1a1a1a',

        // Features
        timezone: 'exchange',
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
        locale: 'en',
        hide_side_toolbar: false,
        allow_symbol_change: true,
        hideideas: true,

        // Studies
        studies: [
          {
            id: 'VWAP@tv-basicstudies',
            inputs: {
              length: 20
            }
          }
        ],
        studies_overrides: {
          "volume.volume.color.0": "#ef5350",
          "volume.volume.color.1": "#26a69a",
        },
        
        // Loading screen
        loading_screen: { backgroundColor: "#1a1a1a" },
      });
      widgetRef.current = widget;
    } catch (error) {
      // Handle error silently
    }
  };

  useEffect(() => {
    if (window.TradingView) {
      initializeWidget();
    } else {
      try {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = 'https://s3.tradingview.com/tv.js';
        script.onload = initializeWidget;
        document.head.appendChild(script);
      } catch (error) {
        // Handle error silently
      }
    }

    return () => {
      try {
        if (widgetRef.current) {
          widgetRef.current.remove();
          widgetRef.current = undefined;
        }
      } catch (error) {
        // Handle error silently
      }
    };
  }, []);

  return (
    <div 
      id={containerId.current}
      ref={containerRef} 
      className="w-full h-full"
      style={{ minHeight: '100%', minWidth: '100%' }}
      data-allow="fullscreen; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    />
  );
} 