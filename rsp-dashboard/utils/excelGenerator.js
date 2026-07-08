const escapeHtml = (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function generateIERHtml(exportType, positionFilter, posData, applicants, allEdu, allTrain, allExp, allElig) {
    const vAnnounce = posData?.vacancyAnnouncement || '';
    const pItem = posData?.plantillaItem || '';
    const sGrade = posData?.salaryGrade || '';
    const qsEdu = posData?.qsEducation || '';
    const qsTrain = posData?.qsTraining || '';
    const qsExp = posData?.qsExperience || '';
    const qsElig = posData?.qsEligibility || '';

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
        <th rowspan="2" style="width: 3%;">No.</th><th rowspan="2" style="width: 8%;">Application<br>Code${(exportType === 'withName' || exportType === 'withDetails') ? '<br>& Name' : ''}</th><th rowspan="2" style="width: 24%;">Education</th>
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

        let appName = `${escapeHtml(app.lastName || '')}, ${escapeHtml(app.firstName || '')}`;
        if (app.nameExtension) appName += ` ${escapeHtml(app.nameExtension)}`;
        if (app.middleName) appName += ` ${escapeHtml(app.middleName)}`;
        appName = appName.replace(/^,\s*/, '').trim();

        let extraDetails = '';
        if (exportType === 'withName' || exportType === 'true') {
            extraDetails = `<br><b>${appName}</b>`;
        } else if (exportType === 'withDetails') {
            extraDetails = `<br><b>${appName}</b><br><span style="font-size: 8pt; font-weight: normal;">Sex: ${escapeHtml(app.sex || 'N/A')}<br>Status: ${escapeHtml(app.civilStatus || 'N/A')}<br>Contact: ${escapeHtml(app.contactNumber || 'N/A')}<br>Address: ${escapeHtml(app.address || 'N/A')}</span>`;
        }

        html += `
    <tr class="bordered">
        <td>${count}</td>
        <td>${escapeHtml(app.applicationCode)}${extraDetails}</td>
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
    <tr class="no-border"><td colspan="9">&nbsp;&nbsp;&nbsp;a) For the purpose of posting the IER, Column C (Name of the applicant) and Column L (Remarks) shall be concealed in accordance with RA No. 10163 (Data Privacy Act). The only information that shall be made public are the Application Code, Education, Training, Experience, Eligibility, and the Remarks (Qualified or Disqualified).</td></tr>
    <tr class="no-border"><td colspan="9">&nbsp;&nbsp;&nbsp;b) If the information does not apply to the applicant, please put N/A.</td></tr>
</table>
</body>
</html>`;
    return html;
}

function generateCARHtml(exportType, positionFilter, posData, applicants) {
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

    const hideNameColumn = exportType === 'withoutName';
    const totalCols = hideNameColumn ? 16 : 17;

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
    <tr class="no-border"><td colspan="${totalCols - 4}"></td><td colspan="4" style="text-align: right; font-weight: bold; font-size: 14pt;">Annex H</td></tr>
    <tr class="no-border"><td colspan="${totalCols}" style="text-align: center; font-size: 16pt; font-weight: bold;">COMPARATIVE ASSESSMENT RESULT (CAR)</td></tr>
    <tr class="no-border" style="font-size: 12pt;">
        <td colspan="${totalCols - 6}">Position: <span style="font-weight: bold;">${escapeHtml(positionFilter)}</span></td><td colspan="6" style="text-align: right;">Plantilla Item Number: ${escapeHtml(formattedPlantilla)}</td>
    </tr>
    <tr class="no-border" style="font-size: 12pt;">
        <td colspan="${totalCols - 6}"><span style="font-weight: bold;">Office/Bureau/Service/Unit where the vacancy exists: <u>Public Elementary and Secondary Schools in Iligan City</u></span></td>
        <td colspan="6" style="text-align: right;">Date of Final Deliberation: </td>
    </tr>
    <tr class="no-border"><td colspan="${totalCols}">&nbsp;</td></tr>
    <tr class="bordered" style="font-size: 11pt;">
        <th rowspan="3" style="width: 3%;">No.</th>
        ${!hideNameColumn ? '<th rowspan="3" style="width: 15%;">Applicant Name</th>' : ''}
        <th rowspan="3" style="width: 15%;">Application Code</th><th colspan="9">COMPARATIVE ASSESSMENT RESULTS</th>
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
        appName = appName.replace(/^,\s*/, '').trim();
        let remarks = '';
        if (app.status === 'NO_APPEARANCE') remarks = 'No Appearance';
        else if (app.status === 'NEWLY_PROMOTED') remarks = 'Newly Promoted';

        let extraDetails = '';
        if (exportType === 'withDetails') {
            extraDetails = `<br><span style="font-size: 8pt; font-weight: normal;">Sex: ${escapeHtml(app.sex || 'N/A')}<br>Status: ${escapeHtml(app.civilStatus || 'N/A')}<br>Contact: ${escapeHtml(app.contactNumber || 'N/A')}<br>Address: ${escapeHtml(app.address || 'N/A')}</span>`;
        }

        html += `
    <tr class="bordered">
        <td>${count}</td>
        ${!hideNameColumn ? `<td>${appName}${extraDetails}</td>` : ''}
        <td>${escapeHtml(app.applicationCode)}${hideNameColumn ? extraDetails : ''}${remarks ? `<br>"${escapeHtml(remarks)}"` : ''}</td>
        <td>${app.scoreEducation || '0.0'}</td><td>${app.scoreTraining || '0.0'}</td>
        <td>${app.scoreExperience || '0.0'}</td><td>${app.scorePerformance || '0.000'}</td><td>${app.scoreOutstandingAccomplishments || '0'}</td>
        <td>${app.scoreApplicationOfEducation || '0.0'}</td><td>${app.scoreApplicationOfLD || '0'}</td><td>${app.scorePotential || '0.0'}</td>
        <td>${app.assessmentTotal !== null ? Number(app.assessmentTotal).toFixed(3) : '0.000'}</td>
        <td></td><td></td><td></td><td></td><td></td>
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
    <tr class="no-border"><td colspan="${totalCols}">&nbsp;</td></tr>
    <tr class="no-border">
        <td colspan="6">Prepared by the HRMPSB</td>
        <td colspan="${totalCols - 6}"></td>
    </tr>
    <tr class="no-border">
        <td colspan="6">(All members should affix signature)</td>
        <td colspan="${totalCols - 10}"></td>
        <td colspan="4">Appointment conferred by:</td>
    </tr>
    <tr class="no-border"><td colspan="${totalCols}">&nbsp;</td></tr>
    <tr class="no-border"><td colspan="${totalCols}">&nbsp;</td></tr>
    <tr class="no-border"><td colspan="${totalCols}">&nbsp;</td></tr>
    <tr class="no-border"><td colspan="${totalCols}">&nbsp;</td></tr>
    <tr class="no-border">
        <td colspan="${totalCols}" style="text-align: left; vertical-align: top; font-size: 9pt;">
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
        <td colspan="${totalCols}" style="font-weight: bold;">&nbsp;&nbsp;&nbsp;Notes and Instructions for the HRMO:</td>
    </tr>
    <tr class="no-border">
        <td colspan="${totalCols}">&nbsp;&nbsp;&nbsp;a) For the purpose of posting the CAR, Column C (Name of the applicant) and Columns N to R (Remarks to Probation status) shall be concealed in accordance with RA No. 10163 (Data Privacy Act). The only information that shall be made public are the Application Code, Comparative Assessment Results (Component from Education to Potential) and the total scores of the applicants.</td>
    </tr>
    <tr class="no-border">
        <td colspan="${totalCols}">&nbsp;&nbsp;&nbsp;b) If the information does not apply to the applicant, please put N/A.</td>
    </tr>
    <tr class="no-border">
        <td colspan="${totalCols}">&nbsp;&nbsp;&nbsp;c) Applicants who failed to appear in any phase of the Open Ranking process and other evaluative assessments, and/or have withdrawn their application shall be provided with a notation beside the application code (e.g., withdrawn application, etc.)</td>
    </tr>
</table>
</body>
</html>`;
    return html;
}

module.exports = {
    generateIERHtml,
    generateCARHtml
};
