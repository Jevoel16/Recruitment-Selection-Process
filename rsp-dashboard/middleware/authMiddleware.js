const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
const { JWT_SECRET } = require('../utils/security');

// Verifies the auth cookie, then reloads the user so deleted or demoted accounts lose access immediately
exports.identityMiddleware = async (req, res, next) => {
    const token = req.cookies && req.cookies.auth;
    if (!token) return next();

    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
        res.clearCookie('auth');
        return next();
    }

    try {
        const [rows] = await db.query('SELECT id, username, name, role, can_access_step2 FROM users WHERE id = ?', [decoded.id]);
        if (rows.length === 0) {
            res.clearCookie('auth');
            res.clearCookie('step2Auth');
            return next();
        }
        const user = rows[0];
        req.user = { id: user.id, username: user.username, role: user.role, can_access_step2: Boolean(user.can_access_step2), name: user.name };
        next();
    } catch (e) {
        next(e);
    }
};

exports.requireAuth = (req, res, next) => {
    if (req.user) return next();
    if (req.originalUrl.startsWith('/api')) {
        return res.status(401).json({ success: false, error: 'Your session has expired. Please log in again.' });
    }
    res.redirect('/login');
};

exports.requireAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) return next();
    if (req.originalUrl.startsWith('/api')) {
        return res.status(403).json({ success: false, error: 'Only administrators can do this.' });
    }
    res.redirect('/dashboard');
};

exports.step2AuthMiddleware = (req, res, next) => {
    // If the user has global permission to access step 2, let them through
    if (req.user && req.user.can_access_step2) {
        return next();
    }

    let token = req.cookies && req.cookies.step2Auth;
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            
            const clientIp = req.ip || req.connection.remoteAddress || '';
            const userAgent = req.headers['user-agent'] || '';
            const currentFingerprint = crypto.createHash('sha256').update(clientIp + userAgent).digest('hex');
            
            if (decoded.fingerprint === currentFingerprint) {
                return next();
            } else {
                console.warn('Step 2 session spoofing attempt detected. Fingerprint mismatch.');
            }
        } catch (e) {
            // Token is invalid/expired
        }
    }
    
    if (req.originalUrl.startsWith('/api')) {
        return res.status(401).json({ success: false, error: 'Unlock Step 2 first (Step 2 login required).' });
    }
    res.redirect('/step2-login');
};
