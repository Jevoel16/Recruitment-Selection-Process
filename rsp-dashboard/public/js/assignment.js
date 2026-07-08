// ==========================================
// NEW WORKFLOW & MODAL FUNCTIONS
// ==========================================

function proceedToRequirements(id, name) {
    document.getElementById('step3ConfirmApplicantId').value = id;
    document.getElementById('step3ConfirmApplicantName').innerText = name;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('step3ConfirmModal')).show();
}

function confirmRemoveNoAppearance(id, name) {
    document.getElementById('step3RemoveApplicantId').value = id;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('step3RemoveModal')).show();
}

async function executeRemoveNoAppearance() {
    const id = document.getElementById('step3RemoveApplicantId').value;
    try {
        const res = await fetch(`/api/applicants/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'DISQUALIFIED' })
        });
        if(res.ok) window.showToast('Applicant removed successfully!', 'success', true);
        else window.showToast('Error removing applicant', 'danger');
    } catch(err) { console.error(err); window.showToast('Error removing applicant', 'danger'); }
}

async function confirmProceedToStep4() {
    const id = document.getElementById('step3ConfirmApplicantId').value;
    try {
        const res = await fetch(`/api/applicants/${id}/proceed-requirements`, { method: 'POST' });
        if(res.ok) window.showToast('Moved to Step 4 successfully!', 'success', true);
        else window.showToast('Error moving to Step 4', 'danger');
    } catch(err) { console.error(err); window.showToast('Error moving to Step 4', 'danger'); }
}

async function toggleAssignmentReq(id, currentStatus) {
    const newStatus = currentStatus === 'COMPLETE' ? 'INCOMPLETE' : 'COMPLETE';
    try {
        const res = await fetch(`/api/applicants/${id}/toggle-assignment-req`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) window.showToast('Requirement status updated!', 'success', true);
        else window.showToast('Error updating requirement status', 'danger');
    } catch(err) { console.error(err); window.showToast('Error updating requirement status', 'danger'); }
}

const assignForm = document.getElementById('assignForm');
if (assignForm) {
    assignForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('assignId').value;
        const office = document.getElementById('assignedOffice').value;
        const ccCount = document.getElementById('ccCountDropdown') ? parseInt(document.getElementById('ccCountDropdown').value) : 0;
        const cc = ccCount >= 1 ? document.getElementById('assignedCC').value : null;
        const ccDesignation = ccCount >= 1 ? document.getElementById('assignedCCDesignation').value : null;
        const cc_2 = ccCount >= 2 ? document.getElementById('assignedCC2').value : null;
        const ccDesignation_2 = ccCount >= 2 ? document.getElementById('assignedCCDesignation2').value : null;
        const cc_3 = ccCount >= 3 ? document.getElementById('assignedCC3').value : null;
        const ccDesignation_3 = ccCount >= 3 ? document.getElementById('assignedCCDesignation3').value : null;
        const cc_4 = ccCount >= 4 ? document.getElementById('assignedCC4').value : null;
        const ccDesignation_4 = ccCount >= 4 ? document.getElementById('assignedCCDesignation4').value : null;
        
        try {
            const res = await fetch(`/api/applicants/${id}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ office, cc, ccDesignation, cc_2, ccDesignation_2, cc_3, ccDesignation_3, cc_4, ccDesignation_4 })
            });
            if (res.ok) {
                window.showToast('Assigned Successfully!', 'success', true);
                setTimeout(() => location.reload(), 1500);
            } else {
                window.showToast('Error assigning applicant', 'danger');
            }
        } catch(err) {
            console.error(err);
            window.showToast('Error assigning applicant', 'danger');
        }
    });
}

async function openAssignModal(id, name) {
    if (!(await window.acquireLock(id))) return;
    document.getElementById('assignId').value = id;
    document.getElementById('assignName').innerText = name;
    document.getElementById('assignedOffice').value = '';
    
    if(document.getElementById('ccCountDropdown')) {
        document.getElementById('ccCountDropdown').value = '0';
        if(typeof toggleCCFields === 'function') toggleCCFields();
    }
    
    if(document.getElementById('assignedCC')) document.getElementById('assignedCC').value = '';
    if(document.getElementById('assignedCCDesignation')) document.getElementById('assignedCCDesignation').value = '';
    if(document.getElementById('assignedCC2')) document.getElementById('assignedCC2').value = '';
    if(document.getElementById('assignedCCDesignation2')) document.getElementById('assignedCCDesignation2').value = '';
    if(document.getElementById('assignedCC3')) document.getElementById('assignedCC3').value = '';
    if(document.getElementById('assignedCCDesignation3')) document.getElementById('assignedCCDesignation3').value = '';
    if(document.getElementById('assignedCC4')) document.getElementById('assignedCC4').value = '';
    if(document.getElementById('assignedCCDesignation4')) document.getElementById('assignedCCDesignation4').value = '';

    new bootstrap.Modal(document.getElementById('assignModal')).show();
}


async function generateAndComplete(id, name, office, dateStr, category, applicationCode, ccName, ccDesignation, docType = 'school') {
    // Generate the PDF
    await window.printLetter(id, name, office, dateStr, category, applicationCode, ccName, ccDesignation, false, docType);
    
    // Update the status to COMPLETED
    try {
        const res = await fetch(`/api/applicants/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'COMPLETED' })
        });
        if(res.ok) {
            window.showToast('Assignment Order generated and applicant marked as Completed!', 'success', true);
        } else {
            window.showToast('Error updating status to Completed', 'danger');
        }
    } catch(err) { 
        console.error(err); 
        window.showToast('Error updating status to Completed', 'danger'); 
    }
}
