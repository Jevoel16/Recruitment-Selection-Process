const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/car', async (req, res) => {
    try {
        const startTime = Date.now();
        const positionFilter = req.query.position || '';
        let baseQuery = `FROM applicants WHERE status IN ('ASSESSED', 'WAITING', 'ASSIGNED', 'NO_APPEARANCE', 'NEWLY_PROMOTED')`;
        const queryParams = [];

        if (positionFilter) { baseQuery += ` AND position = ?`; queryParams.push(positionFilter); }

        let posData = null;
        if (positionFilter) {
            const [posRows] = await db.query(`SELECT * FROM positions WHERE title = ? LIMIT 1`, [positionFilter]);
            if (posRows.length > 0) posData = posRows[0];
        }



        const [applicants] = await db.query(`SELECT * ${baseQuery} ORDER BY assessmentTotal DESC`, queryParams);

        const { generateCARHtml } = require('../utils/excelGenerator');
        const exportType = req.query.exportType || (req.query.withName === 'true' ? 'withName' : 'withoutName');
        const html = generateCARHtml(exportType, positionFilter, posData, applicants);

        const d = new Date();
        const dateStr = `${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}`;
        const filename = positionFilter ? `${positionFilter.replace(/[^a-zA-Z0-9-]/g, '-')}-CAR-${dateStr}.xls` : `CAR-${dateStr}.xls`;
        res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(html);
        const exportTime = Date.now() - startTime;
        console.log(`[${new Date().toLocaleString()}] ${applicants.length} applicants_${filename} has been exported - took ${exportTime}ms`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating CAR CSV');
    }
});

module.exports = router;
