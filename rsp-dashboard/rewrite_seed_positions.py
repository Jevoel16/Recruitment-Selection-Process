import mysql.connector
import json

db = mysql.connector.connect(host='localhost', user='root', password='LenovoLOQ021605Jev', database='rsp_db')
cursor = db.cursor(dictionary=True)
cursor.execute('SELECT category, title, salaryGrade, in_vacancy, monthlySalary, vacancyCount, plantillaItem, qsEducation, qsTraining, qsExperience, qsEligibility FROM positions')
positions = cursor.fetchall()

js_content = """const pool = require('./db');

const positionsData = """ + json.dumps(positions, indent=4) + """;

async function seed() {
    try {
        await pool.query('TRUNCATE TABLE positions');
        let insertCount = 0;
        
        for (let pos of positionsData) {
            await pool.query(
                'INSERT INTO positions (category, title, salaryGrade, in_vacancy, monthlySalary, vacancyCount, plantillaItem, qsEducation, qsTraining, qsExperience, qsEligibility) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    pos.category || '', 
                    pos.title || '', 
                    pos.salaryGrade || '', 
                    pos.in_vacancy || 0, 
                    pos.monthlySalary || '', 
                    pos.vacancyCount || 1, 
                    pos.plantillaItem || '', 
                    pos.qsEducation || '', 
                    pos.qsTraining || '', 
                    pos.qsExperience || '', 
                    pos.qsEligibility || ''
                ]
            );
            insertCount++;
        }
        console.log(`Successfully seeded ${insertCount} positions with full Qualification Standards into positions table.`);
    } catch (err) {
        console.error("Error seeding positions:", err);
    } finally {
        process.exit();
    }
}
seed();
"""

with open(r'C:\Users\Admin\Desktop\Personnel - RSP\Recruitment-Selection-Process\rsp-dashboard\seed_positions.js', 'w', encoding='utf-8') as f:
    f.write(js_content)
    
print("Rewrote seed_positions.js to match current DB state exactly.")
