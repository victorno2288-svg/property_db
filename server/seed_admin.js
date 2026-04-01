/**
 * seed_admin.js — สร้าง Admin คนแรกใน admin_users
 * รันครั้งเดียว: cd server && node seed_admin.js
 *
 * ⚠️  ต้องรัน create_admin_table.sql ใน phpMyAdmin ก่อน
 */

const bcrypt = require('bcryptjs');
const db     = require('./config/db');

// ==========================================
//  🔧 ตั้งค่าที่นี่ก่อนรัน
// ==========================================
const ADMIN_ACCOUNTS = [
  {
    username:     'loandd_admin',
    full_name:    'LoanDD Admin',
    display_name: 'Admin',
    email:        'loandd02@gmail.com',
    password:     'Admin@LoanDD2026',   // ← เปลี่ยนก่อน deploy
    phone:        '000000000',
  },
];
// ==========================================

async function seed() {
  console.log('\n🔐 กำลังสร้าง Admin Accounts...\n');

  for (const acc of ADMIN_ACCOUNTS) {
    const hash = await bcrypt.hash(acc.password, 10);

    const sql = `
      INSERT INTO admin_users (username, full_name, display_name, email, password_hash, phone, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE
        full_name     = VALUES(full_name),
        display_name  = VALUES(display_name),
        password_hash = VALUES(password_hash),
        updated_at    = CURRENT_TIMESTAMP()
    `;

    await new Promise((resolve, reject) => {
      db.query(sql,
        [acc.username, acc.full_name, acc.display_name, acc.email, hash, acc.phone],
        (err, result) => {
          if (err) { console.error(`❌ ${acc.username}:`, err.message); return reject(err); }
          console.log(`✅ ${acc.username} — ${result.affectedRows > 0 ? 'บันทึกแล้ว' : 'อัพเดทแล้ว'}`);
          console.log(`   🔑 password: ${acc.password}`);
          resolve();
        }
      );
    });
  }

  console.log('\n✨ เสร็จสิ้น! เปลี่ยนรหัสผ่านหลัง login ครั้งแรกด้วยนะ\n');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
