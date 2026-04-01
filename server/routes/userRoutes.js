const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');

// ── Public (ไม่ต้อง login) ─────────────────
router.post('/forgot-password', ctrl.forgotPasswordRequest);

// ── Protected (user ต้อง login) ───────────
router.get ('/profile',          verifyToken, ctrl.getProfile);
router.put ('/profile',          verifyToken, ctrl.updateProfile);

// saved properties (heart)
router.get ('/saved',             verifyToken, ctrl.getSavedProperties);
router.post('/saved/check',       verifyToken, ctrl.checkSaved);
router.post('/saved/:propertyId', verifyToken, ctrl.toggleSaved);

// password change request
router.post('/password-request',  verifyToken, ctrl.requestPasswordChange);
router.get ('/password-request',  verifyToken, ctrl.getMyPasswordRequest);

// user notifications
router.get ('/notifications',        verifyToken, ctrl.getUserNotifications);
router.post('/notifications/read',   verifyToken, ctrl.markNotificationsRead);
router.get ('/notifications/stream', ctrl.streamNotifications); // SSE — auth ทำใน controller ผ่าน ?token=xxx

module.exports = router;
