import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPrice, propertyTypeLabel } from '../utils/propertyUtils';

const API_BASE_URL = 'http://localhost:3001';

// ── Saved IDs helpers (localStorage cache) ─────────────────────────────────
const getSavedIds = () => {
  try { return new Set(JSON.parse(localStorage.getItem('savedPropertyIds') || '[]')); }
  catch { return new Set(); }
};
const setSavedIds = (set) => {
  try { localStorage.setItem('savedPropertyIds', JSON.stringify([...set])); } catch { }
};

// ==========================================
// PropertyCard — Card แสดงข้อมูลทรัพย์สินแต่ละชิ้น
// ใช้ร่วมกันระหว่าง Home, PropertySearch
// ==========================================

const API_BASE = 'http://localhost:3001';

// Badge สถานะ
const SaleStatusBadge = ({ status }) => {
  const map = {
    available: { label: 'ว่างอยู่', color: '#3d7a3a', text: '#fff' },
    reserved: { label: 'จองแล้ว', color: '#f0a500', text: '#fff' },
    sold: { label: 'ขายแล้ว', color: '#e74c3c', text: '#fff' },
  };
  const s = map[status] || map.available;
  return (
    <span style={{
      background: s.color, color: s.text || '#fff',
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
    sale: { label: 'ขาย', icon: 'fa-tag', bg: '#A1D99B', color: '#1a3a18' },
    rent: { label: 'เช่า', icon: 'fa-key', bg: '#2563eb', color: '#fff' },
    sale_rent: { label: 'ขาย/เช่า', icon: 'fa-right-left', bg: '#7c3aed', color: '#fff' },
  };
  const b = map[type] || map.sale;
  return (
    <span style={{
      background: b.bg, color: b.color,
      fontSize: '0.7rem', fontWeight: 800,
      padding: '3px 9px', borderRadius: '6px',
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      letterSpacing: '0.3px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
    }}>
      <i className={`fas ${b.icon}`} style={{ fontSize: '0.65rem' }} />
      {b.label}
    </span>
  );
};


// ฟังก์ชัน "X วันที่แล้ว"
const relativeTime = (dateStr) => {
  if (!dateStr) return null;
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 3600) return 'อัพเดทวันนี้';
  if (diff < 86400) return 'อัพเดทวันนี้';
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
      label: km <= 0.5 ? 'ใกล้ BTS มาก' : km <= 1 ? 'ใกล้ BTS' : 'มีรถไฟฟ้า',
      icon: 'fa-train-subway',
      bg: '#e6f4ea', color: '#1a6040', border: '#b7dfbc',
    });
  }
  if (condition_status === 'furnished') {
    badges.push({ label: 'พร้อมเฟอร์นิเจอร์', icon: 'fa-couch', bg: '#fff3e0', color: '#c25a00', border: '#ffcc80' });
  } else if (condition_status === 'semi_furnished') {
    badges.push({ label: 'เฟอร์นิเจอร์บางส่วน', icon: 'fa-chair', bg: '#fafafa', color: '#555', border: '#ddd' });
  }
  if (sale_status === 'available') {
    badges.push({ label: 'ว่างอยู่', icon: 'fa-circle-check', bg: '#e8f8f2', color: '#3d7a3a', border: '#a8e6cb' });
  }
  return badges;
};

