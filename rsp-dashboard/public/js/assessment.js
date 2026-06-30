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
        const posStandards = data.positionStandards || {};
        
        const category = app.category || 'Non-Teaching';
        const sg = posStandards.salaryGrade || '1'; 
        const position = app.position || 'N/A';
        
        document.getElementById('assessmentCategory').innerText = category;
        document.getElementById('assessmentSG').innerText = `${sg}`;
        document.getElementById('assessmentPosition').innerText = position;
        
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
        const posStandards = data.positionStandards || {};
        
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
