# Layout System Documentation

The layout system is a core component of Termoire's dashboard, implemented using [Golden Layout](https://golden-layout.com/). It provides a flexible workspace that supports multiple panel types including TradingView charts, trade management, alerts, and monitoring panels.

## Core Components

### Layout Context (`app/context/LayoutContext.tsx`)

```typescript
interface LayoutContextType {
  closedPanels: string[];      // List of currently closed panels
  restorePanel: (type: string) => void;  // Function to restore closed panels
  isReady: boolean;           // Layout initialization status
}
```

### Panel Types (`app/types/layout.ts`)

```typescript
type PanelType = 
  | 'chart'      // TradingView chart panel
  | 'trades'     // Trade management panel
  | 'alerts'     // Alerts panel
  | 'notes'      // Trade notes panel
  | 'monitor'    // Monitoring panel
  | 'history';   // Position log/history panel

interface PanelProps {
  container: ComponentContainer;  // Golden Layout container
  config: JsonValue;             // Panel configuration
}
```

The main entry point for the layout system is the `useGoldenLayout` hook in `app/hooks/useGoldenLayout.ts`, which handles initialization, component registration, and panel lifecycle management.

## Features

1. **Panel Management**
   - Drag and drop support
   - Resize capabilities with special handling for TradingView charts
   - Minimize/maximize controls
   - Panel state persistence
   - Layout configuration storage

2. **TradingView Integration**
   - Chart-specific panel controls
   - Theme synchronization
   - Chart state persistence
   - Responsive chart resizing

## Best Practices

1. **Component Creation**
   - Use React.createElement for component creation
   - Clean up properly in destroy functions
   - Handle component state initialization

2. **Layout Management**
   - Use Layout Context for global state
   - Handle window resize events with debouncing
   - Maintain layout persistence
   - Optimize chart resizing operations

3. **Type Safety**
   - Use TypeScript interfaces for all components
   - Maintain strict type checking
   - Document type definitions

## Integration Guide

To add a new panel type:

1. Add the panel type to `PanelType` in `types/layout.ts`
2. Create the panel component implementing `PanelProps`
3. Register the panel in the layout system
4. Update the default configuration if needed

Example:
```typescript
// 1. Add type
type PanelType = 'chart' | 'trades' | 'alerts' | 'notes' | 'monitor' | 'history' | 'newPanel';

// 2. Create component
function NewPanel({ container, config }: PanelProps) {
  return <div>New Panel Content</div>;
}

// 3. Register
const panels: PanelComponent[] = [
  { type: 'newPanel', component: NewPanel },
  // ... other panels
];
```

## Common Issues and Solutions

1. **Panel Not Rendering**
   - Verify component registration in useGoldenLayout
   - Check if the panel type is properly added to PanelType
   - Ensure proper cleanup in the destroy function
   - For chart panels, verify TradingView widget initialization

2. **Layout State Issues**
   - Use Layout Context for managing global state
   - Verify panel restoration logic
   - Check event handling in useGoldenLayout
   - Ensure proper chart state persistence for TradingView panels

3. **Performance Issues**
   - Implement debounced resize handlers
   - Use memoization for panel renders
   - Optimize chart instance management
   - Clean up event listeners and observers

For more details about the implementation, refer to:
- `app/hooks/useGoldenLayout.ts` - Main layout management
- `app/context/LayoutContext.tsx` - Global state management
- `app/types/layout.ts` - Type definitions
- `app/components/tradingview/ChartContainer.tsx` - TradingView integration