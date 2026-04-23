const db     = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { ADMIN_JWT_SECRET } = require('../middleware/verifyAdmin');
const sse    = require('../utils/sseManager');

// ─────────────────────────────────────────
// GET /api/admin/users
// ─────────────────────────────────────────
exports.getAllUsers = (req, res) => {
  const sql = `
    SELECT u.id, u.username, u.full_name, u.email, u.phone,
           u.role, u.status, u.created_at,
           COUNT(DISTINCT pf.property_id) AS saved_count,
           SUM(CASE WHEN pcr.status = 'pending' THEN 1 ELSE 0 END) AS pending_pw_requests
    FROM users u
    LEFT JOIN property_favorites pf ON pf.user_id = u.id
    LEFT JOIN password_change_requests pcr ON pcr.user_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// ─────────────────────────────────────────
// PUT /api/admin/users/:id
// แก้ไขข้อมูล user
// ─────────────────────────────────────────
exports.updateUser = (req, res) => {
  const { id } = req.params;
  const { username, full_name, phone, role, status } = req.body;

  if (!username?.trim())
    return res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้' });

  // เช็คซ้ำ username + phone (ยกเว้นตัวเอง)
  const checkDup = (field, value) => new Promise((resolve, reject) => {
    if (!value || !value.trim()) return resolve(null);
    db.query(
      `SELECT id FROM users WHERE ${field} = ? AND id != ?`,
      [value, id],
      (err, rows) => err ? reject(err) : resolve(rows.length > 0 ? field : null)
    );
  });

  Promise.all([checkDup('username', username), checkDup('phone', phone)])
    .then(([dupU, dupP]) => {
      if (dupU) return res.status(400).json({ error: 'ชื่อผู้ใช้นี้ถูกใช้โดยบัญชีอื่นแล้ว' });
      if (dupP) return res.status(400).json({ error: 'เบอร์โทรนี้ถูกใช้โดยบัญชีอื่นแล้ว' });

      db.query(
        `UPDATE users SET username = ?, full_name = ?, phone = ?,
         role = COALESCE(?, role), status = COALESCE(?, status) WHERE id = ?`,
        [username.trim(), full_name?.trim() || null, phone?.trim() || null, role || null, status || null, id],
        (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          if (!result.affectedRows) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
          res.json({ message: 'อัปเดตผู้ใช้สำเร็จ' });
        }
      );
    })
    .catch(err => res.status(500).json({ error: err.message }));
};

// ─────────────────────────────────────────
// PUT /api/admin/users/:id/password
// แอดมินเปลี่ยนรหัสผ่านให้ user
// ─────────────────────────────────────────
exports.changeUserPassword = (req, res) => {
  const { id } = req.params;
  const { newPassword, requestId, note } = req.body;

  if (!newPassword || newPassword.length < 6)
    return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });

  bcrypt.hash(newPassword, 10, (err, hash) => {
    if (err) return res.status(500).json({ error: err.message });

    db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!result.affectedRows) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });

      // approve คำขอถ้ามี requestId
      if (requestId) {
        db.query(
          "UPDATE password_change_requests SET status = 'approved', note = ?, resolved_at = NOW() WHERE id = ?",
          [note || 'แอดมินเปลี่ยนรหัสให้แล้ว', requestId]
        );
      }
      res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
    });
  });
};

// ─────────────────────────────────────────
// DELETE /api/admin/users/:id
// ─────────────────────────────────────────
exports.deleteUser = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM users WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!result.affectedRows) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    res.json({ message: 'ลบผู้ใช้สำเร็จ' });
  });
};

// ─────────────────────────────────────────
// GET /api/admin/password-requests
// ─────────────────────────────────────────
exports.getPasswordRequests = (req, res) => {
  db.query(
    `SELECT pcr.id, pcr.status, pcr.note, pcr.requested_at, pcr.resolved_at,
            (pcr.new_password_hash IS NOT NULL) AS has_new_password,
            pcr.new_password_plain,
            u.id AS user_id, u.username, u.email, u.phone
     FROM password_change_requests pcr
     JOIN users u ON pcr.user_id = u.id
     ORDER BY FIELD(pcr.status,'pending','approved','rejected'), pcr.requested_at DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

// ─────────────────────────────────────────
// PUT /api/admin/password-requests/:id/reject
// ─────────────────────────────────────────
exports.rejectPasswordRequest = (req, res) => {
  const { id } = req.params;
  const { note } = req.body;

  db.query(
    "UPDATE password_change_requests SET status='rejected', note=?, resolved_at=NOW() WHERE id=?",
    [note || 'ไม่ผ่านการอนุมัติ', id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!result.affectedRows) return res.status(404).json({ error: 'ไม่พบคำขอ' });
      res.json({ message: 'ปฏิเสธคำขอแล้ว' });
    }
  );
};

