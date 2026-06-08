package com.meditrack.back.app.model;

public class ReclamoCambioDatosRequest {

    private String trackingId;
    private String campoReclamado;
    private String valorSolicitado;
    private String motivo;
    private String contacto;

    public ReclamoCambioDatosRequest() {
    }

    public String getTrackingId() {
        return trackingId;
    }

    public void setTrackingId(String trackingId) {
        this.trackingId = trackingId;
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
}