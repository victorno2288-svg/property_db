const db     = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');
const sse    = require('../utils/sseManager');

// ─────────────────────────────────────────
// GET /api/users/profile
// ดูโปรไฟล์ตัวเอง
// ─────────────────────────────────────────
exports.getProfile = (req, res) => {
  db.query(
    'SELECT id, username, full_name, display_name, email, phone, role, status, created_at FROM users WHERE id = ?',
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows.length) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
      res.json(rows[0]);
    }
  );
};

// ─────────────────────────────────────────
// PUT /api/users/profile
// แก้ไขโปรไฟล์ตัวเอง (username, full_name, phone)
// ─────────────────────────────────────────
exports.updateProfile = (req, res) => {
  const userId = req.user.id;
  const { username, full_name, phone } = req.body;

  if (!username || !username.trim())
    return res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้' });

  // เช็คเบอร์ซ้ำ (ยกเว้นตัวเอง)
  const checkDup = (field, value) => new Promise((resolve, reject) => {
    if (!value || value.trim() === '') return resolve(null);
    db.query(
      `SELECT id FROM users WHERE ${field} = ? AND id != ?`,
      [value, userId],
      (err, rows) => err ? reject(err) : resolve(rows.length > 0 ? field : null)
    );
  });

  Promise.all([checkDup('username', username), checkDup('phone', phone)])
    .then(([dupU, dupP]) => {
      if (dupU) return res.status(400).json({ error: 'ชื่อผู้ใช้นี้ถูกใช้โดยบัญชีอื่นแล้ว' });
      if (dupP) return res.status(400).json({ error: 'เบอร์โทรนี้ถูกใช้โดยบัญชีอื่นแล้ว' });

      db.query(
        'UPDATE users SET username = ?, full_name = ?, phone = ? WHERE id = ?',
        [username.trim(), full_name?.trim() || null, phone?.trim() || null, userId],
        (err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'อัปเดตโปรไฟล์สำเร็จ' });
        }
      );
    })
    .catch(err => res.status(500).json({ error: err.message }));
};

// ─────────────────────────────────────────
// POST /api/users/password-request
// ยื่นขอเปลี่ยนรหัสผ่าน พร้อมกำหนดรหัสใหม่ที่ต้องการ
// body: { newPassword } (required, min 6 chars)
// ─────────────────────────────────────────
exports.requestPasswordChange = (req, res) => {
  const userId = req.user.id;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6)
    return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });

  db.query(
    "SELECT id FROM password_change_requests WHERE user_id = ? AND status = 'pending'",
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (rows.length > 0)
        return res.status(400).json({ error: 'มีคำขอรออยู่แล้ว กรุณารอแอดมินอนุมัติก่อน' });

      bcrypt.hash(newPassword, 10, (err2, hash) => {
        if (err2) return res.status(500).json({ error: err2.message });

        // ตรวจ auto-approve setting
        db.query("SELECT value FROM admin_settings WHERE key_name='auto_approve_password'", [], (errS, settingRows) => {
          const autoApprove = settingRows?.[0]?.value === '1';

          const status = autoApprove ? 'approved' : 'pending';
          db.query(
            "INSERT INTO password_change_requests (user_id, status, new_password_hash, new_password_plain, requested_at) VALUES (?, ?, ?, ?, NOW())",
            [userId, status, hash, newPassword],
            (err3, insertResult) => {
              if (err3) return res.status(500).json({ error: err3.message });

              if (autoApprove) {
                // อนุมัติทันที — อัปเดตรหัสผ่าน + สร้าง notification
                db.query("UPDATE users SET password_hash = ? WHERE id = ?", [hash, userId], (err4) => {
                  if (err4) return res.status(500).json({ error: err4.message });
                  db.query(
                    "UPDATE password_change_requests SET resolved_at=NOW(), note='อนุมัติอัตโนมัติ' WHERE id=?",
                    [insertResult.insertId]
                  );
                  db.query(
                    "INSERT INTO user_notifications (user_id, type, message) VALUES (?, 'password_approved', 'รหัสผ่านของคุณถูกเปลี่ยนแล้ว (อนุมัติอัตโนมัติ)')",
                    [userId]
                  );
                  // Push real-time ให้ user ทันที
                  sse.pushToUser(userId, 'notification', { type: 'password_approved', message: 'รหัสผ่านของคุณถูกเปลี่ยนแล้ว (อนุมัติอัตโนมัติ)', unread_delta: 1 });
                  res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จทันที (โหมดอนุมัติอัตโนมัติ)', auto_approved: true });
                });
              } else {
                // แจ้ง admin ว่ามีคำขอใหม่
                db.query('SELECT username FROM users WHERE id = ?', [userId], (_e, rows) => {
                  sse.pushToAdmins('new_password_request', { userId, username: rows?.[0]?.username || 'user' });
                });
                res.json({ message: 'ส่งคำขอสำเร็จ รอแอดมินอนุมัติ — รหัสจะเปลี่ยนอัตโนมัติเมื่ออนุมัติแล้ว' });
              }
            }
          );
        });
      });
    }
  );
};

