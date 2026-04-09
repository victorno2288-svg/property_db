import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TRAIN_STATIONS, TRAIN_LINES } from '../data/trainStations';

// ============================================================
//  Static suggestion data (ปรับได้เมื่อมีข้อมูลจาก backend)
// ============================================================
const TRENDING_SEARCHES = [
  { label: 'คอนโด BTS สุขุมวิท',  q: 'คอนโด สุขุมวิท' },
  { label: 'บ้านเดี่ยว นนทบุรี', q: 'บ้านเดี่ยว นนทบุรี' },
  { label: 'ที่ดิน ภูเก็ต',       q: 'ที่ดิน ภูเก็ต' },
  { label: 'ทาวน์เฮ้าส์ ชลบุรี', q: 'ทาวน์เฮ้าส์ ชลบุรี' },
  { label: 'คอนโด ราคาถูก กรุงเทพ', q: 'คอนโด กรุงเทพ' },
];

const POPULAR_LOCATIONS = [
  { label: 'กรุงเทพฯ',    province: 'กรุงเทพมหานคร' },
  { label: 'ชลบุรี',      province: 'ชลบุรี' },
  { label: 'เชียงใหม่',   province: 'เชียงใหม่' },
  { label: 'ภูเก็ต',      province: 'ภูเก็ต' },
  { label: 'นนทบุรี',     province: 'นนทบุรี' },
  { label: 'ปทุมธานี',    province: 'ปทุมธานี' },
  { label: 'ระยอง',       province: 'ระยอง' },
  { label: 'สมุทรปราการ', province: 'สมุทรปราการ' },
];

const PROPERTY_TYPES = [
  { label: 'คอนโด',         type: 'condo' },
  { label: 'บ้านเดี่ยว',    type: 'house' },
  { label: 'ทาวน์เฮ้าส์',  type: 'townhouse' },
  { label: 'ทาวน์โฮม',    type: 'townhome' },
  { label: 'ที่ดิน',         type: 'land' },
  { label: 'อาคารพาณิชย์',  type: 'commercial' },
  { label: 'อพาร์ทเม้นท์',  type: 'apartment' },
  { label: 'โฮมออฟฟิศ',     type: 'home_office' },
  { label: 'โกดัง/โรงงาน',  type: 'warehouse' },
];

