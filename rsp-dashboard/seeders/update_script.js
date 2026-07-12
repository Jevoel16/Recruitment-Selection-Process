const fs = require('fs');
const path = require('path');
const positionsData = require('./seed_positions.js');

// Reset all
positionsData.forEach(p => {
    p.in_vacancy = 0;
    p.vacancyCount = 0;
    p.plantillaItem = null;
});

const updates = [
    {
        title: "Administrative Aide I",
        plantilla: ["ADA1-660299-2004"]
    },
    {
        title: "Watchman",
        plantilla: ["WCHM1-660093-2003"]
    },
    {
        title: "Administrative Officer I",
        plantilla: ["ADOF1-660031-2004"]
    },
    {
        title: "Administrative Assistant III",
        plantilla: ["ADAS3-660028-2018"]
    },
    {
        title: "Legal Assistant I",
        plantilla: ["LEA1-660005-2026"]
    },
    {
        title: "Project Development Officer I",
        plantilla: [
            "PDO1-660056-2026", "PDO1-660057-2026", "PDO1-660058-2026", "PDO1-660059-2026", "PDO1-660060-2026", 
            "PDO1-660061-2026", "PDO1-660062-2026", "PDO1-660063-2026", "PDO1-660064-2026", "PDO1-660065-2026",
            "PDO1-660066-2026", "PDO1-660067-2026", "PDO1-660068-2026", "PDO1-660069-2026", "PDO1-660070-2026"
        ]
    },
    {
        title: "Administrative Officer II",
        plantilla: [
            "ADOF2-660004-2026",
            "ADOF2-660088-2026", "ADOF2-660089-2026", "ADOF2-660090-2026", "ADOF2-660091-2026", "ADOF2-660092-2026",
            "ADOF2-660093-2026", "ADOF2-660094-2026", "ADOF2-660095-2026", "ADOF2-660096-2026", "ADOF2-660097-2026",
            "ADOF2-660098-2026", "ADOF2-660099-2026", "ADOF2-660100-2026", "ADOF2-660101-2026", "ADOF2-660202-2020",
            "ADOF2-660102-2026", "ADOF2-660103-2026", "ADOF2-660104-2026", "ADOF2-660105-2026", "ADOF2-660106-2026",
            "ADOF2-660107-2026", "ADOF2-660108-2026", "ADOF2-660109-2026", "ADOF2-660110-2026", "ADOF2-660111-2026",
            "ADOF2-660112-2026", "ADOF2-660113-2026"
        ]
    },
    {
        title: "Administrative Officer IV",
        plantilla: ["ADOF4-660003-2026"]
    },
    {
        title: "School Principal I",
        plantilla: [
            "SP1-660063-2026", "SP1-660064-2026",
            "SP1-660065-2026", "SP1-660066-2026", "SP1-660067-2026"
        ]
    },
    {
        title: "Project Development Officer II",
        plantilla: ["PDO2-660054-2014", "PDO2-660055-2014"]
    },
    {
        title: "Education Program Supervisor",
        plantilla: ["EPSVR-660120-2010"]
    }
];

updates.forEach(update => {
    const pos = positionsData.find(p => p.title === update.title);
    if (pos) {
        pos.in_vacancy = 1;
        pos.vacancyCount = update.plantilla.length;
        pos.plantillaItem = update.plantilla.join(',\\n');
        console.log(`Updated ${update.title} - Vacancies: ${pos.vacancyCount}`);
    } else {
        console.log(`NOT FOUND: ${update.title}`);
    }
});

const content = 'const positionsData = ' + JSON.stringify(positionsData, null, 4) + ';\n\nmodule.exports = positionsData;\n';
fs.writeFileSync('./seed_positions.js', content, 'utf8');
console.log('Successfully updated seed_positions.js');
