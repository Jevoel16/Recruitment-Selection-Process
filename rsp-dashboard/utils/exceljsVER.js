const ExcelJS = require('exceljs');

const escapeHtml = (str) => String(str || '');

async function generateVERExcelJS(items) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'RSP Dashboard';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('VER', {
        pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 99 }
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

    sheet.getCell('A1').value = 'CS Form No. 9';
    sheet.getCell('A1').font = arial11Italic;
    sheet.getRow(1).height = 14.25;

    sheet.mergeCells('J1:K2');
    sheet.getCell('J1').value = 'Electronic copy to be submitted to the CSC FO  must be in MS Excel format';
    sheet.getCell('J1').font = arial8Italic;
    sheet.getCell('J1').alignment = { vertical: 'top', horizontal: 'center', wrapText: true };

    sheet.getCell('A2').value = 'Revised 2025';
    sheet.getCell('A2').font = arial9Italic;
    sheet.getRow(2).height = 10.5;

    sheet.mergeCells('A3:K3');
    sheet.getCell('A3').value = 'Republic of the Philippines';
    sheet.getCell('A3').font = arial11;

    sheet.mergeCells('A4:K4');
    sheet.getCell('A4').value = 'DEPARTMENT OF EDUCATION';
    sheet.getCell('A4').font = arial11BoldItalic;

    sheet.mergeCells('A5:K5');
    sheet.getCell('A5').value = 'Request for Publication of Vacant Positions';
    sheet.getCell('A5').font = arial11Bold;

    sheet.getCell('A7').value = 'To: CIVIL SERVICE COMMISSION (CSC)';
    sheet.getCell('A7').font = arial11;

    sheet.getRow(8).height = 11.25;

    sheet.mergeCells('A9:K10');
    sheet.getCell('A9').value = '        We hereby request the publication in the CSC Job Portal of the following vacant positions, which are authorized to be filled at the DEPARTMENT OF EDUCATION:';
    sheet.getCell('A9').font = arial11;
    sheet.getCell('A9').alignment = { wrapText: true, vertical: 'top' };
    sheet.getRow(9).height = 15.0;
    sheet.getRow(10).height = 15.0;

    sheet.mergeCells('I11:K11');
    sheet.getCell('I11').value = 'AZOR B. QUIJANO';
    sheet.getCell('I11').font = arial11;
    sheet.getCell('I11').alignment = { horizontal: 'center' };

    sheet.mergeCells('I12:K12');
    sheet.getCell('I12').value = 'HRMO';
    sheet.getCell('I12').font = arial11;
    sheet.getCell('I12').alignment = { horizontal: 'center' };

    sheet.getRow(13).height = 4.5;

    sheet.getCell('I14').value = 'Date:';
    sheet.getCell('I14').font = arial11;
    sheet.mergeCells('J14:K14');
    sheet.getCell('J14').value = 'APRIL 10, 2026';
    sheet.getCell('J14').font = arial11;

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

    sheet.getRow(16).height = 18.9;
    sheet.getRow(17).height = 91.5;

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
    applyHeader('J17:J17', 'Competency/ Area of Specialization/ Residency Requirement        (if applicable)');
    applyHeader('K16:K17', 'Place of Assignment');

    let r = 18;
    for (const item of items) {
        let mSalary = item.salary || '';
        if (mSalary && !isNaN(mSalary.toString().replace(/,/g, ''))) {
            mSalary = Number(mSalary.toString().replace(/,/g, '')).toLocaleString('en-US', {minimumFractionDigits: 0});
        }

        const row = sheet.getRow(r);
        row.height = 84.0;
        
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

            cell.alignment = { vertical: 'top', wrapText: true, horizontal: (c === 1 || c === 4 || c === 5) ? 'center' : 'left' };
            cell.border = headerBorder;
            c++;
        }
        r++;
    }

    r++;
    const footerLines = [
        { text: 'Interested and qualified applicants should signify their interest in writing through an application letter addressed to the head of office. Applicants must attach the following documents to the application letter and send these to the address below not later than April 20, 2026', height: 30 },
        { text: '', height: 15 },
        { text: '1. Fully accomplished Personal Data Sheet (PDS) with Work Experience Sheet and recent passport-sized or unfiltered digital picture (CS Form No. 212, Revised 2025); digitally signed or electronically signed;', height: 30 },
        { text: '2. Photocopy or electronic copy of Performance rating in the last rating period (if applicable);', height: 15 },
        { text: '3. Photocopy or electronic copy of proof of eligibility/rating/license; and', height: 15 },
        { text: '4. Photocopy or electronic copy of Transcript of Records.', height: 15 },
        { text: '5. Letter of intent addressed to the Head of Office, or to the highest human resource officer designated by the Head of Office;', height: 15 },
        { text: '6. Photocopy of valid and updated PRC License/ID, if applicable;', height: 15 },
        { text: '7. Photocopy of Certificate/ s of Training, if applicable;', height: 15 },
        { text: '8. Photocopy of Certificate of Employment, Contract of Service, or duly signed Service Record, whichever is/are applicable;', height: 15 },
        { text: '9. Performance rating in the last rating period (if applicable);', height: 15 },
        { text: '10. Checklist of Requirements and Omnibus Sworn Statement on the Certification on the Authenticity and Veracity (CAV) of the documents submitted and Data Privacy Consent Form pursuant to RA No. 10173 (Data Privacy Act of 2012), notarized by authorized official; and', height: 30 },
        { text: '11. Other documents as may be required by the DepEd recruitment, selection and appointment guidelines as prescribed by DepEd Order 07 s. 2023 (Non-Teaching, Related Teaching, School Administration) or DepEd Order 20 s. 2024 (Higher Teaching Positions) for comparative assessment, including but not limited to:', height: 30 },
        { text: '           a. Means of Verification (MOVs) showing Outstanding Accomplishments, Application of Education, and Application of Learning and Development reckoned from the date of last issuance of appointment.', height: 30 },
        { text: '', height: 15 },
        { text: 'This Office highly encourages all interested and qualified applicants to apply, which include persons with disability (PWD) and members of the indigenous communities, irrespective of sexual orientation and gender identities and/or expression, civil status, religion, and political affiliation.', height: 30 },
        { text: 'This Office does not discriminate in the selection of employees based on the aforementioned pursuant to Equal Opportunities for Employment Principle (EOP).', height: 15 },
        { text: '', height: 15 },
        { text: 'QUALIFIED APPLICANTS are advised to hand in or send through courier/email their application to the head of office/ human resource management office/records office, as the case may be:', height: 30 },
        { text: '', height: 15 },
        { text: '    JONATHAN S. DELA PEÑA, PhD, CESO V', height: 15 },
        { text: '    Schools Division Superintendent', height: 15 },
        { text: '    DEPED - Iligan City, Aguinaldo St., Poblacion, Iligan City', height: 15 },
        { text: '    recruitment.depediligan@gmail.com', height: 15 },
        { text: '', height: 15 },
        { text: 'APPLICATIONS WITH INCOMPLETE DOCUMENTS SHALL NOT BE ENTERTAINED.', height: 15, bold: true }
    ];

    for (const line of footerLines) {
        sheet.mergeCells(`A${r}:K${r}`);
        const cell = sheet.getCell(`A${r}`);
        cell.value = line.text;
        cell.font = line.bold ? arial11Bold : arial11;
        cell.alignment = { wrapText: true, vertical: 'top' };
        sheet.getRow(r).height = line.height;
        r++;
    }

    return await workbook.xlsx.writeBuffer();
}

module.exports = { generateVERExcelJS };