// ─────────────────────────────────────────
// PUT /api/admin/password-requests/:id/approve
// อนุมัติคำขอ → รหัสผ่านเปลี่ยนอัตโนมัติจาก new_password_hash
// ─────────────────────────────────────────
exports.approvePasswordRequest = (req, res) => {
  const { id } = req.params;

  db.query(
    'SELECT id, user_id, new_password_hash, status FROM password_change_requests WHERE id = ?',
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows.length) return res.status(404).json({ error: 'ไม่พบคำขอ' });

      const pwReq = rows[0];
      if (pwReq.status !== 'pending')
        return res.status(400).json({ error: 'คำขอนี้ดำเนินการไปแล้ว' });
      if (!pwReq.new_password_hash)
        return res.status(400).json({ error: 'ไม่พบรหัสผ่านใหม่ — ใช้ปุ่ม "เปลี่ยนรหัส" แทน' });

      db.query(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [pwReq.new_password_hash, pwReq.user_id],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          db.query(
            "UPDATE password_change_requests SET status='approved', note='รหัสผ่านเปลี่ยนแล้วตามที่ขอ', resolved_at=NOW() WHERE id=?",
            [id],
            (err3) => {
              if (err3) return res.status(500).json({ error: err3.message });
              // สร้าง notification ให้ user + push real-time
              db.query(
                "INSERT INTO user_notifications (user_id, type, message) VALUES (?, 'password_approved', 'แอดมินอนุมัติการเปลี่ยนรหัสผ่านของคุณแล้ว สามารถใช้รหัสใหม่ได้เลย')",
                [pwReq.user_id]
              );
              sse.pushToUser(pwReq.user_id, 'notification', {
                type: 'password_approved',
                message: 'แอดมินอนุมัติการเปลี่ยนรหัสผ่านของคุณแล้ว สามารถใช้รหัสใหม่ได้เลย',
                unread_delta: 1,
              });
              res.json({ message: 'อนุมัติสำเร็จ รหัสผ่านของผู้ใช้เปลี่ยนแล้ว' });
            }
          );
        }
      );
    }
  );
};

// ─────────────────────────────────────────
// GET /api/admin/notifications
// สรุป notification สำหรับ bell icon
// ─────────────────────────────────────────
exports.getNotifications = (req, res) => {
  const since = req.query.since || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const pendingPw = new Promise((resolve, reject) => {
    db.query(
      `SELECT 'password_request' AS type, pcr.id, pcr.requested_at AS created_at,
              u.username, u.email, NULL AS property_title, NULL AS property_id
       FROM password_change_requests pcr
       JOIN users u ON pcr.user_id = u.id
       WHERE pcr.status = 'pending'
       ORDER BY pcr.requested_at DESC LIMIT 20`,
      (err, rows) => err ? reject(err) : resolve(rows)
    );
  });

  const newInquiries = new Promise((resolve, reject) => {
    db.query(
      `SELECT 'inquiry' AS type, qi.id, qi.created_at,
              qi.name AS customer_name, qi.phone, qi.email, qi.message, qi.status AS inq_status,
              p.title AS property_title, p.id AS property_id, p.province AS property_province
       FROM property_inquiries qi
       JOIN properties p ON qi.property_id = p.id
       WHERE qi.status = 'new' AND qi.created_at >= ?
       ORDER BY qi.created_at DESC LIMIT 30`,
      [since],
      (err, rows) => err ? reject(err) : resolve(rows)
    );
  });

  Promise.all([pendingPw, newInquiries])
    .then(([pwReqs, inquiries]) => {
      res.json({
        password_requests: pwReqs,
        inquiries,
        counts: {
          pending_password: pwReqs.length,
          new_inquiries:    inquiries.length,
          total:            pwReqs.length + inquiries.length,
        },
      });
    })
    .catch(err => res.status(500).json({ error: err.message }));
};

// ─────────────────────────────────────────
// GET /api/admin/settings/auto-approve
// ─────────────────────────────────────────
exports.getAutoApprove = (req, res) => {
  db.query("SELECT value FROM admin_settings WHERE key_name='auto_approve_password'", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const value = rows?.[0]?.value ?? '0';
    res.json({ value });   // ส่งกลับ { value: '0' } หรือ { value: '1' }
  });
};

// ─────────────────────────────────────────
// GET /api/admin/notifications/stream  (SSE)
// auth ผ่าน ?token=xxx (EventSource ไม่รองรับ custom headers)
// ─────────────────────────────────────────
exports.streamAdminNotifications = (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).end();

  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    if (!decoded.isAdmin) return res.status(403).end();
  } catch (_) {
    return res.status(403).end();
  }

  sse.initSSE(res);
  sse.addAdminClient(res);
  const heartbeat = sse.startHeartbeat(res);

  // ส่ง pending count ทันทีที่เชื่อมต่อ
  db.query(
    "SELECT COUNT(*) AS cnt FROM password_change_requests WHERE status = 'pending'",
    [],
    (err, rows) => {
      if (!err) {
        try {
          res.write(`event: init\ndata: ${JSON.stringify({ pending_password: rows[0]?.cnt || 0 })}\n\n`);
        } catch (_) {}
      }
    }
  );

  req.on('close', () => {
    clearInterval(heartbeat);
    sse.removeAdminClient(res);
  });
};

