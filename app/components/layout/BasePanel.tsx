import { useEffect, useRef } from 'react';
import type { ComponentContainer } from 'golden-layout';
import type { PanelProps } from '~/types/layout';

interface BasePanelProps extends PanelProps {
  children: React.ReactNode;
}

export default function BasePanel({ container, config, children }: BasePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // Set up container
    container.element.appendChild(element);

    return () => {
      if (element.parentElement) {
        element.parentElement.removeChild(element);
      }
    };
  }, [container]);

  return (
    <div 
      ref={containerRef} 
      className="h-full w-full bg-gray-800 p-4"
      style={{ position: 'relative' }}
    >
      {children}
    </div>
  );
} 