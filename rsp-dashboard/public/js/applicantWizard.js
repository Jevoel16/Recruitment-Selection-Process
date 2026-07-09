// Wizard Transition Helper
window.transitionModal = function(currentModalId, nextModalFn, id) {
    const modalEl = document.getElementById(currentModalId);
    
    // Force cleanup before transitioning
    if(modalEl) {
        const modalInstance = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
        modalInstance.hide();
    }
    
    setTimeout(() => {
        // Nuke any stuck backdrops
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        if (nextModalFn && typeof window[nextModalFn] === 'function') {
            window[nextModalFn](id, true);
        } else if (nextModalFn) {
            eval(nextModalFn + '(' + id + ', true);');
        } else {
            window.location.reload();
        }
    }, 300); // 300ms is standard Bootstrap modal transition time
};

// Wizard logic for categories & positions
const positionsByCategory = {
    'Related Teaching': [
        'Education Program Supervisor'
    ],
    'School Administration': [
        'School Principal I'
    ],
    'Non-Teaching': [
        'Administrative Aide I',
        'Watchman I',
        'Administrative Officer I',
        'Administrative Assistant III',
        'Legal Assistant I',
        'Project Development Officer I',
        'Administrative Officer II',
        'Administrative Officer IV',
        'Project Development Officer II'
    ]
};

let currentWizardCategory = '';
let currentPosPage = 1;
const posPerPage = 5;
let filteredPositions = [];

function renderCategoryGrid() {
    const cats = Object.keys(positionsByCategory);
    const container = document.getElementById('categorySelection');
    if (!container) return;
    
    container.innerHTML = '';
    
    let colClass = 'col-12';
    if (cats.length >= 4) colClass = 'col-6';
    else if (cats.length === 3) colClass = 'col-4';
    else if (cats.length === 2) colClass = 'col-6';
    
    cats.forEach(cat => {
        const div = document.createElement('div');
        div.className = colClass;
        
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-outline-primary w-100 py-4 fw-bold rounded-4 shadow-sm bg-white';
        
        // Add folder icon
        const icon = document.createElement('i');
        icon.className = 'bi bi-folder-fill fs-3 d-block mb-2';
        btn.appendChild(icon);
        
        const span = document.createElement('span');
        span.className = 'fs-6';
        span.innerText = cat;
        btn.appendChild(span);
        
        btn.onclick = () => selectCategory(cat);
        div.appendChild(btn);
        
        container.appendChild(div);
    });
}

window.selectCategory = function(cat) {
    currentWizardCategory = cat;
    document.getElementById('categorySelection').classList.add('d-none');
    document.getElementById('positionSelection').classList.remove('d-none');
    document.getElementById('selectedCategoryTitle').innerText = `${cat} Positions`;
    
    filteredPositions = positionsByCategory[cat] || [];
    currentPosPage = 1;
    renderPositionPage();
};

window.renderPositionPage = function() {
    const list = document.getElementById('positionList');
    list.innerHTML = '';
    
    PaginationHelper.paginateArray('wizardPositions', filteredPositions, posPerPage, (paginatedItems, currentPage, totalPages) => {
        paginatedItems.forEach(pos => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'list-group-item list-group-item-action py-3 fw-semibold text-secondary';
            btn.innerText = pos;
            btn.onclick = () => selectPosition(currentWizardCategory, pos);
            list.appendChild(btn);
        });
        
        // Update pagination controls visibility
        const container = document.getElementById('modalPositionPaginationContainer');
        if (container) {
            if (filteredPositions.length > posPerPage) {
                container.classList.remove('d-none');
                container.classList.add('d-block');
            } else {
                container.classList.add('d-none');
                container.classList.remove('d-block');
            }
        }
    }, false, 'modalPositionPaginationContainer');
};

window.backToCategories = function() {
    document.getElementById('positionSelection').classList.add('d-none');
    document.getElementById('categorySelection').classList.remove('d-none');
};

window.backToPositions = function() {
    document.getElementById('addApplicantModalTitle').innerText = 'New Applicant Wizard';
    document.getElementById('wizardStep1').classList.add('d-none');
    document.getElementById('wizardStep0').classList.remove('d-none');
};

window.selectPosition = function(cat, pos) {
    document.getElementById('wizardCategory').value = cat;
    document.getElementById('wizardPosition').value = pos;
    document.getElementById('addApplicantModalTitle').innerText = 'New Applicant Wizard - Personal Information';
    document.getElementById('wizardStep0').classList.add('d-none');
    document.getElementById('wizardStep1').classList.remove('d-none');
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('addApplicantModal')?.addEventListener('show.bs.modal', () => {
        document.getElementById('addApplicantModalTitle').innerText = 'New Applicant Wizard';
        document.getElementById('wizardStep0').classList.remove('d-none');
        document.getElementById('categorySelection').classList.remove('d-none');
        document.getElementById('positionSelection').classList.add('d-none');
        document.getElementById('wizardStep1').classList.add('d-none');
        document.getElementById('addApplicantForm').reset();
        
        renderCategoryGrid();
    });

    const addApplicantForm = document.getElementById('addApplicantForm');
    if (addApplicantForm) {
        addApplicantForm.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
                e.preventDefault();
            }
        });
        
        addApplicantForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const body = Object.fromEntries(formData.entries());
            
            try {
                const res = await fetch('/api/applicants', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                if (res.ok) {
                    const data = await res.json();
                    document.getElementById('successApplicationCode').innerText = data.applicationCode;
                    const successModalEl = document.getElementById('successModal');
                    const modal = new bootstrap.Modal(successModalEl);
                    
                    // Cleanup current modal then show success modal
                    const currentModal = bootstrap.Modal.getInstance(document.getElementById('addApplicantModal'));
                    if (currentModal) currentModal.hide();
                    
                    document.getElementById('successModalProceedBtn').onclick = () => {
                        transitionModal('successModal', 'openEduModal', data.id);
                    };
                    
                    setTimeout(() => modal.show(), 400);
                }
            } catch (err) {
                console.error(err);
                window.showToast('Error adding applicant', 'danger');
            }
        });
    }
});
