require('dotenv').config();
const mysql = require('mysql2/promise');
const positionsData = require('./seed_positions.js');

async function seedPositionsOnly() {
    let connection;
    try {
        console.log('🔄 Starting standalone database seed process for positions...');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'rsp_db'
        });

        console.log('🧹 Clearing existing positions...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('TRUNCATE TABLE positions');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log(`📦 Seeding positions into the positions table...`);
        let insertedCount = 0;
        
        for (let groupObj of positionsData) {
            const posList = groupObj.positions ? groupObj.positions : [groupObj];
            for (let pos of posList) {
                await connection.query(
                    'INSERT INTO positions (category, groupName, title, salaryGrade, in_vacancy, monthlySalary, vacancyCount, plantillaItem, qsEducation, qsTraining, qsExperience, qsEligibility, qsEducationLevel, qsTrainingLevel, qsExperienceLevel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        pos.category || '', 
                        groupObj.group || pos.title,
                        pos.title || '', 
                        pos.salaryGrade || '', 
                        pos.in_vacancy || 0, 
                        pos.monthlySalary || '', 
                        pos.vacancyCount || 0, 
                        pos.plantillaItem || null, 
                        pos.qsEducation || '', 
                        pos.qsTraining || '', 
                        pos.qsExperience || '', 
                        pos.qsEligibility || '', 
                        pos.qsEducationLevel || null, 
                        pos.qsTrainingLevel || null, 
                        pos.qsExperienceLevel || null
                    ]
                );
                insertedCount++;
            }
        }

        console.log(`✅ Successfully seeded ${insertedCount} positions.`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Position seeding failed:', error);
        if (connection) await connection.end();
        process.exit(1);
    }
}

seedPositionsOnly();
