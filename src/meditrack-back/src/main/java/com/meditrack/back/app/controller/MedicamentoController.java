package com.meditrack.back.app.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.meditrack.back.app.model.Medicamento;
import com.meditrack.back.app.model.Sesion;
import com.meditrack.back.app.service.AuthService;
import com.meditrack.back.app.service.CloudinaryService;
import com.meditrack.back.app.service.MedicamentoService;

@RestController
@RequestMapping("/api/medicamentos")
@CrossOrigin(origins = "*")
public class MedicamentoController {

    private final MedicamentoService medicamentoService;
    private final AuthService authService;
    private final CloudinaryService cloudinaryService;

    public MedicamentoController(MedicamentoService medicamentoService, AuthService authService, CloudinaryService cloudinaryService) {
        this.medicamentoService = medicamentoService;
        this.authService = authService;
        this.cloudinaryService = cloudinaryService;
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
            return ResponseEntity.ok(medicamentoService.listarTodos());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerPorId(@PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            autenticar(authHeader);

            return ResponseEntity.ok(medicamentoService.obtenerPorId(id));
        } catch (RuntimeException e) {
            if (e.getMessage().contains("no encontrado")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> crear(
            @RequestParam String nombre,
            @RequestParam(required = false) String descripcion,
            @RequestParam(required = false) String presentacion,
            @RequestParam int cantidad,
            @RequestParam(required = false) String unidadMedida,
            @RequestParam(required = false) String laboratorio,
            @RequestParam(required = false) String monodroga,
            @RequestParam(defaultValue = "false") boolean cadenaFrio,
            @RequestParam(required = false) MultipartFile imagen,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Sesion sesion = autenticar(authHeader);
            String imageUrl = cloudinaryService.subirImagen(imagen);
            Map<String, String> body = buildMedicamentoBody(
                    nombre, descripcion, presentacion, cantidad, unidadMedida,
                    laboratorio, monodroga, cadenaFrio, imageUrl);

            Medicamento nuevo = medicamentoService.crear(body, sesion.getNombre());
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevo);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> actualizar(
            @PathVariable String id,
            @RequestParam String nombre,
            @RequestParam(required = false) String descripcion,
            @RequestParam(required = false) String presentacion,
            @RequestParam int cantidad,
            @RequestParam(required = false) String unidadMedida,
            @RequestParam(required = false) String laboratorio,
            @RequestParam(required = false) String monodroga,
            @RequestParam(defaultValue = "false") boolean cadenaFrio,
            @RequestParam(required = false) MultipartFile imagen,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Sesion sesion = autenticar(authHeader);
            String imageUrl = cloudinaryService.subirImagen(imagen);
            Map<String, String> body = buildMedicamentoBody(
                    nombre, descripcion, presentacion, cantidad, unidadMedida,
                    laboratorio, monodroga, cadenaFrio, imageUrl);

            Medicamento actualizado = medicamentoService.actualizar(id, body, sesion.getNombre());
            return ResponseEntity.ok(actualizado);

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/cambiarEstado")
    public ResponseEntity<?> cambiarEstado(@PathVariable String id, @RequestBody Map<String, String> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            return ResponseEntity.ok(medicamentoService.cambiarEstado(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            if (e.getMessage().contains("no encontrado")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }

    private Map<String, String> buildMedicamentoBody(
            String nombre, String descripcion, String presentacion, int cantidad,
            String unidadMedida, String laboratorio, String monodroga,
            boolean cadenaFrio, String imageUrl) {

        Map<String, String> body = new HashMap<>();
        body.put("nombre", nombre);
        body.put("descripcion", descripcion);
        body.put("presentacion", presentacion);
        body.put("cantidad", String.valueOf(cantidad));
        body.put("unidadMedida", unidadMedida);
        body.put("laboratorio", laboratorio);
        body.put("monodroga", monodroga);
        body.put("cadenaFrio", String.valueOf(cadenaFrio));

        if (imageUrl != null) {
            body.put("imagenUrl", imageUrl);
        }

        return body;
    }

}
