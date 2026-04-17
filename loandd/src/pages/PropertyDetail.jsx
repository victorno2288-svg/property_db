import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import Navbar from '../Navbar';
import { formatPrice, propertyTypeLabel } from '../utils/propertyUtils';


const API_BASE = 'http://localhost:3001';
const LINE_URL = 'https://line.me/R/ti/p/@loan_dd';
const FB_URL = 'https://www.facebook.com/share/1HWR1pe2XM/?mibextid=wwXIfr';

// ===== Badge สถานะการขาย =====
// listing_type-aware: ถ้าเป็นให้เช่า จะแสดง "ติดเช่า" แทน "ขายแล้ว" และ "พร้อมเช่า" แทน "พร้อมขาย"
const getStatusConfig = (sale_status, listing_type) => {
  const isRent = listing_type === 'rent';
  const map = {
    available: { label: isRent ? 'พร้อมเช่า' : 'พร้อมขาย', bg: 'rgba(0,50,42,0.08)', color: '#3d7a3a' },
    reserved: { label: 'จองแล้ว', bg: 'rgba(212,137,10,0.1)', color: '#d4890a' },
    sold: { label: isRent ? 'ติดเช่า' : 'ขายแล้ว', bg: isRent ? 'rgba(99,102,241,0.1)' : 'rgba(192,57,43,0.1)', color: isRent ? '#6366f1' : '#c0392b' },
  };
  return map[sale_status] || map.available;
};

// ===== Amenity icon map =====
const amenityIconMap = {
  'แอร์': 'fa-snowflake',
  'เฟอร์นิเจอร์': 'fa-couch',
  'สระว่ายน้ำ': 'fa-swimming-pool',
  'สวน': 'fa-leaf',
  'ที่จอดรถ': 'fa-car',
  'ลิฟท์': 'fa-arrow-up',
  'ฟิตเนส': 'fa-dumbbell',
  'รปภ.': 'fa-shield-alt',
  'กล้องวงจรปิด': 'fa-video',
};

// ===== Design tokens =====
const T = {
  bg: '#faf9f6',
  surface: '#fff',
  surfaceLow: '#f5f4f1',
  surfaceMid: '#efeee9',
  primary: '#3d7a3a',
  primaryBg: '#A1D99B',
  primaryLight: '#8BC683',
  text: '#1a1a18',
  textSoft: '#6a6560',
  textMuted: '#a8a39d',
  accent: '#c9a84c',      // gold
  accentBg: 'rgba(201,168,76,0.08)',
  line: '#06C755',
  radius: 12,
  cardRadius: 12,
  fontHeading: "'Prompt', 'Noto Sans Thai', sans-serif",
  fontBody: "'Inter', 'Noto Sans Thai', 'Sarabun', sans-serif",
};

