package com.meditrack.back.app.model;

public class Usuario {

    private String email;
    private String nombre;
    private String password;
    private Role role;

    public Usuario(String email, String nombre, String password, Role role) {
        this.email = email;
        this.nombre = nombre;
        this.password = password;
        this.role = role;
    }

    public String getEmail() {
        return email;
    }

    public String getNombre() {
        return nombre;
    }

    public String getPassword() {
        return password;
    }

    public Role getRole() {
        return role;
    }

}
