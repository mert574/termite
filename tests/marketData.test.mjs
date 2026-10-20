import assert from 'node:assert/strict';
import test from 'node:test';
import { priceTable, symbolSchema } from '../app/utils/marketData.ts';

test('normalizes public market symbols to existing PostgreSQL table names', () => {
  assert.equal(symbolSchema.parse(' btcusdt '), 'BTCUSDT');
  assert.equal(priceTable('BTCUSDT'), 'price_klines_btcusdt');
  assert.equal(priceTable('1000PEPEUSDT', '1h'), 'price_klines_1000pepeusdt_1h');
});

test('rejects SQL syntax, traversal and oversized symbols before constructing a table', () => {
  for (const symbol of ['', 'A', 'A'.repeat(31), '../BTCUSDT', 'BTCUSDT;DROP TABLE x',
    "BTCUSDT' OR '1'='1", 'BTCUSDT--', 'BTCUSDT/*x*/', 'BTCUSDT\u0000']) {
    assert.throws(() => priceTable(symbol), undefined, symbol);
  }
});

test('allows only the aggregate timeframes defined by the migrations', () => {
  for (const timeframe of ['15m', '30m', '1h', '4h', '12h', '1d']) {
    assert.equal(priceTable('BTCUSDT', timeframe), `price_klines_btcusdt_${timeframe}`);
  }
  for (const timeframe of ['', '1h;DROP TABLE x', '5m', 'unknown']) {
    assert.throws(() => priceTable('BTCUSDT', timeframe));
  }
});
