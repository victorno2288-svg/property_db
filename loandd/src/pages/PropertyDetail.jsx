import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import Navbar from '../Navbar';
import { formatPrice, propertyTypeLabel } from '../utils/propertyUtils';

const API_BASE = 'http://localhost:3001';
const LINE_URL = 'https://line.me/R/ti/p/@loan_dd';
const FB_URL   = 'https://www.facebook.com/share/1HWR1pe2XM/?mibextid=wwXIfr';

// ===== Badge สถานะการขาย =====
// listing_type-aware: ถ้าเป็นให้เช่า จะแสดง "ติดเช่า" แทน "ขายแล้ว" และ "พร้อมเช่า" แทน "พร้อมขาย"
const getStatusConfig = (sale_status, listing_type) => {
  const isRent = listing_type === 'rent';
  const map = {
    available: { label: isRent ? 'พร้อมเช่า' : 'พร้อมขาย', bg: 'rgba(0,50,42,0.08)', color: '#1A8C6E' },
    reserved:  { label: 'จองแล้ว',                          bg: 'rgba(212,137,10,0.1)', color: '#d4890a' },
    sold:      { label: isRent ? 'ติดเช่า' : 'ขายแล้ว',     bg: isRent ? 'rgba(99,102,241,0.1)' : 'rgba(192,57,43,0.1)', color: isRent ? '#6366f1' : '#c0392b' },
  };
  return map[sale_status] || map.available;
};

// ===== Amenity icon map =====
const amenityIconMap = {
  'แอร์':          'fa-snowflake',
  'เฟอร์นิเจอร์': 'fa-couch',
  'สระว่ายน้ำ':   'fa-swimming-pool',
  'สวน':           'fa-leaf',
  'ที่จอดรถ':      'fa-car',
  'ลิฟท์':         'fa-arrow-up',
  'ฟิตเนส':        'fa-dumbbell',
  'รปภ.':          'fa-shield-alt',
  'กล้องวงจรปิด':  'fa-video',
};

// ===== Design tokens =====
const T = {
  bg: '#faf9f6',
  surface: '#fff',
  surfaceLow: '#f5f4f1',
  surfaceMid: '#efeee9',
  primary: '#1A8C6E',
  primaryLight: '#147A5E',
  text: '#1a1a18',
  textSoft: '#6a6560',
  textMuted: '#a8a39d',
  accent: '#c9a84c',      // gold
  accentBg: 'rgba(201,168,76,0.08)',
  line: '#06C755',
  radius: 0,               // architectural sharp corners
  cardRadius: 4,
};

