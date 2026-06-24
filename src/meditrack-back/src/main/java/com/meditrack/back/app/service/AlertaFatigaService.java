package com.meditrack.back.app.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.meditrack.back.app.model.AlertaFatiga;
import com.meditrack.back.app.model.EstadoAlertaFatiga;
import com.meditrack.back.app.model.Role;
import com.meditrack.back.app.model.Usuario;
import com.meditrack.back.app.repository.AlertaFatigaRepository;
import com.meditrack.back.app.repository.UsuarioRepository;

@Service
public class AlertaFatigaService {

    private final AlertaFatigaRepository alertaFatigaRepository;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioService usuarioService;
    private final NotificacionService notificacionService;

    public AlertaFatigaService(AlertaFatigaRepository alertaFatigaRepository,
                               UsuarioRepository usuarioRepository,
                               UsuarioService usuarioService,
                               NotificacionService notificacionService) {
        this.alertaFatigaRepository = alertaFatigaRepository;
        this.usuarioRepository = usuarioRepository;
        this.usuarioService = usuarioService;
        this.notificacionService = notificacionService;
    }

    @Transactional
    public AlertaFatiga crearAlerta(Usuario repartidor) {
        if (alertaFatigaRepository.existsByRepartidorIdAndEstado(repartidor.getId(), EstadoAlertaFatiga.PENDIENTE)) {
            return alertaFatigaRepository
                    .findFirstByRepartidorIdAndEstado(repartidor.getId(), EstadoAlertaFatiga.PENDIENTE)
                    .orElseThrow();
        }

        AlertaFatiga alerta = new AlertaFatiga();
        alerta.setRepartidor(repartidor);

        AlertaFatiga saved = alertaFatigaRepository.save(alerta);

        List<Usuario> supervisores = usuarioRepository.findByRole(Role.SUPERVISOR);
        for (Usuario supervisor : supervisores) {
            try {
                notificacionService.crearNotificacion(
                    supervisor,
                    "Alerta de Fatiga - " + repartidor.getNombre(),
                    "El repartidor " + repartidor.getNombre() + " (DNI: " + repartidor.getDni() + ") no pudo superar la validación de aptitud. Se requiere tu resolución de bloqueo. Alerta ID: " + saved.getId()
                );
            } catch (Exception e) {
                System.err.println("Error al notificar supervisor " + supervisor.getNombre() + ": " + e.getMessage());
            }
        }

        return saved;
    }

    @Transactional
    public AlertaFatiga procesarDecision(String alertaId, String decision, Usuario supervisor, String observaciones) {
        AlertaFatiga alerta = alertaFatigaRepository.findById(alertaId)
                .orElseThrow(() -> new RuntimeException("Alerta no encontrada"));

        if (alerta.getEstado() != EstadoAlertaFatiga.PENDIENTE) {
            throw new RuntimeException("Esta alerta ya fue resuelta");
        }

        if (supervisor.getRole() != Role.SUPERVISOR && supervisor.getRole() != Role.ADMINISTRADOR) {
            throw new RuntimeException("No tienes permisos para resolver alertas de fatiga");
        }

        EstadoAlertaFatiga nuevoEstado = EstadoAlertaFatiga.valueOf(decision);
        alerta.setEstado(nuevoEstado);
        alerta.setSupervisor(supervisor);
        alerta.setFechaDecision(LocalDateTime.now());
        alerta.setObservaciones(observaciones);

        if (nuevoEstado == EstadoAlertaFatiga.BLOQUEADO) {
            usuarioService.bloquearUsuario(alerta.getRepartidor().getId(), supervisor);
            notificacionService.crearNotificacion(
                alerta.getRepartidor(),
                "Acceso bloqueado por supervisor",
                "El supervisor " + supervisor.getNombre() + " decidió bloquear tu acceso por fatiga detectada. Motivo: " + (observaciones != null ? observaciones : "Sin observaciones") + ". El bloqueo tiene una duración de 6 horas.",
                java.util.Map.of("tipo", "DECISION_FATIGA", "decision", "BLOQUEADO")
            );
        } else if (nuevoEstado == EstadoAlertaFatiga.VALIDADO_FALLA) {
            notificacionService.crearNotificacion(
                alerta.getRepartidor(),
                "Validación de aptitud: falla técnica confirmada",
                "El supervisor " + supervisor.getNombre() + " validó que el inconveniente fue una falla técnica. Puedes intentar iniciar la ruta nuevamente.",
                java.util.Map.of("tipo", "DECISION_FATIGA", "decision", "VALIDADO_FALLA")
            );
        }

        return alertaFatigaRepository.save(alerta);
    }

    public List<AlertaFatiga> obtenerPendientes() {
        return alertaFatigaRepository.findByEstadoOrderByFechaDeteccionDesc(EstadoAlertaFatiga.PENDIENTE);
    }

    public List<AlertaFatiga> obtenerTodas() {
        return alertaFatigaRepository.findAllByOrderByFechaDeteccionDesc();
    }

    public AlertaFatiga obtenerPorId(String id) {
        return alertaFatigaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alerta no encontrada"));
    }

    public AlertaFatiga obtenerAlertaPendienteDeRepartidor(String repartidorId) {
        return alertaFatigaRepository
                .findFirstByRepartidorIdAndEstado(repartidorId, EstadoAlertaFatiga.PENDIENTE)
                .orElse(null);
    }

}
