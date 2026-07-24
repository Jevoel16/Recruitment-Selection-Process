const db = require('../db');
const { generatePDFForApplicant } = require('../utils/pdfGenerator');
const pdfEvents = require('../utils/pdfEvents');

// Helper for Optimistic Locking
async function updateVersion(req, res, id) {
    if (req.method !== 'POST' && req.method !== 'PUT') return true;
    const clientVersion = req.body.version;
    if (!clientVersion) return true; // fallback for non-optimistic calls
    
    const [rows] = await db.query('SELECT version FROM applicants WHERE id = ?', [id]);
    if (!rows.length) {
        res.status(404).json({ error: 'Applicant not found' });
        return false;
    }
    
    const dbVersion = rows[0].version || 1;
    if (parseInt(clientVersion) !== dbVersion) {
        res.status(409).json({ error: 'Conflict: The record was updated by another user. Please refresh.' });
        return false;
    }
    
    await db.query('UPDATE applicants SET version = version + 1 WHERE id = ?', [id]);
    return true;
}

// Maps complex position strings into concise prefix codes (e.g. 'Teacher III' -> 'T3'). 
// This normalization is strictly required for generating compact, recognizable Application Codes for the tracking system.
function getShortenedPosition(position) {
    if (!position) return 'APP';
    let cleanPos = position.replace(/[^a-zA-Z0-9 ]/g, '').trim();
    const match = cleanPos.match(/\s([IVX]+)$/i);
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



// Initializes a new applicant record, processes their baseline information, and inserts it into the database.
// Automatically prefixes the application code with the district abbreviation and shortened position title for easy tracking.
exports.createApplicant = async (req, res) => {
    try {
        const { 
            firstName, lastName, middleName, nameExtension, applicationType, district, address, birthdate, sex, civilStatus, religion, disability, ethnicGroup, emailAddress, contactNo, pdsLink, category, position, vacancyAnnouncementNo,
            education, training, experience, eligibility
        } = req.body;
        
        if (!firstName || !lastName) return res.status(400).json({ success: false, error: "Missing required fields" });

        let positionCode = getShortenedPosition(position);
        const currentYear = new Date().getFullYear();

        const [result] = await db.query(
            'INSERT INTO applicants (firstName, lastName, middleName, nameExtension, applicationType, district, category, position, vacancyAnnouncementNo, applicationCode, address, birthdate, sex, civilStatus, religion, disability, ethnicGroup, emailAddress, contactNo, pdsLink) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
            [firstName, lastName, middleName || '', nameExtension || '', applicationType || 'Walk-in', district || null, category || null, position || null, vacancyAnnouncementNo || null, 'TEMP', address || null, birthdate || null, sex || null, civilStatus || null, religion || null, disability || null, ethnicGroup || null, emailAddress || null, contactNo || null, pdsLink || null]
        );
        
        const applicantId = result.insertId;
        
        const vacNoStr = vacancyAnnouncementNo ? String(vacancyAnnouncementNo).padStart(3, '0') : '000';
        
        const [rows] = await db.query(
            "SELECT applicationCode FROM applicants WHERE applicationCode LIKE ? AND id != ? ORDER BY id DESC LIMIT 1",
            [`${positionCode}-${vacNoStr}-${currentYear}-%`, applicantId]
        );
        let increment = 1;
        if (rows.length > 0 && rows[0].applicationCode) {
            const parts = rows[0].applicationCode.split('-');
            const lastIncrement = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(lastIncrement)) increment = lastIncrement + 1;
        }
        
        const incrementStr = String(increment).padStart(4, '0');
        const newCode = `${positionCode}-${vacNoStr}-${currentYear}-${incrementStr}`;
        await db.query('UPDATE applicants SET applicationCode = ? WHERE id = ?', [newCode, applicantId]);

        const eduArray = education ? JSON.parse(education) : [];
        for (let e of eduArray) await db.query('INSERT INTO applicant_education (applicant_id, degree, yearGraduated, digitalCopyLink) VALUES (?, ?, ?, ?)', [applicantId, e.degree, e.year, e.link || '']);

        const trainArray = training ? JSON.parse(training) : [];
        for (let t of trainArray) await db.query('INSERT INTO applicant_training (applicant_id, title, hours, digitalCopyLink) VALUES (?, ?, ?, ?)', [applicantId, t.title, t.hours, t.link || '']);

        const expArray = experience ? JSON.parse(experience) : [];
        for (let ex of expArray) await db.query('INSERT INTO applicant_experience (applicant_id, details, years, months, digitalCopyLink) VALUES (?, ?, ?, ?, ?)', [applicantId, ex.details, ex.years, ex.months || 0, ex.link || '']);

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
        if (!(await updateVersion(req, res, req.params.id))) return;

        const { reason } = req.body || {};
        if (reason) await db.query(`UPDATE applicants SET status = 'DISQUALIFIED', disqualificationReason = ? WHERE id = ?`, [reason, req.params.id]);
        else await db.query(`UPDATE applicants SET status = 'DISQUALIFIED' WHERE id = ?`, [req.params.id]);
        
        db.query('SELECT * FROM applicants WHERE id = ?', [req.params.id]).then(async ([apps]) => {
            if (apps && apps.length > 0) {
                const app = apps[0];
                const isHigherTeaching = [
                    'TEACHER II', 'TEACHER III', 'TEACHER IV', 'TEACHER V', 'TEACHER VI', 'TEACHER VII',
                    'MASTER TEACHER I', 'MASTER TEACHER II', 'MASTER TEACHER III', 'MASTER TEACHER IV', 'MASTER TEACHER V'
                ].includes(String(app.position || '').toUpperCase());
                
                const targetTmpl = isHigherTeaching ? 'Notice to DQ - Higher Teaching' : 'Notice to DQ';
                let generated = 0, failed = 0;
                
                try {
                    await generatePDFForApplicant(app, targetTmpl);
                    console.log(`[Auto-PDF] Generated "${targetTmpl}" for applicant ${app.id}`);
                    generated++;
                } catch (err) {
                    console.error(`[Auto-PDF] Failed "${targetTmpl}" for applicant ${app.id}:`, err.message);
                    failed++;
                }
                
                pdfEvents.emit('pdf-done', { applicantId: app.id, name: `${app.firstName} ${app.lastName}`, status: 'DISQUALIFIED', generated, failed, total: 1 });
            }
        }).catch(err => console.error("DB error:", err));

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

exports.qualifyApplicant = async (req, res) => {
    try {
        if (!(await updateVersion(req, res, req.params.id))) return;

        await db.query(`UPDATE applicants SET status = 'QUALIFIED' WHERE id = ?`, [req.params.id]);
        
        db.query('SELECT * FROM applicants WHERE id = ?', [req.params.id]).then(async ([apps]) => {
            if (apps && apps.length > 0) {
                const app = apps[0];
                const isHigherTeaching = [
                    'TEACHER II', 'TEACHER III', 'TEACHER IV', 'TEACHER V', 'TEACHER VI', 'TEACHER VII',
                    'MASTER TEACHER I', 'MASTER TEACHER II', 'MASTER TEACHER III', 'MASTER TEACHER IV', 'MASTER TEACHER V'
                ].includes(String(app.position || '').toUpperCase());
                
                const targetTmpl = isHigherTeaching ? 'Notice to Qualified - Higher Teaching' : 'Notice to Qualified - Without Date of Assessment';
                let generated = 0, failed = 0;
                
                try {
                    await generatePDFForApplicant(app, targetTmpl);
                    console.log(`[Auto-PDF] Generated "${targetTmpl}" for applicant ${app.id}`);
                    generated++;
                } catch (err) {
                    console.error(`[Auto-PDF] Failed "${targetTmpl}" for applicant ${app.id}:`, err.message);
                    failed++;
                }
                
                pdfEvents.emit('pdf-done', { applicantId: app.id, name: `${app.firstName} ${app.lastName}`, status: 'QUALIFIED', generated, failed, total: 1 });
            }
        }).catch(err => console.error("DB error:", err));

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

exports.proceedStep2 = async (req, res) => {
    try {
        if (!(await updateVersion(req, res, req.params.id))) return;

        await db.query(`UPDATE applicants SET status = 'WAITING_FOR_ASSESSMENT' WHERE id = ?`, [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        if (!(await updateVersion(req, res, req.params.id))) return;

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
        if (!(await updateVersion(req, res, req.params.id))) return;

        const { education, training, experience, performance, outstandingAccomplishments, applicationOfEducation, applicationOfLD, potential, pbet, ppst_coi, ppst_ncoi, scoreWe, scoreSwst, scoreBei, scorePotPa, scorePotPsa, maxWe, maxSwst, maxBei, maxPotPa, maxPotPsa, isComplete, remarks: customRemarks } = req.body;
        const edu = (education !== undefined && education !== null && education !== '') ? parseFloat(education) : null;
        const trn = (training !== undefined && training !== null && training !== '') ? parseFloat(training) : null;
        const exp = (experience !== undefined && experience !== null && experience !== '') ? parseFloat(experience) : null;
        const prf = (performance !== undefined && performance !== null && performance !== '') ? parseFloat(performance) : null;
        const oac = (outstandingAccomplishments !== undefined && outstandingAccomplishments !== null && outstandingAccomplishments !== '') ? parseFloat(outstandingAccomplishments) : null;
        const aoe = (applicationOfEducation !== undefined && applicationOfEducation !== null && applicationOfEducation !== '') ? parseFloat(applicationOfEducation) : null;
        const ald = (applicationOfLD !== undefined && applicationOfLD !== null && applicationOfLD !== '') ? parseFloat(applicationOfLD) : null;
        const pot = (potential !== undefined && potential !== null && potential !== '') ? parseFloat(potential) : null;
        const pb = (pbet !== undefined && pbet !== null && pbet !== '') ? parseFloat(pbet) : null;
        const ppc = (ppst_coi !== undefined && ppst_coi !== null && ppst_coi !== '') ? parseFloat(ppst_coi) : null;
        const ppnc = (ppst_ncoi !== undefined && ppst_ncoi !== null && ppst_ncoi !== '') ? parseFloat(ppst_ncoi) : null;
        
        const sWe = (scoreWe !== undefined && scoreWe !== null && scoreWe !== '') ? parseFloat(scoreWe) : null;
        const sSwst = (scoreSwst !== undefined && scoreSwst !== null && scoreSwst !== '') ? parseFloat(scoreSwst) : null;
        const sBei = (scoreBei !== undefined && scoreBei !== null && scoreBei !== '') ? parseFloat(scoreBei) : null;
        const sPotPa = (scorePotPa !== undefined && scorePotPa !== null && scorePotPa !== '') ? parseFloat(scorePotPa) : null;
        const sPotPsa = (scorePotPsa !== undefined && scorePotPsa !== null && scorePotPsa !== '') ? parseFloat(scorePotPsa) : null;
        
        const mWe = (maxWe !== undefined && maxWe !== null && maxWe !== '') ? parseFloat(maxWe) : null;
        const mSwst = (maxSwst !== undefined && maxSwst !== null && maxSwst !== '') ? parseFloat(maxSwst) : null;
        const mBei = (maxBei !== undefined && maxBei !== null && maxBei !== '') ? parseFloat(maxBei) : null;
        const mPotPa = (maxPotPa !== undefined && maxPotPa !== null && maxPotPa !== '') ? parseFloat(maxPotPa) : null;
        const mPotPsa = (maxPotPsa !== undefined && maxPotPsa !== null && maxPotPsa !== '') ? parseFloat(maxPotPsa) : null;
        
        let total = 0; let anyScore = false;
        [edu, trn, exp, prf, oac, aoe, ald, pot, pb, ppc, ppnc].forEach(val => { if (val !== null) { total += val; anyScore = true; } });
        let finalTotal = anyScore ? parseFloat(total.toFixed(2)) : null;
        let assessmentRemarks = 'Pending';
        if (anyScore) assessmentRemarks = isComplete ? 'Assessed' : 'In-Prog';

        await db.query(`
            UPDATE applicants 
            SET scoreEducation = ?, scoreTraining = ?, scoreExperience = ?, scorePerformance = ?, scoreOutstandingAccomplishments = ?, scoreApplicationOfEducation = ?, scoreApplicationOfLD = ?, scorePotential = ?, scorePbet = ?, scorePpstCoi = ?, scorePpstNcoi = ?, scoreWe = ?, scoreSwst = ?, scoreBei = ?, scorePotPa = ?, scorePotPsa = ?, maxWe = ?, maxSwst = ?, maxBei = ?, maxPotPa = ?, maxPotPsa = ?, assessmentTotal = ?, assessmentRemarks = ?, remarks = ?
            WHERE id = ?`, 
            [edu, trn, exp, prf, oac, aoe, ald, pot, pb, ppc, ppnc, sWe, sSwst, sBei, sPotPa, sPotPsa, mWe, mSwst, mBei, mPotPa, mPotPsa, finalTotal, assessmentRemarks, customRemarks, req.params.id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

exports.proceedRequirements = async (req, res) => {
    try {
        if (!(await updateVersion(req, res, req.params.id))) return;

        await db.query(`UPDATE applicants SET status = 'WAITING' WHERE id = ?`, [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

exports.toggleAssignmentReq = async (req, res) => {
    try {
        if (!(await updateVersion(req, res, req.params.id))) return;

        await db.query(`UPDATE applicants SET assignmentReqStatus = ? WHERE id = ?`, [req.body.status, req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

exports.saveDocDate = async (req, res) => {
    try {
        if (!(await updateVersion(req, res, req.params.id))) return;

        const { docType, dateStr } = req.body;
        if (!docType || !dateStr) return res.status(400).json({ error: "Missing parameters" });

        const [rows] = await db.query(`SELECT doc_dates FROM applicants WHERE id = ?`, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: "Applicant not found" });

        let docDates = {};
        if (rows[0].doc_dates) {
            try {
                docDates = JSON.parse(rows[0].doc_dates);
            } catch (e) { }
        }

        if (!docDates[docType]) {
            docDates[docType] = dateStr;
            await db.query(`UPDATE applicants SET doc_dates = ? WHERE id = ?`, [JSON.stringify(docDates), req.params.id]);
        }
        
        res.json({ success: true, docDates });
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
        if (!(await updateVersion(req, res, req.params.id))) return;

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
        if (!(await updateVersion(req, res, req.params.id))) return;

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
        const [appRows] = await db.query('SELECT applicant_id FROM applicant_education WHERE id = ?', [req.params.id]);
        if (!appRows.length) return res.status(404).json({ error: 'Record not found' });
        if (!(await updateVersion(req, res, appRows[0].applicant_id))) return;

        await db.query('DELETE FROM applicant_education WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) { console.error(error); res.status(500).json({ error: "Internal server error" }); }
};

exports.addTraining = async (req, res) => {
    try {
        if (!(await updateVersion(req, res, req.params.id))) return;

        await db.query('INSERT INTO applicant_training (applicant_id, title, hours, digitalCopyLink) VALUES (?, ?, ?, ?)', [req.params.id, req.body.title, req.body.hours, '']);
        res.json({ success: true });
    } catch (error) { console.error(error); res.status(500).json({ error: "Internal server error" }); }
};

exports.deleteTraining = async (req, res) => {
    try {
        const [appRows] = await db.query('SELECT applicant_id FROM applicant_training WHERE id = ?', [req.params.id]);
        if (!appRows.length) return res.status(404).json({ error: 'Record not found' });
        if (!(await updateVersion(req, res, appRows[0].applicant_id))) return;

        await db.query('DELETE FROM applicant_training WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) { console.error(error); res.status(500).json({ error: "Internal server error" }); }
};

exports.addExperience = async (req, res) => {
    try {
        if (!(await updateVersion(req, res, req.params.id))) return;

        await db.query('INSERT INTO applicant_experience (applicant_id, details, years, months, digitalCopyLink) VALUES (?, ?, ?, ?, ?)', [req.params.id, req.body.details, req.body.years, req.body.months || 0, '']);
        res.json({ success: true });
    } catch (error) { console.error(error); res.status(500).json({ error: "Internal server error" }); }
};

exports.deleteExperience = async (req, res) => {
    try {
        const [appRows] = await db.query('SELECT applicant_id FROM applicant_experience WHERE id = ?', [req.params.id]);
        if (!appRows.length) return res.status(404).json({ error: 'Record not found' });
        if (!(await updateVersion(req, res, appRows[0].applicant_id))) return;

        await db.query('DELETE FROM applicant_experience WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) { console.error(error); res.status(500).json({ error: "Internal server error" }); }
};

exports.addEligibility = async (req, res) => {
    try {
        if (!(await updateVersion(req, res, req.params.id))) return;

        await db.query('INSERT INTO applicant_eligibility (applicant_id, details, rating, digitalCopyLink) VALUES (?, ?, ?, ?)', [req.params.id, req.body.title, req.body.rating, '']);
        res.json({ success: true });
    } catch (error) { console.error(error); res.status(500).json({ error: "Internal server error" }); }
};

exports.deleteEligibility = async (req, res) => {
    try {
        const [appRows] = await db.query('SELECT applicant_id FROM applicant_eligibility WHERE id = ?', [req.params.id]);
        if (!appRows.length) return res.status(404).json({ error: 'Record not found' });
        if (!(await updateVersion(req, res, appRows[0].applicant_id))) return;

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
            pbet: app.scorePbet,
            ppst_coi: app.scorePpstCoi,
            ppst_ncoi: app.scorePpstNcoi,
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
        if (!(await updateVersion(req, res, req.params.id))) return;

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

// Pessimistic locking functions removed in favor of Optimistic Locking

exports.updateEducation = async (req, res) => {
    try {
        const [appRows] = await db.query('SELECT applicant_id FROM applicant_education WHERE id = ?', [req.params.id]);
        if (!appRows.length) return res.status(404).json({ error: 'Record not found' });
        if (!(await updateVersion(req, res, appRows[0].applicant_id))) return;

        const { degree, yearGraduated } = req.body;
        await db.query('UPDATE applicant_education SET degree = ?, yearGraduated = ? WHERE id = ?', [degree, yearGraduated, req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Internal server error" }); }
};

exports.updateTraining = async (req, res) => {
    try {
        const [appRows] = await db.query('SELECT applicant_id FROM applicant_training WHERE id = ?', [req.params.id]);
        if (!appRows.length) return res.status(404).json({ error: 'Record not found' });
        if (!(await updateVersion(req, res, appRows[0].applicant_id))) return;

        const { title, hours } = req.body;
        await db.query('UPDATE applicant_training SET title = ?, hours = ? WHERE id = ?', [title, hours, req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Internal server error" }); }
};

exports.updateExperience = async (req, res) => {
    try {
        const [appRows] = await db.query('SELECT applicant_id FROM applicant_experience WHERE id = ?', [req.params.id]);
        if (!appRows.length) return res.status(404).json({ error: 'Record not found' });
        if (!(await updateVersion(req, res, appRows[0].applicant_id))) return;

        const { details, years, months } = req.body;
        await db.query('UPDATE applicant_experience SET details = ?, years = ?, months = ? WHERE id = ?', [details, years, months || 0, req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Internal server error" }); }
};

exports.updateEligibility = async (req, res) => {
    try {
        const [appRows] = await db.query('SELECT applicant_id FROM applicant_eligibility WHERE id = ?', [req.params.id]);
        if (!appRows.length) return res.status(404).json({ error: 'Record not found' });
        if (!(await updateVersion(req, res, appRows[0].applicant_id))) return;

        const { details, rating } = req.body;
        await db.query('UPDATE applicant_eligibility SET details = ?, rating = ? WHERE id = ?', [details, rating, req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Internal server error" }); }
};

exports.noAppearanceApplicant = async (req, res) => {
    try {
        await db.query(`UPDATE applicants SET status = 'NO_APPEARANCE', scoreEducation = 0, scoreTraining = 0, scoreExperience = 0, scorePerformance = 0, scoreOutstandingAccomplishments = 0, scoreApplicationOfEducation = 0, scoreApplicationOfLD = 0, scorePotential = 0, scorePbet = 0, scorePpstCoi = 0, scorePpstNcoi = 0, assessmentTotal = 0 WHERE id = ?`, [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

exports.newlyPromotedApplicant = async (req, res) => {
    try {
        await db.query(`UPDATE applicants SET status = 'NEWLY_PROMOTED', scoreEducation = 0, scoreTraining = 0, scoreExperience = 0, scorePerformance = 0, scoreOutstandingAccomplishments = 0, scoreApplicationOfEducation = 0, scoreApplicationOfLD = 0, scorePotential = 0, scorePbet = 0, scorePpstCoi = 0, scorePpstNcoi = 0, assessmentTotal = 0 WHERE id = ?`, [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};
