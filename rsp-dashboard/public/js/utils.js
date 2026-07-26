/**
 * Shows a global toast message
 * @param {string} message - The message to display
 * @param {string} type - 'success', 'danger', 'warning', 'info'
 * @param {boolean} reload - Whether to reload the page after showing the toast
 */
window.showToast = function(message, type = 'info', reload = false) {
    const container = document.querySelector('.toast-container');
    const template = document.getElementById('globalToastTemplate');
    
    if (!template || !container) {
        console.warn('Toast elements not found. Message:', message);
        alert(message);
        if (reload) window.location.reload();
        return;
    }

    // Maintain max 5 toasts (remove oldest if needed)
    const activeToasts = container.querySelectorAll('.toast:not(#globalToastTemplate)');
    if (activeToasts.length >= 5) {
        const oldestToast = activeToasts[0];
        const bsToast = bootstrap.Toast.getInstance(oldestToast);
        if (bsToast) bsToast.hide();
        else oldestToast.remove();
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

    toastMsg.innerHTML = message;
    container.appendChild(toastEl);
    
    const toast = new bootstrap.Toast(toastEl, { delay: 1500 });
    
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });

    if (reload) {
        window.isReloading = true;
        // Hide any open modals immediately so they don't linger while the toast waits to reload
        document.querySelectorAll('.modal.show').forEach(m => {
            const instance = bootstrap.Modal.getInstance(m);
            if (instance) instance.hide();
        });

        toastEl.addEventListener('hidden.bs.toast', () => {
            window.location.reload();
        }, { once: true });
    }

    toast.show();
};

window.submitSearch = function(form) {
    if (form.position) form.position.value = '';
    if (form.vacancy) form.vacancy.value = '';
    if (form.step) form.step.value = '';
    if (form.remarks) form.remarks.value = '';
    if (form.office) form.office.value = '';
    if (form.status) form.status.value = '';
    form.submit();
};
