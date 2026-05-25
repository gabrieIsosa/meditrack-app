package com.meditrack.back.app.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.meditrack.back.app.model.Mail;
import com.meditrack.back.app.repository.MailRepository;

@Service
public class MailService {

    private final MailRepository mailRepository;

    public MailService(MailRepository mailRepository) {
        this.mailRepository = mailRepository;
    }

    public List<Mail> listarTodos() {
        return mailRepository.findAllByOrderByFechaCreacionDesc();
    }

    public Mail obtenerPorId(String id) {
        return mailRepository.findById(id) .orElseThrow(() ->new ResponseStatusException(HttpStatus.NOT_FOUND,"Mail no encontrado"));
    }

    public List<Mail> obtenerPorEstado(String estado) {
        return mailRepository.findByEstadoIgnoreCase(estado);
    }

    public List<Mail> buscar(String texto) {
        return mailRepository.buscar(texto);
    }

    @Transactional
    public Mail crear(Mail nuevo, String usuario) {
        nuevo.setId(UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        nuevo.setFechaCreacion(LocalDate.now().toString());
        nuevo.setHoraCreacion(LocalTime.now().toString().substring(0, 5));
        nuevo.setFechaEnvio(LocalDate.now().toString()+ " "+ LocalTime.now().toString().substring(0, 5));
        nuevo.setUsuarioCreacion(usuario);

        if (nuevo.getEstado() == null || nuevo.getEstado().isBlank()) {
            nuevo.setEstado("Pendiente");
        }

        return mailRepository.save(nuevo);
    }

    public void eliminar(String id) {
        Mail mail = obtenerPorId(id);
        mailRepository.delete(mail);
    }
}