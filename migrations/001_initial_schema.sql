-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Function to create base price kline table for a symbol
CREATE OR REPLACE FUNCTION create_symbol_price_klines(symbol TEXT)
RETURNS void AS $$
BEGIN
    EXECUTE format(
        $sql$
        CREATE TABLE price_klines_%s (
            ts TIMESTAMPTZ NOT NULL PRIMARY KEY,
            open DOUBLE PRECISION NOT NULL,
            high DOUBLE PRECISION NOT NULL,
            low DOUBLE PRECISION NOT NULL,
            close DOUBLE PRECISION NOT NULL,
            volume DOUBLE PRECISION NOT NULL
        );

        -- Convert to hypertable
        SELECT create_hypertable('price_klines_%s', 'ts');

        -- Set up compression
        ALTER TABLE price_klines_%s SET (
            timescaledb.compress,
            timescaledb.compress_orderby = 'ts DESC'
        );

        -- Add compression policy
        SELECT add_compression_policy('price_klines_%s', INTERVAL '30 days');
        $sql$,
        symbol, symbol, symbol, symbol
    );
END;
$$ LANGUAGE plpgsql;

-- Create BTCUSDT table
SELECT create_symbol_price_klines('BTCUSDT'); 