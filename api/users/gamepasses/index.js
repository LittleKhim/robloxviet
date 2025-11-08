import { MongoClient } from 'mongodb';

const uri = process.env.STORAGE_URL || process.env.MONGODB_URI || 'mongodb+srv://Vercel-Admin-lazydata:0xyodbn9xOEDyhLo@lazydata.1zrhuoo.mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(uri);

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            await client.connect();
            const db = client.db('store_db');
            const gamepassesCollection = db.collection('gamepasses');
            
            const email = req.query.email;
            
            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }
            
            const gamepasses = await gamepassesCollection.find({ email: email }).sort({ createdAt: -1 }).toArray();
            
            res.status(200).json({ gamepasses });
        } catch (error) {
            console.error('Error getting gamepasses:', error);
            res.status(500).json({ error: 'Failed to get gamepasses' });
        } finally {
            await client.close();
        }
    } else if (req.method === 'POST') {
        try {
            await client.connect();
            const db = client.db('store_db');
            const gamepassesCollection = db.collection('gamepasses');
            
            const { email, link } = req.body;
            
            if (!email || !link) {
                return res.status(400).json({ error: 'Email and link are required' });
            }
            
            // Check subscription to determine max gamepasses
            const subscriptionsCollection = db.collection('subscriptions');
            const subscription = await subscriptionsCollection.findOne({ email: email, active: true });
            
            if (!subscription) {
                return res.status(400).json({ error: 'User does not have an active subscription' });
            }
            
            const planPrice = subscription.planPrice;
            const maxGamepass = planPrice === 100000 ? 3 : planPrice === 300000 ? 5 : planPrice === 500000 ? 7 : 0;
            
            // Count existing gamepasses
            const existingCount = await gamepassesCollection.countDocuments({ email: email });
            
            if (existingCount >= maxGamepass) {
                return res.status(400).json({ error: `Maximum ${maxGamepass} gamepasses allowed for this plan` });
            }
            
            const gamepass = {
                email: email,
                link: link,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            const result = await gamepassesCollection.insertOne(gamepass);
            res.status(200).json({ success: true, gamepass: { ...gamepass, _id: result.insertedId } });
        } catch (error) {
            console.error('Error creating gamepass:', error);
            res.status(500).json({ error: 'Failed to create gamepass' });
        } finally {
            await client.close();
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json({ error: 'Method not allowed' });
    }
}

