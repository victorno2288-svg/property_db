import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import adminFetch, { BASE_URL } from './utils/adminFetch';
import UsersPanel from './pages/admin/UsersPanel';
import NotificationBell from './components/NotificationBell';
import './css/adminMobile.css';

/* ─────────────────────────── constants ─────────────────────────── */
const G = '#3d7a3a'; const Gl = '#A1D99B';
const N = '#3d7a3a';

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const THAI_DAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

const TYPE_LABEL = {
 house: 'บ้านเดี่ยว', condo: 'คอนโด', townhouse: 'ทาวน์เฮ้าส์', townhome: 'ทาวน์โฮม',
 land: 'ที่ดิน', apartment: 'อพาร์ทเม้นท์', commercial: 'อาคารพาณิชย์',
 home_office: 'Home Office', warehouse: 'โกดัง',
};
const SALE_STATUS = {
 available: { label: 'ว่างอยู่', bg: '#e8f8f2', color: G },
 reserved: { label: 'จองแล้ว', bg: '#fffbe6', color: '#d4890a' },
 sold: { label: 'ขายแล้ว', bg: '#fff0f0', color: '#c0392b' },
};
const INQ_STATUS = {
 new: { label: 'ใหม่', bg: '#e8f4fd', color: '#2980b9' },
 contacted: { label: 'ติดต่อแล้ว', bg: '#fffbe6', color: '#d4890a' },
 closed: { label: 'ปิดแล้ว', bg: '#f0f0f0', color: '#888' },
};
const LISTING_LABEL = { sale: 'ขาย', rent: 'เช่า', sale_rent: 'ขาย/เช่า' };

const fmtPrice = (n) => {
 if (!n) return '—';
 const num = Number(n);
 if (num >= 1e6) return `${(num / 1e6).toFixed(2).replace(/\.?0+$/, '')} ล้าน`;
 return num.toLocaleString('th-TH');
};
const actionBtn = (bg, color) => ({
 background: bg, color, border: `1px solid ${color}`,
 borderRadius: 6, padding: '5px 9px', cursor: 'pointer', fontSize: '0.8rem',
});

/* ─────────────────────────── chart helpers ─────────────────────────── */
const fillTimeline = (raw, period) => {
 const today = new Date();
 const map = {};
 raw.forEach(r => { map[r.label] = Number(r.count); });
 if (period === 'year') {
 return Array.from({ length: 12 }, (_, i) => {
 const d = new Date(today.getFullYear(), today.getMonth() - 11 + i, 1);
 const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
 return { key, label: THAI_MONTHS[d.getMonth()], count: map[key] || 0 };
 });
 }
 const days = period === 'month' ? 30 : 7;
 return Array.from({ length: days }, (_, i) => {
 const d = new Date(today);
 d.setDate(d.getDate() - (days - 1 - i));
 const key = d.toISOString().split('T')[0];
 return { key, label: period === 'week' ? THAI_DAYS[d.getDay()] : `${d.getDate()}`, count: map[key] || 0 };
 });
};

const fillSalesTimeline = (raw, period) => {
 // แสดงข้อมูลจริงจาก DB ทั้งหมด (ไม่ restrict time window)
 // period ใช้แค่ตัดสินว่าจะแสดง label แบบไหน
 if (!raw.length) return [];
 if (period === 'year') {
 // label = 'YYYY-MM' → แปลงเป็นชื่อเดือนไทย
 return raw.map(r => {
 const parts = r.label.split('-');
 const mm = parseInt(parts[1], 10);
 return { key: r.label, label: THAI_MONTHS[mm - 1] || r.label, sold: r.sold, reserved: r.reserved };
 });
 }
 // week / month: label = 'YYYY-MM-DD' → parse แบบ manual เพื่อป้องกัน timezone drift
 return raw.map(r => {
 const parts = r.label.split('-');
 const year = parseInt(parts[0], 10);
 const month = parseInt(parts[1], 10) - 1; // 0-indexed
 const day = parseInt(parts[2], 10);
 const d = new Date(year, month, day); // local time, ไม่มี timezone issue
 const label = period === 'week'
 ? `${THAI_DAYS[d.getDay()]} ${day}` // เช่น "พฤ 12"
 : `${day}/${month + 1}`; // เช่น "12/3"
 return { key: r.label, label, sold: r.sold, reserved: r.reserved };
 });
};

/* ── Sales Status Chart (เรียลไทม์จาก stats) ── */
const SalesStatusChart = ({ stats }) => {
 const total = Math.max(stats.total || 0, 1);
 const items = [
 { label: 'กำลังขาย/เช่า', count: (stats.for_sale || 0) + (stats.for_rent || 0), color: '#3d7a3a', icon: 'fa-tag' },
 { label: 'จองแล้ว', count: stats.reserved || 0, color: '#f59e0b', icon: 'fa-bookmark' },
 { label: 'ขายแล้ว', count: stats.sold || 0, color: '#7c3aed', icon: 'fa-check-circle' },
 ];
 const filled = items.reduce((s, x) => s + x.count, 0);
 return (
 <div style={{ padding: '4px 0' }}>
 {/* Stacked bar */}
 <div style={{ display: 'flex', height: 16, borderRadius: 8, overflow: 'hidden', marginBottom: 22, background: '#e8edf2' }}>
 {items.map((item, i) => (
 <div key={i} title={`${item.label}: ${item.count}`}
 style={{ width: `${(item.count / total) * 100}%`, background: item.color, minWidth: item.count > 0 ? 6 : 0, transition: 'width 0.5s ease' }} />
 ))}
 </div>
 {/* Legend rows */}
 <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
 {items.map((item, i) => {
 const pct = filled > 0 ? Math.round((item.count / total) * 100) : 0;
 const barW = filled > 0 ? (item.count / Math.max(...items.map(x => x.count), 1)) * 100 : 0;
 return (
 <div key={i}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
 <div style={{ width: 10, height: 10, borderRadius: 3, background: item.color, flexShrink: 0 }} />
 <span style={{ flex: 1, fontSize: '0.82rem', color: '#555', fontWeight: 600 }}>{item.label}</span>
 <span style={{ fontWeight: 900, fontSize: '1.1rem', color: item.color, minWidth: 28, textAlign: 'right' }}>{item.count}</span>
 <span style={{ fontSize: '0.7rem', color: '#aaa', width: 34, textAlign: 'right' }}>{pct}%</span>
 </div>
 <div style={{ height: 4, borderRadius: 4, background: '#f0f4f8', overflow: 'hidden' }}>
 <div style={{ height: '100%', width: `${barW}%`, background: item.color, borderRadius: 4, transition: 'width 0.5s ease' }} />
 </div>
 </div>
 );
 })}
 </div>
 <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f0f4f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <span style={{ fontSize: '0.75rem', color: '#aaa' }}>ทรัพย์ทั้งหมด <strong style={{ color: '#3d7a3a' }}>{stats.total || 0}</strong> รายการ</span>
 <span style={{ fontSize: '0.65rem', color: '#c0c9d8', display: 'flex', alignItems: 'center', gap: 4 }}>
 <i className="fas fa-circle" style={{ fontSize: '0.4rem', color: '#3d7a3a' }} />อัปเดตเรียลไทม์
 </span>
 </div>
 </div>
 );
};

