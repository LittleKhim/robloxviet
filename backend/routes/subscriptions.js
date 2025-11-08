const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');

// GET /api/subscriptions?action=check-renewal&email=...
router.get('/', async (req, res) => {
    const { action, email } = req.query;
    
    if (action === 'check-renewal') {
        try {
            const db = getDB();
            const decodedEmail = decodeURIComponent(email || '');
            
            if (!decodedEmail) {
                return res.status(400).json({ error: 'Email is required' });
            }
            
            // Find active subscription with auto-payment enabled
            const [subscriptions] = await db.execute(
                'SELECT * FROM subscriptions WHERE email = ? AND status = ? AND auto_payment = ?',
                [decodedEmail, 'active', true]
            );
            
            if (subscriptions.length === 0) {
                return res.status(200).json({ renewed: false, message: 'No active subscription with auto-payment' });
            }
            
            const subscription = subscriptions[0];
            const now = new Date();
            const nextPaymentDate = new Date(subscription.next_payment_date);
            
            if (now >= nextPaymentDate) {
                // Get user balance
                const [users] = await db.execute('SELECT balance FROM users WHERE email = ?', [decodedEmail]);
                const currentBalance = users.length > 0 ? parseFloat(users[0].balance) : 0;
                
                if (currentBalance >= subscription.plan_price) {
                    // Deduct balance
                    const newBalance = currentBalance - subscription.plan_price;
                    await db.execute('UPDATE users SET balance = ? WHERE email = ?', [newBalance, decodedEmail]);
                    
                    // Update subscription next payment date (30 days from now)
                    const newNextPaymentDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                    await db.execute(
                        'UPDATE subscriptions SET next_payment_date = ? WHERE id = ?',
                        [newNextPaymentDate, subscription.id]
                    );
                    
                    // Save transaction
                    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    await db.execute(
                        `INSERT INTO transactions (transaction_id, email, type, amount, status, description) 
                        VALUES (?, ?, ?, ?, ?, ?)`,
                        [
                            transactionId,
                            decodedEmail,
                            'subscription_renewal',
                            subscription.plan_price,
                            'completed',
                            `Gia hạn tự động gói Robux ${subscription.plan_price}₫/tháng`
                        ]
                    );
                    
                    return res.status(200).json({
                        renewed: true,
                        amount: parseFloat(subscription.plan_price),
                        newBalance: newBalance,
                        nextPaymentDate: newNextPaymentDate
                    });
                } else {
                    // Insufficient balance - deactivate subscription
                    await db.execute('UPDATE subscriptions SET status = ? WHERE id = ?', ['inactive', subscription.id]);
                    
                    return res.status(200).json({
                        renewed: false,
                        message: 'Insufficient balance, subscription deactivated'
                    });
                }
            } else {
                return res.status(200).json({
                    renewed: false,
                    message: 'Next payment date not reached yet',
                    nextPaymentDate: nextPaymentDate
                });
            }
        } catch (error) {
            console.error('Error checking renewal:', error);
            res.status(500).json({ error: 'Failed to check renewal' });
        }
    } else {
        // GET subscription by email
        try {
            const db = getDB();
            const decodedEmail = decodeURIComponent(req.query.email || '');
            
            if (!decodedEmail) {
                return res.status(400).json({ error: 'Email is required' });
            }
            
            const [rows] = await db.execute(
                'SELECT * FROM subscriptions WHERE email = ? AND status = ?',
                [decodedEmail, 'active']
            );
            
            const subscription = rows.length > 0 ? {
                email: rows[0].email,
                planPrice: parseFloat(rows[0].plan_price),
                finalPrice: parseFloat(rows[0].final_price),
                couponCode: rows[0].coupon_code,
                autoPayment: rows[0].auto_payment === 1,
                status: rows[0].status,
                startDate: rows[0].start_date,
                nextPaymentDate: rows[0].next_payment_date
            } : null;
            
            res.status(200).json({ subscription });
        } catch (error) {
            console.error('Error getting subscription:', error);
            res.status(500).json({ error: 'Failed to get subscription' });
        }
    }
});

// POST /api/subscriptions
router.post('/', async (req, res) => {
    try {
        const db = getDB();
        const { email, planPrice, finalPrice, couponCode, autoPayment, startDate, nextPaymentDate } = req.body;
        
        if (!email || !planPrice) {
            return res.status(400).json({ error: 'Email and planPrice are required' });
        }
        
        // Check if user already has an active subscription
        const [existing] = await db.execute(
            'SELECT * FROM subscriptions WHERE email = ? AND status = ?',
            [email, 'active']
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'User already has an active subscription' });
        }
        
        await db.execute(
            `INSERT INTO subscriptions (email, plan_price, final_price, coupon_code, auto_payment, status, start_date, next_payment_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                email,
                planPrice,
                finalPrice || planPrice,
                couponCode || null,
                autoPayment || false,
                'active',
                new Date(startDate),
                new Date(nextPaymentDate)
            ]
        );
        
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error creating subscription:', error);
        res.status(500).json({ error: 'Failed to create subscription' });
    }
});

module.exports = router;

