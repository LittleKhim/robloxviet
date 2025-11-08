const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');

// GET /api/users/balance?email=...
router.get('/balance', async (req, res) => {
    const { email } = req.query;
    
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    
    const decodedEmail = decodeURIComponent(email);
    console.log('Balance API - Email:', decodedEmail);
    
    try {
        const db = getDB();
        const [rows] = await db.execute(
            'SELECT balance FROM users WHERE email = ?',
            [decodedEmail]
        );
        
        if (rows.length > 0) {
            console.log('User found, balance:', rows[0].balance);
            res.status(200).json({ balance: parseFloat(rows[0].balance) || 0 });
        } else {
            // Create user if doesn't exist
            console.log('User not found, creating with 0 balance');
            await db.execute(
                'INSERT INTO users (email, balance) VALUES (?, ?)',
                [decodedEmail, 0]
            );
            res.status(200).json({ balance: 0 });
        }
    } catch (error) {
        console.error('Error getting balance:', error);
        res.status(500).json({ error: 'Failed to get balance', details: error.message });
    }
});

// PUT /api/users/balance?email=...
router.put('/balance', async (req, res) => {
    const { email } = req.query;
    const { balance } = req.body;
    
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    
    if (typeof balance !== 'number') {
        return res.status(400).json({ error: 'Balance must be a number' });
    }
    
    const decodedEmail = decodeURIComponent(email);
    console.log('Updating balance for:', decodedEmail, 'to:', balance);
    
    try {
        const db = getDB();
        
        // Try to update, if no rows affected, insert
        const [result] = await db.execute(
            'UPDATE users SET balance = ? WHERE email = ?',
            [balance, decodedEmail]
        );
        
        if (result.affectedRows === 0) {
            // User doesn't exist, create new
            await db.execute(
                'INSERT INTO users (email, balance) VALUES (?, ?)',
                [decodedEmail, balance]
            );
        }
        
        console.log('Update result:', result);
        res.status(200).json({ success: true, balance: balance });
    } catch (error) {
        console.error('Error updating balance:', error);
        res.status(500).json({ error: 'Failed to update balance', details: error.message });
    }
});

// POST /api/users
router.post('/', async (req, res) => {
    try {
        const db = getDB();
        const { email, name, balance } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        // Insert or update user
        await db.execute(
            'INSERT INTO users (email, name, balance) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = ?, balance = ?',
            [email, name || email, balance || 0, name || email, balance || 0]
        );
        
        res.status(200).json({ success: true, user: { email, name: name || email, balance: balance || 0 } });
    } catch (error) {
        console.error('Error saving user:', error);
        res.status(500).json({ error: 'Failed to save user' });
    }
});

module.exports = router;

