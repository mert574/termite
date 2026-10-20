# Position Planner PRD

## Requirements

The planner compares position sizes, entry levels, take-profit, stop-loss,
and projected profit/loss using user-selected assumptions and public prices.

### Position sizing

- Accept a sample balance, risk amount, entry price, and stop-loss distance.
- Compare position sizes across stop-loss distances.
- Show take-profit and stop-loss levels, leverage assumptions, and risk/reward.
- Keep units, fees, and rounding assumptions visible.

### Planning interface

- Provide long/short scenarios and immediate calculation updates.
- Summarize the selected levels and calculated position size.
- Make values easy to select and copy.
- Overlay planned entry, take-profit, and stop-loss levels on charts.

### Scenario journal

- Save scenarios locally with notes and optional outcomes.
- Compare scenarios by symbol, sizing, entry/exit levels, and risk/reward.
- Use public prices to illustrate how a scenario develops over time.

## Implementation

1. Complete the sizing form and numeric input validation.
2. Display a readable scenario summary.
3. Add planning overlays to charts.
4. Add local persistence, notes, sorting, and filtering.
5. Cover calculations with synthetic examples.

## Technical decisions

- Store scenarios in application state, with browser storage for persistence.
- Use public market-data endpoints for prices.
- Keep calculation logic separate from chart rendering and form state.
