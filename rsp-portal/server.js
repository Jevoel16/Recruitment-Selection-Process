const express = require('express');
const hbs = require('hbs');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));
app.use('/bootstrap-icons', express.static(path.join(__dirname, 'node_modules/bootstrap-icons/font')));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
hbs.registerPartials(path.join(__dirname, 'views', 'partials'));

app.get('/', (req, res) => {
    res.render('home', { layout: 'layout' });
});

app.get('/apply/:type', (req, res) => {
    res.render('application', { layout: 'layout', type: req.params.type });
});

app.post('/api/apply', async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { type, first_name, middle_name, last_name, name_extension, tracking_number } = req.body;
        const name = `${first_name} ${middle_name} ${last_name} ${name_extension || ''}`.trim();
        const applicationCode = tracking_number || `APP-${Date.now()}`;
        
        const [result] = await conn.query(
            'INSERT INTO applicants (firstName, lastName, middleName, nameExtension, applicationCode, applicationType) VALUES (?, ?, ?, ?, ?, ?)',
            [first_name, last_name, middle_name, name_extension, applicationCode, type]
        );
        const applicantId = result.insertId;

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
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
});

app.listen(PORT, () => console.log(`RSP Portal running on port ${PORT}`));
