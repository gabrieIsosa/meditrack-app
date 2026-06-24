package com.meditrack.back.app.service;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;

import org.springframework.stereotype.Service;

import com.meditrack.back.app.config.JwtUtil;
import com.meditrack.back.app.model.Sesion;
import com.meditrack.back.app.model.Usuario;
import com.meditrack.back.app.model.Role;
import com.meditrack.back.app.repository.UsuarioRepository;

@Service
public class AuthService {

    private final JwtUtil jwtUtil;
    private final UsuarioService usuarioService;
    private final UsuarioRepository usuarioRepository;

    private final Map<String, Map<String, Object>> resetCodes = new HashMap<>();
    private final Map<String, String> codigos2faActivos = new HashMap<>();

    public AuthService(JwtUtil jwtUtil, UsuarioService usuarioService, UsuarioRepository usuarioRepository) {
        this.jwtUtil = jwtUtil;
        this.usuarioService = usuarioService;
        this.usuarioRepository = usuarioRepository;
    }

    public Map<String, Object> login(String email, String password) {
        Usuario usuario = usuarioService.buscarPorEmail(email)
            .orElseThrow(() -> new RuntimeException("Credenciales inválidas"));

        if (!usuarioService.verificarPassword(password, usuario.getPassword())) {
            throw new RuntimeException("Credenciales inválidas");
        }

        if (!usuario.isEstadoActivo()) {
            throw new RuntimeException("Usuario inactivo. Contacte a un administrador.");
        }

        if (usuario.getRole() == Role.ADMINISTRADOR) {
            String codigo2fa = String.format("%06d", new Random().nextInt(999999));
            codigos2faActivos.put(usuario.getEmail(), codigo2fa);

            return Map.of(
                "require2fa", true,
                "email", usuario.getEmail(),
                "mockCode", codigo2fa
            );
        }

        String token = jwtUtil.generarToken(usuario.getId(), usuario.getEmail(), usuario.getNombre(), usuario.getRole());

        return Map.of(
            "require2fa", false,
            "token",  token,
            "id",     usuario.getId(),
            "email",  usuario.getEmail(),
            "nombre", usuario.getNombre(),
            "role",   usuario.getRole().name(),
            "estaBloqueado", usuario.isBloqueoActivo(),
            "fechaBloqueo", usuario.getFechaBloqueo() != null ? usuario.getFechaBloqueo().toString() : ""
        );
    }

    public Map<String, Object> verificar2fa(String email, String codigo) {
        String codigoGuardado = codigos2faActivos.get(email);

        if (codigoGuardado == null || !codigoGuardado.equals(codigo)) {
            throw new RuntimeException("Código de seguridad incorrecto o expirado");
        }

        codigos2faActivos.remove(email);

        Usuario usuario = usuarioService.buscarPorEmail(email)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        String token = jwtUtil.generarToken(usuario.getId(), usuario.getEmail(), usuario.getNombre(), usuario.getRole());

        return Map.of(
            "require2fa", false,
            "token",  token,
            "id",     usuario.getId(),
            "email",  usuario.getEmail(),
            "nombre", usuario.getNombre(),
            "role",   usuario.getRole().name(),
            "estaBloqueado", usuario.isBloqueoActivo(),
            "fechaBloqueo", usuario.getFechaBloqueo() != null ? usuario.getFechaBloqueo().toString() : ""
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

        usuario.setPassword(usuarioService.hashearPassword(nuevaPassword));
        usuarioRepository.save(usuario);

        resetCodes.remove(email);

        System.out.println("[TRAZABILIDAD] Contraseña reseteada para: " + email);
    }

}
