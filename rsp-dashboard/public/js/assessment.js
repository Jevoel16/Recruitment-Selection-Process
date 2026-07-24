// ==========================================
// ASSESSMENT & EDUCATION CALCULATOR
// ==========================================

let currentAssessmentId = null;
let currentPositionStandards = null;

const criteriaConfig = {
    'Teacher I': [
        { key: 'education', label: 'a. Education', max: 10, calcFn: 'openEduCalcModal()' },
        { key: 'training', label: 'b. Training', max: 10, calcFn: 'openTrainCalcModal()' },
        { key: 'experience', label: 'c. Experience', max: 10, calcFn: 'openExpCalcModal()' },
        { key: 'pbet', label: 'd. PBET/LET/LEPT Rating', max: 10, calcFn: 'openPbetCalcModal()' },
        { key: 'ppst_coi', label: 'e. PPST COIs (Classroom Observation/Demonstration Teaching)', max: 35, calcFn: 'openCoiCalcModal()' },
        { key: 'ppst_ncoi', label: 'f. PPST NCOIs (Teacher Reflection)', max: 25, calcFn: 'openNcoiCalcModal()' }
    ],
    'School Administration': [
        { key: 'education', label: 'a. Education', max: 10, calcFn: 'openEduCalcModal()' },
        { key: 'training', label: 'b. Training', max: 10, calcFn: 'openTrainCalcModal()' },
        { key: 'experience', label: 'c. Experience', max: 10, calcFn: 'openExpCalcModal()' },
        { key: 'performance', label: 'd. Performance', max: 25, calcFn: 'openPerfCalcModal()' },
        { key: 'outstandingAccomplishments', label: 'e. Outstanding Accomplishments', max: 10, calcFn: 'openOutAccCalcModal()' },
        { key: 'applicationOfEducation', label: 'f. Application of Education', max: 10, calcFn: 'openAppEduCalcModal()' },
        { key: 'applicationOfLD', label: 'g. Application of L&D', max: 10, calcFn: 'openAppLNDCalcModal()' },
        { key: 'potential', label: 'h. Potential (Written Exam, BEI)', max: 15, calcFn: 'openPotentialCalcModal()' }
    ],
    'General': [
        { key: 'education', label: 'a. Education', max: 5, calcFn: 'openEduCalcModal()' },
        { key: 'training', label: 'b. Training', max: 5, calcFn: 'openTrainCalcModal()' },
        { key: 'experience', label: 'c. Experience', max: 20, calcFn: 'openExpCalcModal()' },
        { key: 'performance', label: 'd. Performance', max: 10, calcFn: 'openPerfCalcModal()' },
        { key: 'outstandingAccomplishments', label: 'e. Outstanding Accomplishments', max: 5, calcFn: 'openOutAccCalcModal()' },
        { key: 'potential', label: 'f. Potential', max: 55, calcFn: 'openPotentialCalcModal()' }
    ],
    'SG 1-9': [
        { key: 'education', label: 'a. Education', max: 5, calcFn: 'openEduCalcModal()' },
        { key: 'training', label: 'b. Training', max: 5, calcFn: 'openTrainCalcModal()' },
        { key: 'experience', label: 'c. Experience', max: 20, calcFn: 'openExpCalcModal()' },
        { key: 'performance', label: 'd. Performance', max: 20, calcFn: 'openPerfCalcModal()' },
        { key: 'outstandingAccomplishments', label: 'e. Outstanding Accomplishments', max: 10, calcFn: 'openOutAccCalcModal()' },
        { key: 'applicationOfEducation', label: 'f. Application of Education', max: 10, calcFn: 'openAppEduCalcModal()' },
        { key: 'applicationOfLD', label: 'g. Application of L&D', max: 10, calcFn: 'openAppLNDCalcModal()' },
        { key: 'potential', label: 'h. Potential', max: 20, calcFn: 'openPotentialCalcModal()' }
    ],
    'SG 10-22': [
        { key: 'education', label: 'a. Education', max: 5, calcFn: 'openEduCalcModal()' },
        { key: 'training', label: 'b. Training', max: 10, calcFn: 'openTrainCalcModal()' },
        { key: 'experience', label: 'c. Experience', max: 15, calcFn: 'openExpCalcModal()' },
        { key: 'performance', label: 'd. Performance', max: 20, calcFn: 'openPerfCalcModal()' },
        { key: 'outstandingAccomplishments', label: 'e. Outstanding Accomplishments', max: 10, calcFn: 'openOutAccCalcModal()' },
        { key: 'applicationOfEducation', label: 'f. Application of Education', max: 10, calcFn: 'openAppEduCalcModal()' },
        { key: 'applicationOfLD', label: 'g. Application of L&D', max: 10, calcFn: 'openAppLNDCalcModal()' },
        { key: 'potential', label: 'h. Potential', max: 20, calcFn: 'openPotentialCalcModal()' }
    ],
    'SG 24': [
        { key: 'education', label: 'a. Education', max: 10, calcFn: 'openEduCalcModal()' },
        { key: 'training', label: 'b. Training', max: 5, calcFn: 'openTrainCalcModal()' },
        { key: 'experience', label: 'c. Experience', max: 15, calcFn: 'openExpCalcModal()' },
        { key: 'performance', label: 'd. Performance', max: 20, calcFn: 'openPerfCalcModal()' },
        { key: 'outstandingAccomplishments', label: 'e. Outstanding Accomplishments', max: 10, calcFn: 'openOutAccCalcModal()' },
        { key: 'applicationOfEducation', label: 'f. Application of Education', max: 10, calcFn: 'openAppEduCalcModal()' },
        { key: 'applicationOfLD', label: 'g. Application of L&D', max: 10, calcFn: 'openAppLNDCalcModal()' },
        { key: 'potential', label: 'h. Potential', max: 20, calcFn: 'openPotentialCalcModal()' }
    ],
    'RT SG 11-15': [
        { key: 'education', label: 'a. Education', max: 10, calcFn: 'openEduCalcModal()' },
        { key: 'training', label: 'b. Training', max: 10, calcFn: 'openTrainCalcModal()' },
        { key: 'experience', label: 'c. Experience', max: 10, calcFn: 'openExpCalcModal()' },
        { key: 'performance', label: 'd. Performance', max: 20, calcFn: 'openPerfCalcModal()' },
        { key: 'outstandingAccomplishments', label: 'e. Outstanding Accomplishments', max: 10, calcFn: 'openOutAccCalcModal()' },
        { key: 'applicationOfEducation', label: 'f. Application of Education', max: 10, calcFn: 'openAppEduCalcModal()' },
        { key: 'applicationOfLD', label: 'g. Application of L&D', max: 10, calcFn: 'openAppLNDCalcModal()' },
        { key: 'potential', label: 'h. Potential', max: 20, calcFn: 'openPotentialCalcModal()' }
    ],
    'RT SG 16-23': [
        { key: 'education', label: 'a. Education', max: 10, calcFn: 'openEduCalcModal()' },
        { key: 'training', label: 'b. Training', max: 10, calcFn: 'openTrainCalcModal()' },
        { key: 'experience', label: 'c. Experience', max: 10, calcFn: 'openExpCalcModal()' },
        { key: 'performance', label: 'd. Performance', max: 20, calcFn: 'openPerfCalcModal()' },
        { key: 'outstandingAccomplishments', label: 'e. Outstanding Accomplishments', max: 5, calcFn: 'openOutAccCalcModal()' },
        { key: 'applicationOfEducation', label: 'f. Application of Education', max: 15, calcFn: 'openAppEduCalcModal()' },
        { key: 'applicationOfLD', label: 'g. Application of L&D', max: 10, calcFn: 'openAppLNDCalcModal()' },
        { key: 'potential', label: 'h. Potential', max: 20, calcFn: 'openPotentialCalcModal()' }
    ],
    'RT SG 24': [
        { key: 'education', label: 'a. Education', max: 10, calcFn: 'openEduCalcModal()' },
        { key: 'training', label: 'b. Training', max: 10, calcFn: 'openTrainCalcModal()' },
        { key: 'experience', label: 'c. Experience', max: 10, calcFn: 'openExpCalcModal()' },
        { key: 'performance', label: 'd. Performance', max: 25, calcFn: 'openPerfCalcModal()' },
        { key: 'outstandingAccomplishments', label: 'e. Outstanding Accomplishments', max: 10, calcFn: 'openOutAccCalcModal()' },
        { key: 'applicationOfEducation', label: 'f. Application of Education', max: 10, calcFn: 'openAppEduCalcModal()' },
        { key: 'applicationOfLD', label: 'g. Application of L&D', max: 10, calcFn: 'openAppLNDCalcModal()' },
        { key: 'potential', label: 'h. Potential', max: 15, calcFn: 'openPotentialCalcModal()' }
    ]
};

