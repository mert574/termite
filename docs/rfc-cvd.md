# Request for Comments (RFC): Optimized CVD Retrieval System

## **1. Introduction**

This RFC outlines the design and implementation plan for an optimized Cumulative Volume Delta (CVD) retrieval system. The goal is to provide an endpoint for historical CVD kline information.

## **2. Problem Statement**

There is a need to implement an endpoint that provides historical CVD kline information. This endpoint will support various timeframes, enabling efficient retrieval of aggregated CVD data to meet diverse user requirements.

## **3. Goals and Objectives**

- **Performance Optimization:** Reduce query times for common and custom timeframes.
- **Scalability:** Ensure the system handles increasing data volumes efficiently.
- **Flexibility:** Support arbitrary custom timeframes (e.g., 23 minutes, 8.23 hours).

## **4. Design Overview**

### **4.1 Data Storage Structure**

- **Database:** TimescaleDB (an open-source time-series database built on PostgreSQL)
- **5-Minute CVD Aggregations:** All trade data will be aggregated into 5-minute CVD buckets, which serve as the foundational dataset.
- **Cached Timeframes:** Pre-aggregate common timeframes (e.g., 5m, 30m, 4h) to reduce computation for frequent queries using continuous aggregates.
- **OHLC Data:** Store open, high, low, and close CVD values for each interval. The "current" value can be derived from the close value of the latest kline.
- **Data Compression:** Apply TimescaleDB’s compression policy to historical data to optimize storage and query performance.

### **4.2 Data Collection**

- **Source:** Bybit API (WebSocket and REST API)
- **Real-Time Data:** Use Bybit's WebSocket API to collect live trade data.
- **Historical Data:** Use Bybit's [historical data service](https://www.bybit.com/derivatives/en/history-data) to backfill data during initial setup, downtime, or system recovery.

### **4.3 Retrieval Strategy**

1. **Check Cached Timeframes:** Query cached data from the largest to the smallest timeframe.
2. **Aggregation Logic:**
   - If the requested timeframe matches a cached timeframe, return the data directly.
   - If the requested timeframe is divisible by a cached timeframe, aggregate from that cache using continuous aggregates.
   - If no cached timeframe fits, fallback to aggregating 5-minute data.

## **5. Data Model**

### **5.1 TimescaleDB Schema**

```sql
CREATE TABLE cvd_kline (
    symbol TEXT,
    timeframe TEXT,
    timestamp TIMESTAMPTZ,
    open DOUBLE PRECISION,
    high DOUBLE PRECISION,
    low DOUBLE PRECISION,
    close DOUBLE PRECISION,
    PRIMARY KEY (symbol, timeframe, timestamp)
);

-- Convert to a hypertable for time-series performance
SELECT create_hypertable('cvd_kline', 'timestamp');

-- Continuous Aggregates
CREATE MATERIALIZED VIEW cvd_kline_5m
WITH (timescaledb.continuous) AS
SELECT
    symbol,
    time_bucket('5 minutes', timestamp) AS bucket,
    FIRST(open, timestamp) AS open,
    MAX(high) AS high,
    MIN(low) AS low,
    LAST(close, timestamp) AS close
FROM cvd_kline
GROUP BY symbol, bucket;

CREATE MATERIALIZED VIEW cvd_kline_30m
WITH (timescaledb.continuous) AS
SELECT
    symbol,
    time_bucket('30 minutes', timestamp) AS bucket,
    FIRST(open, timestamp) AS open,
    MAX(high) AS high,
    MIN(low) AS low,
    LAST(close, timestamp) AS close
FROM cvd_kline
GROUP BY symbol, bucket;

-- Compression for historical data
ALTER TABLE cvd_kline SET (timescaledb.compress, timescaledb.compress_segmentby = 'symbol, timeframe');
SELECT add_compression_policy('cvd_kline', INTERVAL '30 days');
```

### **5.2 Indexing**

- Composite Primary Key: `(symbol, timeframe, timestamp)`
- Additional indexes can be created as needed for specific query optimizations.

## **6. API Design**

### **6.1 Endpoint**

`GET /cvd/:symbol`

### **6.2 Query Parameters**

- `symbol`: Trading pair (e.g., BTCUSDT)
- `timeframe`: Requested timeframe in minutes or hours (e.g., 23, 8.23)
- `start`: Start timestamp
- `end`: End timestamp

### **6.3 Response Format**

```json
[
  { "timestamp": "2024-01-01T00:00:00Z", "open": 1200, "high": 1250, "low": 1180, "close": 1230 },
  { "timestamp": "2024-01-01T00:23:00Z", "open": 1230, "high": 1300, "low": 1210, "close": 1280 }
]
```

## **7. Algorithm for Data Retrieval**

1. **Identify Cached Timeframes:** Ordered list: `['4h', '30m', '5m', '5m']`
2. **Match Logic:**
   - If `requested_timeframe % cached_timeframe == 0`, aggregate accordingly using materialized views.
   - If no match, fallback to `5m` data.
3. **Aggregation:** Use SQL window functions and TimescaleDB's continuous aggregates for fast queries.

## **8. Proof of Concept (PoC) Code**

#### **8.4 Real-Time Data Ingestion via WebSocket (Node.js)**

