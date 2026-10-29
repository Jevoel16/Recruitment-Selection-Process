// Builds the file name used for generated notices in public/generated_notices.
// Every part is reduced to letters and digits so applicant-supplied values
// (names, application codes) can never form a path outside that folder.
const clean = (value) => String(value || '').replace(/[^a-zA-Z0-9]/g, '');

function noticeBaseName(app, noticeType, fallbackPositionCode) {
    let posCode = 'UnknownPos';
    let vacancyNo = 'UnknownVac';
    let increment = '0000';
    if (app.applicationCode) {
        const parts = String(app.applicationCode).split('-');
        if (parts.length >= 4) {
            posCode = parts[0];
            vacancyNo = parts[1];
            increment = parts[3];
        } else if (parts.length > 0) {
            posCode = parts[0];
            increment = parts[parts.length - 1];
        }
    } else {
        if (fallbackPositionCode) posCode = fallbackPositionCode;
        if (app.vacancyAnnouncementNo) vacancyNo = app.vacancyAnnouncementNo;
    }
    const safe = (value, fallback) => clean(value) || fallback;
    return `${clean(app.lastName)}_${clean(app.firstName)}_${safe(posCode, 'UnknownPos')}-${safe(increment, '0000')}-${safe(vacancyNo, 'UnknownVac')}_${noticeType}_${clean(app.id)}`;
}

module.exports = { noticeBaseName };
