import { BybitService } from '~/services/bybit';
import { timeframes } from '~/db/schema';

async function main() {
    const bybit = new BybitService();
    const symbol = 'BTCUSDT';
    
    // Fetch last 7 days of data for each timeframe
    const end = new Date();
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    console.log(`Fetching historical data for ${symbol} from ${start.toISOString()} to ${end.toISOString()}`);

    for (const timeframe of timeframes) {
        console.log(`\nFetching ${timeframe} timeframe...`);
        try {
            await bybit.fetchKlines(symbol, timeframe, start, end);
            console.log(`✓ Successfully fetched ${timeframe} data`);
        } catch (error) {
            console.error(`✗ Failed to fetch ${timeframe} data:`, error);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => process.exit()); 