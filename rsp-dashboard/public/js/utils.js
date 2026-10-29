/**
 * Shows a global toast message
 * @param {string} message - The message to display
 * @param {string} type - 'success', 'danger', 'warning', 'info'
 * @param {boolean} reload - Whether to reload the page after showing the toast
 */
window.toastQueue = window.toastQueue || [];

// Escapes text before it is placed in innerHTML or an HTML attribute.
// Applicant data arrives from the public portal, so always run it through this.
window.escapeHtml = function(value) {
    return String(value ?? '').replace(/[&<>"'`]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' }[c]));
};

// Turns a value into a quoted JS string argument that is safe inside an onclick="..." attribute.
window.jsArg = function(value) {
    return window.escapeHtml(JSON.stringify(String(value ?? '')));
};

// Disables a button and shows a spinner while a request runs; call again with false to restore it.
window.setButtonLoading = function(btn, loading, label = 'Saving...') {
    if (!btn) return;
    if (loading) {
        if (btn.dataset.originalHtml === undefined) btn.dataset.originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.setAttribute('aria-busy', 'true');
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>${window.escapeHtml(label)}`;
    } else {
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
        if (btn.dataset.originalHtml !== undefined) {
            btn.innerHTML = btn.dataset.originalHtml;
            delete btn.dataset.originalHtml;
        }
    }
};
window.isToastShowing = window.isToastShowing || false;

window.showToast = function(message, type = 'info', reload = false) {
    window.toastQueue.push({ message, type, reload });
    processToastQueue();
};

function processToastQueue() {
    if (window.isToastShowing || window.toastQueue.length === 0) return;

    window.isToastShowing = true;
    const { message, type, reload } = window.toastQueue.shift();

    const container = document.querySelector('.toast-container');
    const template = document.getElementById('globalToastTemplate');
    
    if (!template || !container) {
        console.warn('Toast elements not found. Message:', message);
        if (reload) window.location.reload();
        
        window.isToastShowing = false;
        processToastQueue();
        return;
    }

    // Clone the template
    const toastEl = template.cloneNode(true);
    toastEl.removeAttribute('id'); // Remove id from clone
    toastEl.style.display = ''; // Remove display:none
    const toastMsg = toastEl.querySelector('.global-toast-message');

    switch (type) {
        case 'success': toastEl.classList.add('bg-success'); break;
        case 'danger': toastEl.classList.add('bg-danger'); break;
        case 'warning': toastEl.classList.add('bg-warning', 'text-dark'); toastEl.classList.remove('text-white'); break;
        default: toastEl.classList.add('bg-info');
    }

    toastMsg.textContent = message;
    container.appendChild(toastEl);
    
    // Errors and warnings stay up long enough to read; reload toasts stay short so the page refreshes promptly
    const delay = reload ? 1500 : (type === 'danger' || type === 'warning') ? 5000 : 2500;
    const toast = new bootstrap.Toast(toastEl, { delay });
    
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
        window.isToastShowing = false;
        
        if (reload) {
            window.location.reload();
        } else {
            processToastQueue();
        }
    });

    if (reload) {
        window.isReloading = true;
        // Hide any open modals immediately so they don't linger while the toast waits to reload
        document.querySelectorAll('.modal.show').forEach(m => {
            const instance = bootstrap.Modal.getInstance(m);
            if (instance) instance.hide();
        });
    }

    toast.show();
}

window.submitSearch = function(form) {
    if (form.position) form.position.value = '';
    if (form.vacancy) form.vacancy.value = '';
    if (form.step) form.step.value = '';
    if (form.remarks) form.remarks.value = '';
    if (form.office) form.office.value = '';
    if (form.status) form.status.value = '';
    form.submit();
};
