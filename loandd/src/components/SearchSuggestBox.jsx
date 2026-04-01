import React from 'react';
import { useNavigate } from 'react-router-dom';

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
  { label: '🏢 คอนโด',         type: 'condo' },
  { label: '🏠 บ้านเดี่ยว',    type: 'house' },
  { label: '🏘 ทาวน์เฮ้าส์',  type: 'townhouse' },
  { label: '🏗 ที่ดิน',         type: 'land' },
  { label: '🏬 อาคารพาณิชย์',  type: 'commercial' },
  { label: '🏨 อพาร์ทเม้นท์',  type: 'apartment' },
  { label: '💼 โฮมออฟฟิศ',     type: 'home_office' },
  { label: '🏭 โกดัง/โรงงาน',  type: 'warehouse' },
];

// ============================================================
//  SearchSuggestBox
//  Props:
//    visible    — boolean
//    onSelect   — (text) => void  ← fills the input
//    onClose    — () => void
//    inputValue — string (for filtering suggestions while typing)
// ============================================================
const SearchSuggestBox = ({ visible, onSelect, onClose, inputValue = '' }) => {
  const navigate = useNavigate();

  if (!visible) return null;

  const q = inputValue.trim().toLowerCase();

  // When user has typed something: filter trending matches
  const filteredTrending = q
    ? TRENDING_SEARCHES.filter(t => t.label.toLowerCase().includes(q))
    : TRENDING_SEARCHES;

  const goSearch = (params) => {
    const p = new URLSearchParams(params);
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
          font-size: 0.82rem; color: #1a2d4a;
          transition: all 0.15s; white-space: nowrap;
          font-family: inherit;
        }
        .suggest-chip:hover {
          background: #e8f8f2; border-color: #04AA6D; color: #04AA6D;
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
            <i className="fas fa-search" style={{ color: '#04AA6D', width: 18 }} />
            <span>ค้นหา "<strong>{inputValue}</strong>"</span>
          </div>

          {filteredTrending.length > 0 && (
            <>
              <div className="suggest-section-title">🔥 ที่เกี่ยวข้อง</div>
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
          <div className="suggest-section-title">📍 ทำเลยอดนิยม</div>
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
            <div className="suggest-section-title">🏠 ประเภทอสังหาฯ</div>
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

          {/* ค้นหายอดนิยม */}
          <div style={{ borderTop: '1px solid #f0f0f0' }}>
            <div className="suggest-section-title">🔥 ค้นหายอดนิยม</div>
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
                color: '#04AA6D', fontWeight: 700, fontSize: '0.85rem',
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
