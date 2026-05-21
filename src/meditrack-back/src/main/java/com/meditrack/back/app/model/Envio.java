package com.meditrack.back.app.model;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "envios")
public class Envio {

    @Id
    private String id;

    @Column(nullable = false)
    private String remitente;

    @Column(nullable = false)
    private String destinatario;

    @Column(nullable = false)
    private String origen;

    @Column(nullable = false)
    private String destino;

    @Column(name = "fecha_estimada")
    private String fechaEstimada;

    @Column(name = "descripcion_carga")
    private String descripcionCarga;

    private String observaciones;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoEnvio estado;

    private String prioridad;
    
    @Column(name = "motivo_cancelacion")
    private String motivoCancelacion;

    @Column(name = "firma_cancelacion")
    private String firmaCancelacion;

    @Column(name = "fecha_cancelacion")
    private String fechaCancelacion;

    @Column(name = "usuario_responsable")
    private String usuarioResponsable;

    @Column(name = "repartidor_id")
    private String repartidorId;

    @Column(name = "fecha_creacion")
    private String fechaCreacion;

    @Column(name = "hora_creacion")
    private String horaCreacion;

    @Column(name = "latitud_origen")
    private Double latitudOrigen;

    @Column(name = "longitud_origen")
    private Double longitudOrigen;

    @Column(name = "latitud_destino")
    private Double latitudDestino;

    @Column(name = "longitud_destino")
    private Double longitudDestino;

    @OneToMany(mappedBy = "envio", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<HistorialEstado> historial = new ArrayList<>();

    @OneToMany(mappedBy = "envio", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DetalleEnvio> detalles = new ArrayList<>();

    public Envio() {
    }

    public Envio(String id, String remitente, String destinatario, String origen, String destino,
                 String fechaEstimada, String descripcionCarga, String observaciones, EstadoEnvio estado, String usuario) {
        this.id = id;
        this.remitente = remitente;
        this.destinatario = destinatario;
        this.origen = origen;
        this.destino = destino;
        this.fechaEstimada = fechaEstimada;
        this.descripcionCarga = descripcionCarga;
        this.observaciones = observaciones;
        this.estado = estado;
        this.usuarioResponsable = usuario;
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

    public String getDescripcionCarga(){
        return descripcionCarga;
    }

    public void setDescripcionCarga(String v){
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
        entrada.setEnvio(this);
        this.historial.add(entrada); 
    }

    public List<DetalleEnvio> getDetalles() {
        return detalles;
    }

    public void setDetalles(List<DetalleEnvio> detalles) {
        if (this.detalles != null) {
            this.detalles.clear();
            if (detalles != null) {
                for (DetalleEnvio d : detalles) {
                    this.agregarDetalle(d);
                }
            }
        } else {
            this.detalles = detalles;
        }
    }

    public void agregarDetalle(DetalleEnvio detalle) {
        if (detalle != null) {
            detalle.setEnvio(this);
            this.detalles.add(detalle);
        }
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

    public Double getLatitudOrigen() {
        return latitudOrigen;
    }

    public void setLatitudOrigen(Double latitudOrigen) {
        this.latitudOrigen = latitudOrigen;
    }

    public Double getLongitudOrigen() {
        return longitudOrigen;
    }

    public void setLongitudOrigen(Double longitudOrigen) {
        this.longitudOrigen = longitudOrigen;
    }

    public Double getLatitudDestino() {
        return latitudDestino;
    }

    public void setLatitudDestino(Double latitudDestino) {
        this.latitudDestino = latitudDestino;
    }

    public Double getLongitudDestino() {
        return longitudDestino;
    }

    public void setLongitudDestino(Double longitudDestino) {
        this.longitudDestino = longitudDestino;
    }

}