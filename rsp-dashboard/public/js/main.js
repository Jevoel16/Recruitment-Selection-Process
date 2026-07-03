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

if (!sessionStorage.getItem('deviceId')) {
    sessionStorage.setItem('deviceId', 'device-' + Math.random().toString(36).substr(2, 9));
}
window.deviceId = sessionStorage.getItem('deviceId');

window.acquireLock = async function(id) {
    if (!id) return true;
    try {
        const res = await fetch(`/api/applicants/${id}/lock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId: window.deviceId })
        });
        if (!res.ok) {
            const data = await res.json();
            window.showToast(data.error || 'Failed to acquire lock', 'danger');
            return false;
        }
        window.currentLockedApplicantId = id;
        return true;
    } catch (e) {
        window.showToast('Network error while acquiring lock', 'danger');
        return false;
    }
};

window.releaseLock = async function() {
    if (!window.currentLockedApplicantId) return;
    try {
        await fetch(`/api/applicants/${window.currentLockedApplicantId}/unlock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId: window.deviceId })
        });
        window.currentLockedApplicantId = null;
    } catch (e) {
        console.error('Failed to release lock', e);
    }
};

// Global listener to release lock when a modal closes
document.addEventListener('hidden.bs.modal', function (event) {
    // Only release lock if there are no other modals open
    if (!document.querySelector('.modal.show')) {
        window.releaseLock();
    }
});

window.addEventListener('beforeunload', () => {
    if (window.currentLockedApplicantId) {
        // Use sendBeacon for reliable delivery during unload
        const blob = new Blob([JSON.stringify({ deviceId: window.deviceId })], { type: 'application/json' });
        navigator.sendBeacon(`/api/applicants/${window.currentLockedApplicantId}/unlock`, blob);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const sumQualifyBtn = document.getElementById('summaryQualifyBtn');
    if (sumQualifyBtn) {
        sumQualifyBtn.addEventListener('click', async () => {
            const id = document.getElementById('summaryApplicantId').value;
            const name = document.getElementById('summaryApplicantName').innerText;
            openQualifyModal(id, name);
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

window.showToast = function(message, type = 'success', reloadAfter = false) {
    if (reloadAfter) {
        sessionStorage.setItem('pendingToast', JSON.stringify({ message, type }));
        window.location.reload();
        return;
    }

    let toastContainer = document.getElementById('globalToastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        toastContainer.id = 'globalToastContainer';
        document.body.appendChild(toastContainer);
    }
    
    const toastId = 'toast-' + Date.now();
    const bgClass = type === 'success' ? 'bg-success' : 'bg-danger';
    
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    const toastEl = document.getElementById(toastId);
    const bsToast = new bootstrap.Toast(toastEl, { delay: 1500 });
    bsToast.show();
    
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
};

document.addEventListener('DOMContentLoaded', () => {
    const pendingToast = sessionStorage.getItem('pendingToast');
    if (pendingToast) {
        sessionStorage.removeItem('pendingToast');
        try {
            const { message, type } = JSON.parse(pendingToast);
            window.showToast(message, type, false);
        } catch(e) {}
    }
});
