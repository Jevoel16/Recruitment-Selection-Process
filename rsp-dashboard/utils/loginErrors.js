// Login pages only show these fixed messages, so a crafted ?error= link can't display arbitrary text
const LOGIN_ERRORS = {
    invalid: 'Invalid username or password.',
    locked: 'Too many attempts. Please try again in 15 minutes.',
    denied: 'You do not have permission to access Step 2.',
    server: 'Something went wrong. Please try again.'
};

const loginErrorMessage = (code) => LOGIN_ERRORS[code] || null;

module.exports = { loginErrorMessage };
