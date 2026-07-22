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

window.currentApplicantVersion = null;

// Dummy lock functions to maintain compatibility with legacy frontend scripts
window.acquireLock = async function(id) { return true; };
window.releaseLock = async function() {};

window.handleVersionConflict = function(res) {
    if (res.status === 409) {
        window.showToast("Someone else has modified this applicant. Please refresh the page to see their changes.", "danger", true);
        return true;
    }
    return false;
};

// Global Fetch Interceptor for Optimistic Locking
const originalFetch = window.fetch;
window.fetch = async function(url, options) {
    if (window.currentApplicantVersion && url.toString().includes('/api/') && options && (options.method === 'POST' || options.method === 'PUT')) {
        if (options.body && typeof options.body === 'string') {
            try {
                let parsedBody = JSON.parse(options.body);
                parsedBody.version = window.currentApplicantVersion;
                options.body = JSON.stringify(parsedBody);
            } catch (e) {}
        } else if (!options.body) {
            options.body = JSON.stringify({ version: window.currentApplicantVersion });
            options.headers = options.headers || {};
            options.headers['Content-Type'] = 'application/json';
        }
    }
    
    const response = await originalFetch(url, options);
    
    if (window.handleVersionConflict(response)) {
        return response;
    }
    
    if (response.ok && window.currentApplicantVersion && url.toString().includes('/api/') && options && (options.method === 'POST' || options.method === 'PUT')) {
        window.currentApplicantVersion++;
    }
    
    return response;
};

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
            if (cell && data.status === 'PENDING') {
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
    const bgMap = { success: 'bg-success', danger: 'bg-danger', info: 'bg-primary', warning: 'bg-warning text-dark' };
    const bgClass = bgMap[type] || 'bg-success';
    const closeWhite = type === 'warning' ? '' : 'btn-close-white';
    
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close ${closeWhite} me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    const toastEl = document.getElementById(toastId);
    const delay = (type === 'info' || type === 'warning') ? 5000 : 1500;
    const bsToast = new bootstrap.Toast(toastEl, { delay: delay });
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

window.removeApplicantFromStep1 = function(id) {
    document.getElementById('step1RemoveApplicantId').value = id;
    const modal = new bootstrap.Modal(document.getElementById('step1RemoveModal'));
    modal.show();
};

window.confirmRemoveApplicantFromStep1 = async function() {
    const id = document.getElementById('step1RemoveApplicantId').value;
    if (!id) return;
    
    try {
        const res = await fetch('/api/applicants/' + id + '/status', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'DISQUALIFIED_ARCHIVED' })
        });
        if (res.ok) {
            const modalEl = document.getElementById('step1RemoveModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
            window.showToast('Applicant removed from Step 1', 'success', true);
        } else {
            window.showToast('Failed to remove applicant', 'danger');
        }
    } catch(e) {
        console.error(e);
        window.showToast('Network error', 'danger');
    }
};

// SSE listener for background PDF generation notifications
(function() {
    window.evtSource = new EventSource('/api/events/pdf-status');
    window.evtSource.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            if (data.connected) return; // initial handshake
            if (data.applicantId) {
                const icon = data.failed === 0 ? '<i class="bi bi-file-earmark-pdf-fill me-1"></i>' : '<i class="bi bi-exclamation-triangle-fill me-1"></i>';
                const toastType = data.failed === 0 ? 'info' : 'warning';
                const msg = `${icon} PDF generation complete for <strong>${data.name}</strong> (${data.status}) — ${data.generated}/${data.total} templates generated.`;
                window.showToast(msg, toastType);
            }
        } catch(e) { /* ignore parse errors */ }
    };
    window.evtSource.onerror = function() {
        // SSE will auto-reconnect
    };
    
    // Explicitly close SSE on navigation to prevent browser connection pool exhaustion (limit 6)
    window.addEventListener('beforeunload', function() {
        if (window.evtSource) {
            window.evtSource.close();
        }
    });
})();
