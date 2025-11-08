const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');

// POST /api/transactions
router.post('/', async (req, res) => {
    try {
        const db = getDB();
        const transactionId = req.body.id || req.body.transactionId || `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        
        const {
            email,
            type,
            amount,
            originalAmount,
            discount,
            couponCode,
            status,
            description
        } = req.body;
        
        if (!email || !type || !amount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        await db.execute(
            `INSERT INTO transactions 
            (transaction_id, email, type, amount, original_amount, discount, coupon_code, status, description) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                transactionId,
                email,
                type,
                amount,
                originalAmount || amount,
                discount || 0,
                couponCode || null,
                status || 'pending',
                description || ''
            ]
        );
        
        res.status(200).json({ 
            success: true, 
            transactionId: transactionId,
            transaction: req.body
        });
    } catch (error) {
        console.error('Error saving transaction:', error);
        res.status(500).json({ error: 'Failed to save transaction' });
    }
});

// GET /api/transactions
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const { email } = req.query;
        
        let query = 'SELECT * FROM transactions WHERE 1=1';
        const params = [];
        
        if (email) {
            query += ' AND email = ?';
            params.push(decodeURIComponent(email));
        }
        
        query += ' ORDER BY created_at DESC';
        
        const [rows] = await db.execute(query, params);
        
        const transactions = rows.map(row => ({
            id: row.transaction_id,
            transactionId: row.transaction_id,
            email: row.email,
            type: row.type,
            amount: parseFloat(row.amount),
            originalAmount: parseFloat(row.original_amount),
            discount: parseFloat(row.discount),
            couponCode: row.coupon_code,
            status: row.status,
            description: row.description,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            completedAt: row.completed_at,
            cancelledAt: row.cancelled_at
        }));
        
        res.status(200).json({ transactions });
    } catch (error) {
        console.error('Error getting transactions:', error);
        res.status(500).json({ error: 'Failed to get transactions' });
    }
});

// PUT /api/transactions/:id
router.put('/:id', async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;
        const { status, userEmail } = req.body;
        
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        
        let updateQuery = 'UPDATE transactions SET status = ?, updated_at = NOW()';
        const params = [status];
        
        if (status === 'completed') {
            updateQuery += ', completed_at = NOW()';
        } else if (status === 'cancelled') {
            updateQuery += ', cancelled_at = NOW()';
        }
        
        updateQuery += ' WHERE transaction_id = ?';
        params.push(id);
        
        const [result] = await db.execute(updateQuery, params);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({ error: 'Failed to update transaction' });
    }
});

module.exports = router;

