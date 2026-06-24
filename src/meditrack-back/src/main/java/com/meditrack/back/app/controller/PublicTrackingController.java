package com.meditrack.back.app.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.meditrack.back.app.model.TrackingPublicoDTO;
import com.meditrack.back.app.service.EnvioService;

@RestController
@RequestMapping("/public")
public class PublicTrackingController {

    private final EnvioService envioService;

    public PublicTrackingController(EnvioService envioService) {
        this.envioService = envioService;
    }

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("pong");
    }

    @GetMapping("/tracking/{id}")
    public ResponseEntity<TrackingPublicoDTO> consultarTracking(@PathVariable String id) {
        TrackingPublicoDTO dto = envioService.obtenerTrackingPublico(id);
        return ResponseEntity.ok(dto);
    }
    
}
