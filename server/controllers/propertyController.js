const db = require('../config/db');

// ==========================================
// 1. ดึงรายการทรัพย์สินทั้งหมด (พร้อม pagination + filter)
// GET /api/properties
// ==========================================
exports.getAllProperties = (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    const { property_type, listing_type, province, min_price, max_price, bedrooms, search, bts_station } = req.query;

    let where = ['p.is_active = 1'];
    let params = [];

    if (property_type) { where.push('p.property_type = ?'); params.push(property_type); }
    if (listing_type) { where.push('p.listing_type = ?'); params.push(listing_type); }
    if (province) { where.push('p.province = ?'); params.push(province); }
    if (min_price) { where.push('p.price_requested >= ?'); params.push(min_price); }
    if (max_price) { where.push('p.price_requested <= ?'); params.push(max_price); }
    if (bedrooms) { where.push('p.bedrooms >= ?'); params.push(bedrooms); }
    if (search) { where.push('(p.title LIKE ? OR p.address LIKE ? OR p.project_name LIKE ? OR p.province LIKE ? OR p.district LIKE ? OR p.sub_district LIKE ? OR p.bts_station LIKE ? OR p.mrt_station LIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`); }
    if (bts_station) { where.push('(p.bts_station LIKE ? OR p.mrt_station LIKE ?)'); params.push(`%${bts_station}%`, `%${bts_station}%`); }

    const whereClause = where.join(' AND ');

    const countSql = `SELECT COUNT(*) AS total FROM properties p WHERE ${whereClause}`;

    db.query(countSql, params, (err, countResult) => {
        if (err) return res.status(500).json({ message: "Server error", error: err });

        const total = countResult[0].total;

        const sql = `
            SELECT
                p.id, p.title, p.property_type, p.listing_type,
                p.price_requested, p.original_price, p.price_per_sqm, p.monthly_rent,
                p.bedrooms, p.bathrooms, p.usable_area,
                p.land_area_rai, p.land_area_ngan, p.land_area_wah,
                p.province, p.district, p.sub_district,
                p.thumbnail_url, p.is_featured, p.view_count,
                p.sale_status, p.condition_status,
                p.bts_station, p.bts_distance_km,
                p.mrt_station, p.mrt_distance_km,
                p.latitude, p.longitude,
                p.created_at, p.updated_at,
                u.display_name AS poster_name,
                u.avatar_url AS poster_avatar,
                u.role AS poster_role,
                pv.slug AS province_slug,
                pv.region AS province_region,
                (SELECT COUNT(*) FROM property_images WHERE property_id = p.id) AS image_count
            FROM properties p
            LEFT JOIN users u ON p.owner_id = u.id
            LEFT JOIN (SELECT name, MIN(slug) AS slug, MIN(region) AS region FROM provinces GROUP BY name) pv ON p.province = pv.name
            WHERE ${whereClause}
            GROUP BY p.id
            ORDER BY p.is_featured DESC, p.created_at DESC
            LIMIT ? OFFSET ?
        `;

        db.query(sql, [...params, limit, offset], (err, results) => {
            if (err) return res.status(500).json({ message: "Server error", error: err });

            res.status(200).json({
                data: results,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        });
    });
};

// ==========================================
// 2. ดึงรายละเอียดทรัพย์สินตาม ID (พร้อม images, amenities, nearby)
// GET /api/properties/:id
// ==========================================
exports.getPropertyById = (req, res) => {
    const { id } = req.params;

    db.query('UPDATE properties SET view_count = view_count + 1 WHERE id = ?', [id]);

    const propertySql = `
        SELECT p.*,
            u.display_name AS poster_name,
            u.avatar_url AS poster_avatar,
            u.phone AS poster_phone,
            u.line_id AS poster_line,
            u.company_name AS poster_company,
            u.role AS poster_role,
            pv.slug AS province_slug,
            pv.region AS province_region
        FROM properties p
        LEFT JOIN users u ON p.owner_id = u.id
        LEFT JOIN provinces pv ON p.province = pv.name
        WHERE p.id = ?
    `;

    db.query(propertySql, [id], (err, propertyResult) => {
        if (err) return res.status(500).json({ message: "Server error", error: err });
        if (propertyResult.length === 0) return res.status(404).json({ message: "Property not found" });

        const property = propertyResult[0];
        // ซ่อนข้อมูล admin-only จาก public API
        delete property.deed_image_url;
        delete property.internal_notes;

        const imagesSql = 'SELECT * FROM property_images WHERE property_id = ? ORDER BY sort_order';
        const amenitiesSql = 'SELECT * FROM property_amenities WHERE property_id = ?';
        const nearbySql = 'SELECT * FROM nearby_places WHERE property_id = ?';

        db.query(imagesSql, [id], (err, images) => {
            if (err) return res.status(500).json({ message: "Server error", error: err });

            db.query(amenitiesSql, [id], (err, amenities) => {
                if (err) return res.status(500).json({ message: "Server error", error: err });

                db.query(nearbySql, [id], (err, nearbyPlaces) => {
                    if (err) return res.status(500).json({ message: "Server error", error: err });

                    res.status(200).json({
                        ...property,
                        images,
                        amenities,
                        nearby_places: nearbyPlaces
                    });
                });
            });
        });
    });
};

// ==========================================
// 3. ดึงทรัพย์สินแนะนำ (Featured)
// GET /api/properties/featured
// ==========================================
exports.getFeaturedProperties = (req, res) => {
    const sql = `
        SELECT p.id, p.title, p.property_type, p.listing_type,
            p.price_requested, p.original_price, p.monthly_rent, p.bedrooms, p.bathrooms, p.usable_area,
            p.land_area_rai, p.land_area_ngan, p.land_area_wah,
            p.province, p.district, p.thumbnail_url, p.is_featured,
            p.sale_status, p.condition_status, p.bts_station, p.bts_distance_km, p.mrt_station, p.mrt_distance_km,
            p.updated_at,
            pv.slug AS province_slug,
            pv.region AS province_region,
            (SELECT COUNT(*) FROM property_images WHERE property_id = p.id) AS image_count
        FROM properties p
        LEFT JOIN (SELECT name, MIN(slug) AS slug, MIN(region) AS region FROM provinces GROUP BY name) pv ON p.province = pv.name
        WHERE p.is_active = 1 AND p.is_featured = 1
        GROUP BY p.id
        ORDER BY p.created_at DESC
        LIMIT 8
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: "Server error", error: err });
        res.status(200).json(results);
    });
};

// ==========================================
// 3.5 ดึงทรัพย์แนะนำแบบสุ่ม (Random Featured)
// GET /api/properties/featured-random?limit=3
// ==========================================
exports.getRandomFeaturedProperties = (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 3, 6);
    const sql = `
        SELECT p.id, p.title, p.property_type, p.listing_type,
            p.price_requested, p.original_price, p.monthly_rent, p.bedrooms, p.bathrooms, p.usable_area,
            p.land_area_rai, p.land_area_ngan, p.land_area_wah,
            p.province, p.district, p.thumbnail_url, p.is_featured,
            p.sale_status, p.condition_status, p.bts_station, p.bts_distance_km, p.mrt_station, p.mrt_distance_km,
            p.updated_at,
            pv.slug AS province_slug,
            pv.region AS province_region,
            (SELECT COUNT(*) FROM property_images WHERE property_id = p.id) AS image_count
        FROM properties p
        LEFT JOIN (SELECT name, MIN(slug) AS slug, MIN(region) AS region FROM provinces GROUP BY name) pv ON p.province = pv.name
        WHERE p.is_active = 1 AND p.is_featured = 1
        GROUP BY p.id
        ORDER BY RAND()
        LIMIT ?
    `;

    db.query(sql, [limit], (err, results) => {
        if (err) return res.status(500).json({ message: "Server error", error: err });
        res.status(200).json(results);
    });
};

// ==========================================
// 4. ดึงทรัพย์สินล่าสุด (Latest)
// GET /api/properties/latest
// ==========================================
exports.getLatestProperties = (req, res) => {
    const limit = parseInt(req.query.limit) || 8;

    const sql = `
        SELECT p.id, p.title, p.property_type, p.listing_type,
            p.price_requested, p.original_price, p.monthly_rent, p.bedrooms, p.bathrooms, p.usable_area,
            p.land_area_rai, p.land_area_ngan, p.land_area_wah,
            p.province, p.district, p.thumbnail_url, p.is_featured,
            p.sale_status, p.condition_status, p.bts_station, p.bts_distance_km, p.mrt_station, p.mrt_distance_km,
            p.created_at, p.updated_at,
            pv.slug AS province_slug,
            pv.region AS province_region,
            (SELECT COUNT(*) FROM property_images WHERE property_id = p.id) AS image_count
        FROM properties p
        LEFT JOIN (SELECT name, MIN(slug) AS slug, MIN(region) AS region FROM provinces GROUP BY name) pv ON p.province = pv.name
        WHERE p.is_active = 1
        GROUP BY p.id
        ORDER BY p.created_at DESC
        LIMIT ?
    `;

    db.query(sql, [limit], (err, results) => {
        if (err) return res.status(500).json({ message: "Server error", error: err });
        res.status(200).json(results);
    });
};

// ==========================================
// 5. นับจำนวนตามประเภท
// GET /api/properties/counts
// ==========================================
exports.getPropertyCounts = (req, res) => {
    const sql = `
        SELECT property_type, COUNT(*) AS count
        FROM properties
        WHERE is_active = 1
        GROUP BY property_type
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: "Server error", error: err });
        res.status(200).json(results);
    });
};

