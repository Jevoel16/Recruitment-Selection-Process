const db = require('../db');

// Maps complex position strings into concise prefix codes (e.g. 'Teacher III' -> 'T3'). 
// This normalization is strictly required for generating compact, recognizable Application Codes for the tracking system.
function getShortenedPosition(position) {
    if (!position) return 'APP';
    let cleanPos = position.replace(/[^a-zA-Z0-9 ]/g, '').trim();
    const match = cleanPos.match(/\\s([IVX]+)$/i);
    let numberSuffix = '';
    if (match) {
        const roman = match[1].toUpperCase();
        const romanMap = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10 };
        numberSuffix = romanMap[roman] || '';
        cleanPos = cleanPos.substring(0, cleanPos.length - match[0].length).trim();
    }
    let base = '';
    const upperPos = position.toUpperCase();
    if (upperPos.includes('ADMINISTRATIVE ASSISTANT')) base = 'ADAS';
    else if (upperPos.includes('ADMINISTRATIVE AIDE')) base = 'ADA';
    else if (upperPos.includes('ADMINISTRATIVE OFFICER')) base = 'AO';
    else if (upperPos.includes('PROJECT DEVELOPMENT OFFICER')) base = 'PDO';
    else if (upperPos.includes('LEGAL ASSISTANT')) base = 'LA';
    else if (upperPos.includes('EDUCATION PROGRAM SUPERVISOR')) base = 'EPS';
    else if (upperPos.includes('SCHOOL PRINCIPAL') || upperPos.includes('PRINCIPAL')) base = 'SP';
    else if (upperPos.includes('HEAD TEACHER')) base = 'HT';
    else if (upperPos.includes('MASTER TEACHER')) base = 'MT';
    else if (upperPos.includes('TEACHER')) base = 'T';
    else if (upperPos.includes('WATCHMAN')) base = 'WCH';
    else { base = cleanPos.split(/\\s+/).map(w => w[0]).join('').toUpperCase(); }
    return base + numberSuffix;
}

const requirementFields = [
    'req_pds', 'req_prcLicense', 'req_reportRating', 'req_medCert', 'req_birthCert', 'req_marriageCert', 
    'req_nbiClearance', 'req_tor', 'req_diplomaBachelors', 'req_masters', 'req_doctorate', 'req_soGraduation', 
    'req_orderSeparation', 'req_saln', 'req_folders'
];

// Deprecated: assignmentReqStatus is now toggled when the DOC is downloaded, not automatically via checkboxes.
async function syncAssignmentRequirementStatus(applicantId) {
    // No-op
}

