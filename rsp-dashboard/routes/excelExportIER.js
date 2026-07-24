const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/ier', async (req, res) => {
    try {
        const startTime = Date.now();
        const positionFilter = req.query.position || '';
        let baseQuery = `FROM applicants WHERE status IN ('PENDING', 'QUALIFIED', 'DISQUALIFIED')`;
        const queryParams = [];

        if (positionFilter) {
            baseQuery += ` AND position = ?`;
            queryParams.push(positionFilter);
        }

        let allPositions = [];
        const [posRows] = await db.query(`SELECT * FROM positions`);
        allPositions = posRows;

        const [applicants] = await db.query(`SELECT * ${baseQuery} ORDER BY CAST(applicationCode AS UNSIGNED) ASC, applicationCode ASC`, queryParams);
        const applicantIds = applicants.map(a => a.id);
        
        let allEdu = [], allTrain = [], allExp = [], allElig = [];
        if (applicantIds.length > 0) {
            [allEdu] = await db.query(`SELECT * FROM applicant_education WHERE applicant_id IN (?)`, [applicantIds]);
            [allTrain] = await db.query(`SELECT * FROM applicant_training WHERE applicant_id IN (?)`, [applicantIds]);
            [allExp] = await db.query(`SELECT * FROM applicant_experience WHERE applicant_id IN (?)`, [applicantIds]);
            [allElig] = await db.query(`SELECT * FROM applicant_eligibility WHERE applicant_id IN (?)`, [applicantIds]);
        }

        const { generateIERExcelJS } = require('../utils/exceljsIER');
        const exportType = req.query.exportType || (req.query.withName === 'true' ? 'withName' : 'withoutName');
        
        const buffer = await generateIERExcelJS(exportType, positionFilter, allPositions, applicants, allEdu, allTrain, allExp, allElig);

        const d = new Date();
        const dateStr = `${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}`;
        const filename = positionFilter ? `${positionFilter.replace(/[^a-zA-Z0-9-]/g, '-')}-IER-${dateStr}.xlsx` : `IER-${dateStr}.xlsx`;
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
        const exportTime = Date.now() - startTime;
        console.log(`[${new Date().toLocaleString()}] ${applicants.length} applicants_${filename} has been exported - took ${exportTime}ms`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating IER CSV');
    }
});

module.exports = router;
