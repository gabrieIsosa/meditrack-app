package com.meditrack.back.app;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import com.meditrack.back.app.model.DetalleEnvio;
import com.meditrack.back.app.model.Envio;
import com.meditrack.back.app.model.EstadoEnvio;
import com.meditrack.back.app.model.Medicamento;
import com.meditrack.back.app.repository.EnvioRepository;
import com.meditrack.back.app.repository.MedicamentoRepository;
import com.meditrack.back.app.service.EnvioService;

@ExtendWith(MockitoExtension.class)
class EnvioServiceTest {

    @Mock
    private EnvioRepository envioRepository;

    @Mock
    private MedicamentoRepository medicamentoRepository;

    @InjectMocks
    private EnvioService service;

    private final String USUARIO_TEST = "admin_test";

    @Test
    void listarTodos_inicialmenteVacio() {
        when(envioRepository.findAll()).thenReturn(new ArrayList<>());
        
        assertEquals(0, service.listarTodos().size());
    }

    @Test
    void crear_agregaEnvioEnEstadoPENDIENTE() {
        Medicamento medSimulado = new Medicamento();
        medSimulado.setId("med-1");
        
        DetalleEnvio detalleSimulado = new DetalleEnvio();
        detalleSimulado.setMedicamento(medSimulado);
        detalleSimulado.setCantidad(5);

        Envio inputEnvio = new Envio();
        inputEnvio.setDestinatario("Juan Pérez");
        inputEnvio.setRemitente("Laboratorio Central");
        inputEnvio.setPrioridad("ALTA");
        inputEnvio.setDetalles(List.of(detalleSimulado));
        
        Envio envioSimulado = new Envio();
        envioSimulado.setId("ENV-12345");
        envioSimulado.setDestinatario("Juan Pérez");
        envioSimulado.setEstado(EstadoEnvio.PENDIENTE);
        envioSimulado.setUsuarioResponsable(USUARIO_TEST);
        envioSimulado.setDetalles(List.of(detalleSimulado));

        when(medicamentoRepository.findById("med-1")).thenReturn(Optional.of(medSimulado));
        when(envioRepository.save(any(Envio.class))).thenReturn(envioSimulado);
        
        Envio nuevo = service.crear(inputEnvio, USUARIO_TEST); 
        
        assertNotNull(nuevo.getId());
        assertEquals("Juan Pérez", nuevo.getDestinatario());
        assertEquals(EstadoEnvio.PENDIENTE, nuevo.getEstado());
        assertEquals(USUARIO_TEST, nuevo.getUsuarioResponsable());

        when(envioRepository.findAll()).thenReturn(List.of(envioSimulado));
        assertEquals(1, service.listarTodos().size());
    }

    @Test
    void actualizarEstado_cambiaEstadoCorrectamente() {
        Envio envioExistente = new Envio();
        envioExistente.setId("ENV-111");
        envioExistente.setEstado(EstadoEnvio.PENDIENTE);
        envioExistente.setUsuarioResponsable(USUARIO_TEST);

        when(envioRepository.findById("ENV-111")).thenReturn(Optional.of(envioExistente));
        when(envioRepository.save(any(Envio.class))).thenAnswer(i -> i.getArguments()[0]);
        
        Envio actualizado = service.actualizarEstado("ENV-111", EstadoEnvio.ASIGNADO, USUARIO_TEST, "REP-123", null, null);
        
        assertEquals(EstadoEnvio.ASIGNADO, actualizado.getEstado());
        assertEquals(USUARIO_TEST, actualizado.getUsuarioResponsable());
    }

    @Test
    void actualizarEstado_conIncidente_asignaCamposCorrectamente() {
        Envio envioExistente = new Envio();
        envioExistente.setId("ENV-456");
        envioExistente.setEstado(EstadoEnvio.EN_TRANSITO);
        envioExistente.setUsuarioResponsable(USUARIO_TEST);

        when(envioRepository.findById("ENV-456")).thenReturn(Optional.of(envioExistente));
        when(envioRepository.save(any(Envio.class))).thenAnswer(i -> i.getArguments()[0]);

        Envio actualizado = service.actualizarEstado(
                "ENV-456", 
                EstadoEnvio.INCIDENTE_REPORTADO, 
                USUARIO_TEST, 
                null, 
                "FALLA_MECANICA", 
                "Cubierta pinchada"
        );

        assertNotNull(actualizado);
        assertEquals(EstadoEnvio.INCIDENTE_REPORTADO, actualizado.getEstado());
    }

    @Test
    void actualizarEstado_idInexistente_lanzaExcepcion() {
        when(envioRepository.findById("NON-EXISTENT-ID")).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> 
            service.actualizarEstado("NON-EXISTENT-ID", EstadoEnvio.EN_TRANSITO, USUARIO_TEST, null, null, null)
        );
    }

    @Test
    void auditoria_registraFechaYHoraAutomaticamente() {
        Medicamento medSimulado = new Medicamento();
        medSimulado.setId("med-1");
        
        DetalleEnvio detalleSimulado = new DetalleEnvio();
        detalleSimulado.setMedicamento(medSimulado);
        detalleSimulado.setCantidad(2);

        Envio inputEnvio = new Envio();
        inputEnvio.setDestinatario("Test Auditoria");
        inputEnvio.setRemitente("Test");
        inputEnvio.setDetalles(List.of(detalleSimulado));

        when(medicamentoRepository.findById("med-1")).thenReturn(Optional.of(medSimulado));
        when(envioRepository.save(any(Envio.class))).thenAnswer(i -> {
            Envio e = (Envio) i.getArguments()[0];
            e.setFechaCreacion("2026-05-17");
            e.setHoraCreacion("12:00");
            e.setUsuarioResponsable(USUARIO_TEST);
            return e;
        });

        Envio nuevo = service.crear(inputEnvio, USUARIO_TEST);
        
        assertNotNull(nuevo.getFechaCreacion());
        assertNotNull(nuevo.getHoraCreacion());
        assertEquals(USUARIO_TEST, nuevo.getUsuarioResponsable());
    }

    @Test
    void estados_todosLosNuevosEstadosSonAccesibles() {
        Envio envioExistente = new Envio();
        envioExistente.setId("ENV-999");
        envioExistente.setEstado(EstadoEnvio.PENDIENTE);
        envioExistente.setUsuarioResponsable(USUARIO_TEST);

        when(envioRepository.findById("ENV-999")).thenReturn(Optional.of(envioExistente));
        when(envioRepository.save(any(Envio.class))).thenAnswer(i -> i.getArguments()[0]);
        
        service.actualizarEstado("ENV-999", EstadoEnvio.EN_PREPARACION, USUARIO_TEST, null, null, null);
        assertEquals(EstadoEnvio.EN_PREPARACION, envioExistente.getEstado());
        
        service.actualizarEstado("ENV-999", EstadoEnvio.EN_PUNTO_DE_ENTREGA, USUARIO_TEST, null, null, null);
        assertEquals(EstadoEnvio.EN_PUNTO_DE_ENTREGA, envioExistente.getEstado());
        
        service.actualizarEstado("ENV-999", EstadoEnvio.INCIDENTE_REPORTADO, USUARIO_TEST, null, "ACCIDENTE", "Colisión menor");
        assertEquals(EstadoEnvio.INCIDENTE_REPORTADO, envioExistente.getEstado());
    }

}
