import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:3001';

// ── Saved IDs helpers (localStorage cache) ─────────────────────────────────
const getSavedIds = () => {
  try { return new Set(JSON.parse(localStorage.getItem('savedPropertyIds') || '[]')); }
  catch { return new Set(); }
};
const setSavedIds = (set) => {
  try { localStorage.setItem('savedPropertyIds', JSON.stringify([...set])); } catch {}
};

// ==========================================
// PropertyCard — Card แสดงข้อมูลทรัพย์สินแต่ละชิ้น
// ใช้ร่วมกันระหว่าง Home, PropertySearch
// ==========================================

const API_BASE = 'http://localhost:3001';

// Badge สถานะ
const SaleStatusBadge = ({ status }) => {
  const map = {
    available: { label: 'ว่างอยู่', color: '#04AA6D' },
    reserved:  { label: 'จองแล้ว',  color: '#f0a500' },
    sold:      { label: 'ขายแล้ว',  color: '#e74c3c' },
  };
  const s = map[status] || map.available;
  return (
    <span style={{
      background: s.color, color: '#fff',
      fontSize: '0.7rem', fontWeight: 700,
      padding: '2px 8px', borderRadius: '20px',
      display: 'inline-block', letterSpacing: '0.3px'
    }}>
      {s.label}
    </span>
  );
};

// ป้ายประเภทการขาย — สีชัดเจน ใหญ่ขึ้น
const ListingTypeBadge = ({ type }) => {
  const map = {
    sale:      { label: '🏠 ขาย',      bg: '#04AA6D', color: '#fff' },
    rent:      { label: '🔑 เช่า',      bg: '#2563eb', color: '#fff' },
    sale_rent: { label: '↔ ขาย/เช่า', bg: '#7c3aed', color: '#fff' },
  };
  const b = map[type] || map.sale;
  return (
    <span style={{
      background: b.bg, color: b.color,
      fontSize: '0.7rem', fontWeight: 800,
      padding: '3px 9px', borderRadius: '6px',
      display: 'inline-block', letterSpacing: '0.3px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
    }}>
      {b.label}
    </span>
  );
};

// ฟอร์แมตราคา — ตัวเลขปกติมีคอมมา เช่น 37,000 / 1,700,000
export const formatPrice = (price) => {
  if (!price) return '—';
  return Number(price).toLocaleString('th-TH');
};

// ชื่อประเภททรัพย์
export const propertyTypeLabel = (type) => {
  const map = {
    house:      'บ้านเดี่ยว',
    condo:      'คอนโด',
    townhouse:  'ทาวน์เฮ้าส์',
    land:       'ที่ดิน',
    apartment:   'อพาร์ทเม้นท์',
    commercial:  'อาคารพาณิชย์',
    home_office: 'โฮมออฟฟิศ',
    warehouse:   'โกดัง/โรงงาน',
  };
  return map[type] || type;
};

// ฟังก์ชัน "X วันที่แล้ว"
const relativeTime = (dateStr) => {
  if (!dateStr) return null;
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 3600)   return 'อัพเดทวันนี้';
  if (diff < 86400)  return 'อัพเดทวันนี้';
  if (diff < 86400 * 2) return 'อัพเดทเมื่อวาน';
  if (diff < 86400 * 30) return `อัพเดท ${Math.floor(diff / 86400)} วันที่แล้ว`;
  if (diff < 86400 * 365) return `อัพเดท ${Math.floor(diff / (86400 * 30))} เดือนที่แล้ว`;
  return null;
};

// Niche badges — derive จาก fields ที่มี
const getNicheBadges = (property) => {
  const badges = [];
  const { bts_station, bts_distance_km, condition_status, sale_status } = property;
  if (bts_station) {
    const km = parseFloat(bts_distance_km);
    badges.push({
      label: km <= 0.5 ? '🚇 ใกล้ BTS มาก' : km <= 1 ? '🚇 ใกล้ BTS' : '🚇 มีรถไฟฟ้า',
      bg: '#e6f4ea', color: '#1a6040', border: '#b7dfbc',
    });
  }
  if (condition_status === 'furnished') {
    badges.push({ label: '🛋 พร้อมเฟอร์นิเจอร์', bg: '#fff3e0', color: '#c25a00', border: '#ffcc80' });
  } else if (condition_status === 'semi_furnished') {
    badges.push({ label: '🪑 เฟอร์นิเจอร์บางส่วน', bg: '#fafafa', color: '#555', border: '#ddd' });
  }
  if (sale_status === 'available') {
    badges.push({ label: '✓ ว่างอยู่', bg: '#e8f8f2', color: '#04AA6D', border: '#a8e6cb' });
  }
  return badges;
};

