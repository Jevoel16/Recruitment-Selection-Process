document.addEventListener('DOMContentLoaded', () => {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('mainSidebar');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }
});

// DOM Elements
const qualifyForm = document.getElementById('qualifyForm');
const scoreForm = document.getElementById('scoreForm');

document.addEventListener('DOMContentLoaded', () => {
    const sumQualifyBtn = document.getElementById('summaryQualifyBtn');
    if (sumQualifyBtn) {
        sumQualifyBtn.addEventListener('click', async () => {
            const id = document.getElementById('summaryApplicantId').value;
            const name = document.getElementById('summaryApplicantName').innerText;
            bootstrap.Modal.getOrCreateInstance(document.getElementById('summaryModal')).hide();
            openQualifyModal(id, name);
        });
    }

    const sumDisqualifyBtn = document.getElementById('summaryDisqualifyBtn');
    if (sumDisqualifyBtn) {
        sumDisqualifyBtn.addEventListener('click', () => {
            const id = document.getElementById('summaryApplicantId').value;
            bootstrap.Modal.getOrCreateInstance(document.getElementById('summaryModal')).hide();
            disqualifyApplicant(id);
        });
    }

    const updateRowRemarks = async () => {
        if (!window.currentDocApplicantId) return;
        try {
            const id = window.currentDocApplicantId;
            const data = await fetchDetails(id);
            
            const cell = document.getElementById(`remarks-cell-${id}`);
            if (cell && data.applicant.status === 'PENDING') {
                const allDocs = [...(data.education || []), ...(data.training || []), ...(data.experience || []), ...(data.eligibility || [])];
                
                if (allDocs.length === 0) {
                    cell.innerHTML = '<span class="badge bg-warning text-dark">Pending</span>';
                } else {
                    const pendingCount = allDocs.filter(d => !d.status || d.status === 'PENDING').length;
                    if (pendingCount === allDocs.length) {
                        cell.innerHTML = '<span class="badge bg-warning text-dark">Pending</span>';
                    } else if (pendingCount === 0) {
                        cell.innerHTML = '<span class="badge bg-success text-white">Assessed</span>';
                    } else {
                        cell.innerHTML = '<span class="badge bg-info text-dark">In-Prog</span>';
                    }
                }
            }
        } catch(err) { console.error(err); }
    };

    ['eduModal', 'trainModal', 'expModal', 'eligModal'].forEach(modalId => {
        const el = document.getElementById(modalId);
        if (el) {
            el.addEventListener('hidden.bs.modal', updateRowRemarks);
        }
    });
});
