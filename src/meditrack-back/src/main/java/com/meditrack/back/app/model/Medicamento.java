package com.meditrack.back.app.model;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "medicamentos")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Medicamento {
    @Id
    private String id;

    @Column(nullable = false)
    private String nombre;

    @Column(length = 1000)
    private String descripcion;

    @Column(nullable = false)
    private String presentacion;

    @Column(nullable = false)
    private int cantidad;

    @Column(nullable = false)
    private String unidadMedida;

    @Column(nullable = false)
    private String laboratorio;

    @Column(nullable = false)
    private String monodroga;

    @Column(name = "estado_activo")
    private boolean estadoActivo = true;

    @Column(name = "cadena_frio")
    private boolean cadenaFrio = false;

    @Column(name = "imagen_url")
    private String imagenUrl;

    @Column(name = "volumen_cm3")
    private Integer volumenCm3 = 0;

    @Column(name = "peso_gramos")
    private Integer pesoGramos = 0;

    public Medicamento(String nombre, String descripcion, String presentacion, int cantidad, String unidadMedida,
            String laboratorio, String monodroga, boolean cadenaFrio, String imagenUrl) {
        this.descripcion = descripcion;
        this.nombre = nombre;
        this.presentacion = presentacion;
        this.unidadMedida = unidadMedida;
        this.cantidad = cantidad;
        this.estadoActivo = true;
        this.laboratorio = laboratorio;
        this.monodroga = monodroga;
        this.cadenaFrio = cadenaFrio;
        this.imagenUrl = imagenUrl;
    }

    public Medicamento() {
        this.estadoActivo = true;
    }

    @PrePersist
    public void generarId() {
        if (this.id == null) {
            this.id = "MED-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getPresentacion() {
        return presentacion;
    }

    public void setPresentacion(String presentacion) {
        this.presentacion = presentacion;
    }

    public String getUnidadMedida() {
        return unidadMedida;
    }

    public void setUnidadMedida(String unidadMedida) {
        this.unidadMedida = unidadMedida;
    }

    public boolean isEstadoActivo() {
        return estadoActivo;
    }

    public void setEstadoActivo(boolean estadoActivo) {
        this.estadoActivo = estadoActivo;
    }

    public boolean isCadenaFrio() {
        return cadenaFrio;
    }

    public void setCadenaFrio(boolean cadenaFrio) {
        this.cadenaFrio = cadenaFrio;
    }

    public void setCantidad(int cantidad){
        this.cantidad = cantidad;
    }

    public int getCantidad(){
        return this.cantidad;
    }

    public void setLaboratorio(String laboratorio) {
        this.laboratorio = laboratorio;
    }
    
    public String getLaboratorio(){
        return this.laboratorio;
    }

    public void setMonodroga(String monodroga) {
        this.monodroga = monodroga;
    }

    public String getMonodroga() {
        return this.monodroga;
    }

    public String getImagenUrl() {
        return imagenUrl;
    }

    public void setImagenUrl(String imagenUrl) {
        this.imagenUrl = imagenUrl;
    }

    public Integer getVolumenCm3() {
        return volumenCm3;
    }

    public void setVolumenCm3(Integer volumenCm3) {
        this.volumenCm3 = volumenCm3;
    }

    public Integer getPesoGramos() {
        return pesoGramos;
    }

    public void setPesoGramos(Integer pesoGramos) {
        this.pesoGramos = pesoGramos;
    }

}
