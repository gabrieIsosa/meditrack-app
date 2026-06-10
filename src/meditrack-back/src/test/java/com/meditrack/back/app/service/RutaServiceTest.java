package com.meditrack.back.app.service;

import com.meditrack.back.app.model.*;
import com.meditrack.back.app.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RutaService")
class RutaServiceTest {

    @Mock
    RutaRepository rutaRepository;
    @Mock
    EnvioRepository envioRepository;
    @Mock
    UsuarioRepository usuarioRepository;
    @Mock
    RutaEnvioRepository rutaEnvioRepository;
    @Mock
    TransporteRepository transporteRepository;
    @Mock
    EnvioService envioService;

    @InjectMocks
    RutaService rutaService;

    // ─── helpers ────────────────────────────────────────────────────────────────

    private Usuario repartidorActivo(String id) {
        Usuario u = new Usuario();
        u.setId(id);
        u.setEstadoActivo(true);
        return u;
    }

    private Envio envioPendiente(String id) {
        Envio e = new Envio();
        e.setId(id);
        e.setEstado(EstadoEnvio.PENDIENTE);
        return e;
    }

    private Transporte transporteActivo(Long id){
        Transporte t = new Transporte();
        t.setEstadoOperativo(EstadoOperativo.ACTIVO);

        try{
            java.lang.reflect.Field field = Transporte.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(t, id);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        return t;

    }

    private Map<String, Object> datosValidos(String fecha, String repartidorId, List<Map<String, Object>> envios) {
        Map<String, Object> datos = new HashMap<>();
        datos.put("fecha", fecha);
        datos.put("repartidorId", repartidorId);
        datos.put("transporteId", 1L);
        datos.put("envios", envios);
        return datos;
    }

    private Map<String, Object> envioData(String envioId, int orden) {
        Map<String, Object> m = new HashMap<>();
        m.put("envioId", envioId);
        m.put("orden", orden);
        return m;
    }

    // ─── listarTodos ────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("listarTodos")
    class ListarTodos {

        @Test
        @DisplayName("delega en el repositorio y devuelve la lista completa")
        void devuelveTodas() {
            Ruta r1 = new Ruta();
            Ruta r2 = new Ruta();
            when(rutaRepository.findAll()).thenReturn(List.of(r1, r2));

            List<Ruta> resultado = rutaService.listarTodos();

            assertThat(resultado).containsExactly(r1, r2);
        }
    }

    // ─── buscarPorId ────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("buscarPorId")
    class BuscarPorId {

        @Test
        @DisplayName("devuelve la ruta cuando existe")
        void encontrada() {
            Ruta ruta = new Ruta();
            when(rutaRepository.findById("R1")).thenReturn(Optional.of(ruta));

            assertThat(rutaService.buscarPorId("R1")).isSameAs(ruta);
        }

        @Test
        @DisplayName("lanza 404 cuando no existe")
        void noEncontrada() {
            when(rutaRepository.findById("X")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> rutaService.buscarPorId("X"))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Ruta no encontrada");
        }
    }

    // ─── crear ──────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("crear")
    class Crear {

        private final String HOY = LocalDate.now().toString();
        private final String REPARTIDOR_ID = "REP-1";
        private final String ENVIO_ID = "ENV-1";

        private void setupFlujoFeliz() {
            when(rutaRepository.save(any(Ruta.class))).thenAnswer(inv -> inv.getArgument(0));
            when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));
        }
        
        private void mockTransporteDisponible() {

            when(transporteRepository.findById(1L)).thenReturn(Optional.of(transporteActivo(1L)));
                when(rutaRepository.existsByTransporteIdAndFechaAndEstadoNot(anyLong(), anyString(), any(EstadoRuta.class))).thenReturn(false);
        }

        // ── validaciones de entrada ────────────────────────────────────────────

