const modalStack = [];

document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('show.bs.modal', function (event) {
        const currentModalElement = event.target;
        
        // Check if there is an active modal open that is not the one currently being requested.
        if (modalStack.length > 0) {
            const previousModalElement = modalStack[modalStack.length - 1];
            if (previousModalElement !== currentModalElement) {
                // Hides the previously active modal instance from the DOM.
                previousModalElement.dataset.hiddenByStack = 'true';
                const prevInstance = bootstrap.Modal.getInstance(previousModalElement);
                if (prevInstance) {
                    prevInstance.hide();
                }
            }
        }
        
        // Pushes the requested modal onto the tracking stack, preventing duplicates.
        const existingIndex = modalStack.indexOf(currentModalElement);
        if (existingIndex !== -1) {
            // If it's already in the stack, truncate everything above it
            modalStack.splice(existingIndex + 1);
        } else {
            modalStack.push(currentModalElement);
        }
    });

    document.addEventListener('hide.bs.modal', function (event) {
        // No longer stripping the fade class for nested modals
    });

    document.addEventListener('hidden.bs.modal', function (event) {
        if (window.isReloading) return;
        
        const closedModalElement = event.target;
        
        if (closedModalElement.dataset.hiddenByStack === 'true') {
            closedModalElement.removeAttribute('data-hidden-by-stack');
            return; // It was hidden to make way for a new modal, do not pop
        }
        
        // Removes the active modal from the top of the history stack.
        if (modalStack.length > 0 && modalStack[modalStack.length - 1] === closedModalElement) {
            modalStack.pop();
        } else {
            // Failsafe: if it was somehow closed out of order, just remove it
            const idx = modalStack.indexOf(closedModalElement);
            if (idx !== -1) {
                modalStack.splice(idx, 1);
            }
        }

        // Re-opens the previous modal stored in the history stack, if one exists.
        if (modalStack.length > 0) {
            const previousModalElement = modalStack[modalStack.length - 1];
            
            // Show the previous modal
            const prevInstance = bootstrap.Modal.getOrCreateInstance(previousModalElement);
            prevInstance.show();
        }
    });

    // Explicitly overrides the Escape key behavior to perfectly mimic the native close button functionality.
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' || event.keyCode === 27) {
            if (modalStack.length > 0) {
                const topModal = modalStack[modalStack.length - 1];
                // Find the close button inside this modal
                const closeBtn = topModal.querySelector('.btn-close');
                if (closeBtn) {
                    event.preventDefault();
                    event.stopPropagation();
                    closeBtn.click();
                }
            }
        }
    });
});
