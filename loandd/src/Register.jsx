import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import bigLogo from './pic/big-logo.png';

const T = {
  bg: '#1A8C6E',
  bgLight: '#004d40',
  surface: '#faf9f6',
  text: '#1a1a18',
  textSoft: '#6a6560',
  textMuted: '#a8a39d',
  accent: '#c9a84c',
  white: '#fff',
  error: '#e53e3e',
  success: '#1A8C6E',
};

const Register = () => {
  const [formData, setFormData] = useState({
    username: '', password: '', confirmPassword: '', email: '', phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [focusField, setFocusField] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          email: formData.email,
          phone: formData.phone
        }),
      });
      const text = await res.text();
      if (res.ok) {
        setSuccess('สมัครสมาชิกสำเร็จ! กำลังพาไปเข้าสู่ระบบ...');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError(text || 'สมัครไม่สำเร็จ กรุณาลองใหม่');
      }
    } catch (err) {
      console.error('Register Error:', err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ Server');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width: '100%',
    padding: '14px 0 10px',
    border: 'none',
    borderBottom: `2px solid ${focusField === field ? T.accent : '#e0ddd8'}`,
    background: 'transparent',
    fontSize: '0.9rem',
    fontFamily: "'Sarabun', sans-serif",
    color: T.text,
    outline: 'none',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box',
  });

  const labelStyle = (field) => ({
    fontSize: '0.65rem',
    fontWeight: 700,
    color: focusField === field ? T.accent : T.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    fontFamily: "'Manrope', sans-serif",
    marginBottom: 2,
    transition: 'color 0.3s',
    display: 'block',
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', minHeight: '100vh',
      fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif",
    }}>
      {/* ===== LEFT: Brand Panel ===== */}
      <div className="register-brand-panel" style={{
        flex: '0 0 45%',
        background: `linear-gradient(160deg, ${T.bg} 0%, ${T.bgLight} 50%, #006b5a 100%)`,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '60px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative */}
        <div style={{
          position: 'absolute', top: -100, left: -100,
          width: 350, height: 350, borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
        }} />
        <div style={{
          position: 'absolute', bottom: -80, right: -80,
          width: 280, height: 280, borderRadius: '50%',
          background: 'rgba(255,255,255,0.02)',
        }} />

        <img src={bigLogo} alt="บ้าน D มีเชง"
          style={{ height: 80, objectFit: 'contain', marginBottom: 32, position: 'relative' }} />

        <div style={{ textAlign: 'center', position: 'relative' }}>
          <div style={{
            color: T.accent, fontSize: '0.62rem', letterSpacing: '0.3em',
            textTransform: 'uppercase', fontWeight: 700, marginBottom: 12,
            fontFamily: "'Manrope', sans-serif",
          }}>
            Join Us Today
          </div>
          <h1 style={{
            color: T.white, fontSize: 'clamp(1.4rem, 3vw, 2rem)',
            fontWeight: 300, lineHeight: 1.3, margin: '0 0 16px',
            fontFamily: "'Manrope', sans-serif",
            letterSpacing: '-0.02em',
          }}>
            เริ่มต้นค้นหา<br />อสังหาริมทรัพย์ในฝัน
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem',
            maxWidth: 320, lineHeight: 1.7,
          }}>
            สมัครสมาชิกฟรี เพื่อบันทึกทรัพย์ที่สนใจ ติดตามราคา และรับการแจ้งเตือนทรัพย์ใหม่ก่อนใคร
          </p>
        </div>

        {/* Benefits */}
        <div style={{ marginTop: 40, position: 'relative', width: '100%', maxWidth: 280 }}>
          {[
            { icon: 'fa-heart', text: 'บันทึกทรัพย์ที่ชอบไว้ดูภายหลัง' },
            { icon: 'fa-bell', text: 'รับแจ้งเตือนทรัพย์ใหม่ตรงใจ' },
            { icon: 'fa-shield-alt', text: 'ข้อมูลปลอดภัย ไม่แชร์กับบุคคลที่สาม' },
          ].map((b, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              marginBottom: 16,
            }}>
              <div style={{
                width: 32, height: 32, flexShrink: 0,
                background: 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className={`fas ${b.icon}`} style={{ color: T.accent, fontSize: '0.75rem' }} />
              </div>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
                {b.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== RIGHT: Register Form ===== */}
      <div style={{
        flex: 1, background: T.surface,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '48px 32px',
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Back button */}
          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: T.textMuted, fontSize: '0.8rem', textDecoration: 'none',
            fontFamily: "'Manrope', sans-serif", marginBottom: 20,
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = T.bg}
            onMouseLeave={e => e.currentTarget.style.color = T.textMuted}
          >
            <i className="fas fa-arrow-left" style={{ fontSize: '0.7rem' }} />
            กลับหน้าหลัก
          </Link>

          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ width: 32, height: 2, background: T.accent, marginBottom: 20 }} />
            <h2 style={{
              fontSize: '1.5rem', fontWeight: 800, color: T.text,
              fontFamily: "'Manrope', sans-serif", margin: '0 0 6px',
              letterSpacing: '-0.02em',
            }}>
              สมัครสมาชิก
            </h2>
            <p style={{ color: T.textMuted, fontSize: '0.85rem', margin: 0 }}>
              สร้างบัญชีใหม่เพื่อเริ่มต้นใช้งาน
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {/* Username */}
            <div>
              <label style={labelStyle('username')}>ชื่อผู้ใช้งาน</label>
              <input type="text" name="username" value={formData.username}
                onChange={handleChange} required placeholder="ตั้งชื่อผู้ใช้"
                onFocus={() => setFocusField('username')}
                onBlur={() => setFocusField(null)}
                style={inputStyle('username')} />
            </div>

            {/* Password row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={labelStyle('password')}>รหัสผ่าน</label>
                <input type="password" name="password" value={formData.password}
                  onChange={handleChange} required placeholder="อย่างน้อย 6 ตัว"
                  onFocus={() => setFocusField('password')}
                  onBlur={() => setFocusField(null)}
                  style={inputStyle('password')} />
              </div>
              <div>
                <label style={labelStyle('confirmPassword')}>ยืนยันรหัสผ่าน</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword}
                  onChange={handleChange} required placeholder="กรอกซ้ำอีกครั้ง"
                  onFocus={() => setFocusField('confirmPassword')}
                  onBlur={() => setFocusField(null)}
                  style={inputStyle('confirmPassword')} />
              </div>
            </div>

            {/* Contact row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={labelStyle('email')}>อีเมล</label>
                <input type="email" name="email" value={formData.email}
                  onChange={handleChange} required placeholder="your@email.com"
                  onFocus={() => setFocusField('email')}
                  onBlur={() => setFocusField(null)}
                  style={inputStyle('email')} />
              </div>
              <div>
                <label style={labelStyle('phone')}>เบอร์โทรศัพท์</label>
                <input type="tel" name="phone" value={formData.phone}
                  onChange={handleChange} required placeholder="08X-XXX-XXXX"
                  onFocus={() => setFocusField('phone')}
                  onBlur={() => setFocusField(null)}
                  style={inputStyle('phone')} maxLength={10} />
              </div>
            </div>

            {/* Error / Success */}
            {error && (
              <div style={{
                padding: '12px 16px', background: 'rgba(229,62,62,0.06)',
                borderLeft: `3px solid ${T.error}`,
                color: T.error, fontSize: '0.82rem', fontWeight: 600,
              }}>
                <i className="fas fa-exclamation-circle" style={{ marginRight: 8 }} />
                {error}
              </div>
            )}
            {success && (
              <div style={{
                padding: '12px 16px', background: 'rgba(0,50,42,0.06)',
                borderLeft: `3px solid ${T.success}`,
                color: T.success, fontSize: '0.82rem', fontWeight: 600,
              }}>
                <i className="fas fa-check-circle" style={{ marginRight: 8 }} />
                {success}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading ? T.textMuted : T.bg,
                color: T.white, border: 'none',
                fontSize: '0.9rem', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: "'Manrope', sans-serif",
                letterSpacing: '0.05em',
                transition: 'all 0.3s',
                marginTop: 4,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = T.bgLight; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = T.bg; }}
            >
              {loading ? (
                <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />กำลังดำเนินการ...</>
              ) : (
                'สมัครสมาชิก'
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            margin: '32px 0',
          }}>
            <div style={{ flex: 1, height: 1, background: '#e8e5e0' }} />
            <span style={{
              fontSize: '0.68rem', color: T.textMuted, letterSpacing: '0.1em',
              fontFamily: "'Manrope', sans-serif",
            }}>
              หรือ
            </span>
            <div style={{ flex: 1, height: 1, background: '#e8e5e0' }} />
          </div>

          {/* Login link */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: T.textMuted, fontSize: '0.82rem', margin: '0 0 8px' }}>
              มีบัญชีอยู่แล้ว?
            </p>
            <Link to="/login"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 32px',
                border: `1.5px solid ${T.bg}`,
                background: 'transparent', color: T.bg,
                textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700,
                fontFamily: "'Manrope', sans-serif",
                letterSpacing: '0.05em',
                transition: 'all 0.3s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = T.bg; e.currentTarget.style.color = T.white; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.bg; }}
            >
              เข้าสู่ระบบ
              <i className="fas fa-arrow-right" style={{ fontSize: '0.7rem' }} />
            </Link>
          </div>

          {/* Footer */}
          <div style={{
            textAlign: 'center', marginTop: 40,
            fontSize: '0.68rem', color: T.textMuted,
            letterSpacing: '0.05em',
          }}>
            บ้าน D มีเชง &copy; {new Date().getFullYear()}
          </div>
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 768px) {
          .register-brand-panel {
            display: none !important;
          }
        }
        input::placeholder {
          color: #c5c0ba;
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  );
};

export default Register;
