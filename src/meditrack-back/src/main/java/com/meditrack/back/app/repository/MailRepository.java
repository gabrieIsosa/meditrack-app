package com.meditrack.back.app.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.meditrack.back.app.model.Mail;

@Repository
public interface MailRepository extends JpaRepository<Mail, String> {

    List<Mail> findByEstadoIgnoreCase(String estado);

    List<Mail> findByRemitenteContainingIgnoreCase(String remitente);

    List<Mail> findByDestinatarioContainingIgnoreCase(String destinatario);

    List<Mail> findByAsuntoContainingIgnoreCase(String asunto);
    
    List<Mail> findAllByOrderByFechaCreacionDesc();

    boolean existsByAsunto(String asunto);

    @Query("""
        SELECT m
        FROM Mail m
        WHERE
            LOWER(m.asunto) LIKE LOWER(CONCAT('%', :texto, '%'))
            OR
            LOWER(m.remitente) LIKE LOWER(CONCAT('%', :texto, '%'))
            OR
            LOWER(m.destinatario) LIKE LOWER(CONCAT('%', :texto, '%'))
            OR
            LOWER(m.contenido) LIKE LOWER(CONCAT('%', :texto, '%'))
    """)
    List<Mail> buscar(String texto);
}