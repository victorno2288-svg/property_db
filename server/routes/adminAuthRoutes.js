/**
 * adminAuthRoutes.js
 * Route สำหรับ Authentication ของ admin_users
 * Base: /api/admin/auth
 */
const router = require('express').Router();
const ctrl   = require('../controllers/adminAuthController');
const { verifyAdmin } = require('../middleware/verifyAdmin');

// POST /api/admin/auth/login  — PUBLIC
router.post('/login', ctrl.login);

// GET  /api/admin/auth/me     — ดูข้อมูลตัวเอง
router.get('/me', verifyAdmin, ctrl.getMe);

// PUT  /api/admin/auth/change-password
router.put('/change-password', verifyAdmin, ctrl.changePassword);

// GET  /api/admin/auth/list   — ดูรายชื่อ admin ทั้งหมด
router.get('/list', verifyAdmin, ctrl.listAdmins);

// POST /api/admin/auth/create — สร้าง admin ใหม่ (ไม่ต้อง token — internal use)
router.post('/create', ctrl.createAdmin);

// PUT  /api/admin/auth/:id/toggle — เปิด/ปิดบัญชี
router.put('/:id/toggle', verifyAdmin, ctrl.toggleActive);

module.exports = router;
