import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import bigLogo from './pic/big-logo.png';

const API = 'http://localhost:3001';


export default function AdminLogin() {
  const [form, setForm]       = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  // ถ้า login แล้ว → redirect ทันที
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const admin = localStorage.getItem('adminUser');
    if (token && admin) navigate('/dashboard');
  }, [navigate]);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError('กรุณากรอก Username และ Password');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res  = await fetch(`${API}/api/admin/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
        return;
      }

      // เก็บ token แยกจาก token ของผู้ใช้ทั่วไป
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser',  JSON.stringify(data.admin));
      window.dispatchEvent(new Event('adminAuthChange'));

      navigate('/dashboard');

    } catch {
      setError('ไม่สามารถเชื่อมต่อ Server ได้ กรุณาตรวจสอบว่า Server รันอยู่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={css.page}>

      {/* ── ซ้าย: Brand Panel ── */}
      <div className="admin-brand" style={css.brand}>
        <div style={css.brandInner}>
          <img src={bigLogo} alt="บ้าน D มีเชง" style={{ height: 64, objectFit: 'contain', marginBottom: 28 }} />
          <h1 style={{ margin: '0 0 8px', fontSize: '1.6rem', fontWeight: 800, color: '#1a3a18' }}>
            Property Admin
          </h1>
          <p style={{ margin: '0 0 36px', color: 'rgba(26,58,24,0.65)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            ระบบจัดการอสังหาริมทรัพย์<br />สำหรับเจ้าหน้าที่ บ้าน D มีเชง เท่านั้น
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: 'fa-home', text: 'จัดการทรัพย์สิน 16 หลัง' },
              { icon: 'fa-camera', text: 'อัพโหลดรูปภาพและ VDO Tour' },
              { icon: 'fa-envelope', text: 'รับและจัดการ Inquiry' },
              { icon: 'fa-chart-bar', text: 'ติดตามสถานะการขาย' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(26,58,24,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                  <i className={`fas ${f.icon}`} style={{ color: '#3a6a35', fontSize: '0.95rem' }} />
                </div>
                <span style={{ color: 'rgba(26,58,24,0.8)', fontSize: '0.87rem' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ขวา: Login Form ── */}
      <div className="admin-form-side" style={css.formSide}>
        <div style={css.card}>

          {/* Back button */}
          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: '#9ca3af', fontSize: '0.8rem', textDecoration: 'none',
            fontFamily: "'Sarabun', sans-serif", marginBottom: 16,
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#A1D99B'}
            onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
          >
            <i className="fas fa-arrow-left" style={{ fontSize: '0.7rem' }} />
            กลับหน้าหลัก
          </Link>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 20, padding: '4px 12px', marginBottom: 14 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#A1D99B', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#3d7a3a', letterSpacing: '0.5px' }}>ADMIN PORTAL</span>
            </div>
            <h2 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 800, color: '#6aab62' }}>
              เข้าสู่ระบบ
            </h2>
            <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.83rem' }}>
              ใช้บัญชีเจ้าหน้าที่ บ้าน D มีเชง ในการเข้าสู่ระบบ
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={css.errorBox}>
              <i className="fas fa-exclamation-triangle" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} autoComplete="off">

            {/* Username */}
            <div style={{ marginBottom: 16 }}>
              <label style={css.label}>Username หรือ Email</label>
              <div style={{ position: 'relative' }}>
                <i className="fas fa-user" style={css.inputIcon} />
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="username หรือ email"
                  style={css.input}
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 22 }}>
              <label style={css.label}>Password</label>
              <div style={{ position: 'relative' }}>
                <i className="fas fa-lock" style={css.inputIcon} />
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  style={{ ...css.input, paddingRight: 44 }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, fontSize: '0.85rem' }}
                  tabIndex={-1}
                >
                  <i className={`fas fa-eye${showPass ? '-slash' : ''}`} />
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" style={css.btn(loading)} disabled={loading}>
              {loading ? (
                <><i className="fas fa-circle-notch fa-spin" style={{ marginRight: 8 }} />กำลังเข้าสู่ระบบ...</>
              ) : (
                <><i className="fas fa-sign-in-alt" style={{ marginRight: 8 }} />เข้าสู่ระบบ</>
              )}
            </button>
          </form>

          {/* Footer */}
          <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
            {/* ปุ่มลงทะเบียนแอดมิน — เฉพาะ super_admin */}
            <Link
              to="/admin/register"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 18px',
                background: 'linear-gradient(135deg, #f0f4ff, #e8f5e9)',
                border: '1.5px solid #c7d7f0',
                borderRadius: 22,
                color: '#6aab62',
                fontSize: '0.78rem',
                fontWeight: 700,
                textDecoration: 'none',
                marginBottom: 14,
                transition: 'all 0.2s',
                fontFamily: "'Sarabun', sans-serif",
              }}
            >
              <i className="fas fa-user-plus" style={{ color: '#3d7a3a' }} />
              สร้างบัญชีแอดมินใหม่
              <span style={{ background: '#3d7a3a', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: '0.62rem', fontWeight: 700 }}>
                Super Admin
              </span>
            </Link>
            <p style={{ margin: '0 0 4px', fontSize: '0.72rem', color: '#d1d5db', letterSpacing: '0.5px' }}>
              🔒 AUTHORIZED PERSONNEL ONLY
            </p>
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#d1d5db' }}>
              © บ้าน D มีเชง Property System 2026
            </p>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @media (max-width: 768px) {
          .admin-brand { display: none !important; }
          .admin-form-side {
            padding: 20px 12px !important;
            min-height: 100vh;
            justify-content: flex-start !important;
            padding-top: 40px !important;
          }
          .admin-form-side > div {
            padding: 24px 18px !important;
            box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;
          }
        }
      `}</style>
    </div>
  );
}

// ── Styles ──
const css = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    fontFamily: "'Sarabun', sans-serif",
    background: '#f8faff',
  },
  brand: {
    width: '420px',
    flexShrink: 0,
    background: 'linear-gradient(145deg, #4a8a43 0%, #6aab62 60%, #A1D99B 160%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 36px',
  },
  brandInner: {
    maxWidth: 320,
  },
  formSide: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 24px',
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: '36px 32px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    border: '1px solid #e5e7eb',
  },
  label: {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '10px 12px 10px 38px',
    border: '1.5px solid #e5e7eb',
    borderRadius: 9,
    fontSize: '0.9rem',
    fontFamily: "'Sarabun', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    background: '#fafafa',
    color: '#111827',
  },
  inputIcon: {
    position: 'absolute',
    left: 13,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
    fontSize: '0.85rem',
    pointerEvents: 'none',
  },
  btn: (loading) => ({
    width: '100%',
    padding: '12px',
    background: loading ? '#9ca3af' : 'linear-gradient(135deg, #6aab62, #4a8a43)',
    color: '#fff',
    border: 'none',
    borderRadius: 9,
    fontSize: '0.95rem',
    fontWeight: 700,
    cursor: loading ? 'not-allowed' : 'pointer',
    fontFamily: "'Sarabun', sans-serif",
    transition: 'all 0.2s',
    boxShadow: loading ? 'none' : '0 4px 14px rgba(26,60,110,0.3)',
  }),
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: '#fff5f5',
    border: '1px solid #fecaca',
    borderRadius: 9,
    padding: '10px 14px',
    color: '#dc2626',
    fontSize: '0.83rem',
    marginBottom: 16,
  },
};
