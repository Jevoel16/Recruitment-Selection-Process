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

        console.log('🧹 Dropping existing applicant tables...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('DROP TABLE IF EXISTS applicant_eligibility, applicant_experience, applicant_training, applicant_education, applicants');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        // 1. Run database.sql
        const sqlFilePath = path.join(__dirname, 'database.sql');
        const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');
        
        console.log('📦 Executing database.sql...');
        await connection.query(sqlQuery);

        // 3. Set Open Vacancies
        console.log('🔓 Opening specific vacancies...');
        
        const mandatoryPositions = ['Administrative Officer I', 'Project Development Officer II'];
        await connection.query('UPDATE positions SET in_vacancy = 0, vacancyAnnouncementNo = NULL'); // Reset all just in case
        await connection.query('UPDATE positions SET in_vacancy = 1, vacancyCount = 5, vacancyAnnouncementNo = 1 WHERE title = ?', ['Administrative Officer I']);
        await connection.query('UPDATE positions SET in_vacancy = 1, vacancyCount = 5, vacancyAnnouncementNo = 2 WHERE title = ?', ['Project Development Officer II']);

        // Fetch the open positions to assign to applicants
        const [openPositions] = await connection.query('SELECT title, category, vacancyAnnouncementNo FROM positions WHERE in_vacancy = 1');
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

        // Generate a valid JWT token to bypass authentication
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
            'Cookie': `auth=${token}`
        };

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
                    emailAddress: `jevoel.orbilla@gmail.com`,
                    contactNo: '09' + Math.floor(100000000 + Math.random() * 900000000),
                    pdsLink: 'http://example.com/pds',
                    category: positionObj.category,
                    position: positionObj.title,
                    vacancyAnnouncementNo: positionObj.vacancyAnnouncementNo || null,
                    education: JSON.stringify([{ degree: degrees[Math.floor(Math.random() * degrees.length)], year: Math.floor(Math.random() * (2022 - 2010 + 1)) + 2010, link: 'http://link' }]),
                    training: JSON.stringify([{ title: trainings[Math.floor(Math.random() * trainings.length)], hours: Math.floor(Math.random() * 80) + 8, link: 'http://link' }]),
                    experience: JSON.stringify([{ details: experiences[Math.floor(Math.random() * experiences.length)], years: (Math.random() * 10).toFixed(1), link: 'http://link' }]),
                    eligibility: JSON.stringify([{ details: eligibilities[Math.floor(Math.random() * eligibilities.length)], rating: (Math.random() * 20 + 80).toFixed(2), link: 'http://link' }])
                };

                try {
                    const res = await fetch(`${API_BASE}/applicants`, {
                        method: 'POST',
                        headers: authHeaders,
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

        // Distribute applicants: 200 in Step 1 (50 Pending, 75 Qualified, 75 Disqualified)
        // And the remaining 800 proceed exactly as they did before
        const pendingIds = allApplicantIds.slice(0, 50); 
        const qualifiedIds = allApplicantIds.slice(50, 125); 
        const disqualifiedIds = allApplicantIds.slice(125, 200); 
        
        const step2Ids = allApplicantIds.slice(200, allApplicantIds.length); 
        const step3Ids = allApplicantIds.slice(400, allApplicantIds.length); 
        const step4Ids = allApplicantIds.slice(600, allApplicantIds.length); 
        const step5Ids = allApplicantIds.slice(800, allApplicantIds.length); 

        console.log(`⏩ Leaving ${pendingIds.length} applicants as PENDING in Step 1...`);

        console.log(`⏩ Moving ${qualifiedIds.length} applicants to Step 1 (QUALIFIED)...`);
        for (let i = 0; i < qualifiedIds.length; i += BATCH_SIZE) {
            const batch = qualifiedIds.slice(i, i + BATCH_SIZE);
            for (const id of batch) {
                const details = await fetch(`${API_BASE}/applicants/${id}/details`, { headers: authHeaders }).then(r => r.json());
                const qualifyDoc = async (type, docs) => {
                    if (docs && docs.length > 0) {
                        for (let doc of docs) {
                            await fetch(`${API_BASE}/applicants/${id}/${type}/${doc.id}/status`, {
                                method: 'PUT',
                                headers: authHeaders,
                                body: JSON.stringify({ status: 'QUALIFIED' })
                            });
                        }
                    }
                };
                await qualifyDoc('education', details.education);
                await qualifyDoc('training', details.training);
                await qualifyDoc('experience', details.experience);
                await qualifyDoc('eligibility', details.eligibility);

                await fetch(`${API_BASE}/applicants/${id}/qualify`, { method: 'POST', headers: authHeaders });
                // We intentionally omit /proceed-step2 so they stay in Step 1 but are flagged as QUALIFIED
            }
            await delay(100);
        }

        console.log(`⏩ Moving ${disqualifiedIds.length} applicants to Step 1 (DISQUALIFIED)...`);
        for (let i = 0; i < disqualifiedIds.length; i += BATCH_SIZE) {
            const batch = disqualifiedIds.slice(i, i + BATCH_SIZE);
            for (const id of batch) {
                const details = await fetch(`${API_BASE}/applicants/${id}/details`, { headers: authHeaders }).then(r => r.json());
                const disqualifyDoc = async (type, docs) => {
                    if (docs && docs.length > 0) {
                        for (let doc of docs) {
                            await fetch(`${API_BASE}/applicants/${id}/${type}/${doc.id}/status`, {
                                method: 'PUT',
                                headers: authHeaders,
                                body: JSON.stringify({ status: 'DISQUALIFIED' })
                            });
                        }
                    }
                };
                await disqualifyDoc('education', details.education);
                await disqualifyDoc('training', details.training);
                await disqualifyDoc('experience', details.experience);
                await disqualifyDoc('eligibility', details.eligibility);

                await fetch(`${API_BASE}/applicants/${id}/disqualify`, { 
                    method: 'POST', 
                    headers: authHeaders,
                    body: JSON.stringify({ reason: 'Pursuant to Section 21 of DO 7 s. 2023 provides that "Individuals who failed to submit complete mandatory documents (Items 20.a to 20.j) on the set deadline indicated in the official memorandum shall not be included in the pool of official applicants.” and upon reviewing your submitted documents, you failed to meet the complete mandatory requirements or qualifications.' })
                });
            }
            await delay(100);
        }

        console.log(`⏩ Moving ${step2Ids.length} applicants to Step 2 (Qualifying requirements)...`);
        for (let i = 0; i < step2Ids.length; i += BATCH_SIZE) {
            const batch = step2Ids.slice(i, i + BATCH_SIZE);
            for (const id of batch) {
                const details = await fetch(`${API_BASE}/applicants/${id}/details`, { headers: authHeaders }).then(r => r.json());
                const qualifyDoc = async (type, docs) => {
                    if (docs && docs.length > 0) {
                        for (let doc of docs) {
                            await fetch(`${API_BASE}/applicants/${id}/${type}/${doc.id}/status`, {
                                method: 'PUT',
                                headers: authHeaders,
                                body: JSON.stringify({ status: 'QUALIFIED' })
                            });
                        }
                    }
                };
                await qualifyDoc('education', details.education);
                await qualifyDoc('training', details.training);
                await qualifyDoc('experience', details.experience);
                await qualifyDoc('eligibility', details.eligibility);

                await fetch(`${API_BASE}/applicants/${id}/qualify`, { method: 'POST', headers: authHeaders });
                await fetch(`${API_BASE}/applicants/${id}/proceed-step2`, { method: 'POST', headers: authHeaders });
            }
            await delay(100);
        }

        console.log(`⏩ Moving ${step3Ids.length} applicants to Step 3 (Assessing and Scoring)...`);
        
        let step3Conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'rsp_db'
        });
        const [appData] = step3Ids.length > 0 ? await step3Conn.query('SELECT a.id, p.category, p.title as posTitle, p.salaryGrade FROM applicants a LEFT JOIN positions p ON a.position = p.title WHERE a.id IN (?)', [step3Ids]) : [[]];
        await step3Conn.end();
        
        const appMap = {};
        appData.forEach(row => appMap[row.id] = row);

        for (let i = 0; i < step3Ids.length; i += BATCH_SIZE) {
            const batch = step3Ids.slice(i, i + BATCH_SIZE);
            for (const id of batch) {
                const info = appMap[id] || {};
                const category = info.category || '';
                const title = info.posTitle || '';
                const sgStr = info.salaryGrade || '';
                const sg = parseInt(sgStr.replace(/[^0-9]/g, ''), 10) || 0;
                
                let standard = 'General';
                if (category === 'Teaching' && title.includes('Teacher I') && !title.includes('Teacher II') && !title.includes('Teacher III')) standard = 'Teacher I';
                else if (category === 'School Administration') standard = 'School Administration';
                else if (category === 'Teaching' || category === 'Related Teaching') {
                    if (sg >= 11 && sg <= 15) standard = 'RT SG 11-15';
                    else if (sg >= 16 && sg <= 23) standard = 'RT SG 16-23';
                    else if (sg == 24) standard = 'RT SG 24';
                    else standard = 'General';
                } else {
                    if (sg >= 1 && sg <= 9) standard = 'SG 1-9';
                    else if (sg >= 10 && sg <= 22) standard = 'SG 10-22';
                    else if (sg == 24) standard = 'SG 24';
                    else standard = 'General';
                }

                const cKeys = {
                    'Teacher I': ['education', 'training', 'experience', 'pbet', 'ppst_coi', 'ppst_ncoi'],
                    'School Administration': ['education', 'training', 'experience', 'performance', 'outstandingAccomplishments', 'applicationOfEducation', 'applicationOfLD', 'potential'],
                    'General': ['education', 'training', 'experience', 'performance', 'outstandingAccomplishments', 'potential'],
                    'SG 1-9': ['education', 'training', 'experience', 'performance', 'outstandingAccomplishments', 'applicationOfEducation', 'applicationOfLD', 'potential'],
                    'SG 10-22': ['education', 'training', 'experience', 'performance', 'outstandingAccomplishments', 'applicationOfEducation', 'applicationOfLD', 'potential'],
                    'SG 24': ['education', 'training', 'experience', 'performance', 'outstandingAccomplishments', 'applicationOfEducation', 'applicationOfLD', 'potential'],
                    'RT SG 11-15': ['education', 'training', 'experience', 'performance', 'outstandingAccomplishments', 'applicationOfEducation', 'applicationOfLD', 'potential'],
                    'RT SG 16-23': ['education', 'training', 'experience', 'performance', 'outstandingAccomplishments', 'applicationOfEducation', 'applicationOfLD', 'potential'],
                    'RT SG 24': ['education', 'training', 'experience', 'performance', 'outstandingAccomplishments', 'applicationOfEducation', 'applicationOfLD', 'potential']
                };
                
                const keys = cKeys[standard] || cKeys['General'];
                const scorePayload = { isComplete: true };
                
                if (keys.includes('education')) scorePayload.education = Math.floor(Math.random() * 5) + 1;
                if (keys.includes('training')) scorePayload.training = Math.floor(Math.random() * 5) + 1;
                if (keys.includes('experience')) scorePayload.experience = Math.floor(Math.random() * 5) + 1;
                if (keys.includes('performance')) scorePayload.performance = Math.floor(Math.random() * 10) + 5;
                if (keys.includes('outstandingAccomplishments')) scorePayload.outstandingAccomplishments = Math.floor(Math.random() * 5) + 1;
                if (keys.includes('applicationOfEducation')) scorePayload.applicationOfEducation = Math.floor(Math.random() * 5) + 1;
                if (keys.includes('applicationOfLD')) scorePayload.applicationOfLD = Math.floor(Math.random() * 5) + 1;
                if (keys.includes('potential')) scorePayload.potential = Math.floor(Math.random() * 10) + 1;
                if (keys.includes('pbet')) scorePayload.pbet = Math.floor(Math.random() * 5) + 1;
                if (keys.includes('ppst_coi')) scorePayload.ppst_coi = Math.floor(Math.random() * 15) + 5;
                if (keys.includes('ppst_ncoi')) scorePayload.ppst_ncoi = Math.floor(Math.random() * 10) + 5;
                await fetch(`${API_BASE}/applicants/${id}/assess`, {
                    method: 'POST',
                    headers: authHeaders,
                    body: JSON.stringify(scorePayload)
                });
                await fetch(`${API_BASE}/applicants/${id}/status`, {
                    method: 'PUT',
                    headers: authHeaders,
                    body: JSON.stringify({ status: 'ASSESSED' })
                });
            }
            await delay(100);
        }

        console.log(`⏩ Moving ${step4Ids.length} applicants to Step 4 (Requirements phase)...`);
        for (let i = 0; i < step4Ids.length; i += BATCH_SIZE) {
            const batch = step4Ids.slice(i, i + BATCH_SIZE);
            for (const id of batch) {
                await fetch(`${API_BASE}/applicants/${id}/proceed-requirements`, { method: 'POST', headers: authHeaders });
            }
            await delay(100);
        }

        console.log(`⏩ Moving ${step5Ids.length} applicants to Step 5 (Assigned)...`);
        const offices = ['Engineering Dept', 'HR Dept', 'Marketing Office', 'Executive Suite', 'Finance Dept'];
        for (let i = 0; i < step5Ids.length; i += BATCH_SIZE) {
            const batch = step5Ids.slice(i, i + BATCH_SIZE);
            for (const id of batch) {
                await fetch(`${API_BASE}/applicants/${id}/requirements/all`, {
                    method: 'POST',
                    headers: authHeaders,
                    body: JSON.stringify({ value: true })
                });
                await fetch(`${API_BASE}/applicants/${id}/toggle-assignment-req`, {
                    method: 'POST',
                    headers: authHeaders,
                    body: JSON.stringify({ status: 'COMPLETE' })
                });
                await fetch(`${API_BASE}/applicants/${id}/assign`, {
                    method: 'POST',
                    headers: authHeaders,
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
            }
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
