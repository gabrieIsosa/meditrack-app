package com.meditrack.back.app.model;

import java.time.LocalDateTime;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;

@Entity
@Table(name = "alertas_fatiga")
public class AlertaFatiga {

    @Id
    private String id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "repartidor_id", nullable = false)
    @JsonIgnoreProperties({"historial", "password"})
    private Usuario repartidor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "supervisor_id")
    @JsonIgnoreProperties({"historial", "password"})
    private Usuario supervisor;

    @Column(name = "fecha_deteccion", nullable = false)
    private LocalDateTime fechaDeteccion;

    @Column(name = "fecha_decision")
    private LocalDateTime fechaDecision;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoAlertaFatiga estado = EstadoAlertaFatiga.PENDIENTE;

    @Column(length = 500)
    private String observaciones;

    public AlertaFatiga() {
        this.id = "ALF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.fechaDeteccion = LocalDateTime.now();
        this.estado = EstadoAlertaFatiga.PENDIENTE;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Usuario getRepartidor() {
        return repartidor;
    }

    public void setRepartidor(Usuario repartidor) {
        this.repartidor = repartidor;
    }

    public Usuario getSupervisor() {
        return supervisor;
    }

    public void setSupervisor(Usuario supervisor) {
        this.supervisor = supervisor;
    }

    public LocalDateTime getFechaDeteccion() {
        return fechaDeteccion;
    }

    public void setFechaDeteccion(LocalDateTime fechaDeteccion) {
        this.fechaDeteccion = fechaDeteccion;
    }

    public LocalDateTime getFechaDecision() {
        return fechaDecision;
    }

    public void setFechaDecision(LocalDateTime fechaDecision) {
        this.fechaDecision = fechaDecision;
    }

    public EstadoAlertaFatiga getEstado() {
        return estado;
    }

    public void setEstado(EstadoAlertaFatiga estado) {
        this.estado = estado;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }
    
}
