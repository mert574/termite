# Request for Comments (RFC): Open Interest Data Retrieval Endpoint

## **1. Introduction**

This RFC proposes the design and implementation of an API endpoint to serve Open Interest data for various trading pairs. The endpoint will utilize Bybit's API as the data provider, ensuring accurate and up-to-date information.

## **2. Problem Statement**

Open Interest is a crucial metric in trading, representing the total number of outstanding derivative contracts that have not been settled. Providing real-time and historical Open Interest data will enhance traders' ability to make informed decisions. Currently, there is no dedicated endpoint in our system to serve this data.

## **3. Goals and Objectives**

- **Real-Time Data Access:** Provide users with the latest Open Interest data for selected trading pairs.
- **Historical Data Retrieval:** Allow users to query historical Open Interest data over specified time intervals.
- **Scalability:** Ensure the system can handle multiple concurrent requests efficiently.
- **Accuracy:** Maintain data integrity by synchronizing with Bybit's API.

## **4. Design Overview**

### **4.1 Data Source**

- **Provider:** Bybit API
- **REST Endpoint:** `https://api.bybit.com/v5/market/open-interest`
- **WebSocket Stream:** `wss://stream.bybit.com/v5/public/ticker`
- **Reference:** [Bybit API Documentation](https://bybit-exchange.github.io/docs/api-explorer/v5/market/open-interest)

### **4.2 Data Collection**

- **REST API Parameters:**
  - `category` (required): Product type (`linear` or `inverse`)
  - `symbol` (required): Trading pair symbol (e.g., `BTCUSDT`)
  - `intervalTime` (required): Time intervals (`5min`, `15min`, `30min`, `1h`, `4h`, `1d`)
  - `startTime` and `endTime` (optional): Timestamps in milliseconds for historical data queries
  - `limit` (optional): Number of data points to retrieve (default: 50, max: 200)
  - `cursor` (optional): Used for pagination to retrieve large datasets

- **WebSocket for Real-Time Data:**
  - **Topic:** `tickers`
  - **Subscription Message:**
    ```json
    {
      "op": "subscribe",
      "args": ["tickers.BTCUSDT"]
    }
    ```
  - **Response Format:**
    ```json
    {
      "type": "snapshot",
      "topic": "tickers.BTCUSDT",
      "data": {
        "symbol": "BTCUSDT",
        "openInterest": "150000",
        "timestamp": "1706803200000"
      }
    }
    ```

### **4.3 Data Storage**

- **Database:** TimescaleDB (built on PostgreSQL)
- **Data Aggregation:** Only **5-minute Open Interest data** will be stored. Higher timeframes (e.g., 15m, 30m, 1h) will be aggregated from the 5-minute data using continuous aggregates.

- **Schema:**
  ```sql
  CREATE TABLE open_interest (
      symbol TEXT,
      category TEXT,
      timestamp TIMESTAMPTZ NOT NULL,
      open_interest NUMERIC,
      PRIMARY KEY (symbol, category, timestamp)
  );

  -- Convert to a hypertable for time-series performance
  SELECT create_hypertable('open_interest', 'timestamp');

  -- Continuous Aggregates
  CREATE MATERIALIZED VIEW open_interest_15m
  WITH (timescaledb.continuous) AS
  SELECT
      symbol,
      category,
      time_bucket('15 minutes', timestamp) AS bucket,
      AVG(open_interest) AS avg_open_interest
  FROM open_interest
  GROUP BY symbol, category, bucket;

  CREATE MATERIALIZED VIEW open_interest_1h
  WITH (timescaledb.continuous) AS
  SELECT
      symbol,
      category,
      time_bucket('1 hour', timestamp) AS bucket,
      AVG(open_interest) AS avg_open_interest
  FROM open_interest
  GROUP BY symbol, category, bucket;

  -- Compression for historical data
  ALTER TABLE open_interest SET (timescaledb.compress, timescaledb.compress_segmentby = 'symbol,category');
  SELECT add_compression_policy('open_interest', INTERVAL '30 days');
  ```

- **Indexing:** Composite Primary Key `(symbol, category, timestamp)` to optimize query performance.

### **4.4 API Design**

- **Endpoint:** `GET /open-interest/:symbol`
- **Query Parameters:**
  - `category`: Product type (`linear` or `inverse`)
  - `timeframe`: Desired timeframe (`5m`, `15m`, `30m`, `1h`, `4h`, `1d`)
  - `start`: Start timestamp (ISO 8601 format)
  - `end`: End timestamp (ISO 8601 format)

- **Response Format:**
  ```json
  {
    "category": "linear",
    "symbol": "BTCUSDT",
    "list": [
      {
        "openInterest": "150000",
        "timestamp": "1706803200000"
      },
      {
        "openInterest": "152500",
        "timestamp": "1706806800000"
      }
    ]
  }
  ```

- **Error Handling:**
  - Requests for timeframes **not divisible by 5 minutes** will return an error:
    ```json
    { "error": "Invalid timeframe. Supported timeframes are multiples of 5 minutes." }
    ```

## **5. Proof of Concept (PoC) Code**

### **5.1 API Endpoint PoC (Node.js)**

```javascript
const express = require('express');
const { Client } = require('pg');

const app = express();
const client = new Client({ connectionString: 'postgresql://localhost/open_interest' });
client.connect();

app.get('/open-interest/:symbol', async (req, res) => {
    const { symbol } = req.params;
    const { category, timeframe, start, end } = req.query;

    const timeframeMinutes = parseInt(timeframe);
    const supportedViews = {
        15: 'open_interest_15m',
        60: 'open_interest_1h'
    };

    if (![5, 15, 30, 60, 240, 1440].includes(timeframeMinutes)) {
        return res.status(400).json({ error: 'Invalid timeframe. Supported timeframes are multiples of 5 minutes.' });
    }

    try {
        let query;
        if (supportedViews[timeframeMinutes]) {
            query = `SELECT bucket, avg_open_interest
                     FROM ${supportedViews[timeframeMinutes]}
                     WHERE symbol = $1 AND category = $2 AND bucket BETWEEN $3 AND $4
                     ORDER BY bucket ASC;`;
        } else {
            query = `SELECT time_bucket('${timeframeMinutes} minutes', timestamp) AS bucket,
                            AVG(open_interest) AS avg_open_interest
                     FROM open_interest
                     WHERE symbol = $1 AND category = $2 AND timestamp BETWEEN $3 AND $4
                     GROUP BY bucket
                     ORDER BY bucket ASC;`;
        }

        const result = await client.query(query, [symbol, category, new Date(start), new Date(end)]);
        res.json({ category, symbol, list: result.rows });
    } catch (error) {
        console.error('Error retrieving Open Interest:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(3000, () => {
    console.log('Open Interest API is running on port 3000');
});
```

## **6. Backfilling Historical Data**

- **Initial Backfill:** During system initialization, fetch historical Open Interest data for relevant trading pairs using the `startTime` and `endTime` parameters.
- **Data Gaps:** Identify missing data gaps by comparing timestamps in the database and request the missing data from Bybit's API.
- **Pagination:** Utilize the `cursor` parameter to paginate through large datasets efficiently.

## **7. Potential Challenges and Mitigations**

- **Rate Limiting:** Bybit's API imposes rate limits. Implement request queuing and backoff strategies to handle rate limit responses gracefully.
- **Data Latency:** There may be delays in data availability. Ensure the system can handle slight delays without compromising data integrity.
- **Data Consistency:** Implement checks to prevent duplicate data entries and ensure consistency during data ingestion.

## **8. Conclusion**

Implementing the Open Interest data retrieval endpoint will provide traders with valuable insights into market dynamics. By leveraging Bybit's API and robust data storage solutions, we can offer accurate and timely Open Interest information to our users.

---

**Status:** Draft  
**Author:** Mert Yildiz  
**Date:** 2025-02-05
