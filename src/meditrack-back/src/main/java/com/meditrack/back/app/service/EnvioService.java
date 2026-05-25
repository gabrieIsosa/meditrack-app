package com.meditrack.back.app.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.meditrack.back.app.model.DetalleEnvio;
import com.meditrack.back.app.model.Envio;
import com.meditrack.back.app.model.EstadoEnvio;
import com.meditrack.back.app.model.HistorialEstado;
import com.meditrack.back.app.model.Incidente;
import com.meditrack.back.app.model.Medicamento;
import com.meditrack.back.app.model.TrackingPublicoDTO;
import com.meditrack.back.app.repository.EnvioRepository;
import com.meditrack.back.app.repository.MedicamentoRepository;

@Service
public class EnvioService {

    private final EnvioRepository envioRepository;
    private final MedicamentoRepository medicamentoRepository;

    public EnvioService(EnvioRepository envioRepository, MedicamentoRepository medicamentoRepository) {
        this.envioRepository = envioRepository;
        this.medicamentoRepository = medicamentoRepository;
    }

    private void registrarHistorial(Envio e, String tipo, EstadoEnvio estado, String detalle, String f, String h, String u) {
        HistorialEstado evento = new HistorialEstado();
        evento.setTipo(tipo);
        evento.setEstado(estado);
        evento.setDetalle(detalle);
        evento.setFecha(f);
        evento.setHora(h);
        evento.setUsuario(u);
        e.agregarHistorial(evento);
    }

    public List<Envio> listarTodos() {
        return envioRepository.findAll();
    }

    public Envio buscarPorId(String id) {
        return envioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Envío no encontrado"));
    }