        @Test
        @DisplayName("lanza excepción si la lista de envíos es null")
        void sinEnviosNull() {
            Map<String, Object> datos = datosValidos(HOY, REPARTIDOR_ID, null);

            assertThatThrownBy(() -> rutaService.crear(datos, "operador"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("al menos un envío");
        }

        @Test
        @DisplayName("lanza excepción si la lista de envíos está vacía")
        void sinEnviosVacio() {
            Map<String, Object> datos = datosValidos(HOY, REPARTIDOR_ID, Collections.emptyList());

            assertThatThrownBy(() -> rutaService.crear(datos, "operador"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("al menos un envío");
        }

        @Test
        @DisplayName("lanza excepción si la fecha es null")
        void fechaNull() {
            Map<String, Object> datos = datosValidos(null, REPARTIDOR_ID, List.of(envioData(ENVIO_ID, 1)));

            assertThatThrownBy(() -> rutaService.crear(datos, "operador"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("fecha");
        }

        @Test
        @DisplayName("lanza excepción si la fecha está en blanco")
        void fechaBlanco() {
            Map<String, Object> datos = datosValidos("   ", REPARTIDOR_ID, List.of(envioData(ENVIO_ID, 1)));

            assertThatThrownBy(() -> rutaService.crear(datos, "operador"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("fecha");
        }

        // ── validaciones del repartidor ────────────────────────────────────────

        @Test
        @DisplayName("lanza excepción si el repartidor no existe")
        void repartidorNoExiste() {
            Map<String, Object> datos = datosValidos(HOY, REPARTIDOR_ID, List.of(envioData(ENVIO_ID, 1)));
            when(usuarioRepository.findById(REPARTIDOR_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> rutaService.crear(datos, "operador"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Repartidor no encontrado");
        }

        @Test
        @DisplayName("lanza excepción si el repartidor no está activo")
        void repartidorInactivo() {
            Usuario inactivo = repartidorActivo(REPARTIDOR_ID);
            inactivo.setEstadoActivo(false);
            Map<String, Object> datos = datosValidos(HOY, REPARTIDOR_ID, List.of(envioData(ENVIO_ID, 1)));
            when(usuarioRepository.findById(REPARTIDOR_ID)).thenReturn(Optional.of(inactivo));

            assertThatThrownBy(() -> rutaService.crear(datos, "operador"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("no está activo");
        }

        @Test
        @DisplayName("lanza excepción si el repartidor ya tiene ruta activa ese día")
        void repartidorConRutaActivaMismoDia() {
            Map<String, Object> datos = datosValidos(HOY, REPARTIDOR_ID, List.of(envioData(ENVIO_ID, 1)));
            when(usuarioRepository.findById(REPARTIDOR_ID)).thenReturn(Optional.of(repartidorActivo(REPARTIDOR_ID)));
            mockTransporteDisponible();
            when(rutaRepository.existsByRepartidorIdAndFechaAndEstadoNot(REPARTIDOR_ID, HOY, EstadoRuta.COMPLETADA))
                    .thenReturn(true);

            assertThatThrownBy(() -> rutaService.crear(datos, "operador"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("ya tiene una ruta asignada");
        }

        // ── validaciones de envíos ─────────────────────────────────────────────

        @Test
        @DisplayName("lanza excepción si un envío no existe")
        void envioNoExiste() {
            Map<String, Object> datos = datosValidos(HOY, REPARTIDOR_ID, List.of(envioData(ENVIO_ID, 1)));
            mockTransporteDisponible();
            when(usuarioRepository.findById(REPARTIDOR_ID)).thenReturn(Optional.of(repartidorActivo(REPARTIDOR_ID)));
            when(rutaRepository.existsByRepartidorIdAndFechaAndEstadoNot(any(), any(), any())).thenReturn(false);
            when(envioRepository.findById(ENVIO_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> rutaService.crear(datos, "operador"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Envío no encontrado");
        }

        @Test
        @DisplayName("lanza excepción si un envío no está en estado PENDIENTE")
        void envioNoEsPendiente() {
            Envio asignado = envioPendiente(ENVIO_ID);
            asignado.setEstado(EstadoEnvio.ASIGNADO);
            Map<String, Object> datos = datosValidos(HOY, REPARTIDOR_ID, List.of(envioData(ENVIO_ID, 1)));
            when(usuarioRepository.findById(REPARTIDOR_ID)).thenReturn(Optional.of(repartidorActivo(REPARTIDOR_ID)));
            mockTransporteDisponible();
            when(rutaRepository.existsByRepartidorIdAndFechaAndEstadoNot(any(), any(), any())).thenReturn(false);
            when(envioRepository.findById(ENVIO_ID)).thenReturn(Optional.of(asignado));

            assertThatThrownBy(() -> rutaService.crear(datos, "operador"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("no está en estado PENDIENTE");
        }

        @Test
        @DisplayName("lanza excepción si un envío ya pertenece a otra ruta")
        void envioYaEnOtraRuta() {
            Map<String, Object> datos = datosValidos(HOY, REPARTIDOR_ID, List.of(envioData(ENVIO_ID, 1)));
            when(usuarioRepository.findById(REPARTIDOR_ID)).thenReturn(Optional.of(repartidorActivo(REPARTIDOR_ID)));
            mockTransporteDisponible();
            when(rutaRepository.existsByRepartidorIdAndFechaAndEstadoNot(any(), any(), any())).thenReturn(false);
            when(envioRepository.findById(ENVIO_ID)).thenReturn(Optional.of(envioPendiente(ENVIO_ID)));
            when(rutaEnvioRepository.existsByEnvio_Id(ENVIO_ID)).thenReturn(true);

            assertThatThrownBy(() -> rutaService.crear(datos, "operador"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("ya pertenece a otra ruta");
        }

        // ── flujo feliz ────────────────────────────────────────────────────────

        @Test
        @DisplayName("crea la ruta correctamente con datos válidos")
        void creaRutaExitosamente() {
            setupFlujoFeliz();
            Map<String, Object> datos = datosValidos(HOY, REPARTIDOR_ID, List.of(envioData(ENVIO_ID, 1)));
            Usuario repartidor = repartidorActivo(REPARTIDOR_ID);
            when(usuarioRepository.findById(REPARTIDOR_ID)).thenReturn(Optional.of(repartidor));
            when(rutaRepository.existsByRepartidorIdAndFechaAndEstadoNot(any(), any(), any())).thenReturn(false);
            when(envioRepository.findById(ENVIO_ID))
                    .thenReturn(Optional.of(envioPendiente(ENVIO_ID)));
            when(rutaEnvioRepository.existsByEnvio_Id(ENVIO_ID)).thenReturn(false);
            mockTransporteDisponible();

            Ruta resultado = rutaService.crear(datos, "operador");

            assertThat(resultado).isNotNull();
            verify(rutaRepository, atLeast(2)).save(any(Ruta.class));
            verify(envioService).actualizarEstado(eq(ENVIO_ID), eq(EstadoEnvio.ASIGNADO), eq("operador"),
                    eq(REPARTIDOR_ID), isNull(), isNull());
        }

        @Test
        @DisplayName("marca al repartidor como haciendoEntrega cuando la fecha es hoy")
        void marcaRepartidorEnEntregaCuandoEsHoy() {
            setupFlujoFeliz();
            Map<String, Object> datos = datosValidos(HOY, REPARTIDOR_ID, List.of(envioData(ENVIO_ID, 1)));
            Usuario repartidor = repartidorActivo(REPARTIDOR_ID);
            when(usuarioRepository.findById(REPARTIDOR_ID)).thenReturn(Optional.of(repartidor));
            mockTransporteDisponible();
            when(rutaRepository.existsByRepartidorIdAndFechaAndEstadoNot(any(), any(), any())).thenReturn(false);
            when(envioRepository.findById(ENVIO_ID)).thenReturn(Optional.of(envioPendiente(ENVIO_ID)));
            when(rutaEnvioRepository.existsByEnvio_Id(ENVIO_ID)).thenReturn(false);
            rutaService.crear(datos, "operador");

            assertThat(repartidor.isHaciendoEntrega()).isTrue();
            verify(usuarioRepository).save(repartidor);
        }

        @Test
        @DisplayName("NO marca al repartidor como haciendoEntrega cuando la fecha es futura")
        void noMarcaRepartidorEnEntregaCuandoFechaEsFutura() {
            String manana = LocalDate.now().plusDays(1).toString();
            Map<String, Object> datos = datosValidos(manana, REPARTIDOR_ID, List.of(envioData(ENVIO_ID, 1)));
            Usuario repartidor = repartidorActivo(REPARTIDOR_ID);
            when(usuarioRepository.findById(REPARTIDOR_ID)).thenReturn(Optional.of(repartidor));
            mockTransporteDisponible();
            when(rutaRepository.existsByRepartidorIdAndFechaAndEstadoNot(any(), any(), any())).thenReturn(false);
            when(envioRepository.findById(ENVIO_ID)).thenReturn(Optional.of(envioPendiente(ENVIO_ID)));
            when(rutaEnvioRepository.existsByEnvio_Id(ENVIO_ID)).thenReturn(false);

            rutaService.crear(datos, "operador");

            assertThat(repartidor.isHaciendoEntrega()).isFalse();
            verify(usuarioRepository, never()).save(repartidor);
        }

        @Test
        @DisplayName("usa retiroOrden y entregaOrden cuando están presentes")
        void usaOrdenesIndividuales() {
            setupFlujoFeliz();
            Map<String, Object> envioConOrdenes = new HashMap<>();
            envioConOrdenes.put("envioId", ENVIO_ID);
            envioConOrdenes.put("retiroOrden", 2);
            envioConOrdenes.put("entregaOrden", 5);

            Map<String, Object> datos = datosValidos(HOY, REPARTIDOR_ID, List.of(envioConOrdenes));
            when(usuarioRepository.findById(REPARTIDOR_ID)).thenReturn(Optional.of(repartidorActivo(REPARTIDOR_ID)));
            mockTransporteDisponible();
            when(rutaRepository.existsByRepartidorIdAndFechaAndEstadoNot(any(), any(), any())).thenReturn(false);
            when(envioRepository.findById(ENVIO_ID)).thenReturn(Optional.of(envioPendiente(ENVIO_ID)));
            when(rutaEnvioRepository.existsByEnvio_Id(ENVIO_ID)).thenReturn(false);

            assertThatCode(() -> rutaService.crear(datos, "operador"))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("crea correctamente una ruta con múltiples envíos")
        void creaRutaConMultiplesEnvios() {
            setupFlujoFeliz();
            String ENVIO_2 = "ENV-2";
            List<Map<String, Object>> envios = List.of(envioData(ENVIO_ID, 1), envioData(ENVIO_2, 2));
            Map<String, Object> datos = datosValidos(HOY, REPARTIDOR_ID, envios);

            when(usuarioRepository.findById(REPARTIDOR_ID)).thenReturn(Optional.of(repartidorActivo(REPARTIDOR_ID)));
            mockTransporteDisponible();
            when(rutaRepository.existsByRepartidorIdAndFechaAndEstadoNot(any(), any(), any())).thenReturn(false);
            when(envioRepository.findById(ENVIO_ID)).thenReturn(Optional.of(envioPendiente(ENVIO_ID)));
            when(envioRepository.findById(ENVIO_2)).thenReturn(Optional.of(envioPendiente(ENVIO_2)));
            when(rutaEnvioRepository.existsByEnvio_Id(anyString())).thenReturn(false);

            Ruta resultado = rutaService.crear(datos, "operador");

            assertThat(resultado).isNotNull();
            verify(envioService, times(2)).actualizarEstado(anyString(), eq(EstadoEnvio.ASIGNADO), any(), any(), any(),
                    any());
        }
    }

    // ─── finalizar ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("finalizar")
    class Finalizar {

        private final String RUTA_ID = "RUTA-1";
        private final String REPARTIDOR_ID = "REP-1";

        @Test
        @DisplayName("lanza 404 si la ruta no existe")
        void rutaNoExiste() {
            when(rutaRepository.findById(RUTA_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> rutaService.finalizar(RUTA_ID, "operador"))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Ruta no encontrada");
        }

        @Test
        @DisplayName("lanza excepción si la ruta ya está completada")
        void rutaYaCompletada() {
            Ruta ruta = new Ruta();
            ruta.setEstado(EstadoRuta.COMPLETADA);
            when(rutaRepository.findById(RUTA_ID)).thenReturn(Optional.of(ruta));

            assertThatThrownBy(() -> rutaService.finalizar(RUTA_ID, "operador"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("ya está completada");
        }

        @Test
        @DisplayName("finaliza la ruta correctamente y libera al repartidor")
        void finalizaExitosamente() {
            Ruta ruta = new Ruta();
            ruta.setEstado(EstadoRuta.EN_CURSO);
            ruta.setRepartidorId(REPARTIDOR_ID);

            Usuario repartidor = repartidorActivo(REPARTIDOR_ID);
            repartidor.setHaciendoEntrega(true);

            when(rutaRepository.findById(RUTA_ID)).thenReturn(Optional.of(ruta));
            when(usuarioRepository.findById(REPARTIDOR_ID)).thenReturn(Optional.of(repartidor));
            when(rutaRepository.save(any(Ruta.class))).thenAnswer(inv -> inv.getArgument(0));

            Ruta resultado = rutaService.finalizar(RUTA_ID, "operador");

            assertThat(resultado.getEstado()).isEqualTo(EstadoRuta.COMPLETADA);
            assertThat(repartidor.isHaciendoEntrega()).isFalse();
            verify(usuarioRepository).save(repartidor);
            verify(rutaRepository).save(ruta);
        }

        @Test
        @DisplayName("lanza excepción si el repartidor de la ruta no existe")
        void repartidorDeLaRutaNoExiste() {
            Ruta ruta = new Ruta();
            ruta.setEstado(EstadoRuta.EN_CURSO);
            ruta.setRepartidorId(REPARTIDOR_ID);

            when(rutaRepository.findById(RUTA_ID)).thenReturn(Optional.of(ruta));
            when(usuarioRepository.findById(REPARTIDOR_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> rutaService.finalizar(RUTA_ID, "operador"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Repartidor no encontrado");
        }
    }

}