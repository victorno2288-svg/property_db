import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import bigLogo from './pic/big-logo.png';
import imgSukhumvit from './pic/สุขุมวิท.jpg';
import imgRama9 from './pic/พระราม 9.jpg';
import imgAsok from './pic/อโศก-ทองหล่อ.jpg';
import imgBangna from './pic/บางนา.jpg';
import imgSathorn from './pic/สาทร-สีลม.jpg';
import imgLadprao from './pic/ลาดพร้าว.jpg';
import imgChiangmai from './pic/เชียงใหม่.png';
import imgPattaya from './pic/พัทยา.jpg';
import imgPhuket from './pic/ภูเก็ต.jpg';
import imgNonthaburi from './pic/นนทบุรี.jpg';
import imgHeroCover from './pic/ปก.gif';
import BTSMapSection from './components/BTSMapSection';
import PropertyCard from './components/PropertyCard';
import SearchSuggestBox from './components/SearchSuggestBox';

const API_BASE = '';

const typeLabels = {
 house: 'บ้านเดี่ยว', condo: 'คอนโด', land: 'ที่ดิน',
 townhouse: 'ทาวน์เฮ้าส์', townhome: 'ทาวน์โฮม', apartment: 'อพาร์ทเม้นท์', commercial: 'อาคารพาณิชย์',
 home_office: 'โฮมออฟฟิศ', warehouse: 'โกดัง/โรงงาน',
};

