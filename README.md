# Termite

A cryptocurrency market dashboard built with Remix, React, TypeScript, and
TimescaleDB. It combines dockable charts, public Bybit candle data, VWAP, and
position-sizing tools.

## Run locally

Requirements: Node.js 22.18+, pnpm 9.1.2, and Docker Compose.

```sh
cp .env.example .env
pnpm install --frozen-lockfile
docker compose up -d
pnpm dev
```

Open [localhost:3000](http://localhost:3000).

The example credentials are local development defaults. Compose reads `.env`
and exposes TimescaleDB on port 5433 and Redis on port 6379. Update the ports
and `DATABASE_URL` together if those ports are occupied. Keep `.env` out of Git.

On a new database volume, TimescaleDB automatically applies `migrations/`.
There is no separate `migrate` command. Existing volumes are not automatically
migrated; back them up before applying schema changes.

The hosted TradingView widget loads its own data. The separate Lightweight
Chart uses the database for history and Bybit's public WebSocket for live
candles. A new database starts empty, so historical candles require a backfill.
Chart services require internet access and provider availability.

## Market data

- `GET /api/price-klines`: stored OHLCV candles; parameters `symbol`, `timeframe`,
  `start`, and `end` (UTC ISO timestamps).
- `POST /api/backfill`: import history; JSON fields `symbol`, `start`, `end`,
  and optional `batchSize` in days.
- `GET /api/backfill?type=gaps&symbol=BTCUSDT&start=...&end=...`: check gaps.

Migrations create BTCUSDT storage with 5-minute base candles and 15-minute,
30-minute, 1-hour, 4-hour, 12-hour, and daily aggregate views. Other symbols
require corresponding tables. Backfill currently replaces data in the requested
range; use a development database when experimenting.

## Checks and production build

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm start
```

The server needs `DATABASE_URL`. For production startup, export it in the process
environment; Vite loads `.env` during development. `PORT` controls the production
port. CI checks types, lint, focused tests, and the production build.

## Development

- `app/components/`: dashboard, charts, and position builder.
- `app/services/`: public Bybit feeds, history, and backfill.
- `app/db/` and `migrations/`: TimescaleDB connection and schema.
- `app/mocks/`: mock trading state, separate from public market data.
- `docs/`: existing product plans and technical RFCs.

See [ROADMAP.md](ROADMAP.md) for planned work.

## License

Project code is [MIT](LICENSE). Chart libraries, hosted widgets, and market-data
services retain their own terms; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
