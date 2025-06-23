# Termite Trading Dashboard

A modern trading dashboard built with Remix, TypeScript, and TimescaleDB for real-time cryptocurrency trading analysis and visualization.

## Tech Stack

- **Frontend**: Remix with TypeScript
- **Styling**: TailwindCSS
- **Database**: TimescaleDB (PostgreSQL extension)
- **Charting**: TradingView Lightweight Charts
- **Package Manager**: pnpm
- **Build Tool**: Vite
- **Containerization**: Docker & Docker Compose

## Prerequisites

- Node.js 20+ 
- pnpm
- Docker and Docker Compose
- TimescaleDB instance

## Development Setup

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Start the database**
   ```bash
   docker-compose up -d
   ```

3. **Run database migrations**
   ```bash
   pnpm run migrate
   ```

4. **Start the development server**
   ```bash
   pnpm run dev
   ```

The application will be available at `http://localhost:5173`

## API Endpoints

- `GET /api/price-klines` - Fetch OHLCV price data
- `POST /api/backfill` - Backfill historical price data

## Database Schema

The application uses TimescaleDB with the following key tables:
- `price_klines_1m` - 1-minute OHLCV data (hypertable)
- `price_klines_5m` - 5-minute aggregated data
- `price_klines_15m` - 15-minute aggregated data
- `price_klines_1h` - 1-hour aggregated data

## Project Structure

```
app/
├── components/        # React components
│   ├── layout/       # Layout and panel components
│   ├── panels/       # Dashboard panels
│   ├── position/     # Position management
│   ├── tradingview/  # Chart components
│   └── ui/           # UI utilities
├── hooks/            # Custom React hooks
├── services/         # API services
├── utils/            # Utility functions
└── types/            # TypeScript type definitions
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Deployment

First, build your app for production:

```sh
npm run build
```

Then run the app in production mode:

```sh
npm start
```
