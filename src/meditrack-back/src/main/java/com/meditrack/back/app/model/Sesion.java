package com.meditrack.back.app.model;

public class Sesion {

    private String email;
    private String nombre;
    private Role role;

    public Sesion(String email, String nombre, Role role) {
        this.email = email;
        this.nombre = nombre;
        this.role = role;
    }

    public String getEmail() {
        return email;
    }

    public String getNombre() {
        return nombre;
    }

    public Role getRole() {
        return role;
    }

}
