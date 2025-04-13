# Request for Comments (RFC): Price Kline Retrieval System

## **1. Introduction**

This RFC outlines the design and implementation plan for an API that provides historical price bar chart (kline) information. The system will utilize Bybit's API as the data provider and leverage TimescaleDB for efficient time-series data management.

## **2. Problem Statement**

There is a need to implement an API endpoint that delivers historical price kline data. This data is essential for technical analysis, algorithmic trading, and various other financial applications. The goal is to ensure high performance, scalability, and flexibility in data retrieval.

## **3. Goals and Objectives**

- **Real-Time Data Access:** Provide real-time price updates using WebSocket.
- **Historical Data Retrieval:** Support efficient querying for historical price data.
- **Scalability:** Ensure the system can handle large volumes of data and concurrent requests.
- **Flexibility:** Allow users to request custom timeframes for price data.

## **4. Design Overview**

### **4.1 Data Source**

- **Provider:** Bybit API (WebSocket and REST API)
- **Real-Time Data:** Bybit WebSocket API for live price updates.
- **Historical Data:** Bybit REST API for backfilling and historical data queries.

### **4.2 Data Storage Structure**

- **Database:** TimescaleDB (PostgreSQL-based time-series database)
- **5-Minute Aggregations:** Store data in 5-minute intervals as the base aggregation.
- **Cached Timeframes:** Pre-aggregate common timeframes (e.g., 5m, 15m, 1h) using continuous aggregates.
- **OHLCV Data:** Store Open, High, Low, Close, and Volume (OHLCV) data.
- **Data Compression:** Apply compression policies for historical data to optimize storage.

### **4.3 Retrieval Strategy**

1. **Check Cached Timeframes:** Query from pre-aggregated data.
2. **Dynamic Aggregation:** If no cached data matches, aggregate from the base 5-minute data.

## **5. Data Model**

### **5.1 TimescaleDB Schema**

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

-- Convert to hypertable
SELECT create_hypertable('price_kline', 'timestamp');

-- Continuous Aggregates
CREATE MATERIALIZED VIEW price_kline_15m
WITH (timescaledb.continuous) AS
SELECT
    symbol,
    time_bucket('15 minutes', timestamp) AS bucket,
    FIRST(open, timestamp) AS open,
    MAX(high) AS high,
    MIN(low) AS low,
    LAST(close, timestamp) AS close,
    SUM(volume) AS volume
FROM price_kline
GROUP BY symbol, bucket;

-- Compression Policy
ALTER TABLE price_kline SET (timescaledb.compress, timescaledb.compress_segmentby = 'symbol, timeframe');
SELECT add_compression_policy('price_kline', INTERVAL '30 days');
```

### **5.2 Indexing**

- Composite Primary Key: `(symbol, timeframe, timestamp)`
- Additional indexes for optimizing specific queries.

## **6. API Design**

### **6.1 Endpoint**

`GET /price-kline/:symbol`

### **6.2 Query Parameters**

- `symbol`: Trading pair (e.g., BTCUSDT)
- `timeframe`: Timeframe in minutes (e.g., 5, 15, 60)
- `start`: Start timestamp
- `end`: End timestamp

### **6.3 Response Format**

```json
[
  { "timestamp": "2024-01-01T00:00:00Z", "open": 1000, "high": 1050, "low": 990, "close": 1020, "volume": 500 },
  { "timestamp": "2024-01-01T00:15:00Z", "open": 1020, "high": 1080, "low": 1010, "close": 1070, "volume": 650 }
]
```

## **7. Proof of Concept (PoC) Code**

### **7.1 Real-Time Data Ingestion via WebSocket (Node.js)**

```javascript
const WebSocket = require('ws');
const { Client } = require('pg');

const ws = new WebSocket('wss://stream.bybit.com/v5/public/linear');
const client = new Client({ connectionString: 'postgresql://localhost/price_kline_db' });
client.connect();

async function insertKline(symbol, timestamp, open, high, low, close, volume) {
    await client.query(
        `INSERT INTO price_kline (symbol, timeframe, timestamp, open, high, low, close, volume)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (symbol, timeframe, timestamp)
         DO UPDATE SET open = EXCLUDED.open, high = EXCLUDED.high, low = EXCLUDED.low, close = EXCLUDED.close, volume = EXCLUDED.volume;`,
        [symbol, '5m', timestamp, open, high, low, close, volume]
    );
}

ws.on('open', () => {
    ws.send(JSON.stringify({
        op: 'subscribe',
        args: ['kline.5.BTCUSDT'] // Subscribe to 5-minute kline data
    }));
    console.log('Subscribed to BTCUSDT 5m kline.');
});

