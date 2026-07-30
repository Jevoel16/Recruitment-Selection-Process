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
    const [performance] = await db.query('SELECT * FROM applicant_performance WHERE applicant_id = ? ORDER BY id ASC', [app.id]);
    
    let rating1 = '', rating2 = '', rating3 = '';
    let rmPerf = 'Disqualified';
    if (performance && performance.length > 0) {
        const perfRecords = performance.slice(0, 3);
        const formatRating = (p) => p ? `${p.ratingPeriod || ''}: ${p.rating || ''} ${p.letterGrade ? '(' + p.letterGrade + ')' : ''}`.trim() : '';
        rating1 = formatRating(perfRecords[0]);
        rating2 = formatRating(perfRecords[1]);
        rating3 = formatRating(perfRecords[2]);

        if (perfRecords.some(p => p.status === 'DISQUALIFIED')) {
            rmPerf = 'Unmet';
        } else if (perfRecords.every(p => p.status === 'QUALIFIED')) {
            rmPerf = 'Met';
        } else {
            rmPerf = 'Pending';
        }
    }
    
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
    
    let reasonText = app.disqualificationReason || `While your qualifications made a favorable impression, we regret to inform you that you did not meet the minimum QS set for ${pos} position.`;
    if (app.disqualificationReason && !app.disqualificationReason.includes('we regret')) {
        reasonText += ` Thus, we regret that you cannot proceed for the next stage of the selection process for ${pos} position.`;
    }
    
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
        
        QSEducation: positionStandards?.qsEducation ? cleanText(positionStandards.qsEducation) : '',
        AppEducation: (getRemark(education) === 'Disqualified' ? '@@RED@@' : '') + (cleanText((education || []).map(e => e.degree || e.title).join(', ')) || ''),
        RmEducation: (getRemark(education) === 'Disqualified' ? '@@RED@@' : '') + getRemark(education),

        QSTraining: positionStandards?.qsTraining ? cleanText(positionStandards.qsTraining) : '',
        AppTraining: (getRemark(training) === 'Disqualified' ? '@@RED@@' : '') + (cleanText((training || []).map(e => e.title).join(', ')) || ''),
        RmTraining: (getRemark(training) === 'Disqualified' ? '@@RED@@' : '') + getRemark(training),

        QSExperience: positionStandards?.qsExperience ? cleanText(positionStandards.qsExperience) : '',
        AppExperience: (getRemark(experience) === 'Disqualified' ? '@@RED@@' : '') + (cleanText((experience || []).map(e => e.details).join(', ')) || ''),
        RmExperience: (getRemark(experience) === 'Disqualified' ? '@@RED@@' : '') + getRemark(experience),

        QSEligibility: positionStandards?.qsEligibility ? cleanText(positionStandards.qsEligibility) : '',
        AppEligibility: (getRemark(eligibility) === 'Disqualified' ? '@@RED@@' : '') + (cleanText((eligibility || []).map(e => e.title || e.details).join(', ')) || ''),
        RmEligibility: (getRemark(eligibility) === 'Disqualified' ? '@@RED@@' : '') + getRemark(eligibility),

        QSPerformance: positionStandards?.qsPerformance ? cleanText(positionStandards.qsPerformance) : '',
        Rating1: (rmPerf === 'Unmet' || rmPerf === 'Disqualified' ? '@@RED@@' : '') + rating1,
        Rating2: (rmPerf === 'Unmet' || rmPerf === 'Disqualified' ? '@@RED@@' : '') + rating2,
        Rating3: (rmPerf === 'Unmet' || rmPerf === 'Disqualified' ? '@@RED@@' : '') + rating3,
        RmPerformance: (rmPerf === 'Unmet' || rmPerf === 'Disqualified' ? '@@RED@@' : '') + rmPerf,

        Remarks: `JSD/MPM/ABQ/KMJ - ${remarksDate}`
    };

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    doc.render(templateData);
    
    const outZip = doc.getZip();
    let xmlContent = outZip.file("word/document.xml").asText();
    if (xmlContent.includes('@@RED@@')) {
        xmlContent = xmlContent.replace(/<w:t([^>]*)>([^<]*)@@RED@@([^<]*)<\/w:t>/g, '<w:t$1>$2</w:t></w:r><w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t$1>$3</w:t>');
        outZip.file("word/document.xml", xmlContent);
    }
    const buf = outZip.generate({ type: 'nodebuffer' });

    const tempDir = path.join(os.tmpdir(), 'rsp_pdf_gen_' + Date.now() + '_' + app.id);
    fs.mkdirSync(tempDir, { recursive: true });
    
    const cleanLName = (app.lastName || '').replace(/[^a-zA-Z0-9]/g, '');
    const cleanFName = (app.firstName || '').replace(/[^a-zA-Z0-9]/g, '');
    
    let posCode = 'UnknownPos';
    let vacancyNo = 'UnknownVac';
    let increment = '0000';
    if (app.applicationCode) {
        const parts = app.applicationCode.split('-');
        if (parts.length >= 4) {
            posCode = parts[0];
            vacancyNo = parts[1];
            increment = parts[3];
        } else if (parts.length > 0) {
            posCode = parts[0];
            increment = parts[parts.length - 1];
        }
    } else {
        if (positionStandards && positionStandards.position_code) posCode = positionStandards.position_code.replace(/[^a-zA-Z0-9]/g, '');
        if (app.vacancyAnnouncementNo) vacancyNo = app.vacancyAnnouncementNo.replace(/[^a-zA-Z0-9]/g, '');
    }
    
    let noticeType = 'NoticeOfEvaluation';
    if (templateName.includes('Notice to DQ')) {
        noticeType = 'Notice_to_DQ';
    } else if (templateName.includes('Notice to Qualified')) {
        noticeType = 'Notice_to_Qualified';
    }

    const baseName = `${cleanLName}_${cleanFName}_${posCode}-${increment}-${vacancyNo}_${noticeType}_${app.id}`;
    
    const inputPath = path.join(tempDir, baseName + '.docx');
    fs.writeFileSync(inputPath, buf);
    
    const finalOutputPath = path.join(generatedDir, baseName + '.pdf');

    if (os.platform() === 'win32') {
        let success = false;
        let attempt = 1;
        const maxRetries = 20;
        
        while (!success && attempt <= maxRetries) {
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
                    success = true;
                } else {
                    throw new Error('PDF output not found');
                }
            } catch (convErr) {
                console.warn(`Windows PDF conversion attempt ${attempt} failed for ${appName}:`, convErr.message);
                try { await execAsync('taskkill /F /IM winword.exe /T'); } catch(e) {}
                await new Promise(res => setTimeout(res, 2000));
                attempt++;
            }
        }
        
        if (!success) {
            console.error(`Windows PDF conversion failed after ${maxRetries} attempts for ${appName}. Aborting.`);
            throw new Error('Failed to generate PDF');
        }
    } else {
        let success = false;
        let attempt = 1;
        const maxRetries = 20;
        
        while (!success && attempt <= maxRetries) {
            try {
                await execAsync(`libreoffice --headless --convert-to pdf "${inputPath}" --outdir "${tempDir}"`, { timeout: 60000 });
                const outputPath = path.join(tempDir, baseName + '.pdf');
                if (fs.existsSync(outputPath)) {
                    fs.copyFileSync(outputPath, finalOutputPath);
                    success = true;
                } else {
                    throw new Error('PDF output not found');
                }
            } catch (convErr) {
                console.warn(`LibreOffice PDF conversion attempt ${attempt} failed for ${appName}:`, convErr.message);
                await new Promise(res => setTimeout(res, 2000));
                attempt++;
            }
        }
        
        if (!success) {
            console.error(`LibreOffice PDF conversion failed after ${maxRetries} attempts for ${appName}. Aborting.`);
            throw new Error('Failed to generate PDF');
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
