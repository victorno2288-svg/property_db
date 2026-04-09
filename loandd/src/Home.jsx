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
  townhouse: 'ทาวน์เฮ้าส์', townhome: 'ทาวน์โฮม', apartment: 'อพาร์ทเม้นท์', commercial: 'อาคารพาณิชย์',
  home_office: 'โฮมออฟฟิศ', warehouse: 'โกดัง/โรงงาน',
};

const Home = () => {
  const brandGreen = '#1A8C6E';
  const brandBright = '#2DB88E';
  const gold = '#C9A84C';
  const API_URL = `${API_BASE}/api/properties`;
  const navigate = useNavigate();
  const location = useLocation();

  // State
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [latestProperties, setLatestProperties] = useState([]);
  const [stats, setStats] = useState({ total: 0, province_count: 0, for_sale: 0, for_rent: 0, reserved: 0, sold: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('sale');
  const [loading, setLoading] = useState(true);
const [showHomeSuggest, setShowHomeSuggest] = useState(false);
  const [heroPropertyType, setHeroPropertyType] = useState('');
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
      const [featuredRes, latestRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/featured`),
        fetch(`${API_URL}/latest?limit=8`),
        fetch(`${API_URL}/stats`),
      ]);
      const featured  = await featuredRes.json();
      const latest    = await latestRes.json();
      const statsData = await statsRes.json();

      const featuredList = Array.isArray(featured) ? featured : [];
      const latestList   = Array.isArray(latest)   ? latest   : [];
      const featuredIds  = new Set(featuredList.map(p => p.id));

      setFeaturedProperties(featuredList);
      const filtered = latestList.filter(p => !featuredIds.has(p.id));
      setLatestProperties(filtered.length > 0 ? filtered : latestList);
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

  // Auto-refresh ทุก 30 วินาที (real-time update)
  useEffect(() => {
    const id = setInterval(fetchData, 30000);
    return () => clearInterval(id);
  }, []);


  return (
    <div>
      <Navbar />

      {/* === HERO SECTION — Full-bleed Editorial Style === */}
      <section style={{
        position: 'relative',
        zIndex: 10,
        backgroundImage: `url(${imgHeroCover})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        padding: 'calc(80px + 80px) 16px 140px',
        overflow: 'visible',
        textAlign: 'center',
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
      }}>
        {/* Dark overlay — ดำเทาทึบให้อ่านชัด */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(20,20,20,0.82) 0%, rgba(30,30,30,0.7) 50%, rgba(0,0,0,0.85) 100%)', pointerEvents:'none' }} />
        {/* Subtle vignette edges */}
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.35) 100%)', pointerEvents:'none' }} />

        <div className="container" style={{ position:'relative', zIndex:1 }}>
          {/* Eyebrow */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, marginBottom:28 }}>
            <div style={{ width:40, height:1, background:gold }} />
            <span style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.25em', textTransform:'uppercase', color:gold, fontFamily:"'Manrope', sans-serif" }}>
              Curated Properties
            </span>
            <div style={{ width:40, height:1, background:gold }} />
          </div>

          {/* Editorial Headline — Noto Serif Thai */}
          <h1 className="hero-editorial-heading" style={{ color:'#fff', fontSize:'clamp(2.2rem, 6vw, 3.8rem)', marginBottom:20, fontFamily:"'Noto Serif Thai', serif", fontWeight:400 }}>
            ทรัพย์รีโนเวทพร้อมอยู่
          </h1>
          <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'1.05rem', maxWidth:560, margin:'0 auto 16px', lineHeight:1.8, fontWeight:300 }}>
            อสังหาริมทรัพย์คัดสรรโดย <span style={{ color:gold, fontWeight:600 }}>บ้าน D มีเชง</span> รีโนเวทเอง
            <br />คุณภาพครบ ราคาเป็นธรรม ตรวจสอบโฉนดแล้วทุกรายการ
          </p>
          {/* Trust line */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.06)', backdropFilter:'blur(8px)', borderRadius:50, padding:'8px 20px', fontSize:'0.78rem', color:'rgba(255,255,255,0.7)', marginBottom:40, border:'1px solid rgba(255,255,255,0.1)' }}>
            <i className="fas fa-shield-alt" style={{ color:gold, fontSize:'0.72rem' }} />
            ทรัพย์ทุกรายการผ่านการตรวจสอบโฉนดแล้ว
          </div>

          {/* ===== UNIFIED SEARCH BAR — Buy/Rent tabs + Location + Property Type + Search ===== */}
          <div style={{ maxWidth: 780, margin: '0 auto', position: 'relative' }}>
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
                borderRadius: 60,
                overflow: 'visible',
                boxShadow: '0 12px 48px rgba(0,0,0,0.28)',
                padding: '6px 6px 6px 8px',
                gap: 0, flexWrap: 'nowrap',
              }}
            >
              {/* Tab pills — Buy / Rent */}
              <div style={{ display: 'flex', background: '#f0f0f0', borderRadius: 30, padding: 3, flexShrink: 0, marginRight: 8 }}>
                {[
                  { key: 'sale', label: 'ซื้อ' },
                  { key: 'rent', label: 'เช่า' },
                ].map(t => (
                  <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 26,
                      border: 'none',
                      background: activeTab === t.key ? brandGreen : 'transparent',
                      color: activeTab === t.key ? '#fff' : '#888',
                      fontWeight: 700, fontSize: '0.82rem',
                      cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div style={{ width: 1, height: 28, background: '#e0e0e0', flexShrink: 0 }} />

              {/* Location input */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, minWidth: 0 }}>
                <i className="fas fa-map-marker-alt" style={{ color: '#aaa', flexShrink: 0, fontSize: '0.9rem' }} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onFocus={() => setShowHomeSuggest(true)}
                  onBlur={() => setTimeout(() => setShowHomeSuggest(false), 150)}
                  placeholder="ทำเล, จังหวัด หรือ BTS/MRT"
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.88rem', background: 'transparent', fontFamily: 'inherit', color: '#1A8C6E', minWidth: 0 }}
                />
                {searchTerm && (
                  <button type="button" onClick={() => setSearchTerm('')} style={{ border: 'none', background: 'none', color: '#ccc', cursor: 'pointer', padding: 0, fontSize: '0.8rem' }}>
                    <i className="fas fa-times" />
                  </button>
                )}
              </div>

              {/* Divider */}
              <div style={{ width: 1, height: 28, background: '#e0e0e0', flexShrink: 0 }} />

              {/* Property Type dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6, flexShrink: 0, position: 'relative' }}>
                <i className="fas fa-building" style={{ color: '#aaa', fontSize: '0.85rem' }} />
                <select
                  value={heroPropertyType}
                  onChange={e => setHeroPropertyType(e.target.value)}
                  style={{
                    border: 'none', outline: 'none',
                    background: 'transparent', color: '#1A8C6E',
                    fontSize: '0.84rem', fontWeight: 600,
                    fontFamily: 'inherit', cursor: 'pointer',
                    appearance: 'none', WebkitAppearance: 'none',
                    paddingRight: 16,
                  }}
                >
                  <option value="">ประเภททรัพย์</option>
                  <option value="condo">คอนโด</option>
                  <option value="house">บ้านเดี่ยว</option>
                  <option value="townhouse">ทาวน์เฮ้าส์</option>
                  <option value="townhome">ทาวน์โฮม</option>
                  <option value="land">ที่ดิน</option>
                  <option value="commercial">อาคารพาณิชย์</option>
                  <option value="home_office">โฮมออฟฟิศ</option>
                  <option value="warehouse">โกดัง/โรงงาน</option>
                </select>
                <i className="fas fa-chevron-down" style={{ color: '#aaa', fontSize: '0.6rem', position: 'absolute', right: 12 }} />
              </div>

              {/* Search button — circle */}
              <button type="submit" style={{
                width: 48, height: 48, borderRadius: '50%',
                background: brandGreen, color: '#fff', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
                fontSize: '1.1rem',
                boxShadow: '0 4px 16px rgba(0,50,42,0.3)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <i className="fas fa-search" />
              </button>
            </form>

            {/* Suggestion dropdown */}
            <SearchSuggestBox
              visible={showHomeSuggest}
              inputValue={searchTerm}
              onSelect={val => setSearchTerm(val)}
              onClose={() => setShowHomeSuggest(false)}
              activeFilters={{ listing_type: activeTab, property_type: heroPropertyType }}
            />
          </div>

          {/* CTA below search */}
          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Link to="/search" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 36px', background: '#c9a84c', color: '#fff',
              borderRadius: 0, textDecoration: 'none',
              fontSize: '0.88rem', fontWeight: 700,
              fontFamily: "'Manrope', sans-serif",
              letterSpacing: '0.08em',
              transition: 'all 0.3s',
              boxShadow: '0 4px 24px rgba(201,168,76,0.3)',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#b8943f'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#c9a84c'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              ดูทรัพย์ทั้งหมด
              <i className="fas fa-arrow-right" style={{ fontSize: '0.75rem' }} />
            </Link>
            <Link to="/contact" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 36px',
              background: 'transparent', color: '#fff',
              border: '1.5px solid rgba(255,255,255,0.3)',
              borderRadius: 0, textDecoration: 'none',
              fontSize: '0.88rem', fontWeight: 700,
              fontFamily: "'Manrope', sans-serif",
              letterSpacing: '0.08em',
              transition: 'all 0.3s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
            >
              <i className="fas fa-phone-alt" style={{ fontSize: '0.75rem' }} />
              ติดต่อเรา
            </Link>
          </div>
        </div>
      </section>

      {/* === STATS STRIP — architectural grid, no borders === */}
      <section style={{ background: brandGreen, padding: '0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 0 }}>
            {[
              { value: stats.total > 0 ? `${stats.total}+` : '—',   label: 'ทรัพย์ทั้งหมด',    icon: 'fa-building' },
              { value: stats.for_sale > 0 ? `${stats.for_sale}` : '—', label: 'รายการขาย',      icon: 'fa-tag' },
              { value: stats.for_rent > 0 ? `${stats.for_rent}` : '—', label: 'รายการเช่า',    icon: 'fa-key' },
              { value: stats.province_count > 0 ? `${stats.province_count} จังหวัด` : '—', label: 'ครอบคลุม', icon: 'fa-map-marker-alt' },
            ].map((s, i, arr) => (
              <div key={i} style={{
                flex: '1 1 140px', textAlign: 'center', padding: '36px 20px',
                borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
              }}>
                <div style={{ marginBottom: 10 }}>
                  <i className={`fas ${s.icon}`} style={{ fontSize: '0.85rem', color: '#c9a84c' }} />
                </div>
                <div style={{ fontFamily: "'Noto Serif Thai', serif", fontWeight: 400, fontSize: '1.7rem', color: '#fff', lineHeight: 1.1, letterSpacing: '-0.02em' }}>{s.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginTop: 8, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === PROPERTY TYPE ICONS — clean, no emojis, tonal cards === */}
      <section style={{ background: 'var(--surface-lowest)', padding: '52px 0 48px' }}>
        <div className="container">
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div>
              <div className="section-eyebrow" style={{ marginBottom: 6 }}>Property Types</div>
              <h3 style={{ margin: 0, fontSize: 'clamp(1.05rem,2.5vw,1.25rem)', fontWeight: 500, color: 'var(--on-surface)', fontFamily: "'Noto Serif Thai', serif" }}>
                ค้นหาตามประเภทอสังหาริมทรัพย์
              </h3>
            </div>
            <Link to="/search" style={{ fontSize: '0.82rem', color: brandGreen, fontWeight: 700, textDecoration: 'none' }}>
              ดูทั้งหมด
            </Link>
          </div>

          {/* Icon grid — unified color palette, no emojis */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))',
            gap: 14,
          }}>
            {[
              { icon: 'fa-building',    label: 'คอนโด',        type: 'condo' },
              { icon: 'fa-home',        label: 'บ้านเดี่ยว',   type: 'house' },
              { icon: 'fa-city',        label: 'ทาวน์เฮ้าส์',  type: 'townhouse' },
              { icon: 'fa-house-user',  label: 'ทาวน์โฮม',     type: 'townhome' },
              { icon: 'fa-mountain',    label: 'ที่ดิน',        type: 'land' },
              { icon: 'fa-store',       label: 'อาคารพาณิชย์', type: 'commercial' },
              { icon: 'fa-hotel',       label: 'อพาร์ทเม้นท์', type: 'apartment' },
              { icon: 'fa-briefcase',   label: 'โฮมออฟฟิศ',    type: 'home_office' },
              { icon: 'fa-warehouse',   label: 'โกดัง/โรงงาน', type: 'warehouse' },
            ].map(pt => (
              <Link
                key={pt.type}
                to={`/search?property_type=${pt.type}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 10, padding: '22px 10px 18px',
                    borderRadius: 14, background: 'var(--surface-low)', cursor: 'pointer',
                    transition: 'all 0.22s', position: 'relative', overflow: 'hidden',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = brandGreen;
                    e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,50,42,0.15)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    const icon = e.currentTarget.querySelector('i');
                    const label = e.currentTarget.querySelector('.type-label');
                    if (icon) icon.style.color = '#fff';
                    if (label) label.style.color = '#fff';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--surface-low)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                    const icon = e.currentTarget.querySelector('i');
                    const label = e.currentTarget.querySelector('.type-label');
                    if (icon) icon.style.color = brandGreen;
                    if (label) label.style.color = 'var(--on-surface)';
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 50, height: 50, borderRadius: '50%',
                    background: `${brandGreen}0c`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.22s',
                  }}>
                    <i className={`fas ${pt.icon}`} style={{ fontSize: '1.3rem', color: brandGreen, transition: 'color 0.22s' }} />
                  </div>
                  {/* Label */}
                  <span className="type-label" style={{
                    fontSize: '0.76rem', fontWeight: 700,
                    color: 'var(--on-surface)', textAlign: 'center', lineHeight: 1.3,
                    transition: 'color 0.22s',
                  }}>{pt.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* BTSMapSection ถูกเอาออก — เจ้านายไม่ชอบ, ใช้ search suggest แทน */}

      {/* === Popular Locations — Photo Cards Carousel === */}
      <section style={{ padding: '56px 0 52px', background: 'var(--surface-low)' }}>
        <style>{`#loc-carousel::-webkit-scrollbar { display: none; }`}</style>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div>
              <div className="section-eyebrow" style={{ marginBottom: 6 }}>Prime Destinations</div>
              <h2 style={{ fontWeight: 500, margin: '0 0 4px', fontSize: 'clamp(1.05rem,2.5vw,1.3rem)', color: 'var(--on-surface)', fontFamily: "'Noto Serif Thai', serif" }}>
                ทำเล<span style={{ color: brandGreen }}>ยอดนิยม</span>
              </h2>
              <p style={{ color: 'var(--outline)', fontSize: '0.82rem', margin: 0 }}>เลือกทำเลที่คุณสนใจ ดูทรัพย์ในพื้นที่นั้นได้ทันที</p>
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
              { name: 'สุขุมวิท',      sub: 'กรุงเทพฯ',    search: 'สุขุมวิท',  province: 'กรุงเทพมหานคร', img: imgSukhumvit  },
              { name: 'พระราม 9',      sub: 'กรุงเทพฯ',    search: 'พระราม 9',  province: 'กรุงเทพมหานคร', img: imgRama9      },
              { name: 'อโศก–ทองหล่อ', sub: 'กรุงเทพฯ',    search: 'อโศก',      province: 'กรุงเทพมหานคร', img: imgAsok       },
              { name: 'บางนา',         sub: 'กรุงเทพฯ',    search: 'บางนา',     province: 'กรุงเทพมหานคร', img: imgBangna     },
              { name: 'สาทร–สีลม',    sub: 'กรุงเทพฯ',    search: 'สาทร',      province: 'กรุงเทพมหานคร', img: imgSathorn    },
              { name: 'ลาดพร้าว',      sub: 'กรุงเทพฯ',    search: 'ลาดพร้าว', province: 'กรุงเทพมหานคร', img: imgLadprao    },
              { name: 'เชียงใหม่',     sub: 'ภาคเหนือ',    province: 'เชียงใหม่', img: imgChiangmai  },
              { name: 'ชลบุรี–พัทยา', sub: 'ภาคตะวันออก', province: 'ชลบุรี',   img: imgPattaya    },
              { name: 'ภูเก็ต',        sub: 'ภาคใต้',      province: 'ภูเก็ต',    img: imgPhuket     },
              { name: 'นนทบุรี',       sub: 'ปริมณฑล',     province: 'นนทบุรี',   img: imgNonthaburi },
            ].map(loc => {
              // สร้าง URL: ทำเลกรุงเทพ → province + search, จังหวัดอื่น → province เท่านั้น
              const params = new URLSearchParams({ page: '1' });
              if (loc.province) params.set('province', loc.province);
              if (loc.search) params.set('search', loc.search);
              return (
                <Link
                  key={loc.name}
                  to={`/search?${params.toString()}`}
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

      {/* === TRUST BADGES — seamless tonal shift === */}
      <section style={{ background: 'var(--surface-low)', padding: '44px 0 40px' }}>
        <div className="container">
          <p style={{ textAlign:'center', fontSize:'0.65rem', color:gold, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:24, fontFamily:"'Manrope', sans-serif" }}>
            มาตรฐานที่ บ้าน D มีเชง ยึดถือทุกรายการ
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'12px 32px' }}>
            {[
              { icon:'fa-shield-alt',     label:'ตรวจสอบโฉนดทุกแผ่น' },
              { icon:'fa-landmark',       label:'ผ่านกรมที่ดิน' },
              { icon:'fa-file-contract',  label:'สัญญาถูกกฎหมาย 100%' },
              { icon:'fa-university',     label:'รับชำระผ่านธนาคาร' },
              { icon:'fa-user-shield',    label:'ซื้อตรงจาก บ้าน D มีเชง' },
              { icon:'fa-headset',        label:'ทีมงานตอบ 1 ชม.' },
            ].map((b,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, color:'var(--on-surface-variant)', fontSize:'0.8rem', fontWeight:600 }}>
                <i className={`fas ${b.icon}`} style={{ color:brandGreen, fontSize:'0.78rem', opacity:0.7 }} />
                {b.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === FEATURED PROPERTIES === */}
      <section style={{ background: 'var(--surface-low)', padding: '56px 0 52px' }}>
        <style>{`#feat-carousel::-webkit-scrollbar { display: none; }`}</style>
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <div className="section-eyebrow" style={{ marginBottom: 6 }}>Curated Selection</div>
              <h3 style={{ fontFamily: "'Noto Serif Thai', serif", fontWeight: 500, fontSize: 'clamp(1.05rem,2.5vw,1.3rem)', color: 'var(--on-surface)', margin: '0 0 4px' }}>ทรัพย์สิน<span style={{ color: brandGreen }}>แนะนำ</span></h3>
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
              <Link to="/search?is_featured=1" className="btn btn-outline-success rounded-pill px-4 fw-bold ms-2">
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
      <section style={{ background: 'var(--surface-lowest)', padding: '56px 0 52px' }}>
        <style>{`#lat-carousel::-webkit-scrollbar { display: none; }`}</style>
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <div className="section-eyebrow" style={{ marginBottom: 6 }}>New Arrivals</div>
              <h3 style={{ fontFamily: "'Noto Serif Thai', serif", fontWeight: 500, fontSize: 'clamp(1.05rem,2.5vw,1.3rem)', color: 'var(--on-surface)', margin: '0 0 4px' }}>ประกาศ<span style={{ color: brandGreen }}>ล่าสุด</span></h3>
              <p style={{ color: 'var(--outline)', fontSize: '0.82rem', margin: 0 }}>อสังหาริมทรัพย์ที่เพิ่งลงประกาศใหม่</p>
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
      <section id="services" style={{ padding: '72px 0', background: 'var(--surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div className="section-eyebrow" style={{ marginBottom: 10 }}>
              Our Distinction
            </div>
            <h2 style={{ fontWeight: 400, margin: '0 0 10px', fontSize: 'clamp(1.2rem,3vw,1.6rem)', color: 'var(--on-surface)', fontFamily: "'Noto Serif Thai', serif" }}>
              ทำไมต้องเลือก <span style={{ color: brandGreen }}>บ้าน D มีเชง</span>?
            </h2>
            <p style={{ color: 'var(--on-surface-variant)', margin: 0, fontSize: '0.9rem' }}>ทรัพย์ทุกหลังผ่านมือ บ้าน D มีเชง รีโนเวทเอง พร้อมทีมดูแลคุณตลอดกระบวนการ</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {[
              { icon: 'fa-hammer',        title: 'บ้าน D มีเชง รีโนเวทเอง', desc: 'ทุกหลังผ่านการปรับปรุงโดยทีม บ้าน D มีเชง ไม่รับฝากขายจากบุคคลภายนอก' },
              { icon: 'fa-file-contract', title: 'โฉนดถูกต้อง 100%',        desc: 'ตรวจสอบเอกสารทุกรายการ ผ่านกรมที่ดิน สัญญาถูกกฎหมาย' },
              { icon: 'fa-coins',         title: 'ราคาเป็นธรรม',            desc: 'ประเมินราคาด้วยทีมผู้เชี่ยวชาญ คุ้มค่าทุกรายการ' },
              { icon: 'fa-user-tie',      title: 'ทีมผู้เชี่ยวชาญ',         desc: 'ดูแลตั้งแต่ต้นจนปิดดีล ทราบผลใน 24 ชม.' },
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
                  background: `${brandGreen}0c`,
                  margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={`fas ${v.icon}`} style={{ fontSize: '1.4rem', color: brandGreen }} />
                </div>
                <div style={{ fontFamily: "'Noto Serif Thai', serif", fontWeight: 500, fontSize: '0.95rem', color: 'var(--on-surface)', marginBottom: 10 }}>{v.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', lineHeight: 1.7 }}>{v.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === FOOTER — Premium Editorial Dark === */}
      <footer className="footer-premium" style={{ backgroundColor: '#147A5E', color: 'rgba(255,255,255,0.5)' }}>
        {/* Gold accent line is added via CSS ::before */}

        {/* Top section: Brand statement */}
        <div style={{ padding: '64px 0 48px', textAlign: 'center' }}>
          <div className="container">
            <img src={bigLogo} alt="บ้าน D มีเชง" style={{ height: 56, objectFit: 'contain', marginBottom: 20, opacity: 0.9 }} />
            <h3 style={{ fontFamily: "'Noto Serif Thai', serif", fontWeight: 400, fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', color: '#fff', margin: '0 0 12px', letterSpacing: '-0.01em' }}>
              ทรัพย์รีโนเวทพร้อมอยู่ โดย บ้าน D มีเชง
            </h3>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.8, maxWidth: 480, margin: '0 auto', color: 'rgba(255,255,255,0.4)' }}>
              คุณภาพครบ ราคาเป็นธรรม ตรวจสอบโฉนดแล้วทุกรายการ
            </p>
          </div>
        </div>

        {/* Links grid */}
        <div style={{ background: 'rgba(0,0,0,0.15)', padding: '48px 0' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 40 }}>
              {/* Market Listings */}
              <div>
                <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '0.72rem', color: '#c9a84c', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 18 }}>ทรัพย์สิน</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { to: '/search?listing_type=sale', label: 'ทรัพย์ขาย' },
                    { to: '/search?listing_type=rent', label: 'ทรัพย์เช่า' },
                    { to: '/search?is_featured=1', label: 'ทรัพย์แนะนำ' },
                    { to: '/search', label: 'ค้นหาทั้งหมด' },
                  ].map((lnk, i) => (
                    <Link key={i} to={lnk.to} style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.84rem', textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#c9a84c'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
                    >{lnk.label}</Link>
                  ))}
                </div>
              </div>

              {/* Support */}
              <div>
                <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '0.72rem', color: '#c9a84c', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 18 }}>ช่วยเหลือ</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { to: '/contact', label: 'ติดต่อเรา' },
                    { to: '/faq', label: 'คำถามที่พบบ่อย' },
                    { to: '/guide', label: 'คู่มือการใช้งาน' },
                  ].map((lnk, i) => (
                    <Link key={i} to={lnk.to} style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.84rem', textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#c9a84c'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
                    >{lnk.label}</Link>
                  ))}
                </div>
              </div>

              {/* Contact info */}
              <div>
                <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '0.72rem', color: '#c9a84c', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 18 }}>ติดต่อ</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.84rem' }}>
                  <a href="tel:081-638-6966" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#c9a84c'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
                  >
                    <i className="fas fa-phone-alt" style={{ fontSize: '0.72rem' }} /> 081-638-6966
                  </a>
                  <a href="https://line.me/R/ti/p/@loan_dd" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#c9a84c'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
                  >
                    <i className="fab fa-line" style={{ fontSize: '0.78rem' }} /> @loan_dd
                  </a>
                </div>
              </div>

              {/* Social */}
              <div>
                <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: '0.72rem', color: '#c9a84c', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 18 }}>Follow Us</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  {[
                    { icon: 'fab fa-facebook-f', href: 'https://www.facebook.com/share/1HWR1pe2XM/?mibextid=wwXIfr' },
                    { icon: 'fab fa-line', href: 'https://line.me/R/ti/p/@loan_dd' },
                    { icon: 'fas fa-phone-alt', href: 'tel:081-638-6966' },
                  ].map((s, i) => (
                    <a key={i} href={s.href} target="_blank" rel="noopener noreferrer"
                      style={{
                        width: 40, height: 40, borderRadius: 0,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem',
                        transition: 'all 0.25s', textDecoration: 'none',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#c9a84c'; e.currentTarget.style.color = '#001a14'; e.currentTarget.style.borderColor = '#c9a84c'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                    >
                      <i className={s.icon} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar — no border, tonal shift */}
        <div style={{ padding: '20px 0', background: 'rgba(0,0,0,0.2)' }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: '0.72rem', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.3)' }}>&copy; {new Date().getFullYear()} บ้าน D มีเชง Co., Ltd. All rights reserved.</span>
            <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.15em', fontWeight: 700, fontFamily: "'Manrope', sans-serif" }}>Bangkok &middot; Phuket &middot; Chiang Mai</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;