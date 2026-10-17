require('dotenv').config();
const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const hbs = require('hbs');
const path = require('path');
const db = require('./db');
const { identityMiddleware } = require('./middleware/authMiddleware');
const { hashPassword, verifyPassword } = require('./utils/security');

const app = express();
const PORT = process.env.PORT || 3000;
app.set('trust proxy', process.env.TRUST_PROXY || 'loopback');

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
// Security headers; CSP stays off until inline scripts are moved out of the views
app.use(helmet({ contentSecurityPolicy: false, hsts: process.env.NODE_ENV === 'production' }));
app.use(compression());
// Small default body limit; only the DOCX upload endpoint accepts large payloads
const largeBodyPaths = new Set(['/api/export/convert-to-pdf']);
const jsonDefault = express.json({ limit: '5mb' });
const jsonLarge = express.json({ limit: '50mb' });
app.use((req, res, next) => (largeBodyPaths.has(req.path) ? jsonLarge : jsonDefault)(req, res, next));
app.use(express.urlencoded({ limit: '5mb', extended: true }));
app.use(cookieParser());
app.use(identityMiddleware);

// Serve static assets for application public directory and third-party dependencies
const staticOptions = { maxAge: '30d' };
// Generated notices contain applicant data and are only sent by email, never served publicly
app.use('/generated_notices', (req, res) => res.status(404).end());
app.use(express.static(path.join(__dirname, 'public'), staticOptions));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist'), staticOptions));
app.use('/bootstrap-icons', express.static(path.join(__dirname, 'node_modules/bootstrap-icons/font'), staticOptions));
app.use('/pizzip', express.static(path.join(__dirname, 'node_modules/pizzip/dist'), staticOptions));
app.use('/docxtemplater', express.static(path.join(__dirname, 'node_modules/docxtemplater/build'), staticOptions));
app.use('/file-saver', express.static(path.join(__dirname, 'node_modules/file-saver/dist'), staticOptions));
app.use('/chartjs', express.static(path.join(__dirname, 'node_modules/chart.js/dist'), staticOptions));
app.use('/fontsource-inter', express.static(path.join(__dirname, 'node_modules/@fontsource/inter'), staticOptions));
app.use('/choices.js', express.static(path.join(__dirname, 'node_modules/choices.js/public/assets'), staticOptions));
// Cache-busting token for /js and /css URLs: changes whenever any of those files change
app.locals.assetVersion = (() => {
    const crypto = require('crypto');
    const fs = require('fs');
    const hash = crypto.createHash('md5');
    for (const dir of ['js', 'css']) {
        const fullDir = path.join(__dirname, 'public', dir);
        for (const file of fs.readdirSync(fullDir).sort()) hash.update(fs.readFileSync(path.join(fullDir, file)));
    }
    return hash.digest('hex').slice(0, 10);
})();

// Initialize Handlebars view engine and register partial components
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
hbs.registerPartials(path.join(__dirname, 'views', 'partials'));

// Handlebars template helper functions
hbs.registerHelper('inc', function(value) { return parseInt(value) + 1; });
hbs.registerHelper('incOffset', function(value, offset) { return parseInt(value) + parseInt(offset) + 1; });
hbs.registerHelper('eq', function (a, b) { return a === b; });
hbs.registerHelper('titleCase', function(str) {
    if (!str || typeof str !== 'string') return str;
    return str.split(' ').map(word => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '').join(' ');
});
hbs.registerHelper('allRequirementsMet', function(applicant) { return requirementFields.every((field) => Boolean(applicant[field])); });
hbs.registerHelper('formatDate', function(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
});
hbs.registerHelper('isStep1Or2', function(status) {
    const validStatuses = ['PENDING', 'QUALIFIED', 'DISQUALIFIED', 'DISQUALIFIED_ARCHIVED', 'WAITING_FOR_ASSESSMENT'];
    return validStatuses.includes(status);
});