const Home = () => {
 const brandGreen = '#3d7a3a';
 const brandGreenBg = '#A1D99B';
 const brandBright = '#2DB88E';
 const gold = '#C9A84C';
 const API_URL = `${API_BASE}/api/properties`;
 const navigate = useNavigate();
 const location = useLocation();

 // State
 const [featuredProperties, setFeaturedProperties] = useState([]);
 const [latestProperties, setLatestProperties] = useState([]);
 const [heroSlides, setHeroSlides] = useState([]);
 const [heroIndex, setHeroIndex] = useState(0);
 const heroTimer = useRef(null);
 const heroTouchRef = useRef({ startX: 0 });
 const [stats, setStats] = useState({ total: 0, province_count: 0, for_sale: 0, for_rent: 0, reserved: 0, sold: 0 });
 const [searchTerm, setSearchTerm] = useState('');
 const [activeTab, setActiveTab] = useState('sale');
 const [loading, setLoading] = useState(true);
const [showHomeSuggest, setShowHomeSuggest] = useState(false);
 const [heroPropertyType, setHeroPropertyType] = useState('');
 const [showTypeMenu, setShowTypeMenu] = useState(false);
 const locScrollRef = useRef(null);
 const scrollLoc = (dir) => { if (locScrollRef.current) locScrollRef.current.scrollBy({ left: dir * 420, behavior: 'smooth' }); };
 // ── Shared momentum drag factory ──────────────────────────────────────────
 const makeDrag = (scrollRef) => {
 const state = { active: false, startX: 0, scrollLeft: 0, moved: false, lastX: 0, velocity: 0, lastTime: 0, raf: null };
 const onDown = (e) => {
 cancelAnimationFrame(state.raf);
 const el = scrollRef.current; if (!el) return;
 state.active = true; state.moved = false;
 state.startX = e.pageX - el.offsetLeft;
 state.scrollLeft = el.scrollLeft;
 state.lastX = e.pageX; state.velocity = 0; state.lastTime = Date.now();
 el.style.cursor = 'grabbing'; el.style.userSelect = 'none';
 };
 const onMove = (e) => {
 if (!state.active) return;
 const el = scrollRef.current; if (!el) return;
 const now = Date.now(); const dt = Math.max(now - state.lastTime, 1);
 state.velocity = (state.lastX - e.pageX) / dt; // px/ms
 state.lastX = e.pageX; state.lastTime = now;
 const x = e.pageX - el.offsetLeft;
 if (Math.abs(x - state.startX) > 5) state.moved = true;
 el.scrollLeft = state.scrollLeft - (x - state.startX);
 };
 const onUp = () => {
 if (!state.active) return;
 state.active = false;
 const el = scrollRef.current; if (!el) return;
 el.style.cursor = 'grab'; el.style.userSelect = '';
 // Momentum: keep scrolling and decelerate
 let v = state.velocity * 18; // amplify
 const animate = () => {
 if (!scrollRef.current || Math.abs(v) < 0.3) return;
 scrollRef.current.scrollLeft += v;
 v *= 0.88; // friction
 state.raf = requestAnimationFrame(animate);
 };
 state.raf = requestAnimationFrame(animate);
 };
 return { state, onDown, onMove, onUp };
 };

 // ทำเลยอดนิยม
 const locDragObj = useRef(makeDrag(locScrollRef));
 const locDrag = locDragObj.current.state;
 const onLocMouseDown = (e) => locDragObj.current.onDown(e);
 const onLocMouseMove = (e) => locDragObj.current.onMove(e);
 const onLocMouseUp = () => locDragObj.current.onUp();

 // ทรัพย์สินแนะนำ
 const featScrollRef = useRef(null);
 const scrollFeat = (dir) => { if (featScrollRef.current) featScrollRef.current.scrollBy({ left: dir * 540, behavior: 'smooth' }); };
 const featDragObj = useRef(null);
 if (!featDragObj.current) featDragObj.current = makeDrag(featScrollRef);
 const featDrag = featDragObj.current.state;
 const onFeatMouseDown = (e) => featDragObj.current.onDown(e);
 const onFeatMouseMove = (e) => featDragObj.current.onMove(e);
 const onFeatMouseUp = () => featDragObj.current.onUp();

 // ประกาศล่าสุด
 const latScrollRef = useRef(null);
 const scrollLat = (dir) => { if (latScrollRef.current) latScrollRef.current.scrollBy({ left: dir * 540, behavior: 'smooth' }); };
 const latDragObj = useRef(null);
 if (!latDragObj.current) latDragObj.current = makeDrag(latScrollRef);
 const latDrag = latDragObj.current.state;
 const onLatMouseDown = (e) => latDragObj.current.onDown(e);
 const onLatMouseMove = (e) => latDragObj.current.onMove(e);
 const onLatMouseUp = () => latDragObj.current.onUp();

 // === เพิ่มแค่ตรงนี้: อ่าน user จาก localStorage ===
 const [user, setUser] = useState(null);
 useEffect(() => {
 try {
 const stored = localStorage.getItem('user');
 if (stored) setUser(JSON.parse(stored));
 } catch (e) { /* ignore */ }
 }, []);

 // Fetch data — re-fetch เมื่อ navigate กลับมาหน้านี้ หรือ focus กลับมาที่แท็บ (real-time update)
 const fetchData = async () => {
 try {
 const [featuredRes, latestRes, statsRes, heroRes] = await Promise.all([
 fetch(`${API_URL}/featured`),
 fetch(`${API_URL}/latest?limit=50`),
 fetch(`${API_URL}/stats`),
 fetch(`${API_URL}/featured-random?limit=3`),
 ]);
 const featured = await featuredRes.json();
 const latest = await latestRes.json();
 const statsData = await statsRes.json();
 const heroRandom = await heroRes.json();

 const featuredList = Array.isArray(featured) ? featured : [];
 const latestList = Array.isArray(latest) ? latest : [];

 setFeaturedProperties(featuredList);
 // "ทรัพย์ทั้งหมด" — แสดงทุกรายการ รวมถึงทรัพย์แนะนำด้วย (เจ้านายอยากเห็นทั้งหมดจริงๆ)
 setLatestProperties(latestList);
 if (statsData && statsData.total != null) setStats(statsData);

 // Hero slides — slide 0 = cover branding, slides 1+ = random featured from API
 const heroProperties = Array.isArray(heroRandom) ? heroRandom.filter(p => p.thumbnail_url || (p.images && p.images.length > 0)) : [];
 const coverSlide = { id: '__cover__', isCover: true };
 setHeroSlides([coverSlide, ...heroProperties]);
 } catch (err) {
 console.error('Error fetching properties:', err);
 } finally {
 setLoading(false);
 }
 };

 // Re-fetch ทุกครั้งที่ navigate กลับมาหน้านี้
 useEffect(() => {
 fetchData();
 }, [location.key]);

 // Re-fetch เมื่อ user สลับแท็บกลับมา
 useEffect(() => {
 const onVis = () => { if (!document.hidden) fetchData(); };
 document.addEventListener('visibilitychange', onVis);
 return () => document.removeEventListener('visibilitychange', onVis);
 }, []);

 // Hero auto-slide every 7 seconds with progress bar
 const HERO_INTERVAL = 7000;
 const [heroProgress, setHeroProgress] = useState(0);
 const heroProgressTimer = useRef(null);

 useEffect(() => {
 if (heroSlides.length <= 1) return;
 setHeroProgress(0);
 const startTime = Date.now();
 heroProgressTimer.current = setInterval(() => {
 const elapsed = Date.now() - startTime;
 const pct = Math.min((elapsed % HERO_INTERVAL) / HERO_INTERVAL * 100, 100);
 setHeroProgress(pct);
 }, 50);
 heroTimer.current = setInterval(() => {
 setHeroIndex(prev => (prev + 1) % heroSlides.length);
 setHeroProgress(0);
 }, HERO_INTERVAL);
 return () => { clearInterval(heroTimer.current); clearInterval(heroProgressTimer.current); };
 }, [heroSlides.length, heroIndex]);

 const heroGo = (idx) => { clearInterval(heroTimer.current); clearInterval(heroProgressTimer.current); setHeroProgress(0); setHeroIndex(idx); };
 const heroNext = () => heroGo((heroIndex + 1) % heroSlides.length);
 const heroPrev = () => heroGo((heroIndex - 1 + heroSlides.length) % heroSlides.length);

 // Helper: get property image URL
 const getPropertyImage = (p) => {
 if (p.thumbnail_url) return p.thumbnail_url.startsWith('http') ? p.thumbnail_url : `${API_BASE}${p.thumbnail_url}`;
 if (p.images && p.images.length > 0) {
 const url = p.images[0].image_url || p.images[0];
 return typeof url === 'string' && url.startsWith('http') ? url : `${API_BASE}${url}`;
 }
 return imgHeroCover;
 };

 const formatPrice = (price) => {
 if (!price) return '';
 const n = Number(price);
 if (n >= 1000000) return `฿${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1)} ล้าน`;
 return `฿${n.toLocaleString()}`;
 };

 return (
 <div>
 <Navbar />

 {/* === SEARCH HEADER — fully transparent floating over hero === */}
 <section className="hero-search-band" style={{
 background: 'transparent',
 position: 'absolute', top: 66, left: 0, right: 0, zIndex: 20,
 paddingTop: 22, paddingLeft: 20, paddingRight: 20, paddingBottom: 22,
 pointerEvents: 'none',
 }}>
 <div style={{ maxWidth: 900, margin: '0 auto', pointerEvents: 'auto' }}>

 {/* Row: Headline left + Tabs right */}
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
 <h2 style={{
 color: '#fff', fontSize: 'clamp(1.2rem, 3vw, 1.55rem)',
 fontFamily: "'Prompt', sans-serif", fontWeight: 400,
 margin: 0, lineHeight: 1.4, letterSpacing: '-0.01em',
 textShadow: '0 2px 12px rgba(0,0,0,0.4)',
 }}>
 ค้นหาบ้านที่ใช่สำหรับคุณ
 </h2>
 {/* Tabs */}
 <div style={{ display: 'flex', gap: 0 }}>
 {[
 { key: 'sale', label: 'ซื้อ' },
 { key: 'rent', label: 'เช่า' },
 ].map(t => (
 <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
 style={{
 padding: '8px 20px', border: 'none', background: 'transparent',
 color: '#fff', fontSize: '0.85rem', fontWeight: 700,
 letterSpacing: '0.1em', textTransform: 'uppercase',
 cursor: 'pointer', fontFamily: "'Manrope', sans-serif",
 borderBottom: activeTab === t.key ? '2.5px solid #fff' : '2.5px solid transparent',
 transition: 'all 0.25s', opacity: activeTab === t.key ? 1 : 0.55,
 textShadow: '0 1px 4px rgba(0,0,0,0.3)',
 }}
 onMouseEnter={e => { if (activeTab !== t.key) e.currentTarget.style.opacity = '0.8'; }}
 onMouseLeave={e => { if (activeTab !== t.key) e.currentTarget.style.opacity = '0.5'; }}
 >
 {t.label}
 </button>
 ))}
 {/* Property type as tab — custom dropdown */}
 <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
 <button type="button" onClick={() => setShowTypeMenu(v => !v)}
 onBlur={() => setTimeout(() => setShowTypeMenu(false), 150)}
 style={{
 padding: '8px 20px', border: 'none', background: 'transparent',
 color: '#fff', fontSize: '0.85rem', fontWeight: 700,
 letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
 fontFamily: "'Manrope', sans-serif",
 borderBottom: (heroPropertyType || showTypeMenu) ? '2.5px solid #fff' : '2.5px solid transparent',
 opacity: (heroPropertyType || showTypeMenu) ? 1 : 0.55, transition: 'all 0.25s', outline: 'none',
 textShadow: '0 1px 4px rgba(0,0,0,0.3)',
 display: 'flex', alignItems: 'center', gap: 6,
 }}
 onMouseEnter={e => { if (!heroPropertyType && !showTypeMenu) e.currentTarget.style.opacity = '0.8'; }}
 onMouseLeave={e => { if (!heroPropertyType && !showTypeMenu) e.currentTarget.style.opacity = '0.55'; }}
 >
 {heroPropertyType ? typeLabels[heroPropertyType] || 'ประเภท' : 'ประเภท'}
 <i className="fas fa-chevron-down" style={{ fontSize: '0.55rem', transition: 'transform 0.25s', transform: showTypeMenu ? 'rotate(180deg)' : 'rotate(0)' }} />
 </button>

 {showTypeMenu && (
 <div style={{
 position: 'absolute', top: 'calc(100% + 10px)', right: 0, zIndex: 100,
 minWidth: 180,
 background: 'rgba(255,255,255,0.92)',
 backdropFilter: 'blur(20px) saturate(160%)',
 WebkitBackdropFilter: 'blur(20px) saturate(160%)',
 borderRadius: 14,
 border: '1px solid rgba(255,255,255,0.6)',
 boxShadow: '0 12px 40px rgba(0,0,0,0.22)',
 padding: '8px 0',
 animation: 'suggestFadeIn 0.18s ease',
 }}
 onMouseDown={e => e.preventDefault()}
 >
 {[
 { val: '', label: 'ทุกประเภท' },
 { val: 'condo', label: 'คอนโด' },
 { val: 'house', label: 'บ้านเดี่ยว' },
 { val: 'townhouse', label: 'ทาวน์เฮ้าส์' },
 { val: 'townhome', label: 'ทาวน์โฮม' },
 { val: 'land', label: 'ที่ดิน' },
 { val: 'commercial', label: 'อาคารพาณิชย์' },
 { val: 'home_office', label: 'โฮมออฟฟิศ' },
 { val: 'warehouse', label: 'โกดัง/โรงงาน' },
 ].map(opt => {
 const active = heroPropertyType === opt.val;
 return (
 <button key={opt.val} type="button"
 onClick={() => { setHeroPropertyType(opt.val); setShowTypeMenu(false); }}
 style={{
 display: 'flex', alignItems: 'center', justifyContent: 'space-between',
 width: '100%', padding: '10px 16px',
 border: 'none', cursor: 'pointer',
 background: active ? 'rgba(26,58,24,0.12)' : 'transparent',
 color: '#1a1a1a', fontFamily: "'Prompt', sans-serif",
 fontSize: '0.9rem', fontWeight: active ? 700 : 500,
 textAlign: 'left', transition: 'background 0.15s',
 }}
 onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(26,58,24,0.08)'; }}
 onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
 >
 {opt.label}
 {active && <i className="fas fa-check" style={{ color: '#3d7a3a', fontSize: '0.75rem' }} />}
 </button>
 );
 })}
 </div>
 )}
 </div>

 </div>
 </div>

 {/* Search input — frosted card style */}
 <div style={{ position: 'relative' }}>
 <form
 onSubmit={e => {
 e.preventDefault();
 setShowHomeSuggest(false);
 const p = new URLSearchParams({ page: '1' });
 if (activeTab === 'sale' || activeTab === 'rent') p.set('listing_type', activeTab);
 if (searchTerm) p.set('search', searchTerm);
 if (heroPropertyType) p.set('property_type', heroPropertyType);
 navigate(`/search?${p.toString()}`);
 }}
 style={{
 display: 'flex', alignItems: 'center',
 background: '#fff',
 borderRadius: 999, padding: '6px 8px 6px 20px', gap: 10,
 border: '1.5px solid rgba(26,58,24,0.1)',
 boxShadow: '0 6px 22px rgba(0,0,0,0.18)',
 transition: 'all 0.3s',
 }}
 >
 <i className="fas fa-search" style={{ color: '#888', fontSize: '0.88rem', flexShrink: 0 }} />
 <input
 type="text" value={searchTerm}
 onChange={e => setSearchTerm(e.target.value)}
 onFocus={() => setShowHomeSuggest(true)}
 onBlur={() => setTimeout(() => setShowHomeSuggest(false), 150)}
 placeholder="ค้นหาทำเล, โครงการ, จังหวัด..."
 className="hero-search-input-light"
 style={{
 flex: 1, border: 'none', outline: 'none', background: 'transparent',
 color: '#1a1a1a', fontSize: '1rem', fontFamily: "'Prompt', sans-serif",
 fontWeight: 400, letterSpacing: '0.01em',
 padding: '8px 0',
 }}
 />
 {searchTerm && (
 <button type="button" onClick={() => setSearchTerm('')}
 style={{ border: 'none', background: 'none', color: '#999', cursor: 'pointer', padding: '0 4px', fontSize: '0.88rem' }}>
 <i className="fas fa-times" />
 </button>
 )}
 <button type="submit" style={{
 background: '#A1D99B', border: 'none', color: '#1a3a18', cursor: 'pointer',
 width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 fontSize: '0.85rem', transition: 'all 0.25s',
 boxShadow: '0 2px 10px rgba(161,217,155,0.5)',
 }}
 onMouseEnter={e => { e.currentTarget.style.background = '#8fce86'; e.currentTarget.style.transform = 'scale(1.08)'; }}
 onMouseLeave={e => { e.currentTarget.style.background = '#A1D99B'; e.currentTarget.style.transform = 'scale(1)'; }}
 >
 <i className="fas fa-arrow-right" />
 </button>
 </form>
 <SearchSuggestBox
 visible={showHomeSuggest} inputValue={searchTerm}
 onSelect={val => setSearchTerm(val)}
 onClose={() => setShowHomeSuggest(false)}
 activeFilters={{ listing_type: activeTab, property_type: heroPropertyType }}
 />
 </div>
 </div>
 </section>

 {/* === HERO — Full-screen Slideshow (Sotheby's Style) === */}
 <style>{`
 @keyframes heroKenBurns {
 0% { transform: scale(1.0); }
 100% { transform: scale(1.08); }
 }
 .hero-slide-bg { position: absolute; inset: 0; will-change: opacity; }
 .hero-slide-bg img {
 width: 100%; height: 100%; object-fit: cover; object-position: center;
 animation: heroKenBurns ${HERO_INTERVAL / 1000 + 1}s ease-out forwards;
 }
 .hero-slide-bg.active { opacity: 1; z-index: 1; }
 .hero-slide-bg.inactive { opacity: 0; z-index: 0; }
 `}</style>
 <section style={{ position: 'relative', height: '100vh', minHeight: 560, overflow: 'hidden' }}
 onTouchStart={e => { heroTouchRef.current.startX = e.touches[0].clientX; }}
 onTouchEnd={e => {
 const dx = e.changedTouches[0].clientX - heroTouchRef.current.startX;
 if (Math.abs(dx) > 50) { dx < 0 ? heroNext() : heroPrev(); }
 }}
 >

 {/* Slide backgrounds with Ken Burns zoom */}
 {heroSlides.map((slide, i) => (
 <div key={slide.id + '-' + i}
 className={`hero-slide-bg ${i === heroIndex ? 'active' : 'inactive'}`}
 style={{ transition: 'opacity 1.4s ease-in-out' }}
 >
 <img
 key={heroIndex === i ? `active-${heroIndex}` : `idle-${i}`}
 src={slide.isCover ? imgHeroCover : getPropertyImage(slide)}
 alt={slide.isCover ? 'บ้าน D มีเชง' : slide.title}
 />
 </div>
 ))}

 {/* Cinematic gradient overlay — darker for readable text */}
 <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.35) 35%, rgba(0,0,0,0.65) 70%, rgba(0,0,0,0.88) 100%)', pointerEvents: 'none' }} />
 {/* Extra uniform dim — ensures text readable anywhere on hero */}
 <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'rgba(10,15,12,0.28)', pointerEvents: 'none' }} />

 {/* Content overlay */}
 <div style={{ position: 'relative', zIndex: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>

 {/* Property info — Sotheby's style: vertically centered, left-aligned */}
 <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 clamp(24px, 5vw, 80px)' }}>
 <div style={{ maxWidth: 700, width: '100%' }}>
 {heroSlides[heroIndex]?.isCover ? (
 /* === Slide 0: Cover branding — Sotheby's editorial === */
 <>
 <div style={{ width: 48, height: 1, background: 'rgba(255,255,255,0.4)', marginBottom: 20 }} />
 <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 18, fontFamily: "'Manrope', sans-serif" }}>
 Curated Properties
 </div>
 <h1 style={{ color: '#fff', fontSize: 'clamp(2.6rem, 7vw, 4.2rem)', fontFamily: "'Prompt', sans-serif", fontWeight: 500, letterSpacing: '-0.02em', margin: '0 0 20px', lineHeight: 1.08, textShadow: '0 2px 40px rgba(0,0,0,0.4)' }}>
 ทรัพย์รีโนเวทพร้อมอยู่
 </h1>
 <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.05rem', margin: '0 0 22px', fontFamily: "'Prompt', sans-serif", fontWeight: 300, lineHeight: 1.8, maxWidth: 520 }}>
 อสังหาริมทรัพย์คัดสรรโดย บ้าน D มีเชง<br />คุณภาพครบ ราคาเป็นธรรม ตรวจสอบโฉนดแล้วทุกรายการ
 </p>
 <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', fontFamily: "'Manrope', sans-serif", letterSpacing: '0.04em' }}>
 <i className="fas fa-shield-alt" style={{ fontSize: '0.6rem' }} />
 ทรัพย์ทุกรายการผ่านการตรวจสอบโฉนดแล้ว
 </div>
 </>
 ) : heroSlides[heroIndex] ? (
 /* === Slides 1+: Featured property — Sotheby's layout === */
 (() => {
 const s = heroSlides[heroIndex];
 const bigTitle = s.title || (s.district ? `${s.district}` : s.province) || 'ทรัพย์แนะนำ';
 const locationLine = s.province ? (s.district && s.title ? `${s.district}, ${s.province}` : (!s.title && s.district ? s.province : (s.district ? `${s.district}, ${s.province}` : s.province))) : '';
 const typeLabel = s.property_type && typeLabels[s.property_type] ? typeLabels[s.property_type] : '';
 return <>
 <div style={{ width: 48, height: 1, background: 'rgba(255,255,255,0.4)', marginBottom: 20 }} />
 {typeLabel && (
 <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 14, fontFamily: "'Manrope', sans-serif" }}>
 {typeLabel}
 </div>
 )}
 <h1 style={{
 color: '#fff', fontSize: 'clamp(2.6rem, 8vw, 4.2rem)',
 fontFamily: "'Prompt', sans-serif", fontWeight: 500,
 letterSpacing: '-0.02em', margin: '0 0 16px', lineHeight: 1.08,
 textShadow: '0 2px 40px rgba(0,0,0,0.4)',
 }}>
 {bigTitle}
 </h1>
 <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
 {locationLine && (
 <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', fontFamily: "'Prompt', sans-serif", fontWeight: 300, letterSpacing: '0.01em' }}>
 <i className="fas fa-map-marker-alt" style={{ fontSize: '0.75rem', marginRight: 6, opacity: 0.7 }} />
 {locationLine}
 </span>
 )}
 {s.price_requested > 0 && (
 <>
 {locationLine && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.6rem' }}>|</span>}
 <span style={{ color: '#fff', fontWeight: 600, fontSize: '1.15rem', fontFamily: "'Prompt', sans-serif", letterSpacing: '0.01em' }}>
 {formatPrice(s.price_requested)}
 </span>
 </>
 )}
 </div>
 <Link
 to={`/property/${s.id}`}
 style={{
 display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
 color: '#fff', textDecoration: 'none',
 fontSize: '0.78rem', fontWeight: 700, fontFamily: "'Manrope', sans-serif",
 letterSpacing: '0.2em', textTransform: 'uppercase',
 background: 'rgba(20, 26, 22, 0.72)',
 backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
 border: '1px solid rgba(255,255,255,0.18)',
 padding: '14px 22px',
 minWidth: 180,
 transition: 'all 0.3s ease',
 }}
 onMouseEnter={e => {
 e.currentTarget.style.background = 'rgba(255,255,255,0.95)';
 e.currentTarget.style.color = '#1a1a1a';
 e.currentTarget.style.borderColor = '#fff';
 const arrow = e.currentTarget.querySelector('i');
 if (arrow) arrow.style.transform = 'translateX(4px)';
 }}
 onMouseLeave={e => {
 e.currentTarget.style.background = 'rgba(20, 26, 22, 0.72)';
 e.currentTarget.style.color = '#fff';
 e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
 const arrow = e.currentTarget.querySelector('i');
 if (arrow) arrow.style.transform = 'translateX(0)';
 }}
 >
 <span>รายละเอียด</span>
 <i className="fas fa-arrow-right" style={{ fontSize: '0.9rem', transition: 'transform 0.25s' }} />
 </Link>
 </>;
 })()
 ) : null}
 </div>
 </div>

 {/* Bottom: Navigation + Progress bar — Sotheby's minimal */}
 <div style={{ padding: '0 clamp(20px, 5vw, 80px) 0' }}>
 <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, paddingBottom: 18 }}>
 {heroSlides.length > 1 && (
 <>
 <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', fontFamily: "'Manrope', sans-serif", fontWeight: 500, letterSpacing: '0.12em', marginRight: 14 }}>
 {String(heroIndex + 1).padStart(2, '0')} <span style={{ opacity: 0.4 }}>/</span> {String(heroSlides.length).padStart(2, '0')}
 </span>
 <button onClick={heroPrev} style={{
 width: 46, height: 46, borderRadius: 0, background: 'transparent',
 border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.8)', cursor: 'pointer',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 fontSize: '0.75rem', transition: 'all 0.35s',
 }}
 onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'; e.currentTarget.style.color = '#fff'; }}
 onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
 >
 <i className="fas fa-arrow-left" />
 </button>
 <button onClick={heroNext} style={{
 width: 46, height: 46, borderRadius: 0, background: 'transparent',
 border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.8)', cursor: 'pointer',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 fontSize: '0.75rem', transition: 'all 0.35s',
 }}
 onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'; e.currentTarget.style.color = '#fff'; }}
 onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
 >
 <i className="fas fa-arrow-right" />
 </button>
 </>
 )}
 </div>
 {/* Progress bar — thin elegant lines */}
 {heroSlides.length > 1 && (
 <div style={{ display: 'flex', gap: 6, paddingBottom: 28 }}>
 {heroSlides.map((_, i) => (
 <button key={i} onClick={() => heroGo(i)} style={{
 flex: 1, height: 2, padding: 0, border: 'none', cursor: 'pointer',
 background: 'rgba(255,255,255,0.15)', position: 'relative', overflow: 'hidden',
 }}>
 <div style={{
 position: 'absolute', left: 0, top: 0, height: '100%',
 background: 'rgba(255,255,255,0.85)',
 width: i < heroIndex ? '100%' : i === heroIndex ? `${heroProgress}%` : '0%',
 transition: i === heroIndex ? 'none' : 'width 0.3s ease',
 }} />
 </button>
 ))}
 </div>
 )}
 </div>
 </div>
 </section>

 {/* Stats Strip & Property Type Icons ถูกเอาออก — เจ้านายว่ารก */}

 {/* BTSMapSection ถูกเอาออก — เจ้านายไม่ชอบ, ใช้ search suggest แทน */}

 {/* === Popular Locations — Dark theme === */}
 <section style={{ padding: '56px 0 52px', background: 'var(--surface-low)' }}>
 <style>{`
 #loc-carousel::-webkit-scrollbar { display: none; }
 .loc-card { position: relative; overflow: hidden; border-radius: 16px; cursor: pointer; flex-shrink: 0; scroll-snap-align: start; }
 .loc-card img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.5s ease; }
 .loc-card:hover img { transform: scale(1.08); }
 .loc-card::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.04) 100%); transition: background 0.3s; pointer-events: none; }
 .loc-card:hover::after { background: linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.05) 100%); }
 .loc-card .loc-info { position: absolute; bottom: 0; left: 0; right: 0; padding: 14px 16px; z-index: 2; }
 .loc-card .loc-name { color: #fff; font-weight: 800; font-size: 1.1rem; text-shadow: 0 1px 6px rgba(0,0,0,0.5); line-height: 1.2; }
 .loc-card .loc-sub-text { color: rgba(255,255,255,0.7); font-size: 0.72rem; font-weight: 500; margin-top: 2px; }
 .loc-card .loc-cta { display: inline-flex; align-items: center; gap: 6px; margin-top: 8px; padding: 5px 14px; background: rgba(255,255,255,0.95); color: #1a3a18; font-size: 0.72rem; font-weight: 700; border-radius: 20px; opacity: 0; transform: translateY(8px); transition: opacity 0.3s, transform 0.3s; }
 .loc-card:hover .loc-cta { opacity: 1; transform: translateY(0); }
 .loc-card .loc-region { position: absolute; top: 12px; right: 12px; z-index: 2; background: rgba(0,0,0,0.55); backdrop-filter: blur(6px); color: #fff; font-size: 0.65rem; font-weight: 700; border-radius: 20px; padding: 3px 10px; }
 `}</style>
 <div className="container">
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
 <div>
 <div className="section-eyebrow" style={{ marginBottom: 6 }}>Prime Destinations</div>
 <h2 style={{ fontWeight: 500, margin: '0 0 4px', fontSize: 'clamp(1.05rem,2.5vw,1.3rem)', color: 'var(--on-surface)', fontFamily: "'Prompt', sans-serif" }}>
 ทำเล<span style={{ color: brandGreen }}>ยอดนิยม</span>
 </h2>
 <p style={{ color: 'var(--outline)', fontSize: '0.82rem', margin: 0 }}>เลือกทำเลที่คุณสนใจ ดูทรัพย์ในพื้นที่นั้นได้ทันที</p>
 </div>
 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
 {[{ dir: -1, icon: 'fa-chevron-left' }, { dir: 1, icon: 'fa-chevron-right' }].map(({ dir, icon }) => (
 <button key={dir} onClick={() => scrollLoc(dir)} style={{
 width: 36, height: 36, borderRadius: '50%', border: `1.5px solid ${brandGreen}`,
 background: '#fff', color: brandGreen, cursor: 'pointer',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 transition: 'all 0.15s', flexShrink: 0, padding: 0,
 }}
 onMouseEnter={e => { e.currentTarget.style.background = brandGreenBg; e.currentTarget.style.color = '#1a3a18'; }}
 onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = brandGreen; }}
 >
 <i className={`fas ${icon}`} style={{ fontSize: '0.7rem' }} />
 </button>
 ))}
 <Link to="/search" style={{ color: brandGreen, fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none', marginLeft: 4, whiteSpace: 'nowrap' }}>ทั้งหมด →</Link>
 </div>
 </div>

 {/* Bento grid — 2 rows, scrollable horizontally with drag + arrows */}
 <div id="loc-carousel" ref={locScrollRef}
 onMouseDown={onLocMouseDown}
 onMouseMove={onLocMouseMove}
 onMouseUp={onLocMouseUp}
 onMouseLeave={onLocMouseUp}
 style={{
 display: 'grid',
 gridTemplateRows: '1fr 1fr',
 gridAutoFlow: 'column',
 gridAutoColumns: 'minmax(220px, 280px)',
 gap: 12,
 overflowX: 'auto',
 scrollSnapType: 'x proximity',
 scrollbarWidth: 'none',
 WebkitOverflowScrolling: 'touch',
 paddingBottom: 4,
 cursor: 'grab',
 minHeight: 420,
 }}>
 {[
 { name: 'สุขุมวิท', sub: 'กรุงเทพฯ', search: 'สุขุมวิท', province: 'กรุงเทพมหานคร', img: imgSukhumvit, span: true },
 { name: 'พระราม 9', sub: 'กรุงเทพฯ', search: 'พระราม 9', province: 'กรุงเทพมหานคร', img: imgRama9 },
 { name: 'อโศก–ทองหล่อ', sub: 'กรุงเทพฯ', search: 'อโศก', province: 'กรุงเทพมหานคร', img: imgAsok },
 { name: 'บางนา', sub: 'กรุงเทพฯ', search: 'บางนา', province: 'กรุงเทพมหานคร', img: imgBangna },
 { name: 'สาทร–สีลม', sub: 'กรุงเทพฯ', search: 'สาทร', province: 'กรุงเทพมหานคร', img: imgSathorn, span: true },
 { name: 'ลาดพร้าว', sub: 'กรุงเทพฯ', search: 'ลาดพร้าว', province: 'กรุงเทพมหานคร', img: imgLadprao },
 { name: 'เชียงใหม่', sub: 'ภาคเหนือ', province: 'เชียงใหม่', img: imgChiangmai },
 { name: 'ชลบุรี–พัทยา', sub: 'ภาคตะวันออก', province: 'ชลบุรี', img: imgPattaya, span: true },
 { name: 'ภูเก็ต', sub: 'ภาคใต้', province: 'ภูเก็ต', img: imgPhuket },
 { name: 'นนทบุรี', sub: 'ปริมณฑล', province: 'นนทบุรี', img: imgNonthaburi },
 ].map(loc => {
 const params = new URLSearchParams({ page: '1' });
 if (loc.province) params.set('province', loc.province);
 if (loc.search) params.set('search', loc.search);
 return (
 <Link
 key={loc.name}
 to={`/search?${params.toString()}`}
 className="loc-card"
 style={{
 textDecoration: 'none',
 gridRow: loc.span ? 'span 2' : 'auto',
 minHeight: loc.span ? 420 : 200,
 }}
 onClick={e => { if (locDragObj.current.state.moved) e.preventDefault(); }}
 >
 <img src={loc.img} alt={loc.name} draggable={false} />
 <div className="loc-region">{loc.sub}</div>
 <div className="loc-info">
 <div className="loc-name">{loc.name}</div>
 <div className="loc-cta">ดูทรัพย์ <i className="fas fa-chevron-right" style={{ fontSize: '0.6rem' }} /></div>
 </div>
 </Link>
 );
 })}
 </div>
 </div>
 </section>

 {/* === TRUST BADGES — seamless tonal shift === */}
 <section style={{ background: 'var(--surface-low)', padding: '44px 0 40px' }}>
 <div className="container">
 <p style={{ textAlign:'center', fontSize:'0.65rem', color:gold, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:24, fontFamily:"'Manrope', sans-serif" }}>
 มาตรฐานที่ บ้าน D มีเชง ยึดถือทุกรายการ
 </p>
 <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'12px 32px' }}>
 {[
 { icon:'fa-shield-alt', label:'ตรวจสอบโฉนดทุกแผ่น' },
 { icon:'fa-landmark', label:'ผ่านกรมที่ดิน' },
 { icon:'fa-file-contract', label:'สัญญาถูกกฎหมาย 100%' },
 { icon:'fa-university', label:'รับชำระผ่านธนาคาร' },
 { icon:'fa-user-shield', label:'ซื้อตรงจาก บ้าน D มีเชง' },
 { icon:'fa-headset', label:'ทีมงานตอบ 1 ชม.' },
 ].map((b,i) => (
 <div key={i} style={{ display:'flex', alignItems:'center', gap:10, color:'var(--on-surface-variant)', fontSize:'0.8rem', fontWeight:600 }}>
 <i className={`fas ${b.icon}`} style={{ color:brandGreen, fontSize:'0.78rem', opacity:0.7 }} />
 {b.label}
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* === FEATURED PROPERTIES — horizontal carousel (uniform cards) === */}
 <section style={{ background: 'var(--surface-low)', padding: '56px 0 52px' }}>
 <style>{`#feat-carousel::-webkit-scrollbar { display: none; }`}</style>
 <div className="container">
 <div className="d-flex justify-content-between align-items-center mb-4">
 <div>
 <div className="section-eyebrow" style={{ marginBottom: 6 }}>Curated Selection</div>
 <h3 style={{ fontFamily: "'Prompt', sans-serif", fontWeight: 500, fontSize: 'clamp(1.05rem,2.5vw,1.3rem)', color: 'var(--on-surface)', margin: '0 0 4px' }}>ทรัพย์สิน<span style={{ color: brandGreen }}>แนะนำ</span></h3>
 <p style={{ color: 'var(--outline)', fontSize: '0.82rem', margin: 0 }}>ทรัพย์ที่ บ้าน D มีเชง รีโนเวทเองทุกหลัง พร้อมเข้าอยู่</p>
 </div>
 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
 {[{ dir: -1, icon: 'fa-chevron-left' }, { dir: 1, icon: 'fa-chevron-right' }].map(({ dir, icon }) => (
 <button key={dir} onClick={() => scrollFeat(dir)} style={{
 width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${brandGreen}`,
 background: '#fff', color: brandGreen, cursor: 'pointer',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 flexShrink: 0, padding: 0,
 }}>
 <i className={`fas ${icon}`} style={{ fontSize: '0.7rem' }} />
 </button>
 ))}
 <Link to="/search?is_featured=1" className="btn btn-outline-success rounded-pill fw-bold ms-2 see-all-btn">
 ดูทั้งหมด <i className="fas fa-arrow-right ms-1"></i>
 </Link>
 </div>
 </div>

 {loading ? (
 <div style={{ display: 'flex', gap: 16, overflow: 'hidden' }}>
 {[...Array(4)].map((_, i) => (
 <div key={i} style={{ flexShrink: 0, width: 280 }}>
 <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
 <div className="skeleton-box" style={{ height: 200, borderRadius: 0 }} />
 <div style={{ padding: '14px 16px' }}>
 <div className="skeleton-box" style={{ height: 12, width: '60%', marginBottom: 10 }} />
 <div className="skeleton-box" style={{ height: 16, width: '85%' }} />
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : featuredProperties.length > 0 ? (
 <div id="feat-carousel" ref={featScrollRef}
 onMouseDown={onFeatMouseDown}
 onMouseMove={onFeatMouseMove}
 onMouseUp={onFeatMouseUp}
 onMouseLeave={onFeatMouseUp}
 style={{
 display: 'flex', gap: 16, overflowX: 'auto',
 scrollSnapType: 'x proximity', scrollbarWidth: 'none',
 WebkitOverflowScrolling: 'touch', paddingBottom: 8,
 cursor: 'grab',
 }}>
 {featuredProperties.map(p => (
 <div key={p.id} style={{ flexShrink: 0, width: 'clamp(260px, 27vw, 340px)', scrollSnapAlign: 'start' }}
 onClick={e => { if (featDrag.moved) e.preventDefault(); }}>
 <PropertyCard property={p} />
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-5 text-muted">
 <i className="fas fa-building fa-3x mb-3 d-block" style={{ color: '#ddd' }}></i>
 <p>ยังไม่มีทรัพย์สินแนะนำในขณะนี้</p>
 </div>
 )}
 </div>
 </section>

 {/* === LATEST PROPERTIES === */}
 <section style={{ background: 'var(--surface-lowest)', padding: '56px 0 52px' }}>
 <style>{`#lat-carousel::-webkit-scrollbar { display: none; }`}</style>
 <div className="container">
 <div className="d-flex justify-content-between align-items-center mb-4">
 <div>
 <div className="section-eyebrow" style={{ marginBottom: 6 }}>All Listings</div>
 <h3 style={{ fontFamily: "'Prompt', sans-serif", fontWeight: 500, fontSize: 'clamp(1.05rem,2.5vw,1.3rem)', color: 'var(--on-surface)', margin: '0 0 4px' }}>ทรัพย์<span style={{ color: brandGreen }}>ทั้งหมด</span></h3>
 <p style={{ color: 'var(--outline)', fontSize: '0.82rem', margin: 0 }}>อสังหาริมทรัพย์ทุกรายการที่เปิดประกาศอยู่</p>
 </div>
 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
 {[{ dir: -1, icon: 'fa-chevron-left' }, { dir: 1, icon: 'fa-chevron-right' }].map(({ dir, icon }) => (
 <button key={dir} onClick={() => scrollLat(dir)} style={{
 width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${brandGreen}`,
 background: '#fff', color: brandGreen, cursor: 'pointer',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 flexShrink: 0, padding: 0,
 }}>
 <i className={`fas ${icon}`} style={{ fontSize: '0.7rem' }} />
 </button>
 ))}
 <Link to="/search" className="btn btn-outline-success rounded-pill fw-bold ms-2 see-all-btn">
 ดูทั้งหมด <i className="fas fa-arrow-right ms-1"></i>
 </Link>
 </div>
 </div>

 {loading ? (
 <div style={{ display: 'flex', gap: 16, overflow: 'hidden' }}>
 {[...Array(4)].map((_, i) => (
 <div key={i} style={{ flexShrink: 0, width: 260 }}>
 <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
 <div className="skeleton-box" style={{ height: 170, borderRadius: 0 }} />
 <div style={{ padding: '14px 16px' }}>
 <div className="skeleton-box" style={{ height: 12, width: '60%', marginBottom: 10 }} />
 <div className="skeleton-box" style={{ height: 16, width: '85%', marginBottom: 12 }} />
 <div className="skeleton-box" style={{ height: 10, width: '50%' }} />
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : latestProperties.length > 0 ? (
 <div id="lat-carousel" ref={latScrollRef}
 onMouseDown={onLatMouseDown}
 onMouseMove={onLatMouseMove}
 onMouseUp={onLatMouseUp}
 onMouseLeave={onLatMouseUp}
 style={{
 display: 'flex', gap: 16, overflowX: 'auto',
 scrollSnapType: 'x proximity', scrollbarWidth: 'none',
 WebkitOverflowScrolling: 'touch', paddingBottom: 8,
 cursor: 'grab',
 }}>
 {latestProperties.map(p => (
 <div key={p.id} style={{ flexShrink: 0, width: 'clamp(260px, 27vw, 340px)', scrollSnapAlign: 'start' }}
 onClick={e => { if (latDrag.moved) e.preventDefault(); }}>
 <PropertyCard property={p} />
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-5 text-muted">
 <i className="fas fa-home fa-3x mb-3 d-block" style={{ color: '#ddd' }}></i>
 <p>ยังไม่มีประกาศในขณะนี้</p>
 </div>
 )}
 </div>
 </section>

 {/* === VALUE PROP 4 ICONS === */}
 <section id="services" style={{ padding: '72px 0', background: 'var(--surface)' }}>
 <div className="container">
 <div style={{ textAlign: 'center', marginBottom: 40 }}>
 <div className="section-eyebrow" style={{ marginBottom: 10 }}>
 Our Distinction
 </div>
 <h2 style={{ fontWeight: 400, margin: '0 0 10px', fontSize: 'clamp(1.2rem,3vw,1.6rem)', color: 'var(--on-surface)', fontFamily: "'Prompt', sans-serif" }}>
 ทำไมต้องเลือก <span style={{ color: brandGreen }}>บ้าน D มีเชง</span>?
 </h2>
 <p style={{ color: 'var(--on-surface-variant)', margin: 0, fontSize: '0.9rem' }}>ทรัพย์ทุกหลังผ่านมือ บ้าน D มีเชง รีโนเวทเอง พร้อมทีมดูแลคุณตลอดกระบวนการ</p>
 </div>
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
 {[
 { icon: 'fa-hammer', title: 'บ้าน D มีเชง รีโนเวทเอง', desc: 'ทุกหลังผ่านการปรับปรุงโดยทีม บ้าน D มีเชง ไม่รับฝากขายจากบุคคลภายนอก' },
 { icon: 'fa-file-contract', title: 'โฉนดถูกต้อง 100%', desc: 'ตรวจสอบเอกสารทุกรายการ ผ่านกรมที่ดิน สัญญาถูกกฎหมาย' },
 { icon: 'fa-coins', title: 'ราคาเป็นธรรม', desc: 'ประเมินราคาด้วยทีมผู้เชี่ยวชาญ คุ้มค่าทุกรายการ' },
 { icon: 'fa-user-tie', title: 'ทีมผู้เชี่ยวชาญ', desc: 'ดูแลตั้งแต่ต้นจนปิดดีล ทราบผลใน 24 ชม.' },
 ].map((v, i) => (
 <div key={i} style={{
 background: 'var(--surface-low)', borderRadius: 16, padding: '36px 24px',
 textAlign: 'center',
 transition: 'all 0.22s',
 }}
 onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 36px rgba(0,50,42,0.10)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.background = 'var(--surface-lowest)'; }}
 onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = 'var(--surface-low)'; }}
 >
 <div style={{
 width: 60, height: 60, borderRadius: '50%',
 background: `${brandGreenBg}0c`,
 margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
 }}>
 <i className={`fas ${v.icon}`} style={{ fontSize: '1.4rem', color: brandGreen }} />
 </div>
 <div style={{ fontFamily: "'Prompt', sans-serif", fontWeight: 500, fontSize: '0.95rem', color: 'var(--on-surface)', marginBottom: 10 }}>{v.title}</div>
 <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', lineHeight: 1.7 }}>{v.desc}</div>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* === FOOTER — Light green matching navbar === */}
 <footer className="footer-premium" style={{ backgroundColor: '#A1D99B', color: '#1a3a18' }}>

 {/* Top section: Brand statement */}
 <div style={{ padding: '56px 0 44px', textAlign: 'center', background: 'linear-gradient(180deg, #A1D99B 0%, #8fce86 100%)' }}>
 <div className="container">
 <img src={bigLogo} alt="บ้าน D มีเชง" style={{ height: 56, objectFit: 'contain', marginBottom: 20, opacity: 0.85 }} />
 <h3 style={{ fontFamily: "'Prompt', sans-serif", fontWeight: 400, fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', color: '#1a3a18', margin: '0 0 12px', letterSpacing: '-0.01em' }}>
 ทรัพย์รีโนเวทพร้อมอยู่ โดย บ้าน D มีเชง
 </h3>
 <p style={{ fontSize: '0.85rem', lineHeight: 1.8, maxWidth: 480, margin: '0 auto', color: 'rgba(26,58,24,0.7)' }}>
 คุณภาพครบ ราคาเป็นธรรม ตรวจสอบโฉนดแล้วทุกรายการ
 </p>
 </div>
 </div>

 {/* Links grid */}
 <div style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.12) 100%)', padding: '48px 0' }}>
 <div className="container">
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 40 }}>
 {/* Market Listings */}
 <div>
 <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '0.72rem', color: '#3d7a3a', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 18 }}>ทรัพย์สิน</div>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
 {[
 { to: '/search?listing_type=sale', label: 'ทรัพย์ขาย' },
 { to: '/search?listing_type=rent', label: 'ทรัพย์เช่า' },
 { to: '/search?is_featured=1', label: 'ทรัพย์แนะนำ' },
 { to: '/search', label: 'ค้นหาทั้งหมด' },
 ].map((lnk, i) => (
 <Link key={i} to={lnk.to} style={{ color: '#1a3a18', fontSize: '0.84rem', textDecoration: 'none', transition: 'color 0.2s' }}
 onMouseEnter={e => e.currentTarget.style.color = '#1a3a18'}
 onMouseLeave={e => e.currentTarget.style.color = 'rgba(26,58,24,0.55)'}
 >{lnk.label}</Link>
 ))}
 </div>
 </div>

 {/* Support */}
 <div>
 <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '0.72rem', color: '#3d7a3a', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 18 }}>ช่วยเหลือ</div>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
 {[
 { to: '/contact', label: 'ติดต่อเรา' },
 { to: '/faq', label: 'คำถามที่พบบ่อย' },
 { to: '/guide', label: 'คู่มือการใช้งาน' },
 ].map((lnk, i) => (
 <Link key={i} to={lnk.to} style={{ color: '#1a3a18', fontSize: '0.84rem', textDecoration: 'none', transition: 'color 0.2s' }}
 onMouseEnter={e => e.currentTarget.style.color = '#1a3a18'}
 onMouseLeave={e => e.currentTarget.style.color = 'rgba(26,58,24,0.55)'}
 >{lnk.label}</Link>
 ))}
 </div>
 </div>

 {/* Contact info */}
 <div>
 <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '0.72rem', color: '#3d7a3a', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 18 }}>ติดต่อ</div>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.84rem' }}>
 <a href="tel:081-638-6966" style={{ color: '#1a3a18', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, transition: 'color 0.2s' }}
 onMouseEnter={e => e.currentTarget.style.color = '#1a3a18'}
 onMouseLeave={e => e.currentTarget.style.color = 'rgba(26,58,24,0.55)'}
 >
 <i className="fas fa-phone-alt" style={{ fontSize: '0.72rem' }} /> 081-638-6966
 </a>
 <a href="https://line.me/R/ti/p/@loan_dd" target="_blank" rel="noopener noreferrer" style={{ color: '#1a3a18', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, transition: 'color 0.2s' }}
 onMouseEnter={e => e.currentTarget.style.color = '#1a3a18'}
 onMouseLeave={e => e.currentTarget.style.color = 'rgba(26,58,24,0.55)'}
 >
 <i className="fab fa-line" style={{ fontSize: '0.78rem' }} /> @loan_dd
 </a>
 </div>
 </div>

 {/* Social */}
 <div>
 <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '0.72rem', color: '#3d7a3a', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 18 }}>Follow Us</div>
 <div style={{ display: 'flex', gap: 12 }}>
 {[
 { icon: 'fab fa-facebook-f', href: 'https://www.facebook.com/share/1HWR1pe2XM/?mibextid=wwXIfr' },
 { icon: 'fab fa-line', href: 'https://line.me/R/ti/p/@loan_dd' },
 { icon: 'fas fa-phone-alt', href: 'tel:081-638-6966' },
 ].map((s, i) => (
 <a key={i} href={s.href} target="_blank" rel="noopener noreferrer"
 style={{
 width: 40, height: 40, borderRadius: 8,
 background: 'rgba(26,58,24,0.06)',
 border: '1px solid rgba(26,58,24,0.12)',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 color: '#1a3a18', fontSize: '0.88rem',
 transition: 'all 0.25s', textDecoration: 'none',
 }}
 onMouseEnter={e => { e.currentTarget.style.background = '#3d7a3a'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#3d7a3a'; }}
 onMouseLeave={e => { e.currentTarget.style.background = 'rgba(26,58,24,0.06)'; e.currentTarget.style.color = 'rgba(26,58,24,0.45)'; e.currentTarget.style.borderColor = 'rgba(26,58,24,0.12)'; }}
 >
 <i className={s.icon} />
 </a>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Bottom bar — subtle darker shade */}
 <div style={{ padding: '20px 0', background: 'rgba(0,0,0,0.08)' }}>
 <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
 <span style={{ fontSize: '0.72rem', letterSpacing: '0.06em', color: 'rgba(26,58,24,0.6)' }}>&copy; {new Date().getFullYear()} บ้าน D มีเชง Co., Ltd. All rights reserved.</span>
 <span style={{ fontSize: '0.68rem', color: 'rgba(26,58,24,0.55)', letterSpacing: '0.15em', fontWeight: 700, fontFamily: "'Manrope', sans-serif" }}>Bangkok &middot; Phuket &middot; Chiang Mai</span>
 </div>
 </div>
 </footer>
 </div>
 );
};

export default Home;