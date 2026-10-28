const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const hbs = require('hbs');
const path = require('path');
const db = require('./db');

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

app.use(helmet({ contentSecurityPolicy: false, hsts: process.env.NODE_ENV === 'production' }));
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

app.get('/', (req, res) => {
    res.render('home', { layout: 'layout' });
});

app.get('/apply/:type', (req, res) => {
    res.render('application', { 
        layout: 'layout', 
        type: req.params.type,
        position: req.query.position,
        positionCategory: req.query.positionCategory,
        district: req.query.district,
        category: req.query.category
    });
});

// Basic per-IP limit on public application submissions
const applyHits = new Map();
function applyRateLimit(req, res, next) {
    const windowMs = 15 * 60 * 1000;
    const now = Date.now();
    const key = req.ip || '';
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
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { 
            type, first_name, middle_name, last_name, name_extension, tracking_number, 
            position, positionCategory, district, category,
            address, age, sex, civil_status, religion, disability, ethnic_group,
            email_address, contact_no, pds_link 
        } = req.body;
        const name = `${first_name} ${middle_name} ${last_name} ${name_extension || ''}`.trim();
        
        let positionCode = getShortenedPosition(position);

        const [result] = await conn.query(
            `INSERT INTO applicants (
                firstName, lastName, middleName, nameExtension, applicationCode, applicationType,
                address, age, sex, civilStatus, religion, disability, ethnicGroup,
                emailAddress, contactNo, pdsLink, position, district, category
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                first_name, last_name, middle_name, name_extension, 'TEMP', type,
                address, age, sex, civil_status, religion, disability, ethnic_group,
                email_address, contact_no, pds_link, position, district, category
            ]
        );
        const applicantId = result.insertId;

        const currentYear = new Date().getFullYear();
        let applicationCode = tracking_number;
        
        if (!applicationCode) {
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
            applicationCode = `${positionCode}-${currentYear}-${increment}`;
        }

        const [cols] = await conn.query("SHOW COLUMNS FROM applicants WHERE Extra LIKE '%auto_increment%'");
        const pkCol = cols.length > 0 ? cols[0].Field : 'id';

        await conn.query(`UPDATE applicants SET applicationCode = ? WHERE ${pkCol} = ?`, [applicationCode, applicantId]);

        const edu = JSON.parse(req.body.education || '[]');
        for (let e of edu) {
            await conn.query('INSERT INTO applicant_education (applicant_id, degree, yearGraduated, digitalCopyLink) VALUES (?, ?, ?, ?)', [applicantId, e.degree, e.year, e.link]);
        }

        const train = JSON.parse(req.body.training || '[]');
        for (let t of train) {
            await conn.query('INSERT INTO applicant_training (applicant_id, title, hours, digitalCopyLink) VALUES (?, ?, ?, ?)', [applicantId, t.title, t.hours, t.link]);
        }

        const exp = JSON.parse(req.body.experience || '[]');
        for (let ex of exp) {
            await conn.query('INSERT INTO applicant_experience (applicant_id, details, years, digitalCopyLink) VALUES (?, ?, ?, ?)', [applicantId, ex.details, ex.years, ex.link]);
        }

        const elig = JSON.parse(req.body.eligibility || '[]');
        for (let el of elig) {
            await conn.query('INSERT INTO applicant_eligibility (applicant_id, details, rating, digitalCopyLink) VALUES (?, ?, ?, ?)', [applicantId, el.details, el.rating, el.link]);
        }

        await conn.commit();
        res.json({ success: true, applicationCode });
    } catch (err) {
        await conn.rollback();
        console.error('Application submission failed:', err);
        res.status(500).json({ error: 'Failed to submit application. Please try again.' });
    } finally {
        conn.release();
    }
});

app.listen(PORT, HOST, () => console.log(`RSP Portal running on http://${HOST}:${PORT}`));
