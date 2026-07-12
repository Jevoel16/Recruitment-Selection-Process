const escapeHtml = (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const toTitleCase = (str) => {
    if (!str || typeof str !== 'string') return str;
    if (str.toUpperCase() === 'N/A') return 'N/A';
    return str.split(' ').map(word => {
        if (!word) return '';
        // Keep roman numerals and common acronyms if they are all caps? Let's just strictly apply Title Case as requested, but handle hyphens/slashes.
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
};

const escapeTitle = (str) => escapeHtml(toTitleCase(str));

function generateIERHtml(exportType, positionFilter, posData, applicants, allEdu, allTrain, allExp, allElig) {
    const vAnnounce = posData?.vacancyAnnouncement || '';
    const pItem = posData?.plantillaItem || '';
    const sGrade = posData?.salaryGrade || '';
    let mSalary = posData?.monthlySalary || '';
    if (mSalary && !isNaN(mSalary.toString().replace(/,/g, ''))) {
        mSalary = Number(mSalary.toString().replace(/,/g, '')).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }
    const qsEdu = posData?.qsEducation || '';
    const qsTrain = posData?.qsTraining || '';
    const qsExp = posData?.qsExperience || '';
    const qsElig = posData?.qsEligibility || '';

    const showName = (exportType === 'withName' || exportType === 'withDetails' || exportType === 'true');
    const showDetails = (exportType === 'withDetails');
    const totalCols = showDetails ? 18 : (showName ? 10 : 9);

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
  body, table { font-family: 'Bookman Old Style', serif; font-size: 9pt; }
  table { border-collapse: collapse; width: 100%; page-break-inside: auto; }
  tr { page-break-inside: avoid; page-break-after: auto; }
  .no-border td, .no-border th { border: none !important; text-align: left; vertical-align: top; }
  .bordered td, .bordered th { border: 1px solid black; text-align: center; vertical-align: middle; padding: 4px; }
  .title-row td { text-align: center; font-size: 18pt; font-weight: bold; }
  .annex-row td { text-align: right; font-weight: bold; font-size: 14pt; }
  .text-bold { font-weight: bold; }
  .val-underline { font-weight: bold; text-decoration: underline; }
</style>
</head>
<body>
<table>
    <tr class="no-border"><td colspan="${totalCols - 2}"></td><td colspan="2" style="text-align: right; font-weight: bold; font-size: 14pt;">Annex D</td></tr>
    <tr class="no-border"><td colspan="${totalCols}" style="text-align: center; font-size: 16pt; font-weight: bold;">INITIAL EVALUATION RESULT (IER)</td></tr>
    <tr class="no-border" style="font-size: 12pt;"><td colspan="${totalCols}">Position: <u><b>${escapeHtml(positionFilter)}</b></u></td></tr>
    <tr class="no-border" style="font-size: 12pt;"><td colspan="${totalCols}">VACANCY ANNOUNCEMENT NO. <u><b>${escapeHtml(vAnnounce)}</b></u></td></tr>
    <tr class="no-border" style="font-size: 12pt;"><td colspan="${totalCols}">PLANTILLA ITEM/S NUMBER: <u><b>${escapeHtml(pItem)}</b></u></td></tr>
    <tr class="no-border" style="font-size: 12pt;"><td colspan="${totalCols}">Salary Grade and Monthly Salary: <u><b>SG ${escapeHtml(sGrade)} - ${escapeHtml(mSalary)}</b></u></td></tr>
    <tr class="no-border" style="font-size: 12pt;"><td colspan="${totalCols}">Qualification Standards:</td></tr>
    <tr class="no-border" style="font-size: 12pt;"><td colspan="${totalCols}">&nbsp;&nbsp;&nbsp;&nbsp;Education: <u><b>${escapeHtml(qsEdu)}</b></u></td></tr>
    <tr class="no-border" style="font-size: 12pt;"><td colspan="${totalCols}">&nbsp;&nbsp;&nbsp;&nbsp;Training: <u><b>${escapeHtml(qsTrain)}</b></u></td></tr>
    <tr class="no-border" style="font-size: 12pt;"><td colspan="${totalCols}">&nbsp;&nbsp;&nbsp;&nbsp;Experience: <u><b>${escapeHtml(qsExp)}</b></u></td></tr>
    <tr class="no-border" style="font-size: 12pt;"><td colspan="${totalCols}">&nbsp;&nbsp;&nbsp;&nbsp;Eligibility: <u><b>${escapeHtml(qsElig)}</b></u></td></tr>
    <tr class="no-border"><td colspan="${totalCols}">&nbsp;</td></tr>
    <tr class="bordered" style="font-size: 12pt;">
        <th rowspan="2" style="width: 3%;">No.</th>
        <th rowspan="2" style="width: 8%;">Application<br>Code</th>
        ${showName ? '<th rowspan="2" style="width: 15%;">Name</th>' : ''}
        ${showDetails ? '<th colspan="9" style="width: 30%;">Personal Information</th>' : ''}
        <th rowspan="2" style="width: 24%;">Education</th>
        <th colspan="2" style="width: 28%;">Training</th><th colspan="2" style="width: 19%;">Experience</th><th rowspan="2" style="width: 10%;">Eligibility</th>
        <th rowspan="2" style="width: 8%;">Remarks<br>(Qualified or<br>Disqualified)</th>
    </tr>
    <tr class="bordered" style="font-size: 12pt;">
        ${showDetails ? '<th style="width: 6%;">Birthdate</th><th style="width: 4%;">Sex</th><th style="width: 6%;">Civil Status</th><th style="width: 6%;">Religion</th><th style="width: 6%;">Disability</th><th style="width: 6%;">Ethnic Group</th><th style="width: 8%;">Email Address</th><th style="width: 8%;">Contact No.</th><th style="width: 15%;">Address</th>' : ''}
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
        const trainHoursStr = train.length ? train.map(t => escapeHtml(t.hours)).join('<br>') : 'N/A';
        const expDetailsStr = exp.length ? exp.map(e => escapeHtml(e.details)).join('<br>') : 'N/A';
        const expYearsStr = exp.length ? exp.map(e => {
            let parts = [];
            if (e.years > 0) parts.push(e.years + (e.years == 1 ? " year" : " years"));
            if (e.months > 0) parts.push(e.months + (e.months == 1 ? " month" : " months"));
            return escapeHtml(parts.length > 0 ? parts.join(" & ") : "0 years");
        }).join('<br>') : 'N/A';
        const eligStr = elig.length ? elig.map(e => escapeHtml(e.details) + (e.rating ? ' (' + escapeHtml(e.rating) + ')' : '')).join('<br>') : 'N/A';
        
        const eduHasDisq = edu.some(e => e.status === 'DISQUALIFIED');
        const trainHasDisq = train.some(t => t.status === 'DISQUALIFIED');
        const expHasDisq = exp.some(e => e.status === 'DISQUALIFIED');
        const eligHasDisq = elig.some(e => e.status === 'DISQUALIFIED');

        let remarks = app.status === 'QUALIFIED' ? 'QUALIFIED' : (app.status === 'DISQUALIFIED' ? 'DISQUALIFIED' : '');
        let remarksStyle = remarks === 'DISQUALIFIED' ? 'color: red;' : '';

        let appName = `${escapeTitle(app.lastName || '')}, ${escapeTitle(app.firstName || '')}`;
        if (app.nameExtension) appName += ` ${escapeTitle(app.nameExtension)}`;
        if (app.middleName) {
            const mi = app.middleName.trim().charAt(0).toUpperCase();
            if (mi) appName += `, ${mi}.`;
        }
        appName = appName.replace(/^,\s*/, '').replace(/,\s*,/g, ',').trim();

        let extraDetails = '';
        if (showName) {
            extraDetails = `<b>${appName}</b>`;
        }
        
        let detailsHtml = '';
        if (showDetails) {
            let birthdate = 'N/A';
            if (app.birthdate) {
                const b = new Date(app.birthdate);
                if (!isNaN(b)) birthdate = escapeHtml(b.toISOString().split('T')[0]);
            }
            let sexVal = 'N/A';
            if (app.sex) {
                if (app.sex.toLowerCase() === 'male') sexVal = 'M';
                else if (app.sex.toLowerCase() === 'female') sexVal = 'F';
                else sexVal = escapeHtml(app.sex);
            }

            let addressStr = 'N/A';
            if (app.address) {
                try {
                    const parsedObj = JSON.parse(app.address);
                    let parts = [];
                    if (parsedObj.res_barangay) parts.push(parsedObj.res_barangay);
                    if (parsedObj.res_city) parts.push(parsedObj.res_city);
                    addressStr = parts.length > 0 ? parts.join(', ') : app.address;
                } catch(e) {
                    addressStr = app.address;
                }
            }

            detailsHtml = `
                <td>${birthdate}</td>
                <td>${sexVal}</td>
                <td>${escapeTitle(app.civilStatus || 'N/A')}</td>
                <td>${escapeTitle(app.religion || 'N/A')}</td>
                <td>${escapeTitle(app.disability || 'N/A')}</td>
                <td>${escapeTitle(app.ethnicGroup || 'N/A')}</td>
                <td>${escapeHtml(app.emailAddress || 'N/A')}</td>
                <td style="mso-number-format:'\\@';">${escapeHtml(app.contactNo || 'N/A')}</td>
                <td>${escapeTitle(addressStr)}</td>
            `;
        }

        html += `
    <tr class="bordered">
        <td>${count}</td>
        <td>${escapeHtml(app.applicationCode)}</td>
        ${showName ? `<td>${extraDetails}</td>` : ''}
        ${showDetails ? detailsHtml : ''}
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

    const notesColspan = Math.min(totalCols, 10);
    html += `
    <tr class="no-border"><td colspan="${totalCols}">&nbsp;</td></tr>
    <tr class="no-border" style="font-size: 12pt;"><td colspan="${totalCols - 2}"></td><td colspan="2" style="text-align: left;">Prepared and certified correct by:</td></tr>
    <tr class="no-border"><td colspan="${totalCols}">&nbsp;</td></tr>
    <tr class="no-border" style="font-size: 12pt;"><td colspan="${totalCols - 2}"></td><td colspan="2" style="text-align: center; font-weight: bold; text-decoration: underline;">AZOR B. QUIJANO</td></tr>
    <tr class="no-border" style="font-size: 12pt;"><td colspan="${totalCols - 2}"></td><td colspan="2" style="text-align: center;">Administrative Officer IV (Personnel)</td></tr>
    <tr class="no-border" style="font-size: 12pt;"><td colspan="${totalCols - 2}"></td><td colspan="2" style="text-align: center;">Date: ${currentDateStr}</td></tr>
    <tr class="no-border"><td colspan="${totalCols}">&nbsp;</td></tr>
    <tr class="no-border"><td colspan="${notesColspan}" style="font-weight: bold;">Notes and Instructions for the HRMO:</td></tr>
    ${showDetails ? 
    `<tr class="no-border"><td colspan="${notesColspan}">&nbsp;&nbsp;&nbsp;a) For the purpose of posting the IER, columns D to M shall be concealed in accordance with RA No. 10163 (Data Privacy Act). The only information that shall be made public are the application codes, qualifications of the applicants in terms of Education, Training, Experience, Eligibility, and Competency (if applicable), and remark on whether Qualified or Disqualified</td></tr>` : 
    `<tr class="no-border"><td colspan="${notesColspan}">&nbsp;&nbsp;&nbsp;a) For the purpose of posting the IER, Column C (Name of the applicant) and the Remarks shall be concealed in accordance with RA No. 10163 (Data Privacy Act). The only information that shall be made public are the Application Code, Education, Training, Experience, Eligibility, and the Remarks (Qualified or Disqualified).</td></tr>`}
    <tr class="no-border"><td colspan="${notesColspan}">&nbsp;&nbsp;&nbsp;b) If the information does not apply to the applicant, please put N/A.</td></tr>
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
    const totalCols = 20;

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
  body, table { font-family: 'Bookman Old Style', serif; font-size: 9pt; }
  table { border-collapse: collapse; width: 100%; page-break-inside: auto; }
  tr { page-break-inside: avoid; page-break-after: auto; }
  .no-border td, .no-border th { border: none !important; text-align: left; vertical-align: top; white-space: normal; mso-text-control: wrap; }
  .bordered td, .bordered th { border: 1px solid black; text-align: center; vertical-align: middle; padding: 4px; white-space: normal; word-wrap: break-word; mso-text-control: wrap; }
  .boxed-table { border: 2pt solid black; table-layout: fixed; width: 100%; }
</style>
</head>
<body>
<table class="boxed-table">
    <colgroup>
        <col width="13" style="width: 9.75pt;">
        <col width="52" style="width: 39pt;">
        <col width="74" style="width: 55.5pt;">
        <col width="241" style="width: 180.75pt;">
        <col width="236" style="width: 177pt;">
        <col width="124" style="width: 93pt;">
        <col width="122" style="width: 91.5pt;">
        <col width="122" style="width: 91.5pt;">
        <col width="124" style="width: 93pt;">
        <col width="178" style="width: 133.5pt;">
        <col width="122" style="width: 91.5pt;">
        <col width="133" style="width: 99.75pt;">
        <col width="122" style="width: 91.5pt;">
        <col width="122" style="width: 91.5pt;">
        <col width="277" style="width: 207.75pt;">
        <col width="85" style="width: 63.75pt;">
        <col width="85" style="width: 63.75pt;">
        <col width="149" style="width: 111.75pt;">
        <col width="194" style="width: 145.5pt;">
        <col width="18" style="width: 13.5pt;">
    </colgroup>
    <tr style="height: 0; mso-height-source: userset; border: none;">
        <td width="13" style="width: 9.75pt; height: 0; padding: 0; border: none;"></td>
        <td width="52" style="width: 39pt; height: 0; padding: 0; border: none;"></td>
        <td width="74" style="width: 55.5pt; height: 0; padding: 0; border: none;"></td>
        <td width="241" style="width: 180.75pt; height: 0; padding: 0; border: none;"></td>
        <td width="236" style="width: 177pt; height: 0; padding: 0; border: none;"></td>
        <td width="124" style="width: 93pt; height: 0; padding: 0; border: none;"></td>
        <td width="122" style="width: 91.5pt; height: 0; padding: 0; border: none;"></td>
        <td width="122" style="width: 91.5pt; height: 0; padding: 0; border: none;"></td>
        <td width="124" style="width: 93pt; height: 0; padding: 0; border: none;"></td>
        <td width="178" style="width: 133.5pt; height: 0; padding: 0; border: none;"></td>
        <td width="122" style="width: 91.5pt; height: 0; padding: 0; border: none;"></td>
        <td width="133" style="width: 99.75pt; height: 0; padding: 0; border: none;"></td>
        <td width="122" style="width: 91.5pt; height: 0; padding: 0; border: none;"></td>
        <td width="122" style="width: 91.5pt; height: 0; padding: 0; border: none;"></td>
        <td width="277" style="width: 207.75pt; height: 0; padding: 0; border: none;"></td>
        <td width="85" style="width: 63.75pt; height: 0; padding: 0; border: none;"></td>
        <td width="85" style="width: 63.75pt; height: 0; padding: 0; border: none;"></td>
        <td width="149" style="width: 111.75pt; height: 0; padding: 0; border: none;"></td>
        <td width="194" style="width: 145.5pt; height: 0; padding: 0; border: none;"></td>
        <td width="18" style="width: 13.5pt; height: 0; padding: 0; border: none;"></td>
    </tr>
    <tr class="no-border"><td colspan="17"></td><td colspan="1" style="text-align: right; font-weight: bold; font-size: 14pt;">Annex H</td><td colspan="2"></td></tr>
    <tr class="no-border"><td colspan="${totalCols}" style="text-align: center; font-size: 16pt; font-weight: bold;">COMPARATIVE ASSESSMENT RESULT (CAR)</td></tr>
    <tr class="no-border" style="font-size: 12pt;">
        <td colspan="10"><b>Position:</b> <b><u>${escapeHtml(positionFilter)}</u></b></td>
        <td colspan="5" style="text-align: left;"><b>Plantilla Item Number:</b></td>
        <td colspan="5" style="text-align: left;"><b>${escapeHtml(formattedPlantilla)}</b></td>
    </tr>
    <tr class="no-border" style="font-size: 12pt;">
        <td colspan="10"><span style="font-weight: bold;">Office/Bureau/Service/Unit where the vacancy exists: <u>Public Elementary and Secondary Schools in Iligan City</u></span></td>
        <td colspan="5" style="text-align: left;"><b>Date of Final Deliberation:</b></td>
        <td colspan="5" style="text-align: left;"></td>
    </tr>
    <tr class="no-border"><td colspan="${totalCols}">&nbsp;</td></tr>
    <tr class="bordered" style="font-size: 11pt;">
        <th rowspan="3" class="no-border"></th>
        <th colspan="3" rowspan="3">Name of Applicant</th>
        <th rowspan="3">Application Code</th><th colspan="9">COMPARATIVE ASSESSMENT RESULTS</th>
        <th rowspan="3">Remarks</th><th colspan="2" rowspan="2">For Background Investigation (Y/N)</th>
        <th rowspan="3">For Appointment <span style="font-size: 9pt; font-weight: normal; font-style: italic;">(To filled-out by the Appointing Officer/Authority; Please sign opposite the name of the applicant)</span></th>
        <th rowspan="3">For probation <span style="font-size: 9pt; font-weight: normal; font-style: italic;">Please identify period of Probation (6 months or 1 year) if nature of appointment falls under the purview of Item 73 of DO No. 19, s. 2022</span></th>
        <th rowspan="3" class="no-border"></th>
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
            extraDetails = `<br><span style="font-size: 8pt; font-weight: normal;">Sex: ${escapeHtml(app.sex || 'N/A')}<br>Status: ${escapeHtml(app.civilStatus || 'N/A')}<br>Contact: ${escapeHtml(app.contactNo || 'N/A')}<br>Address: ${escapeHtml(app.address || 'N/A')}</span>`;
        }

        html += `
    <tr class="bordered">
        <td class="no-border"></td>
        <td>${count}</td>
        <td colspan="2">${!hideNameColumn ? appName + extraDetails : ''}</td>
        <td>${escapeHtml(app.applicationCode)}${hideNameColumn ? extraDetails : ''}${remarks ? `<br>"${escapeHtml(remarks)}"` : ''}</td>
        <td>${app.scoreEducation || '0.0'}</td><td>${app.scoreTraining || '0.0'}</td>
        <td>${app.scoreExperience || '0.0'}</td><td>${app.scorePerformance || '0.000'}</td><td>${app.scoreOutstandingAccomplishments || '0'}</td>
        <td>${app.scoreApplicationOfEducation || '0.0'}</td><td>${app.scoreApplicationOfLD || '0'}</td><td>${app.scorePotential || '0.0'}</td>
        <td>${app.assessmentTotal !== null ? Number(app.assessmentTotal).toFixed(3) : '0.000'}</td>
        <td></td><td></td><td></td><td></td><td></td>
        <td class="no-border"></td>
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

function generateVERHtml(items) {
    let rowsHtml = '';
    
    for (const item of items) {
        let mSalary = item.salary || '';
        if (mSalary && !isNaN(mSalary.toString().replace(/,/g, ''))) {
            mSalary = Number(mSalary.toString().replace(/,/g, '')).toLocaleString('en-US', {minimumFractionDigits: 0});
        }
        rowsHtml += `
        <tr class="bordered content-row">
            <td style="vertical-align: top;">${item.no}</td>
            <td style="vertical-align: top;">${escapeHtml(item.title)}</td>
            <td style="vertical-align: top;">${escapeHtml(item.itemNo)}</td>
            <td style="vertical-align: top;">${escapeHtml(item.sg)}</td>
            <td style="vertical-align: top;">${escapeHtml(mSalary)}</td>
            <td style="vertical-align: top;">${escapeHtml(item.edu)}</td>
            <td style="vertical-align: top;">${escapeHtml(item.train)}</td>
            <td style="vertical-align: top;">${escapeHtml(item.exp)}</td>
            <td style="vertical-align: top;">${escapeHtml(item.elig)}</td>
            <td style="vertical-align: top;">${escapeHtml(item.comp)}</td>
            <td style="vertical-align: top;">${escapeHtml(item.assignment)}</td>
        </tr>`;
    }

    let tablesHtml = `
<table>
    <!-- Column Widths to make it compact -->
    <col width="30">  <!-- No -->
    <col width="110"> <!-- Position Title -->
    <col width="90">  <!-- Plantilla -->
    <col width="40">  <!-- SG -->
    <col width="50">  <!-- Salary -->
    <col width="120"> <!-- Edu -->
    <col width="100"> <!-- Train -->
    <col width="100"> <!-- Exp -->
    <col width="100"> <!-- Elig -->
    <col width="120"> <!-- Comp -->
    <col width="90">  <!-- Assign -->

    <tr class="no-border">
        <td colspan="5">CS Form No. 9<br>Revised 2025<br>Republic of the Philippines<br>DEPARTMENT OF EDUCATION<br>Request for Publication of Vacant Positions</td>
        <td colspan="6" style="text-align: right; vertical-align: top;">Electronic copy to be submitted to the CSC FO must be in MS Excel format</td>
    </tr>
    <tr class="no-border"><td colspan="11">&nbsp;</td></tr>
    <tr class="no-border"><td colspan="11">To: CIVIL SERVICE COMMISSION (CSC)</td></tr>
    <tr class="no-border"><td colspan="11">&nbsp;</td></tr>
    <tr class="no-border"><td colspan="11" style="white-space: normal;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;We hereby request the publication in the CSC Job Portal of the following vacant positions, which are authorized to be filled at the DEPARTMENT OF EDUCATION:</td></tr>
    <tr class="no-border"><td colspan="11">&nbsp;</td></tr>
    <tr class="no-border">
        <td colspan="5"></td>
        <td colspan="6" style="text-align: center;">AZOR B. QUIJANO<br>HRMO<br><br>Date: APRIL 10, 2026</td>
    </tr>
    <tr class="no-border"><td colspan="11">&nbsp;</td></tr>
    <tr class="bordered header-row">
        <th rowspan="2" style="width: 3%;">No.</th>
        <th rowspan="2" style="width: 12%;">Position Title (Parenthetical Title, if applicable)</th>
        <th rowspan="2" style="width: 10%;">Plantilla Item No.</th>
        <th rowspan="2" style="width: 5%;">Salary/ Job/ Pay Grade</th>
        <th rowspan="2" style="width: 5%;">Monthly Salary</th>
        <th colspan="5" style="width: 55%;">Qualification Standards</th>
        <th rowspan="2" style="width: 10%;">Place of Assignment</th>
    </tr>
    <tr class="bordered header-row">
        <th style="width: 12%;">Education</th>
        <th style="width: 11%;">Training</th>
        <th style="width: 11%;">Experience</th>
        <th style="width: 10%;">Eligibility</th>
        <th style="width: 11%;">Competency/ Area of Specialization/ Residency Requirement (if applicable)</th>
    </tr>
    ${rowsHtml}
    <tr class="no-border"><td colspan="11">&nbsp;</td></tr>
    <tr class="no-border">
        <td colspan="11" style="white-space: normal;">Interested and qualified applicants should signify their interest in writing through an application letter addressed to the head of office. Applicants must attach the following documents to the application letter and send these to the address below not later than April 20, 2026<br><br>
        1. Fully accomplished Personal Data Sheet (PDS) with Work Experience Sheet and recent passport-sized or unfiltered digital picture (CS Form No. 212, Revised 2025); digitally signed or electronically signed;<br>
        2. Photocopy or electronic copy of Performance rating in the last rating period (if applicable);<br>
        3. Photocopy or electronic copy of proof of eligibility/rating/license; and<br>
        4. Photocopy or electronic copy of Transcript of Records.<br>
        5. Letter of intent addressed to the Head of Office, or to the highest human resource officer designated by the Head of Office;<br>
        6. Photocopy of valid and updated PRC License/ID, if applicable;<br>
        7. Photocopy of Certificate/ s of Training, if applicable;<br>
        8. Photocopy of Certificate of Employment, Contract of Service, or duly signed Service Record, whichever is/are applicable;<br>
        9. Performance rating in the last rating period (if applicable);<br>
        10. Checklist of Requirements and Omnibus Sworn Statement on the Certification on the Authenticity and Veracity (CAV) of the documents submitted and Data Privacy Consent Form pursuant to RA No. 10173 (Data Privacy Act of 2012), notarized by authorized official; and<br>
        11. Other documents as may be required by the DepEd recruitment, selection and appointment guidelines as prescribed by DepEd Order 07 s. 2023 (Non-Teaching, Related Teaching, School Administration) or DepEd Order 20 s. 2024 (Higher Teaching Positions) for comparative assessment, including but not limited to:<br>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;a. Means of Verification (MOVs) showing Outstanding Accomplishments, Application of Education, and Application of Learning and Development reckoned from the date of last issuance of appointment.<br><br>
        This Office highly encourages all interested and qualified applicants to apply, which include persons with disability (PWD) and members of the indigenous communities, irrespective of sexual orientation and gender identities and/or expression, civil status, religion, and political affiliation.<br>
        This Office does not discriminate in the selection of employees based on the aforementioned pursuant to Equal Opportunities for Employment Principle (EOP).<br><br>
        QUALIFIED APPLICANTS are advised to hand in or send through courier/email their application to the head of office/ human resource management office/records office, as the case may be:<br><br>
        &nbsp;&nbsp;&nbsp;&nbsp;JONATHAN S. DELA PEÑA, PhD, CESO V<br>
        &nbsp;&nbsp;&nbsp;&nbsp;Schools Division Superintendent<br>
        &nbsp;&nbsp;&nbsp;&nbsp;DEPED - Iligan City, Aguinaldo St., Poblacion, Iligan City<br>
        &nbsp;&nbsp;&nbsp;&nbsp;recruitment.depediligan@gmail.com<br><br>
        APPLICATIONS WITH INCOMPLETE DOCUMENTS SHALL NOT BE ENTERTAINED.
        </td>
    </tr>
</table>
`;

    let html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head>
<meta charset="utf-8">
<!--[if gte mso 9]>
<xml>
 <x:ExcelWorkbook>
  <x:ExcelWorksheets>
   <x:ExcelWorksheet>
    <x:Name>VER</x:Name>
    <x:WorksheetOptions>
     <x:PageSetup>
      <x:Layout x:Orientation="Landscape"/>
     </x:PageSetup>
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
  @page { 
    mso-page-orientation: landscape; 
    size: landscape;
    margin: 0.5in; 
  }
  @page landscape_page {
    mso-page-orientation: landscape;
    size: landscape;
  }
  body { font-family: 'Arial', sans-serif; font-size: 11pt; }
  table { 
    page: landscape_page;
    border-collapse: collapse; 
    width: 100%; 
    page-break-inside: auto; 
    table-layout: fixed; 
  }
  tr { page-break-inside: avoid; page-break-after: auto; }
  .no-border td, .no-border th { border: none !important; text-align: left; vertical-align: top; white-space: normal; }
  .bordered td, .bordered th { border: 1px solid black; text-align: center; vertical-align: middle; padding: 4px; font-family: 'Times New Roman', serif; white-space: normal; word-wrap: break-word; }
  .header-row th { font-family: 'Times New Roman', serif; }
  .content-row td { font-family: 'Times New Roman', serif; }
</style>
</head>
<body style="mso-page-orientation: landscape;">
    ${tablesHtml}
</body>
</html>`;
    return html;
}

module.exports = {
    generateIERHtml,
    generateCARHtml,
    generateVERHtml
};
