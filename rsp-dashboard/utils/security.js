const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;
const DEV_JWT_SECRET = 'fallback-secret-for-dev';

// Resolve the JWT secret once. Production refuses to run on the dev fallback.
function getJwtSecret() {
    if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET must be set when NODE_ENV=production');
    }
    return DEV_JWT_SECRET;
}

const JWT_SECRET = getJwtSecret();

// Hashes are stored as "scrypt$<saltHex>$<hashHex>".
async function hashPassword(password) {
    const salt = crypto.randomBytes(16);
    const derived = await scrypt(password, salt, KEY_LENGTH);
    return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

function isLegacyHash(stored) {
    return typeof stored === 'string' && /^[a-f0-9]{64}$/i.test(stored);
}

// Verifies against scrypt hashes and legacy unsalted SHA-256 hashes.
async function verifyPassword(password, stored) {
    if (!stored || typeof password !== 'string') return false;

    if (isLegacyHash(stored)) {
        const legacy = crypto.createHash('sha256').update(password).digest();
        return crypto.timingSafeEqual(legacy, Buffer.from(stored, 'hex'));
    }

    const [scheme, saltHex, hashHex] = stored.split('$');
    if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
    const expected = Buffer.from(hashHex, 'hex');
    const derived = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length);
    return crypto.timingSafeEqual(derived, expected);
}

// Simple fixed-window in-memory rate limiter for login endpoints.
function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 10, onLimit } = {}) {
    const hits = new Map();

    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
    }, windowMs).unref();

    return (req, res, next) => {
        const key = req.ip || '';
        const now = Date.now();
        let entry = hits.get(key);
        if (!entry || entry.resetAt <= now) {
            entry = { count: 0, resetAt: now + windowMs };
            hits.set(key, entry);
        }
        entry.count++;
        if (entry.count > max) {
            if (onLimit) return onLimit(req, res);
            return res.status(429).send('Too many attempts. Please try again later.');
        }
        next();
    };
}

module.exports = { JWT_SECRET, hashPassword, verifyPassword, isLegacyHash, createRateLimiter };
