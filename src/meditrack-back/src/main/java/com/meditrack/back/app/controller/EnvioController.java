package com.meditrack.back.app.controller;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.meditrack.back.app.model.Envio;
import com.meditrack.back.app.model.EstadoEnvio;
import com.meditrack.back.app.model.Role;
import com.meditrack.back.app.model.Sesion;
import com.meditrack.back.app.service.AuthService;
import com.meditrack.back.app.service.EnvioService;
import com.meditrack.back.app.service.EtiquetaService;

@RestController
@RequestMapping("/api/envios")
@CrossOrigin(origins = "*")
public class EnvioController {

    private final EnvioService envioService;
    private final AuthService authService;
    private final EtiquetaService etiquetaService;

    public EnvioController(EnvioService envioService, AuthService authService, EtiquetaService etiquetaService) {
        this.envioService = envioService;
        this.authService = authService;
        this.etiquetaService = etiquetaService;
    }

    private Sesion autenticar(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Token requerido");
        }
        return authService.validar(authHeader.substring(7));
    }

    @GetMapping
    public ResponseEntity<?> listarTodos(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            autenticar(authHeader);
            return ResponseEntity.ok(envioService.listarTodos());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerPorId(@PathVariable String id, @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            autenticar(authHeader);
            Envio envio = envioService.buscarPorId(id);
            return ResponseEntity.ok(envio);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("no encontrado")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Envio body, @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Sesion sesion = autenticar(authHeader);
            if (sesion.getRole() != Role.SUPERVISOR) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Sin permisos para esta acción"));
            }
            Envio nuevo = envioService.crear(body, sesion.getNombre());
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevo);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable String id, @RequestBody Envio body, @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Sesion sesion = autenticar(authHeader);
            if (sesion.getRole() != Role.SUPERVISOR) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Solo supervisores pueden editar datos"));
            }
            Envio actualizado = envioService.actualizar(id, body, sesion.getNombre());
            return ResponseEntity.ok(actualizado);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

@PutMapping("/{id}/estado")
    public ResponseEntity<?> cambiarEstado(@PathVariable String id, @RequestBody Map<String, String> body, @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Sesion sesion = autenticar(authHeader);
            if (sesion.getRole() == Role.OPERADOR) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Sin permisos para actualizar estados"));
            }
            EstadoEnvio nuevoEstado = EstadoEnvio.valueOf(body.get("estado"));
            String repartidorId = body.get("repartidorId");
            String tipoIncidencia = body.get("tipoIncidencia");
            String descripcionIncidencia = body.get("descripcionIncidencia");
            String receptorNombre = body.get("receptorNombre");
            String receptorDni = body.get("receptorDni");
            return ResponseEntity.ok(envioService.actualizarEstado(id, nuevoEstado, sesion.getNombre(), repartidorId, tipoIncidencia, descripcionIncidencia, receptorNombre, receptorDni));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Estado no válido"));
        } catch (RuntimeException e) {
            if (e.getMessage().contains("no encontrado")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }
    @PutMapping("/{id}/reasignar")
    public ResponseEntity<?> reasignarRepartidor(@PathVariable String id, @RequestBody Map<String, String> body, @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Sesion sesion = autenticar(authHeader);
            if (sesion.getRole() == Role.REPARTIDOR) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Los repartidores no pueden reasignar envíos"));
            }
            String nuevoRepartidorId = body.get("repartidorId");
            return ResponseEntity.ok(envioService.reasignarRepartidor(id, nuevoRepartidorId, sesion.getNombre()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/etiqueta")
    public ResponseEntity<?> descargarEtiqueta(@PathVariable String id, @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            autenticar(authHeader);
            Envio envio = envioService.buscarPorId(id);
            byte[] pdf = etiquetaService.generarEtiqueta(envio);
            String filename = "etiqueta-" + envio.getId() + ".pdf";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(pdf);
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("no encontrado")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Envío no encontrado"));
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/cancelar")
    public ResponseEntity<?> cancelar(@PathVariable String id, @RequestBody Map<String, String> body, @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Sesion sesion = autenticar(authHeader);
            if (sesion.getRole() != Role.SUPERVISOR) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Sin permisos para cancelar envíos"));
            }
            String fecha = body.getOrDefault("fecha", LocalDate.now().toString());
            String hora = body.getOrDefault("hora", LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")));
            String motivo = body.getOrDefault("motivo", "");
            String firma = body.getOrDefault("firma", "");
            String usuario = sesion.getNombre();
            return ResponseEntity.ok(envioService.cancelar(id, motivo, firma, fecha, hora, usuario));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            if (e.getMessage().contains("no encontrado")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }

}
