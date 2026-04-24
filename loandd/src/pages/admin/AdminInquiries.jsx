import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import adminFetch from '../../utils/adminFetch';
import '../../css/adminMobile.css';

const STATUS_CONF = {
  new:       { label:'ใหม่',         bg:'#e8f4fd', color:'#2980b9', border:'#a8d4f0' },
  contacted: { label:'ติดต่อแล้ว',   bg:'#fffbe6', color:'#d4890a', border:'#ffd666' },
  closed:    { label:'ปิดแล้ว',      bg:'#f0f0f0', color:'#888',    border:'#ccc' },
};
const G = '#3d7a3a'; const Gl = '#A1D99B';
const N = '#3d7a3a';

// ── ยืนยันลบ Property Inquiry Modal ────────────────────────────────
function DeleteModal({ inq, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState('');

  const handle = async () => {
    setLoading(true);
    try {
      const r = await adminFetch(`/api/inquiries/${inq.id}`, { method: 'DELETE' });
      if (!r.ok) { const d = await r.json(); return setErr(d.error || 'ลบไม่สำเร็จ'); }
      onDeleted();
      onClose();
    } catch { setErr('เกิดข้อผิดพลาด'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:14, padding:'28px 24px', maxWidth:380, width:'100%', boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ textAlign:'center', marginBottom:16 }}>
          <div style={{ fontSize:'2.5rem', marginBottom:8 }}>🗑️</div>
          <h3 style={{ margin:0, color:N, fontSize:'1rem' }}>ยืนยันการลบข้อความ?</h3>
          <p style={{ color:'#666', fontSize:'0.85rem', marginTop:8 }}>
            ข้อความจาก <strong>{inq.name}</strong> จะถูกลบถาวร
          </p>
        </div>
        {err && <p style={{ color:'#e53e3e', fontSize:'0.82rem', textAlign:'center', marginBottom:10 }}>{err}</p>}
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose}
            style={{ flex:1, padding:'10px', borderRadius:8, border:'1.5px solid #dde', background:'#fff', cursor:'pointer', fontWeight:600, fontFamily:"'Sarabun',sans-serif" }}>
            ยกเลิก
          </button>
          <button onClick={handle} disabled={loading}
            style={{ flex:1, padding:'10px', borderRadius:8, border:'none', background:'#e74c3c', color:'#fff', cursor:'pointer', fontWeight:700, fontFamily:"'Sarabun',sans-serif" }}>
            {loading ? 'กำลังลบ…' : 'ลบเลย'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ยืนยันลบ Contact Message Modal ─────────────────────────────────
function DeleteContactModal({ contact, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState('');

  const handle = async () => {
    setLoading(true);
    try {
      const r = await adminFetch(`/api/inquiries/contact-messages/${contact.id}`, { method: 'DELETE' });
      if (!r.ok) { const d = await r.json(); return setErr(d.error || 'ลบไม่สำเร็จ'); }
      onDeleted();
      onClose();
    } catch { setErr('เกิดข้อผิดพลาด'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:14, padding:'28px 24px', maxWidth:380, width:'100%', boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ textAlign:'center', marginBottom:16 }}>
          <div style={{ fontSize:'2.5rem', marginBottom:8 }}>🗑️</div>
          <h3 style={{ margin:0, color:'#c0392b', fontSize:'1rem' }}>ยืนยันการลบข้อความ?</h3>
          <p style={{ color:'#666', fontSize:'0.85rem', marginTop:8 }}>
            ข้อความจาก <strong>{contact.name}</strong> จะถูกลบถาวร
          </p>
        </div>
        {err && <p style={{ color:'#e53e3e', fontSize:'0.82rem', textAlign:'center', marginBottom:10 }}>{err}</p>}
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose}
            style={{ flex:1, padding:'10px', borderRadius:8, border:'1.5px solid #dde', background:'#fff', cursor:'pointer', fontWeight:600, fontFamily:"'Sarabun',sans-serif" }}>
            ยกเลิก
          </button>
          <button onClick={handle} disabled={loading}
            style={{ flex:1, padding:'10px', borderRadius:8, border:'none', background:'#e74c3c', color:'#fff', cursor:'pointer', fontWeight:700, fontFamily:"'Sarabun',sans-serif" }}>
            {loading ? 'กำลังลบ…' : 'ลบเลย'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── แก้ไข Inquiry Modal ─────────────────────────────────────────────
function EditModal({ inq, onClose, onSaved }) {
  const [form, setForm]   = useState({ name: inq.name||'', phone: inq.phone||'', email: inq.email||'', message: inq.message||'' });
  const [loading, setLoading] = useState(false);
  const [err, setErr]     = useState('');

  const inp = { width:'100%', padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:'0.88rem', fontFamily:"'Sarabun',sans-serif", outline:'none', boxSizing:'border-box', backgroundColor:'#fff', color:'#000' };

  const handle = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const r = await adminFetch(`/api/inquiries/${inq.id}`, {
        method: 'PUT',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) return setErr(d.error || 'เกิดข้อผิดพลาด');
      onSaved({ ...inq, ...form });
      onClose();
    } catch { setErr('เกิดข้อผิดพลาด'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:460, boxShadow:'0 8px 40px rgba(0,0,0,0.22)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding:'16px 20px 12px', borderBottom:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontWeight:800, fontSize:'1rem', color:N }}>✏️ แก้ไขข้อความ #{String(inq.id).padStart(4,'0')}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:'1.3rem', cursor:'pointer', color:'#888' }}>×</button>
        </div>
        <form onSubmit={handle} style={{ padding:'18px 20px 22px' }}>
          <div style={{ marginBottom:12 }}>
            <label style={{ display:'block', fontSize:'0.78rem', fontWeight:700, color:'#555', marginBottom:4 }}>ชื่อ *</label>
            <input style={inp} value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} required />
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ display:'block', fontSize:'0.78rem', fontWeight:700, color:'#555', marginBottom:4 }}>เบอร์โทร *</label>
            <input style={inp} value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} required />
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ display:'block', fontSize:'0.78rem', fontWeight:700, color:'#555', marginBottom:4 }}>อีเมล</label>
            <input style={inp} type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} />
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:'0.78rem', fontWeight:700, color:'#555', marginBottom:4 }}>ข้อความ</label>
            <textarea style={{...inp, height:88, resize:'vertical'}} value={form.message} onChange={e => setForm(f=>({...f,message:e.target.value}))} />
          </div>
          {err && <p style={{ color:'#e53e3e', fontSize:'0.82rem', marginBottom:10 }}>{err}</p>}
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" onClick={onClose}
              style={{ padding:'9px 20px', borderRadius:8, border:'1.5px solid #dde', background:'#fff', cursor:'pointer', fontWeight:600, fontFamily:"'Sarabun',sans-serif" }}>
              ยกเลิก
            </button>
            <button type="submit" disabled={loading}
              style={{ padding:'9px 20px', borderRadius:8, border:'none', background:G, color:'#fff', cursor:'pointer', fontWeight:700, fontFamily:"'Sarabun',sans-serif" }}>
              {loading ? 'กำลังบันทึก…' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── InfoRow helper ───────────────────────────────────────────────────
function InfoRow({ icon, label, value, highlight }) {
  return (
    <div style={{ display:'flex', gap:10, padding:'5px 0', alignItems:'flex-start' }}>
      <i className={`fas ${icon}`} style={{ color:'#6aab62', width:16, marginTop:2, fontSize:'0.82rem' }} />
      <div style={{ flex:1 }}>
        <div style={{ fontSize:'0.72rem', color:'#aaa' }}>{label}</div>
        <div style={{ fontSize:'0.88rem', fontWeight: highlight ? 800 : 600, color: highlight ? G : '#333' }}>{value}</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════
export default function AdminInquiries() {
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState('property'); // 'property' | 'contact'

  // ── Property Inquiries ──
  const [inquiries, setInquiries]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch]             = useState('');
  const [searchInput, setSearchInput]   = useState('');
  const [selected, setSelected]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget]     = useState(null);
  const searchTimer                     = useRef(null);

  // ── Contact Messages ──
  const [contacts, setContacts]                   = useState([]);
  const [contactLoading, setContactLoading]       = useState(false);
  const [contactSearch, setContactSearch]         = useState('');
  const [contactSearchInput, setContactSearchInput] = useState('');
  const [selectedContact, setSelectedContact]     = useState(null);
  const [deleteContactTarget, setDeleteContactTarget] = useState(null);
  const contactSearchTimer                        = useRef(null);

  // ── Pagination (client-side) ──
  const [inqPage, setInqPage]         = useState(1);
  const [contactPage, setContactPage] = useState(1);
  const INQ_PAGE_SIZE = 15;

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin');
  };

  // ── Fetch property inquiries ──
  const fetchInquiries = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: 50 });
    if (statusFilter) params.set('status', statusFilter);
    if (search)       params.set('search', search);

    adminFetch(`/api/inquiries?${params}`)
      .then(r => r.json())
      .then(data => setInquiries(Array.isArray(data.data) ? data.data : []))
      .catch(() => setInquiries([]))
      .finally(() => setLoading(false));
  }, [statusFilter, search]);

  // ── Fetch contact messages ──
  const fetchContacts = useCallback(() => {
    setContactLoading(true);
    adminFetch('/api/inquiries/contact-messages')
      .then(r => r.json())
      .then(data => setContacts(Array.isArray(data.data) ? data.data : []))
      .catch(() => setContacts([]))
      .finally(() => setContactLoading(false));
  }, []);

  useEffect(() => { fetchInquiries(); }, [fetchInquiries]);
  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  // Re-fetch เมื่อ user กลับมาจาก tab อื่น
  useEffect(() => {
    const onVis = () => {
      if (!document.hidden) {
        fetchInquiries();
        fetchContacts();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [fetchInquiries, fetchContacts]);

  // debounce property search
  const handleSearchInput = (val) => {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(val), 400);
  };

  // debounce contact search (client-side filter)
  const handleContactSearchInput = (val) => {
    setContactSearchInput(val);
    clearTimeout(contactSearchTimer.current);
    contactSearchTimer.current = setTimeout(() => setContactSearch(val), 300);
  };

  const updateStatus = async (id, status) => {
    await adminFetch(`/api/inquiries/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchInquiries();
    if (selected?.id === id) setSelected(prev => ({ ...prev, status }));
  };

  const handleDeleted = () => {
    if (selected?.id === deleteTarget?.id) setSelected(null);
    fetchInquiries();
  };

  const handleContactDeleted = () => {
    if (selectedContact?.id === deleteContactTarget?.id) setSelectedContact(null);
    fetchContacts();
  };

  const handleSaved = (updated) => {
    if (selected?.id === updated.id) setSelected(updated);
    fetchInquiries();
  };

  const newCount = inquiries.filter(i => i.status === 'new').length;
  const adminUser = (() => { try { return JSON.parse(localStorage.getItem('adminUser') || '{}'); } catch { return {}; } })();

  // Track closed contact messages in localStorage (no backend status field)
  const [closedContactIds, setClosedContactIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('closedContactIds') || '[]')); }
    catch { return new Set(); }
  });
  const closeContactCase = (id) => {
    setClosedContactIds(prev => {
      const next = new Set(prev);
      next.add(id);
      try { localStorage.setItem('closedContactIds', JSON.stringify([...next])); } catch {}
      return next;
    });
  };
  const reopenContactCase = (id) => {
    setClosedContactIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      try { localStorage.setItem('closedContactIds', JSON.stringify([...next])); } catch {}
      return next;
    });
  };
  const unreadContactCount = contacts.filter(c => !closedContactIds.has(c.id)).length;

  // filtered contact list
  const filteredContacts = contactSearch
    ? contacts.filter(c =>
        (c.name||'').includes(contactSearch) ||
        (c.phone||'').includes(contactSearch) ||
        (c.email||'').includes(contactSearch) ||
        (c.topic||'').includes(contactSearch) ||
        (c.message||'').includes(contactSearch)
      )
    : contacts;

  // pagination slices
  const inqTotalPages = Math.max(1, Math.ceil(inquiries.length / INQ_PAGE_SIZE));
  const inqCurPage = Math.min(inqPage, inqTotalPages);
  const pagedInq = inquiries.slice((inqCurPage - 1) * INQ_PAGE_SIZE, inqCurPage * INQ_PAGE_SIZE);
  const contactTotalPages = Math.max(1, Math.ceil(filteredContacts.length / INQ_PAGE_SIZE));
  const contactCurPage = Math.min(contactPage, contactTotalPages);
  const pagedContacts = filteredContacts.slice((contactCurPage - 1) * INQ_PAGE_SIZE, contactCurPage * INQ_PAGE_SIZE);

  // pagination arrow component
  const PagArrows = ({ curPage, totalPages, setPage, color }) => {
    const canPrev = curPage > 1;
    const canNext = curPage < totalPages;
    const ab = (icon, enabled, onClick) => (
      <button onClick={enabled ? onClick : undefined} disabled={!enabled}
        style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid #e3e9ef', background: enabled ? '#fff' : '#f5f7fa', color: enabled ? (color || N) : '#ccc', cursor: enabled ? 'pointer' : 'not-allowed', fontSize: '0.85rem', boxShadow: enabled ? '0 1px 4px rgba(0,0,0,0.05)' : 'none' }}>
        <i className={`fas ${icon}`} />
      </button>
    );
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, padding: '14px 0 6px' }}>
        {ab('fa-arrow-left', canPrev, () => setPage(curPage - 1))}
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: N, minWidth: 70, textAlign: 'center' }}>
          <span>{String(curPage).padStart(2, '0')}</span>
          <span style={{ opacity: 0.55 }}> / </span>
          <span style={{ opacity: 0.55 }}>{String(totalPages).padStart(2, '0')}</span>
        </div>
        {ab('fa-arrow-right', canNext, () => setPage(curPage + 1))}
      </div>
    );
  };

  return (
    <div style={{ minHeight:'100vh', background:'#f5f7fa', fontFamily:"'Sarabun',sans-serif" }}>

      {/* ── NAVBAR ── */}
      <div style={{ background:`linear-gradient(135deg,${N},#6aab62)`, padding:'0 20px', height:60, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 12px rgba(0,0,0,0.18)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ fontWeight:900, fontSize:'1.25rem', color:'#fff', letterSpacing:1 }}>LOAN<span style={{ color:Gl }}>DD</span></div>
          <span style={{ background:'rgba(255,255,255,0.2)', color:'rgba(255,255,255,0.85)', fontSize:'0.7rem', padding:'2px 8px', borderRadius:10, fontWeight:700 }}>Admin</span>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          {/* Status filter pills — only for property tab */}
          {mainTab === 'property' && (
            <div style={{ display:'flex', gap:4 }} className="admin-nav-username">
              {['','new','contacted','closed'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  style={{ padding:'5px 10px', borderRadius:7, border:'none', cursor:'pointer', background: statusFilter===s ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)', color:'#fff', fontWeight: statusFilter===s ? 800 : 500, fontSize:'0.76rem', fontFamily:"'Sarabun',sans-serif" }}>
                  {s===''?'ทั้งหมด': s==='new'?'ใหม่': s==='contacted'?'ติดต่อแล้ว':'ปิดแล้ว'}
                </button>
              ))}
            </div>
          )}
          <div style={{ width:1, height:28, background:'rgba(255,255,255,0.2)', margin:'0 4px' }} className="admin-nav-username" />
          <div style={{ width:30, height:30, borderRadius:'50%', background:Gl, color:'#1a3a18', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:'0.78rem' }}>
            {(adminUser.username||'A').charAt(0).toUpperCase()}
          </div>
          <span className="admin-nav-username" style={{ color:'#fff', fontSize:'0.82rem', fontWeight:600 }}>{adminUser.username||'Admin'}</span>
          <button onClick={handleLogout}
            style={{ background:'rgba(220,38,38,0.15)', border:'1.5px solid rgba(220,38,38,0.4)', color:'#fca5a5', padding:'5px 12px', borderRadius:7, fontWeight:700, cursor:'pointer', fontSize:'0.78rem', display:'flex', alignItems:'center', gap:5, fontFamily:"'Sarabun',sans-serif" }}>
            <i className="fas fa-sign-out-alt" /> ออก
          </button>
        </div>
      </div>

      {/* ── PILL TAB NAV (dashboard nav) ── */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'16px 16px 0' }}>
        <div className="admin-pill-nav" style={{ position:'relative', display:'inline-flex', background:'#e2e8f0', borderRadius:14, padding:4, marginBottom:16, gap:0 }}>
          <div style={{ position:'absolute', top:4, bottom:4, width:'calc(25% - 4px)', left:'calc(50% + 2px)', background:'#fff', borderRadius:10, boxShadow:'0 2px 10px rgba(0,0,0,0.12)', zIndex:0 }} />
          {[
            { label:'ภาพรวม',  path:'/dashboard' },
            { label:'ทรัพย์',  path:'/admin/properties' },
            { label:'ข้อความ', path:'/admin/inquiries', count: newCount },
            { label:'ผู้ใช้',  path:'/admin/users' },
          ].map(t => {
            const active = t.path === '/admin/inquiries';
            return (
              <Link key={t.path} to={t.path}
                style={{ position:'relative', zIndex:1, textDecoration:'none', padding:'9px 22px', borderRadius:10, fontWeight: active ? 800 : 500, color: active ? N : '#94a3b8', fontSize:'0.85rem', fontFamily:"'Sarabun',sans-serif", transition:'color 0.2s', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}>
                {t.label}
                {t.count > 0 && (
                  <span style={{ background:'#e74c3c', color:'#fff', borderRadius:20, padding:'1px 6px', fontSize:'0.58rem', fontWeight:900 }}>{t.count}</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── PAGE HEADER ── */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 16px 12px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10, marginBottom:12 }}>
          <div>
            <h1 style={{ margin:0, fontSize:'1.2rem', fontWeight:900, color:N }}>
              <i className="fas fa-envelope" style={{ color:G, marginRight:8 }} />ข้อความจากผู้สนใจ
            </h1>
            {mainTab === 'property' && newCount > 0 && (
              <p style={{ margin:'2px 0 0', fontSize:'0.8rem', color:'#e74c3c', fontWeight:700 }}>
                <i className="fas fa-circle" style={{ fontSize:'0.5rem', marginRight:4 }} />ใหม่ {newCount} ข้อความรอตอบ
              </p>
            )}
          </div>
          <button onClick={() => mainTab === 'property' ? fetchInquiries() : fetchContacts()}
            style={{ background:'#f0f0f0', border:'none', borderRadius:8, padding:'7px 12px', fontSize:'0.82rem', cursor:'pointer', color:'#555', fontFamily:"'Sarabun',sans-serif" }}>
            🔄 รีเฟรช
          </button>
        </div>

        {/* ── Sub-tab switcher ── */}
        <div style={{ display:'flex', gap:0, marginBottom:14, background:'#e8edf2', borderRadius:10, padding:4, width:'fit-content' }}>
          <button
            onClick={() => setMainTab('property')}
            style={{
              padding:'7px 20px', borderRadius:8, border:'none', cursor:'pointer',
              background: mainTab === 'property' ? '#fff' : 'transparent',
              color: mainTab === 'property' ? N : '#94a3b8',
              fontWeight: mainTab === 'property' ? 800 : 500,
              fontSize:'0.85rem', fontFamily:"'Sarabun',sans-serif",
              boxShadow: mainTab === 'property' ? '0 2px 8px rgba(0,0,0,0.10)' : 'none',
              transition:'all 0.15s', display:'flex', alignItems:'center', gap:6,
            }}>
            <i className="fas fa-home" style={{ fontSize:'0.8rem' }} />
            ข้อความจากอสังหา
            {newCount > 0 && (
              <span style={{ background:'#e74c3c', color:'#fff', borderRadius:20, padding:'1px 6px', fontSize:'0.6rem', fontWeight:900 }}>{newCount}</span>
            )}
          </button>
          <button
            onClick={() => setMainTab('contact')}
            style={{
              padding:'7px 20px', borderRadius:8, border:'none', cursor:'pointer',
              background: mainTab === 'contact' ? '#fff' : 'transparent',
              color: mainTab === 'contact' ? N : '#94a3b8',
              fontWeight: mainTab === 'contact' ? 800 : 500,
              fontSize:'0.85rem', fontFamily:"'Sarabun',sans-serif",
              boxShadow: mainTab === 'contact' ? '0 2px 8px rgba(0,0,0,0.10)' : 'none',
              transition:'all 0.15s', display:'flex', alignItems:'center', gap:6,
            }}>
            <i className="fas fa-comments" style={{ fontSize:'0.8rem' }} />
            ข้อความติดต่อทั่วไป
            {unreadContactCount > 0 && (
              <span style={{ background:'#6aab62', color:'#fff', borderRadius:20, padding:'1px 6px', fontSize:'0.6rem', fontWeight:900 }}>{unreadContactCount}</span>
            )}
          </button>
        </div>

        {/* Search bar */}
        {mainTab === 'property' ? (
          <div style={{ position:'relative', maxWidth:420 }}>
            <i className="fas fa-search" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#aaa', fontSize:'0.82rem', pointerEvents:'none' }} />
            <input
              type="text"
              value={searchInput}
              onChange={e => handleSearchInput(e.target.value)}
              placeholder="ค้นหา ชื่อ เบอร์โทร อีเมล ข้อความ ทรัพย์..."
              style={{ width:'100%', padding:'9px 36px 9px 34px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:'0.88rem', fontFamily:"'Sarabun',sans-serif", outline:'none', boxSizing:'border-box', background:'#fff', color:'#111' }}
            />
            {searchInput && (
              <button onClick={() => { setSearchInput(''); setSearch(''); }}
                style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#aaa', fontSize:'1rem', lineHeight:1 }}>
                ×
              </button>
            )}
          </div>
        ) : (
          <div style={{ position:'relative', maxWidth:420 }}>
            <i className="fas fa-search" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#aaa', fontSize:'0.82rem', pointerEvents:'none' }} />
            <input
              type="text"
              value={contactSearchInput}
              onChange={e => handleContactSearchInput(e.target.value)}
              placeholder="ค้นหา ชื่อ เบอร์ อีเมล คำถาม..."
              style={{ width:'100%', padding:'9px 36px 9px 34px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:'0.88rem', fontFamily:"'Sarabun',sans-serif", outline:'none', boxSizing:'border-box', background:'#fff', color:'#111' }}
            />
            {contactSearchInput && (
              <button onClick={() => { setContactSearchInput(''); setContactSearch(''); }}
                style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#aaa', fontSize:'1rem', lineHeight:1 }}>
                ×
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── CONTENT GRID ── */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 16px 24px', display:'grid', gridTemplateColumns:'1fr 380px', gap:20, alignItems:'start' }}
        className="inq-grid">

        {/* ════ PROPERTY INQUIRIES TAB ════ */}
        {mainTab === 'property' && (
          <>
            {/* ── LIST ── */}
            <div>
              {loading ? (
                <div style={{ textAlign:'center', padding:60, color:'#aaa' }}><i className="fas fa-spinner fa-spin" style={{ fontSize:'2rem' }} /></div>
              ) : inquiries.length === 0 ? (
                <div style={{ background:'#fff', borderRadius:12, padding:60, textAlign:'center', color:'#aaa', boxShadow:'0 1px 8px rgba(0,0,0,0.06)' }}>
                  <i className="fas fa-inbox" style={{ fontSize:'2.5rem', display:'block', marginBottom:10 }} />
                  <p>{search ? `ไม่พบผลลัพธ์สำหรับ "${search}"` : 'ยังไม่มีข้อความ'}</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {pagedInq.map(inq => {
                    const sc         = STATUS_CONF[inq.status] || STATUS_CONF.new;
                    const isSelected = selected?.id === inq.id;
                    return (
                      <div key={inq.id}
                        onClick={() => setSelected(inq)}
                        style={{
                          background:  isSelected ? '#f0faf6' : '#fff',
                          border:      `1.5px solid ${isSelected ? G : '#e8edf2'}`,
                          borderRadius:10, padding:'12px 14px', cursor:'pointer',
                          boxShadow:'0 1px 6px rgba(0,0,0,0.05)', transition:'all 0.15s',
                          display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10,
                        }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4, flexWrap:'wrap' }}>
                            <strong style={{ fontSize:'0.92rem', color:N }}>{inq.name}</strong>
                            <span style={{ background:sc.bg, color:sc.color, border:`1px solid ${sc.border}`, padding:'1px 7px', borderRadius:20, fontSize:'0.7rem', fontWeight:700 }}>{sc.label}</span>
                            {inq.status === 'new' && <span style={{ background:'#e74c3c', color:'#fff', padding:'1px 6px', borderRadius:10, fontSize:'0.62rem', fontWeight:700 }}>NEW</span>}
                          </div>
                          <div style={{ fontSize:'0.8rem', color:'#555', display:'flex', gap:10, flexWrap:'wrap' }}>
                            <span><i className="fas fa-phone" style={{ color:G, marginRight:3, fontSize:'0.72rem' }} />{inq.phone}</span>
                            {inq.property_title && (
                              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:200 }}>
                                <i className="fas fa-home" style={{ color:'#6aab62', marginRight:3, fontSize:'0.72rem' }} />{inq.property_title}
                              </span>
                            )}
                          </div>
                          {inq.message && (
                            <p style={{ margin:'4px 0 0', fontSize:'0.78rem', color:'#999', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              "{inq.message}"
                            </p>
                          )}
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          <div style={{ fontSize:'0.7rem', color:'#aaa' }}>
                            {new Date(inq.created_at).toLocaleDateString('th-TH', { day:'numeric', month:'short' })}
                          </div>
                          <div style={{ fontSize:'0.65rem', color:'#bbb' }}>
                            {new Date(inq.created_at).toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit' })}
                          </div>
                          <div style={{ display:'flex', gap:4, marginTop:4, justifyContent:'flex-end' }}>
                            <button onClick={e => { e.stopPropagation(); setEditTarget(inq); }} title="แก้ไข"
                              style={{ background:'#eef2ff', border:'none', color:'#4361ee', borderRadius:6, padding:'3px 7px', cursor:'pointer', fontSize:'0.75rem' }}>
                              ✏️
                            </button>
                            <button onClick={e => { e.stopPropagation(); setDeleteTarget(inq); }} title="ลบ"
                              style={{ background:'#fff0f0', border:'none', color:'#c0392b', borderRadius:6, padding:'3px 7px', cursor:'pointer', fontSize:'0.75rem' }}>
                              🗑
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {!loading && inquiries.length > 0 && (
                <PagArrows curPage={inqCurPage} totalPages={inqTotalPages} setPage={setInqPage} />
              )}
            </div>

            {/* ── DETAIL PANEL (property) ── */}
            <div style={{ position:'sticky', top:20 }} className="inq-detail">
              {selected ? (
                <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 4px 20px rgba(0,0,0,0.10)', overflow:'hidden' }}>
                  <div style={{ background:`linear-gradient(135deg,${N},#4a8a43)`, padding:'14px 16px', color:'#fff', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontWeight:800, fontSize:'1rem' }}>{selected.name}</div>
                      <div style={{ opacity:0.6, fontSize:'0.76rem' }}>#{String(selected.id).padStart(4,'0')}</div>
                    </div>
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <button onClick={() => setEditTarget(selected)} title="แก้ไข"
                        style={{ background:'rgba(255,255,255,0.2)', border:'none', color:'#fff', borderRadius:7, padding:'5px 10px', cursor:'pointer', fontSize:'0.82rem' }}>
                        ✏️ แก้ไข
                      </button>
                      <button onClick={() => setDeleteTarget(selected)} title="ลบ"
                        style={{ background:'rgba(220,38,38,0.25)', border:'none', color:'#fca5a5', borderRadius:7, padding:'5px 10px', cursor:'pointer', fontSize:'0.82rem' }}>
                        🗑 ลบ
                      </button>
                      <button onClick={() => setSelected(null)}
                        style={{ background:'rgba(26,58,24,0.08)', border:'none', color:'#1a3a18', borderRadius:7, padding:'5px 9px', cursor:'pointer' }}>✕</button>
                    </div>
                  </div>
                  <div style={{ padding:'14px 16px', borderBottom:'1px solid #f0f4f8' }}>
                    <InfoRow icon="fa-phone"   label="เบอร์โทร" value={selected.phone} highlight />
                    {selected.email && <InfoRow icon="fa-envelope" label="อีเมล" value={selected.email} />}
                    {selected.property_title && (
                      <InfoRow icon="fa-home" label="ทรัพย์ที่สนใจ" value={
                        <a href={`/property/${selected.property_id}`} target="_blank" rel="noopener noreferrer"
                          style={{ color:G, textDecoration:'none', fontWeight:700 }}>
                          {selected.property_title} <i className="fas fa-external-link-alt" style={{ fontSize:'0.7rem' }} />
                        </a>
                      } />
                    )}
                    <InfoRow icon="fa-clock" label="วันเวลา" value={new Date(selected.created_at).toLocaleString('th-TH', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' })} />
                  </div>
                  {selected.message && (
                    <div style={{ padding:'12px 16px', borderBottom:'1px solid #f0f4f8' }}>
                      <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#888', marginBottom:5, textTransform:'uppercase' }}>ข้อความ</div>
                      <p style={{ margin:0, fontSize:'0.88rem', color:'#444', lineHeight:1.65, whiteSpace:'pre-wrap' }}>"{selected.message}"</p>
                    </div>
                  )}
                  <div style={{ padding:'12px 16px' }}>
                    <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#888', marginBottom:7, textTransform:'uppercase' }}>อัพเดทสถานะ</div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
                      {[{v:'new',l:'ใหม่'},{v:'contacted',l:'ติดต่อแล้ว'},{v:'closed',l:'ปิด'}].map(s => {
                        const sc     = STATUS_CONF[s.v];
                        const active = selected.status === s.v;
                        return (
                          <button key={s.v} onClick={() => updateStatus(selected.id, s.v)}
                            style={{ padding:'7px 14px', borderRadius:8, border:`1.5px solid ${active?sc.color:sc.border}`, background:active?sc.bg:'#fff', color:sc.color, cursor:'pointer', fontWeight:active?800:600, fontSize:'0.82rem', fontFamily:"'Sarabun',sans-serif" }}>
                            {s.l}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <a href={`tel:${selected.phone}`}
                        style={{ flex:1, background:G, color:'#fff', textDecoration:'none', borderRadius:8, padding:'9px', textAlign:'center', fontWeight:700, fontSize:'0.88rem', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                        <i className="fas fa-phone" /> โทรเลย
                      </a>
                      {selected.email && (
                        <a href={`mailto:${selected.email}`}
                          style={{ flex:1, background:'#e8f4fd', color:'#2980b9', textDecoration:'none', borderRadius:8, padding:'9px', textAlign:'center', fontWeight:700, fontSize:'0.88rem', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                          <i className="fas fa-envelope" /> อีเมล
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ background:'#fff', borderRadius:14, padding:'40px 20px', textAlign:'center', color:'#bbb', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
                  <i className="fas fa-mouse-pointer" style={{ fontSize:'2rem', display:'block', marginBottom:10 }} />
                  <p style={{ fontSize:'0.88rem' }}>เลือกข้อความเพื่อดูรายละเอียด</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ════ CONTACT MESSAGES TAB ════ */}
        {mainTab === 'contact' && (
          <>
            {/* ── Contact List ── */}
            <div>
              {contactLoading ? (
                <div style={{ textAlign:'center', padding:60, color:'#aaa' }}><i className="fas fa-spinner fa-spin" style={{ fontSize:'2rem' }} /></div>
              ) : filteredContacts.length === 0 ? (
                <div style={{ background:'#fff', borderRadius:12, padding:60, textAlign:'center', color:'#aaa', boxShadow:'0 1px 8px rgba(0,0,0,0.06)' }}>
                  <i className="fas fa-inbox" style={{ fontSize:'2.5rem', display:'block', marginBottom:10 }} />
                  <p>{contactSearch ? `ไม่พบผลลัพธ์สำหรับ "${contactSearch}"` : 'ยังไม่มีข้อความติดต่อ'}</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {pagedContacts.map(c => {
                    const isSelected = selectedContact?.id === c.id;
                    const isClosed = closedContactIds.has(c.id);
                    return (
                      <div key={c.id}
                        onClick={() => { setSelectedContact(c); if (!isClosed) closeContactCase(c.id); }}
                        style={{
                          background:  isSelected ? '#f0faf6' : (isClosed ? '#fafafa' : '#fff'),
                          border:      `1.5px solid ${isSelected ? G : '#e8edf2'}`,
                          borderRadius:10, padding:'12px 14px', cursor:'pointer',
                          boxShadow:'0 1px 6px rgba(0,0,0,0.05)', transition:'all 0.15s',
                          display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10,
                          opacity: isClosed ? 0.72 : 1,
                        }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          {/* Name */}
                          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4, flexWrap:'wrap' }}>
                            <strong style={{ fontSize:'0.92rem', color:N }}>{c.name}</strong>
                            <span style={{ background: isClosed ? '#f0f0f0' : '#eafaf0', color: isClosed ? '#888' : '#27ae60', border: `1px solid ${isClosed ? '#ddd' : '#a8e0b8'}`, padding:'1px 7px', borderRadius:20, fontSize:'0.7rem', fontWeight:700 }}>
                              {isClosed ? 'ปิดแล้ว' : 'ติดต่อทั่วไป'}
                            </span>
                          </div>
                          {/* Phone + Email */}
                          <div style={{ fontSize:'0.8rem', color:'#555', display:'flex', gap:10, flexWrap:'wrap', marginBottom:4 }}>
                            <span><i className="fas fa-phone" style={{ color:G, marginRight:3, fontSize:'0.72rem' }} />{c.phone}</span>
                            {c.email && <span><i className="fas fa-envelope" style={{ color:'#6aab62', marginRight:3, fontSize:'0.72rem' }} />{c.email}</span>}
                          </div>
                          {/* Topic — highlighted */}
                          {c.topic && (
                            <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#fff8e1', border:'1px solid #ffe082', borderRadius:6, padding:'3px 8px', marginBottom:4 }}>
                              <i className="fas fa-question-circle" style={{ color:'#f59e0b', fontSize:'0.72rem' }} />
                              <span style={{ fontSize:'0.8rem', fontWeight:700, color:'#92400e' }}>{c.topic}</span>
                            </div>
                          )}
                          {/* Message preview */}
                          {c.message && (
                            <p style={{ margin:'2px 0 0', fontSize:'0.78rem', color:'#999', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              "{c.message}"
                            </p>
                          )}
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          <div style={{ fontSize:'0.7rem', color:'#aaa' }}>
                            {new Date(c.created_at).toLocaleDateString('th-TH', { day:'numeric', month:'short' })}
                          </div>
                          <div style={{ fontSize:'0.65rem', color:'#bbb' }}>
                            {new Date(c.created_at).toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit' })}
                          </div>
                          <div style={{ display:'flex', gap:4, marginTop:4, justifyContent:'flex-end', flexWrap:'wrap' }}>
                            {isClosed ? (
                              <button onClick={e => { e.stopPropagation(); reopenContactCase(c.id); }} title="เปิดเคสใหม่"
                                style={{ background:'#fff8e1', border:'1px solid #ffe082', color:'#92400e', borderRadius:6, padding:'3px 8px', cursor:'pointer', fontSize:'0.7rem', fontWeight:700, fontFamily:"'Sarabun',sans-serif" }}>
                                <i className="fas fa-rotate-left" style={{ marginRight:3, fontSize:'0.62rem' }} />เปิดใหม่
                              </button>
                            ) : (
                              <button onClick={e => { e.stopPropagation(); closeContactCase(c.id); }} title="ปิดเคส"
                                style={{ background:'#f0f4f8', border:'1px solid #dde3ea', color:'#555', borderRadius:6, padding:'3px 8px', cursor:'pointer', fontSize:'0.7rem', fontWeight:700, fontFamily:"'Sarabun',sans-serif" }}>
                                <i className="fas fa-check" style={{ marginRight:3, fontSize:'0.62rem' }} />ปิดเคส
                              </button>
                            )}
                            <button onClick={e => { e.stopPropagation(); setDeleteContactTarget(c); }} title="ลบ"
                              style={{ background:'#fff0f0', border:'none', color:'#c0392b', borderRadius:6, padding:'3px 7px', cursor:'pointer', fontSize:'0.75rem' }}>
                              🗑
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {!contactLoading && filteredContacts.length > 0 && (
                <PagArrows curPage={contactCurPage} totalPages={contactTotalPages} setPage={setContactPage} />
              )}
            </div>

            {/* ── DETAIL PANEL (contact) ── */}
            <div style={{ position:'sticky', top:20 }} className="inq-detail">
              {selectedContact ? (
                <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 4px 20px rgba(0,0,0,0.10)', overflow:'hidden' }}>
                  {/* Header */}
                  <div style={{ background:'linear-gradient(135deg,#27ae60,#6aab62)', padding:'14px 16px', color:'#fff', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontWeight:800, fontSize:'1rem' }}>{selectedContact.name}</div>
                      <div style={{ opacity:0.6, fontSize:'0.76rem' }}>ข้อความติดต่อทั่วไป #{String(selectedContact.id).padStart(4,'0')}</div>
                    </div>
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <button onClick={() => setDeleteContactTarget(selectedContact)} title="ลบ"
                        style={{ background:'rgba(220,38,38,0.25)', border:'none', color:'#fca5a5', borderRadius:7, padding:'5px 10px', cursor:'pointer', fontSize:'0.82rem' }}>
                        🗑 ลบ
                      </button>
                      <button onClick={() => setSelectedContact(null)}
                        style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', borderRadius:7, padding:'5px 9px', cursor:'pointer' }}>✕</button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div style={{ padding:'14px 16px', borderBottom:'1px solid #f0f4f8' }}>
                    <InfoRow icon="fa-phone"   label="เบอร์โทร" value={selectedContact.phone} highlight />
                    {selectedContact.email && <InfoRow icon="fa-envelope" label="อีเมล" value={selectedContact.email} />}
                    <InfoRow icon="fa-clock"   label="วันเวลา" value={new Date(selectedContact.created_at).toLocaleString('th-TH', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' })} />
                  </div>

                  {/* Topic / คำถาม — highlighted box */}
                  {selectedContact.topic && (
                    <div style={{ padding:'12px 16px', borderBottom:'1px solid #f0f4f8', background:'#fffdf0' }}>
                      <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#d97706', marginBottom:6, textTransform:'uppercase', display:'flex', alignItems:'center', gap:5 }}>
                        <i className="fas fa-question-circle" />
                        คำถาม / หัวข้อ
                      </div>
                      <div style={{ background:'#fff8e1', border:'1.5px solid #ffe082', borderRadius:8, padding:'10px 14px' }}>
                        <p style={{ margin:0, fontSize:'0.92rem', fontWeight:700, color:'#92400e', lineHeight:1.6 }}>{selectedContact.topic}</p>
                      </div>
                    </div>
                  )}

                  {/* Message */}
                  {selectedContact.message && (
                    <div style={{ padding:'12px 16px', borderBottom:'1px solid #f0f4f8' }}>
                      <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#888', marginBottom:5, textTransform:'uppercase' }}>ข้อความ</div>
                      <p style={{ margin:0, fontSize:'0.88rem', color:'#444', lineHeight:1.65, whiteSpace:'pre-wrap' }}>"{selectedContact.message}"</p>
                    </div>
                  )}

                  {/* Quick actions */}
                  <div style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', gap:8 }}>
                      <a href={`tel:${selectedContact.phone}`}
                        style={{ flex:1, background:G, color:'#fff', textDecoration:'none', borderRadius:8, padding:'9px', textAlign:'center', fontWeight:700, fontSize:'0.88rem', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                        <i className="fas fa-phone" /> โทรเลย
                      </a>
                      {selectedContact.email && (
                        <a href={`mailto:${selectedContact.email}`}
                          style={{ flex:1, background:'#e8f4fd', color:'#2980b9', textDecoration:'none', borderRadius:8, padding:'9px', textAlign:'center', fontWeight:700, fontSize:'0.88rem', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                          <i className="fas fa-envelope" /> อีเมล
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ background:'#fff', borderRadius:14, padding:'40px 20px', textAlign:'center', color:'#bbb', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
                  <i className="fas fa-mouse-pointer" style={{ fontSize:'2rem', display:'block', marginBottom:10 }} />
                  <p style={{ fontSize:'0.88rem' }}>เลือกข้อความเพื่อดูรายละเอียด</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── MODALS ── */}
      {deleteTarget && (
        <DeleteModal
          inq={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
      {editTarget && (
        <EditModal
          inq={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
      )}
      {deleteContactTarget && (
        <DeleteContactModal
          contact={deleteContactTarget}
          onClose={() => setDeleteContactTarget(null)}
          onDeleted={handleContactDeleted}
        />
      )}

      <style>{`
        @media (max-width: 768px) {
          .inq-grid   { grid-template-columns: 1fr !important; }
          .inq-detail { position: static !important; }
        }
      `}</style>
    </div>
  );
}
