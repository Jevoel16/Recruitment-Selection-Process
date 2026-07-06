require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const hbs = require('hbs');
const path = require('path');
const db = require('./db');
const { identityMiddleware } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

const requirementFields = [
    'req_pds', 'req_prcLicense', 'req_reportRating', 'req_medCert', 'req_birthCert', 'req_marriageCert',
    'req_nbiClearance', 'req_tor', 'req_diplomaBachelors', 'req_masters', 'req_doctorate', 'req_soGraduation',
    'req_orderSeparation', 'req_saln'
];

// Configure global middleware for JSON parsing, urlencoded bodies, cookies, and request logging
morgan.token('localdate', () => new Date().toLocaleString());
app.use(morgan('[:localdate] :method :url :status :response-time ms - :res[content-length]', {
    skip: function (req, res) { return req.method === 'GET' }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(identityMiddleware);

// Serve static assets for application public directory and third-party dependencies
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));
app.use('/bootstrap-icons', express.static(path.join(__dirname, 'node_modules/bootstrap-icons/font')));
app.use('/jspdf', express.static(path.join(__dirname, 'node_modules/jspdf')));

// Initialize Handlebars view engine and register partial components
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
hbs.registerPartials(path.join(__dirname, 'views', 'partials'));

// Handlebars template helper functions
hbs.registerHelper('inc', function(value) { return parseInt(value) + 1; });
hbs.registerHelper('incOffset', function(value, offset) { return parseInt(value) + parseInt(offset) + 1; });
hbs.registerHelper('eq', function (a, b) { return a === b; });
hbs.registerHelper('allRequirementsMet', function(applicant) { return requirementFields.every((field) => Boolean(applicant[field])); });
hbs.registerHelper('formatDate', function(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
});

// Import route definitions
const apiRoutes = require('./routes/apiRoutes');
const viewRoutes = require('./routes/viewRoutes');

// Mount route middleware for API and web interfaces
app.use('/api', apiRoutes);
app.use('/', viewRoutes);

// Export functionality for Initial Evaluation Results (IER)
app.get('/api/export/ier', async (req, res) => {
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
            if (posRows.length > 0) posData = posRows[0];
        }

        const vAnnounce = posData?.vacancyAnnouncement || '';
        const pItem = posData?.plantillaItem || '';
        const sGrade = posData?.salaryGrade || '';
        const qsEdu = posData?.qsEducation || '';
        const qsTrain = posData?.qsTraining || '';
        const qsExp = posData?.qsExperience || '';
        const qsElig = posData?.qsEligibility || '';

        const [applicants] = await db.query(`SELECT * ${baseQuery} ORDER BY CAST(applicationCode AS UNSIGNED) ASC, applicationCode ASC`, queryParams);
        const applicantIds = applicants.map(a => a.id);
        
        let allEdu = [], allTrain = [], allExp = [], allElig = [];
        if (applicantIds.length > 0) {
            [allEdu] = await db.query(`SELECT * FROM applicant_education WHERE applicant_id IN (?)`, [applicantIds]);
            [allTrain] = await db.query(`SELECT * FROM applicant_training WHERE applicant_id IN (?)`, [applicantIds]);
            [allExp] = await db.query(`SELECT * FROM applicant_experience WHERE applicant_id IN (?)`, [applicantIds]);
            [allElig] = await db.query(`SELECT * FROM applicant_eligibility WHERE applicant_id IN (?)`, [applicantIds]);
        }
        const escapeHtml = (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

        let html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head>
<meta charset="utf-8">
<!--[if gte mso 9]>
<xml>
 <x:ExcelWorkbook>
  <x:ExcelWorksheets>
   <x:ExcelWorksheet>
    <x:Name>IER</x:Name>
    <x:WorksheetOptions>
     <x:FitToPage/>
     <x:Print>
      <x:ValidPrinterInfo/>
      <x:PaperSizeIndex>9</x:PaperSizeIndex>
      <x:FitWidth>1</x:FitWidth>
      <x:FitHeight>99</x:FitHeight>
     </x:Print>
    </x:WorksheetOptions>
   </x:ExcelWorksheet>
  </x:ExcelWorksheets>
 </x:ExcelWorkbook>
</xml>
<![endif]-->
<style>
  @page { mso-page-orientation: landscape; size: 297mm 210mm; margin: 0.5in; }
  body, table { font-family: 'Times New Roman', serif; font-size: 9pt; }
  table { border-collapse: collapse; width: 100%; page-break-inside: auto; }
  tr { page-break-inside: avoid; page-break-after: auto; }
  .no-border td, .no-border th { border: none !important; text-align: left; vertical-align: top; }
  .bordered td, .bordered th { border: 1px solid black; text-align: center; vertical-align: middle; padding: 4px; }
  .title-row td { text-align: center; font-size: 18pt; font-weight: bold; }
  .annex-row td { text-align: right; font-weight: bold; font-size: 14pt; }
  .text-bold { font-weight: bold; }
</style>
</head>
<body>
<table>
    <tr class="no-border"><td colspan="7"></td><td colspan="2" style="text-align: right; font-weight: bold; font-size: 14pt;">Annex D</td></tr>
    <tr class="no-border"><td colspan="9" style="text-align: center; font-size: 16pt; font-weight: bold;">INITIAL EVALUATION RESULT (IER)</td></tr>
    <tr class="no-border" style="font-size: 12pt;"><td colspan="9">Position: <span style="font-weight: bold;">${escapeHtml(positionFilter)}</span></td></tr>
    <tr class="no-border" style="font-size: 12pt;"><td colspan="9">VACANCY ANNOUNCEMENT NO. ${escapeHtml(vAnnounce)}</td></tr>
    <tr class="no-border" style="font-size: 12pt;"><td colspan="9">PLANTILLA ITEM/S NUMBER: ${escapeHtml(pItem)}</td></tr>
    <tr class="no-border" style="font-size: 12pt;"><td colspan="9">Salary Grade and Monthly Salary: ${escapeHtml(sGrade)}</td></tr>
    <tr class="no-border" style="font-size: 12pt;"><td colspan="9">Qualification Standards:</td></tr>
    <tr class="no-border" style="font-size: 12pt;"><td colspan="9">&nbsp;&nbsp;&nbsp;&nbsp;Education: ${escapeHtml(qsEdu)}</td></tr>
    <tr class="no-border" style="font-size: 12pt;"><td colspan="9">&nbsp;&nbsp;&nbsp;&nbsp;Training: ${escapeHtml(qsTrain)}</td></tr>
    <tr class="no-border" style="font-size: 12pt;"><td colspan="9">&nbsp;&nbsp;&nbsp;&nbsp;Experience: ${escapeHtml(qsExp)}</td></tr>
    <tr class="no-border" style="font-size: 12pt;"><td colspan="9">&nbsp;&nbsp;&nbsp;&nbsp;Eligibility: ${escapeHtml(qsElig)}</td></tr>
    <tr class="no-border"><td colspan="9">&nbsp;</td></tr>
    <tr class="bordered" style="font-size: 12pt;">
        <th rowspan="2" style="width: 3%;">No.</th><th rowspan="2" style="width: 8%;">Application<br>Code</th><th rowspan="2" style="width: 24%;">Education</th>
        <th colspan="2" style="width: 28%;">Training</th><th colspan="2" style="width: 19%;">Experience</th><th rowspan="2" style="width: 10%;">Eligibility</th>
        <th rowspan="2" style="width: 8%;">Remarks<br>(Qualified or<br>Disqualified)</th>
    </tr>
    <tr class="bordered" style="font-size: 12pt;">
        <th style="width: 24%;">Title</th><th style="width: 4%;">Hours</th><th style="width: 15%;">Details</th><th style="width: 4%;">Years</th>
    </tr>`;

        let count = 1;
        for (const app of applicants) {
            const edu = allEdu.filter(e => e.applicant_id === app.id);
            const train = allTrain.filter(t => t.applicant_id === app.id);
            const exp = allExp.filter(e => e.applicant_id === app.id);
            const elig = allElig.filter(e => e.applicant_id === app.id);

            const eduStr = edu.length ? edu.map(e => escapeHtml(e.degree)).join('<br>') : 'N/A';
            const trainTitleStr = train.length ? train.map(t => escapeHtml(t.title)).join('<br>') : 'N/A';
            const trainHoursStr = train.length ? train.map(t => escapeHtml(t.hours)).join('<br>') : '0';
            const expDetailsStr = exp.length ? exp.map(e => escapeHtml(e.details)).join('<br>') : 'N/A';
            const expYearsStr = exp.length ? exp.map(e => escapeHtml(e.years)).join('<br>') : '0';
            const eligStr = elig.length ? elig.map(e => escapeHtml(e.details) + (e.rating ? ' (' + escapeHtml(e.rating) + ')' : '')).join('<br>') : 'NONE';
            
            const eduHasDisq = edu.some(e => e.status === 'DISQUALIFIED');
            const trainHasDisq = train.some(t => t.status === 'DISQUALIFIED');
            const expHasDisq = exp.some(e => e.status === 'DISQUALIFIED');
            const eligHasDisq = elig.some(e => e.status === 'DISQUALIFIED');

            let remarks = app.status === 'QUALIFIED' ? 'QUALIFIED' : (app.status === 'DISQUALIFIED' ? 'DISQUALIFIED' : '');
            let remarksStyle = remarks === 'DISQUALIFIED' ? 'color: red;' : '';

            html += `
    <tr class="bordered">
        <td>${count}</td>
        <td>${escapeHtml(app.applicationCode)}</td>
        <td style="${eduHasDisq ? 'color: red;' : ''}">${eduStr}</td>
        <td style="${trainHasDisq ? 'color: red;' : ''}">${trainTitleStr}</td>
        <td style="${trainHasDisq ? 'color: red;' : ''}">${trainHoursStr}</td>
        <td style="${expHasDisq ? 'color: red;' : ''}">${expDetailsStr}</td>
        <td style="${expHasDisq ? 'color: red;' : ''}">${expYearsStr}</td>
        <td style="${eligHasDisq ? 'color: red;' : ''}">${eligStr}</td>
        <td style="${remarksStyle}">${escapeHtml(remarks)}</td>
    </tr>`;
            count++;
        }

        const d = new Date();
        const currentDateStr = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;

        html += `
    <tr class="no-border"><td colspan="9">&nbsp;</td></tr>
    <tr class="no-border" style="font-size: 12pt;"><td colspan="7"></td><td colspan="2" style="text-align: left;">Prepared and certified correct by:</td></tr>
    <tr class="no-border"><td colspan="9">&nbsp;</td></tr>
    <tr class="no-border" style="font-size: 12pt;"><td colspan="7"></td><td colspan="2" style="text-align: center; font-weight: bold; text-decoration: underline;">AZOR B. QUIJANO</td></tr>
    <tr class="no-border" style="font-size: 12pt;"><td colspan="7"></td><td colspan="2" style="text-align: center;">Administrative Officer IV (Personnel)</td></tr>
    <tr class="no-border" style="font-size: 12pt;"><td colspan="7"></td><td colspan="2" style="text-align: center;">Date: ${currentDateStr}</td></tr>
    <tr class="no-border"><td colspan="9">&nbsp;</td></tr>
    <tr class="no-border"><td colspan="9" style="font-weight: bold;">Notes and Instructions for the HRMO:</td></tr>
    <tr class="no-border"><td colspan="9">a) For the purpose of posting the IER...</td></tr>
    <tr class="no-border"><td colspan="9">b) If the information does not apply to the applicant, please put N/A.</td></tr>
</table>
</body>
</html>`;
        const dateStr = `${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}`;
        const filename = positionFilter ? `${positionFilter.replace(/[^a-zA-Z0-9-]/g, '-')}-IER-${dateStr}.xls` : `IER-${dateStr}.xls`;
        res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(html);
        const exportTime = Date.now() - startTime;
        console.log(`[${new Date().toLocaleString()}] ${applicants.length} applicants_${filename} has been exported - took ${exportTime}ms`);
    } catch (error) { console.error(error); res.status(500).send('Error generating CSV'); }
});

app.get('/api/export/car', async (req, res) => {
    try {
        const startTime = Date.now();
        const positionFilter = req.query.position || '';
        let baseQuery = `FROM applicants WHERE status IN ('ASSESSED', 'WAITING', 'ASSIGNED', 'NO_APPEARANCE')`;
        const queryParams = [];

        if (positionFilter) { baseQuery += ` AND position = ?`; queryParams.push(positionFilter); }

        let posData = null;
        if (positionFilter) {
            const [posRows] = await db.query(`SELECT * FROM positions WHERE title = ? LIMIT 1`, [positionFilter]);
            if (posRows.length > 0) posData = posRows[0];
        }

        const plantillaItem = posData?.plantillaItem || '';
        const numItems = plantillaItem ? plantillaItem.split(',').filter(x => x.trim() !== '').length : 0;
        const getPositionCode = (title) => {
            if (!title) return '';
            const mapRoman = { 'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5', 'VI': '6', 'VII': '7', 'VIII': '8', 'IX': '9', 'X': '10' };
            const words = title.split(/[\s-]+/);
            let code = '';
            for (let word of words) {
                if (mapRoman[word.toUpperCase()]) code += mapRoman[word.toUpperCase()];
                else if (word.match(/^[A-Za-z]/)) code += word[0].toUpperCase();
            }
            return code;
        };
        const formattedPlantilla = numItems > 0 ? `${numItems} ${getPositionCode(positionFilter)} Vacant Items` : '0 Vacant Items';

        const [applicants] = await db.query(`SELECT * ${baseQuery} ORDER BY assessmentTotal DESC`, queryParams);
        const escapeHtml = (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        const d = new Date();
        const currentDateStr = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;

        let html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head>
<meta charset="utf-8">
<!--[if gte mso 9]>
<xml>
 <x:ExcelWorkbook>
  <x:ExcelWorksheets>
   <x:ExcelWorksheet>
    <x:Name>CAR</x:Name>
    <x:WorksheetOptions>
     <x:FitToPage/>
     <x:Print>
      <x:ValidPrinterInfo/>
      <x:PaperSizeIndex>9</x:PaperSizeIndex>
      <x:FitWidth>1</x:FitWidth>
      <x:FitHeight>99</x:FitHeight>
     </x:Print>
    </x:WorksheetOptions>
   </x:ExcelWorksheet>
  </x:ExcelWorksheets>
 </x:ExcelWorkbook>
</xml>
<![endif]-->
<style>
  .heading-score { mso-number-format:"\\@"; }
  @page { mso-page-orientation: landscape; size: 297mm 210mm; margin: 0.5in; }
  body, table { font-family: 'Times New Roman', serif; font-size: 9pt; }
  table { border-collapse: collapse; width: 100%; page-break-inside: auto; }
  tr { page-break-inside: avoid; page-break-after: auto; }
  .no-border td, .no-border th { border: none !important; text-align: left; vertical-align: top; }
  .bordered td, .bordered th { border: 1px solid black; text-align: center; vertical-align: middle; padding: 4px; }
  .boxed-table { border: 2pt solid black; }
</style>
</head>
<body>
<table class="boxed-table">
    <tr class="no-border"><td colspan="13"></td><td colspan="4" style="text-align: right; font-weight: bold; font-size: 14pt;">Annex H</td></tr>
    <tr class="no-border"><td colspan="17" style="text-align: center; font-size: 16pt; font-weight: bold;">COMPARATIVE ASSESSMENT RESULT (CAR)</td></tr>
    <tr class="no-border" style="font-size: 12pt;">
        <td colspan="11">Position: <span style="font-weight: bold;">${escapeHtml(positionFilter)}</span></td><td colspan="6" style="text-align: right;">Plantilla Item Number: ${escapeHtml(formattedPlantilla)}</td>
    </tr>
    <tr class="no-border" style="font-size: 12pt;">
        <td colspan="11"><span style="font-weight: bold;">Office/Bureau/Service/Unit where the vacancy exists: <u>Public Elementary and Secondary Schools in Iligan City</u></span></td>
        <td colspan="6" style="text-align: right;">Date of Final Deliberation: </td>
    </tr>
    <tr class="no-border"><td colspan="17">&nbsp;</td></tr>
    <tr class="bordered" style="font-size: 11pt;">
        <th rowspan="3" style="width: 3%;">No.</th><th rowspan="3" style="width: 15%;">Applicant Name</th><th rowspan="3" style="width: 15%;">Application Code</th><th colspan="9">COMPARATIVE ASSESSMENT RESULTS</th>
        <th rowspan="3" style="width: 8%;">Remarks</th><th colspan="2" rowspan="2">For Background Investigation (Y/N)</th>
        <th rowspan="3">For Appointment</th><th rowspan="3">For probation</th>
    </tr>
    <tr class="bordered" style="font-size: 10pt;">
        <th>Education</th><th>Training</th><th>Experience</th><th>Performance</th><th>Outstanding Accomplishments</th><th>Application of Education</th><th>Application of L&D</th><th>Potential</th><th>Total</th>
    </tr>
    <tr class="bordered" style="font-size: 9pt;">
        <th class="heading-score">(5)</th><th class="heading-score">(10)</th><th class="heading-score">(15)</th><th class="heading-score">(20)</th><th class="heading-score">(10)</th><th class="heading-score">(10)</th><th class="heading-score">(10)</th><th class="heading-score">(20)</th><th class="heading-score">(100)</th><th>Yes</th><th>No</th>
    </tr>`;

        let count = 1;
        for (const app of applicants) {
        let appName = `${escapeHtml(app.lastName || '')}, ${escapeHtml(app.firstName || '')}`;
        if (app.nameExtension) appName += ` ${escapeHtml(app.nameExtension)}`;
        if (app.middleName) appName += ` ${escapeHtml(app.middleName)}`;
        appName = appName.replace(/^,\\s*/, '').trim();
        let remarks = app.status === 'NO_APPEARANCE' ? 'No Appearance' : '';

            html += `
    <tr class="bordered">
        <td>${count}</td><td>${appName}</td><td>${escapeHtml(app.applicationCode)}</td><td>${app.scoreEducation || '0.0'}</td><td>${app.scoreTraining || '0.0'}</td>
        <td>${app.scoreExperience || '0.0'}</td><td>${app.scorePerformance || '0.000'}</td><td>${app.scoreOutstandingAccomplishments || '0'}</td>
        <td>${app.scoreApplicationOfEducation || '0.0'}</td><td>${app.scoreApplicationOfLD || '0'}</td><td>${app.scorePotential || '0.0'}</td>
        <td>${app.assessmentTotal !== null ? Number(app.assessmentTotal).toFixed(3) : '0.000'}</td>
        <td>${escapeHtml(remarks)}</td><td></td><td></td><td></td><td></td>
    </tr>`;
            count++;
        }

        const sigNames = ['AZOR B. QUIJANO', 'ANA MALOU S. SALOMSOM', 'JOHN ANTHONY C. BALOS', 'GUILLERMO L. FUENTES', 'ROBERTO D. DECHOS, JR.', 'MYRA P. MEBATO, CESO VI', 'JONATHAN S. DELA PEÑA, PhD, CESO V'];
        const sigTitles = ['Administrative Officer IV', 'Administrative Officer V', 'Accountant III', 'Public Schools District Supervisor', 'Chief Education Supervisor', 'Assistant Schools Division Superintendent', 'Schools Division Superintendent'];
        const sigOffices = ['Personnel', 'Budget Officer III', 'Finance', 'ICPSTEA President', 'SGOD', 'HRMPSB Chairperson', 'Appointing Authority'];
        const sigMembers = ['HRMPSB Member', 'HRMPSB Member', 'HRMPSB Member', 'HRMPSB Member', 'HRMPSB Member', '', ''];

        let row1 = '&nbsp;'.repeat(35), row2 = '&nbsp;'.repeat(33), row3 = '&nbsp;'.repeat(45), row4 = '&nbsp;'.repeat(38);
        for (let i = 0; i < 7; i++) {
            let colWidth = sigNames[i].length + 40;
            
            row1 += `<span style="font-weight: bold; text-decoration: underline;">${sigNames[i]}</span>`;
            row2 += sigTitles[i];
            row3 += sigOffices[i];
            if (sigMembers[i]) row4 += sigMembers[i];
            
            if (i < 6) {
                let pad1 = colWidth - sigNames[i].length;
                let pad2 = Math.max(2, colWidth - sigTitles[i].length);
                let pad3 = Math.max(2, colWidth - sigOffices[i].length);
                let pad4 = Math.max(2, colWidth - (sigMembers[i] ? sigMembers[i].length : 0));
                
                if (i === 0) pad2 += 14;
                if (i === 1) pad2 += 23;
                if (i === 2) pad2 += 5;
                if (i === 3) pad2 += 15;
                if (i === 4) pad2 += 3;
                if (i === 5) pad2 += 23;

                if (i === 0) pad3 += 16;
                if (i === 1) pad3 += 28;
                if (i === 2) pad3 += 14;
                if (i === 3) pad3 += 23;
                if (i === 4) pad3 += 10;
                if (i === 5) pad3 += 26;

                if (i === 0) pad4 += 12;
                if (i === 1) pad4 += 14;
                if (i === 2) pad4 += 11;
                if (i === 3) pad4 += 11;

                row1 += '&nbsp;'.repeat(pad1);
                row2 += '&nbsp;'.repeat(pad2);
                row3 += '&nbsp;'.repeat(pad3);
                if (i < 5) row4 += '&nbsp;'.repeat(pad4);
            }
        }

        html += `
    <tr class="no-border"><td colspan="17">&nbsp;</td></tr>
    <tr class="no-border">
        <td colspan="6">Prepared by the HRMPSB</td>
        <td colspan="11"></td>
    </tr>
    <tr class="no-border">
        <td colspan="6">(All members should affix signature)</td>
        <td colspan="7"></td>
        <td colspan="4">Appointment conferred by:</td>
    </tr>
    <tr class="no-border"><td colspan="17">&nbsp;</td></tr>
    <tr class="no-border"><td colspan="17">&nbsp;</td></tr>
    <tr class="no-border"><td colspan="17">&nbsp;</td></tr>
    <tr class="no-border"><td colspan="17">&nbsp;</td></tr>
    <tr class="no-border">
        <td colspan="17" style="text-align: left; vertical-align: top; font-size: 9pt;">
            ${row1}<br>
            ${row2}<br>
            ${row3}<br>
            ${row4}
        </td>
    </tr>
    <tr></tr>
</table>
<table>
    <tr class="no-border">
        <td colspan="17" style="font-weight: bold;">&nbsp;&nbsp;&nbsp;Notes and Instructions for the HRMO:</td>
    </tr>
    <tr class="no-border">
        <td colspan="17">&nbsp;&nbsp;&nbsp;a) For the purpose of posting the CAR, Column C (Name of the applicant) and Columns N to R (Remarks to Probation status) shall be concealed in accordance with RA No. 10163 (Data Privacy Act). The only information that shall be made public are the Application Code, Comparative Assessment Results (Component from Education to Potential) and the total scores of the applicants.</td>
    </tr>
    <tr class="no-border">
        <td colspan="17">&nbsp;&nbsp;&nbsp;b) If the information does not apply to the applicant, please put N/A.</td>
    </tr>
    <tr class="no-border">
        <td colspan="17">&nbsp;&nbsp;&nbsp;c) Applicants who failed to appear in any phase of the Open Ranking process and other evaluative assessments, and/or have withdrawn their application shall be provided with a notation beside the application code (e.g., withdrawn application, etc.)</td>
    </tr>
</table>
</body>
</html>`;
        const dateStr = `${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}`;
        const filename = positionFilter ? `${positionFilter.replace(/[^a-zA-Z0-9-]/g, '-')}-CAR-${dateStr}.xls` : `CAR-${dateStr}.xls`;
        res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(html);
        const exportTime = Date.now() - startTime;
        console.log(`[${new Date().toLocaleString()}] ${applicants.length} applicants_${filename} has been exported - took ${exportTime}ms`);
    } catch (error) { console.error(error); res.status(500).send('Error generating CAR CSV'); }
});

async function ensureRequirementColumns() {
    const [columns] = await db.query(`SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'applicants'`, [process.env.DB_NAME || 'rsp_db']);
    const existingColumns = new Set(columns.map((column) => column.COLUMN_NAME));
    const missingColumns = requirementFields.filter((field) => !existingColumns.has(field));
    for (const column of missingColumns) await db.query(`ALTER TABLE applicants ADD COLUMN ${column} BOOLEAN DEFAULT FALSE AFTER contactNo`);
    if (!existingColumns.has('cc')) await db.query(`ALTER TABLE applicants ADD COLUMN cc VARCHAR(255) DEFAULT NULL`);
    if (!existingColumns.has('ccDesignation')) await db.query(`ALTER TABLE applicants ADD COLUMN ccDesignation VARCHAR(255) DEFAULT NULL`);
}

async function startServer() {
    try {
        await ensureRequirementColumns();
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to initialize requirement columns:', error.message);
        process.exit(1);
    }
}

startServer();
