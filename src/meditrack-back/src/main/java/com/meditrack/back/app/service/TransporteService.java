package com.meditrack.back.app.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.meditrack.back.app.model.EstadoOperativo;
import com.meditrack.back.app.model.Transporte;
import com.meditrack.back.app.repository.TransporteRepository;

@Service
public class TransporteService {

    private final TransporteRepository transporteRepository;

    public TransporteService(TransporteRepository transporteRepository) {
        this.transporteRepository = transporteRepository;
    }

    // Listado + búsqueda + filtro
    public List<Transporte> listar(String q, EstadoOperativo estado) {
        if (q != null && !q.isBlank()) {
            return transporteRepository
                .findByPatenteContainingIgnoreCaseOrTipoVehiculoContainingIgnoreCase(q, q);
        }
        if (estado != null) {
            return transporteRepository.findByEstadoOperativo(estado);
        }
        return transporteRepository.findAll();
    }

    public Transporte obtener(Long id) {
        return transporteRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Transporte no encontrado: " + id));
    }

    @Transactional
    public Transporte crear(Transporte t) {
        // Normalizar patente (recomendado)
        if (t.getPatente() != null) {
            t.setPatente(t.getPatente().trim());
        }

        // Patente única
        if (transporteRepository.existsByPatenteIgnoreCase(t.getPatente())) {
            throw new IllegalArgumentException("Ya existe un transporte con esa patente");
        }

        // Default estado
        if (t.getEstadoOperativo() == null) {
            t.setEstadoOperativo(EstadoOperativo.ACTIVO);
        }

        if(t.getCapacidadKg() != null && t.getCapacidadKg() <= 0) {
            throw new IllegalArgumentException("La capacidad debe ser mayor a 0");
        }

        if(t.getCapacidadLitros() != null && t.getCapacidadLitros() <= 0) {
            throw new IllegalArgumentException("La capacidad de volumen debe ser mayor a 0");
        }

        if(t.getCapacidadM3() == null || t.getCapacidadM3() <= 0) {
            throw new IllegalArgumentException("La capacidad del contenedor (m3) es obligatoria y debe ser mayor a 0");
        }

        return transporteRepository.save(t);
    }

    @Transactional
    public Transporte actualizar(Long id, Transporte cambios) {
        Transporte t = obtener(id);

        // Patente (si cambia, validar duplicado)
        if (cambios.getPatente() != null && !cambios.getPatente().isBlank()) {
            String nuevaPatente = cambios.getPatente().trim();

            if (!nuevaPatente.equalsIgnoreCase(t.getPatente()) &&
                transporteRepository.existsByPatenteIgnoreCase(nuevaPatente)) {
                throw new IllegalArgumentException("Ya existe un transporte con esa patente");
            }

            t.setPatente(nuevaPatente);
        }

        if (cambios.getTipoVehiculo() != null && !cambios.getTipoVehiculo().isBlank()) {
            t.setTipoVehiculo(cambios.getTipoVehiculo().trim());
        }

        if (cambios.getCapacidadKg() != null) {
            if (cambios.getCapacidadKg() <= 0) {
                throw new IllegalArgumentException("La capacidad debe ser mayor a 0");
            }
            t.setCapacidadKg(cambios.getCapacidadKg());
        }

        if (cambios.getEstadoOperativo() != null) {
            t.setEstadoOperativo(cambios.getEstadoOperativo());
        }

        if (cambios.getCapacidadLitros() != null) {
            if (cambios.getCapacidadLitros() <= 0) {
                throw new IllegalArgumentException("La capacidad de volumen debe ser mayor a 0");
            }
            t.setCapacidadLitros(cambios.getCapacidadLitros());
        }

        if (cambios.getCapacidadM3() != null) {
            if (cambios.getCapacidadM3() <= 0) {
                throw new IllegalArgumentException("La capacidad del contenedor (m3) debe ser mayor a 0");
            }
            t.setCapacidadM3(cambios.getCapacidadM3());
        }

        return transporteRepository.save(t);
    }

    // Baja lógica
    @Transactional
    public Transporte desactivar(Long id) {
        Transporte t = obtener(id);
        t.setEstadoOperativo(EstadoOperativo.INACTIVO);
        return transporteRepository.save(t);
    }

    // Delete físico (solo si lo quieren de verdad)
    @Transactional
    public void eliminarFisico(Long id) {
        if (!transporteRepository.existsById(id)) {
            throw new RuntimeException("Transporte no encontrado: " + id);
        }
        transporteRepository.deleteById(id);
    }
}