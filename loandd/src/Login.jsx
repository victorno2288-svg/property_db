import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    fetch('http://localhost:3001/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    .then(res => res.json())
    .then(data => {
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // ★ บอก Navbar ให้อัปเดตทันที (ไม่ต้อง reload)
        window.dispatchEvent(new Event('authChange'));

        alert(`ยินดีต้อนรับ ${data.user.role}!`);

        if (data.user.role === 'admin') {
          navigate('/dashboard');
        } else {
          navigate('/home');
        }
      } else {
        alert('Login ไม่สำเร็จ: ' + JSON.stringify(data));
      }
    })
    .catch(err => alert('เกิดข้อผิดพลาด'));
  };

  return (
    <div className="container mt-5" style={{ maxWidth: '400px' }}>
      <div className="card shadow">
        <div className="card-body">
          <h3 className="text-center mb-4">เข้าสู่ระบบ บ้าน D มีเชง</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label>Username</label>
              <input type="text" name="username" className="form-control" onChange={handleChange} required />
            </div>
            <div className="mb-3">
              <label>Password</label>
              <input type="password" name="password" className="form-control" onChange={handleChange} required />
            </div>
            <button type="submit" className="btn btn-primary w-100">Login</button>
          </form>
          <hr />
          <p className="text-center">
            ยังไม่มีบัญชี? <Link to="/register">สมัครสมาชิก</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;