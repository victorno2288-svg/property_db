/**
 * test-db-login.js
 * ทดสอบ DB connection + ตรวจว่ามี users อยู่ในฐานข้อมูลจริงไหม
 *
 * วิธีใช้: cd lond/server && node test-db-login.js
 */

const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'property_db',
  charset: 'utf8mb4',
});

console.log('🔍 ทดสอบการเชื่อมต่อ property_db...\n');

pool.getConnection((err, conn) => {
  if (err) {
    console.error('❌ เชื่อมต่อ MySQL ไม่ได้:', err.message);
    console.error('   → ตรวจสอบว่า XAMPP / MySQL รันอยู่');
    console.error('   → ตรวจสอบว่า database "property_db" มีอยู่');
    process.exit(1);
  }

  console.log('✅ เชื่อมต่อ MySQL สำเร็จ\n');
  conn.release();

  // ---- ตรวจ admin_users ----
  pool.query('SELECT id, username, full_name, is_active, LEFT(password_hash, 20) AS hash_preview FROM admin_users', (err, rows) => {
    if (err) {
      console.error('❌ ตาราง admin_users:', err.message);
    } else if (rows.length === 0) {
      console.error('⚠️  ตาราง admin_users ว่างเปล่า! ต้อง import SQL dump ก่อน');
    } else {
      console.log(`✅ admin_users มี ${rows.length} คน:`);
      rows.forEach(r => {
        console.log(`   - [${r.id}] ${r.username} | ${r.full_name} | active=${r.is_active} | hash=${r.hash_preview}...`);
      });
    }
    console.log('');

    // ---- ตรวจ users ----
    pool.query('SELECT id, username, role, status, LEFT(password_hash, 20) AS hash_preview FROM users', (err2, rows2) => {
      if (err2) {
        console.error('❌ ตาราง users:', err2.message);
      } else if (rows2.length === 0) {
        console.error('⚠️  ตาราง users ว่างเปล่า! ต้อง import SQL dump ก่อน');
      } else {
        console.log(`✅ users มี ${rows2.length} คน:`);
        rows2.forEach(r => {
          console.log(`   - [${r.id}] "${r.username}" | role=${r.role} | status=${r.status} | hash=${r.hash_preview}...`);
        });
      }
      console.log('');

      // ---- ทดสอบ bcrypt compare กับรหัสผ่านจาก SQL dump ----
      // password hash จาก SQL dump ทุกคนใช้ตัวเดียวกัน
      const testHash = '$2a$10$/xHvBTmSCIw3l2xKBH7Z1OUevoD48Z9ivG.T6wdU9MHllAARRpI4W';
      const testPasswords = ['123456', '12345678', 'password', 'admin', 'superadmin', '1234', 'Loandd123', 'loandd', 'test'];

      console.log('🔑 ทดสอบ bcrypt compare กับรหัสผ่านที่น่าจะเป็น...');
      console.log(`   hash = ${testHash}\n`);

      let found = false;
      let checked = 0;

      testPasswords.forEach(pwd => {
        bcrypt.compare(pwd, testHash, (err, match) => {
          checked++;
          if (match) {
            console.log(`   ✅ รหัสผ่านที่ถูกต้อง = "${pwd}"`);
            found = true;
          }
          if (checked === testPasswords.length) {
            if (!found) {
              console.log('   ❌ ไม่ตรงกับรหัสผ่านที่ทดสอบ');
              console.log('   → ลองถาม user ว่าตอนสมัครใช้รหัสผ่านอะไร');
            }
            console.log('\n--- ถ้า users ว่าง → import SQL dump ผ่าน phpMyAdmin ---');
            console.log('--- ถ้า hash ไม่ตรง → สร้าง hash ใหม่ด้วย: node -e "require(\'bcryptjs\').hash(\'รหัสผ่าน\', 10, (e,h) => console.log(h))" ---\n');
            pool.end();
          }
        });
      });
    });
  });
});
