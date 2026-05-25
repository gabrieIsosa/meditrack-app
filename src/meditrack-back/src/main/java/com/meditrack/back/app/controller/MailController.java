package com.meditrack.back.app.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.meditrack.back.app.model.Mail;
import com.meditrack.back.app.model.Sesion;
import com.meditrack.back.app.service.AuthService;
import com.meditrack.back.app.service.MailService;

@RestController
@RequestMapping("/api/mails")
@CrossOrigin(origins = "*")
public class MailController {

    private final MailService mailService;
    private final AuthService authService;

    public MailController(
            MailService mailService,
            AuthService authService
    ) {
        this.mailService = mailService;
        this.authService = authService;
    }

    private Sesion autenticar(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Token requerido");
        }

        return authService.validar(authHeader.substring(7));
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Mail mail,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Sesion sesion = autenticar(authHeader);

            Mail nuevo = mailService.crear(mail,sesion.getNombre());

            return ResponseEntity.status(HttpStatus.CREATED).body(nuevo);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error",e.getMessage()));}
    }

    @GetMapping
    public ResponseEntity<?> listarTodos(
            @RequestHeader(
                value = "Authorization",
                required = false
            )
            String authHeader
    ) {
        try {
            autenticar(authHeader);

            List<Mail> mails = mailService.listarTodos();

            return ResponseEntity.ok(mails);

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error",e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerPorId(@PathVariable String id,
            @RequestHeader(
                value = "Authorization",
                required = false
            )
            String authHeader
    ) {
        try {
            autenticar(authHeader);

            Mail mail = mailService.obtenerPorId(id);

            return ResponseEntity.ok(mail);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("no encontrado")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error",e.getMessage()));
            }

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error",e.getMessage()));
        }
    }

    @GetMapping("/estado/{estado}")
    public ResponseEntity<?> obtenerPorEstado(@PathVariable String estado,
            @RequestHeader(
                value = "Authorization",
                required = false
            )
            String authHeader
    ) {
        try {
            autenticar(authHeader);

            List<Mail> mails = mailService.obtenerPorEstado(estado);

            return ResponseEntity.ok(mails);

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error",e.getMessage()));
        }
    }

    @GetMapping("/buscar")
    public ResponseEntity<?> buscar(@RequestParam String texto,
            @RequestHeader(
                value = "Authorization",
                required = false
            )
            String authHeader
    ) {
        try {
            autenticar(authHeader);

            List<Mail> mails = mailService.buscar(texto);

            return ResponseEntity.ok(mails);

        } catch (RuntimeException e) {

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error",e.getMessage()));
        }
    }
}