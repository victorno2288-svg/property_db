import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../Navbar';
import PropertyCard from '../components/PropertyCard';

const API = '';

export default function ProfilePage() {
 const navigate = useNavigate();
 const [user, setUser] = useState(null);
 const [profile, setProfile] = useState(null);
 const [tab, setTab] = useState('profile'); // 'profile' | 'saved' | 'password'
 const [saved, setSaved] = useState([]);
 const [savedPage, setSavedPage] = useState(1);
 const SAVED_PAGE_SIZE = 8;
 const [pwReq, setPwReq] = useState(null); // password_change_request สถานะล่าสุด
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [msg, setMsg] = useState(null); // { type: 'success'|'error', text }

 // form fields
 const [username, setUsername] = useState('');
 const [fullName, setFullName] = useState('');
 const [phone, setPhone] = useState('');

 const token = localStorage.getItem('token');

 // auto-logout: ถ้า API ตอบ 401/403 → ลบ token แล้ว redirect ไป /login
 const checkAuth = (r) => {
 if (r.status === 401 || r.status === 403) {
 localStorage.removeItem('token');
 localStorage.removeItem('user');
 navigate('/login');
 throw new Error('Unauthorized');
 }
 return r;
 };

 useEffect(() => {
 if (!token) { navigate('/login'); return; }
 try { setUser(JSON.parse(localStorage.getItem('user') || '{}')); } catch {}
 fetchProfile();
 fetchPwReq();
 }, []);

 useEffect(() => {
 if (tab === 'saved') fetchSaved();
 }, [tab]);

 const authHeader = () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });

 const fetchProfile = () => {
 setLoading(true);
 fetch(`${API}/api/users/profile`, { headers: { Authorization: `Bearer ${token}` } })
 .then(checkAuth)
 .then(r => r.json())
 .then(data => {
 setProfile(data);
 setUsername(data.username || '');
 setFullName(data.full_name || '');
 setPhone(data.phone || '');
 })
 .catch(() => setMsg({ type: 'error', text: 'โหลดข้อมูลไม่ได้' }))
 .finally(() => setLoading(false));
 };

 const fetchSaved = () => {
 fetch(`${API}/api/users/saved`, { headers: { Authorization: `Bearer ${token}` } })
 .then(checkAuth)
 .then(r => r.json())
 .then(data => setSaved(Array.isArray(data) ? data : []))
 .catch(() => setSaved([]));
 };

 const fetchPwReq = () => {
 fetch(`${API}/api/users/password-request`, { headers: { Authorization: `Bearer ${token}` } })
 .then(checkAuth)
 .then(r => r.json())
 .then(data => setPwReq(data))
 .catch(() => {});
 };

 const handleSaveProfile = async (e) => {
 e.preventDefault();
 setSaving(true); setMsg(null);
 try {
 const r = await fetch(`${API}/api/users/profile`, {
 method: 'PUT',
 headers: authHeader(),
 body: JSON.stringify({ username, full_name: fullName, phone }),
 });
 checkAuth(r);
 const data = await r.json();
 if (!r.ok) throw new Error(data.error);
 // อัป localStorage
 const u = JSON.parse(localStorage.getItem('user') || '{}');
 localStorage.setItem('user', JSON.stringify({ ...u, username }));
 setMsg({ type: 'success', text: 'บันทึกโปรไฟล์สำเร็จแล้ว' });
 fetchProfile();
 } catch (err) {
 setMsg({ type: 'error', text: err.message });
 } finally {
 setSaving(false);
 }
 };

 // new password fields for request form
 const [newPw, setNewPw] = useState('');
 const [newPwConf, setNewPwConf] = useState('');
 const [showPw, setShowPw] = useState(false);

 const handlePasswordRequest = async () => {
 if (!newPw || newPw.length < 6)
 return setMsg({ type: 'error', text: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
 if (newPw !== newPwConf)
 return setMsg({ type: 'error', text: 'รหัสผ่านใหม่ไม่ตรงกัน' });

 setSaving(true); setMsg(null);
 try {
 const r = await fetch(`${API}/api/users/password-request`, {
 method: 'POST',
 headers: authHeader(),
 body: JSON.stringify({ newPassword: newPw }),
 });
 checkAuth(r);
 const data = await r.json();
 if (!r.ok) throw new Error(data.error);
 setMsg({ type: 'success', text: data.message });
 setNewPw(''); setNewPwConf('');
 fetchPwReq();
 } catch (err) {
 setMsg({ type: 'error', text: err.message });
 } finally {
 setSaving(false);
 }
 };

 const G = '#3d7a3a'; const Gl = '#A1D99B';

 const tabs = [
 { key: 'profile', icon: 'fa-user-edit', label: 'ข้อมูลของฉัน' },
 { key: 'saved', icon: 'fa-heart', label: 'ทรัพย์ที่บันทึก' },
 { key: 'password', icon: 'fa-lock', label: 'เปลี่ยนรหัสผ่าน' },
 ];



 // password strength: 1-4
 const getStrength = (pw) => {
 let s = 0;
 if (pw.length >= 6) s++;
 if (pw.length >= 10) s++;
 if (/[A-Z]/.test(pw) || /[0-9]/.test(pw)) s++;
 if (/[^A-Za-z0-9]/.test(pw)) s++;
 return Math.max(1, s);
 };

 return (
 <div style={{ fontFamily: '"Noto Sans Thai", sans-serif', background: '#f4f6f9', minHeight: '100vh' }}>
 <Navbar />

 {/* Hero strip */}
 <div style={{ background: 'linear-gradient(135deg,#A1D99B,#6aab62)', paddingTop: 64 }}>
 <div className="container" style={{ padding: '28px 16px 0' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 0 }}>
 {/* Avatar */}
 <div style={{
 width: 60, height: 60, borderRadius: '50%',
 background: '#fff', color: G,
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 fontSize: '1.6rem', fontWeight: 800, flexShrink: 0,
 border: '3px solid rgba(255,255,255,0.5)',
 }}>
 {profile?.username?.charAt(0)?.toUpperCase() || '?'}
 </div>
 <div>
 <div style={{ color: '#1a3a18', fontWeight: 800, fontSize: '1.1rem' }}>
 {profile?.username || '...'}
 </div>
 <div style={{ color: 'rgba(26,58,24,0.65)', fontSize: '0.8rem', marginTop: 2 }}>
 <span>{profile?.email}</span>
 </div>
 </div>
 </div>

 {/* Tabs */}
 <div style={{ display: 'flex', gap: 0, marginTop: 20 }}>
 {tabs.map(t => (
 <button key={t.key} onClick={() => { setTab(t.key); setMsg(null); }} style={{
 background: tab === t.key ? '#fff' : 'transparent',
 color: tab === t.key ? '#A1D99B' : 'rgba(255,255,255,0.7)',
 border: 'none', padding: '10px 18px',
 fontFamily: '"Noto Sans Thai", sans-serif',
 fontWeight: tab === t.key ? 700 : 500,
 fontSize: '0.85rem', cursor: 'pointer',
 borderRadius: '10px 10px 0 0',
 transition: 'all 0.15s',
 display: 'flex', alignItems: 'center', gap: 7,
 }}>
 <i className={`fas ${t.icon}`} style={{ fontSize: '0.8rem' }} />
 {t.label}
 {t.key === 'saved' && saved.length > 0 && (
 <span style={{ background: G, color: '#fff', borderRadius: 10, padding: '0 6px', fontSize: '0.65rem', fontWeight: 800 }}>{saved.length}</span>
 )}
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* Content */}
 <div className="container" style={{ padding: '24px 16px 48px', maxWidth: 720 }}>

 {/* Alert */}
 {msg && (
 <div style={{
 background: msg.type === 'success' ? '#e8fdf0' : '#fff5f5',
 border: `1px solid ${msg.type === 'success' ? '#a8ecc8' : '#fed7d7'}`,
 color: msg.type === 'success' ? '#166534' : '#c53030',
 borderRadius: 10, padding: '10px 16px', marginBottom: 16,
 display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem',
 }}>
 <i className={`fas ${msg.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} />
 {msg.text}
 <button onClick={() => setMsg(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '0.9rem' }}></button>
 </div>
 )}

 {/* ─── TAB: ข้อมูลของฉัน ─────────────────── */}
 {tab === 'profile' && (
 <div style={{ background: '#fff', borderRadius: 14, padding: '24px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
 <h4 style={{ color: '#3d7a3a', fontWeight: 800, marginBottom: 20, fontSize: '1rem' }}>
 <i className="fas fa-user-edit" style={{ color: G, marginRight: 8 }} />แก้ไขข้อมูลส่วนตัว
 </h4>
 {loading ? (
 <div style={{ textAlign: 'center', padding: 40 }}>
 <div className="spinner-border" style={{ color: G }} role="status" />
 </div>
 ) : (
 <form onSubmit={handleSaveProfile}>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
 {/* ชื่อผู้ใช้ */}
 <div style={{ gridColumn: '1 / -1' }}>
 <label style={labelStyle}>ชื่อผู้ใช้ (แสดงในระบบ) *</label>
 <input
 value={username}
 onChange={e => setUsername(e.target.value)}
 required
 style={inputStyle}
 placeholder="ชื่อที่แสดงในระบบ"
 />
 </div>
 {/* ชื่อ-นามสกุล */}
 <div style={{ gridColumn: '1 / -1' }}>
 <label style={labelStyle}>ชื่อ-นามสกุลจริง</label>
 <input
 value={fullName}
 onChange={e => setFullName(e.target.value)}
 style={inputStyle}
 placeholder="ชื่อจริง (ไม่บังคับ)"
 />
 </div>
 {/* อีเมล — read only */}
 <div>
 <label style={labelStyle}>อีเมล</label>
 <input value={profile?.email || ''} disabled style={{ ...inputStyle, background: '#f5f5f5', color: '#999' }} />
 </div>
 {/* เบอร์ */}
 <div>
 <label style={labelStyle}>เบอร์โทรศัพท์</label>
 <input
 value={phone}
 onChange={e => setPhone(e.target.value)}
 style={inputStyle}
 placeholder="0xx-xxx-xxxx"
 type="tel"
 />
 </div>
 </div>

 <button
 type="submit"
 disabled={saving}
 style={{
 marginTop: 20, width: '100%',
 background: saving ? '#ccc' : G,
 color: '#fff', border: 'none',
 padding: '11px', borderRadius: 10,
 fontWeight: 700, fontSize: '0.95rem',
 cursor: saving ? 'not-allowed' : 'pointer',
 fontFamily: '"Noto Sans Thai", sans-serif',
 }}
 >
 {saving ? 'กำลังบันทึก...' : ' บันทึกข้อมูล'}
 </button>
 </form>
 )}

 {/* สมาชิกตั้งแต่ */}
 {profile?.created_at && (
 <p style={{ margin: '16px 0 0', fontSize: '0.78rem', color: '#bbb', textAlign: 'center' }}>
 เป็นสมาชิกตั้งแต่ {new Date(profile.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
 </p>
 )}
 </div>
 )}

 {/* ─── TAB: ทรัพย์ที่บันทึก ──────────────── */}
 {tab === 'saved' && (
 <div>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
 <h4 style={{ color: '#3d7a3a', fontWeight: 800, margin: 0, fontSize: '1rem' }}>
 <i className="fas fa-heart" style={{ color: '#e53e3e', marginRight: 8 }} />
 ทรัพย์ที่บันทึกไว้ ({saved.length} รายการ)
 </h4>
 {saved.length > 0 && (
 <Link to="/search" style={{ color: G, fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}>
 ค้นหาเพิ่ม →
 </Link>
 )}
 </div>

 {saved.length === 0 ? (
 <div style={{ background: '#fff', borderRadius: 14, padding: '48px 24px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
 <div style={{ fontSize: '2.5rem', marginBottom: 12 }}><i className="fas fa-home" style={{ color: '#ccc' }} /></div>
 <p style={{ color: '#999', fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>ยังไม่มีทรัพย์ที่บันทึกไว้</p>
 <p style={{ color: '#bbb', fontSize: '0.8rem', marginTop: 6 }}>กดหัวใจบนการ์ดทรัพย์ที่คุณสนใจเพื่อบันทึกไว้ดูภายหลัง</p>
 <Link to="/search" style={{ display: 'inline-block', marginTop: 16, background: G, color: '#fff', padding: '9px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
 เริ่มค้นหาทรัพย์
 </Link>
 </div>
 ) : (() => {
 const totalPages = Math.max(1, Math.ceil(saved.length / SAVED_PAGE_SIZE));
 const curPage = Math.min(savedPage, totalPages);
 const pagedSaved = saved.slice((curPage - 1) * SAVED_PAGE_SIZE, curPage * SAVED_PAGE_SIZE);
 const canPrev = curPage > 1;
 const canNext = curPage < totalPages;
 const ab = (icon, enabled, onClick) => (
 <button onClick={enabled ? onClick : undefined} disabled={!enabled}
 style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid #e3e9ef', background: enabled ? '#fff' : '#f5f7fa', color: enabled ? G : '#ccc', cursor: enabled ? 'pointer' : 'not-allowed', fontSize: '0.85rem', boxShadow: enabled ? '0 1px 4px rgba(0,0,0,0.05)' : 'none' }}>
 <i className={`fas ${icon}`} />
 </button>
 );
 return (
 <>
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
 {pagedSaved.map(p => <PropertyCard key={p.id} property={p} />)}
 </div>
 {saved.length > 0 && (
 <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, padding: '18px 0 6px' }}>
 {ab('fa-arrow-left', canPrev, () => setSavedPage(curPage - 1))}
 <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1a3a18', minWidth: 70, textAlign: 'center', fontFamily: "'Manrope', sans-serif", letterSpacing: '0.08em' }}>
 <span>{String(curPage).padStart(2, '0')}</span>
 <span style={{ opacity: 0.55 }}> / </span>
 <span style={{ opacity: 0.55 }}>{String(totalPages).padStart(2, '0')}</span>
 </div>
 {ab('fa-arrow-right', canNext, () => setSavedPage(curPage + 1))}
 </div>
 )}
 </>
 );
 })()}
 </div>
 )}

 {/* ─── TAB: เปลี่ยนรหัสผ่าน ──────────────── */}
 {tab === 'password' && (
 <div style={{ background: '#fff', borderRadius: 14, padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
 <h4 style={{ color: '#3d7a3a', fontWeight: 800, marginBottom: 8, fontSize: '1rem' }}>
 <i className="fas fa-lock" style={{ color: G, marginRight: 8 }} />ขอเปลี่ยนรหัสผ่าน
 </h4>
 <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: 20, lineHeight: 1.6 }}>
 เพื่อความปลอดภัย การเปลี่ยนรหัสผ่านต้องผ่านการยืนยันจากแอดมิน<br />
 กรุณายื่นคำขอด้านล่าง ทีมงานจะติดต่อกลับภายใน 24 ชม.
 </p>

 {/* สถานะคำขอล่าสุด */}
 {pwReq && (
 <div style={{
 borderRadius: 10, padding: '12px 16px', marginBottom: 16,
 background: pwReq.status === 'pending' ? '#fffbe6' :
 pwReq.status === 'approved' ? '#e8fdf0' : '#fff5f5',
 border: `1px solid ${pwReq.status === 'pending' ? '#ffd666' : pwReq.status === 'approved' ? '#a8ecc8' : '#fed7d7'}`,
 }}>
 <div style={{ fontWeight: 700, fontSize: '0.85rem', color: pwReq.status === 'pending' ? '#b7690a' : pwReq.status === 'approved' ? '#166534' : '#c53030' }}>
 {pwReq.status === 'pending' && '⏳ คำขออยู่ระหว่างการพิจารณา'}
 {pwReq.status === 'approved' && ' แอดมินเปลี่ยนรหัสให้แล้ว'}
 {pwReq.status === 'rejected' && ' คำขอไม่ผ่านการอนุมัติ'}
 </div>
 {pwReq.note && <div style={{ fontSize: '0.8rem', color: '#555', marginTop: 4 }}>{pwReq.note}</div>}
 <div style={{ fontSize: '0.72rem', color: '#aaa', marginTop: 4 }}>
 ยื่นเมื่อ {new Date(pwReq.requested_at).toLocaleString('th-TH')}
 </div>
 </div>
 )}

 {/* ฟอร์มกรอกรหัสใหม่ + ยื่นคำขอ — แสดงถ้าไม่มี pending */}
 {(!pwReq || pwReq.status !== 'pending') && (
 <div>
 {/* รหัสผ่านใหม่ */}
 <div style={{ marginBottom: 14 }}>
 <label style={labelStyle}>รหัสผ่านใหม่ที่ต้องการ *</label>
 <div style={{ position: 'relative' }}>
 <input
 type={showPw ? 'text' : 'password'}
 value={newPw}
 onChange={e => setNewPw(e.target.value)}
 autoComplete="new-password"
 placeholder="อย่างน้อย 6 ตัวอักษร"
 style={inputStyle}
 />
 <button type="button" onClick={() => setShowPw(s => !s)}
 style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '0.9rem', padding: 0 }}>
 <i className={`fas ${showPw ? 'fa-eye-slash' : 'fa-eye'}`} />
 </button>
 </div>
 </div>

 {/* ยืนยันรหัสใหม่ */}
 <div style={{ marginBottom: 16 }}>
 <label style={labelStyle}>ยืนยันรหัสผ่านใหม่ *</label>
 <input
 type={showPw ? 'text' : 'password'}
 value={newPwConf}
 onChange={e => setNewPwConf(e.target.value)}
 autoComplete="new-password"
 placeholder="พิมพ์รหัสซ้ำอีกครั้ง"
 style={{
 ...inputStyle,
 borderColor: newPwConf && newPw !== newPwConf ? '#e53e3e' : '#e0e0e0',
 }}
 />
 {newPwConf && newPw !== newPwConf && (
 <span style={{ fontSize: '0.76rem', color: '#e53e3e', marginTop: 3, display: 'block' }}>รหัสผ่านไม่ตรงกัน</span>
 )}
 </div>

 {/* ความแข็งแกร่งของรหัสผ่าน */}
 {newPw.length > 0 && (
 <div style={{ marginBottom: 14 }}>
 <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
 {[1,2,3,4].map(i => (
 <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: getStrength(newPw) >= i ? (getStrength(newPw) <= 1 ? '#e53e3e' : getStrength(newPw) <= 2 ? '#f6ad55' : getStrength(newPw) <= 3 ? '#68d391' : G) : '#e0e0e0', transition: 'background 0.2s' }} />
 ))}
 </div>
 <span style={{ fontSize: '0.72rem', color: '#888' }}>
 {getStrength(newPw) <= 1 ? ' อ่อน' : getStrength(newPw) <= 2 ? ' พอใช้' : getStrength(newPw) <= 3 ? ' ดี' : ' แข็งแกร่ง'}
 </span>
 </div>
 )}

 <button
 onClick={handlePasswordRequest}
 disabled={saving || !newPw || !newPwConf || newPw !== newPwConf}
 style={{
 width: '100%', padding: '12px',
 background: (saving || !newPw || !newPwConf || newPw !== newPwConf) ? '#ccc' : 'linear-gradient(135deg,#A1D99B,#6aab62)',
 color: '#1a3a18', border: 'none', borderRadius: 10,
 fontWeight: 700, fontSize: '0.95rem',
 cursor: (saving || !newPw || !newPwConf || newPw !== newPwConf) ? 'not-allowed' : 'pointer',
 fontFamily: '"Noto Sans Thai", sans-serif',
 display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
 }}
 >
 <i className="fas fa-paper-plane" />
 {saving ? 'กำลังส่ง...' : 'ยื่นคำขอ — รอแอดมินอนุมัติ'}
 </button>
 </div>
 )}

 <div style={{ marginTop: 16, padding: '12px 14px', background: '#f8f9fa', borderRadius: 8 }}>
 <p style={{ margin: 0, fontSize: '0.78rem', color: '#888', lineHeight: 1.6 }}>
 <i className="fas fa-info-circle" style={{ color: G, marginRight: 5 }} />
 รหัสผ่านจะเปลี่ยนอัตโนมัติเมื่อแอดมินอนุมัติ — ไม่ต้องรอรับรหัสใหม่ผ่านช่องทางอื่น<br />
 หากมีข้อสงสัยติดต่อ LINE: <strong>@loan_dd</strong> หรือโทร <strong>081-638-6966</strong>
 </p>
 </div>
 </div>
 )}
 </div>
 </div>
 );
}

const labelStyle = {
 display: 'block', fontSize: '0.8rem', fontWeight: 600,
 color: '#555', marginBottom: 5,
};
const inputStyle = {
 width: '100%', boxSizing: 'border-box',
 padding: '9px 12px', borderRadius: 8,
 border: '1.5px solid #e0e0e0', fontSize: '0.88rem',
 color: '#000', backgroundColor: '#fff', outline: 'none',
 fontFamily: '"Noto Sans Thai", sans-serif',
 transition: 'border-color 0.15s',
};
