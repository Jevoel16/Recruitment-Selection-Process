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
async function deleteApplicant(id) {
    if(!confirm('Are you sure you want to permanently delete this applicant and all their records?')) return;
    try {
        const res = await fetch(`/api/applicants/${id}`, { method: 'DELETE' });
        if(res.ok) window.location.reload();
    } catch(err) { console.error(err); }
}

// Open Qualify Modal
function openQualifyModal(id, name) {
    document.getElementById('qualifyId').value = id;
    document.getElementById('qualifyName').innerText = name;
    new bootstrap.Modal(document.getElementById('qualifyModal')).show();
}

// Submit Qualify
if (qualifyForm) {
    qualifyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('qualifyId').value;
        
        try {
            const res = await fetch(`/api/applicants/${id}/qualify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) window.location.reload();
        } catch (err) {
            console.error(err);
            alert('Error qualifying applicant');
        }
    });
}

// Disqualify Applicant
async function disqualifyApplicant(id) {
    if(confirm('Are you sure you want to disqualify this applicant?')) {
        try {
            const res = await fetch(`/api/applicants/${id}/disqualify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) window.location.reload();
        } catch (err) {
            console.error(err);
        }
    }
}

// Open Score Modal
function openScoreModal(id, name) {
    document.getElementById('scoreId').value = id;
    document.getElementById('scoreName').innerText = name;
    new bootstrap.Modal(document.getElementById('scoreModal')).show();
}

// Submit Score
if (scoreForm) {
    scoreForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('scoreId').value;
        const score = document.getElementById('interviewScore').value;
        const office = document.getElementById('assignedOffice').value;
        
        try {
            const res = await fetch(`/api/applicants/${id}/score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ score, office })
            });
            if (res.ok) {
                window.location.reload();
            }
        } catch (err) {
            console.error(err);
            alert('Error submitting score');
        }
    });
}

// PDF Generation has been extracted to pdfGenerator.js


// ==========================================
// NEW WORKFLOW & MODAL FUNCTIONS
// ==========================================

function proceedToRequirements(id, name) {
    document.getElementById('step3ConfirmApplicantId').value = id;
    document.getElementById('step3ConfirmApplicantName').innerText = name;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('step3ConfirmModal')).show();
}

async function confirmProceedToStep4() {
    const id = document.getElementById('step3ConfirmApplicantId').value;
    try {
        const res = await fetch(`/api/applicants/${id}/proceed-requirements`, { method: 'POST' });
        if(res.ok) window.location.reload();
    } catch(err) { console.error(err); }
}

async function toggleAssignmentReq(id, currentStatus) {
    const newStatus = currentStatus === 'COMPLETE' ? 'INCOMPLETE' : 'COMPLETE';
    try {
        const res = await fetch(`/api/applicants/${id}/toggle-assignment-req`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) window.location.reload();
    } catch(err) { console.error(err); }
}

const assignForm = document.getElementById('assignForm');
if (assignForm) {
    assignForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('assignId').value;
        const office = document.getElementById('assignedOffice').value;
        try {
            const res = await fetch(`/api/applicants/${id}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ office })
            });
            if (res.ok) window.location.reload();
        } catch(err) { console.error(err); }
    });
}

function openAssignModal(id, name) {
    document.getElementById('assignId').value = id;
    document.getElementById('assignName').innerText = name;
    document.getElementById('assignedOffice').value = '';
    new bootstrap.Modal(document.getElementById('assignModal')).show();
}

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

async function fetchDetails(id) {
    const res = await fetch(`/api/applicants/${id}/details`);
    if (!res.ok) throw new Error('Failed to fetch details');
    return await res.json();
}

// Reusable deleter
async function deleteRecord(type, recordId, applicantId, modalType) {
    if(!confirm('Delete this record?')) return;
    try {
        const res = await fetch(`/api/${type}/${recordId}`, { method: 'DELETE' });
        if(res.ok) {
            if (modalType === 'edu') openEduModal(applicantId);
            else if (modalType === 'train') openTrainModal(applicantId);
            else if (modalType === 'exp') openExpModal(applicantId);
            else if (modalType === 'elig') openEligModal(applicantId);
            else window.location.reload();
        }
    } catch(err) { console.error(err); }
}

async function openInfoModal(id) {
    try {
        const data = await fetchDetails(id);
        const app = data.applicant;
        document.getElementById('infoModalBody').innerHTML = `
            <form id="infoForm-${id}">
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">First Name</label>
                        <input type="text" class="form-control" name="firstName" value="${app.firstName || ''}" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Last Name</label>
                        <input type="text" class="form-control" name="lastName" value="${app.lastName || ''}" required>
                    </div>
                    <div class="col-md-12">
                        <label class="form-label">Address</label>
                        <input type="text" class="form-control" name="address" value="${app.address || ''}">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Age</label>
                        <input type="number" class="form-control" name="age" value="${app.age || ''}">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Sex</label>
                        <select class="form-select" name="sex">
                            <option value="">Select...</option>
                            <option value="Male" ${app.sex==='Male'?'selected':''}>Male</option>
                            <option value="Female" ${app.sex==='Female'?'selected':''}>Female</option>
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Civil Status</label>
                        <input type="text" class="form-control" name="civilStatus" value="${app.civilStatus || ''}">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Religion</label>
                        <input type="text" class="form-control" name="religion" value="${app.religion || ''}">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Disability</label>
                        <input type="text" class="form-control" name="disability" value="${app.disability || ''}">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Ethnic Group</label>
                        <input type="text" class="form-control" name="ethnicGroup" value="${app.ethnicGroup || ''}">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-control" name="emailAddress" value="${app.emailAddress || ''}">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Contact No</label>
                        <input type="text" class="form-control" name="contactNo" value="${app.contactNo || ''}" placeholder="Contact">
                    </div>
                </div>
                <div class="d-flex justify-content-end mt-4">
                    <button type="submit" class="btn btn-primary px-4"><i class="bi bi-save me-2"></i> Save Changes</button>
                </div>
            </form>
        `;
        
        document.getElementById(`infoForm-${id}`).addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const body = Object.fromEntries(formData.entries());
            try {
                const res = await fetch(`/api/applicants/${id}/info`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                if(res.ok) {
                    const nameCells = document.querySelectorAll('.applicant-name-display-' + id);
                    if (nameCells.length) {
                        nameCells.forEach(cell => cell.innerText = `${body.firstName} ${body.lastName}`);
                    }
                    openInfoModal(id);
                }
            } catch(err) { console.error(err); }
        });
        
        const iModal = document.getElementById('infoModal');
        if (!iModal.classList.contains('show')) {
            bootstrap.Modal.getOrCreateInstance(iModal).show();
        }
    } catch (error) {
        alert(error.message); }
}

function setFloatingStandard(modalId, text) {
    const modalEl = document.getElementById(modalId);
    if (!modalEl) return;
    const dialog = modalEl.querySelector('.modal-dialog');
    
    let floatBox = dialog.querySelector('.standard-floating-box');
    if (!floatBox) {
        floatBox = document.createElement('div');
        floatBox.className = 'standard-floating-box bg-white p-3 rounded-4 shadow border border-info';
        dialog.appendChild(floatBox);
    }
    
    if (text) {
        dialog.classList.add('modal-dialog-with-standard');
        floatBox.innerHTML = `<h6 class="text-info fw-bold mb-2"><i class="bi bi-info-circle-fill me-2"></i> Standard Required</h6><p class="mb-0 small text-dark">${text}</p>`;
        floatBox.style.display = 'block';
    } else {
        dialog.classList.remove('modal-dialog-with-standard');
        floatBox.style.display = 'none';
    }
}

async function setHighestDegree(applicantId, eduId) {
    try {
        const res = await fetch(`/api/applicants/${applicantId}/education/${eduId}/highest`, { method: 'POST' });
        if (!res.ok) alert('Failed to set highest degree.');
    } catch(err) { console.error(err); }
}

window.currentDocApplicantId = null;

