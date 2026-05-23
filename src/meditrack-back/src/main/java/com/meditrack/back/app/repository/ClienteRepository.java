package com.meditrack.back.app.repository;

import java.util.List;
import java.util.Optional;

import com.meditrack.back.app.model.Cliente;
import com.meditrack.back.app.model.TipoEstablecimiento;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, String> {

    Optional<Cliente> findByNombre( String nombre );

    List<Cliente> findByEstadoActivoTrue();

    List<Cliente> findByTipoEstablecimiento(TipoEstablecimiento tipoEstablecimiento);

    boolean existsByNombre( String nombre );

    List<Cliente> findByDireccionContainingIgnoreCase( String direccion );

    List<Cliente> findByNombreContainingIgnoreCase( String nombre );

}
