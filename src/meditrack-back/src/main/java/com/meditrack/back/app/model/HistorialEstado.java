package com.meditrack.back.app.model;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "historial_estados")
public class HistorialEstado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tipo;
    
    @Enumerated(EnumType.STRING)
    private EstadoEnvio estado;
    
    private String detalle;
    private String fecha;
    private String hora;
    private String usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "envio_id", nullable = false)
    @JsonIgnoreProperties("historial")
    private Envio envio;

    public HistorialEstado() {}

    public HistorialEstado(String tipo, EstadoEnvio estado, String detalle, String fecha, String hora, String usuario) {
        this.tipo = tipo;
        this.estado = estado;
        this.detalle = detalle;
        this.fecha = fecha;
        this.hora = hora;
        this.usuario = usuario;
    }

    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }

    public String getTipo() { 
        return tipo; 
    }

    public void setTipo(String tipo) { 
        this.tipo = tipo; 
    }

    public EstadoEnvio getEstado() { 
        return estado; 
    }

    public void setEstado(EstadoEnvio estado) { 
        this.estado = estado; 
    }

    public String getDetalle() { 
        return detalle; 
    }

    public void setDetalle(String detalle) { 
        this.detalle = detalle; 
    }

    public String getFecha() { 
        return fecha; 
    }

    public void setFecha(String fecha) { 
        this.fecha = fecha; 
    }

    public String getHora() { 
        return hora; 
    }

    public void setHora(String hora) { 
        this.hora = hora; 
    }

    public String getUsuario() { 
        return usuario; 
    }

    public void setUsuario(String usuario) { 
        this.usuario = usuario; 
    }

    public Envio getEnvio() {
        return envio;
    }

    public void setEnvio(Envio envio) {
        this.envio = envio;
    }

}
