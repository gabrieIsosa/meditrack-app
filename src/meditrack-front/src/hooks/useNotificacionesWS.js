import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = 'http://localhost:8080/ws';

/**
 * Abre una conexión WebSocket/STOMP autenticada y llama a onNotificacion
 * cada vez que el servidor envía una notificación nueva para este usuario.
 *
 * @param {string|null} userId   - ID del usuario logueado
 * @param {string|null} token    - JWT del usuario
 * @param {function}    onNotificacion - callback({ id, titulo, mensaje, fechaCreacion, leido })
 */
export function useNotificacionesWS(userId, token, onNotificacion) {
  const callbackRef = useRef(onNotificacion);
  useEffect(() => {
    callbackRef.current = onNotificacion;
  });

  useEffect(() => {
    if (!userId || !token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_URL}?token=${token}`),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/notificaciones/${userId}`, (frame) => {
          try {
            const notif = JSON.parse(frame.body);
            callbackRef.current(notif);
          } catch {
            // mensaje mal formado, ignorar
          }
        });
      },
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [userId, token]);
}