async function openAssessmentModal(id, name) {
    if (!(await window.acquireLock(id))) return;
    currentAssessmentId = id;
    document.getElementById('assessmentApplicantId').value = id;
    document.getElementById('assessmentApplicantName').innerText = name;
    
    // Fetch details to get SG and Category if possible
    try {
        const data = await fetchDetails(id);
        const app = data.applicant;
        currentPositionStandards = data.positionStandards || {};
        const posStandards = currentPositionStandards;
        
        const category = app.category || 'Non-Teaching';
        const sg = posStandards.salaryGrade || '1'; 
        const position = app.position || 'N/A';
        
        document.getElementById('assessmentCategory').innerText = category;
        document.getElementById('assessmentSG').innerText = `${sg}`;
        document.getElementById('assessmentPosition').innerText = position;
        
        let categoryKey = 'SG 1-9';
        const sgNum = parseInt(sg.toString().replace('SG', '').trim()) || 1;
        const catLower = category.toLowerCase();
        const posLower = position.toLowerCase();
        
        const isGeneral = catLower.includes('general services') || 
                          sg.toString().toLowerCase().includes('general services') ||
                          posLower.includes('aide') || 
                          posLower.includes('guard') || 
                          posLower.includes('watchman') || 
                          posLower.includes('worker') || 
                          posLower.includes('driver') || 
                          posLower.includes('cook') || 
                          posLower.includes('mechanic') || 
                          posLower.includes('operator') ||
                          posLower.includes('fisherman') ||
                          posLower.includes('clerk') ||
                          posLower.includes('maintenance');

        if (catLower.includes('teacher') || catLower === 'teaching') {
            categoryKey = 'Teacher I';
        } else if (catLower.includes('school administration') || catLower.includes('school admin')) {
            categoryKey = 'School Administration';
        } else if (catLower.includes('related teaching') || catLower.includes('related-teaching')) {
            if (sgNum >= 11 && sgNum <= 15) {
                categoryKey = 'RT SG 11-15';
            } else if ((sgNum >= 16 && sgNum <= 23) || sgNum === 27) {
                categoryKey = 'RT SG 16-23';
            } else if (sgNum >= 24) {
                categoryKey = 'RT SG 24';
            } else {
                categoryKey = 'RT SG 11-15'; // Default fallback
            }
        } else if (isGeneral) {
            categoryKey = 'General';
        } else if (sgNum >= 24) {
            categoryKey = 'SG 24';
        } else if ((sgNum >= 10 && sgNum <= 22) || sgNum === 27) {
            categoryKey = 'SG 10-22';
        } else {
            categoryKey = 'SG 1-9';
        }

        const criteriaList = criteriaConfig[categoryKey];
        const tbody = document.getElementById('assessmentCriteriaBody');
        tbody.innerHTML = '';
        let maxTotal = 0;

        criteriaList.forEach(criteria => {
            const tr = document.createElement('tr');
            
            const tdLabel = document.createElement('td');
            const dFlex = document.createElement('div');
            dFlex.className = 'd-flex justify-content-between align-items-center';
            const spanLabel = document.createElement('span');
            spanLabel.innerText = criteria.label;
            dFlex.appendChild(spanLabel);
            
            if (criteria.calcFn) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn btn-sm btn-outline-info';
                btn.setAttribute('onclick', criteria.calcFn);
                btn.innerHTML = '<i class="bi bi-calculator"></i> Calculate';
                dFlex.appendChild(btn);
            }
            tdLabel.appendChild(dFlex);

            const tdInput = document.createElement('td');
            tdInput.style.width = '150px';
            const input = document.createElement('input');
            input.type = 'number';
            input.step = 'any';
            input.className = 'form-control score-input';
            input.name = criteria.key;
            input.id = criteria.key + 'Input';
            input.max = criteria.max;
            if (criteria.max === 0) {
                input.disabled = true;
            }
            
            // Set existing score if any
            if (app.scores && app.scores[criteria.key] !== undefined && app.scores[criteria.key] !== null) {
                input.value = app.scores[criteria.key];
            } else if (criteria.max === 0) {
                input.value = 0;
            } else {
                input.value = '';
            }

            input.oninput = function() {
                if (parseFloat(this.value) > parseFloat(this.max)) this.value = this.max;
                if(typeof calculateAssessmentTotal === 'function') calculateAssessmentTotal();
            };
            tdInput.appendChild(input);

            const tdMax = document.createElement('td');
            tdMax.className = 'text-center fw-bold text-muted align-middle';
            tdMax.id = `max-${criteria.key}`;
            tdMax.innerText = criteria.max;

            tr.appendChild(tdLabel);
            tr.appendChild(tdInput);
            tr.appendChild(tdMax);

            tbody.appendChild(tr);
            maxTotal += criteria.max;
        });

        document.getElementById('assessmentMaxTotal').innerText = maxTotal;
        
        document.getElementById('assessmentRemarks').value = app.remarks || '';
        
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
        const inputs = document.querySelectorAll('.score-input');
        inputs.forEach(input => {
            if (!input.disabled && !input.value) {
                isComplete = false;
            }
        });
        
        data.isComplete = isComplete;
        data.total = document.getElementById('assessmentTotalScore').innerText;
        
        try {
            const res = await fetch(`/api/applicants/${id}/assess`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                window.showToast('Assessment saved successfully!', 'success', true);
            }
        } catch (err) {
            console.error(err);
            window.showToast('Error saving assessment', 'danger');
        }
    });
    
    // Add dynamic calculation for inputs
    const calculateAssessmentTotal = () => {
        let total = 0;
        const inputs = document.querySelectorAll('.score-input');
        inputs.forEach(input => {
            if (!input.disabled) {
                const val = parseFloat(input.value);
                if (!isNaN(val)) total += val;
            }
        });
        const totalEl = document.getElementById('assessmentTotalScore');
        if (totalEl) totalEl.innerText = total > 0 ? parseFloat(total.toFixed(2)) : 0;
    };

    // Make calculateAssessmentTotal globally available
    window.calculateAssessmentTotal = calculateAssessmentTotal;
}

