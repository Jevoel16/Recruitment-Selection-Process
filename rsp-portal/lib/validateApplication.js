// Hand-rolled validator for POST /api/apply. Returns { errors, value }:
// `errors` maps a field name to a message (empty when valid) and `value`
// holds only the whitelisted, trimmed fields, so anything else the client
// sends (e.g. a forged tracking_number) never reaches the database.
const { SEXES, CIVIL_STATUSES, isValidSelection } = require('./catalog');

const MAX_LIST_ITEMS = 20;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// PH mobile: 09XXXXXXXXX or +639XXXXXXXXX (spaces and dashes allowed in between)
const PH_MOBILE_RE = /^(?:\+63|0)9\d{9}$/;
const LINK_RE = /^https?:\/\/\S+$/i;
const LINK_MAX = 500;

const str = (v) => (typeof v === 'string' ? v.trim() : (typeof v === 'number' ? String(v) : ''));

// Text field: required or optional, with a max length
function text(errors, body, name, label, max, required = false) {
    const v = str(body[name]);
    if (!v) {
        if (required) errors[name] = `${label} is required.`;
    } else if (v.length > max) {
        errors[name] = `${label} must be ${max} characters or fewer.`;
    }
    return v;
}

function number(v, { min, max, integer }) {
    const s = str(v);
    if (!s || !/^-?\d+(\.\d+)?$/.test(s)) return null;
    const n = Number(s);
    if (integer && !Number.isInteger(n)) return null;
    return n >= min && n <= max ? n : null;
}

function link(v, max = LINK_MAX) {
    const s = str(v);
    if (!s) return { value: '' };
    if (s.length > max) return { error: `must be ${max} characters or fewer` };
    if (!LINK_RE.test(s)) return { error: 'must start with http:// or https://' };
    return { value: s };
}

const currentYear = () => new Date().getFullYear();

// Per-list item rules: [field, label, kind, options]
const LIST_RULES = {
    education: [
        ['degree', 'Degree/Course', 'text', { max: 255 }],
        ['year', 'Year graduated', 'number', { min: 1950, max: currentYear, integer: true }]
    ],
    training: [
        ['title', 'Title', 'text', { max: 255 }],
        ['hours', 'Hours', 'number', { min: 1, max: 9999, integer: true }]
    ],
    experience: [
        ['details', 'Details', 'text', { max: 1000 }],
        ['years', 'Years', 'number', { min: 0, max: 60 }]
    ],
    eligibility: [
        ['details', 'Details', 'text', { max: 1000 }],
        ['rating', 'Rating', 'number', { min: 0, max: 100 }]
    ]
};

function list(errors, body, name) {
    let raw = body[name];
    if (raw === undefined || raw === null || raw === '') return [];
    if (typeof raw === 'string') {
        try { raw = JSON.parse(raw); } catch { errors[name] = 'Invalid list data.'; return []; }
    }
    if (!Array.isArray(raw)) { errors[name] = 'Invalid list data.'; return []; }
    if (raw.length > MAX_LIST_ITEMS) { errors[name] = `You can add at most ${MAX_LIST_ITEMS} entries.`; return []; }

    const items = [];
    for (let i = 0; i < raw.length; i++) {
        const item = raw[i];
        const where = `Entry ${i + 1}`;
        if (!item || typeof item !== 'object' || Array.isArray(item)) { errors[name] = `${where} is invalid.`; return []; }
        const clean = {};
        for (const [field, label, kind, opts] of LIST_RULES[name]) {
            if (kind === 'text') {
                const v = str(item[field]);
                if (!v) { errors[name] = `${where}: ${label} is required.`; return []; }
                if (v.length > opts.max) { errors[name] = `${where}: ${label} must be ${opts.max} characters or fewer.`; return []; }
                clean[field] = v;
            } else {
                const max = typeof opts.max === 'function' ? opts.max() : opts.max;
                const n = number(item[field], { ...opts, max });
                if (n === null) { errors[name] = `${where}: ${label} must be ${opts.integer ? 'a whole number ' : ''}between ${opts.min} and ${max}.`; return []; }
                clean[field] = n;
            }
        }
        const l = link(item.link);
        if (l.error) { errors[name] = `${where}: link ${l.error}.`; return []; }
        clean.link = l.value;
        items.push(clean);
    }
    return items;
}

function validateApplication(body) {
    const errors = {};
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { errors: { form: 'Invalid submission.' }, value: null };
    }

    const value = {
        type: str(body.type),
        position: str(body.position),
        positionCategory: str(body.positionCategory),
        district: str(body.district),
        category: str(body.category)
    };
    if (!isValidSelection(value)) {
        errors.position = 'The selected position is no longer valid. Please start again from the home page.';
    }

    value.first_name = text(errors, body, 'first_name', 'First name', 100, true);
    value.middle_name = text(errors, body, 'middle_name', 'Middle name', 100);
    value.last_name = text(errors, body, 'last_name', 'Last name', 100, true);
    value.name_extension = text(errors, body, 'name_extension', 'Suffix', 20);
    value.address = text(errors, body, 'address', 'Address', 255, true);
    value.religion = text(errors, body, 'religion', 'Religion', 100);
    value.disability = text(errors, body, 'disability', 'Disability', 100);
    value.ethnic_group = text(errors, body, 'ethnic_group', 'Ethnic group', 100);

    const age = number(body.age, { min: 18, max: 70, integer: true });
    if (age === null) errors.age = str(body.age) ? 'Age must be a whole number between 18 and 70.' : 'Age is required.';
    value.age = age;

    value.sex = str(body.sex);
    if (!value.sex) errors.sex = 'Sex is required.';
    else if (!SEXES.includes(value.sex)) errors.sex = 'Select a valid option.';

    value.civil_status = str(body.civil_status);
    if (value.civil_status && !CIVIL_STATUSES.includes(value.civil_status)) errors.civil_status = 'Select a valid option.';

    value.email_address = text(errors, body, 'email_address', 'Email', 150, true);
    if (value.email_address && !errors.email_address && !EMAIL_RE.test(value.email_address)) {
        errors.email_address = 'Enter a valid email address.';
    }

    const phone = str(body.contact_no).replace(/[\s-]/g, '');
    if (!phone) errors.contact_no = 'Contact number is required.';
    else if (!PH_MOBILE_RE.test(phone)) errors.contact_no = 'Enter a PH mobile number like 09171234567 or +639171234567.';
    value.contact_no = phone;

    const pds = link(body.pds_link, 255);
    if (pds.error) errors.pds_link = `PDS link ${pds.error}.`;
    value.pds_link = pds.value || '';

    for (const name of Object.keys(LIST_RULES)) value[name] = list(errors, body, name);

    return { errors, value };
}

module.exports = { validateApplication, MAX_LIST_ITEMS };
