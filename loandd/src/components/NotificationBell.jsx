/**
 * NotificationBell.jsx
 * Bell icon สำหรับ Admin — แสดง pending password requests + new saves
 * ใช้ SSE (Server-Sent Events) แทน polling
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import adminFetch, { BASE_URL } from '../utils/adminFetch';

const G = '#04AA6D';

// สร้างเสียงกริ่งแจ้งเตือนด้วย Web Audio API (ไม่ต้องใช้ไฟล์เสียง)
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    // เสียง 1: ติ๊ง (สูง)
    const o1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    o1.type = 'sine';
    o1.frequency.setValueAtTime(880, ctx.currentTime);       // A5
    o1.frequency.setValueAtTime(1100, ctx.currentTime + 0.1); // C#6
    g1.gain.setValueAtTime(0.5, ctx.currentTime);
    g1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    o1.connect(g1).connect(ctx.destination);
    o1.start(ctx.currentTime);
    o1.stop(ctx.currentTime + 0.4);

    // เสียง 2: ติ๊ง (สูงกว่า) — delay 0.15 วินาที
    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(1320, ctx.currentTime + 0.15); // E6
    g2.gain.setValueAtTime(0, ctx.currentTime);
    g2.gain.setValueAtTime(0.5, ctx.currentTime + 0.15);
    g2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    o2.connect(g2).connect(ctx.destination);
    o2.start(ctx.currentTime + 0.15);
    o2.stop(ctx.currentTime + 0.6);

    // เสียง 3: ติ๊ง (สูงสุด) — delay 0.3 วินาที
    const o3 = ctx.createOscillator();
    const g3 = ctx.createGain();
    o3.type = 'sine';
    o3.frequency.setValueAtTime(1760, ctx.currentTime + 0.3); // A6
    g3.gain.setValueAtTime(0, ctx.currentTime);
    g3.gain.setValueAtTime(0.6, ctx.currentTime + 0.3);
    g3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
    o3.connect(g3).connect(ctx.destination);
    o3.start(ctx.currentTime + 0.3);
    o3.stop(ctx.currentTime + 0.8);

    // ปิด context หลังเสียงจบ
    setTimeout(() => ctx.close(), 1000);
  } catch (_) {
    // browser ไม่รองรับ Web Audio — ข้ามเสียง
  }
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open,  setOpen]  = useState(false);
  const [data,  setData]  = useState(null);  // { password_requests, saved_properties, counts }
  const bellRef = useRef(null);
  const esRef   = useRef(null); // EventSource ref

  // ดึง notifications เต็มๆ จาก REST API
  const fetchNotifs = useCallback(async () => {
    try {
      const r = await adminFetch('/api/admin/notifications');
      if (!r.ok) return;
      const d = await r.json();
      setData(d);
    } catch (_) {}
  }, []);

  // SSE — เชื่อมต่อรับ push events แบบ real-time
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) return;

    let retryDelay = 3000;
    let retryTimer = null;
    let destroyed  = false;

    const connect = () => {
      if (destroyed) return;
      const es = new EventSource(`${BASE_URL}/api/admin/notifications/stream?token=${encodeURIComponent(adminToken)}`);
      esRef.current = es;

      // รับ pending count เริ่มต้น
      es.addEventListener('init', () => {
        retryDelay = 3000; // reset backoff
        fetchNotifs();
      });

      // inquiry ใหม่ — เล่นเสียงกริ่งดังเตือนแอดมิน
      es.addEventListener('new_inquiry', () => {
        playNotificationSound();
        fetchNotifs();
      });

      // password request ใหม่ — เล่นเสียงเตือนด้วย
      es.addEventListener('new_password_request', () => {
        playNotificationSound();
        fetchNotifs();
      });

      // reconnect อัตโนมัติพร้อม exponential backoff (สูงสุด 60 วิ)
      es.onerror = () => {
        es.close();
        if (destroyed) return;
        retryTimer = setTimeout(() => {
          retryDelay = Math.min(retryDelay * 2, 60000);
          connect();
        }, retryDelay);
      };
    };

    fetchNotifs();
    connect();

    return () => {
      destroyed = true;
      clearTimeout(retryTimer);
      esRef.current?.close();
    };
  }, [fetchNotifs]);

  // click outside → ปิด dropdown
  useEffect(() => {
    const handleClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const total = data?.counts?.total || 0;
  const pendingPw = data?.counts?.pending_password || 0;
  const newInquiries = data?.counts?.new_inquiries || 0;

  const formatTime = (d) => {
    if (!d) return '';
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'เมื่อกี้';
    if (mins < 60) return `${mins} นาทีที่แล้ว`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs} ชม.ที่แล้ว`;
    return `${Math.floor(hrs / 24)} วันที่แล้ว`;
  };

  return (
    <div ref={bellRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifs(); /* refetch on open */ }}
        style={{
          position: 'relative', background: open ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
          width: 38, height: 38, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s',
        }}
        title="การแจ้งเตือน"
      >
        <i className="fas fa-bell" style={{ color: '#fff', fontSize: '1rem' }} />
        {total > 0 && (
          <span style={{
            position: 'absolute', top: -5, right: -5,
            background: '#e53e3e', color: '#fff',
            borderRadius: '50%', minWidth: 18, height: 18,
            fontSize: '0.65rem', fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px', border: '2px solid #1a2d4a',
            lineHeight: 1,
          }}>
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
          width: 340, maxHeight: '80vh', overflowY: 'auto',
          background: '#fff', borderRadius: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          zIndex: 9999, border: '1px solid #e8e8e8',
          fontFamily: "'Sarabun', sans-serif",
        }}>
          {/* Header */}
          <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1a2d4a' }}>
              <i className="fas fa-bell" style={{ color: G, marginRight: 7 }} />
              การแจ้งเตือน
            </span>
            <button onClick={fetchNotifs} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '0.8rem' }} title="รีเฟรช">
              <i className="fas fa-sync-alt" />
            </button>
          </div>

          {/* ─── Section: คำขอเปลี่ยนรหัส ─── */}
          {pendingPw > 0 && (
            <div>
              <div style={{ padding: '8px 18px 4px', fontSize: '0.72rem', fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                🔑 คำขอเปลี่ยนรหัสผ่าน ({pendingPw})
              </div>
              {data.password_requests.map(req => (
                <div key={req.id}
                  onClick={() => { setOpen(false); navigate('/dashboard', { state: { tab: 3, subtab: 'requests' } }); }}
                  style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderBottom: '1px solid #f5f5f5', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#fffbe6,#fde68a)', color: '#875900', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.85rem' }}>
                    {(req.username||'ผ')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {req.username} ขอเปลี่ยนรหัสผ่าน
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#aaa' }}>{formatTime(req.created_at)}</div>
                  </div>
                  <span style={{ background: '#fffbe6', color: '#875900', border: '1px solid #ffe58f', borderRadius: 4, padding: '2px 6px', fontSize: '0.68rem', fontWeight: 700, flexShrink: 0 }}>รอ</span>
                </div>
              ))}
            </div>
          )}

          {/* ─── Section: ข้อความสอบถามจากลูกค้า ─── */}
          {newInquiries > 0 && (
            <div>
              <div style={{ padding: '8px 18px 4px', fontSize: '0.72rem', fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                💬 ข้อความสอบถาม ({newInquiries})
              </div>
              {data.inquiries.slice(0, 10).map(inq => (
                <div key={inq.id}
                  onClick={() => { setOpen(false); navigate('/admin/inquiries'); }}
                  style={{ padding: '10px 18px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  {/* ชื่อ + สถานะ + วันที่ */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e0f2fe', color: '#0369a1', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>
                        {(inq.customer_name || 'ล')[0]}
                      </div>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#222' }}>{inq.customer_name}</span>
                      <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc', borderRadius: 4, padding: '1px 6px', fontSize: '0.65rem', fontWeight: 700 }}>ใหม่</span>
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#aaa' }}>{formatTime(inq.created_at)}</span>
                  </div>
                  {/* เบอร์โทร */}
                  <div style={{ fontSize: '0.76rem', color: '#04AA6D', fontWeight: 600, marginBottom: 2, paddingLeft: 34 }}>
                    <i className="fas fa-phone-alt" style={{ fontSize: '0.65rem', marginRight: 4 }} />{inq.phone}
                  </div>
                  {/* จังหวัด + ทรัพย์ */}
                  {inq.property_province && (
                    <div style={{ fontSize: '0.72rem', color: '#666', paddingLeft: 34, marginBottom: 2 }}>
                      <i className="fas fa-home" style={{ fontSize: '0.6rem', marginRight: 4, color: '#04AA6D' }} />{inq.property_province}
                    </div>
                  )}
                  {/* ข้อความ */}
                  {inq.message && (
                    <div style={{ fontSize: '0.72rem', color: '#888', paddingLeft: 34, fontStyle: 'italic' }}>
                      "{inq.message.length > 50 ? inq.message.slice(0, 50) + '...' : inq.message}"
                    </div>
                  )}
                </div>
              ))}
              {newInquiries > 10 && (
                <div style={{ padding: '8px 18px', fontSize: '0.75rem', color: '#888', textAlign: 'center' }}>
                  ... และอีก {newInquiries - 10} รายการ
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {total === 0 && (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#aaa' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎉</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>ไม่มีการแจ้งเตือนใหม่</div>
              <div style={{ fontSize: '0.75rem', marginTop: 4 }}>อัปเดตล่าสุดเมื่อกี้</div>
            </div>
          )}

          {/* Footer */}
          <div style={{ padding: '10px 18px', borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
            <button
              onClick={() => { setOpen(false); navigate('/admin/inquiries'); }}
              style={{ background: 'none', border: 'none', color: G, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
              ดูข้อความสอบถามทั้งหมด →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
