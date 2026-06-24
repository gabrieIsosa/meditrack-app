package com.meditrack.back.app.model;

public enum EstadoEnvio {
    PENDIENTE,
    ASIGNADO,
    EN_PREPARACION,
    EN_TRANSITO,
    EN_PUNTO_DE_ENTREGA,
    ENTREGADO,
    INCIDENTE_REPORTADO,
    CANCELADO;

    public EstadoEnvio siguiente() {   
        if (this == CANCELADO){
            throw new IllegalStateException("El envío está cancelado");
        }
        if(this == ENTREGADO){
            throw new IllegalStateException("El envío ya fue entregado");
        }
        if(this == INCIDENTE_REPORTADO){
            throw new IllegalStateException("El envío tiene un incidente reportado");
        }

        EstadoEnvio[] valores = values();
        int siguiente = this.ordinal() + 1;
        
        if (valores[siguiente] == INCIDENTE_REPORTADO || valores[siguiente] == CANCELADO) {
            throw new IllegalStateException("No hay un estado siguiente disponible");
        }

        return valores[siguiente];
    }

    public boolean permiteCancelacion(){
        return this != ENTREGADO && this != CANCELADO;
    }
}