// Import route definitions
const apiRoutes = require('./routes/apiRoutes');
const viewRoutes = require('./routes/viewRoutes');

// Mount route middleware for API and web interfaces
app.use('/api', apiRoutes);
app.use('/', viewRoutes);

// Export functionality for Initial Evaluation Results (IER)
const excelExportIER = require('./routes/excelExportIER');
app.use('/api/export', excelExportIER);

// Export functionality for Comparative Assessment Result (CAR)
const excelExportCAR = require('./routes/excelExportCAR');
app.use('/api/export', excelExportCAR);

// Export functionality for Vacant Positions (VER)
const excelExportVER = require('./routes/excelExportVER');
app.use('/api/export', excelExportVER);

// Final error handler: JSON for API calls, plain text for pages
app.use((err, req, res, next) => {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
    if (res.headersSent) return next(err);
    const status = err.status || err.statusCode || 500;
    const message = status === 413 ? 'Request body too large' : (status < 500 ? err.message : 'Internal server error');
    if (req.originalUrl.startsWith('/api')) return res.status(status).json({ success: false, error: message });
    res.status(status).send(message);
});

process.on('unhandledRejection', (reason) => {
    console.error('[Unhandled Rejection]', reason);
});

async function ensureRequirementColumns() {
    const [columns] = await db.query(`SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'applicants'`, [process.env.DB_NAME || 'rsp_db']);
    const existingColumns = new Set(columns.map((column) => column.COLUMN_NAME));
    const missingColumns = requirementFields.filter((field) => !existingColumns.has(field));
    for (const column of missingColumns) await db.query(`ALTER TABLE applicants ADD COLUMN ${column} BOOLEAN DEFAULT FALSE AFTER contactNo`);
    if (!existingColumns.has('cc')) await db.query(`ALTER TABLE applicants ADD COLUMN cc VARCHAR(255) DEFAULT NULL`);
    if (!existingColumns.has('ccDesignation')) await db.query(`ALTER TABLE applicants ADD COLUMN ccDesignation VARCHAR(255) DEFAULT NULL`);
    if (!existingColumns.has('remarks')) await db.query(`ALTER TABLE applicants ADD COLUMN remarks TEXT DEFAULT NULL`);
}

async function ensureExperienceColumns() {
    const [columns] = await db.query(`SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'applicant_experience'`, [process.env.DB_NAME || 'rsp_db']);
    const existingColumns = new Set(columns.map((column) => column.COLUMN_NAME));
    if (!existingColumns.has('months')) await db.query(`ALTER TABLE applicant_experience ADD COLUMN months INT DEFAULT 0 AFTER years`);
}

// Secondary indexes used by the step pages, filters and Step 1 document remarks
const requiredIndexes = [
    { table: 'applicants', name: 'idx_vacancyAnnouncementNo', columns: 'vacancyAnnouncementNo' },
    { table: 'applicants', name: 'idx_applicationCode', columns: 'applicationCode' },
    { table: 'applicant_education', name: 'idx_applicant_status', columns: 'applicant_id, status' },
    { table: 'applicant_training', name: 'idx_applicant_status', columns: 'applicant_id, status' },
    { table: 'applicant_experience', name: 'idx_applicant_status', columns: 'applicant_id, status' },
    { table: 'applicant_eligibility', name: 'idx_applicant_status', columns: 'applicant_id, status' },
    { table: 'positions', name: 'idx_title', columns: 'title' },
    { table: 'positions', name: 'idx_category_title', columns: 'category, title' },
    { table: 'logs', name: 'idx_createdAt', columns: 'createdAt' }
];

