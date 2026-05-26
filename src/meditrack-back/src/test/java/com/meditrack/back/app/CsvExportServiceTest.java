package com.meditrack.back.app;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;

import com.meditrack.back.app.service.CsvExportService;

class CsvExportServiceTest {

    static class Row {
        private final String periodo;
        private final String estado;
        private final long total;

        Row(String periodo, String estado, long total) {
            this.periodo = periodo;
            this.estado = estado;
            this.total = total;
        }

        String getPeriodo() { return periodo; }
        String getEstado() { return estado; }
        long getTotal() { return total; }
    }

    @Test
    void export_generatesHeadersAndRows_withDelimiterSemicolon_andBomUtf8() {
        CsvExportService svc = new CsvExportService();

        List<Row> rows = List.of(
                new Row("2026-05-01", "ENTREGADO", 10),
                new Row("2026-05-02", "CREADO", 5)
        );

        LinkedHashMap<String, Function<Row, Object>> cols = new LinkedHashMap<>();
        cols.put("Periodo", Row::getPeriodo);
        cols.put("Estado", Row::getEstado);
        cols.put("Total", r -> r.getTotal());

        byte[] out = svc.exportToCsv(rows, cols, ';');

        // 1) BOM UTF-8 (EF BB BF)
        assertTrue(out.length > 3, "El CSV debería tener contenido");
        assertEquals((byte) 0xEF, out[0]);
        assertEquals((byte) 0xBB, out[1]);
        assertEquals((byte) 0xBF, out[2]);

        // 2) Contenido: headers y filas
        String csv = new String(out, StandardCharsets.UTF_8);

        assertTrue(csv.contains("Periodo;Estado;Total"), "Debe incluir encabezados");
        assertTrue(csv.contains("2026-05-01;ENTREGADO;10"), "Debe incluir fila 1");
        assertTrue(csv.contains("2026-05-02;CREADO;5"), "Debe incluir fila 2");
    }
}