function openEduCalcModal() {
    bootstrap.Modal.getOrCreateInstance(document.getElementById('eduCalcModal')).show();
    if (typeof setFloatingStandard === 'function') setFloatingStandard('eduCalcModal', currentPositionStandards?.qsEducation || null);
    if (currentPositionStandards && currentPositionStandards.qsEducationLevel) {
        document.getElementById('standardEduLevel').value = currentPositionStandards.qsEducationLevel;
    }
    calculateEduPoints();
}

// Calculates the Education score based on the applicant's highest degree and the position's Salary Grade.
// Implements DepEd Order No. 007 s. 2023 rubric logic to scale points proportionally against required education thresholds.
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
    if (categoryText === 'Related-Teaching') {
        categoryKey = 'Related-Teaching';
    } else if (categoryText.toLowerCase().includes('general services') || sgText.toLowerCase().includes('general services')) {
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
    } else if (categoryKey === 'SG 1-9' || categoryKey === 'SG 10-22') {
        if (finalInc >= 10) points = 5;
        else if (finalInc >= 8) points = 4;
        else if (finalInc >= 6) points = 3;
        else if (finalInc >= 4) points = 2;
        else if (finalInc >= 2) points = 1;
        else points = 0; 
    } else if (categoryKey === 'SG 24' || categoryKey === 'Related-Teaching') {
        if (finalInc >= 10) points = 10;
        else if (finalInc >= 8) points = 8;
        else if (finalInc >= 6) points = 6;
        else if (finalInc >= 4) points = 4;
        else if (finalInc >= 2) points = 2;
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
    if (typeof setFloatingStandard === 'function') setFloatingStandard('trainCalcModal', currentPositionStandards?.qsTraining || null);
    if (currentPositionStandards && currentPositionStandards.qsTrainingLevel) {
        document.getElementById('standardTrainLevel').value = currentPositionStandards.qsTrainingLevel;
    }
    calculateTrainPoints();
}

