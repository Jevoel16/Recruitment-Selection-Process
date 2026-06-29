require('dotenv').config();
const express = require('express');
const hbs = require('hbs');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const requirementFields = [
    'req_pds',
    'req_prcLicense',
    'req_reportRating',
    'req_medCert',
    'req_birthCert',
    'req_marriageCert',
    'req_nbiClearance',
    'req_tor',
    'req_diplomaBachelors',
    'req_masters',
    'req_doctorate',
    'req_soGraduation',
    'req_orderSeparation',
    'req_saln'
];

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Static Files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));
app.use('/bootstrap-icons', express.static(path.join(__dirname, 'node_modules/bootstrap-icons/font')));

// View Engine
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
hbs.registerPartials(path.join(__dirname, 'views', 'partials'));

// Helper for index calculation
hbs.registerHelper('inc', function(value, options) {
    return parseInt(value) + 1;
});

// Helper for index calculation with offset
hbs.registerHelper('incOffset', function(value, offset, options) {
    return parseInt(value) + parseInt(offset) + 1;
});

// Helper for conditional rendering in hbs
hbs.registerHelper('eq', function (a, b) {
    return a === b;
});

// Helper to check if all requirements are met
hbs.registerHelper('allRequirementsMet', function(applicant) {
    return requirementFields.every((field) => Boolean(applicant[field]));
});

// Helper for formatting date
hbs.registerHelper('formatDate', function(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
});

app.get('/', (req, res) => res.redirect('/dashboard'));

app.get('/dashboard', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM positions ORDER BY category ASC, title ASC');
        const groupedPositions = {};
        let totalVacantCount = 0;
        let totalPositionsCount = 0;
        for (const row of rows) {
            if (!groupedPositions[row.category]) {
                groupedPositions[row.category] = { categoryName: row.category, hasVacancy: false, positions: [], vacantCount: 0, totalCount: 0 };
            }
            groupedPositions[row.category].totalCount++;
            totalPositionsCount++;
            if (row.in_vacancy) {
                groupedPositions[row.category].hasVacancy = true;
                groupedPositions[row.category].vacantCount++;
                totalVacantCount++;
            }
            groupedPositions[row.category].positions.push(row);
        }
        res.render('dashboard', { dashboardActive: true, groupedPositions, totalVacantCount, totalPositionsCount });
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});

app.get('/dashboard/:id', async (req, res, next) => {
    if (isNaN(req.params.id)) return next();
    try {
        const [rows] = await db.query('SELECT * FROM positions ORDER BY category ASC, title ASC');
        const groupedPositions = {};
        let selectedPosition = null;
        let totalVacantCount = 0;
        let totalPositionsCount = 0;
        for (const row of rows) {
            if (row.id == req.params.id) selectedPosition = row;
            if (!groupedPositions[row.category]) {
                groupedPositions[row.category] = { categoryName: row.category, hasVacancy: false, positions: [], vacantCount: 0, totalCount: 0 };
            }
            groupedPositions[row.category].totalCount++;
            totalPositionsCount++;
            if (row.in_vacancy) {
                groupedPositions[row.category].hasVacancy = true;
                groupedPositions[row.category].vacantCount++;
                totalVacantCount++;
            }
            groupedPositions[row.category].positions.push(row);
        }
        res.render('dashboard', { dashboardActive: true, groupedPositions, selectedPosition, totalVacantCount, totalPositionsCount });
    } catch (e) {
        console.error(e);
        res.status(500).send('Error');
    }
});

