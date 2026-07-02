// ==========================================
// NEW WORKFLOW & MODAL FUNCTIONS
// ==========================================

function proceedToRequirements(id, name) {
    document.getElementById('step3ConfirmApplicantId').value = id;
    document.getElementById('step3ConfirmApplicantName').innerText = name;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('step3ConfirmModal')).show();
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
        const cc = document.getElementById('assignedCC') ? document.getElementById('assignedCC').value : null;
        const ccDesignation = document.getElementById('assignedCCDesignation') ? document.getElementById('assignedCCDesignation').value : null;
        try {
            const res = await fetch(`/api/applicants/${id}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ office, cc, ccDesignation })
            });
            if (res.ok) window.showToast('Assigned and moved successfully!', 'success', true);
            else window.showToast('Error assigning applicant', 'danger');
        } catch(err) { console.error(err); window.showToast('Error assigning applicant', 'danger'); }
    });
}

function openAssignModal(id, name) {
    document.getElementById('assignId').value = id;
    document.getElementById('assignName').innerText = name;
    document.getElementById('assignedOffice').value = '';
    if(document.getElementById('assignedCC')) document.getElementById('assignedCC').value = '';
    if(document.getElementById('assignedCCDesignation')) document.getElementById('assignedCCDesignation').value = '';
    new bootstrap.Modal(document.getElementById('assignModal')).show();
}

