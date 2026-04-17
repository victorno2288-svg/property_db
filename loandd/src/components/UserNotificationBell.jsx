/**
 * UserNotificationBell.jsx
 * กระดิ่งแจ้งเตือนสำหรับผู้ใช้ทั่วไป (ไม่ใช่ admin)
 * แสดงใน Navbar เมื่อ login แล้ว
 * แจ้งเตือน:
 *   - password_approved  → แอดมินอนุมัติคำขอเปลี่ยนรหัสแล้ว
 *   - property_sold      → ทรัพย์ที่บันทึกถูกขายแล้ว
 *   - property_rented    → ทรัพย์ที่บันทึกถูกจอง/เช่าแล้ว
 * ใช้ SSE (Server-Sent Events) แทน polling
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function formatTime(d) {
  if (!d) return '';
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (diff < 60) return 'เมื่อกี้';
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชม.ที่แล้ว`;
  return `${Math.floor(diff / 86400)} วันที่แล้ว`;
}

const TYPE_ICON = {
  password_approved: { icon: 'fas fa-key',  color: '#3d7a3a', label: 'รหัสผ่าน' },
  property_sold:     { icon: 'fas fa-home', color: '#e74c3c', label: 'ทรัพย์ขายแล้ว' },
  property_rented:   { icon: 'fas fa-key',  color: '#d4890a', label: 'ทรัพย์ถูกจอง' },
};

export default function UserNotificationBell() {
  const [open, setOpen]             = useState(false);
  const [notifications, setNotifs]  = useState([]);
  const [unread, setUnread]         = useState(0);
  const ref                         = useRef(null);
  const navigate                    = useNavigate();
  const esRef                       = useRef(null); // EventSource ref

  const token = localStorage.getItem('token');

  // ดึง notifications เต็มๆ จาก REST API (ใช้เมื่อเปิด dropdown)
  const fetchNotifs = useCallback(() => {
    if (!token) return;
    fetch(`${BASE_URL}/api/users/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setNotifs(data.notifications || []);
          setUnread(data.unread_count || 0);
        }
      })
      .catch(() => {});
  }, [token]);

  // SSE — เชื่อมต่อเพื่อรับ push event แบบ real-time
  useEffect(() => {
    if (!token) return;

    let retryDelay = 3000;      // เริ่มที่ 3 วิ
    let retryTimer = null;
    let destroyed  = false;

    const connect = () => {
      if (destroyed) return;
      const es = new EventSource(`${BASE_URL}/api/users/notifications/stream?token=${encodeURIComponent(token)}`);
      esRef.current = es;

      // รับค่า unread count เริ่มต้น
      es.addEventListener('init', (e) => {
        retryDelay = 3000; // reset backoff เมื่อ connect สำเร็จ
        try {
          const d = JSON.parse(e.data);
          setUnread(d.unread_count || 0);
        } catch (_) {}
      });

      // รับ notification ใหม่ทันที
      es.addEventListener('notification', (e) => {
        try {
          const d = JSON.parse(e.data);
          // เพิ่ม unread badge
          setUnread(prev => prev + (d.unread_delta || 1));
          // prepend ลง list (สร้าง fake entry เพื่อให้แสดงได้ก่อน refetch)
          setNotifs(prev => [{
            id: Date.now(),
            type: d.type,
            message: d.message,
            property_id: d.property_id || null,
            is_read: 0,
            created_at: new Date().toISOString(),
          }, ...prev].slice(0, 30));
        } catch (_) {}
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

    // โหลด notifications ครั้งแรก + เชื่อม SSE
    fetchNotifs();
    connect();

    return () => {
      destroyed = true;
      clearTimeout(retryTimer);
      esRef.current?.close();
    };
  }, [token, fetchNotifs]);

  // ปิดเมื่อ click outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen(o => !o);
    // mark as read เมื่อเปิด dropdown
    if (!open && unread > 0) {
      fetch(`${BASE_URL}/api/users/notifications/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }).then(() => setUnread(0)).catch(() => {});
    }
  };

  const handleClick = (notif) => {
    setOpen(false);
    if (notif.property_id && (notif.type === 'property_sold' || notif.type === 'property_rented')) {
      navigate(`/property/${notif.property_id}`);
    } else if (notif.type === 'password_approved') {
      navigate('/profile');
    }
  };

  if (!token) return null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        style={{
          background: open ? 'rgba(26,58,24,0.15)' : 'rgba(26,58,24,0.08)',
          border: '1px solid rgba(26,58,24,0.15)',
          borderRadius: 8,
          width: 38, height: 38,
          cursor: 'pointer',
          position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s',
          lineHeight: 1,
        }}
        title="การแจ้งเตือน"
      >
        <i className="fas fa-bell" style={{ fontSize: '1rem', color: '#1a3a18' }} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: '#e74c3c', color: '#fff',
            borderRadius: '50%', width: 16, height: 16,
            fontSize: '0.58rem', fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0,
          width: 300, background: '#fff', borderRadius: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.16)', zIndex: 999,
          fontFamily: "'Sarabun','Noto Sans Thai',sans-serif",
          overflow: 'hidden', marginTop: 8,
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid #f0f0f0',
            fontWeight: 800, fontSize: '0.9rem', color: '#3d7a3a',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span><i className="fas fa-bell" style={{ color: '#3d7a3a', marginRight: 6 }} />การแจ้งเตือน</span>
            {notifications.length > 0 && (
              <span style={{ fontSize: '0.72rem', color: '#aaa', fontWeight: 500 }}>
                {notifications.length} รายการ
              </span>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', color: '#aaa', fontSize: '0.85rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}><i className="fas fa-check-circle" style={{ color: '#c8e6d0' }} /></div>
                ไม่มีการแจ้งเตือนใหม่
              </div>
            ) : (
              notifications.map(n => {
                const meta = TYPE_ICON[n.type] || { icon: '📢', color: '#888', label: '' };
                return (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid #f5f5f5',
                      cursor: 'pointer',
                      background: n.is_read ? '#fff' : '#f0fdf7',
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f5fffe'}
                    onMouseLeave={e => e.currentTarget.style.background = n.is_read ? '#fff' : '#f0fdf7'}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                      background: `${meta.color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem',
                    }}>
                      <i className={meta.icon} style={{ color: meta.color, fontSize: '0.9rem' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '0.78rem', color: '#333', lineHeight: 1.4,
                        fontWeight: n.is_read ? 400 : 600,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#aaa', marginTop: 3 }}>
                        {formatTime(n.created_at)}
                      </div>
                    </div>
                    {!n.is_read && (
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: '#A1D99B', flexShrink: 0, marginTop: 4,
                      }} />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div
            onClick={() => { setOpen(false); navigate('/profile?tab=saved'); }}
            style={{
              padding: '10px 16px', textAlign: 'center', fontSize: '0.78rem',
              color: '#3d7a3a', fontWeight: 700, cursor: 'pointer',
              borderTop: '1px solid #f0f0f0',
            }}
          >
            ดูทรัพย์ที่บันทึกไว้ →
          </div>
        </div>
      )}
    </div>
  );
}
