package com.meditrack.back.app;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.Mock;

import com.meditrack.back.app.model.Envio;
import com.meditrack.back.app.model.EstadoEnvio;
import com.meditrack.back.app.model.EstadoRuta;
import com.meditrack.back.app.model.Role;
import com.meditrack.back.app.model.Ruta;
import com.meditrack.back.app.model.Usuario;
import com.meditrack.back.app.repository.EnvioRepository;
import com.meditrack.back.app.repository.RutaEnvioRepository;
import com.meditrack.back.app.repository.RutaRepository;
import com.meditrack.back.app.repository.UsuarioRepository;
import com.meditrack.back.app.service.EnvioService;
import com.meditrack.back.app.service.RutaService;

@ExtendWith(MockitoExtension.class)
class RutaServiceTest {

    @Mock private RutaRepository rutaRepository;
    @Mock private EnvioRepository envioRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private RutaEnvioRepository rutaEnvioRepository;
    @Mock private EnvioService envioService;

    @InjectMocks
    private RutaService rutaService;

    private final String USUARIO_TEST = "supervisor_test";
    private final String REPARTIDOR_ID = "USR-REP001";
    private final String ENVIO_ID_1 = "ENV-111";
    private final String ENVIO_ID_2 = "ENV-222";

    private Usuario repartidorDisponible() {
        Usuario rep = new Usuario("rep@test.com", "Carlos Rep", "12345678", "pass", Role.REPARTIDOR);
        rep.setId(REPARTIDOR_ID);
        rep.setEstadoActivo(true);
        rep.setHaciendoEntrega(false);
        return rep;
    }

    private Envio envioPendiente(String id) {
        Envio envio = new Envio();
        envio.setId(id);
        envio.setEstado(EstadoEnvio.PENDIENTE);
        return envio;
    }

    private Map<String, Object> bodyValido() {
        return Map.of(
            "fecha", "2026-05-18",
            "repartidorId", REPARTIDOR_ID,
            "envios", List.of(
                Map.of("envioId", ENVIO_ID_1, "orden", 1),
                Map.of("envioId", ENVIO_ID_2, "orden", 2)
            )
        );
    }

    @Test
    void crear_conDatosValidos_debeCrearRutaYTransicionarEstados() {
        Usuario repartidor = repartidorDisponible();
        Envio envio1 = envioPendiente(ENVIO_ID_1);
        Envio envio2 = envioPendiente(ENVIO_ID_2);

        when(usuarioRepository.findById(REPARTIDOR_ID)).thenReturn(Optional.of(repartidor));
        when(envioRepository.findById(ENVIO_ID_1)).thenReturn(Optional.of(envio1));
        when(envioRepository.findById(ENVIO_ID_2)).thenReturn(Optional.of(envio2));
        when(rutaEnvioRepository.existsByEnvio_Id(anyString())).thenReturn(false);
        when(rutaRepository.save(any(Ruta.class))).thenAnswer(i -> i.getArguments()[0]);
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(i -> i.getArguments()[0]);
        when(envioService.actualizarEstado(anyString(), eq(EstadoEnvio.ASIGNADO), anyString(), anyString(), any(), any()))
                .thenAnswer(i -> {
                    Envio e = (i.getArgument(0).equals(ENVIO_ID_1)) ? envio1 : envio2;
                    e.setEstado(EstadoEnvio.ASIGNADO);
                    return e;
                });

        Ruta resultado = rutaService.crear(bodyValido(), USUARIO_TEST);

        assertNotNull(resultado);
        assertEquals(EstadoRuta.PENDIENTE, resultado.getEstado());
        assertEquals(REPARTIDOR_ID, resultado.getRepartidorId());
        assertEquals(USUARIO_TEST, resultado.getUsuarioResponsable());
        assertTrue(repartidor.isHaciendoEntrega());
        verify(envioService, times(2)).actualizarEstado(anyString(), eq(EstadoEnvio.ASIGNADO), eq(USUARIO_TEST), eq(REPARTIDOR_ID), eq(null), eq(null));
    }

