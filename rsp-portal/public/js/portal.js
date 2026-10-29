document.addEventListener('DOMContentLoaded', () => {
    const appForm = document.getElementById('applicationForm');
    if (!appForm) return;

    const MAX_LIST_ITEMS = 20;
    const PH_MOBILE_RE = /^(?:\+63|0)9\d{9}$/;
    const LINK_RE = /^https?:\/\/\S+$/i;
    const DRAFT_KEY = `rsp-portal-draft:${location.pathname}${location.search}`;
    const LIST_TYPES = ['education', 'training', 'experience', 'eligibility'];

    // Small DOM helper: el('li', { className: 'x' }, child, 'text', ...)
    function el(tag, props = {}, ...children) {
        const node = document.createElement(tag);
        Object.entries(props).forEach(([key, value]) => {
            if (key.startsWith('aria')) node.setAttribute(key.replace(/^aria(?=[A-Z])/, 'aria-').toLowerCase(), value);
            else node[key] = value;
        });
        children.forEach(child => node.append(child));
        return node;
    }
    const icon = (name, extra = '') => el('i', { className: `bi bi-${name} ${extra}`.trim(), ariaHidden: 'true' });

    // ---------- Sidebar toggle (desktop only; below 992px the sidebar is a top stepper) ----------
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('mainSidebar');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            const collapsed = sidebar.classList.toggle('collapsed');
            sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
            sidebarToggle.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
        });
    }

    // ---------- Step navigation ----------
    const tabs = document.querySelectorAll('.nav-link[data-target]');
    const sections = document.querySelectorAll('.tab-section');
    const mainEl = document.getElementById('main');
    let currentStep = 'info';

    function switchTab(targetId, { focus = true } = {}) {
        const activeTab = document.querySelector(`.nav-link[data-target="${targetId}"]`);
        const activeSection = document.getElementById(`section-${targetId}`);
        if (!activeTab || !activeSection) return;

        tabs.forEach(t => {
            t.classList.remove('active');
            t.removeAttribute('aria-current');
        });
        sections.forEach(s => s.classList.remove('active'));
        activeTab.classList.add('active');
        activeTab.setAttribute('aria-current', 'step');
        activeSection.classList.add('active');
        currentStep = targetId;
        // Keep the active step visible in the horizontal mobile stepper
        activeTab.scrollIntoView({ block: 'nearest', inline: 'nearest' });

        if (focus) {
            mainEl.scrollTop = 0;
            activeSection.querySelector('h2').focus({ preventScroll: false });
        }
        saveDraft();
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.getAttribute('data-target')));
    });

    // ---------- Field validation ----------
    const errorSummary = document.getElementById('errorSummary');
    const errorSummaryList = document.getElementById('errorSummaryList');

    function labelFor(input) {
        const label = document.querySelector(`label[for="${input.id}"]`);
        return label ? label.textContent.replace('*', '').trim() : input.name;
    }

    function fieldMessage(input) {
        const v = input.value.trim();
        const label = labelFor(input);
        if (!v) return input.required ? `${label} is required.` : '';
        if (input.maxLength > 0 && v.length > input.maxLength) return `${label} must be ${input.maxLength} characters or fewer.`;
        if (input.type === 'email' && input.validity.typeMismatch) return 'Enter a valid email address.';
        if (input.type === 'url' && !LINK_RE.test(v)) return 'Link must start with http:// or https://';
        if (input.dataset.validate === 'ph-mobile' && !PH_MOBILE_RE.test(v.replace(/[\s-]/g, ''))) {
            return 'Enter a PH mobile number like 09171234567 or +639171234567.';
        }
        if (input.type === 'number') {
            const n = Number(v);
            const min = input.min !== '' ? Number(input.min) : -Infinity;
            const max = input.max !== '' ? Number(input.max) : Infinity;
            if (input.validity.badInput || Number.isNaN(n)) return `${label} must be a number.`;
            if (n < min || n > max) return `${label} must be between ${input.min} and ${input.max}.`;
            if (input.step === '1' && !Number.isInteger(n)) return `${label} must be a whole number.`;
        }
        return '';
    }

    function setFieldError(input, message) {
        const feedback = document.getElementById(`${input.id}-error`);
        input.classList.toggle('is-invalid', Boolean(message));
        if (message) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
        if (feedback) feedback.textContent = message;
    }

    function setListError(type, message) {
        const box = document.getElementById(`${type}-error`);
        if (box) box.textContent = message || '';
    }

    function stepOf(node) {
        const section = node.closest('.tab-section');
        return section ? section.dataset.step : 'info';
    }

    // errors: [{ step, target (element to focus), text }]
    function showSummary(errors) {
        errorSummaryList.replaceChildren();
        if (!errors.length) {
            errorSummary.classList.add('d-none');
            return;
        }
        errors.forEach(err => {
            const link = el('a', { href: `#${err.target.id}`, className: 'alert-link' }, err.text);
            link.addEventListener('click', (e) => {
                e.preventDefault();
                switchTab(err.step, { focus: false });
                err.target.focus();
            });
            errorSummaryList.append(el('li', {}, link));
        });
        errorSummary.classList.remove('d-none');
        mainEl.scrollTop = 0;
        errorSummary.focus();
    }

    function hideSummary() {
        showSummary([]);
    }

    const namedFields = () => Array.from(appForm.querySelectorAll('[name]:not([type="hidden"])'));

    // Validate the named (submitted) fields in `scope`; returns summary entries
    function validateFields(fields) {
        const errors = [];
        fields.forEach(input => {
            const message = fieldMessage(input);
            setFieldError(input, message);
            if (message) errors.push({ step: stepOf(input), target: input, text: message });
        });
        return errors;
    }

    // Re-check a field as the user fixes it, once it has been flagged
    namedFields().forEach(input => {
        const recheck = () => {
            if (input.classList.contains('is-invalid')) setFieldError(input, fieldMessage(input));
        };
        input.addEventListener('input', recheck);
        input.addEventListener('change', recheck);
        input.addEventListener('blur', () => {
            if (input.value.trim()) setFieldError(input, fieldMessage(input));
        });
    });

    // ---------- Dynamic lists ----------
    const data = { education: [], training: [], experience: [], eligibility: [] };

    const LIST_CONFIG = {
        education: {
            listId: 'eduList', button: 'btn-add-edu',
            fields: { degree: 'edu_degree', year: 'edu_year', link: 'edu_link' },
            describe: item => [item.degree, ` (${item.year})`]
        },
        training: {
            listId: 'traList', button: 'btn-add-train',
            fields: { title: 'train_title', hours: 'train_hours', link: 'train_link' },
            describe: item => [item.title, ` (${item.hours} hrs)`]
        },
        experience: {
            listId: 'expList', button: 'btn-add-exp',
            fields: { details: 'exp_details', years: 'exp_years', link: 'exp_link' },
            describe: item => [item.details, ` (${item.years} yrs)`]
        },
        eligibility: {
            listId: 'eliList', button: 'btn-add-elig',
            fields: { details: 'elig_details', rating: 'elig_rating', link: 'elig_link' },
            describe: item => [item.details, ` (Rating: ${item.rating})`]
        }
    };

    const entryInputs = type => Object.values(LIST_CONFIG[type].fields).map(id => document.getElementById(id));

    function renderList(type) {
        const config = LIST_CONFIG[type];
        const listDiv = document.getElementById(config.listId);
        if (!listDiv) return;

        const ul = el('ul', { className: 'list-group' });
        if (data[type].length === 0) {
            ul.append(el('li', { className: 'list-group-item text-muted small' }, `No ${type} records added yet.`));
        } else {
            data[type].forEach((item, index) => {
                const [title, detail] = config.describe(item);
                const body = el('span', { className: 'text-break' }, el('strong', {}, title), detail);
                // Only ever render http(s) links
                if (item.link && LINK_RE.test(item.link)) {
                    body.append(el('br'), el('a', {
                        href: item.link, target: '_blank', rel: 'noopener noreferrer',
                        className: 'text-primary text-decoration-none small'
                    }, icon('link-45deg'), ' View Document'));
                }
                const remove = el('button', {
                    type: 'button', className: 'btn btn-sm btn-danger flex-shrink-0 ms-2',
                    ariaLabel: `Remove ${type} entry: ${title}`
                }, icon('trash'));
                remove.addEventListener('click', () => {
                    data[type].splice(index, 1);
                    renderList(type);
                    saveDraft();
                    entryInputs(type)[0].focus();
                });
                ul.append(el('li', { className: 'list-group-item d-flex justify-content-between align-items-center' }, body, remove));
            });
        }
        listDiv.replaceChildren(ul);

        const full = data[type].length >= MAX_LIST_ITEMS;
        document.getElementById(config.button).disabled = full;
        setListError(type, full ? `You've reached the limit of ${MAX_LIST_ITEMS} entries.` : '');
    }

    LIST_TYPES.forEach(type => {
        const config = LIST_CONFIG[type];
        const inputs = entryInputs(type);
        document.getElementById(config.button).addEventListener('click', () => {
            const errors = validateFields(inputs);
            if (errors.length) {
                errors[0].target.focus();
                return;
            }
            const item = {};
            Object.entries(config.fields).forEach(([key, id]) => {
                item[key] = document.getElementById(id).value.trim();
            });
            data[type].push(item);
            inputs.forEach(input => { input.value = ''; });
            renderList(type);
            saveDraft();
            inputs[0].focus();
        });
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                if (input.classList.contains('is-invalid')) setFieldError(input, fieldMessage(input));
            });
        });
    });

    // Typed into an entry row but never pressed Add: flag it so nothing is silently dropped
    function pendingEntryErrors() {
        const errors = [];
        LIST_TYPES.forEach(type => {
            const inputs = entryInputs(type);
            if (inputs.some(input => input.value.trim())) {
                inputs.forEach(input => setFieldError(input, fieldMessage(input)));
                const first = inputs.find(input => input.classList.contains('is-invalid')) || inputs[0];
                errors.push({ step: type, target: first, text: `You have an unsaved ${type} entry. Click Add, or clear its fields.` });
            }
        });
        return errors;
    }

    // ---------- Next / Back ----------
    document.querySelectorAll('.btn-next').forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.closest('.tab-section');
            const errors = validateFields(Array.from(section.querySelectorAll('[name]:not([type="hidden"])')));
            if (errors.length) {
                showSummary(errors);
                return;
            }
            hideSummary();
            switchTab(btn.getAttribute('data-next'));
        });
    });

    document.querySelectorAll('.btn-prev').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.getAttribute('data-prev')));
    });

    // ---------- Draft autosave (sessionStorage) ----------
    let submitted = false;

    function hasContent() {
        return namedFields().some(input => input.value.trim()) || LIST_TYPES.some(type => data[type].length > 0);
    }

    function saveDraft() {
        if (submitted) return;
        try {
            if (!hasContent()) {
                sessionStorage.removeItem(DRAFT_KEY);
                return;
            }
            const fields = {};
            namedFields().forEach(input => { fields[input.name] = input.value; });
            sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ fields, data, step: currentStep }));
        } catch { /* storage unavailable or full: drafts are a convenience only */ }
    }

    function clearDraft() {
        try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    }

    function restoreDraft() {
        let draft;
        try { draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null'); } catch { draft = null; }
        if (!draft || typeof draft !== 'object') return;

        namedFields().forEach(input => {
            const value = draft.fields && draft.fields[input.name];
            if (typeof value === 'string') input.value = value;
        });
        LIST_TYPES.forEach(type => {
            const items = draft.data && Array.isArray(draft.data[type]) ? draft.data[type] : [];
            data[type] = items.slice(0, MAX_LIST_ITEMS).filter(item => item && typeof item === 'object')
                .map(item => {
                    const clean = {};
                    Object.keys(LIST_CONFIG[type].fields).forEach(key => { clean[key] = String(item[key] ?? ''); });
                    return clean;
                });
        });
        if (draft.step && document.getElementById(`section-${draft.step}`)) switchTab(draft.step, { focus: false });
    }

    let saveTimer;
    appForm.addEventListener('input', () => {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(saveDraft, 300);
    });
    appForm.addEventListener('change', saveDraft);

    window.addEventListener('beforeunload', (e) => {
        if (submitted || !hasContent()) return;
        saveDraft();
        e.preventDefault();
        e.returnValue = '';
    });

    restoreDraft();
    LIST_TYPES.forEach(renderList);

    // ---------- Submission ----------
    const submitBtn = appForm.querySelector('button[type="submit"]');
    const submitLabel = Array.from(submitBtn.childNodes).map(n => n.cloneNode(true));

    function setSubmitting(busy) {
        submitBtn.disabled = busy;
        if (busy) {
            submitBtn.replaceChildren(el('span', { className: 'spinner-border spinner-border-sm me-2', ariaHidden: 'true' }), 'Submitting...');
        } else {
            submitBtn.replaceChildren(...submitLabel.map(n => n.cloneNode(true)));
        }
    }

    // Map the server's 400 field errors back onto the form
    function applyServerErrors(fields) {
        const errors = [];
        Object.entries(fields || {}).forEach(([name, message]) => {
            if (LIST_TYPES.includes(name)) {
                setListError(name, message);
                errors.push({ step: name, target: entryInputs(name)[0], text: message });
                return;
            }
            const input = appForm.querySelector(`[name="${CSS.escape(name)}"]:not([type="hidden"])`);
            if (input) {
                setFieldError(input, message);
                errors.push({ step: stepOf(input), target: input, text: message });
            } else {
                errors.push({ step: 'info', target: document.getElementById('heading-info'), text: message });
            }
        });
        return errors;
    }

    function showGeneralError(message) {
        showSummary([{ step: currentStep, target: submitBtn, text: message }]);
    }

    appForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Re-validate every step: the sidebar lets people jump past a step without pressing Next
        const errors = [...validateFields(namedFields()), ...pendingEntryErrors()];
        if (errors.length) {
            switchTab(errors[0].step, { focus: false });
            showSummary(errors);
            return;
        }
        hideSummary();

        const payload = Object.fromEntries(new FormData(appForm).entries());
        LIST_TYPES.forEach(type => { payload[type] = JSON.stringify(data[type]); });

        setSubmitting(true);
        try {
            const res = await fetch('/api/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(payload)
            });
            let result = null;
            if ((res.headers.get('content-type') || '').includes('application/json')) {
                result = await res.json().catch(() => null);
            }

            if (res.ok && result && result.success) {
                submitted = true;
                clearDraft();
                document.getElementById('trackingCodeDisplay').textContent = result.applicationCode;
                const modalEl = document.getElementById('successModal');
                modalEl.addEventListener('shown.bs.modal', () => document.getElementById('successModalTitle').focus(), { once: true });
                bootstrap.Modal.getOrCreateInstance(modalEl).show();
                return;
            }

            setSubmitting(false);
            if (res.status === 400 && result && result.fields) {
                const serverErrors = applyServerErrors(result.fields);
                if (serverErrors.length) switchTab(serverErrors[0].step, { focus: false });
                showSummary(serverErrors);
            } else if (res.status === 429) {
                showGeneralError((result && result.error) || 'Too many submissions. Please try again later.');
            } else {
                showGeneralError((result && result.error) || `The server could not accept your application (error ${res.status}). Your answers are saved in this tab; please try again.`);
            }
        } catch {
            setSubmitting(false);
            showGeneralError('Network error: your application was not sent. Check your connection and try again. Your answers are saved in this tab.');
        }
    });

    // ---------- Success modal actions ----------
    const copyStatus = document.getElementById('copyStatus');
    document.getElementById('btnCopyCode').addEventListener('click', async () => {
        const code = document.getElementById('trackingCodeDisplay').textContent;
        try {
            await navigator.clipboard.writeText(code);
            copyStatus.textContent = 'Tracking code copied to clipboard.';
        } catch {
            // Clipboard API needs a secure context; fall back to selecting the code
            const range = document.createRange();
            range.selectNodeContents(document.getElementById('trackingCodeDisplay'));
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            copyStatus.textContent = 'Code selected. Press Ctrl+C (or long-press and Copy) to copy it.';
        }
    });
    document.getElementById('btnPrintCode').addEventListener('click', () => window.print());
});