// Update Qualification Standards
app.post('/api/positions/update', express.json(), async (req, res) => {
    try {
        const { id, vacancyAnnouncement, plantillaItem, salaryGrade, monthlySalary, qsEducation, qsTraining, qsExperience, qsEligibility } = req.body;
        await db.query(`UPDATE positions SET vacancyAnnouncement=?, plantillaItem=?, salaryGrade=?, monthlySalary=?, qsEducation=?, qsTraining=?, qsExperience=?, qsEligibility=? WHERE id=?`, 
            [vacancyAnnouncement, plantillaItem, salaryGrade, monthlySalary, qsEducation, qsTraining, qsExperience, qsEligibility, id]);
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// Toggle Position Vacancy
app.post('/api/positions/:id/vacancy', express.json(), async (req, res) => {
    try {
        const { in_vacancy } = req.body;
        await db.query(`UPDATE positions SET in_vacancy = ? WHERE id = ?`, [in_vacancy ? 1 : 0, req.params.id]);
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// Update Plantilla and Vacancy Count
app.post('/api/positions/:id/plantilla', express.json(), async (req, res) => {
    try {
        const { vacancyCount, plantillaItem } = req.body;
        await db.query(`UPDATE positions SET vacancyCount = ?, plantillaItem = ? WHERE id = ?`, [vacancyCount, plantillaItem, req.params.id]);
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

app.get('/add-applicant', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM positions WHERE in_vacancy = true ORDER BY category ASC, title ASC');
        const groupedPositions = {};
        for (const row of rows) {
            if (!groupedPositions[row.category]) {
                groupedPositions[row.category] = { categoryName: row.category, positions: [] };
            }
            groupedPositions[row.category].positions.push(row);
        }
        res.render('add-applicant', { addApplicantActive: true, groupedPositions });
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});

app.get('/:step', (req, res, next) => {
    if (['step1', 'step2', 'step3', 'step4', 'step5'].includes(req.params.step)) {
        res.redirect(`/${req.params.step}/1`);
    } else {
        next();
    }
});

app.get('/:step/:page', async (req, res, next) => {
    const { step } = req.params;
    
    const stepsConfig = {
        'step1': {
            conditions: "status IN ('PENDING', 'QUALIFIED', 'DISQUALIFIED')",
            orderBy: "createdAt ASC"
        },
        'step2': {
            conditions: "status = 'WAITING_FOR_ASSESSMENT'",
            orderBy: "createdAt ASC"
        },
        'step3': {
            conditions: "status = 'ASSESSED'",
            orderBy: "assessmentTotal DESC"
        },
        'step4': {
            conditions: "status = 'WAITING'",
            orderBy: "createdAt ASC"
        },
        'step5': {
            conditions: "status = 'ASSIGNED'",
            orderBy: "createdAt ASC"
        }
    };

    if (!stepsConfig[step]) return next();

    const positionFilter = req.query.position || '';
    const page = parseInt(req.params.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const searchQuery = req.query.q || '';
    const config = stepsConfig[step];
    
    let baseQuery = `FROM applicants WHERE ${config.conditions}`;
    const queryParams = [];

    if (searchQuery) {
        baseQuery += ` AND (CONCAT(firstName, ' ', lastName) LIKE ? OR applicationCode LIKE ?)`;
        const searchPattern = `%${searchQuery}%`;
        queryParams.push(searchPattern, searchPattern);
    }

    if (positionFilter && (step === 'step1' || step === 'step2' || step === 'step3' || step === 'step4')) {
        baseQuery += ` AND position = ?`;
        queryParams.push(positionFilter);
    }

    try {
        const [countResult] = await db.query(`SELECT COUNT(*) AS total ${baseQuery}`, queryParams);
        const totalRecords = countResult[0].total;
        const totalPages = Math.ceil(totalRecords / limit) || 1;

        const [rows] = await db.query(`SELECT *, CONCAT(firstName, ' ', lastName) AS name ${baseQuery} ORDER BY ${config.orderBy} LIMIT ? OFFSET ?`, [...queryParams, limit, offset]);

        let positionList = [];
        if (step === 'step1' || step === 'step2' || step === 'step3' || step === 'step4') {
            const [positions] = await db.query(`SELECT DISTINCT position FROM applicants WHERE position IS NOT NULL AND position != '' ORDER BY position ASC`);
            positionList = positions.map(p => p.position);
        }

        const mappedRows = rows.map(row => {
            row.scores = {
                education: row.scoreEducation,
                training: row.scoreTraining,
                experience: row.scoreExperience,
                performance: row.scorePerformance,
                outstandingAccomplishments: row.scoreOutstandingAccomplishments,
                applicationOfEducation: row.scoreApplicationOfEducation,
                applicationOfLD: row.scoreApplicationOfLD,
                potential: row.scorePotential,
                total: row.assessmentTotal
            };
            return row;
        });

        if (step === 'step1') {
            for (let row of mappedRows) {
                if (row.status !== 'PENDING') {
                    row.docRemark = row.status === 'QUALIFIED' ? 'Qualified' : 'Disqualified';
                    continue;
                }
                
                const [docs] = await db.query(`
                    SELECT status FROM applicant_education WHERE applicant_id = ?
                    UNION ALL
                    SELECT status FROM applicant_training WHERE applicant_id = ?
                    UNION ALL
                    SELECT status FROM applicant_experience WHERE applicant_id = ?
                    UNION ALL
                    SELECT status FROM applicant_eligibility WHERE applicant_id = ?
                `, [row.id, row.id, row.id, row.id]);
                
                if (docs.length === 0) {
                    row.docRemark = 'Pending';
                } else {
                    const pendingCount = docs.filter(d => d.status === 'PENDING' || !d.status).length;
                    if (pendingCount === docs.length) {
                        row.docRemark = 'Pending';
                    } else if (pendingCount === 0) {
                        row.docRemark = 'Assessed';
                    } else {
                        row.docRemark = 'In-Prog';
                    }
                }
            }
        }

        const pagination = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
                let pUrl = `/${step}/${i}?`;
                if (searchQuery) pUrl += `q=${encodeURIComponent(searchQuery)}&`;
                if (positionFilter) pUrl += `position=${encodeURIComponent(positionFilter)}&`;
                pagination.push({
                    page: i,
                    isCurrent: i === page,
                    url: pUrl.replace(/&$/, '')
                });
            } else if (i === page - 3 || i === page + 3) {
                pagination.push({ isEllipsis: true, page: '...' });
            }
        }
        
        const cleanPagination = pagination.filter((p, index, arr) => {
            if (p.isEllipsis && arr[index - 1] && arr[index - 1].isEllipsis) return false;
            return true;
        });

        res.render('index', {
            currentStep: step,
            [step]: mappedRows,
            searchQuery,
            positionFilter,
            positionList,
            pagination: cleanPagination,
            step1Active: step === 'step1',
            step2Active: step === 'step2',
            step3Active: step === 'step3',
            step4Active: step === 'step4',
            step5Active: step === 'step5',
            offset
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Database Error');
    }
});

async function ensureRequirementColumns() {
    const [columns] = await db.query(
        `SELECT COLUMN_NAME
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'applicants'`,
        [process.env.DB_NAME || 'rsp_db']
    );

    const existingColumns = new Set(columns.map((column) => column.COLUMN_NAME));
    const missingColumns = requirementFields.filter((field) => !existingColumns.has(field));

    for (const column of missingColumns) {
        await db.query(`ALTER TABLE applicants ADD COLUMN ${column} BOOLEAN DEFAULT FALSE AFTER contactNo`);
    }
}

async function syncAssignmentRequirementStatus(id) {
    const [rows] = await db.query(
        `SELECT ${requirementFields.join(', ')} FROM applicants WHERE id = ?`,
        [id]
    );

    if (!rows.length) return;

    const allComplete = requirementFields.every((field) => Boolean(rows[0][field]));
    await db.query(
        `UPDATE applicants SET assignmentReqStatus = ? WHERE id = ?`,
        [allComplete ? 'COMPLETE' : 'INCOMPLETE', id]
    );
}

// API Routes
// Add new applicant
app.post('/api/applicants', async (req, res) => {
    try {
        const { firstName, lastName, address, age, sex, civilStatus, religion, disability, ethnicGroup, emailAddress, contactNo, pdsLink, category, position } = req.body;
        
        let positionCode = 'POS';
        switch(position) {
            case 'Administrative Aide I': positionCode = 'ADA1'; break;
            case 'Watchman I': positionCode = 'WCHM1'; break;
            case 'Administrative Officer I': positionCode = 'ADOF1'; break;
            case 'Administrative Assistant III': positionCode = 'ADAS3'; break;
            case 'Legal Assistant I': positionCode = 'LEA1'; break;
            case 'Project Development Officer I': positionCode = 'PDO1'; break;
            case 'Administrative Officer II': positionCode = 'ADOF2'; break;
            case 'Administrative Officer IV': positionCode = 'ADOF4'; break;
            case 'School Principal I': positionCode = 'SP1'; break;
            case 'Project Development Officer II': positionCode = 'PDO2'; break;
            case 'Education Program Supervisor': positionCode = 'EPSVR'; break;
        }

        const currentYear = new Date().getFullYear();
        const sy = currentYear;

        const [result] = await db.query(
            'INSERT INTO applicants (firstName, lastName, middleName, applicationType, district, category, position, applicationCode, address, age, sex, civilStatus, religion, disability, ethnicGroup, emailAddress, contactNo, pdsLink) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
            [firstName, lastName, '', 'Walk-in', null, category || null, position || null, 'TEMP', address || null, age || null, sex || null, civilStatus || null, religion || null, disability || null, ethnicGroup || null, emailAddress || null, contactNo || null, pdsLink || null]
        );
        
        const applicantId = result.insertId;
        const newCode = `${positionCode}-${sy}-${applicantId}`;
        
        await db.query('UPDATE applicants SET applicationCode = ? WHERE id = ?', [newCode, applicantId]);

        console.log(`[ENTRY] New Application Created: ${newCode} (${firstName} ${lastName})`);
        res.json({ success: true, applicationCode: newCode, id: applicantId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete Applicant
app.delete('/api/applicants/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM applicants WHERE id = ?', [id]);
        console.log(`[DELETE] Applicant ID ${id} deleted`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Disqualify Applicant
app.post('/api/applicants/:id/disqualify', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query(`UPDATE applicants SET status = 'DISQUALIFIED' WHERE id = ?`, [id]);
        console.log(`[STATUS] Applicant ID ${id} disqualified (Step 1)`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Qualify Applicant
app.post('/api/applicants/:id/qualify', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query(`UPDATE applicants SET status = 'WAITING_FOR_ASSESSMENT' WHERE id = ?`, [id]);
        console.log(`[STATUS] Applicant ID ${id} qualified to Step 2.`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Toggle all requirements
app.post('/api/applicants/:id/requirements/all', async (req, res) => {
    try {
        const { id } = req.params;
        const { value } = req.body;
        const assignments = requirementFields.map((field) => `${field} = ?`).join(', ');
        await db.query(
            `UPDATE applicants SET ${assignments} WHERE id = ?`,
            [...Array(requirementFields.length).fill(Boolean(value)), id]
        );
        await syncAssignmentRequirementStatus(id);
        console.log(`[REQUIREMENTS] Applicant ID ${id} requirements toggled to ${value}`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update applicant requirement boolean
app.post('/api/applicants/:id/requirement', async (req, res) => {
    try {
        const { id } = req.params;
        const { field, value } = req.body;
        
        const allowedFields = requirementFields;
        if (!allowedFields.includes(field)) {
            return res.status(400).json({ success: false, error: 'Invalid field' });
        }
        
        await db.query(`UPDATE applicants SET ${field} = ? WHERE id = ?`, [value, id]);
        await syncAssignmentRequirementStatus(id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update applicant score
app.post('/api/applicants/:id/score', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query(`UPDATE applicants SET status = 'ASSESSED' WHERE id = ?`, [id]);
        console.log(`[STATUS] Applicant ID ${id} moved to Step 3 (Assessed)`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/applicants/:id/assess', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            education, training, experience, performance,
            outstandingAccomplishments, applicationOfEducation,
            applicationOfLD, potential, isComplete
        } = req.body;

        const edu = (education !== null && education !== '') ? parseFloat(education) : null;
        const trn = (training !== null && training !== '') ? parseFloat(training) : null;
        const exp = (experience !== null && experience !== '') ? parseFloat(experience) : null;
        const prf = (performance !== null && performance !== '') ? parseFloat(performance) : null;
        const oac = (outstandingAccomplishments !== null && outstandingAccomplishments !== '') ? parseFloat(outstandingAccomplishments) : null;
        const aoe = (applicationOfEducation !== null && applicationOfEducation !== '') ? parseFloat(applicationOfEducation) : null;
        const ald = (applicationOfLD !== null && applicationOfLD !== '') ? parseFloat(applicationOfLD) : null;
        const pot = (potential !== null && potential !== '') ? parseFloat(potential) : null;

        let total = 0;
        let anyScore = false;
        [edu, trn, exp, prf, oac, aoe, ald, pot].forEach(val => {
            if (val !== null) {
                total += val;
                anyScore = true;
            }
        });
        
        let finalTotal = anyScore ? parseFloat(total.toFixed(2)) : null;
        
        let remarks = 'Pending';
        if (anyScore) {
            remarks = isComplete ? 'Assessed' : 'In-Prog';
        }

        await db.query(`
            UPDATE applicants 
            SET scoreEducation = ?, scoreTraining = ?, scoreExperience = ?, 
                scorePerformance = ?, scoreOutstandingAccomplishments = ?, 
                scoreApplicationOfEducation = ?, scoreApplicationOfLD = ?, 
                scorePotential = ?, assessmentTotal = ?, assessmentRemarks = ?
            WHERE id = ?`, 
            [edu, trn, exp, prf, oac, aoe, ald, pot, finalTotal, remarks, id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Proceed to Requirements (Step 3 -> Step 4)
app.post('/api/applicants/:id/proceed-requirements', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query(`UPDATE applicants SET status = 'WAITING' WHERE id = ?`, [id]);
        console.log(`[STATUS] Applicant ID ${id} proceeded to Requirements (Step 4)`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Toggle Assignment Requirement Status (Step 4)
app.post('/api/applicants/:id/toggle-assignment-req', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'COMPLETE' or 'INCOMPLETE'
        await db.query(`UPDATE applicants SET assignmentReqStatus = ? WHERE id = ?`, [status, id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Assign Applicant (Step 4 -> Step 5)
app.post('/api/applicants/:id/assign', async (req, res) => {
    try {
        const { id } = req.params;
        const { office } = req.body;
        await db.query(`UPDATE applicants SET status = 'ASSIGNED', assignedOffice = ? WHERE id = ?`, [office, id]);
        console.log(`[ASSIGNMENT] Applicant ID ${id} assigned to office: ${office} (Step 5)`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update Personal Info
app.put('/api/applicants/:id/info', async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, address, age, sex, civilStatus, religion, disability, ethnicGroup, emailAddress, contactNo, pdsLink } = req.body;
        await db.query(
            `UPDATE applicants SET firstName=?, lastName=?, address=?, age=?, sex=?, civilStatus=?, religion=?, disability=?, ethnicGroup=?, emailAddress=?, contactNo=?, pdsLink=? WHERE id=?`, 
            [firstName, lastName, address, age || null, sex, civilStatus, religion, disability, ethnicGroup, emailAddress, contactNo, pdsLink || null, id]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add Education
app.post('/api/applicants/:id/education', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, year_graduated } = req.body;
        await db.query('INSERT INTO applicant_education (applicant_id, degree, yearGraduated, digitalCopyLink) VALUES (?, ?, ?, ?)', [id, title, year_graduated, '']);
        console.log(`[DOCUMENT] Added education to Applicant ID ${id}: ${title}`);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Set Highest Degree
app.post('/api/applicants/:id/education/:eduId/highest', async (req, res) => {
    try {
        const { id, eduId } = req.params;
        await db.query('UPDATE applicant_education SET is_highest = 0 WHERE applicant_id = ?', [id]);
        await db.query('UPDATE applicant_education SET is_highest = 1 WHERE id = ? AND applicant_id = ?', [eduId, id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Education
app.delete('/api/education/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM applicant_education WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Add Training
app.post('/api/applicants/:id/training', async (req, res) => {
    const { id } = req.params;
    const { title, hours } = req.body;
    try {
        await db.query('INSERT INTO applicant_training (applicant_id, title, hours, digitalCopyLink) VALUES (?, ?, ?, ?)', [id, title, hours, '']);
        console.log(`[DOCUMENT] Added training to Applicant ID ${id}: ${title}`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/training/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM applicant_training WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add Experience
app.post('/api/applicants/:id/experience', async (req, res) => {
    const { id } = req.params;
    const { details, years } = req.body;
    try {
        await db.query('INSERT INTO applicant_experience (applicant_id, details, years, digitalCopyLink) VALUES (?, ?, ?, ?)', [id, details, years, '']);
        console.log(`[DOCUMENT] Added experience to Applicant ID ${id}`);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Delete Experience
app.delete('/api/experience/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM applicant_experience WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Add Eligibility
app.post('/api/applicants/:id/eligibility', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, rating } = req.body;
        await db.query('INSERT INTO applicant_eligibility (applicant_id, details, rating, digitalCopyLink) VALUES (?, ?, ?, ?)', [id, title, rating, '']);
        console.log(`[DOCUMENT] Added eligibility to Applicant ID ${id}: ${title}`);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Export IER CSV
app.get('/api/export/ier', async (req, res) => {
    try {
        const positionFilter = req.query.position || '';
        let baseQuery = `FROM applicants WHERE status IN ('PENDING', 'QUALIFIED', 'DISQUALIFIED')`;
        const queryParams = [];

        if (positionFilter) {
            baseQuery += ` AND position = ?`;
            queryParams.push(positionFilter);
        }

        let posData = null;
        if (positionFilter) {
            const [posRows] = await db.query(`SELECT * FROM positions WHERE title = ? LIMIT 1`, [positionFilter]);
            if (posRows.length > 0) posData = posRows[0];
        }

        const vAnnounce = posData?.vacancyAnnouncement || '';
        const pItem = posData?.plantillaItem || '';
        const sGrade = posData?.salaryGrade || '';
        const qsEdu = posData?.qsEducation || '';
        const qsTrain = posData?.qsTraining || '';
        const qsExp = posData?.qsExperience || '';
        const qsElig = posData?.qsEligibility || '';

        // Sort numerically by applicant code as requested (treating as number where possible)
        const [applicants] = await db.query(`SELECT * ${baseQuery} ORDER BY CAST(applicationCode AS UNSIGNED) ASC, applicationCode ASC`, queryParams);

        const escapeHtml = (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

        let html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head>
<meta charset="utf-8">
<!--[if gte mso 9]>
<xml>
 <x:ExcelWorkbook>
  <x:ExcelWorksheets>
   <x:ExcelWorksheet>
    <x:Name>IER</x:Name>
    <x:WorksheetOptions>
     <x:Print>
      <x:ValidPrinterInfo/>
      <x:PaperSizeIndex>9</x:PaperSizeIndex>
      <x:FitWidth>1</x:FitWidth>
      <x:FitHeight>999</x:FitHeight>
     </x:Print>
     <x:FitToPage/>
    </x:WorksheetOptions>
   </x:ExcelWorksheet>
  </x:ExcelWorksheets>
 </x:ExcelWorkbook>
</xml>
<![endif]-->
<style>
  @page {
    mso-page-orientation: landscape;
    size: 297mm 210mm; /* A4 */
    margin: 0.5in;
  }
  body, table { font-family: 'Times New Roman', serif; font-size: 9pt; }
  table { border-collapse: collapse; width: 100%; page-break-inside: auto; }
  tr { page-break-inside: avoid; page-break-after: auto; }
  .no-border td, .no-border th { border: none !important; text-align: left; vertical-align: top; }
  .bordered td, .bordered th { border: 1px solid black; text-align: center; vertical-align: middle; padding: 4px; }
  .title-row td { text-align: center; font-size: 18pt; font-weight: bold; }
  .annex-row td { text-align: right; font-weight: bold; font-size: 14pt; }
  .text-bold { font-weight: bold; }
</style>
</head>
<body>
<table>
    <tr class="no-border">
        <td colspan="7"></td>
        <td colspan="2" style="text-align: right; font-weight: bold; font-size: 14pt;">Annex D</td>
    </tr>
    <tr class="no-border">
        <td colspan="9" style="text-align: center; font-size: 16pt; font-weight: bold;">INITIAL EVALUATION RESULT (IER)</td>
    </tr>
    <tr class="no-border" style="font-size: 12pt;">
        <td colspan="9">Position: <span style="font-weight: bold;">${escapeHtml(positionFilter)}</span></td>
    </tr>
    <tr class="no-border" style="font-size: 12pt;">
        <td colspan="9">VACANCY ANNOUNCEMENT NO. ${escapeHtml(vAnnounce)}</td>
    </tr>
    <tr class="no-border" style="font-size: 12pt;">
        <td colspan="9">PLANTILLA ITEM/S NUMBER: ${escapeHtml(pItem)}</td>
    </tr>
    <tr class="no-border" style="font-size: 12pt;">
        <td colspan="9">Salary Grade and Monthly Salary: ${escapeHtml(sGrade)}</td>
    </tr>
    <tr class="no-border" style="font-size: 12pt;">
        <td colspan="9">Qualification Standards:</td>
    </tr>
    <tr class="no-border" style="font-size: 12pt;">
        <td colspan="9">&nbsp;&nbsp;&nbsp;&nbsp;Education: ${escapeHtml(qsEdu)}</td>
    </tr>
    <tr class="no-border" style="font-size: 12pt;">
        <td colspan="9">&nbsp;&nbsp;&nbsp;&nbsp;Training: ${escapeHtml(qsTrain)}</td>
    </tr>
    <tr class="no-border" style="font-size: 12pt;">
        <td colspan="9">&nbsp;&nbsp;&nbsp;&nbsp;Experience: ${escapeHtml(qsExp)}</td>
    </tr>
    <tr class="no-border" style="font-size: 12pt;">
        <td colspan="9">&nbsp;&nbsp;&nbsp;&nbsp;Eligibility: ${escapeHtml(qsElig)}</td>
    </tr>
    <tr class="no-border">
        <td colspan="9">&nbsp;</td>
    </tr>
    <tr class="bordered" style="font-size: 12pt;">
        <th rowspan="2" style="width: 3%;">No.</th>
        <th rowspan="2" style="width: 8%;">Application<br>Code</th>
        <th rowspan="2" style="width: 24%;">Education</th>
        <th colspan="2" style="width: 28%;">Training</th>
        <th colspan="2" style="width: 19%;">Experience</th>
        <th rowspan="2" style="width: 10%;">Eligibility</th>
        <th rowspan="2" style="width: 8%;">Remarks<br>(Qualified or<br>Disqualified)</th>
    </tr>
    <tr class="bordered" style="font-size: 12pt;">
        <th style="width: 24%;">Title</th>
        <th style="width: 4%;">Hours</th>
        <th style="width: 15%;">Details</th>
        <th style="width: 4%;">Years</th>
    </tr>
`;

        let count = 1;
        for (const app of applicants) {
            const [edu] = await db.query('SELECT * FROM applicant_education WHERE applicant_id = ?', [app.id]);
            const [train] = await db.query('SELECT * FROM applicant_training WHERE applicant_id = ?', [app.id]);
            const [exp] = await db.query('SELECT * FROM applicant_experience WHERE applicant_id = ?', [app.id]);
            const [elig] = await db.query('SELECT * FROM applicant_eligibility WHERE applicant_id = ?', [app.id]);

            const eduStr = edu.length ? edu.map(e => escapeHtml(e.degree)).join('<br>') : 'N/A';
            const trainTitleStr = train.length ? train.map(t => escapeHtml(t.title)).join('<br>') : 'N/A';
            const trainHoursStr = train.length ? train.map(t => escapeHtml(t.hours)).join('<br>') : '0';
            const expDetailsStr = exp.length ? exp.map(e => escapeHtml(e.details)).join('<br>') : 'N/A';
            const expYearsStr = exp.length ? exp.map(e => escapeHtml(e.years)).join('<br>') : '0';
            const eligStr = elig.length ? elig.map(e => escapeHtml(e.details) + (e.rating ? ' (' + escapeHtml(e.rating) + ')' : '')).join('<br>') : 'NONE';
            
            let remarks = app.status === 'QUALIFIED' ? 'QUALIFIED' : (app.status === 'DISQUALIFIED' ? 'DISQUALIFIED' : '');
            let textColor = remarks === 'DISQUALIFIED' ? 'color: red;' : '';

            html += `
    <tr class="bordered">
        <td>${count}</td>
        <td>${escapeHtml(app.applicationCode)}</td>
        <td>${eduStr}</td>
        <td>${trainTitleStr}</td>
        <td>${trainHoursStr}</td>
        <td>${expDetailsStr}</td>
        <td>${expYearsStr}</td>
        <td>${eligStr}</td>
        <td style="${textColor}">${escapeHtml(remarks)}</td>
    </tr>`;
            count++;
        }

        html += `
    <tr class="no-border"><td colspan="9">&nbsp;</td></tr>
    <tr class="no-border" style="font-size: 12pt;">
        <td colspan="7"></td>
        <td colspan="2" style="text-align: left;">Prepared and certified correct by:</td>
    </tr>
    <tr class="no-border"><td colspan="9">&nbsp;</td></tr>
    <tr class="no-border" style="font-size: 12pt;">
        <td colspan="7"></td>
        <td colspan="2" style="text-align: center; font-weight: bold; text-decoration: underline;">AZOR B. QUIJANO</td>
    </tr>
    <tr class="no-border" style="font-size: 12pt;">
        <td colspan="7"></td>
        <td colspan="2" style="text-align: center;">Administrative Officer IV (Personnel)</td>
    </tr>
    <tr class="no-border" style="font-size: 12pt;">
        <td colspan="7"></td>
        <td colspan="2" style="text-align: left;">Date: 05/19/2026</td>
    </tr>
    <tr class="no-border"><td colspan="9">&nbsp;</td></tr>
    <tr class="no-border">
        <td colspan="9" style="font-weight: bold;">Notes and Instructions for the HRMO:</td>
    </tr>
    <tr class="no-border">
        <td colspan="9">a) For the purpose of posting the IER, columns D to M shall be concealed in accordance with RA No. 10163 (Data Privacy Act). The only information that shall be made public are the application codes, qualifications of the applicants in terms of Education, Training, Experience, Eligibility, and Competency (if applicable), and remark on whether Qualified or Disqualified</td>
    </tr>
    <tr class="no-border">
        <td colspan="9">b) If the information does not apply to the applicant, please put N/A.</td>
    </tr>
</table>
</body>
</html>`;

        res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="IER.xls"');
        res.send(html);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating CSV');
    }
});

// Export CAR CSV
app.get('/api/export/car', async (req, res) => {
    try {
        const positionFilter = req.query.position || '';
        let baseQuery = `FROM applicants WHERE status IN ('ASSESSED', 'WAITING', 'ASSIGNED')`;
        const queryParams = [];

        if (positionFilter) {
            baseQuery += ` AND position = ?`;
            queryParams.push(positionFilter);
        }

        let posData = null;
        if (positionFilter) {
            const [posRows] = await db.query(`SELECT * FROM positions WHERE title = ? LIMIT 1`, [positionFilter]);
            if (posRows.length > 0) posData = posRows[0];
        }

        const plantillaItem = posData?.plantillaItem || '';

        const [applicants] = await db.query(`SELECT * ${baseQuery} ORDER BY assessmentTotal DESC`, queryParams);

        const escapeHtml = (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

        let html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head>
<meta charset="utf-8">
<!--[if gte mso 9]>
<xml>
 <x:ExcelWorkbook>
  <x:ExcelWorksheets>
   <x:ExcelWorksheet>
    <x:Name>CAR</x:Name>
    <x:WorksheetOptions>
     <x:Print>
      <x:ValidPrinterInfo/>
      <x:PaperSizeIndex>9</x:PaperSizeIndex>
      <x:FitWidth>1</x:FitWidth>
      <x:FitHeight>999</x:FitHeight>
     </x:Print>
     <x:FitToPage/>
    </x:WorksheetOptions>
   </x:ExcelWorksheet>
  </x:ExcelWorksheets>
 </x:ExcelWorkbook>
</xml>
<![endif]-->
<style>
  @page {
    mso-page-orientation: landscape;
    size: 297mm 210mm; /* A4 */
    margin: 0.5in;
  }
  body, table { font-family: 'Times New Roman', serif; font-size: 9pt; }
  table { border-collapse: collapse; width: 100%; page-break-inside: auto; }
  tr { page-break-inside: avoid; page-break-after: auto; }
  .no-border td, .no-border th { border: none !important; text-align: left; vertical-align: top; }
  .bordered td, .bordered th { border: 1px solid black; text-align: center; vertical-align: middle; padding: 4px; }
  .title-row td { text-align: center; font-size: 18pt; font-weight: bold; }
  .annex-row td { text-align: right; font-weight: bold; font-size: 14pt; }
  .text-bold { font-weight: bold; }
</style>
</head>
<body>
<table>
    <tr class="no-border">
        <td colspan="12"></td>
        <td colspan="4" style="text-align: right; font-weight: bold; font-size: 14pt;">Annex H</td>
    </tr>
    <tr class="no-border">
        <td colspan="16" style="text-align: center; font-size: 16pt; font-weight: bold;">COMPARATIVE ASSESSMENT RESULT (CAR)</td>
    </tr>
    <tr class="no-border" style="font-size: 12pt;">
        <td colspan="10">Position: <span style="font-weight: bold;">${escapeHtml(positionFilter)}</span></td>
        <td colspan="6" style="text-align: right;">Date: ________________________</td>
    </tr>
    <tr class="no-border" style="font-size: 12pt;">
        <td colspan="10">Office/Bureau/Service/Unit where the vacancy exists: Public Elementary and Secondary Schools in Iligan City</td>
        <td colspan="6" style="text-align: right;">Plantilla Item Number: ${escapeHtml(plantillaItem)}</td>
    </tr>
    <tr class="no-border" style="font-size: 12pt;">
        <td colspan="10"></td>
        <td colspan="6" style="text-align: right;">Date of Final Deliberation: ________________________</td>
    </tr>
    <tr class="no-border">
        <td colspan="16">&nbsp;</td>
    </tr>
    <tr class="bordered" style="font-size: 11pt;">
        <th rowspan="3" style="width: 3%;">No.</th>
        <th rowspan="3" style="width: 15%;">Application Code</th>
        <th colspan="9">COMPARATIVE ASSESSMENT RESULTS</th>
        <th rowspan="3" style="width: 8%;">Remarks</th>
        <th colspan="2" rowspan="2">For Background Investigation (Y/N)</th>
        <th rowspan="3">For Appointment<br><span style="font-size: 9pt; font-weight: normal;">(To filled out by the Appointing Officer/Authority; Please sign opposite the name of the applicant)</span></th>
        <th rowspan="3">For probation<br><span style="font-size: 9pt; font-weight: normal;">Please identify period of Probation (6 months or 1 year) if nature of appointment falls under the purview of Item 73 of DO No. 19, s. 2022</span></th>
    </tr>
    <tr class="bordered" style="font-size: 10pt;">
        <th>Education</th>
        <th>Training</th>
        <th>Experience</th>
        <th>Performance</th>
        <th>Outstanding Accomplishments</th>
        <th>Application of Education</th>
        <th>Application of L&D</th>
        <th>Potential</th>
        <th>Total</th>
    </tr>
    <tr class="bordered" style="font-size: 9pt;">
        <th>(5)</th>
        <th>(10)</th>
        <th>(15)</th>
        <th>(20)</th>
        <th>(10)</th>
        <th>(10)</th>
        <th>(10)</th>
        <th>(20)</th>
        <th>(100)</th>
        <th>Yes</th>
        <th>No</th>
    </tr>
`;

        let count = 1;
        for (const app of applicants) {
            html += `
    <tr class="bordered">
        <td>${count}</td>
        <td>${escapeHtml(app.applicationCode)}</td>
        <td>${app.scoreEducation !== null ? app.scoreEducation : '0.0'}</td>
        <td>${app.scoreTraining !== null ? app.scoreTraining : '0.0'}</td>
        <td>${app.scoreExperience !== null ? app.scoreExperience : '0.0'}</td>
        <td>${app.scorePerformance !== null ? app.scorePerformance : '0.000'}</td>
        <td>${app.scoreOutstandingAccomplishments !== null ? app.scoreOutstandingAccomplishments : '0'}</td>
        <td>${app.scoreApplicationOfEducation !== null ? app.scoreApplicationOfEducation : '0.0'}</td>
        <td>${app.scoreApplicationOfLD !== null ? app.scoreApplicationOfLD : '0'}</td>
        <td>${app.scorePotential !== null ? app.scorePotential : '0.0'}</td>
        <td>${app.assessmentTotal !== null ? Number(app.assessmentTotal).toFixed(3) : '0.000'}</td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
    </tr>`;
            count++;
        }

        html += `
    <tr class="no-border"><td colspan="16">&nbsp;</td></tr>
    <tr class="no-border">
        <td colspan="5">Prepared by the HRMPSB</td>
        <td colspan="11"></td>
    </tr>
    <tr class="no-border">
        <td colspan="5">(All members should affix signature)</td>
        <td colspan="11"></td>
    </tr>
    <tr class="no-border"><td colspan="16">&nbsp;</td></tr>
    <tr class="no-border"><td colspan="16">&nbsp;</td></tr>
    <tr class="no-border"><td colspan="16">&nbsp;</td></tr>
    <tr class="no-border">
        <td colspan="3" style="text-align: center; font-weight: bold; text-decoration: underline;">AZOR B. QUIJANO</td>
        <td colspan="3" style="text-align: center; font-weight: bold; text-decoration: underline;">ANA MALOU S. SALOMSOM</td>
        <td colspan="3" style="text-align: center; font-weight: bold; text-decoration: underline;">JOHN ANTHONY C. BALOS</td>
        <td colspan="3" style="text-align: center; font-weight: bold; text-decoration: underline;">GUILLERMO L. FUENTES</td>
        <td colspan="4" style="text-align: center; font-weight: bold; text-decoration: underline;">ROBERTO D. DECHOS, JR.</td>
    </tr>
    <tr class="no-border">
        <td colspan="3" style="text-align: center;">Administrative Officer IV<br>Personnel<br>HRMPSB Member</td>
        <td colspan="3" style="text-align: center;">Administrative Officer V<br>Budget Officer III<br>HRMPSB Member</td>
        <td colspan="3" style="text-align: center;">Accountant III<br>Finance<br>HRMPSB Member</td>
        <td colspan="3" style="text-align: center;">Public Schools District Supervisor<br>ICPSTEA President<br>HRMPSB Member</td>
        <td colspan="4" style="text-align: center;">Chief Education Supervisor<br>SGOD<br>HRMPSB Member</td>
    </tr>
    <tr class="no-border"><td colspan="16">&nbsp;</td></tr>
    <tr class="no-border"><td colspan="16">&nbsp;</td></tr>
    <tr class="no-border">
        <td colspan="8"></td>
        <td colspan="4" style="text-align: center; font-weight: bold; text-decoration: underline;">MYRA P. MEBATO, CESO VI</td>
        <td colspan="4">Appointment conferred by:</td>
    </tr>
    <tr class="no-border">
        <td colspan="8"></td>
        <td colspan="4" style="text-align: center;">Assistant Schools Division Superintendent<br>HRMPSB Chairperson</td>
        <td colspan="4" style="text-align: center; font-weight: bold; text-decoration: underline;">JONATHAN S. DELA PEÑA, PhD, CESO V</td>
    </tr>
    <tr class="no-border">
        <td colspan="12"></td>
        <td colspan="4" style="text-align: center;">Schools Division Superintendent<br>Appointing Authority</td>
    </tr>
    <tr class="no-border"><td colspan="16">&nbsp;</td></tr>
    <tr class="no-border">
        <td colspan="16" style="font-weight: bold;">Notes and Instructions for the HRMO:</td>
    </tr>
    <tr class="no-border">
        <td colspan="16">a) For the purpose of posting the CAR, Column C (Name of the applicant) and Columns N to R (Remarks to Probation status) shall be concealed in accordance with RA No. 10163 (Data Privacy Act). The only information that shall be made public are the Application Code, Comparative Assessment Results (Component from Education to Potential) and the total scores of the applicants.</td>
    </tr>
    <tr class="no-border">
        <td colspan="16">b) If the information does not apply to the applicant, please put N/A.</td>
    </tr>
    <tr class="no-border">
        <td colspan="16">c) Applicants who failed to appear in any phase of the Open Ranking process and other evaluative assessments, and/or have withdrawn their application shall be provided with a notation beside the application code (e.g., withdrawn application, etc.)</td>
    </tr>
</table>
</body>
</html>`;

        res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="CAR.xls"');
        res.send(html);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating CAR CSV');
    }
});

// Delete Eligibility
app.delete('/api/eligibility/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM applicant_eligibility WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get Full Details for Modals
app.get('/api/applicants/:id/details', async (req, res) => {
    try {
        const { id } = req.params;
        const [appRow] = await db.query("SELECT *, CONCAT(firstName, ' ', lastName) AS name FROM applicants WHERE id = ?", [id]);
        if (!appRow.length) return res.status(404).json({ error: 'Not found' });
        
        const applicant = appRow[0];
        const [edu] = await db.query('SELECT * FROM applicant_education WHERE applicant_id = ?', [id]);
        const [train] = await db.query('SELECT * FROM applicant_training WHERE applicant_id = ?', [id]);
        const [exp] = await db.query('SELECT * FROM applicant_experience WHERE applicant_id = ?', [id]);
        const [elig] = await db.query('SELECT * FROM applicant_eligibility WHERE applicant_id = ?', [id]);
        
        // Fetch the position's qualification standards
        const [posRow] = await db.query('SELECT * FROM positions WHERE title = ? LIMIT 1', [applicant.position]);
        const positionStandards = posRow.length > 0 ? posRow[0] : null;

        applicant.scores = {
            education: applicant.scoreEducation,
            training: applicant.scoreTraining,
            experience: applicant.scoreExperience,
            performance: applicant.scorePerformance,
            outstandingAccomplishments: applicant.scoreOutstandingAccomplishments,
            applicationOfEducation: applicant.scoreApplicationOfEducation,
            applicationOfLD: applicant.scoreApplicationOfLD,
            potential: applicant.scorePotential,
            total: applicant.assessmentTotal
        };

        res.json({
            applicant: applicant,
            education: edu,
            training: train,
            experience: exp,
            eligibility: elig,
            positionStandards: positionStandards
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Document Status
app.put('/api/applicants/:id/:type/:docId/status', async (req, res) => {
    try {
        const { id, type, docId } = req.params;
        const { status } = req.body;
        
        const validTypes = {
            'education': 'applicant_education',
            'training': 'applicant_training',
            'experience': 'applicant_experience',
            'eligibility': 'applicant_eligibility'
        };
        
        if (!validTypes[type]) return res.status(400).json({ error: 'Invalid document type' });
        if (!['PENDING', 'QUALIFIED', 'DISQUALIFIED'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
        
        const tableName = validTypes[type];
        await db.query(`UPDATE ${tableName} SET status = ? WHERE id = ? AND applicant_id = ?`, [status, docId, id]);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start Server
async function startServer() {
    try {
        await ensureRequirementColumns();
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to initialize requirement columns:', error.message);
        process.exit(1);
    }
}

startServer();
