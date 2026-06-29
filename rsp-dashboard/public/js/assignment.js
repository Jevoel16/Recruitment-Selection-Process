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
        if(res.ok) window.location.reload();
    } catch(err) { console.error(err); }
}

async function toggleAssignmentReq(id, currentStatus) {
    const newStatus = currentStatus === 'COMPLETE' ? 'INCOMPLETE' : 'COMPLETE';
    try {
        const res = await fetch(`/api/applicants/${id}/toggle-assignment-req`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) window.location.reload();
    } catch(err) { console.error(err); }
}

const assignForm = document.getElementById('assignForm');
if (assignForm) {
    assignForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('assignId').value;
        const office = document.getElementById('assignedOffice').value;
        try {
            const res = await fetch(`/api/applicants/${id}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ office })
            });
            if (res.ok) window.location.reload();
        } catch(err) { console.error(err); }
    });
}

function openAssignModal(id, name) {
    document.getElementById('assignId').value = id;
    document.getElementById('assignName').innerText = name;
    document.getElementById('assignedOffice').value = '';
    new bootstrap.Modal(document.getElementById('assignModal')).show();
}

