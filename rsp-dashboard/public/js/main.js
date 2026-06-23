// DOM Elements
const addApplicantForm = document.getElementById('addApplicantForm');
const qualifyForm = document.getElementById('qualifyForm');
const scoreForm = document.getElementById('scoreForm');

const TABLE_PAGE_SIZE = 10;
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

function getPaginationContainer(tableId) {
    return document.querySelector(`[data-pagination-for="${tableId}"]`);
}

function getPaginatedRows(table) {
    return Array.from(table.querySelectorAll('tbody tr')).filter((row) => {
        return !(row.cells.length === 1 && row.cells[0].hasAttribute('colspan'));
    });
}

function getVisibleRows(rows) {
    return rows.filter((row) => row.style.display !== 'none');
}

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

function getPaginationPages(totalPages, currentPage) {
    if (totalPages <= 5) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = [1];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    if (start > 2) pages.push('ellipsis-start');

    for (let page = start; page <= end; page++) {
        pages.push(page);
    }

    if (end < totalPages - 1) pages.push('ellipsis-end');

    pages.push(totalPages);
    return pages;
}

function renderTablePagination(tableId, requestedPage = 1) {
    const table = document.getElementById(tableId);
    const paginationContainer = getPaginationContainer(tableId);
    if (!table || !paginationContainer) return;

    const rows = getPaginatedRows(table);
    const eligibleRows = rows.filter((row) => row.dataset.matchesSearch !== 'false');

    const totalPages = Math.max(1, Math.ceil(eligibleRows.length / TABLE_PAGE_SIZE));
    const currentPage = Math.min(Math.max(requestedPage, 1), totalPages);

    rows.forEach((row) => {
        const rowIndex = eligibleRows.indexOf(row);
        const shouldShow = rowIndex !== -1 && Math.floor(rowIndex / TABLE_PAGE_SIZE) + 1 === currentPage;
        row.style.display = shouldShow ? '' : 'none';
    });

    paginationContainer.innerHTML = '';

    if (eligibleRows.length <= TABLE_PAGE_SIZE) {
        paginationContainer.classList.add('d-none');
        return;
    }

    paginationContainer.classList.remove('d-none');

    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', `${tableId} pagination`);
    const list = document.createElement('ul');
    list.className = 'pagination pagination-sm flex-wrap justify-content-center mb-0';

    const createPageItem = (label, page, options = {}) => {
        const item = document.createElement('li');
        item.className = `page-item${options.active ? ' active' : ''}${options.disabled ? ' disabled' : ''}`;

        if (options.ellipsis) {
            const span = document.createElement('span');
            span.className = 'page-link';
            span.textContent = label;
            item.appendChild(span);
            return item;
        }

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'page-link';
        button.textContent = label;
        button.disabled = options.active;
        button.addEventListener('click', () => renderTablePagination(tableId, page));
        item.appendChild(button);
        return item;
    };

    const pages = getPaginationPages(totalPages, currentPage);
    pages.forEach((page) => {
        if (page === 'ellipsis-start' || page === 'ellipsis-end') {
            list.appendChild(createPageItem('...', null, { ellipsis: true, disabled: true }));
            return;
        }
        list.appendChild(createPageItem(String(page), page, { active: page === currentPage }));
    });

    nav.appendChild(list);
    paginationContainer.appendChild(nav);
}

function initTablePagination() {
    ['table-step1', 'table-step2', 'table-step3', 'table-step4', 'table-step5'].forEach((tableId) => {
        renderTablePagination(tableId, 1);
    });
}

document.addEventListener('DOMContentLoaded', initTablePagination);

// Wizard Navigation
function nextWizardStep(step) {
    if (step === 1) {
        if (!document.getElementById('applicantDistrict').value) return alert('Please select a district.');
        document.getElementById('wizardStep1').classList.add('d-none');
        document.getElementById('wizardStep2').classList.remove('d-none');
    } else if (step === 2) {
        if (!document.getElementById('applicantCategory').value) return alert('Please select a category.');
        document.getElementById('wizardStep2').classList.add('d-none');
        document.getElementById('wizardStep3').classList.remove('d-none');
    }
}

function prevWizardStep(step) {
    if (step === 2) {
        document.getElementById('wizardStep2').classList.add('d-none');
        document.getElementById('wizardStep1').classList.remove('d-none');
    } else if (step === 3) {
        document.getElementById('wizardStep3').classList.add('d-none');
        document.getElementById('wizardStep2').classList.remove('d-none');
    }
}

