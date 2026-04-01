import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './App.css'; // ไฟล์ CSS หลักที่เราเขียนไว้

// --- นำเข้า Component หน้าต่างๆ ---
import Home from './Home';          // หน้าแรก (Landing Page)
import Dashboard from './Dashboard'; // หน้าแดชบอร์ด (Admin Only)
import UserLogin from './UserLogin'; // หน้าล็อกอินลูกค้า
import AdminLogin from './AdminLogin'; // หน้าล็อกอินเจ้าหน้าที่
import Register from './Register';   // หน้าสมัครสมาชิก
// ListProperty (ขายฝาก/จำนอง) ถูกลบออกแล้ว — เว็บนี้ขายเองโดย LoanDD เท่านั้น
import PropertySearch from './pages/PropertySearch'; // หน้าค้นหา/แสดงทรัพย์สินทั้งหมด
import PropertyDetail from './pages/PropertyDetail'; // หน้ารายละเอียดทรัพย์สิน
import AdminProperties from './pages/admin/AdminProperties'; // Admin: รายการทรัพย์
import PropertyForm    from './pages/admin/PropertyForm';    // Admin: เพิ่ม/แก้ไขทรัพย์
import AdminInquiries  from './pages/admin/AdminInquiries';  // Admin: ข้อความผู้สนใจ
import AdminRegister   from './AdminRegister';               // Admin: ลงทะเบียนแอดมินใหม่ (super_admin only)
import AdminUsers      from './pages/admin/AdminUsers';       // Admin: จัดการผู้ใช้
import ProfilePage     from './pages/ProfilePage';            // User: โปรไฟล์และทรัพย์บันทึก
import Guide from './Guide';               // หน้าคู่มือผู้กู้ยืม
import FaqPage from './FaqPage';            // หน้าคำถามที่พบบ่อย
import ContactPage from './pages/ContactPage'; // หน้าติดต่อเรา
import LineFloatingButton from './components/LineFloatingButton'; // ปุ่ม Line ลอย

// --- Component ตรวจสอบสิทธิ์ (User Route) ---
// ใช้สำหรับหน้าที่ต้องล็อกอินด้วยบัญชีผู้ใช้ทั่วไป
const UserRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (token) return children;
  return <Navigate to="/login" />;
};

// --- Component ตรวจสอบสิทธิ์ (Admin Route) ---
// ใช้สำหรับหุ้มหน้า Admin ไม่ให้คนนอกเข้า
// ตรวจสอบจาก adminToken + adminUser (แยกจาก token ของผู้ใช้ทั่วไป)
// หมายเหตุ: ไม่ตรวจ admin.department ที่นี่ — เพราะ backend enforce permissions เองอยู่แล้ว
//           frontend ตรวจแค่ "มี adminToken + admin.id ที่ valid หรือไม่"
const AdminRoute = ({ children }) => {
  const adminToken = localStorage.getItem('adminToken');
  const adminStr   = localStorage.getItem('adminUser');

  let admin = null;
  try {
    admin = adminStr ? JSON.parse(adminStr) : null;
  } catch {
    // JSON parse error → ถือว่าไม่มีข้อมูล
    localStorage.removeItem('adminUser');
  }

  // เงื่อนไข: ต้องมี adminToken + adminUser ที่มี id (valid object)
  if (adminToken && admin && admin.id) {
    return children;
  }

  // ถ้าไม่ผ่านเงื่อนไข ให้ดีดกลับไปหน้า Login ของแอดมิน
  return <Navigate to="/admin" />;
};

// ซ่อน LINE floating button บนหน้า PropertyDetail
// เพราะ FOMO bar มีปุ่ม LINE อยู่แล้ว ไม่ให้ทับกัน
function ConditionalLineButton() {
  const { pathname } = useLocation();
  const isPropertyPage = /^\/property\//.test(pathname);
  if (isPropertyPage) return null;
  return <LineFloatingButton />;
}

function App() {
  return (
    <BrowserRouter>
      {/* ปุ่ม Line ลอยมุมขวาล่าง — ซ่อนบนหน้า PropertyDetail */}
      <ConditionalLineButton />

      <Routes>
        {/* =========================================
            PUBLIC ROUTES (ใครก็เข้าได้)
           ========================================= */}

        {/* หน้าแรก: Landing Page */}
        <Route path="/" element={<Home />} />

        {/* หน้าล็อกอินสำหรับลูกค้าทั่วไป */}
        <Route path="/login" element={<UserLogin />} />

        {/* หน้าสมัครสมาชิก */}
        <Route path="/register" element={<Register />} />

        {/* หน้าล็อกอินสำหรับเจ้าหน้าที่ */}
        <Route path="/admin" element={<AdminLogin />} />

        {/* /list-property ถูกลบออกแล้ว — ไม่มีระบบลงประกาศจากภายนอก */}

        {/* ========== PROPERTY SHOWCASE ========== */}
        {/* หน้าค้นหา/แสดงทรัพย์สินทั้งหมดของ LoanDD */}
        <Route path="/search" element={<PropertySearch />} />

        {/* หน้ารายละเอียดทรัพย์สินแต่ละชิ้น */}
        <Route path="/property/:id" element={<PropertyDetail />} />

        {/* หน้าคู่มือผู้กู้ยืม */}
        <Route path="/guide" element={<Guide />} />

        {/* หน้าคำถามที่พบบ่อย */}
        <Route path="/faq" element={<FaqPage />} />

        {/* หน้าติดต่อเรา */}
        <Route path="/contact" element={<ContactPage />} />

        {/* =========================================
            PROTECTED ROUTES (ต้องล็อกอิน Admin)
           ========================================= */}

        {/* แดชบอร์ด */}
        <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />

        {/* ===== ADMIN: Property Management ===== */}
        <Route path="/admin/properties"          element={<AdminRoute><AdminProperties /></AdminRoute>} />
        <Route path="/admin/properties/new"       element={<AdminRoute><PropertyForm /></AdminRoute>} />
        <Route path="/admin/properties/:id/edit"  element={<AdminRoute><PropertyForm /></AdminRoute>} />
        <Route path="/admin/inquiries"            element={<AdminRoute><AdminInquiries /></AdminRoute>} />

        {/* ===== ADMIN: Register (super_admin only — ตรวจสิทธิ์ใน component) ===== */}
        <Route path="/admin/register" element={<AdminRegister />} />

        {/* =========================================
            USER ROUTES (ต้องล็อกอิน user)
           ========================================= */}

        {/* หน้าโปรไฟล์ผู้ใช้ + ทรัพย์บันทึก + คำขอรหัสผ่าน */}
        <Route path="/profile" element={<UserRoute><ProfilePage /></UserRoute>} />

        {/* /saved → redirect ไปหน้าโปรไฟล์ tab saved */}
        <Route path="/saved" element={<Navigate to="/profile?tab=saved" />} />

        {/* ===== ADMIN: User Management ===== */}
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />

        {/* หน้า Home สำหรับ User (หลังจากล็อกอิน) */}
        <Route path="/home" element={<Home />} />

        {/* =========================================
            FALLBACK (ถ้าพิมพ์ URL มั่ว)
           ========================================= */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;