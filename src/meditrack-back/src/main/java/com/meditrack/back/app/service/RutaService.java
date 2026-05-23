package com.meditrack.back.app.service;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.meditrack.back.app.model.Envio;
import com.meditrack.back.app.model.EstadoEnvio;
import com.meditrack.back.app.model.EstadoRuta;
import com.meditrack.back.app.model.Ruta;
import com.meditrack.back.app.model.RutaEnvio;
import com.meditrack.back.app.model.Usuario;
import com.meditrack.back.app.repository.EnvioRepository;
import com.meditrack.back.app.repository.RutaEnvioRepository;
import com.meditrack.back.app.repository.RutaRepository;
import com.meditrack.back.app.repository.UsuarioRepository;

@Service
public class RutaService {

    private final RutaRepository rutaRepository;
    private final EnvioRepository envioRepository;
    private final UsuarioRepository usuarioRepository;
    private final RutaEnvioRepository rutaEnvioRepository;
    private final EnvioService envioService;

    public RutaService(RutaRepository rutaRepository, EnvioRepository envioRepository,
                       UsuarioRepository usuarioRepository, RutaEnvioRepository rutaEnvioRepository,
                       EnvioService envioService) {
        this.rutaRepository = rutaRepository;
        this.envioRepository = envioRepository;
        this.usuarioRepository = usuarioRepository;
        this.rutaEnvioRepository = rutaEnvioRepository;
        this.envioService = envioService;
    }

    public List<Ruta> listarTodos() {
        return rutaRepository.findAll();
    }

    public Ruta buscarPorId(String id) {
        return rutaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ruta no encontrada"));
    }

    @Transactional
    public Ruta crear(Map<String, Object> datos, String usuario) {
        String fecha = (String) datos.get("fecha");
        String repartidorId = (String) datos.get("repartidorId");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> enviosData = (List<Map<String, Object>>) datos.get("envios");

        if (enviosData == null || enviosData.isEmpty()) {
            throw new IllegalArgumentException("La ruta debe contener al menos un envío");
        }

        if (fecha == null || fecha.isBlank()) {
            throw new IllegalArgumentException("La fecha de la ruta es obligatoria");
        }

        Usuario repartidor = usuarioRepository.findById(repartidorId)
                .orElseThrow(() -> new IllegalArgumentException("Repartidor no encontrado"));

        if (!repartidor.isEstadoActivo()) {
            throw new IllegalArgumentException("El repartidor no está activo");
        }

        if (repartidor.isHaciendoEntrega()) {
            throw new IllegalArgumentException("El repartidor ya tiene una entrega activa");
        }

        for (Map<String, Object> envioData : enviosData) {
            String envioId = (String) envioData.get("envioId");

            Envio envio = envioRepository.findById(envioId)
                    .orElseThrow(() -> new IllegalArgumentException("Envío no encontrado: " + envioId));

            if (envio.getEstado() != EstadoEnvio.PENDIENTE) {
                throw new IllegalArgumentException("El envío " + envioId + " no está en estado PENDIENTE");
            }

            if (rutaEnvioRepository.existsByEnvio_Id(envioId)) {
                throw new IllegalArgumentException("El envío " + envioId + " ya pertenece a otra ruta");
            }
        }

        Ruta ruta = new Ruta(fecha, repartidorId, usuario);
        rutaRepository.save(ruta);

        for (Map<String, Object> envioData : enviosData) {
            String envioId = (String) envioData.get("envioId");
            int orden = ((Number) envioData.get("orden")).intValue();

            Envio envio = envioRepository.findById(envioId).get();
            ruta.agregarEnvio(new RutaEnvio(envio, orden));

            envioService.actualizarEstado(envioId, EstadoEnvio.ASIGNADO, usuario, repartidorId, null, null);
        }

        repartidor.setHaciendoEntrega(true);
        usuarioRepository.save(repartidor);

        return rutaRepository.save(ruta);
    }

    @Transactional
    public Ruta finalizar(String id, String usuario) {
        Ruta ruta = buscarPorId(id);

        if (ruta.getEstado() == EstadoRuta.COMPLETADA) {
            throw new IllegalArgumentException("La ruta ya está completada");
        }

        ruta.setEstado(EstadoRuta.COMPLETADA);

        Usuario repartidor = usuarioRepository.findById(ruta.getRepartidorId())
                .orElseThrow(() -> new IllegalArgumentException("Repartidor no encontrado"));

        repartidor.setHaciendoEntrega(false);
        usuarioRepository.save(repartidor);

        return rutaRepository.save(ruta);
    }
    
}