// Calculates the Training & Seminars score by evaluating hours of relevant L&D interventions.
// Dynamically adjusts maximum allowable points based on whether the position is SG 1-9, SG 10-22, or SG 24+.
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
    if (categoryText === 'Related-Teaching') {
        categoryKey = 'Related-Teaching';
    } else if (categoryText.toLowerCase().includes('general services') || sgText.toLowerCase().includes('general services')) {
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
    } else if (categoryKey === 'SG 10-22' || categoryKey === 'Related-Teaching') {
        if (finalInc >= 10) points = 10;
        else if (finalInc >= 8) points = 8;
        else if (finalInc >= 6) points = 6;
        else if (finalInc >= 4) points = 4;
        else if (finalInc >= 2) points = 2;
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
    if (typeof setFloatingStandard === 'function') setFloatingStandard('expCalcModal', currentPositionStandards?.qsExperience || null);
    if (currentPositionStandards && currentPositionStandards.qsExperienceLevel) {
        document.getElementById('standardExpLevel').value = currentPositionStandards.qsExperienceLevel;
    }
    calculateExpPoints();
}

// Calculates the Work Experience score by analyzing months of relevant service.
// Uses an incremental formula multiplying the baseline requirement gap by a specific factor depending on Salary Grade brackets.
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
    if (categoryText === 'Related-Teaching') {
        categoryKey = 'Related-Teaching';
    } else if (categoryText.toLowerCase().includes('general services') || sgText.toLowerCase().includes('general services')) {
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
    } else if (categoryKey === 'Related-Teaching') {
        if (finalInc >= 10) points = 10;
        else if (finalInc >= 8) points = 8;
        else if (finalInc >= 6) points = 6;
        else if (finalInc >= 4) points = 4;
        else if (finalInc >= 2) points = 2;
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
    const posText = document.getElementById('assessmentPosition') ? document.getElementById('assessmentPosition').innerText.toLowerCase() : '';
    const isHigherTeaching = posText.includes('teacher ii') || posText.includes('teacher iii') || posText.includes('teacher iv') || posText.includes('teacher v') || posText.includes('teacher vi') || posText.includes('teacher vii') || posText.includes('master teacher');
    
    if (isHigherTeaching && typeof window.openHtPerfCalcModal === 'function') {
        window.openHtPerfCalcModal();
        return;
    }

    bootstrap.Modal.getOrCreateInstance(document.getElementById('perfCalcModal')).show();
    if (typeof setFloatingStandard === 'function') setFloatingStandard('perfCalcModal', 'Performance Rating must be at least Very Satisfactory for the last rating period.');
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
    } else if (method === 'rpms10') {
        ratingDiv.classList.remove('d-none');
        inputEl.max = 10;
        inputEl.step = '0.001';
        labelEl.innerText = 'Rating (x) [Max 10]';
        helpEl.innerText = 'Enter RPMS rating (0-10).';
        helperDiv.classList.add('d-none');
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

// Calculates the Performance Rating score based on numerical evaluations.
// Ensures that scores map precisely to civil service adjectival ratings (e.g. Outstanding, Very Satisfactory) for objective ranking.
function calculatePerfPoints() {
    const method = document.getElementById('perfEvalMethod').value;
    const categoryText = document.getElementById('assessmentCategory').innerText;
    const sgText = document.getElementById('assessmentSG').innerText.replace('SG', '').trim();
    const positionText = document.getElementById('assessmentPosition') ? document.getElementById('assessmentPosition').innerText : '';
    const sgNum = parseInt(sgText);
    const catLower = categoryText.toLowerCase();
    const posLower = positionText.toLowerCase();

    const isGeneral = catLower.includes('general services') || 
                      sgText.toLowerCase().includes('general services') ||
                      posLower.includes('aide') || 
                      posLower.includes('guard') || 
                      posLower.includes('watchman') || 
                      posLower.includes('worker') || 
                      posLower.includes('driver') || 
                      posLower.includes('cook') || 
                      posLower.includes('mechanic') || 
                      posLower.includes('operator') ||
                      posLower.includes('fisherman') ||
                      posLower.includes('clerk') ||
                      posLower.includes('maintenance');
    
    let wa = isGeneral ? 10 : 20;
    if ((catLower.includes('related teaching') || catLower.includes('related-teaching')) && sgNum >= 24) wa = 25;
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
        } else if (method === 'rpms10') {
            points = (x / 10) * wa;
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

// Calculates Outstanding Accomplishments points by aggregating specific achievements (Awards, Innovation, Research).
// Enforces a strict 10-point maximum cap globally across all applicant categories to prevent criteria overflow.
function calculateOutAccPoints() {
    const categoryText = document.getElementById('assessmentCategory').innerText;
    const sgText = document.getElementById('assessmentSG').innerText.replace('SG', '').trim();
    const positionText = document.getElementById('assessmentPosition') ? document.getElementById('assessmentPosition').innerText : '';
    const sgNum = parseInt(sgText);
    const catLower = categoryText.toLowerCase();
    const posLower = positionText.toLowerCase();

    const isGeneral = catLower.includes('general services') || 
                      sgText.toLowerCase().includes('general services') ||
                      posLower.includes('aide') || 
                      posLower.includes('guard') || 
                      posLower.includes('watchman') || 
                      posLower.includes('worker') || 
                      posLower.includes('driver') || 
                      posLower.includes('cook') || 
                      posLower.includes('mechanic') || 
                      posLower.includes('operator') ||
                      posLower.includes('fisherman') ||
                      posLower.includes('clerk') ||
                      posLower.includes('maintenance');
    
    let maxPoints = isGeneral ? 5 : 10;
    if ((catLower.includes('related teaching') || catLower.includes('related-teaching')) && sgNum >= 16 && sgNum <= 23) maxPoints = 5;
    
    document.getElementById('outAccMax').innerText = maxPoints;

    const compDiv = document.getElementById('outAccComponentsDiv');

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

// Calculates the Application of Education points through qualitative interview rubric inputs.
// Evaluates relevance and direct translation of academic background to the functional duties of the target position.
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
        const categoryText = document.getElementById('assessmentCategory').innerText;
        const sgText = document.getElementById('assessmentSG').innerText.replace('SG', '').trim();
        const sgNum = parseInt(sgText);
        let wa = 10; 
        const catLower = categoryText.toLowerCase();
        if ((catLower.includes('related teaching') || catLower.includes('related-teaching')) && ((sgNum >= 16 && sgNum <= 23) || sgNum === 27)) {
            wa = 15;
        }
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
    const positionText = document.getElementById('assessmentPosition') ? document.getElementById('assessmentPosition').innerText : '';
    const catLower = categoryText.toLowerCase();
    const posLower = positionText.toLowerCase();

    const isGeneral = catLower.includes('general services') || 
                      sgText.toLowerCase().includes('general services') ||
                      posLower.includes('aide') || 
                      posLower.includes('guard') || 
                      posLower.includes('watchman') || 
                      posLower.includes('worker') || 
                      posLower.includes('driver') || 
                      posLower.includes('cook') || 
                      posLower.includes('mechanic') || 
                      posLower.includes('operator') ||
                      posLower.includes('fisherman') ||
                      posLower.includes('clerk') ||
                      posLower.includes('maintenance');
    
    const maxEl = document.getElementById('max-potential');
    const criteriaMax = maxEl ? parseFloat(maxEl.innerText) : 20;
    
    document.getElementById('potCriteriaMaxLabel').innerText = criteriaMax;

    if (isGeneral) {
        document.getElementById('potentialGeneralDiv').classList.remove('d-none');
        document.getElementById('potentialOtherDiv').classList.add('d-none');
        
        if (!document.getElementById('potGenPAMax').value) document.getElementById('potGenPAMax').value = criteriaMax > 20 ? 35 : (criteriaMax / 2);
        if (!document.getElementById('potGenPSAMax').value) document.getElementById('potGenPSAMax').value = criteriaMax > 20 ? 20 : (criteriaMax / 2);
    } else {
        document.getElementById('potentialGeneralDiv').classList.add('d-none');
        document.getElementById('potentialOtherDiv').classList.remove('d-none');
        
        if (!document.getElementById('potWEMax').value) document.getElementById('potWEMax').value = (criteriaMax >= 20 ? 5 : 5);
        if (!document.getElementById('potSWSTMax').value) document.getElementById('potSWSTMax').value = (criteriaMax >= 20 ? 10 : 5);
        if (!document.getElementById('potBEIMax').value) document.getElementById('potBEIMax').value = 5;
    }
    
    calculatePotentialPoints();
}

function calculatePotentialPoints() {
    const categoryText = document.getElementById('assessmentCategory').innerText;
    const sgText = document.getElementById('assessmentSG').innerText.replace('SG', '').trim();
    const positionText = document.getElementById('assessmentPosition') ? document.getElementById('assessmentPosition').innerText : '';
    const catLower = categoryText.toLowerCase();
    const posLower = positionText.toLowerCase();

    const isGeneral = catLower.includes('general services') || 
                      sgText.toLowerCase().includes('general services') ||
                      posLower.includes('aide') || 
                      posLower.includes('guard') || 
                      posLower.includes('watchman') || 
                      posLower.includes('worker') || 
                      posLower.includes('driver') || 
                      posLower.includes('cook') || 
                      posLower.includes('mechanic') || 
                      posLower.includes('operator') ||
                      posLower.includes('fisherman') ||
                      posLower.includes('clerk') ||
                      posLower.includes('maintenance');
    
    const maxEl = document.getElementById('max-potential');
    const criteriaMax = maxEl ? parseFloat(maxEl.innerText) : 20;

    let totalPoints = 0;
    let sumMax = 0;
    
    if (isGeneral) {
        const paMax = parseFloat(document.getElementById('potGenPAMax').value) || 0;
        const psaMax = parseFloat(document.getElementById('potGenPSAMax').value) || 0;
        sumMax = paMax + psaMax;
        
        document.getElementById('potGenPAInput').max = paMax;
        document.getElementById('potGenPSAInput').max = psaMax;
        
        const pa = Math.min(parseFloat(document.getElementById('potGenPAInput').value) || 0, paMax);
        const psa = Math.min(parseFloat(document.getElementById('potGenPSAInput').value) || 0, psaMax);
        totalPoints = pa + psa;
    } else {
        const weMax = parseFloat(document.getElementById('potWEMax').value) || 0;
        const swMax = parseFloat(document.getElementById('potSWSTMax').value) || 0;
        const beiMax = parseFloat(document.getElementById('potBEIMax').value) || 0;
        sumMax = weMax + swMax + beiMax;
        
        document.getElementById('potWEInput').max = weMax;
        document.getElementById('potSWSTInput').max = swMax;
        document.getElementById('potBEIInput').max = beiMax;
        
        const we = Math.min(parseFloat(document.getElementById('potWEInput').value) || 0, weMax);
        const sw = Math.min(parseFloat(document.getElementById('potSWSTInput').value) || 0, swMax);
        const bei = Math.min(parseFloat(document.getElementById('potBEIInput').value) || 0, beiMax);
        totalPoints = we + sw + bei;
    }
    
    if (totalPoints > criteriaMax) totalPoints = criteriaMax;
    
    const sumMaxEl = document.getElementById('potentialSumMax');
    sumMaxEl.innerText = `${Math.round(sumMax * 1000) / 1000} / ${criteriaMax}`;
    if (Math.round(sumMax * 1000) / 1000 !== criteriaMax) {
        sumMaxEl.className = "fs-6 fw-bold text-danger";
    } else {
        sumMaxEl.className = "fs-6 fw-bold text-success";
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
    if (!(await window.acquireLock(id))) return;
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
        const posStandards = data.positionStandards || {};
        
        const category = app.category || 'Non-Teaching';
        const sg = posStandards.salaryGrade || '1';
        let categoryKey = 'SG 1-9';
        const sgNum = parseInt(sg.toString().replace('SG', '').trim()) || 1;
        const catLower = category.toLowerCase();
        const posLower = (app.position || '').toLowerCase();
        
        const isGeneral = catLower.includes('general services') || 
                          sg.toString().toLowerCase().includes('general services') ||
                          posLower.includes('aide') || 
                          posLower.includes('guard') || 
                          posLower.includes('watchman') || 
                          posLower.includes('worker') || 
                          posLower.includes('driver') || 
                          posLower.includes('cook') || 
                          posLower.includes('mechanic') || 
                          posLower.includes('operator') ||
                          posLower.includes('fisherman') ||
                          posLower.includes('clerk') ||
                          posLower.includes('maintenance');

        if (catLower.includes('teacher') || catLower === 'teaching') {
            categoryKey = 'Teacher I';
        } else if (catLower.includes('school administration') || catLower.includes('school admin')) {
            categoryKey = 'School Administration';
        } else if (catLower.includes('related teaching') || catLower.includes('related-teaching')) {
            if (sgNum >= 11 && sgNum <= 15) {
                categoryKey = 'RT SG 11-15';
            } else if ((sgNum >= 16 && sgNum <= 23) || sgNum === 27) {
                categoryKey = 'RT SG 16-23';
            } else if (sgNum >= 24) {
                categoryKey = 'RT SG 24';
            } else {
                categoryKey = 'RT SG 11-15'; // Default fallback
            }
        } else if (isGeneral) {
            categoryKey = 'General';
        } else if (sgNum >= 24) {
            categoryKey = 'SG 24';
        } else if ((sgNum >= 10 && sgNum <= 22) || sgNum === 27) {
            categoryKey = 'SG 10-22';
        } else {
            categoryKey = 'SG 1-9';
        }
        
        const criteriaList = criteriaConfig[categoryKey];
        let trs = '';
        criteriaList.forEach(criteria => {
            const score = (app.scores && app.scores[criteria.key] != null) ? app.scores[criteria.key] : '-';
            trs += `<tr><td>${criteria.label}</td><td class="text-center">${score}</td></tr>`;
        });
        
        let html = `
            <div class="row g-3 text-center mb-4">
                <div class="col-md-4"><strong>Category:</strong><br>${app.category || 'N/A'}</div>
                <div class="col-md-4"><strong>Position:</strong><br>${app.position || 'N/A'}</div>
                <div class="col-md-4"><strong>Salary Grade:</strong><br>${posStandards.salaryGrade || 'N/A'}</div>
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
                        ${trs}
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
            const res = await fetch(`/api/applicants/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'ASSESSED' })
            });
            if (res.ok) {
                window.showToast('Moved to Step 3 successfully!', 'success', true);
                setTimeout(() => location.reload(), 1000);
            }
        } catch (err) {
            console.error(err);
            window.showToast('Error submitting score', 'danger');
        }
    });
}

