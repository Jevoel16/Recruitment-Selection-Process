window.printAssignmentSchool = async function(id, name, office, dateStr, category, applicationCode, ccName, ccDesignation, reloadOnComplete = true) {
    const startTimeMs = Date.now();
    
    const d = new Date();
    const formattedDate = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    let rankTitle = 'Teacher I';
    try {
        const res = await fetch(`/api/applicants/${id}/details`);
        if (res.ok) {
            const data = await res.json();
            const applicant = data.applicant || data;
            if (applicant.position) rankTitle = applicant.position;
            const fName = applicant.firstName || '';
            const mName = applicant.middleName || '';
            const lName = applicant.lastName || '';
            if (mName && mName.trim() !== '') {
                name = `${fName} ${mName.trim().charAt(0).toUpperCase()}. ${lName}`.trim();
            } else if (fName || lName) {
                name = `${fName} ${lName}`.trim();
            }
        }
    } catch (err) {}

    let orderNum = "007";
    if (applicationCode) {
        const parts = applicationCode.split('-');
        if (parts.length > 0) {
            const num = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(num)) orderNum = String(num).padStart(3, '0');
        }
    }

    const remarksDate = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;

    // Define the data payload for docxtemplater mapping to native Mail Merge fields
    const templateData = {
        "Assignment_Order_No": orderNum,
        "DATE": formattedDate,
        "COMPLETE_NAME": name.toUpperCase(),
        "CURRENT_POSITION": rankTitle,
        "SCHOOL": office,
        "APPOINTMENT_EFFECTIVITY": "",
        "APPROVED_BY": "ARTURO B. BAYOCOT, CESO III",
        "POSITION_OF_APPROVER": "Regional Director",
        "CC_1": "ROSEMARIE T. MACESAR",
        "POSITIONS_OF_CC": "Assistant Schools Division Superintendent",
        "CC_2": ccName && ccName.trim() !== '' ? ccName.toUpperCase() : "LEONARDA LUNA ARAZO",
        "POSITIONS_OF_CC_2": ccDesignation && ccDesignation.trim() !== '' ? ccDesignation : "School Principal I",
        "REMARKS": `JSD/MPM/ABQ/KMJ - ${remarksDate}`
    };

    const templateUrl = "/templates/Assignment Order - School-Based.docx";
    const filename = `Assignment_Order_${name.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;

    // Export the actual perfect .docx using our new templater!
    await window.exportFromTemplate(templateUrl, templateData, filename);

    if (reloadOnComplete) {
        setTimeout(() => location.reload(), 1500);
    }

    const timeMs = Date.now() - startTimeMs;
    try {
        await fetch(`/api/applicants/${id}/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        window.showToast('Assignment Letter DOC generated successfully.', 'success', reloadOnComplete);
    } catch (e) {
        console.error('Failed to update status', e);
    }
};
