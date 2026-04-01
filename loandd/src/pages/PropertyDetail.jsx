import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../Navbar';
import { formatPrice, propertyTypeLabel } from '../components/PropertyCard';

const API_BASE = 'http://localhost:3001';
const LINE_URL = 'https://line.me/R/ti/p/@343gpuvp';
const FB_URL   = 'https://www.facebook.com/share/1HWR1pe2XM/?mibextid=wwXIfr';

// ===== Badge สถานะการขาย =====
const statusConfig = {
  available: { label: '✓ ว่างอยู่ พร้อมขาย',    bg: '#e8f8f2', color: '#04AA6D', border: '#a8e6cb' },
  reserved:  { label: '⏳ จองแล้ว รอดำเนินการ', bg: '#fffbe6', color: '#d4890a', border: '#ffd666' },
  sold:      { label: '✕ ขายแล้ว',               bg: '#fff0f0', color: '#c0392b', border: '#f5a9a9' },
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

function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [property, setProperty]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [notFound, setNotFound]     = useState(false);
  const [activeImg, setActiveImg]   = useState(0);
  const [inquiryForm, setInquiryForm] = useState({ name: '', phone: '', message: '' });
  const [inquiryStatus, setInquiryStatus] = useState('idle'); // idle | sending | success | error
  const [inquiryMsg, setInquiryMsg] = useState('');
  const [lightbox, setLightbox]     = useState(null); // null or index

  // ===== Like / Save =====
  const [isSaved, setIsSaved] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [similarProps, setSimilarProps] = useState([]);

  // ===== Quick Action Bar state (ต้องอยู่ top-level ห้ามใน IIFE) =====
  const [qCopied, setQCopied] = useState(false);

  // ===== Mortgage Calculator State =====
  const [calcDown,  setCalcDown]  = useState(20);   // down payment %
  const [calcRate,  setCalcRate]  = useState(6.5);  // interest rate % per year
  const [calcYears, setCalcYears] = useState(30);   // term years

  // ===== User GPS Location =====
  const [userLoc,    setUserLoc]    = useState(null);   // { lat, lng }
  const [locStatus,  setLocStatus]  = useState('idle'); // idle | loading | success | denied

  // ===== FOMO — Real-time viewer count via heartbeat =====
  const [viewerCount, setViewerCount] = useState(1);
  const sessionIdRef = useRef(null);
  const heartbeatRef = useRef(null);

  // Generate/restore sessionId (per browser tab, lives as long as tab is open)
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
      } catch {
        // network error → keep current count, don't crash
      }
    };

    ping(); // ping ทันทีตอนโหลดหน้า
    heartbeatRef.current = setInterval(ping, 20_000); // ping ทุก 20s

    // ส่ง leave เมื่อปิด/ออกจากหน้า
    // sendBeacon เป็น POST เสมอ — ใช้ endpoint /viewers/leave แยกต่างหาก
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
      handleLeave(); // cleanup เมื่อ component unmount (navigate ไปหน้าอื่น)
    };
  }, [id]);

  // โหลดสถานะ saved จาก localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('savedPropertyIds') || '[]');
      setIsSaved(saved.includes(Number(id)));
    } catch { /* ignore */ }
  }, [id]);

  // ===== Toggle Save =====
  const toggleSave = () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    const next = !isSaved;
    setIsSaved(next);
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

  // ===== Copy Link =====
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    });
  };

  // โหลดข้อมูลทรัพย์
  useEffect(() => {
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
    window.scrollTo(0, 0);
  }, [id]);

  // ===== Auto-request GPS เมื่อ property โหลดเสร็จ =====
  useEffect(() => {
    if (!property) return;
    if (!navigator.geolocation) return;
    // ขอ GPS เงียบๆ ครั้งเดียว — ถ้า user เคยอนุญาตแล้วจะได้ทันที ไม่ต้องกด
    setLocStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocStatus('success');
      },
      () => setLocStatus('denied'),
      { timeout: 8000, maximumAge: 300000, enableHighAccuracy: false }
    );
  }, [property?.id]); // re-run เฉพาะเมื่อเปลี่ยนทรัพย์

  // โหลดทรัพย์คล้ายกัน
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

  // รวม images (thumbnail + gallery)
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

  // ===== INQUIRY SUBMIT =====
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

  // ===== LOADING =====
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f7fa', fontFamily: "'Sarabun', sans-serif" }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: '#04AA6D' }} />
          <p style={{ color: '#888' }}>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // ===== NOT FOUND =====
  if (notFound || !property) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f7fa', fontFamily: "'Sarabun', sans-serif" }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '80px 16px' }}>
          <i className="fas fa-home" style={{ fontSize: '3rem', color: '#ddd', marginBottom: 16 }} />
          <h2 style={{ color: '#555' }}>ไม่พบทรัพย์สินนี้</h2>
          <p style={{ color: '#888', marginBottom: 24 }}>อาจถูกลบหรือ URL ไม่ถูกต้อง</p>
          <button onClick={() => navigate('/search')} style={{
            background: '#04AA6D', color: '#fff',
            border: 'none', borderRadius: 8,
            padding: '10px 24px', fontWeight: 700, cursor: 'pointer',
          }}>
            ดูทรัพย์สินทั้งหมด
          </button>
        </div>
      </div>
    );
  }

  const sStatus = statusConfig[property.sale_status] || statusConfig.available;
  const listingLabel = { sale: 'ขาย', rent: 'เช่า', sale_rent: 'ขาย / เช่า' };

  // ===== Haversine distance (km) =====
  const haversineKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371, toRad = d => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  // ===== ขอ GPS จากผู้ใช้ =====
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocStatus('denied');
      return;
    }
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

  // คำนวณระยะจาก user ถึงทรัพย์ (ถ้ามี lat/lng ของทรัพย์)
  const distanceFromUser = (userLoc && property.latitude && property.longitude)
    ? haversineKm(userLoc.lat, userLoc.lng, parseFloat(property.latitude), parseFloat(property.longitude))
    : null;

  // ===== Scroll helper =====
  const scrollToSection = (secId) => {
    const el = document.getElementById(secId);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 110, behavior: 'smooth' });
  };

  // ===== Dynamic Tab List (only show tabs with content) =====
  const detailTabs = [
    { id: 'detail-info',       label: '📋 ข้อมูลทรัพย์',        show: true },
    { id: 'detail-amenities',  label: '🏊 สิ่งอำนวยฯ',           show: !!(property.amenities?.length > 0) },
    { id: 'detail-map',        label: '📍 ที่ตั้ง',               show: !!(property.province || property.district || property.latitude) },
    { id: 'detail-calculator', label: '🧮 คำนวณสินเชื่อ',       show: property.listing_type !== 'rent' && !!property.price_requested },
    { id: 'detail-video',      label: '🎬 วิดีโอรีวิว',          show: !!property.video_url },
  ].filter(t => t.show);

  // ===== YouTube embed helper =====
  const getYoutubeId = (url) => {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  };

  // ===== Mortgage calculator (PMT) =====
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

  const areaText = (() => {
    if (property.usable_area) return `${property.usable_area} ตร.ม.`;
    const p = [];
    if (property.land_area_rai  > 0) p.push(`${property.land_area_rai} ไร่`);
    if (property.land_area_ngan > 0) p.push(`${property.land_area_ngan} งาน`);
    if (property.land_area_wah  > 0) p.push(`${property.land_area_wah} ตร.ว.`);
    return p.join(' ') || '—';
  })();

  return (
    <div className="detail-page-wrapper" style={{ minHeight: '100vh', background: '#f5f7fa', fontFamily: "'Sarabun', sans-serif" }}>
      <Navbar />

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <button onClick={e => { e.stopPropagation(); setLightbox(l => Math.max(0, l - 1)); }}
            style={arrowBtn('left')}
          >‹</button>
          <img
            src={getImgSrc(allImages[lightbox])}
            alt=""
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }}
            onClick={e => e.stopPropagation()}
          />
          <button onClick={e => { e.stopPropagation(); setLightbox(l => Math.min(allImages.length - 1, l + 1)); }}
            style={arrowBtn('right')}
          >›</button>
          <button onClick={() => setLightbox(null)} style={{
            position: 'fixed', top: 16, right: 16,
            background: 'rgba(255,255,255,0.2)', border: 'none',
            color: '#fff', fontSize: '1.5rem', borderRadius: 8,
            padding: '4px 12px', cursor: 'pointer',
          }}>✕</button>
          <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
            {lightbox + 1} / {allImages.length}
          </div>
        </div>
      )}

      {/* ===== STICKY TAB NAV ===== */}
      {detailTabs.length > 1 && (
        <div style={{
          position: 'sticky', top: 56, zIndex: 200,
          background: '#fff', borderBottom: '2px solid #e8ecf4',
          boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
        }}>
          <style>{`
            #detail-tab-bar::-webkit-scrollbar { display: none; }
            .detail-tab-btn { transition: color 0.15s, border-color 0.15s !important; }
            .detail-tab-btn:hover { color: #04AA6D !important; }
          `}</style>
          <div id="detail-tab-bar" style={{
            maxWidth: 1100, margin: '0 auto', padding: '0 16px',
            display: 'flex', overflowX: 'auto', scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch', gap: 0,
          }}>
            {detailTabs.map(tab => (
              <button
                key={tab.id}
                className="detail-tab-btn"
                onClick={() => scrollToSection(tab.id)}
                style={{
                  padding: '12px 18px', border: 'none', borderBottom: '3px solid transparent',
                  background: 'transparent', color: '#555', fontWeight: 700,
                  fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap',
                  fontFamily: "'Sarabun', sans-serif",
                }}
                onMouseEnter={e => e.currentTarget.style.borderBottomColor = '#04AA6D44'}
                onMouseLeave={e => e.currentTarget.style.borderBottomColor = 'transparent'}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px 90px' }}>

        {/* Breadcrumb + Quick Action Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          {/* Breadcrumb */}
          <div style={{ fontSize: '0.8rem', color: '#888', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/" style={{ color: '#04AA6D', textDecoration: 'none' }}>หน้าแรก</Link>
            <span>/</span>
            <Link to="/search" style={{ color: '#04AA6D', textDecoration: 'none' }}>ทรัพย์สิน</Link>
            <span>/</span>
            <span style={{ color: '#444' }}>{property.title}</span>
          </div>

          {/* Quick Action Bar */}
          {(() => {
            const qBtnStyle = (active, activeColor = '#04AA6D') => ({
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 20,
              border: `1.5px solid ${active ? activeColor : '#e0e0e0'}`,
              background: active ? `${activeColor}14` : '#fff',
              color: active ? activeColor : '#666',
              cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
              fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap',
            });
            const handleQCopy = () => {
              navigator.clipboard?.writeText(window.location.href).then(() => {
                setQCopied(true);
                setTimeout(() => setQCopied(false), 2000);
              });
            };
            const handleQSave = () => {
              toggleSave();
            };
            const shareData = { title: property.title, text: `ดูทรัพย์นี้บน LoanDD: ${property.title}`, url: window.location.href };
            return (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => navigate(-1)} style={qBtnStyle(false)}>
                  <i className="fas fa-arrow-left" style={{ fontSize: '0.75rem' }} /> ย้อนกลับ
                </button>
                {navigator.share ? (
                  <button onClick={() => navigator.share(shareData).catch(() => {})} style={qBtnStyle(false)}>
                    <i className="fas fa-share-alt" /> แชร์
                  </button>
                ) : (
                  <a href={`https://line.me/R/share?text=${encodeURIComponent(property.title + ' ' + window.location.href)}`}
                    target="_blank" rel="noopener noreferrer" style={{ ...qBtnStyle(false), textDecoration: 'none' }}>
                    <i className="fab fa-line" style={{ color: '#06C755' }} /> แชร์ LINE
                  </a>
                )}
                <button onClick={handleQCopy} style={qBtnStyle(qCopied, '#1a3c6e')}>
                  <i className={`fas ${qCopied ? 'fa-check' : 'fa-link'}`} />
                  {qCopied ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}
                </button>
                <button onClick={handleQSave} style={qBtnStyle(isSaved, '#e53e3e')}>
                  <i className={`${isSaved ? 'fas' : 'far'} fa-heart`} style={{ color: isSaved ? '#e53e3e' : '#aaa' }} />
                  {isSaved ? 'บันทึกแล้ว' : 'บันทึก'}
                </button>
              </div>
            );
          })()}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 24, alignItems: 'start' }}
          className="detail-grid">

          {/* ===== LEFT COLUMN ===== */}
          <div>

            {/* IMAGE GALLERY */}
            <div id="detail-info" style={{ borderRadius: 14, overflow: 'hidden', background: '#1a2d4a', marginBottom: 20 }}>
              {/* Main Image */}
              <div
                onClick={() => allImages.length > 0 && setLightbox(activeImg)}
                style={{
                  position: 'relative', paddingTop: '56%',
                  cursor: allImages.length > 0 ? 'zoom-in' : 'default',
                  background: '#0d1f35',
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
                    color: 'rgba(255,255,255,0.2)', fontSize: '4rem',
                  }}>
                    <i className="fas fa-home" />
                  </div>
                )}

                {/* Status overlay */}
                {property.sale_status && property.sale_status !== 'available' && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    background: property.sale_status === 'sold' ? '#c0392b' : '#d4890a',
                    color: '#fff', padding: '4px 12px',
                    borderRadius: 6, fontWeight: 800, fontSize: '0.85rem',
                  }}>
                    {property.sale_status === 'sold' ? 'ขายแล้ว' : 'จองแล้ว'}
                  </div>
                )}

                {/* Photo count */}
                {allImages.length > 1 && (
                  <div style={{
                    position: 'absolute', bottom: 10, right: 10,
                    background: 'rgba(0,0,0,0.55)', color: '#fff',
                    padding: '3px 10px', borderRadius: 20,
                    fontSize: '0.78rem', fontWeight: 600,
                  }}>
                    <i className="fas fa-camera" style={{ marginRight: 4 }} />
                    {allImages.length} รูป
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div style={{
                  display: 'flex', gap: 4, padding: '6px 8px',
                  overflowX: 'auto', background: '#0d1f35',
                }}>
                  {allImages.map((img, i) => (
                    <div
                      key={i}
                      onClick={() => setActiveImg(i)}
                      style={{
                        flexShrink: 0, width: 64, height: 48,
                        borderRadius: 6, overflow: 'hidden',
                        border: `2px solid ${i === activeImg ? '#04AA6D' : 'transparent'}`,
                        cursor: 'pointer', opacity: i === activeImg ? 1 : 0.65,
                        transition: 'all 0.15s',
                      }}
                    >
                      <img
                        src={getImgSrc(img)}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* TITLE + STATUS */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                display: 'inline-block',
                background: sStatus.bg, color: sStatus.color,
                border: `1px solid ${sStatus.border}`,
                padding: '4px 12px', borderRadius: 20,
                fontSize: '0.82rem', fontWeight: 700, marginBottom: 10,
              }}>
                {sStatus.label}
              </div>
              <h1 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.5rem)', fontWeight: 800, color: '#1a2d4a', margin: '0 0 6px' }}>
                {property.title}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ color: '#666', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className="fas fa-map-marker-alt" style={{ color: '#04AA6D' }} />
                  {[property.sub_district, property.district, property.province].filter(Boolean).join(', ')}
                </div>
                {/* View count badge */}
                {property.view_count > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#aaa' }}>
                    <i className="fas fa-eye" />
                    <span>{property.view_count.toLocaleString()} ครั้ง</span>
                  </div>
                )}
              </div>

              {/* ===== ACTION BAR ===== */}
              <div style={{
                display: 'flex', gap: 10, marginTop: 14,
                flexWrap: 'wrap', alignItems: 'center',
              }}>
                {/* Save / Like */}
                <button
                  onClick={toggleSave}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 16px', borderRadius: 20,
                    border: isSaved ? '1.5px solid #e74c3c' : '1.5px solid #ddd',
                    background: isSaved ? '#fff0f0' : '#fff',
                    color: isSaved ? '#e74c3c' : '#666',
                    fontWeight: 700, fontSize: '0.82rem',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <i className={isSaved ? 'fas fa-heart' : 'far fa-heart'} />
                  {isSaved ? 'บันทึกแล้ว' : 'บันทึก'}
                </button>

                {/* Share LINE */}
                <a
                  href={`https://line.me/R/share?text=${encodeURIComponent(property.title + ' ' + window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 16px', borderRadius: 20,
                    border: '1.5px solid #ddd', background: '#fff',
                    color: '#06C755', fontWeight: 700, fontSize: '0.82rem',
                    textDecoration: 'none', transition: 'all 0.15s',
                  }}
                >
                  <i className="fab fa-line" /> แชร์ LINE
                </a>

                {/* Share Facebook */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 16px', borderRadius: 20,
                    border: '1.5px solid #ddd', background: '#fff',
                    color: '#1877F2', fontWeight: 700, fontSize: '0.82rem',
                    textDecoration: 'none', transition: 'all 0.15s',
                  }}
                >
                  <i className="fab fa-facebook" /> Facebook
                </a>

                {/* Copy link */}
                <button
                  onClick={copyLink}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 16px', borderRadius: 20,
                    border: '1.5px solid #ddd',
                    background: copyDone ? '#e8f8f2' : '#fff',
                    color: copyDone ? '#04AA6D' : '#666',
                    fontWeight: 700, fontSize: '0.82rem',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <i className={copyDone ? 'fas fa-check' : 'fas fa-link'} />
                  {copyDone ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}
                </button>
              </div>
            </div>

            {/* PRICE BLOCK */}
            <div style={{
              background: 'linear-gradient(135deg, #1a3c6e, #0d2347)',
              borderRadius: 12, padding: '16px 20px', marginBottom: 20,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
            }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.78rem', marginBottom: 4 }}>
                  {listingLabel[property.listing_type] || 'ราคา'}
                </div>
                <div style={{ color: '#fff', fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 900 }}>
                  ฿{formatPrice(property.price_requested || property.monthly_rent)}
                  {property.listing_type === 'rent' && <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>/เดือน</span>}
                </div>
                {property.price_requested && property.usable_area > 0 && (
                  <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem' }}>
                    ≈ ฿{formatPrice(Math.round(property.price_requested / property.usable_area))} / ตร.ม.
                  </div>
                )}
              </div>
              <a
                href={LINE_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#06C755', color: '#fff',
                  textDecoration: 'none', borderRadius: 10,
                  padding: '10px 20px', fontWeight: 800,
                  fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <i className="fab fa-line" /> สอบถาม LINE
              </a>
            </div>

            {/* SPECS */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: 12, marginBottom: 20,
            }}>
              {[
                { icon: 'fa-home',          label: 'ประเภท',    value: propertyTypeLabel(property.property_type) },
                { icon: 'fa-bed',           label: 'ห้องนอน',   value: property.bedrooms > 0 ? `${property.bedrooms} ห้อง` : null },
                { icon: 'fa-bath',          label: 'ห้องน้ำ',   value: property.bathrooms > 0 ? `${property.bathrooms} ห้อง` : null },
                { icon: 'fa-layer-group',   label: 'ชั้น',       value: property.floors > 0 ? `${property.floors} ชั้น` : null },
                { icon: 'fa-vector-square', label: 'พื้นที่ใช้สอย', value: areaText },
                { icon: 'fa-car',           label: 'จอดรถ',     value: property.parking > 0 ? `${property.parking} คัน` : null },
                { icon: 'fa-calendar-alt',  label: 'ปีสร้าง',   value: property.year_built || null },
                { icon: 'fa-couch',         label: 'เฟอร์นิเจอร์', value: { furnished: 'ครบ', semi_furnished: 'บางส่วน', unfurnished: 'ไม่มี' }[property.condition_status] },
              ].filter(s => s.value).map((s, i) => (
                <div key={i} style={{
                  background: '#fff', borderRadius: 10,
                  padding: '10px 12px', textAlign: 'center',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                }}>
                  <i className={`fas ${s.icon}`} style={{ color: '#04AA6D', fontSize: '1.1rem', marginBottom: 4, display: 'block' }} />
                  <div style={{ fontSize: '0.68rem', color: '#999', marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1a2d4a' }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* BTS / Transit Badge */}
            {property.bts_station && (
              <div style={{
                background: '#f0faf6', border: '1px solid #c8e6d0',
                borderRadius: 10, padding: '10px 14px',
                marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <i className="fas fa-train" style={{ color: '#04AA6D', fontSize: '1.2rem', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, color: '#1a6040', fontSize: '0.88rem' }}>
                    ใกล้รถไฟฟ้า: {property.bts_station}
                  </div>
                  {property.bts_distance_km && (
                    <div style={{ color: '#555', fontSize: '0.78rem' }}>
                      ระยะทาง {parseFloat(property.bts_distance_km).toFixed(2)} กม.
                      {' · '}ประมาณ {Math.ceil(parseFloat(property.bts_distance_km) * 1000 / 80)} นาที (เดิน)
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DESCRIPTION */}
            {property.description && (
              <Section title="รายละเอียดทรัพย์">
                <p style={{ color: '#555', fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-line', margin: 0 }}>
                  {property.description}
                </p>
              </Section>
            )}

            {/* AMENITIES — Icon Grid */}
            {property.amenities?.length > 0 && (
              <div id="detail-amenities">
                <Section title="🏊 สิ่งอำนวยความสะดวก">
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                    gap: 10,
                  }}>
                    {property.amenities.map((a, i) => (
                      <div key={i} style={{
                        background: '#f0faf6', border: '1px solid #c8e6d0',
                        borderRadius: 10, padding: '12px 8px',
                        textAlign: 'center',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: 6,
                      }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: '50%',
                          background: '#e0f5ec',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <i className={`fas ${amenityIconMap[a.amenity_name] || 'fa-check'}`}
                            style={{ color: '#04AA6D', fontSize: '1rem' }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1a6040', lineHeight: 1.3 }}>
                          {a.amenity_name}
                        </span>
                      </div>
                    ))}
                  </div>
                </Section>
              </div>
            )}

            {/* NEARBY PLACES */}
            {property.nearby_places?.length > 0 && (
              <Section title="สถานที่ใกล้เคียง">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                  {property.nearby_places.map((np, i) => (
                    <div key={i} style={{
                      background: '#fff', borderRadius: 8,
                      padding: '8px 12px', display: 'flex',
                      alignItems: 'center', gap: 10,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }}>
                      <i className={`fas ${nearbyIcon(np.place_type)}`} style={{ color: '#1a3c6e', width: 20, textAlign: 'center' }} />
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1a2d4a' }}>{np.place_name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#888' }}>
                          {np.distance_km} กม.{np.travel_time_min ? ` · ${np.travel_time_min} นาที` : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* MAP — lat/lng exact pin OR address-based fallback */}
            {(property.latitude && property.longitude) || property.province || property.district ? (
              <div id="detail-map">
              <Section title="📍 แผนที่และทำเลที่ตั้ง">

                {/* ===== GPS DISTANCE FROM USER ===== */}
                <div style={{ marginBottom: 14 }}>
                  {locStatus === 'loading' && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#888', fontSize: '0.82rem' }}>
                      <i className="fas fa-spinner fa-spin" style={{ color: '#04AA6D' }} />
                      กำลังดึงตำแหน่งของคุณ...
                    </div>
                  )}

                  {locStatus === 'denied' && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '7px 14px', borderRadius: 20,
                        background: '#fff8e1', border: '1px solid #ffd666',
                        color: '#856404', fontSize: '0.8rem',
                      }}>
                        <i className="fas fa-exclamation-triangle" />
                        ไม่สามารถดึง GPS ได้ — กรุณาอนุญาต Location ใน browser
                      </div>
                      <button
                        onClick={getUserLocation}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '6px 14px', borderRadius: 20,
                          border: '1.5px solid #c8e6d0', background: '#f0faf6',
                          color: '#1a6040', fontWeight: 700, fontSize: '0.78rem',
                          cursor: 'pointer', fontFamily: "'Sarabun', sans-serif",
                        }}
                      >
                        <i className="fas fa-redo" style={{ fontSize: '0.7rem' }} /> ลองใหม่
                      </button>
                    </div>
                  )}

                  {locStatus === 'success' && distanceFromUser !== null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      {/* Distance badge */}
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '8px 16px', borderRadius: 20,
                        background: distanceFromUser <= 2 ? '#e8f8f2' : distanceFromUser <= 10 ? '#fff8e1' : '#f5f5f5',
                        border: `1.5px solid ${distanceFromUser <= 2 ? '#a8e6cb' : distanceFromUser <= 10 ? '#ffd666' : '#ddd'}`,
                        fontWeight: 700, fontSize: '0.88rem',
                        color: distanceFromUser <= 2 ? '#1a6040' : distanceFromUser <= 10 ? '#856404' : '#555',
                      }}>
                        <i className="fas fa-location-arrow"
                          style={{ color: distanceFromUser <= 2 ? '#04AA6D' : distanceFromUser <= 10 ? '#f0a500' : '#aaa' }} />
                        ห่างจากคุณ {distanceFromUser < 1
                          ? `${Math.round(distanceFromUser * 1000)} เมตร`
                          : `${distanceFromUser.toFixed(1)} กม.`}
                        {distanceFromUser <= 1 && (
                          <span style={{ background: '#04AA6D', color: '#fff', borderRadius: 10, padding: '1px 8px', fontSize: '0.7rem', marginLeft: 4 }}>
                            🚶 เดินได้
                          </span>
                        )}
                        {distanceFromUser > 1 && distanceFromUser <= 5 && (
                          <span style={{ background: '#f0a500', color: '#fff', borderRadius: 10, padding: '1px 8px', fontSize: '0.7rem', marginLeft: 4 }}>
                            🛵 ใกล้มาก
                          </span>
                        )}
                      </div>
                      {/* เส้นทาง Google Maps */}
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${property.latitude},${property.longitude}&origin=${userLoc.lat},${userLoc.lng}&travelmode=driving`}
                        target="_blank" rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '7px 14px', borderRadius: 20,
                          background: '#fff', border: '1.5px solid #1a3c6e',
                          color: '#1a3c6e', fontWeight: 700, fontSize: '0.8rem',
                          textDecoration: 'none',
                        }}
                      >
                        <i className="fas fa-route" /> นำทาง
                      </a>
                      <button
                        onClick={() => { setUserLoc(null); setLocStatus('idle'); }}
                        style={{
                          background: 'none', border: 'none', color: '#aaa',
                          cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline',
                          fontFamily: "'Sarabun', sans-serif",
                        }}
                      >
                        รีเซ็ต
                      </button>
                    </div>
                  )}

                  {locStatus === 'success' && distanceFromUser === null && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#888', fontSize: '0.8rem', fontStyle: 'italic' }}>
                      <i className="fas fa-info-circle" />
                      ทรัพย์นี้ยังไม่มีพิกัด GPS — ไม่สามารถคำนวณระยะได้
                    </div>
                  )}
                </div>

                {/* BTS/MRT NEARBY BADGE ROW */}
                {(property.bts_station || property.mrt_station) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {property.bts_station && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: '#e8f8f2', border: '1px solid #a8e6cb',
                        borderRadius: 20, padding: '5px 12px', fontSize: '0.8rem',
                      }}>
                        <span style={{ fontSize: '1rem' }}>🚈</span>
                        <span style={{ fontWeight: 700, color: '#04AA6D' }}>BTS</span>
                        <span style={{ color: '#1a2d4a' }}>{property.bts_station}</span>
                        {property.bts_distance_km && (
                          <span style={{ color: '#888', fontSize: '0.75rem' }}>
                            · {property.bts_distance_km} กม.
                          </span>
                        )}
                      </div>
                    )}
                    {property.mrt_station && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: '#e8f0ff', border: '1px solid #b3c6f7',
                        borderRadius: 20, padding: '5px 12px', fontSize: '0.8rem',
                      }}>
                        <span style={{ fontSize: '1rem' }}>🚇</span>
                        <span style={{ fontWeight: 700, color: '#3b5bdb' }}>MRT</span>
                        <span style={{ color: '#1a2d4a' }}>{property.mrt_station}</span>
                        {property.mrt_distance_km && (
                          <span style={{ color: '#888', fontSize: '0.75rem' }}>
                            · {property.mrt_distance_km} กม.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* MAP IFRAME */}
                {(() => {
                  const hasCoords = property.latitude && property.longitude;
                  const mapSrc = hasCoords
                    ? `https://maps.google.com/maps?q=${property.latitude},${property.longitude}&z=16&output=embed`
                    : (() => {
                        const parts = [
                          property.address,
                          property.district,
                          property.province,
                          'ประเทศไทย',
                        ].filter(Boolean).join(' ');
                        return `https://maps.google.com/maps?q=${encodeURIComponent(parts)}&z=14&output=embed`;
                      })();
                  const mapsHref = hasCoords
                    ? `https://www.google.com/maps?q=${property.latitude},${property.longitude}`
                    : `https://www.google.com/maps/search/${encodeURIComponent(
                        [property.address, property.district, property.province, 'ประเทศไทย'].filter(Boolean).join(' ')
                      )}`;
                  return (
                    <>
                      <div style={{ borderRadius: 10, overflow: 'hidden', height: 300, boxShadow: '0 2px 12px rgba(0,0,0,0.10)' }}>
                        <iframe
                          title="map"
                          width="100%"
                          height="300"
                          style={{ border: 0 }}
                          loading="lazy"
                          src={mapSrc}
                          allowFullScreen
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ fontSize: '0.78rem', color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <i className="fas fa-map-marker-alt" style={{ color: '#e53e3e' }} />
                          {hasCoords ? 'พิกัด GPS ที่แน่นอน' : 'แสดงตำแหน่งโดยประมาณจากที่อยู่'}
                        </div>
                        <a
                          href={mapsHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '0.8rem', color: '#04AA6D', textDecoration: 'none',
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            background: '#e8f8f2', border: '1px solid #a8e6cb',
                            borderRadius: 20, padding: '4px 12px', fontWeight: 600,
                          }}
                        >
                          <i className="fas fa-external-link-alt" /> เปิด Google Maps
                        </a>
                      </div>
                    </>
                  );
                })()}

                {/* BTS LINE MAP EMBED (static image style info card) */}
                {property.bts_station && (
                  <div style={{
                    marginTop: 14, background: 'linear-gradient(135deg, #1a2d4a 0%, #1a3c6e 100%)',
                    borderRadius: 10, padding: '14px 18px', color: '#fff',
                    display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                  }}>
                    <div style={{ fontSize: '2rem' }}>🚈</div>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: 2 }}>สถานีรถไฟฟ้าใกล้ที่สุด</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800 }}>{property.bts_station}</div>
                      {property.bts_distance_km && (
                        <div style={{ fontSize: '0.78rem', opacity: 0.85, marginTop: 2 }}>
                          ระยะทาง {property.bts_distance_km} กม.
                          {property.bts_distance_km <= 0.5 && <span style={{ marginLeft: 6, background: '#04AA6D', borderRadius: 10, padding: '1px 8px', fontSize: '0.7rem' }}>🚶 เดินได้</span>}
                          {property.bts_distance_km > 0.5 && property.bts_distance_km <= 1.5 && <span style={{ marginLeft: 6, background: '#f0a500', borderRadius: 10, padding: '1px 8px', fontSize: '0.7rem' }}>🛵 ใกล้มาก</span>}
                        </div>
                      )}
                    </div>
                    <a
                      href={`https://www.bts.co.th/th/index.html`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#04AA6D', color: '#fff', borderRadius: 20,
                        padding: '6px 14px', fontSize: '0.75rem', fontWeight: 700,
                        textDecoration: 'none', whiteSpace: 'nowrap',
                      }}
                    >
                      ดูแผนที่ BTS
                    </a>
                  </div>
                )}
              </Section>
              </div>
            ) : null}
            {/* SIMILAR PROPERTIES — horizontal scroll carousel */}
            {similarProps.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#1a2d4a' }}>
                    🏠 ทรัพย์สินที่คล้ายกัน
                  </h3>
                  <Link to="/search" style={{ fontSize: '0.82rem', color: '#04AA6D', fontWeight: 700, textDecoration: 'none' }}>
                    ดูทั้งหมด →
                  </Link>
                </div>

                {/* Carousel track */}
                <div style={{
                  display: 'flex', gap: 14, overflowX: 'auto',
                  paddingBottom: 8, scrollSnapType: 'x mandatory',
                  scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
                  marginLeft: -4, paddingLeft: 4,
                }}>
                  {similarProps.map(sp => (
                    <Link
                      key={sp.id}
                      to={`/property/${sp.id}`}
                      style={{ textDecoration: 'none', color: 'inherit', flexShrink: 0, width: 210, scrollSnapAlign: 'start' }}
                    >
                      <div style={{
                        borderRadius: 12, overflow: 'hidden',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.09)',
                        background: '#fff', transition: 'transform 0.15s, box-shadow 0.15s',
                        height: '100%',
                      }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.14)'; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.09)'; }}
                      >
                        {/* Thumbnail */}
                        <div style={{ height: 132, background: '#e9ecef', overflow: 'hidden', position: 'relative' }}>
                          {sp.thumbnail_url ? (
                            <img
                              src={sp.thumbnail_url.startsWith('http') ? sp.thumbnail_url : `${API_BASE}/${sp.thumbnail_url.replace(/^\/+/, '')}`}
                              alt={sp.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              loading="lazy"
                            />
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                              <i className="fas fa-home" style={{ color: '#ccc', fontSize: '2rem' }} />
                            </div>
                          )}
                          {/* Status badge */}
                          {sp.sale_status && sp.sale_status !== 'available' && (
                            <div style={{
                              position: 'absolute', top: 8, right: 8,
                              background: sp.sale_status === 'sold' ? '#e53e3e' : '#f0a500',
                              color: '#fff', fontSize: '0.65rem', fontWeight: 800,
                              padding: '2px 8px', borderRadius: 10,
                            }}>
                              {sp.sale_status === 'sold' ? 'ขายแล้ว' : 'จองแล้ว'}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div style={{ padding: '10px 12px 12px' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1a2d4a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                            {sp.title}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <i className="fas fa-map-marker-alt" style={{ color: '#04AA6D', fontSize: '0.7rem' }} />
                            {sp.district || sp.province || '—'}
                          </div>
                          <div style={{ fontSize: '0.88rem', color: '#04AA6D', fontWeight: 900 }}>
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
              <div id="detail-calculator">
                <Section title="🧮 คำนวณสินเชื่อ (ประมาณการ)">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12, marginBottom: 16 }}>
                    {/* Down Payment */}
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#888', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                        เงินดาวน์ ({calcDown}%)
                      </label>
                      <input
                        type="range" min={5} max={50} step={5}
                        value={calcDown}
                        onChange={e => setCalcDown(Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#04AA6D' }}
                      />
                      <div style={{ fontSize: '0.8rem', color: '#04AA6D', fontWeight: 700 }}>
                        ฿{Math.round(property.price_requested * calcDown / 100).toLocaleString()}
                      </div>
                    </div>
                    {/* Interest Rate */}
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#888', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                        ดอกเบี้ย ({calcRate}% ต่อปี)
                      </label>
                      <input
                        type="range" min={3} max={10} step={0.5}
                        value={calcRate}
                        onChange={e => setCalcRate(Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#1a3c6e' }}
                      />
                      <div style={{ fontSize: '0.8rem', color: '#1a3c6e', fontWeight: 700 }}>
                        {calcRate}% / ปี
                      </div>
                    </div>
                    {/* Loan Term */}
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#888', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                        ระยะเวลากู้ ({calcYears} ปี)
                      </label>
                      <input
                        type="range" min={5} max={30} step={5}
                        value={calcYears}
                        onChange={e => setCalcYears(Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#6c3fc5' }}
                      />
                      <div style={{ fontSize: '0.8rem', color: '#6c3fc5', fontWeight: 700 }}>
                        {calcYears} ปี ({calcYears * 12} งวด)
                      </div>
                    </div>
                  </div>

                  {/* Result */}
                  <div style={{
                    background: 'linear-gradient(135deg, #1a3c6e, #0d2347)',
                    borderRadius: 12, padding: '16px 20px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    flexWrap: 'wrap', gap: 12,
                  }}>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', marginBottom: 4 }}>
                        ผ่อนต่อเดือน (ประมาณ)
                      </div>
                      <div style={{ color: '#fff', fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', fontWeight: 900 }}>
                        ฿{calcMonthly.toLocaleString()}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', marginTop: 2 }}>
                        วงเงินกู้ ฿{calcLoanAmount.toLocaleString()} · {calcYears * 12} งวด
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', marginBottom: 4 }}>
                        ดอกเบี้ยรวมตลอดสัญญา
                      </div>
                      <div style={{ color: '#f0a500', fontSize: '1rem', fontWeight: 800 }}>
                        ฿{(calcMonthly * calcYears * 12 - calcLoanAmount).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.72rem', color: '#aaa', marginTop: 8, lineHeight: 1.5 }}>
                    * ตัวเลขเป็นเพียงการประมาณการเบื้องต้น อัตราดอกเบี้ยและเงื่อนไขจริงขึ้นอยู่กับธนาคาร
                  </p>
                </Section>
              </div>
            )}

            {/* ===== VIDEO REVIEW ===== */}
            {property.video_url && getYoutubeId(property.video_url) && (
              <div id="detail-video">
                <Section title="🎬 วิดีโอรีวิวทรัพย์">
                  <div style={{
                    position: 'relative', paddingTop: '56.25%',
                    borderRadius: 10, overflow: 'hidden',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                  }}>
                    <iframe
                      title="property video"
                      src={`https://www.youtube.com/embed/${getYoutubeId(property.video_url)}?rel=0&modestbranding=1`}
                      style={{
                        position: 'absolute', inset: 0,
                        width: '100%', height: '100%', border: 0,
                      }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <a
                    href={property.video_url}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      marginTop: 10, fontSize: '0.8rem', color: '#FF0000',
                      fontWeight: 600, textDecoration: 'none',
                    }}
                  >
                    <i className="fab fa-youtube" /> เปิดใน YouTube
                  </a>
                </Section>
              </div>
            )}

            {/* ===== HASHTAGS ===== */}
            {(() => {
              const tags = [
                property.property_type && `ประกาศ${property.listing_type === 'rent' ? 'เช่า' : 'ขาย'}${['house','townhouse'].includes(property.property_type) ? 'บ้าน' : property.property_type === 'condo' ? 'คอนโด' : 'ที่ดิน'}`,
                property.province && `อสังหา${property.province}`,
                property.district && `ทรัพย์${property.district}`,
                property.bts_station && `ใกล้BTS${property.bts_station.replace(/\s/g,'')}`,
                `LoanDD`,
                `ราคาดี`,
              ].filter(Boolean);
              return (
                <div style={{ marginBottom: 80, marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {tags.map((t, i) => (
                    <span key={i} style={{
                      fontSize: '0.75rem', color: '#04AA6D',
                      background: '#f0fdf8', border: '1px solid #c3edd9',
                      padding: '3px 10px', borderRadius: 20,
                      cursor: 'default',
                    }}>#{t}</span>
                  ))}
                </div>
              );
            })()}

          </div>

          {/* ===== RIGHT COLUMN — STICKY SIDEBAR ===== */}
          <aside style={{ position: 'sticky', top: 20 }} className="detail-aside">

            {/* Contact Card */}
            <div style={{
              background: '#fff', borderRadius: 14,
              boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
              overflow: 'hidden', marginBottom: 16,
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #e8f7ee, #f0faf6)',
                padding: '14px 18px',
                borderBottom: '1.5px solid #c8ead8',
              }}>
                <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 2, color: '#04AA6D' }}>สนใจทรัพย์นี้?</div>
                <div style={{ fontSize: '0.78rem', color: '#777' }}>ทีม LoanDD พร้อมให้บริการ 7 วัน</div>
              </div>

              {/* Inquiry Form */}
              <form onSubmit={handleInquiry} style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  type="text"
                  placeholder="ชื่อ-นามสกุล *"
                  value={inquiryForm.name}
                  onChange={e => setInquiryForm(f => ({ ...f, name: e.target.value }))}
                  required
                  style={inputStyle}
                />
                <input
                  type="tel"
                  placeholder="เบอร์โทรศัพท์ *"
                  value={inquiryForm.phone}
                  onChange={e => setInquiryForm(f => ({ ...f, phone: e.target.value }))}
                  required
                  style={inputStyle}
                  maxLength={10}
                />
                <textarea
                  placeholder="ข้อความ (เพิ่มเติม)"
                  value={inquiryForm.message}
                  onChange={e => setInquiryForm(f => ({ ...f, message: e.target.value }))}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />

                {/* Status messages */}
                {inquiryStatus === 'success' && (
                  <div style={{ background: '#e8f8f2', color: '#04AA6D', padding: '8px 12px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600 }}>
                    <i className="fas fa-check-circle" /> {inquiryMsg}
                  </div>
                )}
                {inquiryStatus === 'error' && (
                  <div style={{ background: '#fff0f0', color: '#c0392b', padding: '8px 12px', borderRadius: 8, fontSize: '0.82rem' }}>
                    <i className="fas fa-exclamation-circle" /> {inquiryMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={inquiryStatus === 'sending' || property.sale_status === 'sold'}
                  style={{
                    background: property.sale_status === 'sold' ? '#ccc' : '#04AA6D',
                    color: '#fff', border: 'none',
                    borderRadius: 8, padding: '11px',
                    fontWeight: 800, fontSize: '0.9rem',
                    cursor: property.sale_status === 'sold' ? 'not-allowed' : 'pointer',
                  }}
                >
                  {inquiryStatus === 'sending' ? (
                    <><i className="fas fa-spinner fa-spin" /> กำลังส่ง...</>
                  ) : property.sale_status === 'sold' ? (
                    'ทรัพย์ขายแล้ว'
                  ) : (
                    <><i className="fas fa-paper-plane" /> ส่งข้อความ</>
                  )}
                </button>
              </form>

              {/* LINE CTA */}
              <div style={{ padding: '0 18px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ textAlign: 'center', color: '#aaa', fontSize: '0.75rem' }}>หรือติดต่อผ่าน</div>
                <a
                  href={LINE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#06C755', color: '#fff',
                    textDecoration: 'none', borderRadius: 8,
                    padding: '10px', fontWeight: 800,
                    textAlign: 'center', fontSize: '0.9rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <i className="fab fa-line" style={{ fontSize: '1.1rem' }} /> LINE @LoanDD
                </a>

                {/* ช่องทางติดต่ออื่นๆ — icon row */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, paddingTop: 4 }}>
                  {[
                    { icon: 'fa-phone',        bg: '#1a3c6e', href: 'tel:081-638-6966', tip: 'โทร' },
                    { icon: 'fab fa-line',     bg: '#06C755', href: LINE_URL,           tip: 'LINE' },
                    { icon: 'fab fa-facebook', bg: '#1877F2', href: FB_URL,             tip: 'Facebook' },
                  ].map((c, i) => (
                    <a key={i} href={c.href} target="_blank" rel="noopener noreferrer"
                      title={c.tip}
                      style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: c.bg, color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1rem', textDecoration: 'none',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        transition: 'transform 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <i className={c.icon.startsWith('fab') ? c.icon : `fas ${c.icon}`} />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Property Quick Info */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', fontSize: '0.83rem' }}>
              <div style={{ fontWeight: 700, color: '#1a3c6e', marginBottom: 10, fontSize: '0.85rem' }}>
                <i className="fas fa-info-circle" style={{ marginRight: 6 }} />ข้อมูลสรุป
              </div>
              {[
                { label: 'รหัสทรัพย์', value: `#${String(property.id).padStart(4, '0')}` },
                { label: 'ประเภท', value: propertyTypeLabel(property.property_type) },
                { label: 'วิธีขาย', value: { sale: 'ขาย', rent: 'เช่า', sale_rent: 'ขาย/เช่า' }[property.listing_type] },
                { label: 'จังหวัด', value: property.province },
                { label: 'อัพเดท', value: property.updated_at ? new Date(property.updated_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—' },
              ].filter(r => r.value).map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <span style={{ color: '#888' }}>{r.label}</span>
                  <strong style={{ color: '#333', textAlign: 'right', maxWidth: '55%' }}>{r.value}</strong>
                </div>
              ))}
            </div>

          </aside>
        </div>
      </div>

      {/* ===== FOMO Sticky Bottom Bar ===== */}
      {property.sale_status !== 'sold' && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 900,
          background: 'linear-gradient(90deg, #1a2d4a, #0d1f35)',
          color: '#fff', padding: '10px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 -3px 16px rgba(0,0,0,0.2)',
          fontFamily: "'Sarabun', sans-serif",
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem' }}>
            <span style={{ fontSize: '1.1rem', animation: 'pulse 1.5s infinite' }}>🔥</span>
            <span>
              มี <strong style={{ color: '#f0a500', fontSize: '1.05rem' }}>{viewerCount}</strong> คน
              {' '}กำลังดูทรัพย์นี้อยู่ตอนนี้
              <span style={{ marginLeft: 6, fontSize: '0.72rem', opacity: 0.55, fontWeight: 400 }}>• อัปเดตแบบ real-time</span>
            </span>
          </div>
          <a
            href={LINE_URL}
            target="_blank" rel="noopener noreferrer"
            style={{
              background: '#06C755', color: '#fff',
              padding: '7px 18px', borderRadius: 20,
              fontSize: '0.82rem', fontWeight: 800,
              textDecoration: 'none', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
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
        /* ป้องกัน content ถูกบัง FOMO bar */
        .detail-page-wrapper {
          padding-bottom: 56px;
        }
      `}</style>
    </div>
  );
}

// ===== Helper Components =====
function Section({ title, children }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12,
      padding: '16px 18px', marginBottom: 16,
      boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
    }}>
      <h2 style={{
        fontSize: '0.95rem', fontWeight: 800,
        color: '#1a3c6e', margin: '0 0 12px',
        paddingBottom: 8, borderBottom: '2px solid #f0f4fa',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {title}
      </h2>
      {children}
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
    [side]: 16, top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(255,255,255,0.15)',
    border: 'none', color: '#fff',
    fontSize: '2rem', borderRadius: 8,
    padding: '4px 14px', cursor: 'pointer',
    zIndex: 10000,
  };
}

const inputStyle = {
  width: '100%', padding: '9px 12px',
  border: '1.5px solid #e0e0e0',
  borderRadius: 8, fontSize: '0.85rem',
  outline: 'none', boxSizing: 'border-box',
  fontFamily: "'Sarabun', sans-serif",
  transition: 'border-color 0.15s',
  background: '#fff',
  color: '#1a2d4a',
};

export default PropertyDetail;
