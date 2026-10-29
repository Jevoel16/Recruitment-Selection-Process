const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const hbs = require('hbs');
const path = require('path');
const db = require('./db');
const { POSITIONS, DISTRICTS, SCHOOL_CATEGORIES, CIVIL_STATUSES, isValidSelection } = require('./lib/catalog');
const { validateApplication } = require('./lib/validateApplication');

function getShortenedPosition(position) {
    if (!position) return 'APP';

    let cleanPos = position.replace(/[^a-zA-Z0-9 ]/g, '').trim();
    const match = cleanPos.match(/\s([IVX]+)$/i);
    let numberSuffix = '';
    if (match) {
        const roman = match[1].toUpperCase();
        const romanMap = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10 };
        numberSuffix = romanMap[roman] || '';
        cleanPos = cleanPos.substring(0, cleanPos.length - match[0].length).trim();
    }

    let base = '';
    const upperPos = position.toUpperCase();
    if (upperPos.includes('ADMINISTRATIVE ASSISTANT')) base = 'ADAS';
    else if (upperPos.includes('ADMINISTRATIVE AIDE')) base = 'ADA';
    else if (upperPos.includes('ADMINISTRATIVE OFFICER')) base = 'AO';
    else if (upperPos.includes('PROJECT DEVELOPMENT OFFICER')) base = 'PDO';
    else if (upperPos.includes('LEGAL ASSISTANT')) base = 'LA';
    else if (upperPos.includes('EDUCATION PROGRAM SUPERVISOR')) base = 'EPS';
    else if (upperPos.includes('SCHOOL PRINCIPAL') || upperPos.includes('PRINCIPAL')) base = 'SP';
    else if (upperPos.includes('HEAD TEACHER')) base = 'HT';
    else if (upperPos.includes('MASTER TEACHER')) base = 'MT';
    else if (upperPos.includes('TEACHER')) base = 'T';
    else if (upperPos.includes('WATCHMAN')) base = 'WCH';
    else {
        base = cleanPos.split(/\s+/).map(w => w[0]).join('').toUpperCase();
    }

    return base + numberSuffix;
}

const app = express();
const PORT = process.env.PORT || 3001;
// Listen on loopback by default so only the local Cloudflare Tunnel can reach the portal
const HOST = process.env.HOST || '127.0.0.1';
// Requests arrive via cloudflared on loopback; trust its X-Forwarded-For so rate limiting is per applicant
app.set('trust proxy', process.env.TRUST_PROXY || 'loopback');

const isProduction = process.env.NODE_ENV === 'production';
app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: false,
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            scriptSrcAttr: ["'none'"],
            styleSrc: ["'self'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:'],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'none'"],
            ...(isProduction ? { upgradeInsecureRequests: [] } : {})
        }
    },
    hsts: isProduction
}));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
const staticOptions = { maxAge: '30d' };
app.use(express.static(path.join(__dirname, 'public'), staticOptions));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist'), staticOptions));
app.use('/bootstrap-icons', express.static(path.join(__dirname, 'node_modules/bootstrap-icons/font'), staticOptions));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
hbs.registerPartials(path.join(__dirname, 'views', 'partials'));
// Static files are cached for 30 days, so asset URLs carry a per-start version to bust stale copies
app.locals.assetVersion = Date.now().toString(36);

// Embedded in a <script type="application/json"> block, so escape "<" to keep "</script>" out
const pickerJson = JSON.stringify({ positions: POSITIONS, districts: DISTRICTS, categories: SCHOOL_CATEGORIES })
    .replace(/</g, '\\u003c');

app.get('/', (req, res) => {
    res.render('home', {
        layout: 'layout',
        title: 'Apply for a Position',
        script: 'home.js',
        pickerJson
    });
});

app.get('/apply/:type', (req, res) => {
    const selection = {
        type: req.params.type,
        position: req.query.position,
        positionCategory: req.query.positionCategory,
        district: req.query.district,
        category: req.query.category
    };
    if (!isValidSelection(selection)) return res.redirect('/');
    res.render('application', {
        layout: 'layout',
        title: `${selection.position} Application`,
        description: `Apply for ${selection.position} (${selection.category}, District ${selection.district}) through the RSP Portal.`,
        script: 'portal.js',
        ...selection,
        civilStatuses: CIVIL_STATUSES,
        currentYear: new Date().getFullYear()
    });
});

// Basic per-client limit on public application submissions
const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
function clientKey(req) {
    // cloudflared connects from loopback and passes the visitor's address in CF-Connecting-IP
    const cfIp = req.get('cf-connecting-ip');
    if (cfIp && LOOPBACK.has(req.socket.remoteAddress)) return cfIp.trim();
    return req.ip || '';
}

