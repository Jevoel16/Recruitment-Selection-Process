async function fetchDetails(id) {
    const res = await fetch(`/api/applicants/${id}/details`);
    if (!res.ok) throw new Error('Failed to fetch details');
    const data = await res.json();
    window.currentApplicantVersion = data.version;
    return data;
}

// Reusable deleter
function deleteRecord(type, recordId, applicantId, modalType) {
    document.getElementById('deleteConfirmType').value = type;
    document.getElementById('deleteConfirmRecordId').value = recordId;
    document.getElementById('deleteConfirmApplicantId').value = applicantId;
    document.getElementById('deleteConfirmModalType').value = modalType || '';
    bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteConfirmModal')).show();
}

window.executeDeleteRecord = async function() {
    const type = document.getElementById('deleteConfirmType').value;
    const recordId = document.getElementById('deleteConfirmRecordId').value;
    const applicantId = document.getElementById('deleteConfirmApplicantId').value;
    const modalType = document.getElementById('deleteConfirmModalType').value;
    
    bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal')).hide();
    
    try {
        const res = await fetch(`/api/${type}/${recordId}`, { method: 'DELETE' });
        if(res.ok) {
            if (modalType === 'edu') { window.showToast('Successfully deleted!', 'success'); openEduModal(applicantId); }
            else if (modalType === 'train') { window.showToast('Successfully deleted!', 'success'); openTrainModal(applicantId); }
            else if (modalType === 'exp') { window.showToast('Successfully deleted!', 'success'); openExpModal(applicantId); }
            else if (modalType === 'elig') { window.showToast('Successfully deleted!', 'success'); openEligModal(applicantId); }
            else {
                window.showToast('Successfully deleted!', 'success');
                const row = document.querySelector(`.applicant-name-display-${recordId}`)?.closest('tr');
                if (row) row.remove();
                else window.location.reload();
            }
        } else {
            window.showToast('Error deleting record.', 'danger');
        }
    } catch(err) { console.error(err); window.showToast('Error deleting record.', 'danger'); }
}

