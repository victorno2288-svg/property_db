/**
 * verifyAdmin.js — Middleware ตรวจสอบ JWT ของ admin_users
 * แยกจาก verifyToken (ที่ใช้กับ users ทั่วไป)
 */
const jwt = require('jsonwebtoken');
const db  = require('../config/db');

// ต้องตรงกับ ADMIN_JWT_SECRET ใน .env เสมอ
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'Admin_Secret_Key_LoanDD_2026';

const verifyAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ Admin' });
    }

    jwt.verify(token, ADMIN_JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Token หมดอายุหรือไม่ถูกต้อง กรุณา login ใหม่' });
        }

        if (!decoded.isAdmin) {
            return res.status(403).json({ error: 'Token นี้ไม่ใช่ Admin Token' });
        }

        // ตรวจสอบใน DB ว่า account ยังใช้งานได้
        db.query(
            'SELECT id, username, full_name, display_name, email, is_active FROM admin_users WHERE id = ?',
            [decoded.adminId],
            (dbErr, rows) => {
                if (dbErr) return res.status(500).json({ error: 'DB Error' });
                if (!rows.length || !rows[0].is_active) {
                    return res.status(403).json({ error: 'บัญชีนี้ถูกระงับหรือไม่มีอยู่ในระบบ' });
                }

                req.admin   = rows[0];
                req.adminId = rows[0].id;
                next();
            }
        );
    });
};

module.exports = { verifyAdmin, ADMIN_JWT_SECRET };
