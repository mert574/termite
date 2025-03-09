-- Function to create continuous aggregate for a symbol and interval
CREATE OR REPLACE FUNCTION create_symbol_continuous_aggregate(
    symbol TEXT,
    interval_name TEXT,
    interval_value INTERVAL
) RETURNS void AS $$
BEGIN
    EXECUTE format(
        $sql$
        CREATE MATERIALIZED VIEW price_klines_%s_%s
        WITH (timescaledb.continuous) AS
        SELECT
            time_bucket(%L, ts) AS ts,
            FIRST(open, ts) AS open,
            MAX(high) AS high,
            MIN(low) AS low,
            LAST(close, ts) AS close,
            SUM(volume) AS volume
        FROM price_klines_%s
        GROUP BY time_bucket(%L, ts);
        $sql$,
        symbol,
        interval_name,
        interval_value,
        symbol,
        interval_value
    );
END;
$$ LANGUAGE plpgsql;

-- Function to add refresh policy for a symbol's continuous aggregate
CREATE OR REPLACE FUNCTION add_symbol_refresh_policy(
    symbol TEXT,
    interval_name TEXT,
    start_offset INTERVAL,
    end_offset INTERVAL,
    schedule_interval INTERVAL
) RETURNS void AS $$
BEGIN
    EXECUTE format(
        $sql$
        SELECT add_continuous_aggregate_policy('price_klines_%s_%s',
            start_offset => %L,
            end_offset => %L,
            schedule_interval => %L);
        $sql$,
        symbol,
        interval_name,
        start_offset,
        end_offset,
        schedule_interval
    );
END;
$$ LANGUAGE plpgsql;

-- Create continuous aggregates for BTCUSDT
CREATE MATERIALIZED VIEW price_klines_BTCUSDT_15m
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('00:15:00', ts) AS ts,
    FIRST(open, ts) AS open,
    MAX(high) AS high,
    MIN(low) AS low,
    LAST(close, ts) AS close,
    SUM(volume) AS volume
FROM price_klines_BTCUSDT
GROUP BY time_bucket('00:15:00', ts);

CREATE MATERIALIZED VIEW price_klines_BTCUSDT_30m
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('00:30:00', ts) AS ts,
    FIRST(open, ts) AS open,
    MAX(high) AS high,
    MIN(low) AS low,
    LAST(close, ts) AS close,
    SUM(volume) AS volume
FROM price_klines_BTCUSDT
GROUP BY time_bucket('00:30:00', ts);

CREATE MATERIALIZED VIEW price_klines_BTCUSDT_1h
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('01:00:00', ts) AS ts,
    FIRST(open, ts) AS open,
    MAX(high) AS high,
    MIN(low) AS low,
    LAST(close, ts) AS close,
    SUM(volume) AS volume
FROM price_klines_BTCUSDT
GROUP BY time_bucket('01:00:00', ts);

CREATE MATERIALIZED VIEW price_klines_BTCUSDT_4h
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('04:00:00', ts) AS ts,
    FIRST(open, ts) AS open,
    MAX(high) AS high,
    MIN(low) AS low,
    LAST(close, ts) AS close,
    SUM(volume) AS volume
FROM price_klines_BTCUSDT
GROUP BY time_bucket('04:00:00', ts);

CREATE MATERIALIZED VIEW price_klines_BTCUSDT_12h
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('12:00:00', ts) AS ts,
    FIRST(open, ts) AS open,
    MAX(high) AS high,
    MIN(low) AS low,
    LAST(close, ts) AS close,
    SUM(volume) AS volume
FROM price_klines_BTCUSDT
GROUP BY time_bucket('12:00:00', ts);

CREATE MATERIALIZED VIEW price_klines_BTCUSDT_1d
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', ts) AS ts,
    FIRST(open, ts) AS open,
    MAX(high) AS high,
    MIN(low) AS low,
    LAST(close, ts) AS close,
    SUM(volume) AS volume
FROM price_klines_BTCUSDT
GROUP BY time_bucket('1 day', ts);

-- Add refresh policies for BTCUSDT
SELECT add_continuous_aggregate_policy('price_klines_BTCUSDT_15m',
    start_offset => INTERVAL '30 minutes',
    end_offset => INTERVAL '0',
    schedule_interval => INTERVAL '5 seconds');

SELECT add_continuous_aggregate_policy('price_klines_BTCUSDT_30m',
    start_offset => INTERVAL '1 hour',
    end_offset => INTERVAL '0',
    schedule_interval => INTERVAL '5 seconds');

SELECT add_continuous_aggregate_policy('price_klines_BTCUSDT_1h',
    start_offset => INTERVAL '2 hours',
    end_offset => INTERVAL '0',
    schedule_interval => INTERVAL '5 seconds');

SELECT add_continuous_aggregate_policy('price_klines_BTCUSDT_4h',
    start_offset => INTERVAL '8 hours',
    end_offset => INTERVAL '0',
    schedule_interval => INTERVAL '5 seconds');

SELECT add_continuous_aggregate_policy('price_klines_BTCUSDT_12h',
    start_offset => INTERVAL '24 hours',
    end_offset => INTERVAL '0',
    schedule_interval => INTERVAL '5 seconds');

SELECT add_continuous_aggregate_policy('price_klines_BTCUSDT_1d',
    start_offset => INTERVAL '2 days',
    end_offset => INTERVAL '0',
    schedule_interval => INTERVAL '5 seconds');
