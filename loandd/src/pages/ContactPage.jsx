import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../Navbar';
import heroBg from '../pic/ปกหลัง.gif';

const brandGreen = '#A1D99B';
const navy = '#3d7a3a';
const LINE_URL = 'https://line.me/R/ti/p/@loan_dd';
const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61585940981927';
const PHONE = '081-638-6966';
const FB_URL = 'https://www.facebook.com/share/1HWR1pe2XM/?mibextid=wwXIfr';

const API_BASE = '';

const ContactPage = () => {
 const [inquiryForm, setInquiryForm] = useState({ name: '', phone: '', email: '', topic: '', message: '', type: 'ซื้อทรัพย์' });
 const [inquiryStatus, setInquiryStatus] = useState('idle'); // 'idle' | 'sending' | 'success' | 'error'
 const [inquiryMsg, setInquiryMsg] = useState('');

 const handleChange = e => setInquiryForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

 const handleSubmit = async (e) => {
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
 if (!inquiryForm.message.trim()) {
 setInquiryMsg('กรุณากรอกข้อความ');
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
 name: inquiryForm.name.trim(),
 phone: inquiryForm.phone.trim(),
 email: inquiryForm.email.trim(),
 topic: `[${inquiryForm.type}]${inquiryForm.topic.trim() ? ' ' + inquiryForm.topic.trim() : ''}`,
 message: inquiryForm.message.trim(),
 }),
 });
 const data = await res.json();
 if (res.ok) {
 setInquiryStatus('success');
 setInquiryMsg(data.message || 'ส่งข้อความสำเร็จ ทีมงานจะติดต่อกลับโดยเร็ว');
 setInquiryForm({ name: '', phone: '', email: '', topic: '', message: '', type: 'ซื้อทรัพย์' });
 } else {
 setInquiryStatus('error');
 setInquiryMsg(data.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
 }
 } catch {
 setInquiryStatus('error');
 setInquiryMsg('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
 }
 };

 const lightInputStyleSync = {
 width: '100%', padding: '13px 16px',
 border: '1.5px solid #e5e5e5',
 borderRadius: 10,
 background: '#fafafa',
 fontSize: '0.88rem', outline: 'none',
 boxSizing: 'border-box',
 fontFamily: '"Sarabun", sans-serif',
 transition: 'border-color 0.2s, box-shadow 0.2s',
 color: '#1a1a18',
 };

 return (
 <div style={{ fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif", background: 'var(--surface, #FAF9F7)', minHeight: '100vh' }}>
 <Navbar />

 {/* Hero — GIF background + dark filter */}
 <section style={{
 backgroundImage: `url(${heroBg})`,
 backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
 padding: 'calc(64px + 48px) 16px 40px',
 position: 'relative',
 }}>
 <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(15,20,16,0.7) 100%)', pointerEvents: 'none' }} />
 <div style={{ maxWidth: 960, margin: '0 auto', position: 'relative', zIndex: 1 }}>
 <div style={{ fontSize: '0.62rem', color: '#e8d48a', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, fontFamily: "'Manrope', sans-serif", marginBottom: 10 }}>
 Contact Us
 </div>
 <h1 style={{ color: '#fff', fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', fontWeight: 400, marginBottom: 8, fontFamily: "'Prompt', sans-serif", letterSpacing: '-0.01em' }}>
 ติดต่อเรา
 </h1>
 <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.88rem', margin: 0 }}>
 มีคำถามเรื่องทรัพย์? ทีมงาน บ้าน D มีเชง พร้อมช่วยคุณเสมอ
 </p>
 </div>
 </section>

 <div className="container" style={{ padding: '40px 16px', maxWidth: 1100, margin: '0 auto' }}>
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32, alignItems: 'start' }}>

 {/* LEFT — Contact Info */}
 <div>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
 <a href={`tel:${PHONE}`} style={{ textDecoration: 'none' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '18px 22px', transition: 'box-shadow 0.2s', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
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
 <a href={LINE_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '18px 22px', transition: 'box-shadow 0.2s', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
 <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e6f9ee', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
 <svg width="26" height="26" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
 <rect width="40" height="40" rx="10" fill="#06C755" />
 <path d="M33 18.8C33 13.4 27.6 9 21 9C14.4 9 9 13.4 9 18.8C9 23.6 13.2 27.6 19 28.4C19.4 28.5 20 28.7 20.1 29.1C20.2 29.5 20.1 30.1 20 30.5L19.7 32C19.6 32.4 19.3 33.4 21 32.7C22.7 32 30.3 27.2 33.4 23.6C35.3 21.5 33 18.8 33 18.8Z" fill="white" />
 </svg>
 </div>
 <div>
 <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: 2 }}>LINE Official</div>
 <div style={{ fontWeight: 700, color: navy, fontSize: '1rem' }}>@loan_dd</div>
 <div style={{ fontSize: '0.78rem', color: '#06C755' }}>แชทได้เลยทันที</div>
 </div>
 </div>
 </a>
 <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fff', border: '1px solid #e8ecf0', borderRadius: 14, padding: '18px 22px', transition: 'box-shadow 0.2s', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
 <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e7f0fd', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
 <i className="fab fa-facebook-f" style={{ color: '#1877F2', fontSize: '1.4rem' }} />
 </div>
 <div>
 <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: 2 }}>Facebook Page</div>
 <div style={{ fontWeight: 700, color: navy, fontSize: '1rem' }}>บ้าน D มีเชง</div>
 <div style={{ fontSize: '0.78rem', color: '#1877F2' }}>ติดตามข่าวสารและทรัพย์ใหม่</div>
 </div>
 </div>
 </a>
 </div>

 <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #e8ecf0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
 <div style={{ background: navy, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
 <i className="fas fa-map-marker-alt" style={{ color: '#4ade80' }} />
 <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>ที่ตั้งสำนักงาน</span>
 </div>
 <iframe
 title="Office Map"
 src="https://maps.google.com/maps?q=87+%E0%B8%96.+%E0%B8%AA%E0%B8%B8%E0%B8%A7%E0%B8%B4%E0%B8%99%E0%B8%97%E0%B8%A7%E0%B8%87%E0%B8%A8%E0%B9%8C+%E0%B9%81%E0%B8%82%E0%B8%A7%E0%B8%87%E0%B8%A1%E0%B8%B5%E0%B8%99%E0%B8%9A%E0%B8%B8%E0%B8%A3%E0%B8%B5+%E0%B9%80%E0%B8%82%E0%B8%95%E0%B8%A1%E0%B8%B5%E0%B8%99%E0%B8%9A%E0%B8%B8%E0%B8%A3%E0%B8%B5+%E0%B8%81%E0%B8%A3%E0%B8%B8%E0%B8%87%E0%B9%80%E0%B8%97%E0%B8%9E%E0%B8%A1%E0%B8%AB%E0%B8%B2%E0%B8%99%E0%B8%84%E0%B8%A3+10510&output=embed&z=15"
 width="100%" height="200" style={{ display: 'block', border: 'none' }} loading="lazy"
 />
 </div>
 </div>

 {/* RIGHT — Inquiry Form (Styled like Property Detail) */}
 <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8ecf0', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
 <div style={{ padding: '32px 28px 24px' }}>
 <h2 style={{ color: navy, fontWeight: 500, fontSize: '1.25rem', marginBottom: 6, fontFamily: "'Prompt', sans-serif" }}>
 ส่งข้อความหาเรา
 </h2>
 <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: 24 }}>กรอกแบบฟอร์มด้านล่าง ทีมงานจะติดต่อกลับโดยเร็ว</p>

 <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
 <div>
 <label style={{ ...labelStyle, fontSize: '0.75rem', fontWeight: 700 }}>เรื่องที่สอบถาม</label>
 <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
 {['ซื้อทรัพย์', 'เช่าทรัพย์', 'สอบถามข้อมูล', 'อื่นๆ'].map(t => (
 <button
 key={t} type="button"
 onClick={() => setInquiryForm(prev => ({ ...prev, type: t }))}
 style={{
 padding: '6px 14px', borderRadius: 50,
 border: `1.5px solid ${inquiryForm.type === t ? brandGreen : '#eee'}`,
 background: inquiryForm.type === t ? 'rgba(161,217,155,0.1)' : '#fff',
 color: inquiryForm.type === t ? navy : '#888',
 fontWeight: inquiryForm.type === t ? 700 : 400,
 fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.15s',
 }}
 >
 {t}
 </button>
 ))}
 </div>
 </div>

 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
 <div>
 <label style={{ ...labelStyle, fontSize: '0.75rem', fontWeight: 700 }}>ชื่อ–นามสกุล *</label>
 <input name="name" value={inquiryForm.name} onChange={handleChange} placeholder="กรอกชื่อของคุณ" required
 style={lightInputStyleSync}
 onFocus={e => { e.target.style.borderColor = navy; e.target.style.boxShadow = `0 0 0 3px rgba(61,122,58,0.08)`; }}
 onBlur={e => { e.target.style.borderColor = '#e5e5e5'; e.target.style.boxShadow = 'none'; }}
 />
 </div>
 <div>
 <label style={{ ...labelStyle, fontSize: '0.75rem', fontWeight: 700 }}>เบอร์โทรศัพท์ *</label>
 <input name="phone" value={inquiryForm.phone} onChange={handleChange} placeholder="0XX-XXX-XXXX" required maxLength={10}
 style={lightInputStyleSync}
 onFocus={e => { e.target.style.borderColor = navy; e.target.style.boxShadow = `0 0 0 3px rgba(61,122,58,0.08)`; }}
 onBlur={e => { e.target.style.borderColor = '#e5e5e5'; e.target.style.boxShadow = 'none'; }}
 />
 </div>
 </div>

 <div>
 <label style={{ ...labelStyle, fontSize: '0.75rem', fontWeight: 700 }}>อีเมล (ไม่บังคับ)</label>
 <input name="email" type="email" value={inquiryForm.email} onChange={handleChange} placeholder="example@email.com"
 style={lightInputStyleSync}
 onFocus={e => { e.target.style.borderColor = navy; e.target.style.boxShadow = `0 0 0 3px rgba(61,122,58,0.08)`; }}
 onBlur={e => { e.target.style.borderColor = '#e5e5e5'; e.target.style.boxShadow = 'none'; }}
 />
 </div>

 <div>
 <label style={{ ...labelStyle, fontSize: '0.75rem', fontWeight: 700 }}>คำถามของคุณ (ไม่บังคับ)</label>
 <input name="topic" value={inquiryForm.topic} onChange={handleChange}
 placeholder="เช่น อยากทราบวงเงินขายฝากสำหรับที่ดิน 2 ไร่"
 style={lightInputStyleSync}
 onFocus={e => { e.target.style.borderColor = navy; e.target.style.boxShadow = `0 0 0 3px rgba(61,122,58,0.08)`; }}
 onBlur={e => { e.target.style.borderColor = '#e5e5e5'; e.target.style.boxShadow = 'none'; }}
 />
 </div>

 <div>
 <label style={{ ...labelStyle, fontSize: '0.75rem', fontWeight: 700 }}>ข้อความ *</label>
 <textarea name="message" value={inquiryForm.message} onChange={handleChange} placeholder="บอกเราว่าต้องการอะไร..." required rows={4}
 style={{ ...lightInputStyleSync, resize: 'vertical' }}
 onFocus={e => { e.target.style.borderColor = navy; e.target.style.boxShadow = `0 0 0 3px rgba(61,122,58,0.08)`; }}
 onBlur={e => { e.target.style.borderColor = '#e5e5e5'; e.target.style.boxShadow = 'none'; }}
 />
 </div>

 {inquiryStatus === 'success' && (
 <div style={{ background: 'rgba(61,122,58,0.06)', color: navy, padding: '10px 14px', fontSize: '0.82rem', fontWeight: 600, borderRadius: 8, border: `1px solid rgba(61,122,58,0.15)` }}>
 <i className="fas fa-check-circle" /> {inquiryMsg}
 </div>
 )}
 {inquiryStatus === 'error' && (
 <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', fontSize: '0.82rem', borderRadius: 8, border: '1px solid #fecdd3' }}>
 <i className="fas fa-exclamation-circle" /> {inquiryMsg}
 </div>
 )}

 <button type="submit" disabled={inquiryStatus === 'sending'}
 style={{
 background: `linear-gradient(135deg, ${brandGreen}, #8BC683)`,
 color: '#1a3a18', border: 'none', padding: '14px', borderRadius: 10,
 fontWeight: 800, fontSize: '1rem', cursor: inquiryStatus === 'sending' ? 'not-allowed' : 'pointer',
 boxShadow: '0 4px 14px rgba(161,217,155,0.3)', transition: 'all 0.2s',
 }}
 onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(161,217,155,0.4)'; }}
 onMouseLeave={e => { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 4px 14px rgba(161,217,155,0.3)'; }}>
 {inquiryStatus === 'sending' ? <><i className="fas fa-spinner fa-spin" /> กำลังส่ง...</> : <><i className="fas fa-paper-plane" /> ส่งข้อความ</>}
 </button>
 </form>
 </div>

 <div style={{ margin: '0 28px', height: 1, background: '#eee' }} />

 <div style={{ padding: '24px 28px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
 <div style={{ textAlign: 'center', color: '#888', fontSize: '0.72rem', letterSpacing: '0.08em', fontWeight: 600 }}>หรือติดต่อผ่าน</div>
 <a href={LINE_URL} target="_blank" rel="noopener noreferrer"
 style={{
 background: '#06C755', color: '#fff', textDecoration: 'none', padding: '12px', borderRadius: 10,
 fontWeight: 800, textAlign: 'center', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
 boxShadow: '0 3px 10px rgba(6,199,85,0.2)', transition: 'all 0.15s',
 }}
 onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
 onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
 <i className="fab fa-line" style={{ fontSize: '1.2rem' }} /> LINE @LoanDD
 </a>
 <div style={{ display: 'flex', justifyContent: 'center', gap: 12, paddingTop: 6 }}>
 {[
 { icon: 'fa-phone', bg: navy, href: `tel:${PHONE}` },
 { icon: 'fab fa-line', bg: '#06C755', href: LINE_URL },
 { icon: 'fab fa-facebook', bg: '#1877F2', href: FB_URL },
 ].map((c, i) => (
 <a key={i} href={c.href} target="_blank" rel="noopener noreferrer"
 style={{ width: 44, height: 44, borderRadius: 10, background: c.bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', textDecoration: 'none', transition: 'all 0.1s' }}
 onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
 onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
 <i className={c.icon.startsWith('fab') ? c.icon : `fas ${c.icon}`} />
 </a>
 ))}
 </div>
 </div>
 </div>
 </div>

 {/* FAQ CTA */}
 <div style={{ marginTop: 48, background: `linear-gradient(135deg, ${navy}, #6aab62)`, borderRadius: 16, padding: '32px 28px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
 <div>
 <h3 style={{ color: '#fff', fontWeight: 800, fontSize: '1.2rem', marginBottom: 6 }}>มีคำถามเบื้องต้น?</h3>
 <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', margin: 0 }}>
 ดูคำถามที่พบบ่อยของเรา — การซื้อ-ขาย เอกสาร ค่าโอน และขั้นตอนต่างๆ
 </p>
 </div>
 <Link to="/faq" style={{
 display: 'inline-flex', alignItems: 'center', gap: 8,
 background: brandGreen, color: '#1a3a18', textDecoration: 'none',
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
