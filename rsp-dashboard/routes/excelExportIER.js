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

        let posData = null;
        if (positionFilter) {
            const [posRows] = await db.query(`SELECT * FROM positions WHERE title = ? LIMIT 1`, [positionFilter]);
            if (posRows.length > 0) {
                posData = posRows[0];
                if (!posData.monthlySalary && posData.salaryGrade) {
                    const sgMap = {
                        '3': '16,610', '4': '17,506', '6': '19,716', '8': '22,423',
                        '9': '24,329', '10': '26,917', '11': '31,705', '12': '33,947',
                        '13': '36,125', '14': '38,764', '15': '40,000', '16': '45,694',
                        '18': '53,818', '19': '59,153', '21': '73,303', '22': '81,796',
                        '25': '110,000', '26': '120,000'
                    };
                    posData.monthlySalary = sgMap[posData.salaryGrade] || '';
                }
            }
        }



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
        
        const buffer = await generateIERExcelJS(exportType, positionFilter, posData, applicants, allEdu, allTrain, allExp, allElig);

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