// ============================================================
//  SearchSuggestBox
//  Props:
//    visible    — boolean
//    onSelect   — (text) => void  ← fills the input
//    onClose    — () => void
//    inputValue — string (for filtering suggestions while typing)
// ============================================================
// activeFilters: { listing_type, property_type } — ส่งต่อ filters ที่เลือกไว้
const SearchSuggestBox = ({ visible, onSelect, onClose, inputValue = '', activeFilters = {} }) => {
  const navigate = useNavigate();

  if (!visible) return null;

  const q = inputValue.trim().toLowerCase();

  // When user has typed something: filter trending matches
  const filteredTrending = q
    ? TRENDING_SEARCHES.filter(t => t.label.toLowerCase().includes(q))
    : TRENDING_SEARCHES;

  // Match BTS/MRT stations when user types station-related keywords
  const matchedStations = q
    ? TRAIN_STATIONS.filter(s => {
        const name = s.name.toLowerCase();
        // strip "BTS " / "MRT " prefix for matching
        const shortName = name.replace(/^(bts|mrt)\s+/, '');
        return name.includes(q) || shortName.includes(q);
      }).slice(0, 6)
    : [];

  const goSearch = (params) => {
    const p = new URLSearchParams();
    // Carry over active filters (listing_type, property_type)
    if (activeFilters.listing_type) p.set('listing_type', activeFilters.listing_type);
    if (activeFilters.property_type) p.set('property_type', activeFilters.property_type);
    // Merge in the new search params
    Object.entries(params).forEach(([k, v]) => { if (v) p.set(k, v); });
    p.set('page', '1');
    navigate(`/search?${p.toString()}`);
    onClose();
  };

  return (
    <div
      onMouseDown={e => e.preventDefault()} // prevent input blur on click
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        left: 0,
        right: 0,
        background: '#fff',
        borderRadius: 14,
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        zIndex: 2000,
        overflow: 'hidden',
        animation: 'suggestFadeIn 0.18s ease',
        minWidth: 320,
      }}
    >
      <style>{`
        @keyframes suggestFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .suggest-chip {
          display: inline-flex; align-items: center;
          padding: 5px 12px; border-radius: 20px;
          border: 1px solid #e8e8e8;
          background: #f8f9fa; cursor: pointer;
          font-size: 0.82rem; color: #1A8C6E;
          transition: all 0.15s; white-space: nowrap;
          font-family: inherit;
        }
        .suggest-chip:hover {
          background: #e8f8f2; border-color: #1A8C6E; color: #1A8C6E;
        }
        .suggest-row { cursor: pointer; padding: 9px 16px; display: flex; align-items: center; gap: 10px; font-size: 0.88rem; color: #333; transition: background 0.12s; }
        .suggest-row:hover { background: #f5f5f5; }
        .suggest-section-title {
          font-size: 0.7rem; font-weight: 800; color: #aaa;
          text-transform: uppercase; letter-spacing: 0.5px;
          padding: 12px 16px 6px;
        }
      `}</style>

      {/* ── ถ้ากำลังพิมพ์: แสดง filtered trending + shortcut ค้นหาตรง ── */}
      {q ? (
        <>
          {/* ค้นหาตรง */}
          <div
            className="suggest-row"
            onClick={() => { onSelect(inputValue); goSearch({ search: inputValue }); }}
            style={{ borderBottom: '1px solid #f0f0f0', fontWeight: 700 }}
          >
            <i className="fas fa-search" style={{ color: '#1A8C6E', width: 18 }} />
            <span>ค้นหา "<strong>{inputValue}</strong>"</span>
          </div>

          {/* Station matches → ไปหน้า search พร้อมแผนที่ */}
          {matchedStations.length > 0 && (
            <>
              <div className="suggest-section-title"><i className="fas fa-train" style={{ marginRight: 4 }} /> ใกล้รถไฟฟ้า</div>
              {matchedStations.map((st) => {
                const lineColor = TRAIN_LINES[st.line]?.color || '#1A8C6E';
                const lineType = st.line.startsWith('bts') || st.line === 'gold' ? 'BTS' : st.line === 'arl' ? 'ARL' : 'MRT';
                return (
                  <div
                    key={st.id}
                    className="suggest-row"
                    onClick={() => { onSelect(st.name); goSearch({ bts_station: st.name }); }}
                  >
                    <span style={{
                      background: lineColor, color: '#fff', borderRadius: 4,
                      padding: '1px 6px', fontSize: '0.62rem', fontWeight: 800,
                      letterSpacing: 0.5, flexShrink: 0,
                    }}>{lineType}</span>
                    <span>{st.name}</span>
                    <i className="fas fa-map-marker-alt" style={{ color: '#bbb', fontSize: '0.7rem', marginLeft: 'auto' }} />
                  </div>
                );
              })}
            </>
          )}

          {filteredTrending.length > 0 && (
            <>
              <div className="suggest-section-title"><i className="fas fa-fire" style={{ color: '#f0a500', marginRight: 4 }} /> ที่เกี่ยวข้อง</div>
              {filteredTrending.map((t, i) => (
                <div
                  key={i}
                  className="suggest-row"
                  onClick={() => { onSelect(t.q); goSearch({ search: t.q }); }}
                >
                  <i className="fas fa-fire" style={{ color: '#f0a500', width: 18, fontSize: '0.8rem' }} />
                  {t.label}
                </div>
              ))}
            </>
          )}
        </>
      ) : (
        /* ── ยังไม่พิมพ์: แสดง full suggestion panel ── */
        <>
          {/* ทำเลยอดนิยม */}
          <div className="suggest-section-title"><i className="fas fa-map-marker-alt" style={{ marginRight: 4 }} /> ทำเลยอดนิยม</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '4px 16px 12px' }}>
            {POPULAR_LOCATIONS.map((loc, i) => (
              <button
                key={i}
                className="suggest-chip"
                onClick={() => goSearch({ province: loc.province })}
              >
                {loc.label}
              </button>
            ))}
          </div>

          {/* ประเภทอสังหาฯ */}
          <div style={{ borderTop: '1px solid #f0f0f0' }}>
            <div className="suggest-section-title">ประเภทอสังหาฯ</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '4px 16px 12px' }}>
              {PROPERTY_TYPES.map((pt, i) => (
                <button
                  key={i}
                  className="suggest-chip"
                  onClick={() => goSearch({ property_type: pt.type })}
                >
                  {pt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ใกล้รถไฟฟ้า */}
          <div style={{ borderTop: '1px solid #f0f0f0' }}>
            <div className="suggest-section-title"><i className="fas fa-train" style={{ marginRight: 4 }} /> ใกล้รถไฟฟ้า</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '4px 16px 12px' }}>
              {[
                { name: 'BTS อโศก',     line: 'bts_sukhumvit' },
                { name: 'BTS สยาม',     line: 'bts_sukhumvit' },
                { name: 'BTS ทองหล่อ',  line: 'bts_sukhumvit' },
                { name: 'MRT พระราม 9', line: 'mrt_blue' },
                { name: 'BTS อ่อนนุช',  line: 'bts_sukhumvit' },
                { name: 'BTS พญาไท',    line: 'bts_sukhumvit' },
              ].map(st => {
                const c = TRAIN_LINES[st.line]?.color || '#1A8C6E';
                return (
                  <button
                    key={st.name}
                    className="suggest-chip"
                    style={{ borderColor: `${c}30`, color: c }}
                    onClick={() => goSearch({ bts_station: st.name })}
                  >
                    <i className="fas fa-train" style={{ fontSize: '0.65rem' }} /> {st.name.replace(/^(BTS|MRT)\s+/, '')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ค้นหายอดนิยม */}
          <div style={{ borderTop: '1px solid #f0f0f0' }}>
            <div className="suggest-section-title"><i className="fas fa-fire" style={{ color: '#f0a500', marginRight: 4 }} /> ค้นหายอดนิยม</div>
            {TRENDING_SEARCHES.map((t, i) => (
              <div
                key={i}
                className="suggest-row"
                onClick={() => { onSelect(t.q); goSearch({ search: t.q }); }}
              >
                <i className="fas fa-fire" style={{ color: '#f0a500', width: 18, fontSize: '0.8rem' }} />
                {t.label}
              </div>
            ))}
          </div>

          {/* ดูทั้งหมด */}
          <div
            style={{
              borderTop: '1px solid #f0f0f0',
              padding: '10px 16px',
              textAlign: 'center',
            }}
          >
            <button
              onClick={() => goSearch({})}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#1A8C6E', fontWeight: 700, fontSize: '0.85rem',
                fontFamily: 'inherit',
              }}
            >
              ดูทรัพย์ทั้งหมด →
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default SearchSuggestBox;
