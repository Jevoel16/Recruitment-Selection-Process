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
            if (res.ok) {
                const ieDate = document.getElementById('qualifyIEDate').value;
                if (ieDate) {
                    const d = new Date(ieDate);
                    const dateStr = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                    try {
                        await fetch('/api/applicants/' + id + '/doc-date', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ docType: 'InitialEvalQualified', dateStr })
                        });
                    } catch(e) { console.error('Failed to save IEDate', e); }
                }
                window.showToast('Applicant qualified successfully!', 'success', false);
                const row = document.getElementById(`applicant-row-${id}`);
                if (row) {
                    const actionTd = row.querySelector('.text-end');
                    if (actionTd) {
                        const applicantName = document.getElementById('qualifyName').innerText;
                        actionTd.innerHTML = `<button class="btn btn-sm btn-success action-btn" onclick="openProceedModal(${id}, '${applicantName.replace(/'/g, "\\'")}')" title="Proceed to Step 2"><i class="bi bi-arrow-right-circle"></i> Proceed</button>`;
                    }
                    const remarksTd = document.getElementById(`remarks-cell-${id}`);
                    if (remarksTd) remarksTd.innerHTML = '<span class="badge bg-success">Qualified</span>';
                }
                if (typeof window.clearModalStack === 'function') window.clearModalStack();
                const m1 = bootstrap.Modal.getOrCreateInstance(document.getElementById('qualifyModal'));
                m1.hide();
                const m2 = bootstrap.Modal.getOrCreateInstance(document.getElementById('summaryModal'));
                m2.hide();
            }
        } catch (err) {
            console.error(err);
            window.showToast('Error qualifying applicant', 'danger');
        }
    });
}

// Open Proceed Modal
async function openProceedModal(id, name) {
    if (!(await window.acquireLock(id))) return;
    document.getElementById('proceedId').value = id;
    document.getElementById('proceedName').innerText = name;
    new bootstrap.Modal(document.getElementById('proceedModal')).show();
}

// Submit Proceed
const proceedForm = document.getElementById('proceedForm');
if (proceedForm) {
    proceedForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('proceedId').value;
        try {
            const res = await fetch(`/api/applicants/${id}/proceed-step2`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) window.showToast('Moved to Step 2 successfully!', 'success', true);
        } catch (err) {
            console.error(err);
            window.showToast('Error proceeding to Step 2', 'danger');
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

