const db = require('../db');

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
    'req_orderSeparation', 'req_saln'
];

async function syncAssignmentRequirementStatus(applicantId) {
    const [rows] = await db.query(`SELECT * FROM applicants WHERE id = ?`, [applicantId]);
    if (!rows.length) return;
    const isComplete = requirementFields.every(field => Boolean(rows[0][field]));
    await db.query(`UPDATE applicants SET assignmentReqStatus = ? WHERE id = ?`, [isComplete ? 'COMPLETE' : 'INCOMPLETE', applicantId]);
}

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

exports.scoreApplicant = async (req, res) => {
    try {
        await db.query(`UPDATE applicants SET status = 'ASSESSED' WHERE id = ?`, [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

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

exports.assignApplicant = async (req, res) => {
    try {
        const { office, cc, ccDesignation } = req.body;
        await db.query(`UPDATE applicants SET status = 'ASSIGNED', assignedOffice = ?, cc = ?, ccDesignation = ? WHERE id = ?`, [office, cc || null, ccDesignation || null, req.params.id]);
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
        const [applicant] = await db.query('SELECT * FROM applicants WHERE id = ?', [id]);
        if (applicant.length === 0) return res.status(404).json({ error: 'Applicant not found' });
        
        const [education] = await db.query('SELECT * FROM applicant_education WHERE applicant_id = ?', [id]);
        const [training] = await db.query('SELECT * FROM applicant_training WHERE applicant_id = ?', [id]);
        const [experience] = await db.query('SELECT * FROM applicant_experience WHERE applicant_id = ?', [id]);
        const [eligibility] = await db.query('SELECT * FROM applicant_eligibility WHERE applicant_id = ?', [id]);

        res.json({
            ...applicant[0],
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
        const table = 'applicant_' + req.route.path.split('/')[2];
        
        await db.query(`UPDATE ${table} SET digitalCopyLink = ? WHERE id = ?`, [digitalCopyLink, id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.lockApplicant = async (req, res) => {
    try {
        const { lockedBy } = req.body;
        await db.query('UPDATE applicants SET lockedBy = ?, lockedAt = NOW() WHERE id = ?', [lockedBy, req.params.id]);
        res.json({ success: true });
    } catch (e) { console.error(e); res.status(500).json({ error: "Internal server error" }); }
};

exports.unlockApplicant = async (req, res) => {
    try {
        const { lockedBy } = req.body;
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
    } catch (e) { console.error(e); res.status(500).json({ error: "Internal server error" }); }
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
