const express = require('express');
const router = express.Router();
const positionController = require('../controllers/positionController');
const applicantController = require('../controllers/applicantController');
const db = require('../db');
const authController = require('../controllers/authController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const pdfEvents = require('../utils/pdfEvents');

router.use(requireAuth);

// Removed automatic logging middleware.
        
// Removed automatic logging middleware.
// We will explicitly log specific events.

router.get('/users', requireAdmin, authController.getUsers);
router.post('/users', requireAdmin, authController.createUser);
router.put('/users/:id', requireAdmin, authController.updateUser);
router.delete('/users/:id', requireAdmin, authController.deleteUser);
router.get('/logs', requireAdmin, authController.getLogs);

// Endpoints for managing positions and fetching dynamic plantilla assignments
router.post('/positions', positionController.createPosition);
router.post('/positions/update', positionController.updatePosition);
router.post('/positions/vacancy-off-all', positionController.turnOffAllVacancies);
router.post('/positions/:id/vacancy', positionController.togglePositionVacancy);
router.post('/positions/:id/plantilla', positionController.updatePlantilla);
router.get('/positions/export/doc', positionController.exportDoc);

// Core endpoints for applicant creation, assessment, scoring, and workflow progression
router.post('/applicants', applicantController.createApplicant);
router.delete('/applicants/:id', applicantController.deleteApplicant);
router.post('/applicants/:id/disqualify', applicantController.disqualifyApplicant);
router.post('/applicants/:id/qualify', applicantController.qualifyApplicant);
router.post('/applicants/:id/proceed-step2', applicantController.proceedStep2);
router.put('/applicants/:id/status', applicantController.updateStatus);
router.post('/applicants/:id/requirements/all', applicantController.toggleAllRequirements);
router.post('/applicants/:id/requirement', applicantController.updateRequirement);
router.post('/applicants/:id/assess', applicantController.assessApplicant);
router.post('/applicants/:id/no-appearance', applicantController.noAppearanceApplicant);
router.post('/applicants/:id/newly-promoted', applicantController.newlyPromotedApplicant);
router.post('/applicants/:id/proceed-requirements', applicantController.proceedRequirements);
router.post('/applicants/:id/toggle-assignment-req', applicantController.toggleAssignmentReq);
router.post('/applicants/:id/assign', applicantController.assignApplicant);
router.post('/applicants/:id/complete', applicantController.completeApplicant);
router.put('/applicants/:id/info', applicantController.updateInfo);
router.get('/applicants/:id/details', applicantController.getApplicantDetails);
router.post('/applicants/:id/doc-date', applicantController.saveDocDate);
router.put('/applicants/:id/:type/:docId/status', applicantController.updateDocumentStatus);
// Locking routes removed in favor of Optimistic Locking

// Endpoints for managing applicant educational background records
router.post('/applicants/:id/education', applicantController.addEducation);
router.post('/applicants/:id/education/:eduId/highest', applicantController.setHighestEducation);
router.delete('/education/:id', applicantController.deleteEducation);
router.put('/education/:id/link', applicantController.updateDocumentLink);

// Endpoints for managing applicant training and seminar records
router.post('/applicants/:id/training', applicantController.addTraining);
router.delete('/training/:id', applicantController.deleteTraining);
router.put('/training/:id/link', applicantController.updateDocumentLink);

// Endpoints for managing applicant work experience records
router.post('/applicants/:id/experience', applicantController.addExperience);
router.delete('/experience/:id', applicantController.deleteExperience);
router.put('/experience/:id/link', applicantController.updateDocumentLink);

// Endpoints for managing applicant civil service eligibility records
router.post('/applicants/:id/eligibility', applicantController.addEligibility);
router.delete('/eligibility/:id', applicantController.deleteEligibility);
router.put('/eligibility/:id/link', applicantController.updateDocumentLink);

// Endpoints for applying dynamic inline edits to specific document sections
router.put('/education/:id', applicantController.updateEducation);
router.put('/training/:id', applicantController.updateTraining);
router.put('/experience/:id', applicantController.updateExperience);
router.put('/eligibility/:id', applicantController.updateEligibility);



// JSON Database Backup Endpoint
router.get('/export/backup', async (req, res) => {
    try {
        const [applicants] = await db.query('SELECT * FROM applicants');
        const [education] = await db.query('SELECT * FROM applicant_education');
        const [experience] = await db.query('SELECT * FROM applicant_experience');
        const [training] = await db.query('SELECT * FROM applicant_training');
        const [eligibility] = await db.query('SELECT * FROM applicant_eligibility');
        
        const backupData = {
            metadata: {
                timestamp: new Date().toISOString(),
                totalApplicants: applicants.length
            },
            data: {
                applicants,
                education,
                experience,
                training,
                eligibility
            }
        };

        const dateStr = new Date().toISOString().split('T')[0];
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="RSP-Backup-${dateStr}.json"`);
        res.send(JSON.stringify(backupData, null, 2));
    } catch (error) {
        console.error('Backup Export Error:', error);
        res.status(500).send('Failed to generate backup');
    }
});

// Helper for CSV conversion
function jsonToCsv(jsonArray) {
    if (!jsonArray || !jsonArray.length) return '';
    const keys = Object.keys(jsonArray[0]);
    const header = keys.join(',');
    const rows = jsonArray.map(obj => {
        return keys.map(k => {
            let val = obj[k];
            if (val === null || val === undefined) return '';
            val = String(val).replace(/"/g, '""');
            if (val.search(/("|,|\n)/g) >= 0) val = `"${val}"`;
            return val;
        }).join(',');
    });
    return [header, ...rows].join('\n');
}

// CSV Database Backup Endpoint (Zip of CSVs)
router.get('/export/backup/csv', async (req, res) => {
    try {
        const [applicants] = await db.query('SELECT * FROM applicants');
        const [education] = await db.query('SELECT * FROM applicant_education');
        const [experience] = await db.query('SELECT * FROM applicant_experience');
        const [training] = await db.query('SELECT * FROM applicant_training');
        const [eligibility] = await db.query('SELECT * FROM applicant_eligibility');
        
        const PizZip = require('pizzip');
        const zip = new PizZip();
        
        zip.file('applicants.csv', jsonToCsv(applicants));
        zip.file('education.csv', jsonToCsv(education));
        zip.file('experience.csv', jsonToCsv(experience));
        zip.file('training.csv', jsonToCsv(training));
        zip.file('eligibility.csv', jsonToCsv(eligibility));
        
        const content = zip.generate({ type: 'nodebuffer' });
        const dateStr = new Date().toISOString().split('T')[0];
        
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="RSP-Backup-CSV-${dateStr}.zip"`);
        res.send(content);
    } catch (error) {
        console.error('CSV Backup Export Error:', error);
        res.status(500).send('Failed to generate CSV backup');
    }
});

