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
    res.render('application', { 
        layout: 'layout', 
        type: req.params.type,
        position: req.query.position,
        positionCategory: req.query.positionCategory,
        district: req.query.district,
        category: req.query.category
    });
});

app.post('/api/apply', async (req, res) => {
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
        
        let positionCode = 'POS';
        switch(position) {
            case 'Teacher I': positionCode = 'T1'; break;
            case 'Teacher II': positionCode = 'T2'; break;
            case 'Teacher III': positionCode = 'T3'; break;
            case 'Master Teacher I': positionCode = 'MT1'; break;
            case 'Master Teacher II': positionCode = 'MT2'; break;
            case 'Principal I': positionCode = 'P1'; break;
            case 'Principal II': positionCode = 'P2'; break;
            case 'Head Teacher I': positionCode = 'HT1'; break;
            case 'Head Teacher III': positionCode = 'HT3'; break;
            case 'Education Program Supervisor': positionCode = 'EPS'; break;
            case 'Administrative Officer II': positionCode = 'AO2'; break;
            case 'Administrative Assistant III': positionCode = 'ADAS3'; break;
            case 'Administrative Assistant II': positionCode = 'ADAS2'; break;
            case 'Project Development Officer II': positionCode = 'PDO2'; break;
        }

        let categoryCode = 'CAT';
        switch(category) {
            case 'Elementary': categoryCode = 'ELEM'; break;
            case 'Junior High School': categoryCode = 'JHS'; break;
            case 'Senior High School': categoryCode = 'SHS'; break;
            case 'Kindergarten': categoryCode = 'KIND'; break;
            case 'ALS': categoryCode = 'ALS'; break;
        }

        const [result] = await conn.query(
            `INSERT INTO applicants (
                firstName, lastName, middleName, nameExtension, applicationCode, applicationType,
                address, age, sex, civilStatus, religion, disability, ethnicGroup,
                emailAddress, contactNo, pdsLink
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                first_name, last_name, middle_name, name_extension, 'TEMP', type,
                address, age, sex, civil_status, religion, disability, ethnic_group,
                email_address, contact_no, pds_link
            ]
        );
        const applicantId = result.insertId;

        const sy = 'SY20262027'; 
        const baseCode = `${positionCode}-${sy}-${categoryCode}-${district || 'DIST'}`;
        const applicationCode = tracking_number || `${baseCode}-${applicantId}`;

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
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
});

app.listen(PORT, () => console.log(`RSP Portal running on port ${PORT}`));
