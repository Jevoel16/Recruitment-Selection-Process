document.addEventListener('DOMContentLoaded', () => {
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('mainSidebar');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', (e) => {
            e.preventDefault();
            sidebar.classList.toggle('collapsed');
        });
    }

    // Tab Navigation
    const tabs = document.querySelectorAll('.nav-link[data-target]');
    const sections = document.querySelectorAll('.tab-section');

    function switchTab(targetId) {
        tabs.forEach(t => t.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));
        
        const activeTab = document.querySelector(`.nav-link[data-target="${targetId}"]`);
        const activeSection = document.getElementById(`section-${targetId}`);
        
        if (activeTab && activeSection) {
            activeTab.classList.add('active');
            activeSection.classList.add('active');
        }
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(tab.getAttribute('data-target'));
        });
    });

    document.querySelectorAll('.btn-next').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const currentSection = e.target.closest('.tab-section');
            const requiredInputs = currentSection.querySelectorAll('[required]');
            let valid = true;
            requiredInputs.forEach(input => {
                if (!input.value) {
                    input.classList.add('is-invalid');
                    valid = false;
                } else {
                    input.classList.remove('is-invalid');
                }
            });
            if (valid) {
                switchTab(btn.getAttribute('data-next'));
            } else {
                alert('Please fill out all required fields before proceeding.');
            }
        });
    });

    document.querySelectorAll('.btn-prev').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.getAttribute('data-prev')));
    });

    // Arrays for dynamic lists
    const data = {
        education: [],
        training: [],
        experience: [],
        eligibility: []
    };

    function renderList(type) {
        const listDiv = document.getElementById(`${type.substring(0,3)}List`);
        if (!listDiv) return;
        
        let html = '<ul class="list-group">';
        if (data[type].length === 0) {
            html += `<li class="list-group-item text-muted small">No ${type} records added yet.</li>`;
        } else {
            data[type].forEach((item, index) => {
                let text = '';
                if (type === 'education') text = `<strong>${item.degree}</strong> (${item.year})`;
                if (type === 'training') text = `<strong>${item.title}</strong> (${item.hours} hrs)`;
                if (type === 'experience') text = `<strong>${item.details}</strong> (${item.years} yrs)`;
                if (type === 'eligibility') text = `<strong>${item.details}</strong> (Rating: ${item.rating})`;
                
                let linkHtml = item.link ? `<br><a href="${item.link}" target="_blank" class="text-primary text-decoration-none small"><i class="bi bi-link-45deg"></i> View Document</a>` : '';
                
                html += `<li class="list-group-item d-flex justify-content-between align-items-center">
                    <span>${text}${linkHtml}</span>
                    <button type="button" class="btn btn-sm btn-danger" onclick="removeItem('${type}', ${index})"><i class="bi bi-trash"></i></button>
                </li>`;
            });
        }
        html += '</ul>';
        listDiv.innerHTML = html;
    }

    window.removeItem = (type, index) => {
        data[type].splice(index, 1);
        renderList(type);
    };

    // Add items
    document.getElementById('btn-add-edu')?.addEventListener('click', () => {
        const degree = document.getElementById('edu_degree').value;
        const year = document.getElementById('edu_year').value;
        const link = document.getElementById('edu_link').value;
        if (degree && year) {
            data.education.push({ degree, year, link });
            document.getElementById('edu_degree').value = '';
            document.getElementById('edu_year').value = '';
            document.getElementById('edu_link').value = '';
            renderList('education');
        } else alert("Please provide degree and year.");
    });

    document.getElementById('btn-add-train')?.addEventListener('click', () => {
        const title = document.getElementById('train_title').value;
        const hours = document.getElementById('train_hours').value;
        const link = document.getElementById('train_link').value;
        if (title && hours) {
            data.training.push({ title, hours, link });
            document.getElementById('train_title').value = '';
            document.getElementById('train_hours').value = '';
            document.getElementById('train_link').value = '';
            renderList('training');
        } else alert("Please provide title and hours.");
    });

    document.getElementById('btn-add-exp')?.addEventListener('click', () => {
        const details = document.getElementById('exp_details').value;
        const years = document.getElementById('exp_years').value;
        const link = document.getElementById('exp_link').value;
        if (details && years) {
            data.experience.push({ details, years, link });
            document.getElementById('exp_details').value = '';
            document.getElementById('exp_years').value = '';
            document.getElementById('exp_link').value = '';
            renderList('experience');
        } else alert("Please provide details and years.");
    });

    document.getElementById('btn-add-elig')?.addEventListener('click', () => {
        const details = document.getElementById('elig_details').value;
        const rating = document.getElementById('elig_rating').value;
        const link = document.getElementById('elig_link').value;
        if (details && rating) {
            data.eligibility.push({ details, rating, link });
            document.getElementById('elig_details').value = '';
            document.getElementById('elig_rating').value = '';
            document.getElementById('elig_link').value = '';
            renderList('eligibility');
        } else alert("Please provide details and rating.");
    });

    // Initial render
    ['education', 'training', 'experience', 'eligibility'].forEach(renderList);

    // Form Submission
    const appForm = document.getElementById('applicationForm');
    if (appForm) {
        appForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(appForm);
            const payload = Object.fromEntries(formData.entries());
            
            // Append arrays as JSON strings
            payload.education = JSON.stringify(data.education);
            payload.training = JSON.stringify(data.training);
            payload.experience = JSON.stringify(data.experience);
            payload.eligibility = JSON.stringify(data.eligibility);
            
            try {
                const submitBtn = appForm.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Submitting...';
                
                const res = await fetch('/api/apply', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await res.json();
                
                if (result.success) {
                    document.getElementById('trackingCodeDisplay').textContent = result.applicationCode;
                    bootstrap.Modal.getOrCreateInstance(document.getElementById('successModal')).show();
                } else {
                    alert('Error submitting application: ' + result.error);
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Submit Application <i class="bi bi-check-circle"></i>';
                }
            } catch (err) {
                alert('Network error. Failed to submit application.');
                const submitBtn = appForm.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Submit Application <i class="bi bi-check-circle"></i>';
            }
        });
    }
});
