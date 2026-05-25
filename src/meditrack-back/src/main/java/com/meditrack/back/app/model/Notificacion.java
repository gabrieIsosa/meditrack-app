package com.meditrack.back.app.model;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "notificaciones")
public class Notificacion {

    @Id
    private String id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "usuario_destino_id", nullable = false)
    @JsonIgnoreProperties({"historial", "password"})
    private Usuario usuarioDestino;

    @Column(nullable = false)
    private String titulo;

    @Column(nullable = false, length = 1000)
    private String mensaje;

    @Column(name = "fecha_creacion", nullable = false)
    private String fechaCreacion;

    @Column(nullable = false)
    private boolean leido = false;

    public Notificacion() {
        this.id = "NOT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.fechaCreacion = LocalDateTime.now().toString();
        this.leido = false;
    }

    public Notificacion(Usuario usuarioDestino, String titulo, String mensaje) {
        this.id = "NOT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.usuarioDestino = usuarioDestino;
        this.titulo = titulo;
        this.mensaje = mensaje;
        this.fechaCreacion = LocalDateTime.now().toString();
        this.leido = false;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Usuario getUsuarioDestino() {
        return usuarioDestino;
    }

    public void setUsuarioDestino(Usuario usuarioDestino) {
        this.usuarioDestino = usuarioDestino;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getMensaje() {
        return mensaje;
    }

    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }

    public String getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(String fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public boolean isLeido() {
        return leido;
    }

    public void setLeido(boolean leido) {
        this.leido = leido;
    }
}
