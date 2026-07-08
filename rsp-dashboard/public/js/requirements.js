const REQUIREMENT_FIELDS = [
    { field: 'req_pds', label: 'PDS (3 copies)' },
    { field: 'req_prcLicense', label: 'PRC License Photocopy (3 copies)' },
    { field: 'req_reportRating', label: 'Report of Rating Photocopy (3 copies)' },
    { field: 'req_medCert', label: 'Medical Certificate 2 orig / 1 photocopy' },
    { field: 'req_birthCert', label: 'Birth Cert & Marriage Cert (if applicable)' },
    { field: 'req_nbiClearance', label: 'NBI Clearance 1 orig / 1 photocopy' },
    { field: 'req_tor', label: 'T.O.R & Diplomas (Bachelor, Master, Doctorate)' },
    { field: 'req_soGraduation', label: 'SO of Graduation 2 orig / 1 photocopy' },
    { field: 'req_orderSeparation', label: 'Order of Separation 1 orig / 2 photocopy' },
    { field: 'req_saln', label: 'SALN notarized (3 copies)' },
    { field: 'req_folders', label: 'Folders & Envelopes (Kraft, Pink, Expanded)' }
];

function syncRequirementsSummary(applicant) {
    const isComplete = REQUIREMENT_FIELDS.every(({ field }) => Boolean(applicant[field]));
    const statusBadge = document.getElementById(`requirements-status-${applicant.id}`);
    if (statusBadge) {
        statusBadge.textContent = isComplete ? 'Complete' : 'Incomplete';
        statusBadge.className = `badge ${isComplete ? 'bg-success' : 'bg-warning text-dark'}`;
    }

    const modalStatusBadge = document.getElementById('requirements-overall-status');
    if (modalStatusBadge) {
        modalStatusBadge.textContent = isComplete ? 'Complete' : 'Incomplete';
        modalStatusBadge.className = `badge ${isComplete ? 'bg-success' : 'bg-warning text-dark'}`;
    }

    // Move button mechanics are no longer based on requirements. They are unlocked when the doc is downloaded.
}


// Wizard logic has been extracted to applicantWizard.js

// Delete entire Applicant
async function updateRequirementField(id, field, value) {
    try {
        const res = await fetch(`/api/applicants/${id}/requirement`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ field, value })
        });
        if (res.ok) {
            const data = await fetchDetails(id);
            syncRequirementsSummary(data.applicant);
            return data.applicant;
        }
        throw new Error('Failed to update requirement');
    } catch (err) {
        console.error(err);
        window.showToast('Unable to update the requirement checkbox.', 'danger');
        return null;
    }
}

async function setAllRequirements(id, value) {
    try {
        const res = await fetch(`/api/applicants/${id}/requirements/all`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value })
        });

        if (res.ok) {
            openRequirementsModal(id, true);
        }
    } catch (err) {
        console.error(err);
        window.showToast('Unable to update requirements.', 'danger');
    }
}

async function openRequirementsModal(id, skipFetch = false) {
    if (!(await window.acquireLock(id))) return;
    try {
        const data = await fetchDetails(id);
        const app = data.applicant;
        const isComplete = REQUIREMENT_FIELDS.every(({ field }) => Boolean(app[field]));

        const itemsHtml = REQUIREMENT_FIELDS.map(({ field, label }) => {
            const checked = app[field] ? 'checked' : '';
            const bgClass = app[field] ? 'bg-success bg-opacity-10 border-success border-opacity-50' : 'bg-white border-light-subtle';
            return `
                <div class="col-md-6 col-lg-4">
                    <label class="d-flex align-items-center p-3 rounded-3 border ${bgClass} transition-all cursor-pointer shadow-sm h-100" style="cursor: pointer;">
                        <div class="d-flex align-items-center gap-3 w-100">
                            <input class="form-check-input mt-0 shadow-none border-secondary" style="width: 1.25rem; height: 1.25rem; cursor: pointer;" type="checkbox" ${checked} onchange="updateRequirementField(${id}, '${field}', this.checked)">
                            <span class="fw-semibold text-dark m-0" style="font-size: 0.95rem;">${label}</span>
                        </div>
                    </label>
                </div>
            `;
        }).join('');

        // Toggling button text, class, and icon based on whether it is currently checked-all
        const btnText = isComplete ? 'Uncheck All Requirements' : 'Check All Requirements';
        const btnClass = isComplete ? 'btn-outline-danger' : 'btn-success';
        const btnIcon = isComplete ? 'bi-x-square' : 'bi-check2-square';
        const targetValue = !isComplete;

        document.getElementById('requirementsModalBody').innerHTML = `
            <input type="hidden" id="requirementsApplicantId" value="${id}">
            
            <div class="d-flex justify-content-between align-items-center bg-light p-3 rounded-3 mb-4 border">
                <div>
                    <h6 class="mb-0 fw-bold text-dark">${app.name}</h6>
                    <small class="text-muted">Click items to toggle completion</small>
                </div>
                <div class="text-end">
                    <span id="requirements-overall-status" class="badge ${isComplete ? 'bg-success' : 'bg-warning text-dark'} mb-2 d-block py-2 px-3 rounded-pill">${isComplete ? 'Complete' : 'Incomplete'}</span>
                </div>
            </div>

            <div class="row g-2 mb-4" style="max-height: 50vh; overflow-y: auto; padding-right: 5px;">
                ${itemsHtml}
            </div>

            <div class="border-top pt-3 mt-3">
                <div class="row g-2 align-items-center">
                    <div class="col-md-5">
                        <select class="form-select" id="requirementsDocTypeSelect">
                            <option value="Notice of Requirements - Newly Hired">Notice of Requirements - Newly Hired</option>
                            <option value="Notice of Requirements - Promotion">Notice of Requirements - Promotion</option>
                            <option value="Transfer Acceptance">Transfer Acceptance</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <button type="button" class="btn btn-primary w-100 fw-bold shadow-sm" onclick="downloadRequirementsDoc(${id})">
                            <i class="bi bi-file-earmark-word"></i> Download DOC
                        </button>
                    </div>
                    <div class="col-md-4 d-flex gap-2">
                        <button type="button" class="btn ${btnClass} flex-grow-1" onclick="setAllRequirements(${id}, ${targetValue})">
                            <i class="bi ${btnIcon}"></i> ${btnText}
                        </button>
                    </div>
                </div>
            </div>
        `;

        syncRequirementsSummary(app);
        const reqModal = document.getElementById('requirementsModal');
        if (!reqModal.classList.contains('show')) {
            bootstrap.Modal.getOrCreateInstance(reqModal).show();
        }
    } catch (error) { console.error(error); window.showToast('Failed to fetch applicant data', 'danger'); }
}

window.downloadRequirementsDoc = function(id) {
    const type = document.getElementById('requirementsDocTypeSelect').value;
    
    // Close the modal
    const modalEl = document.getElementById('requirementsModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if(modalInstance) modalInstance.hide();
    
    if (type === 'Notice of Requirements - Newly Hired' && window.printReqNewlyHired) {
        window.printReqNewlyHired(id);
    } else if (type === 'Notice of Requirements - Promotion' && window.printReqPromotion) {
        window.printReqPromotion(id);
    } else if (type === 'Transfer Acceptance' && window.printTransferAcceptance) {
        window.printTransferAcceptance(id);
    } else {
        window.showToast('Function for this template is not defined.', 'danger');
    }
};
