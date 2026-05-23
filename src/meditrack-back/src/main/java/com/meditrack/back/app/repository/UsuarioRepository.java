package com.meditrack.back.app.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.meditrack.back.app.model.Usuario;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, String> {
    
    Optional<Usuario> findByEmail(String email);
    
    Optional<Usuario> findByDni(String dni);
    
    boolean existsByEmail(String email);
    
    boolean existsByDni(String dni);

}
