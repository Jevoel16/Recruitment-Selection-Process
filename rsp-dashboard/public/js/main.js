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

async function proceedToRequirements(id) {
    try {
        const res = await fetch(`/api/applicants/${id}/proceed-requirements`, { method: 'POST' });
        if (res.ok) window.location.reload();
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

async function openEduModal(id, isWizard = false) {
    try {
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
        
        bootstrap.Modal.getOrCreateInstance(document.getElementById('summaryModal')).show();
    } catch(err) { console.error(err); }
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
});

// Move modals to body to fix stacking context issues
document.addEventListener('DOMContentLoaded', function() { document.querySelectorAll('.modal').forEach(function(m) { document.body.appendChild(m); }); });
