const express = require('express');
const router = express.Router();
const positionController = require('../controllers/positionController');
const applicantController = require('../controllers/applicantController');
const db = require('../db');

// Position API Routes
router.post('/positions/update', positionController.updatePosition);
router.post('/positions/:id/vacancy', positionController.togglePositionVacancy);
router.post('/positions/:id/plantilla', positionController.updatePlantilla);

// Applicant API Routes
router.post('/applicants', applicantController.createApplicant);
router.delete('/applicants/:id', applicantController.deleteApplicant);
router.post('/applicants/:id/disqualify', applicantController.disqualifyApplicant);
router.post('/applicants/:id/qualify', applicantController.qualifyApplicant);
router.post('/applicants/:id/proceed-step2', applicantController.proceedStep2);
router.put('/applicants/:id/status', applicantController.updateStatus);
router.post('/applicants/:id/requirements/all', applicantController.toggleAllRequirements);
router.post('/applicants/:id/requirement', applicantController.updateRequirement);
router.post('/applicants/:id/score', applicantController.scoreApplicant);
router.post('/applicants/:id/assess', applicantController.assessApplicant);
router.post('/applicants/:id/proceed-requirements', applicantController.proceedRequirements);
router.post('/applicants/:id/toggle-assignment-req', applicantController.toggleAssignmentReq);
router.post('/applicants/:id/assign', applicantController.assignApplicant);
router.post('/applicants/:id/complete', applicantController.completeApplicant);
router.put('/applicants/:id/info', applicantController.updateInfo);
router.get('/applicants/:id/details', applicantController.getApplicantDetails);
router.put('/applicants/:id/:type/:docId/status', applicantController.updateDocumentStatus);
router.post('/applicants/:id/lock', applicantController.lockApplicant);
router.post('/applicants/:id/unlock', applicantController.unlockApplicant);

// Education Routes
router.post('/applicants/:id/education', applicantController.addEducation);
router.post('/applicants/:id/education/:eduId/highest', applicantController.setHighestEducation);
router.delete('/education/:id', applicantController.deleteEducation);
router.put('/education/:id', applicantController.updateDocumentLink);

// Training Routes
router.post('/applicants/:id/training', applicantController.addTraining);
router.delete('/training/:id', applicantController.deleteTraining);
router.put('/training/:id', applicantController.updateDocumentLink);

// Experience Routes
router.post('/applicants/:id/experience', applicantController.addExperience);
router.delete('/experience/:id', applicantController.deleteExperience);
router.put('/experience/:id', applicantController.updateDocumentLink);

// Eligibility Routes
router.post('/applicants/:id/eligibility', applicantController.addEligibility);
router.delete('/eligibility/:id', applicantController.deleteEligibility);
router.put('/eligibility/:id', applicantController.updateDocumentLink);

// Update Document Content (Added)
router.put('/education/:id', applicantController.updateEducation);
router.put('/training/:id', applicantController.updateTraining);
router.put('/experience/:id', applicantController.updateExperience);
router.put('/eligibility/:id', applicantController.updateEligibility);

// Client-Side PDF Export Logging
router.post('/logs/pdf-export', (req, res) => {
    const { applicantCode, pdfName, timeMs } = req.body;
    if (applicantCode && pdfName && timeMs) {
        console.log(`${applicantCode}_${pdfName} exported - took ${timeMs}ms - ${new Date().toLocaleString()}`);
    }
    res.status(200).send('Logged');
});

module.exports = router;
