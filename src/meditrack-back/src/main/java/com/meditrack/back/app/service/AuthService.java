package com.meditrack.back.app.service;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;

import org.springframework.stereotype.Service;

import com.meditrack.back.app.config.JwtUtil;
import com.meditrack.back.app.model.Sesion;
import com.meditrack.back.app.model.Usuario;

@Service
public class AuthService {

    private final JwtUtil jwtUtil;
    private final UsuarioService usuarioService;
    private final Map<String, Map<String, Object>> resetCodes = new HashMap<>();

    public AuthService(JwtUtil jwtUtil, UsuarioService usuarioService) {
        this.jwtUtil = jwtUtil;
        this.usuarioService = usuarioService;
    }

    public Map<String, String> login(String email, String password) {
        Usuario usuario = usuarioService.buscarPorEmail(email)
            .orElseThrow(() -> new RuntimeException("Credenciales inválidas"));
            
        if (!usuario.getPassword().equals(password)) {
            throw new RuntimeException("Credenciales inválidas");
        }
        
        if (!usuario.isEstadoActivo()) {
            throw new RuntimeException("Usuario inactivo. Contacte a un administrador.");
        }
        
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

    public Map<String, String> solicitarReset(String email) {
        boolean existe = usuarioService.buscarPorEmail(email).isPresent();
        
        if (!existe) {
            throw new RuntimeException("El correo no se encuentra registrado en la base de datos");
        }

        String codigo = String.format("%06d", new Random().nextInt(999999));
        long expira = System.currentTimeMillis() + 30 * 60 * 1000;

        resetCodes.put(email, Map.of("code", codigo, "expiresAt", expira));

        System.out.println("[MOCK EMAIL] Codigo para " + email + ": " + codigo);
        
        return Map.of(
            "mensaje", "Codigo enviado (mock)",
            "codigo", codigo
        );
    }

    public void verificarCodigo(String email, String codigo) {
        Map<String, Object> datos = resetCodes.get(email);

        if (datos == null) {
            throw new RuntimeException("No hay una solicitud de reset para este correo");
        }

        long expira = (long) datos.get("expiresAt");
        
        if (System.currentTimeMillis() > expira) {
            resetCodes.remove(email);
            throw new RuntimeException("El codigo ha expirado");
        }

        if (!datos.get("code").equals(codigo)) {
            throw new RuntimeException("Codigo incorrecto");
        }
    }

    public void resetearPassword(String email, String codigo, String nuevaPassword) {
        verificarCodigo(email, codigo);

        Usuario usuario = usuarioService.buscarPorEmail(email)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        usuario.setPassword(nuevaPassword);
        resetCodes.remove(email);
        
        System.out.println("[TRAZABILIDAD] Contrasena reseteada para: " + email);
    }
}