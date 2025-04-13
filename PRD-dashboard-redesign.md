# Dashboard Redesign PRD

## Requirements

### Core Requirements
1. Create a flexible dashboard layout that will support:
   - Position log/history panel area
   - Trade management panel area
   - Technical analysis panel area with TradingView integration
   - Trade notes panel area
   - Alerts panel area
   - Monitoring panel area

2. TradingView Integration Requirements:
   - Advanced charting capabilities
   - Multiple timeframe support
   - Custom indicator support
   - Chart state persistence
   - Responsive chart resizing
   - Theme synchronization
   - Trading pair management:
     - Symbol search and switching
     - Market data integration
     - Real-time price updates
   - Drawing tools:
     - Custom lines and shapes
     - Fibonacci tools
     - Trend lines
     - Drawing persistence
   - Technical indicators:
     - Built-in indicator library
     - Custom indicator support
     - Indicator data access
   - Alert system:
     - Price alerts
     - Indicator-based alerts
     - Drawing-based alerts (trend line breaks)
     - Alert management UI
     - Alert persistence
   - Trade Management Visualization:
     - Active position lines with P&L display
     - Take Profit and Stop Loss lines
     - Entry orders visualization
     - Position size and direction indicators
     - Risk/Reward ratio display
     - Multiple TP/SL levels support
     - Trade statistics overlay
     - Quick modify handles for TP/SL
   - Trade Data Integration:
     - Real-time P&L updates
     - Position size calculations
     - Risk percentage visualization
     - Trade duration tracking
     - Entry/exit execution points
     - Trade history markers

### Functional Requirements
1. Layout and Navigation
   - Responsive, multi-panel layout using Golden Layout
   - Configurable panel positions with drag and drop
   - Collapsible/expandable sections
   - Panel resize capabilities with special handling for TradingView charts
   - Layout persistence with panel state management
   - Status bar with instant tooltips for actions and information

2. Panel System
   - Panel header with title and actions
   - Panel content area with placeholder
   - Panel resize handles
   - Panel minimize/maximize controls
   - Panel close/remove functionality with state tracking
   - Panel drag handles
   - Special panel type for TradingView charts

3. State Management
   - Layout configuration storage using Golden Layout
   - Panel state persistence with closed panel tracking
   - User preferences storage
   - Chart configuration persistence

4. Theme System
   - Dark theme implementation synchronized with TradingView
   - Consistent color system
   - Typography system
   - Spacing system
   - Component styling system using TailwindCSS

## Scope

### Phase 1: Core Layout System ✓
- Implement responsive layout system using Golden Layout
- Create basic panel component with Golden Layout integration
- Add panel resize functionality
- Implement layout persistence
- Create StatusBar component with tooltips

### Phase 2: Panel Management ✓
- Add drag and drop functionality (provided by Golden Layout)
- Implement panel state management (using LayoutContext)
- Add panel actions (minimize, maximize, close)
- Create layout presets
- Panel state persistence with closed panel tracking

### Phase 3: TradingView Integration
- Set up TradingView chart component
- Implement chart-panel integration
- Chart state persistence
- Theme synchronization
- Trading features implementation:
  - Symbol switching interface
  - Timeframe controls
  - Drawing tools integration
  - Indicator management
  - Alert system setup
  - Trade visualization:
    - Position lines with P&L
    - TP/SL levels
    - Risk/Reward display
    - Quick modify controls
- Performance optimizations:
  - Chart instance lifecycle management
  - Memory leak prevention
  - Efficient resize handling
  - WebSocket connection management

### Phase 4: Polish
- Add animations and transitions
- Implement theme system with TradingView sync
- Add keyboard shortcuts for panel management
- Performance optimizations
- Chart performance optimizations

