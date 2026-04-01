const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middleware/verifyAdmin');
const { upload, scanDeed } = require('../controllers/ocrController');

// POST /api/admin/ocr/scan — แอดมินอัพโหลดรูปโฉนด → OCR → return fields
router.post('/scan', verifyAdmin, upload.single('deed_image'), scanDeed);

module.exports = router;
