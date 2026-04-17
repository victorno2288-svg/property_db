const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const { verifyToken } = require('../middleware/auth');
const tracker = require('../utils/viewerTracker');

// Public — ไม่ต้อง login
// ⚠️ featured, latest, counts ต้องอยู่ก่อน /:id เพราะจะตีกับ param
router.get('/featured', propertyController.getFeaturedProperties);
router.get('/featured-random', propertyController.getRandomFeaturedProperties);
router.get('/latest', propertyController.getLatestProperties);
router.get('/counts', propertyController.getPropertyCounts);
router.get('/province-counts', propertyController.getProvinceCounts);
router.get('/stats', propertyController.getStats);
router.get('/sales-summary', propertyController.getSalesSummary);
router.get('/property-timeline', propertyController.getPropertyTimeline);
router.get('/', propertyController.getAllProperties);
router.get('/:id', propertyController.getPropertyById);

// ===== Real-time Viewer Tracking =====
// POST /api/properties/:id/viewers/heartbeat — ping ทุก 20s ขณะดูหน้าอยู่
router.post('/:id/viewers/heartbeat', (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
  const count = tracker.heartbeat(req.params.id, sessionId);
  res.json({ count });
});

// POST /api/properties/:id/viewers/leave — sendBeacon ตอน unload
// sendBeacon ส่ง text/plain (เพื่อหลีกเลี่ยง CORS preflight) → ต้อง parse body เอง
router.post('/:id/viewers/leave', express.text({ type: 'text/plain' }), (req, res) => {
  let sessionId;
  try {
    // text/plain body จาก sendBeacon → parse JSON string ด้วยตัวเอง
    const parsed = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    sessionId = parsed.sessionId;
  } catch {
    sessionId = undefined;
  }
  if (sessionId) tracker.leave(req.params.id, sessionId);
  res.json({ ok: true });
});

// GET /api/properties/:id/viewers — ดูจำนวนโดยไม่ ping
router.get('/:id/viewers', (req, res) => {
  res.json({ count: tracker.getCount(req.params.id) });
});

// Protected — ต้อง login
router.post('/', verifyToken, propertyController.createProperty);
router.put('/:id', verifyToken, propertyController.updateProperty);
router.delete('/:id', verifyToken, propertyController.deleteProperty);

// Favorites
router.get('/user/favorites', verifyToken, propertyController.getFavorites);
router.post('/:property_id/favorite', verifyToken, propertyController.toggleFavorite);

module.exports = router;
