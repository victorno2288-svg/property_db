/**
 * AdminUsers.jsx — Standalone Admin Users Page
 * ใช้ UsersPanel (shared component) + AdminNav
 */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UsersPanel from './UsersPanel';
import '../../css/adminMobile.css';

const G = '#04AA6D';
const N = '#1a2d4a';

function AdminNav({ navigate }) {
  const adminUser = (() => { try { return JSON.parse(localStorage.getItem('adminUser') || '{}'); } catch { return {}; } })();
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin');
  };

  return (
    <div style={{ background:`linear-gradient(135deg,${N},#1a3c6e)`, padding:'0 24px', height:60, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 12px rgba(0,0,0,0.18)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ fontWeight:900, fontSize:'1.25rem', color:'#fff', letterSpacing:1 }}>
          LOAN<span style={{ color:G }}>DD</span>
        </div>
        <span style={{ background:'rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.7)', fontSize:'0.7rem', padding:'2px 8px', borderRadius:10, fontWeight:700 }}>Admin</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span className="admin-nav-username" style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.78rem' }}>{adminUser.username}</span>
        <button onClick={handleLogout} style={{ background:'rgba(220,38,38,0.15)', border:'1.5px solid rgba(220,38,38,0.4)', color:'#fca5a5', borderRadius:7, padding:'5px 12px', fontSize:'0.78rem', cursor:'pointer' }}>ออกจากระบบ</button>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight:'100vh', background:'#f5f7fa', fontFamily:"'Sarabun',sans-serif" }}>
      <AdminNav navigate={navigate} />

      {/* Page Header */}
      <div style={{ background:`linear-gradient(135deg,${N},#24467a)`, color:'#fff', padding:'24px 32px 20px' }}>
        <h1 style={{ margin:0, fontSize:'1.5rem', fontWeight:900 }}>👥 จัดการผู้ใช้</h1>
        <p style={{ margin:'6px 0 0', opacity:0.7, fontSize:'0.88rem' }}>ดู แก้ไข และลบบัญชีผู้ใช้งานในระบบ</p>
      </div>

      <div style={{ padding:'20px 32px 28px', maxWidth:1200, margin:'0 auto' }}>
        {/* ===== PILL TAB NAV ===== */}
        <div className="admin-pill-nav" style={{ position:'relative', display:'inline-flex', background:'#e2e8f0', borderRadius:14, padding:4, marginBottom:20, gap:0 }}>
          <div style={{ position:'absolute', top:4, bottom:4, width:'calc(25% - 4px)', left:'calc(75% + 2px)', background:'#fff', borderRadius:10, boxShadow:'0 2px 10px rgba(0,0,0,0.12)', zIndex:0 }} />
          {[
            { label:'📊 ภาพรวม',  path:'/dashboard' },
            { label:'🏡 ทรัพย์',  path:'/admin/properties' },
            { label:'✉️ ข้อความ', path:'/admin/inquiries' },
            { label:'👥 ผู้ใช้',  path:'/admin/users' },
          ].map((t) => {
            const active = t.path === '/admin/users';
            return (
              <Link key={t.path} to={t.path} style={{ position:'relative', zIndex:1, textDecoration:'none', padding:'9px 22px', borderRadius:10, fontWeight: active ? 800 : 500, color: active ? N : '#94a3b8', fontSize:'0.85rem', fontFamily:"'Sarabun',sans-serif", transition:'color 0.2s', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}>
                {t.label}
              </Link>
            );
          })}
        </div>
        <UsersPanel />
      </div>
    </div>
  );
}
