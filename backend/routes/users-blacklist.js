const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');

// GET /api/users/blacklist?action=list
router.get('/blacklist', async (req, res) => {
    const { action, email } = req.query;
    
    if (action === 'list') {
        try {
            const db = getDB();
            const [rows] = await db.execute('SELECT * FROM blacklist ORDER BY blacklisted_at DESC');
            
            res.status(200).json({ blacklist: rows });
        } catch (error) {
            console.error('Error getting blacklist:', error);
            res.status(500).json({ error: 'Failed to get blacklist' });
        }
        return;
    }
    
    // GET /api/users/blacklist?email=...
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    
    const decodedEmail = decodeURIComponent(email);
    
    try {
        const db = getDB();
        const [rows] = await db.execute('SELECT * FROM blacklist WHERE email = ?', [decodedEmail]);
        
        res.status(200).json({ isBlacklisted: rows.length > 0 });
    } catch (error) {
        console.error('Error checking blacklist:', error);
        res.status(500).json({ error: 'Failed to check blacklist' });
    }
});

// POST /api/users/blacklist?email=...
router.post('/blacklist', async (req, res) => {
    const { email } = req.query;
    
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    
    const decodedEmail = decodeURIComponent(email);
    
    try {
        const db = getDB();
        await db.execute(
            'INSERT INTO blacklist (email) VALUES (?) ON DUPLICATE KEY UPDATE blacklisted_at = NOW()',
            [decodedEmail]
        );
        
        res.status(200).json({ success: true, message: 'User added to blacklist' });
    } catch (error) {
        console.error('Error adding to blacklist:', error);
        res.status(500).json({ error: 'Failed to add to blacklist' });
    }
});

// DELETE /api/users/blacklist?email=...
router.delete('/blacklist', async (req, res) => {
    const { email } = req.query;
    
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    
    const decodedEmail = decodeURIComponent(email);
    
    try {
        const db = getDB();
        const [result] = await db.execute('DELETE FROM blacklist WHERE email = ?', [decodedEmail]);
        
        res.status(200).json({ success: true, message: 'User removed from blacklist' });
    } catch (error) {
        console.error('Error removing from blacklist:', error);
        res.status(500).json({ error: 'Failed to remove from blacklist' });
    }
});

module.exports = router;

