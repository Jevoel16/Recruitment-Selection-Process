const ExcelJS = require('exceljs');

const escapeHtml = (str) => String(str || '');

const toTitleCase = (str) => {
    if (!str || typeof str !== 'string') return str;
    if (str.toUpperCase() === 'N/A') return 'N/A';
    return str.split(' ').map(word => {
        if (!word) return '';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
};

const calculateAge = (birthdate) => {
    if (!birthdate) return 'N/A';
    const b = new Date(birthdate);
    if (isNaN(b)) return 'N/A';
    const ageDifMs = Date.now() - b.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
};

async function generateIERExcelJS(exportType, positionFilter, posData, applicants, allEdu, allTrain, allExp, allElig) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'RSP Dashboard';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('IER', {
        pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, horizontalCentered: true },
        headerFooter: { oddFooter: '&RPage &P', evenFooter: '&RPage &P' }
    });
    sheet.pageSetup.margins = { left: 0.1181, right: 0.1181, top: 0.1575, bottom: 0.5, header: 0, footer: 0.2 };

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
    const totalCols = showDetails ? 20 : (showName ? 11 : 10);

    const baseFont = { name: 'Bookman Old Style', size: 10 };

    let cols = [];
    cols.push({ width: 6.0 }); // B (No.)
    cols.push({ width: 16.44 }); // C (App Code)
    
    if (showName) cols.push({ width: 32.22 }); // D (Name)
    
    if (showDetails) {
        cols.push({ width: 27.66 }); // E (Address)
        cols.push({ width: 8.78 }); // F (Age)
        cols.push({ width: 12.22 }); // G (Sex)
        cols.push({ width: 13.78 }); // H (Civil Status)
        cols.push({ width: 16.78 }); // I (Religion)
        cols.push({ width: 13.22 }); // J (Disability)
        cols.push({ width: 12.22 }); // K (Ethnic Group)
        cols.push({ width: 32.78 }); // L (Email Address)
        cols.push({ width: 18.0 }); // M (Contact No.)
    }
    
    cols.push({ width: 35.22 }); // N (Education)
    cols.push({ width: 46.22 }); // O (Training Title)
    cols.push({ width: 9.0 }); // P (Training Hours)
    cols.push({ width: 21.22 }); // Q (Experience Details)
    cols.push({ width: 12.22 }); // R (Experience Years)
    cols.push({ width: 21.0 }); // S (Eligibility)
    cols.push({ width: 21.78 }); // T (Remarks (Qualified or Disqualified))
    cols.push({ width: 21.78 }); // U (Remarks (Reason))

    sheet.columns = [{ width: 1.22 }, ...cols].map(c => ({ ...c, style: { font: { name: 'Bookman Old Style', size: 10 } } }));

    const maxColLetter = sheet.getColumn(totalCols + 1).letter;
    const annexColLetter = sheet.getColumn(totalCols).letter;

    // Headings
    sheet.getRow(1).height = 25;
    sheet.getCell(`${annexColLetter}1`).value = 'Annex D';
    sheet.getCell(`${annexColLetter}1`).font = { ...baseFont, bold: true, size: 18, italic: true };
    sheet.getCell(`${annexColLetter}1`).alignment = { horizontal: 'right' };

    sheet.getRow(2).height = 30;
    sheet.mergeCells(`B2:${maxColLetter}2`);
    sheet.getCell('B2').value = 'INITIAL EVALUATION RESULT (IER)';
    sheet.getCell('B2').font = { ...baseFont, bold: true, size: 20 };
    sheet.getCell('B2').alignment = { horizontal: 'center' };

    sheet.getRow(3).height = 15; // Spacer row
    let r = 4;
    const addField = (label, val, indent = '') => {
        sheet.mergeCells(`B${r}:${maxColLetter}${r}`);
        sheet.getCell(`B${r}`).value = {
            richText: [
                { font: { ...baseFont, size: 12 }, text: indent + label },
                { font: { ...baseFont, size: 12, bold: true, underline: true }, text: val }
            ]
        };
        sheet.getRow(r).height = 20;
        r++;
    };

    addField('Position: ', positionFilter);
    addField('VACANCY ANNOUNCEMENT NO. ', vAnnounce);

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

    let pItemsArr = [];
    if (posData?.plantillaItem) {
        try {
            const parsed = JSON.parse(posData.plantillaItem);
            if (Array.isArray(parsed)) {
                let all = [];
                parsed.forEach(p => {
                    if (p.items) all.push(...p.items.split(',').map(s => s.trim()).filter(s => s));
                });
                pItemsArr = all;
            } else {
                pItemsArr = posData.plantillaItem.split(',').map(s => s.trim()).filter(s => s);
            }
        } catch(e) {
            pItemsArr = posData.plantillaItem.split(',').map(s => s.trim()).filter(s => s);
        }
    }
    
    let firstLineItems = '';
    let subsequentLines = [];
    let currentLine = '';

    if (pItemsArr.length > 20) {
        firstLineItems = `${pItemsArr.length} ${getPositionCode(positionFilter)} Vacant Items`;
    } else {
        let i = 0;
        while(i < pItemsArr.length && (firstLineItems.length + pItemsArr[i].length + 2) < 124) {
            firstLineItems += pItemsArr[i] + ', ';
            i++;
        }
        
        while(i < pItemsArr.length) {
            if (currentLine.length + pItemsArr[i].length + 2 < 150) {
                currentLine += pItemsArr[i] + ', ';
                i++;
            } else {
                subsequentLines.push(currentLine);
                currentLine = pItemsArr[i] + ', ';
                i++;
            }
        }
        if (currentLine) subsequentLines.push(currentLine);
    }

    sheet.getCell(`B${r}`).value = {
        richText: [
            { font: { ...baseFont, size: 12 }, text: 'PLANTILLA ITEM/S NUMBER:  ' },
            { font: { ...baseFont, size: 12, bold: true, underline: true }, text: subsequentLines.length > 0 ? firstLineItems.trim() : firstLineItems.replace(/,\s*$/, '') }
        ]
    };
    sheet.getRow(r).height = 20;
    r++;
    for (let j = 0; j < subsequentLines.length; j++) {
        let sub = subsequentLines[j];
        let text = (j < subsequentLines.length - 1) ? sub.trim() : sub.replace(/,\s*$/, '');
        sheet.getCell(`C${r}`).value = text;
        sheet.getCell(`C${r}`).font = { ...baseFont, size: 12, bold: true, underline: true };
        sheet.getRow(r).height = 20;
        r++;
    }

    addField('Salary Grade and Monthly Salary: ', `SG ${sGrade} - ${mSalary}`);
    
    sheet.mergeCells(`B${r}:${maxColLetter}${r}`);
    sheet.getCell(`B${r}`).value = 'Qualification Standards:';
    sheet.getCell(`B${r}`).font = { ...baseFont, size: 12 };
    sheet.getRow(r).height = 20;
    r++;

    const addQS = (label, val) => {
        sheet.mergeCells(`C${r}:${maxColLetter}${r}`);
        sheet.getCell(`C${r}`).value = {
            richText: [
                { font: { ...baseFont, size: 11 }, text: label },
                { font: { ...baseFont, size: 11, bold: true, underline: true }, text: val }
            ]
        };
        sheet.getCell(`C${r}`).alignment = { wrapText: true, vertical: 'top' };
        if (val && val.length > 200) {
            sheet.getRow(r).height = 40;
        } else if (val && val.length > 130) {
            sheet.getRow(r).height = 30;
        } else {
            sheet.getRow(r).height = 20;
        }
        r++;
    };

    addQS('Education: ', qsEdu);
    addQS('Training: ', qsTrain);
    addQS('Experience: ', qsExp);
    addQS('Eligibility: ', qsElig);

    sheet.getRow(r).height = 20; r++; // Spacer

    const headerBorder = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    const centerAlign = { horizontal: 'center', vertical: 'middle', wrapText: true };

    const applyHeader = (range, value) => {
        sheet.mergeCells(range);
        const cell = sheet.getCell(range.split(':')[0]);
        cell.value = value;
        cell.font = { ...baseFont, bold: true, size: 12 };
        cell.alignment = centerAlign;
        
        const [startCell, endCell] = range.split(':');
        const startCol = sheet.getColumn(startCell.replace(/[0-9]/g, '')).number;
        const endCol = sheet.getColumn(endCell.replace(/[0-9]/g, '')).number;
        const startRow = parseInt(startCell.replace(/[A-Z]/g, ''));
        const endRow = parseInt(endCell.replace(/[A-Z]/g, ''));
        
        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                sheet.getRow(row).getCell(col).border = headerBorder;
            }
        }
    };

    const hr1 = r;
    const hr2 = r+1;
    sheet.getRow(hr1).height = 18;
    sheet.getRow(hr2).height = 52.2;
    
    let c = 2; // Start from B
    applyHeader(`${sheet.getColumn(c).letter}${hr1}:${sheet.getColumn(c).letter}${hr2}`, 'No.'); c++;
    applyHeader(`${sheet.getColumn(c).letter}${hr1}:${sheet.getColumn(c).letter}${hr2}`, 'Application Code'); c++;
    
    if (showName) {
        applyHeader(`${sheet.getColumn(c).letter}${hr1}:${sheet.getColumn(c).letter}${hr2}`, 'Names of Applicant'); c++;
    }
    
    if (showDetails) {
        applyHeader(`${sheet.getColumn(c).letter}${hr1}:${sheet.getColumn(c+8).letter}${hr1}`, 'Personal Information');
        applyHeader(`${sheet.getColumn(c).letter}${hr2}:${sheet.getColumn(c).letter}${hr2}`, 'Address'); c++;
        applyHeader(`${sheet.getColumn(c).letter}${hr2}:${sheet.getColumn(c).letter}${hr2}`, 'Age'); c++;
        applyHeader(`${sheet.getColumn(c).letter}${hr2}:${sheet.getColumn(c).letter}${hr2}`, 'Sex'); c++;
        applyHeader(`${sheet.getColumn(c).letter}${hr2}:${sheet.getColumn(c).letter}${hr2}`, 'Civil Status'); c++;
        applyHeader(`${sheet.getColumn(c).letter}${hr2}:${sheet.getColumn(c).letter}${hr2}`, 'Religion'); c++;
        applyHeader(`${sheet.getColumn(c).letter}${hr2}:${sheet.getColumn(c).letter}${hr2}`, 'Disability'); c++;
        applyHeader(`${sheet.getColumn(c).letter}${hr2}:${sheet.getColumn(c).letter}${hr2}`, 'Ethnic Group'); c++;
        applyHeader(`${sheet.getColumn(c).letter}${hr2}:${sheet.getColumn(c).letter}${hr2}`, 'Email Address'); c++;
        applyHeader(`${sheet.getColumn(c).letter}${hr2}:${sheet.getColumn(c).letter}${hr2}`, 'Contact No.'); c++;
    }

    applyHeader(`${sheet.getColumn(c).letter}${hr1}:${sheet.getColumn(c).letter}${hr2}`, 'Education'); c++;
    
    applyHeader(`${sheet.getColumn(c).letter}${hr1}:${sheet.getColumn(c+1).letter}${hr1}`, 'Training');
    applyHeader(`${sheet.getColumn(c).letter}${hr2}:${sheet.getColumn(c).letter}${hr2}`, 'Title'); c++;
    applyHeader(`${sheet.getColumn(c).letter}${hr2}:${sheet.getColumn(c).letter}${hr2}`, 'Hours'); c++;
    
    applyHeader(`${sheet.getColumn(c).letter}${hr1}:${sheet.getColumn(c+1).letter}${hr1}`, 'Experience');
    applyHeader(`${sheet.getColumn(c).letter}${hr2}:${sheet.getColumn(c).letter}${hr2}`, 'Details'); c++;
    applyHeader(`${sheet.getColumn(c).letter}${hr2}:${sheet.getColumn(c).letter}${hr2}`, 'Years'); c++;

    applyHeader(`${sheet.getColumn(c).letter}${hr1}:${sheet.getColumn(c).letter}${hr2}`, 'Eligibility'); c++;
    applyHeader(`${sheet.getColumn(c).letter}${hr1}:${sheet.getColumn(c).letter}${hr2}`, 'Remarks\n(Qualified or\nDisqualified)'); c++;
    applyHeader(`${sheet.getColumn(c).letter}${hr1}:${sheet.getColumn(c).letter}${hr2}`, 'Remarks');

    r += 2;
    let count = 1;

    for (const app of applicants) {
        const edu = allEdu.filter(e => e.applicant_id === app.id);
        const train = allTrain.filter(t => t.applicant_id === app.id);
        const exp = allExp.filter(e => e.applicant_id === app.id);
        const elig = allElig.filter(e => e.applicant_id === app.id);

        const eduStr = edu.length ? edu.map(e => e.degree).join('\n') : 'N/A';
        const trainTitleStr = train.length ? train.map(t => t.title).join('\n') : 'N/A';
        const trainHoursStr = train.length ? train.map(t => t.hours).join('\n') : 'N/A';
        const expDetailsStr = exp.length ? exp.map(e => e.details).join('\n') : 'N/A';
        const expYearsStr = exp.length ? exp.map(e => {
            let parts = [];
            if (e.years > 0) parts.push(e.years + (e.years == 1 ? " year" : " years"));
            if (e.months > 0) parts.push(e.months + (e.months == 1 ? " month" : " months"));
            return parts.length > 0 ? parts.join(" & ") : "0 years";
        }).join('\n') : 'N/A';
        const eligStr = elig.length ? elig.map(e => e.details + (e.rating ? ' (' + e.rating + ')' : '')).join('\n') : 'N/A';
        
        const eduHasDisq = edu.some(e => e.status === 'DISQUALIFIED');
        const trainHasDisq = train.some(t => t.status === 'DISQUALIFIED');
        const expHasDisq = exp.some(e => e.status === 'DISQUALIFIED');
        const eligHasDisq = elig.some(e => e.status === 'DISQUALIFIED');

        let remarks = app.status === 'QUALIFIED' ? 'QUALIFIED' : (app.status === 'DISQUALIFIED' ? 'DISQUALIFIED' : '');
        let remarksIsDisq = remarks === 'DISQUALIFIED';

        let appName = `${toTitleCase(app.lastName || '')}, ${toTitleCase(app.firstName || '')}`;
        if (app.nameExtension) appName += ` ${toTitleCase(app.nameExtension)}`;
        if (app.middleName) {
            const mi = app.middleName.trim().charAt(0).toUpperCase();
            if (mi) appName += `, ${mi}.`;
        }
        appName = appName.replace(/^,\s*/, '').replace(/,\s*,/g, ',').trim();

        const row = sheet.getRow(r);
        let colIdx = 2; // Start from B
        
        const setVal = (val, isDisq = false, bold = false) => {
            const cell = row.getCell(colIdx);
            cell.value = val;
            cell.border = headerBorder;
            cell.alignment = centerAlign;
            cell.font = { ...baseFont, color: isDisq ? { argb: 'FFFF0000' } : undefined, bold: bold };
            colIdx++;
        };

        setVal(count);
        setVal(app.applicationCode);
        
        if (showName) setVal(appName, false, true);

        if (showDetails) {
            let addressStr = 'N/A';
            if (app.address) {
                try {
                    const parsedObj = JSON.parse(app.address);
                    let parts = [];
                    if (parsedObj.res_barangay) parts.push(parsedObj.res_barangay);
                    if (parsedObj.res_city) parts.push(parsedObj.res_city);
                    if (parsedObj.res_province) parts.push(parsedObj.res_province);
                    addressStr = parts.length > 0 ? parts.join(', ') : app.address;
                } catch(e) { addressStr = app.address; }
            }
            
            let sexVal = 'N/A';
            if (app.sex) {
                if (app.sex.toLowerCase() === 'male') sexVal = 'Male';
                else if (app.sex.toLowerCase() === 'female') sexVal = 'Female';
                else sexVal = toTitleCase(app.sex);
            }

            setVal(toTitleCase(addressStr));
            setVal(calculateAge(app.birthdate));
            setVal(sexVal);
            setVal(toTitleCase(app.civilStatus || 'N/A'));
            setVal(toTitleCase(app.religion || 'N/A'));
            setVal(toTitleCase(app.disability || 'None'));
            setVal(toTitleCase(app.ethnicGroup || 'None'));
            setVal(app.emailAddress || 'N/A');
            setVal(app.contactNo || 'N/A');
        }

        setVal(eduStr, eduHasDisq);
        setVal(trainTitleStr, trainHasDisq);
        setVal(trainHoursStr, trainHasDisq);
        setVal(expDetailsStr, expHasDisq);
        setVal(expYearsStr, expHasDisq);
        setVal(eligStr, eligHasDisq);
        setVal(remarks, remarksIsDisq);
        setVal(app.disqualificationReason || '');

        r++;
        count++;
    }



    const d = new Date();
    const currentDateStr = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;

    let sigStart, sigEnd;
    if (showDetails) {
        sigStart = 'Q';
        sigEnd = 'S';
    } else if (showName) {
        sigStart = 'H';
        sigEnd = 'J';
    } else {
        sigStart = 'G';
        sigEnd = 'I';
    }

    r++;
    
    sheet.mergeCells(`${sigStart}${r}:${sigEnd}${r}`);
    sheet.getCell(`${sigStart}${r}`).value = 'Prepared and certified correct by:';
    sheet.getCell(`${sigStart}${r}`).font = { ...baseFont, size: 12 };
    sheet.getCell(`${sigStart}${r}`).alignment = { horizontal: 'left' };
    r+=3;
    
    sheet.mergeCells(`${sigStart}${r}:${sigEnd}${r}`);
    sheet.getCell(`${sigStart}${r}`).value = 'AZOR B. QUIJANO';
    sheet.getCell(`${sigStart}${r}`).font = { ...baseFont, size: 12, bold: true };
    sheet.getCell(`${sigStart}${r}`).alignment = { horizontal: 'center' };
    sheet.getCell(`${sigStart}${r}`).border = { bottom: { style: 'thin' } };
    r++;

    sheet.mergeCells(`${sigStart}${r}:${sigEnd}${r}`);
    sheet.getCell(`${sigStart}${r}`).value = 'Administrative Officer IV (Personnel)';
    sheet.getCell(`${sigStart}${r}`).font = { ...baseFont, size: 12 };
    sheet.getCell(`${sigStart}${r}`).alignment = { horizontal: 'center' };
    r++;

    sheet.mergeCells(`${sigStart}${r}:${sigEnd}${r}`);
    sheet.getCell(`${sigStart}${r}`).value = `Date:    ${currentDateStr}`;
    sheet.getCell(`${sigStart}${r}`).font = { ...baseFont, size: 12 };
    sheet.getCell(`${sigStart}${r}`).alignment = { horizontal: 'center' };
    r+=2;

    const notesFont = { ...baseFont, size: 11, italic: true };
    const notesFontBoldItalic = { ...baseFont, size: 11, italic: true, bold: true };

    sheet.mergeCells(`B${r}:${maxColLetter}${r}`);
    sheet.getCell(`B${r}`).value = 'Notes and Instructions for the HRMO:';
    sheet.getCell(`B${r}`).font = notesFontBoldItalic;
    r++;

    sheet.mergeCells(`B${r}:${maxColLetter}${r}`);
    sheet.getCell(`B${r}`).value = {
        richText: [
            { font: notesFont, text: 'a) For the purpose of posting the IER, ' },
            { font: notesFontBoldItalic, text: 'columns D to M' },
            { font: notesFont, text: ' shall be concealed in accordance with RA No. 10163 (Data Privacy Act). The only information that shall be made public are the ' }
        ]
    };
    r++;

    sheet.mergeCells(`B${r}:${maxColLetter}${r}`);
    sheet.getCell(`B${r}`).value = 'application codes, qualifications of the applicants in terms of Education, Training, Experience, Eligibility, and Competency (if applicable), and remark on whether Qualified or Disqualified';
    sheet.getCell(`B${r}`).font = notesFont;
    r++;

    sheet.mergeCells(`B${r}:${maxColLetter}${r}`);
    sheet.getCell(`B${r}`).value = 'b) If the information does not apply to the applicant, please put N/A.';
    sheet.getCell(`B${r}`).font = notesFont;

    return await workbook.xlsx.writeBuffer();
}

module.exports = { generateIERExcelJS };
