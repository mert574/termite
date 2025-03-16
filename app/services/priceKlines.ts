import { pool } from '~/db';
import type { Timeframe, Kline, KlineAggregate } from '~/db/schema';

export class PriceKlineService {
    /**
     * Insert a single kline
     */
    static async insert(symbol: string, timeframe: Timeframe, kline: Kline) {
        const query = `
            INSERT INTO price_klines_${symbol} (ts, open, high, low, close, volume)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (ts) 
            DO UPDATE SET
                open = EXCLUDED.open,
                high = EXCLUDED.high,
                low = EXCLUDED.low,
                close = EXCLUDED.close,
                volume = EXCLUDED.volume
        `;
        
        await pool.query(query, [
            kline.ts,
            kline.open,
            kline.high,
            kline.low,
            kline.close,
            kline.volume
        ]);
    }

    /**
     * Insert multiple klines in a single transaction
     */
    static async insertMany(symbol: string, timeframe: Timeframe, klines: Kline[]) {
        const values = klines.map(k => 
            `('${k.ts.toISOString()}',${k.open},${k.high},${k.low},${k.close},${k.volume})`
        ).join(',');

        const query = `
            INSERT INTO price_klines_${symbol} (ts, open, high, low, close, volume)
            VALUES ${values}
            ON CONFLICT (ts) 
            DO UPDATE SET
                open = EXCLUDED.open,
                high = EXCLUDED.high,
                low = EXCLUDED.low,
                close = EXCLUDED.close,
                volume = EXCLUDED.volume
        `;

        await pool.query(query);
    }

    /**
     * Get klines from the base table
     */
    static async getKlines(
        symbol: string,
        start: Date,
        end: Date
    ): Promise<Kline[]> {
        const query = `
            SELECT 
                ts,
                open,
                high,
                low,
                close,
                volume
            FROM price_klines_${symbol}
            WHERE ts BETWEEN $1 AND $2
            ORDER BY ts ASC
        `;

        const result = await pool.query<Kline>(query, [start, end]);
        return result.rows;
    }

    /**
     * Get klines from a continuous aggregate view
     */
    static async getAggregatedKlines(
        symbol: string,
        timeframe: Timeframe,
        start: Date,
        end: Date
    ): Promise<KlineAggregate[]> {
        const query = `
            SELECT 
                ts,
                open,
                high,
                low,
                close,
                volume
            FROM price_klines_${symbol}_${timeframe}
            WHERE ts BETWEEN $1 AND $2
            ORDER BY ts ASC
        `;

        const result = await pool.query<KlineAggregate>(query, [start, end]);
        return result.rows;
    }

    /**
     * Delete klines for a specific symbol
     */
    static async deleteKlines(symbol: string, timeframe: Timeframe, start: Date, end: Date) {
        const query = `
            DELETE FROM price_klines_${symbol}
            WHERE ts BETWEEN $1 AND $2
        `;

        await pool.query(query, [start, end]);
    }

    /**
     * Check for gaps in kline data
     */
    static async findGaps(
        symbol: string,
        timeframe: Timeframe,
        start: Date,
        end: Date
    ): Promise<{ start: Date; end: Date }[]> {
        const query = `
            WITH time_series AS (
                SELECT generate_series(
                    $1::timestamptz,
                    $2::timestamptz,
                    '5 minutes'::interval
                ) AS ts
            )
            SELECT
                ts AS gap_start,
                ts + '5 minutes'::interval AS gap_end
            FROM time_series
            LEFT JOIN price_klines_${symbol} pk
                ON pk.ts = ts
            WHERE pk.ts IS NULL
            ORDER BY ts
        `;

        const result = await pool.query<{ gap_start: Date; gap_end: Date }>(
            query,
            [start, end]
        );

        return result.rows.map(gap => ({
            start: gap.gap_start,
            end: gap.gap_end
        }));
    }
} 