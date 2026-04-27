package com.meditrack.back.app.service;

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
    private List<Envio> envios = new ArrayList<>();

    public List<Envio> listarTodos() {
        return envios;
    }

    public Envio crear(Map<String, String> datos, String usuario) {
        Envio nuevo = new Envio();
        nuevo.setId(UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        nuevo.setRemitente(datos.get("remitente"));
        nuevo.setDestinatario(datos.get("destinatario"));
        nuevo.setDescripcionCarga(datos.get("descripcionCarga"));
        nuevo.setDireccionEntrega(datos.get("direccionEntrega"));
        nuevo.setOrigen(datos.get("origen"));
        nuevo.setDestino(datos.get("destino"));
        nuevo.setFechaEstimada(datos.get("fechaEstimada"));
        nuevo.setPrioridad(datos.get("prioridad"));
        nuevo.setObservaciones(datos.get("observaciones"));
        nuevo.setEstado(EstadoEnvio.PENDIENTE);
        nuevo.setUsuarioResponsable(usuario);
        envios.add(nuevo);
        return nuevo;
    }

    public Envio actualizar(String id, Map<String, String> body) {
        Envio envio = envios.stream()
                .filter(e -> e.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Envío no encontrado"));

        if (body.containsKey("remitente")) envio.setRemitente(body.get("remitente"));
        if (body.containsKey("destinatario")) envio.setDestinatario(body.get("destinatario"));
        if (body.containsKey("descripcionCarga")) envio.setDescripcionCarga(body.get("descripcionCarga"));
        if (body.containsKey("direccionEntrega")) envio.setDireccionEntrega(body.get("direccionEntrega"));
        if (body.containsKey("origen")) envio.setOrigen(body.get("origen"));
        if (body.containsKey("destino")) envio.setDestino(body.get("destino"));
        if (body.containsKey("fechaEstimada")) envio.setFechaEstimada(body.get("fechaEstimada"));
        if (body.containsKey("prioridad")) envio.setPrioridad(body.get("prioridad"));
        if (body.containsKey("observaciones")) envio.setObservaciones(body.get("observaciones"));

        return envio;
    }

    public Envio actualizarEstado(String id, EstadoEnvio nuevoEstado, String usuario) {
        Envio envio = envios.stream()
                .filter(e -> e.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Envío no encontrado"));
        envio.setEstado(nuevoEstado);
        envio.setUsuarioResponsable(usuario);
        return envio;
    }

    public Envio cancelar(String id, String motivo, String firma, String fecha, String hora, String usuario) {
        Envio envio = envios.stream()
                .filter(e -> e.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Envío no encontrado"));

        if (!envio.getEstado().permiteCancelacion()) {
            throw new IllegalArgumentException(
                "No se puede cancelar un envío en estado: " + envio.getEstado()
            );
        }

        if (motivo == null || motivo.isBlank()) {
            throw new IllegalArgumentException("El motivo de cancelación es obligatorio");
        }

        if (firma == null || firma.isBlank()) {
            throw new IllegalArgumentException("La firma es obligatoria");
        }

        envio.setEstado(EstadoEnvio.CANCELADO);
        envio.setMotivoCancelacion(motivo);
        envio.setFirmaCancelacion(firma);
        envio.setFechaCancelacion(fecha + " " + hora);
        envio.agregarHistorial(new HistorialEstado(EstadoEnvio.CANCELADO, fecha, hora, usuario));

        return envio;
    }
    
}