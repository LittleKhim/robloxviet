const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');

// GET /api/marketplace/pending - Get pending items for approval
router.get('/pending', async (req, res) => {
    try {
        const db = getDB();
        const [rows] = await db.execute(
            'SELECT * FROM marketplace_items WHERE status = ? ORDER BY created_at DESC',
            ['pending']
        );
        
        const items = rows.map(row => ({
            _id: row.id,
            sellerEmail: row.seller_email,
            name: row.name,
            description: row.description,
            category: row.category,
            image: row.image,
            price: parseFloat(row.price),
            quantity: row.quantity,
            contactFacebook: row.contact_facebook,
            contactZalo: row.contact_zalo,
            status: row.status,
            createdAt: row.created_at
        }));
        
        res.status(200).json({ items });
    } catch (error) {
        console.error('Error getting pending items:', error);
        res.status(500).json({ error: 'Failed to get pending items' });
    }
});

// PUT /api/marketplace/:id/approve
router.put('/:id/approve', async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;
        const { approvedBy } = req.body;
        
        await db.execute(
            'UPDATE marketplace_items SET status = ?, approved_at = NOW(), approved_by = ? WHERE id = ?',
            ['approved', approvedBy || 'admin', id]
        );
        
        res.status(200).json({ success: true, message: 'Sản phẩm đã được duyệt' });
    } catch (error) {
        console.error('Error approving item:', error);
        res.status(500).json({ error: 'Failed to approve item' });
    }
});

// PUT /api/marketplace/:id/reject
router.put('/:id/reject', async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;
        const { rejectedBy } = req.body;
        
        await db.execute(
            'UPDATE marketplace_items SET status = ?, approved_by = ? WHERE id = ?',
            ['rejected', rejectedBy || 'admin', id]
        );
        
        res.status(200).json({ success: true, message: 'Sản phẩm đã bị từ chối' });
    } catch (error) {
        console.error('Error rejecting item:', error);
        res.status(500).json({ error: 'Failed to reject item' });
    }
});

module.exports = router;