function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [property, setProperty]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [notFound, setNotFound]     = useState(false);
  const [activeImg, setActiveImg]   = useState(0);
  const [inquiryForm, setInquiryForm] = useState({ name: '', phone: '', message: '' });
  const [inquiryStatus, setInquiryStatus] = useState('idle');
  const [inquiryMsg, setInquiryMsg] = useState('');
  const [lightbox, setLightbox]     = useState(null);

  const [isSaved, setIsSaved] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [similarProps, setSimilarProps] = useState([]);
  const [qCopied, setQCopied] = useState(false);

  const [calcDown,  setCalcDown]  = useState(20);
  const [calcRate,  setCalcRate]  = useState(6.5);
  const [calcYears, setCalcYears] = useState(30);

  const [userLoc,    setUserLoc]    = useState(null);
  const [locStatus,  setLocStatus]  = useState('idle');

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
      } catch {}
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
        }).catch(() => {});
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
    } catch {}
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
    } catch {}
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
          } catch {}
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

  useEffect(() => {
    const onFocus = () => fetchProperty();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [id]);

  // Auto-refresh ทุก 30 วินาที (real-time update)
  useEffect(() => {
    const id = setInterval(fetchProperty, 30000);
    return () => clearInterval(id);
  }, [id]);

  useEffect(() => {
    if (!property) return;
    if (!navigator.geolocation) return;
    setLocStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocStatus('success');
      },
      () => setLocStatus('denied'),
      { timeout: 8000, maximumAge: 300000, enableHighAccuracy: false }
    );
  }, [property?.id]);

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
      .catch(() => {});
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
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif" }}>
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
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif" }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '100px 16px' }}>
          <div style={{ fontSize: '3rem', color: T.surfaceMid, marginBottom: 20 }}>
            <i className="fas fa-home" />
          </div>
          <h2 style={{ color: T.text, fontFamily: "'Noto Serif Thai', 'Noto Serif', Georgia, serif", fontWeight: 500, fontSize: '1.3rem', marginBottom: 8 }}>
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
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
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
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: false }
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
    { id: 'detail-info',       label: 'ข้อมูลทรัพย์',   show: true },
    { id: 'detail-amenities',  label: 'สิ่งอำนวยฯ',      show: !!(property.amenities?.length > 0) },
    { id: 'detail-map',        label: 'ที่ตั้ง',          show: !!(property.province || property.district || property.latitude) },
    { id: 'detail-calculator', label: 'คำนวณสินเชื่อ',  show: property.listing_type !== 'rent' && !!property.price_requested },
    { id: 'detail-video',      label: 'วิดีโอ',           show: !!property.video_url },
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
    if (Number(property.land_area_rai)  > 0) p.push(`${property.land_area_rai} ไร่`);
    if (Number(property.land_area_ngan) > 0) p.push(`${property.land_area_ngan} งาน`);
    if (Number(property.land_area_wah)  > 0) p.push(`${property.land_area_wah} ตร.ว.`);
    return p.length > 0 ? p.join(' ') : null;
  })();
  const areaText = usableAreaText || landAreaText || '—';

  const locationText = [property.sub_district, property.district, property.province].filter(Boolean).join(', ');

  return (
    <div className="detail-page-wrapper" style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif" }}>
      <Navbar />

      {/* ===== LIGHTBOX ===== */}
      {lightbox !== null && (
        <div
          onClick={() => setLightbox(null)}
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
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }}
            onClick={e => e.stopPropagation()}
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
            fontFamily: "'Manrope', sans-serif",
          }}>
            {lightbox + 1} / {allImages.length}
          </div>
        </div>
      )}

      {/* ===== STICKY TAB NAV ===== */}
      {detailTabs.length > 1 && (
        <div style={{
          position: 'sticky', top: 56, zIndex: 200,
          background: 'rgba(250,249,246,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${T.surfaceMid}`,
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
                  fontFamily: "'Manrope', sans-serif",
                  textTransform: 'uppercase',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== HERO IMAGE GALLERY ===== */}
      <div id="detail-info" style={{ position: 'relative', background: '#0d1510' }}>
        {/* Main Image */}
        <div
          onClick={() => allImages.length > 0 && setLightbox(activeImg)}
          style={{
            position: 'relative', paddingTop: 'min(60%, 600px)',
            cursor: allImages.length > 0 ? 'zoom-in' : 'default',
            overflow: 'hidden',
          }}
        >
          {allImages[activeImg] ? (
            <img
              src={getImgSrc(allImages[activeImg])}
              alt={property.title}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.15)', fontSize: '5rem',
            }}>
              <i className="fas fa-home" />
            </div>
          )}

          {/* Gradient overlay at bottom */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
            pointerEvents: 'none',
          }} />

          {/* Title overlay on image */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '40px 32px 20px', maxWidth: 1100, margin: '0 auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              {/* Status badge */}
              <span style={{
                background: sStatus.bg, color: sStatus.color,
                padding: '4px 14px', fontSize: '0.72rem', fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                backdropFilter: 'blur(8px)',
              }}>
                {sStatus.label}
              </span>
              {/* Listing type */}
              <span style={{
                background: 'rgba(255,255,255,0.12)', color: '#fff',
                padding: '4px 14px', fontSize: '0.72rem', fontWeight: 600,
                letterSpacing: '0.06em',
                backdropFilter: 'blur(8px)',
              }}>
                {propertyTypeLabel(property.property_type)} {listingLabel[property.listing_type] ? `· ${listingLabel[property.listing_type]}` : ''}
              </span>
            </div>
            <h1 style={{
              color: '#fff', fontSize: 'clamp(1.3rem, 3.5vw, 2rem)',
              fontWeight: 400, margin: 0, lineHeight: 1.25,
              fontFamily: "'Noto Serif Thai', 'Noto Serif', Georgia, serif",
              textShadow: '0 2px 12px rgba(0,0,0,0.3)',
              letterSpacing: '-0.01em',
            }}>
              {property.title}
            </h1>
            {locationText && (
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.88rem', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="fas fa-map-marker-alt" style={{ fontSize: '0.75rem' }} />
                {locationText}
              </div>
            )}
          </div>

          {/* Photo count */}
          {allImages.length > 1 && (
            <div style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(0,0,0,0.5)', color: '#fff',
              padding: '6px 14px', fontSize: '0.78rem', fontWeight: 600,
              backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <i className="fas fa-camera" style={{ fontSize: '0.7rem' }} />
              {allImages.length}
            </div>
          )}

          {/* Status overlay for sold/reserved/rented */}
          {property.sale_status && property.sale_status !== 'available' && (
            <div style={{
              position: 'absolute', top: 16, left: 16,
              background: property.sale_status === 'sold'
                ? (property.listing_type === 'rent' ? '#6366f1' : '#c0392b')
                : '#d4890a',
              color: '#fff', padding: '6px 18px',
              fontWeight: 800, fontSize: '0.82rem',
              letterSpacing: '0.05em',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <i className={`fas ${property.sale_status === 'sold' ? (property.listing_type === 'rent' ? 'fa-check-circle' : 'fa-times-circle') : 'fa-bookmark'}`} style={{ fontSize: '0.72rem' }} />
              {property.sale_status === 'sold'
                ? (property.listing_type === 'rent' ? 'ติดเช่า' : 'ขายแล้ว')
                : 'จองแล้ว'}
            </div>
          )}
        </div>

        {/* Thumbnails strip */}
        {allImages.length > 1 && (
          <div style={{
            display: 'flex', gap: 2, padding: '4px 0',
            overflowX: 'auto', background: '#0d1510',
            maxWidth: 1100, margin: '0 auto',
          }}>
            <style>{`.thumb-strip::-webkit-scrollbar { display: none; }`}</style>
            <div className="thumb-strip" style={{ display: 'flex', gap: 2, overflowX: 'auto', scrollbarWidth: 'none', padding: '0 4px' }}>
              {allImages.map((img, i) => (
                <div
                  key={i}
                  onClick={() => setActiveImg(i)}
                  style={{
                    flexShrink: 0, width: 72, height: 52,
                    overflow: 'hidden', cursor: 'pointer',
                    opacity: i === activeImg ? 1 : 0.5,
                    transition: 'opacity 0.2s',
                    borderBottom: i === activeImg ? `2px solid ${T.accent}` : '2px solid transparent',
                  }}
                >
                  <img src={getImgSrc(img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
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
              fontFamily: "'Manrope', sans-serif", transition: 'all 0.2s',
              letterSpacing: '0.02em',
            });
            const shareData = { title: property.title, text: `ดูทรัพย์นี้บน บ้าน D มีเชง: ${property.title}`, url: window.location.href };
            return (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                {navigator.share ? (
                  <button onClick={() => navigator.share(shareData).catch(() => {})} style={abtn(false)}>
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

            {/* ===== PRICE BLOCK — Editorial ===== */}
            <div style={{
              background: T.primary, padding: '28px 32px', marginBottom: 32,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexWrap: 'wrap', gap: 16,
            }}>
              <div>
                <div style={{
                  color: T.accent, fontSize: '0.68rem', marginBottom: 6,
                  textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700,
                  fontFamily: "'Manrope', sans-serif",
                }}>
                  {listingLabel[property.listing_type] || 'ราคา'}
                </div>
                {/* ราคาขาย (แสดงเมื่อ listing_type เป็น sale หรือ sale_rent) */}
                {property.listing_type !== 'rent' && property.price_requested ? (
                  <div style={{
                    color: '#fff', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800,
                    fontFamily: "'Manrope', sans-serif", lineHeight: 1,
                  }}>
                    ฿{formatPrice(property.price_requested)}
                  </div>
                ) : null}
                {/* ราคาเช่า (แสดงเมื่อ listing_type เป็น rent หรือ sale_rent) */}
                {(property.listing_type === 'rent' || property.listing_type === 'sale_rent') && property.monthly_rent ? (
                  <div style={{
                    color: property.listing_type === 'sale_rent' ? 'rgba(255,255,255,0.7)' : '#fff',
                    fontSize: property.listing_type === 'sale_rent' ? '1rem' : 'clamp(1.6rem, 4vw, 2.4rem)',
                    fontWeight: property.listing_type === 'sale_rent' ? 600 : 800,
                    fontFamily: "'Manrope', sans-serif", lineHeight: 1,
                    marginTop: property.listing_type === 'sale_rent' ? 8 : 0,
                  }}>
                    {property.listing_type === 'sale_rent' && <span style={{ fontSize: '0.72rem', opacity: 0.6 }}>เช่า </span>}
                    ฿{formatPrice(property.monthly_rent)}
                    <span style={{ fontSize: '0.85rem', fontWeight: 400, opacity: 0.6 }}> /เดือน</span>
                  </div>
                ) : null}
                {/* ราคา fallback ถ้าไม่มีทั้ง price_requested และ monthly_rent */}
                {!property.price_requested && !property.monthly_rent && (
                  <div style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 800, fontFamily: "'Manrope', sans-serif" }}>
                    ติดต่อสอบถาม
                  </div>
                )}
                {property.price_requested && property.usable_area > 0 && (
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', marginTop: 6, fontFamily: "'Manrope', sans-serif" }}>
                    ฿{formatPrice(Math.round(property.price_requested / property.usable_area))} / ตร.ม.
                  </div>
                )}
              </div>
              <a
                href={LINE_URL} target="_blank" rel="noopener noreferrer"
                style={{
                  background: T.line, color: '#fff',
                  textDecoration: 'none', padding: '14px 28px',
                  fontWeight: 800, fontSize: '0.88rem',
                  display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'transform 0.15s',
                  fontFamily: "'Manrope', sans-serif",
                  letterSpacing: '0.02em',
                }}
              >
                <i className="fab fa-line" style={{ fontSize: '1.1rem' }} /> สอบถาม LINE
              </a>
            </div>

            {/* ===== ARCHITECTURAL SPECS GRID ===== */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              marginBottom: 32,
              border: `1px solid ${T.surfaceMid}`,
            }}>
              {[
                { icon: 'fa-home',          label: 'ประเภท',       value: propertyTypeLabel(property.property_type) },
                { icon: 'fa-bed',           label: 'ห้องนอน',      value: property.bedrooms > 0 ? `${property.bedrooms} ห้อง` : null },
                { icon: 'fa-bath',          label: 'ห้องน้ำ',      value: property.bathrooms > 0 ? `${property.bathrooms} ห้อง` : null },
                { icon: 'fa-layer-group',   label: 'ชั้น',          value: property.floors > 0 ? `${property.floors} ชั้น` : null },
                { icon: 'fa-vector-square', label: 'พื้นที่ใช้สอย',value: usableAreaText },
                { icon: 'fa-mountain-sun',  label: 'เนื้อที่ดิน',  value: landAreaText },
                { icon: 'fa-car',           label: 'จอดรถ',        value: property.parking > 0 ? `${property.parking} คัน` : null },
                { icon: 'fa-calendar-alt',  label: 'ปีสร้าง',      value: property.year_built || null },
                { icon: 'fa-couch',         label: 'เฟอร์นิเจอร์',value: { furnished: 'ครบ', semi_furnished: 'บางส่วน', unfurnished: 'ไม่มี' }[property.condition_status] },
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
                  <div style={{ fontSize: '0.65rem', color: T.textMuted, marginBottom: 4, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Manrope', sans-serif" }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: T.text, fontFamily: "'Manrope', sans-serif" }}>
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
                background: T.primary, padding: '18px 24px', marginBottom: 32,
                display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
              }}>
                <div style={{
                  width: 44, height: 44, background: 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <i className="fas fa-train" style={{ color: T.accent, fontSize: '1.2rem' }} />
                </div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Manrope', sans-serif", marginBottom: 2 }}>
                    สถานีรถไฟฟ้าใกล้ที่สุด
                  </div>
                  <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 800, fontFamily: "'Manrope', sans-serif" }}>
                    {property.bts_station}
                  </div>
                  {property.bts_distance_km && (
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', marginTop: 2 }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 1, background: T.surfaceMid, border: `1px solid ${T.surfaceMid}` }}>
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
                        fontFamily: "'Manrope', sans-serif",
                      }}>
                        <i className="fas fa-redo" style={{ fontSize: '0.65rem' }} /> ลองใหม่
                      </button>
                    </div>
                  )}
                  {locStatus === 'success' && distanceFromUser !== null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '10px 18px', background: T.primary,
                        color: '#fff', fontWeight: 700, fontSize: '0.88rem',
                        fontFamily: "'Manrope', sans-serif",
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
                          fontFamily: "'Manrope', sans-serif",
                        }}
                      >
                        <i className="fas fa-route" /> นำทาง
                      </a>
                      <button onClick={() => { setUserLoc(null); setLocStatus('idle'); }}
                        style={{
                          background: 'none', border: 'none', color: T.textMuted,
                          cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline',
                          fontFamily: "'Sarabun', sans-serif",
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
                      <div style={{ overflow: 'hidden', height: 320, border: `1px solid ${T.surfaceMid}` }}>
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
                            fontWeight: 600, fontFamily: "'Manrope', sans-serif",
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
                      fontFamily: "'Manrope', sans-serif",
                    }}>
                      You May Also Like
                    </div>
                    <h3 style={{
                      margin: 0, fontSize: '1.1rem', fontWeight: 500, color: T.text,
                      fontFamily: "'Noto Serif Thai', 'Noto Serif', Georgia, serif",
                    }}>
                      ทรัพย์สินที่คล้ายกัน
                    </h3>
                  </div>
                  <Link to="/search" style={{
                    fontSize: '0.78rem', color: T.primary, fontWeight: 700,
                    textDecoration: 'none', border: `1px solid ${T.surfaceMid}`,
                    padding: '6px 16px', fontFamily: "'Manrope', sans-serif",
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
                            marginBottom: 4, fontFamily: "'Manrope', sans-serif",
                          }}>
                            {sp.title}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: T.textMuted, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <i className="fas fa-map-marker-alt" style={{ fontSize: '0.6rem' }} />
                            {sp.district || sp.province || '—'}
                          </div>
                          <div style={{
                            fontSize: '0.95rem', color: T.primary, fontWeight: 800,
                            fontFamily: "'Manrope', sans-serif",
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
                <div style={{ background: T.surface, border: `1px solid ${T.surfaceMid}`, padding: '24px 28px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20, marginBottom: 24 }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: T.textMuted, fontWeight: 700, display: 'block', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: "'Manrope', sans-serif" }}>
                        เงินดาวน์ ({calcDown}%)
                      </label>
                      <input type="range" min={5} max={50} step={5} value={calcDown}
                        onChange={e => setCalcDown(Number(e.target.value))}
                        style={{ width: '100%', accentColor: T.primary }} />
                      <div style={{ fontSize: '0.85rem', color: T.primary, fontWeight: 700, marginTop: 4, fontFamily: "'Manrope', sans-serif" }}>
                        ฿{Math.round(property.price_requested * calcDown / 100).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: T.textMuted, fontWeight: 700, display: 'block', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: "'Manrope', sans-serif" }}>
                        ดอกเบี้ย ({calcRate}% ต่อปี)
                      </label>
                      <input type="range" min={3} max={10} step={0.5} value={calcRate}
                        onChange={e => setCalcRate(Number(e.target.value))}
                        style={{ width: '100%', accentColor: T.accent }} />
                      <div style={{ fontSize: '0.85rem', color: T.accent, fontWeight: 700, marginTop: 4, fontFamily: "'Manrope', sans-serif" }}>
                        {calcRate}% / ปี
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: T.textMuted, fontWeight: 700, display: 'block', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: "'Manrope', sans-serif" }}>
                        ระยะเวลากู้ ({calcYears} ปี)
                      </label>
                      <input type="range" min={5} max={30} step={5} value={calcYears}
                        onChange={e => setCalcYears(Number(e.target.value))}
                        style={{ width: '100%', accentColor: T.primary }} />
                      <div style={{ fontSize: '0.85rem', color: T.textSoft, fontWeight: 700, marginTop: 4, fontFamily: "'Manrope', sans-serif" }}>
                        {calcYears} ปี ({calcYears * 12} งวด)
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: T.primary, padding: '24px 28px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    flexWrap: 'wrap', gap: 16,
                  }}>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Manrope', sans-serif" }}>
                        ผ่อนต่อเดือน (ประมาณ)
                      </div>
                      <div style={{ color: '#fff', fontSize: 'clamp(1.4rem, 4vw, 1.9rem)', fontWeight: 800, fontFamily: "'Manrope', sans-serif" }}>
                        ฿{calcMonthly.toLocaleString()}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', marginTop: 4 }}>
                        วงเงินกู้ ฿{calcLoanAmount.toLocaleString()} · {calcYears * 12} งวด
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Manrope', sans-serif" }}>
                        ดอกเบี้ยรวม
                      </div>
                      <div style={{ color: T.accent, fontSize: '1.1rem', fontWeight: 800, fontFamily: "'Manrope', sans-serif" }}>
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

            {/* ===== HASHTAGS ===== */}
            {(() => {
              const tags = [
                property.property_type && `ประกาศ${property.listing_type === 'rent' ? 'เช่า' : 'ขาย'}${['house','townhouse','townhome'].includes(property.property_type) ? 'บ้าน' : property.property_type === 'condo' ? 'คอนโด' : 'ที่ดิน'}`,
                property.province && `อสังหา${property.province}`,
                property.district && `ทรัพย์${property.district}`,
                property.bts_station && `ใกล้BTS${property.bts_station.replace(/\s/g,'')}`,
                `บ้านDมีเชง`,
                `ราคาดี`,
              ].filter(Boolean);
              return (
                <div style={{ marginBottom: 80, marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {tags.map((t, i) => (
                    <span key={i} style={{
                      fontSize: '0.72rem', color: T.textSoft,
                      background: T.surfaceLow, border: `1px solid ${T.surfaceMid}`,
                      padding: '4px 12px', cursor: 'default',
                    }}>#{t}</span>
                  ))}
                </div>
              );
            })()}

          </div>

          {/* ===== RIGHT COLUMN — STICKY SIDEBAR ===== */}
          <aside style={{ position: 'sticky', top: 110 }} className="detail-aside">

            {/* Contact Card — Premium Dark */}
            <div style={{
              background: T.primary, overflow: 'hidden', marginBottom: 20,
            }}>
              {/* Header */}
              <div style={{ padding: '24px 24px 16px' }}>
                <div style={{
                  color: T.accent, fontSize: '0.62rem', letterSpacing: '0.2em',
                  textTransform: 'uppercase', fontWeight: 700, marginBottom: 6,
                  fontFamily: "'Manrope', sans-serif",
                }}>
                  Interested?
                </div>
                <div style={{ fontWeight: 500, fontSize: '1.1rem', color: '#fff', fontFamily: "'Noto Serif Thai', 'Noto Serif', Georgia, serif" }}>
                  สนใจทรัพย์นี้?
                </div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                  ทีม บ้าน D มีเชง พร้อมให้บริการ 7 วัน
                </div>
              </div>

              {/* Inquiry Form */}
              <form onSubmit={handleInquiry} style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input type="text" placeholder="ชื่อ-นามสกุล *"
                  value={inquiryForm.name}
                  onChange={e => setInquiryForm(f => ({ ...f, name: e.target.value }))}
                  required style={darkInputStyle}
                  onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.5)'; e.target.style.background = 'rgba(255,255,255,0.18)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.25)'; e.target.style.background = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }}
                />
                <input type="tel" placeholder="เบอร์โทรศัพท์ *"
                  value={inquiryForm.phone}
                  onChange={e => setInquiryForm(f => ({ ...f, phone: e.target.value }))}
                  required style={darkInputStyle} maxLength={10}
                  onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.5)'; e.target.style.background = 'rgba(255,255,255,0.18)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.25)'; e.target.style.background = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }}
                />
                <textarea placeholder="ข้อความ (เพิ่มเติม)"
                  value={inquiryForm.message}
                  onChange={e => setInquiryForm(f => ({ ...f, message: e.target.value }))}
                  rows={3} style={{ ...darkInputStyle, resize: 'vertical' }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.5)'; e.target.style.background = 'rgba(255,255,255,0.18)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.25)'; e.target.style.background = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }}
                />

                {inquiryStatus === 'success' && (
                  <div style={{ background: 'rgba(6,199,85,0.15)', color: '#a8e6cb', padding: '8px 12px', fontSize: '0.82rem', fontWeight: 600 }}>
                    <i className="fas fa-check-circle" /> {inquiryMsg}
                  </div>
                )}
                {inquiryStatus === 'error' && (
                  <div style={{ background: 'rgba(192,57,43,0.15)', color: '#f5a9a9', padding: '8px 12px', fontSize: '0.82rem' }}>
                    <i className="fas fa-exclamation-circle" /> {inquiryMsg}
                  </div>
                )}

                <button type="submit"
                  disabled={inquiryStatus === 'sending' || property.sale_status === 'sold'}
                  style={{
                    background: property.sale_status === 'sold' ? 'rgba(255,255,255,0.1)' : T.accent,
                    color: property.sale_status === 'sold' ? 'rgba(255,255,255,0.4)' : T.primary,
                    border: 'none', padding: '14px',
                    borderRadius: 8,
                    fontWeight: 800, fontSize: '0.9rem',
                    cursor: property.sale_status === 'sold' ? 'not-allowed' : 'pointer',
                    fontFamily: "'Manrope', sans-serif",
                    letterSpacing: '0.03em',
                    transition: 'opacity 0.2s, transform 0.15s',
                  }}
                  onMouseEnter={e => { if (property.sale_status !== 'sold') e.target.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.target.style.transform = 'none'; }}>
                  {inquiryStatus === 'sending' ? (
                    <><i className="fas fa-spinner fa-spin" /> กำลังส่ง...</>
                  ) : property.sale_status === 'sold' ? (
                    property.listing_type === 'rent' ? 'ทรัพย์ติดเช่าแล้ว' : 'ทรัพย์ขายแล้ว'
                  ) : (
                    <><i className="fas fa-paper-plane" /> ส่งข้อความ</>
                  )}
                </button>
              </form>

              {/* LINE CTA */}
              <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', letterSpacing: '0.1em' }}>
                  หรือติดต่อผ่าน
                </div>
                <a href={LINE_URL} target="_blank" rel="noopener noreferrer"
                  style={{
                    background: T.line, color: '#fff',
                    textDecoration: 'none', padding: '13px',
                    borderRadius: 8,
                    fontWeight: 800, textAlign: 'center', fontSize: '0.9rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontFamily: "'Manrope', sans-serif",
                    transition: 'transform 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                  <i className="fab fa-line" style={{ fontSize: '1.2rem' }} /> LINE @LoanDD
                </a>

                {/* Contact icons */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, paddingTop: 8 }}>
                  {[
                    { icon: 'fa-phone',        bg: 'rgba(255,255,255,0.08)', href: 'tel:081-638-6966', tip: 'โทร' },
                    { icon: 'fab fa-line',     bg: T.line, href: LINE_URL, tip: 'LINE' },
                    { icon: 'fab fa-facebook', bg: '#1877F2', href: FB_URL, tip: 'Facebook' },
                  ].map((c, i) => (
                    <a key={i} href={c.href} target="_blank" rel="noopener noreferrer"
                      title={c.tip}
                      style={{
                        width: 40, height: 40,
                        background: c.bg, color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1rem', textDecoration: 'none',
                        transition: 'transform 0.15s, opacity 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
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
            }}>
              <div style={{
                fontWeight: 700, color: T.text, marginBottom: 14, fontSize: '0.78rem',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                fontFamily: "'Manrope', sans-serif",
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

      {/* ===== FOMO Sticky Bottom Bar — ซ่อนเมื่อขายแล้วหรือติดเช่า ===== */}
      {property.sale_status !== 'sold' && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 900,
          background: T.primary, color: '#fff', padding: '12px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: `1px solid rgba(255,255,255,0.08)`,
          fontFamily: "'Sarabun', sans-serif",
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem' }}>
            <i className="fas fa-fire" style={{ color: T.accent, animation: 'pulse 1.5s infinite' }} />
            <span>
              มี <strong style={{ color: T.accent, fontSize: '1rem' }}>{viewerCount}</strong> คน
              {' '}กำลังดูทรัพย์นี้
              <span style={{ marginLeft: 8, fontSize: '0.68rem', opacity: 0.4 }}>real-time</span>
            </span>
          </div>
          <a href={LINE_URL} target="_blank" rel="noopener noreferrer"
            style={{
              background: T.line, color: '#fff',
              padding: '8px 20px', fontSize: '0.82rem', fontWeight: 800,
              textDecoration: 'none', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: "'Manrope', sans-serif",
            }}>
            <i className="fab fa-line" /> สอบถามเลย
          </a>
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
            order: -1;
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
        margin: 0, fontFamily: "'Noto Serif Thai', 'Noto Serif', Georgia, serif",
        letterSpacing: '-0.01em', lineHeight: 1.3,
      }}>
        {children}
      </h2>
    </div>
  );
}

function nearbyIcon(type) {
  return {
    bts:      'fa-train',
    mrt:      'fa-subway',
    school:   'fa-school',
    hospital: 'fa-hospital',
    mall:     'fa-shopping-cart',
    restaurant:'fa-utensils',
    airport:  'fa-plane',
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
  fontFamily: "'Sarabun', sans-serif",
  transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
  color: '#fff',
  backdropFilter: 'blur(4px)',
};

export default PropertyDetail;
