package com.meditrack.back.app.repository;

import com.meditrack.back.app.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class RutaEnvioRepositoryTest {

    @Autowired
    private RutaEnvioRepository rutaEnvioRepository;

    @Autowired
    private EnvioRepository envioRepository;

    @Autowired
    private RutaRepository rutaRepository;

    @BeforeEach
    void limpiarDB() {
        rutaEnvioRepository.deleteAll();
        envioRepository.deleteAll();
        rutaRepository.deleteAll();
    }

    private Envio crearEnvio(String trackingId) {
        Envio envio = new Envio();
        envio.setId(trackingId);
        envio.setRemitente("Farmacia Central");
        envio.setDestinatario("Cliente Test");
        envio.setOrigen("Av. Siempre Viva 123");
        envio.setDestino("Calle Falsa 456");
        envio.setEstado(EstadoEnvio.PENDIENTE);
        envio.setFechaCreacion("2025-05-01");
        return envioRepository.save(envio);
    }

    private Ruta crearRuta(String rutaId, String repartidorId) {
        Ruta ruta = new Ruta();
        ruta.setId(rutaId);
        ruta.setFecha("2025-05-01");
        ruta.setRepartidorId(repartidorId);
        ruta.setTransporteId(1L);
        ruta.setEstado(EstadoRuta.PENDIENTE);
        return rutaRepository.save(ruta);
    }

    private RutaEnvio crearRutaEnvio(Envio envio, Ruta ruta) {
        RutaEnvio rutaEnvio = new RutaEnvio();
        rutaEnvio.setEnvio(envio);
        rutaEnvio.setRuta(ruta);
        return rutaEnvioRepository.save(rutaEnvio);
    }

    @Test
    @DisplayName("existsByEnvio_Id: retorna true cuando el envío está asignado a una ruta")
    void existsByEnvioId_envioAsignado_retornaTrue() {
        Envio envio = crearEnvio("TRK-001");
        Ruta ruta = crearRuta("RUTA-001", "REP-001");
        crearRutaEnvio(envio, ruta);

        boolean resultado = rutaEnvioRepository.existsByEnvio_Id("TRK-001");

        assertThat(resultado).isTrue();
    }

    @Test
    @DisplayName("existsByEnvio_Id: retorna false cuando el envío no está asignado a ninguna ruta")
    void existsByEnvioId_envioNoAsignado_retornaFalse() {
        crearEnvio("TRK-002");

        boolean resultado = rutaEnvioRepository.existsByEnvio_Id("TRK-002");

        assertThat(resultado).isFalse();
    }

    @Test
    @DisplayName("existsByEnvio_Id: retorna false para un ID que no existe en absoluto")
    void existsByEnvioId_idInexistente_retornaFalse() {
        boolean resultado = rutaEnvioRepository.existsByEnvio_Id("TRK-INEXISTENTE");

        assertThat(resultado).isFalse();
    }

    @Test
    @DisplayName("existsByEnvio_Id: no confunde IDs distintos entre sí")
    void existsByEnvioId_noConfundeIds() {
        Envio envio1 = crearEnvio("TRK-010");
        crearEnvio("TRK-011");
        Ruta ruta = crearRuta("RUTA-010", "REP-010");
        crearRutaEnvio(envio1, ruta);

        assertThat(rutaEnvioRepository.existsByEnvio_Id("TRK-010")).isTrue();
        assertThat(rutaEnvioRepository.existsByEnvio_Id("TRK-011")).isFalse();
    }
    
}