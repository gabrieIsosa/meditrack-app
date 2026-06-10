package com.meditrack.back.app.model;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "reclamos_cambio_datos")
public class ReclamoCambioDatos {

    @Id
    private String id;

    @ManyToOne
    @JoinColumn(name = "envio_id", nullable = false)
    private Envio envio;

    @Column(name = "campo_reclamado", nullable = false)
    private String campoReclamado;

    @Column(name = "valor_solicitado", nullable = false, length = 500)
    private String valorSolicitado;

    @Column(nullable = false, length = 1000)
    private String motivo;

    @Column(length = 255)
    private String contacto;

    @Column(nullable = false)
    private String estado;

    @Column(name = "fecha_creacion", nullable = false)
    private String fechaCreacion;

    public ReclamoCambioDatos() {
        this.id = "RCD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.estado = "PENDIENTE";
        this.fechaCreacion = LocalDateTime.now().toString();
    }

    public ReclamoCambioDatos(Envio envio, String campoReclamado, String valorSolicitado, String motivo,
            String contacto) {
        this.id = "RCD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.envio = envio;
        this.campoReclamado = campoReclamado;
        this.valorSolicitado = valorSolicitado;
        this.motivo = motivo;
        this.contacto = contacto;
        this.estado = "PENDIENTE";
        this.fechaCreacion = LocalDateTime.now().toString();
    }

    public String getId() {
        return id;
    }

    public Envio getEnvio() {
        return envio;
    }

    public void setEnvio(Envio envio) {
        this.envio = envio;
    }

    public String getCampoReclamado() {
        return campoReclamado;
    }

    public void setCampoReclamado(String campoReclamado) {
        this.campoReclamado = campoReclamado;
    }

    public String getValorSolicitado() {
        return valorSolicitado;
    }

    public void setValorSolicitado(String valorSolicitado) {
        this.valorSolicitado = valorSolicitado;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public String getContacto() {
        return contacto;
    }

    public void setContacto(String contacto) {
        this.contacto = contacto;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(String fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }
}