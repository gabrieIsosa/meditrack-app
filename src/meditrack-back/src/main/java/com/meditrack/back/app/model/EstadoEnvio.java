package com.meditrack.back.app.model;

public enum EstadoEnvio {
    
    CREADO,
    EN_TRANSITO,
    EN_DEPOSITO,
    ENTREGADO;

    public EstadoEnvio siguiente() {
        EstadoEnvio[] valores = values();
        int siguiente = this.ordinal() + 1;
        if (siguiente >= valores.length) {
            throw new IllegalStateException("El envío ya está en su estado final: " + this);
        }

        return valores[siguiente];
    }

}
