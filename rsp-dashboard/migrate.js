require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'rsp_db'
    });

    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS positions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                category VARCHAR(100) NOT NULL,
                title VARCHAR(255) NOT NULL,
                vacancyAnnouncement TEXT,
                plantillaItem TEXT,
                salaryGrade TEXT,
                qsEducation TEXT,
                qsTraining TEXT,
                qsExperience TEXT,
                qsEligibility TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Table created!");
        
        const [rows] = await connection.query('SELECT COUNT(*) as c FROM positions');
        if (rows[0].c === 0) {
            const categories = {
                'Teaching': ['Teacher I', 'Teacher II', 'Teacher III', 'Master Teacher I', 'Master Teacher II'],
                'School Administration': ['Principal I', 'Principal II', 'Head Teacher I', 'Head Teacher III'],
                'Non-Teaching': ['Administrative Officer II', 'Administrative Assistant III', 'Administrative Assistant II'],
                'Related-Teaching': ['Education Program Supervisor', 'Project Development Officer II']
            };
            
            for (const [cat, titles] of Object.entries(categories)) {
                for (const title of titles) {
                     await connection.query(`INSERT INTO positions (category, title) VALUES (?, ?)`, [cat, title]);
                }
            }
            console.log("Seeded positions.");
        }
    } catch(e) {
        console.error(e);
    } finally {
        await connection.end();
    }
}
migrate();