async function ensureIndexes() {
    const [existing] = await db.query(`SELECT TABLE_NAME, INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ?`, [process.env.DB_NAME || 'rsp_db']);
    const existingKeys = new Set(existing.map((row) => `${row.TABLE_NAME}.${row.INDEX_NAME}`));
    for (const index of requiredIndexes) {
        if (existingKeys.has(`${index.table}.${index.name}`)) continue;
        try {
            await db.query(`CREATE INDEX ${index.name} ON ${index.table} (${index.columns})`);
            console.log(`[DB] Created index ${index.table}.${index.name}`);
        } catch (e) { console.warn(`[DB] Could not create index ${index.table}.${index.name}:`, e.message); }
    }
}

async function ensureAdminSystem() {
    await db.query(`CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role ENUM('admin', 'evaluator', 'superadmin') DEFAULT 'evaluator',
        can_access_step2 BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Ensure the ENUM contains 'superadmin' in case the table already existed
    try {
        await db.query(`ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'evaluator', 'superadmin') DEFAULT 'evaluator'`);
    } catch (e) { console.warn('Could not modify users role ENUM', e.message); }

    await db.query(`CREATE TABLE IF NOT EXISTS logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        action VARCHAR(255) NOT NULL,
        target VARCHAR(255) DEFAULT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && !process.env.SUPERADMIN_PASSWORD) {
        throw new Error('SUPERADMIN_PASSWORD must be set when NODE_ENV=production');
    }

    // Seed default admin if missing
    const [adminRows] = await db.query(`SELECT id FROM users WHERE username = 'admin'`);
    if (adminRows.length === 0) {
        const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
        if (!process.env.ADMIN_PASSWORD) console.warn('[Security] Seeding user "admin" with the default password. Change it after first login.');
        await db.query(`INSERT INTO users (username, password, name, role, can_access_step2) VALUES ('admin', ?, 'Administrator', 'admin', true)`, [await hashPassword(adminPass)]);
    }

    // Seed/Update superadmin from .env (password is only rewritten when it no longer matches)
    const superUser = process.env.SUPERADMIN_USERNAME || 'superadmin';
    const superPass = process.env.SUPERADMIN_PASSWORD || 'superadmin123';

    const [superRows] = await db.query(`SELECT id, password FROM users WHERE username = ?`, [superUser]);
    if (superRows.length === 0) {
        await db.query(`INSERT INTO users (username, password, name, role, can_access_step2) VALUES (?, ?, 'Super Administrator', 'superadmin', true)`, [superUser, await hashPassword(superPass)]);
    } else if (!(await verifyPassword(superPass, superRows[0].password))) {
        await db.query(`UPDATE users SET password = ?, role = 'superadmin', can_access_step2 = true WHERE username = ?`, [await hashPassword(superPass), superUser]);
    } else {
        await db.query(`UPDATE users SET role = 'superadmin', can_access_step2 = true WHERE username = ?`, [superUser]);
    }
}

const cron = require('node-cron');
const backupManager = require('./utils/backupManager');

async function startServer() {
    try {
        await ensureRequirementColumns();
        await ensureExperienceColumns();
        await ensureAdminSystem();
        await ensureIndexes();
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running on http://0.0.0.0:${PORT}`);
        });

        // Setup Automated Daily Backup
        const backupTask = cron.schedule('1 12 * * *', async () => {
            console.log('[Cron] Starting automated daily backup...');
            try {
                await backupManager.generateDailyBackups();
                await backupManager.cleanupOldBackups();
                console.log('[Cron] Automated backup completed successfully.');
            } catch (err) {
                console.error('[Cron] Failed to run automated backup:', err);
            }
        });

        // Graceful shutdown: stop accepting requests, stop cron, then close the DB pool
        let shuttingDown = false;
        const shutdown = (signal) => {
            if (shuttingDown) return;
            shuttingDown = true;
            console.log(`[Server] ${signal} received, shutting down...`);
            backupTask.stop();
            server.close(async () => {
                await db.end().catch(() => {});
                process.exit(0);
            });
            server.closeIdleConnections();
            // SSE streams keep connections open; force exit if they do not drain
            setTimeout(() => process.exit(0), 10000).unref();
        };
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));

    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
}

startServer();
