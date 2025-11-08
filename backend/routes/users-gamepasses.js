const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');

// GET /api/users/gamepasses?email=...
router.get('/gamepasses', async (req, res) => {
    const { email } = req.query;
    
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    
    try {
        const db = getDB();
        const [rows] = await db.execute(
            'SELECT * FROM gamepasses WHERE email = ? ORDER BY created_at DESC',
            [email]
        );
        
        const gamepasses = rows.map(row => ({
            _id: row.id,
            email: row.email,
            link: row.link,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));
        
        res.status(200).json({ gamepasses });
    } catch (error) {
        console.error('Error getting gamepasses:', error);
        res.status(500).json({ error: 'Failed to get gamepasses' });
    }
});

// POST /api/users/gamepasses
router.post('/gamepasses', async (req, res) => {
    try {
        const db = getDB();
        const { email, link } = req.body;
        
        if (!email || !link) {
            return res.status(400).json({ error: 'Email and link are required' });
        }
        
        // Check subscription to determine max gamepasses
        const [subscriptions] = await db.execute(
            'SELECT * FROM subscriptions WHERE email = ? AND status = ?',
            [email, 'active']
        );
        
        if (subscriptions.length === 0) {
            return res.status(400).json({ error: 'User does not have an active subscription' });
        }
        
        const planPrice = parseFloat(subscriptions[0].plan_price);
        const maxGamepass = planPrice === 100000 ? 3 : planPrice === 300000 ? 5 : planPrice === 500000 ? 7 : 0;
        
        // Count existing gamepasses
        const [count] = await db.execute('SELECT COUNT(*) as count FROM gamepasses WHERE email = ?', [email]);
        const existingCount = count[0].count;
        
        if (existingCount >= maxGamepass) {
            return res.status(400).json({ error: `Maximum ${maxGamepass} gamepasses allowed for this plan` });
        }
        
        const [result] = await db.execute('INSERT INTO gamepasses (email, link) VALUES (?, ?)', [email, link]);
        
        res.status(200).json({ success: true, gamepass: { _id: result.insertId, email, link } });
    } catch (error) {
        console.error('Error creating gamepass:', error);
        res.status(500).json({ error: 'Failed to create gamepass' });
    }
});

// DELETE /api/users/gamepasses/:id
router.delete('/gamepasses/:id', async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;
        
        const [result] = await db.execute('DELETE FROM gamepasses WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Gamepass not found' });
        }
        
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error deleting gamepass:', error);
        res.status(500).json({ error: 'Failed to delete gamepass' });
    }
});

module.exports = router;

