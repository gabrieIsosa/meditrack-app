package com.meditrack.back.app.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.meditrack.back.app.model.Envio;
import com.meditrack.back.app.model.EstadoEnvio;
import com.meditrack.back.app.model.HistorialEstado;

@Service
public class EnvioService {

    private final List<Envio> envios = new ArrayList<>();

    public EnvioService() {
        Envio e1 = new Envio("1", "Laboratorio Roemmers S.A.", "Farmacia del Pueblo",
                "Av. Corrientes 1234, Buenos Aires",
                "Buenos Aires", "Rosario", "2026-04-28",
                "Amoxicilina 500mg x 21 comp. — Lote: ROE-2026-04",
                "Mantener entre 15°C y 25°C", EstadoEnvio.CREADO);
        e1.setPrioridad("ALTA");
        e1.agregarHistorial(new HistorialEstado(EstadoEnvio.CREADO, "2026-04-24", "08:00", "sistema"));
        envios.add(e1);

        Envio e2 = new Envio("2", "Bioxcel Laboratorios", "Hospital Italiano de Buenos Aires",
                "Gaspar Campos 450, San Justo",
                "Córdoba", "Buenos Aires", "2026-04-26",
                "Insulina Glargina 100UI/mL x 5 frascos — Refrigerado",
                "Cadena de frío obligatoria: 2°C a 8°C. No congelar.", EstadoEnvio.EN_TRANSITO);
        e2.setPrioridad("ALTA");
        e2.agregarHistorial(new HistorialEstado(EstadoEnvio.CREADO,     "2026-04-22", "09:30", "admin"));
        e2.agregarHistorial(new HistorialEstado(EstadoEnvio.EN_TRANSITO, "2026-04-23", "06:45", "repartidor01"));
        envios.add(e2);

        Envio e3 = new Envio("3", "Depósito Central MediTrack", "Clínica Santa Rosa",
                "Belgrano 789, Mendoza",
                "Buenos Aires", "Mendoza", "2026-04-25",
                "Ibuprofeno 400mg x 100 comp. + Paracetamol 1g x 50 comp. — Lote: DCM-0042",
                "", EstadoEnvio.EN_DEPOSITO);
        e3.setPrioridad("MEDIA");
        e3.agregarHistorial(new HistorialEstado(EstadoEnvio.CREADO,      "2026-04-20", "14:00", "admin"));
        e3.agregarHistorial(new HistorialEstado(EstadoEnvio.EN_TRANSITO, "2026-04-21", "07:00", "repartidor02"));
        e3.agregarHistorial(new HistorialEstado(EstadoEnvio.EN_DEPOSITO, "2026-04-23", "18:30", "deposito_mza"));
        envios.add(e3);
    }

    public List<Envio> listarTodos() {
        return envios;
    }

    public Envio obtenerPorId(String id) {
        return envios.stream()
                .filter(e -> e.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Envío no encontrado: " + id));
    }

    public Envio crear(Map<String, String> body) {
        String id = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Envio nuevo = new Envio(
            id,
            body.getOrDefault("remitente", ""),
            body.getOrDefault("destinatario", ""),
            body.getOrDefault("direccionEntrega", ""),
            body.getOrDefault("origen", ""),
            body.getOrDefault("destino", ""),
            body.getOrDefault("fechaEstimada", ""),
            body.getOrDefault("descripcionCarga", ""),
            body.getOrDefault("observaciones", ""),
            EstadoEnvio.CREADO
        );

        String hoy  = LocalDate.now().toString();
        String hora = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));
        nuevo.setPrioridad("MEDIA");
        nuevo.agregarHistorial(new HistorialEstado(EstadoEnvio.CREADO, hoy, hora, "sistema")); 
        envios.add(nuevo);

        return nuevo;
    }

    public Envio actualizar(String id, Map<String, String> body) {
        Envio envio = obtenerPorId(id);
        if (body.containsKey("remitente"))        envio.setRemitente(body.get("remitente"));
        if (body.containsKey("destinatario"))     envio.setDestinatario(body.get("destinatario"));
        if (body.containsKey("direccionEntrega")) envio.setDireccionEntrega(body.get("direccionEntrega"));
        if (body.containsKey("origen"))           envio.setOrigen(body.get("origen"));
        if (body.containsKey("destino"))          envio.setDestino(body.get("destino"));
        if (body.containsKey("fechaEstimada"))    envio.setFechaEstimada(body.get("fechaEstimada"));
        if (body.containsKey("descripcionCarga")) envio.setDescripcionCarga(body.get("descripcionCarga"));
        if (body.containsKey("observaciones"))    envio.setObservaciones(body.get("observaciones"));

        return envio;
    }

    public Envio cambiarEstado(String id, EstadoEnvio nuevoEstado, String fecha, String hora, String usuario) {
        Envio envio = obtenerPorId(id);
        EstadoEnvio estadoEsperado = envio.getEstado().siguiente();

        if (!estadoEsperado.equals(nuevoEstado)) {
            throw new IllegalArgumentException(
                "Transición inválida: " + envio.getEstado() + " → " + nuevoEstado +
                ". El siguiente estado válido es: " + estadoEsperado
            );
        }

        envio.setEstado(nuevoEstado);
        envio.agregarHistorial(new HistorialEstado(nuevoEstado, fecha, hora, usuario));

        return envio;
    }
    
}
