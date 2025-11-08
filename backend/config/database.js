const mysql = require('mysql2/promise');

// MySQL connection configuration for Hostinger
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'store_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
};

// Create connection pool
let pool = null;

async function connectDB() {
    if (pool) {
        return pool;
    }
    
    try {
        pool = mysql.createPool(dbConfig);
        console.log('✅ Connected to MySQL database');
        
        // Test connection
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        
        return pool;
    } catch (error) {
        console.error('❌ MySQL connection error:', error);
        throw error;
    }
}

async function closeDB() {
    if (pool) {
        await pool.end();
        pool = null;
        console.log('MySQL connection pool closed');
    }
}

// Get database pool
function getDB() {
    if (!pool) {
        throw new Error('Database not connected. Call connectDB() first.');
    }
    return pool;
}

module.exports = {
    connectDB,
    closeDB,
    getDB
};