ws.on('message', async (data) => {
    const message = JSON.parse(data);
    if (message.topic === 'kline.5.BTCUSDT' && message.data) {
        const kline = message.data;
        await insertKline(
            kline.symbol,
            new Date(kline.start),
            parseFloat(kline.open),
            parseFloat(kline.high),
            parseFloat(kline.low),
            parseFloat(kline.close),
            parseFloat(kline.volume)
        );
    }
});

ws.on('error', (error) => {
    console.error('WebSocket Error:', error);
});

ws.on('close', () => {
    console.log('WebSocket connection closed. Reconnecting in 5 seconds...');
    setTimeout(() => {
        ws = new WebSocket('wss://stream.bybit.com/v5/public/linear');
    }, 5000);
});
```

### **7.2 Data Ingestion PoC (Node.js) with Bybit API**

```javascript
const { Client } = require('pg');
const axios = require('axios');

const client = new Client({ connectionString: 'postgresql://localhost/price_kline_db' });
client.connect();

async function insertKline(symbol, timestamp, open, high, low, close, volume) {
    await client.query(
        `INSERT INTO price_kline (symbol, timeframe, timestamp, open, high, low, close, volume)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (symbol, timeframe, timestamp)
         DO UPDATE SET open = EXCLUDED.open, high = EXCLUDED.high, low = EXCLUDED.low, close = EXCLUDED.close, volume = EXCLUDED.volume;`,
        [symbol, '5m', timestamp, open, high, low, close, volume]
    );
    console.log('Inserted Price Kline Data');
}

async function fetchBybitKlines(symbol, interval, startTime, endTime) {
    const url = `https://api.bybit.com/v5/market/kline`;
    let cursor = null;

    try {
        do {
            const params = {
                category: 'linear',
                symbol: symbol,
                interval: interval,
                start: startTime,
                end: endTime
            };
            if (cursor) {
                params.cursor = cursor;
            }

            const response = await axios.get(url, { params });
            const klines = response.data.result.list;
            cursor = response.data.result.nextPageCursor;

            for (const kline of klines) {
                await insertKline(symbol, new Date(kline[0]), parseFloat(kline[1]), parseFloat(kline[2]), parseFloat(kline[3]), parseFloat(kline[4]), parseFloat(kline[5]));
            }
        } while (cursor);
    } catch (error) {
        console.error('Error fetching Bybit klines:', error);
    }
}
        });

        const klines = response.data.result.list;
        for (const kline of klines) {
            await insertKline(symbol, new Date(kline[0]), parseFloat(kline[1]), parseFloat(kline[2]), parseFloat(kline[3]), parseFloat(kline[4]), parseFloat(kline[5]));
        }
    } catch (error) {
        console.error('Error fetching Bybit klines:', error);
    }
}

// Example Usage
fetchBybitKlines('BTCUSDT', '5', Date.now() - 3600000, Date.now()); // Fetch last 1 hour of data
```

### **7.3 Data Ingestion PoC (Node.js)**

```javascript
const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://localhost/price_kline_db' });
client.connect();

async function insertKline(symbol, timestamp, open, high, low, close, volume) {
    await client.query(
        `INSERT INTO price_kline (symbol, timeframe, timestamp, open, high, low, close, volume)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (symbol, timeframe, timestamp)
         DO UPDATE SET open = EXCLUDED.open, high = EXCLUDED.high, low = EXCLUDED.low, close = EXCLUDED.close, volume = EXCLUDED.volume;`,
        [symbol, '5m', timestamp, open, high, low, close, volume]
    );
    console.log('Inserted Price Kline Data');
}
```

### **7.4 Data Retrieval PoC (Node.js)**

```javascript
async function getKline(symbol, timeframe, start, end) {
    const query = `SELECT time_bucket('${timeframe} minutes', timestamp) AS bucket,
                          FIRST(open, timestamp) AS open,
                          MAX(high) AS high,
                          MIN(low) AS low,
                          LAST(close, timestamp) AS close,
                          SUM(volume) AS volume
                   FROM price_kline
                   WHERE symbol = $1 AND timestamp BETWEEN $2 AND $3
                   GROUP BY bucket
                   ORDER BY bucket ASC;`;

    const res = await client.query(query, [symbol, new Date(start), new Date(end)]);
    return res.rows;
}

// Example Usage
getKline('BTCUSDT', 15, '2024-01-01T00:00:00Z', '2024-01-02T00:00:00Z')
    .then(data => console.log(data))
    .catch(err => console.error(err));
