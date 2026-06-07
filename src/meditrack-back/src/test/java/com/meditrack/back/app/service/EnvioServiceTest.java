package com.meditrack.back.app.service;

import com.meditrack.back.app.model.*;
import com.meditrack.back.app.repository.EnvioRepository;
import com.meditrack.back.app.repository.MedicamentoRepository;
import com.meditrack.back.app.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EnvioServiceTest {

    @Mock
    private EnvioRepository envioRepository;
    @Mock
    private MedicamentoRepository medicamentoRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private NotificacionService notificacionService;

    @InjectMocks
    private EnvioService envioService;

    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────

    private Envio envioBase() {
        Envio e = new Envio();
        e.setRemitente("Farmacia Central");
        e.setDestinatario("Hospital Público");
        e.setOrigen("Buenos Aires");
        e.setDestino("La Plata");
        e.setFechaEstimada("2026-06-01");
        e.setDescripcionCarga("Antibióticos");
        return e;
    }

    private Envio envioGuardado(String id, EstadoEnvio estado) {
        Envio e = envioBase();
        e.setId(id);
        e.setEstado(estado);
        e.setUsuarioResponsable("operador1");
        return e;
    }

    // ─────────────────────────────────────────────
    // crear()
    // ─────────────────────────────────────────────

    @Nested
    @DisplayName("crear()")
    class Crear {

        @Test
        @DisplayName("Debe asignar ID, estado PENDIENTE y guardar el envío")
        void crear_envioValido_guardaCorrectamente() {
            Envio nuevo = envioBase();
            when(envioRepository.save(any(Envio.class))).thenAnswer(inv -> inv.getArgument(0));

            Envio resultado = envioService.crear(nuevo, "operador1");

            assertThat(resultado.getId()).isNotNull().hasSize(8);
            assertThat(resultado.getEstado()).isEqualTo(EstadoEnvio.PENDIENTE);
            assertThat(resultado.getUsuarioResponsable()).isEqualTo("operador1");
            assertThat(resultado.getFechaCreacion()).isNotNull();
            assertThat(resultado.getHoraCreacion()).isNotNull();
            verify(envioRepository).save(any(Envio.class));
        }

        @Test
        @DisplayName("Debe registrar un evento CREACION en el historial")
        void crear_envioValido_registraHistorialCreacion() {
            Envio nuevo = envioBase();
            when(envioRepository.save(any(Envio.class))).thenAnswer(inv -> inv.getArgument(0));

            Envio resultado = envioService.crear(nuevo, "operador1");

            assertThat(resultado.getHistorial()).hasSize(1);
            HistorialEstado evento = resultado.getHistorial().get(0);
            assertThat(evento.getTipo()).isEqualTo("CREACION");
            assertThat(evento.getEstado()).isEqualTo(EstadoEnvio.PENDIENTE);
            assertThat(evento.getUsuario()).isEqualTo("operador1");
        }

        @Test
        @DisplayName("Debe buscar el medicamento real cuando el detalle tiene ID")
        void crear_conDetalleMedicamento_buscaMedicamentoReal() {
            Medicamento medStub = new Medicamento();
            medStub.setId("MED-01");
            medStub.setNombre("Amoxicilina");

            DetalleEnvio detalle = new DetalleEnvio();
            detalle.setMedicamento(medStub);
            detalle.setCantidad(10);

            Envio nuevo = envioBase();
            nuevo.agregarDetalle(detalle);

            when(medicamentoRepository.findById("MED-01")).thenReturn(Optional.of(medStub));
            when(envioRepository.save(any(Envio.class))).thenAnswer(inv -> inv.getArgument(0));

            envioService.crear(nuevo, "operador1");

            verify(medicamentoRepository).findById("MED-01");
        }

        @Test
        @DisplayName("Debe lanzar excepción si el medicamento del detalle no existe")
        void crear_conMedicamentoInexistente_lanzaException() {
            Medicamento medStub = new Medicamento();
            medStub.setId("MED-INEXISTENTE");

            DetalleEnvio detalle = new DetalleEnvio();
            detalle.setMedicamento(medStub);

            Envio nuevo = envioBase();
            nuevo.agregarDetalle(detalle);

            when(medicamentoRepository.findById("MED-INEXISTENTE")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> envioService.crear(nuevo, "operador1"))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Medicamento no encontrado");
        }
    }

    // ─────────────────────────────────────────────
    // buscarPorId()
    // ─────────────────────────────────────────────

    @Nested
    @DisplayName("buscarPorId()")
    class BuscarPorId {

        @Test
        @DisplayName("Debe retornar el envío cuando existe")
        void buscarPorId_existente_retornaEnvio() {
            Envio envio = envioGuardado("ABC12345", EstadoEnvio.PENDIENTE);
            when(envioRepository.findById("ABC12345")).thenReturn(Optional.of(envio));

            Envio resultado = envioService.buscarPorId("ABC12345");

            assertThat(resultado.getId()).isEqualTo("ABC12345");
        }

        @Test
        @DisplayName("Debe lanzar 404 cuando el envío no existe")
        void buscarPorId_noExistente_lanza404() {
            when(envioRepository.findById("NOPE")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> envioService.buscarPorId("NOPE"))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Envío no encontrado");
        }
    }

    // ─────────────────────────────────────────────
    // cancelar()
    // ─────────────────────────────────────────────

    @Nested
    @DisplayName("cancelar()")
    class Cancelar {

        @Test
        @DisplayName("Debe cambiar el estado a CANCELADO y persistir motivo y firma")
        void cancelar_envioExistente_actualizaEstadoYPersiste() {
            Envio envio = envioGuardado("ABC12345", EstadoEnvio.PENDIENTE);
            when(envioRepository.findById("ABC12345")).thenReturn(Optional.of(envio));
            when(envioRepository.save(any(Envio.class))).thenAnswer(inv -> inv.getArgument(0));

            Envio resultado = envioService.cancelar(
                    "ABC12345", "Medicamentos vencidos", "FIRMA-OP", "2026-05-26", "10:00", "operador1");

            assertThat(resultado.getEstado()).isEqualTo(EstadoEnvio.CANCELADO);
            assertThat(resultado.getMotivoCancelacion()).isEqualTo("Medicamentos vencidos");
            assertThat(resultado.getFirmaCancelacion()).isEqualTo("FIRMA-OP");
            assertThat(resultado.getFechaCancelacion()).isEqualTo("2026-05-26 10:00");
            verify(envioRepository).save(envio);
        }

        @Test
        @DisplayName("Debe registrar evento CANCELACION en el historial")
        void cancelar_envioExistente_registraHistorialCancelacion() {
            Envio envio = envioGuardado("ABC12345", EstadoEnvio.PENDIENTE);
            when(envioRepository.findById("ABC12345")).thenReturn(Optional.of(envio));
            when(envioRepository.save(any(Envio.class))).thenAnswer(inv -> inv.getArgument(0));

            Envio resultado = envioService.cancelar(
                    "ABC12345", "Motivo X", "FIRMA", "2026-05-26", "10:00", "operador1");

            assertThat(resultado.getHistorial())
                    .anyMatch(h -> h.getTipo().equals("CANCELACION")
                            && h.getEstado() == EstadoEnvio.CANCELADO);
        }

        @Test
        @DisplayName("Debe lanzar 404 si el envío no existe al cancelar")
        void cancelar_envioInexistente_lanza404() {
            when(envioRepository.findById("GHOST")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> envioService.cancelar("GHOST", "motivo", "firma", "2026-05-26", "10:00", "op"))
                    .isInstanceOf(ResponseStatusException.class);
        }
    }

    // ─────────────────────────────────────────────
    // actualizarEstado()
    // ─────────────────────────────────────────────

    @Nested
    @DisplayName("actualizarEstado()")
    class ActualizarEstado {

        @Test
        @DisplayName("Debe actualizar el estado correctamente")
        void actualizarEstado_transicionValida_actualizaEstado() {
            Envio envio = envioGuardado("ABC12345", EstadoEnvio.PENDIENTE);
            when(envioRepository.findById("ABC12345")).thenReturn(Optional.of(envio));
            when(envioRepository.save(any(Envio.class))).thenAnswer(inv -> inv.getArgument(0));

            Envio resultado = envioService.actualizarEstado(
                    "ABC12345", EstadoEnvio.ASIGNADO, "operador1", "repartidor99",
                    null, null);

            assertThat(resultado.getEstado()).isEqualTo(EstadoEnvio.ASIGNADO);
            assertThat(resultado.getRepartidorId()).isEqualTo("repartidor99");
        }

        @Test
        @DisplayName("Al marcar ENTREGADO debe registrar receptor")
        void actualizarEstado_entregado_guardaReceptor() {
            Envio envio = envioGuardado("ABC12345", EstadoEnvio.EN_TRANSITO);
            when(envioRepository.findById("ABC12345")).thenReturn(Optional.of(envio));
            when(envioRepository.save(any(Envio.class))).thenAnswer(inv -> inv.getArgument(0));

            Envio resultado = envioService.actualizarEstado(
                    "ABC12345", EstadoEnvio.ENTREGADO, "repartidor99", null,
                    null, null, "Juan Pérez", "12345678");

            assertThat(resultado.getEstado()).isEqualTo(EstadoEnvio.ENTREGADO);
            assertThat(resultado.getReceptorNombre()).isEqualTo("Juan Pérez");
            assertThat(resultado.getReceptorDni()).isEqualTo("12345678");
        }

        @Test
        @DisplayName("Al reportar INCIDENTE debe crear el objeto Incidente y registrarlo en el historial")
        void actualizarEstado_incidenteReportado_creaIncidenteYHistorial() {
            Envio envio = envioGuardado("ABC12345", EstadoEnvio.EN_TRANSITO);
            when(envioRepository.findById("ABC12345")).thenReturn(Optional.of(envio));
            when(envioRepository.save(any(Envio.class))).thenAnswer(inv -> inv.getArgument(0));
            when(usuarioRepository.findByRole(Role.SUPERVISOR)).thenReturn(List.of());

            Envio resultado = envioService.actualizarEstado(
                    "ABC12345", EstadoEnvio.INCIDENTE_REPORTADO, "repartidor99", null,
                    "ACCIDENTE", "Choque leve en ruta 2");

            assertThat(resultado.getEstado()).isEqualTo(EstadoEnvio.INCIDENTE_REPORTADO);
            assertThat(resultado.getIncidencias()).hasSize(1);

            assertThat(resultado.getHistorial())
                    .anyMatch(h -> h.getTipo().equals("ACCIDENTE"));
        }

        @Test
        @DisplayName("Al asignar repartidor debe notificarle")
        void actualizarEstado_asignado_notificaAlRepartidor() {
            Envio envio = envioGuardado("ABC12345", EstadoEnvio.PENDIENTE);
            Usuario repartidor = new Usuario();
            repartidor.setId("repartidor99");

            when(envioRepository.findById("ABC12345")).thenReturn(Optional.of(envio));
            when(envioRepository.save(any(Envio.class))).thenAnswer(inv -> inv.getArgument(0));
            when(usuarioRepository.findById("repartidor99")).thenReturn(Optional.of(repartidor));

            envioService.actualizarEstado(
                    "ABC12345", EstadoEnvio.ASIGNADO, "operador1", "repartidor99",
                    null, null);

            verify(notificacionService).crearNotificacion(
                    eq(repartidor),
                    contains("Nuevo envío asignado"),
                    anyString());
        }
    }

    // ─────────────────────────────────────────────
    // reasignarRepartidor()
    // ─────────────────────────────────────────────

    @Nested
    @DisplayName("reasignarRepartidor()")
    class ReasignarRepartidor {

        @Test
        @DisplayName("Debe actualizar el repartidorId y registrar evento REASIGNACION")
        void reasignar_datosValidos_actualizaYregistraHistorial() {
            Envio envio = envioGuardado("ABC12345", EstadoEnvio.ASIGNADO);
            envio.setRepartidorId("repartidorViejo");

            when(envioRepository.findById("ABC12345")).thenReturn(Optional.of(envio));
            when(envioRepository.save(any(Envio.class))).thenAnswer(inv -> inv.getArgument(0));
            when(usuarioRepository.findById("repartidorNuevo")).thenReturn(Optional.empty());

            Envio resultado = envioService.reasignarRepartidor("ABC12345", "repartidorNuevo", "operador1");

            assertThat(resultado.getRepartidorId()).isEqualTo("repartidorNuevo");
            assertThat(resultado.getHistorial())
                    .anyMatch(h -> h.getTipo().equals("REASIGNACION")
                            && h.getDetalle().contains("repartidorViejo")
                            && h.getDetalle().contains("repartidorNuevo"));
        }

        @Test
        @DisplayName("Debe lanzar excepción si el nuevo repartidorId es nulo o vacío")
        void reasignar_repartidorIdVacio_lanzaIllegalArgument() {
            Envio envio = envioGuardado("ABC12345", EstadoEnvio.ASIGNADO);
            when(envioRepository.findById("ABC12345")).thenReturn(Optional.of(envio));

            assertThatThrownBy(() -> envioService.reasignarRepartidor("ABC12345", "  ", "operador1"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("obligatorio");

            assertThatThrownBy(() -> envioService.reasignarRepartidor("ABC12345", null, "operador1"))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("Debe notificar al nuevo repartidor si existe")
        void reasignar_repartidorExiste_enviaNotificacion() {
            Envio envio = envioGuardado("ABC12345", EstadoEnvio.ASIGNADO);
            envio.setRepartidorId("anterior");

            Usuario repartidorNuevo = new Usuario();
            repartidorNuevo.setId("nuevoRep");

            when(envioRepository.findById("ABC12345")).thenReturn(Optional.of(envio));
            when(envioRepository.save(any(Envio.class))).thenAnswer(inv -> inv.getArgument(0));
            when(usuarioRepository.findById("nuevoRep")).thenReturn(Optional.of(repartidorNuevo));

            envioService.reasignarRepartidor("ABC12345", "nuevoRep", "operador1");

            verify(notificacionService).crearNotificacion(
                    eq(repartidorNuevo),
                    contains("Reasignación"),
                    anyString());
        }
    }

    // ─────────────────────────────────────────────
    // listarTodos() / obtenerTrackingPublico()
    // ─────────────────────────────────────────────

    @Nested
    @DisplayName("listarTodos() y obtenerTrackingPublico()")
    class Consultas {

        @Test
        @DisplayName("listarTodos() debe delegar en el repositorio")
        void listarTodos_delegaEnRepositorio() {
            Envio e1 = envioGuardado("ID1", EstadoEnvio.PENDIENTE);
            Envio e2 = envioGuardado("ID2", EstadoEnvio.ASIGNADO);
            when(envioRepository.findAll()).thenReturn(List.of(e1, e2));

            List<Envio> resultado = envioService.listarTodos();

            assertThat(resultado).hasSize(2);
            verify(envioRepository).findAll();
        }

        @Test
        @DisplayName("obtenerTrackingPublico() debe retornar DTO con los datos del envío")
        void obtenerTrackingPublico_envioExistente_retornaDTO() {
            Envio envio = envioGuardado("ABC12345", EstadoEnvio.EN_TRANSITO);
            envio.setFechaCreacion("2026-05-26");
            envio.setHoraCreacion("09:30");
            when(envioRepository.findById("ABC12345")).thenReturn(Optional.of(envio));

            TrackingPublicoDTO dto = envioService.obtenerTrackingPublico("ABC12345");

            assertThat(dto.getEstado()).isEqualTo("EN_TRANSITO");
        }
    }
    
}
