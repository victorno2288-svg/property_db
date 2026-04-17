const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://baand.loandd.co.th'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request timeout — ป้องกัน request ค้างตลอดไป (30 วินาที)
app.use((req, res, next) => {
  // ยกเว้น SSE endpoints (long-lived)
  if (req.path.includes('/notifications/stream')) return next();
  req.setTimeout(30000, () => {
    if (!res.headersSent) {
      console.error(`⏰ Request timeout: ${req.method} ${req.originalUrl}`);
      res.status(408).json({ error: 'Request timeout — server ไม่ตอบภายใน 30 วินาที' });
    }
  });
  next();
});

// Routes
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const provinceRoutes = require('./routes/provinceRoutes');
const investmentPropertyRoutes = require('./routes/investmentPropertyRoutes');
const inquiryRoutes    = require('./routes/inquiryRoutes');
const adminRoutes      = require('./routes/adminRoutes');
const userRoutes       = require('./routes/userRoutes');         // ← user profile/saved/password-request
const adminAuthRoutes  = require('./routes/adminAuthRoutes');  // ← auth สำหรับ admin_users
const ocrRoutes        = require('./routes/ocrRoutes');          // ← OCR สแกนโฉนด

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/provinces', provinceRoutes);
app.use('/api/investment-properties', investmentPropertyRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/admin/auth', adminAuthRoutes);  // ⚠️ ต้องอยู่ก่อน /api/admin เพื่อ routing ถูกต้อง
app.use('/api/admin/ocr',  ocrRoutes);        // OCR สแกนโฉนด
app.use('/api/admin', adminRoutes);

// Health check (no DB)
app.get('/', (req, res) => {
  res.json({ message: 'Property API Server ทำงานปกติ', port: PORT });
});

// Health check WITH DB test
app.get('/health', (req, res) => {
  const db = require('./config/db');
  const start = Date.now();
  db.query('SELECT 1 AS ok', (err, rows) => {
    const ms = Date.now() - start;
    if (err) {
      console.error('❌ /health DB check failed:', err.message);
      return res.status(500).json({ server: 'ok', db: 'error', error: err.message, ms });
    }
    res.json({ server: 'ok', db: 'ok', ms });
  });
});

// Deep health check — ทดสอบทุกตาราง + ตรวจสอบ locks
app.get('/health/deep', (req, res) => {
  const db = require('./config/db');
  const results = {};
  const queries = [
    ['select1', 'SELECT 1 AS ok'],
    ['provinces', 'SELECT COUNT(*) AS cnt FROM provinces'],
    ['properties', 'SELECT COUNT(*) AS cnt FROM properties'],
    ['users', 'SELECT COUNT(*) AS cnt FROM users'],
    ['admin_users', 'SELECT COUNT(*) AS cnt FROM admin_users'],
    ['locks', 'SHOW OPEN TABLES WHERE In_use > 0'],
    ['processlist', 'SHOW PROCESSLIST'],
  ];

  let done = 0;
  const total = queries.length;
  let sent = false;

  queries.forEach(([name, sql]) => {
    const start = Date.now();
    const timer = setTimeout(() => {
      if (!results[name]) results[name] = { error: 'TIMEOUT 8s', ms: 8000 };
      done++;
      if (done >= total && !sent) { sent = true; res.json(results); }
    }, 8000);

    db.query(sql, (err, rows) => {
      clearTimeout(timer);
      const ms = Date.now() - start;
      if (!results[name]) {
        if (err) {
          results[name] = { error: err.message, ms };
        } else {
          results[name] = { ok: true, ms, data: rows.length <= 10 ? rows : { count: rows.length } };
        }
      }
      done++;
      if (done >= total && !sent) { sent = true; res.json(results); }
    });
  });
});

// Fix locks — ปลดล็อคตาราง
app.get('/fix/unlock', (req, res) => {
  const db = require('./config/db');
  db.query('KILL QUERY 0', () => {}); // dummy
  db.query('UNLOCK TABLES', (err) => {
    if (err) return res.json({ unlock: 'error', message: err.message });
    res.json({ unlock: 'ok', message: 'UNLOCK TABLES สำเร็จ — ลอง refresh หน้าเว็บ' });
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(500).json({ error: 'เกิดข้อผิดพลาดภายใน server' });
});

app.listen(PORT, () => {
  console.log(`🏠 Property Server รันที่ http://localhost:${PORT}`);
});
