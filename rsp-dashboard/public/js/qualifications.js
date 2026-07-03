async function deleteApplicant(id) {
    if (!(await window.acquireLock(id))) return;
    document.getElementById('deleteConfirmType').value = 'applicants';
    document.getElementById('deleteConfirmRecordId').value = id;
    document.getElementById('deleteConfirmApplicantId').value = id;
    document.getElementById('deleteConfirmModalType').value = 'applicant';
    bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteConfirmModal')).show();
}

// Open Qualify Modal
async function openQualifyModal(id, name) {
    if (!(await window.acquireLock(id))) return;
    document.getElementById('qualifyId').value = id;
    document.getElementById('qualifyName').innerText = name;
    new bootstrap.Modal(document.getElementById('qualifyModal')).show();
}

// Submit Qualify
if (qualifyForm) {
    qualifyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('qualifyId').value;
        
        try {
            const res = await fetch(`/api/applicants/${id}/qualify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) window.showToast('Moved to Step 2 successfully!', 'success', true);
        } catch (err) {
            console.error(err);
            window.showToast('Error qualifying applicant', 'danger');
        }
    });
}

// Disqualify Applicant
async function disqualifyApplicant(id) {
    try {
        const res = await fetch(`/api/applicants/${id}/disqualify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) window.showToast('Applicant disqualified.', 'success', true);
    } catch (err) {
        console.error(err);
    }
}

