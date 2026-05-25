package com.meditrack.back.app.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "mails")
public class Mail {
    @Id
    private String id;

    @Column(nullable = false)
    private String asunto;

    @Column(nullable = false)
    private String remitente;

    @Column(nullable = false)
    private String destinatario;

    @Column(columnDefinition = "TEXT")
    private String contenido;

    @Column(nullable = false)
    private String estado;

    @Column(name = "fecha_envio")
    private String fechaEnvio;

    @Column(name = "usuario_creacion")
    private String usuarioCreacion;

    @Column(name = "fecha_creacion")
    private String fechaCreacion;

    @Column(name = "hora_creacion")
    private String horaCreacion;

    public Mail() {
    }

    public Mail(String id, String asunto, String remitente, String destinatario, String contenido, String estado) {
        this.id = id;
        this.asunto = asunto;
        this.remitente = remitente;
        this.destinatario = destinatario;
        this.contenido = contenido;
        this.estado = estado;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getAsunto() {
        return asunto;
    }

    public void setAsunto(String asunto) {
        this.asunto = asunto;
    }

    public String getRemitente() {
        return remitente;
    }

    public void setRemitente(String remitente) {
        this.remitente = remitente;
    }

    public String getDestinatario() {
        return destinatario;
    }

    public void setDestinatario(String destinatario) {
        this.destinatario = destinatario;
    }

    public String getContenido() {
        return contenido;
    }

    public void setContenido(String contenido) {
        this.contenido = contenido;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getFechaEnvio() {
        return fechaEnvio;
    }

    public void setFechaEnvio(String fechaEnvio) {
        this.fechaEnvio = fechaEnvio;
    }

    public String getUsuarioCreacion() {
        return usuarioCreacion;
    }

    public void setUsuarioCreacion(String usuarioCreacion) {
        this.usuarioCreacion = usuarioCreacion;
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
}