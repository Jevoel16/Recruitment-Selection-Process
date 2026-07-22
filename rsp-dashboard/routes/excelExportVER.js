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
            let itemsObj = [];
            if (pos.plantillaItem && pos.plantillaItem.trim() !== "") {
                try {
                    const parsed = JSON.parse(pos.plantillaItem);
                    parsed.forEach(loc => {
                        if (loc.items && loc.items.trim() !== "") {
                            let locItems = loc.items.split(',').map(s => s.trim()).filter(s => s !== '');
                            locItems.forEach(item => {
                                itemsObj.push({ 
                                    itemNo: item, 
                                    parenthetical: loc.parenthetical || '',
                                    assignment: loc.dropdown1 || loc.location || (pos.category === 'Teaching' ? 'Public Elementary and Secondary Schools in Iligan City' : 'School Division Office of Iligan City'),
                                    competency: loc.dropdown2 || 'Self- Management, Professionalism and Ethics, Result Focus, Teamwork, Service Orientation, Innovation'
                                });
                            });
                        }
                    });
                } catch (e) {
                    let locItems = pos.plantillaItem.split(',').map(s => s.trim()).filter(s => s !== '');
                    let defAssignment = pos.category === 'Teaching' ? 'Public Elementary and Secondary Schools in Iligan City' : 'School Division Office of Iligan City';
                    let defComp = 'Self- Management, Professionalism and Ethics, Result Focus, Teamwork, Service Orientation, Innovation';
                    locItems.forEach(item => {
                        itemsObj.push({ itemNo: item, parenthetical: '', assignment: defAssignment, competency: defComp });
                    });
                }
            }
            
            if (itemsObj.length === 0) {
                let defAssignment = pos.category === 'Teaching' ? 'Public Elementary and Secondary Schools in Iligan City' : 'School Division Office of Iligan City';
                let defComp = 'Self- Management, Professionalism and Ethics, Result Focus, Teamwork, Service Orientation, Innovation';
                for (let i=0; i<(pos.vacancyCount || 1); i++) {
                    itemsObj.push({ itemNo: '', parenthetical: '', assignment: defAssignment, competency: defComp });
                }
            }
            
            for (const obj of itemsObj) {
                let salary = pos.monthlySalary;
                if (!salary) {
                    salary = sgMap[pos.salaryGrade] || '';
                }
                
                let fullTitle = pos.title || '';
                if (obj.parenthetical) {
                    fullTitle += ` (${obj.parenthetical})`;
                }

                allItems.push({
                    no: count++,
                    title: fullTitle,
                    itemNo: obj.itemNo,
                    sg: pos.salaryGrade || '',
                    salary: salary,
                    edu: pos.qsEducation || 'None required',
                    train: pos.qsTraining || 'None required',
                    exp: pos.qsExperience || 'None required',
                    elig: pos.qsEligibility || 'None required',
                    comp: pos.qsCompetency || obj.competency,
                    assignment: obj.assignment
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
