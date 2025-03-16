import { RestClientV5 } from 'bybit-api';
import { PriceKlineService } from './priceKlines';
import type { Kline } from '~/db/schema';
import { createGunzip } from 'zlib';
import { createReadStream, createWriteStream } from 'fs';
import { unlink } from 'fs/promises';
import { parse } from 'csv-parse';
import axios from 'axios';
import { pipeline } from 'stream/promises';
import path from 'path';
import os from 'os';
import process from 'process';

interface MonthRange {
    start: Date;
    end: Date;
    url: string;
}

export class BybitService {
    private client: RestClientV5;
    private static readonly TEMP_DIR = os.tmpdir();
    private static readonly BASE_TIMEFRAME = '5m';

    constructor() {
        this.client = new RestClientV5({
            testnet: false,
        });
    }

    /**
     * Download and process historical klines from Bybit's CSV files and REST API
     */
    async fetchKlines(symbol: string, start: Date, end: Date) {
        try {
            // Get all months we need to download from CSV
            const monthRanges = this.getMonthRanges(symbol, start, end);
            
            // Process CSV files first
            let latestCsvTimestamp = new Date(0);
            for (const range of monthRanges) {
                // Download and process each month's data
                const lastProcessedTime = await this.processMonthlyData(symbol, range, start, end);
                if (lastProcessedTime > latestCsvTimestamp) {
                    latestCsvTimestamp = lastProcessedTime;
                }
            }

            // If there's a gap between CSV data and end date, fill it using REST API
            if (latestCsvTimestamp < end) {
                console.log('Filling gap using REST API:', {
                    from: latestCsvTimestamp.toISOString(),
                    to: end.toISOString()
                });
                await this.fetchRecentKlines(symbol, latestCsvTimestamp, end);
            }

            return true;
        } catch (error) {
            console.error('Error fetching klines from Bybit:', error);
            throw error;
        }
    }

    /**
     * Fetch recent klines using Bybit's REST API
     */
    private async fetchRecentKlines(symbol: string, start: Date, end: Date) {
        const limit = 1000; // Maximum limit per request
        let currentStart = new Date(start);
        let apiCallCount = 0;
        let totalProcessedCandles = 0;
        const maxCallsPerMinute = 10; // Rate limit ourselves to be safe
        let lastCallTime = 0;

        // Calculate expected number of candles (each candle is 5 minutes)
        const totalMinutes = Math.ceil((end.getTime() - start.getTime()) / (60 * 1000));
        const totalCandles = Math.ceil(totalMinutes / 5);
        
        console.log(`Starting backfill:`, {
            from: start.toISOString(),
            to: end.toISOString(),
            totalMinutes,
            totalCandles
        });

        while (currentStart < end) {
            // Basic rate limiting
            const now = Date.now();
            if (now - lastCallTime < (60000 / maxCallsPerMinute)) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }

            try {
                apiCallCount++;
                console.log(`\nMaking API call #${apiCallCount}:`, {
                    start: currentStart.toISOString(),
                    processedCandles: totalProcessedCandles,
                    totalCandles,
                    progress: `${Math.round((totalProcessedCandles / totalCandles) * 100)}%`
                });

                const response = await this.client.getKline({
                    category: 'linear',
                    symbol: symbol,
                    interval: '5',
                    start: currentStart.getTime(),
                    limit
                });

                lastCallTime = Date.now();

                if (!response.result?.list?.length) {
                    console.log('No more data available from API');
                    break;
                }

                const klines = response.result.list;
                console.log('Response data:', {
                    receivedCount: klines.length,
                    newestTime: new Date(Number(klines[0][0])).toISOString(),
                    oldestTime: new Date(Number(klines[klines.length - 1][0])).toISOString(),
                });

                // Filter out any klines beyond our end date or before our start date
                const validKlines = klines.filter(k => {
                    const timestamp = new Date(Number(k[0]));
                    return timestamp >= start && timestamp <= end;
                });

                if (validKlines.length === 0) {
                    console.log('No valid klines in this response, stopping');
                    break;
                }

                // Map and insert this response's data immediately
                const mappedKlines = validKlines.map(([timestamp, open, high, low, close, volume]) => ({
                    ts: new Date(Number(timestamp)),
                    open: Number(open),
                    high: Number(high),
                    low: Number(low),
                    close: Number(close),
                    volume: Number(volume)
                }));

                // Insert all klines from this response
                await PriceKlineService.insertMany(symbol, BybitService.BASE_TIMEFRAME, mappedKlines);
                totalProcessedCandles += mappedKlines.length;
                console.log(`Inserted ${mappedKlines.length} klines from API response`);

                // If we've processed all expected candles, we're done
                if (totalProcessedCandles >= totalCandles) {
                    console.log('Processed all expected candles, stopping');
                    break;
                }

                // Since data is in reverse chronological order (newest to oldest),
                // we need to use the oldest timestamp as our next start point
                // But we'll move forward by the amount of valid klines we got
                const oldestValidKline = validKlines[validKlines.length - 1];
                const minutesToMove = validKlines.length * 5;
                currentStart = new Date(Number(oldestValidKline[0]) + minutesToMove * 60 * 1000);

                // If we've processed all data up to the end date, we're done
                if (currentStart > end) {
                    console.log('Reached end date, stopping');
                    break;
                }

            } catch (error) {
                console.error('Error fetching klines from REST API:', error);
                throw error;
            }
        }

