import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { BackfillService } from '~/services/backfill';
import { z } from 'zod';

// Input validation schema for starting a backfill
const BackfillSchema = z.object({
    symbol: z.string().min(1),
    start: z.string().datetime(),
    end: z.string().datetime(),
    batchSize: z.number().int().positive().optional()
});

// Input validation schema for checking gaps
const GapsSchema = z.object({
    symbol: z.string().min(1),
    start: z.string().datetime(),
    end: z.string().datetime(),
    type: z.literal('gaps')
});

/**
 * POST /api/backfill - Start a new backfill operation
 */
export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== 'POST') {
        return json({ error: 'Method not allowed' }, { status: 405 });
    }

    try {
        const rawData = await request.json();
        const { symbol, start, end, batchSize } = BackfillSchema.parse(rawData);

        const backfillService = new BackfillService();
        const progress = await backfillService.startBackfill({
            symbol,
            start: new Date(start),
            end: new Date(end),
            batchSize
        });

        return json({ progress });
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

        console.error('Error starting backfill:', error);
        return json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/backfill?type=gaps - Find gaps in the data
 */
export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const rawParams = Object.fromEntries(url.searchParams);

    try {
        const { symbol, start, end } = GapsSchema.parse(rawParams);

        const backfillService = new BackfillService();
        const gaps = await backfillService.findDataGaps({
            symbol,
            start: new Date(start),
            end: new Date(end)
        });

        return json({ gaps });
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

        console.error('Error finding data gaps:', error);
        return json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
} 