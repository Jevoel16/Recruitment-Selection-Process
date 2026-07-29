function getDisplayFileLink(link) {
    if (!link) return '#';
    return link.startsWith('http') ? link : `/uploads/${link}`;
}

async function prepareUpdateRecord(type, recordId, applicantId, currentTitle, secondaryVal, secondaryKey, modalType) {
    let formId, titleInputName, secInputName, btnTextPrefix;
    if (modalType === 'edu') {
        formId = `addEdu-${applicantId}`;
        titleInputName = 'title';
        secInputName = 'year_graduated';
        btnTextPrefix = 'Education';
    } else if (modalType === 'train') {
        formId = `addTrain-${applicantId}`;
        titleInputName = 'title';
        secInputName = 'hours';
        btnTextPrefix = 'Training';
    } else if (modalType === 'exp') {
        formId = `addExp-${applicantId}`;
        titleInputName = 'details';
        secInputName = 'years';
        btnTextPrefix = 'Experience';
    } else if (modalType === 'elig') {
        formId = `addElig-${applicantId}`;
        titleInputName = 'title';
        secInputName = 'rating';
        btnTextPrefix = 'Eligibility';
    }

    const form = document.getElementById(formId);
    if (!form) return;

    form.elements[titleInputName].value = currentTitle;
    if (form.elements[secInputName] && secondaryVal !== undefined && secondaryVal !== 'undefined' && secondaryVal !== null) {
        form.elements[secInputName].value = secondaryVal;
    }
    
    if (modalType === 'exp' && form.elements['months'] && secondaryKey !== undefined && secondaryKey !== 'undefined' && secondaryKey !== null) {
        form.elements['months'].value = secondaryKey;
    }
    
    // Store update state
    form.dataset.mode = 'update';
    form.dataset.recordId = recordId;

    const btn = form.querySelector('button[type="submit"]');
    if (btn) {
        btn.textContent = `Update ${btnTextPrefix}`;
        btn.classList.remove('btn-success');
        btn.classList.add('btn-info', 'text-white');
    }
}

function setFloatingStandard(modalId, text) {
    const modalEl = document.getElementById(modalId);
    if (!modalEl) return;
    const dialog = modalEl.querySelector('.modal-dialog');
    const content = modalEl.querySelector('.modal-content');
    if (!content) return;
    
    let floatBox = content.querySelector('.standard-floating-box');
    if (!floatBox) {
        floatBox = document.createElement('div');
        floatBox.className = 'standard-floating-box bg-white p-3 rounded-4 shadow border border-info';
        content.appendChild(floatBox);
    }
    
    if (text) {
        dialog.classList.add('modal-dialog-with-standard');
        floatBox.innerHTML = `<h6 class="text-info fw-bold mb-2"><i class="bi bi-info-circle-fill me-2"></i> Standard Requirement</h6><p class="mb-0 small text-dark">${text}</p>`;
        floatBox.style.display = 'block';
    } else {
        dialog.classList.remove('modal-dialog-with-standard');
        floatBox.style.display = 'none';
    }
}

async function setHighestDegree(applicantId, eduId) {
    try {
        const res = await fetch(`/api/applicants/${applicantId}/education/${eduId}/highest`, { method: 'POST' });
        if (!res.ok) window.showToast('Failed to set highest degree.', 'danger');
        else window.showToast('Highest degree updated successfully.', 'success');
    } catch(err) { console.error(err); window.showToast('Failed to set highest degree.', 'danger'); }
}

window.currentDocApplicantId = null;