    @Test
    void crear_sinEnvios_debeLanzarExcepcion() {
        Map<String, Object> body = Map.of(
            "fecha", "2026-05-18",
            "repartidorId", REPARTIDOR_ID,
            "envios", new ArrayList<>()
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> rutaService.crear(body, USUARIO_TEST));

        assertEquals("La ruta debe contener al menos un envío", ex.getMessage());
        verifyNoInteractions(usuarioRepository, envioRepository, rutaRepository);
    }

    @Test
    void crear_conRepartidorOcupado_debeLanzarExcepcion() {
        Usuario repartidor = repartidorDisponible();
        repartidor.setHaciendoEntrega(true);

        when(usuarioRepository.findById(REPARTIDOR_ID)).thenReturn(Optional.of(repartidor));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> rutaService.crear(bodyValido(), USUARIO_TEST));

        assertEquals("El repartidor ya tiene una entrega activa", ex.getMessage());
    }

    @Test
    void crear_conRepartidorInactivo_debeLanzarExcepcion() {
        Usuario repartidor = repartidorDisponible();
        repartidor.setEstadoActivo(false);

        when(usuarioRepository.findById(REPARTIDOR_ID)).thenReturn(Optional.of(repartidor));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> rutaService.crear(bodyValido(), USUARIO_TEST));

        assertEquals("El repartidor no está activo", ex.getMessage());
    }

    @Test
    void crear_conEnvioYaEnOtraRuta_debeLanzarExcepcion() {
        when(usuarioRepository.findById(REPARTIDOR_ID)).thenReturn(Optional.of(repartidorDisponible()));
        when(envioRepository.findById(ENVIO_ID_1)).thenReturn(Optional.of(envioPendiente(ENVIO_ID_1)));
        when(rutaEnvioRepository.existsByEnvio_Id(ENVIO_ID_1)).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> rutaService.crear(bodyValido(), USUARIO_TEST));

        assertTrue(ex.getMessage().contains("ya pertenece a otra ruta"));
    }

    @Test
    void crear_conEnvioEnEstadoNoPermitido_debeLanzarExcepcion() {
        Envio envioAsignado = envioPendiente(ENVIO_ID_1);
        envioAsignado.setEstado(EstadoEnvio.ASIGNADO);

        when(usuarioRepository.findById(REPARTIDOR_ID)).thenReturn(Optional.of(repartidorDisponible()));
        when(envioRepository.findById(ENVIO_ID_1)).thenReturn(Optional.of(envioAsignado));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> rutaService.crear(bodyValido(), USUARIO_TEST));

        assertTrue(ex.getMessage().contains("no está en estado PENDIENTE"));
    }

    @Test
    void finalizar_debeCompletarRutaYLiberarRepartidor() {
        Usuario repartidor = repartidorDisponible();
        repartidor.setHaciendoEntrega(true);

        Ruta ruta = new Ruta("2026-05-18", REPARTIDOR_ID, USUARIO_TEST);
        ruta.setId("RUT-AAAA1111");

        when(rutaRepository.findById("RUT-AAAA1111")).thenReturn(Optional.of(ruta));
        when(usuarioRepository.findById(REPARTIDOR_ID)).thenReturn(Optional.of(repartidor));
        when(rutaRepository.save(any(Ruta.class))).thenAnswer(i -> i.getArguments()[0]);
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(i -> i.getArguments()[0]);

        Ruta resultado = rutaService.finalizar("RUT-AAAA1111", USUARIO_TEST);

        assertEquals(EstadoRuta.COMPLETADA, resultado.getEstado());
        assertFalse(repartidor.isHaciendoEntrega());
    }

    @Test
    void buscarPorId_conIdInexistente_debeLanzarExcepcion() {
        when(rutaRepository.findById("RUT-INEXISTENTE")).thenReturn(Optional.empty());

        Exception excepcion = assertThrows(RuntimeException.class,
                () -> rutaService.buscarPorId("RUT-INEXISTENTE"));
                
        assertTrue(excepcion.getMessage().contains("Ruta no encontrada"));
    }
    
}