async function openInfoModal(id) {
    if (!(await window.acquireLock(id))) return;
    try {
        const data = await fetchDetails(id);
        const app = data;
        let addr = {};
        try { addr = JSON.parse(app.address || '{}'); } catch(e) { addr = { res_house: app.address }; }

        document.getElementById('infoModalBody').innerHTML = `
            <form id="infoForm-${id}" class="mt-3 p-3 glass-panel rounded-4">
                <div class="row g-3">
                    <div class="col-md-4">
                        <label class="form-label">First Name</label>
                        <input type="text" class="form-control" name="firstName" value="${app.firstName || ''}" required oninput="this.value = this.value.toUpperCase();">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Middle Name</label>
                        <input type="text" class="form-control" name="middleName" value="${app.middleName || ''}" oninput="this.value = this.value.toUpperCase();">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Last Name</label>
                        <input type="text" class="form-control" name="lastName" value="${app.lastName || ''}" required oninput="this.value = this.value.toUpperCase();">
                    </div>
                    
                    <div class="col-md-12 border rounded-3 p-3 bg-light">
                        <h6 class="text-primary fw-bold mb-3">Residential Address</h6>
                        <div class="row g-2">
                            <div class="col-md-3">
                                <label class="form-label fw-semibold small">House/Block/Lot No.</label>
                                <input type="text" class="form-control form-control-sm" name="res_house" value="${addr.res_house || ''}" oninput="this.value = this.value.toUpperCase();">
                            </div>
                            <div class="col-md-3">
                                <label class="form-label fw-semibold small">Street</label>
                                <input type="text" class="form-control form-control-sm" name="res_street" value="${addr.res_street || ''}" oninput="this.value = this.value.toUpperCase();">
                            </div>
                            <div class="col-md-3">
                                <label class="form-label fw-semibold small">Subdivision/Village</label>
                                <input type="text" class="form-control form-control-sm" name="res_subdivision" value="${addr.res_subdivision || ''}" oninput="this.value = this.value.toUpperCase();">
                            </div>
                            <div class="col-md-3">
                                <label class="form-label fw-semibold small">Barangay <span class="text-danger">*</span></label>
                                <input type="text" class="form-control form-control-sm" name="res_barangay" value="${addr.res_barangay || ''}" required oninput="this.value = this.value.toUpperCase();">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label fw-semibold small">City/Municipality <span class="text-danger">*</span></label>
                                <input type="text" class="form-control form-control-sm" name="res_city" value="${addr.res_city || ''}" required oninput="this.value = this.value.toUpperCase();">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label fw-semibold small">Province <span class="text-danger">*</span></label>
                                <input type="text" class="form-control form-control-sm" name="res_province" value="${addr.res_province || ''}" required oninput="this.value = this.value.toUpperCase();">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label fw-semibold small">Zip Code</label>
                                <input type="text" class="form-control form-control-sm" name="res_zip" value="${addr.res_zip || ''}" oninput="this.value = this.value.toUpperCase();">
                            </div>
                        </div>

                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Birthdate</label>
                        <input type="date" class="form-control" name="birthdate" value="${app.birthdate || ''}">
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
                        <select class="form-select" name="civilStatus">
                            <option value="">Select...</option>
                            <option value="Single" ${(app.civilStatus||'').toUpperCase()==='SINGLE'?'selected':''}>Single</option>
                            <option value="Married" ${(app.civilStatus||'').toUpperCase()==='MARRIED'?'selected':''}>Married</option>
                            <option value="Widowed" ${(app.civilStatus||'').toUpperCase()==='WIDOWED'?'selected':''}>Widowed</option>
                            <option value="Separated" ${(app.civilStatus||'').toUpperCase()==='SEPARATED'?'selected':''}>Separated</option>
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Religion</label>
                        <input type="text" class="form-control" name="religion" value="${app.religion || ''}" oninput="this.value = this.value.toUpperCase();">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Disability</label>
                        <input type="text" class="form-control" name="disability" value="${app.disability || ''}" oninput="this.value = this.value.toUpperCase();">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Ethnic Group</label>
                        <input type="text" class="form-control" name="ethnicGroup" value="${app.ethnicGroup || ''}" oninput="this.value = this.value.toUpperCase();">
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
            
            const addressObj = {
                res_house: body.res_house, res_street: body.res_street, res_subdivision: body.res_subdivision,
                res_barangay: body.res_barangay, res_city: body.res_city, res_province: body.res_province, res_zip: body.res_zip
            };
            body.address = JSON.stringify(addressObj);
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
                    window.showToast('Successfully saved personal information!', 'success');
                    openInfoModal(id);
                } else {
                    window.showToast('Failed to save personal information.', 'danger');
                }
            } catch(err) { console.error(err); window.showToast('Error saving personal information.', 'danger'); }
        });
        
        const iModal = document.getElementById('infoModal');
        if (!iModal.classList.contains('show')) {
            bootstrap.Modal.getOrCreateInstance(iModal).show();
        }
    } catch (error) { console.error(error); window.showToast(error.message, 'danger'); }
}

async function openSummaryModal(id, name, hideActions = false) {
    if (!(await window.acquireLock(id))) return;
    try {
        document.getElementById('summaryApplicantId').value = id;
        document.getElementById('summaryApplicantName').innerText = name;
        
        const data = await fetchDetails(id);
        
        const generateList = (items, typeName) => {
            if(!items || !items.length) return `<li class="list-group-item text-muted small">No ${typeName} records.</li>`;
            return items.map(item => {
                const badgeClass = item.status === 'QUALIFIED' ? 'bg-success' : item.status === 'DISQUALIFIED' ? 'bg-danger' : 'bg-warning text-dark';
                let docTitle = item.degree || item.title || item.details;
                
                if (typeName === 'training' && item.hours) {
                    const hrsStr = item.hours == 1 ? 'hour' : 'hours';
                    docTitle += ` <span class="text-muted fst-italic">(${item.hours} ${hrsStr})</span>`;
                } else if (typeName === 'experience') {
                    let expStr = [];
                    if (item.years) {
                        const yrStr = item.years == 1 ? 'yr' : 'yrs';
                        expStr.push(`${item.years} ${yrStr}`);
                    }
                    if (item.months) {
                        const moStr = item.months == 1 ? 'mo' : 'mos';
                        expStr.push(`${item.months} ${moStr}`);
                    }
                    if (expStr.length > 0) {
                        docTitle += ` <span class="text-muted fst-italic">(${expStr.join(', ')})</span>`;
                    }
                }
                
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
        const checkDisqualified = (items) => {
            if(!items || !items.length) return false;
            return items.some(item => item.status === 'DISQUALIFIED');
        };
        
        const hasPending = checkPending(data.education) || checkPending(data.training) || checkPending(data.experience) || checkPending(data.eligibility);
        const hasDisqualified = checkDisqualified(data.education) || checkDisqualified(data.training) || checkDisqualified(data.experience) || checkDisqualified(data.eligibility);
        
        const sumQualifyBtn = document.getElementById('summaryQualifyBtn');
        const sumDisqualifyBtn = document.getElementById('summaryDisqualifyBtn');
        if (hideActions) {
            if (sumQualifyBtn) sumQualifyBtn.style.display = 'none';
            if (sumDisqualifyBtn) sumDisqualifyBtn.style.display = 'none';
        } else {
            if (sumQualifyBtn) {
                sumQualifyBtn.style.display = 'inline-block';
                sumQualifyBtn.disabled = hasPending || hasDisqualified;
                if (hasPending) {
                    sumQualifyBtn.title = "All documents must be evaluated first";
                    sumQualifyBtn.innerHTML = '<i class="bi bi-lock-fill me-1"></i> Qualify';
                } else if (hasDisqualified) {
                    sumQualifyBtn.title = "Cannot qualify because one or more documents are disqualified";
                    sumQualifyBtn.innerHTML = '<i class="bi bi-lock-fill me-1"></i> Qualify';
                } else {
                    sumQualifyBtn.title = "";
                    sumQualifyBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i> Qualify';
                }
            }
            if (sumDisqualifyBtn) {
                sumDisqualifyBtn.style.display = 'inline-block';
                sumDisqualifyBtn.disabled = hasPending;
                if (hasPending) {
                    sumDisqualifyBtn.title = "All documents must be evaluated first";
                    sumDisqualifyBtn.innerHTML = '<i class="bi bi-lock-fill me-1"></i> Disqualify';
                } else {
                    sumDisqualifyBtn.title = "";
                    sumDisqualifyBtn.innerHTML = 'Disqualify';
                }
            }
        }

        bootstrap.Modal.getOrCreateInstance(document.getElementById('summaryModal')).show();
    } catch(err) { console.error(err); }
}

window.disqualifyFromSummary = () => {
    const id = document.getElementById('summaryApplicantId').value;
    const name = document.getElementById('summaryApplicantName').innerText;
    
    document.getElementById('summaryDisqualifyId').value = id;
    document.getElementById('summaryDisqualifyName').innerText = name;
    
    const reasonMainInput = document.getElementById('summaryDisqualifyReasonMain');
    
    if (reasonMainInput) {
        reasonMainInput.value = 'Pursuant to Section 21 of DO 7 s. 2023 provides that "Individuals who failed to submit complete mandatory documents (Items 20.a to 20.j) on the set deadline indicated in the official memorandum shall not be included in the pool of official applicants.” and upon reviewing your submitted documents, you failed to meet the complete mandatory requirements or qualifications.';
    }
    
    bootstrap.Modal.getOrCreateInstance(document.getElementById('summaryDisqualifyModal')).show();
}

window.confirmSummaryDisqualify = () => {
    const id = document.getElementById('summaryDisqualifyId').value;
    const reasonMainInput = document.getElementById('summaryDisqualifyReasonMain');
    
    const reason = reasonMainInput ? reasonMainInput.value.trim() : '';
    
    fetch(`/api/applicants/${id}/disqualify`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
    })
        .then(res => res.ok ? window.showToast('Successfully disqualified', 'success', true) : window.showToast('Error disqualifying', 'danger'))
        .catch(err => console.error(err));
}


window.openApplicantDetailsModal = async function(id, name, assignedOffice, category, appCode, status) {
    if (!(await window.acquireLock(id))) return;
    document.getElementById('unifiedModalId').value = id;
    document.getElementById('unifiedModalName').innerText = name;
    document.getElementById('unifiedModalAssignedOffice').value = assignedOffice || '';
    document.getElementById('unifiedModalCategory').value = category || '';
    document.getElementById('unifiedModalAppCode').value = appCode || '';
    document.getElementById('unifiedModalStatus').value = status || '';

    const hasStep2 = ['WAITING_FOR_ASSESSMENT', 'ASSESSED', 'WAITING', 'ASSIGNED', 'COMPLETED'].includes(status);
    const hasStep4 = ['WAITING', 'ASSIGNED', 'COMPLETED'].includes(status);
    const hasStep5 = ['ASSIGNED', 'COMPLETED'].includes(status);

    const btnEval = document.getElementById('unifiedBtnEval');
    const btnAssessSum = document.getElementById('unifiedBtnAssessSum');
    const btnReq = document.getElementById('unifiedBtnPdfStep4');
    const btnPdf = document.getElementById('unifiedBtnPdf');
    const btnStep1Pdf = document.getElementById('unifiedBtnStep1Pdf');

    if (btnEval) {
        const canAccess = btnEval.getAttribute('data-can-access') === 'true';
        btnEval.disabled = !hasStep2 || !canAccess;
    }
    if (btnAssessSum) {
        const canAccess = btnAssessSum.getAttribute('data-can-access') === 'true';
        btnAssessSum.disabled = !hasStep2 || !canAccess;
    }
    if (btnReq) btnReq.disabled = !hasStep4;
    if (btnPdf) btnPdf.disabled = !hasStep5;
    if (btnStep1Pdf) btnStep1Pdf.disabled = (status === 'PENDING');

    bootstrap.Modal.getOrCreateInstance(document.getElementById('unifiedDetailsModal')).show();
}

window.launchFromUnified = function(type) {
    // We intentionally DO NOT hide the unifiedDetailsModal here, 
    // so the requested sub-modal appears over it.
    
    const id = document.getElementById('unifiedModalId').value;
    const name = document.getElementById('unifiedModalName').innerText;
    const assignedOffice = document.getElementById('unifiedModalAssignedOffice').value;
    const category = document.getElementById('unifiedModalCategory').value;
    const appCode = document.getElementById('unifiedModalAppCode').value;

    switch(type) {
        case 'info': openInfoModal(id); break;
        case 'edu': openEduModal(id); break;
        case 'train': openTrainModal(id); break;
        case 'exp': openExpModal(id); break;
        case 'elig': openEligModal(id); break;
        case 'step1_summary': openSummaryModal(id, name, true); break;
        case 'step1_pdf': 
            const s1 = document.getElementById('unifiedModalStatus').value;
            window.openGenericDocModal(1, id, s1, '', name, '', '', appCode, '', ''); 
            break;
        case 'eval_assessment': openAssessmentModal(id, name); break;
        case 'step2_summary': openStep2SummaryModal(id, name, true); break;
        case 'step4_pdf':
            window.openGenericDocModal(4, id, '', '', name, '', '', appCode, '', '');
            break;
        case 'generate_pdf': 
            window.openGenericDocModal(5, id, '', '', name, assignedOffice, category, appCode, '', ''); 
            break;
    }
}




window.openUpdateStatusModal = async function(id, name, currentStatus) {
    if (!(await window.acquireLock(id))) return;
    document.getElementById('updateStatusId').value = id;
    document.getElementById('updateStatusName').innerText = name;
    
    const select = document.getElementById('updateStatusSelect');
    if (select.querySelector(`option[value="${currentStatus}"]`)) {
        select.value = currentStatus;
    } else {
        select.value = 'PENDING';
    }
    
    bootstrap.Modal.getOrCreateInstance(document.getElementById('updateStatusModal')).show();
}

document.addEventListener('DOMContentLoaded', () => {
    const updateForm = document.getElementById('updateStatusForm');
    if (updateForm) {
        updateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('updateStatusId').value;
            const status = document.getElementById('updateStatusSelect').value;
            
            try {
                const res = await fetch(`/api/applicants/${id}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status })
                });
                if(res.ok) {
                    bootstrap.Modal.getInstance(document.getElementById('updateStatusModal')).hide();
                    window.showToast('Status successfully updated!', 'success');
                    setTimeout(() => window.location.reload(), 800);
                } else {
                    window.showToast('Error updating status', 'danger');
                }
            } catch(err) {
                console.error(err);
                window.showToast('Error updating status', 'danger');
            }
        });
    }
});
