const ExcelJS = require('exceljs');

async function generateCARExcelJS(exportType, positionFilter, posData, applicants) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'RSP Dashboard';
    workbook.created = new Date();

    const hideNameColumn = exportType === 'withoutName';
    const sheetName = hideNameColumn ? 'No Names' : 'With Names';

    const sheet = workbook.addWorksheet(sheetName, {
        pageSetup: { 
            paperSize: 9, 
            orientation: 'landscape', 
            fitToPage: true, 
            fitToWidth: 1, 
            fitToHeight: 0,
            margins: {
                left: 0.315,
                right: 0.315,
                top: 0.512,
                bottom: 0.6,
                header: 0.3,
                footer: 0.315
            }
        },
        headerFooter: { oddFooter: '&RPage &P', evenFooter: '&RPage &P' },
        properties: {
            defaultRowHeight: 16.5
        }
    });

    let colWidths = [];
    if (hideNameColumn) {
        colWidths = [
            1.44,  // A
            10.55, // B (No)
            29.55, // C (Code)
            14.21, // D (Edu)
            12.44, // E (Train)
            13.55, // F (Exp)
            15.77, // G (Perf)
            20.77, // H (Outst)
            16.77, // I (AppEdu)
            16.77, // J (AppL&D)
            11.44, // K (Pot)
            10.77, // L (Total)
            18.0,  // M (Remarks)
            9.44,  // N (Yes)
            9.44,  // O (No)
            16.55, // P (Appointment)
            21.55, // Q (Probation)
            2.0    // R (Spacer)
        ];
    } else {
        colWidths = [
            1.44,  // A
            5.77,  // B
            8.21,  // C
            26.77, // D
            26.21, // E
            13.77, // F
            13.55, // G
            13.0,  // H
            13.77, // I
            19.77, // J
            13.55, // K
            14.77, // L
            13.55, // M
            13.0,  // N
            30.77, // O
            9.44,  // P
            13.0,  // Q
            16.55, // R
            21.55, // S
            2.0    // T
        ];
    }

    sheet.columns = colWidths.map(w => ({ width: w, style: { font: { name: 'Bookman Old Style', size: 10 } } }));

    const baseFont = { name: 'Bookman Old Style', size: 9 };
    const headerFont = { name: 'Bookman Old Style', size: 11, bold: true };

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
    const plantillaItem = posData?.plantillaItem || '';
    let itemsArray = [];
    if (plantillaItem) {
        try {
            const parsed = JSON.parse(plantillaItem);
            if (Array.isArray(parsed)) {
                let all = [];
                parsed.forEach(p => {
                    if (p.items) all.push(...p.items.split(',').map(s => s.trim()).filter(s => s));
                });
                itemsArray = all;
            } else {
                itemsArray = plantillaItem.split(',').map(x => x.trim()).filter(x => x !== '');
            }
        } catch(e) {
            itemsArray = plantillaItem.split(',').map(x => x.trim()).filter(x => x !== '');
        }
    }
    const numItems = itemsArray.length;
    let formattedPlantilla = '0 Vacant Items';
    if (numItems > 0) {
        if (numItems <= 4) {
            formattedPlantilla = itemsArray.join(', ');
        } else {
            formattedPlantilla = `${numItems} ${getPositionCode(positionFilter)} Vacant Items`;
        }
    }

    const maxCol = hideNameColumn ? 'Q' : 'S';
    const borderEndCol = hideNameColumn ? 'R' : 'T';
    const annexCol = hideNameColumn ? 'Q' : 'R';

    sheet.getRow(1).height = 16.5; // 22 pixels
    sheet.getCell(`${annexCol}1`).value = 'Annex H';
    sheet.getCell(`${annexCol}1`).font = { ...baseFont, size: 11, bold: true };
    sheet.getCell(`${annexCol}1`).alignment = { horizontal: 'right' };

    sheet.getRow(2).height = 26.25; // 35 pixels
    sheet.mergeCells(`B2:${maxCol}2`);
    sheet.getCell('B2').value = 'COMPARATIVE ASSESSMENT RESULT (CAR)';
    sheet.getCell('B2').font = { ...baseFont, bold: true, size: 16 };
    sheet.getCell('B2').alignment = { horizontal: 'center' };

    sheet.getRow(3).height = 16.5; // Spacer row, 22 pixels

    sheet.getRow(4).height = 33.75; // 45 pixels
    
    if (hideNameColumn) {
        // Without Names layout
        sheet.getCell('B4').value = 'Position: ';
        sheet.getCell('B4').font = { ...baseFont, bold: true, size: 11 };

        sheet.mergeCells('C4:D4');
        sheet.getCell('C4').value = positionFilter;
        sheet.getCell('C4').font = { ...baseFont, bold: true, size: 11 };
        sheet.getCell('C4').border = { bottom: { style: 'thin' } };

        sheet.mergeCells('M4:N4');
        sheet.getCell('M4').value = 'Plantilla Item Number:';
        sheet.getCell('M4').font = { ...baseFont, bold: true, size: 11 };

        sheet.mergeCells('O4:Q4');
        sheet.getCell('O4').value = formattedPlantilla;
        sheet.getCell('O4').font = { ...baseFont, bold: true, size: 11 };
        sheet.getCell('O4').border = { bottom: { style: 'thin' } };
        sheet.getCell('O4').alignment = { wrapText: true, vertical: 'middle' };

        sheet.getRow(5).height = 16.5; // 22 pixels
        sheet.mergeCells('B5:E5');
        sheet.getCell('B5').value = 'Office/Bureau/Service/Unit where the vacancy exists: ';
        sheet.getCell('B5').font = { ...baseFont, bold: true, size: 11 };

        sheet.mergeCells('F5:I5');
        sheet.getCell('F5').value = 'Public Elementary and Secondary Schools in Iligan City';
        sheet.getCell('F5').font = { ...baseFont, bold: true, size: 11 };
        sheet.getCell('F5').border = { bottom: { style: 'thin' } };

        sheet.mergeCells('M5:N5');
        sheet.getCell('M5').value = 'Date of Final Deliberation:';
        sheet.getCell('M5').font = { ...baseFont, bold: true, size: 11 };

        sheet.mergeCells('O5:Q5');
        sheet.getCell('O5').value = '';
        sheet.getCell('O5').font = { ...baseFont, size: 11 };
        sheet.getCell('O5').border = { bottom: { style: 'thin' } };
    } else {
        // With Names layout
        sheet.mergeCells('B4:C4');
        sheet.getCell('B4').value = 'Position: ';
        sheet.getCell('B4').font = { ...baseFont, bold: true, size: 11 };

        sheet.mergeCells('D4:E4');
        sheet.getCell('D4').value = positionFilter;
        sheet.getCell('D4').font = { ...baseFont, bold: true, size: 11 };
        sheet.getCell('D4').border = { bottom: { style: 'thin' } };

        sheet.mergeCells('O4:P4');
        sheet.getCell('O4').value = 'Plantilla Item Number:';
        sheet.getCell('O4').font = { ...baseFont, bold: true, size: 11 };

        sheet.mergeCells('Q4:S4');
        sheet.getCell('Q4').value = formattedPlantilla;
        sheet.getCell('Q4').font = { ...baseFont, bold: true, size: 11 };
        sheet.getCell('Q4').border = { bottom: { style: 'thin' } };
        sheet.getCell('Q4').alignment = { wrapText: true, vertical: 'middle' };

        sheet.getRow(5).height = 16.5; // 22 pixels
        sheet.mergeCells('B5:E5');
        sheet.getCell('B5').value = 'Office/Bureau/Service/Unit where the vacancy exists: ';
        sheet.getCell('B5').font = { ...baseFont, bold: true, size: 11 };

        sheet.mergeCells('F5:J5');
        sheet.getCell('F5').value = 'Public Elementary and Secondary Schools in Iligan City';
        sheet.getCell('F5').font = { ...baseFont, bold: true, size: 11 };
        sheet.getCell('F5').border = { bottom: { style: 'thin' } };

        sheet.mergeCells('O5:P5');
        sheet.getCell('O5').value = 'Date of Final Deliberation:';
        sheet.getCell('O5').font = { ...baseFont, bold: true, size: 11 };

        sheet.mergeCells('Q5:S5');
        sheet.getCell('Q5').value = '';
        sheet.getCell('Q5').font = { ...baseFont, size: 11 };
        sheet.getCell('Q5').border = { bottom: { style: 'thin' } };
    }

    sheet.getRow(6).height = 16.5; // 22 pixels

    const headerBorder = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    const centerAlign = { horizontal: 'center', vertical: 'middle', wrapText: true };

    sheet.getRow(7).height = 49.5; // 66 pixels
    sheet.getRow(8).height = 67.5; // 90 pixels
    sheet.getRow(9).height = 18.75; // 25 pixels

    const applyHeader = (range, value, fontOpts = {}) => {
        sheet.mergeCells(range);
        const cell = sheet.getCell(range.split(':')[0]);
        cell.value = value;
        cell.font = { ...headerFont, ...fontOpts };
        cell.alignment = centerAlign;
        
        const [startCell, endCell] = range.split(':');
        const startCol = sheet.getColumn(startCell.replace(/[0-9]/g, '')).number;
        const endCol = sheet.getColumn(endCell.replace(/[0-9]/g, '')).number;
        const startRow = parseInt(startCell.replace(/[A-Z]/g, ''));
        const endRow = parseInt(endCell.replace(/[A-Z]/g, ''));
        
        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                sheet.getRow(r).getCell(c).border = headerBorder;
            }
        }
    };

    if (hideNameColumn) {
        applyHeader('B7:B9', 'No.');
        applyHeader('C7:C9', 'Application Code');
        applyHeader('D7:L7', 'COMPARATIVE ASSESSMENT RESULTS');
        
        const subHeaders = ['Education', 'Training', 'Experience', 'Performance', 'Outstanding Accomplishments', 'Application of Education', 'Application of L&D', 'Potential', 'Total'];
        const subScores = ['(5)', '(5)', '(20)', '(20)', '(10)', '(10)', '(10)', '(20)', '(100)'];
        const cols = ['D','E','F','G','H','I','J','K','L'];
        cols.forEach((c, idx) => {
            const isSize10 = ['Performance', 'Outstanding Accomplishments', 'Application of Education'].includes(subHeaders[idx]);
            applyHeader(`${c}8:${c}8`, subHeaders[idx], isSize10 ? { size: 10 } : {});
            applyHeader(`${c}9:${c}9`, subScores[idx]);
        });

        applyHeader('M7:M9', 'Remarks');
        applyHeader('N7:O8', 'For Background Investigation (Y/N)');
        applyHeader('N9:N9', 'Yes');
        applyHeader('O9:O9', 'No');

        applyHeader('P7:P9', {
            richText: [
                { font: { ...baseFont, bold: true, size: 11 }, text: 'For Appointment\n' },
                { font: { ...baseFont, italic: true, size: 9 }, text: '(To filled-out by the Appointing Officer/Authority;\nPlease sign opposite the name of the applicant)' }
            ]
        });
        
        applyHeader('Q7:Q9', {
            richText: [
                { font: { ...baseFont, bold: true, size: 11 }, text: 'For probation\n' },
                { font: { ...baseFont, italic: true, size: 9 }, text: 'Please identify period of Probation (6 months or 1 year) if nature of appointment falls under the purview of Item 73 of DO No. 19, s. 2022' }
            ]
        });

    } else {
        applyHeader('B7:D9', 'Name of Applicant'); // B is No., C&D are Name in data, but header spans B to D
        applyHeader('E7:E9', 'Application Code');
        applyHeader('F7:N7', 'COMPARATIVE ASSESSMENT RESULTS');
        
        const subHeaders = ['Education', 'Training', 'Experience', 'Performance', 'Outstanding Accomplishments', 'Application of Education', 'Application of L&D', 'Potential', 'Total'];
        const subScores = ['(5)', '(5)', '(20)', '(20)', '(10)', '(10)', '(10)', '(20)', '(100)'];
        const cols = ['F','G','H','I','J','K','L','M','N'];
        cols.forEach((c, idx) => {
            const isSize10 = ['Performance', 'Outstanding Accomplishments', 'Application of Education'].includes(subHeaders[idx]);
            applyHeader(`${c}8:${c}8`, subHeaders[idx], isSize10 ? { size: 10 } : {});
            applyHeader(`${c}9:${c}9`, subScores[idx]);
        });

        applyHeader('O7:O9', 'Remarks');
        applyHeader('P7:Q8', 'For Background Investigation (Y/N)');
        applyHeader('P9:P9', 'Yes');
        applyHeader('Q9:Q9', 'No');

        applyHeader('R7:R9', {
            richText: [
                { font: { ...baseFont, bold: true, size: 11 }, text: 'For Appointment\n' },
                { font: { ...baseFont, italic: true, size: 9 }, text: '(To filled-out by the Appointing Officer/Authority;\nPlease sign opposite the name of the applicant)' }
            ]
        });
        
        applyHeader('S7:S9', {
            richText: [
                { font: { ...baseFont, bold: true, size: 11 }, text: 'For probation\n' },
                { font: { ...baseFont, italic: true, size: 9 }, text: 'Please identify period of Probation (6 months or 1 year) if nature of appointment falls under the purview of Item 73 of DO No. 19, s. 2022' }
            ]
        });
    }

    let currentRow = 10;
    let count = 1;

    for (const app of applicants) {
        let appName = `${app.lastName || ''}, ${app.firstName || ''}`;
        if (app.nameExtension) appName += ` ${app.nameExtension}`;
        if (app.middleName) appName += ` ${app.middleName}`;
        appName = appName.replace(/^,\s*/, '').trim();
        
        let remarks = app.remarks || '';

        let appCodeStatus = '';
        let appCodeStatusColor = undefined;
        if (app.status === 'NO_APPEARANCE') {
            appCodeStatus = '\n"No Appearance"';
            appCodeStatusColor = { argb: 'FFFF0000' };
        } else if (app.status === 'NEWLY_PROMOTED') {
            appCodeStatus = '\n"Newly Promoted"';
            appCodeStatusColor = { argb: 'FFFF0000' };
        }

        let extraDetails = '';
        if (exportType === 'withDetails') {
            extraDetails = `\nSex: ${app.sex || 'N/A'}\nStatus: ${app.civilStatus || 'N/A'}\nContact: ${app.contactNo || 'N/A'}\nAddress: ${app.address || 'N/A'}`;
        }
        
        const isDisq = app.isDisqualified;

        let codeWithDetails;
        if (appCodeStatus) {
            codeWithDetails = {
                richText: [
                    { text: app.applicationCode, font: { ...baseFont, size: 10, color: isDisq ? { argb: 'FFFF0000' } : undefined } },
                    { text: appCodeStatus, font: { ...baseFont, size: 10, color: appCodeStatusColor } }
                ]
            };
            if (hideNameColumn && extraDetails) {
                 codeWithDetails.richText.push({ text: extraDetails, font: { ...baseFont, size: 10, color: isDisq ? { argb: 'FFFF0000' } : undefined } });
            }
        } else {
            codeWithDetails = app.applicationCode;
            if (hideNameColumn && extraDetails) {
                codeWithDetails += extraDetails;
            }
        }

        const row = sheet.getRow(currentRow);
        row.height = 43.5; // 58 pixels
        let colIdx = 2; // B

        const setVal = (val, isDisqParam = false, bold = false, fSize = 10) => {
            const cell = row.getCell(colIdx);
            cell.value = val;
            cell.border = headerBorder;
            cell.alignment = centerAlign;
            if (val && typeof val === 'object' && val.richText) {
                // preserve richText fonts
            } else {
                cell.font = { ...baseFont, size: fSize, color: isDisqParam ? { argb: 'FFFF0000' } : undefined, bold: bold };
            }
            colIdx++;
        };

        const formatScore = (score, defaultStr, isTotal = false) => {
            if (app.status === 'NO_APPEARANCE' || app.status === 'NEWLY_PROMOTED') {
                return '0';
            }
            if (isTotal) {
                return score !== null && score !== undefined ? Number(score).toFixed(3) : defaultStr;
            }
            return score || defaultStr;
        };

        if (hideNameColumn) {
            setVal(count++, false, false, 10);
            setVal(codeWithDetails, isDisq, false, 10);
            setVal(formatScore(app.scoreEducation, '0.0'), false, false, 11);
            setVal(formatScore(app.scoreTraining, '0.0'), false, false, 11);
            setVal(formatScore(app.scoreExperience, '0.0'), false, false, 11);
            setVal(formatScore(app.scorePerformance, '0.000'), false, false, 11);
            setVal(formatScore(app.scoreOutstandingAccomplishments, '0'), false, false, 11);
            setVal(formatScore(app.scoreApplicationOfEducation, '0.0'), false, false, 11);
            setVal(formatScore(app.scoreApplicationOfLD, '0'), false, false, 11);
            setVal(formatScore(app.scorePotential, '0.0'), false, false, 11);
            setVal(formatScore(app.assessmentTotal, '0.000', true), false, false, 11);
            setVal(remarks, false, false, 11);
            setVal('', false, false, 11); // N Yes
            setVal('', false, false, 11); // O No
            setVal('', false, false, 11); // P Appointment
            setVal('', false, false, 11); // Q Probation
        } else {
            setVal(count++, false, false, 10);
            sheet.mergeCells(`C${currentRow}:D${currentRow}`);
            setVal(appName + extraDetails, isDisq, true, 10);
            colIdx++; // Skip column D since it's merged
            setVal(codeWithDetails, isDisq, false, 10);
            setVal(formatScore(app.scoreEducation, '0.0'), false, false, 11);
            setVal(formatScore(app.scoreTraining, '0.0'), false, false, 11);
            setVal(formatScore(app.scoreExperience, '0.0'), false, false, 11);
            setVal(formatScore(app.scorePerformance, '0.000'), false, false, 11);
            setVal(formatScore(app.scoreOutstandingAccomplishments, '0'), false, false, 11);
            setVal(formatScore(app.scoreApplicationOfEducation, '0.0'), false, false, 11);
            setVal(formatScore(app.scoreApplicationOfLD, '0'), false, false, 11);
            setVal(formatScore(app.scorePotential, '0.0'), false, false, 11);
            setVal(formatScore(app.assessmentTotal, '0.000', true), false, false, 11);
            setVal(remarks, false, false, 11);
            setVal('', false, false, 11); // P Yes
            setVal('', false, false, 11); // Q No
            setVal('', false, false, 11); // R Appointment
            setVal('', false, false, 11); // S Probation
        }
        currentRow++;
    }


    currentRow += 2;
    const noteStartCol = hideNameColumn ? 'B' : 'D';
    const noteEndCol = hideNameColumn ? 'N' : 'M';
    
    sheet.getRow(currentRow).getCell(noteStartCol).value = 'Prepared by the HRMPSB';
    sheet.getRow(currentRow).getCell(noteStartCol).font = { ...baseFont, size: 11 };
    currentRow++;
    sheet.getRow(currentRow).getCell(noteStartCol).value = '(All members should affix signature)';
    sheet.getRow(currentRow).getCell(noteStartCol).font = { ...baseFont, size: 11 };
    
    const conferringCol = hideNameColumn ? 'O' : 'P';
    sheet.getRow(currentRow).getCell(conferringCol).value = 'Appointment conferred by:';
    sheet.getRow(currentRow).getCell(conferringCol).font = { ...baseFont, size: 11 };
    
    currentRow++;
    
    // Create a giant empty box for signatures spanning the entire width
    sheet.getRow(currentRow).height = 120; // 120 points is approximately 160 pixels
    sheet.mergeCells(`B${currentRow}:${maxCol}${currentRow}`);
    
    // Apply outer perimeter border from Row 1 to the end of the signature block
    const gridEndRow = currentRow;
    const gridEndCol = sheet.getColumn(borderEndCol).number;
    for (let r = 1; r <= gridEndRow; r++) {
        for (let c = 1; c <= gridEndCol; c++) {
            const cell = sheet.getRow(r).getCell(c);
            let b = { ...(cell.border || {}) };
            if (r === 1) b.top = { style: 'medium' };
            if (r === gridEndRow) b.bottom = { style: 'medium' };
            if (c === 1) b.left = { style: 'medium' };
            if (c === gridEndCol) b.right = { style: 'medium' };
            if (Object.keys(b).length > 0) {
                cell.border = b;
            }
        }
    }

    currentRow += 2;
    
    // Row above Notes: 33 pixels (24.75 points)
    sheet.getRow(currentRow - 1).height = 24.75;
    // Notes row: 22 pixels (16.5 points)
    sheet.getRow(currentRow).height = 16.5;

    const notesFont = { ...baseFont, size: 11 };
    const notesFontBoldItalic = { ...baseFont, size: 11, bold: true, italic: true };

    sheet.mergeCells(`B${currentRow}:${maxCol}${currentRow}`);
    sheet.getCell(`B${currentRow}`).value = 'Notes and Instructions for the HRMO:';
    sheet.getCell(`B${currentRow}`).font = { ...notesFont, bold: true };
    currentRow++;
    
    sheet.mergeCells(`B${currentRow}:${maxCol}${currentRow}`);
    sheet.getCell(`B${currentRow}`).value = {
        richText: [
            { font: notesFont, text: 'a) For the purpose of posting the CAR, Column ' },
            { font: notesFontBoldItalic, text: 'C (Name of the applicant) and Columns N to R (Remarks to Probation status)' },
            { font: notesFont, text: ' shall be concealed in accordance with RA No. 10163 (Data Privacy Act). ' }
        ]
    };
    currentRow++;

    sheet.mergeCells(`B${currentRow}:${maxCol}${currentRow}`);
    sheet.getCell(`B${currentRow}`).value = 'The only information that shall be made public are the Application Code, Comparative Assessment Results (Component from Education to Potential) and the total scores of the applicants.';
    sheet.getCell(`B${currentRow}`).font = notesFont;
    currentRow++;

    sheet.mergeCells(`B${currentRow}:${maxCol}${currentRow}`);
    sheet.getCell(`B${currentRow}`).value = 'b) If the information does not apply to the applicant, please put N/A.';
    sheet.getCell(`B${currentRow}`).font = notesFont;
    currentRow++;

    sheet.mergeCells(`B${currentRow}:${maxCol}${currentRow}`);
    sheet.getCell(`B${currentRow}`).value = 'c) Applicants who failed to appear in any phase of the Open Ranking process and other evaluative assessments, and/or have withdrawn their application';
    sheet.getCell(`B${currentRow}`).font = notesFont;
    currentRow++;

    sheet.mergeCells(`B${currentRow}:${maxCol}${currentRow}`);
    sheet.getCell(`B${currentRow}`).value = 'shall be provided with a notation beside the application code (e.g., withdrawn application, etc.)';
    sheet.getCell(`B${currentRow}`).font = notesFont;

    return await workbook.xlsx.writeBuffer();
}

module.exports = { generateCARExcelJS };;
