const db = require('../config/db');
const path = require('path');
const fs = require('fs');

const LOANDD_OWNER_ID = 3; // user cap0001 / loandd02@gmail.com

// ==========================================
// 1. ดึงทรัพย์ทั้งหมด (Admin view — รวม inactive)
// GET /api/admin/properties
// ==========================================
exports.getAllProperties = (req, res) => {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';

    let where = [];
    let params = [];

    if (search) {
        where.push('(p.title LIKE ? OR p.province LIKE ? OR p.district LIKE ?)');
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) { where.push('p.sale_status = ?'); params.push(status); }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const countSql = `SELECT COUNT(*) AS total FROM properties p ${whereClause}`;
    db.query(countSql, params, (err, countResult) => {
        if (err) return res.status(500).json({ error: err.message });
        const total = countResult[0].total;

        const sql = `
            SELECT p.id, p.title, p.property_type, p.listing_type,
                   p.price_requested, p.monthly_rent,
                   p.province, p.district,
                   p.thumbnail_url, p.is_featured, p.is_active,
                   p.sale_status, p.view_count,
                   p.created_at, p.updated_at,
                   p.created_by_admin, p.updated_by_admin,
                   (SELECT COUNT(*) FROM property_images pi WHERE pi.property_id = p.id) AS image_count,
                   (SELECT COUNT(*) FROM property_inquiries qi WHERE qi.property_id = p.id) AS inquiry_count
            FROM properties p
            ${whereClause}
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `;
        db.query(sql, [...params, limit, offset], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ data: results, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
        });
    });
};

// ==========================================
// 2. ดึงรายละเอียด (Admin)
// GET /api/admin/properties/:id
// ==========================================
exports.getPropertyById = (req, res) => {
    const { id } = req.params;
    const sql = `SELECT p.* FROM properties p WHERE p.id = ?`;
    db.query(sql, [id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!rows.length) return res.status(404).json({ error: 'ไม่พบทรัพย์สิน' });

        const property = rows[0];
        const imgSql     = 'SELECT * FROM property_images WHERE property_id = ? ORDER BY sort_order';
        const amenitySql = 'SELECT * FROM property_amenities WHERE property_id = ?';
        const nearbySql  = 'SELECT * FROM nearby_places WHERE property_id = ?';

        db.query(imgSql, [id], (e, images) => {
            if (e) return res.status(500).json({ error: e.message });
            db.query(amenitySql, [id], (e2, amenities) => {
                if (e2) return res.status(500).json({ error: e2.message });
                db.query(nearbySql, [id], (e3, nearby) => {
                    if (e3) return res.status(500).json({ error: e3.message });
                    res.json({ ...property, images, amenities, nearby_places: nearby });
                });
            });
        });
    });
};

// ==========================================
// 3. สร้างทรัพย์ใหม่
// POST /api/admin/properties
// ==========================================
exports.createProperty = (req, res) => {
    const {
        title, description, property_type, listing_type,
        price_requested, price_per_sqm, monthly_rent,
        original_price, is_discounted,
        bedrooms, bathrooms, floors, parking,
        usable_area, land_area_rai, land_area_ngan, land_area_wah,
        address, province, district, sub_district, postal_code,
        latitude, longitude, project_name,
        condition_status, year_built,
        property_condition, title_deed_type,
        bts_station, bts_distance_km,
        mrt_station, mrt_distance_km,
        video_url, pet_friendly, internal_notes,
        is_featured, is_active, sale_status,
        thumbnail_url
    } = req.body;

    if (!title || !property_type)
        return res.status(400).json({ error: 'กรุณาระบุชื่อและประเภททรัพย์สิน' });

    // audit: บันทึก username ของ admin ที่กำลัง action
    const adminUsername = req.admin?.username || req.admin?.display_name || 'admin';

    const sql = `
        INSERT INTO properties (
            owner_id, title, description, property_type, listing_type,
            price_requested, price_per_sqm, monthly_rent,
            original_price, is_discounted,
            bedrooms, bathrooms, floors, parking,
            usable_area, land_area_rai, land_area_ngan, land_area_wah,
            address, province, district, sub_district, postal_code,
            latitude, longitude, project_name,
            condition_status, year_built,
            property_condition, title_deed_type,
            bts_station, bts_distance_km,
            mrt_station, mrt_distance_km,
            video_url, pet_friendly, internal_notes,
            is_featured, is_active, sale_status,
            thumbnail_url, view_count,
            created_by_admin, updated_by_admin,
            created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?,
            ?, ?,
            ?, ?,
            ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            ?, 0,
            ?, ?,
            NOW(), NOW()
        )
    `;
    const params = [
        LOANDD_OWNER_ID, title || '', description || null,
        property_type || 'house', listing_type || 'sale',
        price_requested || null, price_per_sqm || null, monthly_rent || null,
        original_price || null, is_discounted ? 1 : 0,
        bedrooms || 0, bathrooms || 0, floors || 1, parking || 0,
        usable_area || null, land_area_rai || 0, land_area_ngan || 0, land_area_wah || 0,
        address || null, province || null, district || null,
        sub_district || null, postal_code || null,
        latitude || null, longitude || null, project_name || null,
        condition_status || 'unfurnished', year_built || null,
        property_condition || 'good', title_deed_type || null,
        bts_station || null, bts_distance_km || null,
        mrt_station || null, mrt_distance_km || null,
        video_url || null, pet_friendly ? 1 : 0, internal_notes || null,
        is_featured ? 1 : 0, is_active !== false ? 1 : 0,
        sale_status || 'available',
        thumbnail_url || null,
        adminUsername, adminUsername,
    ];

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'เพิ่มทรัพย์สำเร็จ', propertyId: result.insertId });
    });
};