```javascript
const WebSocket = require('ws');

const ws = new WebSocket('wss://stream.bybit.com/v5/public/linear');

ws.on('open', () => {
    ws.send(JSON.stringify({
        op: 'subscribe',
        args: ['trade.BTCUSDT']
    }));
    console.log('Subscribed to BTCUSDT trades.');
});

ws.on('message', async (data) => {
    const message = JSON.parse(data);
    if (message.topic === 'trade.BTCUSDT' && message.data) {
        const trades = message.data;
        for (const trade of trades) {
            const timestamp = new Date(trade.T);
            const price = parseFloat(trade.p);
            const volume = parseFloat(trade.v);

            // Assuming insertCVD aggregates this trade data
            await insertCVD('BTCUSDT', timestamp, price, price, price, price);
        }
    }
});

ws.on('error', (error) => {
    console.error('WebSocket Error:', error);
});

ws.on('close', () => {
    console.log('WebSocket connection closed. Attempting to reconnect...');
    setTimeout(() => {
        ws = new WebSocket('wss://stream.bybit.com/v5/public/linear');
    }, 5000);
});
```

*This PoC demonstrates real-time data ingestion from Bybit's WebSocket API, subscribing to BTCUSDT trades and processing incoming trade data to update the CVD database.*

### **8. Proof of Concept (PoC) Code**

#### **8.1 Data Ingestion PoC (Node.js)**

```javascript
const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://localhost/cvd_db' });
client.connect();

async function insertCVD(symbol, timestamp, open, high, low, close) {
    await client.query(
        `INSERT INTO cvd_kline (symbol, timeframe, timestamp, open, high, low, close)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (symbol, timeframe, timestamp)
         DO UPDATE SET open = EXCLUDED.open, high = EXCLUDED.high, low = EXCLUDED.low, close = EXCLUDED.close;`,
        [symbol, '5m', timestamp, open, high, low, close]
    );
    console.log('Inserted CVD Data');
}
```

#### **8.2 Data Retrieval PoC Using Materialized Views (Node.js)**

```javascript
async function getCVD(symbol, timeframe, start, end) {
    const materializedViews = {
        '5m': 'cvd_kline_5m',
        '30m': 'cvd_kline_30m'
    };

    const view = materializedViews[timeframe] || 'cvd_kline';
    const query = view === 'cvd_kline' ?
        `SELECT time_bucket('${timeframe}', timestamp) AS bucket, 
                FIRST(open, timestamp) AS open, 
                MAX(high) AS high, 
                MIN(low) AS low, 
                LAST(close, timestamp) AS close
         FROM ${view}
         WHERE symbol = $1 AND timestamp BETWEEN $2 AND $3
         GROUP BY bucket
         ORDER BY bucket ASC;` :
        `SELECT bucket, open, high, low, close
         FROM ${view}
         WHERE symbol = $1 AND bucket BETWEEN $2 AND $3
         ORDER BY bucket ASC;`;

    const res = await client.query(query, [symbol, new Date(start), new Date(end)]);
    return res.rows;
}

// Example Usage
getCVD('BTCUSDT', '30m', '2024-01-01T00:00:00Z', '2024-01-02T00:00:00Z')
    .then(data => console.log(data))
    .catch(err => console.error(err));
```

#### **8.3 Backfilling PoC (Node.js)**

```javascript
async function backfillCVD(symbol, historicalData) {
    for (const data of historicalData) {
        await insertCVD(symbol, data.timestamp, data.open, data.high, data.low, data.close);
    }
    console.log('Backfilling Completed');
}

// Example historical data backfill
backfillCVD('BTCUSDT', [
    { timestamp: '2024-01-01T00:00:00Z', open: 1000, high: 1050, low: 950, close: 1020 },
    { timestamp: '2024-01-01T00:05:00Z', open: 1020, high: 1080, low: 1010, close: 1070 }
]);
```

*These PoCs demonstrate data ingestion, efficient querying using materialized views, and historical data backfilling. All operations are optimized using TimescaleDB’s continuous aggregates and compression features.*

## **9. System Recovery and Backfilling Considerations**

### **9.1 Handling Downtime and Backfilling**

- **Downtime Recovery:** The system can self-recover using Bybit's historical data service to backfill missing trades.
- **Initial Backfill:** Use Bybit's historical data service to populate the database during initial setup.
- **Process:**
  - Identify missing time ranges.
  - Download historical trade data for those periods.
  - Recalculate CVD and OHLC data accordingly.

### **9.2 Bybit API Support**

- **Availability:** Bybit’s historical data service allows downloading extensive historical trade data.
- **Limitations:**
  - Data retrieval speed may vary depending on data volume.
  - Regular monitoring is required to ensure data consistency after recovery.

## **10. Performance Considerations**

- **Database Optimization:** Leverage TimescaleDB's hypertables, continuous aggregates, and compression features.
- **Caching Layer:** Use Redis for frequently accessed queries.
- **Parallel Aggregation:** Utilize PostgreSQL's parallel query execution.

## **11. Potential Risks and Mitigations**

- **High Latency for Rare Custom Timeframes:** Mitigate with continuous aggregates and caching.
- **Database Overhead:** Regular maintenance with TimescaleDB's built-in retention and compression policies.
- **Downtime Recovery Delays:** Mitigate by optimizing historical data downloads and ensuring redundancy.

## **12. Conclusion**

This design aims to balance performance and flexibility by leveraging TimescaleDB's time-series optimizations and dynamic on-the-fly processing. Feedback is welcome to refine the approach and ensure robust implementation.

---

**Status:** Draft\
**Author:** Mert Yildiz\
**Date:** 2025-02-04

