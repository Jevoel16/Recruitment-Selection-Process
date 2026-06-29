const REQUIREMENT_FIELDS = [
    { field: 'req_pds', label: 'PDS (3 copies)' },
    { field: 'req_prcLicense', label: 'PRC License Photocopy (3 copies)' },
    { field: 'req_reportRating', label: 'Report of Rating Photocopy (3 copies)' },
    { field: 'req_medCert', label: 'Medical Certificate 2 orig / 1 photocopy' },
    { field: 'req_birthCert', label: 'Birth Certificate' },
    { field: 'req_marriageCert', label: 'Marriage Certificate (if applicable)' },
    { field: 'req_nbiClearance', label: 'NBI Clearance 1 orig / 1 photocopy' },
    { field: 'req_tor', label: 'T.O.R' },
    { field: 'req_diplomaBachelors', label: "Diploma of Bachelor's Degree" },
    { field: 'req_masters', label: "Master's Degree" },
    { field: 'req_doctorate', label: 'Doctorate Degree' },
    { field: 'req_soGraduation', label: 'SO of Graduation 2 orig / 1 photocopy' },
    { field: 'req_orderSeparation', label: 'Order of Separation 1 orig / 2 photocopy' },
    { field: 'req_saln', label: 'SALN notarized (3 copies)' }
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

    const assignButton = document.getElementById(`assign-btn-${applicant.id}`);
    if (assignButton) {
        assignButton.disabled = !isComplete;
        if (isComplete) {
            assignButton.removeAttribute('title');
        } else {
            assignButton.setAttribute('title', 'Requirements must be complete');
        }
    }
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
        alert('Unable to update the requirement checkbox.');
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
        alert('Unable to update requirements.');
    }
}

async function openRequirementsModal(id, skipFetch = false) {
    try {
        const data = await fetchDetails(id);
        const app = data.applicant;
        const isComplete = REQUIREMENT_FIELDS.every(({ field }) => Boolean(app[field]));

        const itemsHtml = REQUIREMENT_FIELDS.map(({ field, label }) => {
            const checked = app[field] ? 'checked' : '';
            return `
                <div class="col-md-6">
                    <label class="requirement-item d-flex align-items-start gap-3 p-3 rounded-3 border h-100">
                        <input class="form-check-input mt-1" type="checkbox" ${checked} onchange="updateRequirementField(${id}, '${field}', this.checked)">
                        <span>
                            <span class="d-block fw-semibold">${label}</span>
                            <small class="text-muted">Stored as a boolean requirement flag.</small>
                        </span>
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
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                <div>
                    <h6 class="mb-1">${app.name}</h6>
                    <div class="text-muted small">Toggle each checkbox to save it immediately.</div>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <span id="requirements-overall-status" class="badge ${isComplete ? 'bg-success' : 'bg-warning text-dark'}">${isComplete ? 'Complete' : 'Incomplete'}</span>
                    <button type="button" class="btn ${btnClass} btn-sm" onclick="setAllRequirements(${id}, ${targetValue})">
                        <i class="bi ${btnIcon}"></i> ${btnText}
                    </button>
                </div>
            </div>
            <div class="row g-3">
                ${itemsHtml}
            </div>
        `;

        syncRequirementsSummary(app);
        const reqModal = document.getElementById('requirementsModal');
        if (!reqModal.classList.contains('show')) {
            bootstrap.Modal.getOrCreateInstance(reqModal).show();
        }
    } catch (error) { console.error(error); alert('Failed to fetch applicant data'); }
}