async function openEduModal(id, isWizard = false) {
    if (!isWizard && !(await window.acquireLock(id))) return;
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
                            <br><span class="badge ${e.status === 'QUALIFIED' ? 'bg-success' : e.status === 'DISQUALIFIED' ? 'bg-danger' : 'bg-warning text-dark'}">${e.status || 'PENDING'}</span>
                        </span>
                    </div>
                    <div class="btn-group">
                        <button type="button" class="btn btn-sm btn-success ${e.status === 'QUALIFIED' ? 'disabled' : ''}" onclick="updateDocStatus('education', ${id}, ${e.id}, 'QUALIFIED')"><i class="bi bi-check-circle"></i></button>
                        <button type="button" class="btn btn-sm btn-warning ${e.status === 'DISQUALIFIED' ? 'disabled' : ''}" onclick="updateDocStatus('education', ${id}, ${e.id}, 'DISQUALIFIED')"><i class="bi bi-x-circle"></i></button>
                        <button type="button" class="btn btn-sm btn-info text-white" onclick="prepareUpdateRecord('education', ${e.id}, ${id}, '${e.degree.replace(/'/g, "\\'")}', '${e.yearGraduated}', 'Year Graduated', 'edu')"><i class="bi bi-pencil"></i></button>
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
            const form = e.target;
            const isUpdate = form.dataset.mode === 'update';
            const recordId = form.dataset.recordId;
            try {
                let res;
                if (isUpdate) {
                    res = await fetch(`/api/education/${recordId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ degree: form.title.value, yearGraduated: parseInt(form.year_graduated.value) })
                    });
                } else {
                    res = await fetch(`/api/applicants/${id}/education`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title: form.title.value, year_graduated: form.year_graduated.value })
                    });
                }
                if(res.ok) {
                    window.showToast('Successfully saved!', 'success');
                    openEduModal(id, isWizard);
                } else {
                    window.showToast('Failed to save record.', 'danger');
                }
            } catch(err) { console.error(err); window.showToast('Error saving record.', 'danger'); }
        });
        const eModal = document.getElementById('eduModal');
        if (!eModal.classList.contains('show')) {
            bootstrap.Modal.getOrCreateInstance(eModal).show();
        }
    } catch (err) { window.showToast(err.message, 'danger'); }
}

async function openTrainModal(id, isWizard = false) {
    if (!isWizard && !(await window.acquireLock(id))) return;
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
                    <br><span class="badge ${t.status === 'QUALIFIED' ? 'bg-success' : t.status === 'DISQUALIFIED' ? 'bg-danger' : 'bg-warning text-dark'}">${t.status || 'PENDING'}</span>
                    </span>
                    <div class="btn-group">
                        <button type="button" class="btn btn-sm btn-success ${t.status === 'QUALIFIED' ? 'disabled' : ''}" onclick="updateDocStatus('training', ${id}, ${t.id}, 'QUALIFIED')"><i class="bi bi-check-circle"></i></button>
                        <button type="button" class="btn btn-sm btn-warning ${t.status === 'DISQUALIFIED' ? 'disabled' : ''}" onclick="updateDocStatus('training', ${id}, ${t.id}, 'DISQUALIFIED')"><i class="bi bi-x-circle"></i></button>
                        <button type="button" class="btn btn-sm btn-info text-white" onclick="prepareUpdateRecord('training', ${t.id}, ${id}, '${t.title.replace(/'/g, "\\'")}', '${t.hours}', 'Hours', 'train')"><i class="bi bi-pencil"></i></button>
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
            const form = e.target;
            const isUpdate = form.dataset.mode === 'update';
            const recordId = form.dataset.recordId;
            try {
                let res;
                if (isUpdate) {
                    res = await fetch(`/api/training/${recordId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title: form.title.value, hours: parseInt(form.hours.value) })
                    });
                } else {
                    res = await fetch(`/api/applicants/${id}/training`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title: form.title.value, hours: form.hours.value })
                    });
                }
                if(res.ok) {
                    window.showToast('Successfully saved!', 'success');
                    openTrainModal(id, isWizard);
                } else {
                    window.showToast('Failed to save record.', 'danger');
                }
            } catch(err) { console.error(err); window.showToast('Error saving record.', 'danger'); }
        });
        const tModal = document.getElementById('trainModal');
        if (!tModal.classList.contains('show')) {
            bootstrap.Modal.getOrCreateInstance(tModal).show();
        }
    } catch (err) { window.showToast(err.message, 'danger'); }
}

async function openExpModal(id, isWizard = false) {
    if (!isWizard && !(await window.acquireLock(id))) return;
    try {
        document.getElementById('expModalTitle').innerText = isWizard ? 'New Applicant Wizard - Work Experience' : 'Work Experience';
        const data = await fetchDetails(id);
        const exp = data.experience;
        
        setFloatingStandard('expModal', data.positionStandards ? data.positionStandards.qsExperience : null);
        
        let html = '<ul class="list-group mb-3">';
        if(exp.length) {
            exp.forEach(e => {
                const docLink = e.digitalCopyLink || e.link;
                let parts = [];
                if (e.years > 0) parts.push(e.years + (e.years == 1 ? " year" : " years"));
                if (e.months > 0) parts.push(e.months + (e.months == 1 ? " month" : " months"));
                let dur = parts.length > 0 ? parts.join(" & ") : "0 years";

                html += `<li class="list-group-item d-flex justify-content-between align-items-center">
                    <span><strong>${e.details}</strong> (${dur})
                    <br><span class="badge ${e.status === 'QUALIFIED' ? 'bg-success' : e.status === 'DISQUALIFIED' ? 'bg-danger' : 'bg-warning text-dark'}">${e.status || 'PENDING'}</span>
                    </span>
                    <div class="btn-group">
                        <button type="button" class="btn btn-sm btn-success ${e.status === 'QUALIFIED' ? 'disabled' : ''}" onclick="updateDocStatus('experience', ${id}, ${e.id}, 'QUALIFIED')"><i class="bi bi-check-circle"></i></button>
                        <button type="button" class="btn btn-sm btn-warning ${e.status === 'DISQUALIFIED' ? 'disabled' : ''}" onclick="updateDocStatus('experience', ${id}, ${e.id}, 'DISQUALIFIED')"><i class="bi bi-x-circle"></i></button>
                        <button type="button" class="btn btn-sm btn-info text-white" onclick="prepareUpdateRecord('experience', ${e.id}, ${id}, '${e.details.replace(/'/g, "\\'")}', '${e.years}', '${e.months || 0}', 'exp')"><i class="bi bi-pencil"></i></button>
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
                    <input type="number" class="form-control" name="years" placeholder="Yrs" style="flex: 1;" required min="0">
                    <input type="number" class="form-control" name="months" placeholder="Mos" style="flex: 1;" min="0" max="11">
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
            const form = e.target;
            const isUpdate = form.dataset.mode === 'update';
            const recordId = form.dataset.recordId;
            try {
                let res;
                if (isUpdate) {
                    res = await fetch(`/api/experience/${recordId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ details: form.details.value, years: parseInt(form.years.value), months: parseInt(form.months.value) || 0 })
                    });
                } else {
                    res = await fetch(`/api/applicants/${id}/experience`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ details: form.details.value, years: parseInt(form.years.value), months: parseInt(form.months.value) || 0 })
                    });
                }
                if(res.ok) {
                    window.showToast('Successfully saved!', 'success');
                    openExpModal(id, isWizard);
                } else {
                    window.showToast('Failed to save record.', 'danger');
                }
            } catch(err) { console.error(err); window.showToast('Error saving record.', 'danger'); }
        });
        const expModalEl = document.getElementById('expModal');
        if (!expModalEl.classList.contains('show')) {
            bootstrap.Modal.getOrCreateInstance(expModalEl).show();
        }
    } catch (err) { window.showToast(err.message, 'danger'); }
}