async function markNoAppearance() {
    const id = document.getElementById('assessmentApplicantId').value;
    try {
        const res = await fetch(`/api/applicants/${id}/no-appearance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
            window.showToast('Applicant marked as No Appearance!', 'success', true);
            bootstrap.Modal.getInstance(document.getElementById('assessmentModal')).hide();
        }
    } catch (err) {
        console.error(err);
        window.showToast('Error updating status', 'danger');
    }
}
window.markNoAppearance = markNoAppearance;

async function markNewlyPromoted() {
    const id = document.getElementById('assessmentApplicantId').value;
    try {
        const res = await fetch(`/api/applicants/${id}/newly-promoted`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
            window.showToast('Applicant marked as Newly Promoted!', 'success', true);
            bootstrap.Modal.getInstance(document.getElementById('assessmentModal')).hide();
        }
    } catch (err) {
        console.error(err);
        window.showToast('Error updating status', 'danger');
    }
}
window.markNewlyPromoted = markNewlyPromoted;

// Move modals to body to fix stacking context issues
document.addEventListener('DOMContentLoaded', function() { document.querySelectorAll('.modal').forEach(function(m) { document.body.appendChild(m); }); });

// Teacher I Specfic Calculators
window.openPbetCalcModal = function() {
    bootstrap.Modal.getOrCreateInstance(document.getElementById('pbetCalcModal')).show();
    window.calculatePbetPoints();
}

window.calculatePbetPoints = function() {
    let x = parseFloat(document.getElementById('pbetRatingInput').value) || 0;
    if (x > 100) x = 100;
    let points = (x / 100) * 10;
    points = Math.round(points * 1000) / 1000;
    document.getElementById('calculatedPbetPoints').innerText = points;
}

window.applyPbetPoints = function() {
    const points = document.getElementById('calculatedPbetPoints').innerText;
    const input = document.querySelector('input[name="pbet"]');
    if(input) {
        input.value = points;
        if(typeof calculateAssessmentTotal === 'function') calculateAssessmentTotal();
    }
    bootstrap.Modal.getInstance(document.getElementById('pbetCalcModal')).hide();
}

window.openCoiCalcModal = function() {
    bootstrap.Modal.getOrCreateInstance(document.getElementById('coiCalcModal')).show();
    window.calculateCoiPoints();
}

window.calculateCoiPoints = function() {
    let x = parseFloat(document.getElementById('coiRatingInput').value) || 0;
    if (x > 30) x = 30;
    let points = (x / 30) * 35;
    points = Math.round(points * 1000) / 1000;
    document.getElementById('calculatedCoiPoints').innerText = points;
}

window.applyCoiPoints = function() {
    const points = document.getElementById('calculatedCoiPoints').innerText;
    const input = document.querySelector('input[name="ppst_coi"]');
    if(input) {
        input.value = points;
        if(typeof calculateAssessmentTotal === 'function') calculateAssessmentTotal();
    }
    bootstrap.Modal.getInstance(document.getElementById('coiCalcModal')).hide();
}

window.openNcoiCalcModal = function() {
    bootstrap.Modal.getOrCreateInstance(document.getElementById('ncoiCalcModal')).show();
    window.calculateNcoiPoints();
}

window.calculateNcoiPoints = function() {
    let x = parseFloat(document.getElementById('ncoiRatingInput').value) || 0;
    if (x > 20) x = 20;
    let points = (x / 20) * 25;
    points = Math.round(points * 1000) / 1000;
    document.getElementById('calculatedNcoiPoints').innerText = points;
}

window.applyNcoiPoints = function() {
    const points = document.getElementById('calculatedNcoiPoints').innerText;
    const input = document.querySelector('input[name="ppst_ncoi"]');
    if(input) {
        input.value = points;
        if(typeof calculateAssessmentTotal === 'function') calculateAssessmentTotal();
    }
    bootstrap.Modal.getInstance(document.getElementById('ncoiCalcModal')).hide();
}

window.openHtPerfCalcModal = function(id = null, isWizard = false) {
    window.htPerfIsWizard = isWizard;
    window.htPerfApplicantId = id;
    
    document.getElementById('htPerfSy1').value = '';
    document.getElementById('htPerfScore1').value = '';
    document.getElementById('htPerfGrade1').value = '';
    document.getElementById('htPerfSy2').value = '';
    document.getElementById('htPerfScore2').value = '';
    document.getElementById('htPerfGrade2').value = '';
    document.getElementById('htPerfSy3').value = '';
    document.getElementById('htPerfScore3').value = '';
    document.getElementById('htPerfGrade3').value = '';
    document.getElementById('calculatedHtPerfPoints').innerText = '0.000';
    
    const applyBtn = document.getElementById('htPerfApplyBtn');
    if(isWizard) {
        applyBtn.innerHTML = 'Finish Wizard <i class="bi bi-check-circle"></i>';
        applyBtn.classList.remove('btn-info');
        applyBtn.classList.add('btn-success');
    } else {
        applyBtn.innerHTML = '<i class="bi bi-check-circle"></i> Apply Points';
        applyBtn.classList.remove('btn-success');
        applyBtn.classList.add('btn-info');
    }
    
    bootstrap.Modal.getOrCreateInstance(document.getElementById('htPerfCalcModal')).show();
}

window.calculateHtPerfPoints = function() {
    let score1 = parseFloat(document.getElementById('htPerfScore1').value) || 0;
    let score2 = parseFloat(document.getElementById('htPerfScore2').value) || 0;
    let score3 = parseFloat(document.getElementById('htPerfScore3').value) || 0;
    
    let count = 0;
    let sum = 0;
    if (!isNaN(parseFloat(document.getElementById('htPerfScore1').value))) { sum += score1; count++; }
    if (!isNaN(parseFloat(document.getElementById('htPerfScore2').value))) { sum += score2; count++; }
    if (!isNaN(parseFloat(document.getElementById('htPerfScore3').value))) { sum += score3; count++; }
    
    let average = count > 0 ? (sum / count) : 0;
    
    // Round to 3 decimal places max
    average = Math.round(average * 1000) / 1000;
    
    document.getElementById('calculatedHtPerfPoints').innerText = average;
}

window.applyHtPerfPoints = function() {
    const points = document.getElementById('calculatedHtPerfPoints').innerText;
    
    if (window.htPerfIsWizard) {
        window.location.reload();
        return;
    }
    
    const input = document.getElementById('performanceInput') || document.querySelector('input[name="performance"]');
    if(input) {
        input.value = points;
        if(typeof calculateAssessmentTotal === 'function') calculateAssessmentTotal();
    }
    bootstrap.Modal.getInstance(document.getElementById('htPerfCalcModal')).hide();
}
