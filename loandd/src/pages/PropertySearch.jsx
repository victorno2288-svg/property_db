import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import PropertyCard from '../components/PropertyCard';
import { formatPrice } from '../utils/propertyUtils';
import SearchResultMap from '../components/SearchResultMap';
import Navbar from '../Navbar';
import SearchSuggestBox from '../components/SearchSuggestBox';
import ProximityMap from '../components/ProximityMap';
import { TRAIN_STATIONS } from '../data/trainStations';
import { SCHOOLS } from '../data/schools';
import heroBg from '../pic/ปกหลัง.gif';

// Haversine distance (km) — ใช้ sort ทรัพย์ใกล้สถานศึกษา
function haversine(lat1, lng1, lat2, lng2) {
 const R = 6371;
 const dLat = (lat2 - lat1) * (Math.PI / 180);
 const dLng = (lng2 - lng1) * (Math.PI / 180);
 const a =
 Math.sin(dLat / 2) ** 2 +
 Math.cos(lat1 * (Math.PI / 180)) *
 Math.cos(lat2 * (Math.PI / 180)) *
 Math.sin(dLng / 2) ** 2;
 return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const API_BASE = '';

const PROPERTY_TYPES = [
 { value: '', label: 'ทุกประเภท', icon: 'fa-th-large' },
 { value: 'house', label: 'บ้านเดี่ยว', icon: 'fa-home' },
 { value: 'townhouse', label: 'ทาวน์เฮ้าส์', icon: 'fa-city' },
 { value: 'townhome', label: 'ทาวน์โฮม', icon: 'fa-house-user' },
 { value: 'condo', label: 'คอนโด', icon: 'fa-building' },
 { value: 'land', label: 'ที่ดิน', icon: 'fa-mountain' },
 { value: 'commercial', label: 'อาคารพาณิชย์', icon: 'fa-store' },
 { value: 'apartment', label: 'อพาร์ทเม้นท์', icon: 'fa-hotel' },
 { value: 'home_office', label: 'โฮมออฟฟิศ', icon: 'fa-briefcase' },
 { value: 'warehouse', label: 'โกดัง/โรงงาน', icon: 'fa-warehouse' },
];

const LISTING_TYPES = [
 { value: '', label: 'ทั้งหมด' },
 { value: 'sale', label: 'ซื้อ' },
 { value: 'rent', label: 'เช่า' },
];

const PRICE_RANGES = [
 { value: '', label: 'ทุกราคา' },
 { value: '0-1000000', label: 'ต่ำกว่า 1 ล้าน' },
 { value: '1000000-3000000', label: '1–3 ล้าน' },
 { value: '3000000-5000000', label: '3–5 ล้าน' },
 { value: '5000000-10000000', label: '5–10 ล้าน' },
 { value: '10000000-', label: 'มากกว่า 10 ล้าน' },
];

const SORT_OPTIONS = [
 { value: 'default', label: 'แนะนำก่อน' },
 { value: 'price_asc', label: 'ราคา: น้อย → มาก' },
 { value: 'price_desc', label: 'ราคา: มาก → น้อย' },
 { value: 'newest', label: 'ใหม่ล่าสุด' },
];

function PropertySearch() {
 const [searchParams, setSearchParams] = useSearchParams();
 const navigate = useNavigate();

 // --- Filter state ดึงจาก URL ---
 const [filters, setFilters] = useState({
 listing_type: searchParams.get('listing_type') || '',
 property_type: searchParams.get('property_type') || '',
 province: searchParams.get('province') || '',
 priceRange: searchParams.get('priceRange') || '',
 bedrooms: searchParams.get('bedrooms') || '',
 search: searchParams.get('search') || '',
 sort: searchParams.get('sort') || 'default',
 bts_station: searchParams.get('bts_station') || '',
 near_school: searchParams.get('near_school') || '',
 });

 const [properties, setProperties] = useState([]);
 const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
 const [loading, setLoading] = useState(true);
 const [provinces, setProvinces] = useState([]);
 const [searchInput, setSearchInput] = useState(filters.search);
 const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
 const [showSuggest, setShowSuggest] = useState(false);
 // ─ radius filter สำหรับ BTS / school proximity ─
 const [proximityRadius, setProximityRadius] = useState(3); // km
 const [viewMode, setViewMode] = useState(() => localStorage.getItem('search-view-mode') || 'grid');
 useEffect(() => { localStorage.setItem('search-view-mode', viewMode); }, [viewMode]);
 const [activeMapId, setActiveMapId] = useState(null);

 const currentPage = parseInt(searchParams.get('page') || '1');

 // --- โหลด provinces ---
 useEffect(() => {
 fetch(`${API_BASE}/api/provinces`)
 .then(r => r.json())
 .then(data => {
 // รองรับทั้ง { success, data: [...] } และ array ตรงๆ
 const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
 setProvinces(list);
 })
 .catch(() => {});
 }, []);

 // --- โหลด properties ตาม filters ---
 const fetchProperties = useCallback(() => {
 setLoading(true);
 const params = new URLSearchParams();

 const isSchoolSearch = !!filters.near_school;
 const isBtsSearch = !!filters.bts_station;
 const isProxSearch = isSchoolSearch || isBtsSearch;

 // Proximity search → ดึงทรัพย์ทั้งหมดเพื่อ sort/filter by distance client-side
 params.set('page', isProxSearch ? '1' : String(currentPage));
 params.set('limit', isProxSearch ? '200' : '12');

 if (filters.listing_type) params.set('listing_type', filters.listing_type);
 if (filters.property_type) params.set('property_type', filters.property_type);
 if (filters.province) params.set('province', filters.province);
 if (filters.search) params.set('search', filters.search);
 if (filters.bedrooms) params.set('bedrooms', filters.bedrooms);
 if (filters.bts_station) params.set('bts_station', filters.bts_station);

 if (filters.priceRange) {
 const [min, max] = filters.priceRange.split('-');
 if (min) params.set('min_price', min);
 if (max) params.set('max_price', max);
 }

 // หา meta ของ school / station สำหรับ distance calc
 const schoolMeta = isSchoolSearch
 ? (() => {
 const q = filters.near_school.trim().toLowerCase();
 return SCHOOLS.find(s => s.key === filters.near_school)
 || SCHOOLS.find(s => s.key.trim().toLowerCase() === q)
 || SCHOOLS.find(s => s.label.toLowerCase().includes(q) || q.includes(s.key.toLowerCase()))
 || null;
 })()
 : null;

 const stationMeta = isBtsSearch
 ? (() => {
 const q = filters.bts_station.toLowerCase().replace('bts ', '').replace('mrt ', '').trim();
 return TRAIN_STATIONS.find(s => s.name.toLowerCase().includes(q)) || null;
 })()
 : null;

 fetch(`${API_BASE}/api/properties?${params}`)
 .then(r => r.json())
 .then(data => {
 let items = data.data || [];

 const refLat = schoolMeta?.lat ?? stationMeta?.lat ?? null;
 const refLng = schoolMeta?.lng ?? stationMeta?.lng ?? null;

 if (isProxSearch && refLat !== null) {
 // คำนวณ distance ทุกทรัพย์
 items = items.map(p => {
 if (!p.latitude || !p.longitude) return { ...p, _distKm: null };
 const km = haversine(refLat, refLng, parseFloat(p.latitude), parseFloat(p.longitude));
 return { ...p, _distKm: km };
 });

 // ─ ตัดด้วย radius ─
 items = items.filter(p => {
 if (p._distKm === null) return false; // ไม่มีพิกัด → ไม่แสดง
 return p._distKm <= proximityRadius;
 });

 // เรียงใกล้ → ไกล
 items.sort((a, b) => (a._distKm ?? 999) - (b._distKm ?? 999));

 } else if (!isProxSearch) {
 // Normal client-side sort
 if (filters.sort === 'price_asc') {
 items.sort((a, b) => (a.price_requested || 0) - (b.price_requested || 0));
 } else if (filters.sort === 'price_desc') {
 items.sort((a, b) => (b.price_requested || 0) - (a.price_requested || 0));
 } else if (filters.sort === 'newest') {
 items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
 }
 }

 setProperties(items);
 setPagination(
 isProxSearch
 ? { page: 1, total: items.length, totalPages: 1 }
 : (data.pagination || { page: 1, total: items.length, totalPages: 1 })
 );
 })
 .catch(() => setProperties([]))
 .finally(() => setLoading(false));
 }, [filters, currentPage, proximityRadius]);

 useEffect(() => { fetchProperties(); }, [fetchProperties]);

 // Re-fetch เมื่อ user สลับแท็บกลับมา (real-time update หลังอัพโหลดรูป/แก้ไขทรัพย์)
 // Re-fetch เมื่อ user สลับแท็บกลับมา
 useEffect(() => {
 const onVis = () => { if (!document.hidden) fetchProperties(); };
 document.addEventListener('visibilitychange', onVis);
 return () => document.removeEventListener('visibilitychange', onVis);
 }, [fetchProperties]);

 // --- Sync URL → filters (รับค่าจาก navbar link หรือ back/forward) ---
 useEffect(() => {
 const fromURL = {
 listing_type: searchParams.get('listing_type') || '',
 property_type: searchParams.get('property_type') || '',
 province: searchParams.get('province') || '',
 priceRange: searchParams.get('priceRange') || '',
 bedrooms: searchParams.get('bedrooms') || '',
 search: searchParams.get('search') || '',
 sort: searchParams.get('sort') || 'default',
 bts_station: searchParams.get('bts_station') || '',
 near_school: searchParams.get('near_school') || '',
 };
 setFilters(fromURL);
 setSearchInput(searchParams.get('search') || '');
 }, [searchParams]);

 // --- อัพเดท URL params เมื่อ filter เปลี่ยน ---
 const applyFilter = (newFilters) => {
 const f = { ...filters, ...newFilters };
 setFilters(f);
 const p = new URLSearchParams();
 Object.entries(f).forEach(([k, v]) => { if (v) p.set(k, v); });
 p.set('page', '1');
 setSearchParams(p);
 };

 const handleSearch = (e) => {
 e.preventDefault();
 applyFilter({ search: searchInput });
 };

 const clearAll = () => {
 const reset = { listing_type: '', property_type: '', province: '', priceRange: '', bedrooms: '', search: '', sort: 'default', bts_station: '', near_school: '' };
 setFilters(reset);
 setSearchInput('');
 setSearchParams({ page: '1' });
 };

 const hasActiveFilter = Object.entries(filters).some(([k, v]) => k !== 'sort' && v !== '');

 // ─ หา meta ของ station / school ที่เลือก ─
 const activeBtsStation = useMemo(() => {
 if (!filters.bts_station) return null;
 // ค้นหาจาก TRAIN_STATIONS ที่ชื่อ match กับ filter (อาจมี prefix "BTS ")
 const q = filters.bts_station.toLowerCase().replace('bts ', '').replace('mrt ', '').trim();
 return TRAIN_STATIONS.find(s => s.name.toLowerCase().includes(q)) || null;
 }, [filters.bts_station]);

 const activeSchool = useMemo(() => {
 if (!filters.near_school) return null;
 const q = filters.near_school.trim().toLowerCase();
 // fuzzy match: exact key → label includes → key includes
 return (
 SCHOOLS.find(s => s.key === filters.near_school) ||
 SCHOOLS.find(s => s.key.trim().toLowerCase() === q) ||
 SCHOOLS.find(s => s.label.toLowerCase().includes(q) || q.includes(s.key.toLowerCase())) ||
 null
 );
 }, [filters.near_school]);

 return (
 <div style={{ minHeight: '100vh', background: '#f5f7fa', fontFamily: "'Sarabun', sans-serif" }}>
 <Navbar />

 {/* ========== SEARCH HERO — GIF background + dark filter ========== */}
 <div style={{
 backgroundImage: `url(${heroBg})`,
 backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
 padding: 'calc(64px + 48px) 16px 44px',
 position: 'relative',
 zIndex: showSuggest ? 200 : 1,
 }}>
 {/* Dark filter overlay — ให้อักษรขาวอ่านชัด */}
 <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(15,20,16,0.7) 100%)', pointerEvents: 'none' }} />

 <div style={{ maxWidth: 960, margin: '0 auto', position: 'relative', zIndex: 1 }}>
 <div style={{ fontSize: '0.62rem', color: '#e8d48a', letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 700, fontFamily: "'Manrope', sans-serif", marginBottom: 10 }}>
 ── Property Collection ──
 </div>
 <h1 style={{ color: '#fff', fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', fontWeight: 400, marginBottom: 8, fontFamily: "'Prompt', sans-serif", letterSpacing: '-0.01em' }}>
 อสังหาริมทรัพย์จาก บ้าน D มีเชง
 </h1>
 <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', marginBottom: 22 }}>
 ทรัพย์คุณภาพ คัดสรรโดยทีม บ้าน D มีเชง
 </p>

 {/* Search Bar */}
 <div style={{ position: 'relative', maxWidth: 600 }}>
 <form onSubmit={e => { e.preventDefault(); setShowSuggest(false); handleSearch(e); }}
 style={{
 display: 'flex', gap: 0,
 background: 'rgba(255,255,255,0.95)',
 backdropFilter: 'blur(12px)',
 borderRadius: 14, overflow: 'hidden',
 border: showSuggest ? '2px solid #3d7a3a' : '2px solid rgba(61,122,58,0.25)',
 transition: 'border-color 0.2s, box-shadow 0.2s',
 boxShadow: showSuggest ? '0 8px 30px rgba(0,0,0,0.2), 0 0 0 4px rgba(61,122,58,0.1)' : '0 6px 24px rgba(0,0,0,0.15)',
 }}>
 <i className="fas fa-search" style={{ color: '#3d7a3a', fontSize: '0.9rem', padding: '0 0 0 16px', alignSelf: 'center' }} />
 <input
 type="text"
 value={searchInput}
 onChange={e => setSearchInput(e.target.value)}
 onFocus={() => setShowSuggest(true)}
 onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
 placeholder="ค้นหาตำแหน่ง, โครงการ, ชื่อทรัพย์..."
 style={{
 flex: 1, padding: '13px 12px',
 border: 'none', fontSize: '0.9rem', outline: 'none',
 background: 'transparent', fontFamily: 'inherit', color: '#2d3748',
 }}
 />
 {searchInput && (
 <button type="button" onClick={() => { setSearchInput(''); applyFilter({ search: '' }); }}
 style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', padding: '0 8px', fontSize: '0.85rem' }}>
 <i className="fas fa-times" />
 </button>
 )}
 <button type="submit" style={{
 background: 'linear-gradient(135deg, #3d7a3a, #2d5e2b)', color: '#fff',
 border: 'none', padding: '13px 22px', fontWeight: 700,
 cursor: 'pointer', fontSize: '0.88rem', whiteSpace: 'nowrap',
 fontFamily: 'inherit', letterSpacing: '0.3px',
 transition: 'background 0.2s',
 }}>
 <i className="fas fa-search" /> ค้นหา
 </button>
 </form>
 <SearchSuggestBox
 visible={showSuggest}
 inputValue={searchInput}
 onSelect={val => setSearchInput(val)}
 onClose={() => setShowSuggest(false)}
 activeFilters={{ listing_type: filters.listing_type, property_type: filters.property_type }}
 />
 </div>
 </div>
 </div>

 {/* ========== FILTER TABS (Listing Type) ========== */}
 <div style={{ background: '#fff', borderBottom: '1px solid #e2e2e2', position: 'sticky', top: 64, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
 <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 4, overflowX: 'auto' }}>
 {LISTING_TYPES.map(lt => {
 const isActive = filters.listing_type === lt.value;
 return (
 <button
 key={lt.value}
 onClick={() => applyFilter({ listing_type: lt.value })}
 style={{
 padding: '13px 22px', border: 'none', background: 'transparent',
 fontWeight: isActive ? 800 : 500,
 color: isActive ? '#3d7a3a' : '#777',
 borderBottom: isActive ? '3px solid #3d7a3a' : '3px solid transparent',
 cursor: 'pointer', fontSize: '0.92rem', whiteSpace: 'nowrap',
 transition: 'all 0.2s',
 letterSpacing: '0.3px',
 }}
 >
 {lt.label}
 </button>
 );
 })}

 {/* Mobile Filter Toggle */}
 <button
 onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
 style={{
 marginLeft: 'auto', padding: '8px 16px',
 background: hasActiveFilter ? 'linear-gradient(135deg, #3d7a3a, #2d5e2b)' : '#f5f5f5',
 color: hasActiveFilter ? '#fff' : '#666',
 border: hasActiveFilter ? 'none' : '1.5px solid #ddd',
 borderRadius: 10,
 cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700,
 display: 'flex', alignItems: 'center', gap: 6,
 whiteSpace: 'nowrap',
 boxShadow: hasActiveFilter ? '0 2px 8px rgba(61,122,58,0.25)' : 'none',
 transition: 'all 0.2s',
 }}
 >
 <i className="fas fa-sliders-h" /> กรอง{hasActiveFilter ? ' ' : ''}
 </button>
 </div>
 </div>

 {/* ========== BTS/MRT PROXIMITY MAP ========== */}
 {filters.bts_station && (
 <div style={{ background: '#f0faf5', borderBottom: '1px solid #d0eedd' }}>
 <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 16px 0' }}>
 {/* Header row */}
 <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
 <span style={{ fontSize: '1.2rem' }}></span>
 <div>
 <span style={{ fontWeight: 800, color: '#3d7a3a', fontSize: '1rem' }}>
 อสังหาฯ ใกล้ {filters.bts_station}
 </span>
 </div>
 {/* Radius selector */}
 <div style={{ display: 'flex', gap: 5, marginLeft: 6, alignItems: 'center' }}>
 <span style={{ fontSize: '0.75rem', color: '#888' }}>รัศมี:</span>
 {[1, 2, 3, 5].map(r => (
 <button key={r} onClick={() => setProximityRadius(r)} style={{
 padding: '3px 9px', borderRadius: 14, fontSize: '0.75rem', fontWeight: 700,
 border: `1.5px solid ${proximityRadius === r ? '#6aab62' : '#ccc'}`,
 background: proximityRadius === r ? '#6aab62' : '#fff',
 color: proximityRadius === r ? '#1a3a18' : '#555',
 cursor: 'pointer', transition: 'all 0.12s',
 }}>{r} กม.</button>
 ))}
 </div>
 <button
 onClick={() => applyFilter({ bts_station: '' })}
 style={{ marginLeft: 'auto', background: 'none', border: '1px solid #ccc', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '0.78rem', color: '#666' }}
 > ล้าง</button>
 </div>
 {/* Distance Legend */}
 <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10, fontSize: '0.75rem' }}>
 {[['#A1D99B','≤ 1 กม.'],['#f59e0b','1–3 กม.'],['#ef4444','> 3 กม.']].map(([c,l]) => (
 <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
 <span style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'inline-block' }} />
 <span style={{ color: '#555' }}>{l}</span>
 </span>
 ))}
 <span style={{ color: '#888', fontStyle: 'italic' }}>แสดงทรัพย์ภายใน {proximityRadius} กม. จากสถานี</span>
 </div>
 {/* Leaflet Map */}
 <div style={{ borderRadius: '12px 12px 0 0', overflow: 'hidden' }}>
 {activeBtsStation ? (
 <ProximityMap
 centerLat={activeBtsStation.lat}
 centerLng={activeBtsStation.lng}
 centerLabel={activeBtsStation.name}
 centerIcon=""
 centerColor="#6aab62"
 properties={properties}
 mapHeight={360}
 />
 ) : (
 // Fallback iframe ถ้าหาพิกัดสถานีไม่เจอ
 <iframe
 title="แผนที่สถานี"
 src={`https://maps.google.com/maps?q=${encodeURIComponent(filters.bts_station + ' สถานีรถไฟฟ้า กรุงเทพ ประเทศไทย')}&z=15&output=embed`}
 width="100%" height="360"
 style={{ border: 0, display: 'block' }}
 allowFullScreen loading="lazy"
 />
 )}
 </div>
 </div>
 </div>
 )}

 {/* ========== SCHOOL PROXIMITY MAP ========== */}
 {filters.near_school && (
 <div style={{ background: '#f5f0fa', borderBottom: '1px solid #ddd0ee' }}>
 <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 16px 0' }}>
 {/* Header */}
 <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
 <span style={{ fontSize: '1.2rem' }}>{activeSchool ? activeSchool.icon : ''}</span>
 <div>
 <span style={{ fontWeight: 800, color: '#3d7a3a', fontSize: '1rem' }}>
 อสังหาฯ ใกล้ {activeSchool ? activeSchool.label : filters.near_school}
 </span>
 </div>
 {/* Radius selector */}
 <div style={{ display: 'flex', gap: 5, marginLeft: 6, alignItems: 'center' }}>
 <span style={{ fontSize: '0.75rem', color: '#888' }}>รัศมี:</span>
 {[1, 2, 3, 5].map(r => (
 <button key={r} onClick={() => setProximityRadius(r)} style={{
 padding: '3px 9px', borderRadius: 14, fontSize: '0.75rem', fontWeight: 700,
 border: `1.5px solid ${proximityRadius === r ? '#6d28d9' : '#ccc'}`,
 background: proximityRadius === r ? '#6d28d9' : '#fff',
 color: proximityRadius === r ? '#1a3a18' : '#555',
 cursor: 'pointer', transition: 'all 0.12s',
 }}>{r} กม.</button>
 ))}
 </div>
 <button
 onClick={() => applyFilter({ near_school: '' })}
 style={{ marginLeft: 'auto', background: 'none', border: '1px solid #ccc', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '0.78rem', color: '#666' }}
 > ล้าง</button>
 </div>
 {/* Distance Legend */}
 <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10, fontSize: '0.75rem' }}>
 {[['#A1D99B','≤ 1 กม. (เดินได้)'],['#f59e0b','1–3 กม.'],['#ef4444','> 3 กม.']].map(([c,l]) => (
 <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
 <span style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'inline-block' }} />
 <span style={{ color: '#555' }}>{l}</span>
 </span>
 ))}
 <span style={{ color: '#888', fontStyle: 'italic' }}>แสดงทรัพย์ภายใน {proximityRadius} กม. จากสถานศึกษา</span>
 </div>
 {/* Leaflet Map — ถ้ามีพิกัดใน SCHOOLS → ProximityMap, ไม่มี → Google Maps iframe */}
 <div style={{ borderRadius: '12px 12px 0 0', overflow: 'hidden' }}>
 {activeSchool ? (
 <ProximityMap
 centerLat={activeSchool.lat}
 centerLng={activeSchool.lng}
 centerLabel={activeSchool.label}
 centerIcon={activeSchool.icon}
 centerColor={activeSchool.color}
 properties={properties}
 mapHeight={380}
 />
 ) : (
 <iframe
 title="แผนที่สถานศึกษา"
 src={`https://maps.google.com/maps?q=${encodeURIComponent(filters.near_school + ' กรุงเทพ ประเทศไทย')}&z=15&output=embed`}
 width="100%" height="380"
 style={{ border: 0, display: 'block' }}
 allowFullScreen loading="lazy"
 />
 )}
 </div>
 </div>
 </div>
 )}

 {/* ========== MAIN CONTENT ========== */}
 <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>

 {/* ===== SIDEBAR FILTER (Desktop) ===== */}
 <aside style={{
 width: 240, flexShrink: 0,
 display: mobileFilterOpen ? 'block' : 'none',
 position: 'sticky', top: 60,
 }}
 className="filter-sidebar"
 >
 <FilterPanel
 filters={filters}
 provinces={provinces}
 onApply={applyFilter}
 onClear={clearAll}
 hasActive={hasActiveFilter}
 />
 </aside>

 {/* ===== RESULTS ===== */}
 <main style={{ flex: 1, minWidth: 0 }}>

 {/* Loading indicator */}
 {loading && (
 <div style={{ marginBottom: 14 }}>
 <span style={{
 color: '#3d7a3a', display: 'inline-flex', alignItems: 'center', gap: 8,
 background: 'rgba(61,122,58,0.06)', padding: '5px 14px', borderRadius: 20,
 fontSize: '0.82rem', fontWeight: 600,
 }}>
 <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '0.9rem' }} />
 กำลังค้นหา...
 </span>
 </div>
 )}

 {/* Property Type Chips */}
 <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
 {PROPERTY_TYPES.map(pt => {
 const isActive = filters.property_type === pt.value;
 return (
 <button
 key={pt.value}
 onClick={() => applyFilter({ property_type: pt.value })}
 style={{
 padding: '7px 16px', borderRadius: 22,
 border: isActive ? '2px solid #3d7a3a' : '1.5px solid #e0e0e0',
 background: isActive ? 'linear-gradient(135deg, #3d7a3a, #2d5e2b)' : '#fff',
 color: isActive ? '#fff' : '#555',
 fontSize: '0.8rem', fontWeight: isActive ? 700 : 500, cursor: 'pointer',
 transition: 'all 0.2s',
 display: 'flex', alignItems: 'center', gap: 6,
 boxShadow: isActive ? '0 2px 8px rgba(61,122,58,0.2)' : '0 1px 3px rgba(0,0,0,0.04)',
 }}
 >
 <i className={`fas ${pt.icon}`} style={{ fontSize: '0.72rem' }} />
 {pt.label}
 </button>
 );
 })}
 </div>

 {/* ===== Toolbar: result count + sort + view + page ===== */}
 {!loading && (
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
 <div style={{ fontSize: '0.92rem', color: '#1a3a18', fontFamily: "'Prompt','Sarabun',sans-serif", fontWeight: 500 }}>
 พบ <strong style={{ color: '#1a3a18', fontSize: '1.05rem', fontWeight: 800 }}>{pagination.total || properties.length}</strong> ทรัพย์
 </div>
 {hasActiveFilter && (
 <button onClick={clearAll} style={{
 background: '#fff5f5', border: '1px solid #fecdd3',
 color: '#dc2626', cursor: 'pointer', fontSize: '0.76rem',
 fontWeight: 600, padding: '4px 12px', borderRadius: 20,
 display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s',
 }}>
 <i className="fas fa-times" style={{ fontSize: '0.65rem' }} /> ล้างตัวกรอง
 </button>
 )}
 </div>
 <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
 {/* Sort dropdown */}
 <select
 value={filters.sort}
 onChange={e => applyFilter({ sort: e.target.value })}
 style={{
 padding: '7px 30px 7px 14px', borderRadius: 999,
 border: '1px solid #e0e0e0', background: '#fff',
 fontSize: '0.82rem', color: '#1a3a18', fontWeight: 600,
 cursor: 'pointer', outline: 'none',
 fontFamily: "'Prompt','Sarabun',sans-serif",
 appearance: 'none', WebkitAppearance: 'none',
 backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27%3E%3Cpath fill=%27%231a3a18%27 d=%27M12 15l-5-5h10z%27/%3E%3C/svg%3E")',
 backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
 }}
 >
 {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
 </select>
 {/* Page counter */}
 <div style={{
 fontSize: '0.82rem', fontWeight: 700, color: '#1a3a18',
 fontFamily: "'Manrope', sans-serif", letterSpacing: '0.12em',
 }}>
 <span>{String(currentPage).padStart(2, '0')}</span>
 <span style={{ margin: '0 6px', opacity: 0.35 }}>/</span>
 <span style={{ opacity: 0.5 }}>{String(Math.max(1, pagination.totalPages || 1)).padStart(2, '0')}</span>
 </div>
 {/* Grid/Map toggle */}
 <div style={{ display: 'inline-flex', background: '#f3f2ef', padding: 4, borderRadius: 999, border: '1px solid rgba(0,0,0,0.06)' }}>
 {[
 { key: 'grid', icon: 'fa-th-large', label: 'Grid' },
 { key: 'map', icon: 'fa-map-location-dot', label: 'Map' },
 ].map(m => {
 const active = viewMode === m.key;
 return (
 <button key={m.key} type="button" onClick={() => setViewMode(m.key)}
 style={{
 border: 'none', cursor: 'pointer',
 padding: '7px 16px', borderRadius: 999,
 background: active ? '#1a3a18' : 'transparent',
 color: active ? '#fff' : '#555',
 fontSize: '0.8rem', fontWeight: active ? 700 : 500,
 fontFamily: "'Manrope', sans-serif", letterSpacing: '0.04em',
 display: 'inline-flex', alignItems: 'center', gap: 6,
 transition: 'all 0.2s',
 }}>
 <i className={`fas ${m.icon}`} style={{ fontSize: '0.76rem' }} /> {m.label}
 </button>
 );
 })}
 </div>
 </div>
 </div>
 )}

 {/* Cards Grid */}
 {loading ? (
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 18, padding: '10px 0' }}>
 {[...Array(6)].map((_, i) => (
 <div key={i} style={{
 borderRadius: 14, overflow: 'hidden',
 background: '#fff',
 boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
 border: '1px solid rgba(0,0,0,0.04)',
 }}>
 <div style={{ position: 'relative' }}>
 <div className="skeleton-box" style={{ height: 200, borderRadius: 0 }} />
 <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 6 }}>
 <div className="skeleton-box" style={{ width: 50, height: 22, borderRadius: 6 }} />
 <div className="skeleton-box" style={{ width: 70, height: 22, borderRadius: 6 }} />
 </div>
 </div>
 <div style={{ padding: '18px 16px 20px' }}>
 <div className="skeleton-box" style={{ height: 16, width: '75%', marginBottom: 12, borderRadius: 4 }} />
 <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
 <div className="skeleton-box" style={{ height: 12, width: 50, borderRadius: 4 }} />
 <div className="skeleton-box" style={{ height: 12, width: 50, borderRadius: 4 }} />
 <div className="skeleton-box" style={{ height: 12, width: 60, borderRadius: 4 }} />
 </div>
 <div className="skeleton-box" style={{ height: 12, width: '60%', marginBottom: 14, borderRadius: 4 }} />
 <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <div className="skeleton-box" style={{ height: 22, width: '45%', borderRadius: 4 }} />
 <div className="skeleton-box" style={{ width: 32, height: 32, borderRadius: '50%' }} />
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : properties.length === 0 ? (
 <div style={{
 textAlign: 'center', padding: '50px 20px', color: '#aaa',
 background: 'linear-gradient(180deg, #f8f6f2 0%, #fff 100%)',
 borderRadius: 16, border: '1.5px dashed #d8d4cc', margin: '10px 0',
 }}>
 <div style={{
 width: 72, height: 72, borderRadius: '50%',
 background: 'linear-gradient(135deg, #e8f5e6, #d0ebd4)',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 margin: '0 auto 16px',
 boxShadow: '0 4px 16px rgba(61,122,58,0.1)',
 }}>
 <i className="fas fa-search" style={{ fontSize: '1.5rem', color: '#3d7a3a' }} />
 </div>
 {(filters.near_school || filters.bts_station) ? (
 <>
 <p style={{ fontSize: '1.05rem', fontWeight: 700, color: '#2d3748', marginBottom: 6 }}>ไม่พบทรัพย์ในรัศมี {proximityRadius} กม.</p>
 <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: 16 }}>ยังไม่มีทรัพย์ที่มีพิกัด GPS ในระยะนี้</p>
 <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
 {[3, 5, 10].filter(r => r > proximityRadius).slice(0, 2).map(r => (
 <button key={r} onClick={() => setProximityRadius(r)} style={{
 background: 'linear-gradient(135deg, #3d7a3a, #2d5e2b)', color: '#fff', border: 'none',
 borderRadius: 10, padding: '10px 22px', cursor: 'pointer',
 fontSize: '0.85rem', fontWeight: 700,
 boxShadow: '0 3px 10px rgba(61,122,58,0.25)',
 transition: 'all 0.2s',
 }}>ขยายเป็น {r} กม.</button>
 ))}
 </div>
 </>
 ) : (
 <>
 <p style={{ fontSize: '1.05rem', fontWeight: 700, color: '#2d3748', marginBottom: 6 }}>ไม่พบทรัพย์สินที่ตรงกับเงื่อนไข</p>
 <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: 16 }}>ลองปรับตัวกรองใหม่ หรือดูทรัพย์ทั้งหมด</p>
 <button onClick={clearAll} style={{
 background: 'linear-gradient(135deg, #3d7a3a, #2d5e2b)', color: '#fff',
 border: 'none', borderRadius: 10, padding: '10px 24px',
 cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700,
 boxShadow: '0 3px 10px rgba(61,122,58,0.25)',
 display: 'inline-flex', alignItems: 'center', gap: 6,
 transition: 'all 0.2s',
 }}>
 <i className="fas fa-redo" style={{ fontSize: '0.75rem' }} /> ล้างตัวกรองทั้งหมด
 </button>
 </>
 )}
 </div>
 ) : viewMode === 'map' ? (
 /* ===== MAP VIEW — split on desktop, stacked on mobile (map top / list bottom) ===== */
 <>
 <style>{`
 .map-split { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border-radius: 18px; overflow: hidden; border: 1px solid #e5e5e5; box-shadow: 0 6px 28px rgba(0,0,0,0.08); background: #fff; }
 .map-split-list { overflow-y: auto; max-height: 780px; padding: 14px; }
 .map-split-list::-webkit-scrollbar { width: 6px; }
 .map-split-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 3px; }
 .map-split-map { position: relative; min-height: 780px; background: #eceae6; }
 .map-card-item { margin-bottom: 14px; border-radius: 14px; overflow: hidden; background: #fff; border: 1px solid #eee; transition: all 0.2s; cursor: pointer; }
 .map-card-item:hover, .map-card-item.active { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(26,58,24,0.18); border-color: #A1D99B; }
 @media (max-width: 900px) {
 .map-split { grid-template-columns: 1fr; border-radius: 14px; }
 .map-split-list { max-height: none; order: 2; padding: 12px; display: grid; grid-template-columns: 1fr; gap: 12px; }
 .map-split-list .map-card-item { margin-bottom: 0; }
 .map-split-map { min-height: 420px; order: 1; }
 }
 `}</style>
 <div className="map-split">
 <div className="map-split-list">
 {properties.map(p => (
 <MapMiniCard key={p.id} property={p} active={activeMapId === p.id}
 onHover={() => setActiveMapId(p.id)}
 onClick={() => {
 window.dispatchEvent(new CustomEvent('page-transition', { detail: { to: `/property/${p.id}` } }));
 }}
 />
 ))}
 </div>
 <div className="map-split-map">
 <SearchResultMap
 properties={properties}
 activeId={activeMapId}
 onSelect={(p) => setActiveMapId(p.id)}
 height={780}
 />
 </div>
 </div>
 </>
 ) : (
 <div className="search-grid" style={{
 display: 'grid',
 gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
 gap: 18,
 }}>
 {properties.map(p => {
 const distKm = p._distKm;
 const distColor = distKm == null ? null : distKm <= 1 ? '#A1D99B' : distKm <= 3 ? '#f59e0b' : '#ef4444';
 const distText = distKm == null ? null : distKm < 1 ? `${Math.round(distKm * 1000)} ม.` : `${distKm.toFixed(1)} กม.`;
 return (
 <div key={p.id} style={{ position: 'relative' }}>
 {distText && (
 <div style={{
 position: 'absolute', top: 10, left: 10, zIndex: 10,
 background: distColor, color: '#fff',
 borderRadius: 20, padding: '3px 10px',
 fontSize: '0.72rem', fontWeight: 800,
 boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
 pointerEvents: 'none',
 }}>
 {distText}
 </div>
 )}
 <PropertyCard property={p} />
 </div>
 );
 })}
 </div>
 )}

 {/* Pagination — always visible (buttons disabled when can't go further) */}
 {!loading && properties.length > 0 && (() => {
 const totalPages = Math.max(1, pagination.totalPages || 1);
 const goTo = (n) => {
 if (n < 1 || n > totalPages) return;
 const p = new URLSearchParams(searchParams);
 p.set('page', n);
 setSearchParams(p);
 window.scrollTo({ top: 0, behavior: 'smooth' });
 };
 const canPrev = currentPage > 1;
 const canNext = currentPage < totalPages;
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
 <div className="search-pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 36, flexWrap: 'wrap' }}>
 {arrowBtn('fa-arrow-left', canPrev, () => goTo(currentPage - 1))}
 <div style={{
 fontSize: '0.9rem', fontWeight: 600, color: '#1a3a18',
 fontFamily: "'Manrope', sans-serif", letterSpacing: '0.1em',
 minWidth: 70, textAlign: 'center',
 }}>
 <span style={{ fontSize: '1.1rem' }}>{String(currentPage).padStart(2, '0')}</span>
 <span style={{ margin: '0 8px', opacity: 0.4 }}>/</span>
 <span style={{ opacity: 0.55 }}>{String(totalPages).padStart(2, '0')}</span>
 </div>
 {arrowBtn('fa-arrow-right', canNext, () => goTo(currentPage + 1))}
 </div>
 );
 })()}
 </main>
 </div>

 {/* ========== DESKTOP SIDEBAR CSS ========== */}
 <style>{`
 @media (min-width: 768px) {
 .filter-sidebar { display: block !important; }
 }
 @media (max-width: 767px) {
 .filter-sidebar {
 width: 100% !important;
 position: static !important;
 margin-bottom: 16px;
 }
 .search-grid {
 grid-template-columns: 1fr !important;
 }
 }
 `}</style>
 </div>
 );
}

