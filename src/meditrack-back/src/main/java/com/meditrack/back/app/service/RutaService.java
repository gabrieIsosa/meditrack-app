package com.meditrack.back.app.service;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.meditrack.back.app.model.Envio;
import com.meditrack.back.app.model.EstadoEnvio;
import com.meditrack.back.app.model.EstadoOperativo;
import com.meditrack.back.app.model.EstadoRuta;
import com.meditrack.back.app.model.Ruta;
import com.meditrack.back.app.model.RutaEnvio;
import com.meditrack.back.app.model.Transporte;
import com.meditrack.back.app.model.Usuario;
import com.meditrack.back.app.repository.EnvioRepository;
import com.meditrack.back.app.repository.RutaEnvioRepository;
import com.meditrack.back.app.repository.RutaRepository;
import com.meditrack.back.app.repository.TransporteRepository;
import com.meditrack.back.app.repository.UsuarioRepository;


@Service
public class RutaService {

    private final RutaRepository rutaRepository;
    private final EnvioRepository envioRepository;
    private final UsuarioRepository usuarioRepository;
    private final RutaEnvioRepository rutaEnvioRepository;
    private final EnvioService envioService;
    private final TransporteRepository transporteRepository;

    public RutaService(RutaRepository rutaRepository, EnvioRepository envioRepository,
            UsuarioRepository usuarioRepository, RutaEnvioRepository rutaEnvioRepository,
            EnvioService envioService, TransporteRepository transporteRepository) {
        this.rutaRepository = rutaRepository;
        this.envioRepository = envioRepository;
        this.usuarioRepository = usuarioRepository;
        this.rutaEnvioRepository = rutaEnvioRepository;
        this.envioService = envioService;
        this.transporteRepository = transporteRepository;
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
        
        Long transporteId = datos.get("transporteId") != null
            ? Long.valueOf(datos.get("transporteId").toString())
            : null;
            
        if (rutaRepository.existsByTransporteIdAndFechaAndEstadoNot(transporteId, fecha, EstadoRuta.COMPLETADA)) {
            throw new IllegalArgumentException("El transporte ya tiene una ruta asignada para el día: " + fecha);
        }

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

        if (transporteId == null) {
            throw new IllegalArgumentException("El transporte es obligatorio");
        }

        Transporte transporte = transporteRepository.findById(transporteId)
                .orElseThrow(() -> new IllegalArgumentException("Transporte no encontrado"));

        if (transporte.getEstadoOperativo() != EstadoOperativo.ACTIVO) {
            throw new IllegalArgumentException("El transporte no está activo");
        }

        if (rutaRepository.existsByRepartidorIdAndFechaAndEstadoNot(repartidorId, fecha, EstadoRuta.COMPLETADA)) {
            throw new IllegalArgumentException("El repartidor ya tiene una ruta asignada para el día: " + fecha);
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

        Ruta ruta = new Ruta(fecha, repartidorId, transporteId, usuario);
        rutaRepository.save(ruta);

        for (Map<String, Object> envioData : enviosData) {
            String envioId = (String) envioData.get("envioId");

            int retiroOrden = 0;
            int entregaOrden = 0;
            if (envioData.containsKey("retiroOrden")) {
                retiroOrden = ((Number) envioData.get("retiroOrden")).intValue();
            } else if (envioData.containsKey("orden")) {
                retiroOrden = ((Number) envioData.get("orden")).intValue();
            }

            if (envioData.containsKey("entregaOrden")) {
                entregaOrden = ((Number) envioData.get("entregaOrden")).intValue();
            } else if (envioData.containsKey("orden")) {
                entregaOrden = ((Number) envioData.get("orden")).intValue();
            }

            Envio envio = envioRepository.findById(envioId).get();
            ruta.agregarEnvio(new RutaEnvio(envio, retiroOrden, entregaOrden));

            envioService.actualizarEstado(envioId, EstadoEnvio.ASIGNADO, usuario, repartidorId, null, null);
        }

        java.time.LocalDate hoy = java.time.LocalDate.now();
        if (fecha.equals(hoy.toString())) {
            repartidor.setHaciendoEntrega(true);
            usuarioRepository.save(repartidor);
        }

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
