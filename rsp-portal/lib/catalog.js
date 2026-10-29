// Single source of truth for what applicants may pick on the portal.
// The home page renders these into the position picker, and the server
// rejects anything outside them on /apply/:type and /api/apply.

const APPLICATION_TYPES = ['internal', 'external'];

const POSITIONS = {
    'Teaching': ['Teacher I', 'Teacher II', 'Teacher III', 'Master Teacher I', 'Master Teacher II'],
    'Teaching Related': ['Principal I', 'Principal II', 'Head Teacher I', 'Head Teacher III', 'Education Program Supervisor'],
    'Non-Teaching': ['Administrative Officer II', 'Administrative Assistant III', 'Administrative Assistant II', 'Project Development Officer II']
};

const DISTRICTS = ['N1', 'N2', 'N3', 'N4', 'N5', 'S1', 'S2', 'S3', 'S4', 'S5', 'E1', 'E2', 'W1', 'W2'];
const SCHOOL_CATEGORIES = ['Elementary', 'Junior High School', 'Senior High School', 'Kindergarten', 'ALS'];

const SEXES = ['Male', 'Female', 'Other'];
const CIVIL_STATUSES = ['Single', 'Married', 'Widowed', 'Separated', 'Other'];

const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

function isValidSelection({ type, position, positionCategory, district, category }) {
    return APPLICATION_TYPES.includes(type)
        && typeof positionCategory === 'string' && has(POSITIONS, positionCategory)
        && POSITIONS[positionCategory].includes(position)
        && DISTRICTS.includes(district)
        && SCHOOL_CATEGORIES.includes(category);
}

module.exports = {
    APPLICATION_TYPES, POSITIONS, DISTRICTS, SCHOOL_CATEGORIES, SEXES, CIVIL_STATUSES, isValidSelection
};
