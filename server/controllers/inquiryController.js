const db  = require('../config/db');
const sse = require('../utils/sseManager');

// ==========================================
// 1. ส่ง Inquiry จากผู้สนใจ (Public — ไม่ต้อง login)
// POST /api/inquiries
// ==========================================
exports.createInquiry = (req, res) => {
    const { property_id, name, phone, email, message } = req.body;

    // Validation
    if (!property_id) return res.status(400).json({ error: 'กรุณาระบุรหัสทรัพย์สิน' });
    if (!name || name.trim().length < 2) return res.status(400).json({ error: 'กรุณาระบุชื่อของคุณ' });
    if (!phone || phone.replace(/\D/g, '').length < 9) return res.status(400).json({ error: 'กรุณาระบุเบอร์โทรศัพท์ที่ถูกต้อง' });

    // เช็คว่า property นั้นมีอยู่จริง
    db.query('SELECT id, title FROM properties WHERE id = ? AND is_active = 1', [property_id], (err, rows) => {
        if (err) {
            console.error('Inquiry property check error:', err);
            return res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
        }
        if (rows.length === 0) return res.status(404).json({ error: 'ไม่พบทรัพย์สินนี้' });

        const sql = `
            INSERT INTO property_inquiries
                (property_id, name, phone, email, message, status, created_at)
            VALUES (?, ?, ?, ?, ?, 'new', NOW())
        `;

        db.query(sql, [
            property_id,
            name.trim(),
            phone.trim(),
            email ? email.trim() : null,
            message ? message.trim() : null
        ], (err2, result) => {
            if (err2) {
                console.error('Create inquiry error:', err2);
                return res.status(500).json({ error: 'ไม่สามารถบันทึกข้อมูลได้' });
            }

            // แจ้ง admin แบบ real-time ว่ามี inquiry ใหม่
            sse.pushToAdmins('new_inquiry', {
                inquiryId:      result.insertId,
                name,
                property_title: rows[0].title,
                property_id,
            });

            res.status(201).json({
                message: 'ส่งข้อความติดต่อเรียบร้อยแล้ว ทีมงานจะติดต่อกลับโดยเร็ว',
                inquiryId: result.insertId
            });
        });
    });
};

// ==========================================
// 2. ดึง Inquiry ทั้งหมด (Admin เท่านั้น)
// GET /api/inquiries
// ==========================================
exports.getAllInquiries = (req, res) => {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const status = req.query.status || null;
    const search = req.query.search ? req.query.search.trim() : null;

    let where  = [];
    let params = [];
    if (status) { where.push('qi.status = ?'); params.push(status); }
    if (search) {
        where.push('(qi.name LIKE ? OR qi.phone LIKE ? OR qi.email LIKE ? OR qi.message LIKE ? OR p.title LIKE ?)');
        const like = `%${search}%`;
        params.push(like, like, like, like, like);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const sql = `
        SELECT
            qi.*,
            p.title AS property_title,
            p.province AS property_province,
            p.thumbnail_url AS property_thumbnail
        FROM property_inquiries qi
        LEFT JOIN properties p ON qi.property_id = p.id
        ${whereClause}
        ORDER BY qi.created_at DESC
        LIMIT ? OFFSET ?
    `;

    db.query(sql, [...params, limit, offset], (err, results) => {
        if (err) {
            console.error('Get inquiries error:', err);
            return res.status(500).json({ error: 'Server Error' });
        }
        res.json({ success: true, data: results });
    });
};

// ==========================================
// 5. แก้ไขข้อมูล Inquiry (Admin)
// PUT /api/inquiries/:id
// ==========================================
exports.updateInquiry = (req, res) => {
    const { id } = req.params;
    const { name, phone, email, message } = req.body;

    if (!name || name.trim().length < 2)
        return res.status(400).json({ error: 'กรุณาระบุชื่อ' });
    if (!phone || phone.replace(/\D/g, '').length < 9)
        return res.status(400).json({ error: 'กรุณาระบุเบอร์โทรที่ถูกต้อง' });

    db.query(
        `UPDATE property_inquiries
         SET name = ?, phone = ?, email = ?, message = ?
         WHERE id = ?`,
        [name.trim(), phone.trim(), email ? email.trim() : null, message ? message.trim() : null, id],
        (err, result) => {
            if (err) { console.error('Update inquiry error:', err); return res.status(500).json({ error: 'Server Error' }); }
            if (!result.affectedRows) return res.status(404).json({ error: 'ไม่พบข้อความ' });
            res.json({ message: 'แก้ไขสำเร็จ' });
        }
    );
};

// ==========================================
// 6. ลบ Inquiry (Admin)
// DELETE /api/inquiries/:id
// ==========================================
exports.deleteInquiry = (req, res) => {
    const { id } = req.params;
    db.query(
        'DELETE FROM property_inquiries WHERE id = ?',
        [id],
        (err, result) => {
            if (err) { console.error('Delete inquiry error:', err); return res.status(500).json({ error: 'Server Error' }); }
            if (!result.affectedRows) return res.status(404).json({ error: 'ไม่พบข้อความ' });
            res.json({ message: 'ลบสำเร็จ' });
        }
    );
};

// ==========================================
// 3. Timeline สำหรับ Chart (Admin)
// GET /api/inquiries/timeline?period=week|month|year
// ==========================================
exports.getTimeline = (req, res) => {
    const period = req.query.period || 'week';

    let sql;
    if (period === 'year') {
        sql = `
            SELECT DATE_FORMAT(created_at, '%Y-%m') AS label, COUNT(*) AS count
            FROM property_inquiries
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY label
        `;
    } else if (period === 'month') {
        sql = `
            SELECT DATE(created_at) AS label, COUNT(*) AS count
            FROM property_inquiries
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY label
        `;
    } else {
        // week (7 days)
        sql = `
            SELECT DATE(created_at) AS label, COUNT(*) AS count
            FROM property_inquiries
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY label
        `;
    }

    db.query(sql, [], (err, rows) => {
        if (err) {
            console.error('Timeline error:', err);
            return res.status(500).json({ error: 'Server Error' });
        }
        // label อาจเป็น Date object — แปลงเป็น string ก่อน
        const data = rows.map(r => ({ label: String(r.label).slice(0, 10), count: Number(r.count) }));
        res.json({ data, period });
    });
};

// ==========================================
// 4. อัพเดทสถานะ Inquiry (Admin)
// PUT /api/inquiries/:id/status
// ==========================================
exports.updateInquiryStatus = (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['new', 'contacted', 'closed'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'สถานะไม่ถูกต้อง' });
    }

    db.query(
        'UPDATE property_inquiries SET status = ? WHERE id = ?',
        [status, id],
        (err, result) => {
            if (err) {
                console.error('Update inquiry status error:', err);
                return res.status(500).json({ error: 'Server Error' });
            }
            if (result.affectedRows === 0) return res.status(404).json({ error: 'ไม่พบข้อมูล' });
            res.json({ message: 'อัพเดทสถานะสำเร็จ' });
        }
    );
};
