require('dotenv').config();
const mysql = require('mysql2/promise');

async function unseed() {
    let connection;
    try {
        console.log('🔄 Starting database unseed process...');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'rsp_db'
        });

        console.log('🧹 Truncating all tables...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('TRUNCATE TABLE applicant_education');
        await connection.query('TRUNCATE TABLE applicant_training');
        await connection.query('TRUNCATE TABLE applicant_experience');
        await connection.query('TRUNCATE TABLE applicant_eligibility');
        await connection.query('TRUNCATE TABLE applicants');
        await connection.query('TRUNCATE TABLE positions');
        await connection.query('TRUNCATE TABLE logs');
        await connection.query('TRUNCATE TABLE applicant_email_logs');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('✅ Successfully flushed data from database.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Unseeding failed:', error);
        if (connection) await connection.end();
        process.exit(1);
    }
}

unseed();
