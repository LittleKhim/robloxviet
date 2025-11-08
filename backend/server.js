require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, '../')));

// Connect to database
connectDB().catch(err => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
});

// API Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/users', require('./routes/users-blacklist'));
app.use('/api/users', require('./routes/users-gamepasses'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/marketplace', require('./routes/marketplace'));
app.use('/api/marketplace', require('./routes/marketplace-approval'));
app.use('/api/stock', require('./routes/stock'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
    console.log(`💾 Connected to MySQL database: ${process.env.DB_NAME || 'store_db'}`);
});

