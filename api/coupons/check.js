import { MongoClient } from 'mongodb';

const uri = process.env.STORAGE_URL || process.env.MONGODB_URI || 'mongodb+srv://Vercel-Admin-lazydata:0xyodbn9xOEDyhLo@lazydata.1zrhuoo.mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(uri);

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            await client.connect();
            const db = client.db('store_db');
            const couponsCollection = db.collection('coupons');
            
            const code = req.query.code?.toUpperCase().trim();
            
            if (!code) {
                return res.status(400).json({ valid: false, message: 'Mã giảm giá không được để trống' });
            }
            
            const coupon = await couponsCollection.findOne({ code: code });
            
            if (!coupon) {
                return res.status(200).json({ valid: false, message: 'Mã giảm giá không tồn tại' });
            }
            
            // Check if coupon is active
            if (!coupon.active) {
                return res.status(200).json({ valid: false, message: 'Mã giảm giá đã bị vô hiệu hóa' });
            }
            
            // Check expiration date
            if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
                return res.status(200).json({ valid: false, message: 'Mã giảm giá đã hết hạn' });
            }
            
            // Check usage limit
            if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
                return res.status(200).json({ valid: false, message: 'Mã giảm giá đã hết lượt sử dụng' });
            }
            
            return res.status(200).json({ 
                valid: true, 
                coupon: {
                    code: coupon.code,
                    discountType: coupon.discountType,
                    discountValue: coupon.discountValue,
                    description: coupon.description
                }
            });
        } catch (error) {
            console.error('Error checking coupon:', error);
            res.status(500).json({ valid: false, message: 'Lỗi kiểm tra mã giảm giá' });
        } finally {
            await client.close();
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).json({ error: 'Method not allowed' });
    }
}

