import { MongoClient } from 'mongodb';

const uri = process.env.STORAGE_URL || process.env.MONGODB_URI || 'mongodb+srv://Vercel-Admin-lazydata:0xyodbn9xOEDyhLo@lazydata.1zrhuoo.mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(uri);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            await client.connect();
            const db = client.db('store_db');
            const logsCollection = db.collection('coupon_logs');
            
            const { code, email, amount, originalAmount, discount, type, quantity } = req.body;
            
            // Log the coupon usage (will be marked as completed when purchase is confirmed)
            const log = {
                couponCode: code.toUpperCase().trim(),
                email: email,
                amount: amount,
                originalAmount: originalAmount,
                discount: discount,
                type: type, // 'robux' or 'subscription'
                quantity: quantity || null,
                status: 'pending', // Will be updated to 'completed' when order is confirmed
                createdAt: new Date()
            };
            
            await logsCollection.insertOne(log);
            
            res.status(200).json({ success: true });
        } catch (error) {
            console.error('Error logging coupon usage:', error);
            res.status(500).json({ error: 'Failed to log coupon usage' });
        } finally {
            await client.close();
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).json({ error: 'Method not allowed' });
    }
}

