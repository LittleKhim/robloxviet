const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');

// GET /api/coupons/check?code=...
router.get('/check', async (req, res) => {
    try {
        const db = getDB();
        const code = req.query.code?.toUpperCase().trim();
        
        if (!code) {
            return res.status(400).json({ valid: false, message: 'Mã giảm giá không được để trống' });
        }
        
        const [rows] = await db.execute(
            'SELECT * FROM coupons WHERE code = ?',
            [code]
        );
        
        if (rows.length === 0) {
            return res.status(200).json({ valid: false, message: 'Mã giảm giá không tồn tại' });
        }
        
        const coupon = rows[0];
        
        // Check if coupon is active
        if (!coupon.active) {
            return res.status(200).json({ valid: false, message: 'Mã giảm giá đã bị vô hiệu hóa' });
        }
        
        // Check expiration date
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
            return res.status(200).json({ valid: false, message: 'Mã giảm giá đã hết hạn' });
        }
        
        // Check usage limit
        if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
            return res.status(200).json({ valid: false, message: 'Mã giảm giá đã hết lượt sử dụng' });
        }
        
        return res.status(200).json({ 
            valid: true, 
            coupon: {
                code: coupon.code,
                discountType: coupon.discount_type,
                discountValue: parseFloat(coupon.discount_value),
                description: coupon.description
            }
        });
    } catch (error) {
        console.error('Error checking coupon:', error);
        res.status(500).json({ valid: false, message: 'Lỗi kiểm tra mã giảm giá' });
    }
});

// GET /api/coupons
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const [coupons] = await db.execute('SELECT * FROM coupons ORDER BY created_at DESC');
        
        // Get usage stats for each coupon
        for (let coupon of coupons) {
            const [logs] = await db.execute(
                'SELECT COUNT(*) as count FROM coupon_logs WHERE coupon_code = ? AND status = ?',
                [coupon.code, 'completed']
            );
            coupon.successfulUses = logs[0].count || 0;
        }
        
        res.status(200).json({ coupons });
    } catch (error) {
        console.error('Error getting coupons:', error);
        res.status(500).json({ error: 'Failed to get coupons' });
    }
});

// POST /api/coupons
router.post('/', async (req, res) => {
    try {
        const db = getDB();
        const { code, discountType, discountValue, description, maxUses, expiresAt } = req.body;
        
        if (!code || !discountType || discountValue === undefined) {
            return res.status(400).json({ error: 'Code, discountType, and discountValue are required' });
        }
        
        const couponCode = code.toUpperCase().trim();
        
        // Check if code already exists
        const [existing] = await db.execute('SELECT * FROM coupons WHERE code = ?', [couponCode]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Mã giảm giá đã tồn tại' });
        }
        
        await db.execute(
            `INSERT INTO coupons (code, discount_type, discount_value, description, max_uses, expires_at) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                couponCode,
                discountType,
                discountValue,
                description || '',
                maxUses || null,
                expiresAt ? new Date(expiresAt) : null
            ]
        );
        
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error creating coupon:', error);
        res.status(500).json({ error: 'Failed to create coupon' });
    }
});

// DELETE /api/coupons?code=...
router.delete('/', async (req, res) => {
    try {
        const db = getDB();
        const { code } = req.query;
        
        if (!code) {
            return res.status(400).json({ error: 'Code is required' });
        }
        
        const [result] = await db.execute('DELETE FROM coupons WHERE code = ?', [code.toUpperCase().trim()]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Coupon not found' });
        }
        
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({ error: 'Failed to delete coupon' });
    }
});

// POST /api/coupons/use
router.post('/use', async (req, res) => {
    try {
        const db = getDB();
        const { code, email, amount, originalAmount, discount, type, quantity, planPrice } = req.body;
        
        await db.execute(
            `INSERT INTO coupon_logs (coupon_code, email, amount, original_amount, discount, type, quantity, plan_price, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [code.toUpperCase().trim(), email, amount, originalAmount, discount, type, quantity || null, planPrice || null, 'pending']
        );
        
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error logging coupon usage:', error);
        res.status(500).json({ error: 'Failed to log coupon usage' });
    }
});

module.exports = router;