// ==========================================
// 5b. นับจำนวนตามจังหวัด
// GET /api/properties/province-counts
// ==========================================
exports.getProvinceCounts = (req, res) => {
    const sql = `
        SELECT province, COUNT(*) AS count
        FROM properties
        WHERE is_active = 1 AND province IS NOT NULL AND province != ''
        GROUP BY province
        ORDER BY count DESC
        LIMIT 20
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Server error', error: err });
        res.status(200).json(results);
    });
};

// ==========================================
// 5c. สถิติรวม (stats)
// GET /api/properties/stats
// ==========================================
exports.getStats = (req, res) => {
    const sql = `
        SELECT
            COUNT(*) AS total,
            COUNT(DISTINCT province) AS province_count,
            SUM(CASE WHEN listing_type IN ('sale','sale_rent') AND sale_status = 'available' THEN 1 ELSE 0 END) AS for_sale,
            SUM(CASE WHEN listing_type IN ('rent','sale_rent') AND sale_status = 'available' THEN 1 ELSE 0 END) AS for_rent,
            SUM(CASE WHEN sale_status = 'reserved' THEN 1 ELSE 0 END) AS reserved,
            SUM(CASE WHEN sale_status = 'sold' THEN 1 ELSE 0 END) AS sold,
            SUM(CASE WHEN is_featured = 1 THEN 1 ELSE 0 END) AS featured
        FROM properties
        WHERE is_active = 1
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Server error', error: err });
        res.status(200).json(results[0]);
    });
};

