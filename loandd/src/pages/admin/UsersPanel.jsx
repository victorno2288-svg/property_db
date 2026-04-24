/**
 * UsersPanel.jsx — User Management Panel
 * ใช้ได้ทั้งใน Dashboard (tab 3) และ AdminUsers (standalone)
 * ไม่มี Navbar ของตัวเอง — parent component เป็นคนจัดการ nav
 */
import React, { useState, useCallback, useEffect } from 'react';
import adminFetch from '../../utils/adminFetch';

const G = '#3d7a3a'; const Gl = '#A1D99B';
const N = '#3d7a3a';


const STATUS_CONF = {
 active: { label:'ใช้งาน', bg:'#e8f8f0', color:'#5a9a52', border:'#a3e0c0' },
 inactive: { label:'ระงับ', bg:'#fef4e8', color:'#c0711a', border:'#f5d08a' },
 banned: { label:'แบน', bg:'#fdf0f0', color:'#c0392b', border:'#e8b4b4' },
};

const inp = {
 width:'100%', padding:'9px 12px', border:'1.5px solid #e2e8f0',
 borderRadius:8, fontSize:'0.88rem', fontFamily:"'Sarabun',sans-serif",
 outline:'none', boxSizing:'border-box',
 backgroundColor: '#fff', color: '#000'
};
const btn = (bg, color='#fff') => ({
 background:bg, color, border:'none', borderRadius:8,
 padding:'9px 20px', fontWeight:700, fontSize:'0.88rem',
 cursor:'pointer', fontFamily:"'Sarabun',sans-serif",
});

// ─── Modal Wrapper ───
function Modal({ title, onClose, children, width = 480 }) {
 return (
 <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
 <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:width, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 8px 40px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
 <div style={{ padding:'18px 22px 14px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
 <span style={{ fontWeight:800, fontSize:'1rem', color:N }}>{title}</span>
 <button onClick={onClose} style={{ background:'none', border:'none', fontSize:'1.3rem', cursor:'pointer', color:'#888', lineHeight:1 }}>×</button>
 </div>
 <div style={{ padding:'20px 22px 24px' }}>{children}</div>
 </div>
 </div>
 );
}

// ─── Field ───
function Field({ label, children, error }) {
 return (
 <div style={{ marginBottom:14 }}>
 <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, color:'#555', marginBottom:4 }}>{label}</label>
 {children}
 {error && <span style={{ color:'#e53e3e', fontSize:'0.76rem', marginTop:2, display:'block' }}>{error}</span>}
 </div>
 );
}

// ─── Edit User Modal ───
function EditUserModal({ user, onClose, onSaved }) {
 const [form, setForm] = useState({ username: user.username||'', full_name: user.full_name||'', phone: user.phone||'', role: user.role||'borrower', status: user.status||'active' });
 const [loading, setLoading] = useState(false);
 const [err, setErr] = useState('');

 const handleSave = async () => {
 setErr('');
 if (!form.username.trim()) return setErr('กรุณากรอกชื่อผู้ใช้');
 setLoading(true);
 try {
 const r = await adminFetch(`/api/admin/users/${user.id}`, {
 method: 'PUT',
 headers: { 'Content-Type':'application/json' },
 body: JSON.stringify(form),
 });
 const d = await r.json();
 if (!r.ok) return setErr(d.error || 'เกิดข้อผิดพลาด');
 onSaved(); onClose();
 } catch { setErr('เกิดข้อผิดพลาด'); }
 finally { setLoading(false); }
 };

 return (
 <Modal title={`แก้ไขข้อมูล: ${user.username}`} onClose={onClose}>
 <Field label="ชื่อผู้ใช้ (username) *">
 <input style={inp} value={form.username} onChange={e => setForm(f=>({...f,username:e.target.value}))} />
 </Field>
 <Field label="ชื่อ-นามสกุล">
 <input style={inp} value={form.full_name} onChange={e => setForm(f=>({...f,full_name:e.target.value}))} placeholder="ชื่อจริง" />
 </Field>
 <Field label="อีเมล">
 <input style={{...inp, background:'#f7f7f7', color:'#888'}} value={user.email||'-'} readOnly />
 </Field>
 <Field label="เบอร์โทร">
 <input style={inp} value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} placeholder="0xxxxxxxxx" />
 </Field>
 <Field label="สถานะ">
 <select style={inp} value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value}))}>
 <option value="active">ใช้งาน</option>
 <option value="inactive">ระงับ</option>
 <option value="banned">แบน</option>
 </select>
 </Field>
 {err && <p style={{ color:'#e53e3e', fontSize:'0.82rem', marginBottom:10 }}>{err}</p>}
 <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
 <button style={btn('#f0f0f0','#555')} onClick={onClose}>ยกเลิก</button>
 <button style={btn(G,'#1a3a18')} onClick={handleSave} disabled={loading}>{loading ? 'กำลังบันทึก…' : 'บันทึก'}</button>
 </div>
 </Modal>
 );
}

