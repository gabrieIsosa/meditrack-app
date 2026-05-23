package com.meditrack.back.app.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

import jakarta.persistence.*;

@Entity
@Table(name = "clientes")
public class Cliente {

    @Id
    private String id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false, length = 500)
    private String direccion;

    @Column(precision = 10, scale = 7)
    private BigDecimal latitud;

    @Column(precision = 10, scale = 7)
    private BigDecimal longitud;

    @Column(name = "place_id")
    private String placeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_establecimiento")
    private TipoEstablecimiento tipoEstablecimiento;

    @Column(name = "estado_activo")
    private boolean estadoActivo = true;

    @Column(name = "usuario_responsable")
    private String usuarioResponsable;

    @Column(name = "fecha_creacion")
    private String fechaCreacion;

    @Column(name = "hora_creacion")
    private String horaCreacion;

    public Cliente() {
        this.id = "CLI-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.fechaCreacion = LocalDate.now().toString();
        this.horaCreacion = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));
    }

    public Cliente(String nombre,String direccion,BigDecimal latitud,BigDecimal longitud,
        String placeId,TipoEstablecimiento tipoEstablecimiento,String usuarioResponsable)
    {
        this.id = "CLI-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        this.nombre = nombre;
        this.direccion = direccion;
        this.latitud = latitud;
        this.longitud = longitud;
        this.placeId = placeId;
        this.tipoEstablecimiento = tipoEstablecimiento;
        this.usuarioResponsable = usuarioResponsable;

        this.estadoActivo = true;

        this.fechaCreacion = LocalDate.now().toString();
        this.horaCreacion = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public BigDecimal getLatitud() {
        return latitud;
    }

    public void setLatitud(BigDecimal latitud) {
        this.latitud = latitud;
    }

    public BigDecimal getLongitud() {
        return longitud;
    }

    public void setLongitud(BigDecimal longitud) {
        this.longitud = longitud;
    }

    public String getPlaceId() {
        return placeId;
    }

    public void setPlaceId(String placeId) {
        this.placeId = placeId;
    }

    public TipoEstablecimiento getTipoEstablecimiento() {
        return tipoEstablecimiento;
    }

    public void setTipoEstablecimiento(TipoEstablecimiento tipoEstablecimiento) {
        this.tipoEstablecimiento = tipoEstablecimiento;
    }

    public boolean isEstadoActivo() {
        return estadoActivo;
    }

    public void setEstadoActivo( boolean estadoActivo)
    {
        this.estadoActivo = estadoActivo;
    }

    public String getUsuarioResponsable() {
        return usuarioResponsable;
    }

    public void setUsuarioResponsable(String usuarioResponsable)
    {
        this.usuarioResponsable = usuarioResponsable;
    }

    public String getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(String fechaCreacion)
    {
        this.fechaCreacion = fechaCreacion;
    }

    public String getHoraCreacion() {
        return horaCreacion;
    }

    public void setHoraCreacion(String horaCreacion)
    {
        this.horaCreacion = horaCreacion;
    }

}
