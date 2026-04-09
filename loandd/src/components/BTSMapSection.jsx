import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TRAIN_LINES, TRAIN_STATIONS } from '../data/trainStations';

/* ─── Official-style SVG Logos ────────────────────────────────────────────── */

const BTSMainLogo = () => (
  <svg viewBox="0 0 88 88" width="60" height="60">
    {/* Green arch background */}
    <rect width="88" height="88" rx="0" fill="transparent"/>
    {/* Train body */}
    <rect x="8" y="32" width="72" height="26" rx="6" fill="#009640"/>
    {/* Windows row */}
    <rect x="13" y="37" width="13" height="10" rx="2" fill="#fff" opacity="0.9"/>
    <rect x="30" y="37" width="13" height="10" rx="2" fill="#fff" opacity="0.9"/>
    <rect x="47" y="37" width="13" height="10" rx="2" fill="#fff" opacity="0.9"/>
    <rect x="64" y="37" width="9" height="10" rx="2" fill="#fff" opacity="0.9"/>
    {/* Cab stripe */}
    <rect x="8" y="52" width="72" height="4" rx="0" fill="#C8222A"/>
    {/* Bottom rail */}
    <rect x="4" y="56" width="80" height="3" rx="1.5" fill="#D4A017"/>
    {/* Wheels */}
    <circle cx="22" cy="62" r="5" fill="#333"/>
    <circle cx="22" cy="62" r="2.5" fill="#999"/>
    <circle cx="66" cy="62" r="5" fill="#333"/>
    <circle cx="66" cy="62" r="2.5" fill="#999"/>
    {/* BTS text */}
    <text x="44" y="26" textAnchor="middle" fill="#009640" fontSize="16" fontWeight="900" fontFamily="'Arial Black',Arial,sans-serif">BTS</text>
    <text x="44" y="80" textAnchor="middle" fill="#555" fontSize="8.5" fontWeight="700" fontFamily="Arial,sans-serif" letterSpacing="2">SKYTRAIN</text>
  </svg>
);

const BTSGoldLogo = () => (
  <svg viewBox="0 0 88 88" width="60" height="60">
    <rect x="8" y="32" width="72" height="26" rx="6" fill="#C8980A"/>
    <rect x="13" y="37" width="13" height="10" rx="2" fill="#fff" opacity="0.9"/>
    <rect x="30" y="37" width="13" height="10" rx="2" fill="#fff" opacity="0.9"/>
    <rect x="47" y="37" width="13" height="10" rx="2" fill="#fff" opacity="0.9"/>
    <rect x="64" y="37" width="9" height="10" rx="2" fill="#fff" opacity="0.9"/>
    <rect x="8" y="52" width="72" height="4" rx="0" fill="#8B6308"/>
    <rect x="4" y="56" width="80" height="3" rx="1.5" fill="#E8C040"/>
    <circle cx="22" cy="62" r="5" fill="#333"/>
    <circle cx="22" cy="62" r="2.5" fill="#999"/>
    <circle cx="66" cy="62" r="5" fill="#333"/>
    <circle cx="66" cy="62" r="2.5" fill="#999"/>
    <text x="44" y="26" textAnchor="middle" fill="#C8980A" fontSize="16" fontWeight="900" fontFamily="'Arial Black',Arial,sans-serif">BTS</text>
    <text x="44" y="80" textAnchor="middle" fill="#888" fontSize="8.5" fontWeight="700" fontFamily="Arial,sans-serif" letterSpacing="1">GOLD LINE</text>
  </svg>
);

const MRTLogo = ({ bg, textColor = '#fff' }) => (
  <svg viewBox="0 0 88 88" width="60" height="60">
    <rect x="10" y="10" width="68" height="68" rx="14" fill={bg}/>
    {/* Stylized M */}
    <text
      x="44" y="62"
      textAnchor="middle"
      fill={textColor}
      fontSize="46"
      fontWeight="900"
      fontFamily="'Arial Black',Arial,sans-serif"
    >M</text>
    <text x="44" y="80" textAnchor="middle" fill="#666" fontSize="8" fontWeight="700" fontFamily="Arial,sans-serif" letterSpacing="1">MRT</text>
  </svg>
);

