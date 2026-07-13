require('dotenv').config();
const express = require('express');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const hbs = require('hbs');
const path = require('path');
const db = require('./db');
const { identityMiddleware } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;
app.set('trust proxy', true);

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
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(identityMiddleware);

// Serve static assets for application public directory and third-party dependencies
const staticOptions = { maxAge: '30d' };
app.use(express.static(path.join(__dirname, 'public'), staticOptions));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist'), staticOptions));
app.use('/bootstrap-icons', express.static(path.join(__dirname, 'node_modules/bootstrap-icons/font'), staticOptions));
app.use('/pizzip', express.static(path.join(__dirname, 'node_modules/pizzip/dist'), staticOptions));
app.use('/docxtemplater', express.static(path.join(__dirname, 'node_modules/docxtemplater/build'), staticOptions));
app.use('/file-saver', express.static(path.join(__dirname, 'node_modules/file-saver/dist'), staticOptions));
app.use('/chartjs', express.static(path.join(__dirname, 'node_modules/chart.js/dist'), staticOptions));
app.use('/fontsource-inter', express.static(path.join(__dirname, 'node_modules/@fontsource/inter'), staticOptions));
app.use('/choices.js', express.static(path.join(__dirname, 'node_modules/choices.js/public/assets'), staticOptions));
app.use('/html-docx-js', express.static(path.join(__dirname, 'node_modules/html-docx-js/dist'), staticOptions));
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

    const crypto = require('crypto');
    
    // Seed default admin if missing
    const [adminRows] = await db.query(`SELECT id FROM users WHERE username = 'admin'`);
    if (adminRows.length === 0) {
        const hash = crypto.createHash('sha256').update('admin123').digest('hex');
        await db.query(`INSERT INTO users (username, password, name, role, can_access_step2) VALUES ('admin', ?, 'Administrator', 'admin', true)`, [hash]);
    }

    // Seed/Update superadmin from .env
    const superUser = process.env.SUPERADMIN_USERNAME || 'superadmin';
    const superPass = process.env.SUPERADMIN_PASSWORD || 'superadmin123';
    const superHash = crypto.createHash('sha256').update(superPass).digest('hex');
    
    const [superRows] = await db.query(`SELECT id FROM users WHERE username = ?`, [superUser]);
    if (superRows.length === 0) {
        await db.query(`INSERT INTO users (username, password, name, role, can_access_step2) VALUES (?, ?, 'Super Administrator', 'superadmin', true)`, [superUser, superHash]);
    } else {
        await db.query(`UPDATE users SET password = ?, role = 'superadmin', can_access_step2 = true WHERE username = ?`, [superHash, superUser]);
    }
}

async function startServer() {
    try {
        await ensureRequirementColumns();
        await ensureExperienceColumns();
        await ensureAdminSystem();
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running on http://0.0.0.0:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to initialize requirement columns:', error.message);
        process.exit(1);
    }
}

startServer();
