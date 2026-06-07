package com.meditrack.back.app.service;

import java.io.ByteArrayOutputStream;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.function.Function;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

@Service
public class ExcelExportService {

    public <T> byte[] exportToExcel(
            List<T> rows,
            LinkedHashMap<String, Function<T, Object>> columns,
            String sheetName
    ) {
        try (Workbook workbook = new XSSFWorkbook();
            ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet(sheetName);

            int rowIdx = 0;

            Row headerRow = sheet.createRow(rowIdx++);
            int headerCol = 0;
            for (String header : columns.keySet()) {
                headerRow.createCell(headerCol++).setCellValue(header);
            }

            for (T rowData : rows) {
                Row row = sheet.createRow(rowIdx++);
                int colIdx = 0;

                for (Function<T, Object> extractor : columns.values()) {
                    Object val = extractor.apply(rowData);
                    row.createCell(colIdx++).setCellValue(val == null ? "" : String.valueOf(val));
                }
            }

            for (int i = 0; i < columns.size(); i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(baos);
            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Error generando Excel: " + e.getMessage(), e);
        }
    }
}