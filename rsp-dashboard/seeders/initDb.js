require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDb() {
    let connection;
    try {
        const isForce = process.argv.includes('--force');
        const dbName = process.env.DB_NAME || 'rsp_db';
        
        console.log(`🔄 Initializing database... (Destructive mode: ${isForce ? 'ON' : 'OFF'})`);

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        });

        if (isForce) {
            console.log(`⚠️ --force flag detected! Dropping existing database '${dbName}'...`);
            await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
        }

        const sqlFilePath = path.join(__dirname, 'database.sql');
        const sql = fs.readFileSync(sqlFilePath, 'utf8');

        console.log('⚡ Executing SQL script...');
        await connection.query(sql);

        // Run schema migrations for existing tables (only needed if NOT dropping database)
        if (!isForce) {
            console.log('⚡ Checking for missing columns (Migrations)...');
            try {
                await connection.query(`USE \`${dbName}\``);
                await connection.query(`ALTER TABLE applicant_email_logs ADD COLUMN email_type VARCHAR(20) DEFAULT 'codes'`);
                console.log('✅ Successfully added missing email_type column.');
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    // Column already exists, safe to ignore
                } else {
                    console.warn('⚠️ Non-critical migration note:', err.message);
                }
            }
        }

        console.log('✅ Database initialized successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        if (connection) await connection.end();
        process.exit(1);
    }
}

initDb();
