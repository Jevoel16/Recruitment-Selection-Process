require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function seed() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        multipleStatements: true // Allows executing the entire SQL file at once
    });

    try {
        console.log('🔄 Starting database seed process...');

        // Ensure DB exists before using
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'rsp_db'}`);
        await connection.query(`USE ${process.env.DB_NAME || 'rsp_db'}`);

        console.log('🧹 Dropping existing tables to apply any schema updates...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('DROP TABLE IF EXISTS applicant_eligibility, applicant_experience, applicant_training, applicant_education, applicants');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        // 1. Run database.sql
        const sqlFilePath = path.join(__dirname, 'database.sql');
        const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');
        
        console.log('📦 Executing database.sql...');
        await connection.query(sqlQuery);
        console.log('✅ Schema initialized.');

        // 3. Generate Mock Data
        const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
        const offices = ['Engineering Dept', 'HR Dept', 'Marketing Office', 'Executive Suite', 'Finance Dept'];

        const districts = ['N1', 'N2', 'N3', 'W1', 'W2', 'W3', 'E1', 'E2', 'S1', 'S2'];
        const categories = ['ELEM', 'HIGH', 'SENHIGH', 'UNIV', 'KINDER'];
        const categoryCounts = {};
        
        const generateFirstName = () => firstNames[Math.floor(Math.random() * firstNames.length)];
        const generateLastName = () => lastNames[Math.floor(Math.random() * lastNames.length)];
        
        const generateTracking = () => {
            const district = districts[Math.floor(Math.random() * districts.length)];
            const category = categories[Math.floor(Math.random() * categories.length)];
            const key = `${district}-${category}`;
            categoryCounts[key] = (categoryCounts[key] || 0) + 1;
            return {
                code: `${key}-${categoryCounts[key]}`,
                district,
                category
            };
        };
        // Generates an interview date 1 to 2 weeks away, strictly Monday to Thursday
        const generateInterviewDate = () => {
            let valid = false;
            let d;
            while (!valid) {
                const daysToAdd = Math.floor(Math.random() * 8) + 7; // 7 to 14 days
                d = new Date();
                d.setDate(d.getDate() + daysToAdd);
                const dayOfWeek = d.getDay();
                if (dayOfWeek >= 1 && dayOfWeek <= 4) valid = true; // 1=Mon ... 4=Thu
            }
            return d.toISOString().split('T')[0];
        };

        const insertQuery = `INSERT INTO applicants 
            (firstName, lastName, applicationCode, district, category, status, interviewScore, interviewDate, assignedOffice, address, age, sex, civilStatus, religion, disability, ethnicGroup, emailAddress, contactNo) 
            VALUES ?`;
        const values = [];

        const mockAddress = '123 Tech Avenue, Code City';
        const mockAge = () => Math.floor(Math.random() * 20) + 22; // 22 to 41
        const mockSex = () => Math.random() > 0.5 ? 'Male' : 'Female';
        const mockEmail = (fName, lName) => `${fName}.${lName}`.toLowerCase() + '@example.com';
        const mockContact = '09123456789';

        // Helper to push mock row
        const createRow = (status, score, date, office) => {
            const fName = generateFirstName();
            const lName = generateLastName();
            const tracking = generateTracking();
            return [fName, lName, tracking.code, tracking.district, tracking.category, status, score, date, office, mockAddress, mockAge(), mockSex(), 'Single', 'Catholic', 'None', 'None', mockEmail(fName, lName), mockContact];
        };

        // 10 PENDING (Step 1)
        for (let i = 0; i < 501; i++) {
            values.push(createRow('PENDING', null, null, null));
        }

        // 10 WAITING_FOR_ASSESSMENT (Step 2)
        for (let i = 0; i < 489; i++) {
            values.push(createRow('WAITING_FOR_ASSESSMENT', null, generateInterviewDate(), null));
        }

        // 10 ASSESSED (Step 3)
        for (let i = 0; i < 523; i++) {
            const score = Math.floor(Math.random() * 31) + 70; // 70-100
            values.push(createRow('ASSESSED', score, generateInterviewDate(), null));
        }
        
        // 5 WAITING (Step 4)
        for (let i = 0; i < 1008; i++) {
            const score = Math.floor(Math.random() * 31) + 70;
            values.push(createRow('WAITING', score, generateInterviewDate(), offices[0]));
        }

        // Execute batch insert
        const [result] = await connection.query(insertQuery, [values]);
        console.log(`✅ Inserted ${result.affectedRows} mock applicants.`);
        
        // Seed related tables (5-10 for each applicant)
        const [insertedApplicants] = await connection.query('SELECT id FROM applicants');
        console.log(`Generating sub-documents for ${insertedApplicants.length} applicants...`);

        const eduValues = [];
        const trainValues = [];
        const expValues = [];
        const eligValues = [];

        for (const app of insertedApplicants) {
            const numEdu = Math.floor(Math.random() * 6) + 5; // 5 to 10
            for(let i=0; i<numEdu; i++) eduValues.push([app.id, `Degree ${i+1}`, `201${i}`, 'https://example.com/edu']);

            const numTrain = Math.floor(Math.random() * 6) + 5;
            for(let i=0; i<numTrain; i++) trainValues.push([app.id, `Training ${i+1}`, `${(i+1)*10}`, 'https://example.com/train']);

            const numExp = Math.floor(Math.random() * 6) + 5;
            for(let i=0; i<numExp; i++) expValues.push([app.id, `Role at Company ${i+1}`, `${i+1}`, 'https://example.com/exp']);

            const numElig = Math.floor(Math.random() * 6) + 5;
            for(let i=0; i<numElig; i++) eligValues.push([app.id, `Eligibility ${i+1}`, `${80+i}%`, 'https://example.com/elig']);
        }

        const chunkArray = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));

        const insertChunks = async (query, valuesArray) => {
            const chunks = chunkArray(valuesArray, 5000);
            for (const chunk of chunks) {
                await connection.query(query, [chunk]);
            }
        };

        await insertChunks('INSERT INTO applicant_education (applicant_id, title, year_graduated, link) VALUES ?', eduValues);
        await insertChunks('INSERT INTO applicant_training (applicant_id, title, hours, link) VALUES ?', trainValues);
        await insertChunks('INSERT INTO applicant_experience (applicant_id, details, years, link) VALUES ?', expValues);
        await insertChunks('INSERT INTO applicant_eligibility (applicant_id, title, rating, link) VALUES ?', eligValues);

        console.log('✅ Inserted related records (Education, Training, Experience, Eligibility) for all applicants.');
        
        console.log('🎉 Seeding completed successfully!');
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
    } finally {
        await connection.end();
    }
}

seed();
