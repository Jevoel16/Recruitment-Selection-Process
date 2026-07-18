const express = require('express');
const router = express.Router();
const positionController = require('../controllers/positionController');
const applicantController = require('../controllers/applicantController');
const db = require('../db');
const authController = require('../controllers/authController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

router.use(requireAuth);

// Removed automatic logging middleware.
        
// Removed automatic logging middleware.
// We will explicitly log specific events.

router.get('/users', requireAdmin, authController.getUsers);
router.post('/users', requireAdmin, authController.createUser);
router.put('/users/:id', requireAdmin, authController.updateUser);
router.delete('/users/:id', requireAdmin, authController.deleteUser);
router.get('/logs', requireAdmin, authController.getLogs);

// Endpoints for managing positions and fetching dynamic plantilla assignments
router.post('/positions', positionController.createPosition);
router.post('/positions/update', positionController.updatePosition);
router.post('/positions/vacancy-off-all', positionController.turnOffAllVacancies);
router.post('/positions/:id/vacancy', positionController.togglePositionVacancy);
router.post('/positions/:id/plantilla', positionController.updatePlantilla);
router.get('/positions/export/doc', positionController.exportDoc);

// Core endpoints for applicant creation, assessment, scoring, and workflow progression
router.post('/applicants', applicantController.createApplicant);
router.delete('/applicants/:id', applicantController.deleteApplicant);
router.post('/applicants/:id/disqualify', applicantController.disqualifyApplicant);
router.post('/applicants/:id/qualify', applicantController.qualifyApplicant);
router.post('/applicants/:id/proceed-step2', applicantController.proceedStep2);
router.put('/applicants/:id/status', applicantController.updateStatus);
router.post('/applicants/:id/requirements/all', applicantController.toggleAllRequirements);
router.post('/applicants/:id/requirement', applicantController.updateRequirement);
router.post('/applicants/:id/assess', applicantController.assessApplicant);
router.post('/applicants/:id/no-appearance', applicantController.noAppearanceApplicant);
router.post('/applicants/:id/newly-promoted', applicantController.newlyPromotedApplicant);
router.post('/applicants/:id/proceed-requirements', applicantController.proceedRequirements);
router.post('/applicants/:id/toggle-assignment-req', applicantController.toggleAssignmentReq);
router.post('/applicants/:id/assign', applicantController.assignApplicant);
router.post('/applicants/:id/complete', applicantController.completeApplicant);
router.put('/applicants/:id/info', applicantController.updateInfo);
router.get('/applicants/:id/details', applicantController.getApplicantDetails);
router.post('/applicants/:id/doc-date', applicantController.saveDocDate);
router.put('/applicants/:id/:type/:docId/status', applicantController.updateDocumentStatus);
router.post('/applicants/:id/lock', applicantController.lockApplicant);
router.post('/applicants/:id/unlock', applicantController.unlockApplicant);
router.get('/applicants/:id/lock-stream', applicantController.lockStream);

// Endpoints for managing applicant educational background records
router.post('/applicants/:id/education', applicantController.addEducation);
router.post('/applicants/:id/education/:eduId/highest', applicantController.setHighestEducation);
router.delete('/education/:id', applicantController.deleteEducation);
router.put('/education/:id/link', applicantController.updateDocumentLink);

// Endpoints for managing applicant training and seminar records
router.post('/applicants/:id/training', applicantController.addTraining);
router.delete('/training/:id', applicantController.deleteTraining);
router.put('/training/:id/link', applicantController.updateDocumentLink);

// Endpoints for managing applicant work experience records
router.post('/applicants/:id/experience', applicantController.addExperience);
router.delete('/experience/:id', applicantController.deleteExperience);
router.put('/experience/:id/link', applicantController.updateDocumentLink);

// Endpoints for managing applicant civil service eligibility records
router.post('/applicants/:id/eligibility', applicantController.addEligibility);
router.delete('/eligibility/:id', applicantController.deleteEligibility);
router.put('/eligibility/:id/link', applicantController.updateDocumentLink);

// Endpoints for applying dynamic inline edits to specific document sections
router.put('/education/:id', applicantController.updateEducation);
router.put('/training/:id', applicantController.updateTraining);
router.put('/experience/:id', applicantController.updateExperience);
router.put('/eligibility/:id', applicantController.updateEligibility);



// JSON Database Backup Endpoint
router.get('/export/backup', async (req, res) => {
    try {
        const [applicants] = await db.query('SELECT * FROM applicants');
        const [education] = await db.query('SELECT * FROM applicant_education');
        const [experience] = await db.query('SELECT * FROM applicant_experience');
        const [training] = await db.query('SELECT * FROM applicant_training');
        const [eligibility] = await db.query('SELECT * FROM applicant_eligibility');
        
        const backupData = {
            metadata: {
                timestamp: new Date().toISOString(),
                totalApplicants: applicants.length
            },
            data: {
                applicants,
                education,
                experience,
                training,
                eligibility
            }
        };

        const dateStr = new Date().toISOString().split('T')[0];
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="RSP-Backup-${dateStr}.json"`);
        res.send(JSON.stringify(backupData, null, 2));
    } catch (error) {
        console.error('Backup Export Error:', error);
        res.status(500).send('Failed to generate backup');
    }
});

// Helper for CSV conversion
function jsonToCsv(jsonArray) {
    if (!jsonArray || !jsonArray.length) return '';
    const keys = Object.keys(jsonArray[0]);
    const header = keys.join(',');
    const rows = jsonArray.map(obj => {
        return keys.map(k => {
            let val = obj[k];
            if (val === null || val === undefined) return '';
            val = String(val).replace(/"/g, '""');
            if (val.search(/("|,|\n)/g) >= 0) val = `"${val}"`;
            return val;
        }).join(',');
    });
    return [header, ...rows].join('\n');
}

// CSV Database Backup Endpoint (Zip of CSVs)
router.get('/export/backup/csv', async (req, res) => {
    try {
        const [applicants] = await db.query('SELECT * FROM applicants');
        const [education] = await db.query('SELECT * FROM applicant_education');
        const [experience] = await db.query('SELECT * FROM applicant_experience');
        const [training] = await db.query('SELECT * FROM applicant_training');
        const [eligibility] = await db.query('SELECT * FROM applicant_eligibility');
        
        const PizZip = require('pizzip');
        const zip = new PizZip();
        
        zip.file('applicants.csv', jsonToCsv(applicants));
        zip.file('education.csv', jsonToCsv(education));
        zip.file('experience.csv', jsonToCsv(experience));
        zip.file('training.csv', jsonToCsv(training));
        zip.file('eligibility.csv', jsonToCsv(eligibility));
        
        const content = zip.generate({ type: 'nodebuffer' });
        const dateStr = new Date().toISOString().split('T')[0];
        
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="RSP-Backup-CSV-${dateStr}.zip"`);
        res.send(content);
    } catch (error) {
        console.error('CSV Backup Export Error:', error);
        res.status(500).send('Failed to generate CSV backup');
    }
});

module.exports = router;
