    let dynamicWizardCategory = '';
    let currentPositions = [];
    const itemsPerPage = 5;

    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            handleCategorySelection(e.currentTarget.getAttribute('data-category'));
        });
    });

    function handleCategorySelection(cat) {
        dynamicWizardCategory = cat;
        document.getElementById('categorySelectionContainer').classList.add('d-none');
        document.getElementById('positionSelection').classList.remove('d-none');
        document.getElementById('selectedCategoryTitle').innerText = `${cat}`;
        
        document.getElementById('positionSearch').value = '';
        currentPositions = window.dynamicPositionsByCategory ? (window.dynamicPositionsByCategory[cat] || []) : [];
        filterAndPaginatePositions(true);
    }

    function filterAndPaginatePositions(resetPage = false) {
        const searchQuery = document.getElementById('positionSearch').value.toLowerCase();
        
        let filtered = currentPositions;
        if (searchQuery) {
            filtered = currentPositions.filter(p => p.title.toLowerCase().includes(searchQuery) || (p.vacancyAnnouncementNo && String(p.vacancyAnnouncementNo).includes(searchQuery)));
        }

        if (typeof PaginationHelper !== 'undefined') {
            PaginationHelper.paginateArray('addAppPositions', filtered, itemsPerPage, (paginated, currentPg, totalPgs) => {
                const list = document.getElementById('positionList');
                list.innerHTML = '';

                if (paginated.length === 0) {
                    list.innerHTML = '<div class="p-4 text-center text-muted"><i class="bi bi-inbox fs-2 d-block mb-2"></i>No positions found.</div>';
                } else {
                    paginated.forEach(pos => {
                        const btn = document.createElement('button');
                        btn.type = 'button';
                        btn.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3 border-0 border-bottom bg-transparent fw-medium';
                        btn.innerHTML = `<span>${pos.title} <small class="text-muted ms-2">${pos.vacancyAnnouncementNo ? '(Vacancy #' + pos.vacancyAnnouncementNo + ')' : ''}</small></span> <i class="bi bi-chevron-right text-muted small"></i>`;
                        btn.onclick = () => handlePositionSelection(pos);
                        list.appendChild(btn);
                    });
                }

                const container = document.getElementById('positionPaginationContainer');
                if (container) {
                    if (filtered.length > itemsPerPage) {
                        container.classList.remove('d-none');
                        container.classList.add('d-block');
                    } else {
                        container.classList.add('d-none');
                        container.classList.remove('d-block');
                    }
                }
            }, resetPage, 'positionPaginationContainer');
        }
    }

    function handlePositionSelection(pos) {
        handleWizardPositionSelection(dynamicWizardCategory, pos);
    }

    function addAppBackToCategories() {
        document.getElementById('positionSelection').classList.add('d-none');
        document.getElementById('categorySelectionContainer').classList.remove('d-none');
    }

    function addAppBackToPositions() {
        document.getElementById('addApplicantTitle').innerHTML = '<i class="bi bi-person-plus-fill me-2"></i>New Applicant Wizard';
        document.getElementById('wizardStep1').classList.add('d-none');
        document.getElementById('wizardStep0').classList.remove('d-none');
    }

    function handleWizardPositionSelection(cat, pos) {
        document.getElementById('wizardCategory').value = cat;
        document.getElementById('wizardPosition').value = pos.title;
        document.getElementById('wizardVacancyAnnouncementNo').value = pos.vacancyAnnouncementNo || '';
        document.getElementById('selectedPositionText').innerHTML = `${cat} > ${pos.title} <small class="text-muted">${pos.vacancyAnnouncementNo ? '(Vacancy #' + pos.vacancyAnnouncementNo + ')' : ''}</small>`;
        document.getElementById('addApplicantTitle').innerHTML = '<i class="bi bi-person-vcard me-2"></i>Applicant Information';
        document.getElementById('wizardStep0').classList.add('d-none');
        document.getElementById('wizardStep1').classList.remove('d-none');
    }

    function nextTab(tabId) {
        const tabEl = document.querySelector('#' + tabId);
        if (tabEl) {
            const tab = new bootstrap.Tab(tabEl);
            tab.show();
        }
    }

    const wizardData = {
        education: [],
        training: [],
        experience: [],
        eligibility: []
    };

    function renderWizardList(type) {
        const prefixMap = { education: 'edu', training: 'train', experience: 'exp', eligibility: 'elig' };
        const listDiv = document.getElementById(`${prefixMap[type]}List`);
        if (!listDiv) return;
        
        let html = '<ul class="list-group">';
        if (wizardData[type].length === 0) {
            html += `<li class="list-group-item text-muted small border-0 px-0">No ${type} records added yet.</li>`;
        } else {
            wizardData[type].forEach((item, index) => {
                let text = '';
                if (type === 'education') text = `<strong>${item.degree}</strong> (${item.year})`;
                if (type === 'training') text = `<strong>${item.title}</strong> (${item.hours} hrs)`;
                if (type === 'experience') {
                    let parts = [];
                    if (item.years > 0) parts.push(item.years + (item.years == 1 ? " year" : " years"));
                    if (item.months > 0) parts.push(item.months + (item.months == 1 ? " month" : " months"));
                    let dur = parts.length > 0 ? parts.join(" & ") : "0 years";
                    text = `<strong>${item.details}</strong> (${dur})`;
                }
                if (type === 'eligibility') text = `<strong>${item.details}</strong> (Rating: ${item.rating})`;
                
                let linkHtml = item.link ? `<br><a href="${item.link}" target="_blank" class="text-primary text-decoration-none small"><i class="bi bi-link-45deg"></i> View Document</a>` : '';
                
                html += `<li class="list-group-item d-flex justify-content-between align-items-center rounded shadow-sm mb-2">
                    <span>${text}${linkHtml}</span>
                    <button type="button" class="btn btn-sm btn-outline-danger border-0" onclick="removeWizardItem('${type}', ${index})"><i class="bi bi-trash"></i></button>
                </li>`;
            });
        }
        html += '</ul>';
        listDiv.innerHTML = html;
        saveDraft(false);
    }

    window.removeWizardItem = function(type, index) {
        wizardData[type].splice(index, 1);
        renderWizardList(type);
        saveDraft();
    };

    document.getElementById('btn-add-edu')?.addEventListener('click', () => {
        const degree = document.getElementById('edu_degree').value;
        const year = document.getElementById('edu_year').value;
        const link = document.getElementById('edu_link')?.value || '';
        if (degree && year) {
            wizardData.education.push({ degree, year, link });
            document.getElementById('edu_degree').value = '';
            document.getElementById('edu_year').value = '';
            if (document.getElementById('edu_link')) document.getElementById('edu_link').value = '';
            renderWizardList('education');
            saveDraft();
        } else alert("Please provide both degree and year.");
    });

    document.getElementById('btn-add-train')?.addEventListener('click', () => {
        const title = document.getElementById('train_title').value;
        const hours = document.getElementById('train_hours').value;
        const link = document.getElementById('train_link')?.value || '';
        if (title && hours) {
            wizardData.training.push({ title, hours, link });
            document.getElementById('train_title').value = '';
            document.getElementById('train_hours').value = '';
            if (document.getElementById('train_link')) document.getElementById('train_link').value = '';
            renderWizardList('training');
            saveDraft();
        } else alert("Please provide both title and hours.");
    });

    document.getElementById('btn-add-exp')?.addEventListener('click', () => {
        const details = document.getElementById('exp_details').value;
        const years = document.getElementById('exp_years').value || 0;
        const months = document.getElementById('exp_months').value || 0;
        const link = document.getElementById('exp_link')?.value || '';
        if (details && (years > 0 || months > 0 || years === 0)) {
            wizardData.experience.push({ details, years, months, link });
            document.getElementById('exp_details').value = '';
            document.getElementById('exp_years').value = '';
            document.getElementById('exp_months').value = '';
            if (document.getElementById('exp_link')) document.getElementById('exp_link').value = '';
            renderWizardList('experience');
            saveDraft();
        } else alert("Please provide details and years/months.");
    });

    document.getElementById('btn-add-elig')?.addEventListener('click', () => {
        const details = document.getElementById('elig_details').value;
        const rating = document.getElementById('elig_rating').value;
        const link = document.getElementById('elig_link')?.value || '';
        if (details && rating) {
            wizardData.eligibility.push({ details, rating, link });
            document.getElementById('elig_details').value = '';
            document.getElementById('elig_rating').value = '';
            if (document.getElementById('elig_link')) document.getElementById('elig_link').value = '';
            renderWizardList('eligibility');
            saveDraft();
        } else alert("Please provide details and rating.");
    });

    let isFormDirty = false;
    
    // Initial render
    ['education', 'training', 'experience', 'eligibility'].forEach(renderWizardList);

    function saveDraft(setDirty = true) {
        const form = document.getElementById('addApplicantStandaloneForm');
        if (!form) return;
        if (setDirty) isFormDirty = true;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        let activeTab = 'tab-personal';
        const activeTabEl = document.querySelector('#applicantTabs .nav-link.active');
        if (activeTabEl) {
            activeTab = activeTabEl.id;
        }

        const draft = {
            formData: data,
            wizardData: wizardData,
            activeTab: activeTab
        };
        localStorage.setItem('addApplicantDraft', JSON.stringify(draft));
    }

    // Also trigger saveDraft when tabs are changed
    document.addEventListener('shown.bs.tab', function (event) {
        if (event.target.closest('#applicantTabs')) {
            saveDraft(false);
        }
    });

    window.addEventListener('beforeunload', function (e) {
        if (isFormDirty) {
            const confirmationMessage = 'You have unsaved changes. Are you sure you want to leave?';
            e.returnValue = confirmationMessage;
            return confirmationMessage;
        }
    });

    const addAppForm = document.getElementById('addApplicantStandaloneForm');
    if (addAppForm) {
        addAppForm.addEventListener('input', saveDraft);
        addAppForm.addEventListener('change', saveDraft);
        
        // Auto-restore draft (wait for DOM and Bootstrap)
        document.addEventListener('DOMContentLoaded', () => {
            const savedDraft = localStorage.getItem('addApplicantDraft');
            if (savedDraft) {
                let draft;
                try {
                    draft = JSON.parse(savedDraft);
                    
                    // Restore form fields
                    for (const [key, value] of Object.entries(draft.formData)) {
                        const inputs = addAppForm.querySelectorAll(`[name="${key}"]`);
                        inputs.forEach(input => {
                            if (input.type === 'checkbox' || input.type === 'radio') {
                                if (input.value === value) input.checked = true;
                            } else {
                                input.value = value;
                            }
                        });
                    }
                    
                    // Restore wizardData
                    if (draft.wizardData) {
                        Object.assign(wizardData, draft.wizardData);
                        ['education', 'training', 'experience', 'eligibility'].forEach(renderWizardList);
                    }
                    
                    // Restore active tab
                    if (draft.activeTab) {
                        nextTab(draft.activeTab);
                    }

                    // If a category/position was already selected, move directly to step 1
                    if (draft.formData.category && draft.formData.position) {
                        handleWizardPositionSelection(draft.formData.category, { title: draft.formData.position, vacancyAnnouncementNo: draft.formData.vacancyAnnouncementNo || null });
                    }
                } catch(err) {
                    console.error("Failed to restore draft", err);
                }
                
                // Check if the user has actually filled out some meaningful data
                let hasRealData = false;
                if (draft && draft.formData) {
                    for (const [key, value] of Object.entries(draft.formData)) {
                        if (key !== 'category' && key !== 'position' && value.trim() !== '') {
                            hasRealData = true;
                            break;
                        }
                    }
                }
                
                // If draft has actual data, mark form as dirty
                if (hasRealData || 
                    (draft && draft.wizardData && (draft.wizardData.education.length > 0 || 
                    draft.wizardData.training.length > 0 || 
                    draft.wizardData.experience.length > 0 || 
                    draft.wizardData.eligibility.length > 0))) {
                    isFormDirty = true;
                }
            } else {
                // No draft found, form is not dirty
                isFormDirty = false;
            }
        });

        addAppForm.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
            }
        });
        
        addAppForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!addAppForm.checkValidity()) {
                const firstInvalid = addAppForm.querySelector(':invalid');
                if (firstInvalid) {
                    let labelText = 'a required field';
                    let label = null;
                    if (firstInvalid.id) {
                        label = document.querySelector(`label[for="${firstInvalid.id}"]`);
                    }
                    if (!label && firstInvalid.closest('div')) {
                        label = firstInvalid.closest('div').querySelector('label');
                    }
                    if (label) {
                        labelText = label.innerText.replace('*', '').trim();
                    }
                    
                    let errorMsg = `Please fix the input for: ${labelText}`;
                    if (firstInvalid.name === 'contactNo' && firstInvalid.validity.patternMismatch) {
                        errorMsg = 'Contact No. must start with 09 and be exactly 11 digits.';
                    }
                    
                    if (window.showToast) {
                        window.showToast(errorMsg, 'danger');
                    } else {
                        alert(errorMsg);
                    }
                    
                    const tabPane = firstInvalid.closest('.tab-pane');
                    if (tabPane && !tabPane.classList.contains('active')) {
                        const tabId = tabPane.id.replace('pane-', 'tab-');
                        nextTab(tabId);
                    }
                    setTimeout(() => firstInvalid.focus(), 100);
                }
                return;
            }

            const btn = e.target.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving...';
            btn.disabled = true;

            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            const addressObj = {
                res_house: data.res_house, res_street: data.res_street, res_subdivision: data.res_subdivision,
                res_barangay: data.res_barangay, res_city: data.res_city, res_province: data.res_province, res_zip: data.res_zip
            };
            data.address = JSON.stringify(addressObj);
            
            data.education = JSON.stringify(wizardData.education);
            data.training = JSON.stringify(wizardData.training);
            data.experience = JSON.stringify(wizardData.experience);
            data.eligibility = JSON.stringify(wizardData.eligibility);

        try {
            const res = await fetch('/api/applicants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                const responseData = await res.json();
                isFormDirty = false; // Prevent beforeunload warning
                localStorage.removeItem('addApplicantDraft');
                document.getElementById('successApplicationCode').innerText = responseData.applicationCode;
                if (window.showToast) window.showToast('Applicant successfully saved!', 'success');
                const modal = new bootstrap.Modal(document.getElementById('successModal'));
                document.getElementById('successModalProceedBtn').onclick = () => {
                    modal.hide();
                    window.location.href = '/step1/1?search=' + encodeURIComponent(data.firstName + ' ' + data.lastName);
                };
                const closeBtn = document.getElementById('successModalCloseBtn');
                if(closeBtn) {
                    closeBtn.onclick = () => {
                        modal.hide();
                        window.location.reload();
                    };
                }
                modal.show();
            } else {
                const errorData = await res.json().catch(() => ({}));
                const errMsg = errorData.error || 'Failed to save applicant';
                if (window.showToast) window.showToast(errMsg, 'danger');
                else alert(errMsg);
                
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        } catch (err) {
            console.error(err);
            if (window.showToast) window.showToast('An error occurred while saving', 'danger');
            else alert('An error occurred');
            
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
        });
    }
