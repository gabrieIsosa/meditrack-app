package com.meditrack.back.app.service;

import java.io.ByteArrayOutputStream;

import org.springframework.stereotype.Service;

import com.itextpdf.barcodes.Barcode128;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.draw.SolidLine;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.LineSeparator;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.meditrack.back.app.model.Envio;

@Service
public class EtiquetaService {

    private static final float PAGE_WIDTH = 288f;
    private static final float PAGE_HEIGHT = 432f;
    private static final float MARGIN = 15f;

    public byte[] generarEtiqueta(Envio envio) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfDocument pdf = new PdfDocument(new PdfWriter(baos));
            Document doc = new Document(pdf, new PageSize(PAGE_WIDTH, PAGE_HEIGHT));
            doc.setMargins(MARGIN, MARGIN, MARGIN, MARGIN);

            agregarCabecera(doc);
            agregarTrackingYCodigo(doc, pdf, envio.getId());
            agregarDatosEnvio(doc, envio);
            agregarInstrucciones(doc, envio.getObservaciones());

            doc.close();
            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Error al generar la etiqueta PDF", e);
        }
    }

    private void agregarCabecera(Document doc) {
        doc.add(new Paragraph("MEDITRACK")
            .setBold()
            .setFontSize(18)
            .setTextAlignment(TextAlignment.CENTER)
            .setMarginBottom(2));
        doc.add(new Paragraph("Sistema de gestión de envíos")
            .setFontSize(7)
            .setFontColor(ColorConstants.GRAY)
            .setTextAlignment(TextAlignment.CENTER)
            .setMarginBottom(4));
        doc.add(separador());
    }

    private void agregarTrackingYCodigo(Document doc, PdfDocument pdf, String trackingId) {
        doc.add(new Paragraph("TRACKING ID")
            .setFontSize(7)
            .setFontColor(ColorConstants.GRAY)
            .setTextAlignment(TextAlignment.CENTER)
            .setMarginTop(4)
            .setMarginBottom(0));

        doc.add(new Paragraph(trackingId)
            .setBold()
            .setFontSize(16)
            .setTextAlignment(TextAlignment.CENTER)
            .setCharacterSpacing(2)
            .setMarginTop(0)
            .setMarginBottom(4));

        Barcode128 barcode = new Barcode128(pdf);
        barcode.setCode(trackingId);
        barcode.setBarHeight(50f);
        barcode.setX(1.5f);

        Image barcodeImage = new Image(barcode.createFormXObject(ColorConstants.BLACK, ColorConstants.BLACK, pdf));
        barcodeImage.setHorizontalAlignment(HorizontalAlignment.CENTER);
        barcodeImage.setMaxWidth(PAGE_WIDTH - 2 * MARGIN - 20);
        doc.add(barcodeImage);
        doc.add(separador());
    }

    private void agregarDatosEnvio(Document doc, Envio envio) {
        Table tabla = new Table(UnitValue.createPercentArray(new float[]{35, 65}))
            .setWidth(UnitValue.createPercentValue(100))
            .setMarginTop(4);

        agregarFila(tabla, "Destinatario", envio.getDestinatario());
        agregarFila(tabla, "Dirección", envio.getDireccionEntrega());
        agregarFila(tabla, "Origen", envio.getOrigen());
        agregarFila(tabla, "Destino", envio.getDestino());
        agregarFila(tabla, "Fecha estimada", envio.getFechaEstimada());
        agregarFila(tabla, "Estado", envio.getEstado() != null ? envio.getEstado().name().replace("_", " ") : "-");
        agregarFila(tabla, "Prioridad", envio.getPrioridad());

        doc.add(tabla);
    }

    private void agregarInstrucciones(Document doc, String observaciones) {
        if (observaciones == null || observaciones.isBlank()) return;

        doc.add(separador());
        doc.add(new Paragraph("INSTRUCCIONES DE MANEJO")
            .setBold()
            .setFontSize(7)
            .setFontColor(ColorConstants.GRAY)
            .setMarginTop(4)
            .setMarginBottom(2));
        doc.add(new Paragraph(observaciones)
            .setFontSize(8));
    }

    private void agregarFila(Table tabla, String etiqueta, String valor) {
        tabla.addCell(new Cell()
            .add(new Paragraph(etiqueta).setBold().setFontSize(7).setFontColor(ColorConstants.GRAY))
            .setBorder(Border.NO_BORDER)
            .setPadding(2));
        tabla.addCell(new Cell()
            .add(new Paragraph(valor != null ? valor : "-").setFontSize(8))
            .setBorder(Border.NO_BORDER)
            .setPadding(2));
    }

    private LineSeparator separador() {
        SolidLine line = new SolidLine(0.5f);
        line.setColor(ColorConstants.LIGHT_GRAY);
        LineSeparator sep = new LineSeparator(line);
        sep.setMarginTop(2);
        sep.setMarginBottom(2);
        return sep;
    }

}
