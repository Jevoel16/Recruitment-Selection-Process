const express = require('express');
const router = express.Router();
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');
const { step2AuthMiddleware, requireAuth } = require('../middleware/authMiddleware');
const { createRateLimiter } = require('../utils/security');
const { loginErrorMessage } = require('../utils/loginErrors');

const loginLimiter = createRateLimiter({
    max: 20,
    onLimit: (req, res) => res.redirect('/login?error=locked')
});
const step2LoginLimiter = createRateLimiter({
    max: 20,
    onLimit: (req, res) => res.redirect('/step2-login?error=locked')
});

router.get('/login', (req, res) => res.render('login', { error: loginErrorMessage(req.query.error) }));
router.post('/login', loginLimiter, authController.postLogin);
// Logout is a POST so other sites can't sign users out with a link or image
router.post('/logout', authController.getLogout);
router.get('/logout', (req, res) => res.redirect(req.user ? '/dashboard' : '/login'));

// All routes below require authentication
router.use(requireAuth);

router.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

router.get('/', (req, res) => res.redirect('/dashboard'));
router.get('/api/dashboard/metrics', viewController.getMetrics);
router.get('/dashboard', viewController.getDashboard);
router.get('/dashboard/:id', viewController.getDashboardPosition);
router.get('/add-applicant', viewController.getAddApplicant);
router.get('/masterlist', (req, res) => {
    const query = new URLSearchParams(req.query).toString();
    res.redirect(`/dashboard?tab=masterlist${query ? '&' + query : ''}`);
});
router.get('/masterlist/:page', (req, res) => {
    const query = new URLSearchParams(req.query).toString();
    res.redirect(`/dashboard?tab=masterlist&page=${req.params.page}${query ? '&' + query : ''}`);
});

router.get('/step2-login', viewController.getStep2Login);
router.post('/step2-login', step2LoginLimiter, viewController.postStep2Login);
router.get('/:step', (req, res, next) => {
    if (['step1', 'step2', 'step3', 'step4', 'step5'].includes(req.params.step)) {
        res.redirect(`/${req.params.step}/1`);
    } else {
        next();
    }
});
router.get('/:step/:page', (req, res, next) => {
    if (req.params.step === 'step2' || req.params.step === 'step3') {
        return step2AuthMiddleware(req, res, next);
    }
    next();
}, viewController.getStepPage);

module.exports = router;
