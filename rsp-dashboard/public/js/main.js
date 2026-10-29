document.addEventListener('DOMContentLoaded', () => {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenuClose = document.getElementById('mobileMenuClose');
    const sidebar = document.getElementById('mainSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            const collapsed = sidebar.classList.toggle('collapsed');
            sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
            sidebarToggle.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
        });
    }

    if (mobileMenuToggle && sidebar && backdrop) {
        function openSidebar() {
            sidebar.classList.add('show');
            backdrop.classList.add('show');
            mobileMenuToggle.setAttribute('aria-expanded', 'true');
            if (mobileMenuClose) mobileMenuClose.focus();
        }
        function closeSidebar() {
            sidebar.classList.remove('show');
            backdrop.classList.remove('show');
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
            mobileMenuToggle.focus();
        }

        mobileMenuToggle.addEventListener('click', openSidebar);
        if (mobileMenuClose) mobileMenuClose.addEventListener('click', closeSidebar);
        backdrop.addEventListener('click', closeSidebar);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('show')) closeSidebar();
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
                const allDocs = [
                    ...(data.education || []), 
                    ...(data.training || []), 
                    ...(data.experience || []), 
                    ...(data.eligibility || []),
                    ...(data.performance || [])
                ];
                
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

    ['eduModal', 'trainModal', 'expModal', 'eligModal', 'perfModal'].forEach(modalId => {
        const el = document.getElementById(modalId);
        if (el) {
            el.addEventListener('hidden.bs.modal', updateRowRemarks);
        }
    });
});

// window.showToast lives in utils.js (single toast implementation for every page)

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
    const btn = document.getElementById('confirmStep1RemoveBtn');
    window.setButtonLoading(btn, true, 'Removing...');
    
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
            window.setButtonLoading(btn, false);
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
                const toastType = data.failed === 0 ? 'info' : 'warning';
                const msg = `PDF generation complete for ${data.name} (${data.status}) — ${data.generated}/${data.total} templates generated.`;
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
