window.printAssignmentSchool = async function(id, name, office, dateStr, category, applicationCode, ccName, ccDesignation, reloadOnComplete = true) {
    const startTimeMs = Date.now();
    
    let rankTitle = 'Teacher I';
    let appEffectivity = '';
    let appCC1 = '', appCCDesignation1 = '';
    let appCC2 = '', appCCDesignation2 = '';
    let appCC3 = '', appCCDesignation3 = '';
    let appCC4 = '', appCCDesignation4 = '';
    let data = {};

    try {
        const res = await fetch(`/api/applicants/${id}/details`);
        if (res.ok) {
            data = await res.json();
            const applicant = data.applicant || data;
            if (applicant.position) rankTitle = applicant.position;
            if (applicant.appointmentEffectivity) {
                const parts = applicant.appointmentEffectivity.split('-');
                if (parts.length === 3) {
                    const dDate = new Date(parts[0], parts[1] - 1, parts[2]);
                    appEffectivity = dDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                } else {
                    appEffectivity = applicant.appointmentEffectivity;
                }
            }
            
            appCC1 = applicant.cc || '';
            appCCDesignation1 = applicant.ccDesignation || '';
            appCC2 = applicant.cc_2 || '';
            appCCDesignation2 = applicant.ccDesignation_2 || '';
            appCC3 = applicant.cc_3 || '';
            appCCDesignation3 = applicant.ccDesignation_3 || '';
            appCC4 = applicant.cc_4 || '';
            appCCDesignation4 = applicant.ccDesignation_4 || '';

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

    const { d, dateStr: formattedDate } = await window.getOrSetDocDate(id, 'AssignmentSchool', data);

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
        "APPOINTMENT_EFFECTIVITY": appEffectivity,
        "APPROVED_BY": "ARTURO B. BAYOCOT, CESO III",
        "POSITION_OF_APPROVER": "Regional Director",
        "CC_1": appCC1.toUpperCase(),
        "POSITIONS_OF_CC": appCCDesignation1,
        "CC_2": appCC2.toUpperCase(),
        "POSITIONS_OF_CC_2": appCCDesignation2,
        "CC_3": appCC3.toUpperCase(),
        "POSITIONS_OF_CC_3": appCCDesignation3,
        "CC_4": appCC4.toUpperCase(),
        "POSITIONS_OF_CC_4": appCCDesignation4,
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
