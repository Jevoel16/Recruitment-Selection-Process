const modalStack = [];

document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('show.bs.modal', function (event) {
        const currentModalElement = event.target;
        
        // Check if there is an active modal open that is not the one currently being requested.
        if (modalStack.length > 0) {
            const previousModalElement = modalStack[modalStack.length - 1];
            if (previousModalElement !== currentModalElement) {
                // Temporarily disables the CSS fade animation to allow for an instant transition.
                previousModalElement.classList.remove('fade');
                currentModalElement.classList.remove('fade');
                
                // Hides the previously active modal instance from the DOM.
                previousModalElement.dataset.hiddenByStack = 'true';
                const prevInstance = bootstrap.Modal.getInstance(previousModalElement);
                if (prevInstance) {
                    prevInstance.hide();
                }
            }
        }
        
        // Pushes the requested modal onto the tracking stack to maintain navigational history.
        if (modalStack[modalStack.length - 1] !== currentModalElement) {
            modalStack.push(currentModalElement);
        }
    });

    document.addEventListener('hide.bs.modal', function (event) {
        const hidingModalElement = event.target;
        
        // If we have a nested modal hiding, remove animation to make it instant.
        // It's nested if modalStack length > 1
        if (modalStack.length > 1) {
            hidingModalElement.classList.remove('fade');
        }
    });

    document.addEventListener('hidden.bs.modal', function (event) {
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
            
            // Disable animation for instant return transition
            previousModalElement.classList.remove('fade');
            
            // Show the previous modal instantly
            const prevInstance = bootstrap.Modal.getOrCreateInstance(previousModalElement);
            prevInstance.show();
        } else {
            // Stack is empty, meaning all modals closed. Restore fade for future opens.
            closedModalElement.classList.add('fade');
        }
    });

    // Restore the fade class after a modal has finished showing, 
    // so it animates when it is normally closed (if it's the main modal).
    document.addEventListener('shown.bs.modal', function(event) {
        event.target.classList.add('fade');
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
