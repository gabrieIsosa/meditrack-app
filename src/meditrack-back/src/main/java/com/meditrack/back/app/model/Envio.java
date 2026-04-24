package com.meditrack.back.app.model;

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
    private List<HistorialEstado> historial = new ArrayList<>();

    public Envio(String id, String remitente, String destinatario, String direccionEntrega, String origen,
        String destino, String fechaEstimada, String descripcionCarga, String observaciones, EstadoEnvio estado) {
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
    }

    public String getId() {
        return id;
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

    public void agregarHistorial(HistorialEstado entrada) {
        this.historial.add(entrada);
    }

    public String getPrioridad() {
        return prioridad;
    }

    public void setPrioridad(String prioridad) {
        this.prioridad = prioridad;
    }

}
