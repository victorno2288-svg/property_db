const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const investmentPropertyController = require('../controllers/investmentPropertyController');

// POST /api/investment-properties/create — ลงประกาศทรัพย์สิน (ต้อง login)
router.post('/create', verifyToken, investmentPropertyController.create);

// GET /api/investment-properties — ดูทั้งหมด (Admin)
router.get('/', verifyToken, investmentPropertyController.getAll);

// GET /api/investment-properties/my — ดูของตัวเอง
router.get('/my', verifyToken, investmentPropertyController.getMyProperties);

// PUT /api/investment-properties/:id/status — อัพเดทสถานะ (Admin)
router.put('/:id/status', verifyToken, investmentPropertyController.updateStatus);

module.exports = router;
