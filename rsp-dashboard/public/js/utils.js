/**
 * Shows a global toast message
 * @param {string} message - The message to display
 * @param {string} type - 'success', 'danger', 'warning', 'info'
 * @param {boolean} reload - Whether to reload the page after showing the toast
 */
window.showToast = function(message, type = 'info', reload = false) {
    const toastEl = document.getElementById('globalToast');
    const toastMsg = document.getElementById('globalToastMessage');
    
    if (!toastEl || !toastMsg) {
        console.warn('Toast elements not found. Message:', message);
        alert(message);
        if (reload) window.location.reload();
        return;
    }

    toastEl.className = 'toast align-items-center text-white border-0';
    
    switch (type) {
        case 'success': toastEl.classList.add('bg-success'); break;
        case 'danger': toastEl.classList.add('bg-danger'); break;
        case 'warning': toastEl.classList.add('bg-warning', 'text-dark'); toastEl.classList.remove('text-white'); break;
        default: toastEl.classList.add('bg-info');
    }

    toastMsg.textContent = message;
    
    const toast = new bootstrap.Toast(toastEl, { delay: 1500 });
    
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
