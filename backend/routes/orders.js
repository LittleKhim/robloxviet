const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');

// POST /api/orders
router.post('/', async (req, res) => {
    try {
        const db = getDB();
        const { code, email, name, items, total, status } = req.body;
        
        if (!code || !email || !items || !total) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        await db.execute(
            'INSERT INTO orders (code, email, name, items, total, status) VALUES (?, ?, ?, ?, ?, ?)',
            [code, email, name || email, JSON.stringify(items), total, status || 'pending']
        );
        
        res.status(200).json({ success: true, order: { code, email, name, items, total, status } });
    } catch (error) {
        console.error('Error saving order:', error);
        res.status(500).json({ error: 'Failed to save order' });
    }
});

// GET /api/orders
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const { userEmail, status } = req.query;
        
        let query = 'SELECT * FROM orders WHERE 1=1';
        const params = [];
        
        if (userEmail) {
            query += ' AND email = ?';
            params.push(decodeURIComponent(userEmail));
        }
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }
        
        query += ' ORDER BY created_at DESC';
        
        const [rows] = await db.execute(query, params);
        
        // Parse JSON items
        const orders = rows.map(row => ({
            ...row,
            items: JSON.parse(row.items),
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));
        
        res.status(200).json({ orders });
    } catch (error) {
        console.error('Error getting orders:', error);
        res.status(500).json({ error: 'Failed to get orders' });
    }
});

module.exports = router;

