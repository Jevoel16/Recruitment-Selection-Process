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
        const middleNames = ['Atticus', 'Winston', 'Byron', 'Gideon', 'Theodore', 'Franklin', 'Lincoln', 'Alistair', 'Graham', 'Harrison', 'Maxwell', 'Oliver', 'Sebastian', 'Vincent', 'Xavier', 'Zachary'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
        const offices = ['Engineering Dept', 'HR Dept', 'Marketing Office', 'Executive Suite', 'Finance Dept'];

        const applicationTypes = ['Internal Application', 'External Application'];
        const districts = ['N1', 'N2', 'N3', 'W1', 'W2', 'W3', 'E1', 'E2', 'S1', 'S2'];
        const categories = ['ELEM', 'JHS', 'SHS', 'KIND', 'ALS'];
        const positions = ['Teacher I', 'Teacher II', 'Teacher III', 'Master Teacher I', 'Principal I', 'Administrative Officer II', 'Project Development Officer II'];
        
        const generateFirstName = () => firstNames[Math.floor(Math.random() * firstNames.length)];
        const generateMiddleName = () => middleNames[Math.floor(Math.random() * middleNames.length)];
        const generateLastName = () => lastNames[Math.floor(Math.random() * lastNames.length)];
        
        const generateTracking = () => {
            const district = districts[Math.floor(Math.random() * districts.length)];
            const category = categories[Math.floor(Math.random() * categories.length)];
            const position = positions[Math.floor(Math.random() * positions.length)];
            return {
                code: 'TEMP',
                district,
                category,
                position
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
            (firstName, middleName, lastName, applicationType, applicationCode, district, category, position, status, interviewScore, interviewDate, assignedOffice, address, age, sex, civilStatus, religion, disability, ethnicGroup, emailAddress, contactNo) 
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
            const mName = generateMiddleName();
            const lName = generateLastName();
            const applicationType = applicationTypes[Math.floor(Math.random() * applicationTypes.length)];
            const tracking = generateTracking();
            return [fName, mName, lName, applicationType, tracking.code, tracking.district, tracking.category, tracking.position, status, score, date, office, mockAddress, mockAge(), mockSex(), 'Single', 'Catholic', 'None', 'None', mockEmail(fName, lName), mockContact];
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
        
        // Generate proper applicationCode for each mock applicant
        const [insertedApplicants] = await connection.query('SELECT id, position, category, district FROM applicants');
        
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        let startYear = currentYear;
        if (currentMonth < 6) startYear = currentYear - 1;
        const sy = `SY${startYear}${startYear + 1}`;

        console.log('Generating proper application codes based on position, category, and SY...');
        for (const app of insertedApplicants) {
            let positionCode = 'POS';
            switch(app.position) {
                case 'Teacher I': positionCode = 'T1'; break;
                case 'Teacher II': positionCode = 'T2'; break;
                case 'Teacher III': positionCode = 'T3'; break;
                case 'Master Teacher I': positionCode = 'MT1'; break;
                case 'Master Teacher II': positionCode = 'MT2'; break;
                case 'Principal I': positionCode = 'P1'; break;
                case 'Principal II': positionCode = 'P2'; break;
                case 'Head Teacher I': positionCode = 'HT1'; break;
                case 'Head Teacher III': positionCode = 'HT3'; break;
                case 'Education Program Supervisor': positionCode = 'EPS'; break;
                case 'Administrative Officer II': positionCode = 'AO2'; break;
                case 'Administrative Assistant III': positionCode = 'ADAS3'; break;
                case 'Administrative Assistant II': positionCode = 'ADAS2'; break;
                case 'Project Development Officer II': positionCode = 'PDO2'; break;
            }
            
            const baseCode = `${positionCode}-${sy}-${app.category}-${app.district || 'DIST'}`;
            const applicationCode = `${baseCode}-${app.id}`;
            await connection.query('UPDATE applicants SET applicationCode = ? WHERE id = ?', [applicationCode, app.id]);
        }
        console.log(`✅ Updated ${insertedApplicants.length} applicant tracking codes.`);

        // Seed related tables (5-10 for each applicant)
        console.log(`Generating sub-documents for ${insertedApplicants.length} applicants...`);

        const eduValues = [];
        const trainValues = [];
        const expValues = [];
        const eligValues = [];

        for (const app of insertedApplicants) {
            const numEdu = Math.floor(Math.random() * 6) + 5; // 5 to 10
            for(let i=0; i<numEdu; i++) eduValues.push([app.id, `Degree ${i+1}`, 2010+i, 'https://example.com/edu']);

            const numTrain = Math.floor(Math.random() * 6) + 5;
            for(let i=0; i<numTrain; i++) trainValues.push([app.id, `Training ${i+1}`, (i+1)*10, 'https://example.com/train']);

            const numExp = Math.floor(Math.random() * 6) + 5;
            for(let i=0; i<numExp; i++) expValues.push([app.id, `Role at Company ${i+1}`, i+1, 'https://example.com/exp']);

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

        await insertChunks('INSERT INTO applicant_education (applicant_id, degree, yearGraduated, digitalCopyLink) VALUES ?', eduValues);
        await insertChunks('INSERT INTO applicant_training (applicant_id, title, hours, digitalCopyLink) VALUES ?', trainValues);
        await insertChunks('INSERT INTO applicant_experience (applicant_id, details, years, digitalCopyLink) VALUES ?', expValues);
        await insertChunks('INSERT INTO applicant_eligibility (applicant_id, details, rating, digitalCopyLink) VALUES ?', eligValues);

        console.log('✅ Inserted related records (Education, Training, Experience, Eligibility) for all applicants.');
        
        console.log('🎉 Seeding completed successfully!');
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
    } finally {
        await connection.end();
    }
}

seed();
