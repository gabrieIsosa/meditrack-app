package com.meditrack.back.app.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.meditrack.back.app.model.Notificacion;
import com.meditrack.back.app.model.Usuario;
import com.meditrack.back.app.repository.NotificacionRepository;

@Service
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;

    public NotificacionService(NotificacionRepository notificacionRepository) {
        this.notificacionRepository = notificacionRepository;
    }

    @Transactional
    public Notificacion crearNotificacion(Usuario usuarioDestino, String titulo, String mensaje) {
        if (usuarioDestino == null) {
            throw new IllegalArgumentException("El usuario destino de la notificación no puede ser nulo");
        }
        Notificacion notificacion = new Notificacion(usuarioDestino, titulo, mensaje);
        return notificacionRepository.save(notificacion);
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
