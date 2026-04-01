/**
 * adminAuthController.js
 * ระบบ Login/Auth สำหรับ admin_users
 */

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');
const { ADMIN_JWT_SECRET } = require('../middleware/verifyAdmin');

const TOKEN_EXPIRE = '12h';

// ==========================================
// POST /api/admin/auth/login
// ==========================================
exports.login = (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'กรุณาระบุ username และ password' });
    }

    const sql = `
        SELECT id, username, full_name, display_name, email,
               password_hash, phone, line_id, avatar_url, is_active, last_login
        FROM admin_users
        WHERE username = ? OR email = ?
        LIMIT 1
    `;

    db.query(sql, [username, username], async (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!rows.length) {
            return res.status(401).json({ error: 'ไม่พบ username นี้ในระบบ' });
        }

        const admin = rows[0];

        if (!admin.is_active) {
            return res.status(403).json({ error: 'บัญชีนี้ถูกระงับการใช้งาน' });
        }

        const passwordMatch = await bcrypt.compare(password, admin.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
        }

        db.query(
            'UPDATE admin_users SET last_login = NOW(), login_count = login_count + 1 WHERE id = ?',
            [admin.id]
        );

        const token = jwt.sign(
            { adminId: admin.id, username: admin.username, isAdmin: true },
            ADMIN_JWT_SECRET,
            { expiresIn: TOKEN_EXPIRE }
        );

        res.json({
            message: `ยินดีต้อนรับ ${admin.display_name || admin.full_name}`,
            token,
            admin: {
                id:           admin.id,
                username:     admin.username,
                full_name:    admin.full_name,
                display_name: admin.display_name,
                email:        admin.email,
                phone:        admin.phone,
                line_id:      admin.line_id,
                avatar_url:   admin.avatar_url,
                last_login:   admin.last_login,
            },
        });
    });
};

// ==========================================
// GET /api/admin/auth/me
// ==========================================
exports.getMe = (req, res) => {
    res.json({ admin: req.admin });
};

// ==========================================
// PUT /api/admin/auth/change-password
// ==========================================
exports.changePassword = async (req, res) => {
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
        return res.status(400).json({ error: 'กรุณาระบุรหัสผ่านเดิมและใหม่' });
    }
    if (new_password.length < 8) {
        return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' });
    }

    db.query(
        'SELECT password_hash FROM admin_users WHERE id = ?',
        [req.adminId],
        async (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!rows.length) return res.status(404).json({ error: 'ไม่พบบัญชี' });

            const match = await bcrypt.compare(old_password, rows[0].password_hash);
            if (!match) return res.status(401).json({ error: 'รหัสผ่านเดิมไม่ถูกต้อง' });

            const newHash = await bcrypt.hash(new_password, 10);
            db.query(
                'UPDATE admin_users SET password_hash = ? WHERE id = ?',
                [newHash, req.adminId],
                (e) => {
                    if (e) return res.status(500).json({ error: e.message });
                    res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
                }
            );
        }
    );
};

// ==========================================
// GET /api/admin/auth/list
// ==========================================
exports.listAdmins = (req, res) => {
    db.query(
        `SELECT id, username, full_name, display_name, email, phone,
                is_active, last_login, login_count, created_at
         FROM admin_users ORDER BY created_at`,
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
};

// ==========================================
// POST /api/admin/auth/create
// ==========================================
exports.createAdmin = async (req, res) => {
    const { username, full_name, display_name, email, password, phone, line_id } = req.body;

    if (!username || !full_name || !email || !password) {
        return res.status(400).json({ error: 'กรุณาระบุ username, full_name, email, password' });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' });
    }

    const hash = await bcrypt.hash(password, 10);
    const sql = `
        INSERT INTO admin_users (username, full_name, display_name, email, password_hash, phone, line_id, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `;
    db.query(
        sql,
        [username, full_name, display_name || null, email, hash, phone || null, line_id || null],
        (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'username หรือ email นี้มีอยู่แล้ว' });
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: `สร้างบัญชี ${username} สำเร็จ`, adminId: result.insertId });
        }
    );
};

// ==========================================
// PUT /api/admin/auth/:id/toggle
// ==========================================
exports.toggleActive = (req, res) => {
    const { id } = req.params;
    if (parseInt(id) === req.adminId) {
        return res.status(400).json({ error: 'ไม่สามารถระงับบัญชีตัวเองได้' });
    }
    db.query(
        'UPDATE admin_users SET is_active = NOT is_active WHERE id = ?',
        [id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!result.affectedRows) return res.status(404).json({ error: 'ไม่พบบัญชี' });
            res.json({ message: 'อัพเดทสถานะสำเร็จ' });
        }
    );
};
