const express = require('express');
const router = express.Router();
const provinceController = require('../controllers/provinceController');

// GET /api/provinces — ดึงจังหวัดทั้งหมด
router.get('/', provinceController.getProvinces);

// GET /api/provinces/popular — ดึงจังหวัดยอดนิยม
router.get('/popular', provinceController.getPopularProvinces);

module.exports = router;
