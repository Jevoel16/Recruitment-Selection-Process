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
            database: process.env.DB_NAME || 'rsp_db',
            multipleStatements: true
        });

        console.log('🧹 Clearing existing positions...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('DROP TABLE IF EXISTS positions');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        const fs = require('fs');
        const path = require('path');
        const sqlFilePath = path.join(__dirname, 'database.sql');
        const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');
        
        console.log('📦 Executing database.sql to rebuild positions table...');
        await connection.query(sqlQuery);

        console.log(`📦 Seeding positions into the positions table...`);
        let insertedCount = 0;
        
        for (let groupObj of positionsData) {
            const posList = groupObj.positions ? groupObj.positions : [groupObj];
            for (let pos of posList) {
                let groupName = groupObj.group || pos.title;
                if (!groupObj.group && pos.title) {
                    // Extract base name by removing Roman Numerals (e.g., "Accountant I" -> "Accountant", "Teacher II (Elementary)" -> "Teacher (Elementary)")
                    const regex = /^(.*?)\s+(I|II|III|IV|V|VI|VII|VIII|IX|X)(?:\s+(.*))?$/i;
                    const match = pos.title.match(regex);
                    if (match) {
                        groupName = match[1] + (match[3] ? " " + match[3] : "");
                    }
                }

                await connection.query(
                    'INSERT INTO positions (category, groupName, title, vacancyAnnouncementNo, salaryGrade, in_vacancy, monthlySalary, vacancyCount, plantillaItem, qsEducation, qsTraining, qsExperience, qsEligibility, qsEducationLevel, qsTrainingLevel, qsExperienceLevel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        pos.category || '', 
                        groupName,
                        pos.title || '', 
                        pos.vacancyAnnouncementNo || null,
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
