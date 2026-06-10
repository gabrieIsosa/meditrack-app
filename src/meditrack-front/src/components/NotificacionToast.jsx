import { useEffect, useState } from 'react';

const DURACION_MS = 4000;

function ToastItem({ notif, onRemove }) {
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setSaliendo(true), DURACION_MS - 400);
    const removeTimer = setTimeout(() => onRemove(notif.id), DURACION_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [notif.id, onRemove]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        borderRadius: '10px',
        padding: '12px 16px',
        width: '300px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        borderLeft: '4px solid #2563eb',
        opacity: saliendo ? 0 : 1,
        transform: saliendo ? 'translateX(20px)' : 'translateX(0)',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
        cursor: 'pointer',
      }}
      onClick={() => onRemove(notif.id)}
    >
      <span style={{ fontSize: '13px', fontWeight: '700' }}>{notif.titulo}</span>
      <span style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>{notif.mensaje}</span>
    </div>
  );
}

export default function NotificacionToast({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: 9999,
      }}
    >
      {toasts.map(n => (
        <ToastItem key={n.id} notif={n} onRemove={onRemove} />
      ))}
    </div>
  );
}