// ===== Filter Panel Component =====
function FilterPanel({ filters, provinces, onApply, onClear, hasActive }) {
 const [local, setLocal] = useState({ ...filters });

 useEffect(() => { setLocal({ ...filters }); }, [filters]);

 const update = (k, v) => setLocal(prev => ({ ...prev, [k]: v }));

 return (
 <div style={{
 background: '#fff', borderRadius: 16,
 boxShadow: 'none',
 padding: '20px 18px', fontSize: '0.85rem',
 border: '1px solid #eceff3',
 }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #f1f3f5' }}>
 <strong style={{ color: '#1a2b22', fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Prompt','Sarabun',sans-serif", letterSpacing: '-0.01em' }}>
 <i className="fas fa-sliders-h" style={{ color: '#3d7a3a', fontSize: '0.85rem' }} />ตัวกรอง
 </strong>
 {hasActive && (
 <button onClick={onClear} style={{
 background: 'transparent', border: 'none',
 color: '#dc2626', fontSize: '0.75rem',
 cursor: 'pointer', fontWeight: 700,
 padding: '3px 6px', borderRadius: 6,
 display: 'flex', alignItems: 'center', gap: 4,
 transition: 'all 0.15s',
 textDecoration: 'underline', textUnderlineOffset: 3,
 }}>ล้างทั้งหมด</button>
 )}
 </div>

 {/* จังหวัด */}
 <FilterGroup label="จังหวัด">
 <select
 value={local.province}
 onChange={e => { update('province', e.target.value); onApply({ province: e.target.value }); }}
 style={selectStyle}
 >
 <option value="">ทุกจังหวัด</option>
 {provinces.map(p => <option key={p.id || p.name} value={p.name}>{p.name}</option>)}
 </select>
 </FilterGroup>

 {/* ช่วงราคา */}
 <FilterGroup label="ช่วงราคา">
 <select
 value={local.priceRange}
 onChange={e => { update('priceRange', e.target.value); onApply({ priceRange: e.target.value }); }}
 style={selectStyle}
 >
 <option value="">ทุกราคา</option>
 {PRICE_RANGES.filter(r => r.value !== '').map(r => (
 <option key={r.value} value={r.value}>{r.label}</option>
 ))}
 </select>
 </FilterGroup>

 {/* ห้องนอน */}
 <FilterGroup label="ห้องนอน (ขั้นต่ำ)">
 <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
 {['', '1', '2', '3', '4'].map(n => {
 const active = local.bedrooms === n;
 return (
 <button
 key={n}
 onClick={() => { update('bedrooms', n); onApply({ bedrooms: n }); }}
 style={{
 minWidth: n === '' ? 58 : 42,
 padding: '6px 10px', borderRadius: 999,
 border: `1px solid ${active ? '#1a3a18' : '#e4e8ec'}`,
 background: active ? '#1a3a18' : '#fff',
 color: active ? '#fff' : '#2f3a45',
 fontSize: '0.8rem', cursor: 'pointer', fontWeight: active ? 700 : 600,
 transition: 'all 0.15s',
 }}
 >{n === '' ? 'ทั้งหมด' : `${n}+`}</button>
 );
 })}
 </div>
 </FilterGroup>
 </div>
 );
}

function FilterGroup({ label, children }) {
 return (
 <div style={{ marginBottom: 18 }}>
 <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1a2b22', marginBottom: 8, letterSpacing: '0.01em', fontFamily: "'Prompt','Sarabun',sans-serif" }}>{label}</div>
 {children}
 </div>
 );
}

// Compact horizontal card for map-split view
function MapMiniCard({ property, active, onHover, onClick }) {
 const { id, title, listing_type, price_requested, monthly_rent, bedrooms, bathrooms,
 land_area_rai, land_area_ngan, land_area_wah, district, province, thumbnail_url } = property;
 const imgSrc = thumbnail_url
 ? (thumbnail_url.startsWith('http') ? thumbnail_url : `/${thumbnail_url.replace(/^\/+/, '')}`)
 : null;
 const priceStr = listing_type === 'rent'
 ? (monthly_rent ? `฿${formatPrice(monthly_rent)}/ด.` : '—')
 : (price_requested ? `฿${formatPrice(price_requested)}` : '—');
 const areaText = [
 Number(land_area_rai) > 0 && `${land_area_rai} ไร่`,
 Number(land_area_ngan) > 0 && `${land_area_ngan} งาน`,
 Number(land_area_wah) > 0 && `${land_area_wah} ตร.ว.`,
 ].filter(Boolean).join(' ');
 const specs = [
 bedrooms > 0 && `${bedrooms} ห้องนอน`,
 bathrooms > 0 && `${bathrooms} ห้องน้ำ`,
 areaText,
 ].filter(Boolean).join(' · ');

 return (
 <div onMouseEnter={onHover} onClick={onClick}
 style={{
 display: 'flex', gap: 12, padding: 10, marginBottom: 12,
 background: '#fff', borderRadius: 14,
 border: `1px solid ${active ? '#A1D99B' : '#eceff3'}`,
 boxShadow: active ? '0 6px 18px rgba(26,58,24,0.14)' : 'none',
 cursor: 'pointer', transition: 'all 0.2s',
 transform: active ? 'translateY(-1px)' : 'none',
 }}>
 <div style={{ width: 120, height: 94, flexShrink: 0, borderRadius: 10, overflow: 'hidden', background: '#e8edf2' }}>
 {imgSrc ? (
 <img src={imgSrc} alt={title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
 ) : (
 <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aab', fontSize: '1.5rem' }}>
 <i className="fas fa-home" />
 </div>
 )}
 </div>
 <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '2px 2px 2px 0', gap: 4 }}>
 <div>
 <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1f3a2e', fontFamily: "'Manrope',sans-serif", lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 5 }}>
 {priceStr}
 </div>
 <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1a2b22', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
 {title || 'ไม่ระบุชื่อ'}
 </div>
 </div>
 <div>
 {specs && <div style={{ fontSize: '0.82rem', color: '#2f3a45', fontWeight: 600, lineHeight: 1.3 }}>{specs}</div>}
 {(district || province) && (
 <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: '#6a737d', fontWeight: 600, marginTop: 3 }}>
 <i className="fas fa-location-dot" style={{ color: '#3d7a3a', fontSize: '0.78rem' }} />
 <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
 {[district, province].filter(Boolean).join(', ')}
 </span>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}

function PageBtn({ label, active, onClick }) {
 return (
 <button
 onClick={onClick}
 onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#e8f5e6'; e.currentTarget.style.borderColor = '#A1D99B'; e.currentTarget.style.color = '#3d7a3a'; } }}
 onMouseLeave={e => { if (!active) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.color = '#555'; } }}
 style={{
 width: 38, height: 38, borderRadius: 10,
 border: active ? '2px solid #3d7a3a' : '1.5px solid #e0e0e0',
 background: active ? 'linear-gradient(135deg, #3d7a3a, #2d5e2b)' : '#fff',
 color: active ? '#fff' : '#555',
 fontSize: '0.88rem', fontWeight: active ? 700 : 500,
 cursor: 'pointer',
 transition: 'all 0.2s',
 boxShadow: active ? '0 3px 10px rgba(61,122,58,0.25)' : '0 1px 3px rgba(0,0,0,0.05)',
 }}
 >{label}</button>
 );
}

const selectStyle = {
 width: '100%', padding: '10px 34px 10px 14px',
 borderRadius: 10, border: '1px solid #e4e8ec',
 fontSize: '0.85rem', background: '#fff',
 color: '#1a2b22', fontWeight: 600,
 outline: 'none', cursor: 'pointer',
 transition: 'border-color 0.2s',
 fontFamily: 'inherit',
 appearance: 'none', WebkitAppearance: 'none',
 backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27%3E%3Cpath fill=%27%231a3a18%27 d=%27M12 15l-5-5h10z%27/%3E%3C/svg%3E")',
 backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
};

export default PropertySearch;