// ==========================================
// 4. อัพเดทข้อมูลทรัพย์
// PUT /api/admin/properties/:id
// ==========================================
exports.updateProperty = (req, res) => {
    const { id } = req.params;
    const allowed = [
        'title','description','property_type','listing_type',
        'price_requested','price_per_sqm','monthly_rent',
        'original_price','is_discounted',
        'bedrooms','bathrooms','floors','parking',
        'usable_area','land_area_rai','land_area_ngan','land_area_wah',
        'address','province','district','sub_district','postal_code',
        'latitude','longitude','project_name',
        'condition_status','year_built',
        'property_condition','title_deed_type',
        'bts_station','bts_distance_km',
        'mrt_station','mrt_distance_km',
        'video_url','pet_friendly','internal_notes',
        'is_featured','is_active','sale_status','thumbnail_url'
    ];

    const fields = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) fields[k] = req.body[k]; });

    if (!Object.keys(fields).length)
        return res.status(400).json({ error: 'ไม่มีข้อมูลที่จะอัพเดท' });

    // audit trail
    fields.updated_by_admin = req.admin?.username || req.admin?.display_name || 'admin';
    fields.updated_at = new Date();
    const keys = Object.keys(fields);
    const setClause = keys.map(k => `${k} = ?`).join(', ');

    db.query(
        `UPDATE properties SET ${setClause} WHERE id = ?`,
        [...Object.values(fields), id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!result.affectedRows) return res.status(404).json({ error: 'ไม่พบทรัพย์สิน' });

            // แจ้งเตือน users ที่ save ทรัพย์นี้ถ้า sale_status เปลี่ยนเป็น sold/reserved
            if (fields.sale_status === 'sold' || fields.sale_status === 'reserved') {
                const notifType = fields.sale_status === 'sold' ? 'property_sold' : 'property_rented';
                db.query('SELECT title FROM properties WHERE id = ?', [id], (e, propRows) => {
                    if (e || !propRows.length) return;
                    const title = propRows[0].title || 'ทรัพย์สิน';
                    const msg = fields.sale_status === 'sold'
                        ? `ทรัพย์สินที่คุณบันทึกไว้ "${title}" ถูกขายแล้ว`
                        : `ทรัพย์สินที่คุณบันทึกไว้ "${title}" ถูกจอง/เช่าแล้ว`;
                    db.query(
                        `SELECT DISTINCT user_id FROM property_favorites WHERE property_id = ?`,
                        [id],
                        (e2, favRows) => {
                            if (e2 || !favRows.length) return;
                            favRows.forEach(fav => {
                                db.query(
                                    'INSERT INTO user_notifications (user_id, type, message, property_id) VALUES (?, ?, ?, ?)',
                                    [fav.user_id, notifType, msg, id]
                                );
                            });
                        }
                    );
                });
            }

            res.json({ message: 'อัพเดทสำเร็จ' });
        }
    );
};

