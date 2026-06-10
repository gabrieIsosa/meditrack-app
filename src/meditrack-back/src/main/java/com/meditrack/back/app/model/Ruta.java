package com.meditrack.back.app.model;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

@Entity
@Table(name = "rutas")
public class Ruta {

    @Id
    private String id;

    @Column(nullable = false)
    private String fecha;

    @Column(name = "repartidor_id", nullable = false)
    private String repartidorId;

    @Column(name = "transporte_id")
    private Long transporteId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoRuta estado;

    @Column(name = "usuario_responsable")
    private String usuarioResponsable;

    @Column(name = "fecha_creacion")
    private String fechaCreacion;

    @Column(name = "hora_creacion")
    private String horaCreacion;


    @OneToMany(mappedBy = "ruta", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("retiroOrden ASC")
    private List<RutaEnvio> envios = new ArrayList<>();

    public Ruta() {}

    public Ruta(String fecha, String repartidorId, Long transporteId, String usuarioResponsable) {
        this.id = "RUT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.fecha = fecha;
        this.repartidorId = repartidorId;
        this.transporteId = transporteId;
        this.estado = EstadoRuta.PENDIENTE;
        this.usuarioResponsable = usuarioResponsable;
        this.fechaCreacion = LocalDate.now().toString();
        this.horaCreacion = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));
    }

    public void agregarEnvio(RutaEnvio rutaEnvio) {
        rutaEnvio.setRuta(this);
        this.envios.add(rutaEnvio);
    }

    public String getId() {
    return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getFecha() {
        return fecha;
    }

    public void setFecha(String fecha) {
        this.fecha = fecha;
    }

    public String getRepartidorId() {
        return repartidorId;
    }

    public void setRepartidorId(String repartidorId) {
        this.repartidorId = repartidorId;
    }

    public Long getTransporteId() {
        return transporteId;
    }

    public void setTransporteId(Long transporteId) {
        this.transporteId = transporteId;
    }

    public EstadoRuta getEstado() {
        return estado;
    }

    public void setEstado(EstadoRuta estado) {
        this.estado = estado;
    }

    public String getUsuarioResponsable() {
        return usuarioResponsable;
    }

    public void setUsuarioResponsable(String usuarioResponsable) {
        this.usuarioResponsable = usuarioResponsable;
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

    public List<RutaEnvio> getEnvios() {
        return envios;
    }

    public void setEnvios(List<RutaEnvio> envios) {
        this.envios = envios;
    }
    
}
