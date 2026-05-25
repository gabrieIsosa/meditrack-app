package com.meditrack.back.app.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.meditrack.back.app.model.Notificacion;
import com.meditrack.back.app.model.Sesion;
import com.meditrack.back.app.model.Usuario;
import com.meditrack.back.app.service.AuthService;
import com.meditrack.back.app.service.NotificacionService;
import com.meditrack.back.app.service.UsuarioService;

@RestController
@RequestMapping("/api/notificaciones")
@CrossOrigin(origins = "*")
public class NotificacionController {

    private final NotificacionService notificacionService;
    private final AuthService authService;
    private final UsuarioService usuarioService;

    public NotificacionController(NotificacionService notificacionService, AuthService authService, UsuarioService usuarioService) {
        this.notificacionService = notificacionService;
        this.authService = authService;
        this.usuarioService = usuarioService;
    }

    private Sesion autenticar(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Token requerido");
        }
        return authService.validar(authHeader.substring(7));
    }

    private Usuario obtenerUsuarioDesdeSesion(Sesion sesion) {
        return usuarioService.buscarPorEmail(sesion.getEmail())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado en la base de datos"));
    }

    @GetMapping
    public ResponseEntity<?> listarTodas(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Sesion sesion = autenticar(authHeader);
            Usuario usuario = obtenerUsuarioDesdeSesion(sesion);
            List<Notificacion> list = notificacionService.listarPorUsuario(usuario);
            return ResponseEntity.ok(list);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/sin-leer/cantidad")
    public ResponseEntity<?> obtenerCantidadSinLeer(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Sesion sesion = autenticar(authHeader);
            Usuario usuario = obtenerUsuarioDesdeSesion(sesion);
            long count = notificacionService.obtenerCantidadSinLeer(usuario);
            return ResponseEntity.ok(Map.of("cantidad", count));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/leer")
    public ResponseEntity<?> marcarComoLeida(@PathVariable String id, @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Sesion sesion = autenticar(authHeader);
            Usuario usuario = obtenerUsuarioDesdeSesion(sesion);
            Notificacion updated = notificacionService.marcarComoLeida(id, usuario);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/leer-todas")
    public ResponseEntity<?> marcarTodasComoLeidas(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Sesion sesion = autenticar(authHeader);
            Usuario usuario = obtenerUsuarioDesdeSesion(sesion);
            notificacionService.marcarTodasComoLeidas(usuario);
            return ResponseEntity.ok(Map.of("mensaje", "Todas las notificaciones fueron marcadas como leídas"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

}
