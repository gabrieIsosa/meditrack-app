package com.meditrack.back.app.service;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.meditrack.back.app.model.Envio;
import com.meditrack.back.app.model.EstadoEnvio;
import com.meditrack.back.app.model.ReclamoCambioDatos;
import com.meditrack.back.app.model.ReclamoCambioDatosRequest;
import com.meditrack.back.app.model.Role;
import com.meditrack.back.app.model.Usuario;
import com.meditrack.back.app.repository.EnvioRepository;
import com.meditrack.back.app.repository.ReclamoCambioDatosRepository;
import com.meditrack.back.app.repository.UsuarioRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReclamoCambioDatosService")
class ReclamoCambioDatosServiceTest {

    @Mock
    private ReclamoCambioDatosRepository reclamoRepository;

    @Mock
    private EnvioRepository envioRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private NotificacionService notificacionService;

    @InjectMocks
    private ReclamoCambioDatosService reclamoService;

    private Envio envio(String id) {
        Envio e = new Envio();
        e.setId(id);
        e.setRemitente("Farmacia Central");
        e.setDestinatario("Cliente Test");
        e.setOrigen("Origen");
        e.setDestino("Destino");
        e.setEstado(EstadoEnvio.PENDIENTE);
        return e;
    }

    private Usuario usuario(String id, Role role, boolean activo) {
        Usuario u = new Usuario();
        u.setId(id);
        u.setNombre("Usuario " + id);
        u.setEmail(id + "@mail.com");
        u.setDni("12345678");
        u.setPassword("1234");
        u.setRole(role);
        u.setEstadoActivo(activo);
        return u;
    }

    private ReclamoCambioDatosRequest requestValido() {
        ReclamoCambioDatosRequest req = new ReclamoCambioDatosRequest();
        req.setTrackingId("ENV-123");
        req.setCampoReclamado("destino");
        req.setValorSolicitado("Av. Corrientes 1234");
        req.setMotivo("La dirección fue cargada incorrectamente");
        req.setContacto("cliente@test.com");
        return req;
    }

    @Nested
    @DisplayName("crear")
    class Crear {

        @Test
        @DisplayName("crea reclamo correctamente y notifica a supervisores y administradores activos")
        void creaReclamoCorrectamente() {
            ReclamoCambioDatosRequest req = requestValido();
            Envio envio = envio("ENV-123");

            Usuario supervisorActivo = usuario("USR-SUP-1", Role.SUPERVISOR, true);
            Usuario adminActivo = usuario("USR-ADM-1", Role.ADMINISTRADOR, true);
            Usuario adminInactivo = usuario("USR-ADM-2", Role.ADMINISTRADOR, false);

            when(envioRepository.findById("ENV-123")).thenReturn(Optional.of(envio));
            when(reclamoRepository.save(any(ReclamoCambioDatos.class)))
                    .thenAnswer(inv -> inv.getArgument(0));
            when(usuarioRepository.findByRole(Role.SUPERVISOR))
                    .thenReturn(List.of(supervisorActivo));
            when(usuarioRepository.findByRole(Role.ADMINISTRADOR))
                    .thenReturn(List.of(adminActivo, adminInactivo));

            ReclamoCambioDatos resultado = reclamoService.crear(req);

            assertThat(resultado).isNotNull();
            assertThat(resultado.getEnvio()).isSameAs(envio);
            assertThat(resultado.getCampoReclamado()).isEqualTo("destino");
            assertThat(resultado.getValorSolicitado()).isEqualTo("Av. Corrientes 1234");
            assertThat(resultado.getMotivo()).isEqualTo("La dirección fue cargada incorrectamente");
            assertThat(resultado.getContacto()).isEqualTo("cliente@test.com");
            assertThat(resultado.getEstado()).isEqualTo("PENDIENTE");

            verify(reclamoRepository).save(any(ReclamoCambioDatos.class));
            verify(notificacionService, times(2))
                    .crearNotificacion(any(Usuario.class), anyString(), contains("ENV-123"));
        }

        @Test
        @DisplayName("lanza excepción si el trackingId es obligatorio")
        void trackingIdObligatorio() {
            ReclamoCambioDatosRequest req = requestValido();
            req.setTrackingId("  ");

            assertThatThrownBy(() -> reclamoService.crear(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("trackingId es obligatorio");

            verifyNoInteractions(envioRepository, reclamoRepository, usuarioRepository, notificacionService);
        }

        @Test
        @DisplayName("lanza excepción si el campo reclamado es obligatorio")
        void campoReclamadoObligatorio() {
            ReclamoCambioDatosRequest req = requestValido();
            req.setCampoReclamado("");

            assertThatThrownBy(() -> reclamoService.crear(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("campo reclamado es obligatorio");

            verifyNoInteractions(envioRepository, reclamoRepository, usuarioRepository, notificacionService);
        }

        @Test
        @DisplayName("lanza excepción si el valor solicitado es obligatorio")
        void valorSolicitadoObligatorio() {
            ReclamoCambioDatosRequest req = requestValido();
            req.setValorSolicitado(null);

            assertThatThrownBy(() -> reclamoService.crear(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("valor solicitado es obligatorio");

            verifyNoInteractions(envioRepository, reclamoRepository, usuarioRepository, notificacionService);
        }

        @Test
        @DisplayName("lanza excepción si el motivo es obligatorio")
        void motivoObligatorio() {
            ReclamoCambioDatosRequest req = requestValido();
            req.setMotivo(" ");

            assertThatThrownBy(() -> reclamoService.crear(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("motivo es obligatorio");

            verifyNoInteractions(envioRepository, reclamoRepository, usuarioRepository, notificacionService);
        }

        @Test
        @DisplayName("lanza excepción si el envío no existe")
        void envioNoExiste() {
            ReclamoCambioDatosRequest req = requestValido();

            when(envioRepository.findById("ENV-123")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reclamoService.crear(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Envío no encontrado");

            verify(envioRepository).findById("ENV-123");
            verifyNoMoreInteractions(reclamoRepository, usuarioRepository, notificacionService);
        }
    }
}