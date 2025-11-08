import { MongoClient } from 'mongodb';

const uri = process.env.STORAGE_URL || process.env.MONGODB_URI || 'mongodb+srv://Vercel-Admin-lazydata:0xyodbn9xOEDyhLo@lazydata.1zrhuoo.mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(uri);

export default async function handler(req, res) {
    if (req.method === 'DELETE') {
        try {
            await client.connect();
            const db = client.db('store_db');
            const gamepassesCollection = db.collection('gamepasses');
            
            const { id } = req.query;
            
            if (!id) {
                return res.status(400).json({ error: 'Gamepass ID is required' });
            }
            
            const result = await gamepassesCollection.deleteOne({ _id: new require('mongodb').ObjectId(id) });
            
            if (result.deletedCount === 0) {
                return res.status(404).json({ error: 'Gamepass not found' });
            }
            
            res.status(200).json({ success: true });
        } catch (error) {
            console.error('Error deleting gamepass:', error);
            res.status(500).json({ error: 'Failed to delete gamepass' });
        } finally {
            await client.close();
        }
    } else {
        res.setHeader('Allow', ['DELETE']);
        res.status(405).json({ error: 'Method not allowed' });
    }
}

