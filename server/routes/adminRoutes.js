const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/adminPropertyController');
const userCtrl   = require('../controllers/adminUserController');
const { verifyAdmin } = require('../middleware/verifyAdmin');
const upload     = require('../middleware/upload');
const uploadDeed = require('../middleware/uploadDeed');

// ── SSE — ต้องอยู่ก่อน router.use(verifyAdmin) เพราะ EventSource ไม่รองรับ custom headers
// auth ทำเองใน controller ผ่าน ?token=xxx
router.get('/notifications/stream', userCtrl.streamAdminNotifications);

// ทุก route ต้อง login ด้วยบัญชี admin_users
router.use(verifyAdmin);

// ===== Properties CRUD =====
router.get('/properties',           ctrl.getAllProperties);
router.get('/properties/:id',       ctrl.getPropertyById);
router.post('/properties',          ctrl.createProperty);
router.put('/properties/:id',       ctrl.updateProperty);
router.delete('/properties/:id',    ctrl.deleteProperty);

// ===== Image Upload =====
router.post('/upload',                                   upload.single('image'), ctrl.uploadImage);
router.post('/properties/:id/images',                    upload.single('image'), ctrl.addImage);
router.delete('/properties/:id/images/:img_id',          ctrl.deleteImage);

// ===== Amenities =====
router.post('/properties/:id/amenities',                 ctrl.addAmenity);
router.delete('/properties/:id/amenities/:amenity_id',   ctrl.deleteAmenity);

// ===== Nearby Places =====
router.post('/properties/:id/nearby',                    ctrl.addNearby);
router.delete('/properties/:id/nearby/:nearby_id',       ctrl.deleteNearby);

// ===== Deed Image — single (legacy, backward compat) =====
router.post('/properties/:id/deed',   uploadDeed.single('deed_image'), ctrl.uploadDeedImage);
router.delete('/properties/:id/deed', ctrl.deleteDeedImage);

// ===== Multi-Deed Images =====
router.get   ('/properties/:id/deeds',           ctrl.listDeeds);
router.post  ('/properties/:id/deeds',           uploadDeed.single('deed_image'), ctrl.addDeed);
router.delete('/properties/:id/deeds/:deedId',   ctrl.deleteDeed);

// ===== User Management =====
router.get   ('/users',                          userCtrl.getAllUsers);
router.put   ('/users/:id',                      userCtrl.updateUser);
router.delete('/users/:id',                      userCtrl.deleteUser);
router.put   ('/users/:id/password',             userCtrl.changeUserPassword);
router.get   ('/password-requests',              userCtrl.getPasswordRequests);
router.put   ('/password-requests/:id/approve',  userCtrl.approvePasswordRequest);
router.put   ('/password-requests/:id/reject',   userCtrl.rejectPasswordRequest);
router.get   ('/notifications',                  userCtrl.getNotifications);
router.get   ('/settings/auto-approve',          userCtrl.getAutoApprove);
router.put   ('/settings/auto-approve',          userCtrl.setAutoApprove);

module.exports = router;
