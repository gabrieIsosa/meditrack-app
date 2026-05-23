package com.meditrack.back.app.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.meditrack.back.app.model.Envio;

public interface EnvioRepository extends JpaRepository<Envio, String> {
}
