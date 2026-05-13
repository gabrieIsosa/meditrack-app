package com.meditrack.back.app.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.meditrack.back.app.model.Medicamento;
import com.meditrack.back.app.model.Sesion;
import com.meditrack.back.app.service.AuthService;
import com.meditrack.back.app.service.MedicamentoService;

@RestController
@RequestMapping("/api/medicamentos")
@CrossOrigin(origins = "*")
public class MedicamentoController {

    private final MedicamentoService medicamentoService;
    private final AuthService authService;

    public MedicamentoController(MedicamentoService medicamentoService, AuthService authService) {
        this.medicamentoService = medicamentoService;
        this.authService = authService;
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
            Medicamento envio = medicamentoService.listarTodos().stream()
                    .filter(e -> e.getId().equals(id))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Medicamento no encontrado"));
            return ResponseEntity.ok(envio);
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
            @RequestParam int stock,
            @RequestParam(required = false) String unidadMedida,
            @RequestParam(required = false) String laboratorio,
            @RequestParam(required = false) String principioActivo,
            @RequestParam(defaultValue = "false") boolean cadenaFrio,
            @RequestParam(required = false) MultipartFile imagen,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Sesion sesion = autenticar(authHeader);
            /*
             * if (sesion.getRole() != Role.SUPERVISOR) {
             * return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error",
             * "Sin permisos para esta acción"));
             * }
             */
            String imageUrl = guardarImagen(imagen);

            Map<String, String> body = buildMedicamentoBody(
                    nombre,
                    descripcion,
                    presentacion,
                    stock,
                    unidadMedida,
                    laboratorio,
                    principioActivo,
                    cadenaFrio,
                    imageUrl);

            Medicamento nuevo = medicamentoService.crear(body, sesion.getNombre());
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevo);
        }
        catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
        catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> actualizar(
            @PathVariable String id,
            @RequestParam String nombre,
            @RequestParam(required = false) String descripcion,
            @RequestParam(required = false) String presentacion,
            @RequestParam int stock,
            @RequestParam(required = false) String unidadMedida,
            @RequestParam(required = false) String laboratorio,
            @RequestParam(required = false) String principioActivo,
            @RequestParam(defaultValue = "false") boolean cadenaFrio,
            @RequestParam(required = false) MultipartFile imagen,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Sesion sesion = autenticar(authHeader);

            String imageUrl = guardarImagen(imagen);

            Map<String, String> body = buildMedicamentoBody(
                    nombre,
                    descripcion,
                    presentacion,
                    stock,
                    unidadMedida,
                    laboratorio,
                    principioActivo,
                    cadenaFrio,
                    imageUrl);

            Medicamento actualizado = medicamentoService.actualizar(id, body, sesion.getNombre());
            return ResponseEntity.ok(actualizado);

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/cambiarEstado")
    public ResponseEntity<?> cambiarEstado(@PathVariable String id, @RequestBody Map<String, String> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            // Sesion sesion = autenticar(authHeader);
            /*
             * if (sesion.getRole() != Role.SUPERVISOR) {
             * return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error",
             * "Sin permisos para cancelar envíos"));
             * }
             */
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

    private String guardarImagen(MultipartFile imagen) throws IOException {
        if (imagen == null || imagen.isEmpty()) 
            return null;
        
        if (!imagen.getContentType().startsWith("image/")) 
            throw new RuntimeException("Archivo inválido");

        String originalName = imagen.getOriginalFilename()
                .replaceAll("\\s+", "_")
                .replaceAll("[^a-zA-Z0-9._-]", "");

        String fileName = UUID.randomUUID() + "_" + originalName;

        Path uploadPath = Paths.get(System.getProperty("user.dir"),"uploads");
        Files.createDirectories(uploadPath);

        Path filePath = uploadPath.resolve(fileName);
        Files.write(filePath,imagen.getBytes());

        return "/uploads/" + fileName;
    }

    private Map<String, String> buildMedicamentoBody(
            String nombre,
            String descripcion,
            String presentacion,
            int stock,
            String unidadMedida,
            String laboratorio,
            String principioActivo,
            boolean cadenaFrio,
            String imageUrl) {

        Map<String, String> body = new HashMap<>();

        body.put("nombre", nombre);
        body.put("descripcion", descripcion);
        body.put("presentacion", presentacion);
        body.put("stock", String.valueOf(stock));
        body.put("unidadMedida", unidadMedida);
        body.put("laboratorio", laboratorio);
        body.put("principioActivo", principioActivo);
        body.put("cadenaFrio", String.valueOf(cadenaFrio));

        if (imageUrl != null) {
            body.put("imagenUrl", imageUrl);
        }

        return body;
    }

}