function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [inquiryForm, setInquiryForm] = useState({ name: '', phone: '', message: '' });
  const [inquiryStatus, setInquiryStatus] = useState('idle');
  const [inquiryMsg, setInquiryMsg] = useState('');
  const [lightbox, setLightbox] = useState(null);
  const touchRef = useRef({ startX: 0, startY: 0 });
  const mobileCarouselRef = useRef(null);

  const [isSaved, setIsSaved] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [similarProps, setSimilarProps] = useState([]);
  const [qCopied, setQCopied] = useState(false);

  const [calcDown, setCalcDown] = useState(20);
  const [calcRate, setCalcRate] = useState(6.5);
  const [calcYears, setCalcYears] = useState(30);

  const [userLoc, setUserLoc] = useState(null);
  const [locStatus, setLocStatus] = useState('idle');

  const [viewerCount, setViewerCount] = useState(1);
  const sessionIdRef = useRef(null);
  const heartbeatRef = useRef(null);

  if (!sessionIdRef.current) {
    let sid = sessionStorage.getItem('viewerSessionId');
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem('viewerSessionId', sid);
    }
    sessionIdRef.current = sid;
  }

  useEffect(() => {
    if (!id) return;
    const sid = sessionIdRef.current;
    const ping = async () => {
      try {
        const r = await fetch(`${API_BASE}/api/properties/${id}/viewers/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sid }),
        });
        if (r.ok) {
          const d = await r.json();
          setViewerCount(d.count ?? 1);
        }
      } catch { }
    };
    ping();
    heartbeatRef.current = setInterval(ping, 20_000);
    const handleLeave = () => {
      const payload = new Blob([JSON.stringify({ sessionId: sid })], { type: 'text/plain' });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(`${API_BASE}/api/properties/${id}/viewers/leave`, payload);
      } else {
        fetch(`${API_BASE}/api/properties/${id}/viewers/leave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sid }),
          keepalive: true,
          credentials: 'omit',
        }).catch(() => { });
      }
    };
    window.addEventListener('pagehide', handleLeave);
    window.addEventListener('beforeunload', handleLeave);
    return () => {
      clearInterval(heartbeatRef.current);
      window.removeEventListener('pagehide', handleLeave);
      window.removeEventListener('beforeunload', handleLeave);
      handleLeave();
    };
  }, [id]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('savedPropertyIds') || '[]');
      setIsSaved(saved.includes(Number(id)));
    } catch { }
  }, [id]);

  const toggleSave = () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    const next = !isSaved;
    setIsSaved(next);

    // Fire toast
    window.dispatchEvent(new CustomEvent('property-save-toast', {
      detail: { saved: next, title: property?.title || 'ทรัพย์สิน', thumbnail: allImages[0] ? getImgSrc(allImages[0]) : null }
    }));

    try {
      const list = JSON.parse(localStorage.getItem('savedPropertyIds') || '[]');
      const numId = Number(id);
      localStorage.setItem('savedPropertyIds', JSON.stringify(next ? [...list, numId] : list.filter(x => x !== numId)));
    } catch { }
    fetch(`${API_BASE}/api/users/saved/${id}`, {
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
      .then(data => { setIsSaved(data.saved); })
      .catch((err) => {
        if (err.message !== 'Unauthorized') {
          setIsSaved(!next);
          try {
            const list = JSON.parse(localStorage.getItem('savedPropertyIds') || '[]');
            const numId = Number(id);
            localStorage.setItem('savedPropertyIds', JSON.stringify(!next ? [...list, numId] : list.filter(x => x !== numId)));
          } catch { }
        }
      });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    });
  };

  const fetchProperty = () => {
    setLoading(true);
    setNotFound(false);
    fetch(`${API_BASE}/api/properties/${id}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then(data => { if (data) setProperty(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProperty();
    window.scrollTo(0, 0);
  }, [id, location.key]);

  // Re-fetch เมื่อ user สลับแท็บกลับมา
  useEffect(() => {
    const onVis = () => { if (!document.hidden) fetchProperty(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [id]);

  // GPS: ขอ permission เฉพาะตอนกดปุ่มเท่านั้น (auto-request ถูก browser บล็อคได้)

  useEffect(() => {
    if (!property) return;
    const params = new URLSearchParams({
      property_type: property.property_type || '',
      province: property.province || '',
      limit: 4,
    });
    fetch(`${API_BASE}/api/properties?${params}`)
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        setSimilarProps(list.filter(p => p.id !== property.id).slice(0, 4));
      })
      .catch(() => { });
  }, [property]);

  const allImages = (() => {
    if (!property) return [];
    const imgs = Array.isArray(property.images) ? property.images.map(i => i.image_url) : [];
    if (property.thumbnail_url && !imgs.includes(property.thumbnail_url)) {
      imgs.unshift(property.thumbnail_url);
    }
    return imgs;
  })();

  const getImgSrc = (url) => url
    ? (url.startsWith('http') ? url : `${API_BASE}/${url.replace(/^\/+/, '')}`)
    : null;

  const handleInquiry = async (e) => {
    e.preventDefault();
    if (!inquiryForm.name.trim() || inquiryForm.name.trim().length < 2) {
      setInquiryMsg('กรุณาระบุชื่อของคุณ');
      setInquiryStatus('error');
      return;
    }
    if (!inquiryForm.phone.trim() || inquiryForm.phone.replace(/\D/g, '').length < 9) {
      setInquiryMsg('กรุณาระบุเบอร์โทรที่ถูกต้อง');
      setInquiryStatus('error');
      return;
    }
    setInquiryStatus('sending');
    setInquiryMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: id,
          name: inquiryForm.name.trim(),
          phone: inquiryForm.phone.trim(),
          message: inquiryForm.message.trim() || '',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setInquiryStatus('success');
        setInquiryMsg(data.message || 'ส่งข้อความสำเร็จ ทีมงานจะติดต่อกลับโดยเร็ว');
        setInquiryForm({ name: '', phone: '', message: '' });
      } else {
        setInquiryStatus('error');
        setInquiryMsg(data.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      }
    } catch {
      setInquiryStatus('error');
      setInquiryMsg('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  };


  // ===== LOADING — Skeleton Shimmer =====
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.fontBody }}>
        <Navbar />
        {/* Hero skeleton */}
        <div className="skeleton-box" style={{ width: '100%', height: 'min(60vw, 500px)' }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 32 }} className="detail-grid">
            <div>
              {/* Price skeleton */}
              <div className="skeleton-box" style={{ height: 90, marginBottom: 24 }} />
              {/* Specs skeleton */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, marginBottom: 24 }}>
                {[...Array(8)].map((_, i) => <div key={i} className="skeleton-box" style={{ height: 80 }} />)}
              </div>
              {/* Description skeleton */}
              <div className="skeleton-box" style={{ height: 16, width: '30%', marginBottom: 12 }} />
              <div className="skeleton-box" style={{ height: 160, marginBottom: 24 }} />
              {/* Amenities skeleton */}
              <div className="skeleton-box" style={{ height: 16, width: '25%', marginBottom: 12 }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, marginBottom: 24 }}>
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton-box" style={{ height: 70 }} />)}
              </div>
            </div>
            <div>
              {/* Sidebar skeleton */}
              <div className="skeleton-box" style={{ height: 380, marginBottom: 20 }} />
              <div className="skeleton-box" style={{ height: 240 }} />
            </div>
          </div>
        </div>
        <style>{`
          @media (max-width: 768px) {
            .detail-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    );
  }

  // ===== NOT FOUND =====
  if (notFound || !property) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.fontBody }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '100px 16px' }}>
          <div style={{ fontSize: '3rem', color: T.surfaceMid, marginBottom: 20 }}>
            <i className="fas fa-home" />
          </div>
          <h2 style={{ color: T.text, fontFamily: T.fontHeading, fontWeight: 500, fontSize: '1.3rem', marginBottom: 8 }}>
            ไม่พบทรัพย์สินนี้
          </h2>
          <p style={{ color: T.textMuted, marginBottom: 32, fontSize: '0.9rem' }}>อาจถูกลบหรือ URL ไม่ถูกต้อง</p>
          <button onClick={() => navigate('/search')} style={{
            background: T.primary, color: '#fff',
            border: 'none', borderRadius: T.cardRadius,
            padding: '12px 32px', fontWeight: 700, cursor: 'pointer',
            fontSize: '0.88rem', letterSpacing: '0.03em',
          }}>
            ดูทรัพย์สินทั้งหมด
          </button>
        </div>
      </div>
    );
  }

  const sStatus = getStatusConfig(property.sale_status, property.listing_type);
  const listingLabel = { sale: 'ขาย', rent: 'เช่า', sale_rent: 'ขาย / เช่า' };

  const haversineKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371, toRad = d => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) { setLocStatus('denied'); return; }
    setLocStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocStatus('success');
      },
      () => setLocStatus('denied'),
      { timeout: 15000, maximumAge: 300000, enableHighAccuracy: true }
    );
  };

  const distanceFromUser = (userLoc && property.latitude && property.longitude)
    ? haversineKm(userLoc.lat, userLoc.lng, parseFloat(property.latitude), parseFloat(property.longitude))
    : null;

  const scrollToSection = (secId) => {
    const el = document.getElementById(secId);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 110, behavior: 'smooth' });
  };

  const detailTabs = [
    { id: 'detail-info', label: 'ข้อมูลทรัพย์', show: true },
    { id: 'detail-amenities', label: 'สิ่งอำนวยฯ', show: !!(property.amenities?.length > 0) },
    { id: 'detail-map', label: 'ที่ตั้ง', show: !!(property.province || property.district || property.latitude) },
    { id: 'detail-calculator', label: 'คำนวณสินเชื่อ', show: property.listing_type !== 'rent' && !!property.price_requested },
    { id: 'detail-video', label: 'วิดีโอ', show: !!property.video_url },
    { id: 'detail-3dtour', label: '3D Tour 360°', show: !!property.virtual_tour_id },
  ].filter(t => t.show);

  const getYoutubeId = (url) => {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  };

  const calcLoanAmount = property.price_requested
    ? Math.round(property.price_requested * (1 - calcDown / 100))
    : 0;
  const calcMonthly = (() => {
    if (!calcLoanAmount || calcLoanAmount <= 0) return 0;
    const r = calcRate / 100 / 12;
    const n = calcYears * 12;
    if (r === 0) return Math.round(calcLoanAmount / n);
    return Math.round(calcLoanAmount * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1));
  })();

  const usableAreaText = property.usable_area ? `${Number(property.usable_area).toLocaleString()} ตร.ม.` : null;
  const landAreaText = (() => {
    const p = [];
    if (Number(property.land_area_rai) > 0) p.push(`${property.land_area_rai} ไร่`);
    if (Number(property.land_area_ngan) > 0) p.push(`${property.land_area_ngan} งาน`);
    if (Number(property.land_area_wah) > 0) p.push(`${property.land_area_wah} ตร.ว.`);
    return p.length > 0 ? p.join(' ') : null;
  })();
  const areaText = usableAreaText || landAreaText || '—';

  const locationText = [property.sub_district, property.district, property.province].filter(Boolean).join(', ');

  return (
    <div className="detail-page-wrapper" style={{ minHeight: '100vh', background: T.bg, fontFamily: T.fontBody }}>
      <Navbar />

      {/* ===== LIGHTBOX with swipe ===== */}
      {lightbox !== null && (
        <div
          onClick={() => setLightbox(null)}
          onTouchStart={e => { touchRef.current.startX = e.touches[0].clientX; touchRef.current.startY = e.touches[0].clientY; }}
          onTouchEnd={e => {
            const dx = e.changedTouches[0].clientX - touchRef.current.startX;
            const dy = e.changedTouches[0].clientY - touchRef.current.startY;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
              e.stopPropagation();
              if (dx < 0) setLightbox(l => Math.min(allImages.length - 1, l + 1));
              else setLightbox(l => Math.max(0, l - 1));
            }
          }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.95)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <button onClick={e => { e.stopPropagation(); setLightbox(l => Math.max(0, l - 1)); }}
            style={arrowBtn('left')}>
            <i className="fas fa-chevron-left" />
          </button>
          <img
            src={getImgSrc(allImages[lightbox])}
            alt=""
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', userSelect: 'none' }}
            onClick={e => e.stopPropagation()}
            draggable={false}
          />
          <button onClick={e => { e.stopPropagation(); setLightbox(l => Math.min(allImages.length - 1, l + 1)); }}
            style={arrowBtn('right')}>
            <i className="fas fa-chevron-right" />
          </button>
          <button onClick={() => setLightbox(null)} style={{
            position: 'fixed', top: 20, right: 20,
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', fontSize: '1.2rem', borderRadius: 0,
            width: 44, height: 44, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="fas fa-times" />
          </button>
          <div style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', letterSpacing: '0.1em',
            fontFamily: T.fontBody,
          }}>
            {lightbox + 1} / {allImages.length}
          </div>
        </div>
      )}

      {/* ===== STICKY TAB NAV ===== */}
      {detailTabs.length > 1 && (
        <div style={{
          position: 'sticky', top: 64, zIndex: 200,
          background: '#fff',
          borderBottom: `1px solid ${T.surfaceMid}`,
          borderTop: `1px solid ${T.surfaceMid}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <style>{`
            #detail-tab-bar::-webkit-scrollbar { display: none; }
            .dtab { transition: all 0.2s !important; position: relative; }
            .dtab::after { content: ''; position: absolute; bottom: 0; left: 50%; width: 0; height: 2px; background: ${T.primary}; transition: all 0.2s; transform: translateX(-50%); }
            .dtab:hover::after { width: 100%; }
            .dtab:hover { color: ${T.primary} !important; }
          `}</style>
          <div id="detail-tab-bar" style={{
            maxWidth: 1100, margin: '0 auto', padding: '0 16px',
            display: 'flex', overflowX: 'auto', scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch', gap: 0,
          }}>
            {detailTabs.map(tab => (
              <button
                key={tab.id}
                className="dtab"
                onClick={() => scrollToSection(tab.id)}
                style={{
                  padding: '14px 22px', border: 'none',
                  background: 'transparent', color: T.textSoft,
                  fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                  whiteSpace: 'nowrap', letterSpacing: '0.04em',
                  fontFamily: T.fontBody,
                  textTransform: 'uppercase',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== PHOTO SLIDESHOW — sliding carousel + thumbnails ===== */}
      <style>{`
        .photo-slide-wrap { position: relative; max-width: 1100px; margin: 0 auto; border-radius: ${T.radius}px; overflow: hidden; height: 520px; }
        .photo-slide-track { display: flex; height: 100%; transition: transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1); }
        .photo-slide-track img { display: block; width: 100%; height: 100%; object-fit: cover; flex-shrink: 0; user-select: none; -webkit-user-drag: none; }
        .slide-arrow { position: absolute; top: 50%; transform: translateY(-50%); z-index: 3; width: 40px; height: 40px; border-radius: 50%; background: rgba(0,0,0,0.35); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; color: #fff; transition: all 0.2s; backdrop-filter: blur(4px); }
        .slide-arrow:hover { background: rgba(0,0,0,0.6); transform: translateY(-50%) scale(1.05); }
        .slide-arrow.left { left: 14px; }
        .slide-arrow.right { right: 14px; }
        .slide-status-badge { position: absolute; top: 14px; left: 14px; z-index: 2; padding: 6px 18px; font-weight: 800; font-size: 0.82rem; letter-spacing: 0.05em; border-radius: 8px; display: flex; align-items: center; gap: 6px; color: #fff; }
        .photo-thumbstrip-wrap { position: absolute; bottom: 0; left: 0; right: 0; z-index: 4; background: linear-gradient(transparent, rgba(0,0,0,0.6)); padding: 20px 36px 8px; }
        .photo-thumbstrip { display: flex; gap: 4px; overflow-x: auto; scroll-behavior: smooth; justify-content: center; }
        .photo-thumbstrip::-webkit-scrollbar { height: 0; }
        .photo-thumb { flex-shrink: 0; width: 62px; height: 44px; overflow: hidden; cursor: pointer; border: 2px solid transparent; opacity: 0.65; transition: all 0.2s; }
        .photo-thumb:hover { opacity: 1; }
        .photo-thumb.active { opacity: 1; border-color: #fff; }
        .photo-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .thumb-scroll-btn { position: absolute; top: 50%; transform: translateY(-50%); z-index: 5; width: 24px; height: 24px; border-radius: 50%; background: rgba(255,255,255,0.25); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.55rem; color: #fff; transition: all 0.2s; }
        .thumb-scroll-btn:hover { background: rgba(255,255,255,0.5); }
        .thumb-scroll-btn.left { left: 8px; }
        .thumb-scroll-btn.right { right: 8px; }
        .photo-no-img { display: flex; align-items: center; justify-content: center; background: #e8e6e1; color: #bbb; font-size: 4rem; height: 520px; max-width: 1100px; margin: 0 auto; border-radius: ${T.radius}px; }
        @media (max-width: 768px) {
          .photo-slide-wrap { height: 300px; border-radius: 0; }
          .slide-arrow { width: 34px; height: 34px; font-size: 0.8rem; }
          .slide-arrow.left { left: 10px; }
          .slide-arrow.right { right: 10px; }
          .photo-thumbstrip-wrap { display: none !important; }
          .photo-slide-wrap { border-radius: 0; }
          .photo-no-img { height: 300px; border-radius: 0; }
        }
      `}</style>
      <div id="detail-info" style={{ padding: '0 16px' }}>
        {allImages.length === 0 ? (
          <div className="photo-no-img"><i className="fas fa-home" /></div>
        ) : (
          <>
            <div className="photo-slide-wrap"
              onClick={() => setLightbox(activeImg)}
              onTouchStart={e => { touchRef.current.startX = e.touches[0].clientX; touchRef.current.swiping = false; }}
              onTouchMove={() => { touchRef.current.swiping = true; }}
              onTouchEnd={e => {
                const dx = e.changedTouches[0].clientX - touchRef.current.startX;
                if (Math.abs(dx) > 40) {
                  e.stopPropagation();
                  if (dx < 0 && activeImg < allImages.length - 1) setActiveImg(p => p + 1);
                  else if (dx > 0 && activeImg > 0) setActiveImg(p => p - 1);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="photo-slide-track" style={{ transform: `translateX(-${activeImg * 100}%)` }}>
                {allImages.map((img, i) => (
                  <img key={i} src={getImgSrc(img)} alt={i === 0 ? property.title : ''} draggable={false} />
                ))}
              </div>
              {allImages.length > 1 && (
                <>
                  {activeImg > 0 && (
                    <button className="slide-arrow left" onClick={e => { e.stopPropagation(); setActiveImg(p => p - 1); }}>
                      <i className="fas fa-chevron-left" />
                    </button>
                  )}
                  {activeImg < allImages.length - 1 && (
                    <button className="slide-arrow right" onClick={e => { e.stopPropagation(); setActiveImg(p => p + 1); }}>
                      <i className="fas fa-chevron-right" />
                    </button>
                  )}
                </>
              )}
              {property.sale_status && property.sale_status !== 'available' && (
                <div className="slide-status-badge" style={{ background: property.sale_status === 'sold' ? (property.listing_type === 'rent' ? '#6366f1' : '#c0392b') : '#d4890a' }}>
                  <i className={`fas ${property.sale_status === 'sold' ? (property.listing_type === 'rent' ? 'fa-check-circle' : 'fa-times-circle') : 'fa-bookmark'}`} style={{ fontSize: '0.72rem' }} />
                  {property.sale_status === 'sold' ? (property.listing_type === 'rent' ? 'ติดเช่า' : 'ขายแล้ว') : 'จองแล้ว'}
                </div>
              )}
              {allImages.length > 1 && (
                <div className="photo-thumbstrip-wrap">
                  <button className="thumb-scroll-btn left" onClick={e => { e.stopPropagation(); document.querySelector('.photo-thumbstrip').scrollLeft -= 250; }}>
                    <i className="fas fa-chevron-left" />
                  </button>
                  <div className="photo-thumbstrip">
                    {allImages.map((img, i) => (
                      <div key={i} className={`photo-thumb${activeImg === i ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setActiveImg(i); }}>
                        <img src={getImgSrc(img)} alt="" draggable={false} />
                      </div>
                    ))}
                  </div>
                  <button className="thumb-scroll-btn right" onClick={e => { e.stopPropagation(); document.querySelector('.photo-thumbstrip').scrollLeft += 250; }}>
                    <i className="fas fa-chevron-right" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ===== TITLE & BADGES (below photo grid) ===== */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{
            background: T.surface, color: T.accent,
            padding: '5px 14px', fontSize: '0.7rem', fontWeight: 800,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            borderRadius: 20, border: `1px solid ${T.accent}`,
            fontFamily: T.fontBody,
            display: 'inline-flex', alignItems: 'center', gap: 5,
          }}>
            <i className="fas fa-circle" style={{ fontSize: '0.3rem', color: T.accent }} />
            {sStatus.label}
          </span>
          <span style={{
            background: T.surface, color: T.text,
            padding: '5px 14px', fontSize: '0.7rem', fontWeight: 700,
            letterSpacing: '0.06em',
            borderRadius: 20, border: '1px solid #e0ddd8',
            fontFamily: T.fontBody,
            display: 'inline-flex', alignItems: 'center', gap: 5,
          }}>
            <i className="fas fa-home" style={{ fontSize: '0.55rem', opacity: 0.5 }} />
            {propertyTypeLabel(property.property_type)} {listingLabel[property.listing_type] ? `· ${listingLabel[property.listing_type]}` : ''}
          </span>
        </div>
        <h1 style={{
          color: T.text, fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
          fontWeight: 600, margin: 0, lineHeight: 1.25,
          fontFamily: T.fontHeading, letterSpacing: '-0.01em',
        }}>
          {property.title}
        </h1>
        {locationText && (
          <div style={{
            color: T.textSoft, fontSize: '0.85rem', marginTop: 8,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <i className="fas fa-map-marker-alt" style={{ fontSize: '0.65rem', color: T.accent }} />
            {locationText}
          </div>
        )}
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px 90px' }}>

        {/* ===== ACTION BAR + BREADCRUMB ===== */}
        <div style={{ padding: '20px 0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          {/* Breadcrumb */}
          <div style={{ fontSize: '0.78rem', color: T.textMuted, display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link to="/" style={{ color: T.textSoft, textDecoration: 'none' }}>หน้าแรก</Link>
            <span style={{ color: T.surfaceMid }}>/</span>
            <Link to="/search" style={{ color: T.textSoft, textDecoration: 'none' }}>ทรัพย์สิน</Link>
            <span style={{ color: T.surfaceMid }}>/</span>
            <span style={{ color: T.text }}>{property.title}</span>
          </div>

          {/* Actions */}
          {(() => {
            const abtn = (active, color = T.primary) => ({
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px',
              border: `1px solid ${active ? color : T.surfaceMid}`,
              background: active ? `${color}0a` : 'transparent',
              color: active ? color : T.textSoft,
              cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
              fontFamily: T.fontBody, transition: 'all 0.2s',
              letterSpacing: '0.02em', borderRadius: 8,
            });
            const shareData = { title: property.title, text: `ดูทรัพย์นี้บน บ้าน D มีเชง: ${property.title}`, url: window.location.href };
            return (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                {navigator.share ? (
                  <button onClick={() => navigator.share(shareData).catch(() => { })} style={abtn(false)}>
                    <i className="fas fa-share-alt" style={{ fontSize: '0.7rem' }} /> แชร์
                  </button>
                ) : (
                  <a href={`https://line.me/R/share?text=${encodeURIComponent(property.title + ' ' + window.location.href)}`}
                    target="_blank" rel="noopener noreferrer" style={{ ...abtn(false), textDecoration: 'none' }}>
                    <i className="fab fa-line" style={{ color: T.line }} /> แชร์
                  </a>
                )}
                <button onClick={() => { navigator.clipboard?.writeText(window.location.href).then(() => { setQCopied(true); setTimeout(() => setQCopied(false), 2000); }); }} style={abtn(qCopied, T.primary)}>
                  <i className={`fas ${qCopied ? 'fa-check' : 'fa-link'}`} style={{ fontSize: '0.7rem' }} />
                  {qCopied ? 'Copied' : 'คัดลอก'}
                </button>
                <button onClick={toggleSave} style={abtn(isSaved, '#e53e3e')}>
                  <i className={`${isSaved ? 'fas' : 'far'} fa-heart`} style={{ color: isSaved ? '#e53e3e' : T.textMuted, fontSize: '0.75rem' }} />
                  {isSaved ? 'บันทึกแล้ว' : 'บันทึก'}
                </button>
              </div>
            );
          })()}
        </div>

        {/* ===== TWO COLUMN LAYOUT ===== */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 32, alignItems: 'start' }}
          className="detail-grid">

          {/* ===== LEFT COLUMN ===== */}
          <div>

            {/* ===== PRICE BLOCK — Premium Card ===== */}
            <div style={{
              background: T.surface, borderRadius: T.radius, marginBottom: 24,
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: `1px solid ${T.surfaceMid}`,
              overflow: 'hidden',
            }}>
              {/* Top accent line */}
              <div style={{ height: 3, background: `linear-gradient(90deg, ${T.primary}, ${T.accent})` }} />

              <div style={{ padding: '24px 28px 20px' }}>
                {/* Listing type badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{
                    background: `linear-gradient(135deg, ${T.primaryBg}, #8BC683)`, color: '#1a3a18',
                    padding: '4px 14px', fontSize: '0.68rem', fontWeight: 700,
                    borderRadius: 6, letterSpacing: '0.08em', textTransform: 'uppercase',
                    fontFamily: T.fontBody,
                  }}>
                    {listingLabel[property.listing_type] || 'ราคา'}
                  </span>
                  {property.sale_status === 'available' && (
                    <span style={{
                      background: 'rgba(61,122,58,0.08)', color: T.primary,
                      padding: '4px 10px', fontSize: '0.65rem', fontWeight: 700, borderRadius: 6,
                    }}>
                      <i className="fas fa-circle" style={{ fontSize: '0.35rem', verticalAlign: 'middle', marginRight: 4 }} />พร้อม{property.listing_type === 'rent' ? 'เช่า' : 'ขาย'}
                    </span>
                  )}
                </div>

                {/* Price */}
                {property.listing_type !== 'rent' && property.price_requested ? (
                  <div style={{
                    color: T.text, fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', fontWeight: 800,
                    fontFamily: T.fontBody, lineHeight: 1, marginBottom: 4,
                  }}>
                    <span style={{ color: T.accent, fontSize: '0.7em' }}>฿</span>{formatPrice(property.price_requested)}
                  </div>
                ) : null}
                {(property.listing_type === 'rent' || property.listing_type === 'sale_rent') && property.monthly_rent ? (
                  <div style={{
                    color: property.listing_type === 'sale_rent' ? T.textSoft : T.text,
                    fontSize: property.listing_type === 'sale_rent' ? '1.05rem' : 'clamp(1.8rem, 5vw, 2.6rem)',
                    fontWeight: property.listing_type === 'sale_rent' ? 600 : 800,
                    fontFamily: T.fontBody, lineHeight: 1,
                    marginTop: property.listing_type === 'sale_rent' ? 6 : 0,
                  }}>
                    {property.listing_type === 'sale_rent' && <span style={{ fontSize: '0.78rem', color: T.textMuted }}>ค่าเช่า </span>}
                    <span style={{ color: T.accent, fontSize: '0.7em' }}>฿</span>{formatPrice(property.monthly_rent)}
                    <span style={{ fontSize: '0.78rem', fontWeight: 400, color: T.textMuted }}> /เดือน</span>
                  </div>
                ) : null}
                {!property.price_requested && !property.monthly_rent && (
                  <div style={{ color: T.primary, fontSize: '1.4rem', fontWeight: 800, fontFamily: T.fontBody }}>
                    ติดต่อสอบถาม
                  </div>
                )}
                {property.price_requested && property.usable_area > 0 && (
                  <div style={{ color: T.textMuted, fontSize: '0.78rem', marginTop: 6, fontFamily: T.fontBody }}>
                    <i className="fas fa-ruler-combined" style={{ fontSize: '0.65rem', marginRight: 4, color: T.accent }} />
                    ฿{formatPrice(Math.round(property.price_requested / property.usable_area))} / ตร.ม.
                  </div>
                )}
              </div>

              {/* CTA Buttons */}
              <div style={{
                padding: '0 28px 24px', display: 'flex', gap: 10,
                flexWrap: 'wrap',
              }}>
                <a href={LINE_URL} target="_blank" rel="noopener noreferrer"
                  style={{
                    flex: 1, minWidth: 140, background: T.line, color: '#fff',
                    textDecoration: 'none', padding: '14px 20px',
                    fontWeight: 800, fontSize: '0.88rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    fontFamily: T.fontBody, borderRadius: 10,
                    boxShadow: '0 3px 12px rgba(6,199,85,0.25)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(6,199,85,0.35)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 3px 12px rgba(6,199,85,0.25)'; }}
                >
                  <i className="fab fa-line" style={{ fontSize: '1.2rem' }} /> LINE สอบถาม
                </a>
                <a href="tel:081-638-6966"
                  style={{
                    flex: 1, minWidth: 140, background: T.surface, color: T.primary,
                    textDecoration: 'none', padding: '14px 20px',
                    fontWeight: 700, fontSize: '0.88rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.15s', fontFamily: T.fontBody,
                    borderRadius: 10, border: `2px solid ${T.primary}`,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = T.primary; e.currentTarget.style.color = '#1a3a18'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = T.surface; e.currentTarget.style.color = T.primary; }}
                >
                  <i className="fas fa-phone-alt" style={{ fontSize: '0.9rem' }} /> 081-638-6966
                </a>
              </div>
            </div>

            {/* ===== ARCHITECTURAL SPECS GRID ===== */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              marginBottom: 32,
              border: `1px solid ${T.surfaceMid}`,
              borderRadius: T.radius, overflow: 'hidden',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            }}>
              {[
                { icon: 'fa-home', label: 'ประเภท', value: propertyTypeLabel(property.property_type) },
                { icon: 'fa-bed', label: 'ห้องนอน', value: property.bedrooms > 0 ? `${property.bedrooms} ห้อง` : null },
                { icon: 'fa-bath', label: 'ห้องน้ำ', value: property.bathrooms > 0 ? `${property.bathrooms} ห้อง` : null },
                { icon: 'fa-layer-group', label: 'ชั้น', value: property.floors > 0 ? `${property.floors} ชั้น` : null },
                { icon: 'fa-vector-square', label: 'พื้นที่ใช้สอย', value: usableAreaText },
                { icon: 'fa-mountain-sun', label: 'เนื้อที่ดิน', value: landAreaText },
                { icon: 'fa-car', label: 'จอดรถ', value: property.parking > 0 ? `${property.parking} คัน` : null },
                { icon: 'fa-calendar-alt', label: 'ปีสร้าง', value: property.year_built || null },
                { icon: 'fa-couch', label: 'เฟอร์นิเจอร์', value: { furnished: 'ครบ', semi_furnished: 'บางส่วน', unfurnished: 'ไม่มี' }[property.condition_status] },
              ].filter(s => s.value).map((s, i) => (
                <div key={i} style={{
                  padding: '20px 16px', textAlign: 'center',
                  borderRight: `1px solid ${T.surfaceMid}`,
                  borderBottom: `1px solid ${T.surfaceMid}`,
                  background: T.surface,
                  transition: 'background 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surfaceLow}
                  onMouseLeave={e => e.currentTarget.style.background = T.surface}
                >
                  <i className={`fas ${s.icon}`} style={{ color: T.accent, fontSize: '1.1rem', marginBottom: 10, display: 'block' }} />
                  <div style={{ fontSize: '0.65rem', color: T.textMuted, marginBottom: 4, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: T.fontBody }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: T.text, fontFamily: T.fontBody }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            {/* View count + ID */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, fontSize: '0.75rem', color: T.textMuted }}>
              <span>#{String(property.id).padStart(4, '0')}</span>
              {property.view_count > 0 && (
                <span><i className="fas fa-eye" style={{ marginRight: 4 }} />{property.view_count.toLocaleString()} views</span>
              )}
              {property.updated_at && (
                <span>Updated {new Date(property.updated_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              )}
            </div>

            {/* BTS / Transit */}
            {property.bts_station && (
              <div style={{
                background: `linear-gradient(135deg, ${T.primaryBg} 0%, #6aab62 100%)`, padding: '18px 24px', marginBottom: 32,
                display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                borderRadius: T.radius, boxShadow: '0 3px 12px rgba(61,122,58,0.15)',
              }}>
                <div style={{
                  width: 44, height: 44, background: 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <i className="fas fa-train" style={{ color: T.accent, fontSize: '1.2rem' }} />
                </div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <div style={{ color: 'rgba(26,58,24,0.6)', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: T.fontBody, marginBottom: 2 }}>
                    สถานีรถไฟฟ้าใกล้ที่สุด
                  </div>
                  <div style={{ color: '#1a3a18', fontSize: '1rem', fontWeight: 800, fontFamily: T.fontBody }}>
                    {property.bts_station}
                  </div>
                  {property.bts_distance_km && (
                    <div style={{ color: 'rgba(26,58,24,0.65)', fontSize: '0.78rem', marginTop: 2 }}>
                      {property.bts_distance_km} กม. · ประมาณ {Math.ceil(parseFloat(property.bts_distance_km) * 1000 / 80)} นาที (เดิน)
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===== DESCRIPTION ===== */}
            {property.description && (
              <div style={{ marginBottom: 32 }}>
                <SectionHeader>รายละเอียดทรัพย์</SectionHeader>
                <div style={{
                  background: T.surface, padding: '28px 28px',
                  borderLeft: `3px solid ${T.accent}`,
                  borderRadius: `0 ${T.radius}px ${T.radius}px 0`,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                }}>
                  <p style={{
                    color: T.textSoft, fontSize: '0.92rem', lineHeight: 1.85,
                    whiteSpace: 'pre-line', margin: 0,
                  }}>
                    {property.description}
                  </p>
                </div>
              </div>
            )}

            {/* ===== AMENITIES ===== */}
            {property.amenities?.length > 0 && (
              <div id="detail-amenities" style={{ marginBottom: 32 }}>
                <SectionHeader>สิ่งอำนวยความสะดวก</SectionHeader>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                  gap: 1, background: T.surfaceMid,
                  border: `1px solid ${T.surfaceMid}`,
                  borderRadius: T.radius, overflow: 'hidden',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                }}>
                  {property.amenities.map((a, i) => (
                    <div key={i} style={{
                      background: T.surface, padding: '20px 12px',
                      textAlign: 'center', transition: 'background 0.2s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = T.surfaceLow}
                      onMouseLeave={e => e.currentTarget.style.background = T.surface}
                    >
                      <i className={`fas ${amenityIconMap[a.amenity_name] || 'fa-check'}`}
                        style={{ color: T.primary, fontSize: '1.1rem', display: 'block', marginBottom: 8 }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: T.text }}>
                        {a.amenity_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===== NEARBY PLACES ===== */}
            {property.nearby_places?.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <SectionHeader>สถานที่ใกล้เคียง</SectionHeader>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 1, background: T.surfaceMid, border: `1px solid ${T.surfaceMid}`, borderRadius: T.radius, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                  {property.nearby_places.map((np, i) => (
                    <div key={i} style={{
                      background: T.surface, padding: '14px 18px',
                      display: 'flex', alignItems: 'center', gap: 14,
                    }}>
                      <div style={{
                        width: 36, height: 36,
                        background: T.accentBg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <i className={`fas ${nearbyIcon(np.place_type)}`} style={{ color: T.primary, fontSize: '0.85rem' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: T.text }}>{np.place_name}</div>
                        <div style={{ fontSize: '0.72rem', color: T.textMuted }}>
                          {np.distance_km} กม.{np.travel_time_min ? ` · ${np.travel_time_min} นาที` : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===== MAP ===== */}
            {(property.latitude && property.longitude) || property.province || property.district ? (
              <div id="detail-map" style={{ marginBottom: 32 }}>
                <SectionHeader>แผนที่และทำเลที่ตั้ง</SectionHeader>

                {/* GPS Distance */}
                <div style={{ marginBottom: 16 }}>
                  {locStatus === 'idle' && property.latitude && property.longitude && (
                    <button onClick={getUserLocation} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '10px 20px', border: `1.5px solid ${T.primary}`,
                      background: 'transparent', color: T.primary,
                      fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                      fontFamily: T.fontBody, borderRadius: 8,
                      transition: 'all 0.2s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = T.primary; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.primary; }}
                    >
                      <i className="fas fa-location-arrow" /> ดูระยะทางจากคุณ
                    </button>
                  )}
                  {locStatus === 'loading' && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: T.textMuted, fontSize: '0.82rem' }}>
                      <i className="fas fa-spinner fa-spin" style={{ color: T.primary }} />
                      กำลังดึงตำแหน่งของคุณ...
                    </div>
                  )}
                  {locStatus === 'denied' && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '8px 16px', background: T.accentBg,
                        border: `1px solid ${T.accent}33`, color: T.textSoft, fontSize: '0.8rem',
                      }}>
                        <i className="fas fa-exclamation-triangle" style={{ color: T.accent }} />
                        ไม่สามารถดึง GPS ได้
                      </div>
                      <button onClick={getUserLocation} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', border: `1px solid ${T.surfaceMid}`,
                        background: 'transparent', color: T.primary,
                        fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
                        fontFamily: T.fontBody,
                      }}>
                        <i className="fas fa-redo" style={{ fontSize: '0.65rem' }} /> ลองใหม่
                      </button>
                    </div>
                  )}
                  {locStatus === 'success' && distanceFromUser !== null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '10px 18px', background: `linear-gradient(135deg, ${T.primaryBg}, #8BC683)`,
                        color: '#1a3a18', fontWeight: 700, fontSize: '0.88rem',
                        fontFamily: T.fontBody,
                        borderRadius: 10, boxShadow: '0 3px 12px rgba(61,122,58,0.2)',
                      }}>
                        <i className="fas fa-location-arrow" style={{ color: T.accent }} />
                        ห่างจากคุณ {distanceFromUser < 1
                          ? `${Math.round(distanceFromUser * 1000)} เมตร`
                          : `${distanceFromUser.toFixed(1)} กม.`}
                        {distanceFromUser <= 1 && (
                          <span style={{ background: T.accent, color: T.primary, padding: '2px 8px', fontSize: '0.68rem', fontWeight: 800, marginLeft: 4 }}>
                            เดินได้
                          </span>
                        )}
                        {distanceFromUser > 1 && distanceFromUser <= 5 && (
                          <span style={{ background: T.accent, color: T.primary, padding: '2px 8px', fontSize: '0.68rem', fontWeight: 800, marginLeft: 4 }}>
                            ใกล้มาก
                          </span>
                        )}
                      </div>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${property.latitude},${property.longitude}&origin=${userLoc.lat},${userLoc.lng}&travelmode=driving`}
                        target="_blank" rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '9px 16px', border: `1px solid ${T.primary}`,
                          background: 'transparent', color: T.primary,
                          fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none',
                          fontFamily: T.fontBody,
                        }}
                      >
                        <i className="fas fa-route" /> นำทาง
                      </a>
                      <button onClick={() => { setUserLoc(null); setLocStatus('idle'); }}
                        style={{
                          background: 'none', border: 'none', color: T.textMuted,
                          cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline',
                          fontFamily: T.fontBody,
                        }}>
                        รีเซ็ต
                      </button>
                    </div>
                  )}
                  {locStatus === 'success' && distanceFromUser === null && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: T.textMuted, fontSize: '0.8rem' }}>
                      <i className="fas fa-info-circle" />
                      ทรัพย์นี้ยังไม่มีพิกัด GPS
                    </div>
                  )}
                </div>

                {/* BTS/MRT badges */}
                {(property.bts_station || property.mrt_station) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                    {property.bts_station && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: T.surfaceLow, padding: '8px 16px', fontSize: '0.8rem',
                      }}>
                        <i className="fas fa-train" style={{ color: T.primary }} />
                        <span style={{ fontWeight: 700, color: T.primary }}>BTS</span>
                        <span style={{ color: T.text }}>{property.bts_station}</span>
                        {property.bts_distance_km && (
                          <span style={{ color: T.textMuted, fontSize: '0.75rem' }}>· {property.bts_distance_km} กม.</span>
                        )}
                      </div>
                    )}
                    {property.mrt_station && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: T.surfaceLow, padding: '8px 16px', fontSize: '0.8rem',
                      }}>
                        <i className="fas fa-subway" style={{ color: '#3b5bdb' }} />
                        <span style={{ fontWeight: 700, color: '#3b5bdb' }}>MRT</span>
                        <span style={{ color: T.text }}>{property.mrt_station}</span>
                        {property.mrt_distance_km && (
                          <span style={{ color: T.textMuted, fontSize: '0.75rem' }}>· {property.mrt_distance_km} กม.</span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Map iframe */}
                {(() => {
                  const hasCoords = property.latitude && property.longitude;
                  const mapSrc = hasCoords
                    ? `https://maps.google.com/maps?q=${property.latitude},${property.longitude}&z=16&output=embed`
                    : (() => {
                      const parts = [property.address, property.district, property.province, 'ประเทศไทย'].filter(Boolean).join(' ');
                      return `https://maps.google.com/maps?q=${encodeURIComponent(parts)}&z=14&output=embed`;
                    })();
                  const mapsHref = hasCoords
                    ? `https://www.google.com/maps?q=${property.latitude},${property.longitude}`
                    : `https://www.google.com/maps/search/${encodeURIComponent([property.address, property.district, property.province, 'ประเทศไทย'].filter(Boolean).join(' '))}`;
                  return (
                    <>
                      <div style={{ overflow: 'hidden', height: 320, border: `1px solid ${T.surfaceMid}`, borderRadius: T.radius }}>
                        <iframe
                          title="map" width="100%" height="320"
                          style={{ border: 0 }} loading="lazy"
                          src={mapSrc} allowFullScreen
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ fontSize: '0.75rem', color: T.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <i className="fas fa-map-marker-alt" style={{ color: T.accent }} />
                          {hasCoords ? 'พิกัด GPS ที่แน่นอน' : 'ตำแหน่งโดยประมาณ'}
                        </div>
                        <a href={mapsHref} target="_blank" rel="noopener noreferrer"
                          style={{
                            fontSize: '0.78rem', color: T.primary, textDecoration: 'none',
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            border: `1px solid ${T.surfaceMid}`, padding: '6px 14px',
                            fontWeight: 600, fontFamily: T.fontBody,
                          }}>
                          <i className="fas fa-external-link-alt" style={{ fontSize: '0.65rem' }} /> Google Maps
                        </a>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : null}

            {/* ===== SIMILAR PROPERTIES ===== */}
            {similarProps.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
                  <div>
                    <div style={{
                      fontSize: '0.62rem', color: T.accent, textTransform: 'uppercase',
                      letterSpacing: '0.2em', fontWeight: 700, marginBottom: 4,
                      fontFamily: T.fontBody,
                    }}>
                      You May Also Like
                    </div>
                    <h3 style={{
                      margin: 0, fontSize: '1.1rem', fontWeight: 500, color: T.text,
                      fontFamily: T.fontHeading,
                    }}>
                      ทรัพย์สินที่คล้ายกัน
                    </h3>
                  </div>
                  <Link to="/search" style={{
                    fontSize: '0.78rem', color: T.primary, fontWeight: 700,
                    textDecoration: 'none', border: `1px solid ${T.surfaceMid}`,
                    padding: '6px 16px', fontFamily: T.fontBody,
                    letterSpacing: '0.03em', transition: 'background 0.2s',
                  }}>
                    ดูทั้งหมด <i className="fas fa-arrow-right" style={{ fontSize: '0.65rem', marginLeft: 4 }} />
                  </Link>
                </div>

                <style>{`.similar-carousel::-webkit-scrollbar { display: none; }`}</style>
                <div className="similar-carousel" style={{
                  display: 'flex', gap: 2, overflowX: 'auto',
                  paddingBottom: 8, scrollSnapType: 'x mandatory',
                  scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
                }}>
                  {similarProps.map(sp => (
                    <Link key={sp.id} to={`/property/${sp.id}`}
                      style={{ textDecoration: 'none', color: 'inherit', flexShrink: 0, width: 250, scrollSnapAlign: 'start' }}>
                      <div style={{
                        overflow: 'hidden', background: T.surface,
                        border: `1px solid ${T.surfaceMid}`,
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        height: '100%',
                      }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.08)'; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        <div style={{ height: 160, background: T.surfaceMid, overflow: 'hidden', position: 'relative' }}>
                          {sp.thumbnail_url ? (
                            <img
                              src={sp.thumbnail_url.startsWith('http') ? sp.thumbnail_url : `${API_BASE}/${sp.thumbnail_url.replace(/^\/+/, '')}`}
                              alt={sp.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                              loading="lazy"
                              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.06)'}
                              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                            />
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                              <i className="fas fa-home" style={{ color: T.textMuted, fontSize: '2rem' }} />
                            </div>
                          )}
                          {sp.sale_status && sp.sale_status !== 'available' && (
                            <div style={{
                              position: 'absolute', top: 0, left: 0,
                              background: sp.sale_status === 'sold' ? '#c0392b' : '#d4890a',
                              color: '#fff', fontSize: '0.62rem', fontWeight: 800,
                              padding: '4px 12px', letterSpacing: '0.08em', textTransform: 'uppercase',
                            }}>
                              {sp.sale_status === 'sold' ? 'SOLD' : 'RESERVED'}
                            </div>
                          )}
                        </div>
                        <div style={{ padding: '14px 16px 16px' }}>
                          <div style={{
                            fontSize: '0.82rem', fontWeight: 700, color: T.text,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            marginBottom: 4, fontFamily: T.fontBody,
                          }}>
                            {sp.title}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: T.textMuted, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <i className="fas fa-map-marker-alt" style={{ fontSize: '0.6rem' }} />
                            {sp.district || sp.province || '—'}
                          </div>
                          <div style={{
                            fontSize: '0.95rem', color: T.primary, fontWeight: 800,
                            fontFamily: T.fontBody,
                          }}>
                            {sp.price_requested
                              ? sp.price_requested >= 1000000
                                ? `฿${(sp.price_requested / 1000000).toFixed(1)} ล้าน`
                                : `฿${sp.price_requested.toLocaleString()}`
                              : 'ติดต่อสอบถาม'}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ===== MORTGAGE CALCULATOR ===== */}
            {property.listing_type !== 'rent' && !!property.price_requested && (
              <div id="detail-calculator" style={{ marginBottom: 32 }}>
                <SectionHeader>คำนวณสินเชื่อ</SectionHeader>
                <div style={{ background: T.surface, border: `1px solid ${T.surfaceMid}`, padding: '24px 28px', borderRadius: T.radius, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20, marginBottom: 24 }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: T.textMuted, fontWeight: 700, display: 'block', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: T.fontBody }}>
                        เงินดาวน์ ({calcDown}%)
                      </label>
                      <input type="range" min={5} max={50} step={5} value={calcDown}
                        onChange={e => setCalcDown(Number(e.target.value))}
                        style={{ width: '100%', accentColor: T.primary }} />
                      <div style={{ fontSize: '0.85rem', color: T.primary, fontWeight: 700, marginTop: 4, fontFamily: T.fontBody }}>
                        ฿{Math.round(property.price_requested * calcDown / 100).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: T.textMuted, fontWeight: 700, display: 'block', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: T.fontBody }}>
                        ดอกเบี้ย ({calcRate}% ต่อปี)
                      </label>
                      <input type="range" min={3} max={10} step={0.5} value={calcRate}
                        onChange={e => setCalcRate(Number(e.target.value))}
                        style={{ width: '100%', accentColor: T.accent }} />
                      <div style={{ fontSize: '0.85rem', color: T.accent, fontWeight: 700, marginTop: 4, fontFamily: T.fontBody }}>
                        {calcRate}% / ปี
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: T.textMuted, fontWeight: 700, display: 'block', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: T.fontBody }}>
                        ระยะเวลากู้ ({calcYears} ปี)
                      </label>
                      <input type="range" min={5} max={30} step={5} value={calcYears}
                        onChange={e => setCalcYears(Number(e.target.value))}
                        style={{ width: '100%', accentColor: T.primary }} />
                      <div style={{ fontSize: '0.85rem', color: T.textSoft, fontWeight: 700, marginTop: 4, fontFamily: T.fontBody }}>
                        {calcYears} ปี ({calcYears * 12} งวด)
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: `linear-gradient(135deg, ${T.primaryBg} 0%, #8fce86 100%)`, padding: '24px 28px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    flexWrap: 'wrap', gap: 16,
                    borderRadius: T.radius,
                  }}>
                    <div>
                      <div style={{ color: '#1a3a18', fontSize: '0.85rem', marginBottom: 8, fontWeight: 600, fontFamily: T.fontBody }}>
                        ผ่อนต่อเดือน (ประมาณ)
                      </div>
                      <div style={{ color: '#1a3a18', fontSize: 'clamp(1.8rem, 5vw, 2.4rem)', fontWeight: 800, fontFamily: T.fontBody }}>
                        ฿{calcMonthly.toLocaleString()}
                      </div>
                      <div style={{ color: 'rgba(26,58,24,0.6)', fontSize: '0.85rem', marginTop: 6, fontWeight: 500 }}>
                        วงเงินกู้ ฿{calcLoanAmount.toLocaleString()} · {calcYears * 12} งวด
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#1a3a18', fontSize: '0.85rem', marginBottom: 8, fontWeight: 600, fontFamily: T.fontBody }}>
                        ดอกเบี้ยรวม
                      </div>
                      <div style={{ color: '#1a3a18', fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', fontWeight: 800, fontFamily: T.fontBody }}>
                        ฿{(calcMonthly * calcYears * 12 - calcLoanAmount).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: T.textMuted, marginTop: 12, lineHeight: 1.5 }}>
                    * ตัวเลขเป็นเพียงการประมาณการเบื้องต้น อัตราดอกเบี้ยและเงื่อนไขจริงขึ้นอยู่กับธนาคาร
                  </p>
                </div>
              </div>
            )}

            {/* ===== VIDEO ===== */}
            {property.video_url && getYoutubeId(property.video_url) && (
              <div id="detail-video" style={{ marginBottom: 32 }}>
                <SectionHeader>วิดีโอรีวิวทรัพย์</SectionHeader>
                <div style={{
                  position: 'relative', paddingTop: '56.25%',
                  overflow: 'hidden', border: `1px solid ${T.surfaceMid}`,
                  borderRadius: T.radius,
                }}>
                  <iframe
                    title="property video"
                    src={`https://www.youtube.com/embed/${getYoutubeId(property.video_url)}?rel=0&modestbranding=1`}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <a href={property.video_url} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    marginTop: 12, fontSize: '0.78rem', color: '#FF0000',
                    fontWeight: 600, textDecoration: 'none',
                  }}>
                  <i className="fab fa-youtube" /> เปิดใน YouTube
                </a>
              </div>
            )}

            {/* ===== 3D VIRTUAL TOUR (Matterport) ===== */}
            {property.virtual_tour_id && (
              <div id="detail-3dtour" style={{ marginBottom: 32 }}>
                <SectionHeader>เข้าชมบ้าน 3D Tour 360°</SectionHeader>
                <div style={{
                  position: 'relative', paddingTop: '56.25%',
                  overflow: 'hidden', border: `1px solid ${T.surfaceMid}`,
                  borderRadius: T.radius, background: '#000',
                }}>
                  <iframe
                    title="Matterport 3D Tour"
                    src={`https://my.matterport.com/show/?m=${property.virtual_tour_id}&play=1&qs=1`}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                    allow="fullscreen; xr-spatial-tracking"
                    allowFullScreen
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                  <span style={{ fontSize: '0.78rem', color: T.outline, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="fas fa-cube" style={{ color: '#E44D7B' }} />
                    ใช้เมาส์ลากเพื่อหมุนดู หรือกดจุดต่างๆ เพื่อเดินสำรวจบ้าน
                  </span>
                  <a href={`https://my.matterport.com/show/?m=${property.virtual_tour_id}`} target="_blank" rel="noopener noreferrer"
                    style={{
                      fontSize: '0.78rem', color: '#E44D7B', fontWeight: 600,
                      textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                    <i className="fas fa-expand" /> เปิดเต็มจอ
                  </a>
                </div>
              </div>
            )}

            {/* ===== HASHTAGS ===== */}
            {(() => {
              const tags = [
                property.property_type && `ประกาศ${property.listing_type === 'rent' ? 'เช่า' : 'ขาย'}${['house', 'townhouse', 'townhome'].includes(property.property_type) ? 'บ้าน' : property.property_type === 'condo' ? 'คอนโด' : 'ที่ดิน'}`,
                property.province && `อสังหา${property.province}`,
                property.district && `ทรัพย์${property.district}`,
                property.bts_station && `ใกล้BTS${property.bts_station.replace(/\s/g, '')}`,
                `บ้านDมีเชง`,
                `ราคาดี`,
              ].filter(Boolean);
              return (
                <div style={{ marginBottom: 80, marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {tags.map((t, i) => (
                    <span key={i} style={{
                      fontSize: '0.72rem', color: T.primary,
                      background: 'rgba(61,122,58,0.06)', border: `1px solid rgba(61,122,58,0.12)`,
                      padding: '5px 14px', cursor: 'default',
                      borderRadius: 20, fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(61,122,58,0.12)'; e.currentTarget.style.borderColor = 'rgba(61,122,58,0.25)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(61,122,58,0.06)'; e.currentTarget.style.borderColor = 'rgba(61,122,58,0.12)'; }}
                    >#{t}</span>
                  ))}
                </div>
              );
            })()}

          </div>

          {/* ===== RIGHT COLUMN — STICKY SIDEBAR ===== */}
          <aside style={{ position: 'sticky', top: 110 }} className="detail-aside">

            {/* Contact Card — Light Premium */}
            <div style={{
              background: T.surface, overflow: 'hidden', marginBottom: 20,
              borderRadius: T.radius, boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
              border: `1px solid ${T.surfaceMid}`,
            }}>
              {/* Gold accent line */}
              <div style={{ height: 3, background: `linear-gradient(90deg, ${T.accent}, ${T.primary})` }} />

              {/* Header */}
              <div style={{ padding: '22px 24px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: `linear-gradient(135deg, rgba(61,122,58,0.08), rgba(201,168,76,0.08))`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="fas fa-concierge-bell" style={{ color: T.accent, fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: T.text, fontFamily: T.fontHeading }}>
                      สนใจทรัพย์นี้?
                    </div>
                    <div style={{ fontSize: '0.72rem', color: T.textMuted }}>
                      ทีมงานพร้อมให้บริการ 7 วัน
                    </div>
                  </div>
                </div>
              </div>

              {/* Inquiry Form — Light */}
              <form onSubmit={handleInquiry} style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: T.text, marginBottom: 5, letterSpacing: '0.02em' }}>
                    ชื่อ-นามสกุล <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input type="text" placeholder="กรอกชื่อของคุณ"
                    value={inquiryForm.name}
                    onChange={e => setInquiryForm(f => ({ ...f, name: e.target.value }))}
                    required style={lightInputStyle}
                    onFocus={e => { e.target.style.borderColor = T.primary; e.target.style.boxShadow = `0 0 0 3px rgba(61,122,58,0.08)`; }}
                    onBlur={e => { e.target.style.borderColor = '#e5e5e5'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: T.text, marginBottom: 5, letterSpacing: '0.02em' }}>
                    เบอร์โทรศัพท์ <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input type="tel" placeholder="0XX-XXX-XXXX"
                    value={inquiryForm.phone}
                    onChange={e => setInquiryForm(f => ({ ...f, phone: e.target.value }))}
                    required style={lightInputStyle} maxLength={10}
                    onFocus={e => { e.target.style.borderColor = T.primary; e.target.style.boxShadow = `0 0 0 3px rgba(61,122,58,0.08)`; }}
                    onBlur={e => { e.target.style.borderColor = '#e5e5e5'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: T.text, marginBottom: 5, letterSpacing: '0.02em' }}>
                    ข้อความ <span style={{ color: T.textMuted, fontWeight: 400 }}>(เพิ่มเติม)</span>
                  </label>
                  <textarea placeholder="เช่น สนใจเข้าชม, ต้องการข้อมูลเพิ่ม..."
                    value={inquiryForm.message}
                    onChange={e => setInquiryForm(f => ({ ...f, message: e.target.value }))}
                    rows={3} style={{ ...lightInputStyle, resize: 'vertical' }}
                    onFocus={e => { e.target.style.borderColor = T.primary; e.target.style.boxShadow = `0 0 0 3px rgba(61,122,58,0.08)`; }}
                    onBlur={e => { e.target.style.borderColor = '#e5e5e5'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>

                {inquiryStatus === 'success' && (
                  <div style={{ background: 'rgba(61,122,58,0.06)', color: T.primary, padding: '10px 14px', fontSize: '0.82rem', fontWeight: 600, borderRadius: 8, border: `1px solid rgba(61,122,58,0.15)` }}>
                    <i className="fas fa-check-circle" /> {inquiryMsg}
                  </div>
                )}
                {inquiryStatus === 'error' && (
                  <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', fontSize: '0.82rem', borderRadius: 8, border: '1px solid #fecdd3' }}>
                    <i className="fas fa-exclamation-circle" /> {inquiryMsg}
                  </div>
                )}

                <button type="submit"
                  disabled={inquiryStatus === 'sending' || property.sale_status === 'sold'}
                  style={{
                    background: property.sale_status === 'sold' ? '#e5e5e5' : `linear-gradient(135deg, ${T.primaryBg}, #8BC683)`,
                    color: property.sale_status === 'sold' ? '#aaa' : '#1a3a18',
                    border: 'none', padding: '14px',
                    borderRadius: 10,
                    fontWeight: 800, fontSize: '0.9rem',
                    cursor: property.sale_status === 'sold' ? 'not-allowed' : 'pointer',
                    fontFamily: T.fontBody,
                    letterSpacing: '0.03em',
                    transition: 'all 0.2s',
                    boxShadow: property.sale_status === 'sold' ? 'none' : '0 3px 12px rgba(61,122,58,0.2)',
                  }}
                  onMouseEnter={e => { if (property.sale_status !== 'sold') { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(61,122,58,0.3)'; } }}
                  onMouseLeave={e => { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 3px 12px rgba(61,122,58,0.2)'; }}>
                  {inquiryStatus === 'sending' ? (
                    <><i className="fas fa-spinner fa-spin" /> กำลังส่ง...</>
                  ) : property.sale_status === 'sold' ? (
                    property.listing_type === 'rent' ? 'ทรัพย์ติดเช่าแล้ว' : 'ทรัพย์ขายแล้ว'
                  ) : (
                    <><i className="fas fa-paper-plane" /> ส่งข้อความ</>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div style={{ margin: '0 24px', height: 1, background: `linear-gradient(90deg, transparent, ${T.surfaceMid}, transparent)` }} />

              {/* Contact Options */}
              <div style={{ padding: '16px 24px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ textAlign: 'center', color: T.textMuted, fontSize: '0.72rem', letterSpacing: '0.08em', fontWeight: 600 }}>
                  หรือติดต่อผ่าน
                </div>
                <a href={LINE_URL} target="_blank" rel="noopener noreferrer"
                  style={{
                    background: T.line, color: '#fff',
                    textDecoration: 'none', padding: '13px',
                    borderRadius: 10,
                    fontWeight: 800, textAlign: 'center', fontSize: '0.9rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontFamily: T.fontBody,
                    transition: 'all 0.15s',
                    boxShadow: '0 3px 10px rgba(6,199,85,0.2)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(6,199,85,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(6,199,85,0.2)'; }}>
                  <i className="fab fa-line" style={{ fontSize: '1.2rem' }} /> LINE @LoanDD
                </a>

                {/* Contact icons */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, paddingTop: 6 }}>
                  {[
                    { icon: 'fa-phone', bg: T.primary, href: 'tel:081-638-6966', tip: 'โทร' },
                    { icon: 'fab fa-line', bg: T.line, href: LINE_URL, tip: 'LINE' },
                    { icon: 'fab fa-facebook', bg: '#1877F2', href: FB_URL, tip: 'Facebook' },
                  ].map((c, i) => (
                    <a key={i} href={c.href} target="_blank" rel="noopener noreferrer"
                      title={c.tip}
                      style={{
                        width: 42, height: 42, borderRadius: 10,
                        background: c.bg, color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1rem', textDecoration: 'none',
                        transition: 'all 0.15s',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.15)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
                    >
                      <i className={c.icon.startsWith('fab') ? c.icon : `fas ${c.icon}`} />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Property Quick Info */}
            <div style={{
              background: T.surface, border: `1px solid ${T.surfaceMid}`,
              padding: '20px 22px', fontSize: '0.83rem',
              borderRadius: T.radius, boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            }}>
              <div style={{
                fontWeight: 700, color: T.text, marginBottom: 14, fontSize: '0.78rem',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                fontFamily: T.fontBody,
              }}>
                ข้อมูลสรุป
              </div>
              {[
                { label: 'รหัสทรัพย์', value: `#${String(property.id).padStart(4, '0')}` },
                { label: 'ประเภท', value: propertyTypeLabel(property.property_type) },
                { label: 'ประเภทประกาศ', value: { sale: 'ขาย', rent: 'ให้เช่า', sale_rent: 'ขาย / ให้เช่า' }[property.listing_type] },
                { label: 'จังหวัด', value: property.province },
                { label: 'เขต/อำเภอ', value: property.district },
                { label: 'แขวง/ตำบล', value: property.sub_district },
                { label: 'โครงการ', value: property.project_name },
                { label: 'อัพเดท', value: property.updated_at ? new Date(property.updated_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—' },
              ].filter(r => r.value).map((r, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '8px 0',
                  borderBottom: `1px solid ${T.surfaceLow}`,
                }}>
                  <span style={{ color: T.textMuted, fontSize: '0.8rem' }}>{r.label}</span>
                  <strong style={{ color: T.text, textAlign: 'right', maxWidth: '55%', fontSize: '0.8rem' }}>{r.value}</strong>
                </div>
              ))}
            </div>

          </aside>
        </div>
      </div>

      {/* ===== Sticky Bottom Bar — Premium White Glass ===== */}
      {property.sale_status !== 'sold' && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 900,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          color: T.text, padding: '10px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          fontFamily: T.fontBody,
          boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: T.textSoft }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(61,122,58,0.08)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <i className="fas fa-eye" style={{ color: T.primary, fontSize: '0.7rem' }} />
            </div>
            <span>
              <strong style={{ color: T.primary, fontSize: '0.95rem' }}>{viewerCount}</strong> คนดูอยู่
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="tel:081-638-6966"
              style={{
                background: T.surface, color: T.primary,
                padding: '9px 16px', fontSize: '0.78rem', fontWeight: 700,
                textDecoration: 'none', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 5,
                fontFamily: T.fontBody,
                borderRadius: 8, border: `1.5px solid ${T.primary}`,
              }}>
              <i className="fas fa-phone-alt" style={{ fontSize: '0.7rem' }} /> โทร
            </a>
            <a href={LINE_URL} target="_blank" rel="noopener noreferrer"
              style={{
                background: T.line, color: '#fff',
                padding: '9px 18px', fontSize: '0.78rem', fontWeight: 800,
                textDecoration: 'none', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: T.fontBody,
                borderRadius: 8, boxShadow: '0 3px 10px rgba(6,199,85,0.25)',
              }}>
              <i className="fab fa-line" style={{ fontSize: '1rem' }} /> LINE
            </a>
          </div>
        </div>
      )}

      {/* ===== RESPONSIVE CSS ===== */}
      <style>{`
        @media (max-width: 768px) {
          .detail-grid {
            grid-template-columns: 1fr !important;
          }
          .detail-aside {
            position: static !important;
            order: 1;
          }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.25); }
        }
        .detail-page-wrapper {
          padding-bottom: 56px;
        }
      `}</style>
    </div>
  );
}

// ===== Editorial Section Header =====
function SectionHeader({ children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        width: 28, height: 2, background: T.accent, marginBottom: 10,
      }} />
      <h2 style={{
        fontSize: '1.05rem', fontWeight: 500, color: T.text,
        margin: 0, fontFamily: T.fontHeading,
        letterSpacing: '-0.01em', lineHeight: 1.3,
      }}>
        {children}
      </h2>
    </div>
  );
}

function nearbyIcon(type) {
  return {
    bts: 'fa-train',
    mrt: 'fa-subway',
    school: 'fa-school',
    hospital: 'fa-hospital',
    mall: 'fa-shopping-cart',
    restaurant: 'fa-utensils',
    airport: 'fa-plane',
  }[type] || 'fa-map-pin';
}

function arrowBtn(side) {
  return {
    position: 'fixed',
    [side]: 20, top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#fff', fontSize: '1.2rem',
    width: 48, height: 48,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', zIndex: 10000,
    transition: 'background 0.2s',
  };
}

const darkInputStyle = {
  width: '100%', padding: '13px 16px',
  border: '1.5px solid rgba(255,255,255,0.25)',
  borderRadius: 8,
  background: 'rgba(255,255,255,0.12)',
  fontSize: '0.88rem', outline: 'none',
  boxSizing: 'border-box',
  fontFamily: T.fontBody,
  transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
  color: '#fff',
  backdropFilter: 'blur(4px)',
};

const lightInputStyle = {
  width: '100%', padding: '13px 16px',
  border: '1.5px solid #e5e5e5',
  borderRadius: 10,
  background: '#fafafa',
  fontSize: '0.88rem', outline: 'none',
  boxSizing: 'border-box',
  fontFamily: T.fontBody,
  transition: 'border-color 0.2s, box-shadow 0.2s',
  color: '#1a1a18',
};

export default PropertyDetail;
