import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import bigLogo from './pic/big-logo.png';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const T = {
  bg: '#A1D99B',
  bgLight: '#8BC683',
  surface: '#faf9f6',
  text: '#1a1a18',
  textSoft: '#6a6560',
  textMuted: '#a8a39d',
  accent: '#8B6914',
  white: '#fff',
  error: '#e53e3e',
  success: '#A1D99B',
};

const UserLogin = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [focusField, setFocusField] = useState(null);
  const navigate = useNavigate();

  const [showForgot, setShowForgot]       = useState(false);
  const [fpData, setFpData]               = useState({ username: '', new_password: '', confirm_password: '' });
  const [fpLoading, setFpLoading]         = useState(false);
  const [fpResult, setFpResult]           = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFpChange = (e) => {
    setFpData({ ...fpData, [e.target.name]: e.target.value });
  };

  const handleFpSubmit = async (e) => {
    e.preventDefault();
    if (fpData.new_password !== fpData.confirm_password) {
      setFpResult({ ok: false, msg: 'รหัสผ่านทั้งสองช่องไม่ตรงกัน' });
      return;
    }
    if (fpData.new_password.length < 6) {
      setFpResult({ ok: false, msg: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
      return;
    }
    setFpLoading(true);
    setFpResult(null);
    try {
      const res  = await fetch(`${BASE_URL}/api/users/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: fpData.username, new_password: fpData.new_password }),
      });
      const data = await res.json();
      if (res.ok) {
        setFpResult({ ok: true, msg: data.message || 'ส่งคำขอเรียบร้อยแล้ว' });
        setFpData({ username: '', new_password: '', confirm_password: '' });
      } else {
        setFpResult({ ok: false, msg: data.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
      }
    } catch {
      setFpResult({ ok: false, msg: 'เชื่อมต่อ Server ไม่ได้' });
    } finally {
      setFpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('authChange'));
        navigate('/');
      } else {
        setLoginError(data.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      console.error(err);
      setLoginError('เชื่อมต่อ Server ไม่ได้ กรุณาตรวจสอบว่า server เปิดอยู่');
    } finally {
      setLoginLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width: '100%',
    padding: '14px 0 10px',
    border: 'none',
    borderBottom: `2px solid ${focusField === field ? T.accent : '#e0ddd8'}`,
    background: 'transparent',
    fontSize: '0.92rem',
    fontFamily: "'Sarabun', sans-serif",
    color: T.text,
    outline: 'none',
    transition: 'border-color 0.3s',
    letterSpacing: '0.01em',
  });

  const labelStyle = (field) => ({
    fontSize: '0.68rem',
    fontWeight: 700,
    color: focusField === field ? T.accent : T.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    fontFamily: "'Manrope', sans-serif",
    marginBottom: 2,
    transition: 'color 0.3s',
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', minHeight: '100vh',
      fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif",
    }}>
      {/* ===== LEFT: Brand Panel ===== */}
      <div className="login-brand-panel" style={{
        flex: '0 0 45%',
        background: `linear-gradient(160deg, ${T.bg} 0%, ${T.bgLight} 50%, #6aab62 100%)`,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '60px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: -80, right: -80,
          width: 300, height: 300, borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
        }} />
        <div style={{
          position: 'absolute', bottom: -120, left: -60,
          width: 400, height: 400, borderRadius: '50%',
          background: 'rgba(255,255,255,0.02)',
        }} />

        {/* Logo */}
        <img src={bigLogo} alt="บ้าน D มีเชง"
          style={{ height: 80, objectFit: 'contain', marginBottom: 32, position: 'relative' }} />

        {/* Brand text */}
        <div style={{ textAlign: 'center', position: 'relative' }}>
          <div style={{
            color: T.accent, fontSize: '0.62rem', letterSpacing: '0.3em',
            textTransform: 'uppercase', fontWeight: 700, marginBottom: 12,
            fontFamily: "'Manrope', sans-serif",
          }}>
            Premium Real Estate
          </div>
          <h1 style={{
            color: '#1a3a18', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
            fontWeight: 300, lineHeight: 1.3, margin: '0 0 16px',
            fontFamily: "'Manrope', sans-serif",
            letterSpacing: '-0.02em',
          }}>
            ค้นหาบ้านในฝัน<br />กับ บ้าน D มีเชง
          </h1>
          <p style={{
            color: 'rgba(26,58,24,0.6)', fontSize: '0.85rem',
            maxWidth: 320, lineHeight: 1.7,
          }}>
            อสังหาริมทรัพย์คุณภาพ ผ่านการตรวจสอบทุกรายการ ราคาเป็นธรรม ไม่มีค่าคอมมิชชันแอบแฝง
          </p>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: 40, marginTop: 40,
          position: 'relative',
        }}>
          {[
            { value: '100+', label: 'ทรัพย์สิน' },
            { value: '7', label: 'วัน/สัปดาห์' },
            { value: '100%', label: 'ตรวจสอบแล้ว' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                color: T.accent, fontSize: '1.3rem', fontWeight: 800,
                fontFamily: "'Manrope', sans-serif",
              }}>{s.value}</div>
              <div style={{
                color: 'rgba(26,58,24,0.5)', fontSize: '0.68rem',
                letterSpacing: '0.05em', marginTop: 2,
              }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== RIGHT: Login Form ===== */}
      <div style={{
        flex: 1, background: T.surface,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '48px 32px',
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
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
          <div style={{ marginBottom: 40 }}>
            <div style={{
              width: 32, height: 2, background: T.accent, marginBottom: 20,
            }} />
            <h2 style={{
              fontSize: '1.6rem', fontWeight: 800, color: T.text,
              fontFamily: "'Manrope', sans-serif", margin: '0 0 6px',
              letterSpacing: '-0.02em',
            }}>
              เข้าสู่ระบบ
            </h2>
            <p style={{ color: T.textMuted, fontSize: '0.85rem', margin: 0 }}>
              ยินดีต้อนรับกลับมา
            </p>
          </div>

          {/* Login Form */}
          {!showForgot ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <label style={labelStyle('username')}>ชื่อผู้ใช้งาน</label>
                <input
                  type="text" name="username"
                  value={formData.username}
                  onChange={handleChange}
                  onFocus={() => setFocusField('username')}
                  onBlur={() => setFocusField(null)}
                  required
                  placeholder="กรอกชื่อผู้ใช้"
                  style={inputStyle('username')}
                />
              </div>
              <div>
                <label style={labelStyle('password')}>รหัสผ่าน</label>
                <input
                  type="password" name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setFocusField('password')}
                  onBlur={() => setFocusField(null)}
                  required
                  placeholder="กรอกรหัสผ่าน"
                  style={inputStyle('password')}
                />
              </div>

              {loginError && (
                <div style={{
                  padding: '12px 16px', background: 'rgba(229,62,62,0.06)',
                  borderLeft: `3px solid ${T.error}`,
                  color: T.error, fontSize: '0.82rem', fontWeight: 600,
                }}>
                  <i className="fas fa-exclamation-circle" style={{ marginRight: 8 }} />
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                style={{
                  width: '100%', padding: '14px',
                  background: loginLoading ? T.textMuted : T.bg,
                  color: '#1a3a18', border: 'none',
                  fontSize: '0.9rem', fontWeight: 700,
                  cursor: loginLoading ? 'not-allowed' : 'pointer',
                  fontFamily: "'Manrope', sans-serif",
                  letterSpacing: '0.05em',
                  transition: 'all 0.3s',
                  marginTop: 8,
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => { if (!loginLoading) e.currentTarget.style.background = T.bgLight; }}
                onMouseLeave={e => { if (!loginLoading) e.currentTarget.style.background = T.bg; }}
              >
                {loginLoading ? (
                  <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />กำลังเข้าสู่ระบบ...</>
                ) : (
                  'เข้าสู่ระบบ'
                )}
              </button>

              {/* Forgot password link */}
              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => { setShowForgot(true); setFpResult(null); }}
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    color: T.textMuted, fontSize: '0.78rem', cursor: 'pointer',
                    fontFamily: "'Manrope', sans-serif",
                    letterSpacing: '0.03em',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = T.accent}
                  onMouseLeave={e => e.currentTarget.style.color = T.textMuted}
                >
                  ลืมรหัสผ่าน?
                </button>
              </div>
            </form>
          ) : (
            /* ===== Forgot Password Form ===== */
            <div>
              <button
                type="button"
                onClick={() => { setShowForgot(false); setFpResult(null); }}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  color: T.textSoft, fontSize: '0.8rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  marginBottom: 24, fontFamily: "'Manrope', sans-serif",
                }}
              >
                <i className="fas fa-arrow-left" style={{ fontSize: '0.7rem' }} /> กลับไปเข้าสู่ระบบ
              </button>

              <div style={{
                background: T.white, padding: '28px 24px',
                border: `1px solid #e8e5e0`,
              }}>
                <div style={{
                  fontSize: '0.62rem', color: T.accent, textTransform: 'uppercase',
                  letterSpacing: '0.2em', fontWeight: 700, marginBottom: 6,
                  fontFamily: "'Manrope', sans-serif",
                }}>
                  Password Reset
                </div>
                <h3 style={{
                  fontSize: '1.1rem', fontWeight: 800, color: T.text,
                  fontFamily: "'Manrope', sans-serif", margin: '0 0 8px',
                }}>
                  ขอรีเซ็ตรหัสผ่าน
                </h3>
                <p style={{ fontSize: '0.78rem', color: T.textMuted, marginBottom: 20, lineHeight: 1.6 }}>
                  กรอกชื่อผู้ใช้และรหัสผ่านใหม่ที่ต้องการ แอดมินจะตรวจสอบและอนุมัติ
                </p>

                {fpResult && (
                  <div style={{
                    padding: '10px 14px', marginBottom: 16,
                    background: fpResult.ok ? 'rgba(0,50,42,0.06)' : 'rgba(229,62,62,0.06)',
                    borderLeft: `3px solid ${fpResult.ok ? T.success : T.error}`,
                    color: fpResult.ok ? T.success : T.error,
                    fontSize: '0.8rem', fontWeight: 600,
                  }}>
                    <i className={`fas ${fpResult.ok ? 'fa-check-circle' : 'fa-exclamation-circle'}`} style={{ marginRight: 6 }} />
                    {fpResult.msg}
                  </div>
                )}

                <form onSubmit={handleFpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <label style={labelStyle('fp-user')}>ชื่อผู้ใช้งาน</label>
                    <input type="text" name="username" value={fpData.username}
                      onChange={handleFpChange} required placeholder="ชื่อผู้ใช้"
                      onFocus={() => setFocusField('fp-user')}
                      onBlur={() => setFocusField(null)}
                      style={inputStyle('fp-user')} />
                  </div>
                  <div>
                    <label style={labelStyle('fp-pw')}>รหัสผ่านใหม่</label>
                    <input type="password" name="new_password" value={fpData.new_password}
                      onChange={handleFpChange} required placeholder="อย่างน้อย 6 ตัว"
                      onFocus={() => setFocusField('fp-pw')}
                      onBlur={() => setFocusField(null)}
                      style={inputStyle('fp-pw')} />
                  </div>
                  <div>
                    <label style={labelStyle('fp-pw2')}>ยืนยันรหัสผ่านใหม่</label>
                    <input type="password" name="confirm_password" value={fpData.confirm_password}
                      onChange={handleFpChange} required placeholder="กรอกซ้ำอีกครั้ง"
                      onFocus={() => setFocusField('fp-pw2')}
                      onBlur={() => setFocusField(null)}
                      style={inputStyle('fp-pw2')} />
                  </div>
                  <button type="submit" disabled={fpLoading}
                    style={{
                      width: '100%', padding: '12px',
                      background: fpLoading ? T.textMuted : T.accent,
                      color: fpLoading ? T.white : T.bg,
                      border: 'none', fontWeight: 800, fontSize: '0.85rem',
                      cursor: fpLoading ? 'not-allowed' : 'pointer',
                      fontFamily: "'Manrope', sans-serif",
                      letterSpacing: '0.05em',
                    }}>
                    {fpLoading ? 'กำลังส่งคำขอ...' : 'ส่งคำขอรีเซ็ต'}
                  </button>
                </form>
              </div>
            </div>
          )}

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

          {/* Register link */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: T.textMuted, fontSize: '0.82rem', margin: '0 0 8px' }}>
              ยังไม่มีบัญชีสมาชิก?
            </p>
            <Link
              to="/register"
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
              onMouseEnter={e => { e.currentTarget.style.background = T.bg; e.currentTarget.style.color = '#1a3a18'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.bg; }}
            >
              สมัครสมาชิกใหม่
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

      {/* ===== Responsive ===== */}
      <style>{`
        @media (max-width: 768px) {
          .login-brand-panel {
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

export default UserLogin;
