// Vercel Serverless Function - MongoDB Users API
// Place this in /api/users.js in your Vercel project

const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            await client.connect();
            const db = client.db('store');
            const collection = db.collection('users');
            
            const userData = req.body;
            await collection.updateOne(
                { email: userData.email },
                { $set: userData },
                { upsert: true }
            );
            
            res.status(200).json({ success: true });
        } catch (error) {
            console.error('Error saving user:', error);
            res.status(500).json({ error: 'Failed to save user' });
        } finally {
            await client.close();
        }
    } else if (req.method === 'GET') {
        try {
            await client.connect();
            const db = client.db('store');
            const collection = db.collection('users');
            
            const email = req.query.email;
            const user = await collection.findOne({ email });
            
            res.status(200).json(user || null);
        } catch (error) {
            console.error('Error fetching user:', error);
            res.status(500).json({ error: 'Failed to fetch user' });
        } finally {
            await client.close();
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}

