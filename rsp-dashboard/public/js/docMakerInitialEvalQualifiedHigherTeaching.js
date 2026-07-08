window.printInitialEvalQualifiedHigherTeaching = async function(id) {
    const startTimeMs = Date.now();
    let data;
    try {
        const res = await fetch(`/api/applicants/${id}/details`);
        data = await res.json();
    } catch(err) {
        window.showToast('Failed to fetch applicant data', 'danger');
        return;
    }

    const d = new Date();
    const dateStr = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

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

    const templateUrl = "/templates/Notice to Qualified - Higher Teaching.docx";
    const filename = `Initial_Eval_Higher_Teaching_${appName.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;

    await window.exportFromTemplate(templateUrl, templateData, filename);

    const timeMs = Date.now() - startTimeMs;
    if (window.showToast) window.showToast('Initial Evaluation DOC generated successfully.', 'success', false);
};
