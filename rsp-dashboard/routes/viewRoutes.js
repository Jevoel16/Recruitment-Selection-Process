const express = require('express');
const router = express.Router();
const viewController = require('../controllers/viewController');
const { step2AuthMiddleware } = require('../middleware/authMiddleware');

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
router.post('/step2-login', viewController.postStep2Login);
router.get('/:step', (req, res, next) => {
    if (['step1', 'step2', 'step3', 'step4', 'step5'].includes(req.params.step)) {
        res.redirect(`/${req.params.step}/1`);
    } else {
        next();
    }
});
router.get('/:step/:page', (req, res, next) => {
    if (req.params.step === 'step2') {
        return step2AuthMiddleware(req, res, next);
    }
    next();
}, viewController.getStepPage);

module.exports = router;