// Add Applicant via Wizard
if (addApplicantForm) {
    addApplicantForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const district = document.getElementById('applicantDistrict').value;
        const category = document.getElementById('applicantCategory').value;
        const firstName = document.getElementById('applicantFirstName').value;
        const lastName = document.getElementById('applicantLastName').value;
        
        try {
            const res = await fetch('/api/applicants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, district, category })
            });
            if (res.ok) window.location.reload();
        } catch (err) {
            console.error(err);
            alert('Error adding applicant');
        }
    });
}

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
    // Set default date to today
    document.getElementById('interviewDate').value = new Date().toISOString().split('T')[0];
    new bootstrap.Modal(document.getElementById('qualifyModal')).show();
}

// Submit Qualify
if (qualifyForm) {
    qualifyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('qualifyId').value;
        const interviewDate = document.getElementById('interviewDate').value;
        
        try {
            const res = await fetch(`/api/applicants/${id}/qualify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ interviewDate })
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

// Generate PDF Letter
function printLetter(name, office, dateStr) {
    // Populate the print container
    document.getElementById('printName').innerText = name;
    document.getElementById('printOffice').innerText = office;
    
    // Format Date neatly
    const d = dateStr ? new Date(dateStr) : new Date();
    const formattedDate = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('printDate').innerText = 'Date: ' + formattedDate;
    
    // Clone the element for PDF generation so it doesn't flash on screen
    const element = document.querySelector('.print-container').cloneNode(true);
    element.classList.remove('d-none');
    element.classList.remove('d-print-block');
    element.style.display = 'block';
    
    // Set up html2pdf options
    const opt = {
        margin:       [20, 18, 20, 20],
        filename:     `${name.replace(/\s+/g, '_')}_assignment_order.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Generate and download PDF
    html2pdf().set(opt).from(element).save();
}

// Search Filter Logic
function filterTable(input, tableId) {
    const filter = input.value.toLowerCase();
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const trs = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');

    for (let i = 0; i < trs.length; i++) {
        if (trs[i].cells.length === 1 && trs[i].cells[0].hasAttribute('colspan')) {
            continue;
        }
        const rowText = trs[i].textContent.toLowerCase();
        if (rowText.includes(filter)) {
            trs[i].dataset.matchesSearch = 'true';
            trs[i].style.display = '';
        } else {
            trs[i].dataset.matchesSearch = 'false';
            trs[i].style.display = 'none';
        }
    }

    renderTablePagination(tableId, 1);
}

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

async function setAllRequirements(id) {
    try {
        const res = await fetch(`/api/applicants/${id}/requirements/all`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: true })
        });

        if (res.ok) {
            openRequirementsModal(id, true);
        }
    } catch (err) {
        console.error(err);
        alert('Unable to mark all requirements as complete.');
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

        document.getElementById('requirementsModalBody').innerHTML = `
            <input type="hidden" id="requirementsApplicantId" value="${id}">
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                <div>
                    <h6 class="mb-1">${app.name}</h6>
                    <div class="text-muted small">Toggle each checkbox to save it immediately.</div>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <span id="requirements-overall-status" class="badge ${isComplete ? 'bg-success' : 'bg-warning text-dark'}">${isComplete ? 'Complete' : 'Incomplete'}</span>
                    <button type="button" class="btn btn-success btn-sm" onclick="setAllRequirements(${id})">
                        <i class="bi bi-check2-square"></i> Check All Requirements
                    </button>
                </div>
            </div>
            <div class="row g-3">
                ${itemsHtml}
            </div>
        `;

        syncRequirementsSummary(app);
        bootstrap.Modal.getOrCreateInstance(document.getElementById('requirementsModal')).show();
    } catch (err) {
        console.error(err);
        alert('Failed to load requirements.');
    }
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
                        <input type="text" class="form-control" name="contactNo" value="${app.contactNo || ''}">
                    </div>
                </div>
                <button type="submit" class="btn btn-primary w-100 mt-4">Save Information</button>
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
        
        bootstrap.Modal.getOrCreateInstance(document.getElementById('infoModal')).show();
    } catch (err) { alert(err.message); }
}

async function openEduModal(id) {
    try {
        const data = await fetchDetails(id);
        const edu = data.education;
        let html = '<ul class="list-group mb-3">';
        if(edu.length) {
            edu.forEach(e => {
                html += `<li class="list-group-item d-flex justify-content-between align-items-center">
                    <a href="${e.digitalCopyLink}" target="_blank">${e.digitalCopyLink}</a>
                    <button type="button" class="btn btn-sm btn-danger" onclick="deleteRecord('education', ${e.id}, ${id}, 'edu')"><i class="bi bi-trash"></i></button>
                </li>`;
            });
        } else html += '<li class="list-group-item text-muted">No education records found.</li>';
        html += '</ul>';
        html += `
            <form id="addEdu-${id}" class="d-flex gap-2">
                <input type="url" class="form-control" name="link" placeholder="https://link-to-document" required>
                <button type="submit" class="btn btn-success">Add</button>
            </form>
        `;
        document.getElementById('eduModalBody').innerHTML = html;
        
        document.getElementById(`addEdu-${id}`).addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const res = await fetch(`/api/applicants/${id}/education`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ link: e.target.link.value })
                });
                if(res.ok) openEduModal(id);
            } catch(err) { console.error(err); }
        });
        
        bootstrap.Modal.getOrCreateInstance(document.getElementById('eduModal')).show();
    } catch (err) { alert(err.message); }
}

