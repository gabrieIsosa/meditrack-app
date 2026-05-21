package com.meditrack.back.app.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;

@Service
public class ReporteService {

    @PersistenceContext
    private EntityManager entityManager;

    public Map<String, Object> generarReporteOperativo(String tema, String fechaInicio, String fechaFin, String granularidad) {
        Map<String, Object> response = new HashMap<>();
        List<Map<String, Object>> dataList = new ArrayList<>();

        String formatoGrupo = "TO_CHAR(CAST(fecha_creacion AS DATE), 'YYYY-MM-DD')";
        String formatoGrupoIncidencias = "TO_CHAR(CAST(fecha AS DATE), 'YYYY-MM-DD')";
        
        if ("semanal".equals(granularidad)) {
            formatoGrupo = "TO_CHAR(CAST(fecha_creacion AS DATE), 'IYYY-IW')";
            formatoGrupoIncidencias = "TO_CHAR(CAST(fecha AS DATE), 'IYYY-IW')";
        } else if ("mensual".equals(granularidad)) {
            formatoGrupo = "TO_CHAR(CAST(fecha_creacion AS DATE), 'YYYY-MM')";
            formatoGrupoIncidencias = "TO_CHAR(CAST(fecha AS DATE), 'YYYY-MM')";
        }

        try {
            if ("volumen".equals(tema)) {
                String sql = "SELECT " + formatoGrupo + " as per, estado, COUNT(id) as tot " +
                             "FROM envios WHERE fecha_creacion BETWEEN :inicio AND :fin " +
                             "GROUP BY per, estado ORDER BY per ASC";

                Query query = entityManager.createNativeQuery(sql);
                query.setParameter("inicio", fechaInicio);
                query.setParameter("fin", fechaFin);
                List<Object[]> resultados = query.getResultList();

                for (Object[] fila : resultados) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("periodo", fila[0]);
                    map.put("estado", fila[1]);
                    map.put("total", ((Number) fila[2]).longValue());
                    dataList.add(map);
                }
                response.put("tipo", "volumen");
                response.put("data", dataList);
                return response;
            }

            if ("entregas".equals(tema)) {
                String sqlTotal = "SELECT " + formatoGrupo + " as per, COUNT(id) as tot " +
                                  "FROM envios WHERE fecha_creacion BETWEEN :inicio AND :fin " +
                                  "GROUP BY per ORDER BY per ASC";
                
                Query qTotal = entityManager.createNativeQuery(sqlTotal);
                qTotal.setParameter("inicio", fechaInicio);
                qTotal.setParameter("fin", fechaFin);
                List<Object[]> resultadosTotal = qTotal.getResultList();

                for (Object[] fila : resultadosTotal) {
                    String periodo = (String) fila[0];
                    long totalEnvios = ((Number) fila[1]).longValue();

                    String sqlATiempo = "SELECT COUNT(*) FROM envios WHERE " + formatoGrupo + " = :periodo " +
                                        "AND fecha_creacion BETWEEN :inicio AND :fin AND estado = 'ENTREGADO' AND " +
                                        "EXISTS (SELECT 1 FROM historial_estados h WHERE h.envio_id = envios.id AND h.estado = 'ENTREGADO' AND h.fecha <= envios.fecha_estimada)";
                    
                    Query qATiempo = entityManager.createNativeQuery(sqlATiempo);
                    qATiempo.setParameter("periodo", periodo);
                    qATiempo.setParameter("inicio", fechaInicio);
                    qATiempo.setParameter("fin", fechaFin);
                    long totalATiempo = ((Number) qATiempo.getSingleResult()).longValue();

                    double porcentaje = totalEnvios > 0 ? ((double) totalATiempo / totalEnvios * 100.0) : 0.0;
                    porcentaje = Math.round(porcentaje * 100.0) / 100.0;

                    Map<String, Object> metrics = new HashMap<>();
                    metrics.put("periodo", periodo);
                    metrics.put("totalEnvios", totalEnvios);
                    metrics.put("totalATiempo", totalATiempo);
                    metrics.put("porcentajeATiempo", porcentaje);
                    dataList.add(metrics);
                }

                response.put("tipo", "entregas");
                response.put("data", dataList);
                return response;
            }

            if ("incidencias".equals(tema)) {
                String sqlIncidencias = "SELECT " + formatoGrupoIncidencias + " as per, i.tipo, i.usuario, i.estado " +
                                        "FROM historial_estados i " +
                                        "WHERE i.estado = 'INCIDENTE_REPORTADO' AND i.tipo <> 'CAMBIO_ESTADO' AND i.fecha BETWEEN :inicio AND :fin " +
                                        "ORDER BY per ASC, i.fecha DESC";

                Query query = entityManager.createNativeQuery(sqlIncidencias);
                query.setParameter("inicio", fechaInicio);
                query.setParameter("fin", fechaFin);
                List<Object[]> resultados = query.getResultList();

                for (Object[] fila : resultados) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("periodo", fila[0]);
                    map.put("tipo", fila[1]);
                    map.put("repartidor", fila[2] != null ? fila[2] : "No asignado");
                    map.put("estado", fila[3]);
                    dataList.add(map);
                }
                response.put("tipo", "incidencias");
                response.put("data", dataList);
                return response;
            }

        } catch (Exception ex) {
            throw new IllegalArgumentException("Error en base de datos al procesar el reporte: " + ex.getMessage());
        }

        throw new IllegalArgumentException("Tema de reporte no válido");
    }
}