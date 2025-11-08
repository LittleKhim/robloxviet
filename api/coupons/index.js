import { MongoClient } from 'mongodb';

const uri = process.env.STORAGE_URL || process.env.MONGODB_URI || 'mongodb+srv://Vercel-Admin-lazydata:0xyodbn9xOEDyhLo@lazydata.1zrhuoo.mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(uri);

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            await client.connect();
            const db = client.db('store_db');
            const couponsCollection = db.collection('coupons');
            
            const coupons = await couponsCollection.find({}).sort({ createdAt: -1 }).toArray();
            
            // Get usage stats for each coupon
            const logsCollection = db.collection('coupon_logs');
            for (let coupon of coupons) {
                const successfulUses = await logsCollection.countDocuments({ 
                    couponCode: coupon.code,
                    status: 'completed'
                });
                coupon.successfulUses = successfulUses;
            }
            
            res.status(200).json({ coupons });
        } catch (error) {
            console.error('Error getting coupons:', error);
            res.status(500).json({ error: 'Failed to get coupons' });
        } finally {
            await client.close();
        }
    } else if (req.method === 'POST') {
        try {
            await client.connect();
            const db = client.db('store_db');
            const couponsCollection = db.collection('coupons');
            
            const { code, discountType, discountValue, description, maxUses, expiresAt } = req.body;
            
            if (!code || !discountType || discountValue === undefined) {
                return res.status(400).json({ error: 'Code, discountType, and discountValue are required' });
            }
            
            const coupon = {
                code: code.toUpperCase().trim(),
                discountType: discountType, // 'percentage' or 'fixed'
                discountValue: parseFloat(discountValue),
                description: description || '',
                maxUses: maxUses ? parseInt(maxUses) : null,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                active: true,
                usedCount: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            // Check if code already exists
            const existing = await couponsCollection.findOne({ code: coupon.code });
            if (existing) {
                return res.status(400).json({ error: 'Mã giảm giá đã tồn tại' });
            }
            
            const result = await couponsCollection.insertOne(coupon);
            res.status(200).json({ success: true, coupon });
        } catch (error) {
            console.error('Error creating coupon:', error);
            res.status(500).json({ error: 'Failed to create coupon' });
        } finally {
            await client.close();
        }
    } else if (req.method === 'DELETE') {
        try {
            await client.connect();
            const db = client.db('store_db');
            const couponsCollection = db.collection('coupons');
            
            const { code } = req.query;
            
            if (!code) {
                return res.status(400).json({ error: 'Code is required' });
            }
            
            const result = await couponsCollection.deleteOne({ code: code.toUpperCase().trim() });
            
            if (result.deletedCount === 0) {
                return res.status(404).json({ error: 'Coupon not found' });
            }
            
            res.status(200).json({ success: true });
        } catch (error) {
            console.error('Error deleting coupon:', error);
            res.status(500).json({ error: 'Failed to delete coupon' });
        } finally {
            await client.close();
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        res.status(405).json({ error: 'Method not allowed' });
    }
}

