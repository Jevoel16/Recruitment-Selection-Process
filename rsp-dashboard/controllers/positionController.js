const db = require('../db');

// Commits modifications to a position's core qualification standards and salary metrics.
// This ensures that the dynamic vacancy dashboard accurately reflects real-time Civil Service criteria.
exports.updatePosition = async (req, res) => {
    try {
        const { id, vacancyAnnouncement, plantillaItem, salaryGrade, monthlySalary, qsEducation, qsTraining, qsExperience, qsEligibility } = req.body;
        let { qsEducationLevel, qsTrainingLevel, qsExperienceLevel } = req.body;

        qsEducationLevel = qsEducationLevel || null;
        qsTrainingLevel = qsTrainingLevel || null;
        qsExperienceLevel = qsExperienceLevel || null;
        
        // Manual validation
        if (!id) return res.status(400).json({ error: "Missing ID" });

        await db.query(`UPDATE positions SET vacancyAnnouncement=?, plantillaItem=?, salaryGrade=?, monthlySalary=?, qsEducation=?, qsEducationLevel=?, qsTraining=?, qsTrainingLevel=?, qsExperience=?, qsExperienceLevel=?, qsEligibility=? WHERE id=?`, 
            [vacancyAnnouncement, plantillaItem, salaryGrade, monthlySalary, qsEducation, qsEducationLevel, qsTraining, qsTrainingLevel, qsExperience, qsExperienceLevel, qsEligibility, id]);
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Toggles a position's active recruitment status on the dashboard.
// Only positions marked as 'in_vacancy' (1) will accept new applicants and appear in the Masterlist dropdowns.
exports.togglePositionVacancy = async (req, res) => {
    try {
        const { in_vacancy } = req.body;
        if (in_vacancy === undefined) return res.status(400).json({ error: "Missing in_vacancy parameter" });

        await db.query(`UPDATE positions SET in_vacancy = ? WHERE id = ?`, [in_vacancy ? 1 : 0, req.params.id]);
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Updates the precise capacity limits and identifying codes for a specific job title.
// The vacancyCount directly limits how many applicants can ultimately be advanced to the 'ASSIGNED' state for this position.
exports.updatePlantilla = async (req, res) => {
    try {
        const { vacancyCount, plantillaItem } = req.body;
        if (vacancyCount === undefined || !plantillaItem) return res.status(400).json({ error: "Missing parameters" });

        await db.query(`UPDATE positions SET vacancyCount = ?, plantillaItem = ? WHERE id = ?`, [vacancyCount, plantillaItem, req.params.id]);
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }
};
