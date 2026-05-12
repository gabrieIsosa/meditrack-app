package com.meditrack.back.app.model;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

public class Envio {

    private String id;
    private String remitente;
    private String destinatario;
    private String direccionEntrega;
    private String origen;
    private String destino;
    private String fechaEstimada;
    private String descripcionCarga;
    private String observaciones;
    private EstadoEnvio estado;
    private String prioridad;
    private String motivoCancelacion;
    private String firmaCancelacion;
    private String fechaCancelacion;
    private List<HistorialEstado> historial = new ArrayList<>();
    private String usuarioResponsable;
    private String repartidorId;
    private String fechaCreacion;
    private String horaCreacion;

    public Envio() {
        this.fechaCreacion = LocalDate.now().toString();
        this.horaCreacion = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));
    }

    public Envio(String id, String remitente, String destinatario, String direccionEntrega, String origen, String destino,
        String fechaEstimada, String descripcionCarga, String observaciones, EstadoEnvio estado, String usuario) {
        this.id = id;
        this.remitente = remitente;
        this.destinatario = destinatario;
        this.direccionEntrega = direccionEntrega;
        this.origen = origen;
        this.destino = destino;
        this.fechaEstimada = fechaEstimada;
        this.descripcionCarga = descripcionCarga;
        this.observaciones = observaciones;
        this.estado = estado;
        this.usuarioResponsable = usuario;
        this.fechaCreacion = LocalDate.now().toString();
        this.horaCreacion = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));
    }

    public String getId() { 
        return id; 
    }

    public void setId(String id) { 
        this.id = id; 
    }

    public String getRemitente() { 
        return remitente; 
    }

    public void setRemitente(String v) { 
        this.remitente = v; 
    }

    public String getDestinatario() { 
        return destinatario; 
    }

    public void setDestinatario(String v) { 
        this.destinatario = v; 
    }

    public String getDireccionEntrega() { 
        return direccionEntrega; 
    }

    public void setDireccionEntrega(String v) { 
        this.direccionEntrega = v; 
    }

    public String getOrigen() { 
        return origen; 
    }

    public void setOrigen(String v) { 
        this.origen = v; 
    }

    public String getDestino() { 
        return destino; 
    }

    public void setDestino(String v) { 
        this.destino = v; 
    }

    public String getFechaEstimada() { 
        return fechaEstimada; 
    }

    public void setFechaEstimada(String v) { 
        this.fechaEstimada = v; 
    }

    public String getDescripcionCarga() { 
        return descripcionCarga; 
    }

    public void setDescripcionCarga(String v) { 
        this.descripcionCarga = v; 
    }

    public String getObservaciones() { 
        return observaciones; 
    }

    public void setObservaciones(String v) { 
        this.observaciones = v; 
    }

    public EstadoEnvio getEstado() { 
        return estado; 
    }

    public void setEstado(EstadoEnvio v) { 
        this.estado = v; 
    }

    public List<HistorialEstado> getHistorial() { 
        return historial; 
    }

    public void setHistorial(List<HistorialEstado> historial) { 
        this.historial = historial; 
    }

    public void agregarHistorial(HistorialEstado entrada) { 
        this.historial.add(entrada); 
    }

    public String getPrioridad() { 
        return prioridad; 
    }

    public void setPrioridad(String prioridad) { 
        this.prioridad = prioridad; 
    }

    public String getUsuarioResponsable() { 
        return usuarioResponsable; 
    }

    public void setUsuarioResponsable(String usuarioResponsable) { 
        this.usuarioResponsable = usuarioResponsable; 
    }

    public String getRepartidorId() { 
        return repartidorId; 
    }

    public void setRepartidorId(String repartidorId) { 
        this.repartidorId = repartidorId; 
    }

    public String getFechaCreacion() { 
        return fechaCreacion; 
    }

    public void setFechaCreacion(String fechaCreacion) { 
        this.fechaCreacion = fechaCreacion; 
    }

    public String getHoraCreacion() { 
        return horaCreacion; 
    }

    public void setHoraCreacion(String horaCreacion) { 
        this.horaCreacion = horaCreacion; 
    }

    public String getMotivoCancelacion() { 
        return motivoCancelacion; 
    }

    public void setMotivoCancelacion(String motivoCancelacion) { 
        this.motivoCancelacion = motivoCancelacion; 
    }

    public String getFirmaCancelacion() { 
        return firmaCancelacion; 
    }

    public void setFirmaCancelacion(String firmaCancelacion) { 
        this.firmaCancelacion = firmaCancelacion; 
    }

    public String getFechaCancelacion() { 
        return fechaCancelacion; 
    }

    public void setFechaCancelacion(String fechaCancelacion) { 
        this.fechaCancelacion = fechaCancelacion; 
    }
    
}
