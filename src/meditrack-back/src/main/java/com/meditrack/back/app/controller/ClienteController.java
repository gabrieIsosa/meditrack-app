package com.meditrack.back.app.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.meditrack.back.app.model.Cliente;
import com.meditrack.back.app.model.Sesion;
import com.meditrack.back.app.service.AuthService;
import com.meditrack.back.app.service.ClienteService;

@RestController
@RequestMapping("/api/clientes")
@CrossOrigin(origins = "*")
public class ClienteController {

    private final ClienteService clienteService;
    private final AuthService authService;

    public ClienteController(ClienteService clienteService, AuthService authService) {
        this.clienteService = clienteService;
        this.authService = authService;
    }

    private Sesion autenticar(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Token requerido");
        }

        return authService.validar(authHeader.substring(7));
    }

    @GetMapping
    public ResponseEntity<?> listarTodos(@RequestHeader(value = "Authorization",required = false) String authHeader) {
        try {
            autenticar(authHeader);

            return ResponseEntity.ok(clienteService.listarTodos());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error",e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerPorId(@PathVariable String id, @RequestHeader(value = "Authorization",required = false) String authHeader) {
        try {
            autenticar(authHeader);

            return ResponseEntity.ok(clienteService.obtenerPorId(id));
        } catch (RuntimeException e) {
            if (e.getMessage().contains("no encontrado")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error",e.getMessage()
                            )
                        );
            }

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(
                        Map.of("error",e.getMessage()
                        )
                    );
        }
    }

    @PostMapping( consumes = "application/json", produces = "application/json")
    public ResponseEntity<?> crear(
            @RequestBody Map<String, Object> body,

            @RequestHeader(
                value = "Authorization",
                required = false
            )
            String authHeader
    ) {
        try {
            //Sesion sesion = autenticar(authHeader);

            Cliente nuevo = clienteService.crear(body, "admin");

            return ResponseEntity.status(HttpStatus.CREATED).body(nuevo);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error",e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable String id,
            @RequestBody Map<String, Object> body,
            @RequestHeader(
                value = "Authorization",
                required = false
            )
            String authHeader
    ) {
        try {
            Sesion sesion = autenticar(authHeader);

            Cliente actualizado = clienteService.actualizar(id, body, sesion.getNombre());

            return ResponseEntity.ok(actualizado);

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error",e.getMessage()));
        }
    }

    @PutMapping("/{id}/cambiarEstado")
    public ResponseEntity<?> cambiarEstado(@PathVariable String id,@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            autenticar(authHeader);

            return ResponseEntity.ok(clienteService.cambiarEstado(id));
        } catch (RuntimeException e) {
            if (e.getMessage().contains("no encontrado")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error",e.getMessage()));
            }

            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error",e.getMessage()));
        }
    }

}