async function openEligModal(id, isWizard = false) {
    if (!isWizard && !(await window.acquireLock(id))) return;
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
                    <br><span class="badge ${e.status === 'QUALIFIED' ? 'bg-success' : e.status === 'DISQUALIFIED' ? 'bg-danger' : 'bg-warning text-dark'}">${e.status || 'PENDING'}</span>
                    </span>
                    <div class="btn-group">
                        <button type="button" class="btn btn-sm btn-success ${e.status === 'QUALIFIED' ? 'disabled' : ''}" onclick="updateDocStatus('eligibility', ${id}, ${e.id}, 'QUALIFIED')"><i class="bi bi-check-circle"></i></button>
                        <button type="button" class="btn btn-sm btn-warning ${e.status === 'DISQUALIFIED' ? 'disabled' : ''}" onclick="updateDocStatus('eligibility', ${id}, ${e.id}, 'DISQUALIFIED')"><i class="bi bi-x-circle"></i></button>
                        <button type="button" class="btn btn-sm btn-info text-white" onclick="prepareUpdateRecord('eligibility', ${e.id}, ${id}, '${(e.title || e.details).replace(/'/g, "\\'")}', '${e.rating || ''}', 'Rating', 'elig')"><i class="bi bi-pencil"></i></button>
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
                    <input type="number" class="form-control" name="rating" placeholder="Rating" step="any" max="100" oninput="if(parseFloat(this.value) > 100) this.value = 100;" style="flex: 1;" required>
                </div>
                <button type="submit" class="btn btn-success w-100 mt-2">Add Eligibility</button>
            </form>
        `;
        if (isWizard) {
            const posText = (app.position || '').toLowerCase();
            const isHigherTeaching = posText.includes('teacher ii') || posText.includes('teacher iii') || posText.includes('teacher iv') || posText.includes('teacher v') || posText.includes('teacher vi') || posText.includes('teacher vii') || posText.includes('master teacher');
            if (isHigherTeaching) {
                html += `<div class="d-flex justify-content-end mt-3 pt-3 border-top"><button type="button" class="btn btn-primary" onclick="transitionModal('eligModal', 'openHtPerfCalcModal', ${id})">Next: Performance <i class="bi bi-arrow-right"></i></button></div>`;
            } else {
                html += `<div class="d-flex justify-content-end mt-3 pt-3 border-top"><button type="button" class="btn btn-success" onclick="window.location.reload()">Finish Wizard <i class="bi bi-check-circle"></i></button></div>`;
            }
        }
        document.getElementById('eligModalBody').innerHTML = html;
        
        document.getElementById(`addElig-${id}`).addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const isUpdate = form.dataset.mode === 'update';
            const recordId = form.dataset.recordId;
            try {
                let res;
                if (isUpdate) {
                    res = await fetch(`/api/eligibility/${recordId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ details: form.title.value, rating: form.rating.value })
                    });
                } else {
                    res = await fetch(`/api/applicants/${id}/eligibility`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title: form.title.value, rating: form.rating.value })
                    });
                }
                if(res.ok) {
                    window.showToast('Successfully saved!', 'success');
                    openEligModal(id, isWizard);
                } else {
                    window.showToast('Failed to save record.', 'danger');
                }
            } catch(err) { console.error(err); window.showToast('Error saving record.', 'danger'); }
        });
        const eligModalEl = document.getElementById('eligModal');
        if (!eligModalEl.classList.contains('show')) {
            bootstrap.Modal.getOrCreateInstance(eligModalEl).show();
        }
    } catch (err) { window.showToast(err.message, 'danger'); }
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
            else if(type === 'performance') openPerfModal(applicantId);
        }
    } catch(err) { console.error(err); }
}