const ARLLogo = () => (
  <svg viewBox="0 0 88 88" width="60" height="60">
    <rect x="10" y="10" width="68" height="68" rx="14" fill="#B11116"/>
    {/* Plane silhouette */}
    <path d="M44 22 L50 32 L68 36 L50 40 L50 50 L56 53 L56 57 L44 54 L32 57 L32 53 L38 50 L38 40 L20 36 L38 32 Z" fill="white" opacity="0.9"/>
    <text x="44" y="76" textAnchor="middle" fill="white" fontSize="11" fontWeight="900" fontFamily="'Arial Black',Arial,sans-serif" letterSpacing="2">ARL</text>
  </svg>
);

const SRTRedLogo = () => (
  <svg viewBox="0 0 88 88" width="60" height="60">
    <rect x="10" y="10" width="68" height="68" rx="14" fill="#1a1a1a"/>
    {/* Train front */}
    <rect x="20" y="28" width="48" height="30" rx="8" fill="#C1440E"/>
    <rect x="26" y="33" width="15" height="12" rx="2" fill="#fff" opacity="0.85"/>
    <rect x="47" y="33" width="15" height="12" rx="2" fill="#fff" opacity="0.85"/>
    <rect x="20" y="52" width="48" height="4" fill="#333"/>
    <circle cx="30" cy="60" r="5" fill="#555"/>
    <circle cx="30" cy="60" r="2.5" fill="#888"/>
    <circle cx="58" cy="60" r="5" fill="#555"/>
    <circle cx="58" cy="60" r="2.5" fill="#888"/>
    <text x="44" y="80" textAnchor="middle" fill="#ccc" fontSize="8.5" fontWeight="700" fontFamily="Arial,sans-serif" letterSpacing="1">SRT RED</text>
  </svg>
);

/* ─── Logo map ───────────────────────────────────────────────────────────── */
const LOGOS = {
  bts_sukhumvit: <BTSMainLogo />,
  bts_silom:     <BTSMainLogo />,
  gold:          <BTSGoldLogo />,
  mrt_blue:      <MRTLogo bg="#1E4D9B" />,
  mrt_purple:    <MRTLogo bg="#7B2D8B" />,
  mrt_yellow:    <MRTLogo bg="#F5B400" textColor="#5a4000" />,
  mrt_pink:      <MRTLogo bg="#E6007E" />,
  arl:           <ARLLogo />,
  srt_red_north: <SRTRedLogo />,
};

/* ─── Config ─────────────────────────────────────────────────────────────── */
const LINE_ORDER = [
  'bts_sukhumvit',
  'bts_silom',
  'gold',
  'mrt_blue',
  'mrt_purple',
  'mrt_yellow',
  'mrt_pink',
  'arl',
  'srt_red_north',
];

const LINE_LABEL = {
  bts_sukhumvit: 'BTS สายหลัก',
  bts_silom:     'BTS สายสีลม',
  gold:          'BTS สายสีทอง',
  mrt_blue:      'MRT สายสีน้ำเงิน',
  mrt_purple:    'MRT สายสีม่วง',
  mrt_yellow:    'MRT สายสีเหลือง',
  mrt_pink:      'MRT สายสีชมพู',
  arl:           'Airport link',
  srt_red_north: 'รถไฟฟ้าสีแดง',
};

