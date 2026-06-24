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

app.get('/', (req, res) => res.redirect('/step1/1'));

app.get('/:step', (req, res) => res.redirect(`/${req.params.step}/1`));

app.get('/:step/:page', async (req, res, next) => {
    const { step } = req.params;
    
    const stepsConfig = {
        'step1': {
            conditions: "status IN ('PENDING', 'QUALIFIED', 'DISQUALIFIED')",
            orderBy: "createdAt ASC"
        },
        'step2': {
            conditions: "status = 'WAITING_FOR_ASSESSMENT'",
            orderBy: "interviewDate ASC"
        },
        'step3': {
            conditions: "status = 'ASSESSED'",
            orderBy: "interviewScore DESC"
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

    try {
        const [countResult] = await db.query(`SELECT COUNT(*) AS total ${baseQuery}`, queryParams);
        const totalRecords = countResult[0].total;
        const totalPages = Math.ceil(totalRecords / limit) || 1;

        const [rows] = await db.query(`SELECT *, CONCAT(firstName, ' ', lastName) AS name ${baseQuery} ORDER BY ${config.orderBy} LIMIT ? OFFSET ?`, [...queryParams, limit, offset]);

        const pagination = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
                pagination.push({
                    page: i,
                    isCurrent: i === page,
                    url: `/${step}/${i}${searchQuery ? '?q=' + encodeURIComponent(searchQuery) : ''}`
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
            [step]: rows,
            searchQuery,
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
        const { firstName, lastName, district, category } = req.body;
        
        // Find highest increment for this district & category
        const prefix = `${district}-${category}-`;
        const [rows] = await db.query(
            "SELECT applicationCode FROM applicants WHERE applicationCode LIKE ?", 
            [`${prefix}%`]
        );
        
        let maxIncrement = 0;
        rows.forEach(row => {
            if (row.applicationCode) {
                const parts = row.applicationCode.split('-');
                if (parts.length === 3) {
                    const num = parseInt(parts[2], 10);
                    if (!isNaN(num) && num > maxIncrement) {
                        maxIncrement = num;
                    }
                }
            }
        });
        
        const newCode = `${prefix}${maxIncrement + 1}`;
        
        await db.query(
            'INSERT INTO applicants (firstName, lastName, district, category, applicationCode) VALUES (?, ?, ?, ?, ?)', 
            [firstName, lastName, district, category, newCode]
        );
        res.json({ success: true, applicationCode: newCode });
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
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Qualify Applicant
app.post('/api/applicants/:id/qualify', async (req, res) => {
    try {
        const { id } = req.params;
        const { interviewDate } = req.body;
        await db.query(`UPDATE applicants SET status = 'WAITING_FOR_ASSESSMENT', interviewDate = ? WHERE id = ?`, [interviewDate, id]);
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
        const { score } = req.body;
        await db.query(`UPDATE applicants SET interviewScore = ?, status = 'ASSESSED' WHERE id = ?`, [score, id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Proceed to Requirements (Step 3 -> Step 4)
app.post('/api/applicants/:id/proceed-requirements', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query(`UPDATE applicants SET status = 'WAITING' WHERE id = ?`, [id]);
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
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update Personal Info
app.put('/api/applicants/:id/info', async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, address, age, sex, civilStatus, religion, disability, ethnicGroup, emailAddress, contactNo } = req.body;
        await db.query(
            `UPDATE applicants SET firstName=?, lastName=?, address=?, age=?, sex=?, civilStatus=?, religion=?, disability=?, ethnicGroup=?, emailAddress=?, contactNo=? WHERE id=?`, 
            [firstName, lastName, address, age || null, sex, civilStatus, religion, disability, ethnicGroup, emailAddress, contactNo, id]
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
        const { link } = req.body;
        await db.query('INSERT INTO applicant_education (applicant_id, digitalCopyLink) VALUES (?, ?)', [id, link]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
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
    try {
        const { id } = req.params;
        const { title, hours } = req.body;
        await db.query('INSERT INTO applicant_training (applicant_id, title, hours) VALUES (?, ?, ?)', [id, title, hours]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Delete Training
app.delete('/api/training/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM applicant_training WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Add Experience
app.post('/api/applicants/:id/experience', async (req, res) => {
    try {
        const { id } = req.params;
        const { details, years } = req.body;
        await db.query('INSERT INTO applicant_experience (applicant_id, details, years) VALUES (?, ?, ?)', [id, details, years]);
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
        const { link } = req.body;
        await db.query('INSERT INTO applicant_eligibility (applicant_id, digitalCopyLink) VALUES (?, ?)', [id, link]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
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
        
        const [edu] = await db.query('SELECT * FROM applicant_education WHERE applicant_id = ?', [id]);
        const [train] = await db.query('SELECT * FROM applicant_training WHERE applicant_id = ?', [id]);
        const [exp] = await db.query('SELECT * FROM applicant_experience WHERE applicant_id = ?', [id]);
        const [elig] = await db.query('SELECT * FROM applicant_eligibility WHERE applicant_id = ?', [id]);
        
        res.json({
            applicant: appRow[0],
            education: edu,
            training: train,
            experience: exp,
            eligibility: elig
        });
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