async function openTrainModal(id) {
    try {
        const data = await fetchDetails(id);
        const train = data.training;
        let html = '<ul class="list-group mb-3">';
        if(train.length) {
            train.forEach(t => {
                html += `<li class="list-group-item d-flex justify-content-between align-items-center">
                    <span><strong>${t.title}</strong> (${t.hours} hours)</span>
                    <button type="button" class="btn btn-sm btn-danger" onclick="deleteRecord('training', ${t.id}, ${id}, 'train')"><i class="bi bi-trash"></i></button>
                </li>`;
            });
        } else html += '<li class="list-group-item text-muted">No training seminars found.</li>';
        html += '</ul>';
        html += `
            <form id="addTrain-${id}" class="d-flex gap-2">
                <input type="text" class="form-control" name="title" placeholder="Title" required>
                <input type="number" class="form-control" name="hours" placeholder="Hrs" style="max-width: 80px;" required>
                <button type="submit" class="btn btn-success">Add</button>
            </form>
        `;
        document.getElementById('trainModalBody').innerHTML = html;
        
        document.getElementById(`addTrain-${id}`).addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const res = await fetch(`/api/applicants/${id}/training`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: e.target.title.value, hours: e.target.hours.value })
                });
                if(res.ok) openTrainModal(id);
            } catch(err) { console.error(err); }
        });
        
        bootstrap.Modal.getOrCreateInstance(document.getElementById('trainModal')).show();
    } catch (err) { alert(err.message); }
}

async function openExpModal(id) {
    try {
        const data = await fetchDetails(id);
        const exp = data.experience;
        let html = '<ul class="list-group mb-3">';
        if(exp.length) {
            exp.forEach(e => {
                html += `<li class="list-group-item d-flex justify-content-between align-items-center">
                    <span><strong>${e.details}</strong> (${e.years} years)</span>
                    <button type="button" class="btn btn-sm btn-danger" onclick="deleteRecord('experience', ${e.id}, ${id}, 'exp')"><i class="bi bi-trash"></i></button>
                </li>`;
            });
        } else html += '<li class="list-group-item text-muted">No experience records found.</li>';
        html += '</ul>';
        html += `
            <form id="addExp-${id}" class="d-flex gap-2">
                <input type="text" class="form-control" name="details" placeholder="Details" required>
                <input type="number" class="form-control" name="years" placeholder="Yrs" style="max-width: 80px;" required>
                <button type="submit" class="btn btn-success">Add</button>
            </form>
        `;
        document.getElementById('expModalBody').innerHTML = html;
        
        document.getElementById(`addExp-${id}`).addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const res = await fetch(`/api/applicants/${id}/experience`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ details: e.target.details.value, years: e.target.years.value })
                });
                if(res.ok) openExpModal(id);
            } catch(err) { console.error(err); }
        });
        
        bootstrap.Modal.getOrCreateInstance(document.getElementById('expModal')).show();
    } catch (err) { alert(err.message); }
}

async function openEligModal(id) {
    try {
        const data = await fetchDetails(id);
        const elig = data.eligibility;
        let html = '<ul class="list-group mb-3">';
        if(elig.length) {
            elig.forEach(e => {
                html += `<li class="list-group-item d-flex justify-content-between align-items-center">
                    <a href="${e.digitalCopyLink}" target="_blank">${e.digitalCopyLink}</a>
                    <button type="button" class="btn btn-sm btn-danger" onclick="deleteRecord('eligibility', ${e.id}, ${id}, 'elig')"><i class="bi bi-trash"></i></button>
                </li>`;
            });
        } else html += '<li class="list-group-item text-muted">No eligibility records found.</li>';
        html += '</ul>';
        html += `
            <form id="addElig-${id}" class="d-flex gap-2">
                <input type="url" class="form-control" name="link" placeholder="https://link-to-document" required>
                <button type="submit" class="btn btn-success">Add</button>
            </form>
        `;
        document.getElementById('eligModalBody').innerHTML = html;
        
        document.getElementById(`addElig-${id}`).addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const res = await fetch(`/api/applicants/${id}/eligibility`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ link: e.target.link.value })
                });
                if(res.ok) openEligModal(id);
            } catch(err) { console.error(err); }
        });
        
        bootstrap.Modal.getOrCreateInstance(document.getElementById('eligModal')).show();
    } catch (err) { alert(err.message); }
}