// ─────────────────────────────────────────
// PUT /api/admin/settings/auto-approve
// body: { value: '1' | '0' }  (หรือ enabled: bool ก็ได้)
// ─────────────────────────────────────────
exports.setAutoApprove = (req, res) => {
  // รับได้ทั้ง { value: '1' } และ { enabled: true }
  let val;
  if (req.body.value !== undefined) {
    val = (req.body.value === '1' || req.body.value === 1 || req.body.value === true) ? '1' : '0';
  } else {
    val = req.body.enabled ? '1' : '0';
  }
  db.query(
    "INSERT INTO admin_settings (key_name, value, updated_at) VALUES ('auto_approve_password', ?, NOW()) ON DUPLICATE KEY UPDATE value=?, updated_at=NOW()",
    [val, val],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'บันทึกการตั้งค่าสำเร็จ', value: val });
    }
  );
};

// ==========================================
// Admin Users Management (admin_users table)
// ==========================================

// GET /api/admin/admins — ดึง admin users ทั้งหมด
exports.getAllAdminUsers = (req, res) => {
    const sql = `SELECT id, username, full_name, display_name, email, phone, department, is_active, created_at
                 FROM admin_users ORDER BY created_at DESC`;
    db.query(sql, (err, rows) => {
        if (err) { console.error(err); return res.status(500).json({ error: 'Server Error' }); }
        res.json({ data: rows });
    });
};

// PUT /api/admin/admins/:id — แก้ไข admin user
exports.updateAdminUser = (req, res) => {
    const { id } = req.params;
    const { username, full_name, display_name, email, phone, is_active } = req.body;

    // ห้ามแก้ตัวเอง
    if (String(req.admin?.id) === String(id)) {
        return res.status(400).json({ error: 'ไม่สามารถแก้ไขบัญชีของตัวเองได้' });
    }

    const sql = `UPDATE admin_users SET username=?, full_name=?, display_name=?, email=?, phone=?, is_active=?
                 WHERE id=?`;
    db.query(sql, [username, full_name, display_name || null, email, phone || null,
                   is_active !== undefined ? is_active : 1, id], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Username หรือ Email ซ้ำ' });
            console.error(err); return res.status(500).json({ error: 'Server Error' });
        }
        if (result.affectedRows === 0) return res.status(404).json({ error: 'ไม่พบแอดมิน' });
        res.json({ message: 'แก้ไขสำเร็จ' });
    });
};

// DELETE /api/admin/admins/:id — ลบ admin user
exports.deleteAdminUser = (req, res) => {
    const { id } = req.params;

    // ห้ามลบตัวเอง
    if (String(req.admin?.id) === String(id)) {
        return res.status(400).json({ error: 'ไม่สามารถลบบัญชีของตัวเองได้' });
    }

    db.query('DELETE FROM admin_users WHERE id = ?', [id], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ error: 'Server Error' }); }
        if (result.affectedRows === 0) return res.status(404).json({ error: 'ไม่พบแอดมิน' });
        res.json({ message: 'ลบสำเร็จ' });
    });
};

// POST /api/admin/admins — สร้าง admin user ใหม่
exports.createAdminUser = (req, res) => {
    const { username, password, email, full_name, display_name, phone, department } = req.body;
    if (!username?.trim() || !password || !email?.trim()) {
        return res.status(400).json({ error: 'กรุณากรอก username, password และ email' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
    }
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.status(500).json({ error: 'Server Error' });
        const sql = `INSERT INTO admin_users (username, password_hash, email, full_name, display_name, phone, department, is_active, created_at)
                     VALUES (?,?,?,?,?,?,?,1,NOW())`;
        db.query(sql,
            [username.trim(), hash, email.trim(), full_name||null, display_name||null, phone||null, department||'property_manager'],
            (err2, result) => {
                if (err2) {
                    if (err2.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Username หรือ Email ซ้ำในระบบแล้ว' });
                    console.error(err2); return res.status(500).json({ error: 'Server Error' });
                }
                res.status(201).json({ message: 'สร้างแอดมินสำเร็จ', id: result.insertId });
            }
        );
    });
};

// PUT /api/admin/admins/:id/password — เปลี่ยนรหัสผ่าน admin
exports.changeAdminPassword = (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
    }
    bcrypt.hash(newPassword, 10, (err, hash) => {
        if (err) return res.status(500).json({ error: 'Server Error' });
        db.query('UPDATE admin_users SET password_hash=? WHERE id=?', [hash, id], (err2, result) => {
            if (err2) { console.error(err2); return res.status(500).json({ error: 'Server Error' }); }
            if (result.affectedRows === 0) return res.status(404).json({ error: 'ไม่พบแอดมิน' });
            res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
        });
    });
};
