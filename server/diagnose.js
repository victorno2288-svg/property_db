/**
 * diagnose.js — ตรวจสอบระบบทั้งหมดในรอบเดียว
 *
 * วิธีใช้:  cd lond/server  →  node diagnose.js
 *
 * เช็ค:
 *  1. เชื่อมต่อ MySQL ได้ไหม
 *  2. ตารางที่จำเป็นมีครบไหม
 *  3. มี user / admin_user อยู่ในระบบไหม
 *  4. password hash ใช้ได้ไหม (ไม่ใช่ PLACEHOLDER)
 *  5. reset รหัสผ่านให้ใช้งานได้ทันที
 */

const mysql  = require('mysql2');
const bcrypt = require('bcryptjs');

const pool = mysql.createPool({
  host: 'localhost', user: 'root', password: '', database: 'property_db',
  charset: 'utf8mb4', connectionLimit: 5, waitForConnections: true,
});

const query = (sql, params = []) => new Promise((resolve, reject) => {
  pool.query(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
});

async function run() {
  console.log('\n════════════════════════════════════════');
  console.log('  🔍  LoanDD Diagnostic Tool');
  console.log('════════════════════════════════════════\n');

  // ── 1. Test DB connection ──
  try {
    const [row] = await query('SELECT 1 AS ok');
    console.log('✅ [1] MySQL เชื่อมต่อได้ — database: property_db');
  } catch (e) {
    console.error('❌ [1] MySQL เชื่อมต่อไม่ได้:', e.message);
    console.log('\n   → ตรวจสอบว่า MySQL/XAMPP รันอยู่');
    console.log('   → ตรวจสอบ database "property_db" มีอยู่จริง');
    process.exit(1);
  }

  // ── 2. Check required tables ──
  const requiredTables = [
    'users', 'admin_users', 'properties', 'property_images',
    'property_amenities', 'nearby_places', 'property_inquiries',
    'provinces', 'property_favorites', 'password_change_requests',
    'user_notifications', 'admin_settings', 'property_deeds',
  ];

  const existingTables = (await query('SHOW TABLES')).map(r => Object.values(r)[0]);
  const missing = requiredTables.filter(t => !existingTables.includes(t));

  if (missing.length === 0) {
    console.log(`✅ [2] ตารางครบ ${requiredTables.length}/${requiredTables.length} ตาราง`);
  } else {
    console.log(`⚠️  [2] ขาดตาราง ${missing.length} ตาราง: ${missing.join(', ')}`);
    console.log('   → ต้อง import SQL dump ใหม่ หรือรัน migration files');
  }

  // ── 3. Check users ──
  try {
    const users = await query('SELECT id, username, role, status, LEFT(password_hash, 30) AS hash_preview FROM users LIMIT 10');
    console.log(`\n✅ [3] ตาราง users มี ${users.length} แถว:`);
    users.forEach(u => {
      const hashOk = u.hash_preview && u.hash_preview.startsWith('$2') && !u.hash_preview.includes('PLACEHOLDER');
      console.log(`   👤 ${u.username} | role=${u.role} | status=${u.status} | hash=${hashOk ? '✅ OK' : '❌ BAD'}`);
    });
  } catch (e) {
    console.log(`❌ [3] อ่านตาราง users ไม่ได้: ${e.message}`);
  }

  // ── 4. Check admin_users ──
  try {
    const admins = await query('SELECT id, username, LEFT(password_hash, 30) AS hash_preview FROM admin_users LIMIT 10');
    console.log(`\n✅ [4] ตาราง admin_users มี ${admins.length} แถว:`);
    admins.forEach(a => {
      const hashOk = a.hash_preview && a.hash_preview.startsWith('$2') && !a.hash_preview.includes('PLACEHOLDER');
      console.log(`   🔑 ${a.username} | hash=${hashOk ? '✅ OK' : '❌ BAD'}`);
    });
  } catch (e) {
    console.log(`❌ [4] อ่านตาราง admin_users ไม่ได้: ${e.message}`);
  }

  // ── 5. Check properties ──
  try {
    const [row] = await query('SELECT COUNT(*) AS cnt FROM properties');
    console.log(`\n✅ [5] ตาราง properties มี ${row.cnt} รายการ`);
  } catch (e) {
    console.log(`❌ [5] อ่าน properties ไม่ได้: ${e.message}`);
  }

  // ── 6. Check provinces ──
  try {
    const [row] = await query('SELECT COUNT(*) AS cnt FROM provinces');
    console.log(`✅ [6] ตาราง provinces มี ${row.cnt} จังหวัด`);
  } catch (e) {
    console.log(`❌ [6] อ่าน provinces ไม่ได้: ${e.message}`);
  }

  // ── 7. Auto-fix: Reset passwords if bad ──
  console.log('\n────────────────────────────────────────');
  console.log('  🔧  Auto-Fix: Reset Passwords');
  console.log('────────────────────────────────────────\n');

  // Reset user passwords
  try {
    const users = await query('SELECT id, username, password_hash FROM users');
    let fixedUsers = 0;
    for (const u of users) {
      const isBad = !u.password_hash || u.password_hash.includes('PLACEHOLDER') || !u.password_hash.startsWith('$2');
      if (isBad) {
        const hash = await bcrypt.hash('123456', 10);
        await query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, u.id]);
        console.log(`   🔧 Reset user "${u.username}" → password: 123456`);
        fixedUsers++;
      }
    }
    if (fixedUsers === 0) console.log('   ✅ user passwords ทั้งหมดปกติ (ไม่ต้อง reset)');
  } catch (e) {
    console.log(`   ❌ ไม่สามารถ reset user passwords: ${e.message}`);
  }

  // Reset admin passwords
  try {
    const admins = await query('SELECT id, username, password_hash FROM admin_users');
    let fixedAdmins = 0;
    for (const a of admins) {
      const isBad = !a.password_hash || a.password_hash.includes('PLACEHOLDER') || !a.password_hash.startsWith('$2');
      if (isBad) {
        const hash = await bcrypt.hash('admin1234', 10);
        await query('UPDATE admin_users SET password_hash = ? WHERE id = ?', [hash, a.id]);
        console.log(`   🔧 Reset admin "${a.username}" → password: admin1234`);
        fixedAdmins++;
      }
    }
    if (fixedAdmins === 0) console.log('   ✅ admin passwords ทั้งหมดปกติ (ไม่ต้อง reset)');
  } catch (e) {
    console.log(`   ❌ ไม่สามารถ reset admin passwords: ${e.message}`);
  }

  // ── 8. Ensure admin_settings has auto_approve row ──
  try {
    await query("INSERT IGNORE INTO admin_settings (key_name, value) VALUES ('auto_approve_password', '0')");
    console.log('   ✅ admin_settings: auto_approve_password พร้อมใช้งาน');
  } catch (e) {
    console.log(`   ⚠️  admin_settings: ${e.message}`);
  }

  // ── 9. Test: Login with a user account ──
  console.log('\n────────────────────────────────────────');
  console.log('  🧪  Quick Login Test');
  console.log('────────────────────────────────────────\n');

  try {
    const users = await query('SELECT id, username, password_hash, role, status FROM users LIMIT 1');
    if (users.length > 0) {
      const u = users[0];
      // ลอง verify password 123456
      const match = await bcrypt.compare('123456', u.password_hash);
      console.log(`   👤 User "${u.username}" | role=${u.role} | status=${u.status}`);
      console.log(`   🔐 Password "123456" → ${match ? '✅ ตรง!' : '❌ ไม่ตรง (อาจเป็นรหัสเดิม)'}`);
      if (!match) {
        // ลอง test password เปล่า
        console.log('   💡 ลอง reset ให้ใหม่...');
        const hash = await bcrypt.hash('123456', 10);
        await query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, u.id]);
        console.log(`   🔧 Force reset "${u.username}" → password: 123456 ✅`);
      }
    } else {
      console.log('   ⚠️  ไม่มี user ในระบบเลย — ต้องสมัครใหม่');
    }
  } catch (e) {
    console.log(`   ❌ Login test failed: ${e.message}`);
  }

  try {
    const admins = await query('SELECT id, username, password_hash FROM admin_users LIMIT 1');
    if (admins.length > 0) {
      const a = admins[0];
      const match = await bcrypt.compare('admin1234', a.password_hash);
      console.log(`\n   🔑 Admin "${a.username}"`);
      console.log(`   🔐 Password "admin1234" → ${match ? '✅ ตรง!' : '❌ ไม่ตรง'}`);
      if (!match) {
        const hash = await bcrypt.hash('admin1234', 10);
        await query('UPDATE admin_users SET password_hash = ? WHERE id = ?', [hash, a.id]);
        console.log(`   🔧 Force reset "${a.username}" → password: admin1234 ✅`);
      }
    } else {
      console.log('\n   ⚠️  ไม่มี admin ในระบบเลย — ต้องสร้างใหม่');
      const hash = await bcrypt.hash('admin1234', 10);
      await query("INSERT INTO admin_users (username, password_hash) VALUES ('superadmin', ?)", [hash]);
      console.log('   🔧 สร้าง admin "superadmin" / password: admin1234 ✅');
    }
  } catch (e) {
    console.log(`   ❌ Admin test failed: ${e.message}`);
  }

  // ── Summary ──
  console.log('\n════════════════════════════════════════');
  console.log('  📋  สรุป — ขั้นตอนถัดไป');
  console.log('════════════════════════════════════════');
  console.log('');
  console.log('  1. ปิด server เดิม (Ctrl+C)');
  console.log('  2. cd lond/server');
  console.log('  3. node app.js');
  console.log('  4. ดูให้ได้ข้อความ:');
  console.log('     "✅ เชื่อมต่อ property_db สำเร็จ (pool)"');
  console.log('     "🏠 Property Server รันที่ http://localhost:3001"');
  console.log('');
  console.log('  5. เปิด browser ลอง login:');
  console.log('     👤 User:  username จาก DB / password: 123456');
  console.log('     🔑 Admin: username จาก DB / password: admin1234');
  console.log('');
  if (missing.length > 0) {
    console.log(`  ⚠️  ต้อง import SQL dump ก่อน — ขาดตาราง: ${missing.join(', ')}`);
    console.log('');
  }

  pool.end();
}

run().catch(e => {
  console.error('\n💥 Diagnostic error:', e.message);
  pool.end();
  process.exit(1);
});
