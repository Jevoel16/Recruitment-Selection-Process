require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const positionsData = require('./seed_positions.js');

// --- SETTINGS ---
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
        await connection.query('DROP TABLE IF EXISTS applicant_eligibility, applicant_experience, applicant_training, applicant_education, applicant_performance, applicants');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        // 1. Run database.sql to rebuild just the applicant tables
        const sqlFilePath = path.join(__dirname, 'database.sql');
        const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');
        console.log('📦 Executing database.sql (recreating applicant schema)...');
        await connection.query(sqlQuery);
        

        // 2. Setup API Auth
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

        // 3. Create active positions via API
        console.log('🔓 Creating new random positions with active vacancies via API...');
        const newPositionsToCreate = [
            { title: 'Administrative Officer II', category: 'Non-Teaching', vacNo: '101', count: 5, posCode: 'ADOF2' },
            { title: 'Administrative Assistant III', category: 'Non-Teaching', vacNo: '102', count: 6, posCode: 'ADAS3' },
            { title: 'Project Development Officer II', category: 'Non-Teaching', vacNo: '103', count: 5, posCode: 'PDO2' },
            { title: 'Accountant I', category: 'Non-Teaching', vacNo: '104', count: 5, posCode: 'ACC1' },
            { title: 'Teacher I (Elementary)', category: 'Teaching', vacNo: '105', count: 10, posCode: 'T1' },
            { title: 'Teacher I (Junior High School)', category: 'Teaching', vacNo: '106', count: 8, posCode: 'T1' },
            { title: 'Teacher I (Senior High School)', category: 'Teaching', vacNo: '107', count: 7, posCode: 'T1' },
            { title: 'School Principal I', category: 'School Administration', vacNo: '108', count: 5, posCode: 'SP1' },
            { title: 'Teacher II (Elementary)', category: 'Teaching', vacNo: '109', count: 5, posCode: 'T2' },
            { title: 'Master Teacher I (Elementary)', category: 'Teaching', vacNo: '110', count: 5, posCode: 'MT1' }
        ];

        const openPositions = [];

        for (const pos of newPositionsToCreate) {
            // Find existing position
            const [rows] = await connection.query('SELECT id, title, category FROM positions WHERE title = ?', [pos.title]);
            if (rows.length === 0) {
                console.log(`Skipping ${pos.title} as it was not found in the DB.`);
                continue;
            }
            
            const insertId = rows[0].id;

            // Generate mock Plantilla Items based on count
            const generatedItems = [];
            for(let i = 0; i < pos.count; i++) {
                generatedItems.push(`${pos.posCode}-${Math.floor(100000 + Math.random() * 900000)}-2026`);
            }
            
            const plantillaPayload = [
                {
                    items: generatedItems.join(', '),
                    parenthetical: '',
                    dropdown1: 'Division Office',
                    dropdown2: 'Self- Management, Professionalism and Ethics, Result Focus, Teamwork, Service Orientation, Innovation'
                }
            ];

            await connection.query(
                'UPDATE positions SET vacancyAnnouncementNo = ?, plantillaItem = ?, in_vacancy = 1, vacancyCount = ? WHERE id = ?',
                [pos.vacNo, JSON.stringify(plantillaPayload), pos.count, insertId]
            );

            openPositions.push({ id: insertId, title: pos.title, category: pos.category, vacancyAnnouncementNo: pos.vacNo });
        }
        
        await connection.end();

        console.log(`Open Positions: ${openPositions.map(p => p.title).join(', ')}`);
        console.log('✅ Database and Position setup complete. Starting API simulation for Applicants...');

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
                
                    const posUpper = positionObj.title.toUpperCase();
                    const isHigherTeaching = /^(TEACHER (II|III|IV|V|VI|VII)|MASTER TEACHER (I|II|III|IV|V))\b/.test(posUpper) || positionObj.category === 'School Administration';
                    
                    let perfData = [];
                    if (isHigherTeaching) {
                        const groupId = Math.random().toString(36).substr(2, 9);
                        perfData = [
                            { group_id: groupId, ratingPeriod: 'SY 2021-2022', rating: '3.750', letterGrade: 'VS' },
                            { group_id: groupId, ratingPeriod: 'SY 2022-2023', rating: '3.800', letterGrade: 'VS' },
                            { group_id: groupId, ratingPeriod: 'SY 2023-2024', rating: '3.900', letterGrade: 'VS' }
                        ];
                    }

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
                        eligibility: JSON.stringify([{ details: eligibilities[Math.floor(Math.random() * eligibilities.length)], rating: (Math.random() * 20 + 80).toFixed(2), link: 'http://link' }]),
                        performance: JSON.stringify(perfData)
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
                await qualifyDoc('performance', details.performance);

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
                await disqualifyDoc('performance', details.performance);

                await fetch(`${API_BASE}/applicants/${id}/disqualify`, { 
                    method: 'POST', 
                    headers: authHeaders,
                    body: JSON.stringify({ reason: '' })
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
                await qualifyDoc('performance', details.performance);

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
                
                const catLower = category.toLowerCase();
                const posLower = title.toLowerCase();
                
                const isGeneral = catLower.includes('general services') || 
                                  sgStr.toLowerCase().includes('general services') ||
                                  posLower.includes('aide') || posLower.includes('guard') || posLower.includes('watchman') ||
                                  posLower.includes('worker') || posLower.includes('driver') || posLower.includes('cook') ||
                                  posLower.includes('mechanic') || posLower.includes('operator') || posLower.includes('fisherman') ||
                                  posLower.includes('clerk') || posLower.includes('maintenance');

                const isAdmin = catLower.includes('school administration') || catLower.includes('school admin') ||
                                posLower.includes('principal') || posLower.includes('head teacher') || posLower.includes('supervisor');

                const isRelated = catLower.includes('related teaching') || catLower.includes('related-teaching') ||
                                  posLower.includes('nurse') || posLower.includes('guidance') || posLower.includes('librarian') || 
                                  posLower.includes('counselor') || posLower.includes('psychologist') || posLower.includes('education program specialist') || posLower.includes('eps');

                const isTeacher = catLower.includes('teacher') || catLower === 'teaching' ||
                                  posLower.includes('teacher i') || posLower === 'teacher';

                let standard = 'SG 1-9';
                if (isAdmin) standard = 'School Administration';
                else if (isTeacher) standard = 'Teacher I';
                else if (isRelated) {
                    if (sg >= 11 && sg <= 15) standard = 'RT SG 11-15';
                    else if ((sg >= 16 && sg <= 23) || sg === 27) standard = 'RT SG 16-23';
                    else if (sg >= 24) standard = 'RT SG 24';
                    else standard = 'RT SG 11-15';
                }
                else if (isGeneral) standard = 'General';
                else if ((sg >= 10 && sg <= 22) || sg === 27) standard = 'SG 10-22 and SG 27';
                else if (sg >= 23) standard = 'SG 24';
                else standard = 'SG 1-9';

                const cKeys = {
                    'Teacher I': ['education', 'training', 'experience', 'pbet', 'ppst_coi', 'ppst_ncoi'],
                    'School Administration': ['education', 'training', 'experience', 'performance', 'outstandingAccomplishments', 'applicationOfEducation', 'applicationOfLD', 'potential'],
                    'General': ['education', 'training', 'experience', 'performance', 'outstandingAccomplishments', 'potential'],
                    'SG 1-9': ['education', 'training', 'experience', 'performance', 'outstandingAccomplishments', 'applicationOfEducation', 'applicationOfLD', 'potential'],
                    'SG 10-22 and SG 27': ['education', 'training', 'experience', 'performance', 'outstandingAccomplishments', 'applicationOfEducation', 'applicationOfLD', 'potential'],
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
