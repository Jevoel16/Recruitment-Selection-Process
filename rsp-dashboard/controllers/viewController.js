const db = require('../db');

exports.getMetrics = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM positions');
        const groupedPositions = {};
        let totalVacantCount = 0;
        let totalPositionsCount = 0;
        for (const row of rows) {
            let cat = row.category.replace(/\\s+/g, '-');
            if (!groupedPositions[cat]) {
                groupedPositions[cat] = { categoryName: row.category, hasVacancy: false, vacantCount: 0, totalCount: 0 };
            }
            groupedPositions[cat].totalCount++;
            totalPositionsCount++;
            if (row.in_vacancy) {
                groupedPositions[cat].hasVacancy = true;
                groupedPositions[cat].vacantCount++;
                totalVacantCount++;
            }
        }
        res.json({ totalVacantCount, totalPositionsCount, groupedPositions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Renders the main Unified Dashboard containing both the Vacancy Setup and Masterlist tabs.
// This function aggregates data from the positions table and limits masterlist queries to 25 items for pagination performance.
exports.getDashboard = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM positions ORDER BY category ASC, title ASC');
        const groupedPositions = {};
        let totalVacantCount = 0;
        let totalPositionsCount = 0;
        let positionList = [];
        for (const row of rows) {
            if (row.title) positionList.push(row.title);
            if (!groupedPositions[row.category]) {
                groupedPositions[row.category] = { categoryName: row.category, hasVacancy: false, positions: [], vacantCount: 0, totalCount: 0 };
            }
            groupedPositions[row.category].totalCount++;
            totalPositionsCount++;
            if (row.in_vacancy) {
                groupedPositions[row.category].hasVacancy = true;
                groupedPositions[row.category].vacantCount++;
                totalVacantCount++;
            }
            groupedPositions[row.category].positions.push(row);
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        const searchQuery = req.query.q || '';
        const categoryFilter = req.query.category || '';
        const stepFilter = req.query.step || '';

        let baseQuery = `FROM applicants WHERE 1=1`;
        const queryParams = [];

        if (searchQuery) {
            baseQuery += ` AND (CONCAT(firstName, ' ', lastName) LIKE ? OR applicationCode LIKE ? OR position LIKE ?)`;
            const searchPattern = `%${searchQuery}%`;
            queryParams.push(searchPattern, searchPattern, searchPattern);
        }

        if (categoryFilter) {
            baseQuery += ` AND category = ?`;
            queryParams.push(categoryFilter);
        }

        if (stepFilter) {
            if (stepFilter === 'step1_pending') baseQuery += ` AND status = 'PENDING'`;
            else if (stepFilter === 'step1_qualified') baseQuery += ` AND status = 'QUALIFIED'`;
            else if (stepFilter === 'step1_disqualified') baseQuery += ` AND status = 'DISQUALIFIED'`;
            else if (stepFilter === 'step2') baseQuery += ` AND status = 'WAITING_FOR_ASSESSMENT'`;
            else if (stepFilter === 'step3_assessed') baseQuery += ` AND status = 'ASSESSED'`;
            else if (stepFilter === 'step3_no_appearance') baseQuery += ` AND status = 'NO_APPEARANCE'`;
            else if (stepFilter === 'step4') baseQuery += ` AND status = 'WAITING'`;
            else if (stepFilter === 'step5_assigned') baseQuery += ` AND status = 'ASSIGNED'`;
            else if (stepFilter === 'step5_completed') baseQuery += ` AND status = 'COMPLETED'`;
        }

        const [countResult] = await db.query(`SELECT COUNT(*) AS total ${baseQuery}`, queryParams);
        const totalRecords = countResult[0].total;
        const totalPages = Math.ceil(totalRecords / limit) || 1;

        const [applicants] = await db.query(`SELECT *, CONCAT(firstName, ' ', lastName) AS name ${baseQuery} ORDER BY createdAt DESC LIMIT ? OFFSET ?`, [...queryParams, limit, offset]);

        const showMasterlist = req.query.tab === 'masterlist';
        const showCategories = req.query.tab === 'categories';

        const pagination = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
                let pUrl = `/dashboard?tab=masterlist&page=${i}&`;
                if (searchQuery) pUrl += `q=${encodeURIComponent(searchQuery)}&`;
                if (categoryFilter) pUrl += `category=${encodeURIComponent(categoryFilter)}&`;
                if (stepFilter) pUrl += `step=${encodeURIComponent(stepFilter)}&`;
                pagination.push({ page: i, isCurrent: i === page, url: pUrl.replace(/&$/, '') });
            } else if (i === page - 3 || i === page + 3) {
                pagination.push({ isEllipsis: true, page: '...' });
            }
        }
        const cleanPagination = pagination.filter((p, index, arr) => {
            if (p.isEllipsis && arr[index - 1] && arr[index - 1].isEllipsis) return false;
            return true;
        });

        res.render('dashboard', { 
            dashboardActive: true, 
            groupedPositions, 
            totalVacantCount, 
            totalPositionsCount,
            applicants,
            currentPage: page,
            totalPages,
            searchQuery,
            categoryFilter,
            stepFilter,
            pagination: cleanPagination,
            showMasterlist,
            showCategories
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
};

exports.getDashboardPosition = async (req, res, next) => {
    if (isNaN(req.params.id)) return next();
    try {
        const [rows] = await db.query('SELECT * FROM positions ORDER BY category ASC, title ASC');
        const groupedPositions = {};
        let selectedPosition = null;
        let totalVacantCount = 0;
        let totalPositionsCount = 0;
        let positionList = [];
        for (const row of rows) {
            if (row.title) positionList.push(row.title);
            if (row.id == req.params.id) selectedPosition = row;
            if (!groupedPositions[row.category]) {
                groupedPositions[row.category] = { categoryName: row.category, hasVacancy: false, positions: [], vacantCount: 0, totalCount: 0 };
            }
            groupedPositions[row.category].totalCount++;
            totalPositionsCount++;
            if (row.in_vacancy) {
                groupedPositions[row.category].hasVacancy = true;
                groupedPositions[row.category].vacantCount++;
                totalVacantCount++;
            }
            groupedPositions[row.category].positions.push(row);
        }
        
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        const searchQuery = req.query.q || '';
        const positionFilter = req.query.position || '';

        let baseQuery = `FROM applicants WHERE 1=1`;
        const queryParams = [];

        if (searchQuery) {
            baseQuery += ` AND (CONCAT(firstName, ' ', lastName) LIKE ? OR applicationCode LIKE ?)`;
            const searchPattern = `%${searchQuery}%`;
            queryParams.push(searchPattern, searchPattern);
        }

        if (positionFilter) {
            baseQuery += ` AND position = ?`;
            queryParams.push(positionFilter);
        }

        const [countResult] = await db.query(`SELECT COUNT(*) AS total ${baseQuery}`, queryParams);
        const totalRecords = countResult[0].total;
        const totalPages = Math.ceil(totalRecords / limit) || 1;

        const [applicants] = await db.query(`SELECT *, CONCAT(firstName, ' ', lastName) AS name ${baseQuery} ORDER BY createdAt DESC LIMIT ? OFFSET ?`, [...queryParams, limit, offset]);

        const showMasterlist = req.query.tab === 'masterlist';

        const pagination = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
                let pUrl = `/dashboard/${req.params.id}?tab=masterlist&page=${i}&`;
                if (searchQuery) pUrl += `q=${encodeURIComponent(searchQuery)}&`;
                if (positionFilter) pUrl += `position=${encodeURIComponent(positionFilter)}&`;
                pagination.push({ page: i, isCurrent: i === page, url: pUrl.replace(/&$/, '') });
            } else if (i === page - 3 || i === page + 3) {
                pagination.push({ isEllipsis: true, page: '...' });
            }
        }
        const cleanPagination = pagination.filter((p, index, arr) => {
            if (p.isEllipsis && arr[index - 1] && arr[index - 1].isEllipsis) return false;
            return true;
        });

        res.render('dashboard', { 
            dashboardActive: true, 
            groupedPositions, 
            selectedPosition,
            totalVacantCount, 
            totalPositionsCount,
            applicants,
            currentPage: page,
            totalPages,
            searchQuery,
            positionFilter,
            positionList: Array.from(new Set(positionList)).sort(),
            pagination: cleanPagination,
            showMasterlist
        });
    } catch (e) {
        console.error(e);
        res.status(500).send('Error');
    }
};

