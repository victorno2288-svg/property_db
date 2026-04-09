/**
 * fix-login.js — แก้ปัญหา login 401
 *
 * วิธีใช้: cd lond/server && node fix-login.js
 */

const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'property_db',
  charset: 'utf8mb4',
});

async function main() {
  console.log('==========================================');
  console.log('  fix-login.js — แก้ปัญหา login 401');
  console.log('==========================================\n');

  try {
    await query('SELECT 1');
    console.log('✅ เชื่อมต่อ MySQL สำเร็จ\n');
  } catch (e) {
    console.error('❌ เชื่อมต่อ MySQL ไม่ได้:', e.message);
    console.error('   → เปิด XAMPP แล้วกด Start MySQL ก่อน');
    process.exit(1);
  }

  // Hash รหัสผ่าน LoanDD2026
  const hash = await bcrypt.hash('LoanDD2026', 10);

  // ---- แก้ admin_users ----
  console.log('--- admin_users ---');
  const admins = await query('SELECT id, username, full_name, is_active FROM admin_users');

  if (admins.length === 0) {
    console.log('⚠️  ตารางว่าง → สร้าง superadmin ใหม่...');
    await query(
      `INSERT INTO admin_users (username, full_name, display_name, email, password_hash, phone, is_active)
       VALUES ('superadmin', 'Super Admin', 'Super Admin', 'admin@loandd.com', ?, '0000000000', 1)`,
      [hash]
    );
    console.log('✅ สร้าง admin: superadmin / LoanDD2026');
  } else {
    for (const a of admins) {
      console.log(`   [${a.id}] ${a.username} — ${a.full_name} (active=${a.is_active})`);
    }
    // อัพเดต password ของ superadmin
    const result = await query('UPDATE admin_users SET password_hash = ?, is_active = 1 WHERE username = ?', [hash, 'superadmin']);
    if (result.affectedRows > 0) {
      console.log('✅ อัพเดตรหัสผ่าน superadmin → LoanDD2026');
    } else {
      // ถ้าไม่มี superadmin → อัพเดตทุกคน
      await query('UPDATE admin_users SET password_hash = ?, is_active = 1', [hash]);
      console.log('✅ อัพเดตรหัสผ่าน admin ทั้งหมด → LoanDD2026');
    }
  }

  // ---- แก้ users ----
  console.log('\n--- users ---');
  const users = await query('SELECT id, username, role, status FROM users');

  if (users.length === 0) {
    console.log('⚠️  ตารางว่าง → สร้าง user ใหม่...');
    await query(
      `INSERT INTO users (username, password_hash, email, phone, role, status)
       VALUES ('testuser', ?, 'test@test.com', '0812345678', 'borrower', 'active')`,
      [hash]
    );
    console.log('✅ สร้าง user: testuser / LoanDD2026');
  } else {
    for (const u of users) {
      console.log(`   [${u.id}] "${u.username}" — role=${u.role}, status=${u.status}`);
    }
    // Fix trailing spaces + reset password + activate
    for (const u of users) {
      const trimmed = u.username.trim();
      await query("UPDATE users SET username = ?, password_hash = ?, status = 'active' WHERE id = ?",
        [trimmed, hash, u.id]);
    }
    console.log('✅ อัพเดตรหัสผ่าน users ทั้งหมด → LoanDD2026');
  }

  console.log('\n==========================================');
  console.log('  ✅ เสร็จแล้ว! ลอง login:');
  console.log('  🔹 Admin — superadmin / LoanDD2026');
  console.log('  🔹 User  — ชื่อ user ด้านบน / LoanDD2026');
  console.log('==========================================\n');

  db.end();
}

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

main().catch(e => {
  console.error('❌ Error:', e.message);
  db.end();
  process.exit(1);
});
