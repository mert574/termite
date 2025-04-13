# Request for Comments (RFC): Pre-Joined Materialized Views for Market Data

## **1. Introduction**

This RFC outlines the design and implementation plan for creating pre-joined materialized views to optimize the retrieval of consolidated market data, including price klines, Open Interest (OI), Cumulative Volume Delta (CVD), and additional trading indicators. The system will leverage TimescaleDB’s continuous aggregates to improve query performance while maintaining data modularity.

## **2. Problem Statement**

Currently, market data (price, OI, CVD, and indicators) is stored in separate tables. While this modular structure offers flexibility, querying multiple datasets simultaneously can introduce performance bottlenecks, especially under high concurrency or large historical data ranges.

The goal is to create pre-joined materialized views that aggregate relevant data into consolidated datasets for efficient querying without altering the modular storage approach.

## **3. Goals and Objectives**

- **Performance Optimization:** Reduce query latency for combined market data requests.
- **Modular Data Storage:** Maintain separate tables for price, OI, CVD, and indicators.
- **Scalable Architecture:** Allow easy integration of future indicators without significant schema refactoring.
- **Efficient Storage:** Use TimescaleDB’s continuous aggregates and compression to manage data growth.

## **4. Design Overview**

### **4.1 Data Sources**

- **Price Data:** `price_kline` table
- **Open Interest (OI):** `oi_kline` table
- **Cumulative Volume Delta (CVD):** `cvd_kline` table
- **Trading Indicators:** Separate tables per indicator (optional)

### **4.2 Pre-Joined Materialized View Design**

We will create materialized views that join the core datasets (`price_kline`, `oi_kline`, `cvd_kline`) based on the shared `symbol`, `timeframe`, and `timestamp`.

## **5. Database Schema**

### **5.1 Existing Tables**

Assuming the following base tables already exist:

```sql
CREATE TABLE price_kline (
    symbol TEXT,
    timeframe TEXT,
    timestamp TIMESTAMPTZ,
    open DOUBLE PRECISION,
    high DOUBLE PRECISION,
    low DOUBLE PRECISION,
    close DOUBLE PRECISION,
    volume DOUBLE PRECISION,
    PRIMARY KEY (symbol, timeframe, timestamp)
);

CREATE TABLE oi_kline (
    symbol TEXT,
    timeframe TEXT,
    timestamp TIMESTAMPTZ,
    oi_open DOUBLE PRECISION,
    oi_high DOUBLE PRECISION,
    oi_low DOUBLE PRECISION,
    oi_close DOUBLE PRECISION,
    PRIMARY KEY (symbol, timeframe, timestamp)
);

CREATE TABLE cvd_kline (
    symbol TEXT,
    timeframe TEXT,
    timestamp TIMESTAMPTZ,
    cvd_open DOUBLE PRECISION,
    cvd_high DOUBLE PRECISION,
    cvd_low DOUBLE PRECISION,
    cvd_close DOUBLE PRECISION,
    PRIMARY KEY (symbol, timeframe, timestamp)
);
```

### **5.2 Pre-Joined Materialized View**

```sql
CREATE MATERIALIZED VIEW market_data_5m
WITH (timescaledb.continuous, timescaledb.refresh_interval = '5 seconds') AS
SELECT
    p.symbol,
    time_bucket('5 minutes', p.timestamp) AS bucket,

    -- Price Data
    FIRST(p.open, p.timestamp) AS open,
    MAX(p.high) AS high,
    MIN(p.low) AS low,
    LAST(p.close, p.timestamp) AS close,
    SUM(p.volume) AS volume,

    -- Open Interest (OI)
    FIRST(o.oi_open, o.timestamp) AS oi_open,
    MAX(o.oi_high) AS oi_high,
    MIN(o.oi_low) AS oi_low,
    LAST(o.oi_close, o.timestamp) AS oi_close,

    -- Cumulative Volume Delta (CVD)
    FIRST(c.cvd_open, c.timestamp) AS cvd_open,
    MAX(c.cvd_high) AS cvd_high,
    MIN(c.cvd_low) AS cvd_low,
    LAST(c.cvd_close, c.timestamp) AS cvd_close

FROM price_kline p
LEFT JOIN oi_kline o ON p.symbol = o.symbol AND p.timestamp = o.timestamp
LEFT JOIN cvd_kline c ON p.symbol = c.symbol AND p.timestamp = c.timestamp

GROUP BY p.symbol, bucket;

-- Compression Policy
ALTER MATERIALIZED VIEW market_data_5m SET (timescaledb.compress, timescaledb.compress_segmentby = 'symbol');
SELECT add_compression_policy('market_data_5m', INTERVAL '30 days');
```

## **6. API Design**

### **6.1 Endpoint**

`GET /market-data/:symbol`

### **6.2 Query Parameters**

- `symbol`: Trading pair (e.g., BTCUSDT)
- `timeframe`: Timeframe (e.g., 5m, 15m, 1h)
- `start`: Start timestamp
- `end`: End timestamp

### **6.3 Response Format**

```json
[
  {
    "timestamp": "2024-01-01T00:00:00Z",
    "open": 1000,
    "high": 1050,
    "low": 990,
    "close": 1020,
    "volume": 500,
    "oi_open": 150000,
    "oi_high": 155000,
    "oi_low": 148000,
    "oi_close": 152000,
    "cvd_open": 2000,
    "cvd_high": 2200,
    "cvd_low": 1900,
    "cvd_close": 2100
  }
]
```

## **7. Proof of Concept (PoC) Code**

### **7.1 Querying Pre-Joined Materialized View (Node.js)**

```javascript
const { Client } = require('pg');

const client = new Client({ connectionString: 'postgresql://localhost/market_data_db' });
client.connect();

async function getMarketData(symbol, timeframe, start, end) {
    const viewName = `market_data_${timeframe}`;
    const query = `
        SELECT * FROM ${viewName}
        WHERE symbol = $1 AND bucket BETWEEN $2 AND $3
        ORDER BY bucket ASC;
    `;

    const res = await client.query(query, [symbol, new Date(start), new Date(end)]);
    return res.rows;
}

// Example Usage
getMarketData('BTCUSDT', '5m', '2024-01-01T00:00:00Z', '2024-01-02T00:00:00Z')
    .then(data => console.log(data))
    .catch(err => console.error(err));
```

## **8. Performance Considerations**

- **Query Optimization:** Materialized views significantly reduce query times compared to on-the-fly joins.
- **Storage Efficiency:** Compression policies help manage storage requirements.
- **Refresh Policy:** Continuous aggregates will update automatically, but manual refresh can be triggered if needed for specific scenarios.

## **9. Potential Risks and Mitigations**

- **Data Inconsistency:** Ensure data in base tables is consistent before aggregation.
- **View Maintenance Overhead:** Regularly monitor view refresh performance.
- **Storage Growth:** Apply compression and retention policies to manage large datasets.

## **10. Conclusion**

Implementing pre-joined materialized views will enhance the system's performance for consolidated market data queries while maintaining modular data storage. This approach ensures scalability and flexibility for future data integrations.

---

**Status:** Draft  
**Author:** Mert Yildiz  
**Date:** 2025-02-04
