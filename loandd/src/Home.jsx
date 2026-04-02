import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import bigLogo from './pic/big-logo.png';
import imgSukhumvit  from './pic/สุขุมวิท.jpg';
import imgRama9      from './pic/พระราม 9.jpg';
import imgAsok       from './pic/อโศก-ทองหล่อ.jpg';
import imgBangna     from './pic/บางนา.jpg';
import imgSathorn    from './pic/สาทร-สีลม.jpg';
import imgLadprao    from './pic/ลาดพร้าว.jpg';
import imgChiangmai  from './pic/เชียงใหม่.png';
import imgPattaya    from './pic/พัทยา.jpg';
import imgPhuket     from './pic/ภูเก็ต.jpg';
import imgNonthaburi from './pic/นนทบุรี.jpg';
import imgHeroCover  from './pic/ปก.jpg';
import BTSMapSection from './components/BTSMapSection';
import PropertyCard from './components/PropertyCard';
import SearchSuggestBox from './components/SearchSuggestBox';

const API_BASE = 'http://localhost:3001';

const typeLabels = {
  house: 'บ้านเดี่ยว', condo: 'คอนโด', land: 'ที่ดิน',
  townhouse: 'ทาวน์เฮ้าส์', apartment: 'อพาร์ทเม้นท์', commercial: 'อาคารพาณิชย์',
  home_office: 'โฮมออฟฟิศ', warehouse: 'โกดัง/โรงงาน',
};

