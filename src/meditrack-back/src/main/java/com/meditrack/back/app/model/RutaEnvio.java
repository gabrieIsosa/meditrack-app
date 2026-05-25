package com.meditrack.back.app.model;

import jakarta.persistence.*;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "ruta_envios", uniqueConstraints = @UniqueConstraint(columnNames = "envio_id"))
public class RutaEnvio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ruta_id", nullable = false)
    @JsonIgnore
    private Ruta ruta;

    @ManyToOne
    @JoinColumn(name = "envio_id", nullable = false)
    private Envio envio;

    @Column(name = "retiro_orden", nullable = true)
    private Integer retiroOrden;

    @Column(name = "entrega_orden", nullable = true)
    private Integer entregaOrden;

    @Column(name = "orden", nullable = true)
    private Integer orden;

    public RutaEnvio() {}

    public RutaEnvio(Envio envio, int orden) {
        this.envio = envio;
        this.orden = orden;
        this.retiroOrden = orden;
        this.entregaOrden = orden;
    }

    public RutaEnvio(Envio envio, int retiroOrden, int entregaOrden) {
        this.envio = envio;
        this.retiroOrden = retiroOrden;
        this.entregaOrden = entregaOrden;
        this.orden = entregaOrden;
    }

    public int getRetiroOrden() {
        return retiroOrden != null ? retiroOrden : (orden != null ? orden : 0);
    }

    public void setRetiroOrden(Integer retiroOrden) {
        this.retiroOrden = retiroOrden;
    }

    public int getEntregaOrden() {
        return entregaOrden != null ? entregaOrden : (orden != null ? orden : 0);
    }

    public void setEntregaOrden(Integer entregaOrden) {
        this.entregaOrden = entregaOrden;
    }

    public Integer getOrden() {
        return orden != null ? orden : getEntregaOrden();
    }

    public void setOrden(Integer orden) {
        this.orden = orden;
        this.retiroOrden = orden;
        this.entregaOrden = orden;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Ruta getRuta() {
        return ruta;
    }

    public void setRuta(Ruta ruta) {
        this.ruta = ruta;
    }

    public Envio getEnvio() {
        return envio;
    }

    public void setEnvio(Envio envio) {
        this.envio = envio;
    }
    
}
