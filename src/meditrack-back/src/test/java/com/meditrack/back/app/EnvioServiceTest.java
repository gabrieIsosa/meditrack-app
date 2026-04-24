package com.meditrack.back.app;

import static org.junit.jupiter.api.Assertions.*;

import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.meditrack.back.app.model.Envio;
import com.meditrack.back.app.model.EstadoEnvio;
import com.meditrack.back.app.service.EnvioService;

class EnvioServiceTest {

    private EnvioService service;

    @BeforeEach
    void setUp() {
        service = new EnvioService();
    }

    @Test
    void listarTodos_retornaDatosSeed() {
        assertEquals(3, service.listarTodos().size());
    }

    @Test
    void crear_agregaEnvioEnEstadoCREADO() {
        Map<String, String> body = Map.of("destinatario", "Juan Pérez", "remitente", "Test");
        Envio nuevo = service.crear(body);
        assertEquals("Juan Pérez", nuevo.getDestinatario());
        assertEquals(EstadoEnvio.CREADO, nuevo.getEstado());
        assertEquals(4, service.listarTodos().size());
    }

    @Test
    void cambiarEstado_transicionValida() {
        Map<String, String> body = Map.of("destinatario", "Test", "remitente", "Test");
        Envio envio = service.crear(body);
        Envio actualizado = service.cambiarEstado(envio.getId(), EstadoEnvio.EN_TRANSITO, "2026-03-28", "10:00", "admin");
        assertEquals(EstadoEnvio.EN_TRANSITO, actualizado.getEstado());
    }

    @Test
    void cambiarEstado_transicionInvalida_lanzaExcepcion() {
        Map<String, String> body = Map.of("destinatario", "Test", "remitente", "Test");
        Envio envio = service.crear(body);
        assertThrows(IllegalArgumentException.class, () ->
            service.cambiarEstado(envio.getId(), EstadoEnvio.EN_DEPOSITO, "2026-03-28", "10:00", "admin")
        );
    }

    @Test
    void cambiarEstado_estadoFinal_lanzaExcepcion() {
        Envio envio = service.obtenerPorId("3"); // EN_SUCURSAL en el seed
        service.cambiarEstado(envio.getId(), EstadoEnvio.ENTREGADO, "2026-03-28", "10:00", "admin");
        assertThrows(IllegalStateException.class, () ->
            service.cambiarEstado(envio.getId(), EstadoEnvio.ENTREGADO, "2026-03-28", "10:00", "admin")
        );
    }

    @Test
    void obtenerPorId_noExiste_lanzaExcepcion() {
        assertThrows(RuntimeException.class, () -> service.obtenerPorId("999"));
    }

}
