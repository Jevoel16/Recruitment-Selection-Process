const db = require('../db');

exports.getMetrics = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM positions');
        const groupedPositions = {};
        let totalVacantCount = 0;
        let totalPositionsCount = 0;
        for (const row of rows) {
            let cat = row.category.replace(/\s+/g, '-');
            if (!groupedPositions[cat]) {
                groupedPositions[cat] = { categoryName: row.category, hasVacancy: false, vacantCount: 0, totalCount: 0, positions: [] };
            }
            let itemsCount = row.vacancyCount || 1;
            groupedPositions[cat].totalCount += itemsCount;
            totalPositionsCount += itemsCount;
            if (row.in_vacancy) {
                groupedPositions[cat].hasVacancy = true;
                groupedPositions[cat].vacantCount += row.vacancyCount || 1;
                totalVacantCount += row.vacancyCount || 1;
                groupedPositions[cat].positions.push({
                    title: row.title,
                    count: row.vacancyCount || 1
                });
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
                groupedPositions[row.category] = { 
                    categoryName: row.category, 
                    categorySlug: row.category.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase(),
                    hasVacancy: false, 
                    positions: [], 
                    positionGroups: {}, 
                    vacantCount: 0, 
                    totalCount: 0 
                };
            }
            let itemsCount = row.vacancyCount || 1;
            groupedPositions[row.category].totalCount += itemsCount;
            totalPositionsCount += itemsCount;
            if (row.in_vacancy) {
                groupedPositions[row.category].hasVacancy = true;
                groupedPositions[row.category].vacantCount += itemsCount;
                totalVacantCount += itemsCount;
            }
            groupedPositions[row.category].positions.push(row);

            let groupName = row.groupName || row.title;
            if (!groupedPositions[row.category].positionGroups[groupName]) {
                groupedPositions[row.category].positionGroups[groupName] = { 
                    groupName: groupName, 
                    groupSlug: groupName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase(),
                    positions: [] 
                };
            }
            groupedPositions[row.category].positionGroups[groupName].positions.push(row);
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        const searchQuery = req.query.q || '';
        const positionFilter = req.query.position || '';
        const vacancyFilter = req.query.vacancy || '';
        const stepFilter = req.query.step || '';

        let baseQuery = `FROM applicants WHERE 1=1`;
        const queryParams = [];
        let searchCondition = '';
        let searchParams = [];

        if (searchQuery) {
            searchCondition = ` AND (CONCAT(firstName, ' ', lastName) LIKE ? OR applicationCode LIKE ? OR vacancyAnnouncementNo LIKE ?)`;
            const searchPattern = `%${searchQuery}%`;
            searchParams.push(searchPattern, searchPattern, searchPattern);
            baseQuery += searchCondition;
            queryParams.push(...searchParams);
        }

        if (positionFilter) {
            baseQuery += ` AND position = ?`;
            queryParams.push(positionFilter);
        }

        if (vacancyFilter) {
            baseQuery += ` AND vacancyAnnouncementNo = ?`;
            queryParams.push(vacancyFilter);
        }

        if (stepFilter) {
            if (stepFilter === 'step1_pending') {
                baseQuery += ` AND status = 'PENDING' AND NOT EXISTS (
                    SELECT 1 FROM applicant_education WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL
                    UNION ALL SELECT 1 FROM applicant_training WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL
                    UNION ALL SELECT 1 FROM applicant_experience WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL
                    UNION ALL SELECT 1 FROM applicant_eligibility WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL
                )`;
            } else if (stepFilter === 'step1_assessed') {
                baseQuery += ` AND status = 'PENDING' AND NOT EXISTS (
                    SELECT 1 FROM applicant_education WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL)
                    UNION ALL SELECT 1 FROM applicant_training WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL)
                    UNION ALL SELECT 1 FROM applicant_experience WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL)
                    UNION ALL SELECT 1 FROM applicant_eligibility WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL)
                ) AND EXISTS (
                    SELECT 1 FROM applicant_education WHERE applicant_id = applicants.id
                    UNION ALL SELECT 1 FROM applicant_training WHERE applicant_id = applicants.id
                    UNION ALL SELECT 1 FROM applicant_experience WHERE applicant_id = applicants.id
                    UNION ALL SELECT 1 FROM applicant_eligibility WHERE applicant_id = applicants.id
                )`;
            } else if (stepFilter === 'step1_in_prog') {
                baseQuery += ` AND status = 'PENDING' AND EXISTS (
                    SELECT 1 FROM applicant_education WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL)
                    UNION ALL SELECT 1 FROM applicant_training WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL)
                    UNION ALL SELECT 1 FROM applicant_experience WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL)
                    UNION ALL SELECT 1 FROM applicant_eligibility WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL)
                ) AND EXISTS (
                    SELECT 1 FROM applicant_education WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL
                    UNION ALL SELECT 1 FROM applicant_training WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL
                    UNION ALL SELECT 1 FROM applicant_experience WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL
                    UNION ALL SELECT 1 FROM applicant_eligibility WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL
                )`;
            }
            else if (stepFilter === 'step1_qualified') baseQuery += ` AND status = 'QUALIFIED'`;
            else if (stepFilter === 'step1_disqualified') baseQuery += ` AND status = 'DISQUALIFIED'`;
            else if (stepFilter === 'step2_pending') baseQuery += ` AND status = 'WAITING_FOR_ASSESSMENT' AND (assessmentRemarks = 'Pending' OR assessmentRemarks IS NULL OR assessmentRemarks = '')`;
            else if (stepFilter === 'step2_in_prog') baseQuery += ` AND status = 'WAITING_FOR_ASSESSMENT' AND assessmentRemarks = 'In-Prog'`;
            else if (stepFilter === 'step2_assessed') baseQuery += ` AND status = 'WAITING_FOR_ASSESSMENT' AND assessmentRemarks = 'Assessed'`;
            else if (stepFilter === 'step2_newly_promoted') baseQuery += ` AND status = 'WAITING_FOR_ASSESSMENT' AND assessmentRemarks = 'Newly Promoted'`;
            else if (stepFilter === 'step3_assessed') baseQuery += ` AND status = 'ASSESSED'`;
            else if (stepFilter === 'step3_no_appearance') baseQuery += ` AND status = 'NO_APPEARANCE'`;
            else if (stepFilter === 'step3_newly_promoted') baseQuery += ` AND status = 'NEWLY_PROMOTED'`;
            else if (stepFilter === 'step4_pending') baseQuery += ` AND status = 'WAITING' AND (assignmentReqStatus = 'INCOMPLETE' OR assignmentReqStatus IS NULL OR assignmentReqStatus = '')`;
            else if (stepFilter === 'step4_generated') baseQuery += ` AND status = 'WAITING' AND assignmentReqStatus = 'COMPLETE'`;
            else if (stepFilter === 'step5_assigned') baseQuery += ` AND status = 'ASSIGNED'`;
            else if (stepFilter === 'step5_completed') baseQuery += ` AND status = 'COMPLETED'`;
        }

        if (req.socket.destroyed) return;
        const [countResult] = await db.query(`SELECT COUNT(*) AS total ${baseQuery}`, queryParams);
        const totalRecords = countResult[0].total;
        const totalPages = Math.ceil(totalRecords / limit) || 1;

        const [applicants] = await db.query(`SELECT *, CONCAT(firstName, ' ', lastName) AS name ${baseQuery} ORDER BY createdAt DESC LIMIT ? OFFSET ?`, [...queryParams, limit, offset]);

        for (let row of applicants) {
            if (row.status !== 'PENDING') continue;
            if (req.socket.destroyed) return;
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

        const showMasterlist = req.query.tab === 'masterlist';
        const showBackup = req.query.tab === 'backup';
        const showCategories = req.query.tab === 'categories';

        let positionQuery = `SELECT DISTINCT position FROM applicants WHERE position IS NOT NULL AND position != ''`;
        if (searchQuery) positionQuery += searchCondition;
        positionQuery += ` ORDER BY position ASC`;
        const [positionsResult] = await db.query(positionQuery, searchParams);
        const applicantPositionList = positionsResult.map(p => p.position);

        let vacancyQuery = `SELECT DISTINCT vacancyAnnouncementNo FROM applicants WHERE vacancyAnnouncementNo IS NOT NULL`;
        let vacancyParams = [];
        if (positionFilter) {
            vacancyQuery += ` AND position = ?`;
            vacancyParams.push(positionFilter);
        }
        if (searchQuery) {
            vacancyQuery += searchCondition;
            vacancyParams.push(...searchParams);
        }
        vacancyQuery += ` ORDER BY vacancyAnnouncementNo ASC`;
        const [vacancies] = await db.query(vacancyQuery, vacancyParams);
        const vacancyList = vacancies.map(v => String(v.vacancyAnnouncementNo));

        let statusQuery = `SELECT DISTINCT status FROM applicants WHERE status IS NOT NULL AND status != ''`;
        let statusParams = [];
        if (positionFilter) {
            statusQuery += ` AND position = ?`;
            statusParams.push(positionFilter);
        }
        if (vacancyFilter) {
            statusQuery += ` AND vacancyAnnouncementNo = ?`;
            statusParams.push(vacancyFilter);
        }
        if (searchQuery) {
            statusQuery += searchCondition;
            statusParams.push(...searchParams);
        }
        const [statuses] = await db.query(statusQuery, statusParams);
        let stepListMap = new Map();
        for (let row of statuses) {
            let s = row.status;
            if (s === 'QUALIFIED') stepListMap.set('step1_qualified', { value: 'step1_qualified', label: 'Step 1: Qualified' });
            else if (s === 'DISQUALIFIED') stepListMap.set('step1_disqualified', { value: 'step1_disqualified', label: 'Step 1: Disqualified' });
            else if (s === 'ASSESSED') stepListMap.set('step3_assessed', { value: 'step3_assessed', label: 'Step 3: Assessed' });
            else if (s === 'NO_APPEARANCE') stepListMap.set('step3_no_appearance', { value: 'step3_no_appearance', label: 'Step 3: No Appearance' });
            else if (s === 'NEWLY_PROMOTED') stepListMap.set('step3_newly_promoted', { value: 'step3_newly_promoted', label: 'Step 3: Newly Promoted' });
            else if (s === 'ASSIGNED') stepListMap.set('step5_assigned', { value: 'step5_assigned', label: 'Step 5: Assigned' });
            else if (s === 'COMPLETED') stepListMap.set('step5_completed', { value: 'step5_completed', label: 'Step 5: Completed' });
            else if (s === 'PENDING') {
                const [p] = await db.query(`SELECT 1 FROM applicants WHERE status = 'PENDING' ${positionFilter ? 'AND position = ?' : ''} ${vacancyFilter ? 'AND vacancyAnnouncementNo = ?' : ''} ${searchCondition} AND NOT EXISTS (SELECT 1 FROM applicant_education WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL UNION ALL SELECT 1 FROM applicant_training WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL UNION ALL SELECT 1 FROM applicant_experience WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL UNION ALL SELECT 1 FROM applicant_eligibility WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL) LIMIT 1`, statusParams);
                if (p.length > 0) stepListMap.set('step1_pending', { value: 'step1_pending', label: 'Step 1: Pending' });
                
                const [i] = await db.query(`SELECT 1 FROM applicants WHERE status = 'PENDING' ${positionFilter ? 'AND position = ?' : ''} ${vacancyFilter ? 'AND vacancyAnnouncementNo = ?' : ''} ${searchCondition} AND EXISTS (SELECT 1 FROM applicant_education WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL) UNION ALL SELECT 1 FROM applicant_training WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL) UNION ALL SELECT 1 FROM applicant_experience WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL) UNION ALL SELECT 1 FROM applicant_eligibility WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL)) AND EXISTS (SELECT 1 FROM applicant_education WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL UNION ALL SELECT 1 FROM applicant_training WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL UNION ALL SELECT 1 FROM applicant_experience WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL UNION ALL SELECT 1 FROM applicant_eligibility WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL) LIMIT 1`, statusParams);
                if (i.length > 0) stepListMap.set('step1_in_prog', { value: 'step1_in_prog', label: 'Step 1: In Prog' });
                
                const [a] = await db.query(`SELECT 1 FROM applicants WHERE status = 'PENDING' ${positionFilter ? 'AND position = ?' : ''} ${vacancyFilter ? 'AND vacancyAnnouncementNo = ?' : ''} ${searchCondition} AND NOT EXISTS (SELECT 1 FROM applicant_education WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL) UNION ALL SELECT 1 FROM applicant_training WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL) UNION ALL SELECT 1 FROM applicant_experience WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL) UNION ALL SELECT 1 FROM applicant_eligibility WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL)) AND EXISTS (SELECT 1 FROM applicant_education WHERE applicant_id = applicants.id UNION ALL SELECT 1 FROM applicant_training WHERE applicant_id = applicants.id UNION ALL SELECT 1 FROM applicant_experience WHERE applicant_id = applicants.id UNION ALL SELECT 1 FROM applicant_eligibility WHERE applicant_id = applicants.id) LIMIT 1`, statusParams);
                if (a.length > 0) stepListMap.set('step1_assessed', { value: 'step1_assessed', label: 'Step 1: Assessed' });
            }
            else if (s === 'WAITING_FOR_ASSESSMENT') {
                const [s2] = await db.query(`SELECT DISTINCT assessmentRemarks FROM applicants WHERE status = 'WAITING_FOR_ASSESSMENT' ${positionFilter ? 'AND position = ?' : ''} ${vacancyFilter ? 'AND vacancyAnnouncementNo = ?' : ''}`, statusParams);
                for (let r of s2) {
                    if (r.assessmentRemarks === 'In-Prog') stepListMap.set('step2_in_prog', { value: 'step2_in_prog', label: 'Step 2: In Prog' });
                    else if (r.assessmentRemarks === 'Assessed') stepListMap.set('step2_assessed', { value: 'step2_assessed', label: 'Step 2: Assessed' });
                    else if (r.assessmentRemarks === 'Newly Promoted') stepListMap.set('step2_newly_promoted', { value: 'step2_newly_promoted', label: 'Step 2: Newly Promoted' });
                    else stepListMap.set('step2_pending', { value: 'step2_pending', label: 'Step 2: Pending' });
                }
            }
            else if (s === 'WAITING') {
                const [s4] = await db.query(`SELECT DISTINCT assignmentReqStatus FROM applicants WHERE status = 'WAITING' ${positionFilter ? 'AND position = ?' : ''} ${vacancyFilter ? 'AND vacancyAnnouncementNo = ?' : ''}`, statusParams);
                for (let r of s4) {
                    if (r.assignmentReqStatus === 'COMPLETE') stepListMap.set('step4_generated', { value: 'step4_generated', label: 'Step 4: Generated' });
                    else stepListMap.set('step4_pending', { value: 'step4_pending', label: 'Step 4: Pending' });
                }
            }
        }
        const stepList = Array.from(stepListMap.values());
        stepList.sort((a, b) => a.value.localeCompare(b.value));

        const pagination = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
                let pUrl = `/dashboard?tab=masterlist&page=${i}&`;
                if (searchQuery) pUrl += `q=${encodeURIComponent(searchQuery)}&`;
                if (positionFilter) pUrl += `position=${encodeURIComponent(positionFilter)}&`;
                if (vacancyFilter) pUrl += `vacancy=${encodeURIComponent(vacancyFilter)}&`;
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
            positionFilter,
            vacancyFilter,
            stepFilter,
            positionList: applicantPositionList,
            vacancyList,
            stepList,
            pagination: cleanPagination,
            showMasterlist,
            showBackup,
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
                groupedPositions[row.category] = { 
                    categoryName: row.category, 
                    categorySlug: row.category.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase(),
                    hasVacancy: false, 
                    positions: [], 
                    positionGroups: {}, 
                    vacantCount: 0, 
                    totalCount: 0 
                };
            }
            let itemsCount = row.vacancyCount || 1;
            groupedPositions[row.category].totalCount += itemsCount;
            totalPositionsCount += itemsCount;
            if (row.in_vacancy) {
                groupedPositions[row.category].hasVacancy = true;
                groupedPositions[row.category].vacantCount += itemsCount;
                totalVacantCount += itemsCount;
            }
            groupedPositions[row.category].positions.push(row);
            
            let groupName = row.groupName || row.title;
            if (!groupedPositions[row.category].positionGroups[groupName]) {
                groupedPositions[row.category].positionGroups[groupName] = { 
                    groupName: groupName, 
                    groupSlug: groupName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase(),
                    positions: [] 
                };
            }
            groupedPositions[row.category].positionGroups[groupName].positions.push(row);
        }
        
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        const searchQuery = req.query.q || '';
        const positionFilter = req.query.position || '';
        const vacancyFilter = req.query.vacancy || '';
        const stepFilter = req.query.step || '';

        let baseQuery = `FROM applicants WHERE 1=1`;
        const queryParams = [];
        let searchCondition = '';
        let searchParams = [];

        if (searchQuery) {
            searchCondition = ` AND (CONCAT(firstName, ' ', lastName) LIKE ? OR applicationCode LIKE ? OR vacancyAnnouncementNo LIKE ?)`;
            const searchPattern = `%${searchQuery}%`;
            searchParams.push(searchPattern, searchPattern, searchPattern);
            baseQuery += searchCondition;
            queryParams.push(...searchParams);
        }

        if (positionFilter) {
            baseQuery += ` AND position = ?`;
            queryParams.push(positionFilter);
        }
        
        if (vacancyFilter) {
            baseQuery += ` AND vacancyAnnouncementNo = ?`;
            queryParams.push(vacancyFilter);
        }

        if (stepFilter) {
            if (stepFilter === 'step1_pending') {
                baseQuery += ` AND status = 'PENDING' AND NOT EXISTS (
                    SELECT 1 FROM applicant_education WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL
                    UNION ALL SELECT 1 FROM applicant_training WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL
                    UNION ALL SELECT 1 FROM applicant_experience WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL
                    UNION ALL SELECT 1 FROM applicant_eligibility WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL
                )`;
            } else if (stepFilter === 'step1_assessed') {
                baseQuery += ` AND status = 'PENDING' AND NOT EXISTS (
                    SELECT 1 FROM applicant_education WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL)
                    UNION ALL SELECT 1 FROM applicant_training WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL)
                    UNION ALL SELECT 1 FROM applicant_experience WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL)
                    UNION ALL SELECT 1 FROM applicant_eligibility WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL)
                ) AND EXISTS (
                    SELECT 1 FROM applicant_education WHERE applicant_id = applicants.id
                    UNION ALL SELECT 1 FROM applicant_training WHERE applicant_id = applicants.id
                    UNION ALL SELECT 1 FROM applicant_experience WHERE applicant_id = applicants.id
                    UNION ALL SELECT 1 FROM applicant_eligibility WHERE applicant_id = applicants.id
                )`;
            } else if (stepFilter === 'step1_in_prog') {
                baseQuery += ` AND status = 'PENDING' AND EXISTS (
                    SELECT 1 FROM applicant_education WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL)
                    UNION ALL SELECT 1 FROM applicant_training WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL)
                    UNION ALL SELECT 1 FROM applicant_experience WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL)
                    UNION ALL SELECT 1 FROM applicant_eligibility WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL)
                ) AND EXISTS (
                    SELECT 1 FROM applicant_education WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL
                    UNION ALL SELECT 1 FROM applicant_training WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL
                    UNION ALL SELECT 1 FROM applicant_experience WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL
                    UNION ALL SELECT 1 FROM applicant_eligibility WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL
                )`;
            }
            else if (stepFilter === 'step1_qualified') baseQuery += ` AND status = 'QUALIFIED'`;
            else if (stepFilter === 'step1_disqualified') baseQuery += ` AND status = 'DISQUALIFIED'`;
            else if (stepFilter === 'step2_pending') baseQuery += ` AND status = 'WAITING_FOR_ASSESSMENT' AND (assessmentRemarks = 'Pending' OR assessmentRemarks IS NULL OR assessmentRemarks = '')`;
            else if (stepFilter === 'step2_in_prog') baseQuery += ` AND status = 'WAITING_FOR_ASSESSMENT' AND assessmentRemarks = 'In-Prog'`;
            else if (stepFilter === 'step2_assessed') baseQuery += ` AND status = 'WAITING_FOR_ASSESSMENT' AND assessmentRemarks = 'Assessed'`;
            else if (stepFilter === 'step2_newly_promoted') baseQuery += ` AND status = 'WAITING_FOR_ASSESSMENT' AND assessmentRemarks = 'Newly Promoted'`;
            else if (stepFilter === 'step3_assessed') baseQuery += ` AND status = 'ASSESSED'`;
            else if (stepFilter === 'step3_no_appearance') baseQuery += ` AND status = 'NO_APPEARANCE'`;
            else if (stepFilter === 'step3_newly_promoted') baseQuery += ` AND status = 'NEWLY_PROMOTED'`;
            else if (stepFilter === 'step4_pending') baseQuery += ` AND status = 'WAITING' AND (assignmentReqStatus = 'INCOMPLETE' OR assignmentReqStatus IS NULL OR assignmentReqStatus = '')`;
            else if (stepFilter === 'step4_generated') baseQuery += ` AND status = 'WAITING' AND assignmentReqStatus = 'COMPLETE'`;
            else if (stepFilter === 'step5_assigned') baseQuery += ` AND status = 'ASSIGNED'`;
            else if (stepFilter === 'step5_completed') baseQuery += ` AND status = 'COMPLETED'`;
        }

        const [countResult] = await db.query(`SELECT COUNT(*) AS total ${baseQuery}`, queryParams);
        const totalRecords = countResult[0].total;
        const totalPages = Math.ceil(totalRecords / limit) || 1;

        const [applicants] = await db.query(`SELECT *, CONCAT(firstName, ' ', lastName) AS name ${baseQuery} ORDER BY createdAt DESC LIMIT ? OFFSET ?`, [...queryParams, limit, offset]);

        for (let row of applicants) {
            if (row.status !== 'PENDING') continue;
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

        const showMasterlist = req.query.tab === 'masterlist';
        const showBackup = req.query.tab === 'backup';

        let positionQuery = `SELECT DISTINCT position FROM applicants WHERE position IS NOT NULL AND position != ''`;
        if (searchQuery) positionQuery += searchCondition;
        positionQuery += ` ORDER BY position ASC`;
        const [positionsResult] = await db.query(positionQuery, searchParams);
        const applicantPositionList = positionsResult.map(p => p.position);

        let vacancyQuery = `SELECT DISTINCT vacancyAnnouncementNo FROM applicants WHERE vacancyAnnouncementNo IS NOT NULL`;
        let vacancyParams = [];
        if (positionFilter) {
            vacancyQuery += ` AND position = ?`;
            vacancyParams.push(positionFilter);
        }
        if (searchQuery) {
            vacancyQuery += searchCondition;
            vacancyParams.push(...searchParams);
        }
        vacancyQuery += ` ORDER BY vacancyAnnouncementNo ASC`;
        const [vacancies] = await db.query(vacancyQuery, vacancyParams);
        const vacancyList = vacancies.map(v => String(v.vacancyAnnouncementNo));

        let statusQuery = `SELECT DISTINCT status FROM applicants WHERE status IS NOT NULL AND status != ''`;
        let statusParams = [];
        if (positionFilter) {
            statusQuery += ` AND position = ?`;
            statusParams.push(positionFilter);
        }
        if (vacancyFilter) {
            statusQuery += ` AND vacancyAnnouncementNo = ?`;
            statusParams.push(vacancyFilter);
        }
        if (searchQuery) {
            statusQuery += searchCondition;
            statusParams.push(...searchParams);
        }
        const [statuses] = await db.query(statusQuery, statusParams);
        let stepListMap = new Map();
        for (let row of statuses) {
            let s = row.status;
            if (s === 'QUALIFIED') stepListMap.set('step1_qualified', { value: 'step1_qualified', label: 'Step 1: Qualified' });
            else if (s === 'DISQUALIFIED') stepListMap.set('step1_disqualified', { value: 'step1_disqualified', label: 'Step 1: Disqualified' });
            else if (s === 'ASSESSED') stepListMap.set('step3_assessed', { value: 'step3_assessed', label: 'Step 3: Assessed' });
            else if (s === 'NO_APPEARANCE') stepListMap.set('step3_no_appearance', { value: 'step3_no_appearance', label: 'Step 3: No Appearance' });
            else if (s === 'NEWLY_PROMOTED') stepListMap.set('step3_newly_promoted', { value: 'step3_newly_promoted', label: 'Step 3: Newly Promoted' });
            else if (s === 'ASSIGNED') stepListMap.set('step5_assigned', { value: 'step5_assigned', label: 'Step 5: Assigned' });
            else if (s === 'COMPLETED') stepListMap.set('step5_completed', { value: 'step5_completed', label: 'Step 5: Completed' });
            else if (s === 'PENDING') {
                const [p] = await db.query(`SELECT 1 FROM applicants WHERE status = 'PENDING' ${positionFilter ? 'AND position = ?' : ''} ${vacancyFilter ? 'AND vacancyAnnouncementNo = ?' : ''} ${searchCondition} AND NOT EXISTS (SELECT 1 FROM applicant_education WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL UNION ALL SELECT 1 FROM applicant_training WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL UNION ALL SELECT 1 FROM applicant_experience WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL UNION ALL SELECT 1 FROM applicant_eligibility WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL) LIMIT 1`, statusParams);
                if (p.length > 0) stepListMap.set('step1_pending', { value: 'step1_pending', label: 'Step 1: Pending' });
                
                const [i] = await db.query(`SELECT 1 FROM applicants WHERE status = 'PENDING' ${positionFilter ? 'AND position = ?' : ''} ${vacancyFilter ? 'AND vacancyAnnouncementNo = ?' : ''} ${searchCondition} AND EXISTS (SELECT 1 FROM applicant_education WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL) UNION ALL SELECT 1 FROM applicant_training WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL) UNION ALL SELECT 1 FROM applicant_experience WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL) UNION ALL SELECT 1 FROM applicant_eligibility WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL)) AND EXISTS (SELECT 1 FROM applicant_education WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL UNION ALL SELECT 1 FROM applicant_training WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL UNION ALL SELECT 1 FROM applicant_experience WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL UNION ALL SELECT 1 FROM applicant_eligibility WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL) LIMIT 1`, statusParams);
                if (i.length > 0) stepListMap.set('step1_in_prog', { value: 'step1_in_prog', label: 'Step 1: In Prog' });
                
                const [a] = await db.query(`SELECT 1 FROM applicants WHERE status = 'PENDING' ${positionFilter ? 'AND position = ?' : ''} ${vacancyFilter ? 'AND vacancyAnnouncementNo = ?' : ''} ${searchCondition} AND NOT EXISTS (SELECT 1 FROM applicant_education WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL) UNION ALL SELECT 1 FROM applicant_training WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL) UNION ALL SELECT 1 FROM applicant_experience WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL) UNION ALL SELECT 1 FROM applicant_eligibility WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL)) AND EXISTS (SELECT 1 FROM applicant_education WHERE applicant_id = applicants.id UNION ALL SELECT 1 FROM applicant_training WHERE applicant_id = applicants.id UNION ALL SELECT 1 FROM applicant_experience WHERE applicant_id = applicants.id UNION ALL SELECT 1 FROM applicant_eligibility WHERE applicant_id = applicants.id) LIMIT 1`, statusParams);
                if (a.length > 0) stepListMap.set('step1_assessed', { value: 'step1_assessed', label: 'Step 1: Assessed' });
            }
            else if (s === 'WAITING_FOR_ASSESSMENT') {
                const [s2] = await db.query(`SELECT DISTINCT assessmentRemarks FROM applicants WHERE status = 'WAITING_FOR_ASSESSMENT' ${positionFilter ? 'AND position = ?' : ''} ${vacancyFilter ? 'AND vacancyAnnouncementNo = ?' : ''}`, statusParams);
                for (let r of s2) {
                    if (r.assessmentRemarks === 'In-Prog') stepListMap.set('step2_in_prog', { value: 'step2_in_prog', label: 'Step 2: In Prog' });
                    else if (r.assessmentRemarks === 'Assessed') stepListMap.set('step2_assessed', { value: 'step2_assessed', label: 'Step 2: Assessed' });
                    else if (r.assessmentRemarks === 'Newly Promoted') stepListMap.set('step2_newly_promoted', { value: 'step2_newly_promoted', label: 'Step 2: Newly Promoted' });
                    else stepListMap.set('step2_pending', { value: 'step2_pending', label: 'Step 2: Pending' });
                }
            }
            else if (s === 'WAITING') {
                const [s4] = await db.query(`SELECT DISTINCT assignmentReqStatus FROM applicants WHERE status = 'WAITING' ${positionFilter ? 'AND position = ?' : ''} ${vacancyFilter ? 'AND vacancyAnnouncementNo = ?' : ''}`, statusParams);
                for (let r of s4) {
                    if (r.assignmentReqStatus === 'COMPLETE') stepListMap.set('step4_generated', { value: 'step4_generated', label: 'Step 4: Generated' });
                    else stepListMap.set('step4_pending', { value: 'step4_pending', label: 'Step 4: Pending' });
                }
            }
        }
        const stepList = Array.from(stepListMap.values());
        stepList.sort((a, b) => a.value.localeCompare(b.value));

        const pagination = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
                let pUrl = `/dashboard/${req.params.id}?tab=masterlist&page=${i}&`;
                if (searchQuery) pUrl += `q=${encodeURIComponent(searchQuery)}&`;
                if (positionFilter) pUrl += `position=${encodeURIComponent(positionFilter)}&`;
                if (vacancyFilter) pUrl += `vacancy=${encodeURIComponent(vacancyFilter)}&`;
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
            vacancyFilter,
            positionList: applicantPositionList,
            vacancyList,
            stepList,
            pagination: cleanPagination,
            showMasterlist,
            showBackup
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
        const frontendMap = {};
        for (const row of rows) {
            if (!groupedPositions[row.category]) {
                groupedPositions[row.category] = { categoryName: row.category, positions: [] };
                frontendMap[row.category] = [];
            }
            groupedPositions[row.category].positions.push(row);
            frontendMap[row.category].push({
                title: row.title,
                vacancyAnnouncementNo: row.vacancyAnnouncementNo || null
            });
        }
        const dynamicPositionsJSON = JSON.stringify(frontendMap).replace(/</g, '\\u003c');
        res.render('add-applicant', { addApplicantActive: true, groupedPositions, dynamicPositionsJSON });
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
    const vacancyFilter = req.query.vacancy || '';

    let baseQuery = `FROM applicants WHERE 1=1`;
        const queryParams = [];
        let searchCondition = '';
        let searchParams = [];

        if (searchQuery) {
            searchCondition = ` AND (CONCAT(firstName, ' ', lastName) LIKE ? OR applicationCode LIKE ? OR vacancyAnnouncementNo LIKE ?)`;
            const searchPattern = `%${searchQuery}%`;
            searchParams.push(searchPattern, searchPattern, searchPattern);
            baseQuery += searchCondition;
            queryParams.push(...searchParams);
        }

    if (positionFilter) {
        baseQuery += ` AND position = ?`;
        queryParams.push(positionFilter);
    }
    
    if (vacancyFilter) {
        baseQuery += ` AND vacancyAnnouncementNo = ?`;
        queryParams.push(vacancyFilter);
    }

    try {
        if (req.socket.destroyed) return;
        const [countResult] = await db.query(`SELECT COUNT(*) AS total ${baseQuery}`, queryParams);
        const totalRecords = countResult[0].total;
        const totalPages = Math.ceil(totalRecords / limit) || 1;

        const [rows] = await db.query(`SELECT *, CONCAT(firstName, ' ', lastName) AS name ${baseQuery} ORDER BY createdAt DESC LIMIT ? OFFSET ?`, [...queryParams, limit, offset]);

        const [positions] = await db.query(`SELECT DISTINCT position FROM applicants WHERE position IS NOT NULL AND position != '' ORDER BY position ASC`);
        const positionList = positions.map(p => p.position);
        
        const [vacancies] = await db.query(`SELECT DISTINCT vacancyAnnouncementNo FROM applicants WHERE vacancyAnnouncementNo IS NOT NULL ORDER BY vacancyAnnouncementNo ASC`);
        const vacancyList = vacancies.map(v => String(v.vacancyAnnouncementNo));

        res.render('masterlist', {
            masterlistActive: true,
            applicants: rows,
            currentPage: page,
            totalPages,
            searchQuery,
            positionFilter,
            positionList,
            vacancyFilter,
            vacancyList,
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
    const vacancyFilter = req.query.vacancy || '';
    const page = parseInt(req.params.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const searchQuery = req.query.q || '';
    const officeFilter = req.query.office || '';
    const remarksFilter = req.query.remarks || '';
    const config = stepsConfig[step];
    
    let baseQuery = `FROM applicants WHERE ${config.conditions}`;
        const queryParams = [];
        let searchCondition = '';
        let searchParams = [];

        if (searchQuery) {
            searchCondition = ` AND (CONCAT(firstName, ' ', lastName) LIKE ? OR applicationCode LIKE ?)`;
            const searchPattern = `%${searchQuery}%`;
            searchParams.push(searchPattern, searchPattern);
            baseQuery += searchCondition;
            queryParams.push(...searchParams);
        }

    if (positionFilter && (step === 'step1' || step === 'step2' || step === 'step3' || step === 'step4' || step === 'step5')) {
        baseQuery += ` AND position = ?`;
        queryParams.push(positionFilter);
    }
    
    if (vacancyFilter) {
        baseQuery += ` AND vacancyAnnouncementNo = ?`;
        queryParams.push(vacancyFilter);
    }
    
    if (officeFilter && step === 'step5') {
        baseQuery += ` AND assignedOffice = ?`;
        queryParams.push(officeFilter);
    }

    if (remarksFilter) {
        if (step === 'step1') {
            if (remarksFilter === 'Qualified') {
                baseQuery += ` AND status = 'QUALIFIED'`;
            } else if (remarksFilter === 'Disqualified') {
                baseQuery += ` AND status = 'DISQUALIFIED'`;
            } else if (remarksFilter === 'Pending') {
                baseQuery += ` AND status = 'PENDING' AND NOT EXISTS (
                    SELECT 1 FROM applicant_education WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL
                    UNION ALL SELECT 1 FROM applicant_training WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL
                    UNION ALL SELECT 1 FROM applicant_experience WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL
                    UNION ALL SELECT 1 FROM applicant_eligibility WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL
                )`;
            } else if (remarksFilter === 'Assessed') {
                baseQuery += ` AND status = 'PENDING' AND NOT EXISTS (
                    SELECT 1 FROM applicant_education WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL)
                    UNION ALL SELECT 1 FROM applicant_training WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL)
                    UNION ALL SELECT 1 FROM applicant_experience WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL)
                    UNION ALL SELECT 1 FROM applicant_eligibility WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL)
                ) AND EXISTS (
                    SELECT 1 FROM applicant_education WHERE applicant_id = applicants.id
                    UNION ALL SELECT 1 FROM applicant_training WHERE applicant_id = applicants.id
                    UNION ALL SELECT 1 FROM applicant_experience WHERE applicant_id = applicants.id
                    UNION ALL SELECT 1 FROM applicant_eligibility WHERE applicant_id = applicants.id
                )`;
            } else if (remarksFilter === 'In-Prog') {
                baseQuery += ` AND status = 'PENDING' AND EXISTS (
                    SELECT 1 FROM applicant_education WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL)
                    UNION ALL SELECT 1 FROM applicant_training WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL)
                    UNION ALL SELECT 1 FROM applicant_experience WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL)
                    UNION ALL SELECT 1 FROM applicant_eligibility WHERE applicant_id = applicants.id AND (status = 'PENDING' OR status IS NULL)
                ) AND EXISTS (
                    SELECT 1 FROM applicant_education WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL
                    UNION ALL SELECT 1 FROM applicant_training WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL
                    UNION ALL SELECT 1 FROM applicant_experience WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL
                    UNION ALL SELECT 1 FROM applicant_eligibility WHERE applicant_id = applicants.id AND status != 'PENDING' AND status IS NOT NULL
                )`;
            }
        } else if (step === 'step3') {
            baseQuery += ` AND status = ?`;
            queryParams.push(remarksFilter);
        } else if (step === 'step2') {
            baseQuery += ` AND assessmentRemarks = ?`;
            queryParams.push(remarksFilter);
        } else if (step === 'step4') {
            baseQuery += ` AND assignmentReqStatus = ?`;
            queryParams.push(remarksFilter);
        }
    }

    try {
        if (req.socket.destroyed) return;
        const [countResult] = await db.query(`SELECT COUNT(*) AS total ${baseQuery}`, queryParams);
        const totalRecords = countResult[0].total;
        const totalPages = Math.ceil(totalRecords / limit) || 1;

        const [rows] = await db.query(`SELECT *, CONCAT(firstName, ' ', lastName) AS name ${baseQuery} ORDER BY ${config.orderBy} LIMIT ? OFFSET ?`, [...queryParams, limit, offset]);

        let positionList = [];
        let vacancyList = [];
        let remarksList = [];
        if (step === 'step1' || step === 'step2' || step === 'step3' || step === 'step4' || step === 'step5') {
            if (req.socket.destroyed) return;
            let positionQuery = `SELECT DISTINCT position FROM applicants WHERE position IS NOT NULL AND position != '' AND ${config.conditions}`;
            if (searchQuery) positionQuery += searchCondition;
            positionQuery += ` ORDER BY position ASC`;
            const [positions] = await db.query(positionQuery, searchParams);
            positionList = positions.map(p => p.position);
            
            let vacancyQuery = `SELECT DISTINCT vacancyAnnouncementNo FROM applicants WHERE vacancyAnnouncementNo IS NOT NULL AND ${config.conditions}`;
            let vacancyParams = [];
            if (positionFilter) {
                vacancyQuery += ` AND position = ?`;
                vacancyParams.push(positionFilter);
            }
            if (searchQuery) {
                vacancyQuery += searchCondition;
                vacancyParams.push(...searchParams);
            }
            vacancyQuery += ` ORDER BY vacancyAnnouncementNo ASC`;
            
            const [vacancies] = await db.query(vacancyQuery, vacancyParams);
            vacancyList = vacancies.map(v => String(v.vacancyAnnouncementNo));
            
            if (step === 'step1') {
                let pQuery = `SELECT id, status FROM applicants WHERE ${config.conditions}`;
                let pParams = [];
                if (positionFilter) { pQuery += ` AND position = ?`; pParams.push(positionFilter); }
                if (vacancyFilter) { pQuery += ` AND vacancyAnnouncementNo = ?`; pParams.push(vacancyFilter); }
                if (searchQuery) { pQuery += searchCondition; pParams.push(...searchParams); }
                const [allStep1Apps] = await db.query(pQuery, pParams);
                
                const remarksSet = new Set();
                if (allStep1Apps.length > 0) {
                    let joinCondition = '';
                    let singleJoinParams = [];
                    if (positionFilter) {
                        joinCondition += ' AND b.position = ?';
                        singleJoinParams.push(positionFilter);
                    }
                    if (vacancyFilter) {
                        joinCondition += ' AND b.vacancyAnnouncementNo = ?';
                        singleJoinParams.push(vacancyFilter);
                    }
                    const joinParams = [...singleJoinParams, ...singleJoinParams, ...singleJoinParams, ...singleJoinParams];
                    if (req.socket.destroyed) return;
                    const [docs] = await db.query(`
                        SELECT a.applicant_id, a.status FROM applicant_education a JOIN applicants b ON a.applicant_id = b.id WHERE b.status = 'PENDING'${joinCondition}
                        UNION ALL SELECT a.applicant_id, a.status FROM applicant_training a JOIN applicants b ON a.applicant_id = b.id WHERE b.status = 'PENDING'${joinCondition}
                        UNION ALL SELECT a.applicant_id, a.status FROM applicant_experience a JOIN applicants b ON a.applicant_id = b.id WHERE b.status = 'PENDING'${joinCondition}
                        UNION ALL SELECT a.applicant_id, a.status FROM applicant_eligibility a JOIN applicants b ON a.applicant_id = b.id WHERE b.status = 'PENDING'${joinCondition}
                    `, joinParams);
                    
                    const docsByApp = {};
                    for (let app of allStep1Apps) docsByApp[app.id] = [];
                    for (let d of docs) {
                        if(docsByApp[d.applicant_id]) docsByApp[d.applicant_id].push(d);
                    }
                    
                    for (let app of allStep1Apps) {
                        if (app.status === 'QUALIFIED') remarksSet.add('Qualified');
                        else if (app.status === 'DISQUALIFIED') remarksSet.add('Disqualified');
                        else {
                            let appDocs = docsByApp[app.id];
                            if (appDocs.length === 0) { remarksSet.add('Pending'); } else {
                                const pendingCount = appDocs.filter(d => d.status === 'PENDING' || !d.status).length;
                                if (pendingCount === appDocs.length) remarksSet.add('Pending');
                                else if (pendingCount === 0) remarksSet.add('Assessed');
                                else remarksSet.add('In-Prog');
                            }
                        }
                    }
                }
                const sortedRemarks = Array.from(remarksSet).sort();
                remarksList = sortedRemarks.map(val => ({ value: val, label: val }));
            } else if (step === 'step2' || step === 'step3' || step === 'step4' || step === 'step5') {
                const remarksColumnMap = {
                    'step2': 'assessmentRemarks',
                    'step3': 'status',
                    'step4': 'assignmentReqStatus',
                    'step5': 'status'
                };
                const remarksCol = remarksColumnMap[step];
                let remarksQuery = `SELECT DISTINCT ${remarksCol} AS remarkValue FROM applicants WHERE ${remarksCol} IS NOT NULL AND ${remarksCol} != '' AND ${config.conditions}`;
                let remarksParamsArr = [];
                if (positionFilter) {
                    remarksQuery += ` AND position = ?`;
                    remarksParamsArr.push(positionFilter);
                }
                if (vacancyFilter) {
                    remarksQuery += ` AND vacancyAnnouncementNo = ?`;
                    remarksParamsArr.push(vacancyFilter);
                }
                if (searchQuery) {
                    remarksQuery += searchCondition;
                    remarksParamsArr.push(...searchParams);
                }
                remarksQuery += ` ORDER BY ${remarksCol} ASC`;
                const [remarks] = await db.query(remarksQuery, remarksParamsArr);
                remarksList = remarks.map(r => {
                    let val = r.remarkValue;
                    let label = val;
                    if (val === 'PENDING' && step !== 'step2') label = 'Pending';
                    else if (val === 'QUALIFIED') label = 'Qualified';
                    else if (val === 'DISQUALIFIED') label = 'Disqualified';
                    else if (val === 'ASSESSED') label = 'Assessed';
                    else if (val === 'NO_APPEARANCE') label = 'No Appearance';
                    else if (val === 'NEWLY_PROMOTED') label = 'Newly Promoted';
                    else if (val === 'COMPLETE') label = 'Generated';
                    else if (val === 'INCOMPLETE') label = 'Pending';
                    else if (val === 'ASSIGNED') label = 'Assigned';
                    return { value: val, label: label };
                });
            }
        }
        
        let officeList = [];
        if (step === 'step5') {
            let officeQuery = `SELECT DISTINCT assignedOffice FROM applicants WHERE assignedOffice IS NOT NULL AND assignedOffice != '' AND ${config.conditions}`;
            let officeParams = [];
            if (positionFilter) {
                officeQuery += ` AND position = ?`;
                officeParams.push(positionFilter);
            }
            if (vacancyFilter) {
                officeQuery += ` AND vacancyAnnouncementNo = ?`;
                officeParams.push(vacancyFilter);
            }
            officeQuery += ` ORDER BY assignedOffice ASC`;
            const [offices] = await db.query(officeQuery, officeParams);
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
                if (vacancyFilter) pUrl += `vacancy=${encodeURIComponent(vacancyFilter)}&`;
                if (officeFilter) pUrl += `office=${encodeURIComponent(officeFilter)}&`;
                if (remarksFilter) pUrl += `remarks=${encodeURIComponent(remarksFilter)}&`;
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
            currentStep: step, [step]: mappedRows, searchQuery, positionFilter, positionList, vacancyFilter, vacancyList, officeFilter, officeList, remarksFilter, remarksList,
            pagination: cleanPagination, step1Active: step === 'step1', step2Active: step === 'step2', step3Active: step === 'step3',
            step4Active: step === 'step4', step5Active: step === 'step5', offset
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Database Error');
    }
};

exports.getStep2Login = (req, res) => {
    res.render('step2-login', { error: req.query.error, step2Active: true });
};

exports.postStep2Login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const db = require('../db');
        const crypto = require('crypto');
        const jwt = require('jsonwebtoken');

        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) {
            return res.redirect('/step2-login?error=Invalid credentials');
        }

        const user = rows[0];
        const hash = crypto.createHash('sha256').update(password).digest('hex');

        if (user.password !== hash) {
            return res.redirect('/step2-login?error=Invalid credentials');
        }

        if (!user.can_access_step2) {
            return res.redirect('/step2-login?error=You do not have permission to access Step 2');
        }

        // Create a fingerprint using IP and User-Agent to prevent cookie theft/spoofing on HTTP
        const clientIp = req.ip || req.connection.remoteAddress || '';
        const userAgent = req.headers['user-agent'] || '';
        const fingerprint = crypto.createHash('sha256').update(clientIp + userAgent).digest('hex');

        const token = jwt.sign({ 
            step2Auth: true,
            fingerprint: fingerprint 
        }, process.env.JWT_SECRET || 'fallback-secret-for-dev', { expiresIn: '12h' });
        
        res.cookie('step2Auth', token, {
            httpOnly: true,
            secure: false, // Must be false for standard HTTP
            sameSite: 'lax',
            maxAge: 12 * 60 * 60 * 1000 // 12 hours
        });
        
        const authController = require('./authController');
        authController.logAction(user.id, 'Unlocked Step 2');

        res.redirect('/step2/1');
    } catch (e) {
        console.error(e);
        res.redirect('/step2-login?error=Server error');
    }
};