```

## **8. System Recovery and Backfilling**

### **8.1 Initial Backfill**
- Populate the database with historical data during initial setup.
- Use Bybit's historical data API to fetch large historical datasets.

### **8.2 Downtime Recovery**
- Identify missing data gaps by comparing database timestamps with expected intervals.
- Fetch missing klines using Bybit's REST API with `start` and `end` parameters.

### **8.3 Backfill Automation Example (Node.js)**

```javascript
async function backfillData(symbol, startTime, endTime) {
    let currentTime = startTime;
    const interval = 5 * 60 * 1000; // 5 minutes in milliseconds

    while (currentTime < endTime) {
        await fetchBybitKlines(symbol, '5', currentTime, currentTime + interval);
        currentTime += interval;
    }

    console.log('Backfill completed successfully.');
}

// Example Backfill: Backfill data from 7 days ago to today
backfillData('BTCUSDT', Date.now() - 7 * 24 * 60 * 60 * 1000, Date.now());
```

- **Downtime Recovery:** Use Bybit's historical data service to backfill missing data.
- **Initial Backfill:** Populate the database with historical data during setup.
- **Gap Detection:** Identify and fill data gaps based on timestamps.

## **9. Performance Considerations**

- **Database Optimization:** Leverage TimescaleDB's continuous aggregates and compression.
- **Caching Layer:** Use Redis for frequently accessed data.
- **Parallel Processing:** Utilize PostgreSQL's parallel query capabilities.

## **10. Potential Risks and Mitigations**

- **High Query Latency:** Mitigate with continuous aggregates and caching.
- **Data Consistency:** Implement checks to prevent duplicates.
- **API Rate Limits:** Implement rate-limiting strategies for Bybit API.

## **11. Implementation Plan**

### **Phase 1: Infrastructure and Database Setup**
1. Set up Docker Infrastructure
   ```dockerfile
   # docker-compose.yml
   version: '3.8'
   
   services:
     timescaledb:
       image: timescale/timescaledb:latest-pg14
       environment:
         POSTGRES_DB: price_kline_db
         POSTGRES_USER: ${DB_USER}
         POSTGRES_PASSWORD: ${DB_PASSWORD}
       ports:
         - "5432:5432"
       volumes:
         - timescale_data:/var/lib/postgresql/data
       healthcheck:
         test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
         interval: 10s
         timeout: 5s
         retries: 5
   
     redis:
       image: redis:7-alpine
       ports:
         - "6379:6379"
       volumes:
         - redis_data:/data
       command: redis-server --appendonly yes
       healthcheck:
         test: ["CMD", "redis-cli", "ping"]
         interval: 10s
         timeout: 5s
         retries: 5
   
   volumes:
     timescale_data:
     redis_data:
   ```

2. Create Development Environment Setup
   - Create `.env.example` and `.env` files
   - Add Docker environment variables
   - Add database connection strings
   - Add API keys and secrets

3. Set up TimescaleDB and Create Tables
   ```sql
   -- migrations/001_initial_schema.sql
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

   -- Convert to hypertable
   SELECT create_hypertable('price_kline', 'timestamp');

   -- Create indexes
   CREATE INDEX idx_price_kline_symbol_timeframe ON price_kline (symbol, timeframe);
   CREATE INDEX idx_price_kline_timestamp ON price_kline (timestamp DESC);

   -- Set up compression
   ALTER TABLE price_kline SET (
       timescaledb.compress,
       timescaledb.compress_segmentby = 'symbol,timeframe'
   );

   -- Add compression policy (compress data older than 30 days)
   SELECT add_compression_policy('price_kline', INTERVAL '30 days');
   ```

4. Create Continuous Aggregates
   ```sql
   -- migrations/002_continuous_aggregates.sql
   -- 15-minute aggregation
   CREATE MATERIALIZED VIEW price_kline_15m
   WITH (timescaledb.continuous) AS
   SELECT
       symbol,
       time_bucket('15 minutes', timestamp) AS bucket,
       FIRST(open, timestamp) AS open,
       MAX(high) AS high,
       MIN(low) AS low,
       LAST(close, timestamp) AS close,
       SUM(volume) AS volume
   FROM price_kline
   GROUP BY symbol, bucket;

   -- 1-hour aggregation
   CREATE MATERIALIZED VIEW price_kline_1h
   WITH (timescaledb.continuous) AS
   SELECT
       symbol,
       time_bucket('1 hour', timestamp) AS bucket,
       FIRST(open, timestamp) AS open,
       MAX(high) AS high,
       MIN(low) AS low,
       LAST(close, timestamp) AS close,
       SUM(volume) AS volume
   FROM price_kline
   GROUP BY symbol, bucket;

   -- Add refresh policies
   SELECT add_continuous_aggregate_policy('price_kline_15m',
       start_offset => INTERVAL '1 day',
       end_offset => INTERVAL '1 hour',
       schedule_interval => INTERVAL '15 minutes');

   SELECT add_continuous_aggregate_policy('price_kline_1h',
       start_offset => INTERVAL '7 days',
       end_offset => INTERVAL '1 hour',
       schedule_interval => INTERVAL '1 hour');
   ```

5. Create Database Migration Scripts
   ```typescript
   // migrations/index.ts
   import { drizzle } from 'drizzle-orm/node-postgres';
   import { migrate } from 'drizzle-orm/node-postgres/migrator';
   import { Pool } from 'pg';
   
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
   });
   
   const db = drizzle(pool);
   
   async function runMigrations() {
     console.log('Running migrations...');
     await migrate(db, { migrationsFolder: './migrations' });
     console.log('Migrations completed');
   }
   
   runMigrations()
     .catch(console.error)
     .finally(() => pool.end());
   ```

6. Create Database Schema Types
   ```typescript
   // app/db/schema.ts
   import { pgTable, text, timestamp, numeric } from 'drizzle-orm/pg-core';
   
   export const priceKline = pgTable('price_kline', {
     symbol: text('symbol').notNull(),
     timeframe: text('timeframe').notNull(),
     timestamp: timestamp('timestamp').notNull(),
     open: numeric('open').notNull(),
     high: numeric('high').notNull(),
     low: numeric('low').notNull(),
     close: numeric('close').notNull(),
     volume: numeric('volume').notNull(),
   }, (table) => ({
     pk: primaryKey(table.symbol, table.timeframe, table.timestamp),
   }));
   ```

7. Create Database Connection Pool
   ```typescript
   // app/db/index.ts
   import { drizzle } from 'drizzle-orm/node-postgres';
   import { Pool } from 'pg';
   
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     max: 20,
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
   });
   
   export const db = drizzle(pool);
   ```

### **Phase 2: Historical Data Backfill System**
1. Create Bybit API client wrapper
   - Implement rate limiting
   - Handle API errors and retries
   - Add logging for debugging
2. Implement backfill worker
   - Create queue system for backfill jobs
   - Add progress tracking
   - Implement data validation
3. Create backfill management API
   - Endpoint to trigger backfill
   - Status check endpoint
   - Cancel backfill endpoint

### **Phase 3: Price Kline REST API**
1. Implement core API endpoints
   ```typescript
   // routes/price.ts
   export async function loader({ request }: LoaderFunctionArgs) {
     const url = new URL(request.url);
     const symbol = url.searchParams.get("symbol");
     const timeframe = url.searchParams.get("timeframe");
     const start = url.searchParams.get("start");
     const end = url.searchParams.get("end");
     
     // Validate params
     // Query appropriate continuous aggregate
     // Return formatted response
   }
   ```
2. Add request validation
   - Parameter validation
   - Timeframe validation
   - Date range limits
3. Implement query optimization
   - Use appropriate continuous aggregates
   - Add result caching
   - Implement pagination

### **Phase 4: Error Handling and Monitoring**
1. Add comprehensive error handling
   - API errors
   - Database errors
   - Validation errors
2. Implement monitoring
   - Query performance metrics
   - Error rate tracking
   - Data consistency checks
3. Add logging
   - Request logging
   - Error logging
   - Performance logging

### **Phase 5: Testing and Documentation**
1. Write tests
   - Unit tests for data processing
   - Integration tests for API endpoints
   - Load tests for performance
2. Create documentation
   - API documentation
   - Database schema documentation
   - Deployment guide
3. Create example code
   - API usage examples
   - Common query patterns
   - Error handling examples

### **Phase 6: Real-time Updates (Future)**
1. Implement WebSocket connection
2. Add real-time data processing
3. Implement real-time data storage

### **Success Metrics**
- Query response time < 100ms for 95th percentile
- 99.9% uptime for API endpoints
- Zero data gaps in historical data
- < 1s latency for real-time updates

### **Timeline**
- Phase 1: 2 days
- Phase 2: 3 days
- Phase 3: 2 days
- Phase 4: 2 days
- Phase 5: 2 days
- Phase 6: 3 days

Total estimated time: 14 days

## **12. Conclusion**

This API will provide robust, efficient access to historical and real-time price kline data. By leveraging TimescaleDB and Bybit's API, the system aims to deliver high performance and reliability.

---

**Status:** Final  
**Author:** Mert Yildiz  
**Date:** 2025-02-04

