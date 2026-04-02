import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import bigLogo from './pic/big-logo.png';

const API = 'http://localhost:3001';

export default function AdminRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username:     '',
    full_name:    '',
    display_name: '',
    email:        '',
    password:     '',
    confirm:      '',
    phone:        '',
    line_id:      '',
  });

  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
    setSuccess('');
  };

  const validate = () => {
    if (!form.username.trim())    return 'กรุณาระบุ Username';
    if (form.username.length < 4) return 'Username ต้องมีอย่างน้อย 4 ตัวอักษร';
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) return 'Username ใช้ได้เฉพาะ a-z, 0-9, _';
    if (!form.full_name.trim())   return 'กรุณาระบุชื่อ-นามสกุล';
    if (!form.email.trim())       return 'กรุณาระบุ Email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'รูปแบบ Email ไม่ถูกต้อง';
    if (!form.password)           return 'กรุณาระบุ Password';
    if (form.password.length < 8) return 'Password ต้องมีอย่างน้อย 8 ตัวอักษร';
    if (form.password !== form.confirm) return 'Password ยืนยันไม่ตรงกัน';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API}/api/admin/auth/create`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username:     form.username.trim(),
          full_name:    form.full_name.trim(),
          display_name: form.display_name.trim() || null,
          email:        form.email.trim(),
          password:     form.password,
          phone:        form.phone.trim() || null,
          line_id:      form.line_id.trim() || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setError(data.error || 'Username หรือ Email นี้มีอยู่ในระบบแล้ว');
        } else {
          setError(data.error || 'สร้างบัญชีไม่สำเร็จ');
        }
        return;
      }

      setSuccess(`✅ สร้างบัญชี "${form.username}" สำเร็จแล้ว! กำลังพาไปหน้า Login...`);

      // Redirect to admin login after 1.5s
      setTimeout(() => navigate('/admin'), 1500);

    } catch {
      setError('ไม่สามารถเชื่อมต่อ Server ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={css.page}>

      {/* ── ซ้าย: Brand Panel ── */}
      <div style={css.brand}>
        <div style={css.brandInner}>
          <img src={bigLogo} alt="บ้าน D มีเชง" style={{ height: 64, objectFit: 'contain', marginBottom: 28 }} />
          <h1 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
            เพิ่มบัญชีแอดมิน
          </h1>
          <p style={{ margin: '0 0 32px', color: 'rgba(255,255,255,0.65)', fontSize: '0.87rem', lineHeight: 1.7 }}>
            สร้างบัญชีเจ้าหน้าที่ บ้าน D มีเชง<br />สำหรับจัดการระบบอสังหาริมทรัพย์
          </p>

          {/* Features list */}
          <div style={{ marginTop: 28 }}>
            {[
              { icon: '🔐', text: 'บัญชีใหม่ login ได้ทันที' },
              { icon: '✏️', text: 'จัดการทรัพย์สิน เพิ่ม/แก้ไข/ลบ' },
              { icon: '📬', text: 'ดู Inquiry จากผู้สนใจ' },
              { icon: '🔑', text: 'เปลี่ยนรหัสผ่านได้เองหลัง login' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>
                  {f.icon}
                </div>
                <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ขวา: Register Form ── */}
      <div style={css.formSide}>
        <div style={css.card}>

          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 20, padding: '4px 12px' }}>
                <i className="fas fa-user-plus" style={{ color: '#04AA6D', fontSize: '0.7rem' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#04AA6D', letterSpacing: '0.5px' }}>NEW ADMIN</span>
              </div>
              <Link to="/admin/properties" style={{ color: '#9ca3af', fontSize: '0.78rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
                <i className="fas fa-arrow-left" style={{ fontSize: '0.7rem' }} />
                กลับ Dashboard
              </Link>
            </div>
            <h2 style={{ margin: '0 0 4px', fontSize: '1.35rem', fontWeight: 800, color: '#1a3c6e' }}>
              สร้างบัญชีเจ้าหน้าที่
            </h2>
            <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.82rem' }}>
              กรอกข้อมูลบัญชีที่ต้องการสร้าง
            </p>
          </div>

          {/* Alert */}
          {error && (
            <div style={css.alertBox('#fff5f5', '#fecaca', '#dc2626')}>
              <i className="fas fa-exclamation-circle" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div style={css.alertBox('#f0fdf4', '#bbf7d0', '#047857')}>
              <i className="fas fa-check-circle" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off">

            {/* Row 1: Username + Full Name */}
            <div style={css.row2}>
              <div>
                <label style={css.label}>Username <span style={css.req}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <i className="fas fa-at" style={css.icon} />
                  <input type="text" name="username" value={form.username} onChange={handleChange}
                    placeholder="เช่น admin001" style={css.input} autoComplete="off" />
                </div>
                <div style={css.hint}>a-z, 0-9, _ / อย่างน้อย 4 ตัว</div>
              </div>
              <div>
                <label style={css.label}>ชื่อ-นามสกุล <span style={css.req}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <i className="fas fa-id-card" style={css.icon} />
                  <input type="text" name="full_name" value={form.full_name} onChange={handleChange}
                    placeholder="ชื่อจริง นามสกุล" style={css.input} autoComplete="off" />
                </div>
              </div>
            </div>

            {/* Row 2: Display Name + Email */}
            <div style={css.row2}>
              <div>
                <label style={css.label}>ชื่อที่แสดง</label>
                <div style={{ position: 'relative' }}>
                  <i className="fas fa-user-tag" style={css.icon} />
                  <input type="text" name="display_name" value={form.display_name} onChange={handleChange}
                    placeholder="ชื่อเล่น (optional)" style={css.input} autoComplete="off" />
                </div>
              </div>
              <div>
                <label style={css.label}>Email <span style={css.req}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <i className="fas fa-envelope" style={css.icon} />
                  <input type="email" name="email" value={form.email} onChange={handleChange}
                    placeholder="email@loandd.com" style={css.input} autoComplete="off" />
                </div>
              </div>
            </div>

            {/* Row 3: Password */}
            <div style={css.row2}>
              <div>
                <label style={css.label}>Password <span style={css.req}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <i className="fas fa-lock" style={css.icon} />
                  <input type={showPass ? 'text' : 'password'} name="password" value={form.password}
                    onChange={handleChange} placeholder="อย่างน้อย 8 ตัวอักษร"
                    style={{ ...css.input, paddingRight: 40 }} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPass(s => !s)} style={css.eyeBtn}>
                    <i className={`fas fa-eye${showPass ? '-slash' : ''}`} />
                  </button>
                </div>
              </div>
              <div>
                <label style={css.label}>ยืนยัน Password <span style={css.req}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <i className="fas fa-lock" style={css.icon} />
                  <input type={showConfirm ? 'text' : 'password'} name="confirm" value={form.confirm}
                    onChange={handleChange} placeholder="พิมพ์รหัสผ่านซ้ำ"
                    style={{ ...css.input, paddingRight: 40, borderColor: form.confirm && form.confirm !== form.password ? '#fca5a5' : undefined }}
                    autoComplete="new-password" />
                  <button type="button" onClick={() => setShowConfirm(s => !s)} style={css.eyeBtn}>
                    <i className={`fas fa-eye${showConfirm ? '-slash' : ''}`} />
                  </button>
                </div>
                {form.confirm && form.confirm !== form.password && (
                  <div style={{ ...css.hint, color: '#ef4444' }}>รหัสผ่านไม่ตรงกัน</div>
                )}
              </div>
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="submit" style={css.btnPrimary(loading)} disabled={loading}>
                {loading
                  ? <><i className="fas fa-circle-notch fa-spin" style={{ marginRight: 8 }} />กำลังสร้างบัญชี...</>
                  : <><i className="fas fa-user-plus" style={{ marginRight: 8 }} />สร้างบัญชี</>
                }
              </button>
              <Link to="/admin/properties" style={css.btnCancel}>ยกเลิก</Link>
            </div>

          </form>
        </div>

        <p style={{ marginTop: 14, textAlign: 'center', fontSize: '0.72rem', color: '#d1d5db' }}>
          🔒 สำหรับเจ้าหน้าที่ บ้าน D มีเชง เท่านั้น
        </p>
      </div>
    </div>
  );
}

const css = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    fontFamily: "'Sarabun', sans-serif",
    background: '#f8faff',
  },
  brand: {
    width: '360px',
    flexShrink: 0,
    background: 'linear-gradient(145deg, #0d2347 0%, #1a3c6e 60%, #04AA6D 160%)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '48px 32px',
    overflowY: 'auto',
  },
  brandInner: { maxWidth: 280, width: '100%' },
  formSide: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '48px 24px',
    overflowY: 'auto',
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: '32px 28px',
    width: '100%',
    maxWidth: 620,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    border: '1px solid #e5e7eb',
  },
  row2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginBottom: 16,
  },
  label: {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: 700,
    color: '#374151',
    marginBottom: 5,
  },
  req: { color: '#ef4444' },
  hint: { fontSize: '0.68rem', color: '#9ca3af', marginTop: 4 },
  input: {
    width: '100%',
    padding: '9px 11px 9px 36px',
    border: '1.5px solid #e5e7eb',
    borderRadius: 9,
    fontSize: '0.87rem',
    fontFamily: "'Sarabun', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
    background: '#ffffff',
    color: '#111827',
    transition: 'border-color 0.2s',
  },
  icon: {
    position: 'absolute',
    left: 11,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
    fontSize: '0.78rem',
    pointerEvents: 'none',
  },
  eyeBtn: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#9ca3af',
    padding: 4,
    fontSize: '0.8rem',
  },
  alertBox: (bg, border, text) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: 9,
    padding: '10px 14px',
    color: text,
    fontSize: '0.83rem',
    marginBottom: 16,
  }),
  btnPrimary: (loading) => ({
    flex: 1,
    padding: '11px',
    background: loading ? '#9ca3af' : 'linear-gradient(135deg, #1a3c6e, #0d2347)',
    color: '#fff',
    border: 'none',
    borderRadius: 9,
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: loading ? 'not-allowed' : 'pointer',
    fontFamily: "'Sarabun', sans-serif",
    boxShadow: loading ? 'none' : '0 4px 12px rgba(26,60,110,0.25)',
    transition: 'all 0.2s',
  }),
  btnCancel: {
    padding: '11px 20px',
    background: '#f9fafb',
    color: '#6b7280',
    border: '1.5px solid #e5e7eb',
    borderRadius: 9,
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Sarabun', sans-serif",
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
  },
};
