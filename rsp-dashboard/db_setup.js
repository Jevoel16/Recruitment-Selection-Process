require('dotenv').config();
const { execSync } = require('child_process');

const env = process.argv[2]; // 'dev' or 'prod'

const user = process.env.DB_USER;
const pass = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const host = process.env.DB_HOST || '127.0.0.1';

console.log(`Setting up ${env} database...`);

try {
    console.log(`Recreating database ${dbName}...`);
    // Create DB via node mysql2 or shell.
    execSync(`mysql -h ${host} -u ${user} -p${pass} -e "DROP DATABASE IF EXISTS ${dbName}; CREATE DATABASE ${dbName};"`, { stdio: 'inherit' });
    
    console.log(`Initializing schema from database.sql...`);
    execSync(`mysql -h ${host} -u ${user} -p${pass} ${dbName} < database.sql`, { stdio: 'inherit' });
    
    console.log(`Seeding positions mapping...`);
    execSync(`node seed_positions.js`, { stdio: 'inherit' });

    if (env === 'dev') {
        console.log(`Seeding mock applicants for development...`);
        execSync(`node seed.js`, { stdio: 'inherit' });
    }
    
    console.log(`Database setup complete for ${env}. Starting server...`);
} catch (e) {
    console.error('Error setting up database:', e.message);
    process.exit(1);
}
