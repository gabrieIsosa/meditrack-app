package com.meditrack.back.app.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.meditrack.back.app.model.AlertaFatiga;
import com.meditrack.back.app.model.Role;
import com.meditrack.back.app.model.Sesion;
import com.meditrack.back.app.model.Usuario;
import com.meditrack.back.app.service.AlertaFatigaService;
import com.meditrack.back.app.service.AuthService;
import com.meditrack.back.app.service.UsuarioService;

@RestController
@RequestMapping("/api/alertas-fatiga")
@CrossOrigin(origins = "*")
public class AlertaFatigaController {

    private final AlertaFatigaService alertaFatigaService;
    private final AuthService authService;
    private final UsuarioService usuarioService;

    public AlertaFatigaController(AlertaFatigaService alertaFatigaService,
                                  AuthService authService,
                                  UsuarioService usuarioService) {
        this.alertaFatigaService = alertaFatigaService;
        this.authService = authService;
        this.usuarioService = usuarioService;
    }

    private Sesion autenticar(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Token requerido");
        }
        return authService.validar(authHeader.substring(7));
    }

    private Usuario obtenerUsuario(Sesion sesion) {
        return usuarioService.buscarPorEmail(sesion.getEmail())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    /** Repartidor reporta que falló la validación de aptitud */
    @PostMapping
    public ResponseEntity<?> crearAlerta(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Sesion sesion = autenticar(authHeader);
            Usuario repartidor = obtenerUsuario(sesion);

            if (repartidor.getRole() != Role.REPARTIDOR) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Solo los repartidores pueden reportar alertas de fatiga"));
            }

            AlertaFatiga alerta = alertaFatigaService.crearAlerta(repartidor);
            return ResponseEntity.status(HttpStatus.CREATED).body(alerta);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    /** Supervisor/Admin consulta todas las alertas */
    @GetMapping
    public ResponseEntity<?> obtenerTodas(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Sesion sesion = autenticar(authHeader);
            Usuario usuario = obtenerUsuario(sesion);

            if (usuario.getRole() != Role.SUPERVISOR && usuario.getRole() != Role.ADMINISTRADOR) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Sin permisos para ver alertas de fatiga"));
            }

            List<AlertaFatiga> alertas = alertaFatigaService.obtenerTodas();
            return ResponseEntity.ok(alertas);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }

    /** Supervisor/Admin consulta solo alertas pendientes */
    @GetMapping("/pendientes")
    public ResponseEntity<?> obtenerPendientes(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Sesion sesion = autenticar(authHeader);
            Usuario usuario = obtenerUsuario(sesion);

            if (usuario.getRole() != Role.SUPERVISOR && usuario.getRole() != Role.ADMINISTRADOR) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Sin permisos para ver alertas de fatiga"));
            }

            return ResponseEntity.ok(alertaFatigaService.obtenerPendientes());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }

    /** Repartidor consulta su alerta pendiente actual (para polling de estado) */
    @GetMapping("/mi-alerta-pendiente")
    public ResponseEntity<?> obtenerMiAlertaPendiente(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Sesion sesion = autenticar(authHeader);
            Usuario repartidor = obtenerUsuario(sesion);

            AlertaFatiga alerta = alertaFatigaService.obtenerAlertaPendienteDeRepartidor(repartidor.getId());
            if (alerta == null) {
                return ResponseEntity.ok(Map.of("estado", "SIN_ALERTA"));
            }
            return ResponseEntity.ok(alerta);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }

    /** Consultar una alerta por ID */
    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerPorId(@PathVariable String id,
                                          @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            autenticar(authHeader);
            AlertaFatiga alerta = alertaFatigaService.obtenerPorId(id);
            return ResponseEntity.ok(alerta);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    /** Supervisor registra su resolución sobre una alerta */
    @PutMapping("/{id}/decision")
    public ResponseEntity<?> procesarDecision(@PathVariable String id,
                                              @RequestBody Map<String, String> body,
                                              @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Sesion sesion = autenticar(authHeader);
            Usuario supervisor = obtenerUsuario(sesion);

            String decision = body.get("decision");
            String observaciones = body.get("observaciones");

            if (decision == null || decision.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "La resolución es requerida"));
            }
            if (observaciones == null || observaciones.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Las observaciones son requeridas"));
            }

            AlertaFatiga resuelta = alertaFatigaService.procesarDecision(id, decision, supervisor, observaciones);
            return ResponseEntity.ok(resuelta);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Resolución inválida. Use BLOQUEADO o VALIDADO_FALLA"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

}
