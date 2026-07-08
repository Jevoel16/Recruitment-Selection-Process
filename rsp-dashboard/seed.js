require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const positionsData = require('./seed_positions.js');

// --- SETTINGS ---
const CATEGORY_MODE = 'specific'; // 'specific' or 'random'
const SPECIFIC_CATEGORIES = ['Non-Teaching'];
const TOTAL_APPLICANTS = 1000;
const API_BASE = `http://localhost:${process.env.PORT || 3000}/api`;

const delay = ms => new Promise(res => setTimeout(res, ms));

async function seed() {
    let connection;
    try {
        console.log('🔄 Starting advanced database seed process...');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            multipleStatements: true
        });

        // Ensure DB exists before using
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'rsp_db'}`);
        await connection.query(`USE ${process.env.DB_NAME || 'rsp_db'}`);

        console.log('🧹 Dropping existing tables...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('DROP TABLE IF EXISTS applicant_eligibility, applicant_experience, applicant_training, applicant_education, applicants, positions');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        // 1. Run database.sql
        const sqlFilePath = path.join(__dirname, 'database.sql');
        const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');
        
        console.log('📦 Executing database.sql...');
        await connection.query(sqlQuery);

        // 2. Insert Positions
        console.log('📦 Seeding positions table from seed_positions.js...');
        for (let pos of positionsData) {
            await connection.query(
                'INSERT INTO positions (category, title, salaryGrade, in_vacancy, monthlySalary, vacancyCount, plantillaItem, qsEducation, qsTraining, qsExperience, qsEligibility) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    pos.category || '', pos.title || '', pos.salaryGrade || '', 0, pos.monthlySalary || '', 1, pos.plantillaItem || '', pos.qsEducation || '', pos.qsTraining || '', pos.qsExperience || '', pos.qsEligibility || ''
                ]
            );
        }

        // 3. Set Open Vacancies
        console.log('🔓 Opening specific vacancies...');
        const mandatoryPositions = ['Administrative Officer II', 'Project Development Officer I'];
        await connection.query('UPDATE positions SET in_vacancy = 1, vacancyCount = 5 WHERE title IN (?, ?)', mandatoryPositions);

        // Pick 3 random positions based on mode
        let queryCondition = CATEGORY_MODE === 'specific' ? `title NOT IN (?, ?) AND category IN (?)` : `title NOT IN (?, ?)`;
        let queryParams = CATEGORY_MODE === 'specific' ? [...mandatoryPositions, SPECIFIC_CATEGORIES] : mandatoryPositions;

        const [availablePositions] = await connection.query(`SELECT id FROM positions WHERE ${queryCondition} ORDER BY RAND() LIMIT 3`, queryParams);
        if (availablePositions.length > 0) {
            const randomIds = availablePositions.map(p => p.id);
            await connection.query('UPDATE positions SET in_vacancy = 1, vacancyCount = 5 WHERE id IN (?)', [randomIds]);
        }

        // Fetch the 5 open positions to assign to applicants
        const [openPositions] = await connection.query('SELECT title, category FROM positions WHERE in_vacancy = 1');
        console.log(`Open Positions: ${openPositions.map(p => p.title).join(', ')}`);

        // Close DB connection, shift to API simulation
        await connection.end();
        console.log('✅ Database setup complete. Starting API simulation...');

        // 4. Generate Applicants via API
        const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

        const civilStatuses = ['Single', 'Married', 'Widowed', 'Separated'];
        const religions = ['Catholic', 'Islam', 'Iglesia Ni Cristo', 'Born Again', 'N/A'];
        const disabilities = ['None', 'Visual Impairment', 'Hearing Impairment', 'Physical Disability', 'N/A'];
        const ethnicGroups = ['None', 'Tagalog', 'Cebuano', 'Ilocano', 'N/A'];
        const degrees = ['BS Computer Science', 'BS Business Administration', 'AB English', 'BS Nursing', 'BS Accountancy', 'BSEd', 'BS Civil Engineering'];
        const trainings = ['Leadership Seminar', 'Technical Writing', 'Data Analysis Workshop', 'Customer Service Training', 'Project Management'];
        const experiences = ['Administrative Assistant', 'Software Engineer', 'Customer Service Representative', 'Sales Executive', 'Project Coordinator', 'Teacher'];
        const eligibilities = ['Civil Service Professional', 'Civil Service Sub-Professional', 'LET', 'CPA', 'N/A'];

        console.log(`🚀 Sending API requests to create ${TOTAL_APPLICANTS} applicants (this will take time)...`);
        
        let allApplicantIds = [];

        // Batch generation to avoid socket exhaustion
        const BATCH_SIZE = 50;
        for (let i = 0; i < TOTAL_APPLICANTS; i += BATCH_SIZE) {
            const results = [];
            for (let j = 0; j < BATCH_SIZE && (i + j) < TOTAL_APPLICANTS; j++) {
                const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
                const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
                const positionObj = openPositions[Math.floor(Math.random() * openPositions.length)];
                
                const randomYear = Math.floor(Math.random() * (2000 - 1970 + 1)) + 1970;
                const randomMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
                const randomDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
                
                const payload = {
                    firstName: fName,
                    lastName: lName,
                    middleName: 'Seed',
                    nameExtension: Math.random() > 0.85 ? 'Jr.' : '',
                    applicationType: Math.random() > 0.5 ? 'Walk-in' : 'Online',
                    district: 'District ' + (Math.floor(Math.random() * 6) + 1),
                    address: JSON.stringify({
                        res_house: Math.floor(Math.random() * 999) + 1,
                        res_street: 'Seed Street',
                        res_subdivision: 'Seed Village',
                        res_barangay: 'Barangay ' + (Math.floor(Math.random() * 20) + 1),
                        res_city: 'Seed City',
                        res_province: 'Seed Province',
                        res_zip: '1000'
                    }),
                    birthdate: `${randomYear}-${randomMonth}-${randomDay}`,
                    sex: Math.random() > 0.5 ? 'Male' : 'Female',
                    civilStatus: civilStatuses[Math.floor(Math.random() * civilStatuses.length)],
                    religion: religions[Math.floor(Math.random() * religions.length)],
                    disability: disabilities[Math.floor(Math.random() * disabilities.length)],
                    ethnicGroup: ethnicGroups[Math.floor(Math.random() * ethnicGroups.length)],
                    emailAddress: `${fName}.${lName}${i+j}@example.com`.toLowerCase(),
                    contactNo: '09' + Math.floor(100000000 + Math.random() * 900000000),
                    pdsLink: 'http://example.com/pds',
                    category: positionObj.category,
                    position: positionObj.title,
                    education: JSON.stringify([{ degree: degrees[Math.floor(Math.random() * degrees.length)], year: Math.floor(Math.random() * (2022 - 2010 + 1)) + 2010, link: 'http://link' }]),
                    training: JSON.stringify([{ title: trainings[Math.floor(Math.random() * trainings.length)], hours: Math.floor(Math.random() * 80) + 8, link: 'http://link' }]),
                    experience: JSON.stringify([{ details: experiences[Math.floor(Math.random() * experiences.length)], years: (Math.random() * 10).toFixed(1), link: 'http://link' }]),
                    eligibility: JSON.stringify([{ details: eligibilities[Math.floor(Math.random() * eligibilities.length)], rating: (Math.random() * 20 + 80).toFixed(2), link: 'http://link' }])
                };

                try {
                    const res = await fetch(`${API_BASE}/applicants`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    const data = await res.json();
                    results.push(data);
                } catch (err) {
                    results.push({ success: false, error: err });
                }
            }
            results.forEach(r => {
                if (r && r.success && r.id) allApplicantIds.push(r.id);
            });
            console.log(`   Created ${allApplicantIds.length} / ${TOTAL_APPLICANTS} applicants...`);
            await delay(100); // Small timeout between batches
        }

        console.log(`✅ Successfully created ${allApplicantIds.length} applicants via API.`);

        // Distribute applicants into Steps
        const chunk = Math.floor(allApplicantIds.length / 5);
        const step2Ids = allApplicantIds.slice(chunk, allApplicantIds.length); 
        const step3Ids = allApplicantIds.slice(chunk * 2, allApplicantIds.length); 
        const step4Ids = allApplicantIds.slice(chunk * 3, allApplicantIds.length); 
        const step5Ids = allApplicantIds.slice(chunk * 4, allApplicantIds.length); 

        console.log(`⏩ Moving ${step2Ids.length} applicants to Step 2 (Qualifying requirements)...`);
        for (let i = 0; i < step2Ids.length; i += BATCH_SIZE) {
            const batch = step2Ids.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map(async id => {
                const details = await fetch(`${API_BASE}/applicants/${id}/details`).then(r => r.json());
                const qualifyDoc = async (type, docs) => {
                    if (docs && docs.length > 0) {
                        for (let doc of docs) {
                            await fetch(`${API_BASE}/applicants/${id}/${type}/${doc.id}/status`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'QUALIFIED' })
                            });
                        }
                    }
                };
                await qualifyDoc('education', details.education);
                await qualifyDoc('training', details.training);
                await qualifyDoc('experience', details.experience);
                await qualifyDoc('eligibility', details.eligibility);

                await fetch(`${API_BASE}/applicants/${id}/qualify`, { method: 'POST' });
                await fetch(`${API_BASE}/applicants/${id}/proceed-step2`, { method: 'POST' });
            });
            await Promise.all(batchPromises);
            await delay(100);
        }

        console.log(`⏩ Moving ${step3Ids.length} applicants to Step 3 (Assessing and Scoring)...`);
        for (let i = 0; i < step3Ids.length; i += BATCH_SIZE) {
            const batch = step3Ids.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map(async id => {
                const scorePayload = {
                    education: Math.floor(Math.random() * 5) + 5,
                    training: Math.floor(Math.random() * 5) + 5,
                    experience: Math.floor(Math.random() * 5) + 5,
                    performance: Math.floor(Math.random() * 10) + 10,
                    outstandingAccomplishments: Math.floor(Math.random() * 5) + 5,
                    applicationOfEducation: Math.floor(Math.random() * 5) + 5,
                    applicationOfLD: Math.floor(Math.random() * 5) + 5,
                    potential: Math.floor(Math.random() * 10) + 5,
                    isComplete: true
                };
                await fetch(`${API_BASE}/applicants/${id}/assess`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(scorePayload)
                });
                await fetch(`${API_BASE}/applicants/${id}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'ASSESSED' })
                });
            });
            await Promise.all(batchPromises);
            await delay(100);
        }

        console.log(`⏩ Moving ${step4Ids.length} applicants to Step 4 (Requirements phase)...`);
        for (let i = 0; i < step4Ids.length; i += BATCH_SIZE) {
            const batch = step4Ids.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map(id => 
                fetch(`${API_BASE}/applicants/${id}/proceed-requirements`, { method: 'POST' })
            );
            await Promise.all(batchPromises);
            await delay(100);
        }

        console.log(`⏩ Moving ${step5Ids.length} applicants to Step 5 (Assigned)...`);
        const offices = ['Engineering Dept', 'HR Dept', 'Marketing Office', 'Executive Suite', 'Finance Dept'];
        for (let i = 0; i < step5Ids.length; i += BATCH_SIZE) {
            const batch = step5Ids.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map(async id => {
                await fetch(`${API_BASE}/applicants/${id}/requirements/all`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ value: true })
                });
                await fetch(`${API_BASE}/applicants/${id}/toggle-assignment-req`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'COMPLETE' })
                });
                await fetch(`${API_BASE}/applicants/${id}/assign`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        office: offices[Math.floor(Math.random() * offices.length)],
                        cc: 'Juan Dela Cruz',
                        ccDesignation: 'Division Head',
                        cc_2: 'Maria Clara',
                        ccDesignation_2: 'Department Manager',
                        cc_3: 'Jose Rizal',
                        ccDesignation_3: 'Operations Head',
                        cc_4: 'Andres Bonifacio',
                        ccDesignation_4: 'HR Director'
                    })
                });
            });
            await Promise.all(batchPromises);
            await delay(100);
        }

        console.log('🎉 Seeding via API completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        if (connection) await connection.end();
        process.exit(1);
    }
}

seed();
