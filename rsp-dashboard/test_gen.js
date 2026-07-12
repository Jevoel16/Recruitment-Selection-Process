const { generateCARExcelJS } = require('./utils/exceljsCAR.js');
const fs = require('fs');

async function test() {
    const applicants = [{
        lastName: 'Doe', firstName: 'John', applicationCode: 'APP-123', isDisqualified: false,
        scoreEducation: '1.0', scoreTraining: '2.0', scoreExperience: '3.0',
        scorePerformance: '4.0', scoreOutstandingAccomplishments: '5.0',
        scoreApplicationOfEducation: '6.0', scoreApplicationOfLD: '7.0',
        scorePotential: '8.0', assessmentTotal: '36.0', status: 'OK'
    }];
    const buffer = await generateCARExcelJS(applicants, 'Teacher I', '123-456', false, 'withName');
    fs.writeFileSync('test_car.xlsx', buffer);
    console.log("Created test_car.xlsx");
}

test();
