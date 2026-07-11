const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

exports.identityMiddleware = (req, res, next) => {
    let token = req.cookies && req.cookies.auth;
    
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.userId = decoded.userId;
            return next();
        } catch (e) {
            // Token is invalid/expired, generate a new one
        }
    }
    
    // Generate new identity
    const newUserId = uuidv4();
    const newToken = jwt.sign({ userId: newUserId }, JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('auth', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    req.userId = newUserId;
    next();
};

exports.step2AuthMiddleware = (req, res, next) => {
    let token = req.cookies && req.cookies.step2Auth;
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            
            // Verify fingerprint to prevent session spoofing/hijacking on standard HTTP
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
    // Only redirect if accessing via GET, maybe return 401 for API
    if (req.originalUrl.startsWith('/api')) {
        return res.status(401).json({ error: 'Unauthorized for Step 2' });
    }
    res.redirect('/step2-login');
};
