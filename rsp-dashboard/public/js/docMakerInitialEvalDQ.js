window.printInitialEvalDQ = async function(id) {
    const startTimeMs = Date.now();
    let data;
    try {
        const res = await fetch(`/api/applicants/${id}/details`);
        data = await res.json();
    } catch(err) {
        window.showToast('Failed to fetch applicant data', 'danger');
        return;
    }

    const { d, dateStr } = await window.getOrSetDocDate(id, 'InitialEvalDQ', data);

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

    let reasonText = data.disqualificationReason || data.applicant?.disqualificationReason || 'Pursuant to Section 21 of DO 7 s. 2023 provides that "Individuals who failed to submit complete mandatory documents (Items 20.a to 20.j) on the set deadline indicated in the official memorandum shall not be included in the pool of official applicants.” and upon reviewing your submitted documents, you failed to meet the complete mandatory requirements or qualifications.';
    
    reasonText += ` Thus, we regret that you cannot proceed for the next stage of the selection process for ${pos} position.`;

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
        ReasonText: reasonText,
        
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
    ].includes(String(pos || '').toUpperCase());

    const templateUrl = isHigherTeaching ? "/templates/Notice to DQ - Higher Teaching.docx" : "/templates/Notice to DQ.docx";
    const noticeType = templateUrl.includes('Higher Teaching') ? 'Notice_to_DQ___Higher_Teaching' : 'Notice_to_DQ';

    const lName = applicantObj.lastName ? applicantObj.lastName.replace(/[^a-zA-Z0-9]/g, '') : '';
    const fName = applicantObj.firstName ? applicantObj.firstName.replace(/[^a-zA-Z0-9]/g, '') : '';
    const pCode = data.positionStandards?.position_code ? data.positionStandards.position_code.replace(/[^a-zA-Z0-9]/g, '') : '';

    const filename = `${lName}_${fName}_${pCode}_${noticeType}.docx`;

    await window.exportFromTemplate(templateUrl, templateData, filename);

    const timeMs = Date.now() - startTimeMs;
    if (window.showToast) window.showToast('Initial Evaluation DOC generated successfully.', 'success', false);
};