// ─────────────────────────────────────────
// GET /api/users/password-request
// ดูสถานะคำขอล่าสุดของตัวเอง
// ─────────────────────────────────────────
exports.getMyPasswordRequest = (req, res) => {
  db.query(
    'SELECT id, status, note, requested_at, resolved_at FROM password_change_requests WHERE user_id = ? ORDER BY requested_at DESC LIMIT 1',
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows[0] || null);
    }
  );
};

// ─────────────────────────────────────────
// POST /api/users/saved/:propertyId
// Toggle กดหัวใจ save/unsave
// ─────────────────────────────────────────
exports.toggleSaved = (req, res) => {
  const userId     = req.user.id;
  const propertyId = parseInt(req.params.propertyId);

  db.query(
    'SELECT id FROM property_favorites WHERE user_id = ? AND property_id = ?',
    [userId, propertyId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      if (rows.length > 0) {
        db.query(
          'DELETE FROM property_favorites WHERE user_id = ? AND property_id = ?',
          [userId, propertyId],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ saved: false });
          }
        );
      } else {
        db.query(
          'INSERT INTO property_favorites (user_id, property_id) VALUES (?, ?)',
          [userId, propertyId],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ saved: true });
          }
        );
      }
    }
  );
};

// ─────────────────────────────────────────
// GET /api/users/saved
// ดูทรัพย์ที่กดหัวใจไว้
// ─────────────────────────────────────────
exports.getSavedProperties = (req, res) => {
  db.query(
    `SELECT p.id, p.title, p.property_type, p.listing_type,
            p.price_requested, p.monthly_rent,
            p.province, p.district, p.thumbnail_url,
            p.sale_status, p.is_featured,
            pf.created_at AS saved_at
     FROM property_favorites pf
     JOIN properties p ON pf.property_id = p.id
     WHERE pf.user_id = ?
     ORDER BY pf.created_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

// ─────────────────────────────────────────
// POST /api/users/saved/check  { ids: [1,2,3] }
// เช็ค bulk ว่า property ไหนถูก save บ้าง
// ─────────────────────────────────────────
exports.checkSaved = (req, res) => {
  const userId = req.user.id;
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.json([]);

  db.query(
    'SELECT property_id FROM property_favorites WHERE user_id = ? AND property_id IN (?)',
    [userId, ids],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows.map(r => r.property_id));
    }
  );
};

// ─────────────────────────────────────────
// POST /api/users/forgot-password  (ไม่ต้อง auth — ใช้บน login page)
// body: { username, newPassword }
// ─────────────────────────────────────────
exports.forgotPasswordRequest = (req, res) => {
  const { username, newPassword } = req.body;
  if (!username || !newPassword || newPassword.length < 6)
    return res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร' });

  db.query('SELECT id FROM users WHERE username = ?', [username.trim()], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows.length) return res.status(404).json({ error: 'ไม่พบบัญชีผู้ใช้นี้' });

    const userId = rows[0].id;

    db.query(
      "SELECT id FROM password_change_requests WHERE user_id = ? AND status = 'pending'",
      [userId],
      (err2, pending) => {
        if (err2) return res.status(500).json({ error: err2.message });
        if (pending.length > 0)
          return res.status(400).json({ error: 'มีคำขอรออยู่แล้ว กรุณารอแอดมินอนุมัติก่อน' });

        bcrypt.hash(newPassword, 10, (err3, hash) => {
          if (err3) return res.status(500).json({ error: err3.message });

          db.query("SELECT value FROM admin_settings WHERE key_name='auto_approve_password'", [], (errS, settingRows) => {
            const autoApprove = settingRows?.[0]?.value === '1';
            const status = autoApprove ? 'approved' : 'pending';

            db.query(
              "INSERT INTO password_change_requests (user_id, status, new_password_hash, new_password_plain, requested_at) VALUES (?, ?, ?, ?, NOW())",
              [userId, status, hash, newPassword],
              (err4, insertResult) => {
                if (err4) return res.status(500).json({ error: err4.message });

                if (autoApprove) {
                  db.query("UPDATE users SET password_hash = ? WHERE id = ?", [hash, userId], (err5) => {
                    if (err5) return res.status(500).json({ error: err5.message });
                    db.query("UPDATE password_change_requests SET resolved_at=NOW(), note='อนุมัติอัตโนมัติ' WHERE id=?", [insertResult.insertId]);
                    db.query("INSERT INTO user_notifications (user_id, type, message) VALUES (?, 'password_approved', 'รหัสผ่านของคุณถูกเปลี่ยนแล้ว (อนุมัติอัตโนมัติ)')", [userId]);
                    sse.pushToUser(userId, 'notification', { type: 'password_approved', message: 'รหัสผ่านของคุณถูกเปลี่ยนแล้ว (อนุมัติอัตโนมัติ)', unread_delta: 1 });
                    res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ สามารถเข้าสู่ระบบด้วยรหัสใหม่ได้เลย', auto_approved: true });
                  });
                } else {
                  // แจ้ง admin ว่ามีคำขอใหม่ (forgot password จากหน้า login)
                  sse.pushToAdmins('new_password_request', { userId, username });
                  res.json({ message: 'ส่งคำขอสำเร็จ แอดมินจะอนุมัติเร็วๆ นี้ — รหัสจะเปลี่ยนอัตโนมัติหลังอนุมัติ' });
                }
              }
            );
          });
        });
      }
    );
  });
};

// ─────────────────────────────────────────
// GET /api/users/notifications
// แจ้งเตือนสำหรับผู้ใช้ที่ login อยู่
// ─────────────────────────────────────────
exports.getUserNotifications = (req, res) => {
  const userId = req.user.id;
  db.query(
    `SELECT id, type, message, property_id, is_read, created_at
     FROM user_notifications
     WHERE user_id = ?
     ORDER BY created_at DESC LIMIT 30`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const unread = rows.filter(r => !r.is_read).length;
      res.json({ notifications: rows, unread_count: unread });
    }
  );
};

// ─────────────────────────────────────────
// POST /api/users/notifications/read
// มาร์ค notification ทั้งหมดว่าอ่านแล้ว
// ─────────────────────────────────────────
exports.markNotificationsRead = (req, res) => {
  db.query(
    'UPDATE user_notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
    [req.user.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'ok' });
    }
  );
};

// ─────────────────────────────────────────
// GET /api/users/notifications/stream  (SSE — ไม่ใช้ middleware เพราะ EventSource ไม่รองรับ custom headers)
// auth ผ่าน ?token=xxx query param
// ─────────────────────────────────────────
exports.streamNotifications = (req, res) => {
  // Verify token from query param (EventSource ไม่สามารถตั้ง headers ได้)
  const token = req.query.token;
  if (!token) return res.status(401).end();

  let userId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    userId = decoded.id;
  } catch (_) {
    return res.status(403).end();
  }

  sse.initSSE(res);
  sse.addUserClient(userId, res);
  const heartbeat = sse.startHeartbeat(res);

  // ส่ง unread count ทันทีที่เชื่อมต่อ
  db.query(
    'SELECT COUNT(*) AS unread FROM user_notifications WHERE user_id = ? AND is_read = 0',
    [userId],
    (err, rows) => {
      if (!err) {
        try {
          res.write(`event: init\ndata: ${JSON.stringify({ unread_count: rows[0]?.unread || 0 })}\n\n`);
        } catch (_) {}
      }
    }
  );

  req.on('close', () => {
    clearInterval(heartbeat);
    sse.removeUserClient(userId, res);
  });
};