// ─── Change Password Modal ───
function ChangePasswordModal({ user, requestId, onClose, onSaved }) {
 const [newPassword, setNewPassword] = useState('');
 const [note, setNote] = useState('');
 const [show, setShow] = useState(false);
 const [loading, setLoading] = useState(false);
 const [err, setErr] = useState('');

 const handleSave = async () => {
 setErr('');
 if (newPassword.length < 6) return setErr('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
 setLoading(true);
 try {
 const r = await adminFetch(`/api/admin/users/${user.id}/password`, {
 method: 'PUT',
 headers: { 'Content-Type':'application/json' },
 body: JSON.stringify({ newPassword, requestId: requestId || undefined, note }),
 });
 const d = await r.json();
 if (!r.ok) return setErr(d.error || 'เกิดข้อผิดพลาด');
 onSaved(); onClose();
 } catch { setErr('เกิดข้อผิดพลาด'); }
 finally { setLoading(false); }
 };

 return (
 <Modal title={`เปลี่ยนรหัสผ่าน: ${user.username}`} onClose={onClose}>
 {requestId && (
 <div style={{ background:'#fffbe6', border:'1px solid #ffe58f', borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:'0.82rem', color:'#875900' }}>
 กำลังดำเนินการตามคำขอ #{requestId} ของผู้ใช้
 </div>
 )}
 <Field label="รหัสผ่านใหม่ *">
 <div style={{ position:'relative' }}>
 <input style={inp} type={show ? 'text' : 'password'} autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="อย่างน้อย 6 ตัวอักษร" />
 <button onClick={() => setShow(s=>!s)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#888', fontSize:'0.85rem' }}>
 {show ? '' : ''}
 </button>
 </div>
 </Field>
 <Field label="หมายเหตุ (ส่งให้ผู้ใช้ทราบ)">
 <textarea style={{...inp, height:72, resize:'vertical'}} value={note} onChange={e => setNote(e.target.value)} placeholder="เช่น แอดมินได้เปลี่ยนรหัสให้ตามคำขอแล้ว" />
 </Field>
 {err && <p style={{ color:'#e53e3e', fontSize:'0.82rem', marginBottom:10 }}>{err}</p>}
 <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
 <button style={btn('#f0f0f0','#555')} onClick={onClose}>ยกเลิก</button>
 <button style={btn('#3182ce')} onClick={handleSave} disabled={loading}>{loading ? 'กำลังบันทึก…' : 'เปลี่ยนรหัส'}</button>
 </div>
 </Modal>
 );
}

// ─── Delete Confirm Modal ───
function DeleteModal({ user, onClose, onDeleted }) {
 const [loading, setLoading] = useState(false);
 const [err, setErr] = useState('');

 const handleDelete = async () => {
 setLoading(true);
 try {
 const r = await adminFetch(`/api/admin/users/${user.id}`, { method:'DELETE' });
 if (!r.ok) { const d = await r.json(); return setErr(d.error||'ลบไม่สำเร็จ'); }
 onDeleted(); onClose();
 } catch { setErr('เกิดข้อผิดพลาด'); }
 finally { setLoading(false); }
 };

 return (
 <Modal title="ยืนยันการลบบัญชี" onClose={onClose} width={400}>
 <p style={{ fontSize:'0.9rem', color:'#333', marginBottom:8 }}>
 คุณแน่ใจหรือไม่ว่าต้องการลบบัญชี <strong>{user.username}</strong> ({user.email}) ?
 </p>
 <p style={{ fontSize:'0.8rem', color:'#e53e3e', marginBottom:16 }}> การดำเนินการนี้ไม่สามารถย้อนกลับได้ ข้อมูลทั้งหมดของผู้ใช้จะหายถาวร</p>
 {err && <p style={{ color:'#e53e3e', fontSize:'0.82rem', marginBottom:10 }}>{err}</p>}
 <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
 <button style={btn('#f0f0f0','#555')} onClick={onClose}>ยกเลิก</button>
 <button style={btn('#e53e3e')} onClick={handleDelete} disabled={loading}>{loading ? 'กำลังลบ…' : 'ลบบัญชี'}</button>
 </div>
 </Modal>
 );
}

// ─── Reject Request Modal ───
function RejectModal({ req, onClose, onRejected }) {
 const [note, setNote] = useState('');
 const [loading, setLoading] = useState(false);
 const [err, setErr] = useState('');

 const handleReject = async () => {
 setLoading(true);
 try {
 const r = await adminFetch(`/api/admin/password-requests/${req.id}/reject`, {
 method: 'PUT',
 headers: { 'Content-Type':'application/json' },
 body: JSON.stringify({ note: note || 'ไม่ผ่านการอนุมัติ' }),
 });
 if (!r.ok) { const d = await r.json(); return setErr(d.error||'เกิดข้อผิดพลาด'); }
 onRejected(); onClose();
 } catch { setErr('เกิดข้อผิดพลาด'); }
 finally { setLoading(false); }
 };

 return (
 <Modal title="ปฏิเสธคำขอเปลี่ยนรหัส" onClose={onClose} width={400}>
 <p style={{ fontSize:'0.88rem', color:'#333', marginBottom:12 }}>คำขอของ <strong>{req.username}</strong></p>
 <Field label="เหตุผล (ส่งให้ผู้ใช้ทราบ)">
 <textarea style={{...inp, height:72, resize:'vertical'}} value={note} onChange={e => setNote(e.target.value)} placeholder="ไม่ผ่านการอนุมัติ" />
 </Field>
 {err && <p style={{ color:'#e53e3e', fontSize:'0.82rem', marginBottom:10 }}>{err}</p>}
 <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
 <button style={btn('#f0f0f0','#555')} onClick={onClose}>ยกเลิก</button>
 <button style={btn('#e53e3e')} onClick={handleReject} disabled={loading}>{loading ? '…' : 'ปฏิเสธ'}</button>
 </div>
 </Modal>
 );
}

// ─── Edit Admin Modal ───
function EditAdminModal({ admin, onClose, onSaved }) {
 const [form, setForm] = useState({
 username: admin.username||'', full_name: admin.full_name||'',
 display_name: admin.display_name||'', email: admin.email||'',
 phone: admin.phone||'', is_active: admin.is_active !== 0 ? 1 : 0,
 department: admin.department||'property_manager',
 });
 const [loading, setLoading] = useState(false);
 const [err, setErr] = useState('');

 const handleSave = async () => {
 setErr('');
 if (!form.username.trim() || !form.email.trim()) return setErr('กรุณากรอก username และ email');
 setLoading(true);
 try {
 const r = await adminFetch(`/api/admin/admins/${admin.id}`, {
 method: 'PUT', headers: { 'Content-Type':'application/json' },
 body: JSON.stringify(form),
 });
 const d = await r.json();
 if (!r.ok) return setErr(d.error || 'เกิดข้อผิดพลาด');
 onSaved(); onClose();
 } catch { setErr('เกิดข้อผิดพลาด'); }
 finally { setLoading(false); }
 };

 return (
 <Modal title={`แก้ไขแอดมิน: ${admin.username}`} onClose={onClose}>
 <Field label="Username *">
 <input style={inp} value={form.username} onChange={e => setForm(f=>({...f,username:e.target.value}))} />
 </Field>
 <Field label="ชื่อ-นามสกุลจริง *">
 <input style={inp} value={form.full_name} onChange={e => setForm(f=>({...f,full_name:e.target.value}))} />
 </Field>
 <Field label="ชื่อที่แสดงใน Panel">
 <input style={inp} value={form.display_name} onChange={e => setForm(f=>({...f,display_name:e.target.value}))} placeholder="ถ้าไม่กรอกจะใช้ชื่อจริง" />
 </Field>
 <Field label="อีเมล *">
 <input style={inp} type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} />
 </Field>
 <Field label="เบอร์โทร">
 <input style={inp} value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} placeholder="0xxxxxxxxx" />
 </Field>
 <Field label="ตำแหน่ง">
 <select style={inp} value={form.department} onChange={e => setForm(f=>({...f,department:e.target.value}))}>
 <option value="super_admin">Super Admin</option>
 <option value="property_manager">Property Manager</option>
 <option value="sales">Sales</option>
 <option value="content">Content</option>
 <option value="viewer">Viewer</option>
 </select>
 </Field>
 <Field label="สถานะ">
 <select style={inp} value={form.is_active} onChange={e => setForm(f=>({...f,is_active:+e.target.value}))}>
 <option value={1}>ใช้งาน</option>
 <option value={0}>ระงับ</option>
 </select>
 </Field>
 {err && <p style={{ color:'#e53e3e', fontSize:'0.82rem', marginBottom:10 }}>{err}</p>}
 <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
 <button style={btn('#f0f0f0','#555')} onClick={onClose}>ยกเลิก</button>
 <button style={btn(G,'#1a3a18')} onClick={handleSave} disabled={loading}>{loading ? 'กำลังบันทึก…' : 'บันทึก'}</button>
 </div>
 </Modal>
 );
}

