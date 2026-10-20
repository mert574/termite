import { BybitService } from '~/services/bybit';

async function main() {
    const bybit = new BybitService();
    const symbol = 'BTCUSDT';
    
    // Fetch base candles once; the database provides the aggregate timeframes.
    const end = new Date();
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    console.log(`Fetching historical data for ${symbol} from ${start.toISOString()} to ${end.toISOString()}`);

    await bybit.fetchKlines(symbol, start, end);
}

main()
    .catch(console.error)
    .finally(() => process.exit());
