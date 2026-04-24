package com.meditrack.back.app.model;

public class HistorialEstado {

    private EstadoEnvio estado;
    private String fecha;
    private String hora;
    private String usuario;

    public HistorialEstado(EstadoEnvio estado, String fecha, String hora, String usuario) {
        this.estado = estado;
        this.fecha = fecha;
        this.hora = hora;
        this.usuario = usuario;
    }

    public EstadoEnvio getEstado() {
        return estado;
    }

    public String getFecha() {
        return fecha;
    }

    public String getHora() {
        return hora;
    }

    public String getUsuario() {
        return usuario;
    }
    
}
