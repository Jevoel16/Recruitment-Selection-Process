const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

exports.identityMiddleware = (req, res, next) => {
    let token = req.cookies && req.cookies.auth;
    
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded; // { id, username, role, can_access_step2, name }
        } catch (e) {
            // Invalid token
        }
    }
    next();
};

exports.requireAuth = (req, res, next) => {
    if (req.user) return next();
    if (req.originalUrl.startsWith('/api')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    res.redirect('/login');
};

exports.requireAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) return next();
    if (req.originalUrl.startsWith('/api')) {
        return res.status(403).json({ error: 'Forbidden' });
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
        return res.status(401).json({ error: 'Unauthorized for Step 2' });
    }
    res.redirect('/step2-login');
};
