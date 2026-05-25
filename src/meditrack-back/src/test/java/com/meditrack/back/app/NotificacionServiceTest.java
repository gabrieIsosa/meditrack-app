package com.meditrack.back.app;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.meditrack.back.app.model.Notificacion;
import com.meditrack.back.app.model.Role;
import com.meditrack.back.app.model.Usuario;
import com.meditrack.back.app.repository.NotificacionRepository;
import com.meditrack.back.app.service.NotificacionService;

@ExtendWith(MockitoExtension.class)
class NotificacionServiceTest {

    @Mock
    private NotificacionRepository notificacionRepository;

    @InjectMocks
    private NotificacionService service;

    @Test
    void crearNotificacion_conUsuarioValido_laGuarda() {
        Usuario usuario = new Usuario("user@test.com", "User Test", "12345678", "password", Role.REPARTIDOR);
        Notificacion notifSimulada = new Notificacion(usuario, "Título Test", "Mensaje Test");

        when(notificacionRepository.save(any(Notificacion.class))).thenReturn(notifSimulada);

        Notificacion creada = service.crearNotificacion(usuario, "Título Test", "Mensaje Test");

        assertNotNull(creada);
        assertEquals("Título Test", creada.getTitulo());
        assertEquals("Mensaje Test", creada.getMensaje());
        assertEquals(usuario.getId(), creada.getUsuarioDestino().getId());
        verify(notificacionRepository, times(1)).save(any(Notificacion.class));
    }

    @Test
    void crearNotificacion_conUsuarioNulo_lanzaExcepcion() {
        assertThrows(IllegalArgumentException.class, () -> 
            service.crearNotificacion(null, "Título Test", "Mensaje Test")
        );
    }

    @Test
    void listarPorUsuario_retornaNotificaciones() {
        Usuario usuario = new Usuario("user@test.com", "User Test", "12345678", "password", Role.REPARTIDOR);
        Notificacion n1 = new Notificacion(usuario, "A", "B");
        Notificacion n2 = new Notificacion(usuario, "C", "D");

        when(notificacionRepository.findByUsuarioDestinoOrderByFechaCreacionDesc(usuario))
            .thenReturn(List.of(n1, n2));

        List<Notificacion> list = service.listarPorUsuario(usuario);

        assertEquals(2, list.size());
        verify(notificacionRepository, times(1)).findByUsuarioDestinoOrderByFechaCreacionDesc(usuario);
    }

    @Test
    void marcarComoLeida_conIdValidoYPropietario_actualizaEstado() {
        Usuario usuario = new Usuario("user@test.com", "User Test", "12345678", "password", Role.REPARTIDOR);
        usuario.setId("USR-123");
        Notificacion n = new Notificacion(usuario, "A", "B");
        n.setId("NOT-999");

        when(notificacionRepository.findById("NOT-999")).thenReturn(Optional.of(n));
        when(notificacionRepository.save(any(Notificacion.class))).thenAnswer(i -> i.getArguments()[0]);

        Notificacion leida = service.marcarComoLeida("NOT-999", usuario);

        assertTrue(leida.isLeido());
        verify(notificacionRepository, times(1)).save(any(Notificacion.class));
    }

    @Test
    void marcarComoLeida_conDiferenteUsuario_lanzaExcepcion() {
        Usuario owner = new Usuario("user@test.com", "Owner", "123", "password", Role.REPARTIDOR);
        owner.setId("USR-OWNER");

        Usuario intruder = new Usuario("user2@test.com", "Intruder", "456", "password", Role.REPARTIDOR);
        intruder.setId("USR-INTRUDER");

        Notificacion n = new Notificacion(owner, "A", "B");
        n.setId("NOT-999");

        when(notificacionRepository.findById("NOT-999")).thenReturn(Optional.of(n));

        assertThrows(RuntimeException.class, () ->
            service.marcarComoLeida("NOT-999", intruder)
        );
    }

    @Test
    void marcarTodasComoLeidas_cambiaEstadoAUnreads() {
        Usuario usuario = new Usuario("user@test.com", "User Test", "12345678", "password", Role.REPARTIDOR);
        Notificacion n1 = new Notificacion(usuario, "A", "B");
        Notificacion n2 = new Notificacion(usuario, "C", "D");

        when(notificacionRepository.findByUsuarioDestinoOrderByFechaCreacionDesc(usuario))
            .thenReturn(List.of(n1, n2));

        service.marcarTodasComoLeidas(usuario);

        assertTrue(n1.isLeido());
        assertTrue(n2.isLeido());
        verify(notificacionRepository, times(2)).save(any(Notificacion.class));
    }

    @Test
    void obtenerCantidadSinLeer_retornaRecuento() {
        Usuario usuario = new Usuario("user@test.com", "User Test", "12345678", "password", Role.REPARTIDOR);
        
        when(notificacionRepository.countByUsuarioDestinoAndLeidoFalse(usuario)).thenReturn(5L);

        long count = service.obtenerCantidadSinLeer(usuario);

        assertEquals(5, count);
        verify(notificacionRepository, times(1)).countByUsuarioDestinoAndLeidoFalse(usuario);
    }

}
