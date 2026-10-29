window.globalTabAbortController = new AbortController();
window.getTabAbortSignal = function() {
    if (window.globalTabAbortController) {
        window.globalTabAbortController.abort();
    }
    window.globalTabAbortController = new AbortController();
    return window.globalTabAbortController.signal;
};

document.addEventListener('DOMContentLoaded', function() {
    // Tab retention
    const tabs = document.querySelectorAll('button[data-bs-toggle="pill"]');
    tabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(e) {
            sessionStorage.setItem('activeDashboardTab', e.target.id);
            const url = new URL(window.location);
            if (e.target.id === 'masterlist-tab') url.searchParams.set('tab', 'masterlist');
            else if (e.target.id === 'categories-tab') url.searchParams.set('tab', 'categories');
            else if (e.target.id === 'backup-tab') url.searchParams.set('tab', 'backup');
            else url.searchParams.delete('tab');
            window.history.replaceState({}, '', url);
        });
    });

    const activeTabId = sessionStorage.getItem('activeDashboardTab');
    if (activeTabId) {
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.has('tab') && !urlParams.has('positionId')) {
            const tabToSelect = document.getElementById(activeTabId);
            if (tabToSelect) {
                bootstrap.Tab.getOrCreateInstance(tabToSelect).show();
            }
        }
    }

    const form = document.getElementById('positionForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const btn = document.getElementById('savePositionBtn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Saving...';
            btn.disabled = true;

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/positions/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if(result.success) {
                    const pos = vacancyPositionsById.get(String(data.id));
                    if (pos) Object.assign(pos, data, { vacancyAnnouncementNo: data.vacancyAnnouncementNo || '0' });
                    window.showToast('Position standards saved successfully!', 'success');
                    btn.classList.remove('btn-primary');
                    btn.classList.add('btn-success');
                    btn.innerHTML = '<i class="bi bi-check-lg me-2"></i> Saved Successfully';
                    setTimeout(() => {
                        btn.classList.remove('btn-success');
                        btn.classList.add('btn-primary');
                        btn.innerHTML = originalText;
                        btn.disabled = false;
                    }, 2000);
                } else {
                    showToast('Error saving position standards.', 'danger');
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            } catch (err) {
                console.error(err);
                showToast('Network error. Please try again.', 'danger');
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }
});

    async function initDashboard() {
        const categoriesPane = document.getElementById('categories');
        if (categoriesPane && categoriesPane.classList.contains('active')) ensureVacancySetup();
    }

    document.addEventListener('DOMContentLoaded', function() {
        initDashboard();

        const offAllBtn = document.getElementById('offAllVacancyBtn');
        if (offAllBtn) {
            offAllBtn.addEventListener('click', function() {
                const offAllModal = new bootstrap.Modal(document.getElementById('offAllVacanciesModal'));
                offAllModal.show();
            });
        }

        const confirmOffAllBtn = document.getElementById('confirmOffAllVacanciesBtn');
        if (confirmOffAllBtn) {
            confirmOffAllBtn.addEventListener('click', async function() {
                try {
                    const response = await fetch('/api/positions/vacancy-off-all', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const res = await response.json();
                    if (!res.success) throw new Error('Failed to turn off all vacancies');
                    
                    const modal = bootstrap.Modal.getInstance(document.getElementById('offAllVacanciesModal'));
                    if (modal) modal.hide();
                    
                    showToast('All vacancy positions turned off successfully!', 'success', true);
                } catch(e) {
                    console.error(e);
                    showToast('Error turning off all vacancies. Only administrators can change vacancies.', 'danger');
                }
            });
        }

        // Vacancy Setup rows are built after page load, so their handlers are delegated
        document.addEventListener('change', async function(e) {
            const toggle = e.target.closest('.vacancy-toggle');
            if (!toggle) return;
            const id = toggle.getAttribute('data-id');
            const in_vacancy = toggle.checked;

            // Toggle the button state immediately
            const pBtn = document.getElementById('plantilla-btn-' + id);
            if(pBtn) {
                pBtn.disabled = !in_vacancy;
            }

            // Update the slot count display
            const slotTd = document.getElementById('slot-count-' + id);
            if (slotTd) {
                if (in_vacancy && pBtn) {
                    slotTd.innerText = pBtn.getAttribute('data-count') || '0';
                } else {
                    slotTd.innerText = '0';
                }
            }

            try {
                const response = await fetch(`/api/positions/${id}/vacancy`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ in_vacancy })
                });
                const res = await response.json();
                if(!res.success) throw new Error(res.error || 'Failed to update vacancy status');
                const pos = vacancyPositionsById.get(String(id));
                if (pos) {
                    pos.in_vacancy = in_vacancy ? 1 : 0;
                    if (!in_vacancy) pos.vacancyAnnouncementNo = null;
                }
            } catch(e) {
                console.error(e);
                showToast(e.message || 'Error toggling vacancy', 'danger');
                toggle.checked = !in_vacancy;
            }
        });

        document.addEventListener('click', function(e) {
            const btn = e.target.closest('.position-info-btn');
            if (!btn) return;
            const pos = vacancyPositionsById.get(btn.getAttribute('data-id')) || {};
            const val = v => (v === null || v === undefined) ? '' : v;

            const title = btn.getAttribute('data-title');
            document.getElementById('positionInfoModalTitle').innerText = title;
            document.getElementById('modalPosId').value = btn.getAttribute('data-id');
            document.getElementById('modalPosVacancy').value = val(pos.vacancyAnnouncementNo);

            // Show QS Performance field only for Higher Teaching
            const isHigherTeaching = title && (
                title.toLowerCase().includes('teacher ii') ||
                title.toLowerCase().includes('teacher iii') ||
                title.toLowerCase().includes('teacher iv') ||
                title.toLowerCase().includes('teacher v') ||
                title.toLowerCase().includes('teacher vi') ||
                title.toLowerCase().includes('teacher vii') ||
                title.toLowerCase().includes('master teacher')
            );
            const perfContainer = document.getElementById('qsPerformanceContainer');
            if (perfContainer) {
                perfContainer.style.display = isHigherTeaching ? 'block' : 'none';
            }

            const plantillaStr = String(val(pos.plantillaItem));
            const pHidden = document.getElementById('modalPosPlantillaHidden');
            if(pHidden) pHidden.value = plantillaStr;

            const pList = document.getElementById('modalPosPlantillaList');
            if(pList) {
                pList.innerHTML = '';
                let itemsObj = [];
                try {
                    const parsed = JSON.parse(plantillaStr);
                    parsed.forEach(loc => {
                        if (loc.items && loc.items.trim() !== '') {
                            let locItems = loc.items.split(',').map(s => s.trim()).filter(s => s);
                            locItems.forEach(item => {
                                let locStr = loc.dropdown1 || loc.location || '';
                                itemsObj.push({item: item, loc: locStr});
                            });
                        }
                    });
                } catch (e) {
                    itemsObj = plantillaStr.split(',').map(s => s.trim()).filter(s => s).map(s => ({item: s, loc: ''}));
                }

                if (itemsObj.length > 0) {
                    const ul = document.createElement('ul');
                    ul.className = 'mb-0 ps-3';
                    ul.style.columnCount = '2';
                    ul.style.columnGap = '0.5rem';
                    ul.style.fontSize = '0.75rem';
                    itemsObj.forEach(obj => {
                        const li = document.createElement('li');
                        li.textContent = obj.loc ? `${obj.item} (${obj.loc})` : obj.item;
                        ul.appendChild(li);
                    });
                    pList.appendChild(ul);
                } else {
                    pList.innerHTML = '<span class="fst-italic" style="font-size: 0.75rem;">None</span>';
                }
            }
            document.getElementById('modalPosSalaryGrade').value = val(pos.salaryGrade);
            document.getElementById('modalPosMonthlySalary').value = val(pos.monthlySalary);
            document.getElementById('modalPosEdu').value = val(pos.qsEducation);
            document.getElementById('modalPosEduLevel').value = val(pos.qsEducationLevel);
            document.getElementById('modalPosTrain').value = val(pos.qsTraining);
            document.getElementById('modalPosTrainLevel').value = val(pos.qsTrainingLevel);
            document.getElementById('modalPosExp').value = val(pos.qsExperience);
            document.getElementById('modalPosExpLevel').value = val(pos.qsExperienceLevel);
            document.getElementById('modalPosElig').value = val(pos.qsEligibility);
            document.getElementById('modalPosPerf').value = val(pos.qsPerformance);
        });
    });



        const addPlantillaBtn = document.getElementById('addPlantillaSetBtn');
        if (addPlantillaBtn) {
            addPlantillaBtn.addEventListener('click', () => {
                const container = document.getElementById('plantillaSetsContainer');
                const template = container.querySelector('.plantilla-set');
                if (template) {
                    const clone = template.cloneNode(true);
                    clone.querySelector('.plantilla-items-input').value = '';
                    clone.querySelector('.plantilla-parenthetical').value = '';
                    clone.querySelector('.plantilla-assignment').value = '';
                    clone.querySelector('.plantilla-competency').value = 'Self- Management, Professionalism and Ethics, Result Focus, Teamwork, Service Orientation, Innovation';
                    clone.querySelector('.remove-plantilla-set').classList.remove('d-none');
                    container.appendChild(clone);
                }
            });
        }
        
        document.getElementById('plantillaSetsContainer')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-plantilla-set')) {
                e.target.closest('.plantilla-set').remove();
            }
        });

        document.addEventListener('click', function(e) {
            const btn = e.target.closest('.plantilla-setup-btn');
            if (!btn) return;
            document.getElementById('plantillaModalTitle').innerText = btn.getAttribute('data-title');
            document.getElementById('plantillaPosId').value = btn.getAttribute('data-id');
            
            const container = document.getElementById('plantillaSetsContainer');
            const template = container.querySelector('.plantilla-set').cloneNode(true);
            container.innerHTML = '';
            
            const plantillaStr = btn.getAttribute('data-plantilla') || '';
            try {
                const parsed = JSON.parse(plantillaStr);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    parsed.forEach((item, index) => {
                        const clone = template.cloneNode(true);
                        clone.querySelector('.plantilla-items-input').value = item.items || '';
                        clone.querySelector('.plantilla-parenthetical').value = item.parenthetical || '';
                        clone.querySelector('.plantilla-assignment').value = item.dropdown1 || item.assignment || '';
                        clone.querySelector('.plantilla-competency').value = item.dropdown2 || item.competency || 'Self- Management, Professionalism and Ethics, Result Focus, Teamwork, Service Orientation, Innovation';
                        if (index > 0) clone.querySelector('.remove-plantilla-set').classList.remove('d-none');
                        container.appendChild(clone);
                    });
                } else {
                    container.appendChild(template.cloneNode(true));
                }
            } catch (e) {
                const clone = template.cloneNode(true);
                clone.querySelector('.plantilla-items-input').value = plantillaStr;
                container.appendChild(clone);
            }
        });

        const plantillaForm = document.getElementById('plantillaForm');
        if(plantillaForm) {
            plantillaForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const btn = document.getElementById('savePlantillaBtn');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Saving...';
                btn.disabled = true;

                const id = document.getElementById('plantillaPosId').value;
                let dataArr = [];
                let vacancyCount = 0;
                
                document.querySelectorAll('.plantilla-set').forEach(setEl => {
                    const rawItems = setEl.querySelector('.plantilla-items-input').value;
                    const parenthetical = setEl.querySelector('.plantilla-parenthetical').value;
                    const drop1 = setEl.querySelector('.plantilla-assignment').value;
                    const drop2 = setEl.querySelector('.plantilla-competency').value;
                    
                    if (rawItems.trim()) {
                        const items = rawItems.split(',').map(s => s.trim()).filter(s => s !== '');
                        vacancyCount += items.length;
                        dataArr.push({
                            items: items.join(', '),
                            parenthetical: parenthetical,
                            dropdown1: drop1,
                            dropdown2: drop2
                        });
                    }
                });

                if (vacancyCount === 0) {
                    showToast('Please enter at least one Plantilla Item number.', 'warning');
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                    return;
                }
                
                const plantillaItem = JSON.stringify(dataArr);

                try {
                    const response = await fetch(`/api/positions/${id}/plantilla`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ vacancyCount, plantillaItem })
                    });
                    const res = await response.json();
                    if(res.success) {
                        btn.classList.replace('btn-success', 'btn-primary');
                        btn.innerHTML = '<i class="bi bi-check-lg me-2"></i> Saved';
                        
                        // update the button data attributes in UI
                        const pBtn = document.getElementById('plantilla-btn-' + id);
                        if(pBtn) {
                            pBtn.setAttribute('data-count', vacancyCount);
                            pBtn.setAttribute('data-plantilla', plantillaItem);
                        }
                        
                        // update the Slot column dynamically
                        const slotTd = document.getElementById('slot-count-' + id);
                        if(slotTd) {
                            slotTd.innerText = vacancyCount;
                        }
                        
                        const pos = vacancyPositionsById.get(String(id));
                        if (pos) {
                            pos.vacancyCount = vacancyCount;
                            pos.plantillaItem = plantillaItem;
                        }
                        
                        setTimeout(() => {
                            bootstrap.Modal.getInstance(document.getElementById('plantillaModal')).hide();
                            btn.classList.replace('btn-primary', 'btn-success');
                            btn.innerHTML = originalText;
                            btn.disabled = false;
                        }, 1000);
                    }
                } catch(err) {
                    console.error(err);
                    showToast('Error saving plantilla', 'danger');
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            });
        }

    // ---- Vacancy Setup: positions are fetched once and the category panes built client-side ----
    const vacancyPositionsById = new Map();
    let vacancySetupPromise = null;
    let vacancySetupLoaded = false;

    const vacancySlug = str => String(str).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();

    function vacancyEl(tag, className, attrs) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        for (const key in (attrs || {})) node.setAttribute(key, attrs[key]);
        return node;
    }

    function buildVacancyRow(pos, category, groupName) {
        const vacancyCount = pos.vacancyCount === null || pos.vacancyCount === undefined ? '' : String(pos.vacancyCount);
        const tr = vacancyEl('tr', 'vacancy-row', { 'data-category': category, 'data-title': pos.title || '', 'data-group': groupName });
        tr.innerHTML = '<td class="fw-semibold px-3"></td>' +
            '<td class="text-center"><div class="form-check form-switch d-flex justify-content-center">' +
                '<input class="form-check-input vacancy-toggle cursor-pointer" type="checkbox" style="transform: scale(1.3);"></div></td>' +
            '<td class="text-center"><button class="btn btn-sm btn-outline-success shadow-sm plantilla-setup-btn rounded-pill px-3" data-bs-toggle="modal" data-bs-target="#plantillaModal">' +
                '<i class="bi bi-list-ol me-1"></i> Setup</button></td>' +
            '<td class="text-center fw-bold text-secondary"></td>' +
            '<td class="text-center"><button class="btn btn-sm btn-outline-primary shadow-sm position-info-btn rounded-pill px-3" data-bs-toggle="modal" data-bs-target="#positionInfoModal">' +
                '<i class="bi bi-info-circle me-1"></i> Info</button></td>';
        const cells = tr.children;
        cells[0].textContent = pos.title || '';
        const toggle = cells[1].querySelector('.vacancy-toggle');
        toggle.setAttribute('data-id', pos.id);
        toggle.checked = !!pos.in_vacancy;
        const pBtn = cells[2].querySelector('.plantilla-setup-btn');
        pBtn.id = 'plantilla-btn-' + pos.id;
        pBtn.setAttribute('data-id', pos.id);
        pBtn.setAttribute('data-title', pos.title || '');
        pBtn.setAttribute('data-count', vacancyCount);
        pBtn.setAttribute('data-plantilla', pos.plantillaItem || '');
        pBtn.disabled = !pos.in_vacancy;
        cells[3].id = 'slot-count-' + pos.id;
        cells[3].textContent = pos.in_vacancy ? vacancyCount : '0';
        const infoBtn = cells[4].querySelector('.position-info-btn');
        infoBtn.setAttribute('data-id', pos.id);
        infoBtn.setAttribute('data-title', pos.title || '');
        return tr;
    }

    function buildVacancyCategoryPane(category, groups) {
        const categorySlug = vacancySlug(category);
        const pane = vacancyEl('div', 'tab-pane fade vacancy-category-group', {
            id: 'v-pills-' + categorySlug, role: 'tabpanel', 'data-category': category, 'data-bs-target': '#v-pills-' + categorySlug
        });
        pane.innerHTML = '<div class="bg-white p-4 rounded-4 shadow-sm border-0"><div class="row min-vh-50">' +
            '<div class="col-md-3 border-end pe-3"><h6 class="text-uppercase fw-bold text-muted mb-3 fs-7" style="letter-spacing: 1px;">Position Groups</h6>' +
                '<div class="nav flex-column nav-pills gap-1 sidebar-scroll" role="tablist" aria-orientation="vertical"></div></div>' +
            '<div class="col-md-9 ps-4"><div class="tab-content"></div></div></div></div>';
        const nav = pane.querySelector('.nav');
        nav.id = 'v-pills-group-' + categorySlug;
        const content = pane.querySelector('.tab-content');
        content.id = 'v-pills-group-tabContent-' + categorySlug;

        let first = true;
        groups.forEach((positions, groupName) => {
            const wrapperId = 'tab-pane-' + categorySlug + '-' + vacancySlug(groupName);
            const btn = vacancyEl('button', 'nav-link text-start fw-semibold vacancy-group-tab-btn rounded-3' + (first ? ' active' : ''), {
                id: 'tab-btn-' + categorySlug + '-' + vacancySlug(groupName), 'data-bs-toggle': 'pill', 'data-bs-target': '#' + wrapperId,
                type: 'button', role: 'tab', 'data-category': category, 'data-group': groupName, style: 'transition: all 0.2s;'
            });
            btn.innerHTML = '<i class="bi bi-folder2 me-2 opacity-75"></i> ';
            btn.append(groupName);
            nav.appendChild(btn);

            const wrapper = vacancyEl('div', 'tab-pane fade vacancy-group-wrapper' + (first ? ' show active' : ''), {
                id: wrapperId, role: 'tabpanel', 'data-category': category, 'data-group': groupName
            });
            wrapper.innerHTML = '<div class="d-flex justify-content-between align-items-center mb-3">' +
                    '<h5 class="fw-bold text-secondary mb-0"><i class="bi bi-journal-text me-2"></i></h5></div>' +
                '<div class="table-responsive border rounded-3"><table class="table table-hover align-middle mb-0 border-0 vacancyTable">' +
                    '<thead class="table-light border-bottom"><tr>' +
                        '<th class="fw-bold px-3 py-3">Position Name</th><th class="text-center fw-bold py-3">Vacancy</th>' +
                        '<th class="text-center fw-bold py-3">Plantilla</th><th class="text-center fw-bold py-3">Slots</th>' +
                        '<th class="text-center fw-bold py-3">Position Info</th>' +
                    '</tr></thead><tbody></tbody></table></div>' +
                '<div class="w-100 mt-2"></div>';
            wrapper.querySelector('h5').append(groupName);
            wrapper.lastElementChild.id = 'pagination-' + wrapperId;
            const tbody = wrapper.querySelector('tbody');
            positions.forEach(pos => tbody.appendChild(buildVacancyRow(pos, category, groupName)));
            content.appendChild(wrapper);
            first = false;
        });
        return pane;
    }

    function renderVacancySetup(positions) {
        // Same grouping the server used: category -> groupName (or title) -> positions
        const categories = new Map();
        vacancyPositionsById.clear();
        positions.forEach(pos => {
            vacancyPositionsById.set(String(pos.id), pos);
            if (!categories.has(pos.category)) categories.set(pos.category, new Map());
            const groups = categories.get(pos.category);
            const groupName = pos.groupName || pos.title;
            if (!groups.has(groupName)) groups.set(groupName, []);
            groups.get(groupName).push(pos);
        });
        const fragment = document.createDocumentFragment();
        categories.forEach((groups, category) => fragment.appendChild(buildVacancyCategoryPane(category, groups)));
        document.getElementById('v-pills-tabContent').replaceChildren(fragment);
    }

    function loadVacancySetup() {
        if (vacancySetupPromise) return vacancySetupPromise;
        const loading = document.getElementById('vacancySetupLoading');
        const grid = document.getElementById('vacancyCategorySelection');
        if (loading) {
            loading.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Loading positions...';
            loading.classList.remove('d-none');
        }
        if (grid) grid.classList.add('d-none');

        vacancySetupPromise = fetch('/api/positions/vacancy-setup')
            .then(response => {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.json();
            })
            .then(data => {
                renderVacancySetup(data.positions || []);
                vacancySetupLoaded = true;
                if (loading) loading.classList.add('d-none');
                if (grid) grid.classList.remove('d-none');
                return true;
            })
            .catch(err => {
                console.error('Failed to load vacancy setup', err);
                vacancySetupPromise = null; // allow a retry next time the tab opens
                if (loading) loading.textContent = 'Failed to load positions. Reopen the tab to try again.';
                return false;
            });
        return vacancySetupPromise;
    }

    function ensureVacancySetup() {
        if (!vacancySetupPromise && !vacancySetupLoaded) filterVacancyTable();
    }

    function filterVacancyTable() {
        if (!vacancySetupLoaded) {
            loadVacancySetup().then(ok => { if (ok) filterVacancyTable(); });
            return;
        }
        const query = document.getElementById('vacancySearch').value.toLowerCase();
        const categorySelect = document.getElementById('vacancyCategory');
        const selectedCategory = categorySelect.value;
        const statusSelect = document.getElementById('vacancyStatus');
        const selectedStatus = statusSelect.value;

        const availableCategories = new Set();
        let hasVacant = false;
        let hasNonVacant = false;

        // Pass 1: Determine interdependent available dropdown options
        document.querySelectorAll('.vacancy-row').forEach(row => {
            const title = row.getAttribute('data-title').toLowerCase();
            const category = row.getAttribute('data-category');
            const checkbox = row.querySelector('.vacancy-toggle');
            const isVacant = checkbox ? checkbox.checked : false;

            const matchQuery = !query || title.includes(query);
            const matchCategory = !selectedCategory || category === selectedCategory;
            let matchStatus = true;
            if (selectedStatus === 'vacant') matchStatus = isVacant;
            else if (selectedStatus === 'non-vacant') matchStatus = !isVacant;

            // For Category dropdown: ignore category filter
            if (matchQuery && matchStatus) {
                if (category) availableCategories.add(category);
            }

            // For Status dropdown: ignore status filter
            if (matchQuery && matchCategory) {
                if (isVacant) hasVacant = true;
                else hasNonVacant = true;
            }
        });

        // Rebuild Category Dropdown
        const originalCategoryValue = categorySelect.value;
        if (!window.originalVacancyCategories) {
            window.originalVacancyCategories = Array.from(categorySelect.options).map(o => ({ value: o.value, text: o.text }));
        }
        categorySelect.innerHTML = '<option value="">All Categories</option>';
        window.originalVacancyCategories.forEach(opt => {
            if (opt.value === '' || availableCategories.has(opt.value)) {
                if (opt.value !== '') categorySelect.insertAdjacentHTML('beforeend', `<option value="${opt.value}">${opt.text}</option>`);
            }
        });
        categorySelect.value = availableCategories.has(originalCategoryValue) ? originalCategoryValue : '';
        if (window.refreshChoices) window.refreshChoices('vacancyCategory');

        // Rebuild Status Dropdown
        statusSelect.innerHTML = '<option value="">All Statuses</option>';
        if (hasVacant) statusSelect.innerHTML += '<option value="vacant">Vacant</option>';
        if (hasNonVacant) statusSelect.innerHTML += '<option value="non-vacant">Non-Vacant</option>';
        
        if (selectedStatus === 'vacant' && hasVacant) statusSelect.value = 'vacant';
        else if (selectedStatus === 'non-vacant' && hasNonVacant) statusSelect.value = 'non-vacant';
        else statusSelect.value = '';
        if (window.refreshChoices) window.refreshChoices('vacancyStatus');

        const finalCategory = categorySelect.value;
        const finalStatus = statusSelect.value;
        
        // Pass 2: Hide/Show Rows
        document.querySelectorAll('.vacancy-row').forEach(row => {
            const title = row.getAttribute('data-title').toLowerCase();
            const category = row.getAttribute('data-category');
            const checkbox = row.querySelector('.vacancy-toggle');
            const isVacant = checkbox ? checkbox.checked : false;
            
            const matchCategory = !finalCategory || category === finalCategory;
            const matchQuery = !query || title.includes(query);
            let matchStatus = true;
            if (finalStatus === 'vacant') matchStatus = isVacant;
            else if (finalStatus === 'non-vacant') matchStatus = !isVacant;
            
            if (matchCategory && matchQuery && matchStatus) {
                row.classList.remove('search-hidden-row');
                row.style.display = ''; // Reset display style
            } else {
                row.classList.add('search-hidden-row');
                row.style.setProperty('display', 'none', 'important');
            }
        });

        // Pass 3: Hide/Show Position Group Wrappers and Nav Links based on visible rows
        document.querySelectorAll('.vacancy-group-wrapper').forEach(wrapper => {
            const category = wrapper.getAttribute('data-category');
            const group = wrapper.getAttribute('data-group');
            const navLink = document.querySelector(`.vacancy-group-tab-btn[data-category="${category}"][data-group="${group}"]`);

            if (finalCategory && category !== finalCategory) {
                wrapper.classList.add('search-hidden');
                wrapper.style.setProperty('display', 'none', 'important');
                if (navLink) navLink.style.setProperty('display', 'none', 'important');
                return;
            }
            const rowsInGroup = wrapper.querySelectorAll('.vacancy-row');
            let hasVisibleRow = Array.from(rowsInGroup).some(row => !row.classList.contains('search-hidden-row'));
            
            if (hasVisibleRow) {
                wrapper.classList.remove('search-hidden');
                wrapper.style.display = '';
                if (navLink) navLink.style.display = '';
            } else {
                wrapper.classList.add('search-hidden');
                wrapper.style.setProperty('display', 'none', 'important');
                if (navLink) navLink.style.setProperty('display', 'none', 'important');
            }
        });

        // Ensure a visible tab is active
        document.querySelectorAll('.vacancy-category-group').forEach(catPane => {
            const visibleLinks = Array.from(catPane.querySelectorAll('.vacancy-group-tab-btn')).filter(btn => btn.style.display !== 'none');
            
            let activeLink = visibleLinks.find(btn => btn.classList.contains('active'));
            
            if (!activeLink && visibleLinks.length > 0) {
                // Clean up any stray active classes
                catPane.querySelectorAll('.vacancy-group-tab-btn').forEach(btn => btn.classList.remove('active'));
                catPane.querySelectorAll('.vacancy-group-wrapper').forEach(pane => pane.classList.remove('show', 'active'));
                
                // Activate the first visible tab
                const firstLink = visibleLinks[0];
                firstLink.classList.add('active');
                const targetPane = document.querySelector(firstLink.getAttribute('data-bs-target'));
                if (targetPane) {
                    targetPane.classList.add('show', 'active');
                }
            }
        });
        
        // Apply row-level pagination for each visible position group
        document.querySelectorAll('.vacancy-group-wrapper:not(.search-hidden)').forEach(wrapper => {
            const visibleRows = Array.from(wrapper.querySelectorAll('.vacancy-row:not(.search-hidden-row)'));
            PaginationHelper.paginateDOM(`vacancy-table-${wrapper.id}`, visibleRows, 10, `pagination-${wrapper.id}`, true);
        });

        let firstVisibleTab = null;
        document.querySelectorAll('.vacancy-category-group').forEach(pane => {
            const category = pane.getAttribute('data-category');
            const gridItem = document.querySelector(`.vacancy-category-grid-item[data-category="${category}"]`);
            
            if (finalCategory && category !== finalCategory) {
                if (gridItem) gridItem.style.setProperty('display', 'none', 'important');
                return;
            }
            
            const groupsInCategory = pane.querySelectorAll('.vacancy-group-wrapper:not(.search-hidden)');
            let hasVisibleGroup = groupsInCategory.length > 0;
            
            if (hasVisibleGroup) {
                if (gridItem) gridItem.style.display = '';
                if (!firstVisibleTab) firstVisibleTab = pane;
            } else {
                if (gridItem) gridItem.style.setProperty('display', 'none', 'important');
            }
        });
        
        const emptyState = document.getElementById('vacancyEmptyState');
        if (emptyState) {
            if (firstVisibleTab) {
                emptyState.classList.add('d-none');
            } else {
                emptyState.classList.remove('d-none');
            }
        }
        
        if (firstVisibleTab && (query || finalCategory)) {
            const slug = firstVisibleTab.getAttribute('id').replace('v-pills-', '');
            const title = firstVisibleTab.getAttribute('data-category');
            if (typeof showVacancyCategory === 'function') {
                showVacancyCategory(slug, title);
            }
        } else if (!query && !finalCategory && typeof showVacancyCategorySelection === 'function') {
            showVacancyCategorySelection();
        }
    }


        let metricsChartInstance = null;
        let metricsDataCache = null;

        async function showCategoryChart(categoryName) {
            document.getElementById('metricsDashboardGrid').classList.add('d-none');
            document.getElementById('metricsChartContainer').classList.remove('d-none');
            document.getElementById('metricsChartTitle').innerText = categoryName;

            let data = metricsDataCache;
            if (!data) {
                const response = await fetch('/api/dashboard/metrics');
                data = await response.json();
                metricsDataCache = data;
            }
            
            let catData = null;
            for (const key in data.groupedPositions) {
                if (data.groupedPositions[key].categoryName === categoryName) {
                    catData = data.groupedPositions[key];
                    break;
                }
            }
            
            const flexContainer = document.getElementById('chartFlexContainer');
            const noVacancyMessage = document.getElementById('noVacancyMessage');
            
            if (!catData || !catData.positions || catData.positions.length === 0) {
                flexContainer.classList.add('d-none');
                noVacancyMessage.classList.remove('d-none');
                return;
            } else {
                flexContainer.classList.remove('d-none');
                noVacancyMessage.classList.add('d-none');
            }

            const ctx = document.getElementById('categoryPieChart').getContext('2d');
            
            if (metricsChartInstance) {
                metricsChartInstance.destroy();
            }

            const labels = catData.positions.map(p => p.title);
            const counts = catData.positions.map(p => p.count);
            
            const backgroundColors = [
                'rgba(13, 110, 253, 0.8)', 'rgba(102, 16, 242, 0.8)', 'rgba(111, 66, 193, 0.8)', 'rgba(214, 51, 132, 0.8)', 
                'rgba(220, 53, 69, 0.8)', 'rgba(253, 126, 20, 0.8)', 'rgba(255, 193, 7, 0.8)', 'rgba(25, 135, 84, 0.8)', 
                'rgba(32, 201, 151, 0.8)', 'rgba(13, 202, 240, 0.8)'
            ];
            
            metricsChartInstance = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: counts,
                        backgroundColor: Array.from({length: labels.length}, (_, i) => backgroundColors[i % backgroundColors.length]),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });

            // Build custom scrollable legend
            const customLegendContainer = document.getElementById('customChartLegend');
            customLegendContainer.innerHTML = '';
            
            labels.forEach((label, index) => {
                const count = counts[index];
                const color = backgroundColors[index % backgroundColors.length];
                
                const legendItem = document.createElement('div');
                legendItem.className = 'd-flex justify-content-between align-items-center mb-2 p-2 border rounded-3 bg-light';
                legendItem.style.cursor = 'pointer';
                legendItem.style.transition = 'opacity 0.2s';
                
                legendItem.innerHTML = `
                    <div class="d-flex align-items-center" style="overflow: hidden;">
                        <span style="display: inline-block; width: 12px; height: 12px; background-color: ${color}; border-radius: 50%; margin-right: 10px; flex-shrink: 0;"></span>
                        <span class="text-truncate fw-semibold text-secondary legend-label-text" title="${escapeHtml(label)}" style="font-size: 0.85rem; transition: text-decoration 0.2s;">${escapeHtml(label)}</span>
                    </div>
                    <span class="badge bg-primary rounded-pill ms-2">${count}</span>
                `;
                
                const labelSpan = legendItem.querySelector('.legend-label-text');

                legendItem.onclick = () => {
                    const meta = metricsChartInstance.getDatasetMeta(0);
                    const isHidden = meta.data[index].hidden;
                    
                    if (isHidden) {
                        meta.data[index].hidden = false;
                        legendItem.style.opacity = '1';
                        labelSpan.style.textDecoration = 'none';
                    } else {
                        meta.data[index].hidden = true;
                        legendItem.style.opacity = '0.5';
                        labelSpan.style.textDecoration = 'line-through';
                    }
                    metricsChartInstance.update();
                };
                
                customLegendContainer.appendChild(legendItem);
            });
        }

        function hideCategoryChart() {
            document.getElementById('metricsChartContainer').classList.add('d-none');
            document.getElementById('metricsDashboardGrid').classList.remove('d-none');
        }

        async function refreshMetricsTab() {
            metricsDataCache = null;
            try {
                const signal = window.getTabAbortSignal();
                const response = await fetch('/api/dashboard/metrics', { signal });
                const data = await response.json();
                metricsDataCache = data;
                
                const mainCount = document.getElementById('metricsTotalVacant');
                if (mainCount) mainCount.innerText = data.totalVacantCount;
                
                for (const cat in data.groupedPositions) {
                    const catData = data.groupedPositions[cat];
                    const catName = catData.categoryName;
                    
                    const catCount = document.querySelector(`[data-category-count="${catName}"]`);
                    if (catCount) {
                        catCount.innerText = catData.vacantCount;
                        if (catData.hasVacancy) {
                            catCount.classList.add('text-success');
                            catCount.classList.remove('text-muted');
                        } else {
                            catCount.classList.remove('text-success');
                            catCount.classList.add('text-muted');
                        }
                    }
                    
                    const catBadge = document.querySelector(`[data-category-badge="${catName}"]`);
                    if (catBadge) {
                        if (catData.hasVacancy) {
                            catBadge.classList.replace('bg-secondary', 'bg-success');
                            catBadge.innerText = 'Active';
                        } else {
                            catBadge.classList.replace('bg-success', 'bg-secondary');
                            catBadge.innerText = 'No Vacancy';
                        }
                    }
                    
                    const catCard = document.querySelector(`[data-category-card="${catName}"]`);
                    if (catCard) {
                        if (catData.hasVacancy) {
                            catCard.classList.replace('border-secondary', 'border-success');
                            catCard.classList.remove('opacity-75');
                        } else {
                            catCard.classList.replace('border-success', 'border-secondary');
                            catCard.classList.add('opacity-75');
                        }
                    }
                }
            } catch(e) {
                if (e.name === 'AbortError') return;
                console.error('Error fetching metrics', e);
            }
        }

        async function refreshEmailLimits() {
            try {
                const limitText = document.getElementById('dailyEmailLimitText');
                if (!limitText) return;
                
                const signal = window.getTabAbortSignal();
                const response = await fetch('/api/export/email-codes/limits', { signal });
                const data = await response.json();
                
                if (response.ok && data.success) {
                    limitText.innerHTML = `<strong>${data.remaining}</strong> emails remaining in the last 24h (Limit: ${data.dailyLimit})`;
                    const buttons = document.querySelectorAll('button[onclick^="openEmailModal"]');
                    if (data.remaining <= 0) {
                        limitText.classList.replace('text-muted', 'text-danger');
                        buttons.forEach(btn => btn.disabled = true);
                    } else {
                        limitText.classList.replace('text-danger', 'text-muted');
                        buttons.forEach(btn => btn.disabled = false);
                    }
                }
            } catch(e) {
                if (e.name === 'AbortError') return;
                console.error('Error fetching email limits', e);
            }
        }

        document.getElementById('dashboardTabs').addEventListener('show.bs.tab', function (event) {
            if (event.target.id === 'metrics-tab') {
                refreshMetricsTab();
            } else if (event.target.id === 'categories-tab') {
                ensureVacancySetup();
            } else if (event.target.id === 'backup-tab') {
                refreshEmailLimits();
            }
        });
        
        // Also load initially if backup tab is active on load
        document.addEventListener('DOMContentLoaded', () => {
            if (document.getElementById('backup').classList.contains('active')) {
                refreshEmailLimits();
            }
        });

        let emailSelectionModal;
        let globalEmailApplicants = [];
        let currentEmailDispatchType = 'codes'; // 'codes' or 'docs'

        async function openEmailModal(type = 'codes') {
            currentEmailDispatchType = type;
            try {
                const response = await fetch(`/api/export/email-codes/applicants?type=${type}`);
                const data = await response.json();
                
                if (response.ok && data.success) {
                    globalEmailApplicants = data.applicants;
                    const listContainer = document.getElementById('emailApplicantsList');
                    listContainer.innerHTML = '';
                    
                    const positionSelect = document.getElementById('emailFilterPosition');
                    const vacancySelect = document.getElementById('emailFilterVacancy');
                    
                    if (globalEmailApplicants.length === 0) {
                        listContainer.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No applicants with valid email addresses found.</td></tr>';
                        document.getElementById('selectAllEmails').disabled = true;
                        document.getElementById('sendEmailBtn').disabled = true;
                        positionSelect.innerHTML = '<option value="">All Positions</option>';
                        vacancySelect.innerHTML = '<option value="">All Vacancies</option>';
                        document.getElementById('emailFilterStatus').innerHTML = '<option value="">All Email Statuses</option>';
                        if (window.refreshChoices) {
                            window.refreshChoices('emailFilterPosition');
                            window.refreshChoices('emailFilterVacancy');
                            window.refreshChoices('emailFilterStatus');
                        }
                    } else {
                        document.getElementById('selectAllEmails').disabled = false;
                        document.getElementById('sendEmailBtn').disabled = false;
                        document.getElementById('selectAllEmails').checked = false;
                        
                        const positions = new Set();
                        const emailCounts = new Set();
                        
                        globalEmailApplicants.forEach(app => {
                            if (app.position) positions.add(app.position);
                            const count = app.emailCount || 0;
                            emailCounts.add(count);
                            
                            const tr = document.createElement('tr');
                            tr.className = 'email-applicant-item';
                            tr.dataset.name = `${app.firstName} ${app.lastName}`.toLowerCase();
                            tr.dataset.code = (app.applicationCode || '').toLowerCase();
                            tr.dataset.email = (app.emailAddress || '').toLowerCase();
                            tr.dataset.position = app.position || '';
                            tr.dataset.vacancy = app.vacancyAnnouncementNo || '';
                            tr.dataset.status = app.status || '';
                            tr.dataset.emailCount = count;
                            
                            const emailCountStr = count ? `<span class="badge bg-success rounded-pill"><i class="bi bi-check2-circle"></i> Sent ${count}x</span>` : `<span class="badge bg-secondary rounded-pill opacity-50">Not sent yet</span>`;
                            
                            tr.innerHTML = `
                                <td>
                                    <input class="form-check-input mt-0 email-applicant-cb" type="checkbox" value="${app.id}" id="emailCb${app.id}" onchange="updateSelectedEmailCount()" style="width: 1.25rem; height: 1.25rem;">
                                </td>
                                <td>
                                    <label class="form-check-label fw-bold" for="emailCb${app.id}">
                                        ${escapeHtml(app.firstName)} ${escapeHtml(app.lastName)}
                                    </label>
                                    <div class="mt-1 d-none pdf-ready-badge" id="pdf-ready-${app.id}">
                                        <span class="badge bg-success"><i class="bi bi-file-earmark-pdf-fill"></i> Pre-generated</span>
                                    </div>
                                </td>
                                <td>
                                    <div class="small fw-bold">${escapeHtml(app.applicationCode || 'N/A')}</div>
                                    <div class="small text-muted">${escapeHtml(app.emailAddress)}</div>
                                </td>
                                <td>
                                    <div class="small">${escapeHtml(app.position || 'N/A')}</div>
                                    <div class="small text-muted">Vacancy Announcement No. ${escapeHtml(app.vacancyAnnouncementNo || 'N/A')}</div>
                                </td>
                                <td>
                                    ${emailCountStr}
                                </td>
                            `;
                            listContainer.appendChild(tr);
                        });
                        
                        updateEmailModalDropdowns();
                    }
                    
                    document.getElementById('emailSearchName').value = '';
                    document.getElementById('emailFilterStatus').value = '';
                    if (currentEmailDispatchType === 'docs') {
                        window.refreshPdfBadges();
                    }

                    if (!emailSelectionModal) {
                        emailSelectionModal = new bootstrap.Modal(document.getElementById('emailSelectionModal'));
                    }
                    emailSelectionModal.show();
                } else {
                    if (window.showToast) window.showToast('Failed to fetch applicants.', 'danger');
                }
            } catch (error) {
                console.error('Error fetching applicants:', error);
                if (window.showToast) window.showToast('An error occurred while fetching applicants.', 'danger');
            }
        }
        
        window.refreshPdfBadges = async function() {
            if (currentEmailDispatchType !== 'docs') return;
            
            try {
                const res = await fetch(`/api/export/check-generated-docs`);
                const data = await res.json();
                
                document.querySelectorAll('.pdf-ready-badge').forEach(badge => badge.classList.add('d-none'));
                
                if (data.success && data.readyIds) {
                    data.readyIds.forEach(id => {
                        const badge = document.getElementById(`pdf-ready-${id}`);
                        if (badge) badge.classList.remove('d-none');
                    });
                }
            } catch(e) {
                console.error('Error fetching generated docs check:', e);
            }
        };
        
                function updateEmailModalDropdowns() {
            const search = document.getElementById('emailSearchName').value.toLowerCase();
            const currentPosition = document.getElementById('emailFilterPosition').value;
            const currentVacancy = document.getElementById('emailFilterVacancy').value;
            const currentStatus = document.getElementById('emailFilterStatus').value;

            const positions = new Set();
            const vacancies = new Set();
            const statuses = new Set();

            globalEmailApplicants.forEach(app => {
                const nameMatch = `${app.firstName} ${app.lastName}`.toLowerCase().includes(search) || 
                                  (app.applicationCode || '').toLowerCase().includes(search) || 
                                  (app.emailAddress || '').toLowerCase().includes(search);
                const posMatch = !currentPosition || String(app.position || '') === currentPosition;
                const vacMatch = !currentVacancy || String(app.vacancyAnnouncementNo || '') === currentVacancy;
                const statusMatch = !currentStatus || String(app.emailCount || 0) === currentStatus;

                // For Position dropdown
                if (nameMatch && vacMatch && statusMatch) {
                    if (app.position) positions.add(app.position);
                }

                // For Vacancy dropdown
                if (nameMatch && posMatch && statusMatch) {
                    if (app.vacancyAnnouncementNo) vacancies.add(String(app.vacancyAnnouncementNo));
                }

                // For Status dropdown
                if (nameMatch && posMatch && vacMatch) {
                    statuses.add(app.emailCount || 0);
                }
            });

            const posSelect = document.getElementById('emailFilterPosition');
            posSelect.innerHTML = '<option value="">All Positions</option>';
            Array.from(positions).sort().forEach(p => {
                posSelect.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`);
            });
            posSelect.value = positions.has(currentPosition) ? currentPosition : '';
            if (window.refreshChoices) window.refreshChoices('emailFilterPosition');

            const vacSelect = document.getElementById('emailFilterVacancy');
            vacSelect.innerHTML = '<option value="">All Vacancies</option>';
            Array.from(vacancies).sort().forEach(v => {
                vacSelect.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`);
            });
            vacSelect.value = vacancies.has(currentVacancy) ? currentVacancy : '';
            if (window.refreshChoices) window.refreshChoices('emailFilterVacancy');

            const statSelect = document.getElementById('emailFilterStatus');
            statSelect.innerHTML = '<option value="">All Email Statuses</option>';
            Array.from(statuses).sort((a,b) => a-b).forEach(c => {
                const label = c === 0 ? 'Not Sent (0)' : `Sent ${c}x`;
                statSelect.insertAdjacentHTML('beforeend', `<option value="${c}">${label}</option>`);
            });
            statSelect.value = statuses.has(Number(currentStatus)) || (currentStatus === '0' && statuses.has(0)) ? currentStatus : '';
            if (window.refreshChoices) window.refreshChoices('emailFilterStatus');
        }

        window.submitBackupSearch = function() {
            document.getElementById('emailFilterPosition').value = '';
            document.getElementById('emailFilterVacancy').value = '';
            document.getElementById('emailFilterStatus').value = '';
            filterEmailApplicants();
        };

        function filterEmailApplicants() {
            updateEmailModalDropdowns();
            const search = document.getElementById('emailSearchName').value.toLowerCase();
            const positionSelect = document.getElementById('emailFilterPosition');
            const position = positionSelect.value;
            const vacancy = document.getElementById('emailFilterVacancy').value;
            const emailStatus = document.getElementById('emailFilterStatus').value;
            
            const items = document.querySelectorAll('.email-applicant-item');
            let anyVisible = false;
            
            items.forEach(item => {
                const nameMatch = item.dataset.name.includes(search) || item.dataset.code.includes(search) || item.dataset.email.includes(search);
                const posMatch = !position || item.dataset.position === position;
                const vacMatch = !vacancy || item.dataset.vacancy === vacancy;
                const statusMatch = !emailStatus || item.dataset.emailCount === emailStatus;
                
                if (nameMatch && posMatch && vacMatch && statusMatch) {
                    item.classList.remove('d-none');
                    anyVisible = true;
                } else {
                    item.classList.add('d-none');
                }
            });
            
            const emptyState = document.getElementById('emailEmptyState');
            if (emptyState) {
                if (anyVisible) {
                    emptyState.classList.add('d-none');
                } else {
                    emptyState.classList.remove('d-none');
                }
            }
            
            updateSelectedEmailCount();
        }

        function toggleSelectAllEmails(checkbox) {
            const visibleCheckboxes = Array.from(document.querySelectorAll('.email-applicant-item:not(.d-none) .email-applicant-cb'));
            visibleCheckboxes.forEach(cb => cb.checked = checkbox.checked);
            updateSelectedEmailCount();
        }

        function updateSelectedEmailCount() {
            const visibleCheckboxes = Array.from(document.querySelectorAll('.email-applicant-item:not(.d-none) .email-applicant-cb'));
            const visibleSelectedCount = visibleCheckboxes.filter(cb => cb.checked).length;
            
            const totalSelected = document.querySelectorAll('.email-applicant-cb:checked').length;
            
            const badge = document.getElementById('selectedCountBadge');
            badge.innerText = `${totalSelected} Selected`;
            document.getElementById('sendEmailBtn').innerHTML = `<i class="bi bi-send-fill me-2"></i> Send to Selected (${totalSelected})`;
            
            const selectAll = document.getElementById('selectAllEmails');
            if (visibleCheckboxes.length > 0) {
                selectAll.checked = visibleSelectedCount === visibleCheckboxes.length;
            } else {
                selectAll.checked = false;
            }
        }

        let emailConfirmationModal;

        function promptEmailConfirmation() {
            const checkboxes = document.querySelectorAll('.email-applicant-cb:checked');
            const selectedCount = checkboxes.length;
            
            if (selectedCount === 0) {
                if (window.showToast) window.showToast('Please select at least one applicant.', 'danger');
                return;
            }
            
            document.getElementById('confirmEmailCount').innerText = selectedCount;
            document.getElementById('emailConfirmTypeLabel').innerText = currentEmailDispatchType === 'docs' ? 'Step 1 generated docs' : 'application codes';
            
            
            if (!emailConfirmationModal) {
                emailConfirmationModal = new bootstrap.Modal(document.getElementById('emailConfirmationModal'));
            }
            emailConfirmationModal.show();
        }


        window.preGeneratePDFs = async function() {
            const selectedCheckboxes = document.querySelectorAll('.email-applicant-cb:checked');
            const selectedApplicantIds = Array.from(selectedCheckboxes).map(cb => cb.value);
            
            if (selectedApplicantIds.length === 0) {
                if (window.showToast) window.showToast('Please select at least one applicant.', 'danger');
                return;
            }

            const btn = document.getElementById('preGenerateBtn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Generating...';
            btn.disabled = true;

            const chunkSize = 5;
            const chunks = [];
            for (let i = 0; i < selectedApplicantIds.length; i += chunkSize) {
                chunks.push(selectedApplicantIds.slice(i, i + chunkSize));
            }

            let hasErrors = false;
            const handleBeforeUnload = (e) => {
                e.preventDefault();
                e.returnValue = 'PDFs are currently being generated. Are you sure you want to leave?';
            };
            window.addEventListener('beforeunload', handleBeforeUnload);

            try {
                let processedApplicants = 0;
                const totalApplicants = selectedApplicantIds.length;

                for (let i = 0; i < chunks.length; i++) {
                    const chunk = chunks[i];
                    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Gen... (${processedApplicants}/${totalApplicants})`;

                    const payload = { applicantIds: chunk };

                    const response = await fetch('/api/export/pre-generate-docs', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    const data = await response.json();
                    if (!response.ok || !data.success) {
                        hasErrors = true;
                        console.error('Chunk error:', data.message);
                    }
                    processedApplicants += chunk.length;
                }

                btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Finishing...`;
                
                let finalMessage = `Pre-generation completed for ${totalApplicants} applicants.`;
                if (hasErrors) {
                    finalMessage += ' (Some errors occurred, check logs)';
                    if (window.showToast) window.showToast(finalMessage, 'warning', true);
                } else {
                    if (window.showToast) window.showToast(finalMessage, 'success', true);
                }
            } catch (error) {
                console.error('Error pre-generating:', error);
                if (window.showToast) window.showToast(error.message || 'An error occurred.', 'danger');
            } finally {
                window.removeEventListener('beforeunload', handleBeforeUnload);
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        };

        async function confirmSubmitEmailCodes() {
            const selectedCheckboxes = document.querySelectorAll('.email-applicant-cb:checked');
            const selectedApplicantIds = Array.from(selectedCheckboxes).map(cb => cb.value);
            
            if (selectedApplicantIds.length === 0) {
                if (window.showToast) window.showToast('Please select at least one applicant.', 'danger');
                return;
            }

            const accountSelect = document.getElementById('emailAccountSelect');
            if (!accountSelect || !accountSelect.value) {
                if (window.showToast) window.showToast('Please select an email account.', 'danger');
                return;
            }

            const btn = document.getElementById('confirmSendEmailBtn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Preparing...';
            btn.disabled = true;

            const chunkSize = 5;
            const chunks = [];
            for (let i = 0; i < selectedApplicantIds.length; i += chunkSize) {
                chunks.push(selectedApplicantIds.slice(i, i + chunkSize));
            }

            let hasErrors = false;

            // Warn user if they try to leave the page
            const handleBeforeUnload = (e) => {
                e.preventDefault();
                e.returnValue = 'Emails are currently being sent. Please do not close or refresh the page until the process is complete.';
            };
            window.addEventListener('beforeunload', handleBeforeUnload);

            try {
                let processedApplicants = 0;
                const totalApplicants = selectedApplicantIds.length;

                for (let i = 0; i < chunks.length; i++) {
                    const chunk = chunks[i];
                    
                    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Sending... (${processedApplicants}/${totalApplicants})<br><small>Do NOT refresh or close this page</small>`;

                    let endpoint = '/api/export/email-codes';
                    const payload = { applicantIds: chunk, accountIndex: accountSelect.value };

                    if (currentEmailDispatchType === 'docs') {
                        endpoint = '/api/export/email-docs';
                    }

                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });

                    const data = await response.json();
                    
                    if (!response.ok || !data.success) {
                        hasErrors = true;
                        console.error('Chunk error:', data.message);
                    }
                    processedApplicants += chunk.length;
                }

                btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Finishing up...`;
                
                // Final success message
                let finalMessage = currentEmailDispatchType === 'docs' 
                    ? `PDF notices processing completed for ${totalApplicants} applicants.`
                    : `Application codes processing completed for ${totalApplicants} applicants.`;
                
                if (hasErrors) {
                    finalMessage += ' (Some errors occurred, check limits or logs)';
                    if (window.showToast) window.showToast(finalMessage, 'warning', true);
                } else {
                    if (window.showToast) window.showToast(finalMessage, 'success', true);
                }

                const emailConfirmationModal = bootstrap.Modal.getInstance(document.getElementById('emailConfirmationModal'));
                const emailSelectionModal = bootstrap.Modal.getInstance(document.getElementById('emailSelectionModal'));
                if (emailConfirmationModal) emailConfirmationModal.hide();
                if (emailSelectionModal) emailSelectionModal.hide();
                
                // Refresh limits if applicable
                if (typeof refreshEmailLimits === 'function') refreshEmailLimits();
            } catch (error) {
                console.error('Error sending emails:', error);
                if (window.showToast) window.showToast(error.message || 'An error occurred while sending emails.', 'danger');
            } finally {
                window.removeEventListener('beforeunload', handleBeforeUnload);
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }
        function setBackupModalType(type) {
            const label = document.getElementById('automatedBackupModalLabel');
            const freshBtn = document.getElementById('generateFreshBackupBtn');
            
            if (type === 'JSON') {
                label.textContent = 'JSON Format Backups';
                freshBtn.href = '/api/export/backup';
            } else {
                label.textContent = 'CSV Format Backups';
                freshBtn.href = '/api/export/backup/csv';
            }
            
            loadAutomatedBackups(type);
        }

        async function loadAutomatedBackups(filterType) {
            const listEl = document.getElementById('modal-automated-backups-list');
            if (!listEl) return;
            
            listEl.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Loading automated backups...</td></tr>`;
            
            try {
                const response = await fetch('/api/export/backup/automated/list');
                const allBackups = await response.json();
                const backups = allBackups.filter(b => b.type === filterType);
                
                if (backups.length === 0) {
                    listEl.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No ${filterType} backups found yet.</td></tr>`;
                    return;
                }
                
                let html = '';
                for (const backup of backups) {
                    const date = new Date(backup.date).toLocaleString();
                    const size = (backup.size / 1024).toFixed(2) + ' KB';
                    
                    html += `
                        <tr>
                            <td class="ps-4 pe-3 text-nowrap">${date}</td>
                            <td class="fw-medium px-3">${backup.filename}</td>
                            <td class="px-4 text-nowrap"><span class="badge ${backup.type === 'JSON' ? 'bg-primary' : 'bg-success'}">${backup.type}</span></td>
                            <td class="px-4 text-nowrap">${size}</td>
                            <td class="text-center pe-4 ps-3 text-nowrap">
                                <a href="/api/export/backup/automated/download/${encodeURIComponent(backup.filename)}" class="btn btn-sm btn-outline-primary rounded-pill px-3 shadow-sm">
                                    <i class="bi bi-download me-1"></i> Download
                                </a>
                            </td>
                        </tr>
                    `;
                }
                listEl.innerHTML = html;
            } catch (error) {
                console.error('Failed to load automated backups', error);
                listEl.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">Failed to load backups.</td></tr>`;
            }
        }
