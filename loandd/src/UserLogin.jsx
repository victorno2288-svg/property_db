import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import bigLogo from './pic/big-logo.png'; // ตรวจสอบ path รูปภาพ

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const UserLogin = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const navigate = useNavigate();

  // ── Forgot Password State ─────────────────────────────────────────────────
  const [showForgot, setShowForgot]       = useState(false);
  const [fpData, setFpData]               = useState({ username: '', new_password: '', confirm_password: '' });
  const [fpLoading, setFpLoading]         = useState(false);
  const [fpResult, setFpResult]           = useState(null); // { ok: bool, msg: string }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ── Forgot Password Handlers ──────────────────────────────────────────────
  const handleFpChange = (e) => {
    setFpData({ ...fpData, [e.target.name]: e.target.value });
  };

  const handleFpSubmit = async (e) => {
    e.preventDefault();
    if (fpData.new_password !== fpData.confirm_password) {
      setFpResult({ ok: false, msg: '❌ รหัสผ่านทั้งสองช่องไม่ตรงกัน' });
      return;
    }
    if (fpData.new_password.length < 6) {
      setFpResult({ ok: false, msg: '❌ รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
      return;
    }
    setFpLoading(true);
    setFpResult(null);
    try {
      const res  = await fetch(`${BASE_URL}/api/users/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username: fpData.username, new_password: fpData.new_password }),
      });
      const data = await res.json();
      if (res.ok) {
        setFpResult({ ok: true, msg: data.message || '✅ ส่งคำขอเรียบร้อยแล้ว' });
        setFpData({ username: '', new_password: '', confirm_password: '' });
      } else {
        setFpResult({ ok: false, msg: data.message || '❌ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
      }
    } catch {
      setFpResult({ ok: false, msg: '❌ เชื่อมต่อ Server ไม่ได้' });
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
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('authChange'));
        navigate('/');
      } else {
        setLoginError(data.error || '❌ ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      console.error(err);
      setLoginError('❌ เชื่อมต่อ Server ไม่ได้ กรุณาตรวจสอบว่า server เปิดอยู่');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    // bg-user: ธีมสีน้ำเงิน-ม่วง
    <div className="auth-container bg-user">
      <div className="auth-card">
        
        {/* --- Logo & Header --- */}
        <div className="text-center mb-4">
            <img 
              src={bigLogo} 
              alt="LoanDD Logo" 
              className="img-fluid mb-3"
              style={{ maxHeight: '90px' }} 
            />
            <h4 className="fw-bold text-dark">ยินดีต้อนรับ</h4>
            <p className="text-muted small">ค้นหาและซื้อ-ขายอสังหาริมทรัพย์</p>
        </div>
        
        {/* --- Form --- */}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input 
              type="text" 
              name="username" 
              className="form-control auth-input" 
              placeholder="ชื่อผู้ใช้งาน" 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="mb-4">
            <input 
              type="password" 
              name="password" 
              className="form-control auth-input" 
              placeholder="รหัสผ่าน" 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <button
            type="submit"
            disabled={loginLoading}
            className="btn btn-primary w-100 auth-btn"
            style={{
              background: loginLoading ? '#aaa' : 'linear-gradient(to right, #04AA6D, #028a57)',
              border: 'none',
              boxShadow: '0 4px 15px rgba(4,170,109,0.3)',
              cursor: loginLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {loginLoading ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
          </button>

          {loginError && (
            <div style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 8,
              background: '#fff0f0', border: '1px solid #ffcccc',
              color: '#c0392b', fontSize: '0.85rem', fontWeight: 600,
              textAlign: 'center',
            }}>
              {loginError}
            </div>
          )}
        </form>

        <hr className="my-4" style={{ opacity: 0.1 }} />

        {/* ── Forgot Password link ── */}
        <div className="text-center mb-3">
          <button
            type="button"
            onClick={() => { setShowForgot(v => !v); setFpResult(null); }}
            style={{
              background: 'none', border: 'none', padding: 0,
              color: '#888', fontSize: '0.82rem', cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {showForgot ? '← กลับไปเข้าสู่ระบบ' : 'ลืมรหัสผ่าน? ขอรีเซ็ตรหัสผ่านกับแอดมิน'}
          </button>
        </div>

        {/* ── Forgot Password Form ── */}
        {showForgot && (
          <div style={{
            background: '#f8fff9', border: '1.5px solid #c3ecd0',
            borderRadius: 12, padding: '18px 16px', marginBottom: 16,
          }}>
            <div style={{ fontWeight: 700, color: '#1a6b35', marginBottom: 10, fontSize: '0.88rem' }}>
              🔑 ขอรีเซ็ตรหัสผ่านใหม่
            </div>
            <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: 12, lineHeight: 1.5 }}>
              กรอกชื่อผู้ใช้และรหัสผ่านใหม่ที่ต้องการ
              แอดมินจะตรวจสอบและอนุมัติ (หรืออนุมัติอัตโนมัติถ้าระบบเปิดใช้งาน)
            </p>

            {fpResult && (
              <div style={{
                padding: '8px 12px', borderRadius: 8, marginBottom: 12,
                background: fpResult.ok ? '#eafbf0' : '#fff0f0',
                color:      fpResult.ok ? '#1a6b35' : '#b22222',
                fontSize:   '0.78rem', fontWeight: 600,
              }}>
                {fpResult.msg}
              </div>
            )}

            <form onSubmit={handleFpSubmit}>
              <div className="mb-2">
                <input
                  type="text"
                  name="username"
                  value={fpData.username}
                  onChange={handleFpChange}
                  className="form-control auth-input"
                  placeholder="ชื่อผู้ใช้งาน (username)"
                  required
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
              <div className="mb-2">
                <input
                  type="password"
                  name="new_password"
                  value={fpData.new_password}
                  onChange={handleFpChange}
                  className="form-control auth-input"
                  placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)"
                  required
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
              <div className="mb-3">
                <input
                  type="password"
                  name="confirm_password"
                  value={fpData.confirm_password}
                  onChange={handleFpChange}
                  className="form-control auth-input"
                  placeholder="ยืนยันรหัสผ่านใหม่"
                  required
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
              <button
                type="submit"
                disabled={fpLoading}
                style={{
                  width: '100%', padding: '9px 0', borderRadius: 8, border: 'none',
                  background: fpLoading ? '#aaa' : 'linear-gradient(to right,#4ec85e,#8ffbbc)',
                  color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: fpLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {fpLoading ? 'กำลังส่งคำขอ…' : 'ส่งคำขอรีเซ็ตรหัสผ่าน'}
              </button>
            </form>
          </div>
        )}

        <div className="text-center">
          <p className="mb-1 text-muted small">ยังไม่มีบัญชีสมาชิก?</p>
          <Link
            to="/register"
            className="fw-bold text-decoration-none"
            style={{ color: '#4bac42', fontSize: '1.1rem' }}
          >
            สมัครสมาชิกใหม่
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;