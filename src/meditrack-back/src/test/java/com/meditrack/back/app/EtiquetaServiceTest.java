package com.meditrack.back.app;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.meditrack.back.app.model.Envio;
import com.meditrack.back.app.model.EstadoEnvio;
import com.meditrack.back.app.service.EtiquetaService;

class EtiquetaServiceTest {

    private EtiquetaService service;

    @BeforeEach
    void setUp() {
        service = new EtiquetaService();
    }

    @Test
    void generarEtiqueta_retornaByteArrayNoVacio() {
        byte[] pdf = service.generarEtiqueta(crearEnvioTest());
        assertNotNull(pdf);
        assertTrue(pdf.length > 0);
    }

    @Test
    void generarEtiqueta_esPdfValido() {
        byte[] pdf = service.generarEtiqueta(crearEnvioTest());
        assertEquals("%PDF", new String(pdf, 0, 4));
    }

    @Test
    void generarEtiqueta_tamanoRazonable() {
        byte[] pdf = service.generarEtiqueta(crearEnvioTest());
        assertTrue(pdf.length > 1024, "El PDF debe pesar más de 1KB");
    }

    @Test
    void generarEtiqueta_sinObservaciones_noLanzaExcepcion() {
        Envio envio = crearEnvioTest();
        envio.setObservaciones(null);
        assertDoesNotThrow(() -> service.generarEtiqueta(envio));
    }

    @Test
    void generarEtiqueta_observacionesVacias_noLanzaExcepcion() {
        Envio envio = crearEnvioTest();
        envio.setObservaciones("   ");
        assertDoesNotThrow(() -> service.generarEtiqueta(envio));
    }

    @Test
    void generarEtiqueta_camposOpccionalesNulos_noLanzaExcepcion() {
        Envio envio = new Envio();
        envio.setId("ABC12345");
        envio.setEstado(EstadoEnvio.PENDIENTE);
        assertDoesNotThrow(() -> service.generarEtiqueta(envio));
    }

    @Test
    void generarEtiqueta_conTodosLosCampos_retornaPdfValido() {
        byte[] pdf = service.generarEtiqueta(crearEnvioTest());
        assertEquals("%PDF", new String(pdf, 0, 4));
        assertTrue(pdf.length > 1024);
    }

    @Test
    void generarEtiqueta_envioSinId_lanzaExcepcion() {
        Envio envio = new Envio();
        envio.setEstado(EstadoEnvio.PENDIENTE);
        assertThrows(RuntimeException.class, () -> service.generarEtiqueta(envio));
    }

    private Envio crearEnvioTest() {
        Envio envio = new Envio();
        envio.setId("TEST1234");
        envio.setDestinatario("Juan Pérez");
        envio.setDireccionEntrega("Calle Falsa 123, Buenos Aires");
        envio.setOrigen("Córdoba");
        envio.setDestino("Buenos Aires");
        envio.setFechaEstimada("2026-05-20");
        envio.setEstado(EstadoEnvio.EN_TRANSITO);
        envio.setPrioridad("ALTA");
        envio.setObservaciones("Frágil. No apilar. Mantener a temperatura ambiente.");
        return envio;
    }

}
