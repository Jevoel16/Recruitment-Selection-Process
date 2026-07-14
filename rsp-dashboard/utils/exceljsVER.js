const ExcelJS = require('exceljs');

const escapeHtml = (str) => String(str || '');

async function generateVERExcelJS(items) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'RSP Dashboard';
    
    const now = new Date();
    workbook.created = now;
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dateStrFooter = `${monthNames[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
    const dateStrHeader = dateStrFooter.toUpperCase();

    const sheet = workbook.addWorksheet('VER', {
        pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 99 },
        pageMargins: {
            left: 0.1 / 2.54,
            right: 0.1 / 2.54,
            top: 0.9 / 2.54,
            bottom: 0.4 / 2.54,
            header: 0,
            footer: 0
        }
    });

    const arial11 = { name: 'Arial', size: 11 };
    const arial11Italic = { name: 'Arial', size: 11, italic: true };
    const arial11BoldItalic = { name: 'Arial', size: 11, bold: true, italic: true };
    const arial11Bold = { name: 'Arial', size: 11, bold: true };
    const arial9Italic = { name: 'Arial', size: 9, italic: true };
    const arial8Italic = { name: 'Arial', size: 8, italic: true };
    const tnr10 = { name: 'Times New Roman', size: 10 };
    const tnr11 = { name: 'Times New Roman', size: 11 };
    const tnr12 = { name: 'Times New Roman', size: 12 };
    
    const colWidths = [
        4.33,  // A
        14.33, // B
        11.89, // C
        7.44,  // D
        9.66,  // E
        27.11, // F
        29.0,  // G
        20.66, // H
        16.11, // I
        16.55, // J
        12.66  // K
    ];

    sheet.columns = colWidths.map(w => ({ width: w }));

    sheet.getRow(1).height = 18;
    sheet.getRow(2).height = 12;
    for (let i = 3; i <= 7; i++) sheet.getRow(i).height = 18;
    sheet.getRow(8).height = 13.5;
    sheet.getRow(9).height = 18.75;
    sheet.getRow(10).height = 18.75;
    sheet.getRow(11).height = 18;
    sheet.getRow(12).height = 18;
    sheet.getRow(13).height = 5.25;
    sheet.getRow(14).height = 18;
    sheet.getRow(15).height = 18;
    sheet.getRow(16).height = 23.25;
    sheet.getRow(17).height = 114;

    sheet.getCell('A1').value = 'CS Form No. 9';
    sheet.getCell('A1').font = arial11Italic;

    sheet.mergeCells('J1:K2');
    sheet.getCell('J1').value = 'Electronic copy to be submitted to the CSC FO  must be in MS Excel format';
    sheet.getCell('J1').font = arial8Italic;
    sheet.getCell('J1').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

    sheet.getCell('A2').value = 'Revised 2025';
    sheet.getCell('A2').font = arial9Italic;
    sheet.getCell('A2').alignment = { vertical: 'middle' };

    sheet.mergeCells('A3:K3');
    sheet.getCell('A3').value = 'Republic of the Philippines';
    sheet.getCell('A3').font = arial11;
    sheet.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.mergeCells('A4:K4');
    sheet.getCell('A4').value = 'DEPARTMENT OF EDUCATION';
    sheet.getCell('A4').font = arial11BoldItalic;
    sheet.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.mergeCells('A5:K5');
    sheet.getCell('A5').value = 'Request for Publication of Vacant Positions';
    sheet.getCell('A5').font = arial11Bold;
    sheet.getCell('A5').alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.getCell('A7').value = 'To: CIVIL SERVICE COMMISSION (CSC)';
    sheet.getCell('A7').font = arial11;

    sheet.mergeCells('A9:K10');
    sheet.getCell('A9').value = '        We hereby request the publication in the CSC Job Portal of the following vacant positions, which are authorized to be filled at the DEPARTMENT OF EDUCATION:';
    sheet.getCell('A9').font = arial11;
    sheet.getCell('A9').alignment = { wrapText: true, vertical: 'middle' };

    sheet.mergeCells('I11:K11');
    sheet.getCell('I11').value = 'AZOR B. QUIJANO';
    sheet.getCell('I11').font = arial11;
    sheet.getCell('I11').alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getCell('I11').border = { bottom: { style: 'thin' } };
    sheet.getCell('J11').border = { bottom: { style: 'thin' } };
    sheet.getCell('K11').border = { bottom: { style: 'thin' } };

    sheet.mergeCells('I12:K12');
    sheet.getCell('I12').value = 'HRMO';
    sheet.getCell('I12').font = arial11;
    sheet.getCell('I12').alignment = { horizontal: 'center' };

    sheet.getCell('I14').value = 'Date:';
    sheet.getCell('I14').font = arial11;
    sheet.mergeCells('J14:K14');
    sheet.getCell('J14').value = dateStrHeader;
    sheet.getCell('J14').font = arial11;
    sheet.getCell('J14').alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getCell('J14').border = { bottom: { style: 'thin' } };
    sheet.getCell('K14').border = { bottom: { style: 'thin' } };

    const headerBorder = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    const centerAlign = { horizontal: 'center', vertical: 'middle', wrapText: true };

    const applyHeader = (range, value) => {
        sheet.mergeCells(range);
        const cell = sheet.getCell(range.split(':')[0]);
        cell.value = value;
        cell.font = arial11;
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

    applyHeader('A16:A17', 'No.');
    applyHeader('B16:B17', 'Position Title (Parenthetical Title, if applicable)');
    applyHeader('C16:C17', 'Plantilla Item No.');
    applyHeader('D16:D17', 'Salary/ Job/ Pay Grade');
    applyHeader('E16:E17', 'Monthly Salary');
    applyHeader('F16:J16', 'Qualification Standards');
    applyHeader('F17:F17', 'Education');
    applyHeader('G17:G17', 'Training');
    applyHeader('H17:H17', 'Experience');
    applyHeader('I17:I17', 'Eligibility');
    applyHeader('J17:J17', ''); // Placeholder, override below
    sheet.getCell('J17').value = {
        richText: [
            { text: 'Competency/ Area of Specialization/ Residency Requirement', font: arial11Italic },
            { text: '        (if applicable)', font: arial11 }
        ]
    };
    applyHeader('K16:K17', 'Place of Assignment');

    let r = 18;
    for (const item of items) {
        let mSalary = item.salary || '';
        if (mSalary && !isNaN(mSalary.toString().replace(/,/g, ''))) {
            mSalary = Number(mSalary.toString().replace(/,/g, '')).toLocaleString('en-US', {minimumFractionDigits: 0});
        }

        const row = sheet.getRow(r);
        
        const vals = [
            item.no, item.title, item.itemNo, item.sg, mSalary,
            item.edu, item.train, item.exp, item.elig, item.comp, item.assignment
        ];

        let c = 1;
        for (const v of vals) {
            const cell = row.getCell(c);
            cell.value = escapeHtml(v);
            
            if (c === 1) cell.font = arial11;
            else if (c === 3) cell.font = tnr12;
            else if (c === 6 || c === 9) cell.font = tnr11;
            else cell.font = tnr10;

            cell.alignment = { vertical: 'middle', wrapText: true, horizontal: (c === 1 || c === 4 || c === 5) ? 'center' : 'left' };
            cell.border = headerBorder;
            c++;
        }
        r++;
    }

    // Directly append the footer text
    const footerLines = [
        { type: 'blank', height: 16 }, // 16 pixels
        { type: 'split',
          text1: 'Interested and qualified applicants should signify their interest in writing through an application letter addressed to the head of office. Applicants must attach the ',
          text1Height: 24, // 24 pixels
          text2: ' following documents to the application letter and send these to the address below not later than',
          date: dateStrFooter
        },
        { type: 'blank', height: 17 }, // 17 pixels
        { text: '1. Fully accomplished Personal Data Sheet (PDS) with Work Experience Sheet and recent passport-sized or unfiltered digital picture (CS Form No. 212, Revised 2025); digitally signed or electronically signed;', indent: true, height: 45 },
        { text: '2. Photocopy or electronic copy of Performance rating in the last rating period (if applicable);', indent: true, height: 23 },
        { text: '3. Photocopy or electronic copy of proof of eligibility/rating/license; and', indent: true, height: 23 },
        { text: '4. Photocopy or electronic copy of Transcript of Records.', indent: true, height: 23 },
        { text: '5. Letter of intent addressed to the Head of Office, or to the highest human resource officer designated by the Head of Office;', indent: true, height: 23 },
        { text: '6. Photocopy of valid and updated PRC License/ID, if applicable;', indent: true, height: 23 },
        { text: '7. Photocopy of Certificate/ s of Training, if applicable;', indent: true, height: 23 },
        { text: '8. Photocopy of Certificate of Employment, Contract of Service, or duly signed Service Record, whichever is/are applicable;', indent: true, height: 23 },
        { text: '9. Performance rating in the last rating period (if applicable);', indent: true, height: 23 },
        { text: '10. Checklist of Requirements and Omnibus Sworn Statement on the Certification on the Authenticity and Veracity (CAV) of the documents submitted and Data Privacy Consent Form', indent: true, height: 23 },
        { text: 'pursuant to RA No. 10173 (Data Privacy Act of 2012), notarized by authorized official; and ', indent: true, height: 23 },
        { richText: [
            { text: '11. Other documents as may be required by the DepEd recruitment, selection and appointment guidelines as prescribed by ', font: arial11 },
            { text: 'DepEd Order 07 s. 2023', font: arial11Bold },
            { text: ' (Non-Teaching, ', font: arial11 }
          ], indent: true, height: 23 },
        { richText: [
            { text: 'Related Teaching, School Administration) or ', font: arial11 },
            { text: 'DepEd Order 20 s. 2024', font: arial11Bold },
            { text: ' (Higher Teaching Positions) for comparative assessment, including but not limited to:', font: arial11 }
          ], indent: true, height: 23 },
        { text: '           a. Means of Verification (MOVs) showing Outstanding Accomplishments, Application of Education, and Application of Learning and Development ', indent: true, height: 23 },
        { text: 'reckoned from the date of last issuance of appointment.', indent: true, height: 23 },
        { text: '' },
        { text: 'This Office highly encourages all interested and qualified applicants to apply, which include persons with disability (PWD) and members of the indigenous ', height: 17, italic: true },
        { text: 'communities, irrespective of sexual orientation and gender identities and/or expression, civil status, religion, and political affiliation.', height: 17, italic: true },
        { text: 'This Office does not discriminate in the selection of employees based on the aforementioned pursuant to Equal Opportunities for Employment Principle (EOP).', height: 17, italic: true },
        { type: 'blank', height: 17 },
        { text: 'QUALIFIED APPLICANTS are advised to hand in or send through courier/email their application to the head of office/ human resource management office/records', height: 23 },
        { text: 'office, as the case may be:', height: 22 },
        { type: 'blank', height: 31 },
        { type: 'signature', text: 'JONATHAN S. DELA PEÑA, PhD, CESO V', bottomBorder: true },
        { type: 'signature', text: 'Schools Division Superintendent', bottomBorder: true },
        { type: 'signature', text: 'DEPED - Aguinaldo St., Poblacion, Iligan City', bottomBorder: true },
        { type: 'signature', text: 'recruitment.depediligan@gmail.com', bottomBorder: true, isEmail: true },
        { type: 'blank', height: 17 },
        { text: 'APPLICATIONS WITH INCOMPLETE DOCUMENTS SHALL NOT BE ENTERTAINED.', bold: true, height: 21 }
    ];

    for (const line of footerLines) {
        if (line.type === 'blank') {
            sheet.getRow(r).height = line.height * 0.75; // convert pixels to points
            r++;
        } else if (line.type === 'split') {
            // First row
            sheet.mergeCells(`A${r}:K${r}`);
            const cell1 = sheet.getCell(`A${r}`);
            cell1.value = line.text1;
            cell1.font = arial11;
            cell1.alignment = { wrapText: true, vertical: 'middle' };
            if (line.text1Height) {
                sheet.getRow(r).height = line.text1Height * 0.75;
            } else {
                const numLines1 = Math.max(1, Math.ceil(line.text1.length / 140));
                sheet.getRow(r).height = numLines1 * 18;
            }
            r++;

            // Second row (text in A-G, date in H)
            sheet.mergeCells(`A${r}:G${r}`);
            const cell2 = sheet.getCell(`A${r}`);
            cell2.value = line.text2;
            cell2.font = arial11;
            cell2.alignment = { wrapText: true, vertical: 'middle' };
            
            const cellDate = sheet.getCell(`H${r}`);
            cellDate.value = line.date;
            cellDate.font = { name: 'Arial', size: 11, bold: true, underline: true };
            cellDate.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
            
            const numLines2 = Math.max(1, Math.ceil(line.text2.length / 100));
            sheet.getRow(r).height = numLines2 * 18;
            r++;
        } else if (line.type === 'signature') {
            sheet.mergeCells(`B${r}:E${r}`);
            const cell = sheet.getCell(`B${r}`);
            
            if (line.isEmail) {
                cell.value = { text: line.text, hyperlink: `mailto:${line.text}` };
                cell.font = { ...arial11, underline: true, color: { argb: 'FF0563C1' } };
            } else {
                cell.value = line.text;
                cell.font = arial11;
            }
            
            cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
            if (line.bottomBorder) {
                // Apply bottom border to B to E
                for (let col of ['B', 'C', 'D', 'E']) {
                    sheet.getCell(`${col}${r}`).border = { bottom: { style: 'thin' } };
                }
            }
            sheet.getRow(r).height = 18;
            r++;
        } else {
            const startCol = line.indent ? 'B' : 'A';
            sheet.mergeCells(`${startCol}${r}:K${r}`);
            const cell = sheet.getCell(`${startCol}${r}`);
            
            if (line.richText) {
                cell.value = { richText: line.richText };
            } else {
                cell.value = line.text;
                if (line.bold) {
                    cell.font = arial11Bold;
                } else if (line.italic) {
                    cell.font = arial11Italic;
                } else {
                    cell.font = arial11;
                }
            }
            
            cell.alignment = { wrapText: true, vertical: 'middle' };
            
            if (line.height) {
                sheet.getRow(r).height = line.height * 0.75;
            } else if (line.text === '' || (!line.text && !line.richText)) {
                sheet.getRow(r).height = 12; // 16 pixels default
            } else {
                const textLen = line.text ? line.text.length : (line.richText ? line.richText.map(rt => rt.text).join('').length : 0);
                const charWidth = line.indent ? 130 : 140;
                const numLines = Math.max(1, Math.ceil(textLen / charWidth));
                sheet.getRow(r).height = numLines * 18;
            }
            r++;
        }
    }

    return await workbook.xlsx.writeBuffer();
}

module.exports = { generateVERExcelJS };
