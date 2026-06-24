package com.meditrack.back.app.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.meditrack.back.app.model.Role;
import com.meditrack.back.app.model.Usuario;
import com.meditrack.back.app.model.HistorialUsuario;
import com.meditrack.back.app.repository.UsuarioRepository;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final NotificacionService notificacionService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UsuarioService(UsuarioRepository usuarioRepository, NotificacionService notificacionService) {
        this.usuarioRepository = usuarioRepository;
        this.notificacionService = notificacionService;
    }

    public List<Usuario> listarTodos() {
        return usuarioRepository.findAll();
    }

    public boolean tienePermisoSobreRol(Role rolUsuarioLogueado, Role rolObjetivo) {
        if (rolUsuarioLogueado == Role.ADMINISTRADOR) {
            return rolObjetivo == Role.SUPERVISOR || rolObjetivo == Role.OPERADOR || rolObjetivo == Role.REPARTIDOR;
        }
        if (rolUsuarioLogueado == Role.SUPERVISOR) {
            return rolObjetivo == Role.OPERADOR || rolObjetivo == Role.REPARTIDOR;
        }
        if (rolUsuarioLogueado == Role.OPERADOR) {
            return rolObjetivo == Role.REPARTIDOR;
        }
        return false;
    }

    public Usuario crear(Map<String, String> datos, Usuario autorDelCambio) {
        Role rolNuevoUsuario = Role.valueOf(datos.get("role"));

        if (!tienePermisoSobreRol(autorDelCambio.getRole(), rolNuevoUsuario)) {
            throw new RuntimeException("Tu rol no tiene permisos para crear un " + rolNuevoUsuario);
        }

        if (usuarioRepository.existsByEmail(datos.get("email"))) {
            throw new RuntimeException("El email ya está registrado");
        }

        if (usuarioRepository.existsByDni(datos.get("dni"))) {
            throw new RuntimeException("El DNI ya está registrado");
        }

        String passwordHasheada = passwordEncoder.encode(datos.get("password"));

        Usuario nuevo = new Usuario(
            datos.get("email"),
            datos.get("nombre"),
            datos.get("dni"),
            passwordHasheada,
            rolNuevoUsuario
        );

        agregarHistorial(nuevo, "Creación", "-", "-", LocalDateTime.now().toString(), autorDelCambio);

        Usuario saved = usuarioRepository.save(nuevo);

        try {
            notificacionService.crearNotificacion(
                saved,
                "Registro Confirmado",
                "Se ha confirmado tu registro en el sistema por el administrador " + autorDelCambio.getNombre() + " (" + autorDelCambio.getRole() + ")."
            );
        } catch (Exception e) {
            System.err.println("Error al enviar notificación de confirmación de registro: " + e.getMessage());
        }

        return saved;
    }

    public Usuario actualizar(String id, Map<String, String> datos, Usuario autorDelCambio) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Role rolObjetivo = datos.containsKey("role") ? Role.valueOf(datos.get("role")) : usuario.getRole();

        if (!tienePermisoSobreRol(autorDelCambio.getRole(), rolObjetivo)) {
            throw new RuntimeException("No tienes jerarquía suficiente para modificar o asignar este rol.");
        }

        String fechaModificacion = LocalDateTime.now().toString();

        if (datos.containsKey("nombre") && !usuario.getNombre().equals(datos.get("nombre"))) {
            agregarHistorial(usuario, "Nombre", usuario.getNombre(), datos.get("nombre"), fechaModificacion, autorDelCambio);
            usuario.setNombre(datos.get("nombre"));
        }

        if (datos.containsKey("email") && !usuario.getEmail().equals(datos.get("email"))) {
            if (usuarioRepository.existsByEmail(datos.get("email"))) {
                throw new RuntimeException("El email ya está registrado en otra cuenta");
            }
            agregarHistorial(usuario, "Email", usuario.getEmail(), datos.get("email"), fechaModificacion, autorDelCambio);
            usuario.setEmail(datos.get("email"));
        }

        if (datos.containsKey("dni") && !usuario.getDni().equals(datos.get("dni"))) {
            if (usuarioRepository.existsByDni(datos.get("dni"))) {
                throw new RuntimeException("El DNI ya está registrado en otra cuenta");
            }
            agregarHistorial(usuario, "DNI", usuario.getDni(), datos.get("dni"), fechaModificacion, autorDelCambio);
            usuario.setDni(datos.get("dni"));
        }

        if (datos.containsKey("role") && usuario.getRole() != rolObjetivo) {
            agregarHistorial(usuario, "Role", usuario.getRole().toString(), rolObjetivo.toString(), fechaModificacion, autorDelCambio);
            usuario.setRole(rolObjetivo);
        }

        if (datos.containsKey("password") && !datos.get("password").trim().isEmpty()) {
            // Verificamos que la nueva password no sea igual a la actual (comparación BCrypt)
            if (!passwordEncoder.matches(datos.get("password"), usuario.getPassword())) {
                // En auditoría nunca se registra el valor real de la password
                agregarHistorial(usuario, "Password", "[protegida]", "[protegida]", fechaModificacion, autorDelCambio);
                usuario.setPassword(passwordEncoder.encode(datos.get("password")));
            }
        }

        Usuario saved = usuarioRepository.save(usuario);

        try {
            notificacionService.crearNotificacion(
                saved,
                "Datos de Usuario Modificados",
                "Tus datos personales o rol en la plataforma fueron modificados. Administrador responsable: " + autorDelCambio.getNombre() + "."
            );
        } catch (Exception e) {
            System.err.println("Error al enviar notificación de actualización de usuario: " + e.getMessage());
        }

        return saved;
    }

    public Usuario toggleEstado(String id, Usuario autorDelCambio) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (!tienePermisoSobreRol(autorDelCambio.getRole(), usuario.getRole())) {
            throw new RuntimeException("No tienes permiso para desactivar a este usuario.");
        }

        String estadoAnterior = usuario.isEstadoActivo() ? "Activo" : "Inactivo";
        usuario.setEstadoActivo(!usuario.isEstadoActivo());
        String estadoActual = usuario.isEstadoActivo() ? "Activo" : "Inactivo";

        agregarHistorial(usuario, "Estado", estadoAnterior, estadoActual, LocalDateTime.now().toString(), autorDelCambio);

        return usuarioRepository.save(usuario);
    }

    public Optional<Usuario> buscarPorEmail(String email) {
        return usuarioRepository.findByEmail(email);
    }

    public Optional<Usuario> buscarPorDni(String dni) {
        return usuarioRepository.findByDni(dni);
    }

    public String hashearPassword(String password) {
        return passwordEncoder.encode(password);
    }

    public boolean verificarPassword(String rawPassword, String hashedPassword) {
        return passwordEncoder.matches(rawPassword, hashedPassword);
    }

    public Usuario bloquearUsuario(String id, Usuario autorDelCambio) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // El usuario se puede bloquear a sí mismo (cuando falla el test),
        // o un supervisor/admin con mayor jerarquía puede bloquearlo
        if (!usuario.getId().equals(autorDelCambio.getId()) && !tienePermisoSobreRol(autorDelCambio.getRole(), usuario.getRole())) {
            throw new RuntimeException("No tienes permisos para bloquear a este usuario.");
        }

        usuario.setEstaBloqueado(true);
        usuario.setFechaBloqueo(LocalDateTime.now());
        agregarHistorial(usuario, "Bloqueo por fatiga", "No bloqueado", "Bloqueado por 6hs", LocalDateTime.now().toString(), autorDelCambio);
        return usuarioRepository.save(usuario);
    }

    public Usuario desbloquearUsuario(String id, Usuario autorDelCambio) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Solo supervisores o administradores pueden desbloquear
        if (autorDelCambio.getRole() != Role.SUPERVISOR && autorDelCambio.getRole() != Role.ADMINISTRADOR) {
            throw new RuntimeException("No tienes permisos para desbloquear a este usuario.");
        }

        usuario.setEstaBloqueado(false);
        usuario.setFechaBloqueo(null);
        agregarHistorial(usuario, "Desbloqueo manual", "Bloqueado", "Desbloqueado", LocalDateTime.now().toString(), autorDelCambio);
        return usuarioRepository.save(usuario);
    }

    private void agregarHistorial(Usuario usuario, String campo, String valorAnterior, String valorNuevo, String fecha, Usuario autorDelCambio) {
        HistorialUsuario h = new HistorialUsuario(campo, valorAnterior, valorNuevo, fecha, autorDelCambio);
        h.setUsuario(usuario);
        usuario.addHistorial(h);
    }
    
}
