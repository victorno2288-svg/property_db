import React, { useState, useEffect } from 'react';

/**
 * SaveToast — Global toast notification for property save/unsave actions.
 * Listens for 'property-save-toast' CustomEvent and shows a premium slide-up toast.
 *
 * Usage: Place <SaveToast /> once in App (or any layout wrapper).
 * Dispatch: window.dispatchEvent(new CustomEvent('property-save-toast', {
 *   detail: { saved: true, title: 'ชื่อทรัพย์', thumbnail: 'url' }
 * }));
 */

const DURATION = 2800;

function SaveToast() {
  const [toast, setToast] = useState(null); // { saved, title, thumbnail }
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      const { saved, title, thumbnail } = e.detail || {};
      setToast({ saved, title: title || 'ทรัพย์สิน', thumbnail });
      setVisible(true);
    };
    window.addEventListener('property-save-toast', handler);
    return () => window.removeEventListener('property-save-toast', handler);
  }, []);

  // Auto dismiss
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), DURATION);
    return () => clearTimeout(t);
  }, [visible, toast]);

  if (!toast) return null;

  return (
    <>
      <style>{`
        @keyframes toast-slide-up {
          from { transform: translateY(100%) scale(0.95); opacity: 0; }
          to   { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes toast-slide-down {
          from { transform: translateY(0) scale(1); opacity: 1; }
          to   { transform: translateY(100%) scale(0.95); opacity: 0; }
        }
        @keyframes toast-heart-pop {
          0%   { transform: scale(0.3) rotate(-15deg); opacity: 0; }
          50%  { transform: scale(1.3) rotate(5deg); }
          70%  { transform: scale(0.9); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes toast-progress {
          from { width: 100%; }
          to   { width: 0%; }
        }
        @keyframes toast-sparkle {
          0%   { transform: scale(0) rotate(0deg); opacity: 1; }
          100% { transform: scale(1) rotate(180deg); opacity: 0; }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          bottom: 70, left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10000,
          pointerEvents: 'none',
          animation: visible
            ? 'toast-slide-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
            : 'toast-slide-down 0.3s ease-in forwards',
        }}
      >
        <div style={{
          background: toast.saved
            ? 'linear-gradient(135deg, #A1D99B, #8BC683)'
            : 'rgba(30,30,28,0.92)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          color: toast.saved ? '#1a3a18' : '#fff',
          padding: '14px 22px 14px 16px',
          display: 'flex', alignItems: 'center', gap: 14,
          minWidth: 280, maxWidth: 400,
          boxShadow: '0 16px 48px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.06)',
          borderRadius: 4,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Heart Icon only (no thumbnail — avoids localhost URL issues) */}
          <div style={{
            width: 46, height: 46, flexShrink: 0,
            borderRadius: '50%',
            background: toast.saved ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className={toast.saved ? 'fas fa-heart' : 'far fa-heart'}
              style={{
                fontSize: '1.35rem',
                color: toast.saved ? '#e53e3e' : 'rgba(255,255,255,0.6)',
                animation: 'toast-heart-pop 0.5s ease-out',
              }}
            />
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.82rem', fontWeight: 700,
              fontFamily: "'Manrope', sans-serif",
              marginBottom: 2,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {toast.saved ? (
                <>
                  <i className="fas fa-check" style={{ color: '#a8e6cb', fontSize: '0.7rem' }} />
                  บันทึกแล้ว
                </>
              ) : (
                <>
                  <i className="fas fa-times" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }} />
                  ยกเลิกการบันทึก
                </>
              )}
            </div>
            <div style={{
              fontSize: '0.72rem',
              color: toast.saved ? 'rgba(26,58,24,0.7)' : 'rgba(255,255,255,0.55)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {toast.title}
            </div>
          </div>

          {/* Gold accent dot */}
          {toast.saved && (
            <div style={{
              width: 6, height: 6, background: '#c9a84c',
              borderRadius: '50%', flexShrink: 0,
              animation: 'toast-sparkle 0.8s ease-out 0.2s both',
            }} />
          )}

          {/* Progress bar */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
          }}>
            <div style={{
              height: '100%',
              background: toast.saved
                ? 'linear-gradient(90deg, #c9a84c, #a8e6cb)'
                : 'rgba(255,255,255,0.2)',
              animation: `toast-progress ${DURATION}ms linear forwards`,
            }} />
          </div>
        </div>
      </div>
    </>
  );
}

export default SaveToast;
