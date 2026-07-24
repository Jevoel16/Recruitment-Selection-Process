window.printInitialEvalQualified = async function(id) {
    const startTimeMs = Date.now();
    let data;
    try {
        const res = await fetch(`/api/applicants/${id}/details`);
        data = await res.json();
    } catch(err) {
        window.showToast('Failed to fetch applicant data', 'danger');
        return;
    }

    const { d, dateStr } = await window.getOrSetDocDate(id, 'InitialEvalQualified', data);

    let appName = 'Unknown Applicant';
    const applicantObj = data.applicant || data;
    const fName = applicantObj.firstName || '';
    const mName = applicantObj.middleName || '';
    const lName = applicantObj.lastName || '';
    if (mName && mName.trim() !== '') appName = `${fName} ${mName.trim().charAt(0).toUpperCase()}. ${lName}`.trim();
    else if (fName || lName) appName = `${fName} ${lName}`.trim();
    else if (data.name) appName = data.name;

    let addressStr = data.address || data.applicant?.address || 'Iligan City';
    try {
        const parsed = JSON.parse(addressStr);
        if (parsed.res_city) addressStr = parsed.res_city;
    } catch(e) { }

    const sex = data.sex || data.applicant?.sex;
    const title = sex === 'Female' ? 'Madam' : 'Sir';
    const pos = data.position || data.applicant?.position || 'Position';
    const appCode = data.applicationCode || data.applicant?.applicationCode || '[Application Code]';

    const cleanText = (txt) => {
        if (!txt) return '';
        return String(txt).replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    };

    const getRemark = (items) => {
        if(!items || items.length === 0) return 'Disqualified';
        if(items.some(i => i.status === 'DISQUALIFIED')) return 'Disqualified';
        if(items.some(i => i.status === 'PENDING' || !i.status)) return 'Pending';
        return 'Qualified';
    };

    const remarksDate = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;

    const templateData = {
        FormattedDate: dateStr,
        IEDate: dateStr,
        ApplicantName: appName.toUpperCase(),
        Address: addressStr,
        Title: title,
        Position: pos,
        PositionAppliedFor: pos,
        ApplicationCode: appCode,
        
        QSEducation: data.positionStandards?.qsEducation ? 'Education: ' + cleanText(data.positionStandards.qsEducation) : '',
        AppEducation: cleanText((data.education || []).map(e => e.degree || e.title).join(', ')) || '',
        RmEducation: getRemark(data.education),

        QSTraining: data.positionStandards?.qsTraining ? 'Training: ' + cleanText(data.positionStandards.qsTraining) : '',
        AppTraining: cleanText((data.training || []).map(e => e.title).join(', ')) || '',
        RmTraining: getRemark(data.training),

        QSExperience: data.positionStandards?.qsExperience ? 'Experience: ' + cleanText(data.positionStandards.qsExperience) : '',
        AppExperience: cleanText((data.experience || []).map(e => e.details).join(', ')) || '',
        RmExperience: getRemark(data.experience),

        QSEligibility: data.positionStandards?.qsEligibility ? 'Eligibility: ' + cleanText(data.positionStandards.qsEligibility) : '',
        AppEligibility: cleanText((data.eligibility || []).map(e => e.title || e.details).join(', ')) || '',
        RmEligibility: getRemark(data.eligibility),

        Remarks: `JSD/MPM/ABQ/KMJ - ${remarksDate}`
    };

    const isHigherTeaching = [
        'TEACHER II', 'TEACHER III', 'TEACHER IV', 'TEACHER V', 'TEACHER VI', 'TEACHER VII',
        'MASTER TEACHER I', 'MASTER TEACHER II', 'MASTER TEACHER III', 'MASTER TEACHER IV', 'MASTER TEACHER V'
    ].includes(String(pos).toUpperCase());

    const templateUrl = isHigherTeaching ? "/templates/Notice to Qualified - Higher Teaching.docx" : "/templates/Notice to Qualified - Without Date of Assessment.docx";
    const noticeType = templateUrl.includes('Higher Teaching') ? 'Notice_to_Qualified___Higher_Teaching' : 'Notice_to_Qualified___Without_Date_of_Assessment';
    
    const getPosCode = (p) => {
        if (!p) return 'APP';
        let cleanPos = p.replace(/[^a-zA-Z0-9 ]/g, '').trim();
        const match = cleanPos.match(/\s([IVX]+)$/i);
        let numberSuffix = '';
        if (match) {
            const roman = match[1].toUpperCase();
            const romanMap = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10 };
            numberSuffix = romanMap[roman] || '';
            cleanPos = cleanPos.substring(0, cleanPos.length - match[0].length).trim();
        }
        let base = '';
        const upperPos = p.toUpperCase();
        if (upperPos.includes('ADMINISTRATIVE ASSISTANT')) base = 'ADAS';
        else if (upperPos.includes('ADMINISTRATIVE AIDE')) base = 'ADA';
        else if (upperPos.includes('ADMINISTRATIVE OFFICER')) base = 'ADOF';
        else if (upperPos.includes('PROJECT DEVELOPMENT OFFICER')) base = 'PDO';
        else if (upperPos.includes('LEGAL ASSISTANT')) base = 'LA';
        else if (upperPos.includes('EDUCATION PROGRAM SUPERVISOR')) base = 'EPS';
        else if (upperPos.includes('SCHOOL PRINCIPAL') || upperPos.includes('PRINCIPAL')) base = 'SP';
        else if (upperPos.includes('HEAD TEACHER')) base = 'HT';
        else if (upperPos.includes('MASTER TEACHER')) base = 'MT';
        else if (upperPos.includes('TEACHER')) base = 'T';
        else if (upperPos.includes('WATCHMAN')) base = 'WCH';
        else { base = cleanPos.split(/\s+/).map(w => w[0]).join('').toUpperCase(); }
        return base + numberSuffix;
    };

    const lName = applicantObj.lastName ? applicantObj.lastName.replace(/[^a-zA-Z0-9]/g, '') : '';
    const fName = applicantObj.firstName ? applicantObj.firstName.replace(/[^a-zA-Z0-9]/g, '') : '';
    const pCode = data.positionStandards?.position_code ? data.positionStandards.position_code.replace(/[^a-zA-Z0-9]/g, '') : getPosCode(pos);

    const filename = `${lName}_${fName}_${pCode}_${noticeType}.docx`;

    await window.exportFromTemplate(templateUrl, templateData, filename);

    const timeMs = Date.now() - startTimeMs;
    if (window.showToast) window.showToast('Initial Evaluation DOC generated successfully.', 'success', false);
};
