const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

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