// ─── Change Admin Password Modal ───
function ChangeAdminPasswordModal({ admin, onClose, onSaved }) {
 const [newPassword, setNewPassword] = useState('');
 const [show, setShow] = useState(false);
 const [loading, setLoading] = useState(false);
 const [err, setErr] = useState('');
 const [ok, setOk] = useState(false);

 const handleSave = async () => {
 setErr('');
 if (newPassword.length < 6) return setErr('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
 setLoading(true);
 try {
 const r = await adminFetch(`/api/admin/admins/${admin.id}/password`, {
 method: 'PUT',
 headers: { 'Content-Type':'application/json' },
 body: JSON.stringify({ newPassword }),
 });
 const d = await r.json();
 if (!r.ok) return setErr(d.error || 'เกิดข้อผิดพลาด');
 setOk(true);
 setTimeout(() => { onSaved(); onClose(); }, 1200);
 } catch { setErr('เกิดข้อผิดพลาด'); }
 finally { setLoading(false); }
 };

 return (
 <Modal title={` เปลี่ยนรหัสผ่าน: ${admin.username}`} onClose={onClose} width={400}>
 {ok ? (
 <div style={{ textAlign:'center', padding:'20px 0' }}>
 <div style={{ fontSize:'2.5rem', marginBottom:8 }}></div>
 <div style={{ fontWeight:700, color:'#5a9a52' }}>เปลี่ยนรหัสผ่านสำเร็จ!</div>
 </div>
 ) : (
 <>
 <Field label="รหัสผ่านใหม่ *">
 <div style={{ position:'relative' }}>
 <input style={inp} type={show ? 'text' : 'password'} autoComplete="new-password"
 value={newPassword} onChange={e => setNewPassword(e.target.value)}
 placeholder="อย่างน้อย 6 ตัวอักษร" />
 <button onClick={() => setShow(s=>!s)}
 style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#888', fontSize:'0.85rem' }}>
 {show ? '' : ''}
 </button>
 </div>
 </Field>
 {err && <p style={{ color:'#e53e3e', fontSize:'0.82rem', marginBottom:10 }}>{err}</p>}
 <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
 <button style={btn('#f0f0f0','#555')} onClick={onClose}>ยกเลิก</button>
 <button style={btn('#3182ce')} onClick={handleSave} disabled={loading}>
 {loading ? 'กำลังบันทึก…' : 'เปลี่ยนรหัส'}
 </button>
 </div>
 </>
 )}
 </Modal>
 );
}

// ─── Create Admin Modal ───
function CreateAdminModal({ onClose, onCreated }) {
 const [form, setForm] = useState({
 username: '', password: '', email: '', full_name: '',
 display_name: '', phone: '', department: 'property_manager',
 });
 const [show, setShow] = useState(false);
 const [loading, setLoading] = useState(false);
 const [err, setErr] = useState('');

 const handleCreate = async () => {
 setErr('');
 if (!form.username.trim()) return setErr('กรุณากรอก Username');
 if (!form.email.trim()) return setErr('กรุณากรอก Email');
 if (form.password.length < 6) return setErr('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
 setLoading(true);
 try {
 const r = await adminFetch('/api/admin/admins', {
 method: 'POST',
 headers: { 'Content-Type':'application/json' },
 body: JSON.stringify(form),
 });
 const d = await r.json();
 if (!r.ok) return setErr(d.error || 'เกิดข้อผิดพลาด');
 onCreated(); onClose();
 } catch { setErr('เกิดข้อผิดพลาด'); }
 finally { setLoading(false); }
 };

 return (
 <Modal title=" เพิ่มแอดมินใหม่" onClose={onClose}>
 <Field label="Username *">
 <input style={inp} value={form.username} onChange={e => setForm(f=>({...f,username:e.target.value}))} placeholder="admin01" />
 </Field>
 <Field label="อีเมล *">
 <input style={inp} type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="admin@example.com" />
 </Field>
 <Field label="รหัสผ่าน *">
 <div style={{ position:'relative' }}>
 <input style={inp} type={show ? 'text' : 'password'} autoComplete="new-password"
 value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))}
 placeholder="อย่างน้อย 6 ตัวอักษร" />
 <button onClick={() => setShow(s=>!s)}
 style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#888', fontSize:'0.85rem' }}>
 {show ? '' : ''}
 </button>
 </div>
 </Field>
 <Field label="ชื่อ-นามสกุลจริง">
 <input style={inp} value={form.full_name} onChange={e => setForm(f=>({...f,full_name:e.target.value}))} placeholder="ชื่อจริง นามสกุล" />
 </Field>
 <Field label="ชื่อที่แสดงใน Panel">
 <input style={inp} value={form.display_name} onChange={e => setForm(f=>({...f,display_name:e.target.value}))} placeholder="ถ้าไม่กรอกจะใช้ชื่อจริง" />
 </Field>
 <Field label="เบอร์โทร">
 <input style={inp} value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} placeholder="0xxxxxxxxx" />
 </Field>
 <Field label="ตำแหน่ง">
 <select style={inp} value={form.department} onChange={e => setForm(f=>({...f,department:e.target.value}))}>
 <option value="super_admin">Super Admin</option>
 <option value="property_manager">Property Manager</option>
 <option value="sales">Sales</option>
 <option value="content">Content</option>
 <option value="viewer">Viewer</option>
 </select>
 </Field>
 {err && <p style={{ color:'#e53e3e', fontSize:'0.82rem', marginBottom:10 }}>{err}</p>}
 <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
 <button style={btn('#f0f0f0','#555')} onClick={onClose}>ยกเลิก</button>
 <button style={btn(G,'#fff')} onClick={handleCreate} disabled={loading}>
 {loading ? 'กำลังสร้าง…' : ' สร้างแอดมิน'}
 </button>
 </div>
 </Modal>
 );
}