### Out of Scope
- Actual trading features implementation
- API integrations (except TradingView)
- Trading data management
- Trading logic
- Notifications system
- Technical analysis implementation (will use TradingView's built-in tools)

## Implementation

### Technical Architecture
1. Layout System
   - Golden Layout for panel management
   - CSS Grid for main layout
   - Flexbox for panel internals
   - React Context for layout state
   - CSS modules for component styling
   - TradingView widget container management

2. State Management
   - React Context for layout state (LayoutContext)
   - Local storage for layout persistence
   - Custom hooks for panel management (useGoldenLayout)
   - TradingView state management

3. Component Structure
   ```
   app/
     components/
       layout/
         DashboardLayout.tsx
         Panel.tsx
         PanelHeader.tsx
         PanelContent.tsx
         PanelResizeHandle.tsx
         DragHandle.tsx
         StatusBar.tsx
       tradingview/
         ChartContainer.tsx
         ChartControls.tsx
         SymbolSearch.tsx
         TimeframeSelector.tsx
         DrawingToolbar.tsx
         IndicatorPanel.tsx
         AlertManager.tsx
         TradeOverlay.tsx
         TradeControls.tsx
         RiskPanel.tsx
       ui/
         Tooltip.tsx
         Button.tsx
         Icon.tsx
         Dropdown.tsx
     hooks/
       useGoldenLayout.ts
       usePanel.ts
       useLayout.ts
       useDrag.ts
       useResize.ts
       useTradingViewChart.ts
       useSymbolData.ts
       useChartDrawings.ts
       useIndicators.ts
       useAlerts.ts
       useTradeVisualization.ts
       usePositionTracking.ts
       useRiskCalculator.ts
     context/
       LayoutContext.tsx
       ThemeContext.tsx
       ChartContext.tsx
     types/
       layout.ts
       panel.ts
       chart.ts
     utils/
       layout.ts
       persistence.ts
       chartConfig.ts
   ```

### UI/UX Design Principles
1. Layout
   - Dark theme optimized for trading
   - High contrast for important data
   - Clear visual hierarchy
   - Consistent spacing and alignment
   - Seamless chart integration

2. Interaction Design
   - Intuitive panel management
   - Smooth animations
   - Clear visual feedback
   - Keyboard accessibility
   - Efficient chart controls

3. Performance
   - Efficient panel rendering
   - Optimized drag and drop
   - Minimal layout shifts
   - Layout calculation optimization
   - Chart rendering optimization
   - Debounced resize handlers

## Technical Decisions

### Framework Choices
1. UI Components
   - Golden Layout for panel management
   - Radix UI for accessible components (tooltips, etc.)
   - TailwindCSS for styling
   - Framer Motion for animations
   - TradingView Charting Library

2. State Management
   - React Context for UI state
   - Local Storage for persistence
   - Custom hooks for layout logic
   - TradingView widget state management

### Performance Considerations
1. Layout Updates
   - Debounced resize handlers
   - Memoized panel renders
   - Efficient drag updates
   - Optimized chart resizing

2. Memory Management
   - Proper cleanup of resize observers
   - Event listener management
   - Layout calculation optimization
   - Chart instance cleanup
   - WebSocket connection management for charts

### TradingView Integration Considerations

1. Chart Management
   - Efficient instance creation/disposal
   - State synchronization
   - Theme coordination
   - Performance optimization
   - Memory leak prevention
   - WebSocket connection management

2. Feature Integration
   - Custom toolbar integration
   - Chart event handling
   - Layout-aware responsiveness
   - Theme synchronization with the main app
   - Custom indicator management
   - Symbol management:
     - Search interface
     - Market data integration
     - Symbol metadata handling
   - Drawing tools:
     - Tool selection UI
     - Drawing state persistence
     - Drawing event handling
   - Indicator system:
     - Indicator parameter controls
     - Data access and events
     - Custom indicator registration
   - Alert system:
     - Alert creation interface
     - Alert state management
     - Notification handling
     - Alert persistence
   - Trade Management Integration:
     - Position line rendering
     - TP/SL line management
     - P&L calculation and display
     - Risk/Reward visualization
     - Quick modify controls
     - Trade statistics overlay
     - Position size indicators
     - Multiple TP/SL handling
   - Trade Data Handling:
     - Real-time P&L updates
     - Position tracking
     - Risk calculations
     - Trade history markers
     - Entry/exit point tracking

3. State Management
   - Chart configuration persistence
   - User preferences
   - Layout state integration
   - Symbol and timeframe state
   - Drawing objects persistence
   - Indicator configurations
   - Alert definitions and states
   - Trade visualization state:
     - Active positions
     - TP/SL levels
     - Position sizes
     - P&L calculations
     - Risk metrics
     - Modification history

4. Performance Optimizations
   - Lazy chart initialization
   - Efficient resize handling
   - Memory management
   - WebSocket connection management
   - Event debouncing
   - Resource cleanup

## Next Steps
1. ✓ Implement core layout system with Golden Layout
2. ✓ Create StatusBar with tooltips
3. ✓ Complete panel management with Golden Layout
4. Begin TradingView integration:
   - Set up basic chart component with single chart support
   - Implement symbol and timeframe controls
   - Add drawing tools support
   - Set up indicator management
   - Add trade visualization:
     - Position lines and P&L display
     - TP/SL visualization
     - Risk/Reward overlay
     - Quick modify controls
   - Implement alert system
   - Add theme synchronization
   - Optimize performance
5. Plan Phase 4 polish items 