function PropertyCard({ property, className = '' }) {
  const navigate  = useNavigate();
  const [saved, setSaved] = useState(() => getSavedIds().has(property?.id));
  const [saving, setSaving] = useState(false);

  const handleHeart = useCallback((e) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    const next = !saved;
    setSaved(next);
    // อัป localStorage cache ทันที
    const ids = getSavedIds();
    next ? ids.add(property.id) : ids.delete(property.id);
    setSavedIds(ids);

    setSaving(true);
    fetch(`${API_BASE_URL}/api/users/saved/${property.id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (r.status === 401 || r.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          throw new Error('Unauthorized');
        }
        return r.json();
      })
      .then(data => { setSaved(data.saved); })
      .catch((err) => {
        if (err.message !== 'Unauthorized') {
          // rollback on error
          setSaved(s => !s);
          const ids2 = getSavedIds();
          next ? ids2.delete(property.id) : ids2.add(property.id);
          setSavedIds(ids2);
        }
      })
      .finally(() => setSaving(false));
  }, [saved, property?.id, navigate]);

  const {
    id, title, property_type, listing_type,
    price_requested, original_price, monthly_rent,
    bedrooms, bathrooms, usable_area,
    land_area_rai, land_area_ngan, land_area_wah,
    province, district,
    thumbnail_url, is_featured,
    sale_status, updated_at, image_count,
  } = property;

  const nicheBadges = getNicheBadges(property);
  const timeLabel = relativeTime(updated_at);

  const imgSrc = thumbnail_url
    ? (thumbnail_url.startsWith('http') ? thumbnail_url : `${API_BASE}/${thumbnail_url.replace(/^\/+/, '')}`)
    : null;

  const areaText = (() => {
    if (usable_area) return `${usable_area} ตร.ม.`;
    const parts = [];
    if (land_area_rai  > 0) parts.push(`${land_area_rai} ไร่`);
    if (land_area_ngan > 0) parts.push(`${land_area_ngan} งาน`);
    if (land_area_wah  > 0) parts.push(`${land_area_wah} ตร.ว.`);
    return parts.length ? parts.join(' ') : null;
  })();

  const displayPrice = listing_type === 'rent'
    ? (monthly_rent ? `฿${formatPrice(monthly_rent)}/เดือน` : '—')
    : (price_requested ? `฿${formatPrice(price_requested)}` : '—');

  return (
    <div
      className={`prop-card ${className}`}
      onClick={() => navigate(`/property/${id}`)}
      style={{
        background: '#fff',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        cursor: 'pointer',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.14)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
      }}
    >
      {/* รูปภาพ */}
      <div style={{ position: 'relative', paddingTop: '62%', background: '#e8edf2', flexShrink: 0, overflow: 'hidden' }}>
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={title}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#aab', fontSize: '2.5rem'
          }}>
            <i className="fas fa-home" />
          </div>
        )}

        {/* Badges บนรูป */}
        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4, flexWrap: 'wrap', zIndex: 3 }}>
          <ListingTypeBadge type={listing_type} />
          {is_featured === 1 && (
            <span style={{
              background: '#e8a020', color: '#fff',
              fontSize: '0.68rem', fontWeight: 700,
              padding: '2px 7px', borderRadius: '4px',
            }}>⭐ แนะนำ</span>
          )}
        </div>

        {/* ❤ Heart button — top right */}
        <button
          onClick={handleHeart}
          disabled={saving}
          style={{
            position: 'absolute', top: 8, right: 8, zIndex: 5,
            width: 32, height: 32, borderRadius: '50%',
            background: saved ? '#e53e3e' : 'rgba(255,255,255,0.88)',
            border: saved ? 'none' : '1.5px solid rgba(0,0,0,0.12)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transform: saving ? 'scale(0.85)' : 'scale(1)',
          }}
          title={saved ? 'ยกเลิกบันทึก' : 'บันทึกทรัพย์นี้'}
        >
          <i
            className={saved ? 'fas fa-heart' : 'far fa-heart'}
            style={{ fontSize: '0.85rem', color: saved ? '#fff' : '#e53e3e' }}
          />
        </button>

        {/* ====== จองแล้ว — Ribbon เฉียง + dim ====== */}
        {sale_status === 'reserved' && (
          <>
            {/* dim overlay อ่อนๆ */}
            <div style={{
              position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
              background: 'rgba(240,165,0,0.13)',
            }} />
            {/* ribbon เฉียงมุมขวาบน */}
            <div style={{
              position: 'absolute', top: 22, right: -32, width: 124,
              textAlign: 'center', zIndex: 4,
              background: '#f0a500', color: '#fff',
              fontSize: '0.68rem', fontWeight: 900,
              padding: '5px 0', transform: 'rotate(45deg)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
              letterSpacing: '0.6px', textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }}>
              🔖 จองแล้ว
            </div>
          </>
        )}

        {/* ====== ขายแล้ว — Ribbon แดง + dim ====== */}
        {sale_status === 'sold' && (
          <>
            <div style={{
              position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
              background: 'rgba(0,0,0,0.28)',
            }} />
            <div style={{
              position: 'absolute', top: 22, right: -32, width: 124,
              textAlign: 'center', zIndex: 4,
              background: '#e53e3e', color: '#fff',
              fontSize: '0.68rem', fontWeight: 900,
              padding: '5px 0', transform: 'rotate(45deg)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
              letterSpacing: '0.6px', textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }}>
              ✓ ขายแล้ว
            </div>
          </>
        )}

        {/* ผ่านการตรวจสอบ badge — bottom left */}
        <div style={{
          position: 'absolute', bottom: 8, left: 8, zIndex: 3,
          background: 'rgba(4,170,109,0.92)', color: '#fff',
          fontSize: '0.62rem', fontWeight: 800,
          padding: '2px 7px', borderRadius: '10px',
          display: 'flex', alignItems: 'center', gap: 3,
          backdropFilter: 'blur(2px)',
          letterSpacing: '0.2px',
        }}>
          <i className="fas fa-shield-alt" style={{ fontSize: '0.58rem' }} />
          ผ่านการตรวจสอบ
        </div>

        {/* Photo counter — bottom right */}
        {image_count > 0 && (
          <div style={{
            position: 'absolute', bottom: 8, right: 8, zIndex: 3,
            background: 'rgba(0,0,0,0.55)', color: '#fff',
            fontSize: '0.68rem', fontWeight: 700,
            padding: '2px 7px', borderRadius: '10px',
            display: 'flex', alignItems: 'center', gap: 3,
            backdropFilter: 'blur(2px)',
          }}>
            <i className="fas fa-camera" style={{ fontSize: '0.6rem' }} />
            {image_count}
          </div>
        )}
      </div>

      {/* ข้อมูล */}
      <div style={{ padding: '12px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* ประเภท + ราคา */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: '#777', fontWeight: 500 }}>
            {propertyTypeLabel(property_type)}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#04AA6D' }}>
            {sale_status === 'available' && <SaleStatusBadge status="available" />}
          </span>
        </div>

        {/* ชื่อทรัพย์ */}
        <h3 style={{
          margin: 0,
          fontSize: '0.9rem',
          fontWeight: 700,
          color: '#1a2d4a',
          lineHeight: 1.35,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {title}
        </h3>

        {/* ที่ตั้ง + วันที่อัพเดท */}
        <div style={{ fontSize: '0.78rem', color: '#666', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="fas fa-map-marker-alt" style={{ color: '#04AA6D', fontSize: '0.72rem' }} />
            {[district, province].filter(Boolean).join(', ') || '—'}
          </span>
          {timeLabel && (
            <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: '#aaa', whiteSpace: 'nowrap' }}>
              {timeLabel}
            </span>
          )}
        </div>

        {/* Specs */}
        {(bedrooms > 0 || bathrooms > 0 || areaText) && (
          <div style={{
            display: 'flex', gap: 10, marginTop: 4,
            fontSize: '0.75rem', color: '#555',
            borderTop: '1px solid #f0f0f0', paddingTop: 8,
          }}>
            {bedrooms > 0 && (
              <span><i className="fas fa-bed" style={{ marginRight: 3, color: '#888' }} />{bedrooms} นอน</span>
            )}
            {bathrooms > 0 && (
              <span><i className="fas fa-bath" style={{ marginRight: 3, color: '#888' }} />{bathrooms} น้ำ</span>
            )}
            {areaText && (
              <span><i className="fas fa-vector-square" style={{ marginRight: 3, color: '#888' }} />{areaText}</span>
            )}
          </div>
        )}

        {/* Niche Badges */}
        {nicheBadges.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
            {nicheBadges.map((b, i) => (
              <span key={i} style={{
                fontSize: '0.65rem', fontWeight: 700,
                padding: '2px 7px', borderRadius: 10,
                background: b.bg, color: b.color,
                border: `1px solid ${b.border}`,
                letterSpacing: '0.2px',
              }}>
                {b.label}
              </span>
            ))}
          </div>
        )}

        {/* ราคา */}
        <div style={{ marginTop: 'auto', paddingTop: 8 }}>
          {/* ราคาตัด — แสดงถ้า original_price > price_requested */}
          {original_price > 0 && original_price > price_requested && (
            <div style={{ marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{
                  fontSize: '0.75rem', color: '#bbb', fontWeight: 500,
                  textDecoration: 'line-through',
                }}>
                  ฿{formatPrice(original_price)}
                </span>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 800, color: '#e53e3e',
                  background: '#fff5f5', border: '1px solid #fed7d7',
                  padding: '1px 5px', borderRadius: 4,
                }}>
                  ลด {Math.round((1 - price_requested / original_price) * 100)}%
                </span>
              </div>
              <div style={{
                fontSize: '0.68rem', color: '#04AA6D', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 3,
              }}>
                <i className="fas fa-tag" style={{ fontSize: '0.6rem' }} />
                ประหยัดได้ ฿{formatPrice(original_price - price_requested)}
              </div>
            </div>
          )}
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1a3c6e' }}>
            {displayPrice}
            {price_requested && Number(usable_area) > 0 && (
              <span style={{ fontSize: '0.7rem', color: '#999', fontWeight: 400, marginLeft: 6 }}>
                ≈ ฿{formatPrice(Math.round(price_requested / usable_area))}/ตร.ม.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PropertyCard;
