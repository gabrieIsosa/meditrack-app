package com.meditrack.back.app.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.meditrack.back.app.model.AlertaFatiga;
import com.meditrack.back.app.model.EstadoAlertaFatiga;

public interface AlertaFatigaRepository extends JpaRepository<AlertaFatiga, String> {

    List<AlertaFatiga> findByEstadoOrderByFechaDeteccionDesc(EstadoAlertaFatiga estado);

    List<AlertaFatiga> findAllByOrderByFechaDeteccionDesc();

    Optional<AlertaFatiga> findFirstByRepartidorIdAndEstado(String repartidorId, EstadoAlertaFatiga estado);
    
    boolean existsByRepartidorIdAndEstado(String repartidorId, EstadoAlertaFatiga estado);

}