async function openEduModal(id, isWizard = false) {
    try {
        window.currentDocApplicantId = id;
        document.getElementById('eduModalTitle').innerText = isWizard ? 'New Applicant Wizard - Education Records' : 'Education Records';
        const data = await fetchDetails(id);
        const edu = data.education;
        
        setFloatingStandard('eduModal', data.positionStandards ? data.positionStandards.qsEducation : null);
        
        let html = '<ul class="list-group mb-3">';
        if(edu.length) {
            edu.forEach(e => {
                const docTitle = e.degree || e.title;
                const gradYear = e.yearGraduated || e.year_graduated;
                const docLink = e.digitalCopyLink || e.link;
                const isHighest = e.is_highest ? 'checked' : '';
                const radioHtml = edu.length > 1 ? `<div class="form-check m-0 me-3"><input class="form-check-input" type="radio" name="highestDegree" value="${e.id}" ${isHighest} onchange="setHighestDegree(${id}, ${e.id})" title="Set as highest degree"></div>` : '';
                html += `<li class="list-group-item d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        ${radioHtml}
                        <span>
                            <strong>${docTitle}</strong> (${gradYear})
                            ${docLink ? `<br><a href="${docLink}" target="_blank" class="text-primary text-decoration-none small"><i class="bi bi-link-45deg"></i> View Document</a>` : ''}
                            <br><span class="badge ${e.status === 'QUALIFIED' ? 'bg-success' : e.status === 'DISQUALIFIED' ? 'bg-danger' : 'bg-warning text-dark'}">${e.status || 'PENDING'}</span>
                        </span>
                    </div>
                    <div class="btn-group">
                        <button type="button" class="btn btn-sm btn-success ${e.status === 'QUALIFIED' ? 'disabled' : ''}" onclick="updateDocStatus('education', ${id}, ${e.id}, 'QUALIFIED')"><i class="bi bi-check-circle"></i></button>
                        <button type="button" class="btn btn-sm btn-warning ${e.status === 'DISQUALIFIED' ? 'disabled' : ''}" onclick="updateDocStatus('education', ${id}, ${e.id}, 'DISQUALIFIED')"><i class="bi bi-x-circle"></i></button>
                        <button type="button" class="btn btn-sm btn-danger" onclick="deleteRecord('education', ${e.id}, ${id}, 'edu')"><i class="bi bi-trash"></i></button>
                    </div>
                </li>`;
            });
        } else html += '<li class="list-group-item text-muted">No education records found.</li>';
        html += '</ul>';
        html += `
            <form id="addEdu-${id}" class="mb-3">
                <div class="d-flex gap-2 w-100">
                    <input type="text" class="form-control" name="title" placeholder="Degree / School" style="flex: 4;" required>
                    <input type="text" class="form-control" name="year_graduated" placeholder="Year" style="flex: 1;" required>
                </div>
                <button type="submit" class="btn btn-success w-100 mt-2">Add Education</button>
            </form>
        `;
        if (isWizard) {
            html += `<div class="d-flex justify-content-end mt-3 pt-3 border-top"><button type="button" class="btn btn-primary" onclick="transitionModal('eduModal', 'openTrainModal', ${id})">Next: Training <i class="bi bi-arrow-right"></i></button></div>`;
        }
        document.getElementById('eduModalBody').innerHTML = html;
        
        document.getElementById(`addEdu-${id}`).addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const res = await fetch(`/api/applicants/${id}/education`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: e.target.title.value, year_graduated: e.target.year_graduated.value })
                });
                if(res.ok) openEduModal(id, isWizard);
            } catch(err) { console.error(err); }
        });
        const eModal = document.getElementById('eduModal');
        if (!eModal.classList.contains('show')) {
            bootstrap.Modal.getOrCreateInstance(eModal).show();
        }
    } catch (err) { alert(err.message); }
}

async function openTrainModal(id, isWizard = false) {
    try {
        window.currentDocApplicantId = id;
        document.getElementById('trainModalTitle').innerText = isWizard ? 'New Applicant Wizard - Training Seminars' : 'Training Seminars';
        const data = await fetchDetails(id);
        const train = data.training;
        
        setFloatingStandard('trainModal', data.positionStandards ? data.positionStandards.qsTraining : null);
        
        let html = '<ul class="list-group mb-3">';
        if(train.length) {
            train.forEach(t => {
                const docLink = t.digitalCopyLink || t.link;
                html += `<li class="list-group-item d-flex justify-content-between align-items-center">
                    <span><strong>${t.title}</strong> (${t.hours} hours)
                    ${docLink ? `<br><a href="${docLink}" target="_blank" class="text-primary text-decoration-none small"><i class="bi bi-link-45deg"></i> View Certificate</a>` : ''}
                    <br><span class="badge ${t.status === 'QUALIFIED' ? 'bg-success' : t.status === 'DISQUALIFIED' ? 'bg-danger' : 'bg-warning text-dark'}">${t.status || 'PENDING'}</span>
                    </span>
                    <div class="btn-group">
                        <button type="button" class="btn btn-sm btn-success ${t.status === 'QUALIFIED' ? 'disabled' : ''}" onclick="updateDocStatus('training', ${id}, ${t.id}, 'QUALIFIED')"><i class="bi bi-check-circle"></i></button>
                        <button type="button" class="btn btn-sm btn-warning ${t.status === 'DISQUALIFIED' ? 'disabled' : ''}" onclick="updateDocStatus('training', ${id}, ${t.id}, 'DISQUALIFIED')"><i class="bi bi-x-circle"></i></button>
                        <button type="button" class="btn btn-sm btn-danger" onclick="deleteRecord('training', ${t.id}, ${id}, 'train')"><i class="bi bi-trash"></i></button>
                    </div>
                </li>`;
            });
        } else html += '<li class="list-group-item text-muted">No training seminars found.</li>';
        html += '</ul>';
        html += `
            <form id="addTrain-${id}" class="mb-3">
                <div class="d-flex gap-2 w-100">
                    <input type="text" class="form-control" name="title" placeholder="Title" style="flex: 4;" required>
                    <input type="number" class="form-control" name="hours" placeholder="Hrs" style="flex: 1;" required>
                </div>
                <button type="submit" class="btn btn-success w-100 mt-2">Add Training</button>
            </form>
        `;
        if (isWizard) {
            html += `<div class="d-flex justify-content-end mt-3 pt-3 border-top"><button type="button" class="btn btn-primary" onclick="transitionModal('trainModal', 'openExpModal', ${id})">Next: Experience <i class="bi bi-arrow-right"></i></button></div>`;
        }
        document.getElementById('trainModalBody').innerHTML = html;
        
        document.getElementById(`addTrain-${id}`).addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const res = await fetch(`/api/applicants/${id}/training`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: e.target.title.value, hours: e.target.hours.value })
                });
                if(res.ok) openTrainModal(id, isWizard);
            } catch(err) { console.error(err); }
        });
        const tModal = document.getElementById('trainModal');
        if (!tModal.classList.contains('show')) {
            bootstrap.Modal.getOrCreateInstance(tModal).show();
        }
    } catch (err) { alert(err.message); }
}

