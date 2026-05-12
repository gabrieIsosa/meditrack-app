package com.meditrack.back.app;

import java.util.Map;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import com.meditrack.back.app.model.Envio;
import com.meditrack.back.app.model.EstadoEnvio;
import com.meditrack.back.app.service.EnvioService;

class EnvioServiceTest {

    private EnvioService service;
    private final String USUARIO_TEST = "admin_test";

    @BeforeEach
    void setUp() {
        service = new EnvioService();
    }

    @Test
    void listarTodos_inicialmenteVacio() {
        assertEquals(0, service.listarTodos().size());
    }

    @Test
    void crear_agregaEnvioEnEstadoPENDIENTE() {
        Map<String, String> body = Map.of(
            "destinatario", "Juan Pérez", 
            "remitente", "Laboratorio Central",
            "direccionEntrega", "Calle Falsa 123",
            "prioridad", "ALTA"
        );
        
        Envio nuevo = service.crear(body, USUARIO_TEST); 
        
        assertNotNull(nuevo.getId());
        assertEquals("Juan Pérez", nuevo.getDestinatario());
        assertEquals(EstadoEnvio.PENDIENTE, nuevo.getEstado());
        assertEquals(USUARIO_TEST, nuevo.getUsuarioResponsable());
        assertEquals(1, service.listarTodos().size());
    }

    @Test
    void actualizarEstado_cambiaEstadoCorrectamente() {
        Map<String, String> body = Map.of("destinatario", "Test", "remitente", "Test");
        Envio envio = service.crear(body, USUARIO_TEST);
        
        Envio actualizado = service.actualizarEstado(envio.getId(), EstadoEnvio.ASIGNADO, USUARIO_TEST, "REP-123");
        
        assertEquals(EstadoEnvio.ASIGNADO, actualizado.getEstado());
        assertEquals(USUARIO_TEST, actualizado.getUsuarioResponsable());
    }

    @Test
    void actualizarEstado_idInexistente_lanzaExcepcion() {
        assertThrows(RuntimeException.class, () -> 
            service.actualizarEstado("NON-EXISTENT-ID", EstadoEnvio.EN_TRANSITO, USUARIO_TEST, null)
        );
    }

    @Test
    void auditoria_registraFechaYHoraAutomaticamente() {
        Map<String, String> body = Map.of("destinatario", "Test Auditoria", "remitente", "Test");
        Envio nuevo = service.crear(body, USUARIO_TEST);
        
        assertNotNull(nuevo.getFechaCreacion());
        assertNotNull(nuevo.getHoraCreacion());
        assertEquals(USUARIO_TEST, nuevo.getUsuarioResponsable());
    }

    @Test
    void estados_todosLosNuevosEstadosSonAccesibles() {
        Map<String, String> body = Map.of("destinatario", "Test", "remitente", "Test");
        Envio envio = service.crear(body, USUARIO_TEST);
        
        service.actualizarEstado(envio.getId(), EstadoEnvio.EN_PREPARACION, USUARIO_TEST, null);
        assertEquals(EstadoEnvio.EN_PREPARACION, envio.getEstado());
        
        service.actualizarEstado(envio.getId(), EstadoEnvio.EN_PUNTO_DE_ENTREGA, USUARIO_TEST, null);
        assertEquals(EstadoEnvio.EN_PUNTO_DE_ENTREGA, envio.getEstado());
        
        service.actualizarEstado(envio.getId(), EstadoEnvio.INCIDENTE_REPORTADO, USUARIO_TEST, null);
        assertEquals(EstadoEnvio.INCIDENTE_REPORTADO, envio.getEstado());
        
        service.actualizarEstado(envio.getId(), EstadoEnvio.CANCELADO, USUARIO_TEST, null);
        assertEquals(EstadoEnvio.CANCELADO, envio.getEstado());
    }
}