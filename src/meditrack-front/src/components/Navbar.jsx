import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  logout as apiLogout,
  getNotificaciones,
  getNotificacionesUnreadCount,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas
} from '../services/api';
import logo from '../assets/logo.png';
import ModalHistorialNotificaciones from './ModalHistorialNotificaciones';

function Navbar({ publicMode = false, buttonText, buttonRoute }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const dropdownRef = useRef(null);

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const countData = await getNotificacionesUnreadCount();
      setUnreadCount(countData.cantidad);
    } catch (error) {
      console.error("Error al obtener conteo de notificaciones:", error);
    }
  };

  const fetchNotificationList = async () => {
    if (!user) return;
    try {
      const data = await getNotificaciones();
      setNotifications(data);
    } catch (error) {
      console.error("Error al obtener listado de notificaciones:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  useEffect(() => {
    if (user && (isOpen || showHistoryModal)) {
      fetchNotificationList();
    }
  }, [user, isOpen, showHistoryModal]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await marcarNotificacionLeida(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, leido: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await marcarTodasNotificacionesLeidas();
      setNotifications(prev => prev.map(n => ({ ...n, leido: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error al marcar todas como leídas:", error);
    }
  };

  const formatFriendlyDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('T');
      if (parts.length < 2) return dateStr;
      const dateParts = parts[0].split('-');
      const timeParts = parts[1].split(':');
      return `${dateParts[2]}/${dateParts[1]} ${timeParts[0]}:${timeParts[1]}`;
    } catch {
      return dateStr;
    }
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      logout();
      navigate('/');
    }
  };

  return (
    <nav className="navbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', backgroundColor: '#ffffff', borderBottom: '1px solid var(--border-color, #e5e7eb)', position: 'relative', zIndex: 1000 }}>
      <style>{`
        @media (max-width: 768px) {
          .nav-user-info { display: none !important; }
          .navbar-brand span { display: none !important; }
          .notification-dropdown { width: 280px !important; right: -60px !important; }
          .navbar { padding: 10px 12px !important; }
        }
      `}</style>
      
      <div
        className="navbar-brand"
        onClick={() => navigate('/menu')}
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <img
          src={logo}
          alt="MediTrack Logo"
          style={{
            height: '35px',
            width: 'auto',
            objectFit: 'contain'
          }}
        />
        <span style={{ fontWeight: 'bold', fontSize: '20px' }}>
          MediTrack
        </span>
      </div>

      <div className="navbar-user-section" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {!user ? (
          <button
            className="btn btn-secondary"
            onClick={() => navigate(buttonRoute || '/login')}
            style={{ 
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              cursor: 'pointer'
            }}
          >
            {buttonText || 'EMPLEADOS'}
          </button>
        ) : (
          <>
            {!publicMode && (
              <div className="nav-user-info" style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: '13px', fontWeight: 'bold', display: 'block',
                  color: 'var(--text-black, #111827)'
                }}>
                  {user.nombre}
                </span>

                <span className={`badge badge-${user.role}`} style={{ fontSize: '10px' }}>
                  {user.role}
                </span>
              </div>
            )}

            <div className="notification-bell-container" onClick={() => setIsOpen(!isOpen)} ref={dropdownRef} style={{ position: 'relative', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-black, #111827)' }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {unreadCount > 0 && (
                <div className="notification-badge" style={{ position: 'absolute', top: '-2px', right: '-2px', backgroundColor: '#ef4444', color: '#ffffff', fontSize: '10px', fontWeight: 'bold', borderRadius: '50%', minWidth: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                  {unreadCount}
                </div>
              )}

              {isOpen && (
                <div className="notification-dropdown" onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', right: '0', marginTop: '12px', width: '360px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                  <div className="notification-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#111827' }}>Notificaciones</h3>
                    {unreadCount > 0 && (
                      <button className="notification-mark-all-btn" onClick={handleMarkAllAsRead} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: '600', cursor: 'pointer', padding: 0 }}>
                        Marcar todas como leídas
                      </button>
                    )}
                  </div>
                  <div className="notification-list" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div className="notification-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', gap: '8px' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#9ca3af', opacity: 0.6 }}>
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                        <span className="notification-empty-text" style={{ fontSize: '13px', color: '#6b7280' }}>No tenés notificaciones</span>
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} className={`notification-item ${!notif.leido ? 'unread' : ''}`} style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', backgroundColor: !notif.leido ? '#f0f7ff' : '#ffffff', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div className="notification-item-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '10px' }}>
                            <span className="notification-item-title" style={{ fontSize: '13px', fontWeight: 'bold', color: '#111827' }}>{notif.titulo}</span>
                            <span className="notification-item-time" style={{ fontSize: '11px', color: '#6b7280', whiteSpace: 'nowrap' }}>{formatFriendlyDate(notif.fechaCreacion)}</span>
                          </div>
                          <div className="notification-item-body" style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.4' }}>{notif.mensaje}</div>
                          {!notif.leido && (
                            <button className="notification-item-action" onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notif.id);
                            }} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', alignmentSelf: 'flex-start', padding: '4px 0 0 0' }}>
                              Marcar como leída
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  <div style={{
                    padding: '12px 16px',
                    borderTop: '1px solid #e5e7eb',
                    textAlign: 'center',
                    backgroundColor: '#f9fafb'
                  }}>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        setShowHistoryModal(true);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontSize: '11px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        width: '100%',
                        padding: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      Ver Historial Completo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {showHistoryModal && (
              <ModalHistorialNotificaciones
                notifications={notifications}
                alCerrar={() => setShowHistoryModal(false)}
                alMarcarLeida={handleMarkAsRead}
              />
            )}

            <button
              className="btn btn-secondary"
              onClick={handleLogout}
              style={{
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '8px 14px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px'
              }}
            >
              SALIR
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;