// ==========================================
// 5. ลบทรัพย์
// DELETE /api/admin/properties/:id
// ==========================================
exports.deleteProperty = (req, res) => {
    const { id } = req.params;

    // ลบรูปจากดิสก์ก่อน
    db.query('SELECT thumbnail_url FROM properties WHERE id = ?', [id], (err, rows) => {
        if (!err && rows.length && rows[0].thumbnail_url) {
            const filePath = path.join(__dirname, '..', rows[0].thumbnail_url.replace(/^\//, ''));
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        db.query('DELETE FROM property_images WHERE property_id = ?', [id]);
        db.query('DELETE FROM properties WHERE id = ?', [id], (err2, result) => {
            if (err2) return res.status(500).json({ error: err2.message });
            if (!result.affectedRows) return res.status(404).json({ error: 'ไม่พบทรัพย์สิน' });
            res.json({ message: 'ลบทรัพย์สำเร็จ' });
        });
    });
};

// ==========================================
// 6. Upload รูปภาพ (thumbnail หรือ gallery)
// POST /api/admin/upload
// ==========================================
exports.uploadImage = (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'ไม่พบไฟล์รูปภาพ' });
    const url = `/uploads/properties/${req.file.filename}`;
    res.json({ url, filename: req.file.filename });
};

// ==========================================
// 7. เพิ่มรูปภาพเข้า Gallery
// POST /api/admin/properties/:id/images
// ==========================================
exports.addImage = (req, res) => {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'ไม่พบไฟล์รูปภาพ' });

    const url = `/uploads/properties/${req.file.filename}`;
    const caption = req.body.caption || '';

    db.query(
        'SELECT IFNULL(MAX(sort_order),0)+1 AS next_order FROM property_images WHERE property_id = ?',
        [id],
        (err, rows) => {
            const nextOrder = rows?.[0]?.next_order || 1;
            db.query(
                'INSERT INTO property_images (property_id, image_url, caption, sort_order) VALUES (?, ?, ?, ?)',
                [id, url, caption, nextOrder],
                (err2, result) => {
                    if (err2) return res.status(500).json({ error: err2.message });
                    res.status(201).json({ message: 'เพิ่มรูปสำเร็จ', imageId: result.insertId, url });
                }
            );
        }
    );
};

// ==========================================
// 8. ลบรูปภาพจาก Gallery
// DELETE /api/admin/properties/:id/images/:img_id
// ==========================================
exports.deleteImage = (req, res) => {
    const { img_id } = req.params;
    db.query('SELECT image_url FROM property_images WHERE id = ?', [img_id], (err, rows) => {
        if (!err && rows.length) {
            const filePath = path.join(__dirname, '..', rows[0].image_url.replace(/^\//, ''));
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        db.query('DELETE FROM property_images WHERE id = ?', [img_id], (err2, result) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ message: 'ลบรูปสำเร็จ' });
        });
    });
};

// ==========================================
// 9. เพิ่ม Amenity
// POST /api/admin/properties/:id/amenities
// ==========================================
exports.addAmenity = (req, res) => {
    const { id } = req.params;
    const { amenity_name, amenity_icon } = req.body;
    if (!amenity_name) return res.status(400).json({ error: 'กรุณาระบุชื่อสิ่งอำนวยความสะดวก' });

    db.query(
        'INSERT INTO property_amenities (property_id, amenity_name, amenity_icon) VALUES (?, ?, ?)',
        [id, amenity_name, amenity_icon || null],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: 'เพิ่มสำเร็จ', id: result.insertId });
        }
    );
};

// ==========================================
// 10. ลบ Amenity
// DELETE /api/admin/properties/:id/amenities/:amenity_id
// ==========================================
exports.deleteAmenity = (req, res) => {
    const { amenity_id } = req.params;
    db.query('DELETE FROM property_amenities WHERE id = ?', [amenity_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'ลบสำเร็จ' });
    });
};

// ==========================================
// 11. เพิ่ม Nearby Place
// POST /api/admin/properties/:id/nearby
// ==========================================
exports.addNearby = (req, res) => {
    const { id } = req.params;
    const { place_type, place_name, distance_km, travel_time_min } = req.body;
    if (!place_name || !place_type) return res.status(400).json({ error: 'กรุณาระบุประเภทและชื่อสถานที่' });

    db.query(
        'INSERT INTO nearby_places (property_id, place_type, place_name, distance_km, travel_time_min) VALUES (?, ?, ?, ?, ?)',
        [id, place_type, place_name, distance_km || null, travel_time_min || null],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: 'เพิ่มสำเร็จ', id: result.insertId });
        }
    );
};

