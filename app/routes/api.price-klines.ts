import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { PriceKlineService } from '~/services/priceKlines';
import { timeframes, type Timeframe } from '~/db/schema';
import { z } from 'zod';

// Input validation schema
const QuerySchema = z.object({
    symbol: z.string().min(1),
    timeframe: z.enum(timeframes),
    start: z.string().datetime(),
    end: z.string().datetime(),
});

export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const rawParams = Object.fromEntries(url.searchParams);

    try {
        // Validate and parse query parameters
        const { symbol, timeframe, start, end } = QuerySchema.parse(rawParams);
        const startDate = new Date(start);
        const endDate = new Date(end);

        if (timeframe === '5m') {
            const klines = await PriceKlineService.getKlines(
                symbol,
                startDate,
                endDate
            );
            return json({ klines });
        }

        // Use continuous aggregates for all other timeframes
        const klines = await PriceKlineService.getAggregatedKlines(
            symbol,
            timeframe as Timeframe,
            startDate,
            endDate
        );

        return json({ klines });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return json(
                {
                    error: 'Invalid parameters',
                    details: error.errors
                },
                { status: 400 }
            );
        }

        console.error('Error fetching price klines:', error);
        return json(
            { 
                error: 'Internal server error',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
} 