// ==========================================
// 5d. สรุปรายการขาย/จอง แบ่งตามช่วงเวลา
// GET /api/properties/sales-summary
// ==========================================
exports.getSalesSummary = (req, res) => {
    const sql = `
        SELECT
            SUM(CASE WHEN sale_status = 'sold'     AND updated_at >= DATE_SUB(NOW(), INTERVAL 7  DAY)   THEN 1 ELSE 0 END) AS week_sold,
            SUM(CASE WHEN sale_status = 'reserved' AND updated_at >= DATE_SUB(NOW(), INTERVAL 7  DAY)   THEN 1 ELSE 0 END) AS week_reserved,
            SUM(CASE WHEN sale_status = 'sold'     AND updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)   THEN 1 ELSE 0 END) AS month_sold,
            SUM(CASE WHEN sale_status = 'reserved' AND updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)   THEN 1 ELSE 0 END) AS month_reserved,
            SUM(CASE WHEN sale_status = 'sold'     AND updated_at >= DATE_SUB(NOW(), INTERVAL 1  YEAR)  THEN 1 ELSE 0 END) AS year_sold,
            SUM(CASE WHEN sale_status = 'reserved' AND updated_at >= DATE_SUB(NOW(), INTERVAL 1  YEAR)  THEN 1 ELSE 0 END) AS year_reserved,
            SUM(CASE WHEN sale_status = 'sold'     THEN 1 ELSE 0 END)                                                         AS total_sold,
            SUM(CASE WHEN sale_status = 'reserved' THEN 1 ELSE 0 END)                                                       AS total_reserved
        FROM properties
        WHERE is_active = 1
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Server error', error: err });
        const r = results[0];
        res.status(200).json({
            week:  { sold: Number(r.week_sold  || 0), reserved: Number(r.week_reserved  || 0) },
            month: { sold: Number(r.month_sold || 0), reserved: Number(r.month_reserved || 0) },
            year:  { sold: Number(r.year_sold  || 0), reserved: Number(r.year_reserved  || 0) },
            total: { sold: Number(r.total_sold || 0), reserved: Number(r.total_reserved || 0) },
        });
    });
};

// ==========================================
// 5e. Timeline ยอดขาย/จอง รายวัน รายเดือน
// GET /api/properties/property-timeline?period=week|month|year
// ==========================================
exports.getPropertyTimeline = (req, res) => {
    const period = req.query.period || 'week';
    // ไม่ filter ตาม time-window — แสดงข้อมูล ALL-TIME grouped ตาม period
    // เพื่อให้ทรัพย์ที่ขาย/จองไปแล้ว (ก่อน 7 วัน) ยังแสดงในกราฟ
    let sql;
    if (period === 'year') {
        sql = `
            SELECT DATE_FORMAT(updated_at, '%Y-%m') AS label,
                SUM(CASE WHEN sale_status = 'sold'     THEN 1 ELSE 0 END) AS sold,
                SUM(CASE WHEN sale_status = 'reserved' THEN 1 ELSE 0 END) AS reserved
            FROM properties
            WHERE is_active = 1
              AND sale_status IN ('sold','reserved')
            GROUP BY DATE_FORMAT(updated_at, '%Y-%m')
            ORDER BY label ASC`;
    } else {
        // ใช้ DATE_FORMAT แทน DATE() เพื่อให้ได้ string 'YYYY-MM-DD' ตรงๆ ไม่ใช่ Date object
        sql = `
            SELECT DATE_FORMAT(updated_at, '%Y-%m-%d') AS label,
                SUM(CASE WHEN sale_status = 'sold'     THEN 1 ELSE 0 END) AS sold,
                SUM(CASE WHEN sale_status = 'reserved' THEN 1 ELSE 0 END) AS reserved
            FROM properties
            WHERE is_active = 1
              AND sale_status IN ('sold','reserved')
            GROUP BY DATE_FORMAT(updated_at, '%Y-%m-%d')
            ORDER BY label ASC`;
    }
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Server error', error: err });
        const data = results.map(r => ({
            label: String(r.label),  // DATE_FORMAT คืน string เสมอ ไม่ต้อง slice
            sold: Number(r.sold || 0),
            reserved: Number(r.reserved || 0),
        }));
        res.status(200).json({ data, period });
    });
};

// ==========================================
// 6. เพิ่มทรัพย์ใหม่ (Admin/Agent)
// POST /api/properties
// ==========================================
exports.createProperty = (req, res) => {
    const {
        title, description, property_type, listing_type,
        price_requested, price_per_sqm, monthly_rent,
        bedrooms, bathrooms, usable_area,
        land_area_rai, land_area_ngan, land_area_wah,
        address, province, district, sub_district,
        project_name, thumbnail_url, owner_id
    } = req.body;

    if (!title || !property_type || !price_requested) {
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบ (ชื่อ, ประเภท, ราคา)' });
    }

    const sql = `INSERT INTO properties
        (title, description, property_type, listing_type,
         price_requested, price_per_sqm, monthly_rent,
         bedrooms, bathrooms, usable_area,
         land_area_rai, land_area_ngan, land_area_wah,
         address, province, district, sub_district,
         project_name, thumbnail_url, owner_id,
         is_active, is_featured, view_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 0, NOW(), NOW())`;

    const params = [
        title, description || null, property_type, listing_type || 'sale',
        price_requested, price_per_sqm || null, monthly_rent || null,
        bedrooms || 0, bathrooms || 0, usable_area || null,
        land_area_rai || 0, land_area_ngan || 0, land_area_wah || 0,
        address || null, province || null, district || null, sub_district || null,
        project_name || null, thumbnail_url || null, owner_id || req.user.id
    ];

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'เพิ่มทรัพย์สำเร็จ', propertyId: result.insertId });
    });
};

// ==========================================
// 7. อัพเดททรัพย์
// PUT /api/properties/:id
// ==========================================
exports.updateProperty = (req, res) => {
    const { id } = req.params;
    const fields = req.body;

    fields.updated_at = new Date();
    const keys = Object.keys(fields);
    const values = Object.values(fields);

    const setClause = keys.map(k => `${k} = ?`).join(', ');

    db.query(`UPDATE properties SET ${setClause} WHERE id = ?`, [...values, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'ไม่พบทรัพย์' });
        res.json({ message: 'อัพเดททรัพย์สำเร็จ' });
    });
};

// ==========================================
// 8. ลบทรัพย์
// DELETE /api/properties/:id
// ==========================================
exports.deleteProperty = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM properties WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'ไม่พบทรัพย์' });
        res.json({ message: 'ลบทรัพย์สำเร็จ' });
    });
};

// ==========================================
// 9. เพิ่ม/ลบ Favorite
// POST /api/properties/:property_id/favorite
// ==========================================
exports.toggleFavorite = (req, res) => {
    const { property_id } = req.params;
    const user_id = req.user.id;

    db.query('SELECT id FROM property_favorites WHERE user_id = ? AND property_id = ?', [user_id, property_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length > 0) {
            db.query('DELETE FROM property_favorites WHERE id = ?', [results[0].id], (err2) => {
                if (err2) return res.status(500).json({ error: err2.message });
                res.json({ message: 'ลบออกจากรายการโปรดแล้ว', favorited: false });
            });
        } else {
            db.query('INSERT INTO property_favorites (user_id, property_id, created_at) VALUES (?, ?, NOW())', [user_id, property_id], (err2) => {
                if (err2) return res.status(500).json({ error: err2.message });
                res.json({ message: 'เพิ่มในรายการโปรดแล้ว', favorited: true });
            });
        }
    });
};

// ==========================================
// 10. ดูรายการโปรดของผู้ใช้
// GET /api/properties/favorites
// ==========================================
exports.getFavorites = (req, res) => {
    const user_id = req.user.id;
    const sql = `
        SELECT p.*, pf.created_at AS favorited_at
        FROM property_favorites pf
        JOIN properties p ON pf.property_id = p.id
        WHERE pf.user_id = ?
        ORDER BY pf.created_at DESC
    `;
    db.query(sql, [user_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};
