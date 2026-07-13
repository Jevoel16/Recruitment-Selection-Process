const express = require('express');
const router = express.Router();
const db = require('../db');


router.get('/ver', async (req, res) => {
    try {
        const [positions] = await db.query('SELECT * FROM positions WHERE in_vacancy = 1');
        
        let allItems = [];
        let count = 1;

        const sgMap = {
            '3': '16,610',
            '4': '17,506',
            '6': '19,716',
            '8': '22,423',
            '9': '24,329',
            '10': '26,917',
            '11': '31,705',
            '12': '33,947',
            '13': '36,125',
            '14': '38,764',
            '15': '40,000',
            '16': '45,694',
            '18': '53,818',
            '19': '59,153',
            '21': '73,303',
            '22': '81,796',
            '25': '110,000',
            '26': '120,000'
        };

        for (const pos of positions) {
            let items = [];
            if (pos.plantillaItem && pos.plantillaItem.trim() !== "") {
                items = pos.plantillaItem.split(',').map(s => s.trim()).filter(s => s !== '');
            } else {
                for (let i=0; i<(pos.vacancyCount || 1); i++) items.push('');
            }
            
            for (const item of items) {
                let salary = pos.monthlySalary;
                if (!salary) {
                    salary = sgMap[pos.salaryGrade] || '';
                }

                allItems.push({
                    no: count++,
                    title: pos.title || '',
                    itemNo: item,
                    sg: pos.salaryGrade || '',
                    salary: salary,
                    edu: pos.qsEducation || 'None required',
                    train: pos.qsTraining || 'None required',
                    exp: pos.qsExperience || 'None required',
                    elig: pos.qsEligibility || 'None required',
                    comp: pos.qsCompetency || 'Self- Management, Professionalism and Ethics, Result Focus, Teamwork, Service Orientation, Innovation',
                    assignment: pos.category === 'Teaching' ? 'Public Elementary and Secondary Schools in Iligan City' : 'School Division Office of Iligan City'
                });
            }
        }

        const { generateVERExcelJS } = require('../utils/exceljsVER');
        const buffer = await generateVERExcelJS(allItems);

        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `VER-${dateStr}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(buffer);

    } catch (error) {
        console.error('Export Error:', error);
        res.status(500).send('Error generating VER Excel');
    }
});

module.exports = router;
