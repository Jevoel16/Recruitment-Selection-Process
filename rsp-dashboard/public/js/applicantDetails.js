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

