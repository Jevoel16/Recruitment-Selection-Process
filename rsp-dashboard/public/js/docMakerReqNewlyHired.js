window.printReqNewlyHired = async function(id) {
    const startTimeMs = Date.now();
    let data;
    try {
        const res = await fetch(`/api/applicants/${id}/details`);
        data = await res.json();
    } catch(err) {
        window.showToast('Failed to fetch applicant data', 'danger');
        return;
    }

    const { d, dateStr: formattedDate } = await window.getOrSetDocDate(id, 'ReqNewlyHired', data);
    const remarksDate = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;

    const app = data.applicant || data;
    const fName = app.firstName || '';
    const mName = app.middleName || '';
    const lName = app.lastName || '';
    let appName = 'Unknown Applicant';
    if (mName && mName.trim() !== '') appName = `${fName} ${mName.trim().charAt(0).toUpperCase()}. ${lName}`.trim();
    else if (fName || lName) appName = `${fName} ${lName}`.trim();
    else if (app.name) appName = app.name;

    const sex = data.sex || app.sex;
    const msmr = sex === 'Female' ? 'Ms.' : 'Mr.';
    const title = sex === 'Female' ? 'Madam' : 'Sir';

    const pos = app.position || 'Teacher I';
    
    let office = 'Iligan City';
    try {
        if (app.office_assignment) {
            const parsed = JSON.parse(app.office_assignment);
            if (parsed.office) office = parsed.office;
        }
    } catch(e) {}

    const templateData = {
        "DATE": formattedDate,
        "MSMR": msmr,
        "COMPLETE_NAME": appName.toUpperCase(),
        "MADAM_SIR": title,
        "CURRENT_POSITION": pos,
        "SCHOOL": office,
        "HRMO": "AZOR B. QUIJANO",
        "ASDS": "JONATHAN S. DELA PEÑA, PhD, CESO V",
        "REMARKS": `MPM/ABQ/KMJ - ${remarksDate}`,
        "SDS": "JONATHAN S. DELA PEÑA, PhD, CESO V"
    };

    const templateUrl = "/templates/Notice of Requirements - Newly Hired.docx";
    const filename = `Notice_of_Requirements_${appName.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;

    try {
        if (!window.exportFromTemplate) {
            throw new Error("window.exportFromTemplate is not defined in docMakerCore.js");
        }
        await window.exportFromTemplate(templateUrl, templateData, filename);

        // Update tracking status
        await fetch(`/api/applicants/${id}/toggle-assignment-req`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'COMPLETE' })
        });
        window.showToast('Notice of Requirements generated successfully.', 'success', true);
    } catch (e) {
        console.error('Failed to generate doc', e);
        window.showToast(`Error: ${e.message}`, 'danger', true);
    }
};
