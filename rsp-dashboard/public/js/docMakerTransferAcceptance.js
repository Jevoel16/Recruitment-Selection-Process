window.printTransferAcceptance = async function(id) {
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
    const formattedDate = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

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
    const honorifics = sex === 'Female' ? 'Madam' : 'Sir';

    const currentPos = app.position || 'Teacher I';
    
    let office = 'Iligan City';
    try {
        if (app.office_assignment) {
            const parsed = JSON.parse(app.office_assignment);
            if (parsed.office) office = parsed.office;
        }
    } catch(e) {}

    const templateData = {
        "DATE": formattedDate,
        "AGENCY_HEAD": "[HEAD OF PREVIOUS OFFICE/MAYOR]",
        "POSITION": "[Designation]",
        "AGENCY_NAME": "[Office Name/LGU]",
        "ADDRESS_OF_AGENCY": "[Address]",
        "HONORIFICS": honorifics,
        "MSMR": msmr,
        "COMPLETE_NAME": appName.toUpperCase(),
        "PREVIOUS_POSITION_FROM_THAT_AGENCY": "[Previous Position]",
        "OFFICESCHOOL_NAME_OF_THAT_AGENCY": "[Previous Office]",
        "CURRENT_POSITION": currentPos,
        "SCHOOL": office,
        "APPOINTMENT_EFFECTIVITY": formattedDate,
        "APPROVER": "JONATHAN S. DELA PEÑA, PhD, CESO V",
        "POSITION_OF_APPROVER": "Schools Division Superintendent"
    };

    const templateUrl = "/templates/Transfer Acceptance.docx";
    const filename = `Transfer_Acceptance_${appName.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;

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
        window.showToast('Transfer Acceptance generated successfully.', 'success', true);
    } catch (e) {
        console.error('Failed to generate doc', e);
        window.showToast(`Error: ${e.message}`, 'danger', true);
    }
};
