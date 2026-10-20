# Roadmap

Termite brings market data, chart analysis, and position planning into one dashboard.

## Market-data reliability

- Make historical backfills resumable and idempotent, preserving existing data
  until replacement batches are stored successfully.
- Add progress reporting, cancellation, retry limits, and gap-repair tests using
  synthetic candles and mocked provider responses.
- Support additional symbols through explicit schema provisioning and test
  continuous-aggregate refreshes across all supported timeframes.

## Charts and dashboard

- Synchronize symbol and timeframe selection across charts and panels.
- Persist dashboard layouts and reliably restore closed panels after reload.
- Improve loading, empty, disconnected, and provider-error states.
- Complete the planned price, cumulative volume delta, and open-interest panels
  described in the existing RFCs under `docs/`.

## Position planner

Position tools support local simulation and analysis; exchange execution is out of scope.

- Show editable entry, take-profit, stop-loss, and sizing scenarios alongside charts.
- Add saved scenarios and notes for comparing different setups.
- Cover sizing, fees, and rounding with deterministic examples.

## Interface design

- Redesign the color palette, typography, spacing, and panel hierarchy to give
  Termite a distinctive visual identity and make dense market data easier to read.
- Improve contrast, keyboard navigation, and layouts for smaller screens.

## Verification and maintenance

- Add integration tests for fresh database setup, imports, gap detection, and
  aggregation using generated data.
- Add browser checks for panel restoration, resizing, and chart updates.
