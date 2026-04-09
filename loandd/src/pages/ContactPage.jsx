import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../Navbar';

const brandGreen = '#1A8C6E';
const navy = '#1A8C6E';
const LINE_URL = 'https://line.me/R/ti/p/@loan_dd';
const PHONE    = '081-638-6966';
const FB_URL   = 'https://www.facebook.com/share/1HWR1pe2XM/?mibextid=wwXIfr';

const API_BASE = 'http://localhost:3001';

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '', type: 'ซื้อทรัพย์' });
  const [status, setStatus] = useState(null); // null | 'sending' | 'sent' | 'error'

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.message) {
      setStatus('error');
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch(`${API_BASE}/api/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          message: `[${form.type}] ${form.message}`,
        }),
      });
      if (res.ok) {
        setStatus('sent');
        setForm({ name: '', phone: '', email: '', message: '', type: 'ซื้อทรัพย์' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div style={{ fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif", background: 'var(--surface, #FAF9F7)', minHeight: '100vh' }}>
      <Navbar />

      {/* Hero — Quiet Luxury */}
      <section style={{
        background: `linear-gradient(135deg, ${navy} 0%, #147A5E 60%, ${brandGreen} 100%)`,
        padding: 'calc(64px + 48px) 16px 40px',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ fontSize: '0.62rem', color: '#C9A84C', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, fontFamily: "'Manrope', sans-serif", marginBottom: 10 }}>
            Contact Us
          </div>
          <h1 style={{ color: '#fff', fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', fontWeight: 400, marginBottom: 8, fontFamily: "'Noto Serif Thai', 'Noto Serif', Georgia, serif", letterSpacing: '-0.01em' }}>
            ติดต่อเรา
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', margin: 0 }}>
            มีคำถามเรื่องทรัพย์? สนใจซื้อหรือเช่า? ทีมงาน บ้าน D มีเชง พร้อมช่วยคุณเสมอ
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '10px 20px', fontSize: '0.82rem', color: '#888' }}>
        <div className="container">
          <Link to="/" style={{ color: '#888', textDecoration: 'none' }}>หน้าแรก</Link>
          <span style={{ margin: '0 6px' }}>›</span>
          <span style={{ color: navy, fontWeight: 600 }}>ติดต่อเรา</span>
        </div>
      </div>

      <div className="container" style={{ padding: '40px 16px', maxWidth: 1100 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32, alignItems: 'start' }}>

          {/* LEFT — Contact Info */}
          <div>
            {/* Quick contact cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
              {/* Phone */}
              <a href={`tel:${PHONE}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '18px 22px', transition: 'box-shadow 0.2s', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(4,170,109,0.14)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'}
                >
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e8f5ee', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="fas fa-phone-alt" style={{ color: brandGreen, fontSize: '1.1rem' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: 2 }}>โทรศัพท์</div>
                    <div style={{ fontWeight: 700, color: navy, fontSize: '1.1rem' }}>{PHONE}</div>
                    <div style={{ fontSize: '0.78rem', color: brandGreen }}>จ–ส 09:00–18:00</div>
                  </div>
                </div>
              </a>

              {/* LINE */}
              <a href={LINE_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '18px 22px', transition: 'box-shadow 0.2s', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,190,60,0.14)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'}
                >
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e6f9ee', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {/* LINE logo */}
                    <svg width="26" height="26" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="40" height="40" rx="10" fill="#06C755"/>
                      <path d="M33 18.8C33 13.4 27.6 9 21 9C14.4 9 9 13.4 9 18.8C9 23.6 13.2 27.6 19 28.4C19.4 28.5 20 28.7 20.1 29.1C20.2 29.5 20.1 30.1 20 30.5L19.7 32C19.6 32.4 19.3 33.4 21 32.7C22.7 32 30.3 27.2 33.4 23.6C35.3 21.5 33 18.8 33 18.8Z" fill="white"/>
                      <path d="M17.3 21.6H15.2V16.4C15.2 16.2 15 16 14.8 16H13.8C13.6 16 13.4 16.2 13.4 16.4V22.6C13.4 22.8 13.6 23 13.8 23H17.3C17.5 23 17.7 22.8 17.7 22.6V21.9C17.7 21.8 17.5 21.6 17.3 21.6Z" fill="#06C755"/>
                      <path d="M26.6 16.4C26.6 16.2 26.4 16 26.2 16H25.2C25 16 24.8 16.2 24.8 16.4V20.4L21.7 16.2C21.7 16.1 21.6 16.1 21.5 16H20.5C20.3 16 20.1 16.2 20.1 16.4V22.6C20.1 22.8 20.3 23 20.5 23H21.5C21.7 23 21.9 22.8 21.9 22.6V18.6L25 22.8C25.1 22.9 25.2 23 25.3 23H26.2C26.4 23 26.6 22.8 26.6 22.6V16.4Z" fill="#06C755"/>
                      <rect x="18.2" y="16" width="1.8" height="7" rx="0.9" fill="#06C755"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: 2 }}>LINE Official</div>
                    <div style={{ fontWeight: 700, color: navy, fontSize: '1rem' }}>@loan_dd</div>
                    <div style={{ fontSize: '0.78rem', color: '#06C755' }}>แชทได้เลยทันที</div>
                  </div>
                </div>
              </a>

              {/* Facebook */}
              <a href={FB_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '18px 22px', transition: 'box-shadow 0.2s', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(24,119,242,0.14)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'}
                >
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e8f0fd', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="fab fa-facebook" style={{ color: '#1877F2', fontSize: '1.4rem' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: 2 }}>Facebook</div>
                    <div style={{ fontWeight: 700, color: navy, fontSize: '0.95rem' }}>บ้าน D มีเชง</div>
                    <div style={{ fontSize: '0.78rem', color: '#1877F2' }}>ติดตามข่าวสาร & แชทได้</div>
                  </div>
                </div>
              </a>
            </div>

            {/* Map — Google Maps embed */}
            <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #e8ecf0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ background: navy, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fas fa-map-marker-alt" style={{ color: '#4ade80' }} />
                <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>ที่ตั้งสำนักงาน</span>
              </div>
              <iframe
                title="บริษัท โลนด์ ดีดี จำกัด Office Map"
                src="https://maps.google.com/maps?q=87+%E0%B8%96.+%E0%B8%AA%E0%B8%B8%E0%B8%A7%E0%B8%B4%E0%B8%99%E0%B8%97%E0%B8%A7%E0%B8%87%E0%B8%A8%E0%B9%8C+%E0%B9%81%E0%B8%82%E0%B8%A7%E0%B8%87%E0%B8%A1%E0%B8%B5%E0%B8%99%E0%B8%9A%E0%B8%B8%E0%B8%A3%E0%B8%B5+%E0%B9%80%E0%B8%82%E0%B8%95%E0%B8%A1%E0%B8%B5%E0%B8%99%E0%B8%9A%E0%B8%B8%E0%B8%A3%E0%B8%B5+%E0%B8%81%E0%B8%A3%E0%B8%B8%E0%B8%87%E0%B9%80%E0%B8%97%E0%B8%9E%E0%B8%A1%E0%B8%AB%E0%B8%B2%E0%B8%99%E0%B8%84%E0%B8%A3+10510&output=embed&z=15"
                width="100%"
                height="220"
                style={{ display: 'block', border: 'none' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div style={{ padding: '12px 18px', background: '#fff', borderTop: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: '0.82rem', color: '#444', fontWeight: 600, marginBottom: 4 }}>
                  <i className="fas fa-building" style={{ color: brandGreen, marginRight: 6 }} />
                  บริษัท โลนด์ ดีดี จำกัด (สำนักงานใหญ่)
                </div>
                <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: 8, lineHeight: 1.5 }}>
                  87 ถ. สุวินทวงศ์ แขวงมีนบุรี เขตมีนบุรี<br />กรุงเทพมหานคร 10510
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    <i className="fas fa-clock" style={{ color: brandGreen, marginRight: 6 }} />
                    เปิดทำการ จันทร์–เสาร์ เวลา 09:00–18:00 น.
                  </div>
                  <a
                    href="https://www.google.com/maps?um=1&ie=UTF-8&fb=1&gl=th&sa=X&geocode=KW0u9U8AZR0xMT-ZTOZxfWzx&daddr=87+%E0%B8%96.+%E0%B8%AA%E0%B8%B8%E0%B8%A7%E0%B8%B4%E0%B8%99%E0%B8%97%E0%B8%A7%E0%B8%87%E0%B8%A8%E0%B9%8C+%E0%B9%81%E0%B8%82%E0%B8%A7%E0%B8%87%E0%B8%A1%E0%B8%B5%E0%B8%99%E0%B8%9A%E0%B8%B8%E0%B8%A3%E0%B8%B5+%E0%B9%80%E0%B8%82%E0%B8%95%E0%B8%A1%E0%B8%B5%E0%B8%99%E0%B8%9A%E0%B8%B8%E0%B8%A3%E0%B8%B5+%E0%B8%81%E0%B8%A3%E0%B8%B8%E0%B8%87%E0%B9%80%E0%B8%97%E0%B8%9E%E0%B8%A1%E0%B8%AB%E0%B8%B2%E0%B8%99%E0%B8%84%E0%B8%A3+10510"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.78rem', color: brandGreen, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <i className="fas fa-directions" /> เปิดใน Google Maps
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Inquiry Form */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8ecf0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '32px 28px' }}>
            <h2 style={{ color: navy, fontWeight: 500, fontSize: '1.25rem', marginBottom: 6, fontFamily: "'Noto Serif Thai', 'Noto Serif', Georgia, serif" }}>
              ส่งข้อความหาเรา
            </h2>
            <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: 24 }}>กรอกแบบฟอร์มด้านล่าง ทีมงานจะติดต่อกลับโดยเร็ว</p>

            {status === 'sent' ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <i className="fas fa-check-circle" style={{ fontSize: '2.5rem', marginBottom: 16, color: '#1A8C6E', display: 'block' }} />
                <h3 style={{ color: brandGreen, fontWeight: 800, marginBottom: 8 }}>ส่งข้อความสำเร็จ!</h3>
                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: 24 }}>ทีมงานจะติดต่อกลับภายใน 1 ชั่วโมง (จ–ส)</p>
                <button
                  onClick={() => setStatus(null)}
                  style={{ background: brandGreen, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  ส่งข้อความใหม่
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Type selector */}
                <div>
                  <label style={{ fontSize: '0.82rem', color: '#555', fontWeight: 600, marginBottom: 6, display: 'block' }}>เรื่องที่ต้องการสอบถาม</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['ซื้อทรัพย์', 'เช่าทรัพย์', 'สอบถามข้อมูลทรัพย์', 'อื่นๆ'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, type: t }))}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 50,
                          border: `1.5px solid ${form.type === t ? brandGreen : '#ddd'}`,
                          background: form.type === t ? '#e8f5ee' : '#fff',
                          color: form.type === t ? brandGreen : '#666',
                          fontWeight: form.type === t ? 700 : 400,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name + Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>ชื่อ–นามสกุล *</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="กรอกชื่อของคุณ"
                      required
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = brandGreen}
                      onBlur={e => e.target.style.borderColor = '#ddd'}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>เบอร์โทรศัพท์ *</label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="0XX-XXX-XXXX"
                      required
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = brandGreen}
                      onBlur={e => e.target.style.borderColor = '#ddd'}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label style={labelStyle}>อีเมล (ไม่บังคับ)</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = brandGreen}
                    onBlur={e => e.target.style.borderColor = '#ddd'}
                  />
                </div>

                {/* Message */}
                <div>
                  <label style={labelStyle}>ข้อความ *</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="บอกเราว่าต้องการอะไร เช่น ทรัพย์ที่สนใจ งบประมาณ หรือคำถามที่อยากรู้..."
                    required
                    rows={5}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 110 }}
                    onFocus={e => e.target.style.borderColor = brandGreen}
                    onBlur={e => e.target.style.borderColor = '#ddd'}
                  />
                </div>

                {status === 'error' && (
                  <div style={{ background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem', color: '#b91c1c' }}>
                    <i className="fas fa-exclamation-circle" style={{ marginRight: 6 }} />
                    กรุณากรอกชื่อ เบอร์โทร และข้อความให้ครบ หรือเกิดข้อผิดพลาด — ลองอีกครั้ง
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  style={{
                    background: status === 'sending' ? '#9ca3af' : brandGreen,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '14px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {status === 'sending' ? (
                    <><i className="fas fa-spinner fa-spin" /> กำลังส่ง...</>
                  ) : (
                    <><i className="fas fa-paper-plane" /> ส่งข้อความ</>
                  )}
                </button>

                <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#aaa', margin: 0 }}>
                  หรือติดต่อผ่าน{' '}
                  <a href={LINE_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#06C755', fontWeight: 700 }}>LINE @loan_dd</a>
                  {' '}หรือ{' '}
                  <a href={`tel:${PHONE}`} style={{ color: brandGreen, fontWeight: 700 }}>{PHONE}</a>
                </p>
              </form>
            )}
          </div>
        </div>

        {/* FAQ CTA */}
        <div style={{ marginTop: 48, background: `linear-gradient(135deg, ${navy}, #00463d)`, borderRadius: 16, padding: '32px 28px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <h3 style={{ color: '#fff', fontWeight: 800, fontSize: '1.2rem', marginBottom: 6 }}>มีคำถามเบื้องต้น?</h3>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', margin: 0 }}>
              ดูคำถามที่พบบ่อยของเรา — การซื้อ-ขาย เอกสาร ค่าโอน และขั้นตอนต่างๆ
            </p>
          </div>
          <Link to="/faq" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: brandGreen, color: '#fff', textDecoration: 'none',
            borderRadius: 10, padding: '12px 24px', fontWeight: 700, fontSize: '0.95rem',
            transition: 'opacity 0.2s',
            whiteSpace: 'nowrap',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <i className="fas fa-question-circle" /> ดู FAQ
          </Link>
        </div>
      </div>

      {/* Footer strip */}
      <footer style={{ background: navy, color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '20px 16px', fontSize: '0.82rem', marginTop: 60 }}>
        © {new Date().getFullYear()} บ้าน D มีเชง Co., Ltd. · <a href={`tel:${PHONE}`} style={{ color: 'rgba(255,255,255,0.8)' }}>{PHONE}</a>
      </footer>
    </div>
  );
};

const labelStyle = {
  fontSize: '0.82rem',
  color: '#555',
  fontWeight: 600,
  marginBottom: 5,
  display: 'block',
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  border: '1.5px solid #ddd',
  borderRadius: 8,
  fontSize: '0.9rem',
  outline: 'none',
  fontFamily: '"Noto Sans Thai", sans-serif',
  color: navy,
  transition: 'border-color 0.15s',
  background: '#fff',
  boxSizing: 'border-box',
};

export default ContactPage;
