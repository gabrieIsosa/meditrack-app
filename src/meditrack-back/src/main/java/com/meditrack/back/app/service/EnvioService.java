package com.meditrack.back.app.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.meditrack.back.app.model.Envio;
import com.meditrack.back.app.model.EstadoEnvio;
import com.meditrack.back.app.model.HistorialEstado;
import com.meditrack.back.app.model.TrackingPublicoDTO;

@Service
public class EnvioService {

    private List<Envio> envios = new ArrayList<>();

    private void registrarHistorial(Envio e, String tipo, EstadoEnvio estado, String detalle, String f, String h, String u) {
        HistorialEstado evento = new HistorialEstado();
        evento.setTipo(tipo);
        evento.setEstado(estado);
        evento.setDetalle(detalle);
        evento.setFecha(f);
        evento.setHora(h);
        evento.setUsuario(u);
        e.agregarHistorial(evento);
    }

    private String obtenerValorCampo(Envio e, String campo) {
        switch (campo) {
            case "remitente": return e.getRemitente();
            case "destinatario": return e.getDestinatario();
            case "descripcionCarga": return e.getDescripcionCarga();
            case "direccionEntrega": return e.getDireccionEntrega();
            case "origen": return e.getOrigen();
            case "destino": return e.getDestino();
            case "fechaEstimada": return e.getFechaEstimada();
            case "prioridad": return e.getPrioridad();
            case "observaciones": return e.getObservaciones();
            default: return "";
        }
    }

    private void asignarValorCampo(Envio e, String campo, String valor) {
        switch (campo) {
            case "remitente": e.setRemitente(valor); break;
            case "destinatario": e.setDestinatario(valor); break;
            case "descripcionCarga": e.setDescripcionCarga(valor); break;
            case "direccionEntrega": e.setDireccionEntrega(valor); break;
            case "origen": e.setOrigen(valor); break;
            case "destino": e.setDestino(valor); break;
            case "fechaEstimada": e.setFechaEstimada(valor); break;
            case "prioridad": e.setPrioridad(valor); break;
            case "observaciones": e.setObservaciones(valor); break;
        }
    }

    public List<Envio> listarTodos() {
        return envios;
    }

    public Envio buscarPorId(String id) {
        return envios.stream()
                .filter(e -> e.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Envío no encontrado"));
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

        String fecha = LocalDate.now().toString();
        String hora = LocalTime.now().toString().substring(0, 5);
        nuevo.setFechaCreacion(fecha);
        nuevo.setHoraCreacion(hora);

        registrarHistorial(nuevo, "CREACION", EstadoEnvio.PENDIENTE, "Creación del envío", fecha, hora, usuario);

        envios.add(nuevo);
        return nuevo;
    }

    public Envio actualizar(String id, Map<String, String> body, String usuario) {
        Envio envio = buscarPorId(id);
        String fecha = LocalDate.now().toString();
        String hora = LocalTime.now().toString().substring(0, 5);
        
        String[] campos = {"remitente", "destinatario", "descripcionCarga", "direccionEntrega", "origen", "destino", "fechaEstimada", "prioridad", "observaciones"};

        for (String campo : campos) {
            if (body.containsKey(campo)) {
                String valorNuevo = body.get(campo);
                String valorViejo = obtenerValorCampo(envio, campo);

                if (!Objects.equals(valorViejo, valorNuevo)) {
                    String detalle = campo.toUpperCase() + ": " + (valorViejo == null || valorViejo.isEmpty() ? "(vacío)" : valorViejo) + " → " + valorNuevo;
                    registrarHistorial(envio, "EDICION", envio.getEstado(), detalle, fecha, hora, usuario);
                    asignarValorCampo(envio, campo, valorNuevo);
                }
            }
        }
        return envio;
    }

    public Envio actualizarEstado(String id, EstadoEnvio nuevoEstado, String usuario, String repartidorId) {
        Envio envio = buscarPorId(id);
        EstadoEnvio estadoViejo = envio.getEstado();
        
        if (nuevoEstado == EstadoEnvio.ASIGNADO) {
            if (repartidorId == null || repartidorId.trim().isEmpty()) {
                throw new IllegalArgumentException("Debe seleccionar un repartidor para pasar a estado ASIGNADO");
            }
            envio.setRepartidorId(repartidorId);
        }
        
        if (estadoViejo != nuevoEstado) {
            envio.setEstado(nuevoEstado);
            String detalle = estadoViejo.name().replace("_", " ") + " → " + nuevoEstado.name().replace("_", " ");
            if (nuevoEstado == EstadoEnvio.ASIGNADO) {
                detalle += " (Repartidor ID: " + repartidorId + ")";
            }
            registrarHistorial(envio, "CAMBIO_ESTADO", nuevoEstado, detalle, LocalDate.now().toString(), LocalTime.now().toString().substring(0, 5), usuario);
        }
        return envio;
    }

    public Envio reasignarRepartidor(String id, String nuevoRepartidorId, String usuario) {
        Envio envio = buscarPorId(id);

        if (nuevoRepartidorId == null || nuevoRepartidorId.trim().isEmpty()) {
            throw new IllegalArgumentException("El ID del nuevo repartidor es obligatorio");
        }

        String repartidorAnterior = envio.getRepartidorId() != null ? envio.getRepartidorId() : "Sin asignar";
        envio.setRepartidorId(nuevoRepartidorId);

        String detalle = "Cambio de repartidor: " + repartidorAnterior + " → " + nuevoRepartidorId;
        registrarHistorial(envio, "REASIGNACION", envio.getEstado(), detalle, LocalDate.now().toString(), LocalTime.now().toString().substring(0, 5), usuario);

        return envio;
    }

    public Envio cancelar(String id, String motivo, String firma, String fecha, String hora, String usuario) {
        Envio envio = buscarPorId(id);

        if (!envio.getEstado().permiteCancelacion()) {
            throw new IllegalArgumentException("No se puede cancelar un envío en estado: " + envio.getEstado());
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
        
        registrarHistorial(envio, "CANCELACION", EstadoEnvio.CANCELADO, "Motivo: " + motivo, fecha, hora, usuario);
        
        return envio;
    }

    public boolean eliminar(String id) {
        return envios.removeIf(e -> e.getId().equals(id));
    }

    public TrackingPublicoDTO obtenerTrackingPublico(String id) {
        if (id == null || id.trim().isEmpty()) {
            throw new IllegalArgumentException("Tracking ID inválido");
        }

        String tracking = id.trim().toUpperCase();
        Envio envio = buscarPorId(tracking);

        String fecha = envio.getFechaCreacion();
        String hora = envio.getHoraCreacion();

        if(envio.getHistorial() != null && !envio.getHistorial().isEmpty()) {
            HistorialEstado ultimoEvento = envio.getHistorial().get(envio.getHistorial().size() - 1);
            if(ultimoEvento.getFecha() != null && !ultimoEvento.getFecha().isBlank()) {
                fecha = ultimoEvento.getFecha();
            }
            if(ultimoEvento.getHora() != null && !ultimoEvento.getHora().isBlank()) {
                hora = ultimoEvento.getHora();
            }
        }

        return new TrackingPublicoDTO(
            envio.getId(),
            envio.getEstado() != null ? envio.getEstado().name() : "DESCONOCIDO",
            fecha,
            hora
        );
    }

}
