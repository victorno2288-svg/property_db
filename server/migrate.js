/**
 * migrate.js — รัน SQL migration ใน MySQL ผ่าน project's db connection
 * วิธีใช้:  node server/migrate.js
 */
const db = require('./config/db');

const migrations = [
  {
    name: 'ADD new_password_hash to password_change_requests',
    sql: `ALTER TABLE password_change_requests
            ADD COLUMN IF NOT EXISTS new_password_hash VARCHAR(255) DEFAULT NULL
            COMMENT 'รหัสผ่านใหม่ที่ user กำหนด (hashed) รอ admin อนุมัติ'`,
  },
  {
    name: 'CREATE TABLE user_notifications',
    sql: `CREATE TABLE IF NOT EXISTS user_notifications (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            user_id     INT NOT NULL,
            type        ENUM('password_approved','property_sold','property_rented') NOT NULL,
            message     VARCHAR(500) NOT NULL,
            property_id INT DEFAULT NULL,
            is_read     TINYINT(1) DEFAULT 0,
            created_at  DATETIME DEFAULT NOW(),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  },
  {
    name: 'CREATE TABLE admin_settings',
    sql: `CREATE TABLE IF NOT EXISTS admin_settings (
            key_name   VARCHAR(100) PRIMARY KEY,
            value      TEXT,
            updated_at DATETIME DEFAULT NOW()
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  },
  {
    name: 'INSERT default auto_approve_password = 0',
    sql: `INSERT IGNORE INTO admin_settings (key_name, value)
          VALUES ('auto_approve_password', '0')`,
  },
];

let idx = 0;

const runNext = () => {
  if (idx >= migrations.length) {
    console.log('\n✅ Migration ทั้งหมดเสร็จสมบูรณ์!\n');
    db.end();
    return;
  }

  const m = migrations[idx];
  console.log(`▶ [${idx + 1}/${migrations.length}] ${m.name}`);

  db.query(m.sql, (err) => {
    if (err) {
      console.error(`  ❌ ERROR: ${err.message}\n`);
      db.end();
      process.exit(1);
    }
    console.log(`  ✅ สำเร็จ\n`);
    idx++;
    runNext();
  });
};

// เริ่มรัน
console.log('═══════════════════════════════════');
console.log('  LoanDD — Database Migration');
console.log('═══════════════════════════════════\n');
runNext();