// Endpoint to fetch daily email sending limit and remaining count
router.get('/export/email-codes/limits', async (req, res) => {
    try {
        const [logs] = await db.query('SELECT COUNT(*) as sentToday FROM applicant_email_logs WHERE DATE(sent_at) = CURDATE()');
        const sentToday = logs[0].sentToday || 0;
        const singleLimit = parseInt(process.env.DAILY_EMAIL_LIMIT) || 500;
        const dailyLimit = singleLimit * 2; // Total for both accounts
        const remaining = Math.max(0, dailyLimit - sentToday);
        
        res.json({ success: true, sentToday, dailyLimit, remaining });
    } catch (error) {
        console.error('Fetch Email Limits Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch email limits' });
    }
});

// Endpoint to fetch applicants who have emails
router.get('/export/email-codes/applicants', async (req, res) => {
    try {
        const { type } = req.query;
        let statusFilter = "AND a.status != 'PENDING'";
        
        if (type === 'docs') {
            statusFilter = "AND a.status IN ('QUALIFIED', 'DISQUALIFIED')";
        }

        const emailType = type === 'docs' ? 'docs' : 'codes';
        const query = `
            SELECT a.id, a.firstName, a.lastName, a.emailAddress, a.applicationCode, a.position, a.vacancyAnnouncementNo, a.status,
                   COUNT(l.id) AS emailCount
            FROM applicants a
            LEFT JOIN applicant_email_logs l ON a.id = l.applicant_id AND l.email_type = '${emailType}'
            WHERE a.emailAddress IS NOT NULL 
              AND a.emailAddress != '' 
              ${statusFilter}
            GROUP BY a.id, a.firstName, a.lastName, a.emailAddress, a.applicationCode, a.position, a.vacancyAnnouncementNo, a.status
        `;
        const [applicants] = await db.query(query);
        res.json({ success: true, applicants });
    } catch (error) {
        console.error('Fetch Applicants Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch applicants' });
    }
});

