# Backfilling Data

This document explains how to backfill historical price data and refresh materialized views in the system.

## Backfilling Historical Data

### Using the API Endpoint

To backfill historical price data for a symbol:

```bash
curl -X POST http://localhost:3000/api/backfill \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSDT",
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-02-01T00:00:00Z"
  }'
```

The backfill process will:
1. Download historical 5-minute candles from Bybit
2. Process and insert the data into the base table
3. Automatically trigger updates of materialized views

### Checking Backfill Status

To check for gaps in the data:

```bash
curl "http://localhost:3000/api/backfill?type=gaps&symbol=BTCUSDT&start=2025-01-01T00:00:00Z&end=2025-02-01T00:00:00Z"
```

## Refreshing Materialized Views

### Automatic Updates

Materialized views are automatically refreshed every 5 seconds with the following lookback periods:
- 15m view: 30 minutes lookback
- 30m view: 1 hour lookback
- 1h view: 2 hours lookback
- 4h view: 8 hours lookback
- 12h view: 24 hours lookback
- 1d view: 2 days lookback

### Manual Refresh

If you need to manually refresh a materialized view for a specific time range:

```sql
-- Replace view_name with: price_klines_15m, price_klines_30m, price_klines_1h, 
-- price_klines_4h, price_klines_12h, or price_klines_1d
CALL refresh_continuous_aggregate('view_name', '2025-01-01 00:00:00+00', '2025-02-01 00:00:00+00');
```

Example:
```sql
-- Refresh 1d view for January 2025
CALL refresh_continuous_aggregate('price_klines_1d', '2025-01-01 00:00:00+00', '2025-02-01 00:00:00+00');
```

### Verifying Data

To verify the latest data in each view:

```sql
-- Check latest data in base table
SELECT MAX(timestamp) FROM price_klines WHERE symbol = 'BTCUSDT' AND timeframe = '5m';

-- Check latest data in materialized views
SELECT MAX(bucket) FROM price_klines_15m WHERE symbol = 'BTCUSDT';
SELECT MAX(bucket) FROM price_klines_30m WHERE symbol = 'BTCUSDT';
SELECT MAX(bucket) FROM price_klines_1h WHERE symbol = 'BTCUSDT';
SELECT MAX(bucket) FROM price_klines_4h WHERE symbol = 'BTCUSDT';
SELECT MAX(bucket) FROM price_klines_12h WHERE symbol = 'BTCUSDT';
SELECT MAX(bucket) FROM price_klines_1d WHERE symbol = 'BTCUSDT';
```

## Troubleshooting

If materialized views are not updating:

1. Check that the background worker is running:
```sql
SELECT * FROM timescaledb_information.jobs WHERE proc_name = 'policy_refresh_continuous_aggregate';
```

2. Check the job stats for any errors:
```sql
SELECT * FROM timescaledb_information.job_stats ORDER BY last_run_started_at DESC LIMIT 5;
```

3. Verify the refresh policies:
```sql
SELECT * FROM timescaledb_information.continuous_aggregates;
``` 