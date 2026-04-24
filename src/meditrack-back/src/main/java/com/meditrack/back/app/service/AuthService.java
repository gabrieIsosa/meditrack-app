package com.meditrack.back.app.service;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.meditrack.back.app.config.JwtUtil;
import com.meditrack.back.app.model.Role;
import com.meditrack.back.app.model.Sesion;
import com.meditrack.back.app.model.Usuario;

@Service
public class AuthService {

    private final JwtUtil jwtUtil;

    private final List<Usuario> usuarios = List.of(
        new Usuario("supervisor@meditrack.com", "Admin MediTrack", "1234", Role.SUPERVISOR),
        new Usuario("operador@meditrack.com",   "Carlos Ruiz",     "1234", Role.OPERADOR),
        new Usuario("repartidor@meditrack.com", "Diego Torres",    "1234", Role.REPARTIDOR)
    );

    public AuthService(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    public Map<String, String> login(String email, String password) {
        Usuario usuario = usuarios.stream()
            .filter(u -> u.getEmail().equals(email) && u.getPassword().equals(password))
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Credenciales inválidas"));

        String token = jwtUtil.generarToken(usuario.getEmail(), usuario.getNombre(), usuario.getRole());

        return Map.of(
            "token",  token,
            "email",  usuario.getEmail(),
            "nombre", usuario.getNombre(),
            "role",   usuario.getRole().name()
        );
    }

    public Sesion validar(String token) {
        return jwtUtil.validar(token);
    }

}
