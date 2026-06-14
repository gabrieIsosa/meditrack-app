package com.meditrack.back.app.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.*;

@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    private String id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String nombre;

    @Column(unique = true, nullable = false)
    private String dni;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(name = "estado_activo", nullable = false)
    private boolean estadoActivo = true;

    @Column(name = "esta_bloqueado", nullable = false)
    private boolean estaBloqueado = false;

    @Column(name = "fecha_bloqueo")
    private LocalDateTime fechaBloqueo;

    @Column(name = "haciendo_entrega", nullable = false)
    private boolean haciendoEntrega = false;

    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<HistorialUsuario> historial = new ArrayList<>();

    public Usuario() {
        this.estadoActivo = true;
        this.estaBloqueado = false;
        this.haciendoEntrega = false;
    }

    public Usuario(String email, String nombre, String dni, String password, Role role) {
        this.id = "USR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.email = email;
        this.nombre = nombre;
        this.dni = dni;
        this.password = password;
        this.role = role;
        this.estadoActivo = true;
        this.estaBloqueado = false;
        this.haciendoEntrega = false;
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

    public boolean isEstaBloqueado() { 
        return estaBloqueado; 
    }

    public void setEstaBloqueado(boolean estaBloqueado) { 
        this.estaBloqueado = estaBloqueado; 
    }

    public boolean isHaciendoEntrega() { 
        return haciendoEntrega; 
    }

    public void setHaciendoEntrega(boolean haciendoEntrega) { 
        this.haciendoEntrega = haciendoEntrega; 
    }

    public List<HistorialUsuario> getHistorial() {
        return historial;
    }

    public void addHistorial(HistorialUsuario historial) {
        this.historial.add(historial);
    }

    public LocalDateTime getFechaBloqueo() {
        return fechaBloqueo;
    }

    public void setFechaBloqueo(LocalDateTime fechaBloqueo) {
        this.fechaBloqueo = fechaBloqueo;
    }

    public boolean isBloqueoActivo() {
        if (!estaBloqueado) {
            return false;
        }
        if (fechaBloqueo == null) {
            return true;
        }
        return LocalDateTime.now().isBefore(fechaBloqueo.plusHours(6));
    }

}
