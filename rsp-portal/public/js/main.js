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
const addApplicantForm = document.getElementById('addApplicantForm');
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

// Generate PDF Letter using jsPDF directly (vector rendering matching scan template)
const loadImageForPDF = (src) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
});

async function printLetter(name, office, dateStr, category, applicationCode) {
    const { jsPDF } = window.jspdf || window;
    if (!jsPDF) {
        alert('jsPDF library failed to load. Please try again.');
        return;
    }

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Helper function for inline rich text rendering (handles <b> tags for key values)
    function drawRichText(doc, text, startX, startY, maxWidth, lineHeight, firstLineIndent = 0) {
        const parts = text.split(/(<\/b>|<b>)/);
        let currentX = startX + firstLineIndent;
        let currentY = startY;
        let isBold = false;
        
        const rightMargin = startX + maxWidth;
        
        parts.forEach(part => {
            if (part === '<b>') {
                isBold = true;
                doc.setFont("Times", "bold");
            } else if (part === '</b>') {
                isBold = false;
                doc.setFont("Times", "normal");
            } else {
                const words = part.split(' ');
                words.forEach((word, index) => {
                    if (word === '' && index > 0) return;
                    
                    const wordToDraw = word + (index < words.length - 1 ? ' ' : '');
                    const wordWidth = doc.getTextWidth(wordToDraw);
                    
                    if (currentX + wordWidth > rightMargin) {
                        currentX = startX;
                        currentY += lineHeight;
                    }
                    
                    doc.text(wordToDraw, currentX, currentY);
                    currentX += wordWidth;
                });
            }
        });
        
        return currentY + lineHeight;
    }

    // Format Date using the current date
    const d = new Date();
    const formattedDate = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Map applicant category to professional rank titles
    let rankTitle = 'Teacher I';

    // Parse order number from application code sequence suffix
    let orderNum = "007";
    if (applicationCode) {
        const parts = applicationCode.split('-');
        if (parts.length > 0) {
            const num = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(num)) {
                orderNum = String(num).padStart(3, '0');
            }
        }
    }

    // Fetch and register Canterbury custom font from server `/fonts/Canterbury.ttf`
    let hasCustomFont = false;
    try {
        const fontRes = await fetch('/fonts/Canterbury.ttf');
        if (fontRes.ok) {
            const arrayBuffer = await fontRes.arrayBuffer();
            let binary = '';
            const bytes = new Uint8Array(arrayBuffer);
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const base64Font = btoa(binary);
            doc.addFileToVFS('Canterbury.ttf', base64Font);
            doc.addFont('Canterbury.ttf', 'Canterbury', 'normal');
            hasCustomFont = true;
        }
    } catch (err) {
        console.error('Failed to load Canterbury font, using standard font as fallback:', err);
    }

    // Draw Seals Placement Outlines
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    const seal1 = await loadImageForPDF('/images/logos/DepEd Seal.png');
    if (seal1) doc.addImage(seal1, "PNG", 92.5, 2.5, 25, 15);

    // Top Header Text using Canterbury custom font
    if (hasCustomFont) {
        doc.setFont("Canterbury", "normal");
        doc.setFontSize(11); // adjust scale slightly for gothic type
    } else {
        doc.setFont("Times", "normal");
        doc.setFontSize(11);
    }
    doc.setTextColor(0);
    doc.text("Republic of the Philippines", 105, 23, { align: "center" });
    
    if (hasCustomFont) {
        doc.setFont("Canterbury", "normal");
        doc.setFontSize(16); // Gothic department title is larger and elegant
    } else {
        doc.setFont("Times", "bold");
        doc.setFontSize(16);
    }
    doc.text("Department of Education", 105, 28, { align: "center" });
    
    doc.setFont("Times", "normal");
    doc.setFontSize(11);
    doc.text("Region X-Northern Mindanao", 105, 32, { align: "center" });
    
    doc.setFont("Times", "normal");
    doc.setFontSize(11);
    doc.text("SCHOOLS DIVISION OF ILIGAN CITY", 105, 36, { align: "center" });

    // Divider Lines under schools division
    // ASSIGNMENT ORDER Box Headers
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(20, 38, 190, 38);

    doc.setFont("Times", "bold");
    doc.setFontSize(20);
    doc.text("ASSIGNMENT ORDER", 105, 44, { align: "center" });
    
    doc.setLineWidth(0.8);
    doc.line(20, 46, 190, 46);

    doc.setFont("Times", "bold");
    doc.setFontSize(12);
    doc.text(`No. ${orderNum}, s. 2026`, 105, 54, { align: "center" });

    // Date (Right-aligned)
    doc.setFont("Times", "normal");
    doc.text(formattedDate, 190, 69, { align: "right" });

    // Recipient TO Section
    doc.setFont("Times", "bold");
    doc.text("TO:", 20, 79);
    doc.text(name.toUpperCase(), 50, 79);
    doc.text(rankTitle, 50, 83);

    // Salutation
    doc.setFont("Times", "normal");
    const salutation = `Warm greetings!`;
    let currentY = drawRichText(doc, salutation, 20, 104, 170, 5, 10);

    currentY += 10;
    // Body Paragraph 1 (with bold Suarez National High School and effective Date)
    const body1 = `By virtue of an appointment duly issued by this Office, information is hereby given of your school assignment at <b>${office}</b>, Iligan City, effective this <b>${formattedDate}</b>. Thus, you shall report directly to the School Head/School Principal of the said school for further instruction.`;
    currentY = drawRichText(doc, body1, 20, currentY, 170, 5, 10);

    // Body Paragraph 2
    currentY += 7.5;
    const body2 = `Moreover, you are directed to submit the DBM-CSC Form No. 1, "Position Description Form" for the attestation of appointment to this Office thru Personnel Section within three (3) days from receipt hereof.`;
    currentY = drawRichText(doc, body2, 20, currentY, 170, 5, 10);

    // Body Paragraph 3
    currentY += 7.5;
    const body3 = "Compliance is enjoined.";
    currentY = drawRichText(doc, body3, 20, currentY, 170, 5, 10);

    // Superintendent Signature Block
    currentY += 25;
    doc.setFont("Times", "bold");
    doc.setFontSize(11);
    doc.text("JONATHAN S. DELA PEÑA, PhD, CESO V", 150, currentY + 15, { align: "center" });
    doc.setFont("Times", "normal");
    doc.text("Schools Division Superintendent", 150, currentY + 20, { align: "center" });

    // Carbon Copy (cc) section
    doc.setFontSize(9);
    doc.text("cc:", 20, currentY + 35);
    doc.setFont("Times", "bold");
    doc.text("LEONARDA LUNA ARAZO", 30, currentY + 35);
    doc.setFont("Times", "normal");
    doc.text("School Principal I", 30, currentY + 40);
    
    // Footer section
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, 272, 190, 272);

    const seal2 = await loadImageForPDF('/images/logos/DepEd Logo.png');
    const seal3 = await loadImageForPDF('/images/logos/bagong-pilipinas-seeklogo.png');
    const seal4 = await loadImageForPDF('/images/logos/Deped Division of Iligan City.png');
    
    if (seal2) doc.addImage(seal2, "PNG", 22.5, 277.5, 22.5, 12.5);
    if (seal3) doc.addImage(seal3, "PNG", 56.5, 274.5, 17.5, 17.5);
    if (seal4) doc.addImage(seal4, "PNG", 85, 274.5, 17.5, 17.5);

    doc.setFontSize(7.5);
    doc.setTextColor(100);
    doc.setFont("Times", "bold");
    doc.text("Address:", 110, 277, { align: "left" });
    doc.setFont("Times", "normal");
    doc.text("Gen. Aguinaldo St., Iligan City", 121, 277, { align: "left" });
    doc.setFont("Times", "bold");
    doc.text("Email Address:", 110, 281, { align: "left" });
    doc.setFont("Times", "normal");
    doc.text("iligan.city@deped.gov.ph", 128, 281, { align: "left" });
    doc.setFont("Times", "bold");
    doc.text("Website:", 110, 285, { align: "left" });
    doc.setFont("Times", "normal");
    doc.text("www.iligan.deped10.com", 121, 285, { align: "left" });

    doc.setFontSize(6.5);
    doc.text("Doc. Ref. Code: DEPED-ILIGAN-AO-2026   |   Rev: 00   |   Page 1 of 1", 110, 290, { align: "left" });

    // Save and download PDF
    doc.save(`${name.replace(/\s+/g, '_')}_assignment_order.pdf`);
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
                    <span><strong>${t.title}</strong> (${t.hours} hours)
                    ${t.link ? `<br><a href="${t.link}" target="_blank" class="text-primary text-decoration-none small"><i class="bi bi-link-45deg"></i> View Certificate</a>` : ''}
                    </span>
                    <button type="button" class="btn btn-sm btn-danger" onclick="deleteRecord('training', ${t.id}, ${id}, 'train')"><i class="bi bi-trash"></i></button>
                </li>`;
            });
        } else html += '<li class="list-group-item text-muted">No training seminars found.</li>';
        html += '</ul>';
        html += `
            <form id="addTrain-${id}" class="d-flex flex-wrap gap-2">
                <input type="text" class="form-control flex-grow-1" name="title" placeholder="Title" required>
                <input type="number" class="form-control" name="hours" placeholder="Hrs" style="max-width: 80px;" required>
                <input type="url" class="form-control w-100 mt-2" name="link" placeholder="Link ">
                <button type="submit" class="btn btn-success w-100 mt-2">Add Training</button>
            </form>
        `;
        document.getElementById('trainModalBody').innerHTML = html;
        
        document.getElementById(`addTrain-${id}`).addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const res = await fetch(`/api/applicants/${id}/training`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: e.target.title.value, hours: e.target.hours.value, link: e.target.link.value })
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
                    <span><strong>${e.details}</strong> (${e.years} years)
                    ${e.link ? `<br><a href="${e.link}" target="_blank" class="text-primary text-decoration-none small"><i class="bi bi-link-45deg"></i> View Certificate</a>` : ''}
                    </span>
                    <button type="button" class="btn btn-sm btn-danger" onclick="deleteRecord('experience', ${e.id}, ${id}, 'exp')"><i class="bi bi-trash"></i></button>
                </li>`;
            });
        } else html += '<li class="list-group-item text-muted">No experience records found.</li>';
        html += '</ul>';
        html += `
            <form id="addExp-${id}" class="d-flex flex-wrap gap-2">
                <input type="text" class="form-control flex-grow-1" name="details" placeholder="Details" required>
                <input type="number" class="form-control" name="years" placeholder="Yrs" style="max-width: 80px;" required>
                <input type="url" class="form-control w-100 mt-2" name="link" placeholder="Link ">
                <button type="submit" class="btn btn-success w-100 mt-2">Add Experience</button>
            </form>
        `;
        document.getElementById('expModalBody').innerHTML = html;
        
        document.getElementById(`addExp-${id}`).addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const res = await fetch(`/api/applicants/${id}/experience`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ details: e.target.details.value, years: e.target.years.value, link: e.target.link.value })
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