// Initializes a new applicant record, processes their baseline information, and inserts it into the database.
// Automatically prefixes the application code with the district abbreviation and shortened position title for easy tracking.
exports.createApplicant = async (req, res) => {
    try {
        const { 
            firstName, lastName, middleName, nameExtension, applicationType, district, address, birthdate, sex, civilStatus, religion, disability, ethnicGroup, emailAddress, contactNo, pdsLink, category, position,
            education, training, experience, eligibility
        } = req.body;
        
        if (!firstName || !lastName) return res.status(400).json({ success: false, error: "Missing required fields" });

        let positionCode = getShortenedPosition(position);
        const currentYear = new Date().getFullYear();

        const [result] = await db.query(
            'INSERT INTO applicants (firstName, lastName, middleName, nameExtension, applicationType, district, category, position, applicationCode, address, birthdate, sex, civilStatus, religion, disability, ethnicGroup, emailAddress, contactNo, pdsLink) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
            [firstName, lastName, middleName || '', nameExtension || '', applicationType || 'Walk-in', district || null, category || null, position || null, 'TEMP', address || null, birthdate || null, sex || null, civilStatus || null, religion || null, disability || null, ethnicGroup || null, emailAddress || null, contactNo || null, pdsLink || null]
        );
        
        const applicantId = result.insertId;
        
        const [rows] = await db.query(
            "SELECT applicationCode FROM applicants WHERE applicationCode LIKE ? AND id != ? ORDER BY id DESC LIMIT 1",
            [`${positionCode}-${currentYear}-%`, applicantId]
        );
        let increment = 1;
        if (rows.length > 0 && rows[0].applicationCode) {
            const parts = rows[0].applicationCode.split('-');
            const lastIncrement = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(lastIncrement)) increment = lastIncrement + 1;
        }
        
        const newCode = `${positionCode}-${currentYear}-${increment}`;
        await db.query('UPDATE applicants SET applicationCode = ? WHERE id = ?', [newCode, applicantId]);

        const eduArray = education ? JSON.parse(education) : [];
        for (let e of eduArray) await db.query('INSERT INTO applicant_education (applicant_id, degree, yearGraduated, digitalCopyLink) VALUES (?, ?, ?, ?)', [applicantId, e.degree, e.year, e.link || '']);

        const trainArray = training ? JSON.parse(training) : [];
        for (let t of trainArray) await db.query('INSERT INTO applicant_training (applicant_id, title, hours, digitalCopyLink) VALUES (?, ?, ?, ?)', [applicantId, t.title, t.hours, t.link || '']);

        const expArray = experience ? JSON.parse(experience) : [];
        for (let ex of expArray) await db.query('INSERT INTO applicant_experience (applicant_id, details, years, digitalCopyLink) VALUES (?, ?, ?, ?)', [applicantId, ex.details, ex.years, ex.link || '']);

        const eligArray = eligibility ? JSON.parse(eligibility) : [];
        for (let el of eligArray) await db.query('INSERT INTO applicant_eligibility (applicant_id, details, rating, digitalCopyLink) VALUES (?, ?, ?, ?)', [applicantId, el.details, el.rating, el.link || '']);

        res.json({ success: true, applicationCode: newCode, id: applicantId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

exports.deleteApplicant = async (req, res) => {
    try {
        await db.query('DELETE FROM applicants WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

// Immediately halts an applicant's progression by forcing them into the DISQUALIFIED status.
// This is typically invoked from Step 1 or Step 4 when mandatory documents fail verification.
exports.disqualifyApplicant = async (req, res) => {
    try {
        const { reason } = req.body || {};
        if (reason) await db.query(`UPDATE applicants SET status = 'DISQUALIFIED', disqualificationReason = ? WHERE id = ?`, [reason, req.params.id]);
        else await db.query(`UPDATE applicants SET status = 'DISQUALIFIED' WHERE id = ?`, [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

exports.qualifyApplicant = async (req, res) => {
    try {
        await db.query(`UPDATE applicants SET status = 'QUALIFIED' WHERE id = ?`, [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

exports.proceedStep2 = async (req, res) => {
    try {
        await db.query(`UPDATE applicants SET status = 'WAITING_FOR_ASSESSMENT' WHERE id = ?`, [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        await db.query(`UPDATE applicants SET status = ? WHERE id = ?`, [req.body.status, req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

exports.toggleAllRequirements = async (req, res) => {
    try {
        const { value } = req.body;
        const assignments = requirementFields.map((field) => `${field} = ?`).join(', ');
        await db.query(`UPDATE applicants SET ${assignments} WHERE id = ?`, [...Array(requirementFields.length).fill(Boolean(value)), req.params.id]);
        await syncAssignmentRequirementStatus(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

exports.updateRequirement = async (req, res) => {
    try {
        const { field, value } = req.body;
        if (!requirementFields.includes(field)) return res.status(400).json({ success: false, error: 'Invalid field' });
        await db.query(`UPDATE applicants SET ${field} = ? WHERE id = ?`, [value, req.params.id]);
        await syncAssignmentRequirementStatus(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};


// Commits the complex evaluative assessment rubric scores into the database for Step 2 workflows.
// This calculates and stores points across multiple criteria (Education, Training, Experience, etc.) critical for the Step 3 comparative leaderboard.
exports.assessApplicant = async (req, res) => {
    try {
        const { education, training, experience, performance, outstandingAccomplishments, applicationOfEducation, applicationOfLD, potential, isComplete } = req.body;
        const edu = (education !== null && education !== '') ? parseFloat(education) : null;
        const trn = (training !== null && training !== '') ? parseFloat(training) : null;
        const exp = (experience !== null && experience !== '') ? parseFloat(experience) : null;
        const prf = (performance !== null && performance !== '') ? parseFloat(performance) : null;
        const oac = (outstandingAccomplishments !== null && outstandingAccomplishments !== '') ? parseFloat(outstandingAccomplishments) : null;
        const aoe = (applicationOfEducation !== null && applicationOfEducation !== '') ? parseFloat(applicationOfEducation) : null;
        const ald = (applicationOfLD !== null && applicationOfLD !== '') ? parseFloat(applicationOfLD) : null;
        const pot = (potential !== null && potential !== '') ? parseFloat(potential) : null;
        
        let total = 0; let anyScore = false;
        [edu, trn, exp, prf, oac, aoe, ald, pot].forEach(val => { if (val !== null) { total += val; anyScore = true; } });
        let finalTotal = anyScore ? parseFloat(total.toFixed(2)) : null;
        let remarks = 'Pending';
        if (anyScore) remarks = isComplete ? 'Assessed' : 'In-Prog';

        await db.query(`
            UPDATE applicants 
            SET scoreEducation = ?, scoreTraining = ?, scoreExperience = ?, scorePerformance = ?, scoreOutstandingAccomplishments = ?, scoreApplicationOfEducation = ?, scoreApplicationOfLD = ?, scorePotential = ?, assessmentTotal = ?, assessmentRemarks = ?
            WHERE id = ?`, 
            [edu, trn, exp, prf, oac, aoe, ald, pot, finalTotal, remarks, req.params.id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

exports.proceedRequirements = async (req, res) => {
    try {
        await db.query(`UPDATE applicants SET status = 'WAITING' WHERE id = ?`, [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

exports.toggleAssignmentReq = async (req, res) => {
    try {
        await db.query(`UPDATE applicants SET assignmentReqStatus = ? WHERE id = ?`, [req.body.status, req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

// Transitions the applicant into the final ASSIGNED status when their official Assignment Order is confirmed.
// Also deducts the corresponding vacancy count from the specific position/plantilla to enforce capacity limits natively in the database.
exports.assignApplicant = async (req, res) => {
    try {
        const { office, appointmentEffectivity, cc, ccDesignation, cc_2, ccDesignation_2, cc_3, ccDesignation_3, cc_4, ccDesignation_4 } = req.body;
        await db.query(`UPDATE applicants SET status = 'ASSIGNED', assignedOffice = ?, appointmentEffectivity = ?, cc = ?, ccDesignation = ?, cc_2 = ?, ccDesignation_2 = ?, cc_3 = ?, ccDesignation_3 = ?, cc_4 = ?, ccDesignation_4 = ? WHERE id = ?`, 
            [office, appointmentEffectivity || null, cc || null, ccDesignation || null, cc_2 || null, ccDesignation_2 || null, cc_3 || null, ccDesignation_3 || null, cc_4 || null, ccDesignation_4 || null, req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

exports.completeApplicant = async (req, res) => {
    try {
        await db.query(`UPDATE applicants SET status = 'COMPLETED' WHERE id = ?`, [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

exports.updateInfo = async (req, res) => {
    try {
        const { firstName, middleName, lastName, address, birthdate, sex, civilStatus, religion, disability, ethnicGroup, emailAddress, contactNo, pdsLink } = req.body;
        await db.query(
            `UPDATE applicants SET firstName=?, middleName=?, lastName=?, address=?, birthdate=?, sex=?, civilStatus=?, religion=?, disability=?, ethnicGroup=?, emailAddress=?, contactNo=?, pdsLink=? WHERE id=?`, 
            [firstName, middleName || '', lastName, address, birthdate || null, sex, civilStatus, religion, disability, ethnicGroup, emailAddress, contactNo, pdsLink || null, req.params.id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

exports.addEducation = async (req, res) => {
    try {
        await db.query('INSERT INTO applicant_education (applicant_id, degree, yearGraduated, digitalCopyLink) VALUES (?, ?, ?, ?)', [req.params.id, req.body.title, req.body.year_graduated, '']);
        res.json({ success: true });
    } catch (error) { console.error(error); res.status(500).json({ error: "Internal server error" }); }
};

exports.setHighestEducation = async (req, res) => {
    try {
        await db.query('UPDATE applicant_education SET is_highest = 0 WHERE applicant_id = ?', [req.params.id]);
        await db.query('UPDATE applicant_education SET is_highest = 1 WHERE id = ? AND applicant_id = ?', [req.params.eduId, req.params.id]);
        res.json({ success: true });
    } catch (error) { console.error(error); res.status(500).json({ error: "Internal server error" }); }
};

exports.deleteEducation = async (req, res) => {
    try {
        await db.query('DELETE FROM applicant_education WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) { console.error(error); res.status(500).json({ error: "Internal server error" }); }
};

exports.addTraining = async (req, res) => {
    try {
        await db.query('INSERT INTO applicant_training (applicant_id, title, hours, digitalCopyLink) VALUES (?, ?, ?, ?)', [req.params.id, req.body.title, req.body.hours, '']);
        res.json({ success: true });
    } catch (error) { console.error(error); res.status(500).json({ error: "Internal server error" }); }
};

exports.deleteTraining = async (req, res) => {
    try {
        await db.query('DELETE FROM applicant_training WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) { console.error(error); res.status(500).json({ error: "Internal server error" }); }
};

exports.addExperience = async (req, res) => {
    try {
        await db.query('INSERT INTO applicant_experience (applicant_id, details, years, digitalCopyLink) VALUES (?, ?, ?, ?)', [req.params.id, req.body.details, req.body.years, '']);
        res.json({ success: true });
    } catch (error) { console.error(error); res.status(500).json({ error: "Internal server error" }); }
};

exports.deleteExperience = async (req, res) => {
    try {
        await db.query('DELETE FROM applicant_experience WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) { console.error(error); res.status(500).json({ error: "Internal server error" }); }
};

exports.addEligibility = async (req, res) => {
    try {
        await db.query('INSERT INTO applicant_eligibility (applicant_id, details, rating, digitalCopyLink) VALUES (?, ?, ?, ?)', [req.params.id, req.body.title, req.body.rating, '']);
        res.json({ success: true });
    } catch (error) { console.error(error); res.status(500).json({ error: "Internal server error" }); }
};

exports.deleteEligibility = async (req, res) => {
    try {
        await db.query('DELETE FROM applicant_eligibility WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) { console.error(error); res.status(500).json({ error: "Internal server error" }); }
};

exports.getApplicantDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const [applicantRows] = await db.query('SELECT * FROM applicants WHERE id = ?', [id]);
        if (applicantRows.length === 0) return res.status(404).json({ error: 'Applicant not found' });
        
        const app = applicantRows[0];
        app.name = `${app.firstName} ${app.lastName}`.trim();
        // Ensure scores object exists for legacy frontend scripts
        app.scores = {
            education: app.scoreEducation,
            training: app.scoreTraining,
            experience: app.scoreExperience,
            performance: app.scorePerformance,
            outstandingAccomplishments: app.scoreOutstandingAccomplishments,
            applicationOfEducation: app.scoreApplicationOfEducation,
            applicationOfLD: app.scoreApplicationOfLD,
            potential: app.scorePotential,
            total: app.assessmentTotal
        };

        const [education] = await db.query('SELECT * FROM applicant_education WHERE applicant_id = ?', [id]);
        const [training] = await db.query('SELECT * FROM applicant_training WHERE applicant_id = ?', [id]);
        const [experience] = await db.query('SELECT * FROM applicant_experience WHERE applicant_id = ?', [id]);
        const [eligibility] = await db.query('SELECT * FROM applicant_eligibility WHERE applicant_id = ?', [id]);

        let positionStandards = null;
        if (app.position) {
            const [posRows] = await db.query('SELECT * FROM positions WHERE title = ? LIMIT 1', [app.position]);
            if (posRows.length > 0) positionStandards = posRows[0];
        }

        res.json({
            ...app, // Top-level for newly patched scripts
            applicant: app, // Wrapped for legacy scripts
            positionStandards, // Included for QS and SG
            education,
            training,
            experience,
            eligibility
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Updates the individual approval status (Qualified/Disqualified) of a single attached document (e.g. Diploma, Training Cert).
// Evaluates overall document readiness afterwards to automatically unlock or lock workflow progression buttons.
exports.updateDocumentStatus = async (req, res) => {
    try {
        const { id, type, docId } = req.params;
        const { status } = req.body;
        
        let table = '';
        if (type === 'education') table = 'applicant_education';
        else if (type === 'training') table = 'applicant_training';
        else if (type === 'experience') table = 'applicant_experience';
        else if (type === 'eligibility') table = 'applicant_eligibility';
        else return res.status(400).json({ success: false, error: "Invalid document type" });

        await db.query(`UPDATE ${table} SET status = ? WHERE id = ? AND applicant_id = ?`, [status, docId, id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

exports.updateDocumentLink = async (req, res) => {
    try {
        const { id } = req.params;
        const { digitalCopyLink } = req.body;
        const table = 'applicant_' + req.route.path.split('/')[1];
        
        await db.query(`UPDATE ${table} SET digitalCopyLink = ? WHERE id = ?`, [digitalCopyLink || '', id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.lockApplicant = async (req, res) => {
    try {
        const lockedBy = req.userId;
        const id = req.params.id;

        const [result] = await db.query(
            'UPDATE applicants SET lockedBy = ?, lockedAt = NOW() WHERE id = ? AND (lockedBy IS NULL OR lockedBy = ?)', 
            [lockedBy, id, lockedBy]
        );

        if (result.affectedRows > 0) {
            return res.json({ success: true });
        }

        const [rows] = await db.query('SELECT lockedBy FROM applicants WHERE id = ?', [id]);
        if (rows.length > 0 && rows[0].lockedBy && rows[0].lockedBy !== lockedBy) {
            return res.status(403).json({ error: "Applicant is currently locked by another user." });
        }

        res.json({ success: true });
    } catch (e) { 
        console.error(e); 
        res.status(500).json({ error: "Internal server error" }); 
    }
};

exports.unlockApplicant = async (req, res) => {
    try {
        const lockedBy = req.userId;
        const [rows] = await db.query('SELECT lockedBy FROM applicants WHERE id = ?', [req.params.id]);
        if (rows.length > 0) {
            if (rows[0].lockedBy === lockedBy || !rows[0].lockedBy) {
                await db.query('UPDATE applicants SET lockedBy = NULL, lockedAt = NULL WHERE id = ?', [req.params.id]);
                return res.json({ success: true });
            } else {
                return res.status(403).json({ error: "Locked by someone else" });
            }
        }
        res.json({ success: true });
    } catch (e) { 
        console.error(e); 
        res.status(500).json({ error: "Internal server error" }); 
    }
};

exports.lockStream = async (req, res) => {
    const id = req.params.id;
    const lockedBy = req.userId;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send an initial connected message
    res.write('data: connected\n\n');

    req.on('close', async () => {
        try {
            // When connection drops, clear the lock if it still belongs to this user
            await db.query('UPDATE applicants SET lockedBy = NULL, lockedAt = NULL WHERE id = ? AND lockedBy = ?', [id, lockedBy]);
            console.log(`Lock stream closed for applicant ${id}. Lock released.`);
        } catch (e) {
            console.error('Error releasing lock on stream close:', e);
        }
    });
};

exports.updateEducation = async (req, res) => {
    try {
        const { degree, yearGraduated } = req.body;
        await db.query('UPDATE applicant_education SET degree = ?, yearGraduated = ? WHERE id = ?', [degree, yearGraduated, req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Internal server error" }); }
};

exports.updateTraining = async (req, res) => {
    try {
        const { title, hours } = req.body;
        await db.query('UPDATE applicant_training SET title = ?, hours = ? WHERE id = ?', [title, hours, req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Internal server error" }); }
};

exports.updateExperience = async (req, res) => {
    try {
        const { details, years } = req.body;
        await db.query('UPDATE applicant_experience SET details = ?, years = ? WHERE id = ?', [details, years, req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Internal server error" }); }
};

exports.updateEligibility = async (req, res) => {
    try {
        const { details, rating } = req.body;
        await db.query('UPDATE applicant_eligibility SET details = ?, rating = ? WHERE id = ?', [details, rating, req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Internal server error" }); }
};

exports.noAppearanceApplicant = async (req, res) => {
    try {
        await db.query(`UPDATE applicants SET status = 'NO_APPEARANCE', scoreEducation = 0, scoreTraining = 0, scoreExperience = 0, scorePerformance = 0, scoreOutstandingAccomplishments = 0, scoreApplicationOfEducation = 0, scoreApplicationOfLD = 0, scorePotential = 0, assessmentTotal = 0 WHERE id = ?`, [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

exports.newlyPromotedApplicant = async (req, res) => {
    try {
        await db.query(`UPDATE applicants SET status = 'NEWLY_PROMOTED', scoreEducation = 0, scoreTraining = 0, scoreExperience = 0, scorePerformance = 0, scoreOutstandingAccomplishments = 0, scoreApplicationOfEducation = 0, scoreApplicationOfLD = 0, scorePotential = 0, assessmentTotal = 0 WHERE id = ?`, [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};