// ─── Delete Admin Modal ───
function DeleteAdminModal({ admin, onClose, onDeleted }) {
 const [loading, setLoading] = useState(false);
 const [err, setErr] = useState('');

 const handleDelete = async () => {
 setLoading(true);
 try {
 const r = await adminFetch(`/api/admin/admins/${admin.id}`, { method:'DELETE' });
 if (!r.ok) { const d = await r.json(); return setErr(d.error||'ลบไม่สำเร็จ'); }
 onDeleted(); onClose();
 } catch { setErr('เกิดข้อผิดพลาด'); }
 finally { setLoading(false); }
 };

 return (
 <Modal title="ยืนยันการลบแอดมิน" onClose={onClose} width={400}>
 <p style={{ fontSize:'0.9rem', color:'#333', marginBottom:8 }}>
 คุณแน่ใจหรือไม่ว่าต้องการลบแอดมิน <strong>{admin.username}</strong> ({admin.email}) ?
 </p>
 <p style={{ fontSize:'0.8rem', color:'#e53e3e', marginBottom:16 }}> การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
 {err && <p style={{ color:'#e53e3e', fontSize:'0.82rem', marginBottom:10 }}>{err}</p>}
 <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
 <button style={btn('#f0f0f0','#555')} onClick={onClose}>ยกเลิก</button>
 <button style={btn('#e53e3e')} onClick={handleDelete} disabled={loading}>{loading ? 'กำลังลบ…' : 'ลบแอดมิน'}</button>
 </div>
 </Modal>
 );
}