const applyHits = new Map();
function applyRateLimit(req, res, next) {
    const windowMs = 15 * 60 * 1000;
    const now = Date.now();
    const key = clientKey(req);
    let entry = applyHits.get(key);
    if (!entry || entry.resetAt <= now) {
        entry = { count: 0, resetAt: now + windowMs };
        applyHits.set(key, entry);
    }
    if (++entry.count > 20) return res.status(429).json({ success: false, error: 'Too many submissions. Please try again later.' });
    next();
}
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of applyHits) if (entry.resetAt <= now) applyHits.delete(key);
}, 15 * 60 * 1000).unref();

app.post('/api/apply', applyRateLimit, async (req, res) => {
    const { errors, value } = validateApplication(req.body);
    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ success: false, error: 'Please correct the highlighted fields.', fields: errors });
    }

    let conn;
    try {
        conn = await db.getConnection();
        await conn.beginTransaction();
        const {
            type, first_name, middle_name, last_name, name_extension,
            position, district, category,
            address, age, sex, civil_status, religion, disability, ethnic_group,
            email_address, contact_no, pds_link
        } = value;

        const positionCode = getShortenedPosition(position);

        const [result] = await conn.query(
            `INSERT INTO applicants (
                firstName, lastName, middleName, nameExtension, applicationCode, applicationType,
                address, age, sex, civilStatus, religion, disability, ethnicGroup,
                emailAddress, contactNo, pdsLink, position, district, category
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                first_name, last_name, middle_name, name_extension || null, 'TEMP', type,
                address, age, sex, civil_status || null, religion || null, disability || null, ethnic_group || null,
                email_address, contact_no, pds_link, position, district, category
            ]
        );
        const applicantId = result.insertId;

        // The application code is always generated here; clients cannot choose it
        const currentYear = new Date().getFullYear();
        const [rows] = await conn.query(
            "SELECT applicationCode FROM applicants WHERE applicationCode LIKE ? AND id != ? ORDER BY id DESC LIMIT 1",
            [`${positionCode}-${currentYear}-%`, applicantId]
        );
        let increment = 1;
        if (rows.length > 0 && rows[0].applicationCode) {
            const parts = rows[0].applicationCode.split('-');
            const lastIncrement = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(lastIncrement)) {
                increment = lastIncrement + 1;
            }
        }
        const applicationCode = `${positionCode}-${currentYear}-${increment}`;

        const [cols] = await conn.query("SHOW COLUMNS FROM applicants WHERE Extra LIKE '%auto_increment%'");
        const pkCol = cols.length > 0 ? cols[0].Field : 'id';

        await conn.query(`UPDATE applicants SET applicationCode = ? WHERE ${pkCol} = ?`, [applicationCode, applicantId]);

        for (const e of value.education) {
            await conn.query('INSERT INTO applicant_education (applicant_id, degree, yearGraduated, digitalCopyLink) VALUES (?, ?, ?, ?)', [applicantId, e.degree, e.year, e.link]);
        }
        for (const t of value.training) {
            await conn.query('INSERT INTO applicant_training (applicant_id, title, hours, digitalCopyLink) VALUES (?, ?, ?, ?)', [applicantId, t.title, t.hours, t.link]);
        }
        for (const ex of value.experience) {
            await conn.query('INSERT INTO applicant_experience (applicant_id, details, years, digitalCopyLink) VALUES (?, ?, ?, ?)', [applicantId, ex.details, ex.years, ex.link]);
        }
        for (const el of value.eligibility) {
            await conn.query('INSERT INTO applicant_eligibility (applicant_id, details, rating, digitalCopyLink) VALUES (?, ?, ?, ?)', [applicantId, el.details, el.rating, el.link]);
        }

        await conn.commit();
        res.json({ success: true, applicationCode });
    } catch (err) {
        if (conn) await conn.rollback().catch(() => {});
        console.error('Application submission failed:', err);
        res.status(500).json({ success: false, error: 'Failed to submit application. Please try again.' });
    } finally {
        if (conn) conn.release();
    }
});

function wantsJson(req) {
    return req.path.startsWith('/api/') || req.accepts(['html', 'json']) === 'json';
}

function renderError(res, status, heading, message) {
    res.status(status).render('error', {
        layout: 'layout',
        title: heading,
        status,
        heading,
        message
    });
}

app.use((req, res) => {
    if (wantsJson(req)) return res.status(404).json({ success: false, error: 'Not found.' });
    renderError(res, 404, 'Page not found', "The page you're looking for doesn't exist or has moved.");
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    // body-parser errors (bad JSON, payload too large) carry a 4xx status
    const status = err.status >= 400 && err.status < 500 ? err.status : 500;
    if (status === 500) console.error('Unhandled error:', err);
    if (res.headersSent) return;
    const message = status === 413 ? 'Your submission is too large.'
        : status === 500 ? 'Something went wrong on our end. Please try again in a moment.'
        : 'The request could not be processed.';
    if (wantsJson(req)) return res.status(status).json({ success: false, error: message });
    renderError(res, status, status === 500 ? 'Something went wrong' : 'Request could not be processed', message);
});

app.listen(PORT, HOST, () => console.log(`RSP Portal running on http://${HOST}:${PORT}`));