// Provides the initial context for the multi-step Add Applicant wizard.
// Pre-loads all active 'in_vacancy' positions so the user can bind the new applicant to an official plantilla item immediately.
exports.getAddApplicant = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM positions WHERE in_vacancy = true ORDER BY category ASC, title ASC');
        const groupedPositions = {};
        for (const row of rows) {
            if (!groupedPositions[row.category]) {
                groupedPositions[row.category] = { categoryName: row.category, positions: [] };
            }
            groupedPositions[row.category].positions.push(row);
        }
        res.render('add-applicant', { addApplicantActive: true, groupedPositions });
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
};

exports.getMasterlist = async (req, res) => {
    const page = parseInt(req.params.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const searchQuery = req.query.q || '';
    const positionFilter = req.query.position || '';

    let baseQuery = `FROM applicants WHERE 1=1`;
    const queryParams = [];

    if (searchQuery) {
        baseQuery += ` AND (CONCAT(firstName, ' ', lastName) LIKE ? OR applicationCode LIKE ?)`;
        const searchPattern = `%${searchQuery}%`;
        queryParams.push(searchPattern, searchPattern);
    }

    if (positionFilter) {
        baseQuery += ` AND position = ?`;
        queryParams.push(positionFilter);
    }

    try {
        const [countResult] = await db.query(`SELECT COUNT(*) AS total ${baseQuery}`, queryParams);
        const totalRecords = countResult[0].total;
        const totalPages = Math.ceil(totalRecords / limit) || 1;

        const [rows] = await db.query(`SELECT *, CONCAT(firstName, ' ', lastName) AS name ${baseQuery} ORDER BY createdAt DESC LIMIT ? OFFSET ?`, [...queryParams, limit, offset]);

        const [positions] = await db.query(`SELECT DISTINCT position FROM applicants WHERE position IS NOT NULL AND position != '' ORDER BY position ASC`);
        const positionList = positions.map(p => p.position);

        res.render('masterlist', {
            masterlistActive: true,
            applicants: rows,
            currentPage: page,
            totalPages,
            searchQuery,
            positionFilter,
            positionList,
            paginationArray: Array.from({ length: totalPages }, (_, i) => i + 1)
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
};

// Dynamic multi-step rendering router. Evaluates the requested `:step` parameter to determine which subset of applicants to query.
// Applies specific WHERE clauses depending on the step (e.g. Step 1 shows all 'PENDING' applicants, Step 2 shows 'QUALIFIED' ones).
exports.getStepPage = async (req, res, next) => {
    const { step } = req.params;
    
    const stepsConfig = {
        'step1': { conditions: "status IN ('PENDING', 'QUALIFIED', 'DISQUALIFIED')", orderBy: "createdAt ASC" },
        'step2': { conditions: "status = 'WAITING_FOR_ASSESSMENT'", orderBy: "createdAt ASC" },
        'step3': { conditions: "status IN ('ASSESSED', 'NO_APPEARANCE', 'NEWLY_PROMOTED')", orderBy: "assessmentTotal DESC" },
        'step4': { conditions: "status = 'WAITING'", orderBy: "createdAt ASC" },
        'step5': { conditions: "status = 'ASSIGNED'", orderBy: "createdAt ASC" }
    };

    if (!stepsConfig[step]) return next();

    const positionFilter = req.query.position || '';
    const page = parseInt(req.params.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const searchQuery = req.query.q || '';
    const officeFilter = req.query.office || '';
    const statusFilter = req.query.status || '';
    const config = stepsConfig[step];
    
    let baseQuery = `FROM applicants WHERE ${config.conditions}`;
    const queryParams = [];

    if (searchQuery) {
        baseQuery += ` AND (CONCAT(firstName, ' ', lastName) LIKE ? OR applicationCode LIKE ?)`;
        const searchPattern = `%${searchQuery}%`;
        queryParams.push(searchPattern, searchPattern);
    }

    if (positionFilter && (step === 'step1' || step === 'step2' || step === 'step3' || step === 'step4' || step === 'step5')) {
        baseQuery += ` AND position = ?`;
        queryParams.push(positionFilter);
    }
    
    if (statusFilter && step === 'step3') {
        baseQuery += ` AND status = ?`;
        queryParams.push(statusFilter);
    }
    
    if (officeFilter && step === 'step5') {
        baseQuery += ` AND assignedOffice = ?`;
        queryParams.push(officeFilter);
    }

    try {
        const [countResult] = await db.query(`SELECT COUNT(*) AS total ${baseQuery}`, queryParams);
        const totalRecords = countResult[0].total;
        const totalPages = Math.ceil(totalRecords / limit) || 1;

        const [rows] = await db.query(`SELECT *, CONCAT(firstName, ' ', lastName) AS name ${baseQuery} ORDER BY ${config.orderBy} LIMIT ? OFFSET ?`, [...queryParams, limit, offset]);

        let positionList = [];
        if (step === 'step1' || step === 'step2' || step === 'step3' || step === 'step4' || step === 'step5') {
            const [positions] = await db.query(`SELECT DISTINCT position FROM applicants WHERE position IS NOT NULL AND position != '' ORDER BY position ASC`);
            positionList = positions.map(p => p.position);
        }
        
        let officeList = [];
        if (step === 'step5') {
            const [offices] = await db.query(`SELECT DISTINCT assignedOffice FROM applicants WHERE assignedOffice IS NOT NULL AND assignedOffice != '' ORDER BY assignedOffice ASC`);
            officeList = offices.map(o => o.assignedOffice);
        }

        const mappedRows = rows.map(row => {
            row.scores = {
                education: row.scoreEducation, training: row.scoreTraining, experience: row.scoreExperience,
                performance: row.scorePerformance, outstandingAccomplishments: row.scoreOutstandingAccomplishments,
                applicationOfEducation: row.scoreApplicationOfEducation, applicationOfLD: row.scoreApplicationOfLD,
                potential: row.scorePotential, total: row.assessmentTotal
            };
            return row;
        });

        if (step === 'step1') {
            for (let row of mappedRows) {
                if (row.status !== 'PENDING') {
                    row.docRemark = row.status === 'QUALIFIED' ? 'Qualified' : 'Disqualified';
                    continue;
                }
                
                const [docs] = await db.query(`
                    SELECT status FROM applicant_education WHERE applicant_id = ?
                    UNION ALL SELECT status FROM applicant_training WHERE applicant_id = ?
                    UNION ALL SELECT status FROM applicant_experience WHERE applicant_id = ?
                    UNION ALL SELECT status FROM applicant_eligibility WHERE applicant_id = ?
                `, [row.id, row.id, row.id, row.id]);
                
                if (docs.length === 0) { row.docRemark = 'Pending'; } else {
                    const pendingCount = docs.filter(d => d.status === 'PENDING' || !d.status).length;
                    if (pendingCount === docs.length) row.docRemark = 'Pending';
                    else if (pendingCount === 0) row.docRemark = 'Assessed';
                    else row.docRemark = 'In-Prog';
                }
            }
        }

        const pagination = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
                let pUrl = `/${step}/${i}?`;
                if (searchQuery) pUrl += `q=${encodeURIComponent(searchQuery)}&`;
                if (positionFilter) pUrl += `position=${encodeURIComponent(positionFilter)}&`;
                if (statusFilter) pUrl += `status=${encodeURIComponent(statusFilter)}&`;
                pagination.push({ page: i, isCurrent: i === page, url: pUrl.replace(/&$/, '') });
            } else if (i === page - 3 || i === page + 3) {
                pagination.push({ isEllipsis: true, page: '...' });
            }
        }
        
        const cleanPagination = pagination.filter((p, index, arr) => {
            if (p.isEllipsis && arr[index - 1] && arr[index - 1].isEllipsis) return false;
            return true;
        });

        res.render('index', {
            currentStep: step, [step]: mappedRows, searchQuery, positionFilter, positionList, officeFilter, officeList, statusFilter,
            pagination: cleanPagination, step1Active: step === 'step1', step2Active: step === 'step2', step3Active: step === 'step3',
            step4Active: step === 'step4', step5Active: step === 'step5', offset
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Database Error');
    }
};
