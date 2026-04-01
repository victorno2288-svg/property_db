import React, { useState, useEffect } from 'react';

const AdminForm = ({ onUpdateSuccess }) => {
  const [formData, setFormData] = useState({
    totalCases: 0,
    totalRevenue: 0,
    totalCommission: 0,
    totalRemaining: 0
  });

  // ดึงข้อมูลเก่ามาแสดงในช่องกรอก
  useEffect(() => {
    fetch('http://localhost:3001/api/dashboard')
      .then(res => res.json())
      .then(data => {
        setFormData({
          totalCases: data.totalCases,
          totalRevenue: data.totalRevenue,
          totalCommission: data.totalCommission,
          totalRemaining: data.totalRemaining
        });
      })
      .catch(err => console.error("Error loading form data:", err));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch('http://localhost:3001/api/update-dashboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    .then(res => {
      if(res.ok) {
        alert('✅ บันทึกข้อมูลสำเร็จ!');
        if (onUpdateSuccess) onUpdateSuccess(); // แจ้งให้ Dashboard รีโหลดข้อมูล
      } else {
        alert('❌ บันทึกไม่สำเร็จ');
      }
    });
  };

  return (
    <div className="card mb-4 shadow-sm">
      <div className="card-header bg-dark text-white">
        <i className="fas fa-tools me-2"></i> ระบบจัดการข้อมูลหลังบ้าน (Back Office)
      </div>
      <div className="card-body bg-light">
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label fw-bold">เคสทั้งหมด</label>
              <input type="number" className="form-control" name="totalCases" value={formData.totalCases} onChange={handleChange} />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-bold">รายรับรวม (บาท)</label>
              <input type="number" className="form-control" name="totalRevenue" value={formData.totalRevenue} onChange={handleChange} />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-bold">ค่าคอมมิชชั่น (บาท)</label>
              <input type="number" className="form-control" name="totalCommission" value={formData.totalCommission} onChange={handleChange} />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-bold">คงเหลือ (บาท)</label>
              <input type="number" className="form-control" name="totalRemaining" value={formData.totalRemaining} onChange={handleChange} />
            </div>
          </div>
          <button type="submit" className="btn btn-success mt-3 w-100">
            <i className="fas fa-save me-2"></i> บันทึกการเปลี่ยนแปลง
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminForm;