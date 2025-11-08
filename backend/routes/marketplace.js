const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');

// GET /api/marketplace
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const { sellerEmail, category, status } = req.query;
        
        // Auto-delete expired items (older than 7 days)
        await db.execute(
            `UPDATE marketplace_items 
            SET status = 'expired' 
            WHERE status = 'approved' 
            AND expires_at IS NOT NULL 
            AND expires_at < NOW()`
        );
        
        let query = 'SELECT * FROM marketplace_items WHERE 1=1';
        const params = [];
        
        if (sellerEmail) {
            query += ' AND seller_email = ?';
            params.push(sellerEmail);
        } else {
            // Public view: only show approved items
            query += ' AND status = ?';
            params.push('approved');
        }
        
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
        
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }
        
        // Exclude expired items from public view
        if (!sellerEmail) {
            query += ' AND (expires_at IS NULL OR expires_at > NOW())';
        }
        
        query += ' ORDER BY created_at DESC';
        
        const [rows] = await db.execute(query, params);
        
        const items = rows.map(row => ({
            _id: row.id,
            sellerEmail: row.seller_email,
            name: row.name,
            description: row.description,
            category: row.category,
            image: row.image,
            price: parseFloat(row.price),
            quantity: row.quantity,
            sold: row.sold,
            contactFacebook: row.contact_facebook,
            contactZalo: row.contact_zalo,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            expiresAt: row.expires_at
        }));
        
        res.status(200).json({ items });
    } catch (error) {
        console.error('Error getting marketplace items:', error);
        res.status(500).json({ error: 'Failed to get marketplace items' });
    }
});

// POST /api/marketplace
router.post('/', async (req, res) => {
    try {
        const db = getDB();
        const { 
            sellerEmail, 
            name, 
            description, 
            category,
            image, 
            price, 
            quantity,
            contactFacebook,
            contactZalo
        } = req.body;
        
        if (!sellerEmail || !name || !price || !quantity || !category) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Set expires_at to 7 days from now
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        
        const [result] = await db.execute(
            `INSERT INTO marketplace_items 
            (seller_email, name, description, category, image, price, quantity, contact_facebook, contact_zalo, status, expires_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                sellerEmail, 
                name, 
                description || '', 
                category,
                image || 'https://via.placeholder.com/200', 
                price, 
                quantity,
                contactFacebook || null,
                contactZalo || null,
                'pending', // Wait for admin approval
                expiresAt
            ]
        );
        
        res.status(200).json({ 
            success: true, 
            message: 'Sản phẩm đã được gửi, đang chờ admin duyệt',
            item: { id: result.insertId, ...req.body } 
        });
    } catch (error) {
        console.error('Error creating marketplace item:', error);
        res.status(500).json({ error: 'Failed to create marketplace item' });
    }
});

module.exports = router;

