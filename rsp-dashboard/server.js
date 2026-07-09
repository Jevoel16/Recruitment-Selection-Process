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

async function ensureRequirementColumns() {
    const [columns] = await db.query(`SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'applicants'`, [process.env.DB_NAME || 'rsp_db']);
    const existingColumns = new Set(columns.map((column) => column.COLUMN_NAME));
    const missingColumns = requirementFields.filter((field) => !existingColumns.has(field));
    for (const column of missingColumns) await db.query(`ALTER TABLE applicants ADD COLUMN ${column} BOOLEAN DEFAULT FALSE AFTER contactNo`);
    if (!existingColumns.has('cc')) await db.query(`ALTER TABLE applicants ADD COLUMN cc VARCHAR(255) DEFAULT NULL`);
    if (!existingColumns.has('ccDesignation')) await db.query(`ALTER TABLE applicants ADD COLUMN ccDesignation VARCHAR(255) DEFAULT NULL`);
}

async function startServer() {
    try {
        await ensureRequirementColumns();
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running on http://0.0.0.0:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to initialize requirement columns:', error.message);
        process.exit(1);
    }
}

startServer();
