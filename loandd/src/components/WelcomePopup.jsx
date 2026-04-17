import React, { useState, useEffect } from 'react';

/**
 * WelcomePopup — Premium welcome modal
 * Shows once per session, inspired by Sotheby's / Compass luxury feel
 */
const WelcomePopup = () => {
  const [show, setShow] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    // Show once per session
    const seen = sessionStorage.getItem('welcomeSeen');
    if (!seen) {
      const timer = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setShow(false);
      setClosing(false);
      sessionStorage.setItem('welcomeSeen', '1');
    }, 350);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) handleClose();
  };

  if (!show) return null;

  const P = {
    green: '#A1D99B',
    greenDark: '#8BC683',
    gold: '#C9A84C',
    goldLight: '#E8D5A0',
    text: '#1A1A1A',
    textSoft: '#6B6B6B',
    bg: '#FAF9F7',
  };

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: closing ? 'popupOverlayIn 0.3s ease reverse forwards' : 'popupOverlayIn 0.4s ease forwards',
      }}
    >
      <div style={{
        background: '#fff',
        maxWidth: 480,
        width: '100%',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
        animation: closing ? 'popupFadeIn 0.3s ease reverse forwards' : 'popupFadeIn 0.5s cubic-bezier(0.25,0.1,0.25,1) forwards',
        boxShadow: '0 30px 80px rgba(0,0,0,0.25)',
      }}>
        {/* Top accent bar */}
        <div style={{
          height: 3,
          background: `linear-gradient(90deg, ${P.gold} 0%, ${P.green} 50%, ${P.gold} 100%)`,
        }} />

        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 36, height: 36,
            background: 'rgba(0,0,0,0.04)',
            border: 'none', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#999',
            transition: 'all 0.2s',
            zIndex: 2,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.1)'; e.currentTarget.style.color = '#333'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = '#999'; }}
        >
          <i className="fas fa-times" style={{ fontSize: '0.9rem' }} />
        </button>

        {/* Content */}
        <div style={{ padding: '48px 40px 36px', textAlign: 'center' }}>
          {/* Eyebrow */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 20,
          }}>
            <div style={{ width: 32, height: 1, background: P.gold }} />
            <span style={{
              fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.2em',
              textTransform: 'uppercase', color: P.gold,
              fontFamily: "'Manrope', sans-serif",
            }}>
              Welcome
            </span>
            <div style={{ width: 32, height: 1, background: P.gold }} />
          </div>

          {/* Main heading — Noto Serif Thai, light weight */}
          <h2 style={{
            fontFamily: "'Prompt', sans-serif",
            fontWeight: 400,
            fontSize: 'clamp(1.3rem, 4vw, 1.7rem)',
            color: P.text,
            lineHeight: 1.4,
            margin: '0 0 12px',
          }}>
            ยินดีต้อนรับสู่<br />
            <span style={{ color: P.green }}>บ้าน D มีเชง</span>
          </h2>

          {/* Subtitle */}
          <p style={{
            color: P.textSoft,
            fontSize: '0.88rem',
            lineHeight: 1.7,
            margin: '0 0 28px',
            fontFamily: "'Sarabun', sans-serif",
          }}>
            อสังหาริมทรัพย์รีโนเวทพร้อมอยู่ คัดสรรโดยทีมงานมืออาชีพ
            <br />ตรวจสอบโฉนดครบ ราคาเป็นธรรม
          </p>

          {/* Stats row */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 0,
            borderTop: `1px solid ${P.bg}`,
            borderBottom: `1px solid ${P.bg}`,
            margin: '0 -40px 28px',
            padding: '0 40px',
            background: P.bg,
          }}>
            {[
              { icon: 'fa-shield-alt', label: 'ตรวจสอบโฉนด', sub: 'ทุกรายการ' },
              { icon: 'fa-tools', label: 'รีโนเวทเอง', sub: 'คุณภาพครบ' },
              { icon: 'fa-handshake', label: 'ซื้อตรง', sub: 'ไม่ผ่านนายหน้า' },
            ].map((item, i) => (
              <div key={i} style={{
                flex: 1, padding: '18px 8px', textAlign: 'center',
                borderRight: i < 2 ? `1px solid #E9EAEB` : 'none',
              }}>
                <i className={`fas ${item.icon}`} style={{
                  color: P.green, fontSize: '1rem', marginBottom: 8, display: 'block',
                }} />
                <div style={{
                  fontSize: '0.72rem', fontWeight: 700, color: P.text,
                  fontFamily: "'Manrope', sans-serif",
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontSize: '0.65rem', color: P.textSoft, marginTop: 2,
                }}>
                  {item.sub}
                </div>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={handleClose}
              style={{
                background: P.green,
                color: '#1a3a18',
                border: `1px solid ${P.green}`,
                borderRadius: 4,
                padding: '14px 24px',
                fontSize: '0.88rem',
                fontWeight: 600,
                fontFamily: "'Manrope', sans-serif",
                letterSpacing: '0.04em',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.25,0.1,0.25,1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = P.greenDark; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = P.green; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <i className="fas fa-search" style={{ fontSize: '0.8rem' }} />
              ดูทรัพย์ทั้งหมด
            </button>

            <a
              href="https://lin.ee/LoanDD"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => sessionStorage.setItem('welcomeSeen', '1')}
              style={{
                background: '#06C755',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                padding: '12px 24px',
                fontSize: '0.85rem',
                fontWeight: 600,
                fontFamily: "'Manrope', sans-serif",
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'all 0.3s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#05B34D'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#06C755'; }}
            >
              <i className="fab fa-line" style={{ fontSize: '1.1rem' }} />
              สอบถามผ่าน LINE
            </a>
          </div>
        </div>

        {/* Bottom accent */}
        <div style={{
          padding: '14px 40px',
          background: P.bg,
          textAlign: 'center',
          borderTop: '1px solid #E9EAEB',
        }}>
          <span style={{
            fontSize: '0.65rem',
            color: P.textSoft,
            fontFamily: "'Manrope', sans-serif",
            letterSpacing: '0.05em',
          }}>
            <i className="fas fa-phone-alt" style={{ marginRight: 6, color: P.gold, fontSize: '0.6rem' }} />
            โทร 081-638-6966 | เปิดทุกวัน 9:00 - 18:00
          </span>
        </div>
      </div>
    </div>
  );
};

export default WelcomePopup;
