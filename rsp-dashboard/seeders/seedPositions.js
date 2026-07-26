require('dotenv').config();
const fs = require('fs');
const path = require('path');
const positionsData = require('./seed_positions.js');

async function seedPositionsOnly() {
    try {
        console.log('🔄 Starting standalone database seed process for positions via API...');
        
        // Wipe positions directly so we have a clean slate for seeding
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'rsp_db',
            multipleStatements: true
        });
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('DROP TABLE IF EXISTS positions');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        const sqlFilePath = path.join(__dirname, 'database.sql');
        const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');
        await connection.query(sqlQuery);
        await connection.end();

        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ 
            id: 1, 
            username: 'superadmin', 
            role: 'superadmin', 
            can_access_step2: true, 
            name: 'Seeder' 
        }, process.env.JWT_SECRET || 'fallback-secret-for-dev', { expiresIn: '1h' });
        
        const authHeaders = { 
            'Content-Type': 'application/json',
            'Cookie': `auth=${token}`,
            'x-is-seeding': 'true'
        };

        const API_BASE = `http://localhost:${process.env.PORT || 3000}/api`;
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

                // 1. Create Position
                const createRes = await fetch(`${API_BASE}/positions`, {
                    method: 'POST',
                    headers: authHeaders,
                    body: JSON.stringify({
                        title: pos.title || 'Untitled',
                        category: pos.category || 'Other',
                        salaryGrade: pos.salaryGrade || '',
                        monthlySalary: pos.monthlySalary || '',
                        position_code: pos.position_code || `POS-${Math.floor(Math.random() * 10000)}`,
                        groupName: groupName
                    })
                });
                
                if (!createRes.ok) {
                    console.error('Failed to create:', pos.title, await createRes.text());
                    continue;
                }
                const created = await createRes.json();
                const insertId = created.insertId;

                // 2. Update Position Details (QS, Plantilla, in_vacancy=0)
                let plantillaItemValue = null;
                if (pos.plantillaItem && typeof pos.plantillaItem === 'string') {
                    if (pos.plantillaItem.trim().startsWith('[')) {
                        plantillaItemValue = pos.plantillaItem;
                    } else {
                        plantillaItemValue = JSON.stringify([{
                            items: pos.plantillaItem,
                            parenthetical: '',
                            assignment: '',
                            competency: pos.qsCompetency || 'Self- Management, Professionalism and Ethics, Result Focus, Teamwork, Service Orientation, Innovation'
                        }]);
                    }
                }

                await fetch(`${API_BASE}/positions/update`, {
                    method: 'POST',
                    headers: authHeaders,
                    body: JSON.stringify({
                        id: insertId,
                        vacancyAnnouncementNo: '0', // Vacancy OFF
                        plantillaItem: plantillaItemValue,
                        salaryGrade: pos.salaryGrade || '',
                        monthlySalary: pos.monthlySalary || '',
                        qsEducation: pos.qsEducation || '',
                        qsEducationLevel: pos.qsEducationLevel || null,
                        qsTraining: pos.qsTraining || '',
                        qsTrainingLevel: pos.qsTrainingLevel || null,
                        qsExperience: pos.qsExperience || '',
                        qsExperienceLevel: pos.qsExperienceLevel || null,
                        qsEligibility: pos.qsEligibility || '',
                        qsPerformance: pos.qsPerformance || ''
                    })
                });

                // Vacancy is explicitly turned off via another API endpoint just in case
                await fetch(`${API_BASE}/positions/${insertId}/vacancy`, {
                    method: 'POST',
                    headers: authHeaders,
                    body: JSON.stringify({ in_vacancy: 0 })
                });

                insertedCount++;
            }
        }

        console.log(`✅ Successfully seeded ${insertedCount} positions via API.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Position API seeding failed:', error);
        process.exit(1);
    }
}

seedPositionsOnly();
