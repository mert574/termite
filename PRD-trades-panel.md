# Trades Panel Implementation PRD

## Requirements

1. Position Management
   - Position creation with risk-based sizing
     * Input: Stop loss distance in percentage (1.0% to 3.0% in 0.5% increments)
     * Calculate position size based on account balance and risk amount (1R)
     * Show position size table with all stop loss percentages
     * Example with $1200 balance and 1R = $36 (3% of account):
       - 1.0% stop = $3600 position size
       - 1.5% stop = $2400 position size
       - 2.0% stop = $1800 position size
       - 2.5% stop = $1440 position size
       - 3.0% stop = $1200 position size
   - Position closure functionality
   - Aggregate partial positions for the same symbol
   - Display key position metrics (size, entry price, PnL, etc.)
   - Support for take profit and stop loss levels
   - Show liquidation price and leverage

2. Position Creation Interface
   - Position size table showing all stop loss percentages
   - Entry price input (market/limit)
   - Order type selection (Market/Limit)
   - Take profit input (optional)
   - Risk amount display (1R in dollars)
   - Account balance display
   - Leverage selection

3. Active Positions Display
   - Aggregated view of positions per symbol
   - Real-time updates of position metrics
   - Quick actions:
     * Close position
     * Modify TP/SL
     * Add to position
   - Risk visualization (size vs account)
   - Status indicators (Normal, Liq, Adl)

4. Recent Trades Display (Separate Panel)
   - Trade details:
     * Symbol
     * Side (Buy/Sell)
     * Quantity
     * Entry/Exit prices
     * PnL
     * Duration
   - Trade outcome analysis
   - Execution type (Market, Limit, etc.)

5. Real-time Updates
   - Update position information in real-time
   - Highlight value changes
   - Sort positions by importance

## Scope

### In Scope
- Position creation with risk-based sizing
- Position closure functionality
- Position table component with real-time updates
- Separate trades history panel
- Mock data integration
- Basic position management UI (TP/SL updates)
- Responsive layout within panels

### Out of Scope
- Bybit API integration
- Advanced order management
- Complex trade analysis
- Portfolio management

## Technical Decisions

1. Data Structure
   - Use Bybit API types:
     * PositionV5 for position data
     * ExecutionV5 for trade executions
     * ClosedPnLV5 for completed trades
   - Implement position aggregation logic
   - Use React context for real-time updates

2. UI Components
   - Create PositionCreationForm component
     * RiskTable - shows position sizes for different stops
     * OrderForm - entry price, type, TP/SL inputs
   - Create PositionsTable component
     * Aggregated positions view
     * Quick action buttons
     * Status indicators
   - Create separate TradesPanel component
   - Use TailwindCSS for styling
   - Implement number formatting utilities
   - Add tooltips for complex metrics

3. State Management
   - Global state:
     * Account balance
     * Risk amount (1R)
     * Active positions
     * Recent trades
   - Local state:
     * Form inputs
     * Table sorting/filtering
   - Use context for sharing position data

4. Risk Management
   - Implement risk calculation utilities
   - Add position size validation
   - Show risk metrics per position
   - Track account balance changes

## Implementation Steps

1. Phase 1: Position Creation
   - Create RiskTable component
   - Create OrderForm component
   - Implement risk calculation logic
   - Add form validation
   - Set up mock order submission

2. Phase 2: Positions Display
   - Create PositionsTable component
   - Implement position aggregation
   - Add real-time updates
   - Create position management actions

3. Phase 3: Trades History
   - Create separate TradesPanel
   - Implement trade history display
   - Add trade analysis metrics

4. Phase 4: Risk Management
   - Add risk visualization
   - Implement position size limits
   - Add account balance tracking

5. Phase 5: UI Enhancement
   - Add sorting and filtering
   - Implement responsive design
   - Add tooltips and help text
   - Polish animations and transitions 