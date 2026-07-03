// Open Score Modal
async function openScoreModal(id, name) {
    if (!(await window.acquireLock(id))) return;
    document.getElementById('scoreId').value = id;
    document.getElementById('scoreName').innerText = name;
    new bootstrap.Modal(document.getElementById('scoreModal')).show();
}

// Submit Score
if (scoreForm) {
    scoreForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('scoreId').value;
        const score = document.getElementById('interviewScore').value;
        const office = document.getElementById('assignedOffice').value;
        
        try {
            const res = await fetch(`/api/applicants/${id}/score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ score, office })
            });
            if (res.ok) {
                window.showToast('Score submitted successfully!', 'success', true);
            }
        } catch (err) {
            console.error(err);
            window.showToast('Error submitting score', 'danger');
        }
    });
}

// PDF Generation has been extracted to pdfGenerator.js


