import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import adminFetch, { BASE_URL } from '../../utils/adminFetch';
import '../../css/adminMobile.css';

const G = '#3d7a3a'; const Gl = '#A1D99B';
const N = '#3d7a3a';

const handleAdminLogout = (navigate) => {
 localStorage.removeItem('adminToken');
 localStorage.removeItem('adminUser');
 navigate('/admin');
};

const API = BASE_URL;

const TYPE_LABEL = { house: 'บ้านเดี่ยว', condo: 'คอนโด', townhouse: 'ทาวน์เฮ้าส์', townhome: 'ทาวน์โฮม', land: 'ที่ดิน', apartment: 'อพาร์ทเม้นท์', commercial: 'อาคารพาณิชย์' };
const STATUS_CONF = {
 available: { label: 'ว่างอยู่', bg: '#e8f8f2', color: '#A1D99B' },
 reserved: { label: 'จองแล้ว', bg: '#fffbe6', color: '#d4890a' },
 sold: { label: 'ขายแล้ว', bg: '#fff0f0', color: '#c0392b' },
};
const LISTING_LABEL = { sale: 'ขาย', rent: 'เช่า', sale_rent: 'ขาย/เช่า' };

const fmt = (n) => {
 if (!n) return '—';
 const num = Number(n);
 if (num >= 1e6) return `${(num / 1e6).toFixed(2).replace(/\.?0+$/, '')} ล้าน`;
 return num.toLocaleString('th-TH');
};

