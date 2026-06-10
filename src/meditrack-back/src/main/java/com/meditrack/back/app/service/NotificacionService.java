package com.meditrack.back.app.service;

import java.util.List;
import java.util.Map;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.meditrack.back.app.model.Notificacion;
import com.meditrack.back.app.model.Usuario;
import com.meditrack.back.app.repository.NotificacionRepository;

@Service
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificacionService(NotificacionRepository notificacionRepository,
            SimpMessagingTemplate messagingTemplate) {
        this.notificacionRepository = notificacionRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public Notificacion crearNotificacion(Usuario usuarioDestino, String titulo, String mensaje) {
        if (usuarioDestino == null) {
            throw new IllegalArgumentException("El usuario destino de la notificación no puede ser nulo");
        }
        Notificacion notificacion = new Notificacion(usuarioDestino, titulo, mensaje);
        notificacionRepository.save(notificacion);

        messagingTemplate.convertAndSend(
            "/topic/notificaciones/" + usuarioDestino.getId(),
            Map.of(
                "id", notificacion.getId(),
                "titulo", notificacion.getTitulo(),
                "mensaje", notificacion.getMensaje(),
                "fechaCreacion", notificacion.getFechaCreacion(),
                "leido", false
            )
        );

        return notificacion;
    }

    public List<Notificacion> listarPorUsuario(Usuario usuarioDestino) {
        return notificacionRepository.findByUsuarioDestinoOrderByFechaCreacionDesc(usuarioDestino);
    }

    @Transactional
    public Notificacion marcarComoLeida(String id, Usuario usuarioLogueado) {
        Notificacion notificacion = notificacionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notificación no encontrada"));

        if (!notificacion.getUsuarioDestino().getId().equals(usuarioLogueado.getId())) {
            throw new RuntimeException("No tienes permisos para leer esta notificación");
        }

        notificacion.setLeido(true);
        return notificacionRepository.save(notificacion);
    }

    @Transactional
    public void marcarTodasComoLeidas(Usuario usuarioLogueado) {
        List<Notificacion> notificaciones = notificacionRepository.findByUsuarioDestinoOrderByFechaCreacionDesc(usuarioLogueado);
        for (Notificacion n : notificaciones) {
            if (!n.isLeido()) {
                n.setLeido(true);
                notificacionRepository.save(n);
            }
        }
    }

    public long obtenerCantidadSinLeer(Usuario usuarioLogueado) {
        return notificacionRepository.countByUsuarioDestinoAndLeidoFalse(usuarioLogueado);
    }

}
