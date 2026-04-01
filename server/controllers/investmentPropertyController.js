const db = require('../config/db');

// ==========================================
// สร้างประกาศทรัพย์สิน (จากฟอร์ม ListProperty)
// POST /api/investment-properties/create
// ==========================================
exports.create = (req, res) => {
    const userId = req.user.id;
    const {
        transaction_type, property_type, area_size, area_unit,
        province, district,
        purchase_price, loan_amount, existing_debt,
        phone, line_id, note
    } = req.body;

    // Validation
    if (!transaction_type || !property_type || !area_size || !province) {
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลทรัพย์สินให้ครบ' });
    }
    if (!purchase_price || !loan_amount || !phone) {
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลการเงินและเบอร์โทรศัพท์' });
    }

    const sql = `
        INSERT INTO investment_properties (
            user_id, transaction_type, property_type, area_size, area_unit,
            province, district,
            purchase_price, loan_amount, existing_debt,
            phone, line_id, note,
            status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
    `;

    const params = [
        userId, transaction_type, property_type,
        parseFloat(area_size) || 0, area_unit || 'sqw',
        province, district || null,
        parseFloat(purchase_price) || 0, parseFloat(loan_amount) || 0,
        parseFloat(existing_debt) || 0,
        phone, line_id || null, note || null
    ];

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error('Create investment property error:', err);
            return res.status(500).json({ error: 'ไม่สามารถบันทึกข้อมูลได้' });
        }

        res.status(201).json({
            message: 'ส่งข้อมูลทรัพย์สินเรียบร้อยแล้ว',
            id: result.insertId
        });
    });
};

// ==========================================
// ดึงรายการทรัพย์สินที่ลงประกาศทั้งหมด (Admin)
// GET /api/investment-properties
// ==========================================
exports.getAll = (req, res) => {
    const sql = `
        SELECT ip.*, u.username, u.phone AS user_phone, u.email AS user_email
        FROM investment_properties ip
        LEFT JOIN users u ON ip.user_id = u.id
        ORDER BY ip.created_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Get investment properties error:', err);
            return res.status(500).json({ error: 'Server Error' });
        }
        res.json({ success: true, data: results });
    });
};

// ==========================================
// ดึงรายการของ user คนเดียว
// GET /api/investment-properties/my
// ==========================================
exports.getMyProperties = (req, res) => {
    const userId = req.user.id;

    const sql = `
        SELECT * FROM investment_properties
        WHERE user_id = ?
        ORDER BY created_at DESC
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Get my investment properties error:', err);
            return res.status(500).json({ error: 'Server Error' });
        }
        res.json({ success: true, data: results });
    });
};

// ==========================================
// อัพเดทสถานะ (Admin)
// PUT /api/investment-properties/:id/status
// ==========================================
exports.updateStatus = (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'reviewing', 'approved', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'สถานะไม่ถูกต้อง' });
    }

    db.query(
        'UPDATE investment_properties SET status = ?, updated_at = NOW() WHERE id = ?',
        [status, id],
        (err, result) => {
            if (err) {
                console.error('Update status error:', err);
                return res.status(500).json({ error: 'Server Error' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'ไม่พบข้อมูล' });
            }
            res.json({ message: 'อัพเดทสถานะสำเร็จ' });
        }
    );
};