function AdminProperties() {
 const navigate = useNavigate();
 const [properties, setProperties] = useState([]);
 const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1 });
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState('');
 const [statusFilter, setStatusFilter] = useState('');
 const [delConfirm, setDelConfirm] = useState(null);
 const [deleting, setDeleting] = useState(false);

 const fetchProperties = useCallback((page = 1) => {
 setLoading(true);
 const params = new URLSearchParams({ page, limit: 15 });
 if (search) params.set('search', search);
 if (statusFilter) params.set('status', statusFilter);

 adminFetch(`/api/admin/properties?${params}`)
 .then(r => r.json())
 .then(data => {
 setProperties(data.data || []);
 setPagination(data.pagination || { total: 0, totalPages: 1, page: 1 });
 })
 .catch(() => setProperties([]))
 .finally(() => setLoading(false));
 }, [search, statusFilter]);

 useEffect(() => { fetchProperties(1); }, [fetchProperties]);

 // Re-fetch เมื่อ user สลับแท็บกลับมา
 useEffect(() => {
 const onVis = () => { if (!document.hidden) fetchProperties(pagination.page); };
 document.addEventListener('visibilitychange', onVis);
 return () => document.removeEventListener('visibilitychange', onVis);
 }, [fetchProperties, pagination.page]);

 const handleDelete = async () => {
 if (!delConfirm) return;
 setDeleting(true);
 try {
 const res = await adminFetch(`/api/admin/properties/${delConfirm.id}`, { method: 'DELETE' });
 if (res.ok) {
 setDelConfirm(null);
 fetchProperties(pagination.page);
 } else {
 alert('ลบไม่สำเร็จ');
 }
 } finally {
 setDeleting(false);
 }
 };

 const quickStatus = async (id, newStatus) => {
 await adminFetch(`/api/admin/properties/${id}`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ sale_status: newStatus })
 });
 fetchProperties(pagination.page);
 };

 const toggleFeatured = async (id, cur) => {
 await adminFetch(`/api/admin/properties/${id}`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ is_featured: cur ? 0 : 1 })
 });
 fetchProperties(pagination.page);
 };

 const adminUser = (() => { try { return JSON.parse(localStorage.getItem('adminUser') || '{}'); } catch { return {}; } })();

 return (
 <div style={{ minHeight: '100vh', background: '#f5f7fa', fontFamily: "'Sarabun',sans-serif" }}>

 {/* ===== NAVBAR (same style as Dashboard) ===== */}
 <div style={{ background: `linear-gradient(135deg,${N},#6aab62)`, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,0.18)' }}>
 {/* Logo */}
 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
 <div style={{ fontWeight: 900, fontSize: '1.25rem', color: '#1a3a18', letterSpacing: 1 }}>
 LOAN<span style={{ color: G }}>DD</span>
 </div>
 <span style={{ background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.85)', fontSize: '0.7rem', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>Admin</span>
 </div>

 {/* User + actions */}
 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
 <button
 onClick={() => navigate('/admin/properties/new')}
 style={{ background: Gl, border: 'none', color: '#1a3a18', padding: '6px 16px', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Sarabun',sans-serif" }}
 >
 <i className="fas fa-plus" /> เพิ่มทรัพย์ใหม่
 </button>
 <div style={{ width: 32, height: 32, borderRadius: '50%', background: Gl, color: '#1a3a18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.82rem' }}>
 {(adminUser.username || 'A').charAt(0).toUpperCase()}
 </div>
 <span className="admin-nav-username" style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600 }}>{adminUser.username || 'Admin'}</span>
 <button
 onClick={() => handleAdminLogout(navigate)}
 style={{ background: 'rgba(220,38,38,0.15)', border: '1.5px solid rgba(220,38,38,0.4)', color: '#fca5a5', padding: '5px 12px', borderRadius: 7, fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Sarabun',sans-serif" }}
 >
 <i className="fas fa-sign-out-alt" /> ออก
 </button>
 </div>
 </div>

 {/* ===== PILL TAB NAV ===== */}
 <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px 0' }}>
 <div className="admin-pill-nav" style={{ position: 'relative', display: 'inline-flex', background: '#e2e8f0', borderRadius: 14, padding: 4, marginBottom: 20, gap: 0 }}>
 {/* active pill */}
 <div style={{ position: 'absolute', top: 4, bottom: 4, width: 'calc(25% - 3px)', left: 'calc(25% + 2px)', background: '#fff', borderRadius: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.12)', transition: 'left 0.28s cubic-bezier(0.4,0,0.2,1)', zIndex: 0 }} />
 {[
 { label: 'ภาพรวม', path: '/dashboard' },
 { label: 'ทรัพย์', path: '/admin/properties' },
 { label: 'ข้อความ', path: '/admin/inquiries' },
 { label: 'ผู้ใช้', path: '/admin/users' },
 ].map((t, i) => {
 const active = t.path === '/admin/properties';
 return (
 <Link key={t.path} to={t.path} style={{ position: 'relative', zIndex: 1, textDecoration: 'none', padding: '9px 22px', borderRadius: 10, fontWeight: active ? 800 : 500, color: active ? N : '#94a3b8', fontSize: '0.85rem', fontFamily: "'Sarabun',sans-serif", transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
 {t.label}
 </Link>
 );
 })}
 </div>

 {/* ===== PAGE TITLE ===== */}
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
 <div>
 <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: N }}>
 <i className="fas fa-home" style={{ color: G, marginRight: 8 }} />จัดการทรัพย์สิน
 </h1>
 <p style={{ margin: '2px 0 0', color: '#888', fontSize: '0.82rem' }}>ทั้งหมด {pagination.total} รายการ</p>
 </div>
 </div>
 </div>

 <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px 20px' }}>

 {/* ===== FILTER BAR ===== */}
 <div className="admin-filter-bar" style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
 <input
 type="text"
 placeholder=" ค้นหาชื่อ, จังหวัด, อำเภอ..."
 value={search}
 onChange={e => setSearch(e.target.value)}
 onKeyDown={e => e.key === 'Enter' && fetchProperties(1)}
 style={{ flex: 1, minWidth: 200, padding: '8px 12px', border: '1.5px solid #dde', borderRadius: 7, fontSize: '0.88rem', outline: 'none', color: '#111827', background: '#fff' }}
 />

 <button
 onClick={() => fetchProperties(1)}
 style={{ background: '#6aab62', color: '#1a3a18', border: 'none', borderRadius: 7, padding: '8px 18px', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}
 >
 ค้นหา
 </button>
 {(search || statusFilter) && (
 <button onClick={() => { setSearch(''); setStatusFilter(''); }} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '0.82rem' }}> ล้าง</button>
 )}
 </div>

 {/* ===== TABLE ===== */}
 <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
 {loading ? (
 <div style={{ textAlign: 'center', padding: '60px', color: '#aaa' }}>
 <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem' }} />
 </div>
 ) : properties.length === 0 ? (
 <div style={{ textAlign: 'center', padding: '60px', color: '#aaa' }}>
 <i className="fas fa-home" style={{ fontSize: '2.5rem', display: 'block', marginBottom: 10 }} />
 <p>ยังไม่มีทรัพย์สิน</p>
 <button onClick={() => navigate('/admin/properties/new')} style={{ background: '#A1D99B', color: '#1a3a18', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 700 }}>+ เพิ่มทรัพย์แรก</button>
 </div>
 ) : (
 <div className="admin-table-wrap admin-prop-table" style={{ overflowX: 'auto' }}>
 <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
 <thead>
 <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e8edf2' }}>
 {[
 { label: 'รูปภาพ', hide: true },
 { label: 'ชื่อทรัพย์', hide: false },
 { label: 'ประเภท', hide: false },
 { label: 'สถานะ', hide: false },
 { label: 'ราคา', hide: false },
 { label: 'จำนวนรูป', hide: true },
 { label: 'Inquiry', hide: true },
 { label: 'แก้โดย', hide: true },
 { label: 'แนะนำ', hide: true },
 { label: 'จัดการ', hide: false },
 ].map(h => (
 <th key={h.label} className={h.hide ? 'admin-col-hide-mobile' : ''} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#555', whiteSpace: 'nowrap' }}>{h.label}</th>
 ))}
 </tr>
 </thead>
 <tbody>
 {properties.map(p => {
 const sc = STATUS_CONF[p.sale_status] || STATUS_CONF.available;
 return (
 <tr key={p.id} style={{ borderBottom: '1px solid #f0f4f8', transition: 'background 0.1s' }}
 onMouseEnter={e => e.currentTarget.style.background = '#fafcff'}
 onMouseLeave={e => e.currentTarget.style.background = ''}
 >
 {/* รูปหน้าปก */}
 <td className="admin-col-hide-mobile" style={{ padding: '8px 12px' }}>
 <div style={{ width: 56, height: 44, borderRadius: 6, overflow: 'hidden', background: '#e8edf2', flexShrink: 0 }}>
 {p.thumbnail_url ? (
 <img src={p.thumbnail_url.startsWith('http') ? p.thumbnail_url : `${API}${p.thumbnail_url}`}
 alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
 ) : (
 <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: '1.2rem' }}>
 <i className="fas fa-home" />
 </div>
 )}
 </div>
 </td>

 {/* ชื่อ */}
 <td style={{ padding: '8px 12px', maxWidth: 220 }}>
 <div style={{ fontWeight: 700, color: '#A1D99B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
 <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 1 }}>{p.province}{p.district ? ` · ${p.district}` : ''}</div>
 <div style={{ fontSize: '0.72rem', color: '#bbb' }}>#{String(p.id).padStart(4, '0')}</div>
 </td>

 {/* ประเภท */}
 <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
 <div style={{ fontSize: '0.8rem', color: '#555' }}>{TYPE_LABEL[p.property_type] || p.property_type}</div>
 <div style={{ fontSize: '0.72rem', color: '#888' }}>{LISTING_LABEL[p.listing_type]}</div>
 </td>

 {/* สถานะ — badge */}
 <td style={{ padding: '8px 12px' }}>
 <span style={{ 
 background: p.sale_status === 'sold' ? (p.listing_type === 'rent' ? '#ebf5ff' : '#fef2f2') : (p.sale_status === 'reserved' ? '#fffbeb' : '#ecfdf5'),
 color: p.sale_status === 'sold' ? (p.listing_type === 'rent' ? '#2563eb' : '#dc2626') : (p.sale_status === 'reserved' ? '#d97706' : '#059669'),
 border: `1px solid ${p.sale_status === 'sold' ? (p.listing_type === 'rent' ? '#3b82f6' : '#f87171') : (p.sale_status === 'reserved' ? '#fbbf24' : '#34d399')}`,
 borderRadius: 6, padding: '4px 12px', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' 
 }}>
 {p.sale_status === 'available' ? (p.listing_type === 'rent' ? 'พร้อมเช่า' : 'ว่างอยู่') : 
 p.sale_status === 'sold' ? (p.listing_type === 'rent' ? 'ติดเช่าแล้ว' : 'ขายแล้ว') : 
 'จองแล้ว'}
 </span>
 </td>

 {/* ราคา */}
 <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
 {p.listing_type === 'rent' ? (
 <>
 <div style={{ fontWeight: 700, color: '#6aab62' }}>฿{fmt(p.monthly_rent)}</div>
 <div style={{ fontSize: '0.72rem', color: '#888' }}>/เดือน</div>
 </>
 ) : p.listing_type === 'sale_rent' ? (
 <>
 <div style={{ fontWeight: 700, color: '#6aab62' }}>฿{fmt(p.price_requested)}</div>
 {p.monthly_rent > 0 && <div style={{ fontSize: '0.72rem', color: '#6366f1' }}>เช่า ฿{fmt(p.monthly_rent)}/เดือน</div>}
 </>
 ) : (
 <div style={{ fontWeight: 700, color: '#6aab62' }}>฿{fmt(p.price_requested)}</div>
 )}
 </td>

 {/* จำนวนรูป */}
 <td className="admin-col-hide-mobile" style={{ padding: '8px 12px', textAlign: 'center' }}>
 <span style={{ fontSize: '0.82rem', color: p.image_count > 0 ? '#A1D99B' : '#ccc', fontWeight: 600 }}>
 <i className="fas fa-images" style={{ marginRight: 3 }} />{p.image_count || 0}
 </span>
 </td>

 {/* Inquiry count */}
 <td className="admin-col-hide-mobile" style={{ padding: '8px 12px', textAlign: 'center' }}>
 <span style={{ fontSize: '0.82rem', color: p.inquiry_count > 0 ? '#e8a020' : '#ccc', fontWeight: 600 }}>
 <i className="fas fa-envelope" style={{ marginRight: 3 }} />{p.inquiry_count || 0}
 </span>
 </td>

 {/* audit — แอดมินที่แก้ล่าสุด */}
 <td className="admin-col-hide-mobile" style={{ padding: '8px 12px', textAlign: 'center' }}>
 <span
 title={`สร้างโดย: ${p.created_by_admin || '-'}\nแก้ล่าสุดโดย: ${p.updated_by_admin || '-'}`}
 style={{ fontSize: '0.75rem', color: p.updated_by_admin ? '#4b5563' : '#ccc', cursor: 'help' }}>
 {p.updated_by_admin
 ? <><i className="fas fa-user-edit" style={{ marginRight: 3, color: '#6b7280' }} />{p.updated_by_admin}</>
 : <span style={{ color: '#ccc' }}>—</span>
 }
 </span>
 </td>

 {/* แนะนำ toggle */}
 <td className="admin-col-hide-mobile" style={{ padding: '8px 12px', textAlign: 'center' }}>
 <button
 onClick={() => toggleFeatured(p.id, p.is_featured)}
 title={p.is_featured ? 'ยกเลิกแนะนำ' : 'ตั้งเป็นแนะนำ'}
 style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: p.is_featured ? '#e8a020' : '#ddd' }}
 ><i className="fas fa-star" /></button>
 </td>

 {/* ปุ่มจัดการ */}
 <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
 <div style={{ display: 'flex', gap: 6 }}>
 <button
 onClick={() => window.open(`/property/${p.id}`, '_blank')}
 title="ดูหน้าเว็บ"
 style={actionBtn('#e8f4fd', '#2980b9')}
 ><i className="fas fa-eye" /></button>
 <button
 onClick={() => navigate(`/admin/properties/${p.id}/edit`)}
 title="แก้ไข"
 style={actionBtn('#e8f8f2', '#A1D99B')}
 ><i className="fas fa-edit" /></button>
 <button
 onClick={() => setDelConfirm(p)}
 title="ลบ"
 style={actionBtn('#fff0f0', '#c0392b')}
 ><i className="fas fa-trash" /></button>
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}

 {/* ===== MOBILE CARD VIEW (<600px) ===== */}
 {!loading && properties.length > 0 && (
 <div className="admin-prop-cards">
 {properties.map(p => {
 const priceMain = p.listing_type === 'rent' ? p.monthly_rent : p.price_requested;
 const priceSuffix = p.listing_type === 'rent' ? '/เดือน' : '';
 const statusColor = p.sale_status === 'sold'
 ? (p.listing_type === 'rent' ? { bg:'#ebf5ff', fg:'#2563eb', label:'ติดเช่าแล้ว' } : { bg:'#fef2f2', fg:'#dc2626', label:'ขายแล้ว' })
 : p.sale_status === 'reserved' ? { bg:'#fffbeb', fg:'#d97706', label:'จองแล้ว' }
 : { bg:'#ecfdf5', fg:'#059669', label: p.listing_type === 'rent' ? 'พร้อมเช่า' : 'ว่างอยู่' };
 return (
 <div key={p.id} style={{
 background: '#fff', border: '1px solid #e8edf2', borderRadius: 14,
 overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
 }}>
 {/* Image + status + featured */}
 <div style={{ position: 'relative', height: 160, background: '#e8edf2' }}>
 {p.thumbnail_url ? (
 <img src={p.thumbnail_url.startsWith('http') ? p.thumbnail_url : `${API}${p.thumbnail_url}`}
 alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
 ) : (
 <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: '2rem' }}>
 <i className="fas fa-home" />
 </div>
 )}
 {/* Status badge top-left */}
 <span style={{
 position: 'absolute', top: 10, left: 10,
 background: statusColor.bg, color: statusColor.fg,
 borderRadius: 999, padding: '4px 12px',
 fontSize: '0.72rem', fontWeight: 700,
 boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
 }}>{statusColor.label}</span>
 {/* Featured star top-right */}
 <button onClick={() => toggleFeatured(p.id, p.is_featured)}
 style={{
 position: 'absolute', top: 10, right: 10,
 width: 34, height: 34, borderRadius: '50%',
 background: 'rgba(255,255,255,0.95)', border: 'none',
 cursor: 'pointer', fontSize: '0.95rem',
 color: p.is_featured ? '#e8a020' : '#ccc',
 boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
 }}
 title={p.is_featured ? 'ยกเลิกแนะนำ' : 'ตั้งเป็นแนะนำ'}
 ><i className="fas fa-star" /></button>
 </div>

 {/* Body */}
 <div style={{ padding: '14px 16px' }}>
 <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: 4, fontWeight: 600, letterSpacing: '0.04em' }}>
 #{String(p.id).padStart(4, '0')} · {TYPE_LABEL[p.property_type] || p.property_type} · {LISTING_LABEL[p.listing_type]}
 </div>
 <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1a3a18', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
 {p.title}
 </div>
 <div style={{ fontSize: '0.78rem', color: '#666', marginBottom: 10 }}>
 <i className="fas fa-map-marker-alt" style={{ color: '#C9A84C', marginRight: 4, fontSize: '0.7rem' }} />
 {p.province}{p.district ? ` · ${p.district}` : ''}
 </div>

 {/* Price + meta row */}
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
 <div>
 <span style={{ fontWeight: 800, color: '#3d7a3a', fontSize: '1.05rem' }}>฿{fmt(priceMain)}</span>
 {priceSuffix && <span style={{ fontSize: '0.72rem', color: '#888', marginLeft: 4 }}>{priceSuffix}</span>}
 {p.listing_type === 'sale_rent' && p.monthly_rent > 0 && (
 <div style={{ fontSize: '0.7rem', color: '#6366f1', marginTop: 2 }}>เช่า ฿{fmt(p.monthly_rent)}/เดือน</div>
 )}
 </div>
 <div style={{ display: 'flex', gap: 12, fontSize: '0.72rem', color: '#666' }}>
 <span><i className="fas fa-images" style={{ color: '#A1D99B', marginRight: 3 }} />{p.image_count || 0}</span>
 <span><i className="fas fa-envelope" style={{ color: p.inquiry_count > 0 ? '#e8a020' : '#ccc', marginRight: 3 }} />{p.inquiry_count || 0}</span>
 </div>
 </div>

 {/* Status dropdown + action buttons */}
 <div style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
 <button onClick={() => window.open(`/property/${p.id}`, '_blank')}
 style={{ flex: 1, background: '#e8f4fd', color: '#2980b9', border: 'none', borderRadius: 8, padding: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
 <i className="fas fa-eye" style={{ marginRight: 4 }} />ดู
 </button>
 <button onClick={() => navigate(`/admin/properties/${p.id}/edit`)}
 style={{ flex: 1, background: '#e8f8f2', color: '#1a6040', border: 'none', borderRadius: 8, padding: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
 <i className="fas fa-edit" style={{ marginRight: 4 }} />แก้ไข
 </button>
 <button onClick={() => setDelConfirm(p)}
 style={{ width: 44, background: '#fff0f0', color: '#c0392b', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem' }}>
 <i className="fas fa-trash" />
 </button>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>

 {/* ===== PAGINATION — arrows + page counter (always visible, disabled when can't navigate) ===== */}
 {!loading && properties.length > 0 && (() => {
 const totalPages = Math.max(1, pagination.totalPages || 1);
 const cur = pagination.page || 1;
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
 <div className="search-pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 28, flexWrap: 'wrap' }}>
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
 </div>

 {/* ===== DELETE CONFIRM MODAL ===== */}
 {delConfirm && (
 <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
 <div style={{ background: '#fff', borderRadius: 14, padding: '28px 24px', maxWidth: 380, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
 <div style={{ textAlign: 'center', marginBottom: 16 }}>
 <i className="fas fa-exclamation-triangle" style={{ fontSize: '2.5rem', color: '#e74c3c', marginBottom: 10, display: 'block' }} />
 <h3 style={{ margin: 0, color: '#A1D99B' }}>ยืนยันการลบ?</h3>
 <p style={{ color: '#666', fontSize: '0.88rem', marginTop: 8 }}>
 ลบทรัพย์ "<strong>{delConfirm.title}</strong>"<br />
 ไม่สามารถกู้คืนได้
 </p>
 </div>
 <div style={{ display: 'flex', gap: 10 }}>
 <button onClick={() => setDelConfirm(null)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1.5px solid #dde', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>ยกเลิก</button>
 <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#e74c3c', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
 {deleting ? <><i className="fas fa-spinner fa-spin" /> กำลังลบ...</> : 'ลบเลย'}
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}

const actionBtn = (bg, color) => ({
 background: bg, color, border: `1px solid ${color}`,
 borderRadius: 6, padding: '5px 9px', cursor: 'pointer',
 fontSize: '0.8rem', transition: 'opacity 0.15s',
});

export default AdminProperties;
