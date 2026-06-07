package com.meditrack.back.app.controller;

import java.time.LocalDate;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.meditrack.back.app.model.Role;
import com.meditrack.back.app.model.Sesion;
import com.meditrack.back.app.service.AuthService;
import com.meditrack.back.app.service.CsvExportService;
import com.meditrack.back.app.service.ExcelExportService;
import com.meditrack.back.app.service.ReporteService;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.function.Function;

@RestController
@RequestMapping("/api/reportes")
@CrossOrigin(origins = "*")
public class ReportesController {

    private final ReporteService reporteService;
    private final AuthService authService;
    private final CsvExportService csvExportService;
    private final ExcelExportService excelExportService;

    public ReportesController(ReporteService reporteService, AuthService authService,
            CsvExportService csvExportService, ExcelExportService excelExportService) {
        this.reporteService = reporteService;
        this.authService = authService;
        this.csvExportService = csvExportService;
        this.excelExportService = excelExportService;
    }

    private Sesion autenticar(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Token requerido");
        }
        return authService.validar(authHeader.substring(7));
    }

    @GetMapping
    public ResponseEntity<?> generarReporte(
            @RequestParam String tema,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin,
            @RequestParam(defaultValue = "diaria") String granularidad,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Sesion sesion = autenticar(authHeader);
            if (sesion.getRole() != Role.SUPERVISOR) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Sin permisos para acceder a reportes operativos"));
            }
            Map<String, Object> reporte = reporteService.generarReporteOperativo(tema, fechaInicio.toString(),
                    fechaFin.toString(), granularidad);
            return ResponseEntity.ok(reporte);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error interno al procesar el reporte"));
        }
    }

    @GetMapping(value = "/export/csv", produces = "text/csv")
    public ResponseEntity<?> exportarReporteCsv(
            @RequestParam String tema,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin,
            @RequestParam(defaultValue = "diaria") String granularidad,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        try {
            Sesion sesion = autenticar(authHeader);

            // Mantenemos tu regla actual: SOLO supervisor
            if (sesion.getRole() != Role.SUPERVISOR) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Sin permisos para acceder a reportes operativos"));
            }

            Map<String, Object> reporte = reporteService.generarReporteOperativo(
                    tema,
                    fechaInicio.toString(),
                    fechaFin.toString(),
                    granularidad);

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> rows = (List<Map<String, Object>>) reporte.get("data");

            // Columnas ordenadas (header -> cómo extraer)
            LinkedHashMap<String, Function<Map<String, Object>, Object>> cols = new LinkedHashMap<>();

            switch (tema) {
                case "volumen" -> {
                    cols.put("Periodo", r -> r.get("periodo"));
                    cols.put("Estado", r -> r.get("estado"));
                    cols.put("Total", r -> r.get("total"));
                }
                case "entregas" -> {
                    cols.put("Periodo", r -> r.get("periodo"));
                    cols.put("Total Envios", r -> r.get("totalEnvios"));
                    cols.put("Total A Tiempo", r -> r.get("totalATiempo"));
                    cols.put("% A Tiempo", r -> r.get("porcentajeATiempo"));
                }
                case "incidencias" -> {
                    cols.put("Periodo", r -> r.get("periodo"));
                    cols.put("Tipo", r -> r.get("tipo"));
                    cols.put("Repartidor", r -> r.get("repartidor"));
                    cols.put("Estado", r -> r.get("estado"));
                }
                default -> throw new IllegalArgumentException("Tema de reporte no válido");
            }

            // Excel (ES/Latam) suele abrir mejor con ';'
            byte[] csv = csvExportService.exportToCsv(rows, cols, ';');

            String filename = "reporte-" + tema + "-" + fechaInicio + "-" + fechaFin + ".csv";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .header(HttpHeaders.CONTENT_TYPE, "text/csv; charset=utf-8")
                    .body(csv);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error interno al procesar el reporte"));
        }
    }

    @GetMapping(value = "/export/excel", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    public ResponseEntity<?> exportarReporteExcel(
            @RequestParam String tema,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin,
            @RequestParam(defaultValue = "diaria") String granularidad,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        try {
            Sesion sesion = autenticar(authHeader);

            if (sesion.getRole() != Role.SUPERVISOR) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Sin permisos para acceder a reportes operativos"));
            }

            Map<String, Object> reporte = reporteService.generarReporteOperativo(
                    tema,
                    fechaInicio.toString(),
                    fechaFin.toString(),
                    granularidad);

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> rows = (List<Map<String, Object>>) reporte.get("data");

            LinkedHashMap<String, Function<Map<String, Object>, Object>> cols = new LinkedHashMap<>();

            switch (tema) {
                case "volumen" -> {
                    cols.put("Periodo", r -> r.get("periodo"));
                    cols.put("Estado", r -> r.get("estado"));
                    cols.put("Total", r -> r.get("total"));
                }
                case "entregas" -> {
                    cols.put("Periodo", r -> r.get("periodo"));
                    cols.put("Total Envios", r -> r.get("totalEnvios"));
                    cols.put("Total A Tiempo", r -> r.get("totalATiempo"));
                    cols.put("% A Tiempo", r -> r.get("porcentajeATiempo"));
                }
                case "incidencias" -> {
                    cols.put("Periodo", r -> r.get("periodo"));
                    cols.put("Tipo", r -> r.get("tipo"));
                    cols.put("Descripcion", r -> r.get("descripcion"));
                    cols.put("Repartidor", r -> r.get("repartidor"));
                    cols.put("Estado", r -> r.get("estado"));
                }
                default -> throw new IllegalArgumentException("Tema de reporte no válido");
            }

            byte[] excel = excelExportService.exportToExcel(rows, cols, "Reporte");

            String filename = "reporte-" + tema + "-" + fechaInicio + "-" + fechaFin + ".xlsx";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .header(HttpHeaders.CONTENT_TYPE,
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                    .body(excel);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error interno al procesar el reporte"));
        }
    }

}
