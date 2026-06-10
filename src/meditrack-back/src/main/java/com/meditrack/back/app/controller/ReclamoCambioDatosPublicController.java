package com.meditrack.back.app.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.meditrack.back.app.model.ReclamoCambioDatos;
import com.meditrack.back.app.model.ReclamoCambioDatosRequest;
import com.meditrack.back.app.service.ReclamoCambioDatosService;

@RestController
@RequestMapping("/public/reclamos")
@CrossOrigin(origins = "*")
public class ReclamoCambioDatosPublicController {

    private final ReclamoCambioDatosService reclamoService;

    public ReclamoCambioDatosPublicController(ReclamoCambioDatosService reclamoService) {
        this.reclamoService = reclamoService;
    }

    @PostMapping("/cambio-datos")
    public ResponseEntity<?> crear(@RequestBody ReclamoCambioDatosRequest request) {
        try {
            ReclamoCambioDatos reclamo = reclamoService.crear(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "mensaje", "Reclamo registrado correctamente",
                    "idReclamo", reclamo.getId(),
                    "estado", reclamo.getEstado()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error interno al registrar el reclamo"));
        }
    }
}