# Bazaar Tracker Backend

## Setup Instructions

1. **Install Node.js** (if not already installed)
   - Download from https://nodejs.org/

2. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

## API Endpoints

- `GET /api/current` - Get current bazaar data
- `GET /api/history` - Get historical data for all products (default: 6 hours)
- `GET /api/history/:productId` - Get historical data for specific product

## Database

- Uses SQLite database (`bazaar_data.db`)
- Automatically collects data every 5 minutes
- Stores: product_id, buy_price, sell_price, buy_volume, sell_volume, timestamp

## Features

- Automatic data collection from Hypixel API
- Historical data storage for price predictions
- CORS enabled for frontend access
- Indexed database for fast queries