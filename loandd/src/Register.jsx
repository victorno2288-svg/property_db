
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import bigLogo from './pic/big-logo.png';
import './css/Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: ''
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password.length < 6) {
      alert(' รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      alert(' รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง');
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

      const text = await res.text(); // Backend ตอบ plain text

      if (res.ok) {
        alert('✅ สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
        navigate('/login');
      } else {
        alert('❌ สมัครไม่สำเร็จ: ' + text);
      }
    } catch (err) {
      console.error('Register Error:', err);
      alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ Server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container register-bg">
      <div className="auth-card">

        {/* --- โลโก้ --- */}
        <div className="text-center mb-3">
          <img src={bigLogo} alt="LoanDD Logo" className="register-logo" />
        </div>

        <h3 className="text-center register-title mb-2">สมัครสมาชิก</h3>
        <p className="text-center register-subtitle mb-3">สร้างบัญชีใหม่เพื่อใช้งานระบบ LoanDD</p>

        {/* ============ แบบฟอร์ม ============ */}
        <form onSubmit={handleSubmit}>

          <div className="mb-3">
            <input
              type="text"
              name="username"
              className="form-control auth-input"
              placeholder="ตั้งชื่อผู้ใช้งาน (Username)"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="row g-2 mb-3">
            <div className="col-6">
              <input
                type="password"
                name="password"
                className="form-control auth-input"
                placeholder="รหัสผ่าน (อย่างน้อย 6 ตัว)"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-6">
              <input
                type="password"
                name="confirmPassword"
                className="form-control auth-input"
                placeholder="ยืนยันรหัสผ่าน"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-6">
              <input
                type="email"
                name="email"
                className="form-control auth-input"
                placeholder="อีเมล"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-6">
              <input
                type="tel"
                name="phone"
                className="form-control auth-input"
                placeholder="เบอร์โทรศัพท์"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn w-100 auth-btn register-submit-btn"
            disabled={loading}
          >
            {loading ? '⏳ กำลังดำเนินการ...' : 'สมัครสมาชิก'}
          </button>
        </form>

        {/* --- ลิงก์กลับหน้า Login --- */}
        <div className="text-center mt-4">
          <span className="text-muted small">มีบัญชีอยู่แล้ว? </span>
          <Link to="/login" className="register-login-link">เข้าสู่ระบบ</Link>
        </div>

      </div>
    </div>
  );
};

export default Register;