import { useState, useEffect } from 'react';
import { isOnline, getPendingSyncCount, syncOfflineQueue } from '../services/api';

export default function OfflineBanner() {
  const [online, setOnline] = useState(isOnline());
  const [pendingCount, setPendingCount] = useState(getPendingSyncCount());
  const [syncing, setSyncing] = useState(false);
  const [showOnlineNotification, setShowOnlineNotification] = useState(false);

  useEffect(() => {
    const handleOnline = async () => {
      setOnline(true);
      if (getPendingSyncCount() > 0) {
        setSyncing(true);
        const result = await syncOfflineQueue();
        setSyncing(false);
        if (result && result.success) {
          setShowOnlineNotification(true);
          setTimeout(() => {
            setShowOnlineNotification(false);
          }, 3500);
        }
      }
    };

    const handleOffline = () => {
      setOnline(false);
    };

    const handleSyncChange = (e) => {
      if (e.detail && typeof e.detail.count === 'number') {
        setPendingCount(e.detail.count);
      } else {
        setPendingCount(getPendingSyncCount());
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('meditrack-sync-changed', handleSyncChange);

    // Initial check: if we started online and have pending items, sync them
    if (online && getPendingSyncCount() > 0) {
      handleOnline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('meditrack-sync-changed', handleSyncChange);
    };
  }, []);

  if (syncing) {
    return (
      <div className="offline-banner-container offline-banner-syncing">
        <div className="offline-banner-content">
          <svg className="offline-banner-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="2" x2="12" y2="6"></line>
            <line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
            <line x1="2" y1="12" x2="6" y2="12"></line>
            <line x1="18" y1="12" x2="22" y2="12"></line>
            <line x1="6.83" y1="18.17" x2="9.66" y2="15.34"></line>
            <line x1="14.34" y1="9.66" x2="17.17" y2="6.83"></line>
          </svg>
          <span>Sincronizando cambios locales con el servidor...</span>
        </div>
      </div>
    );
  }

  if (!online) {
    return (
      <div className="offline-banner-container offline-banner-offline">
        <div className="offline-banner-content">
          <div className="offline-banner-dot offline-banner-pulse" />
          <span>
            Modo local activo (sin conexión).
            {pendingCount > 0 
              ? ` Tienes ${pendingCount} cambio${pendingCount === 1 ? '' : 's'} pendiente${pendingCount === 1 ? '' : 's'} de sincronización.` 
              : ' Datos de ruta guardados.'}
          </span>
        </div>
      </div>
    );
  }

  if (showOnlineNotification) {
    return (
      <div className="offline-banner-container offline-banner-online">
        <div className="offline-banner-content">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>¡Conexión restablecida! Cambios sincronizados correctamente.</span>
        </div>
      </div>
    );
  }

  return null;
}
