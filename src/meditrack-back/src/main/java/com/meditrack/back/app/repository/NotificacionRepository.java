package com.meditrack.back.app.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.meditrack.back.app.model.Notificacion;
import com.meditrack.back.app.model.Usuario;

@Repository
public interface NotificacionRepository extends JpaRepository<Notificacion, String> {

    List<Notificacion> findByUsuarioDestinoOrderByFechaCreacionDesc(Usuario usuarioDestino);

    long countByUsuarioDestinoAndLeidoFalse(Usuario usuarioDestino);

}
