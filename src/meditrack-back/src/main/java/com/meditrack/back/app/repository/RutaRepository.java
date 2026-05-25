package com.meditrack.back.app.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.meditrack.back.app.model.Ruta;
import com.meditrack.back.app.model.EstadoRuta;

public interface RutaRepository extends JpaRepository<Ruta, String> {
    List<Ruta> findByRepartidorId(String repartidorId);
    boolean existsByRepartidorIdAndFechaAndEstadoNot(String repartidorId, String fecha, EstadoRuta estado);
}