// Endpoint to auto email application codes to specific applicants
router.post('/export/email-codes', async (req, res) => {
    try {
        const { applicantIds, accountIndex } = req.body;
        if (!applicantIds || !Array.isArray(applicantIds) || applicantIds.length === 0) {
            return res.status(400).json({ success: false, message: 'No applicants selected.' });
        }

        const [applicants] = await db.query('SELECT id, firstName, lastName, emailAddress, applicationCode FROM applicants WHERE id IN (?) AND emailAddress IS NOT NULL AND emailAddress != ""', [applicantIds]);
        
        if (!applicants || applicants.length === 0) {
            return res.status(404).json({ message: 'No applicants with valid email addresses found among the selection.' });
        }

        // Get count of emails sent today for these applicants
        const [todayLogs] = await db.query('SELECT applicant_id, COUNT(*) as todayCount FROM applicant_email_logs WHERE applicant_id IN (?) AND DATE(sent_at) = CURDATE() GROUP BY applicant_id', [applicantIds]);
        const todayCountMap = {};
        todayLogs.forEach(log => {
            todayCountMap[log.applicant_id] = log.todayCount;
        });

        const nodemailer = require('nodemailer');
        
        const accIdx = accountIndex || '1';
        const host = process.env[`SMTP_HOST_${accIdx}`] || process.env.SMTP_HOST || 'smtp.gmail.com';
        const port = process.env[`SMTP_PORT_${accIdx}`] || process.env.SMTP_PORT || 587;
        const user = process.env[`SMTP_USER_${accIdx}`] || process.env.SMTP_USER || 'your-email@gmail.com';
        const pass = process.env[`SMTP_PASS_${accIdx}`] || process.env.SMTP_PASS || 'your-email-password';
        const gmailName = process.env[`SMTP_GMAILNAME_${accIdx}`] || process.env.SMTP_GMAILNAME || '';

        let transporter = nodemailer.createTransport({
            host: host,
            port: port,
            secure: port == 465, 
            auth: {
                user: user, 
                pass: pass
            }
        });

        let sentCount = 0;
        let skippedCount = 0;
        let errors = [];

        for (const applicant of applicants) {
            // Check daily limit (2 per day)
            if (todayCountMap[applicant.id] >= 2) {
                skippedCount++;
                continue;
            }
            try {
                let info = await transporter.sendMail({
                    from: `"${gmailName}" <${user}>`,
                    to: applicant.emailAddress,
                    subject: 'Your Application Code',
                    text: `Hello ${applicant.firstName} ${applicant.lastName},\n\nYour application code for the Recruitment and Selection Process is: ${applicant.applicationCode}\n\nPlease keep this code for your reference.\n\nThank you!`,
                    html: `<p>Hello ${applicant.firstName} ${applicant.lastName},</p><p>Your application code for the Recruitment and Selection Process is: <strong>${applicant.applicationCode}</strong></p><p>Please keep this code for your reference.</p><p>Thank you!</p>`
                });
                
                // Log success
                await db.query("INSERT INTO applicant_email_logs (applicant_id, email_type) VALUES (?, 'codes')", [applicant.id]);
                
                sentCount++;
            } catch (err) {
                console.error(`Failed to send to ${applicant.emailAddress}:`, err);
                errors.push(applicant.emailAddress);
            }
        }
        
        let message = `Application codes sent successfully to ${sentCount} applicants.`;
        if (skippedCount > 0) message += ` Skipped ${skippedCount} applicants (daily limit reached).`;

        res.json({ 
            success: true, 
            message: message,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Email Application Codes Error:', error);
        res.status(500).json({ success: false, message: 'Failed to send emails' });
    }
});

router.get('/export/check-generated-docs', async (req, res) => {
    try {
        const { templateName } = req.query;
        if (!templateName) return res.json({ success: true, readyIds: [] });

        const fs = require('fs');
        const path = require('path');
        const generatedDir = path.join(__dirname, '..', 'public', 'generated_notices');
        
        if (!fs.existsSync(generatedDir)) {
            return res.json({ success: true, readyIds: [] });
        }

        const files = fs.readdirSync(generatedDir);
        const safeTemplateName = templateName.replace(/[^a-zA-Z0-9]/g, '_');
        
        // Files are named like: 123_Notice_to_DQ.pdf
        const readyIds = files
            .filter(f => f.includes(`_${safeTemplateName}.`) && (f.endsWith('.pdf') || f.endsWith('.docx')))
            .map(f => parseInt(f.split('_')[0]))
            .filter(id => !isNaN(id));

        res.json({ success: true, readyIds });
    } catch (error) {
        console.error('Check generated docs error:', error);
        res.status(500).json({ success: false, message: 'Failed to check generated docs' });
    }
});

router.post('/export/pre-generate-docs', async (req, res) => {
    try {
        const { applicantIds, templateName } = req.body;
        if (!applicantIds || !Array.isArray(applicantIds) || applicantIds.length === 0) {
            return res.status(400).json({ success: false, message: 'No applicants selected.' });
        }
        if (!templateName) {
            return res.status(400).json({ success: false, message: 'No template selected.' });
        }

        const [applicants] = await db.query('SELECT * FROM applicants WHERE id IN (?)', [applicantIds]);
        
        if (!applicants || applicants.length === 0) {
            return res.status(404).json({ message: 'No applicants found.' });
        }

        const PizZip = require('pizzip');
        const Docxtemplater = require('docxtemplater');
        const fs = require('fs');
        const path = require('path');
        const os = require('os');
        const util = require('util');
        const execAsync = util.promisify(require('child_process').exec);

        const generatedDir = path.join(__dirname, '..', 'public', 'generated_notices');
        fs.mkdirSync(generatedDir, { recursive: true });

        // Load the template
        const templatePath = path.join(__dirname, '..', 'public', 'templates', templateName + '.docx');
        let content;
        try {
            content = fs.readFileSync(templatePath, 'binary');
        } catch (err) {
            return res.status(400).json({ success: false, message: 'Template not found: ' + templateName });
        }

        const cleanText = (txt) => {
            if (!txt) return '';
            return String(txt).replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
        };

        const getRemark = (items) => {
            if(!items || items.length === 0) return 'Disqualified';
            if(items.some(i => i.status === 'DISQUALIFIED')) return 'Disqualified';
            if(items.some(i => i.status === 'PENDING' || !i.status)) return 'Pending';
            return 'Qualified';
        };

        let generatedCount = 0;
        let errors = [];

        for (const app of applicants) {
            try {
                // Fetch extra details
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
                
                const reasonText = app.disqualificationReason || 'Pursuant to Section 21 of DO 7 s. 2023 provides that "Individuals who failed to submit complete mandatory documents (Items 20.a to 20.j) on the set deadline indicated in the official memorandum shall not be included in the pool of official applicants.” and upon reviewing your submitted documents, you failed to meet the complete mandatory requirements or qualifications.';
                
                const d = new Date();
                const dateStr = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                const remarksDate = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;

                const templateData = {
                    FormattedDate: dateStr,
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
                
                const baseName = `${app.id}_${templateName.replace(/[^a-zA-Z0-9]/g, '_')}`;
                const inputPath = path.join(tempDir, baseName + '.docx');
                fs.writeFileSync(inputPath, buf);
                
                const finalOutputPath = path.join(generatedDir, baseName + '.pdf');

                if (os.platform() === 'win32') {
                    // Windows MS Word COM Object
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
                    // Linux / macOS LibreOffice headless
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
                generatedCount++;
            } catch (err) {
                console.error(`Failed to pre-generate doc for ${app.id}:`, err);
                errors.push(app.id);
            }
        }
        
        let message = `Pre-generated ${generatedCount} PDFs successfully.`;
        res.json({ success: true, message: message, errors: errors.length > 0 ? errors : undefined });
    } catch (error) {
        console.error('Pre-Generate Error:', error);
        res.status(500).json({ success: false, message: 'Failed to pre-generate documents' });
    }
});

router.post('/export/email-docs', async (req, res) => {
    try {
        const { applicantIds, accountIndex, templateName } = req.body;
        if (!applicantIds || !Array.isArray(applicantIds) || applicantIds.length === 0) {
            return res.status(400).json({ success: false, message: 'No applicants selected.' });
        }
        if (!templateName) {
            return res.status(400).json({ success: false, message: 'No template selected.' });
        }

        const [applicants] = await db.query('SELECT * FROM applicants WHERE id IN (?) AND emailAddress IS NOT NULL AND emailAddress != ""', [applicantIds]);
        
        if (!applicants || applicants.length === 0) {
            return res.status(404).json({ message: 'No applicants with valid email addresses found among the selection.' });
        }

        const nodemailer = require('nodemailer');
        const fs = require('fs');
        const path = require('path');
        
        const accIdx = accountIndex || '1';
        const host = process.env[`SMTP_HOST_${accIdx}`] || process.env.SMTP_HOST || 'smtp.gmail.com';
        const port = process.env[`SMTP_PORT_${accIdx}`] || process.env.SMTP_PORT || 587;
        const user = process.env[`SMTP_USER_${accIdx}`] || process.env.SMTP_USER || 'your-email@gmail.com';
        const pass = process.env[`SMTP_PASS_${accIdx}`] || process.env.SMTP_PASS || 'your-email-password';
        const gmailName = process.env[`SMTP_GMAILNAME_${accIdx}`] || process.env.SMTP_GMAILNAME || '';

        let transporter = nodemailer.createTransport({
            host: host,
            port: port,
            secure: port == 465, 
            auth: { user: user, pass: pass }
        });

        let sentCount = 0;
        let errors = [];
        const generatedDir = path.join(__dirname, '..', 'public', 'generated_notices');

        for (const app of applicants) {
            try {
                const baseName = `${app.id}_${templateName.replace(/[^a-zA-Z0-9]/g, '_')}`;
                const pdfPath = path.join(generatedDir, baseName + '.pdf');
                const docxPath = path.join(generatedDir, baseName + '.docx');
                
                let attachmentBuf;
                let attachmentName;

                if (fs.existsSync(pdfPath)) {
                    attachmentBuf = fs.readFileSync(pdfPath);
                    attachmentName = 'Notice_of_Evaluation.pdf';
                } else if (fs.existsSync(docxPath)) {
                    attachmentBuf = fs.readFileSync(docxPath);
                    attachmentName = 'Notice_of_Evaluation.docx';
                } else {
                    throw new Error(`Pre-generated file not found for Applicant ID ${app.id}. Please click "Pre-Generate PDFs" first.`);
                }

                let info = await transporter.sendMail({
                    from: `"${gmailName}" <${user}>`,
                    to: app.emailAddress,
                    subject: 'Your Initial Evaluation Document',
                    text: `Hello ${app.firstName} ${app.lastName},\n\nPlease find attached your Step 1 Evaluation Document.\n\nThank you!`,
                    html: `<p>Hello ${app.firstName} ${app.lastName},</p><p>Please find attached your Step 1 Evaluation Document.</p><p>Thank you!</p>`,
                    attachments: [{ filename: attachmentName, content: attachmentBuf }]
                });
                
                await db.query("INSERT INTO applicant_email_logs (applicant_id, email_type) VALUES (?, 'docs')", [app.id]);
                sentCount++;
            } catch (err) {
                console.error(`Failed to send doc to ${app.emailAddress}:`, err);
                errors.push(app.emailAddress);
            }
        }
        
        let message = `Emails sent successfully to ${sentCount} applicants.`;
        res.json({ success: true, message: message, errors: errors.length > 0 ? errors : undefined });

    } catch (error) {
        console.error('Email Docs Error:', error);
        res.status(500).json({ success: false, message: 'Failed to send documents' });
    }
});

router.post('/export/convert-to-pdf', async (req, res) => {
    try {
        const { filename, docxBase64 } = req.body;
        if (!docxBase64) return res.status(400).json({ error: 'Missing document data' });

        const fs = require('fs');
        const path = require('path');
        const os = require('os');
        const { exec } = require('child_process');
        
        // Find LibreOffice
        let sofficePath = 'soffice';
        if (os.platform() === 'win32') {
            const commonPaths = [
                'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
                'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
                'C:\\Program Files\\LibreOffice 5\\program\\soffice.exe'
            ];
            let found = false;
            for (let p of commonPaths) {
                if (fs.existsSync(p)) {
                    sofficePath = `"${p}"`;
                    found = true;
                    break;
                }
            }
            if (!found) {
                // If not found in common paths, it will rely on PATH. If that fails, it catches below.
            }
        }

        const tempDir = path.join(os.tmpdir(), 'rsp_pdf_convert_' + Date.now());
        fs.mkdirSync(tempDir, { recursive: true });
        
        const safeName = (filename || 'doc').replace(/[^a-zA-Z0-9_\-\.]/g, '_');
        const inputPath = path.join(tempDir, safeName);
        const outputFilename = safeName.replace('.docx', '.pdf');
        const outputPath = path.join(tempDir, outputFilename);

        const buffer = Buffer.from(docxBase64, 'base64');
        fs.writeFileSync(inputPath, buffer);

        const cmd = `${sofficePath} --headless --convert-to pdf --outdir "${tempDir}" "${inputPath}"`;
        
        exec(cmd, { timeout: 30000 }, (error, stdout, stderr) => {
            if (error) {
                if (error.message && error.message.includes('is not recognized')) {
                    console.warn("LibreOffice not found. PDF conversion failed, returning 500 to trigger frontend fallback.");
                } else {
                    console.error("LibreOffice conversion failed. Returning 500 to trigger frontend fallback.");
                }
                // Clean up and return error so frontend can fallback
                try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
                return res.status(500).json({ error: 'PDF conversion failed.' });
            }
            
            if (fs.existsSync(outputPath)) {
                res.download(outputPath, outputFilename, (err) => {
                    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
                });
            } else {
                try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
                res.status(500).json({ error: 'Output PDF not found.' });
            }
        });
    } catch (err) {
        console.error("PDF conversion route error:", err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// SSE endpoint for real-time PDF generation notifications
router.get('/events/pdf-status', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
    });
    res.write('data: {"connected":true}\n\n');

    const onPdfDone = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };
    pdfEvents.on('pdf-done', onPdfDone);

    const heartbeat = setInterval(() => {
        res.write(': heartbeat\n\n');
    }, 15000);

    req.on('close', () => {
        clearInterval(heartbeat);
        pdfEvents.removeListener('pdf-done', onPdfDone);
    });
});

module.exports = router;
