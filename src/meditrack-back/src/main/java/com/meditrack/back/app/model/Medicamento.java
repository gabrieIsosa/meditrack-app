package com.meditrack.back.app.model;

import java.util.UUID;

public class Medicamento {
    private String id;
    private String descripcion;
    private String nombre;
    private String presentacion;
    private int stock;
    private String unidadMedida;
    private String laboratorio;
    private String principioActivo;
    private boolean estadoActivo;
    private boolean cadenaFrio;
    private String imagenUrl;

    public Medicamento(String nombre, String descripcion, String presentacion, int stock, String unidadMedida,
            String laboratorio, String principioActivo, boolean cadenaFrio, String imagenUrl) {
        this.id = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.descripcion = descripcion;
        this.nombre = nombre;
        this.presentacion = presentacion;
        this.unidadMedida = unidadMedida;
        this.stock = stock;
        this.estadoActivo = true;
        this.laboratorio = laboratorio;
        this.principioActivo = principioActivo;
        this.cadenaFrio = cadenaFrio;
        this.imagenUrl = imagenUrl;
    }

    public Medicamento() {
        this.id = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.estadoActivo = true;
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

    public void setStock(int stock){
        this.stock = stock;
    }

    public int getStock(){
        return this.stock;
    }

    public void setLaboratorio(String laboratorio) {
        this.laboratorio = laboratorio;
    }
    
    public String getLaboratorio(){
        return this.laboratorio;
    }

    public void setPrincipioActivo(String principio) {
        this.principioActivo = principio;
    }

    public String getPrincipioActivo() {
        return this.principioActivo;
    }

    public String getImagenUrl() {
        return imagenUrl;
    }

    public void setImagenUrl(String imagenUrl) {
        this.imagenUrl = imagenUrl;
    }

}
