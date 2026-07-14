const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

exports.postLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        const [rows] = await db.query(`SELECT * FROM users WHERE username = ?`, [username]);
        if (rows.length === 0) {
            return res.redirect('/login?error=Invalid credentials');
        }
        
        const user = rows[0];
        if (user.password !== hashPassword(password)) {
            return res.redirect('/login?error=Invalid credentials');
        }

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role, can_access_step2: user.can_access_step2, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
        
        res.cookie('auth', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.redirect('/dashboard');
    } catch (e) {
        console.error(e);
        res.redirect('/login?error=Server error');
    }
};

exports.getLogout = (req, res) => {
    res.clearCookie('auth');
    res.clearCookie('step2Auth');
    res.redirect('/login');
};

exports.getUsers = async (req, res) => {
    try {
        let query = 'SELECT id, username, name, role, can_access_step2, createdAt FROM users';
        let params = [];
        
        if (req.user.role === 'admin') {
            query += ' WHERE role NOT IN ("admin", "superadmin") AND id != ?';
            params.push(req.user.id);
        }

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { username, password, name, role, can_access_step2 } = req.body;
        
        // Admins cannot create admin or superadmin
        if (req.user.role === 'admin' && (role === 'admin' || role === 'superadmin')) {
            return res.status(403).json({ error: 'You do not have permission to create this role.' });
        }

        const [rows] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
        if (rows.length > 0) return res.status(400).json({ error: 'Username already exists' });
        
        await db.query(`INSERT INTO users (username, password, name, role, can_access_step2) VALUES (?, ?, ?, ?, ?)`, 
            [username, hashPassword(password), name, role, can_access_step2 ? 1 : 0]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, can_access_step2, password } = req.body;

        const [targetRows] = await db.query('SELECT username, role, can_access_step2 FROM users WHERE id = ?', [id]);
        if (targetRows.length === 0) return res.status(404).json({ error: 'User not found' });
        const targetRole = targetRows[0].role;
        const targetUsername = targetRows[0].username;

        if (req.user.role === 'admin') {
            if (targetRole === 'admin' || targetRole === 'superadmin') {
                return res.status(403).json({ error: 'You do not have permission to modify this user.' });
            }
            if (role === 'admin' || role === 'superadmin') {
                return res.status(403).json({ error: 'You cannot promote a user to this role.' });
            }
        }
        
        let actionMsg = `Edited user ${targetUsername}`;
        let updates = [];
        if (password) updates.push('changed password');
        if (role !== targetRole) updates.push(`changed role to ${role}`);
        if ((can_access_step2 ? 1 : 0) !== targetRows[0].can_access_step2) {
            updates.push(`${can_access_step2 ? 'granted' : 'revoked'} step 2 access`);
        }
        if (updates.length > 0) {
            actionMsg += ` (${updates.join(', ')})`;
        }

        if (password) {
            await db.query(`UPDATE users SET role = ?, can_access_step2 = ?, password = ? WHERE id = ?`, 
                [role, can_access_step2 ? 1 : 0, hashPassword(password), id]);
        } else {
            await db.query(`UPDATE users SET role = ?, can_access_step2 = ? WHERE id = ?`, 
                [role, can_access_step2 ? 1 : 0, id]);
        }

        if (updates.length > 0) {
            exports.logAction(req.user.id, actionMsg, null);
        }

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (id == req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });

        const [targetRows] = await db.query('SELECT username, role FROM users WHERE id = ?', [id]);
        if (targetRows.length === 0) return res.status(404).json({ error: 'User not found' });
        const targetRole = targetRows[0].role;
        const targetUsername = targetRows[0].username;

        if (req.user.role === 'admin' && (targetRole === 'admin' || targetRole === 'superadmin')) {
            return res.status(403).json({ error: 'You do not have permission to delete this user.' });
        }

        await db.query(`DELETE FROM users WHERE id = ?`, [id]);
        exports.logAction(req.user.id, `Deleted user ${targetUsername}`, null);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getLogs = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT l.id, l.action, l.createdAt, u.username, u.name 
            FROM logs l 
            JOIN users u ON l.user_id = u.id 
            ORDER BY l.createdAt DESC LIMIT 500
        `);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.logAction = async (userId, action, target = null) => {
    try {
        if (!userId) return;
        // Superadmin actions are now logged as requested
        await db.query(`INSERT INTO logs (user_id, action, target) VALUES (?, ?, ?)`, [userId, action, target]);
    } catch (e) {
        console.error('Log error:', e);
    }
};
