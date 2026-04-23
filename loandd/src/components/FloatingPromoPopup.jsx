import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * FloatingPromoPopup — ป๊อบอัพลอยจากซ้ายล่าง
 * - แสดง**เฉพาะหน้า Home** (/)
 * - แสดงครั้งเดียวต่อ session (sessionStorage)
 * - Auto-show หลัง 1.2 วิ หลังหน้าโหลดเสร็จ
 * - ดึงรูปทรัพย์แนะนำสุ่มจาก API มาเป็น thumbnail
 * - ปิดได้ มี CTA พาไปหน้ารายละเอียด/search
 */
const FloatingPromoPopup = () => {
  const [show, setShow] = useState(false);
  const [closing, setClosing] = useState(false);
  const [property, setProperty] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // แสดงเฉพาะหน้า Home
    if (location.pathname !== '/') return;

    // แสดงครั้งเดียวต่อ session
    const seen = sessionStorage.getItem('promoPopupSeen');
    if (seen) return;

    // ดึงทรัพย์แนะนำสุ่ม 1 รายการมาโชว์
    fetch('/api/properties/featured-random?limit=1')
      .then(r => r.json())
      .then(data => {
        const p = Array.isArray(data) ? data[0] : null;
        if (p) setProperty(p);
      })
      .catch(() => {});

    // แสดงหลัง 1.2 วิ (ให้หน้าโหลด hero เสร็จก่อน)
    const timer = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setShow(false);
      setClosing(false);
      sessionStorage.setItem('promoPopupSeen', '1');
    }, 280);
  };

  const handleCTA = () => {
    if (property?.id) {
      navigate(`/property/${property.id}`);
    } else {
      navigate('/search');
    }
    handleClose();
  };

  if (!show) return null;

  const imgSrc = property?.thumbnail_url
    ? (property.thumbnail_url.startsWith('http') ? property.thumbnail_url : property.thumbnail_url)
    : null;

  const price = property?.listing_type === 'rent'
    ? (property?.monthly_rent ? `฿${Number(property.monthly_rent).toLocaleString('th-TH')}/เดือน` : 'ติดต่อสอบถาม')
    : (property?.price_requested ? `฿${Number(property.price_requested).toLocaleString('th-TH')}` : 'ติดต่อสอบถาม');

  return (
    <>
      <style>{`
        @keyframes promoSlideIn {
          from { opacity: 0; transform: translateY(20px) translateX(-12px); }
          to   { opacity: 1; transform: translateY(0) translateX(0); }
        }
        @keyframes promoSlideOut {
          from { opacity: 1; transform: translateY(0) translateX(0); }
          to   { opacity: 0; transform: translateY(12px) translateX(-12px); }
        }
        .floating-promo {
          position: fixed;
          bottom: 24px;
          left: 24px;
          z-index: 9500;
          width: 300px;
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.22), 0 4px 12px rgba(0,0,0,0.08);
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.06);
          animation: promoSlideIn 0.42s cubic-bezier(0.34, 1.56, 0.64, 1);
          font-family: 'Prompt', 'Sarabun', sans-serif;
        }
        .floating-promo.closing { animation: promoSlideOut 0.28s ease-in forwards; }
        .floating-promo-img {
          width: 100%;
          height: 140px;
          object-fit: cover;
          display: block;
          background: #e8edf2;
        }
        .floating-promo-img-placeholder {
          width: 100%; height: 140px;
          background: linear-gradient(135deg, #A1D99B 0%, #8BC683 100%);
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.7); font-size: 2rem;
        }
        .floating-promo-close {
          position: absolute;
          top: 10px; right: 10px;
          width: 28px; height: 28px;
          border-radius: 50%;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(8px);
          color: #fff;
          border: none;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.82rem;
          transition: all 0.2s;
        }
        .floating-promo-close:hover { background: rgba(0,0,0,0.85); transform: scale(1.08); }
        .floating-promo-badge {
          position: absolute;
          top: 10px; left: 10px;
          background: rgba(201,168,76,0.95);
          color: #1a1a1a;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.66rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-family: 'Manrope', sans-serif;
          display: inline-flex; align-items: center; gap: 4px;
        }
        .floating-promo-body { padding: 14px 16px 16px; }
        .floating-promo-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 3px;
          line-height: 1.3;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .floating-promo-sub {
          font-size: 0.72rem;
          color: #888;
          margin: 0 0 10px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .floating-promo-price {
          font-size: 1.05rem;
          font-weight: 800;
          color: #3d7a3a;
          margin: 0 0 10px;
          font-family: 'Manrope', sans-serif;
        }
        .floating-promo-cta {
          width: 100%;
          padding: 10px 14px;
          background: #1a3a18;
          color: #fff;
          border: none;
          border-radius: 999px;
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s;
          font-family: inherit;
        }
        .floating-promo-cta:hover { background: #2d5e2b; transform: translateY(-1px); }

        @media (max-width: 540px) {
          .floating-promo {
            left: 12px; right: 12px; bottom: 90px;
            width: auto;
          }
        }
      `}</style>
      <div className={`floating-promo ${closing ? 'closing' : ''}`}>
        <div style={{ position: 'relative' }}>
          {imgSrc ? (
            <img className="floating-promo-img" src={imgSrc} alt={property?.title || ''} />
          ) : (
            <div className="floating-promo-img-placeholder">
              <i className="fas fa-home" />
            </div>
          )}
          <span className="floating-promo-badge">
            <i className="fas fa-star" style={{ fontSize: '0.58rem' }} /> ทรัพย์แนะนำ
          </span>
          <button className="floating-promo-close" onClick={handleClose} title="ปิด">
            <i className="fas fa-times" />
          </button>
        </div>
        <div className="floating-promo-body">
          <h4 className="floating-promo-title">
            {property?.title || 'ดูทรัพย์คุณภาพ คัดสรรโดย บ้าน D มีเชง'}
          </h4>
          <p className="floating-promo-sub">
            {property ? [property.district, property.province].filter(Boolean).join(', ') : 'รีโนเวทเอง พร้อมเข้าอยู่ทุกหลัง'}
          </p>
          {property && (
            <div className="floating-promo-price">{price}</div>
          )}
          <button className="floating-promo-cta" onClick={handleCTA}>
            <i className="fas fa-arrow-right" />
            {property ? 'ดูรายละเอียด' : 'ดูทรัพย์ทั้งหมด'}
          </button>
        </div>
      </div>
    </>
  );
};

export default FloatingPromoPopup;
