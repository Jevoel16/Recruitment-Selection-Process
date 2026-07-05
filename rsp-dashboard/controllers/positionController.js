const db = require('../db');

exports.updatePosition = async (req, res) => {
    try {
        const { id, vacancyAnnouncement, plantillaItem, salaryGrade, monthlySalary, qsEducation, qsTraining, qsExperience, qsEligibility } = req.body;
        
        // Manual validation
        if (!id) return res.status(400).json({ error: "Missing ID" });

        await db.query(`UPDATE positions SET vacancyAnnouncement=?, plantillaItem=?, salaryGrade=?, monthlySalary=?, qsEducation=?, qsTraining=?, qsExperience=?, qsEligibility=? WHERE id=?`, 
            [vacancyAnnouncement, plantillaItem, salaryGrade, monthlySalary, qsEducation, qsTraining, qsExperience, qsEligibility, id]);
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }
};

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
