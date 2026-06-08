package com.meditrack.back.app.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.meditrack.back.app.model.ReclamoCambioDatos;

@Repository
public interface ReclamoCambioDatosRepository extends JpaRepository<ReclamoCambioDatos, String> {

    List<ReclamoCambioDatos> findByEnvio_Id(String envioId);

}