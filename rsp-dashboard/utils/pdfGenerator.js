const db = require('../db');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');
const os = require('os');
const util = require('util');
const execAsync = util.promisify(require('child_process').exec);

const cleanText = (txt) => {
    if (!txt) return '';
    return String(txt).replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
};

const getRemark = (items) => {
    if (!items || items.length === 0) return 'Disqualified';
    if (items.some(i => i.status === 'DISQUALIFIED')) return 'Disqualified';
    if (items.some(i => i.status === 'PENDING' || !i.status)) return 'Pending';
    return 'Qualified';
};

let pdfQueue = Promise.resolve();

const doGeneratePDFForApplicant = async (app, templateName) => {
    const generatedDir = path.join(__dirname, '..', 'public', 'generated_notices');
    fs.mkdirSync(generatedDir, { recursive: true });

    const templatePath = path.join(__dirname, '..', 'public', 'templates', templateName + '.docx');
    let content;
    try {
        content = fs.readFileSync(templatePath, 'binary');
    } catch (err) {
        throw new Error('Template not found: ' + templateName);
    }

    const [education] = await db.query('SELECT * FROM applicant_education WHERE applicant_id = ?', [app.id]);
    const [training] = await db.query('SELECT * FROM applicant_training WHERE applicant_id = ?', [app.id]);
    const [experience] = await db.query('SELECT * FROM applicant_experience WHERE applicant_id = ?', [app.id]);
    const [eligibility] = await db.query('SELECT * FROM applicant_eligibility WHERE applicant_id = ?', [app.id]);
    
    let positionStandards = null;
    if (app.position) {
        const [posRows] = await db.query('SELECT * FROM positions WHERE title = ? LIMIT 1', [app.position]);
        if (posRows.length > 0) positionStandards = posRows[0];
    }

    let appName = 'Unknown Applicant';
    const fName = app.firstName || '';
    const mName = app.middleName || '';
    const lName = app.lastName || '';
    if (mName && mName.trim() !== '') appName = `${fName} ${mName.trim().charAt(0).toUpperCase()}. ${lName}`.trim();
    else if (fName || lName) appName = `${fName} ${lName}`.trim();
    else if (app.name) appName = app.name;

    let addressStr = app.address || 'Iligan City';
    try {
        const parsed = JSON.parse(addressStr);
        if (parsed.res_city) addressStr = parsed.res_city;
    } catch(e) { }

    const sex = app.sex;
    const title = sex === 'Female' ? 'Madam' : 'Sir';
    const pos = app.position || 'Position';
    const appCode = app.applicationCode || '[Application Code]';
    
    let reasonText = app.disqualificationReason || 'Pursuant to Section 21 of DO 7 s. 2023 provides that "Individuals who failed to submit complete mandatory documents (Items 20.a to 20.j) on the set deadline indicated in the official memorandum shall not be included in the pool of official applicants.” and upon reviewing your submitted documents, you failed to meet the complete mandatory requirements or qualifications.';
    reasonText += ` Thus, we regret that you cannot proceed for the next stage of the selection process for ${pos} position.`;
    
    const d = new Date();
    const dateStr = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const remarksDate = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;

    const templateData = {
        FormattedDate: dateStr,
        IEDate: dateStr,
        ApplicantName: appName.toUpperCase(),
        Address: addressStr,
        Title: title,
        Position: pos,
        PositionAppliedFor: pos,
        ApplicationCode: appCode,
        ReasonText: reasonText,
        
        QSEducation: positionStandards?.qsEducation ? 'Education: ' + cleanText(positionStandards.qsEducation) : '',
        AppEducation: cleanText((education || []).map(e => e.degree || e.title).join(', ')) || '',
        RmEducation: getRemark(education),

        QSTraining: positionStandards?.qsTraining ? 'Training: ' + cleanText(positionStandards.qsTraining) : '',
        AppTraining: cleanText((training || []).map(e => e.title).join(', ')) || '',
        RmTraining: getRemark(training),

        QSExperience: positionStandards?.qsExperience ? 'Experience: ' + cleanText(positionStandards.qsExperience) : '',
        AppExperience: cleanText((experience || []).map(e => e.details).join(', ')) || '',
        RmExperience: getRemark(experience),

        QSEligibility: positionStandards?.qsEligibility ? 'Eligibility: ' + cleanText(positionStandards.qsEligibility) : '',
        AppEligibility: cleanText((eligibility || []).map(e => e.title || e.details).join(', ')) || '',
        RmEligibility: getRemark(eligibility),

        Remarks: `JSD/MPM/ABQ/KMJ - ${remarksDate}`
    };

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    doc.render(templateData);
    const buf = doc.getZip().generate({ type: 'nodebuffer' });

    const tempDir = path.join(os.tmpdir(), 'rsp_pdf_gen_' + Date.now() + '_' + app.id);
    fs.mkdirSync(tempDir, { recursive: true });
    
    const safeLName = app.lastName ? app.lastName.replace(/[^a-zA-Z0-9]/g, '') : '';
    const safeFName = app.firstName ? app.firstName.replace(/[^a-zA-Z0-9]/g, '') : '';
    const pCode = positionStandards?.position_code ? positionStandards.position_code.replace(/[^a-zA-Z0-9]/g, '') : '';
    const noticeType = templateName.replace(/[^a-zA-Z0-9]/g, '_');
    const baseName = `${safeLName}_${safeFName}_${pCode}_${noticeType}_${app.id}`;
    
    const inputPath = path.join(tempDir, baseName + '.docx');
    fs.writeFileSync(inputPath, buf);
    
    const finalOutputPath = path.join(generatedDir, baseName + '.pdf');

    if (os.platform() === 'win32') {
        try {
            const outputPath = path.join(tempDir, baseName + '.pdf');
            const psScript = `
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open('${inputPath}')
$doc.ExportAsFixedFormat('${outputPath}', 17, $false, 0)
$doc.Close()
$word.Quit()
            `;
            const scriptPath = path.join(tempDir, 'convert.ps1');
            fs.writeFileSync(scriptPath, psScript);
            await execAsync(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`, { timeout: 60000 });
            
            if (fs.existsSync(outputPath)) {
                fs.copyFileSync(outputPath, finalOutputPath);
            } else {
                throw new Error('PDF output not found');
            }
        } catch (convErr) {
            console.warn(`Windows PDF conversion failed for ${appName}. Generating DOCX fallback.`);
            fs.copyFileSync(inputPath, finalOutputPath.replace('.pdf', '.docx'));
            try { await execAsync('taskkill /F /IM winword.exe /T'); } catch(e) {}
        }
    } else {
        try {
            await execAsync(`libreoffice --headless --convert-to pdf "${inputPath}" --outdir "${tempDir}"`, { timeout: 60000 });
            const outputPath = path.join(tempDir, baseName + '.pdf');
            if (fs.existsSync(outputPath)) {
                fs.copyFileSync(outputPath, finalOutputPath);
            } else {
                throw new Error('PDF output not found');
            }
        } catch (convErr) {
            console.warn(`LibreOffice PDF conversion failed for ${appName}. Generating DOCX fallback.`);
            fs.copyFileSync(inputPath, finalOutputPath.replace('.pdf', '.docx'));
        }
    }
    
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
    
    return true;
};

exports.generatePDFForApplicant = (app, templateName) => {
    const task = () => doGeneratePDFForApplicant(app, templateName);
    
    // Add to the sequential queue regardless of previous task success/failure
    const p = pdfQueue.then(task, task);
    
    // Prevent unhandled rejections from stopping the queue
    pdfQueue = p.catch(() => {});
    
    return p;
};
