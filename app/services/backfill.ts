import { BybitService } from '~/services/bybit';
import { PriceKlineService } from '~/services/priceKlines';
import { pool } from '~/db';

interface BackfillOptions {
    symbol: string;
    start: Date;
    end: Date;
    batchSize?: number; // Number of days to fetch in each batch
}

interface BackfillProgress {
    total: number;      // Total number of batches
    current: number;    // Current batch number
    startTime: Date;    // Start time of current batch
    endTime: Date;      // End time of current batch
    status: 'running' | 'completed' | 'failed';
    error?: string;
}

export class BackfillService {
    private bybitService: BybitService;
    private static readonly DEFAULT_BATCH_SIZE = 7; // 7 days per batch
    private static readonly BASE_TIMEFRAME = '5m';

    constructor() {
        this.bybitService = new BybitService();
    }

    /**
     * Start a backfill operation
     */
    async startBackfill(options: BackfillOptions): Promise<BackfillProgress> {
        const batchSize = options.batchSize || BackfillService.DEFAULT_BATCH_SIZE;
        const progress: BackfillProgress = {
            total: 0,
            current: 0,
            startTime: options.start,
            endTime: options.end,
            status: 'running'
        };

        try {
            // First, check for any existing data in the range
            await this.cleanExistingData(options);

            // Calculate total number of batches
            const totalDays = Math.ceil((options.end.getTime() - options.start.getTime()) / (1000 * 60 * 60 * 24));
            progress.total = Math.ceil(totalDays / batchSize);

            let currentStart = new Date(options.start);
            while (currentStart < options.end) {
                progress.current += 1;
                progress.startTime = currentStart;

                // Calculate end time for this batch
                let currentEnd = new Date(currentStart);
                currentEnd.setDate(currentEnd.getDate() + batchSize);
                if (currentEnd > options.end) {
                    currentEnd = options.end;
                }
                progress.endTime = currentEnd;

                // Fetch and store data for this batch
                await this.bybitService.fetchKlines(
                    options.symbol,
                    currentStart,
                    currentEnd
                );

                // Move to next batch
                currentStart = currentEnd;
            }

            // Refresh continuous aggregates after backfilling
            await this.refreshContinuousAggregates(options);

            progress.status = 'completed';
            return progress;
        } catch (error) {
            progress.status = 'failed';
            progress.error = error instanceof Error ? error.message : String(error);
            throw error;
        }
    }

    /**
     * Clean existing data in the specified range before backfilling
     */
    private async cleanExistingData(options: BackfillOptions) {
        await PriceKlineService.deleteKlines(
            options.symbol,
            BackfillService.BASE_TIMEFRAME,
            options.start,
            options.end
        );
    }

    /**
     * Get gaps in the data that need to be backfilled
     */
    async findDataGaps(options: BackfillOptions): Promise<{ start: Date; end: Date }[]> {
        return PriceKlineService.findGaps(
            options.symbol,
            BackfillService.BASE_TIMEFRAME,
            options.start,
            options.end
        );
    }

    /**
     * Refresh continuous aggregates for the backfilled data
     */
    private async refreshContinuousAggregates(options: BackfillOptions) {
        const timeframes = ['15m', '30m', '1h', '4h', '12h', '1d'];
        const { symbol, start, end } = options;

        for (const timeframe of timeframes) {
            const viewName = `price_klines_${symbol}_${timeframe}`;

            // For daily view, extend the window by one day on each side
            let refreshStart = new Date(start);
            let refreshEnd = new Date(end);
            
            if (timeframe === '1d') {
                refreshStart.setDate(refreshStart.getDate() - 1);
                refreshEnd.setDate(refreshEnd.getDate() + 1);
            }

            await pool.query(
                'CALL refresh_continuous_aggregate($1::text, $2::timestamptz, $3::timestamptz)',
                [viewName, refreshStart.toISOString(), refreshEnd.toISOString()]
            );
            console.log(`Refreshed continuous aggregate for ${viewName}`);
        }
    }
} 