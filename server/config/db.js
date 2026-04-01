const mysql = require('mysql2');

// ใช้ Pool แทน single connection
// เพราะ SSE (long-lived connections) + หลาย query พร้อมกัน → single connection บล็อกกัน
const pool = mysql.createPool({
  host:               'localhost',
  user:               'root',
  password:           '',
  database:           'property_db',
  charset:            'utf8mb4',
  connectionLimit:    20,               // เพิ่มจาก 10 → 20 (React strict mode ส่ง request ซ้ำ)
  waitForConnections: true,
  queueLimit:         0,
  connectTimeout:     10000,            // 10 วินาที timeout สร้าง TCP connection ไป MySQL
  // acquireTimeout ไม่รองรับใน mysql2 — ใช้ connectTimeout แทน
  enableKeepAlive:    true,
  keepAliveInitialDelay: 10000,
});

// ทดสอบ connection ตอน startup
pool.getConnection((err, conn) => {
  if (err) {
    console.error('❌ เชื่อมต่อ property_db ไม่ได้:', err.message);
    console.error('   → ตรวจสอบว่า MySQL/XAMPP รันอยู่');
    console.error('   → ตรวจสอบ database "property_db" มีอยู่จริง');
    return;
  }
  console.log('✅ เชื่อมต่อ property_db สำเร็จ (pool, max 20 connections)');
  conn.release();
});

// Log pool errors เพื่อ debug
pool.on('connection', (conn) => {
  console.log(`   📎 Pool: new connection #${conn.threadId}`);
});

module.exports = pool;