        console.log(`\nCompleted fetching data from REST API:`, {
            totalCallsMade: apiCallCount,
            processedCandles: totalProcessedCandles,
            expectedCandles: totalCandles,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            completionPercentage: `${Math.round((totalProcessedCandles / totalCandles) * 100)}%`
        });
    }

    /**
     * Process CSV file and return the timestamp of the last processed kline
     */
    private async processMonthlyData(
        symbol: string,
        range: MonthRange,
        filterStart: Date,
        filterEnd: Date
    ): Promise<Date> {
        const tempFile = path.join(BybitService.TEMP_DIR, `bybit_${symbol}_${range.start.getTime()}.csv.gz`);
        const tempCsvFile = tempFile.replace('.gz', '');
        let lastTimestamp = new Date(0);

        try {
            // Download the file
            const response = await axios({
                method: 'get',
                url: range.url,
                responseType: 'stream'
            });

            // Save compressed file
            await pipeline(response.data, createWriteStream(tempFile));

            // Decompress
            await pipeline(
                createReadStream(tempFile),
                createGunzip(),
                createWriteStream(tempCsvFile)
            );

            // Process CSV
            const parser = parse({
                delimiter: ',',
                skip_empty_lines: true,
                fromLine: 1
            });

            const klines: Kline[] = [];
            let rowCount = 0;
            const lastRows: string[] = [];
            let firstTimestamp: string | null = null;
            
            const processRow = (row: string[]) => {
                rowCount++;

                // Parse date (already in UTC)
                const [datePart, timePart] = row[0].split(' ');
                const [year, month, day] = datePart.split('.');
                const [hour, minute] = timePart.split(':');
                
                const timestamp = new Date(Date.UTC(
                    parseInt(year),
                    parseInt(month) - 1,
                    parseInt(day),
                    parseInt(hour),
                    parseInt(minute)
                ));

                // Update last timestamp
                if (timestamp > lastTimestamp) {
                    lastTimestamp = timestamp;
                }

                // Store first timestamp for logging
                if (!firstTimestamp) firstTimestamp = row[0];
                
                // Keep last 5 rows
                lastRows.push(row.join(','));
                if (lastRows.length > 5) {
                    lastRows.shift();
                }

                klines.push({
                    ts: timestamp,
                    open: parseFloat(row[1]),
                    high: parseFloat(row[2]),
                    low: parseFloat(row[3]),
                    close: parseFloat(row[4]),
                    volume: parseFloat(row[5])
                });

                // Insert in batches of 500
                if (klines.length >= 500) {
                    PriceKlineService.insertMany(symbol, BybitService.BASE_TIMEFRAME, klines)
                        .catch(error => console.error('Error inserting batch:', error));
                    console.log(`Inserted batch of ${klines.length} klines`);
                    klines.length = 0;
                }
            };

            // Process the CSV file
            const processFile = new Promise((resolve, reject) => {
                createReadStream(tempCsvFile)
                    .pipe(parser)
                    .on('data', processRow)
                    .on('end', resolve)
                    .on('error', reject);
            });

            await processFile;

            // Insert remaining klines
            if (klines.length > 0) {
                await PriceKlineService.insertMany(symbol, BybitService.BASE_TIMEFRAME, klines);
                console.log(`Inserted final batch of ${klines.length} klines`);
            }

            // Log processing summary
            console.log('Processing Summary:');
            console.log(`Total rows processed: ${rowCount}`);
            console.log(`First timestamp: ${firstTimestamp}`);
            console.log(`Last timestamp: ${lastTimestamp.toISOString()}`);
            console.log('Last 5 processed rows:', lastRows);

            return lastTimestamp;
        } finally {
            // Clean up temporary files
            try {
                await unlink(tempFile);
                await unlink(tempCsvFile);
            } catch (error) {
                console.warn('Error cleaning up temporary files:', error);
            }
        }
    }

    /**
     * Get all month ranges that need to be downloaded
     */
    private getMonthRanges(symbol: string, start: Date, end: Date): MonthRange[] {
        const ranges: MonthRange[] = [];
        let currentDate = new Date(start);

        // Set to first day of month
        currentDate.setUTCDate(1);
        currentDate.setUTCHours(0, 0, 0, 0);

        while (currentDate <= end) {
            const monthEnd = new Date(currentDate);
            monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);
            monthEnd.setUTCDate(0); // Last day of current month

            const url = this.buildCsvUrl(symbol, currentDate);
            ranges.push({
                start: new Date(currentDate),
                end: new Date(monthEnd),
                url
            });

            // Move to next month
            currentDate.setUTCMonth(currentDate.getUTCMonth() + 1);
        }

        return ranges;
    }

    /**
     * Build the URL for the monthly CSV file
     */
    private buildCsvUrl(symbol: string, date: Date): string {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const lastDay = String(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()).padStart(2, '0');
        
        // Convert timeframe to Bybit's format (e.g., '5m' -> '5')
        const bybitTimeframe = BybitService.BASE_TIMEFRAME.replace('m', '');
        
        const url = `https://public.bybit.com/kline_for_metatrader4/${symbol}/${year}/${symbol}_${bybitTimeframe}_${year}-${month}-01_${year}-${month}-${lastDay}.csv.gz`;
        console.log('Generated URL:', url);
        return url;
    }
} 