const fs = require('fs');
const path = require('path');
const os = require('os');
const util = require('util');
const execFileAsync = util.promisify(require('child_process').execFile);

// PowerShell script that converts a DOCX to PDF with Word. Paths are passed as
// arguments (never interpolated), and the Word PID it started is written to a
// file so a hung instance can be killed without touching the user's own Word.
const WORD_SCRIPT = `
param([string]$InputPath, [string]$OutputPath, [string]$PidPath)
$ErrorActionPreference = 'Stop'
$before = @(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object { $_.Id })
$word = New-Object -ComObject Word.Application
$started = Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $before -notcontains $_.Id } | Select-Object -First 1
if ($started) { Set-Content -Path $PidPath -Value $started.Id }
try {
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $doc = $word.Documents.Open($InputPath, $false, $true)
    try { $doc.ExportAsFixedFormat($OutputPath, 17, $false, 0) } finally { $doc.Close($false) }
} finally {
    $word.Quit()
    [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($word)
}
`;

const SOFFICE_PATHS = [
    'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
    'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
    'C:\\Program Files\\LibreOffice 5\\program\\soffice.exe'
];

function findSoffice() {
    if (os.platform() !== 'win32') return 'libreoffice';
    return SOFFICE_PATHS.find((p) => fs.existsSync(p)) || 'soffice';
}

async function killPidFrom(pidPath) {
    try {
        const pid = parseInt(await fs.promises.readFile(pidPath, 'utf8'), 10);
        if (pid) process.kill(pid);
    } catch (e) { /* nothing to kill */ }
}

// Converts with MS Word through COM. Resolves when outputPath exists.
async function convertWithWord(inputPath, outputPath, { timeout = 60000 } = {}) {
    const workDir = path.dirname(outputPath);
    const scriptPath = path.join(workDir, 'convert.ps1');
    const pidPath = path.join(workDir, 'word.pid');
    await fs.promises.writeFile(scriptPath, WORD_SCRIPT);
    try {
        await execFileAsync('powershell', [
            '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath,
            '-InputPath', inputPath, '-OutputPath', outputPath, '-PidPath', pidPath
        ], { timeout, windowsHide: true });
    } catch (err) {
        await killPidFrom(pidPath);
        throw err;
    }
    await fs.promises.access(outputPath);
}

// Converts with LibreOffice headless. Output lands in outDir as <basename>.pdf.
async function convertWithLibreOffice(inputPath, outDir, { timeout = 60000 } = {}) {
    await execFileAsync(findSoffice(), ['--headless', '--convert-to', 'pdf', '--outdir', outDir, inputPath], { timeout, windowsHide: true });
    const outputPath = path.join(outDir, path.basename(inputPath).replace(/\.docx$/i, '') + '.pdf');
    await fs.promises.access(outputPath);
    return outputPath;
}

module.exports = { convertWithWord, convertWithLibreOffice };