async function openPerfModal(id, editGroupId = null) {
    if (!(await window.acquireLock(id))) return;
    try {
        window.currentDocApplicantId = id;
        document.getElementById('perfModalTitle').innerText = 'Performance Records';
        const data = await fetchDetails(id);
        const perf = data.performance || [];
        
        const qsPerfText = data.positionStandards && data.positionStandards.qsPerformance 
            ? data.positionStandards.qsPerformance 
            : 'Performance Rating Requirements';
        setFloatingStandard('perfModal', qsPerfText);
        
        let html = '';
        
        // Group by group_id
        const grouped = {};
        perf.forEach(p => {
            if (!grouped[p.group_id]) grouped[p.group_id] = [];
            grouped[p.group_id].push(p);
        });
        
        const groupIds = Object.keys(grouped);
        
        if (groupIds.length > 0 && !editGroupId) {
            // Show list view
            html += '<div class="mb-3">';
            groupIds.forEach(gId => {
                const groupRecords = grouped[gId];
                html += `
                <div class="card mb-3 shadow-sm border-0">
                    <div class="card-header bg-light d-flex justify-content-between align-items-center">
                        <span class="fw-bold">Performance Set</span>
                        <div class="btn-group">
                            <button type="button" class="btn btn-sm btn-info text-white" onclick="openPerfModal(${id}, '${gId}')"><i class="bi bi-pencil"></i> Update</button>
                            <button type="button" class="btn btn-sm btn-danger" onclick="deleteRecord('performance/group', '${gId}', ${id}, 'perf')"><i class="bi bi-trash"></i> Delete</button>
                        </div>
                    </div>
                    <ul class="list-group list-group-flush">
                `;
                groupRecords.forEach(e => {
                    html += `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <strong>${e.ratingPeriod}</strong>
                                <br>Score: ${e.rating} ${e.letterGrade ? `(Grade: ${e.letterGrade})` : ''}
                                <br><span class="badge ${e.status === 'QUALIFIED' ? 'bg-success' : e.status === 'DISQUALIFIED' ? 'bg-danger' : 'bg-warning text-dark'}">${e.status || 'PENDING'}</span>
                            </div>
                            <div class="btn-group">
                                <button type="button" class="btn btn-sm btn-success ${e.status === 'QUALIFIED' ? 'disabled' : ''}" onclick="updateDocStatus('performance', ${id}, ${e.id}, 'QUALIFIED')"><i class="bi bi-check-circle"></i></button>
                                <button type="button" class="btn btn-sm btn-warning ${e.status === 'DISQUALIFIED' ? 'disabled' : ''}" onclick="updateDocStatus('performance', ${id}, ${e.id}, 'DISQUALIFIED')"><i class="bi bi-x-circle"></i></button>
                            </div>
                        </li>
                    `;
                });
                html += '</ul></div>';
            });
            html += '</div>';
        } else if (groupIds.length === 0 || editGroupId) {
            // Show form (Add or Update)
            const isUpdate = !!editGroupId;
            const recordsToEdit = isUpdate ? grouped[editGroupId] : [{}, {}, {}];
            // Ensure there are 3 items
            while (recordsToEdit.length < 3) recordsToEdit.push({});
            
            const placeholders = [
                { period: 'SY 2023-2024', rating: '3.456', grade: 'S' },
                { period: 'SY 2024-2025', rating: '3.756', grade: 'VS' },
                { period: 'SY 2025-2026', rating: '3.756', grade: 'VS' }
            ];
            
            html += `
                <form id="perfGroupForm-${id}" class="mb-3" data-mode="${isUpdate ? 'update' : 'add'}" data-groupid="${editGroupId || ''}">
                    <p class="text-muted small mb-2">Please provide 3 consecutive rating periods.</p>
            `;
            
            for (let i = 0; i < 3; i++) {
                const rec = recordsToEdit[i];
                html += `
                    <div class="d-flex gap-2 w-100 mb-2">
                        <input type="hidden" name="id_${i}" value="${rec.id || ''}">
                        <input type="text" class="form-control" name="period_${i}" placeholder="${placeholders[i].period}" value="${rec.ratingPeriod || ''}" style="flex: 2;" required>
                        <input type="number" step="any" class="form-control" name="rating_${i}" placeholder="${placeholders[i].rating}" value="${rec.rating || ''}" style="flex: 1;" required>
                        <input type="text" class="form-control" name="grade_${i}" placeholder="${placeholders[i].grade}" value="${rec.letterGrade || ''}" style="flex: 1;" required>
                    </div>
                `;
            }
            
            html += `
                    <div class="d-flex gap-2 mt-3">
                        ${isUpdate ? `<button type="button" class="btn btn-secondary w-50" onclick="openPerfModal(${id})">Cancel</button>` : ''}
                        <button type="submit" class="btn btn-${isUpdate ? 'info text-white' : 'primary'} w-${isUpdate ? '50' : '100'}"><i class="bi ${isUpdate ? 'bi-pencil' : 'bi-plus-circle'}"></i> ${isUpdate ? 'Update' : 'Add'} Performance</button>
                    </div>
                </form>
            `;
        }
        
        document.getElementById('perfModalBody').innerHTML = html;
        
        const formEl = document.getElementById(`perfGroupForm-${id}`);
        if (formEl) {
            formEl.addEventListener('submit', async (e) => {
                e.preventDefault();
                const form = e.target;
                const isUpdate = form.dataset.mode === 'update';
                const groupId = form.dataset.groupid;
                
                const records = [];
                for(let i=0; i<3; i++) {
                    records.push({
                        id: form[`id_${i}`].value,
                        ratingPeriod: form[`period_${i}`].value,
                        rating: form[`rating_${i}`].value,
                        letterGrade: form[`grade_${i}`].value
                    });
                }
                
                try {
                    let res;
                    if (isUpdate) {
                        res = await fetch(`/api/performance/group/${groupId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ records })
                        });
                    } else {
                        res = await fetch(`/api/applicants/${id}/performance/group`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ records })
                        });
                    }
                    if(res.ok) {
                        window.showToast('Successfully saved!', 'success');
                        openPerfModal(id); // Reload view
                    } else {
                        window.showToast('Failed to save records.', 'danger');
                    }
                } catch(err) { console.error(err); window.showToast('Error saving records.', 'danger'); }
            });
        }
        
        const perfModalEl = document.getElementById('perfModal');
        if (!perfModalEl.classList.contains('show')) {
            bootstrap.Modal.getOrCreateInstance(perfModalEl).show();
        }
    } catch (err) { window.showToast(err.message, 'danger'); }
}