    @Transactional
    public Envio crear(Envio nuevo, String usuario) {
        nuevo.setId(UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        nuevo.setEstado(EstadoEnvio.PENDIENTE);
        nuevo.setUsuarioResponsable(usuario);
        nuevo.setFechaCreacion(LocalDate.now().toString());
        nuevo.setHoraCreacion(LocalTime.now().toString().substring(0, 5));
        nuevo.setLatitudOrigen(nuevo.getLatitudOrigen());
        nuevo.setLongitudOrigen(nuevo.getLongitudOrigen());
        nuevo.setLatitudDestino(nuevo.getLatitudDestino());
        nuevo.setLongitudDestino(nuevo.getLongitudDestino());

        if (nuevo.getDetalles() != null) {
            for (DetalleEnvio detalle : nuevo.getDetalles()) {
                detalle.setEnvio(nuevo); 
                
                if (detalle.getMedicamento() != null && detalle.getMedicamento().getId() != null) {
                    Medicamento medReal = medicamentoRepository.findById(detalle.getMedicamento().getId())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medicamento no encontrado"));
                    detalle.setMedicamento(medReal);
                }
            }
        }

        registrarHistorial(nuevo, "CREACION", EstadoEnvio.PENDIENTE, "Creación del envío", nuevo.getFechaCreacion(), nuevo.getHoraCreacion(), usuario);
        return envioRepository.save(nuevo);
    }

    @Transactional
    public Envio actualizar(String id, Envio datosNuevos, String usuario) {
        Envio envio = buscarPorId(id);
        String fecha = LocalDate.now().toString();
        String hora = LocalTime.now().toString().substring(0, 5);

        Map<String, Integer> medicamentosAntes = new HashMap<>();
        if (envio.getDetalles() != null) {
            for (DetalleEnvio d : envio.getDetalles()) {
                if (d.getMedicamento() != null) {
                    medicamentosAntes.put(d.getMedicamento().getNombre(), d.getCantidad());
                }
            }
        }

        envio.setRemitente(datosNuevos.getRemitente());
        envio.setDestinatario(datosNuevos.getDestinatario());
        envio.setOrigen(datosNuevos.getOrigen());
        envio.setDestino(datosNuevos.getDestino());
        envio.setFechaEstimada(datosNuevos.getFechaEstimada());
        envio.setDescripcionCarga(datosNuevos.getDescripcionCarga());
        envio.setPrioridad(datosNuevos.getPrioridad());
        envio.setObservaciones(datosNuevos.getObservaciones());
        envio.setLatitudOrigen(datosNuevos.getLatitudOrigen());
        envio.setLongitudOrigen(datosNuevos.getLongitudOrigen());
        envio.setLatitudDestino(datosNuevos.getLatitudDestino());
        envio.setLongitudDestino(datosNuevos.getLongitudDestino());

        if (datosNuevos.getDetalles() != null) {
            List<DetalleEnvio> detallesActuales = envio.getDetalles();
            List<DetalleEnvio> detallesParaMantener = new ArrayList<>();

            for (DetalleEnvio detalleNuevo : datosNuevos.getDetalles()) {
                if (detalleNuevo.getMedicamento() != null && detalleNuevo.getMedicamento().getId() != null) {
                    Medicamento medReal = medicamentoRepository.findById(detalleNuevo.getMedicamento().getId())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medicamento no encontrado"));
                    detalleNuevo.setMedicamento(medReal);
                }

                if (detalleNuevo.getIdDetalle() != null) {
                    DetalleEnvio detalleExistente = detallesActuales.stream()
                            .filter(d -> d.getIdDetalle().equals(detalleNuevo.getIdDetalle()))
                            .findFirst()
                            .orElse(null);

                    if (detalleExistente != null) {
                        detalleExistente.setCantidad(detalleNuevo.getCantidad());
                        detalleExistente.setLote(detalleNuevo.getLote());
                        detalleExistente.setFechaVencimiento(detalleNuevo.getFechaVencimiento());
                        detalleExistente.setMedicamento(detalleNuevo.getMedicamento());
                        detallesParaMantener.add(detalleExistente);
                    } else {
                        detalleNuevo.setEnvio(envio);
                        detallesParaMantener.add(detalleNuevo);
                    }
                } else {
                    detalleNuevo.setEnvio(envio);
                    detallesParaMantener.add(detalleNuevo);
                }
            }

            detallesActuales.retainAll(detallesParaMantener);
            for (DetalleEnvio d : detallesParaMantener) {
                if (!detallesActuales.contains(d)) {
                    envio.agregarDetalle(d);
                }
            }
        } else {
            if (envio.getDetalles() != null) {
                envio.getDetalles().clear();
            }
        }

        Map<String, Integer> medicamentosDespues = new HashMap<>();
        if (envio.getDetalles() != null) {
            for (DetalleEnvio d : envio.getDetalles()) {
                if (d.getMedicamento() != null) {
                    medicamentosDespues.put(d.getMedicamento().getNombre(), d.getCantidad());
                }
            }
        }

        boolean huboCambiosMedicamentos = false;

        for (Map.Entry<String, Integer> entry : medicamentosDespues.entrySet()) {
            String nombreMed = entry.getKey();
            Integer cantNueva = entry.getValue();

            if (!medicamentosAntes.containsKey(nombreMed)) {
                registrarHistorial(envio, "EDICION", envio.getEstado(), "+ " + nombreMed + " x" + cantNueva, fecha, hora, usuario);
                huboCambiosMedicamentos = true;
            } else {
                Integer cantAntigua = medicamentosAntes.get(nombreMed);
                if (!cantAntigua.equals(cantNueva)) {
                    registrarHistorial(envio, "EDICION", envio.getEstado(), nombreMed + " x" + cantAntigua + " → " + cantNueva, fecha, hora, usuario);
                    huboCambiosMedicamentos = true;
                }
            }
        }

        for (String nombreMed : medicamentosAntes.keySet()) {
            if (!medicamentosDespues.containsKey(nombreMed)) {
                registrarHistorial(envio, "EDICION", envio.getEstado(), "[-] " + nombreMed, fecha, hora, usuario);
                huboCambiosMedicamentos = true;
            }
        }

        if (!huboCambiosMedicamentos) {
            registrarHistorial(envio, "EDICION", envio.getEstado(), "Envío actualizado", fecha, hora, usuario);
        }

        return envioRepository.save(envio);
    }

    @Transactional
    public Envio actualizarEstado(String id, EstadoEnvio nuevoEstado, String usuario, String repartidorId, String tipoIncidencia, String descripcionIncidencia) {
        return actualizarEstado(id, nuevoEstado, usuario, repartidorId, tipoIncidencia, descripcionIncidencia, null, null);
    }

    @Transactional
    public Envio actualizarEstado(String id, EstadoEnvio nuevoEstado, String usuario, String repartidorId, String tipoIncidencia, String descripcionIncidencia, String receptorNombre, String receptorDni) {
        Envio envio = buscarPorId(id);
        if (nuevoEstado == EstadoEnvio.ASIGNADO) {
            envio.setRepartidorId(repartidorId);
        }
        envio.setEstado(nuevoEstado);
        
        if (nuevoEstado == EstadoEnvio.ENTREGADO) {
            envio.setReceptorNombre(receptorNombre);
            envio.setReceptorDni(receptorDni);
        }
        
        String tipoHistorial = "CAMBIO_ESTADO";
        String detalleHistorial = "Cambio a " + nuevoEstado;
        
        if (nuevoEstado == EstadoEnvio.INCIDENTE_REPORTADO) {
            tipoHistorial = tipoIncidencia;
            detalleHistorial = descripcionIncidencia;
            
            Incidente incidente = new Incidente(
                envio, 
                tipoIncidencia != null ? tipoIncidencia : "Incidente Reportado", 
                descripcionIncidencia != null ? descripcionIncidencia : "Sin descripción", 
                LocalDate.now().toString(), 
                LocalTime.now().toString().substring(0, 5), 
                usuario
            );
            envio.agregarIncidente(incidente);
        }
        
        registrarHistorial(envio, tipoHistorial, nuevoEstado, detalleHistorial, LocalDate.now().toString(), LocalTime.now().toString().substring(0, 5), usuario);
        return envioRepository.save(envio);
    }

    @Transactional
    public Envio reasignarRepartidor(String id, String nuevoRepartidorId, String usuario) {
        Envio envio = buscarPorId(id);
        if (nuevoRepartidorId == null || nuevoRepartidorId.trim().isEmpty()) {
            throw new IllegalArgumentException("El ID del nuevo repartidor es obligatorio");
        }
        String repartidorAnterior = envio.getRepartidorId() != null ? envio.getRepartidorId() : "Sin asignar";
        envio.setRepartidorId(nuevoRepartidorId);
        registrarHistorial(envio, "REASIGNACION", envio.getEstado(), "Cambio de repartidor: " + repartidorAnterior + " → " + nuevoRepartidorId, LocalDate.now().toString(), LocalTime.now().toString().substring(0, 5), usuario);
        return envioRepository.save(envio);
    }

    @Transactional
    public Envio cancelar(String id, String motivo, String firma, String fecha, String hora, String usuario) {
        Envio envio = buscarPorId(id);
        envio.setEstado(EstadoEnvio.CANCELADO);
        envio.setMotivoCancelacion(motivo);
        envio.setFirmaCancelacion(firma);
        envio.setFechaCancelacion(fecha + " " + hora);
        registrarHistorial(envio, "CANCELACION", EstadoEnvio.CANCELADO, motivo, fecha, hora, usuario);
        return envioRepository.save(envio);
    }

    public void eliminar(String id) {
        envioRepository.deleteById(id);
    }

    public TrackingPublicoDTO obtenerTrackingPublico(String id) {
        Envio envio = buscarPorId(id);
        return new TrackingPublicoDTO(envio.getId(), envio.getEstado().name(), envio.getFechaCreacion(), envio.getHoraCreacion());
    }

}
