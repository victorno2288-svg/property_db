const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

// ==========================================
// ฟังก์ชันสมัครสมาชิก
// POST /api/auth/register
// ==========================================
exports.register = (req, res) => {
    const { username, password, email, phone } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'กรุณากรอก username และ password' });
    }
    if (!email || !email.trim()) {
        return res.status(400).json({ error: 'กรุณากรอกอีเมล' });
    }
    if (!phone || !phone.trim()) {
        return res.status(400).json({ error: 'กรุณากรอกเบอร์โทรศัพท์' });
    }

    // ─── เช็คซ้ำก่อน INSERT (username, email, phone) ───
    const checkSql = `
      SELECT
        SUM(username = ?) AS dup_username,
        SUM(email = ?)    AS dup_email,
        SUM(phone = ?)    AS dup_phone
      FROM users
      WHERE username = ? OR email = ? OR phone = ?
    `;
    db.query(checkSql, [username, email, phone, username, email, phone], (checkErr, rows) => {
        if (checkErr) {
            console.error('Register check error:', checkErr);
            return res.status(500).json({ error: 'Server Error' });
        }

        const dup = rows[0];
        if (dup.dup_username > 0) return res.status(400).json({ error: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' });
        if (dup.dup_email > 0)    return res.status(400).json({ error: 'อีเมลนี้ถูกใช้แล้ว' });
        if (dup.dup_phone > 0)    return res.status(400).json({ error: 'เบอร์โทรนี้ถูกใช้แล้ว' });

        bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
            if (hashErr) {
                console.error('Hash error:', hashErr);
                return res.status(500).json({ error: 'Server Error' });
            }

            const sql = `INSERT INTO users (username, password_hash, email, phone, role) VALUES (?, ?, ?, ?, ?)`;
            db.query(sql, [username.trim(), hashedPassword, email.trim(), phone.trim(), 'borrower'], (err, result) => {
                if (err) {
                    console.error('Register error:', err);
                    if (err.code === 'ER_DUP_ENTRY') {
                        // Fallback: ถ้าผ่าน check แต่ยัง dup (race condition)
                        if (err.message.includes('username'))  return res.status(400).json({ error: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' });
                        if (err.message.includes('email'))     return res.status(400).json({ error: 'อีเมลนี้ถูกใช้แล้ว' });
                        if (err.message.includes('phone'))     return res.status(400).json({ error: 'เบอร์โทรนี้ถูกใช้แล้ว' });
                        return res.status(400).json({ error: 'ข้อมูลซ้ำกับสมาชิกอื่น' });
                    }
                    return res.status(500).json({ error: 'สมัครสมาชิกไม่สำเร็จ' });
                }
                res.json({ message: 'สมัครสมาชิกสำเร็จ!', userId: result.insertId });
            });
        });
    });
};

// ==========================================
// ฟังก์ชันเข้าสู่ระบบ
// POST /api/auth/login
// ==========================================
exports.login = (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'กรุณากรอก username และ password' });
    }

    const sql = 'SELECT * FROM users WHERE username = ?';
    db.query(sql, [username], (err, results) => {
        if (err) return res.status(500).json({ error: 'Server Error' });
        if (results.length === 0) return res.status(401).json({ error: 'ไม่พบชื่อผู้ใช้งาน' });

        const user = results[0];

        // เช็คสถานะบัญชี (active / suspended / banned)
        if (user.status === 'suspended') {
            return res.status(403).json({ error: 'บัญชีของคุณถูกระงับชั่วคราว กรุณาติดต่อแอดมิน' });
        }
        if (user.status === 'banned') {
            return res.status(403).json({ error: 'บัญชีของคุณถูกปิดการใช้งาน' });
        }

        bcrypt.compare(password, user.password_hash, (compareErr, match) => {
            if (compareErr) return res.status(500).json({ error: 'Server Error' });
            if (!match) return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });

            const token = jwt.sign(
                { id: user.id, role: user.role, department: user.department },
                JWT_SECRET,
                { expiresIn: '30d' }
            );

            res.json({
                message: 'Login สำเร็จ',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    department: user.department,
                    is_verified: user.is_verified
                }
            });
        });
    });
};

// ==========================================
// ดึงข้อมูล User ปัจจุบัน (ตรวจ Token + ดึง is_verified)
// GET /api/auth/me
// ==========================================
exports.me = (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'ไม่พบ Token กรุณาเข้าสู่ระบบ' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Token หมดอายุหรือไม่ถูกต้อง' });
        }

        const sql = 'SELECT id, username, email, phone, role, department, is_verified, status, created_at FROM users WHERE id = ?';
        db.query(sql, [decoded.id], (err, results) => {
            if (err) {
                console.error('Auth/me query error:', err);
                return res.status(500).json({ error: 'Server Error' });
            }
            if (results.length === 0) {
                return res.status(404).json({ error: 'ไม่พบผู้ใช้นี้' });
            }

            const user = results[0];

            if (user.status === 'suspended' || user.status === 'banned') {
                return res.status(403).json({ error: 'บัญชีถูกระงับ', status: user.status });
            }

            res.json({
                id: user.id,
                username: user.username,
                email: user.email,
                phone: user.phone,
                role: user.role,
                department: user.department,
                is_verified: user.is_verified,
                created_at: user.created_at
            });
        });
    });
};
