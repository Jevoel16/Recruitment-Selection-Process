document.addEventListener('DOMContentLoaded', () => {
    let selectedApplicationType = '';
    let selectedCategory = '';
    let selectedPosition = '';

    // Positions, districts and school categories come from the server (lib/catalog.js)
    const picker = JSON.parse(document.getElementById('pickerData').textContent);
    const positionData = picker.positions;
    const districts = picker.districts;
    const categories = picker.categories;

    const positionModalElement = document.getElementById('positionModal');
    const positionModal = new bootstrap.Modal(positionModalElement);
    const categoryList = document.getElementById('categoryList');
    const centerContent = document.getElementById('centerContent');

    // Small DOM helper: el('div', { className: 'x' }, child, 'text', ...)
    function el(tag, props = {}, ...children) {
        const node = document.createElement(tag);
        Object.entries(props).forEach(([key, value]) => {
            if (key.startsWith('aria') || key.startsWith('data-') || key === 'for' || key === 'role') node.setAttribute(key.replace(/^aria(?=[A-Z])/, 'aria-').toLowerCase(), value);
            else node[key] = value;
        });
        children.forEach(child => node.append(child));
        return node;
    }
    const icon = (name, extra = '') => el('i', { className: `bi bi-${name} ${extra}`.trim(), ariaHidden: 'true' });

    // Move focus to the new panel's heading so keyboard and screen-reader users follow along
    function focusHeading() {
        const heading = centerContent.querySelector('h3');
        if (heading) heading.focus();
    }

    function showPlaceholder() {
        centerContent.replaceChildren(
            el('div', { className: 'd-flex h-100 align-items-center justify-content-center text-muted flex-column text-center picker-placeholder' },
                icon('arrow-left-circle', 'mb-3 picker-placeholder-icon d-none d-md-inline'),
                icon('arrow-up-circle', 'mb-3 picker-placeholder-icon d-md-none'),
                el('p', { className: 'h5' }, 'Please select a category to see its positions')
            )
        );
    }

    // Initialize Categories
    function initCategories() {
        categoryList.replaceChildren();
        Object.keys(positionData).forEach(cat => {
            const btn = el('button', { type: 'button', className: 'list-group-item list-group-item-action py-3 fw-medium', ariaPressed: 'false' }, cat);
            btn.addEventListener('click', () => {
                Array.from(categoryList.children).forEach(c => {
                    c.classList.remove('active');
                    c.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');

                selectedCategory = cat;
                showPositions(cat);
                focusHeading();
            });
            categoryList.appendChild(btn);
        });
    }

    function showPositions(category) {
        const row = el('div', { className: 'row g-3' });
        positionData[category].forEach(pos => {
            const card = el('button', { type: 'button', className: 'card h-100 w-100 border position-card text-start' },
                el('span', { className: 'card-body d-flex align-items-center' },
                    icon('briefcase', 'text-primary me-3 fs-4'),
                    el('span', { className: 'fw-semibold' }, pos)
                )
            );
            card.addEventListener('click', () => {
                selectedPosition = pos;
                showDetailsForm();
                focusHeading();
            });
            row.append(el('div', { className: 'col-md-6' }, card));
        });

        centerContent.replaceChildren(
            el('div', { className: 'mb-4 pb-2 border-bottom' },
                el('h3', { className: 'h4 fw-bold text-dark mb-1', tabIndex: -1 }, `${category} Positions`),
                el('p', { className: 'text-muted small mb-0' }, 'Select a specific position to apply for.')
            ),
            row
        );
    }

    function selectField(id, label, placeholder, options, help) {
        const select = el('select', { className: 'form-select form-select-lg border-2 shadow-none', id, required: true, ariaDescribedby: `${id}-error${help ? ` ${id}-help` : ''}` },
            el('option', { value: '', selected: true, disabled: true }, placeholder),
            ...options.map(o => el('option', { value: o }, o))
        );
        select.addEventListener('change', () => {
            select.classList.remove('is-invalid');
            select.removeAttribute('aria-invalid');
        });
        const wrap = el('div', { className: 'mb-4' },
            el('label', { className: 'form-label fw-semibold text-secondary', for: id }, label),
            select,
            el('div', { className: 'invalid-feedback', id: `${id}-error` }, `Please select a ${label.toLowerCase()}.`)
        );
        if (help) wrap.append(el('div', { className: 'form-text', id: `${id}-help` }, help));
        return wrap;
    }

    function showDetailsForm() {
        const back = el('button', { type: 'button', className: 'btn btn-sm btn-light me-3 border flex-shrink-0' }, icon('arrow-left'), ' Back');
        back.addEventListener('click', () => {
            showPositions(selectedCategory);
            focusHeading();
        });

        const proceed = el('button', { type: 'button', className: 'btn btn-primary btn-lg fw-bold py-3' },
            'Proceed to Application ', icon('arrow-right', 'ms-2'));

        centerContent.replaceChildren(
            el('div', { className: 'mb-4 pb-2 border-bottom d-flex align-items-center' },
                back,
                el('div', {},
                    el('h3', { className: 'h4 fw-bold text-dark mb-1', tabIndex: -1 }, selectedPosition),
                    el('span', { className: 'badge bg-primary bg-opacity-10 text-primary' }, selectedCategory)
                )
            ),
            el('div', { className: 'mx-auto mt-4 max-w-500' },
                selectField('selectDistrict', 'District', 'Select District', districts),
                selectField('selectCategory', 'Category', 'Select Category', categories, 'e.g. Elementary, Junior High School'),
                el('div', { className: 'd-grid' }, proceed)
            )
        );

        proceed.addEventListener('click', () => {
            const fields = [document.getElementById('selectDistrict'), document.getElementById('selectCategory')];
            const missing = fields.filter(f => !f.value);
            fields.forEach(f => {
                f.classList.toggle('is-invalid', !f.value);
                if (f.value) f.removeAttribute('aria-invalid');
                else f.setAttribute('aria-invalid', 'true');
            });
            if (missing.length) {
                missing[0].focus();
                return;
            }

            // Build URL with query params
            const params = new URLSearchParams({
                position: selectedPosition,
                positionCategory: selectedCategory,
                district: fields[0].value,
                category: fields[1].value
            });

            window.location.href = `/apply/${encodeURIComponent(selectedApplicationType)}?${params.toString()}`;
        });
    }

    // Attach click events to application type buttons
    document.querySelectorAll('.applicant-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedApplicationType = btn.getAttribute('data-type');

            // Reset modal state
            selectedCategory = '';
            selectedPosition = '';
            initCategories();
            showPlaceholder();

            positionModal.show();
        });
    });
});
