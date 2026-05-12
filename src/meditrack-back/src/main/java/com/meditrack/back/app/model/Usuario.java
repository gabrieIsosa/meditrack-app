package com.meditrack.back.app.model;

import java.util.UUID;
import java.util.ArrayList;
import java.util.List;

public class Usuario {

    private String id;
    private String email;
    private String nombre;
    private String dni;
    private String password;
    private Role role;
    private boolean estadoActivo;
    private List<HistorialUsuario> historial = new ArrayList<>();

    public Usuario() {
        this.estadoActivo = true;
    }

    public Usuario(String email, String nombre, String dni, String password, Role role) {
        this.id = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.email = email;
        this.nombre = nombre;
        this.dni = dni;
        this.password = password;
        this.role = role;
        this.estadoActivo = true;
    }

    public String getId() { 
        return id; 
    }

    public void setId(String id) { 
        this.id = id; 
    }

    public String getEmail() { 
        return email; 
    }

    public void setEmail(String email) { 
        this.email = email; 
    }

    public String getDni() { 
        return dni; 
    }

    public void setDni(String dni) { 
        this.dni = dni; 
    }

    public String getNombre() { 
        return nombre; 
    }

    public void setNombre(String nombre) { 
        this.nombre = nombre; 
    }

    public String getPassword() { 
        return password; 
    }

    public void setPassword(String password) { 
        this.password = password; 
    }

    public Role getRole() { 
        return role; 
    }

    public void setRole(Role role) { 
        this.role = role; 
    }

    public boolean isEstadoActivo() { 
        return estadoActivo; 
    }

    public void setEstadoActivo(boolean estadoActivo) { 
        this.estadoActivo = estadoActivo; 
    }

    public List<HistorialUsuario> getHistorial() {
        return historial;
    }

    public void addHistorial(HistorialUsuario historial) {
        this.historial.add(historial);
    }
    
}
