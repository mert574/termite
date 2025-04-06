import { type ReactNode } from 'react';
import { useCallback } from 'react';

export interface PanelProps {
  id: string;
  title: string;
  children: ReactNode;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  isMinimized?: boolean;
  isMaximized?: boolean;
  className?: string;
}

export default function Panel({
  id,
  title,
  children,
  onClose,
  onMinimize,
  onMaximize,
  isMinimized,
  isMaximized,
  className = '',
}: PanelProps) {
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  const handleMinimize = useCallback(() => {
    if (onMinimize) {
      onMinimize();
    }
  }, [onMinimize]);

  const handleMaximize = useCallback(() => {
    if (onMaximize) {
      onMaximize();
    }
  }, [onMaximize]);

  return (
    <div className={`flex h-full w-full flex-col bg-gray-800 ${className}`}>
      <div className="flex h-10 items-center justify-between border-b border-gray-700 px-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-sm font-medium text-gray-200">{title}</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleMinimize}
            className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
          >
            {isMinimized ? (
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={handleMaximize}
            className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
          >
            {isMaximized ? (
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            ) : (
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={handleClose}
              className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
            >
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <div className={`flex-1 overflow-auto p-4 ${isMinimized ? 'hidden' : ''} ${isMaximized ? 'absolute inset-0 mt-10' : ''}`}>
        {children}
      </div>
    </div>
  );
} 