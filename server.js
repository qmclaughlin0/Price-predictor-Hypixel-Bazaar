const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new sqlite3.Database('./bazaar_data.db');

// Create table if it doesn't exist
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS price_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id TEXT NOT NULL,
        buy_price REAL NOT NULL,
        sell_price REAL NOT NULL,
        buy_volume INTEGER NOT NULL,
        sell_volume INTEGER NOT NULL,
        timestamp INTEGER NOT NULL
    )`);
    
    db.run(`CREATE INDEX IF NOT EXISTS idx_product_timestamp ON price_history(product_id, timestamp)`);
});

// Fetch and store bazaar data
async function fetchAndStoreBazaarData() {
    try {
        const response = await fetch('https://api.hypixel.net/skyblock/bazaar');
        const data = await response.json();
        
        if (data.success) {
            const timestamp = Date.now();
            
            for (const [productId, product] of Object.entries(data.products)) {
                db.run(`INSERT INTO price_history (product_id, buy_price, sell_price, buy_volume, sell_volume, timestamp) 
                        VALUES (?, ?, ?, ?, ?, ?)`,
                    [productId, 
                     product.quick_status.buyPrice,
                     product.quick_status.sellPrice,
                     product.quick_status.buyVolume,
                     product.quick_status.sellVolume,
                     timestamp]);
            }
            console.log(`Stored data for ${Object.keys(data.products).length} products`);
        }
    } catch (error) {
        console.error('Error fetching bazaar data:', error);
    }
}

// API Routes
app.get('/api/current', async (req, res) => {
    try {
        const response = await fetch('https://api.hypixel.net/skyblock/bazaar');
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch current data' });
    }
});

app.get('/api/history/:productId', (req, res) => {
    const { productId } = req.params;
    const hours = req.query.hours || 24;
    const timeLimit = Date.now() - (hours * 60 * 60 * 1000);
    
    db.all(`SELECT * FROM price_history 
            WHERE product_id = ? AND timestamp > ? 
            ORDER BY timestamp ASC`,
        [productId, timeLimit],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json(rows);
            }
        });
});

app.get('/api/history', (req, res) => {
    const hours = req.query.hours || 6;
    const timeLimit = Date.now() - (hours * 60 * 60 * 1000);
    
    db.all(`SELECT * FROM price_history 
            WHERE timestamp > ? 
            ORDER BY product_id, timestamp ASC`,
        [timeLimit],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                // Group by product_id
                const grouped = {};
                rows.forEach(row => {
                    if (!grouped[row.product_id]) {
                        grouped[row.product_id] = [];
                    }
                    grouped[row.product_id].push(row);
                });
                res.json(grouped);
            }
        });
});

// Start data collection
fetchAndStoreBazaarData();
setInterval(fetchAndStoreBazaarData, 5 * 60 * 1000); // Every 5 minutes

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});