// ════════════════════════════════════════
// MAIN PANEL — export default
// ════════════════════════════════════════
export default function UsersPanel() {
 const [tab, setTab] = useState('users');
 const [users, setUsers] = useState([]);
 const [adminUsers, setAdminUsers] = useState([]);
 const [requests, setRequests] = useState([]);
 const [loading, setLoading] = useState(true);
 const [adminLoading, setAdminLoading] = useState(false);
 const [search, setSearch] = useState('');
 const [adminSearch, setAdminSearch] = useState('');
 const [statusFilter, setStatusFilter] = useState('');
 const [usersPage, setUsersPage] = useState(1);
 const [adminsPage, setAdminsPage] = useState(1);
 const [requestsPage, setRequestsPage] = useState(1);
 const USERS_PAGE_SIZE = 15;
 const ADMINS_PAGE_SIZE = 10;

 const [editAdmin, setEditAdmin] = useState(null);
 const [deleteAdmin, setDeleteAdmin] = useState(null);
 const [adminPwUser, setAdminPwUser] = useState(null); // เปลี่ยนรหัสแอดมิน
 const [showCreateAdmin, setShowCreateAdmin] = useState(false); // เพิ่มแอดมินใหม่

 const [editUser, setEditUser] = useState(null);
 const [pwUser, setPwUser] = useState(null);
 const [deleteUser, setDeleteUser] = useState(null);
 const [rejectReq, setRejectReq] = useState(null);
 const [approvingId, setApprovingId] = useState(null); // id ที่กำลัง approve

 // ── Auto-approve setting ──
 const [autoApprove, setAutoApprove] = useState(false);
 const [autoApproveLoading, setAutoApproveLoading] = useState(false);

 const fetchAutoApprove = useCallback(() => {
 adminFetch('/api/admin/settings/auto-approve')
 .then(r => r.json())
 .then(d => setAutoApprove(d.value === '1' || d.value === 1 || d.value === true || d.enabled === true || d.enabled === 1))
 .catch(() => {});
 }, []);

 const toggleAutoApprove = async () => {
 setAutoApproveLoading(true);
 const newVal = !autoApprove;
 try {
 const r = await adminFetch('/api/admin/settings/auto-approve', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ value: newVal ? '1' : '0' }),
 });
 if (r.ok) setAutoApprove(newVal);
 } catch {}
 finally { setAutoApproveLoading(false); }
 };

 const handleApproveRequest = async (reqId) => {
 setApprovingId(reqId);
 try {
 const r = await adminFetch(`/api/admin/password-requests/${reqId}/approve`, { method: 'PUT' });
 const d = await r.json();
 if (!r.ok) { alert(d.error || 'เกิดข้อผิดพลาด'); return; }
 fetchRequests();
 fetchUsers();
 } catch { alert('เกิดข้อผิดพลาด'); }
 finally { setApprovingId(null); }
 };

 const fetchUsers = useCallback(() => {
 setLoading(true);
 adminFetch('/api/admin/users')
 .then(r => r.json())
 .then(d => setUsers(Array.isArray(d) ? d : []))
 .catch(() => setUsers([]))
 .finally(() => setLoading(false));
 }, []);

 const fetchAdminUsers = useCallback(() => {
 setAdminLoading(true);
 adminFetch('/api/admin/admins')
 .then(r => r.json())
 .then(d => setAdminUsers(Array.isArray(d.data) ? d.data : []))
 .catch(() => setAdminUsers([]))
 .finally(() => setAdminLoading(false));
 }, []);

 const fetchRequests = useCallback(() => {
 adminFetch('/api/admin/password-requests')
 .then(r => r.json())
 .then(d => setRequests(Array.isArray(d) ? d : []))
 .catch(() => setRequests([]));
 }, []);

 useEffect(() => { fetchUsers(); fetchAdminUsers(); fetchRequests(); fetchAutoApprove(); }, [fetchUsers, fetchAdminUsers, fetchRequests, fetchAutoApprove]);

 const pendingCount = requests.filter(r => r.status === 'pending').length;

 const filteredUsers = users.filter(u => {
 const q = search.toLowerCase();
 const matchSearch = !q || (u.username||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q) || (u.full_name||'').toLowerCase().includes(q) || (u.phone||'').includes(q);
 const matchStatus = !statusFilter || u.status === statusFilter;
 return matchSearch && matchStatus;
 });
 const usersTotalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PAGE_SIZE));
 const usersCurPage = Math.min(usersPage, usersTotalPages);
 const pagedUsers = filteredUsers.slice((usersCurPage - 1) * USERS_PAGE_SIZE, usersCurPage * USERS_PAGE_SIZE);

 const filteredAdmins = adminUsers.filter(a => {
 const q = adminSearch.toLowerCase();
 return !q || (a.username||'').toLowerCase().includes(q) || (a.email||'').toLowerCase().includes(q) || (a.full_name||'').toLowerCase().includes(q);
 });
 const adminsTotalPages = Math.max(1, Math.ceil(filteredAdmins.length / ADMINS_PAGE_SIZE));
 const adminsCurPage = Math.min(adminsPage, adminsTotalPages);
 const pagedAdmins = filteredAdmins.slice((adminsCurPage - 1) * ADMINS_PAGE_SIZE, adminsCurPage * ADMINS_PAGE_SIZE);

 const requestsTotalPages = Math.max(1, Math.ceil(requests.length / ADMINS_PAGE_SIZE));
 const requestsCurPage = Math.min(requestsPage, requestsTotalPages);
 const pagedRequests = requests.slice((requestsCurPage - 1) * ADMINS_PAGE_SIZE, requestsCurPage * ADMINS_PAGE_SIZE);

 // Pagination arrows helper
 const PagArrows = ({ curPage, totalPages, setPage }) => {
 const canPrev = curPage > 1;
 const canNext = curPage < totalPages;
 const ab = (icon, enabled, onClick) => (
 <button onClick={enabled ? onClick : undefined} disabled={!enabled}
 style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid #e3e9ef', background: enabled ? '#fff' : '#f5f7fa', color: enabled ? G : '#ccc', cursor: enabled ? 'pointer' : 'not-allowed', fontSize: '0.82rem' }}>
 <i className={`fas ${icon}`} />
 </button>
 );
 return (
 <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, padding: '12px 20px', borderTop: '1px solid #f0f0f0' }}>
 {ab('fa-arrow-left', canPrev, () => setPage(curPage - 1))}
 <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#333', minWidth: 70, textAlign: 'center' }}>
 <span>{String(curPage).padStart(2, '0')}</span>
 <span style={{ opacity: 0.55 }}> / </span>
 <span style={{ opacity: 0.55 }}>{String(totalPages).padStart(2, '0')}</span>
 </div>
 {ab('fa-arrow-right', canNext, () => setPage(curPage + 1))}
 </div>
 );
 };

 const formatDate = (d) => d ? new Date(d).toLocaleDateString('th-TH', { day:'2-digit', month:'short', year:'2-digit' }) : '-';
 const formatDateFull = (d) => d ? new Date(d).toLocaleString('th-TH', { day:'2-digit', month:'short', year:'2-digit', hour:'2-digit', minute:'2-digit' }) : '-';

 const reqStatusConf = {
 pending: { label:'รอดำเนินการ', bg:'#fffbe6', color:'#875900', border:'#ffe58f' },
 approved: { label:'อนุมัติแล้ว', bg:'#e8f8f0', color:'#5a9a52', border:'#a3e0c0' },
 rejected: { label:'ปฏิเสธ', bg:'#fdf0f0', color:'#c0392b', border:'#e8b4b4' },
 };

 return (
 <div style={{ fontFamily:"'Sarabun',sans-serif" }}>

 {/* ─── Sub-tabs ─── */}
 <div className="admin-subtab-bar" style={{ background:'#fff', borderBottom:'1px solid #e8e8e8', display:'flex', gap:0, marginBottom:20 }}>
 {[
 { key:'users', label:`รายชื่อผู้ใช้ (${users.length})` },
 { key:'admins', label:`แอดมิน (${adminUsers.length})` },
 { key:'requests', label:`คำขอเปลี่ยนรหัส`, badge: pendingCount },
 ].map(t => (
 <button key={t.key} onClick={() => setTab(t.key)} style={{ position:'relative', background:'none', border:'none', borderBottom: tab===t.key ? `3px solid ${G}` : '3px solid transparent', color: tab===t.key ? G : '#666', fontWeight:700, fontSize:'0.88rem', padding:'12px 20px', cursor:'pointer', fontFamily:"'Sarabun',sans-serif", transition:'color 0.15s' }}>
 {t.label}
 {t.badge > 0 && (
 <span style={{ marginLeft:6, background:'#e53e3e', color:'#fff', borderRadius:20, padding:'1px 7px', fontSize:'0.7rem', fontWeight:900 }}>{t.badge}</span>
 )}
 </button>
 ))}
 </div>

 {/* ══════════ TAB: USERS ══════════ */}
 {tab === 'users' && (
 <>
 {/* Search & Filter */}
 <div style={{ background:'#f8fafc', borderRadius:12, border:'1px solid #e8e8e8', padding:'14px 16px', marginBottom:16, display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
 <div style={{ position:'relative', flex:'1 1 200px', minWidth:160 }}>
 <i className="fas fa-search" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#aaa', fontSize:'0.82rem' }} />
 <input style={{...inp, paddingLeft:32}} placeholder="ค้นหาชื่อ, อีเมล, เบอร์..." value={search} onChange={e => setSearch(e.target.value)} />
 </div>
 <select style={{...inp, flex:'0 0 auto', width:'auto', minWidth:120}} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
 <option value="">สถานะทั้งหมด</option>
 <option value="active">ใช้งาน</option>
 <option value="inactive">ระงับ</option>
 <option value="banned">แบน</option>
 </select>
 {(search || statusFilter) && (
 <button onClick={() => { setSearch(''); setStatusFilter(''); }} style={{ background:'none', border:'1px solid #ddd', color:'#888', borderRadius:8, padding:'8px 12px', fontSize:'0.8rem', cursor:'pointer' }}>
 ล้างตัวกรอง
 </button>
 )}
 </div>

 {/* Table */}
 {loading ? (
 <div style={{ textAlign:'center', padding:'48px 0', color:'#aaa' }}>
 <div style={{ fontSize:'1.8rem', marginBottom:8 }}>⏳</div><div>กำลังโหลด...</div>
 </div>
 ) : filteredUsers.length === 0 ? (
 <div style={{ textAlign:'center', padding:'48px 0', color:'#aaa' }}>
 <div style={{ fontSize:'2.2rem', marginBottom:8 }}></div><div>ไม่พบผู้ใช้</div>
 </div>
 ) : (
 <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e8e8e8', overflow:'hidden' }}>
 <div style={{ overflowX:'auto' }}>
 <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.84rem' }}>
 <thead>
 <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e8e8e8' }}>
 {['ผู้ใช้', 'ติดต่อ', 'สถานะ', 'บันทึก', 'สมัคร', 'จัดการ'].map(h => (
 <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontWeight:800, color:'#444', whiteSpace:'nowrap' }}>{h}</th>
 ))}
 </tr>
 </thead>
 <tbody>
 {pagedUsers.map((u, idx) => {
 const sc = STATUS_CONF[u.status] || STATUS_CONF.active;
 const hasPendingReq = (u.pending_pw_requests || 0) > 0;
 return (
 <tr key={u.id} style={{ borderBottom:'1px solid #f0f0f0', background: idx%2===0 ? '#fff' : '#fafbfc', transition:'background 0.1s' }}
 onMouseEnter={e => e.currentTarget.style.background='#f0faf4'}
 onMouseLeave={e => e.currentTarget.style.background = idx%2===0 ? '#fff' : '#fafbfc'}
 >
 <td style={{ padding:'10px 12px' }}>
 <div style={{ display:'flex', alignItems:'center', gap:9 }}>
 <div style={{ width:32, height:32, borderRadius:'50%', background:`linear-gradient(135deg,${Gl},#7ab872)`, color:'#1a3a18', fontWeight:900, fontSize:'0.95rem', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
 {(u.username||'?')[0].toUpperCase()}
 </div>
 <div>
 <div style={{ fontWeight:700, color:'#222' }}>{u.username}</div>
 {u.full_name && <div style={{ fontSize:'0.73rem', color:'#888' }}>{u.full_name}</div>}
 </div>
 </div>
 </td>
 <td style={{ padding:'10px 12px' }}>
 <div style={{ color:'#555', fontSize:'0.8rem' }}>{u.email}</div>
 {u.phone && <div style={{ color:'#888', fontSize:'0.76rem' }}>{u.phone}</div>}
 </td>
 <td style={{ padding:'10px 12px' }}>
 <span style={{ background:sc.bg, color:sc.color, border:`1px solid ${sc.border}`, borderRadius:6, padding:'2px 8px', fontSize:'0.76rem', fontWeight:700 }}>
 {sc.label}
 </span>
 </td>
 <td style={{ padding:'10px 12px', textAlign:'center', color:'#e53e3e', fontWeight:700 }}>
 {u.saved_count > 0 ? <span> {u.saved_count}</span> : <span style={{ color:'#ccc' }}>-</span>}
 </td>
 <td style={{ padding:'10px 12px', color:'#888', whiteSpace:'nowrap', fontSize:'0.78rem' }}>
 {formatDate(u.created_at)}
 </td>
 <td style={{ padding:'10px 12px' }}>
 <div style={{ display:'flex', gap:5, flexWrap:'nowrap' }}>
 <button onClick={() => setEditUser(u)} title="แก้ไข" style={{ background:'#eef2ff', border:'none', color:'#4361ee', borderRadius:7, padding:'6px 10px', cursor:'pointer', fontSize:'0.78rem', fontWeight:700 }}>
 <i className="fas fa-edit" />
 </button>
 <button onClick={() => setPwUser({ user:u, requestId:null })} title="เปลี่ยนรหัส" style={{ position:'relative', background: hasPendingReq ? '#fffbe6' : '#f0faf4', border:'none', color: hasPendingReq ? '#875900' : '#5a9a52', borderRadius:7, padding:'6px 10px', cursor:'pointer', fontSize:'0.78rem', fontWeight:700 }}>
 <i className="fas fa-key" />
 {hasPendingReq && <span style={{ position:'absolute', top:-4, right:-4, width:8, height:8, background:'#e53e3e', borderRadius:'50%' }} />}
 </button>
 <button onClick={() => setDeleteUser(u)} title="ลบ" style={{ background:'#fdf0f0', border:'none', color:'#c0392b', borderRadius:7, padding:'6px 10px', cursor:'pointer', fontSize:'0.78rem', fontWeight:700 }}>
 <i className="fas fa-trash" />
 </button>
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 {filteredUsers.length > 0 && (() => {
 const canPrev = usersCurPage > 1;
 const canNext = usersCurPage < usersTotalPages;
 const ab = (icon, enabled, onClick) => (
 <button onClick={enabled ? onClick : undefined} disabled={!enabled}
 style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid #e3e9ef', background: enabled ? '#fff' : '#f5f7fa', color: enabled ? G : '#ccc', cursor: enabled ? 'pointer' : 'not-allowed', fontSize: '0.82rem' }}>
 <i className={`fas ${icon}`} />
 </button>
 );
 return (
 <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, padding: '12px 20px', borderTop: '1px solid #f0f0f0' }}>
 {ab('fa-arrow-left', canPrev, () => setUsersPage(usersCurPage - 1))}
 <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#333', minWidth: 70, textAlign: 'center' }}>
 <span>{String(usersCurPage).padStart(2, '0')}</span>
 <span style={{ opacity: 0.55 }}> / </span>
 <span style={{ opacity: 0.55 }}>{String(usersTotalPages).padStart(2, '0')}</span>
 </div>
 {ab('fa-arrow-right', canNext, () => setUsersPage(usersCurPage + 1))}
 </div>
 );
 })()}
 <div style={{ padding:'8px 14px', borderTop:'1px solid #f0f0f0', fontSize:'0.76rem', color:'#aaa', textAlign:'right' }}>
 แสดง {pagedUsers.length} จาก {filteredUsers.length} ผู้ใช้{filteredUsers.length !== users.length ? ` (ทั้งหมด ${users.length})` : ''}
 </div>
 </div>
 )}
 </>
 )}

 {/* ══════════ TAB: ADMINS ══════════ */}
 {tab === 'admins' && (
 <>
 {/* Search + Add Admin button */}
 <div style={{ background:'#f8fafc', borderRadius:12, border:'1px solid #e8e8e8', padding:'14px 16px', marginBottom:16, display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
 <div style={{ position:'relative', flex:'1 1 200px', minWidth:160 }}>
 <i className="fas fa-search" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#aaa', fontSize:'0.82rem' }} />
 <input style={{...inp, paddingLeft:32}} placeholder="ค้นหา username, อีเมล, ชื่อ..." value={adminSearch} onChange={e => setAdminSearch(e.target.value)} />
 </div>
 <button onClick={() => setShowCreateAdmin(true)}
 style={{ ...btn(G), display:'flex', alignItems:'center', gap:6, flexShrink:0, whiteSpace:'nowrap', color:'#fff' }}>
 เพิ่มแอดมิน
 </button>
 </div>

 {adminLoading ? (
 <div style={{ textAlign:'center', padding:'48px 0', color:'#aaa' }}>
 <div style={{ fontSize:'1.8rem', marginBottom:8 }}>⏳</div><div>กำลังโหลด...</div>
 </div>
 ) : (
 <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e8e8e8', overflow:'hidden' }}>
 <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.84rem' }}>
 <thead>
 <tr style={{ background:'#f8f9fa', borderBottom:'1px solid #e8e8e8' }}>
 <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:'#555' }}>แอดมิน</th>
 <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:'#555' }} className="admin-col-hide">อีเมล</th>
 <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:'#555' }} className="admin-col-hide">เบอร์โทร</th>
 <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:'#555' }}>สถานะ</th>
 <th style={{ padding:'10px 14px', textAlign:'center', fontWeight:700, color:'#555' }}>จัดการ</th>
 </tr>
 </thead>
 <tbody>
 {pagedAdmins.map((a, i) => (
 <tr key={a.id} style={{ borderBottom:'1px solid #f0f0f0', background: i%2===0 ? '#fff' : '#fafafa' }}>
 <td style={{ padding:'10px 14px' }}>
 <div style={{ display:'flex', alignItems:'center', gap:10 }}>
 <div style={{ width:34, height:34, borderRadius:'50%', background:`linear-gradient(135deg,${N},#6aab62)`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:'0.85rem', flexShrink:0 }}>
 {(a.display_name || a.username || 'A').charAt(0).toUpperCase()}
 </div>
 <div>
 <div style={{ fontWeight:700, color:'#222' }}>{a.display_name || a.username}</div>
 <div style={{ fontSize:'0.75rem', color:'#888' }}>@{a.username} · {a.department || 'admin'}</div>
 </div>
 </div>
 </td>
 <td style={{ padding:'10px 14px', color:'#555' }} className="admin-col-hide">{a.email}</td>
 <td style={{ padding:'10px 14px', color:'#555' }} className="admin-col-hide">{a.phone || '-'}</td>
 <td style={{ padding:'10px 14px' }}>
 <span style={{ padding:'2px 10px', borderRadius:20, fontSize:'0.76rem', fontWeight:700,
 background: a.is_active ? '#e8f8f0' : '#fdf0f0',
 color: a.is_active ? '#5a9a52' : '#c0392b',
 border: `1px solid ${a.is_active ? '#a3e0c0' : '#e8b4b4'}` }}>
 {a.is_active ? 'ใช้งาน' : 'ระงับ'}
 </span>
 </td>
 <td style={{ padding:'10px 14px', textAlign:'center' }}>
 <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap' }}>
 <button onClick={() => setEditAdmin(a)}
 style={{ background:'#eef2ff', color:'#4361ee', border:'none', borderRadius:7, padding:'5px 10px', cursor:'pointer', fontSize:'0.78rem', fontWeight:700, fontFamily:"'Sarabun',sans-serif" }}>
 แก้ไข
 </button>
 <button onClick={() => setAdminPwUser(a)}
 style={{ background:'#f0fdf4', color:'#16a34a', border:'none', borderRadius:7, padding:'5px 10px', cursor:'pointer', fontSize:'0.78rem', fontWeight:700, fontFamily:"'Sarabun',sans-serif" }}
 title="เปลี่ยนรหัสผ่าน">
 รหัส
 </button>
 <button onClick={() => setDeleteAdmin(a)}
 style={{ background:'#fff0f0', color:'#c0392b', border:'none', borderRadius:7, padding:'5px 10px', cursor:'pointer', fontSize:'0.78rem', fontWeight:700, fontFamily:"'Sarabun',sans-serif" }}>
 ลบ
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 {filteredAdmins.length === 0 && (
 <div style={{ textAlign:'center', padding:'48px 0', color:'#aaa' }}>
 <div style={{ fontSize:'2.2rem', marginBottom:8 }}></div><div>ไม่พบแอดมิน</div>
 </div>
 )}
 {filteredAdmins.length > 0 && (
 <PagArrows curPage={adminsCurPage} totalPages={adminsTotalPages} setPage={setAdminsPage} />
 )}
 </div>
 )}
 </>
 )}

 {/* ══════════ TAB: PASSWORD REQUESTS ══════════ */}
 {tab === 'requests' && (
 <>
 {/* ── Auto-Approve Toggle ── */}
 <div style={{
 background: autoApprove ? 'linear-gradient(135deg,#e8f8f0,#f0fff8)' : '#f8fafc',
 border: `1.5px solid ${autoApprove ? '#a3e0c0' : '#e2e8f0'}`,
 borderRadius: 12, padding: '14px 18px', marginBottom: 18,
 display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap',
 }}>
 <div style={{ flex: 1 }}>
 <div style={{ fontWeight: 800, fontSize: '0.9rem', color: autoApprove ? '#5a9a52' : '#444', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 7 }}>
 {autoApprove ? '' : '⏸'} โหมดอนุมัติอัตโนมัติ
 <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: autoApprove ? '#5a9a52' : '#94a3b8', color: '#1a3a18', marginLeft: 4 }}>
 {autoApprove ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
 </span>
 </div>
 <div style={{ fontSize: '0.78rem', color: '#666', lineHeight: 1.5 }}>
 {autoApprove
 ? 'คำขอรีเซ็ตรหัสผ่านจะถูกอนุมัติและบังคับใช้ทันทีโดยไม่ต้องรอแอดมิน'
 : 'คำขอรีเซ็ตรหัสผ่านจะอยู่ในสถานะ "รอดำเนินการ" จนกว่าแอดมินจะอนุมัติ'}
 </div>
 </div>
 {/* Toggle switch */}
 <button
 onClick={toggleAutoApprove}
 disabled={autoApproveLoading}
 title={autoApprove ? 'คลิกเพื่อปิดโหมดอัตโนมัติ' : 'คลิกเพื่อเปิดโหมดอัตโนมัติ'}
 style={{
 width: 56, height: 30, borderRadius: 15, border: 'none', cursor: autoApproveLoading ? 'not-allowed' : 'pointer',
 background: autoApprove ? G : '#cbd5e1', position: 'relative', transition: 'background 0.25s', flexShrink: 0,
 padding: 0,
 }}
 >
 <span style={{
 position: 'absolute', top: 3,
 left: autoApprove ? 29 : 3,
 width: 24, height: 24, borderRadius: '50%',
 background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.22)',
 transition: 'left 0.25s', display: 'block',
 }} />
 </button>
 </div>

 <div style={{ marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
 <div style={{ fontSize:'0.88rem', color:'#555' }}>
 คำขอทั้งหมด <strong>{requests.length}</strong> รายการ · รอดำเนินการ <strong style={{ color:'#e53e3e' }}>{pendingCount}</strong> รายการ
 </div>
 <button onClick={fetchRequests} style={{ background:'#f0f0f0', border:'none', borderRadius:8, padding:'7px 12px', fontSize:'0.82rem', cursor:'pointer', color:'#555' }}>
 รีเฟรช
 </button>
 </div>

 {requests.length === 0 ? (
 <div style={{ textAlign:'center', padding:'48px 0', color:'#aaa' }}>
 <div style={{ fontSize:'2.2rem', marginBottom:8 }}></div>
 <div>ยังไม่มีคำขอเปลี่ยนรหัสผ่าน</div>
 </div>
 ) : (
 <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
 {pagedRequests.map(req => {
 const sc = reqStatusConf[req.status] || reqStatusConf.pending;
 const userObj = { id: req.user_id, username: req.username, email: req.email, phone: req.phone };
 return (
 <div key={req.id} className="admin-request-card" style={{ background:'#fff', borderRadius:12, border:`1px solid ${req.status==='pending' ? '#ffe58f' : '#e8e8e8'}`, padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, flexWrap:'wrap' }}>
 <div style={{ display:'flex', alignItems:'center', gap:12, flex:'1 1 200px' }}>
 <div style={{ width:38, height:38, borderRadius:'50%', background:`linear-gradient(135deg,${Gl},#7ab872)`, color:'#1a3a18', fontWeight:900, fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
 {(req.username||'?')[0].toUpperCase()}
 </div>
 <div>
 <div style={{ fontWeight:700, color:'#222' }}>{req.username}</div>
 <div style={{ fontSize:'0.76rem', color:'#888' }}>{req.email} {req.phone && `· ${req.phone}`}</div>
 </div>
 </div>
 <div style={{ flex:'0 1 180px', fontSize:'0.78rem', color:'#888' }}>
 <div>ยื่นคำขอ: {formatDateFull(req.requested_at)}</div>
 {req.resolved_at && <div>ดำเนินการ: {formatDateFull(req.resolved_at)}</div>}
 {/* badge: user ตั้งรหัสเองแล้ว vs ยังไม่ได้ตั้ง */}
 {req.status === 'pending' && (
 <div style={{ marginTop:5 }}>
 {req.has_new_password
 ? <span style={{ background:'#e8f8f0', color:'#5a9a52', border:'1px solid #a3e0c0', borderRadius:4, padding:'1px 7px', fontSize:'0.7rem', fontWeight:700 }}> User ตั้งรหัสใหม่แล้ว</span>
 : <span style={{ background:'#fffbe6', color:'#875900', border:'1px solid #ffe58f', borderRadius:4, padding:'1px 7px', fontSize:'0.7rem', fontWeight:700 }}> User ยังไม่ตั้งรหัส</span>
 }
 </div>
 )}
 {req.new_password_plain && (
 <div style={{ marginTop:5, background:'#f0f4ff', border:'1px solid #c7d2fe', borderRadius:6, padding:'4px 8px', fontSize:'0.76rem' }}>
 <span style={{ color:'#666' }}>รหัสใหม่: </span>
 <code style={{ color:'#6aab62', fontWeight:800, fontSize:'0.82rem', letterSpacing:'0.5px' }}>{req.new_password_plain}</code>
 </div>
 )}
 </div>
 <div style={{ flex:'0 1 140px' }}>
 <span style={{ background:sc.bg, color:sc.color, border:`1px solid ${sc.border}`, borderRadius:6, padding:'2px 8px', fontSize:'0.76rem', fontWeight:700 }}>{sc.label}</span>
 {req.note && <div style={{ fontSize:'0.74rem', color:'#888', marginTop:4, maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={req.note}>{req.note}</div>}
 </div>
 {req.status === 'pending' && (
 <div className="admin-request-actions" style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
 {/* อนุมัติ: ถ้า user ตั้งรหัสเองแล้ว → approve อัตโนมัติ ถ้ายังไม่ได้ → ให้ admin ตั้งเอง */}
 {req.has_new_password ? (
 <button
 onClick={() => handleApproveRequest(req.id)}
 disabled={approvingId === req.id}
 style={{ background:G, border:'none', color:'#fff', borderRadius:8, padding:'6px 16px', fontWeight:700, fontSize:'0.8rem', cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
 {approvingId === req.id ? '...' : ' อนุมัติ → รหัสเปลี่ยนทันที'}
 </button>
 ) : (
 <button onClick={() => setPwUser({ user: userObj, requestId: req.id })}
 style={{ background:'#3182ce', border:'none', color:'#fff', borderRadius:8, padding:'6px 16px', fontWeight:700, fontSize:'0.8rem', cursor:'pointer' }}>
 ตั้งรหัสให้ User
 </button>
 )}
 <button onClick={() => setRejectReq({ ...req })}
 style={{ background:'#fdf0f0', border:'1px solid #e8b4b4', color:'#c0392b', borderRadius:8, padding:'5px 12px', fontWeight:700, fontSize:'0.78rem', cursor:'pointer' }}>
 ปฏิเสธ
 </button>
 </div>
 )}
 {req.status !== 'pending' && <div style={{ color:'#aaa', fontSize:'0.78rem', flexShrink:0 }}>ดำเนินการแล้ว</div>}
 </div>
 );
 })}
 {requests.length > ADMINS_PAGE_SIZE && (
 <PagArrows curPage={requestsCurPage} totalPages={requestsTotalPages} setPage={setRequestsPage} />
 )}
 </div>
 )}
 </>
 )}

 {/* Modals — Users */}
 {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSaved={fetchUsers} />}
 {pwUser && <ChangePasswordModal user={pwUser.user} requestId={pwUser.requestId} onClose={() => setPwUser(null)} onSaved={() => { fetchUsers(); fetchRequests(); }} />}
 {deleteUser && <DeleteModal user={deleteUser} onClose={() => setDeleteUser(null)} onDeleted={fetchUsers} />}
 {rejectReq && <RejectModal req={rejectReq} onClose={() => setRejectReq(null)} onRejected={fetchRequests} />}

 {/* Modals — Admins */}
 {editAdmin && <EditAdminModal admin={editAdmin} onClose={() => setEditAdmin(null)} onSaved={fetchAdminUsers} />}
 {adminPwUser && <ChangeAdminPasswordModal admin={adminPwUser} onClose={() => setAdminPwUser(null)} onSaved={fetchAdminUsers} />}
 {deleteAdmin && <DeleteAdminModal admin={deleteAdmin} onClose={() => setDeleteAdmin(null)} onDeleted={fetchAdminUsers} />}
 {showCreateAdmin && <CreateAdminModal onClose={() => setShowCreateAdmin(false)} onCreated={fetchAdminUsers} />}
 </div>
 );
}
