/**
 * Shows a global toast message
 * @param {string} message - The message to display
 * @param {string} type - 'success', 'danger', 'warning', 'info'
 * @param {boolean} reload - Whether to reload the page after showing the toast
 */
window.toastQueue = window.toastQueue || [];
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
        alert(message);
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

    toastMsg.innerHTML = message;
    container.appendChild(toastEl);
    
    const toast = new bootstrap.Toast(toastEl, { delay: 1500 });
    
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