const shortName = (name) => name.replace(/^(BTS|MRT|ARL|SRT)\s+/, '');

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function BTSMapSection() {
  const [activeLine, setActiveLine] = useState(null);
  const [listingType, setListingType] = useState('sale');
  const navigate = useNavigate();

  const lineInfo = activeLine ? TRAIN_LINES[activeLine] : null;
  const stations = activeLine ? TRAIN_STATIONS.filter((s) => s.line === activeLine) : [];

  const goSearch = (stationName) =>
    navigate(`/search?listing_type=${listingType}&bts_station=${encodeURIComponent(stationName)}`);

  return (
    <section style={{ padding: '56px 0 48px', background: 'var(--surface-low, #f8f7f6)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>

        {/* ─── Section Header ───────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: '0.62rem', color: '#C9A84C', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, fontFamily: "'Manrope', sans-serif", marginBottom: 6 }}>
              Transit Search
            </div>
            <h2 style={{
              fontWeight: 500, margin: 0, fontSize: 'clamp(1.05rem, 2.5vw, 1.3rem)', color: 'var(--on-surface, #1a1a1a)',
              fontFamily: "'Noto Serif Thai', 'Noto Serif', Georgia, serif",
            }}>
              อสังหาฯ ใกล้<span style={{ color: '#1A8C6E' }}>รถไฟฟ้า</span>
            </h2>
            <p style={{ color: 'var(--outline, #888)', fontSize: '0.82rem', margin: '4px 0 0' }}>เลือกสายรถไฟฟ้า แล้วกดสถานีเพื่อดูแผนที่ทรัพย์ใกล้เคียง</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* ซื้อ / เช่า */}
            <div style={{
              display: 'flex', gap: 0, background: 'var(--surface, #f4f3f2)',
              borderRadius: 20, padding: 3,
            }}>
              {[{ v: 'sale', l: 'ซื้อ' }, { v: 'rent', l: 'เช่า' }].map(({ v, l }) => (
                <button key={v} onClick={() => setListingType(v)} style={{
                  padding: '5px 18px', borderRadius: 17, border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: '0.8rem', transition: 'all 0.18s',
                  background: listingType === v ? '#1A8C6E' : 'transparent',
                  color:      listingType === v ? '#fff' : '#999',
                  fontFamily: 'inherit',
                }}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Line Cards Row ───────────────────────────────────────── */}
        <div className="bts-scroll-row" style={{
          overflowX: 'auto', paddingBottom: 8, marginBottom: activeLine ? 20 : 0,
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          <div style={{ display: 'flex', gap: 10, minWidth: 'max-content', touchAction: 'pan-x' }}>
            {LINE_ORDER.map((key) => {
              const color    = TRAIN_LINES[key]?.color || '#888';
              const isActive = activeLine === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveLine(isActive ? null : key)}
                  style={{
                    width: 96, flexShrink: 0, padding: '12px 6px 10px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                    background: isActive ? '#fff' : 'var(--surface, #fff)',
                    border: isActive ? `2px solid ${color}` : '1.5px solid transparent',
                    borderRadius: 14,
                    cursor: 'pointer', outline: 'none',
                    boxShadow: isActive ? `0 4px 16px ${color}25` : '0 1px 6px rgba(0,0,0,0.06)',
                    transition: 'all 0.18s',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = `${color}60`;
                      e.currentTarget.style.boxShadow  = `0 4px 16px ${color}18`;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.boxShadow  = '0 1px 6px rgba(0,0,0,0.06)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {/* Logo */}
                  <div style={{
                    width: 68, height: 68,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 10,
                    background: isActive ? `${color}0f` : 'transparent',
                    transition: 'background 0.18s',
                  }}>
                    {LOGOS[key]}
                  </div>
                  {/* Label */}
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, textAlign: 'center',
                    color: isActive ? color : '#333', lineHeight: 1.3,
                    transition: 'color 0.18s',
                  }}>
                    {LINE_LABEL[key]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Station Chips (shows when a line is selected) ─────────── */}
        {activeLine && lineInfo && (
          <div style={{
            background: 'var(--surface, #fff)',
            borderRadius: 16,
            padding: '20px 24px 24px',
            animation: 'fadeInDown 0.25s ease',
            boxShadow: `0 2px 12px ${lineInfo.color}12`,
          }}>
            {/* Station section header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{
                  background: lineInfo.color, color: '#fff',
                  fontWeight: 800, fontSize: '0.72rem',
                  borderRadius: 6, padding: '3px 8px', letterSpacing: 0.5,
                }}>
                  {stations.length} สถานี
                </span>
                <span style={{ color: '#555', fontWeight: 700, fontSize: '0.85rem' }}>
                  {LINE_LABEL[activeLine]}
                </span>
              </div>
              <span style={{ color: '#aaa', fontSize: '0.75rem' }}>
                คลิกสถานีเพื่อค้นหาทรัพย์
              </span>
            </div>

            {/* Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {stations.map((st) => (
                <button
                  key={st.id}
                  onClick={() => goSearch(st.name)}
                  style={{
                    padding: '6px 14px', borderRadius: 22, cursor: 'pointer',
                    border: 'none',
                    background: `${lineInfo.color}0d`, color: '#444',
                    fontWeight: 600, fontSize: '0.78rem',
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.18s', outline: 'none',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background   = lineInfo.color;
                    e.currentTarget.style.color        = '#fff';
                    e.currentTarget.style.boxShadow    = `0 3px 12px ${lineInfo.color}35`;
                    e.currentTarget.style.transform    = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background   = `${lineInfo.color}0d`;
                    e.currentTarget.style.color        = '#444';
                    e.currentTarget.style.boxShadow    = 'none';
                    e.currentTarget.style.transform    = 'translateY(0)';
                  }}
                >
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: lineInfo.color, flexShrink: 0,
                  }}/>
                  {shortName(st.name)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Popular Stations ─────────────────────────────────────── */}
        {!activeLine && (
          <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--outline, #888)', letterSpacing: '0.02em' }}>สถานียอดนิยม</span>
              <div style={{ flex: 1, height: 1, background: 'var(--outline-variant, #e8e8e8)' }}/>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { name: 'BTS สยาม',     line: 'bts_sukhumvit' },
                { name: 'BTS อโศก',     line: 'bts_sukhumvit' },
                { name: 'BTS ทองหล่อ',  line: 'bts_sukhumvit' },
                { name: 'BTS อ่อนนุช',  line: 'bts_sukhumvit' },
                { name: 'BTS หมอชิต',   line: 'bts_sukhumvit' },
                { name: 'MRT สุขุมวิท', line: 'mrt_blue' },
                { name: 'MRT พระราม 9', line: 'mrt_blue' },
                { name: 'BTS พญาไท',    line: 'bts_sukhumvit' },
              ].map(({ name, line }) => {
                const c = TRAIN_LINES[line]?.color || '#1A8C6E';
                return (
                  <button
                    key={name}
                    onClick={() => navigate(`/search?listing_type=${listingType}&bts_station=${encodeURIComponent(name)}`)}
                    style={{
                      padding: '7px 14px', border: 'none',
                      borderRadius: 22, background: 'var(--surface, #fff)', cursor: 'pointer',
                      fontWeight: 600, fontSize: '0.78rem', color: '#555',
                      display: 'flex', alignItems: 'center', gap: 6,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      transition: 'all 0.18s', outline: 'none',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background   = c;
                      e.currentTarget.style.color        = '#fff';
                      e.currentTarget.style.boxShadow    = `0 3px 12px ${c}35`;
                      e.currentTarget.style.transform    = 'translateY(-1px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background   = 'var(--surface, #fff)';
                      e.currentTarget.style.color        = '#555';
                      e.currentTarget.style.boxShadow    = '0 1px 4px rgba(0,0,0,0.06)';
                      e.currentTarget.style.transform    = 'translateY(0)';
                    }}
                  >
                    <span style={{
                      background: c, color: '#fff',
                      borderRadius: 4, padding: '1px 5px',
                      fontSize: '0.59rem', fontWeight: 800, letterSpacing: 0.5,
                    }}>
                      {line.startsWith('bts') || line === 'gold' ? 'BTS' : line === 'arl' ? 'ARL' : 'MRT'}
                    </span>
                    {shortName(name)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes fadeInDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .bts-scroll-row::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
}
