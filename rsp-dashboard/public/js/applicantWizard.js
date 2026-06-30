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

window.selectCategory = function(cat) {
    currentWizardCategory = cat;
    document.getElementById('categorySelection').classList.add('d-none');
    document.getElementById('positionSelection').classList.remove('d-none');
    document.getElementById('selectedCategoryTitle').innerText = `${cat} Positions`;
    
    const list = document.getElementById('positionList');
    list.innerHTML = '';
    positionsByCategory[cat].forEach(pos => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'list-group-item list-group-item-action py-3';
        btn.innerText = pos;
        btn.onclick = () => selectPosition(cat, pos);
        list.appendChild(btn);
    });
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
                    transitionModal('addApplicantModal', 'openEduModal', data.id);
                }
            } catch (err) {
                console.error(err);
                alert('Error adding applicant');
            }
        });
    }
});