// ==========================================
// 12. ลบ Nearby Place
// DELETE /api/admin/properties/:id/nearby/:nearby_id
// ==========================================
exports.deleteNearby = (req, res) => {
    const { nearby_id } = req.params;
    db.query('DELETE FROM nearby_places WHERE id = ?', [nearby_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'ลบสำเร็จ' });
    });
};

// ==========================================
// 13. อัพโหลดรูปโฉนด (Admin Only — ไม่แสดงสาธารณะ)
// POST /api/admin/properties/:id/deed
// ==========================================
exports.uploadDeedImage = (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'ไม่พบไฟล์รูปภาพ' });
    const { id } = req.params;
    const url = `/uploads/deeds/${req.file.filename}`;

    // ดึง path เดิมก่อน เพื่อลบไฟล์เก่า (ถ้ามี)
    db.query('SELECT deed_image_url FROM properties WHERE id = ?', [id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!rows.length) return res.status(404).json({ error: 'ไม่พบทรัพย์สิน' });

        // ลบไฟล์เก่า
        const oldUrl = rows[0].deed_image_url;
        if (oldUrl) {
            const oldPath = path.join(__dirname, '..', oldUrl);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        db.query(
            'UPDATE properties SET deed_image_url = ?, updated_at = NOW() WHERE id = ?',
            [url, id],
            (err2) => {
                if (err2) return res.status(500).json({ error: err2.message });
                res.json({ success: true, deed_image_url: url });
            }
        );
    });
};

// ==========================================
// 14. ลบรูปโฉนด
// DELETE /api/admin/properties/:id/deed
// ==========================================
exports.deleteDeedImage = (req, res) => {
    const { id } = req.params;
    db.query('SELECT deed_image_url FROM properties WHERE id = ?', [id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!rows.length) return res.status(404).json({ error: 'ไม่พบทรัพย์สิน' });

        const oldUrl = rows[0].deed_image_url;
        if (oldUrl) {
            const oldPath = path.join(__dirname, '..', oldUrl);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        db.query(
            'UPDATE properties SET deed_image_url = NULL, updated_at = NOW() WHERE id = ?',
            [id],
            (err2) => {
                if (err2) return res.status(500).json({ error: err2.message });
                res.json({ success: true, message: 'ลบรูปโฉนดสำเร็จ' });
            }
        );
    });
};

// ==========================================
// 15. ดึงรายการโฉนดทั้งหมดของทรัพย์
// GET /api/admin/properties/:id/deeds
// ==========================================
exports.listDeeds = (req, res) => {
    const { id } = req.params;
    db.query(
        'SELECT id, property_id, deed_image_url, sort_order, created_at FROM property_deeds WHERE property_id = ? ORDER BY sort_order ASC, created_at ASC',
        [id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
};

// ==========================================
// 16. อัพโหลดรูปโฉนดเพิ่ม (หลายรูป)
// POST /api/admin/properties/:id/deeds
// ==========================================
exports.addDeed = (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'ไม่พบไฟล์รูปภาพ' });
    const { id } = req.params;
    const url = `/uploads/deeds/${req.file.filename}`;

    db.query(
        'SELECT COUNT(*) AS cnt FROM property_deeds WHERE property_id = ?',
        [id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            const sortOrder = rows[0]?.cnt || 0;
            db.query(
                'INSERT INTO property_deeds (property_id, deed_image_url, sort_order) VALUES (?, ?, ?)',
                [id, url, sortOrder],
                (err2, result) => {
                    if (err2) return res.status(500).json({ error: err2.message });
                    res.json({ success: true, deed: { id: result.insertId, property_id: Number(id), deed_image_url: url, sort_order: sortOrder } });
                }
            );
        }
    );
};

// ==========================================
// 17. ลบรูปโฉนดรายการเดียว
// DELETE /api/admin/properties/:id/deeds/:deedId
// ==========================================
exports.deleteDeed = (req, res) => {
    const { id, deedId } = req.params;
    db.query(
        'SELECT deed_image_url FROM property_deeds WHERE id = ? AND property_id = ?',
        [deedId, id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!rows.length) return res.status(404).json({ error: 'ไม่พบรูปโฉนด' });
            const oldPath = path.join(__dirname, '..', rows[0].deed_image_url);
            if (fs.existsSync(oldPath)) {
                try { fs.unlinkSync(oldPath); } catch (_) {}
            }
            db.query('DELETE FROM property_deeds WHERE id = ?', [deedId], (err2) => {
                if (err2) return res.status(500).json({ error: err2.message });
                res.json({ success: true, message: 'ลบรูปโฉนดสำเร็จ' });
            });
        }
    );
};
