require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDb() {
    let connection;
    try {
        console.log('🔄 Initializing database from database.sql...');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        });

        const sqlFilePath = path.join(__dirname, 'database.sql');
        const sql = fs.readFileSync(sqlFilePath, 'utf8');

        console.log('⚡ Executing SQL script...');
        await connection.query(sql);

        console.log('✅ Database initialized successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        if (connection) await connection.end();
        process.exit(1);
    }
}

initDb();
