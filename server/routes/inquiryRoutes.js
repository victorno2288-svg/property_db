const express = require('express');
const router = express.Router();
const inquiryController = require('../controllers/inquiryController');
const { verifyAdmin } = require('../middleware/verifyAdmin');

// Public — ใครก็ส่งได้ ไม่ต้อง login
router.post('/', inquiryController.createInquiry);

// Protected — Admin เท่านั้น
router.get('/timeline', verifyAdmin, inquiryController.getTimeline);   // ← ต้องอยู่ก่อน /:id
router.get('/', verifyAdmin, inquiryController.getAllInquiries);
router.put('/:id/status',  verifyAdmin, inquiryController.updateInquiryStatus);
router.put('/:id',         verifyAdmin, inquiryController.updateInquiry);
router.delete('/:id',      verifyAdmin, inquiryController.deleteInquiry);

module.exports = router;
