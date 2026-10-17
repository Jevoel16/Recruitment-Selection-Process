require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 20,
    queueLimit: 0
});

const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('[DB] Database connection successful');
        connection.release();
    } catch (error) {
        console.error('[DB] Database connection failed:', error.message);
    }
};

testConnection();

module.exports = pool;