const Home = () => {
  const brandGreen = '#04AA6D';
  const API_URL = `${API_BASE}/api/properties`;
  const navigate = useNavigate();
  const location = useLocation();

  // State
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [latestProperties, setLatestProperties] = useState([]);
  const [provinceCounts, setProvinceCounts] = useState([]);
  const [stats, setStats] = useState({ total: 0, province_count: 0, for_sale: 0, for_rent: 0, reserved: 0, sold: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('sale');
  const [loading, setLoading] = useState(true);
  const [quickTab, setQuickTab] = useState('popular');
  const [showHomeSuggest, setShowHomeSuggest] = useState(false);
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
      state.velocity = (state.lastX - e.pageX) / dt;   // px/ms
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
      let v = state.velocity * 18;   // amplify
      const animate = () => {
        if (!scrollRef.current || Math.abs(v) < 0.3) return;
        scrollRef.current.scrollLeft += v;
        v *= 0.88;   // friction
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
  const onLocMouseUp   = ()  => locDragObj.current.onUp();

  // ทรัพย์สินแนะนำ
  const featScrollRef = useRef(null);
  const scrollFeat = (dir) => { if (featScrollRef.current) featScrollRef.current.scrollBy({ left: dir * 540, behavior: 'smooth' }); };
  const featDragObj = useRef(null);
  if (!featDragObj.current) featDragObj.current = makeDrag(featScrollRef);
  const featDrag = featDragObj.current.state;
  const onFeatMouseDown = (e) => featDragObj.current.onDown(e);
  const onFeatMouseMove = (e) => featDragObj.current.onMove(e);
  const onFeatMouseUp   = ()  => featDragObj.current.onUp();

  // ประกาศล่าสุด
  const latScrollRef = useRef(null);
  const scrollLat = (dir) => { if (latScrollRef.current) latScrollRef.current.scrollBy({ left: dir * 540, behavior: 'smooth' }); };
  const latDragObj = useRef(null);
  if (!latDragObj.current) latDragObj.current = makeDrag(latScrollRef);
  const latDrag = latDragObj.current.state;
  const onLatMouseDown = (e) => latDragObj.current.onDown(e);
  const onLatMouseMove = (e) => latDragObj.current.onMove(e);
  const onLatMouseUp   = ()  => latDragObj.current.onUp();

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
      const [featuredRes, latestRes, provinceRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/featured`),
        fetch(`${API_URL}/latest?limit=8`),
        fetch(`${API_URL}/province-counts`),
        fetch(`${API_URL}/stats`),
      ]);
      const featured  = await featuredRes.json();
      const latest    = await latestRes.json();
      const provinces = await provinceRes.json();
      const statsData = await statsRes.json();

      const featuredList = Array.isArray(featured) ? featured : [];
      const latestList   = Array.isArray(latest)   ? latest   : [];
      const featuredIds  = new Set(featuredList.map(p => p.id));

      setFeaturedProperties(featuredList);
      const filtered = latestList.filter(p => !featuredIds.has(p.id));
      setLatestProperties(filtered.length > 0 ? filtered : latestList);
      setProvinceCounts(Array.isArray(provinces) ? provinces : []);
      if (statsData && statsData.total != null) setStats(statsData);
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

  // Re-fetch เมื่อ user สลับแท็บกลับมา (เช่น จากหน้า admin)
  useEffect(() => {
    const onFocus = () => fetchData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);


  return (
    <div style={{ fontFamily: '"Noto Sans Thai", sans-serif' }}>
      <Navbar />

      {/* === HERO SECTION — Property Search style (DDProperty / Livinginsider) === */}
      <section style={{
        position: 'relative',
        backgroundImage: `url(${imgHeroCover})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        padding: 'calc(80px + 60px) 16px 80px',
        overflow: 'hidden',
        textAlign: 'center',
      }}>
        {/* Dark overlay เพื่อให้ข้อความอ่านง่าย */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.65) 55%, rgba(0,0,0,0.55) 100%)', pointerEvents:'none' }} />

        <div className="container" style={{ position:'relative', zIndex:1 }}>
          {/* Trust badge */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:50, padding:'6px 16px', fontSize:'0.8rem', color:'#fff', marginBottom:20 }}>
            <i className="fas fa-shield-alt" style={{ color:'#4ade80' }} />
            ทรัพย์ทุกรายการผ่านการตรวจสอบโฉนดแล้ว
          </div>

          {/* Headline */}
          <h1 style={{ color:'#fff', fontWeight:900, fontSize:'clamp(1.8rem, 5vw, 3rem)', lineHeight:1.25, marginBottom:12 }}>
            ทรัพย์รีโนเวทพร้อมอยู่<br />
            <span style={{ color:'#4ade80' }}>โดย บ้าน D มีเชง</span>
          </h1>
          <p style={{ color:'rgba(255,255,255,0.75)', fontSize:'1rem', maxWidth:520, margin:'0 auto 36px', lineHeight:1.7 }}>
            อสังหาริมทรัพย์ที่ บ้าน D มีเชง รีโนเวทเอง คุณภาพครบ ราคาเป็นธรรม ตรวจสอบโฉนดแล้วทุกรายการ
          </p>

          {/* Hero tab row — เหนือ search bar */}
          <div style={{ display:'flex', gap:4, justifyContent:'center', marginBottom:0 }}>
            {[
              { key:'sale', label:'🏠 หาซื้อ' },
              { key:'rent', label:'🔑 หาเช่า' },
            ].map(t => (
              <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
                style={{
                  padding:'9px 20px',
                  borderRadius:'12px 12px 0 0',
                  border:'none',
                  background: activeTab===t.key ? '#fff' : 'rgba(255,255,255,0.18)',
                  color: activeTab===t.key ? brandGreen : '#fff',
                  fontWeight:700, fontSize:'0.84rem',
                  cursor:'pointer', fontFamily:'inherit',
                  transition:'all 0.15s',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div style={{ maxWidth:640, margin:'0 auto', position:'relative' }}>
            <form
              onSubmit={e => {
                e.preventDefault();
                setShowHomeSuggest(false);
                const p = new URLSearchParams({ page:'1' });
                if (activeTab === 'sale' || activeTab === 'rent') p.set('listing_type', activeTab);
                if (searchTerm) p.set('search', searchTerm);
                navigate(`/search?${p.toString()}`);
              }}
              style={{
                display:'flex', background:'#fff',
                borderRadius: 50,
                overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.25)',
                border: showHomeSuggest ? '3px solid #4ade80' : '3px solid transparent',
                transition:'border-color 0.15s, border-radius 0.2s',
              }}
            >
              {/* Input */}
              <div style={{ flex:1, display:'flex', alignItems:'center', padding:'0 14px', gap:8 }}>
                <i className="fas fa-search" style={{ color:'#ccc', flexShrink:0 }} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onFocus={() => setShowHomeSuggest(true)}
                  onBlur={() => setTimeout(() => setShowHomeSuggest(false), 150)}
                  placeholder={activeTab==='rent' ? 'ค้นหาทรัพย์ให้เช่า จังหวัด ทำเล...' : 'ค้นหาจังหวัด ทำเล ชื่อทรัพย์...'}
                  style={{ flex:1, border:'none', outline:'none', fontSize:'0.95rem', background:'transparent', fontFamily:'inherit', color:'#1a2d4a', minWidth:0 }}
                />
                {searchTerm && (
                  <button type="button" onClick={() => setSearchTerm('')} style={{ border:'none', background:'none', color:'#ccc', cursor:'pointer', padding:0, fontSize:'0.85rem' }}>
                    <i className="fas fa-times" />
                  </button>
                )}
              </div>

              {/* Submit */}
              <button type="submit" style={{
                background:brandGreen, color:'#fff', border:'none',
                padding:'16px 36px', fontWeight:800, fontSize:'1rem',
                cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap',
                borderRadius:'0 50px 50px 0', letterSpacing:'0.02em',
              }}>
                <i className="fas fa-search" style={{ marginRight:8 }} />ค้นหา
              </button>
            </form>

            {/* Suggestion dropdown */}
            <SearchSuggestBox
              visible={showHomeSuggest}
              inputValue={searchTerm}
              onSelect={val => setSearchTerm(val)}
              onClose={() => setShowHomeSuggest(false)}
            />
          </div>

          {/* Quick type pills */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', marginTop:20 }}>
            {[
              { label:'🏢 คอนโด', type:'condo' },
              { label:'🏠 บ้านเดี่ยว', type:'house' },
              { label:'🏘 ทาวน์เฮ้าส์', type:'townhouse' },
              { label:'🏕 ที่ดิน', type:'land' },
              { label:'🏬 อาคารพาณิชย์', type:'commercial' },
              { label:'💼 โฮมออฟฟิศ', type:'home_office' },
              { label:'🏭 โกดัง/โรงงาน', type:'warehouse' },
            ].map(pt => (
              <Link key={pt.type} to={`/search?property_type=${pt.type}&page=1`}
                style={{
                  background:'rgba(255,255,255,0.15)', color:'#fff',
                  border:'1px solid rgba(255,255,255,0.3)',
                  borderRadius:50, padding:'5px 14px', fontSize:'0.8rem',
                  fontWeight:600, textDecoration:'none', backdropFilter:'blur(4px)',
                  transition:'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.28)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.15)'; }}
              >
                {pt.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* === STATS STRIP (dynamic) === */}
      <section style={{ background: '#fff', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 0 }}>
            {[
              { value: stats.total > 0 ? `${stats.total}+` : '—',   label: 'ทรัพย์ทั้งหมด',    icon: '🏠' },
              { value: stats.for_sale > 0 ? `${stats.for_sale}` : '—', label: 'รายการขาย',      icon: '📋' },
              { value: stats.for_rent > 0 ? `${stats.for_rent}` : '—', label: 'รายการเช่า',    icon: '🔑' },
              { value: stats.province_count > 0 ? `${stats.province_count} จังหวัด` : '—', label: 'ครอบคลุม', icon: '📍' },
            ].map((s, i, arr) => (
              <div key={i} style={{
                flex: '1 1 120px', textAlign: 'center', padding: '18px 16px',
                borderRight: i < arr.length - 1 ? '1px solid #f0f0f0' : 'none',
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 2 }}>{s.icon}</div>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: brandGreen, lineHeight: 1.1 }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === PROPERTY TYPE ICONS (ประเภทอสังหา — Livinginsider style) === */}
      <section style={{ background: '#fff', padding: '36px 0 32px', borderBottom: '1px solid #eef0f3' }}>
        <div className="container">
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#1a2d4a' }}>
                ค้นหาตามประเภทอสังหาริมทรัพย์
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#aaa' }}>
                คลิกเลือกประเภทที่สนใจ
              </p>
            </div>
            <Link to="/search" style={{ fontSize: '0.82rem', color: brandGreen, fontWeight: 700, textDecoration: 'none' }}>
              ดูทั้งหมด →
            </Link>
          </div>

          {/* Icon grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))',
            gap: 14,
          }}>
            {[
              { icon: 'fa-building',    emoji: '🏢', label: 'คอนโด',        type: 'condo',       color: '#4f46e5', bg: '#ede9fe' },
              { icon: 'fa-home',        emoji: '🏠', label: 'บ้านเดี่ยว',   type: 'house',       color: '#0891b2', bg: '#e0f2fe' },
              { icon: 'fa-city',        emoji: '🏘', label: 'ทาวน์เฮ้าส์',  type: 'townhouse',   color: '#059669', bg: '#d1fae5' },
              { icon: 'fa-mountain',    emoji: '🏕', label: 'ที่ดิน',        type: 'land',        color: '#d97706', bg: '#fef3c7' },
              { icon: 'fa-store',       emoji: '🏬', label: 'อาคารพาณิชย์', type: 'commercial',  color: '#dc2626', bg: '#fee2e2' },
              { icon: 'fa-hotel',       emoji: '🏨', label: 'อพาร์ทเม้นท์', type: 'apartment',   color: '#7c3aed', bg: '#f3e8ff' },
              { icon: 'fa-briefcase',   emoji: '💼', label: 'โฮมออฟฟิศ',    type: 'home_office', color: '#0369a1', bg: '#e0f2fe' },
              { icon: 'fa-warehouse',   emoji: '🏭', label: 'โกดัง/โรงงาน', type: 'warehouse',   color: '#78716c', bg: '#f5f5f4' },
            ].map(pt => (
              <Link
                key={pt.type}
                to={`/search?property_type=${pt.type}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 10, padding: '20px 10px 16px',
                    borderRadius: 16, border: '1.5px solid #eef0f3',
                    background: '#fff', cursor: 'pointer',
                    transition: 'all 0.18s', position: 'relative', overflow: 'hidden',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = pt.color;
                    e.currentTarget.style.boxShadow = `0 6px 20px ${pt.color}22`;
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.background = pt.bg;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#eef0f3';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.background = '#fff';
                  }}
                >
                  {/* Icon circle */}
                  <div style={{
                    width: 54, height: 54, borderRadius: '50%',
                    background: pt.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'transform 0.18s',
                  }}>
                    <i className={`fas ${pt.icon}`} style={{ fontSize: '1.4rem', color: pt.color }} />
                  </div>
                  {/* Label */}
                  <span style={{
                    fontSize: '0.78rem', fontWeight: 800,
                    color: '#1a2d4a', textAlign: 'center', lineHeight: 1.3,
                  }}>{pt.label}</span>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* === BTS/MRT INTERACTIVE MAP === */}
      <BTSMapSection />

      {/* === QUICK TABS === */}
      {(() => {
        const QUICK_TABS = [
          { key: 'popular', label: '📌 ทำเลยอดนิยม' },
          { key: 'province', label: '🗺 จังหวัด' },
          { key: 'bts',     label: '🚇 BTS/MRT' },
          { key: 'school',  label: '🏫 สถานศึกษา' },
        ];

        const POPULAR_DISTRICTS = [
          { name: 'สุขุมวิท',      icon: '🏙', q: 'สุขุมวิท' },
          { name: 'สาทร-สีลม',     icon: '🏦', q: 'สาทร' },
          { name: 'ลาดพร้าว',       icon: '🌳', q: 'ลาดพร้าว' },
          { name: 'รามคำแหง',       icon: '🎓', q: 'รามคำแหง' },
          { name: 'พระราม 9',       icon: '🏢', q: 'พระราม 9' },
          { name: 'บางนา',          icon: '🛣', q: 'บางนา' },
          { name: 'ดอนเมือง',       icon: '✈️', q: 'ดอนเมือง' },
          { name: 'นนทบุรี',        icon: '🌆', q: 'นนทบุรี' },
          { name: 'ปทุมธานี',       icon: '🏘', q: 'ปทุมธานี' },
          { name: 'ชลบุรี-พัทยา',  icon: '🏖', q: 'ชลบุรี' },
          { name: 'เชียงใหม่',      icon: '⛰', q: 'เชียงใหม่' },
          { name: 'ภูเก็ต',         icon: '🌴', q: 'ภูเก็ต' },
        ];

        const BTS_LINES = [
          { name: 'สุขุมวิท (สายสีเขียว)', color: '#00843D', stations: ['อโศก','พร้อมพงษ์','ทองหล่อ','เอกมัย','อ่อนนุช'] },
          { name: 'สีลม (สายสีเขียวเข้ม)', color: '#007A3D', stations: ['ช่องนนทรี','สุรศักดิ์','สะพานตากสิน','กรุงธนบุรี'] },
          { name: 'MRT สายสีน้ำเงิน',      color: '#1E4D9B', stations: ['พระราม 9','สุทธิสาร','ลาดพร้าว','รัชดาภิเษก'] },
          { name: 'Airport Rail Link',      color: '#C8202F', stations: ['มักกะสัน','รามคำแหง','หัวหมาก','สุวรรณภูมิ'] },
        ];

        const SCHOOLS = [
          { name: 'จุฬาลงกรณ์',   icon: '🎓', key: 'จุฬาลงกรณ์' },
          { name: 'ม.เกษตรศาสตร์', icon: '🌾', key: 'ม.เกษตรศาสตร์' },
          { name: 'ม.ธรรมศาสตร์',  icon: '📚', key: 'ม.ธรรมศาสตร์' },
          { name: 'ม.มหิดล',       icon: '⚕️', key: 'ม.มหิดล' },
          { name: 'ม.รามคำแหง',    icon: '🏛',  key: 'ม.รามคำแหง' },
          { name: 'ม.อัสสัมชัญ',   icon: '🏫', key: 'ม.อัสสัมชัญ' },
          { name: 'รร.นานาชาติ',   icon: '🌍', key: 'รร.นานาชาติ' },
          { name: 'สาธิต ปทุมวัน', icon: '✏️', key: 'สาธิต ปทุมวัน' },
        ];

        const chipStyle = (bg = '#f0f5f1', color = brandGreen) => ({
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: bg, color,
          border: `1.5px solid ${color}30`,
          borderRadius: 24, padding: '6px 14px',
          fontSize: '0.8rem', fontWeight: 700,
          cursor: 'pointer', transition: 'all 0.15s',
          textDecoration: 'none', whiteSpace: 'nowrap',
        });

        return (
          <section style={{ padding: '44px 0 36px', background: '#fff', borderTop: '1px solid #f0f0f0' }}>
            <div className="container">
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontWeight: 800, margin: '0 0 4px', fontSize: 'clamp(1rem,2.5vw,1.25rem)', color: '#1a2d4a' }}>
                    ค้นหาตาม<span style={{ color: brandGreen }}>ทำเล</span>
                  </h2>
                  <p style={{ color: '#888', fontSize: '0.82rem', margin: 0 }}>เลือกหมวดเพื่อดูทรัพย์ในพื้นที่ที่คุณสนใจ</p>
                </div>
              </div>

              {/* Tab Pills */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                {QUICK_TABS.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setQuickTab(t.key)}
                    style={{
                      padding: '7px 18px', borderRadius: 24,
                      border: quickTab === t.key ? `2px solid ${brandGreen}` : '2px solid #e8edf3',
                      background: quickTab === t.key ? brandGreen : '#fff',
                      color: quickTab === t.key ? '#fff' : '#555',
                      fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                      transition: 'all 0.15s', fontFamily: 'inherit',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {quickTab === 'popular' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {POPULAR_DISTRICTS.map(d => (
                    <Link
                      key={d.name}
                      to={`/search?search=${encodeURIComponent(d.q)}`}
                      style={chipStyle()}
                      onMouseEnter={e => { e.currentTarget.style.background = brandGreen; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = brandGreen; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#f0f5f1'; e.currentTarget.style.color = brandGreen; e.currentTarget.style.borderColor = `${brandGreen}30`; }}
                    >
                      <span style={{ fontSize: '1rem' }}>{d.icon}</span> {d.name}
                    </Link>
                  ))}
                </div>
              )}

              {quickTab === 'province' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {(provinceCounts.length > 0 ? provinceCounts : []).map(pv => {
                    const regionColors = {
                      กรุงเทพมหานคร:'#04AA6D',นนทบุรี:'#04AA6D',ปทุมธานี:'#04AA6D',สมุทรปราการ:'#04AA6D',
                      ชลบุรี:'#0ea5e9',ระยอง:'#0ea5e9',เชียงใหม่:'#8b5cf6',ภูเก็ต:'#f59e0b',
                      ขอนแก่น:'#ef4444',อุดรธานี:'#ef4444',นครราชสีมา:'#ef4444',
                    };
                    const c = regionColors[pv.province] || '#6b7280';
                    return (
                      <Link
                        key={pv.province}
                        to={`/search?province=${encodeURIComponent(pv.province)}`}
                        style={chipStyle(`${c}12`, c)}
                        onMouseEnter={e => { e.currentTarget.style.background = c; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = `${c}12`; e.currentTarget.style.color = c; }}
                      >
                        📍 {pv.province}
                        <span style={{ background: `${c}25`, borderRadius: 10, padding: '1px 6px', fontSize: '0.7rem' }}>
                          {pv.count}
                        </span>
                      </Link>
                    );
                  })}
                  {provinceCounts.length === 0 && (
                    <p style={{ color: '#aaa', fontSize: '0.85rem', margin: 0 }}>กำลังโหลดข้อมูล...</p>
                  )}
                </div>
              )}

              {quickTab === 'bts' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {BTS_LINES.map(line => (
                    <div key={line.name}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: line.color, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: line.color, display: 'inline-block' }} />
                        {line.name}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {line.stations.map(s => (
                          <Link
                            key={s}
                            to={`/search?bts_station=${encodeURIComponent(s)}`}
                            style={chipStyle(`${line.color}10`, line.color)}
                            onMouseEnter={e => { e.currentTarget.style.background = line.color; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = `${line.color}10`; e.currentTarget.style.color = line.color; }}
                          >
                            🚇 {s}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {quickTab === 'school' && (
                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                    {SCHOOLS.map(s => (
                      <Link
                        key={s.name}
                        to={`/search?near_school=${encodeURIComponent(s.key)}`}
                        style={chipStyle('#f0f4ff', '#2563eb')}
                        onMouseEnter={e => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#2563eb'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#f0f4ff'; e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.borderColor = '#2563eb30'; }}
                      >
                        <span style={{ fontSize: '1rem' }}>{s.icon}</span> {s.name}
                      </Link>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#888', margin: 0 }}>
                    🗺 กดเพื่อดูแผนที่แสดงทรัพย์ที่ใกล้สถานศึกษา — เรียงตามระยะทาง
                  </p>
                </div>
              )}
            </div>
          </section>
        );
      })()}

      {/* === ทำเลยอดนิยม — Photo Cards Carousel (Livinginsider style) === */}
      <section style={{ padding: '44px 0 40px', background: '#f8fafc', borderTop: '1px solid #eef0f3' }}>
        <style>{`#loc-carousel::-webkit-scrollbar { display: none; }`}</style>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
            <div>
              <h2 style={{ fontWeight: 900, margin: '0 0 4px', fontSize: 'clamp(1rem,2.5vw,1.25rem)', color: '#1a2d4a' }}>
                ทำเล<span style={{ color: brandGreen }}>ยอดนิยม</span>
              </h2>
              <p style={{ color: '#888', fontSize: '0.82rem', margin: 0 }}>เลือกทำเลที่คุณสนใจ ดูทรัพย์ในพื้นที่นั้นได้ทันที</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Arrow buttons */}
              {[{ dir: -1, icon: 'fa-chevron-left' }, { dir: 1, icon: 'fa-chevron-right' }].map(({ dir, icon }) => (
                <button key={dir} onClick={() => scrollLoc(dir)} style={{
                  width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${brandGreen}`,
                  background: '#fff', color: brandGreen, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s', flexShrink: 0,
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = brandGreen; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = brandGreen; }}
                >
                  <i className={`fas ${icon}`} style={{ fontSize: '0.7rem' }} />
                </button>
              ))}
              <Link to="/search" style={{ color: brandGreen, fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none', marginLeft: 4 }}>ทั้งหมด →</Link>
            </div>
          </div>

          {/* Horizontal scroll carousel */}
          <div id="loc-carousel" ref={locScrollRef}
            onMouseDown={onLocMouseDown}
            onMouseMove={onLocMouseMove}
            onMouseUp={onLocMouseUp}
            onMouseLeave={onLocMouseUp}
            style={{
              display: 'flex', gap: 14, overflowX: 'auto',
              scrollSnapType: 'x proximity', scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch', paddingBottom: 4,
              cursor: 'grab',
            }}>
            {[
              { name: 'สุขุมวิท',      sub: 'กรุงเทพฯ',    q: 'สุขุมวิท',  img: imgSukhumvit  },
              { name: 'พระราม 9',      sub: 'กรุงเทพฯ',    q: 'พระราม 9',  img: imgRama9      },
              { name: 'อโศก–ทองหล่อ', sub: 'กรุงเทพฯ',    q: 'อโศก',      img: imgAsok       },
              { name: 'บางนา',         sub: 'กรุงเทพฯ',    q: 'บางนา',     img: imgBangna     },
              { name: 'สาทร–สีลม',    sub: 'กรุงเทพฯ',    q: 'สาทร',      img: imgSathorn    },
              { name: 'ลาดพร้าว',      sub: 'กรุงเทพฯ',    q: 'ลาดพร้าว', img: imgLadprao    },
              { name: 'เชียงใหม่',     sub: 'ภาคเหนือ',    q: 'เชียงใหม่', img: imgChiangmai  },
              { name: 'ชลบุรี–พัทยา', sub: 'ภาคตะวันออก', q: 'ชลบุรี',   img: imgPattaya    },
              { name: 'ภูเก็ต',        sub: 'ภาคใต้',      q: 'ภูเก็ต',    img: imgPhuket     },
              { name: 'นนทบุรี',       sub: 'ปริมณฑล',     q: 'นนทบุรี',   img: imgNonthaburi },
            ].map(loc => {
              const count = provinceCounts.find(p =>
                p.province === loc.name ||
                (loc.q && p.province.includes(loc.q.split('–')[0]))
              )?.count;
              return (
                <Link
                  key={loc.name}
                  to={`/search?search=${encodeURIComponent(loc.q)}&page=1`}
                  style={{ textDecoration: 'none', flexShrink: 0, scrollSnapAlign: 'start' }}
                  onClick={e => { if (locDragObj.current.state.moved) e.preventDefault(); }}
                >
                  <div
                    style={{
                      width: 200, height: 155, borderRadius: 16,
                      position: 'relative', overflow: 'hidden', cursor: 'pointer',
                      boxShadow: '0 4px 18px rgba(0,0,0,0.16)',
                      transition: 'transform 0.28s ease, box-shadow 0.28s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 14px 36px rgba(0,0,0,0.28)';
                      const img = e.currentTarget.querySelector('img');
                      if (img) img.style.transform = 'scale(1.1)';
                      const line = e.currentTarget.querySelector('.loc-line');
                      if (line) line.style.opacity = '1';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.16)';
                      const img = e.currentTarget.querySelector('img');
                      if (img) img.style.transform = 'scale(1)';
                      const line = e.currentTarget.querySelector('.loc-line');
                      if (line) line.style.opacity = '0';
                    }}
                  >
                    {/* Photo */}
                    <img
                      src={loc.img} alt={loc.name} draggable={false}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.45s ease' }}
                    />
                    {/* Vignette overlay */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.2) 55%, rgba(0,0,0,0.06) 100%)' }} />
                    {/* Count badge — top left */}
                    {count != null && (
                      <div style={{ position: 'absolute', top: 10, left: 10, background: brandGreen, color: '#fff', fontSize: '0.62rem', fontWeight: 800, borderRadius: 20, padding: '3px 9px' }}>
                        {count} รายการ
                      </div>
                    )}
                    {/* Region tag — top right */}
                    <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', color: 'rgba(255,255,255,0.88)', fontSize: '0.6rem', fontWeight: 600, borderRadius: 10, padding: '2px 8px' }}>
                      {loc.sub}
                    </div>
                    {/* Bottom text */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 13px 12px' }}>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.01em', lineHeight: 1.2, textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
                        {loc.name}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.67rem', marginTop: 3 }}>
                        ดูทรัพย์ในพื้นที่นี้ →
                      </div>
                    </div>
                    {/* Brand accent line — animates on hover */}
                    <div className="loc-line" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${brandGreen}, #34d399)`, opacity: 0, transition: 'opacity 0.25s' }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* === TRUST BADGES — ความน่าเชื่อถือ === */}
      <section style={{ background: '#fff', borderTop: '1px solid #eef0f3', padding: '32px 0 28px' }}>
        <div className="container">
          <p style={{ textAlign:'center', fontSize:'0.78rem', color:'#aaa', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:18 }}>
            มาตรฐานที่ บ้าน D มีเชง ยึดถือทุกรายการ
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'8px 24px' }}>
            {[
              { icon:'fa-shield-alt',     color:'#04AA6D', label:'ตรวจสอบโฉนดทุกแผ่น' },
              { icon:'fa-landmark',       color:'#1a3c6e', label:'ผ่านกรมที่ดิน' },
              { icon:'fa-file-contract',  color:'#7c3aed', label:'สัญญาถูกกฎหมาย 100%' },
              { icon:'fa-university',     color:'#0891b2', label:'รับชำระผ่านธนาคาร' },
              { icon:'fa-user-shield',    color:'#d97706', label:'ซื้อตรงจาก บ้าน D มีเชง ไม่ผ่านคนกลาง' },
              { icon:'fa-headset',        color:'#059669', label:'ทีมงานตอบ 1 ชม.' },
            ].map((b,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:7, color:'#555', fontSize:'0.82rem', fontWeight:600 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:`${b.color}14`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <i className={`fas ${b.icon}`} style={{ color:b.color, fontSize:'0.72rem' }} />
                </div>
                {b.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === FEATURED PROPERTIES === */}
      <section className="py-5" style={{ background: '#f8f9fa' }}>
        <style>{`#feat-carousel::-webkit-scrollbar { display: none; }`}</style>
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="fw-bold mb-1">ทรัพย์สิน<span style={{ color: brandGreen }}>แนะนำ</span></h3>
              <p className="text-muted mb-0">ทรัพย์ที่ บ้าน D มีเชง รีโนเวทเองทุกหลัง พร้อมเข้าอยู่</p>
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
              <Link to="/search?is_featured=1" className="btn btn-outline-success rounded-pill px-4 fw-bold ms-2">
                ดูทั้งหมด <i className="fas fa-arrow-right ms-1"></i>
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" style={{ color: brandGreen }} role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
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
                <div key={p.id} style={{ flexShrink: 0, width: 260, scrollSnapAlign: 'start' }}
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
      <section className="py-5 bg-white">
        <style>{`#lat-carousel::-webkit-scrollbar { display: none; }`}</style>
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="fw-bold mb-1">ประกาศ<span style={{ color: brandGreen }}>ล่าสุด</span></h3>
              <p className="text-muted mb-0">อสังหาริมทรัพย์ที่เพิ่งลงประกาศใหม่</p>
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
              <Link to="/search" className="btn btn-outline-success rounded-pill px-4 fw-bold ms-2">
                ดูทั้งหมด <i className="fas fa-arrow-right ms-1"></i>
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" style={{ color: brandGreen }} role="status" />
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
                <div key={p.id} style={{ flexShrink: 0, width: 260, scrollSnapAlign: 'start' }}
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
      <section id="services" style={{ padding: '56px 0', background: '#fff', borderTop: '1px solid #f0f0f0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 style={{ fontWeight: 800, margin: '0 0 8px', fontSize: 'clamp(1.1rem,3vw,1.5rem)', color: '#1a2d4a' }}>
              ทำไมต้องเลือก <span style={{ color: brandGreen }}>บ้าน D มีเชง</span>?
            </h2>
            <p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>ทรัพย์ทุกหลังผ่านมือ บ้าน D มีเชง รีโนเวทเอง พร้อมทีมดูแลคุณตลอดกระบวนการ</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {[
              { emoji: '🔨', title: 'บ้าน D มีเชง รีโนเวทเอง',      desc: 'ทุกหลังผ่านการปรับปรุงโดยทีม บ้าน D มีเชง ไม่รับฝากขายจากบุคคลภายนอก' },
              { emoji: '📋', title: 'โฉนดถูกต้อง 100%',      desc: 'ตรวจสอบเอกสารทุกรายการ ผ่านกรมที่ดิน สัญญาถูกกฎหมาย' },
              { emoji: '💰', title: 'ราคาเป็นธรรม',           desc: 'ประเมินราคาด้วยทีมผู้เชี่ยวชาญ คุ้มค่าทุกรายการ' },
              { emoji: '👨💼', title: 'ทีมผู้เชี่ยวชาญ',       desc: 'ดูแลตั้งแต่ต้นจนปิดดีล ทราบผลใน 24 ชม.' },
            ].map((v, i) => (
              <div key={i} style={{
                background: '#fafafa', borderRadius: 16, padding: '28px 20px',
                textAlign: 'center', border: '1.5px solid #f0f0f0',
                transition: 'all 0.18s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${brandGreen}55`; e.currentTarget.style.boxShadow = `0 6px 20px ${brandGreen}15`; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: `${brandGreen}12`, border: `2px solid ${brandGreen}30`,
                  margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.8rem',
                }}>
                  {v.emoji}
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1a2d4a', marginBottom: 8 }}>{v.title}</div>
                <div style={{ fontSize: '0.8rem', color: '#777', lineHeight: 1.6 }}>{v.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="py-4 text-center text-white" style={{ backgroundColor: '#222' }}>
        <div className="container">
          <div className="mb-3">
            <i className="fab fa-facebook fa-lg mx-2"></i>
            <i className="fab fa-line fa-lg mx-2"></i>
            <i className="fas fa-phone-alt fa-lg mx-2"></i>
          </div>
          <p className="mb-0 small text-white-50">&copy; 2026 บ้าน D มีเชง Co., Ltd. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;