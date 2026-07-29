const fs = require('fs/promises');
const path = require('path');
const db = require('../db');
const PizZip = require('pizzip');

const BACKUP_DIR = path.join(__dirname, '..', 'database', 'database_backups');

// Helper for CSV conversion
function jsonToCsv(jsonArray) {
    if (!jsonArray || !jsonArray.length) return '';
    const keys = Object.keys(jsonArray[0]);
    const header = keys.join(',');
    const rows = jsonArray.map(obj => {
        return keys.map(k => {
            let val = obj[k];
            if (val === null || val === undefined) return '';
            val = String(val).replace(/"/g, '""');
            if (val.search(/("|,|\n)/g) >= 0) val = `"${val}"`;
            return val;
        }).join(',');
    });
    return [header, ...rows].join('\n');
}

async function ensureBackupDir() {
    try {
        await fs.access(BACKUP_DIR);
    } catch {
        await fs.mkdir(BACKUP_DIR, { recursive: true });
    }
}

async function fetchDatabaseData() {
    const [applicants] = await db.query('SELECT * FROM applicants');
    const [education] = await db.query('SELECT * FROM applicant_education');
    const [experience] = await db.query('SELECT * FROM applicant_experience');
    const [training] = await db.query('SELECT * FROM applicant_training');
    const [eligibility] = await db.query('SELECT * FROM applicant_eligibility');
    
    return { applicants, education, experience, training, eligibility };
}

async function generateDailyBackups() {
    await ensureBackupDir();
    
    const data = await fetchDatabaseData();
    
    const now = new Date();
    // Using ISO format for date in filename: YYYY-MM-DD
    const dateStr = now.toISOString().split('T')[0]; 
    const timestamp = Date.now();
    
    // 1. Generate JSON Backup
    const backupData = {
        metadata: {
            timestamp: now.toISOString(),
            totalApplicants: data.applicants.length
        },
        data: data
    };
    const jsonFilename = `RSP-Backup-${dateStr}-${timestamp}.json`;
    await fs.writeFile(path.join(BACKUP_DIR, jsonFilename), JSON.stringify(backupData, null, 2));
    
    // 2. Generate CSV Zip Backup
    const zip = new PizZip();
    zip.file('applicants.csv', jsonToCsv(data.applicants));
    zip.file('education.csv', jsonToCsv(data.education));
    zip.file('experience.csv', jsonToCsv(data.experience));
    zip.file('training.csv', jsonToCsv(data.training));
    zip.file('eligibility.csv', jsonToCsv(data.eligibility));
    
    const content = zip.generate({ type: 'nodebuffer' });
    const csvFilename = `RSP-Backup-CSV-${dateStr}-${timestamp}.zip`;
    await fs.writeFile(path.join(BACKUP_DIR, csvFilename), content);
    
    console.log(`[Backup] Automated backups generated for ${dateStr}`);
}

async function cleanupOldBackups() {
    await ensureBackupDir();
    const files = await fs.readdir(BACKUP_DIR);
    
    // Parse files and their creation dates
    const statsPromises = files.map(async file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = await fs.stat(filePath);
        return { file, filePath, mtime: stats.mtime };
    });
    
    const fileStats = await Promise.all(statsPromises);
    
    // Separate by type to ensure we keep 10 of each
    const jsonFiles = fileStats.filter(f => f.file.endsWith('.json')).sort((a, b) => b.mtime - a.mtime);
    const csvFiles = fileStats.filter(f => f.file.endsWith('.zip')).sort((a, b) => b.mtime - a.mtime);
    
    // Delete older files (keep top 10)
    const MAX_DAYS = 10;
    const filesToDelete = [
        ...jsonFiles.slice(MAX_DAYS),
        ...csvFiles.slice(MAX_DAYS)
    ];
    
    for (const f of filesToDelete) {
        await fs.unlink(f.filePath);
        console.log(`[Backup] Cleaned up old backup file: ${f.file}`);
    }
}

async function listBackups() {
    await ensureBackupDir();
    const files = await fs.readdir(BACKUP_DIR);
    
    const statsPromises = files.map(async file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = await fs.stat(filePath);
        
        let type = 'Unknown';
        if (file.endsWith('.json')) type = 'JSON';
        else if (file.endsWith('.zip')) type = 'CSV (Zipped)';
        
        return {
            filename: file,
            type: type,
            date: stats.mtime,
            size: stats.size
        };
    });
    
    const fileStats = await Promise.all(statsPromises);
    return fileStats.sort((a, b) => b.date - a.date); // Newest first
}

module.exports = {
    generateDailyBackups,
    cleanupOldBackups,
    listBackups,
    fetchDatabaseData,
    jsonToCsv,
    BACKUP_DIR
};
