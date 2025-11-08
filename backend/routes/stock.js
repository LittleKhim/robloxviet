const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');

// GET /api/stock
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const [rows] = await db.execute('SELECT * FROM stock LIMIT 1');
        
        if (rows.length === 0) {
            // Create default stock if doesn't exist
            await db.execute('INSERT INTO stock (robux_stock, robux_rate) VALUES (?, ?)', [1000000, 125.00]);
            res.status(200).json({ robuxStock: 1000000, robuxRate: 125.00 });
        } else {
            res.status(200).json({ 
                robuxStock: rows[0].robux_stock, 
                robuxRate: parseFloat(rows[0].robux_rate) 
            });
        }
    } catch (error) {
        console.error('Error fetching stock:', error);
        res.status(500).json({ error: 'Failed to fetch stock' });
    }
});

// PUT /api/stock
router.put('/', async (req, res) => {
    try {
        const db = getDB();
        const { stock, rate } = req.body;
        
        if (stock !== undefined) {
            await db.execute('UPDATE stock SET robux_stock = ?', [stock]);
        }
        
        if (rate !== undefined) {
            await db.execute('UPDATE stock SET robux_rate = ?', [rate]);
        }
        
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(500).json({ error: 'Failed to update stock' });
    }
});

module.exports = router;

