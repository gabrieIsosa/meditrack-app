package com.meditrack.back.app.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.meditrack.back.app.model.Envio;
import com.meditrack.back.app.model.ReclamoCambioDatos;
import com.meditrack.back.app.model.ReclamoCambioDatosRequest;
import com.meditrack.back.app.model.Role;
import com.meditrack.back.app.model.Usuario;
import com.meditrack.back.app.repository.EnvioRepository;
import com.meditrack.back.app.repository.ReclamoCambioDatosRepository;
import com.meditrack.back.app.repository.UsuarioRepository;

@Service
public class ReclamoCambioDatosService {

    private final ReclamoCambioDatosRepository reclamoRepository;
    private final EnvioRepository envioRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacionService notificacionService;

    public ReclamoCambioDatosService(
            ReclamoCambioDatosRepository reclamoRepository,
            EnvioRepository envioRepository,
            UsuarioRepository usuarioRepository,
            NotificacionService notificacionService) {
        this.reclamoRepository = reclamoRepository;
        this.envioRepository = envioRepository;
        this.usuarioRepository = usuarioRepository;
        this.notificacionService = notificacionService;
    }

    @Transactional
    public ReclamoCambioDatos crear(ReclamoCambioDatosRequest request) {
        if (request.getTrackingId() == null || request.getTrackingId().isBlank()) {
            throw new IllegalArgumentException("El trackingId es obligatorio");
        }

        if (request.getCampoReclamado() == null || request.getCampoReclamado().isBlank()) {
            throw new IllegalArgumentException("El campo reclamado es obligatorio");
        }

        if (request.getValorSolicitado() == null || request.getValorSolicitado().isBlank()) {
            throw new IllegalArgumentException("El valor solicitado es obligatorio");
        }

        if (request.getMotivo() == null || request.getMotivo().isBlank()) {
            throw new IllegalArgumentException("El motivo es obligatorio");
        }

        Envio envio = envioRepository.findById(request.getTrackingId())
                .orElseThrow(() -> new IllegalArgumentException("Envío no encontrado"));

        ReclamoCambioDatos reclamo = new ReclamoCambioDatos(
                envio,
                request.getCampoReclamado(),
                request.getValorSolicitado(),
                request.getMotivo(),
                request.getContacto()
        );

        ReclamoCambioDatos guardado = reclamoRepository.save(reclamo);

        List<Usuario> destinatarios = new ArrayList<>();
        destinatarios.addAll(usuarioRepository.findByRole(Role.SUPERVISOR));
        destinatarios.addAll(usuarioRepository.findByRole(Role.ADMINISTRADOR));

        for (Usuario usuario : destinatarios) {
            if (usuario.isEstadoActivo()) {
                notificacionService.crearNotificacion(
                        usuario,
                        "Nuevo reclamo por cambio de datos",
                        "Se registró un reclamo para el envío " + envio.getId()
                                + ". Campo: " + request.getCampoReclamado()
                                + ". Valor solicitado: " + request.getValorSolicitado()
                );
            }
        }

        return guardado;
    }
}