function PropertyCard({ property, className = '' }) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(() => getSavedIds().has(property?.id));
  const [saving, setSaving] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false); // burst animation
  const heartRef = React.useRef(null);

  // Real-time sync: listen for save changes from other PropertyCard instances
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.propertyId === property?.id) {
        setSaved(e.detail.saved);
      }
    };
    window.addEventListener('property-save-changed', handler);
    return () => window.removeEventListener('property-save-changed', handler);
  }, [property?.id]);

  // Also sync when localStorage changes (e.g. from another tab)
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'savedPropertyIds') {
        setSaved(getSavedIds().has(property?.id));
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [property?.id]);

  const handleHeart = useCallback((e) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    const next = !saved;
    setSaved(next);

    // Trigger heart burst animation
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 700);

    // Fire toast notification
    const imgSrcForToast = property.thumbnail_url
      ? (property.thumbnail_url.startsWith('http') ? property.thumbnail_url : `http://localhost:3001/${property.thumbnail_url.replace(/^\/+/, '')}`)
      : null;
    window.dispatchEvent(new CustomEvent('property-save-toast', {
      detail: { saved: next, title: property.title, thumbnail: imgSrcForToast }
    }));

    // อัป localStorage cache ทันที
    const ids = getSavedIds();
    next ? ids.add(property.id) : ids.delete(property.id);
    setSavedIds(ids);

    // Broadcast to all other PropertyCard instances
    window.dispatchEvent(new CustomEvent('property-save-changed', {
      detail: { propertyId: property.id, saved: next }
    }));

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
      .then(data => {
        setSaved(data.saved);
        // Sync final server state to all instances
        window.dispatchEvent(new CustomEvent('property-save-changed', {
          detail: { propertyId: property.id, saved: data.saved }
        }));
      })
      .catch((err) => {
        if (err.message !== 'Unauthorized') {
          // rollback on error
          const rollback = !next;
          setSaved(rollback);
          const ids2 = getSavedIds();
          next ? ids2.delete(property.id) : ids2.add(property.id);
          setSavedIds(ids2);
          // Broadcast rollback
          window.dispatchEvent(new CustomEvent('property-save-changed', {
            detail: { propertyId: property.id, saved: rollback }
          }));
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

  // แสดงขนาดที่ดินเป็นหลัก (ไม่แสดง usable_area ใน card)
  const areaText = (() => {
    const parts = [];
    if (Number(land_area_rai) > 0) parts.push(`${land_area_rai} ไร่`);
    if (Number(land_area_ngan) > 0) parts.push(`${land_area_ngan} งาน`);
    if (Number(land_area_wah) > 0) parts.push(`${land_area_wah} ตร.ว.`);
    return parts.length ? parts.join(' ') : null;
  })();

  const displayPrice = listing_type === 'rent'
    ? (monthly_rent ? `฿${formatPrice(monthly_rent)}/เดือน` : '—')
    : (price_requested ? `฿${formatPrice(price_requested)}` : '—');

  // สำหรับ sale_rent แสดงราคาเช่าเพิ่ม
  const rentSubPrice = listing_type === 'sale_rent' && monthly_rent
    ? `เช่า ฿${formatPrice(monthly_rent)}/เดือน`
    : null;

  return (
    <div
      className={`prop-card ${className}`}
      onClick={() => {
        window.dispatchEvent(new CustomEvent('page-transition', { detail: { to: `/property/${id}` } }));
      }}
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        transition: 'transform 0.35s ease, box-shadow 0.35s ease',
        boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.18)';
        const img = e.currentTarget.querySelector('.prop-card-img');
        if (img) img.style.transform = 'scale(1.06)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.10)';
        const img = e.currentTarget.querySelector('.prop-card-img');
        if (img) img.style.transform = 'scale(1)';
      }}
    >
      {/* Full image background */}
      <div style={{ position: 'relative', paddingTop: '72%', background: '#e8edf2', overflow: 'hidden' }}>
        {imgSrc ? (
          <img
            src={imgSrc} alt={title}
            className="prop-card-img"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
            loading="lazy"
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aab', fontSize: '2.5rem' }}>
            <i className="fas fa-home" />
          </div>
        )}

        {/* --- Luxury Legacy Acquisition Overlay --- */}
        {sale_status !== 'available' && (
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            background: 'rgba(15, 23, 18, 0.85)',
            backdropFilter: 'grayscale(1) brightness(0.6) contrast(1.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            textAlign: 'center',
            pointerEvents: 'none',
            fontFamily: "'Playfair Display', 'Cinzel', 'Georgia', serif",
            animation: 'luxuryFadeIn 1s cubic-bezier(0.23, 1, 0.32, 1) forwards'
          }}>
            <div style={{ 
              border: '1px solid rgba(197, 160, 89, 0.3)', 
              padding: '30px 20px', 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <div style={{
                fontSize: '1.6rem',
                fontWeight: 400,
                color: '#fff',
                letterSpacing: '4px',
                textTransform: 'uppercase',
                fontStyle: 'italic',
                lineHeight: 1.2,
                marginBottom: '12px',
                textShadow: '0 4px 10px rgba(0,0,0,0.5)'
              }}>
                {sale_status === 'sold' 
                  ? (listing_type === 'rent' ? 'Exclusive\nChapter' : 'Legacy\nAcquired') 
                  : 'Future\nSecured'}
              </div>
              
              <div style={{ 
                width: '40px', 
                height: '1px', 
                background: '#c5a059', 
                margin: '15px 0' 
              }} />
              
              <div style={{
                fontSize: '0.65rem',
                color: 'rgba(255,255,255,0.7)',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                fontWeight: 600
              }}>
                {property.district || property.province} • {sale_status === 'sold' ? (listing_type === 'rent' ? 'RENTED' : 'SOLD') : 'RESERVED'}
              </div>
            </div>
            
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,700&family=Cinzel:wght@400;700&display=swap');
              @keyframes luxuryFadeIn {
                from { opacity: 0; transform: scale(1.05); }
                to { opacity: 1; transform: scale(1); }
              }
            `}</style>
          </div>
        )}

        {/* Gradient overlay bottom — dark enough for white text on any image */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.1) 65%, rgba(0,0,0,0) 80%)', pointerEvents: 'none' }} />

        {/* Badges — top left */}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 5, flexWrap: 'wrap', zIndex: 3 }}>
          {listing_type && (
            <span style={{
              background: listing_type === 'rent' ? '#2563eb' : listing_type === 'sale_rent' ? '#7c3aed' : '#A1D99B',
              color: listing_type === 'sale' || (!listing_type || listing_type === 'sale') ? '#1a3a18' : '#fff',
              fontSize: '0.68rem', fontWeight: 800,
              padding: '4px 10px', borderRadius: 6,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              <i className={`fas ${listing_type === 'rent' ? 'fa-key' : listing_type === 'sale_rent' ? 'fa-right-left' : 'fa-tag'}`} style={{ fontSize: '0.6rem' }} />
              {{ sale: 'ขาย', rent: 'เช่า', sale_rent: 'ขาย+เช่า' }[listing_type] || 'ขาย'}
            </span>
          )}
          {sale_status === 'reserved' && (
            <span style={{ background: '#f0a500', color: '#fff', fontSize: '0.68rem', fontWeight: 800, padding: '4px 10px', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
              จองแล้ว
            </span>
          )}
          {sale_status === 'sold' && (
            <span style={{
              background: listing_type === 'rent' ? '#6366f1' : '#e53e3e', color: '#fff',
              fontSize: '0.68rem', fontWeight: 800, padding: '4px 10px', borderRadius: 6,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)', display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              <i className={`fas ${listing_type === 'rent' ? 'fa-check-circle' : 'fa-times-circle'}`} style={{ fontSize: '0.6rem' }} />
              {listing_type === 'rent' ? 'ติดเช่า' : 'ขายแล้ว'}
            </span>
          )}
          {is_featured === 1 && (
            <span style={{
              background: 'rgba(0,0,0,0.5)', color: '#C9A84C',
              fontSize: '0.65rem', fontWeight: 800, padding: '4px 10px', borderRadius: 6,
              backdropFilter: 'blur(4px)', display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              <i className="fas fa-shield-alt" style={{ fontSize: '0.55rem' }} /> ตรวจสอบแล้ว
            </span>
          )}
        </div>

        {/* Heart button — top right */}
        <div ref={heartRef} style={{ position: 'absolute', top: 10, right: 10, zIndex: 5 }}>
          <button
            onClick={handleHeart} disabled={saving}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: saved ? '#e53e3e' : 'rgba(255,255,255,0.92)',
              border: 'none', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s ease',
              boxShadow: saved ? '0 2px 14px rgba(229,62,62,0.4)' : '0 2px 10px rgba(0,0,0,0.15)',
              transform: heartAnim ? 'scale(1.25)' : saving ? 'scale(0.85)' : 'scale(1)',
              position: 'relative',
            }}
            title={saved ? 'ยกเลิกบันทึก' : 'บันทึกทรัพย์นี้'}
          >
            <i className={saved ? 'fas fa-heart' : 'far fa-heart'}
              style={{ fontSize: '0.88rem', color: saved ? '#fff' : '#e53e3e', transition: 'transform 0.3s ease', transform: heartAnim ? 'scale(1.2)' : 'scale(1)' }} />
          </button>
          {heartAnim && saved && (
            <div style={{ position: 'absolute', inset: -12, pointerEvents: 'none' }}>
              {[...Array(8)].map((_, i) => (
                <span key={i} className="heart-particle" style={{
                  position: 'absolute', top: '50%', left: '50%',
                  width: i % 2 === 0 ? 5 : 4, height: i % 2 === 0 ? 5 : 4, borderRadius: '50%',
                  background: i % 3 === 0 ? '#e53e3e' : i % 3 === 1 ? '#f0a500' : '#c9a84c',
                  transform: `rotate(${i * 45}deg) translateY(-18px)`,
                  animation: `heart-burst 0.6s ease-out ${i * 0.03}s forwards`, opacity: 0,
                }} />
              ))}
            </div>
          )}
        </div>

        {/* Sold/Reserved dim overlay */}
        {sale_status === 'reserved' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', background: 'rgba(240,165,0,0.10)' }} />
        )}
        {sale_status === 'sold' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', background: listing_type === 'rent' ? 'rgba(99,102,241,0.12)' : 'rgba(0,0,0,0.22)' }} />
        )}

        {/* === Bottom overlay info (Century 21 style) === */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 3, padding: '14px 14px 12px' }}>
          {/* Price */}
          <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', fontFamily: "'Manrope', sans-serif", lineHeight: 1.1, textShadow: '0 2px 8px rgba(0,0,0,0.7), 0 0 20px rgba(0,0,0,0.4)' }}>
            {displayPrice}
          </div>
          {rentSubPrice && (
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#93c5fd', lineHeight: 1.2, marginTop: 2 }}>
              {rentSubPrice}
            </div>
          )}
          {/* Location */}
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.78rem', fontWeight: 500, marginTop: 4, lineHeight: 1.3 }}>
            {title}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', marginTop: 2 }}>
            {[district, province].filter(Boolean).join(', ')}
          </div>

          {/* Specs row — beds | baths | area */}
          {(bedrooms > 0 || bathrooms > 0 || areaText) && (
            <div style={{
              display: 'flex', gap: 0, marginTop: 8,
              fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600,
            }}>
              {bedrooms > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, paddingRight: 10, borderRight: '1px solid rgba(255,255,255,0.3)' }}>
                  {bedrooms}<span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', marginLeft: 2 }}>ห้องนอน</span>
                </span>
              )}
              {bathrooms > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 10, paddingRight: 10, borderRight: (areaText ? '1px solid rgba(255,255,255,0.3)' : 'none') }}>
                  {bathrooms}<span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', marginLeft: 2 }}>ห้องน้ำ</span>
                </span>
              )}
              {areaText && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 10 }}>
                  {areaText}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Inject heart burst keyframes once
if (typeof document !== 'undefined' && !document.getElementById('heart-burst-css')) {
  const style = document.createElement('style');
  style.id = 'heart-burst-css';
  style.textContent = `
    @keyframes heart-burst {
      0%   { opacity: 1; transform: rotate(var(--r, 0deg)) translateY(0) scale(1); }
      100% { opacity: 0; transform: rotate(var(--r, 0deg)) translateY(-26px) scale(0.2); }
    }
    .heart-particle:nth-child(1) { --r: 0deg; }
    .heart-particle:nth-child(2) { --r: 45deg; }
    .heart-particle:nth-child(3) { --r: 90deg; }
    .heart-particle:nth-child(4) { --r: 135deg; }
    .heart-particle:nth-child(5) { --r: 180deg; }
    .heart-particle:nth-child(6) { --r: 225deg; }
    .heart-particle:nth-child(7) { --r: 270deg; }
    .heart-particle:nth-child(8) { --r: 315deg; }
  `;
  document.head.appendChild(style);
}

export default PropertyCard;