async function openExpModal(id, isWizard = false) {
    try {
        document.getElementById('expModalTitle').innerText = isWizard ? 'New Applicant Wizard - Work Experience' : 'Work Experience';
        const data = await fetchDetails(id);
        const exp = data.experience;
        
        setFloatingStandard('expModal', data.positionStandards ? data.positionStandards.qsExperience : null);
        
        let html = '<ul class="list-group mb-3">';
        if(exp.length) {
            exp.forEach(e => {
                const docLink = e.digitalCopyLink || e.link;
                html += `<li class="list-group-item d-flex justify-content-between align-items-center">
                    <span><strong>${e.details}</strong> (${e.years} years)
                    ${docLink ? `<br><a href="${docLink}" target="_blank" class="text-primary text-decoration-none small"><i class="bi bi-link-45deg"></i> View Certificate</a>` : ''}
                    <br><span class="badge ${e.status === 'QUALIFIED' ? 'bg-success' : e.status === 'DISQUALIFIED' ? 'bg-danger' : 'bg-warning text-dark'}">${e.status || 'PENDING'}</span>
                    </span>
                    <div class="btn-group">
                        <button type="button" class="btn btn-sm btn-success ${e.status === 'QUALIFIED' ? 'disabled' : ''}" onclick="updateDocStatus('experience', ${id}, ${e.id}, 'QUALIFIED')"><i class="bi bi-check-circle"></i></button>
                        <button type="button" class="btn btn-sm btn-warning ${e.status === 'DISQUALIFIED' ? 'disabled' : ''}" onclick="updateDocStatus('experience', ${id}, ${e.id}, 'DISQUALIFIED')"><i class="bi bi-x-circle"></i></button>
                        <button type="button" class="btn btn-sm btn-danger" onclick="deleteRecord('experience', ${e.id}, ${id}, 'exp')"><i class="bi bi-trash"></i></button>
                    </div>
                </li>`;
            });
        } else html += '<li class="list-group-item text-muted">No experience records found.</li>';
        html += '</ul>';
        html += `
            <form id="addExp-${id}" class="mb-3">
                <div class="d-flex gap-2 w-100">
                    <input type="text" class="form-control" name="details" placeholder="Details" style="flex: 4;" required>
                    <input type="number" class="form-control" name="years" placeholder="Yrs" style="flex: 1;" required>
                </div>
                <button type="submit" class="btn btn-success w-100 mt-2">Add Experience</button>
            </form>
        `;
        if (isWizard) {
            html += `<div class="d-flex justify-content-end mt-3 pt-3 border-top"><button type="button" class="btn btn-primary" onclick="transitionModal('expModal', 'openEligModal', ${id})">Next: Eligibility <i class="bi bi-arrow-right"></i></button></div>`;
        }
        document.getElementById('expModalBody').innerHTML = html;
        
        document.getElementById(`addExp-${id}`).addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const res = await fetch(`/api/applicants/${id}/experience`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ details: e.target.details.value, years: e.target.years.value })
                });
                if(res.ok) openExpModal(id, isWizard);
            } catch(err) { console.error(err); }
        });
        const expModalEl = document.getElementById('expModal');
        if (!expModalEl.classList.contains('show')) {
            bootstrap.Modal.getOrCreateInstance(expModalEl).show();
        }
    } catch (err) { alert(err.message); }
}

async function openEligModal(id, isWizard = false) {
    try {
        document.getElementById('eligModalTitle').innerText = isWizard ? 'New Applicant Wizard - Eligibility' : 'Eligibility';
        const data = await fetchDetails(id);
        const elig = data.eligibility;
        
        setFloatingStandard('eligModal', data.positionStandards ? data.positionStandards.qsEligibility : null);
        
        let html = '<ul class="list-group mb-3">';
        if(elig.length) {
            elig.forEach(e => {
                const docTitle = e.details || e.title;
                const docLink = e.digitalCopyLink || e.link;
                html += `<li class="list-group-item d-flex justify-content-between align-items-center">
                    <span><strong>${docTitle}</strong> (${e.rating})
                    ${docLink ? `<br><a href="${docLink}" target="_blank" class="text-primary text-decoration-none small"><i class="bi bi-link-45deg"></i> View Document</a>` : ''}
                    <br><span class="badge ${e.status === 'QUALIFIED' ? 'bg-success' : e.status === 'DISQUALIFIED' ? 'bg-danger' : 'bg-warning text-dark'}">${e.status || 'PENDING'}</span>
                    </span>
                    <div class="btn-group">
                        <button type="button" class="btn btn-sm btn-success ${e.status === 'QUALIFIED' ? 'disabled' : ''}" onclick="updateDocStatus('eligibility', ${id}, ${e.id}, 'QUALIFIED')"><i class="bi bi-check-circle"></i></button>
                        <button type="button" class="btn btn-sm btn-warning ${e.status === 'DISQUALIFIED' ? 'disabled' : ''}" onclick="updateDocStatus('eligibility', ${id}, ${e.id}, 'DISQUALIFIED')"><i class="bi bi-x-circle"></i></button>
                        <button type="button" class="btn btn-sm btn-danger" onclick="deleteRecord('eligibility', ${e.id}, ${id}, 'elig')"><i class="bi bi-trash"></i></button>
                    </div>
                </li>`;
            });
        } else html += '<li class="list-group-item text-muted">No eligibility records found.</li>';
        html += '</ul>';
        html += `
            <form id="addElig-${id}" class="mb-3">
                <div class="d-flex gap-2 w-100">
                    <input type="text" class="form-control" name="title" placeholder="License / Exam" style="flex: 4;" required>
                    <input type="text" class="form-control" name="rating" placeholder="Rating" style="flex: 1;" required>
                </div>
                <button type="submit" class="btn btn-success w-100 mt-2">Add Eligibility</button>
            </form>
        `;
        if (isWizard) {
            html += `<div class="d-flex justify-content-end mt-3 pt-3 border-top"><button type="button" class="btn btn-success" onclick="window.location.reload()">Finish Wizard <i class="bi bi-check-circle"></i></button></div>`;
        }
        document.getElementById('eligModalBody').innerHTML = html;
        
        document.getElementById(`addElig-${id}`).addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const res = await fetch(`/api/applicants/${id}/eligibility`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: e.target.title.value, rating: e.target.rating.value })
                });
                if(res.ok) openEligModal(id, isWizard);
            } catch(err) { console.error(err); }
        });
        const eligModalEl = document.getElementById('eligModal');
        if (!eligModalEl.classList.contains('show')) {
            bootstrap.Modal.getOrCreateInstance(eligModalEl).show();
        }
    } catch (err) { alert(err.message); }
}

