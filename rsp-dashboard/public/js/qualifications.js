async function deleteApplicant(id) {
    if(!confirm('Are you sure you want to permanently delete this applicant and all their records?')) return;
    try {
        const res = await fetch(`/api/applicants/${id}`, { method: 'DELETE' });
        if(res.ok) window.location.reload();
    } catch(err) { console.error(err); }
}

// Open Qualify Modal
function openQualifyModal(id, name) {
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
            if (res.ok) window.location.reload();
        } catch (err) {
            console.error(err);
            alert('Error qualifying applicant');
        }
    });
}

// Disqualify Applicant
async function disqualifyApplicant(id) {
    if(confirm('Are you sure you want to disqualify this applicant?')) {
        try {
            const res = await fetch(`/api/applicants/${id}/disqualify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) window.location.reload();
        } catch (err) {
            console.error(err);
        }
    }
}

