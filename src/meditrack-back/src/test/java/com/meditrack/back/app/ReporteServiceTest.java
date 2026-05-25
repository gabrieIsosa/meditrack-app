package com.meditrack.back.app;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.meditrack.back.app.service.ReporteService;

@ExtendWith(MockitoExtension.class)
class ReporteServiceTest {

    @Mock
    private EntityManager entityManager;

    @Mock
    private Query query;

    @InjectMocks
    private ReporteService reporteService;

    @Test
    @SuppressWarnings("unchecked")
    void generarReporteOperativo_volumen_retornaDatosCorrectamente() {
        List<Object[]> resultadosSimulados = new ArrayList<>();
        resultadosSimulados.add(new Object[]{"2026-05-20", "ENTREGADO", 15L});

        when(entityManager.createNativeQuery(anyString())).thenReturn(query);
        when(query.setParameter(anyString(), anyString())).thenReturn(query);
        when(query.getResultList()).thenReturn(resultadosSimulados);

        Map<String, Object> reporte = reporteService.generarReporteOperativo("volumen", "2026-05-01", "2026-05-31", "diaria");

        assertNotNull(reporte);
        assertEquals("volumen", reporte.get("tipo"));
        
        List<Map<String, Object>> data = (List<Map<String, Object>>) reporte.get("data");
        assertEquals(1, data.size());
        
        Map<String, Object> fila = data.get(0);
        assertEquals("2026-05-20", fila.get("periodo"));
        assertEquals("ENTREGADO", fila.get("estado"));
        assertEquals(15L, fila.get("total"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void generarReporteOperativo_entregas_retornaDatosCorrectamente() {
        List<Object[]> resultadosTotalSimulados = new ArrayList<>();
        resultadosTotalSimulados.add(new Object[]{"2026-05-20", 10L});

        when(entityManager.createNativeQuery(anyString())).thenReturn(query);
        when(query.setParameter(anyString(), anyString())).thenReturn(query);
        when(query.getResultList()).thenReturn(resultadosTotalSimulados);
        when(query.getSingleResult()).thenReturn(8L);

        Map<String, Object> reporte = reporteService.generarReporteOperativo("entregas", "2026-05-01", "2026-05-31", "diaria");

        assertNotNull(reporte);
        assertEquals("entregas", reporte.get("tipo"));
        
        List<Map<String, Object>> data = (List<Map<String, Object>>) reporte.get("data");
        assertEquals(1, data.size());
        
        Map<String, Object> fila = data.get(0);
        assertEquals("2026-05-20", fila.get("periodo"));
        assertEquals(10L, fila.get("totalEnvios"));
        assertEquals(8L, fila.get("totalATiempo"));
        assertEquals(80.0, fila.get("porcentajeATiempo"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void generarReporteOperativo_incidencias_retornaDatosCorrectamente() {
        List<Object[]> resultadosSimulados = new ArrayList<>();
        resultadosSimulados.add(new Object[]{"2026-05-20", "FALLA_MECANICA", "Diego Torres", "INCIDENTE_REPORTADO", "Problema en motor"});

        when(entityManager.createNativeQuery(anyString())).thenReturn(query);
        when(query.setParameter(anyString(), anyString())).thenReturn(query);
        when(query.getResultList()).thenReturn(resultadosSimulados);

        Map<String, Object> reporte = reporteService.generarReporteOperativo("incidencias", "2026-05-01", "2026-05-31", "diaria");

        assertNotNull(reporte);
        assertEquals("incidencias", reporte.get("tipo"));
        
        List<Map<String, Object>> data = (List<Map<String, Object>>) reporte.get("data");
        assertEquals(1, data.size());
        
        Map<String, Object> fila = data.get(0);
        assertEquals("2026-05-20", fila.get("periodo"));
        assertEquals("FALLA_MECANICA", fila.get("tipo"));
        assertEquals("Diego Torres", fila.get("repartidor"));
        assertEquals("INCIDENTE_REPORTADO", fila.get("estado"));
        assertEquals("Problema en motor", fila.get("descripcion"));
    }

    @Test
    void generarReporteOperativo_temaInvalido_lanzaExcepcion() {
        assertThrows(IllegalArgumentException.class, () -> 
            reporteService.generarReporteOperativo("tema_invalido", "2026-05-01", "2026-05-31", "diaria")
        );
    }

}