async function updateDocStatus(type, applicantId, docId, status) {
    try {
        const res = await fetch(`/api/applicants/${applicantId}/${type}/${docId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if(res.ok) {
            if(type === 'education') openEduModal(applicantId);
            else if(type === 'training') openTrainModal(applicantId);
            else if(type === 'experience') openExpModal(applicantId);
            else if(type === 'eligibility') openEligModal(applicantId);
        }
    } catch(err) { console.error(err); }
}

async function openSummaryModal(id, name) {
    try {
        document.getElementById('summaryApplicantId').value = id;
        document.getElementById('summaryApplicantName').innerText = name;
        
        const data = await fetchDetails(id);
        
        const generateList = (items, typeName) => {
            if(!items || !items.length) return `<li class="list-group-item text-muted small">No ${typeName} records.</li>`;
            return items.map(item => {
                const badgeClass = item.status === 'QUALIFIED' ? 'bg-success' : item.status === 'DISQUALIFIED' ? 'bg-danger' : 'bg-warning text-dark';
                const docTitle = item.degree || item.title || item.details;
                return `<li class="list-group-item d-flex justify-content-between align-items-center small">
                    <span>${docTitle}</span>
                    <span class="badge ${badgeClass}">${item.status || 'PENDING'}</span>
                </li>`;
            }).join('');
        };
        
        let html = `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <h6 class="border-bottom pb-1">Education</h6>
                    <ul class="list-group list-group-flush">${generateList(data.education, 'education')}</ul>
                </div>
                <div class="col-md-6 mb-3">
                    <h6 class="border-bottom pb-1">Training</h6>
                    <ul class="list-group list-group-flush">${generateList(data.training, 'training')}</ul>
                </div>
                <div class="col-md-6 mb-3">
                    <h6 class="border-bottom pb-1">Experience</h6>
                    <ul class="list-group list-group-flush">${generateList(data.experience, 'experience')}</ul>
                </div>
                <div class="col-md-6 mb-3">
                    <h6 class="border-bottom pb-1">Eligibility</h6>
                    <ul class="list-group list-group-flush">${generateList(data.eligibility, 'eligibility')}</ul>
                </div>
            </div>
        `;
        document.getElementById('summaryDetails').innerHTML = html;
        
        const checkPending = (items) => {
            if(!items || !items.length) return false;
            return items.some(item => !item.status || item.status === 'PENDING');
        };
        const hasPending = checkPending(data.education) || checkPending(data.training) || checkPending(data.experience) || checkPending(data.eligibility);
        
        const sumQualifyBtn = document.getElementById('summaryQualifyBtn');
        if (sumQualifyBtn) {
            sumQualifyBtn.disabled = hasPending;
            if (hasPending) {
                sumQualifyBtn.title = "All documents must be evaluated first";
                sumQualifyBtn.innerHTML = '<i class="bi bi-lock-fill me-1"></i> Assess all docs to Qualify';
            } else {
                sumQualifyBtn.title = "";
                sumQualifyBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i> Qualify & Move to Step 2';
            }
        }

        bootstrap.Modal.getOrCreateInstance(document.getElementById('summaryModal')).show();
    } catch(err) { console.error(err); }
}

async function openExpModal(id, isWizard = false) {
    try {
        window.currentDocApplicantId = id;
        document.getElementById('expModalTitle').innerText = isWizard ? 'New Applicant Wizard - Work Experience' : 'Work Experience';
        const data = await fetchDetails(id);
        const exp = data.experience;
        
        setFloatingStandard('expModal', data.positionStandards ? data.positionStandards.qsExperience : null);
        
        let html = '<ul class="list-group mb-3">';
        if(exp.length) {
            exp.forEach(e => {
                const docLink = e.digitalCopyLink || e.link;
                html += `<li class="list-group-item d-flex justify-content-between align-items-center">
                    <span><strong>${e.details}</strong> (${e.years} years)
                    ${docLink ? `<br><a href="${docLink}" target="_blank" class="text-primary text-decoration-none small"><i class="bi bi-link-45deg"></i> View Certificate</a>` : ''}
                    <br><span class="badge ${e.status === 'QUALIFIED' ? 'bg-success' : e.status === 'DISQUALIFIED' ? 'bg-danger' : 'bg-warning text-dark'}">${e.status || 'PENDING'}</span>
                    </span>
                    <div class="btn-group">
                        <button type="button" class="btn btn-sm btn-success ${e.status === 'QUALIFIED' ? 'disabled' : ''}" onclick="updateDocStatus('experience', ${id}, ${e.id}, 'QUALIFIED')"><i class="bi bi-check-circle"></i></button>
                        <button type="button" class="btn btn-sm btn-warning ${e.status === 'DISQUALIFIED' ? 'disabled' : ''}" onclick="updateDocStatus('experience', ${id}, ${e.id}, 'DISQUALIFIED')"><i class="bi bi-x-circle"></i></button>
                        <button type="button" class="btn btn-sm btn-danger" onclick="deleteRecord('experience', ${e.id}, ${id}, 'exp')"><i class="bi bi-trash"></i></button>
                    </div>
                </li>`;
            });
        } else html += '<li class="list-group-item text-muted">No experience records found.</li>';
        html += '</ul>';
        html += `
            <form id="addExp-${id}" class="mb-3">
                <div class="d-flex gap-2 w-100">
                    <input type="text" class="form-control" name="details" placeholder="Details" style="flex: 4;" required>
                    <input type="number" class="form-control" name="years" placeholder="Yrs" style="flex: 1;" required>
                </div>
                <button type="submit" class="btn btn-success w-100 mt-2">Add Experience</button>
            </form>
        `;
        if (isWizard) {
            html += `<div class="d-flex justify-content-end mt-3 pt-3 border-top"><button type="button" class="btn btn-primary" onclick="transitionModal('expModal', 'openEligModal', ${id})">Next: Eligibility <i class="bi bi-arrow-right"></i></button></div>`;
        }
        document.getElementById('expModalBody').innerHTML = html;
        
        document.getElementById(`addExp-${id}`).addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const res = await fetch(`/api/applicants/${id}/experience`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ details: e.target.details.value, years: e.target.years.value })
                });
                if(res.ok) openExpModal(id, isWizard);
            } catch(err) { console.error(err); }
        });
        const expModalEl = document.getElementById('expModal');
        if (!expModalEl.classList.contains('show')) {
            bootstrap.Modal.getOrCreateInstance(expModalEl).show();
        }
    } catch (err) { alert(err.message); }
}

async function openEligModal(id, isWizard = false) {
    try {
        window.currentDocApplicantId = id;
        document.getElementById('eligModalTitle').innerText = isWizard ? 'New Applicant Wizard - Eligibility' : 'Eligibility';
        const data = await fetchDetails(id);
        const elig = data.eligibility;
        
        setFloatingStandard('eligModal', data.positionStandards ? data.positionStandards.qsEligibility : null);
        
        let html = '<ul class="list-group mb-3">';
        if(elig.length) {
            elig.forEach(e => {
                const docTitle = e.details || e.title;
                const docLink = e.digitalCopyLink || e.link;
                html += `<li class="list-group-item d-flex justify-content-between align-items-center">
                    <span><strong>${docTitle}</strong> (${e.rating})
                    ${docLink ? `<br><a href="${docLink}" target="_blank" class="text-primary text-decoration-none small"><i class="bi bi-link-45deg"></i> View Document</a>` : ''}
                    <br><span class="badge ${e.status === 'QUALIFIED' ? 'bg-success' : e.status === 'DISQUALIFIED' ? 'bg-danger' : 'bg-warning text-dark'}">${e.status || 'PENDING'}</span>
                    </span>
                    <div class="btn-group">
                        <button type="button" class="btn btn-sm btn-success ${e.status === 'QUALIFIED' ? 'disabled' : ''}" onclick="updateDocStatus('eligibility', ${id}, ${e.id}, 'QUALIFIED')"><i class="bi bi-check-circle"></i></button>
                        <button type="button" class="btn btn-sm btn-warning ${e.status === 'DISQUALIFIED' ? 'disabled' : ''}" onclick="updateDocStatus('eligibility', ${id}, ${e.id}, 'DISQUALIFIED')"><i class="bi bi-x-circle"></i></button>
                        <button type="button" class="btn btn-sm btn-danger" onclick="deleteRecord('eligibility', ${e.id}, ${id}, 'elig')"><i class="bi bi-trash"></i></button>
                    </div>
                </li>`;
            });
        } else html += '<li class="list-group-item text-muted">No eligibility records found.</li>';
        html += '</ul>';
        html += `
            <form id="addElig-${id}" class="mb-3">
                <div class="d-flex gap-2 w-100">
                    <input type="text" class="form-control" name="title" placeholder="License / Exam" style="flex: 4;" required>
                    <input type="text" class="form-control" name="rating" placeholder="Rating" style="flex: 1;" required>
                </div>
                <button type="submit" class="btn btn-success w-100 mt-2">Add Eligibility</button>
            </form>
        `;
        if (isWizard) {
            html += `<div class="d-flex justify-content-end mt-3 pt-3 border-top"><button type="button" class="btn btn-success" onclick="window.location.reload()">Finish Wizard <i class="bi bi-check-circle"></i></button></div>`;
        }
        document.getElementById('eligModalBody').innerHTML = html;
        
        document.getElementById(`addElig-${id}`).addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const res = await fetch(`/api/applicants/${id}/eligibility`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: e.target.title.value, rating: e.target.rating.value })
                });
                if(res.ok) openEligModal(id, isWizard);
            } catch(err) { console.error(err); }
        });
        const eligModalEl = document.getElementById('eligModal');
        if (!eligModalEl.classList.contains('show')) {
            bootstrap.Modal.getOrCreateInstance(eligModalEl).show();
        }
    } catch (err) { alert(err.message); }
}

async function updateDocStatus(type, applicantId, docId, status) {
    try {
        const res = await fetch(`/api/applicants/${applicantId}/${type}/${docId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if(res.ok) {
            if(type === 'education') openEduModal(applicantId);
            else if(type === 'training') openTrainModal(applicantId);
            else if(type === 'experience') openExpModal(applicantId);
            else if(type === 'eligibility') openEligModal(applicantId);
        }
    } catch(err) { console.error(err); }
}

async function openSummaryModal(id, name) {
    try {
        document.getElementById('summaryApplicantId').value = id;
        document.getElementById('summaryApplicantName').innerText = name;
        
        const data = await fetchDetails(id);
        
        const generateList = (items, typeName) => {
            if(!items || !items.length) return `<li class="list-group-item text-muted small">No ${typeName} records.</li>`;
            return items.map(item => {
                const badgeClass = item.status === 'QUALIFIED' ? 'bg-success' : item.status === 'DISQUALIFIED' ? 'bg-danger' : 'bg-warning text-dark';
                const docTitle = item.degree || item.title || item.details;
                return `<li class="list-group-item d-flex justify-content-between align-items-center small">
                    <span>${docTitle}</span>
                    <span class="badge ${badgeClass}">${item.status || 'PENDING'}</span>
                </li>`;
            }).join('');
        };
        
        let html = `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <h6 class="border-bottom pb-1">Education</h6>
                    <ul class="list-group list-group-flush">${generateList(data.education, 'education')}</ul>
                </div>
                <div class="col-md-6 mb-3">
                    <h6 class="border-bottom pb-1">Training</h6>
                    <ul class="list-group list-group-flush">${generateList(data.training, 'training')}</ul>
                </div>
                <div class="col-md-6 mb-3">
                    <h6 class="border-bottom pb-1">Experience</h6>
                    <ul class="list-group list-group-flush">${generateList(data.experience, 'experience')}</ul>
                </div>
                <div class="col-md-6 mb-3">
                    <h6 class="border-bottom pb-1">Eligibility</h6>
                    <ul class="list-group list-group-flush">${generateList(data.eligibility, 'eligibility')}</ul>
                </div>
            </div>
        `;
        document.getElementById('summaryDetails').innerHTML = html;
        
        const checkPending = (items) => {
            if(!items || !items.length) return false;
            return items.some(item => !item.status || item.status === 'PENDING');
        };
        const hasPending = checkPending(data.education) || checkPending(data.training) || checkPending(data.experience) || checkPending(data.eligibility);
        
        const sumQualifyBtn = document.getElementById('summaryQualifyBtn');
        if (sumQualifyBtn) {
            sumQualifyBtn.disabled = hasPending;
            if (hasPending) {
                sumQualifyBtn.title = "All documents must be evaluated first";
                sumQualifyBtn.innerHTML = '<i class="bi bi-lock-fill me-1"></i> Assess all docs to Qualify';
            } else {
                sumQualifyBtn.title = "";
                sumQualifyBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i> Qualify & Move to Step 2';
            }
        }

        bootstrap.Modal.getOrCreateInstance(document.getElementById('summaryModal')).show();
    } catch(err) { console.error(err); }
}

window.disqualifyFromSummary = () => {
    const id = document.getElementById('summaryApplicantId').value;
    const name = document.getElementById('summaryApplicantName').innerText;
    bootstrap.Modal.getInstance(document.getElementById('summaryModal')).hide();
    
    document.getElementById('summaryDisqualifyId').value = id;
    document.getElementById('summaryDisqualifyName').innerText = name;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('summaryDisqualifyModal')).show();
}

window.confirmSummaryDisqualify = () => {
    const id = document.getElementById('summaryDisqualifyId').value;
    fetch(`/api/applicants/${id}/disqualify`, { method: 'POST' })
        .then(res => res.ok ? window.location.reload() : alert('Error'))
        .catch(err => console.error(err));
}

document.addEventListener('DOMContentLoaded', () => {
    const sumQualifyBtn = document.getElementById('summaryQualifyBtn');
    if (sumQualifyBtn) {
        sumQualifyBtn.addEventListener('click', async () => {
            const id = document.getElementById('summaryApplicantId').value;
            const name = document.getElementById('summaryApplicantName').innerText;
            bootstrap.Modal.getOrCreateInstance(document.getElementById('summaryModal')).hide();
            openQualifyModal(id, name);
        });
    }

    const sumDisqualifyBtn = document.getElementById('summaryDisqualifyBtn');
    if (sumDisqualifyBtn) {
        sumDisqualifyBtn.addEventListener('click', () => {
            const id = document.getElementById('summaryApplicantId').value;
            bootstrap.Modal.getOrCreateInstance(document.getElementById('summaryModal')).hide();
            disqualifyApplicant(id);
        });
    }

    const updateRowRemarks = async () => {
        if (!window.currentDocApplicantId) return;
        try {
            const id = window.currentDocApplicantId;
            const data = await fetchDetails(id);
            
            const cell = document.getElementById(`remarks-cell-${id}`);
            if (cell && data.applicant.status === 'PENDING') {
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

// ==========================================
// ASSESSMENT & EDUCATION CALCULATOR
// ==========================================

let currentAssessmentId = null;

async function openAssessmentModal(id, name) {
    currentAssessmentId = id;
    document.getElementById('assessmentApplicantId').value = id;
    document.getElementById('assessmentApplicantName').innerText = name;
    
    // Fetch details to get SG and Category if possible
    try {
        const data = await fetchDetails(id);
        const app = data.applicant;
        
        const category = app.category || 'Non-Teaching';
        const sg = app.salaryGrade || '1'; 
        
        document.getElementById('assessmentCategory').innerText = category;
        document.getElementById('assessmentSG').innerText = `${sg}`;
        
        // Determine Category Key
        let categoryKey = 'SG 1-9';
        const sgNum = parseInt(sg.toString().replace('SG', '').trim()) || 1;
        if (category.toLowerCase().includes('general services') || sg.toString().toLowerCase().includes('general services')) {
            categoryKey = 'General';
        } else if (sgNum === 24) {
            categoryKey = 'SG 24';
        } else if ((sgNum >= 10 && sgNum <= 22) || sgNum === 27) {
            categoryKey = 'SG 10-22';
        } else {
            categoryKey = 'SG 1-9';
        }

        const maxPointsConfig = {
            'General': { education: 5, training: 5, experience: 20, performance: 10, outstandingAccomplishments: 5, applicationOfEducation: 0, applicationOfLD: 0, potential: 55 },
            'SG 1-9': { education: 5, training: 5, experience: 20, performance: 20, outstandingAccomplishments: 10, applicationOfEducation: 10, applicationOfLD: 10, potential: 20 },
            'SG 10-22': { education: 5, training: 10, experience: 15, performance: 20, outstandingAccomplishments: 10, applicationOfEducation: 10, applicationOfLD: 10, potential: 20 },
            'SG 24': { education: 10, training: 5, experience: 15, performance: 20, outstandingAccomplishments: 10, applicationOfEducation: 10, applicationOfLD: 10, potential: 20 }
        };

        const maxPoints = maxPointsConfig[categoryKey];
        const criteriaList = ['education', 'training', 'experience', 'performance', 'outstandingAccomplishments', 'applicationOfEducation', 'applicationOfLD', 'potential'];
        
        criteriaList.forEach(key => {
            const inputEl = document.querySelector(`[name="${key}"]`);
            const maxEl = document.getElementById(`max-${key}`);
            if (inputEl) {
                inputEl.max = maxPoints[key];
                if (maxPoints[key] === 0) {
                    inputEl.disabled = true;
                } else {
                    inputEl.disabled = false;
                }
            }
            if (maxEl) {
                maxEl.innerText = maxPoints[key];
            }
        });

        // If there are existing scores, populate them
        if (app.scores && app.scores.total !== null) {
            document.getElementById('educationInput').value = app.scores.education !== null ? app.scores.education : '';
            document.querySelector('[name="training"]').value = app.scores.training !== null ? app.scores.training : '';
            document.querySelector('[name="experience"]').value = app.scores.experience !== null ? app.scores.experience : '';
            document.querySelector('[name="performance"]').value = app.scores.performance !== null ? app.scores.performance : '';
            document.querySelector('[name="outstandingAccomplishments"]').value = app.scores.outstandingAccomplishments !== null ? app.scores.outstandingAccomplishments : '';
            document.querySelector('[name="applicationOfEducation"]').value = app.scores.applicationOfEducation !== null ? app.scores.applicationOfEducation : '';
            document.querySelector('[name="applicationOfLD"]').value = app.scores.applicationOfLD !== null ? app.scores.applicationOfLD : '';
            document.querySelector('[name="potential"]').value = app.scores.potential !== null ? app.scores.potential : '';
        } else {
            criteriaList.forEach(key => {
                const inputEl = document.querySelector(`[name="${key}"]`);
                if (inputEl && !inputEl.disabled) inputEl.value = '';
                if (inputEl && inputEl.disabled) inputEl.value = 0;
            });
        }
        
        if (typeof calculateAssessmentTotal === 'function') {
            calculateAssessmentTotal();
        }
    } catch(err) {
        console.error('Could not fetch details for assessment', err);
    }
    
    bootstrap.Modal.getOrCreateInstance(document.getElementById('assessmentModal')).show();
}

const assessmentForm = document.getElementById('assessmentForm');
if (assessmentForm) {
    assessmentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('assessmentApplicantId').value;
        const formData = new FormData(assessmentForm);
        const data = Object.fromEntries(formData.entries());
        
        let isComplete = true;
        const criteriaList = ['education', 'training', 'experience', 'performance', 'outstandingAccomplishments', 'applicationOfEducation', 'applicationOfLD', 'potential'];
        criteriaList.forEach(key => {
            const inputEl = document.querySelector(`[name="${key}"]`);
            if (inputEl && !inputEl.disabled && !data[key]) {
                isComplete = false;
            }
        });
        
        data.isComplete = isComplete;
        
        try {
            const res = await fetch(`/api/applicants/${id}/assess`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                window.location.reload();
            }
        } catch (err) {
            console.error(err);
            alert('Error saving assessment');
        }
    });
    
    // Add dynamic calculation for inputs
    const calculateAssessmentTotal = () => {
        let total = 0;
        const criteriaList = ['education', 'training', 'experience', 'performance', 'outstandingAccomplishments', 'applicationOfEducation', 'applicationOfLD', 'potential'];
        criteriaList.forEach(key => {
            const inputEl = document.querySelector(`[name="${key}"]`);
            if (inputEl && !inputEl.disabled) {
                const val = parseFloat(inputEl.value);
                if (!isNaN(val)) total += val;
            }
        });
        const totalEl = document.getElementById('assessmentTotalScore');
        if (totalEl) totalEl.innerText = total > 0 ? parseFloat(total.toFixed(2)) : 0;
    };

    const assessmentInputs = document.querySelectorAll('#assessmentForm input[type="number"]');
    assessmentInputs.forEach(input => {
        input.addEventListener('input', calculateAssessmentTotal);
    });
    
    // Make calculateAssessmentTotal globally available if needed
    window.calculateAssessmentTotal = calculateAssessmentTotal;
}

function openEduCalcModal() {
    bootstrap.Modal.getOrCreateInstance(document.getElementById('eduCalcModal')).show();
    calculateEduPoints();
}

function calculateEduPoints() {
    const appLevel = parseInt(document.getElementById('applicantEduLevel').value);
    const stdLevel = parseInt(document.getElementById('standardEduLevel').value);
    
    let finalInc = appLevel - stdLevel;
    if (finalInc < 0) finalInc = 0;
    
    document.getElementById('finalIncrementLevel').innerText = finalInc;
    
    const sgText = document.getElementById('assessmentSG').innerText.replace('SG', '').trim();
    const sgNum = parseInt(sgText);
    const categoryText = document.getElementById('assessmentCategory').innerText;
    
    let categoryKey = 'SG 1-9'; // Default
    if (categoryText.toLowerCase().includes('general services') || sgText.toLowerCase().includes('general services')) {
        categoryKey = 'General';
    } else if (sgNum === 24) {
        categoryKey = 'SG 24';
    } else if ((sgNum >= 10 && sgNum <= 22) || sgNum === 27) {
        categoryKey = 'SG 10-22';
    } else {
        categoryKey = 'SG 1-9';
    }

    let points = 0;
    
    if (categoryKey === 'General') {
        if (finalInc >= 5) points = 5;
        else if (finalInc === 4) points = 4;
        else if (finalInc === 3) points = 3;
        else if (finalInc === 2) points = 2;
        else if (finalInc === 1) points = 1;
        else points = 0;
    } else if (categoryKey === 'SG 1-9') {
        if (finalInc >= 10) points = 5;
        else if (finalInc >= 8) points = 4;
        else if (finalInc >= 6) points = 3;
        else if (finalInc >= 4) points = 2;
        else if (finalInc >= 1) points = 1;
        else points = 0;
    } else if (categoryKey === 'SG 10-22') {
        if (finalInc >= 10) points = 5;
        else if (finalInc >= 8) points = 4;
        else if (finalInc >= 6) points = 3;
        else if (finalInc >= 4) points = 2;
        else if (finalInc >= 2) points = 1;
        else points = 0; 
    } else if (categoryKey === 'SG 24') {
        if (finalInc >= 10) points = 10;
        else if (finalInc === 9) points = 8;
        else if (finalInc === 8) points = 6;
        else if (finalInc >= 6) points = 4;
        else if (finalInc >= 4) points = 2;
        else points = 0;
    }

    document.getElementById('calculatedEduPoints').innerText = points;
}

function applyEduPoints() {
    const points = document.getElementById('calculatedEduPoints').innerText;
    document.getElementById('educationInput').value = points;
    bootstrap.Modal.getInstance(document.getElementById('eduCalcModal')).hide();
}

function openTrainCalcModal() {
    bootstrap.Modal.getOrCreateInstance(document.getElementById('trainCalcModal')).show();
    calculateTrainPoints();
}

function calculateTrainPoints() {
    const appLevel = parseInt(document.getElementById('applicantTrainLevel').value);
    const stdLevel = parseInt(document.getElementById('standardTrainLevel').value);
    
    let finalInc = appLevel - stdLevel;
    if (finalInc < 0) finalInc = 0;
    
    document.getElementById('finalTrainIncrementLevel').innerText = finalInc;
    
    const sgText = document.getElementById('assessmentSG').innerText.replace('SG', '').trim();
    const sgNum = parseInt(sgText);
    const categoryText = document.getElementById('assessmentCategory').innerText;
    
    let categoryKey = 'SG 1-9'; // Default
    if (categoryText.toLowerCase().includes('general services') || sgText.toLowerCase().includes('general services')) {
        categoryKey = 'General';
    } else if (sgNum === 24) {
        categoryKey = 'SG 24';
    } else if ((sgNum >= 10 && sgNum <= 22) || sgNum === 27) {
        categoryKey = 'SG 10-22';
    } else {
        categoryKey = 'SG 1-9';
    }

    let points = 0;
    
    if (categoryKey === 'General' || categoryKey === 'SG 1-9' || categoryKey === 'SG 24') {
        if (finalInc >= 5) points = 5;
        else if (finalInc === 4) points = 4;
        else if (finalInc === 3) points = 3;
        else if (finalInc === 2) points = 2;
        else if (finalInc === 1) points = 1;
        else points = 0;
    } else if (categoryKey === 'SG 10-22') {
        if (finalInc >= 5) points = 10;
        else if (finalInc === 4) points = 8;
        else if (finalInc === 3) points = 6;
        else if (finalInc === 2) points = 4;
        else if (finalInc === 1) points = 2;
        else points = 0;
    }

    document.getElementById('calculatedTrainPoints').innerText = points;
}

function applyTrainPoints() {
    const points = document.getElementById('calculatedTrainPoints').innerText;
    document.getElementById('trainingInput').value = points;
    bootstrap.Modal.getInstance(document.getElementById('trainCalcModal')).hide();
}

function openExpCalcModal() {
    bootstrap.Modal.getOrCreateInstance(document.getElementById('expCalcModal')).show();
    calculateExpPoints();
}

function calculateExpPoints() {
    const appLevel = parseInt(document.getElementById('applicantExpLevel').value);
    const stdLevel = parseInt(document.getElementById('standardExpLevel').value);
    
    let finalInc = appLevel - stdLevel;
    if (finalInc < 0) finalInc = 0;
    
    document.getElementById('finalExpIncrementLevel').innerText = finalInc;
    
    const sgText = document.getElementById('assessmentSG').innerText.replace('SG', '').trim();
    const sgNum = parseInt(sgText);
    const categoryText = document.getElementById('assessmentCategory').innerText;
    
    let categoryKey = 'SG 1-9'; // Default
    if (categoryText.toLowerCase().includes('general services') || sgText.toLowerCase().includes('general services')) {
        categoryKey = 'General';
    } else if (sgNum === 24) {
        categoryKey = 'SG 24';
    } else if ((sgNum >= 10 && sgNum <= 22) || sgNum === 27) {
        categoryKey = 'SG 10-22';
    } else {
        categoryKey = 'SG 1-9';
    }

    let points = 0;
    
    if (categoryKey === 'General' || categoryKey === 'SG 1-9') {
        if (finalInc >= 10) points = 20;
        else if (finalInc >= 8) points = 16;
        else if (finalInc >= 6) points = 12;
        else if (finalInc >= 4) points = 8;
        else if (finalInc >= 2) points = 4;
        else points = 0;
    } else if (categoryKey === 'SG 10-22' || categoryKey === 'SG 24') {
        if (finalInc >= 10) points = 15;
        else if (finalInc >= 8) points = 12;
        else if (finalInc >= 6) points = 9;
        else if (finalInc >= 4) points = 6;
        else if (finalInc >= 2) points = 3;
        else points = 0;
    }

    document.getElementById('calculatedExpPoints').innerText = points;
}

function applyExpPoints() {
    const points = document.getElementById('calculatedExpPoints').innerText;
    document.getElementById('experienceInput').value = points;
    bootstrap.Modal.getInstance(document.getElementById('expCalcModal')).hide();
}

function openPerfCalcModal() {
    bootstrap.Modal.getOrCreateInstance(document.getElementById('perfCalcModal')).show();
    togglePerfInputs();
    calculatePerfPoints();
}

function togglePerfInputs() {
    const method = document.getElementById('perfEvalMethod').value;
    const ratingDiv = document.getElementById('perfRatingDiv');
    const inputEl = document.getElementById('perfRatingInput');
    const labelEl = document.getElementById('perfRatingLabel');
    const helpEl = document.getElementById('perfRatingHelp');
    const helperDiv = document.getElementById('midpointHelperDiv');
    
    if (method === 'rpms') {
        ratingDiv.classList.remove('d-none');
        inputEl.max = 5;
        inputEl.step = '0.001';
        labelEl.innerText = 'Rating (x) [Max 5]';
        helpEl.innerText = 'Enter RPMS rating (0-5) or midpoint value.';
        helperDiv.classList.remove('d-none');
    } else if (method === 'gwa') {
        ratingDiv.classList.remove('d-none');
        inputEl.max = 100;
        inputEl.step = '0.01';
        labelEl.innerText = 'Rating (x) [Percentage]';
        helpEl.innerText = 'Enter Board Exam, CS Eligibility, or GWA in percentage (0-100).';
        helperDiv.classList.add('d-none');
    } else {
        // Honor graduate options
        ratingDiv.classList.add('d-none');
    }
}

function applyMidpoint() {
    const helperVal = document.getElementById('perfMidpointHelper').value;
    if (helperVal) {
        document.getElementById('perfRatingInput').value = helperVal;
        calculatePerfPoints();
    }
}

function calculatePerfPoints() {
    const method = document.getElementById('perfEvalMethod').value;
    const categoryText = document.getElementById('assessmentCategory').innerText;
    const sgText = document.getElementById('assessmentSG').innerText.replace('SG', '').trim();
    const isGeneral = categoryText.toLowerCase().includes('general services') || sgText.toLowerCase().includes('general services');
    
    const wa = isGeneral ? 10 : 20;
    document.getElementById('perfWA').innerText = wa;
    
    let points = 0;
    
    if (method === 'summa') {
        points = 20;
    } else if (method === 'magna') {
        points = 19;
    } else if (method === 'cum') {
        points = 18;
    } else {
        let x = parseFloat(document.getElementById('perfRatingInput').value) || 0;
        
        if (method === 'rpms') {
            points = (x / 5) * wa;
        } else if (method === 'gwa') {
            points = (x / 100) * wa;
        }
    }
    
    // Round to 3 decimal places max
    points = Math.round(points * 1000) / 1000;
    
    document.getElementById('calculatedPerfPoints').innerText = points;
}

function applyPerfPoints() {
    const points = document.getElementById('calculatedPerfPoints').innerText;
    document.getElementById('performanceInput').value = points;
    bootstrap.Modal.getInstance(document.getElementById('perfCalcModal')).hide();
    
    // trigger assessment total calculation
    if(typeof calculateAssessmentTotal === 'function') calculateAssessmentTotal();
}

function openOutAccCalcModal() {
    bootstrap.Modal.getOrCreateInstance(document.getElementById('outAccCalcModal')).show();
    calculateOutAccPoints();
}

function calculateOutAccPoints() {
    const categoryText = document.getElementById('assessmentCategory').innerText;
    const sgText = document.getElementById('assessmentSG').innerText.replace('SG', '').trim();
    const isGeneral = categoryText.toLowerCase().includes('general services') || sgText.toLowerCase().includes('general services');
    
    // "five (5) points for General Services positions and 10 points for other groups"
    const maxPoints = isGeneral ? 5 : 10;
    document.getElementById('outAccMax').innerText = maxPoints;

    const isNational = document.getElementById('outAccNational').checked;
    const compDiv = document.getElementById('outAccComponentsDiv');
    
    if (isNational) {
        compDiv.style.opacity = '0.5';
        compDiv.style.pointerEvents = 'none';
        document.getElementById('outAccSum').innerText = 'N/A';
        document.getElementById('calculatedOutAccPoints').innerText = maxPoints;
        return;
    } else {
        compDiv.style.opacity = '1';
        compDiv.style.pointerEvents = 'auto';
    }

    const awardPts = parseFloat(document.getElementById('outAccAward').value) || 0;
    const researchPts = parseFloat(document.getElementById('outAccResearch').value) || 0;
    const smePts = parseFloat(document.getElementById('outAccSME').value) || 0;
    const speakerPts = parseFloat(document.getElementById('outAccSpeaker').value) || 0;
    const neapPts = parseFloat(document.getElementById('outAccNEAP').value) || 0;

    let sum = awardPts + researchPts + smePts + speakerPts + neapPts;
    document.getElementById('outAccSum').innerText = sum;
    
    let finalPoints = sum > maxPoints ? maxPoints : sum;
    document.getElementById('calculatedOutAccPoints').innerText = finalPoints;
}

function applyOutAccPoints() {
    const points = document.getElementById('calculatedOutAccPoints').innerText;
    document.getElementById('outstandingAccomplishmentsInput').value = points;
    bootstrap.Modal.getInstance(document.getElementById('outAccCalcModal')).hide();
    
    if(typeof calculateAssessmentTotal === 'function') calculateAssessmentTotal();
}

function openAppEduCalcModal() {
    bootstrap.Modal.getOrCreateInstance(document.getElementById('appEduCalcModal')).show();
    toggleAppEduInputs();
    calculateAppEduPoints();
}

function toggleAppEduInputs() {
    const method = document.getElementById('appEduEvalMethod').value;
    const movsDiv = document.getElementById('appEduMOVsDiv');
    const gwaDiv = document.getElementById('appEduGWADiv');
    
    if (method === 'no_exp') {
        movsDiv.classList.add('d-none');
        gwaDiv.classList.remove('d-none');
    } else {
        movsDiv.classList.remove('d-none');
        gwaDiv.classList.add('d-none');
    }
}

function calculateAppEduPoints() {
    const method = document.getElementById('appEduEvalMethod').value;
    let points = 0;
    
    if (method === 'relevant') {
        const movs = document.getElementById('appEduMOVs').value;
        if (movs === 'ABC') points = 10;
        else if (movs === 'AB') points = 7;
        else if (movs === 'A') points = 5;
    } else if (method === 'not_relevant') {
        const movs = document.getElementById('appEduMOVs').value;
        if (movs === 'ABC') points = 5;
        else if (movs === 'AB') points = 3;
        else if (movs === 'A') points = 1;
    } else if (method === 'no_exp') {
        const x = parseFloat(document.getElementById('appEduGWAInput').value) || 0;
        // As per docs: Weight allocation for Application of Education is usually 10 points
        const wa = 10; 
        points = (x / 100) * wa;
    }
    
    // round to 3 decimal places
    points = Math.round(points * 1000) / 1000;
    document.getElementById('calculatedAppEduPoints').innerText = points;
}

function applyAppEduPoints() {
    const points = document.getElementById('calculatedAppEduPoints').innerText;
    document.getElementById('appEduInput').value = points;
    bootstrap.Modal.getInstance(document.getElementById('appEduCalcModal')).hide();
    
    if(typeof calculateAssessmentTotal === 'function') calculateAssessmentTotal();
}

function openAppLNDCalcModal() {
    bootstrap.Modal.getOrCreateInstance(document.getElementById('appLNDCalcModal')).show();
    calculateAppLNDPoints();
}

function calculateAppLNDPoints() {
    const relevance = document.getElementById('appLNDRelevance').value;
    const movs = document.getElementById('appLNDMOVs').value;
    let points = 0;
    
    if (relevance === 'relevant') {
        if (movs === 'ABCD') points = 10;
        else if (movs === 'ABC') points = 7;
        else if (movs === 'AB') points = 5;
    } else if (relevance === 'not_relevant') {
        if (movs === 'ABCD') points = 5;
        else if (movs === 'ABC') points = 3;
        else if (movs === 'AB') points = 1;
    }
    
    document.getElementById('calculatedAppLNDPoints').innerText = points;
}

function applyAppLNDPoints() {
    const points = document.getElementById('calculatedAppLNDPoints').innerText;
    document.getElementById('appLNDInput').value = points;
    bootstrap.Modal.getInstance(document.getElementById('appLNDCalcModal')).hide();
    
    if(typeof calculateAssessmentTotal === 'function') calculateAssessmentTotal();
}

function openPotentialCalcModal() {
    bootstrap.Modal.getOrCreateInstance(document.getElementById('potentialCalcModal')).show();
    
    const categoryText = document.getElementById('assessmentCategory').innerText;
    const sgText = document.getElementById('assessmentSG').innerText.replace('SG', '').trim();
    const isGeneral = categoryText.toLowerCase().includes('general services') || sgText.toLowerCase().includes('general services');
    
    if (isGeneral) {
        document.getElementById('potentialGeneralDiv').classList.remove('d-none');
        document.getElementById('potentialOtherDiv').classList.add('d-none');
    } else {
        document.getElementById('potentialGeneralDiv').classList.add('d-none');
        document.getElementById('potentialOtherDiv').classList.remove('d-none');
    }
    
    calculatePotentialPoints();
}

function calculatePotentialPoints() {
    const categoryText = document.getElementById('assessmentCategory').innerText;
    const sgText = document.getElementById('assessmentSG').innerText.replace('SG', '').trim();
    const isGeneral = categoryText.toLowerCase().includes('general services') || sgText.toLowerCase().includes('general services');
    
    let totalPoints = 0;
    
    if (isGeneral) {
        totalPoints = parseFloat(document.getElementById('potGeneralInput').value) || 0;
        if (totalPoints > 55) totalPoints = 55;
    } else {
        const weVal = parseFloat(document.getElementById('potWEInput').value) || 0;
        const swstVal = parseFloat(document.getElementById('potSWSTInput').value) || 0;
        const beiVal = parseFloat(document.getElementById('potBEIInput').value) || 0;
        
        const wePts = (weVal / 100) * 5;
        const swstPts = (swstVal / 100) * 10;
        let finalBeiPts = beiVal > 5 ? 5 : beiVal;
        
        totalPoints = wePts + swstPts + finalBeiPts;
        if (totalPoints > 20) totalPoints = 20;
    }
    
    totalPoints = Math.round(totalPoints * 1000) / 1000;
    document.getElementById('calculatedPotentialPoints').innerText = totalPoints;
}

function applyPotentialPoints() {
    const points = document.getElementById('calculatedPotentialPoints').innerText;
    document.getElementById('potentialInput').value = points;
    bootstrap.Modal.getInstance(document.getElementById('potentialCalcModal')).hide();
    
    if(typeof calculateAssessmentTotal === 'function') calculateAssessmentTotal();
}

async function openStep2SummaryModal(id, name, isReadOnly = false) {
    document.getElementById('step2SummaryApplicantId').value = id;
    document.getElementById('step2SummaryApplicantName').innerText = name;
    
    const submitBtnDiv = document.getElementById('step2SummarySubmitBtnDiv');
    if (submitBtnDiv) {
        if (isReadOnly) {
            submitBtnDiv.classList.add('d-none');
        } else {
            submitBtnDiv.classList.remove('d-none');
        }
    }

    const detailsDiv = document.getElementById('step2SummaryDetails');
    detailsDiv.innerHTML = '<div class="text-center"><div class="spinner-border text-primary"></div></div>';
    
    bootstrap.Modal.getOrCreateInstance(document.getElementById('step2SummaryModal')).show();

    try {
        const data = await fetchDetails(id);
        const app = data.applicant;
        
        let html = `
            <div class="row g-3">
                <div class="col-md-6"><strong>Position:</strong> ${app.position || 'N/A'}</div>
                <div class="col-md-6"><strong>Category:</strong> ${app.category || 'N/A'}</div>
            </div>
            <h6 class="mt-4 mb-3 fw-bold text-secondary border-bottom pb-2">Evaluation Assessment Summary</h6>
            <div class="table-responsive">
                <table class="table table-sm table-bordered mt-2">
                    <thead class="table-light">
                        <tr>
                            <th>Criteria</th>
                            <th class="text-center">Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>a. Education</td><td class="text-center">${app.scores?.education != null ? app.scores.education : '-'}</td></tr>
                        <tr><td>b. Training</td><td class="text-center">${app.scores?.training != null ? app.scores.training : '-'}</td></tr>
                        <tr><td>c. Experience</td><td class="text-center">${app.scores?.experience != null ? app.scores.experience : '-'}</td></tr>
                        <tr><td>d. Performance</td><td class="text-center">${app.scores?.performance != null ? app.scores.performance : '-'}</td></tr>
                        <tr><td>e. Outstanding Accomplishments</td><td class="text-center">${app.scores?.outstandingAccomplishments != null ? app.scores.outstandingAccomplishments : '-'}</td></tr>
                        <tr><td>f. Application of Education</td><td class="text-center">${app.scores?.applicationOfEducation != null ? app.scores.applicationOfEducation : '-'}</td></tr>
                        <tr><td>g. Application of L&D</td><td class="text-center">${app.scores?.applicationOfLD != null ? app.scores.applicationOfLD : '-'}</td></tr>
                        <tr><td>h. Potential</td><td class="text-center">${app.scores?.potential != null ? app.scores.potential : '-'}</td></tr>
                        <tr class="table-active fw-bold"><td>Evaluation Assessment Total</td><td class="text-center text-primary fs-5">${app.scores?.total != null ? app.scores.total : '-'}</td></tr>
                    </tbody>
                </table>
            </div>
        `;
        detailsDiv.innerHTML = html;
        
    } catch (err) {
        detailsDiv.innerHTML = '<div class="alert alert-danger">Error loading applicant details.</div>';
    }
}

const step2SummaryForm = document.getElementById('step2SummaryForm');
if (step2SummaryForm) {
    step2SummaryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('step2SummaryApplicantId').value;
        
        try {
            const res = await fetch(`/api/applicants/${id}/score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            if (res.ok) {
                window.location.reload();
            }
        } catch (err) {
            console.error(err);
            alert('Error submitting score');
        }
    });
}

// Move modals to body to fix stacking context issues
document.addEventListener('DOMContentLoaded', function() { document.querySelectorAll('.modal').forEach(function(m) { document.body.appendChild(m); }); });