const SalesTimelineChart = ({ data, loading }) => {
 const BAR_H = 200;
 const [hoverIdx, setHoverIdx] = React.useState(-1);
 if (loading) return <div style={{ height: BAR_H + 60, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}><i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem' }} /></div>;
 const hasData = data.some(d => d.sold > 0 || d.reserved > 0);
 if (!data.length || !hasData) return (
 <div style={{ height: BAR_H + 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ccc', gap: 8 }}>
 <i className="fas fa-chart-bar" style={{ fontSize: '2rem' }} />
 <span style={{ fontSize: '0.85rem' }}>ยังไม่มียอดขาย/จองในช่วงนี้</span>
 </div>
 );
 const rawMax = Math.max(...data.map(d => d.sold + d.reserved), 1);
 // nice max (round up)
 const pow = Math.pow(10, Math.floor(Math.log10(rawMax)));
 const niceMax = Math.ceil(rawMax / pow) * pow;
 const maxVal = Math.max(niceMax, 4);
 const ticks = 4; // 0, 25%, 50%, 75%, 100%
 const compact = data.length > 20;
 const maxIdx = data.reduce((mi, d, i) => (d.sold + d.reserved) > (data[mi].sold + data[mi].reserved) ? i : mi, 0);
 const highlightIdx = hoverIdx >= 0 ? hoverIdx : maxIdx;
 const hl = data[highlightIdx];
 const hlTotal = hl ? hl.sold + hl.reserved : 0;

 const SOLD = '#3d7a3a';       // solid brand green
 const RESV = '#C9A84C';       // brand gold
 const RESV_LIGHT = '#e8d69a';
 // diagonal stripes (SVG pattern URL) — gold tint
 const stripeBG = `repeating-linear-gradient(135deg, ${RESV} 0 4px, ${RESV_LIGHT} 4px 8px)`;

 return (
 <div>
 {/* Legend */}
 <div style={{ display: 'flex', gap: 18, marginBottom: 14, justifyContent: 'flex-end' }}>
 {[{ bg: SOLD, label: 'ขายแล้ว' }, { bg: stripeBG, label: 'จองแล้ว' }].map((l, i) => (
 <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#555', fontWeight: 600 }}>
 <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.bg }} />{l.label}
 </div>
 ))}
 </div>

 {/* Chart body: grid + bars */}
 <div style={{ display: 'flex', gap: 10, position: 'relative' }}>
 {/* Y-axis */}
 <div style={{ display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', height: BAR_H, paddingBottom: 2, fontSize: '0.65rem', color: '#bbb', minWidth: 26, textAlign: 'right' }}>
 {Array.from({ length: ticks + 1 }, (_, i) => (
 <div key={i} style={{ lineHeight: 1 }}>{Math.round((maxVal / ticks) * i)}</div>
 ))}
 </div>

 {/* Plot area */}
 <div style={{ flex: 1, position: 'relative' }}>
 {/* grid lines */}
 <div style={{ position: 'absolute', inset: `0 0 20px 0`, display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', pointerEvents: 'none' }}>
 {Array.from({ length: ticks + 1 }, (_, i) => (
 <div key={i} style={{ borderTop: i === 0 ? '1px solid #e8edf2' : '1px dashed #f0f2f5', height: 0 }} />
 ))}
 </div>

 {/* Floating tooltip for highlight */}
 {hl && hlTotal > 0 && data.length > 0 && (() => {
 const pct = (highlightIdx + 0.5) / data.length * 100;
 const top = BAR_H - (hlTotal / maxVal) * BAR_H - 54;
 return (
 <div style={{ position: 'absolute', left: `${pct}%`, top: Math.max(0, top), transform: 'translateX(-50%)', background: '#fff', border: '1px solid #e8edf2', borderRadius: 10, padding: '6px 12px', boxShadow: '0 4px 14px rgba(0,0,0,0.08)', fontSize: '0.72rem', color: '#555', textAlign: 'center', pointerEvents: 'none', zIndex: 2, whiteSpace: 'nowrap' }}>
 <div style={{ fontWeight: 900, fontSize: '0.95rem', color: N, lineHeight: 1.1 }}>{hlTotal}</div>
 <div style={{ fontSize: '0.62rem', color: '#999' }}>{hl.label}</div>
 </div>
 );
 })()}

 {/* Bars */}
 <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'stretch', gap: compact ? 2 : 6, height: BAR_H, padding: '0 2px', position: 'relative' }}>
 {data.map((d, i) => {
 const total = d.sold + d.reserved;
 const totalH = Math.max((total / maxVal) * BAR_H, total > 0 ? 4 : 2);
 const soldH = total > 0 ? Math.round((d.sold / total) * totalH) : 0;
 const resvH = total > 0 ? totalH - soldH : 0;
 const isHl = i === highlightIdx && total > 0;
 const barW = compact ? '70%' : (data.length <= 7 ? 34 : '64%');
 return (
 <div key={d.key}
 onMouseEnter={() => setHoverIdx(i)}
 onMouseLeave={() => setHoverIdx(-1)}
 style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: BAR_H, cursor: 'pointer' }}>
 <div style={{ width: barW, maxWidth: 48, minWidth: 8, height: totalH, display: 'flex', flexDirection: 'column', borderRadius: '10px 10px 0 0', overflow: 'hidden', boxShadow: isHl ? `0 4px 12px ${SOLD}33` : 'none', transition: 'all 0.25s ease', opacity: total > 0 ? 1 : 0.6 }}>
 {resvH > 0 && <div title={`จอง: ${d.reserved}`} style={{ height: resvH, background: stripeBG, transition: 'height 0.45s ease' }} />}
 {soldH > 0 && <div title={`ขาย: ${d.sold}`} style={{ height: soldH, background: SOLD, transition: 'height 0.45s ease' }} />}
 {total === 0 && <div style={{ height: 3, background: '#eef1f5' }} />}
 </div>
 </div>
 );
 })}
 </div>

 {/* X-axis labels */}
 <div style={{ display: 'flex', gap: compact ? 2 : 6, padding: '6px 2px 0', justifyContent: 'stretch' }}>
 {data.map((d, i) => {
 const showLabel = !compact || i % 5 === 0 || i === data.length - 1;
 return (
 <div key={d.key} style={{ flex: 1, textAlign: 'center', fontSize: compact ? '0.55rem' : '0.7rem', color: '#999', fontWeight: 500 }}>
 {showLabel ? d.label : ''}
 </div>
 );
 })}
 </div>
 </div>
 </div>
 </div>
 );
};

const BarChart = ({ data, loading }) => {
 const BAR_H = 180;
 if (loading) return <div style={{ height: BAR_H + 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}><i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem' }} /></div>;
 if (!data.length) return <div style={{ height: BAR_H + 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '0.85rem' }}>ยังไม่มีข้อมูล</div>;
 const rawMax = Math.max(...data.map(d => d.count), 1);
 const pow = Math.pow(10, Math.floor(Math.log10(rawMax)));
 const maxVal = Math.max(Math.ceil(rawMax / pow) * pow, 4);
 const ticks = 4;
 const compact = data.length > 20;
 const maxIdx = data.reduce((mi, d, i) => d.count > data[mi].count ? i : mi, 0);
 const hl = data[maxIdx];
 return (
 <div style={{ display: 'flex', gap: 10, position: 'relative' }}>
 <div style={{ display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', height: BAR_H, paddingBottom: 2, fontSize: '0.65rem', color: '#bbb', minWidth: 26, textAlign: 'right' }}>
 {Array.from({ length: ticks + 1 }, (_, i) => (<div key={i} style={{ lineHeight: 1 }}>{Math.round((maxVal / ticks) * i)}</div>))}
 </div>
 <div style={{ flex: 1, position: 'relative' }}>
 <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between', pointerEvents: 'none' }}>
 {Array.from({ length: ticks + 1 }, (_, i) => (<div key={i} style={{ borderTop: i === 0 ? '1px solid #e8edf2' : '1px dashed #f0f2f5', height: 0 }} />))}
 </div>
 {hl && hl.count > 0 && data.length > 0 && (() => {
 const pct = (maxIdx + 0.5) / data.length * 100;
 const top = BAR_H - (hl.count / maxVal) * BAR_H - 50;
 return (
 <div style={{ position: 'absolute', left: `${pct}%`, top: Math.max(0, top), transform: 'translateX(-50%)', background: '#fff', border: '1px solid #e8edf2', borderRadius: 10, padding: '5px 11px', boxShadow: '0 4px 14px rgba(0,0,0,0.08)', fontSize: '0.7rem', color: '#555', textAlign: 'center', pointerEvents: 'none', zIndex: 2, whiteSpace: 'nowrap' }}>
 <div style={{ fontWeight: 900, fontSize: '0.9rem', color: G, lineHeight: 1.1 }}>{hl.count}</div>
 <div style={{ fontSize: '0.62rem', color: '#999' }}>{hl.label}</div>
 </div>
 );
 })()}
 <div style={{ display: 'flex', alignItems: 'flex-end', gap: compact ? 2 : 6, height: BAR_H, padding: '0 2px' }}>
 {data.map((d, i) => {
 const barH = Math.max((d.count / maxVal) * BAR_H, d.count > 0 ? 4 : 2);
 const isHl = i === maxIdx && d.count > 0;
 const barW = compact ? '70%' : (data.length <= 7 ? 34 : '64%');
 return (
 <div key={d.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: BAR_H }}>
 <div title={`${d.label}: ${d.count} ข้อความ`} style={{ width: barW, maxWidth: 48, minWidth: 8, height: barH, background: d.count > 0 ? G : '#eef1f5', borderRadius: '10px 10px 0 0', transition: 'height 0.45s ease', boxShadow: isHl ? `0 4px 12px ${G}33` : 'none' }} />
 </div>
 );
 })}
 </div>
 <div style={{ display: 'flex', gap: compact ? 2 : 6, padding: '6px 2px 0' }}>
 {data.map((d, i) => {
 const showLabel = !compact || i % 5 === 0 || i === data.length - 1;
 return (<div key={d.key} style={{ flex: 1, textAlign: 'center', fontSize: compact ? '0.55rem' : '0.7rem', color: '#999', fontWeight: 500 }}>{showLabel ? d.label : ''}</div>);
 })}
 </div>
 </div>
 </div>
 );
};

/* ═══════════════════════════ DASHBOARD ═══════════════════════════ */
export default function Dashboard() {
 const navigate = useNavigate();
 const adminUser = (() => { try { return JSON.parse(localStorage.getItem('adminUser') || '{}'); } catch { return {}; } })();

 /* ── shared state ── */
 const location = useLocation();
 const [activeTab, setActiveTab] = useState(0);
 const [stats, setStats] = useState({ total: 0, for_sale: 0, for_rent: 0, reserved: 0, province_count: 0, sold: 0 });
 const [inquiries, setInquiries] = useState([]);
 const [loading, setLoading] = useState(true);

 /* ── overview ── */
 const [chartMode, setChartMode] = useState('sales'); // 'sales' | 'inquiries'
 const [chartPeriod, setChartPeriod] = useState('week');
 const [salesSummary, setSalesSummary] = useState({ week: { sold: 0, reserved: 0 }, month: { sold: 0, reserved: 0 }, year: { sold: 0, reserved: 0 }, total: { sold: 0, reserved: 0 } });
 const [summaryPeriod, setSummaryPeriod] = useState('week'); // 'week'|'month'|'year'
 const [chartData, setChartData] = useState([]);
 const [chartLoading, setChartLoading] = useState(false);
 const [salesChartData, setSalesChartData] = useState([]);
 const [salesChartLoading, setSalesChartLoading] = useState(false);

 /* ── properties tab ── */
 const [properties, setProperties] = useState([]);
 const [propPag, setPropPag] = useState({ total: 0, totalPages: 1, page: 1 });
 const [propLoading, setPropLoading] = useState(false);
 const [propSearch, setPropSearch] = useState('');
 const [propStatus, setPropStatus] = useState('');
 const [delConfirm, setDelConfirm] = useState(null);
 const [deleting, setDeleting] = useState(false);

 /* ── messages tab ── */
 const [msgFilter, setMsgFilter] = useState('');
 const [msgMainTab, setMsgMainTab] = useState('property'); // 'property' | 'contact'
 const [contacts, setContacts] = useState([]);
 const [inqPage, setInqPage] = useState(1);
 const [contactPage, setContactPage] = useState(1);
 const MSG_PAGE_SIZE = 10;

 /* ── mark inquiry status (contacted/closed) ── */
 const updateInqStatus = async (id, status) => {
 try {
 await adminFetch(`/api/inquiries/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
 setInquiries(prev => prev.map(x => x.id === id ? { ...x, status } : x));
 } catch (e) { console.error(e); }
 };

 const handleLogout = () => {
 localStorage.removeItem('adminToken');
 localStorage.removeItem('adminUser');
 navigate('/admin');
 };

 /* ── fetch: stats + inquiries ── */
 /* ── fetch: sales summary ── */
 const fetchSalesSummary = useCallback(async () => {
 try {
 const res = await fetch('/api/properties/sales-summary');
 const data = await res.json();
 if (data?.week) setSalesSummary(data);
 } catch (e) { console.error(e); }
 }, []);

 /* ── fetch: stats only (lightweight — ใช้ refresh หลัง action) ── */
 const fetchStats = useCallback(async () => {
 try {
 const res = await fetch('/api/properties/stats');
 const data = await res.json();
 if (data?.total != null) setStats({ ...data, sold: data.sold || 0, reserved: data.reserved || 0 });
 } catch (e) { console.error(e); }
 }, []);

 const fetchAll = useCallback(async () => {
 setLoading(true);
 try {
 const [sRes, iRes, cRes] = await Promise.all([
 fetch('/api/properties/stats'),
 adminFetch('/api/inquiries?limit=50'),
 adminFetch('/api/inquiries/contact-messages'),
 ]);
 const sData = await sRes.json();
 const iData = await iRes.json();
 const cData = await cRes.json();
 if (sData?.total != null) setStats({ ...sData, sold: sData.sold || 0, reserved: sData.reserved || 0 });
 setInquiries(Array.isArray(iData?.data) ? iData.data : []);
 setContacts(Array.isArray(cData?.data) ? cData.data : []);
 } catch (e) { console.error(e); }
 finally { setLoading(false); }
 fetchSalesSummary();
 }, [fetchSalesSummary]);

 /* ── fetch: inquiry chart ── */
 const fetchChart = useCallback(async (period) => {
 setChartLoading(true);
 try {
 const res = await adminFetch(`/api/inquiries/timeline?period=${period}`);
 const data = await res.json();
 setChartData(fillTimeline(Array.isArray(data?.data) ? data.data : [], period));
 } catch { setChartData(fillTimeline([], period)); }
 finally { setChartLoading(false); }
 }, []);

 /* ── fetch: sales timeline chart ── */
 const fetchSalesChart = useCallback(async (period) => {
 setSalesChartLoading(true);
 try {
 const res = await fetch(`/api/properties/property-timeline?period=${period}`);
 const data = await res.json();
 setSalesChartData(fillSalesTimeline(Array.isArray(data?.data) ? data.data : [], period));
 } catch { setSalesChartData(fillSalesTimeline([], period)); }
 finally { setSalesChartLoading(false); }
 }, []);

 /* ── fetch: properties ── */
 const fetchProperties = useCallback((page = 1) => {
 setPropLoading(true);
 const params = new URLSearchParams({ page, limit: 15 });
 if (propSearch) params.set('search', propSearch);
 if (propStatus) params.set('status', propStatus);
 adminFetch(`/api/admin/properties?${params}`)
 .then(r => r.json())
 .then(data => { setProperties(data.data || []); setPropPag(data.pagination || { total: 0, totalPages: 1, page: 1 }); })
 .catch(() => setProperties([]))
 .finally(() => setPropLoading(false));
 }, [propSearch, propStatus]);

 /* ── delete ── */
 const handleDelete = async () => {
 if (!delConfirm) return;
 setDeleting(true);
 try {
 const res = await adminFetch(`/api/admin/properties/${delConfirm.id}`, { method: 'DELETE' });
 if (res.ok) { setDelConfirm(null); fetchProperties(propPag.page); fetchStats(); }
 else alert('ลบไม่สำเร็จ');
 } finally { setDeleting(false); }
 };

 /* ── quick status / featured → refresh KPI ทันที ── */
 const quickStatus = async (id, val) => {
 await adminFetch(`/api/admin/properties/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sale_status: val }) });
 fetchProperties(propPag.page);
 fetchStats();
 fetchSalesSummary();
 fetchSalesChart(chartPeriod); // อัปเดตกราฟทันที
 };
 const toggleFeatured = async (id, cur) => {
 await adminFetch(`/api/admin/properties/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_featured: cur ? 0 : 1 }) });
 fetchProperties(propPag.page);
 fetchStats();
 };

 useEffect(() => { fetchAll(); }, [fetchAll]);
 useEffect(() => { fetchChart(chartPeriod); }, [chartPeriod, fetchChart]);
 useEffect(() => { fetchSalesChart(chartPeriod); }, [chartPeriod, fetchSalesChart]);

 // รับ navigation state จาก NotificationBell → กระโดดไปยัง tab ที่ต้องการ
 useEffect(() => {
 if (location.state?.tab != null) {
 setActiveTab(location.state.tab);
 // ล้าง state ไม่ให้ค้างตอน refresh
 window.history.replaceState({}, '');
 }
 }, [location.state]);

 /* ── re-fetch เมื่อ user สลับแท็บกลับมา ── */
 useEffect(() => {
 const onVis = () => {
 if (!document.hidden) {
 fetchStats();
 fetchChart(chartPeriod);
 fetchSalesChart(chartPeriod);
 fetchSalesSummary();
 }
 };
 document.addEventListener('visibilitychange', onVis);
 return () => document.removeEventListener('visibilitychange', onVis);
 }, [fetchStats, fetchChart, fetchSalesChart, fetchSalesSummary, chartPeriod]);

 /* lazy-load properties only when tab=1 is opened */
 useEffect(() => { if (activeTab === 1) fetchProperties(1); }, [activeTab]); // eslint-disable-line
 useEffect(() => { if (activeTab === 1) fetchProperties(1); }, [fetchProperties]); // re-fetch when search/filter changes

 const newCount = inquiries.filter(i => i.status === 'new').length;
 const totalMsgBadge = newCount + contacts.length; // property new + all contacts
 const filteredInq = msgFilter ? inquiries.filter(i => i.status === msgFilter) : inquiries;
 const inqTotalPages = Math.max(1, Math.ceil(filteredInq.length / MSG_PAGE_SIZE));
 const inqCurPage = Math.min(inqPage, inqTotalPages);
 const pagedInq = filteredInq.slice((inqCurPage - 1) * MSG_PAGE_SIZE, inqCurPage * MSG_PAGE_SIZE);
 const contactTotalPages = Math.max(1, Math.ceil(contacts.length / MSG_PAGE_SIZE));
 const contactCurPage = Math.min(contactPage, contactTotalPages);
 const pagedContacts = contacts.slice((contactCurPage - 1) * MSG_PAGE_SIZE, contactCurPage * MSG_PAGE_SIZE);
 const chartTotal = chartData.reduce((s, d) => s + d.count, 0);

 const TABS = [
 { icon: 'fa-chart-bar', label: 'ภาพรวม' },
 { icon: 'fa-home', label: 'ทรัพย์', count: propPag.total },
 { icon: 'fa-envelope', label: 'ข้อความ', count: totalMsgBadge, alert: true },
 { icon: 'fa-users', label: ' ผู้ใช้' },
 ];
 const PERIOD_OPTS = [['week', '7 วัน'], ['month', 'เดือน'], ['year', 'ปี']];

 /* ── KPI card ── */
 const KpiCard = ({ icon, label, value, color, bg, link }) => (
 <Link to={link} style={{ textDecoration: 'none' }}>
 <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: `1.5px solid ${bg}`, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
 onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${color}22`; }}
 onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.06)'; }}>
 <div style={{ width: 46, height: 46, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
 <i className={`fas ${icon}`} style={{ color, fontSize: '1.25rem' }} />
 </div>
 <div>
 <div style={{ fontSize: '0.73rem', color: '#888', fontWeight: 600 }}>{label}</div>
 <div style={{ fontSize: '1.55rem', fontWeight: 900, color: N, lineHeight: 1.2 }}>{loading ? '—' : value}</div>
 </div>
 </div>
 </Link>
 );

 /* ════════════════════════════════ RENDER ════════════════════════════════ */
 return (
 <div style={{ minHeight: '100vh', background: '#f5f7fa', fontFamily: "'Sarabun','Noto Sans Thai',sans-serif" }}>

 {/* ── TOP NAVBAR ── */}
 <div style={{ background: `linear-gradient(135deg,${N},#6aab62)`, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,0.18)' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
 <div style={{ fontWeight: 900, fontSize: '1.25rem', color: '#fff', letterSpacing: 1 }}>LOAN<span style={{ color: Gl }}>DD</span></div>
 <span style={{ background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.85)', fontSize: '0.7rem', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>Admin</span>
 </div>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
 <div style={{ width: 32, height: 32, borderRadius: '50%', background: Gl, color: '#1a3a18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.82rem' }}>
 {(adminUser.username || 'A').charAt(0).toUpperCase()}
 </div>
 <span className="admin-nav-username" style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600 }}>{adminUser.username || 'Admin'}</span>
 <NotificationBell />
 <button onClick={handleLogout} style={{ background: 'rgba(220,38,38,0.15)', border: '1.5px solid rgba(220,38,38,0.4)', color: '#fca5a5', padding: '5px 12px', borderRadius: 7, fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 5 }}>
 <i className="fas fa-sign-out-alt" /> ออก
 </button>
 </div>
 </div>

 {/* ── CONTENT ── */}
 <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 16px' }}>

 {/* Welcome */}
 <div style={{ marginBottom: 22 }}>
 <h1 style={{ fontWeight: 900, fontSize: '1.4rem', color: N, margin: 0 }}>สวัสดี, {adminUser.username || 'Admin'} </h1>
 <p style={{ color: '#888', margin: '4px 0 0', fontSize: '0.88rem' }}>
 {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
 </p>
 </div>

 {/* ── SLIDING TAB BAR ── */}
 <div className="admin-pill-nav" style={{ position: 'relative', display: 'inline-flex', background: '#e2e8f0', borderRadius: 14, padding: 4, marginBottom: 28, gap: 0 }}>
 {/* sliding pill */}
 <div style={{ position: 'absolute', top: 4, bottom: 4, width: `calc(${100 / TABS.length}% - 4px)`, left: `calc(${activeTab * (100 / TABS.length)}% + 2px)`, background: '#fff', borderRadius: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.12)', transition: 'left 0.28s cubic-bezier(0.4,0,0.2,1)', zIndex: 0 }} />
 {TABS.map((tab, i) => (
 <button key={i} onClick={() => setActiveTab(i)} style={{ position: 'relative', zIndex: 1, border: 'none', background: 'transparent', padding: '9px 22px', cursor: 'pointer', borderRadius: 10, fontWeight: activeTab === i ? 800 : 500, color: activeTab === i ? N : '#94a3b8', fontSize: '0.85rem', fontFamily: "'Sarabun',sans-serif", transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
 <i className={`fas ${tab.icon}`} style={{ fontSize: '0.8rem' }} />
 {tab.label}
 {tab.count > 0 && (
 <span style={{ background: tab.alert ? '#e74c3c' : '#e2e8f0', color: tab.alert ? '#fff' : '#64748b', borderRadius: 20, padding: '1px 6px', fontSize: '0.58rem', fontWeight: 900 }}>
 {tab.count}
 </span>
 )}
 </button>
 ))}
 </div>

 {/* ══════════════════ TAB 0 — ภาพรวม ══════════════════ */}
 {activeTab === 0 && (
 <>
 {/* New Message Alert Banner */}
 {totalMsgBadge > 0 && (
 <div
 onClick={() => setActiveTab(2)}
 style={{
 background: 'linear-gradient(135deg,#e74c3c,#c0392b)',
 borderRadius: 14, padding: '14px 20px', marginBottom: 18,
 display: 'flex', alignItems: 'center', justifyContent: 'space-between',
 gap: 12, cursor: 'pointer', boxShadow: '0 4px 18px rgba(231,76,60,0.35)',
 animation: 'pulse-inq 2s ease-in-out infinite',
 }}
 title="คลิกเพื่อดูข้อความ"
 >
 <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
 <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
 
 </div>
 <div>
 <div style={{ fontWeight: 900, color: '#fff', fontSize: '1rem', marginBottom: 2 }}>
 มีข้อความรอดำเนินการ {totalMsgBadge} ข้อความ!
 </div>
 <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
 {newCount > 0 && <span> อสังหา {newCount} ใหม่</span>}
 {contacts.length > 0 && <span> ติดต่อทั่วไป {contacts.length} รายการ</span>}
 </div>
 </div>
 </div>
 <div style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', borderRadius: 8, padding: '7px 16px', fontWeight: 800, fontSize: '0.88rem', flexShrink: 0 }}>
 ดูเลย →
 </div>
 </div>
 )}
 {/* KPI cards */}
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14, marginBottom: 22 }}>
 {[
 { icon: 'fa-home', label: 'ทรัพย์ทั้งหมด', value: stats.total, color: G, bg: '#e8f7ee', link: '/admin/properties' },
 { icon: 'fa-tag', label: 'กำลังขาย/เช่า', value: stats.for_sale + stats.for_rent, color: '#0891b2', bg: '#e0f2fe', link: '/admin/properties' },
 { icon: 'fa-check-circle', label: 'ขายแล้ว', value: stats.sold, color: '#7c3aed', bg: '#f3e8ff', link: '/admin/properties' },
 { icon: 'fa-envelope', label: 'ข้อความใหม่', value: newCount, color: '#e74c3c', bg: '#fff0f0', link: '/admin/inquiries', badge: true },
 ].map((k, i) => (
 <div key={i} style={{ position: 'relative' }}>
 {k.badge && k.value > 0 && <span style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, background: '#e74c3c', color: '#fff', borderRadius: 20, padding: '2px 7px', fontSize: '0.62rem', fontWeight: 900 }}>NEW</span>}
 <KpiCard {...k} />
 </div>
 ))}
 </div>

 {/* Chart + sidebar */}
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 20 }} className="dash-grid">
 {/* Chart panel */}
 <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
 {/* Header */}
 <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f4f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
 {/* Mode toggle */}
 <div style={{ display: 'flex', background: '#f0f4f8', borderRadius: 9, padding: 3, gap: 2 }}>
 {[['sales', 'fa-chart-bar', 'ยอดขาย/จอง'], ['inquiries', 'fa-envelope', 'ข้อความ']].map(([mode, icon, lbl]) => (
 <button key={mode} onClick={() => setChartMode(mode)}
 style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 13px', borderRadius: 7, border: 'none', cursor: 'pointer', background: chartMode === mode ? '#fff' : 'transparent', color: chartMode === mode ? N : '#94a3b8', fontWeight: chartMode === mode ? 800 : 500, fontSize: '0.78rem', boxShadow: chartMode === mode ? '0 1px 4px rgba(0,0,0,0.10)' : 'none', transition: 'all 0.15s', fontFamily: "'Sarabun',sans-serif" }}>
 <i className={`fas ${icon}`} style={{ fontSize: '0.7rem' }} />{lbl}
 </button>
 ))}
 </div>
 {/* Period selector — แสดงทั้ง 2 mode */}
 <div style={{ display: 'flex', background: '#f0f4f8', borderRadius: 9, padding: 3, gap: 2 }}>
 {PERIOD_OPTS.map(([val, lbl]) => (
 <button key={val} onClick={() => setChartPeriod(val)} style={{ padding: '5px 13px', borderRadius: 7, border: 'none', cursor: 'pointer', background: chartPeriod === val ? '#fff' : 'transparent', color: chartPeriod === val ? N : '#94a3b8', fontWeight: chartPeriod === val ? 800 : 500, fontSize: '0.78rem', boxShadow: chartPeriod === val ? '0 1px 4px rgba(0,0,0,0.10)' : 'none', transition: 'all 0.15s', fontFamily: "'Sarabun',sans-serif" }}>{lbl}</button>
 ))}
 </div>
 </div>
 {/* Chart body */}
 <div style={{ padding: '20px 20px 8px' }}>
 {chartMode === 'sales'
 ? <SalesTimelineChart data={salesChartData} loading={salesChartLoading} />
 : <BarChart data={chartData} loading={chartLoading} />
 }
 </div>
 {/* Footer */}
 <div style={{ padding: '6px 20px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 {chartMode === 'sales' ? (
 <>
 <span style={{ fontSize: '0.78rem', color: '#888' }}>
 ขาย <strong style={{ color: '#7c3aed' }}>{salesChartData.reduce((s, d) => s + d.sold, 0)}</strong>{' '}จอง <strong style={{ color: '#f59e0b' }}>{salesChartData.reduce((s, d) => s + d.reserved, 0)}</strong> รายการ
 </span>
 <span style={{ fontSize: '0.72rem', color: '#bbb' }}>{chartPeriod === 'week' ? '7 วันล่าสุด' : chartPeriod === 'month' ? '30 วันล่าสุด' : '12 เดือนล่าสุด'}</span>
 </>
 ) : (
 <>
 <span style={{ fontSize: '0.78rem', color: '#888' }}>รวม <strong style={{ color: G }}>{chartTotal}</strong> ข้อความ</span>
 <span style={{ fontSize: '0.72rem', color: '#bbb' }}>{chartPeriod === 'week' ? '7 วันล่าสุด' : chartPeriod === 'month' ? '30 วันล่าสุด' : '12 เดือนล่าสุด'}</span>
 </>
 )}
 </div>
 </div>

 {/* Right col */}
 <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
 <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
 <div style={{ padding: '13px 18px', borderBottom: '1px solid #f0f4f8' }}><div style={{ fontWeight: 800, fontSize: '0.92rem', color: N }}> Quick Actions</div></div>
 <div style={{ padding: '6px 0' }}>
 {[
 { icon: 'fa-plus-circle', label: 'เพิ่มทรัพย์ใหม่', link: '/admin/properties/new', color: G },
 { icon: 'fa-list', label: 'จัดการทรัพย์', link: '/admin/properties', color: '#0891b2' },
 { icon: 'fa-envelope-open', label: 'ดูข้อความทั้งหมด', link: '/admin/inquiries', color: '#e74c3c' },
 { icon: 'fa-globe', label: 'ดูหน้าเว็บ', link: '/', color: '#7c3aed' },
 ].map((a, i) => (
 <Link key={i} to={a.link} style={{ textDecoration: 'none' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 18px', cursor: 'pointer', transition: 'background 0.12s' }}
 onMouseEnter={e => e.currentTarget.style.background = '#f8fffe'}
 onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
 <div style={{ width: 30, height: 30, borderRadius: 8, background: `${a.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
 <i className={`fas ${a.icon}`} style={{ color: a.color, fontSize: '0.82rem' }} />
 </div>
 <span style={{ fontSize: '0.83rem', fontWeight: 600, color: '#333' }}>{a.label}</span>
 <i className="fas fa-chevron-right" style={{ marginLeft: 'auto', color: '#ddd', fontSize: '0.6rem' }} />
 </div>
 </Link>
 ))}
 </div>
 </div>
 <div style={{ background: `linear-gradient(135deg,${N},#6aab62)`, borderRadius: 16, padding: '16px 18px', color: '#fff' }}>
 <div style={{ fontWeight: 800, fontSize: '0.88rem', marginBottom: 12, opacity: 0.9 }}><i className="fas fa-chart-pie" style={{ marginRight: 7 }} />สรุปทรัพย์</div>
 {[
 { label: 'รายการขาย', value: stats.for_sale, color: '#4ade80' },
 { label: 'รายการเช่า', value: stats.for_rent, color: '#60a5fa' },
 { label: 'ครอบคลุม', value: `${stats.province_count} จว.`, color: '#fbbf24' },
 ].map((s, i) => (
 <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
 <span style={{ fontSize: '0.8rem', opacity: 0.72 }}>{s.label}</span>
 <span style={{ fontWeight: 800, fontSize: '0.95rem', color: s.color }}>{loading ? '—' : s.value}</span>
 </div>
 ))}
 </div>
 {/* ── สรุปรายการขาย ── */}
 <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
 <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f4f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <div style={{ fontWeight: 800, fontSize: '0.88rem', color: N }}>
 <i className="fas fa-receipt" style={{ color: G, marginRight: 7 }} />สรุปรายการขาย
 </div>
 <div style={{ display: 'flex', background: '#f0f4f8', borderRadius: 7, padding: 2, gap: 1 }}>
 {[['week', '7 วัน'], ['month', 'เดือน'], ['year', 'ปี']].map(([p, lbl]) => (
 <button key={p} onClick={() => setSummaryPeriod(p)}
 style={{ padding: '3px 9px', borderRadius: 5, border: 'none', cursor: 'pointer', background: summaryPeriod === p ? '#fff' : 'transparent', color: summaryPeriod === p ? N : '#94a3b8', fontWeight: summaryPeriod === p ? 800 : 500, fontSize: '0.72rem', boxShadow: summaryPeriod === p ? '0 1px 3px rgba(0,0,0,0.10)' : 'none', fontFamily: "'Sarabun',sans-serif" }}>
 {lbl}
 </button>
 ))}
 </div>
 </div>
 <div style={{ padding: '14px 16px' }}>
 {[
 { label: 'ขายแล้ว', key: 'sold', color: '#7c3aed', icon: 'fa-check-circle', bg: '#f3e8ff' },
 { label: 'จองแล้ว', key: 'reserved', color: '#f59e0b', icon: 'fa-bookmark', bg: '#fef3c7' },
 ].map(item => {
 const val = salesSummary[summaryPeriod]?.[item.key] ?? 0;
 return (
 <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: item.key === 'sold' ? '1px solid #f5f7fa' : 'none' }}>
 <div style={{ width: 32, height: 32, borderRadius: 8, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
 <i className={`fas ${item.icon}`} style={{ color: item.color, fontSize: '0.85rem' }} />
 </div>
 <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 600, color: '#555' }}>{item.label}</span>
 <span style={{ fontWeight: 900, fontSize: '1.3rem', color: item.color }}>{val}</span>
 <span style={{ fontSize: '0.68rem', color: '#aaa' }}>รายการ</span>
 </div>
 );
 })}
 <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #f5f7fa', display: 'flex', justifyContent: 'space-between' }}>
 <span style={{ fontSize: '0.7rem', color: '#bbb' }}>
 {summaryPeriod === 'week' ? '7 วันล่าสุด' : summaryPeriod === 'month' ? '30 วันล่าสุด' : 'ปีนี้'}
 </span>
 <span style={{ fontSize: '0.7rem', color: '#bbb' }}>
 รวมทั้งหมด: <strong style={{ color: '#7c3aed' }}>{salesSummary.total?.sold ?? 0}</strong> ขาย / <strong style={{ color: '#f59e0b' }}>{salesSummary.total?.reserved ?? 0}</strong> จอง
 </span>
 </div>
 </div>
 </div>

 <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', padding: '14px 16px' }}>
 <div style={{ fontWeight: 800, fontSize: '0.85rem', color: N, marginBottom: 10 }}> ช่องทางติดต่อ</div>
 <a href="https://line.me/R/ti/p/@loan_dd" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 8, background: '#e8f8f0', marginBottom: 7 }}>
 <i className="fab fa-line" style={{ color: '#06C755', fontSize: '1.05rem' }} />
 <div><div style={{ fontWeight: 700, fontSize: '0.8rem', color: N }}>LINE OA</div><div style={{ fontSize: '0.7rem', color: '#888' }}>@loan_dd</div></div>
 </div>
 </a>
 <a href="tel:081-638-6966" style={{ textDecoration: 'none' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 8, background: '#e8f4fd' }}>
 <i className="fas fa-phone-alt" style={{ color: '#2980b9', fontSize: '1.05rem' }} />
 <div><div style={{ fontWeight: 700, fontSize: '0.8rem', color: N }}>โทรศัพท์</div><div style={{ fontSize: '0.7rem', color: '#888' }}>081-638-6966</div></div>
 </div>
 </a>
 </div>
 </div>
 </div>
 </>
 )}

 {/* ══════════════════ TAB 1 — ทรัพย์ (full embedded table) ══════════════════ */}
 {activeTab === 1 && (
 <div>
 {/* Filter bar */}
 <div style={{ background: '#fff', borderRadius: 12, padding: '13px 16px', marginBottom: 14, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
 <input
 type="text"
 placeholder=" ค้นหาชื่อ, จังหวัด, อำเภอ..."
 value={propSearch}
 onChange={e => setPropSearch(e.target.value)}
 onKeyDown={e => e.key === 'Enter' && fetchProperties(1)}
 style={{ flex: 1, minWidth: 200, padding: '8px 12px', border: '1.5px solid #dde', borderRadius: 7, fontSize: '0.88rem', outline: 'none', color: '#111827', background: '#fff', fontFamily: "'Sarabun',sans-serif" }}
 />
 <select value={propStatus} onChange={e => setPropStatus(e.target.value)} style={{ padding: '8px 12px', border: '1.5px solid #dde', borderRadius: 7, fontSize: '0.88rem', background: '#fff', color: '#111827', fontFamily: "'Sarabun',sans-serif" }}>
 <option value="">ทุกสถานะ</option>
 <option value="available">ว่างอยู่</option>
 <option value="reserved">จองแล้ว</option>
 <option value="sold">ขายแล้ว</option>
 </select>
 <button onClick={() => fetchProperties(1)} style={{ background: N, color: '#fff', border: 'none', borderRadius: 7, padding: '8px 18px', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', fontFamily: "'Sarabun',sans-serif" }}>ค้นหา</button>
 {(propSearch || propStatus) && (
 <button onClick={() => { setPropSearch(''); setPropStatus(''); }} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '0.82rem' }}> ล้าง</button>
 )}
 <div style={{ marginLeft: 'auto' }}>
 <button onClick={() => navigate('/admin/properties/new')} style={{ background: G, border: 'none', color: '#fff', padding: '8px 18px', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 7, fontFamily: "'Sarabun',sans-serif" }}>
 <i className="fas fa-plus" /> เพิ่มทรัพย์ใหม่
 </button>
 </div>
 </div>

 {/* Table */}
 <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
 {propLoading ? (
 <div style={{ textAlign: 'center', padding: '60px', color: '#aaa' }}><i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem' }} /></div>
 ) : properties.length === 0 ? (
 <div style={{ textAlign: 'center', padding: '60px', color: '#aaa' }}>
 <i className="fas fa-home" style={{ fontSize: '2.5rem', display: 'block', marginBottom: 10 }} />
 <p>ยังไม่มีทรัพย์สิน</p>
 <button onClick={() => navigate('/admin/properties/new')} style={{ background: G, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 700, fontFamily: "'Sarabun',sans-serif" }}>+ เพิ่มทรัพย์แรก</button>
 </div>
 ) : (
 <div style={{ overflowX: 'auto' }}>
 <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
 <thead>
 <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e8edf2' }}>
 {['รูป', 'ชื่อทรัพย์', 'ประเภท', 'สถานะ', 'ราคา', '', '', 'แก้โดย', '', 'จัดการ'].map((h, hi) => (
 <th key={hi} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#555', whiteSpace: 'nowrap' }}>{h}</th>
 ))}
 </tr>
 </thead>
 <tbody>
 {properties.map(p => {
 const sc = SALE_STATUS[p.sale_status] || SALE_STATUS.available;
 return (
 <tr key={p.id} style={{ borderBottom: '1px solid #f0f4f8', transition: 'background 0.1s' }}
 onMouseEnter={e => e.currentTarget.style.background = '#fafcff'}
 onMouseLeave={e => e.currentTarget.style.background = ''}>
 {/* รูป */}
 <td style={{ padding: '8px 12px' }}>
 <div style={{ width: 56, height: 44, borderRadius: 6, overflow: 'hidden', background: '#e8edf2' }}>
 {p.thumbnail_url
 ? <img src={p.thumbnail_url.startsWith('http') ? p.thumbnail_url : `${BASE_URL}${p.thumbnail_url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
 : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: '1.2rem' }}><i className="fas fa-home" /></div>
 }
 </div>
 </td>
 {/* ชื่อ */}
 <td style={{ padding: '8px 12px', maxWidth: 220 }}>
 <div style={{ fontWeight: 700, color: N, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
 <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 1 }}>{p.province}{p.district ? ` · ${p.district}` : ''}</div>
 <div style={{ fontSize: '0.72rem', color: '#bbb' }}>#{String(p.id).padStart(4, '0')}</div>
 </td>
 {/* ประเภท */}
 <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
 <div style={{ fontSize: '0.8rem', color: '#555' }}>{TYPE_LABEL[p.property_type] || p.property_type}</div>
 <div style={{ fontSize: '0.72rem', color: '#888' }}>{LISTING_LABEL[p.listing_type]}</div>
 </td>
 {/* สถานะ dropdown */}
 <td style={{ padding: '8px 12px' }}>
 <select value={p.sale_status} onChange={e => quickStatus(p.id, e.target.value)}
 style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}`, borderRadius: 6, padding: '3px 7px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Sarabun',sans-serif" }}>
 <option value="available">ว่างอยู่</option>
 <option value="reserved">จองแล้ว</option>
 <option value="sold">ขายแล้ว</option>
 </select>
 </td>
 {/* ราคา */}
 <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
 <div style={{ fontWeight: 700, color: '#6aab62' }}>฿{fmtPrice(p.price_requested || p.monthly_rent)}</div>
 {p.listing_type === 'rent' && <div style={{ fontSize: '0.72rem', color: '#888' }}>/เดือน</div>}
 </td>
 {/* รูปภาพ count */}
 <td style={{ padding: '8px 12px', textAlign: 'center' }}>
 <span style={{ fontSize: '0.82rem', color: p.image_count > 0 ? G : '#ccc', fontWeight: 600 }}>{p.image_count || 0}</span>
 </td>
 {/* Inquiry count */}
 <td style={{ padding: '8px 12px', textAlign: 'center' }}>
 <span style={{ fontSize: '0.82rem', color: p.inquiry_count > 0 ? '#e8a020' : '#ccc', fontWeight: 600 }}>{p.inquiry_count || 0}</span>
 </td>
 {/* แก้โดย */}
 <td style={{ padding: '8px 12px', textAlign: 'center' }}>
 <span title={`สร้างโดย: ${p.created_by_admin || '-'}\nแก้ล่าสุด: ${p.updated_by_admin || '-'}`} style={{ fontSize: '0.75rem', color: p.updated_by_admin ? '#4b5563' : '#ccc', cursor: 'help' }}>
 {p.updated_by_admin ? <><i className="fas fa-user-edit" style={{ marginRight: 3, color: '#6b7280' }} />{p.updated_by_admin}</> : '—'}
 </span>
 </td>
 {/* featured */}
 <td style={{ padding: '8px 12px', textAlign: 'center' }}>
 <button onClick={() => toggleFeatured(p.id, p.is_featured)} title={p.is_featured ? 'ยกเลิกแนะนำ' : 'ตั้งเป็นแนะนำ'}
 style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: p.is_featured ? '#e8a020' : '#ddd' }}></button>
 </td>
 {/* จัดการ */}
 <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
 <div style={{ display: 'flex', gap: 6 }}>
 <button onClick={() => window.open(`/property/${p.id}`, '_blank')} title="ดูหน้าเว็บ" style={actionBtn('#e8f4fd', '#2980b9')}><i className="fas fa-eye" /></button>
 <button onClick={() => navigate(`/admin/properties/${p.id}/edit`)} title="แก้ไข" style={actionBtn('#e8f8f2', G)}><i className="fas fa-edit" /></button>
 <button onClick={() => setDelConfirm(p)} title="ลบ" style={actionBtn('#fff0f0', '#c0392b')}><i className="fas fa-trash" /></button>
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}
 </div>

 {/* Pagination — arrows + page counter (always visible) */}
 {properties.length > 0 && (() => {
 const totalPages = Math.max(1, propPag.totalPages || 1);
 const cur = propPag.page || 1;
 const canPrev = cur > 1;
 const canNext = cur < totalPages;
 const arrowBtn = (icon, enabled, onClick) => (
 <button onClick={enabled ? onClick : undefined} disabled={!enabled}
 style={{
 width: 42, height: 42, borderRadius: '50%',
 border: `1.5px solid ${enabled ? 'rgba(26,58,24,0.25)' : 'rgba(0,0,0,0.08)'}`,
 background: enabled ? '#fff' : 'transparent',
 color: enabled ? '#1a3a18' : 'rgba(0,0,0,0.25)',
 cursor: enabled ? 'pointer' : 'not-allowed',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 fontSize: '0.85rem',
 transition: 'all 0.2s',
 boxShadow: enabled ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
 }}
 onMouseEnter={e => { if (enabled) { e.currentTarget.style.background = '#1a3a18'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#1a3a18'; } }}
 onMouseLeave={e => { if (enabled) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#1a3a18'; e.currentTarget.style.borderColor = 'rgba(26,58,24,0.25)'; } }}
 >
 <i className={`fas ${icon}`} />
 </button>
 );
 return (
 <div className="search-pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 24, flexWrap: 'wrap' }}>
 {arrowBtn('fa-arrow-left', canPrev, () => fetchProperties(cur - 1))}
 <div style={{
 fontSize: '0.9rem', fontWeight: 600, color: '#1a3a18',
 fontFamily: "'Manrope', sans-serif", letterSpacing: '0.1em',
 minWidth: 70, textAlign: 'center',
 }}>
 <span style={{ fontSize: '1.1rem' }}>{String(cur).padStart(2, '0')}</span>
 <span style={{ margin: '0 8px', opacity: 0.4 }}>/</span>
 <span style={{ opacity: 0.55 }}>{String(totalPages).padStart(2, '0')}</span>
 </div>
 {arrowBtn('fa-arrow-right', canNext, () => fetchProperties(cur + 1))}
 </div>
 );
 })()}

 {/* total count */}
 <div style={{ textAlign: 'center', marginTop: 10, fontSize: '0.78rem', color: '#aaa' }}>
 แสดง {properties.length} จาก {propPag.total} รายการ
 </div>
 </div>
 )}

 {/* ══════════════════ TAB 2 — ข้อความ ══════════════════ */}
 {activeTab === 2 && (
 <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
 {/* Header */}
 <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f4f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
 <div>
 <div style={{ fontWeight: 800, fontSize: '1rem', color: N }}><i className="fas fa-envelope" style={{ color: G, marginRight: 8 }} />ข้อความทั้งหมด</div>
 <div style={{ fontSize: '0.74rem', color: '#888', marginTop: 2 }}>
 {newCount > 0 && <span style={{ color: '#e74c3c', fontWeight: 700, marginRight: 10 }}><i className="fas fa-circle" style={{ fontSize: '0.5rem', marginRight: 4 }} />{newCount} อสังหาใหม่</span>}
 {contacts.length > 0 && <span style={{ color: '#27ae60', fontWeight: 700 }}> {contacts.length} ติดต่อทั่วไป</span>}
 </div>
 </div>
 {/* Sub-tab switcher */}
 <div style={{ display: 'flex', background: '#f0f4f8', borderRadius: 10, padding: 3, gap: 2 }}>
 <button onClick={() => setMsgMainTab('property')}
 style={{ padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.78rem', background: msgMainTab === 'property' ? '#fff' : 'transparent', color: msgMainTab === 'property' ? N : '#94a3b8', fontWeight: msgMainTab === 'property' ? 800 : 500, fontFamily: "'Sarabun',sans-serif", boxShadow: msgMainTab === 'property' ? '0 1px 4px rgba(0,0,0,0.10)' : 'none', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5 }}>
 อสังหา
 {newCount > 0 && <span style={{ background: '#e74c3c', color: '#fff', borderRadius: 20, padding: '0 5px', fontSize: '0.6rem', fontWeight: 900 }}>{newCount}</span>}
 </button>
 <button onClick={() => setMsgMainTab('contact')}
 style={{ padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.78rem', background: msgMainTab === 'contact' ? '#fff' : 'transparent', color: msgMainTab === 'contact' ? N : '#94a3b8', fontWeight: msgMainTab === 'contact' ? 800 : 500, fontFamily: "'Sarabun',sans-serif", boxShadow: msgMainTab === 'contact' ? '0 1px 4px rgba(0,0,0,0.10)' : 'none', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5 }}>
 ติดต่อ
 {contacts.length > 0 && <span style={{ background: '#27ae60', color: '#fff', borderRadius: 20, padding: '0 5px', fontSize: '0.6rem', fontWeight: 900 }}>{contacts.length}</span>}
 </button>
 </div>
 </div>

 {/* ── Property Inquiries sub-tab ── */}
 {msgMainTab === 'property' && (
 <>
 <div style={{ padding: '10px 20px', borderBottom: '1px solid #f5f7fa', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
 {[['', 'ทั้งหมด'], ['new', 'ใหม่'], ['contacted', 'ติดต่อแล้ว'], ['closed', 'ปิดแล้ว']].map(([val, lbl]) => (
 <button key={val} onClick={() => setMsgFilter(val)} style={{ padding: '4px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: '0.75rem', background: msgFilter === val ? N : '#f0f4f8', color: msgFilter === val ? '#fff' : '#666', fontWeight: msgFilter === val ? 700 : 500, fontFamily: "'Sarabun',sans-serif", transition: 'all 0.15s' }}>{lbl}</button>
 ))}
 </div>
 {loading ? (
 <div style={{ padding: 60, textAlign: 'center', color: '#ccc' }}><i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem' }} /></div>
 ) : filteredInq.length === 0 ? (
 <div style={{ padding: '50px 20px', textAlign: 'center', color: '#bbb' }}>
 <i className="fas fa-inbox" style={{ fontSize: '2.2rem', display: 'block', marginBottom: 10 }} />
 <p style={{ margin: 0 }}>ไม่มีข้อความ{msgFilter ? 'ในสถานะนี้' : ''}</p>
 </div>
 ) : (
 pagedInq.map((inq, i) => {
 const sc = INQ_STATUS[inq.status] || INQ_STATUS.new;
 const isNew = inq.status === 'new';
 const handleOpen = (e) => {
 if (isNew) updateInqStatus(inq.id, 'contacted');
 };
 return (
 <div key={inq.id} style={{ display: 'flex', gap: 13, padding: '13px 20px', borderBottom: i < pagedInq.length - 1 ? '1px solid #f5f7fa' : 'none', alignItems: 'flex-start', background: isNew ? '#fffbf0' : '#fff', transition: 'background 0.15s' }}
 onMouseEnter={e => e.currentTarget.style.background = '#f0faf6'}
 onMouseLeave={e => e.currentTarget.style.background = isNew ? '#fffbf0' : '#fff'}>
 <Link to="/admin/inquiries" onClick={handleOpen} style={{ display: 'flex', gap: 13, flex: 1, minWidth: 0, textDecoration: 'none', color: 'inherit', alignItems: 'flex-start' }}>
 <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: isNew ? '#ffeaa7' : '#e8f7ee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.85rem', color: isNew ? '#d4890a' : G }}>
 {(inq.name || '?').charAt(0).toUpperCase()}
 </div>
 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
 <span style={{ fontWeight: 700, fontSize: '0.88rem', color: N }}>{inq.name}</span>
 <span style={{ background: sc.bg, color: sc.color, fontSize: '0.68rem', fontWeight: 700, padding: '1px 7px', borderRadius: 20 }}>{sc.label}</span>
 {isNew && <span style={{ background: '#e74c3c', color: '#fff', fontSize: '0.6rem', fontWeight: 900, padding: '1px 5px', borderRadius: 8 }}>NEW</span>}
 </div>
 <div style={{ fontSize: '0.78rem', color: G, fontWeight: 700, marginBottom: 2 }}><i className="fas fa-phone" style={{ marginRight: 4, fontSize: '0.7rem' }} />{inq.phone}</div>
 {inq.property_title && <div style={{ fontSize: '0.75rem', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}> {inq.property_title}</div>}
 {inq.message && <div style={{ fontSize: '0.75rem', color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>"{inq.message}"</div>}
 </div>
 </Link>
 <div style={{ flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
 <div style={{ fontSize: '0.7rem', color: '#bbb' }}>{new Date(inq.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</div>
 <div style={{ fontSize: '0.68rem', color: '#ccc' }}>{new Date(inq.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
 {inq.status !== 'closed' && (
 <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateInqStatus(inq.id, 'closed'); }}
 style={{ background: '#f0f4f8', border: '1px solid #dde3ea', color: '#555', borderRadius: 6, padding: '3px 8px', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Sarabun',sans-serif", marginTop: 2 }}>
 <i className="fas fa-check" style={{ marginRight: 3, fontSize: '0.6rem' }} />ปิดเคส
 </button>
 )}
 </div>
 </div>
 );
 })
 )}
 {filteredInq.length > 0 && (() => {
 const canPrev = inqCurPage > 1;
 const canNext = inqCurPage < inqTotalPages;
 const ab = (icon, enabled, onClick) => (
 <button onClick={enabled ? onClick : undefined} disabled={!enabled}
 style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid #e3e9ef', background: enabled ? '#fff' : '#f5f7fa', color: enabled ? N : '#ccc', cursor: enabled ? 'pointer' : 'not-allowed', fontSize: '0.82rem' }}>
 <i className={`fas ${icon}`} />
 </button>
 );
 return (
 <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, padding: '12px 20px', borderTop: '1px solid #f0f4f8' }}>
 {ab('fa-arrow-left', canPrev, () => setInqPage(inqCurPage - 1))}
 <div style={{ fontSize: '0.85rem', fontWeight: 700, color: N, minWidth: 70, textAlign: 'center' }}>
 <span>{String(inqCurPage).padStart(2, '0')}</span>
 <span style={{ opacity: 0.55 }}> / </span>
 <span style={{ opacity: 0.55 }}>{String(inqTotalPages).padStart(2, '0')}</span>
 </div>
 {ab('fa-arrow-right', canNext, () => setInqPage(inqCurPage + 1))}
 </div>
 );
 })()}
 </>
 )}

 {/* ── Contact Messages sub-tab ── */}
 {msgMainTab === 'contact' && (
 <>
 {loading ? (
 <div style={{ padding: 60, textAlign: 'center', color: '#ccc' }}><i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem' }} /></div>
 ) : contacts.length === 0 ? (
 <div style={{ padding: '50px 20px', textAlign: 'center', color: '#bbb' }}>
 <i className="fas fa-comments" style={{ fontSize: '2.2rem', display: 'block', marginBottom: 10 }} />
 <p style={{ margin: 0 }}>ยังไม่มีข้อความติดต่อทั่วไป</p>
 </div>
 ) : (
 pagedContacts.map((c, i) => (
 <Link key={c.id} to="/admin/inquiries" style={{ textDecoration: 'none' }}>
 <div style={{ display: 'flex', gap: 13, padding: '13px 20px', borderBottom: i < pagedContacts.length - 1 ? '1px solid #f5f7fa' : 'none', alignItems: 'flex-start', background: '#f9fff9', transition: 'background 0.15s' }}
 onMouseEnter={e => e.currentTarget.style.background = '#f0faf6'}
 onMouseLeave={e => e.currentTarget.style.background = '#f9fff9'}>
 <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: '#e8f8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.85rem', color: '#27ae60' }}>
 {(c.name || '?').charAt(0).toUpperCase()}
 </div>
 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
 <span style={{ fontWeight: 700, fontSize: '0.88rem', color: N }}>{c.name}</span>
 <span style={{ background: '#eafaf0', color: '#27ae60', fontSize: '0.68rem', fontWeight: 700, padding: '1px 7px', borderRadius: 20, border: '1px solid #a8e0b8' }}>ติดต่อทั่วไป</span>
 </div>
 <div style={{ fontSize: '0.78rem', color: G, fontWeight: 700, marginBottom: 2 }}><i className="fas fa-phone" style={{ marginRight: 4, fontSize: '0.7rem' }} />{c.phone}</div>
 {/* Topic — คำถาม */}
 {c.topic && (
 <div style={{ fontSize: '0.75rem', background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 5, padding: '2px 7px', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
 <i className="fas fa-question-circle" style={{ color: '#f59e0b', fontSize: '0.65rem' }} />
 <span style={{ fontWeight: 700, color: '#92400e' }}>{c.topic}</span>
 </div>
 )}
 {c.message && <div style={{ fontSize: '0.75rem', color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>"{c.message}"</div>}
 </div>
 <div style={{ flexShrink: 0, textAlign: 'right' }}>
 <div style={{ fontSize: '0.7rem', color: '#bbb' }}>{new Date(c.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</div>
 <div style={{ fontSize: '0.68rem', color: '#ccc' }}>{new Date(c.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
 <i className="fas fa-chevron-right" style={{ color: '#ddd', fontSize: '0.6rem', marginTop: 4, display: 'block' }} />
 </div>
 </div>
 </Link>
 ))
 )}
 {contacts.length > 0 && (() => {
 const canPrev = contactCurPage > 1;
 const canNext = contactCurPage < contactTotalPages;
 const ab = (icon, enabled, onClick) => (
 <button onClick={enabled ? onClick : undefined} disabled={!enabled}
 style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid #e3e9ef', background: enabled ? '#fff' : '#f5f7fa', color: enabled ? N : '#ccc', cursor: enabled ? 'pointer' : 'not-allowed', fontSize: '0.82rem' }}>
 <i className={`fas ${icon}`} />
 </button>
 );
 return (
 <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, padding: '12px 20px', borderTop: '1px solid #f0f4f8' }}>
 {ab('fa-arrow-left', canPrev, () => setContactPage(contactCurPage - 1))}
 <div style={{ fontSize: '0.85rem', fontWeight: 700, color: N, minWidth: 70, textAlign: 'center' }}>
 <span>{String(contactCurPage).padStart(2, '0')}</span>
 <span style={{ opacity: 0.55 }}> / </span>
 <span style={{ opacity: 0.55 }}>{String(contactTotalPages).padStart(2, '0')}</span>
 </div>
 {ab('fa-arrow-right', canNext, () => setContactPage(contactCurPage + 1))}
 </div>
 );
 })()}
 </>
 )}
 </div>
 )}

 {/* ══════════════════ TAB 3 — ผู้ใช้ ══════════════════ */}
 {activeTab === 3 && (
 <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', padding: '20px 24px' }}>
 <div style={{ marginBottom: 16 }}>
 <div style={{ fontWeight: 800, fontSize: '1rem', color: N }}>
 <i className="fas fa-users" style={{ color: G, marginRight: 8 }} />จัดการผู้ใช้
 </div>
 <div style={{ fontSize: '0.78rem', color: '#aaa', marginTop: 2 }}>ดู แก้ไข และลบบัญชีผู้ใช้งานในระบบ</div>
 </div>
 <UsersPanel />
 </div>
 )}
 </div>

 {/* ── DELETE MODAL ── */}
 {delConfirm && (
 <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
 <div style={{ background: '#fff', borderRadius: 14, padding: '28px 24px', maxWidth: 380, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
 <div style={{ textAlign: 'center', marginBottom: 16 }}>
 <i className="fas fa-exclamation-triangle" style={{ fontSize: '2.5rem', color: '#e74c3c', marginBottom: 10, display: 'block' }} />
 <h3 style={{ margin: 0, color: N }}>ยืนยันการลบ?</h3>
 <p style={{ color: '#666', fontSize: '0.88rem', marginTop: 8 }}>ลบทรัพย์ "<strong>{delConfirm.title}</strong>"<br />ไม่สามารถกู้คืนได้</p>
 </div>
 <div style={{ display: 'flex', gap: 10 }}>
 <button onClick={() => setDelConfirm(null)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1.5px solid #dde', background: '#fff', cursor: 'pointer', fontWeight: 600, fontFamily: "'Sarabun',sans-serif" }}>ยกเลิก</button>
 <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#e74c3c', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: "'Sarabun',sans-serif" }}>
 {deleting ? <><i className="fas fa-spinner fa-spin" /> กำลังลบ...</> : 'ลบเลย'}
 </button>
 </div>
 </div>
 </div>
 )}

 <style>{`
 @media (max-width: 768px) {
 .dash-grid { grid-template-columns: 1fr !important; }
 }
 @keyframes pulse-inq {
 0%, 100% { box-shadow: 0 4px 18px rgba(231,76,60,0.35); }
 50% { box-shadow: 0 4px 28px rgba(231,76,60,0.6); }
 }
 `}</style>
 </div>
 );
}
