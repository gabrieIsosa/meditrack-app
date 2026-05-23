package com.meditrack.back.app.config;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.meditrack.back.app.model.Role;
import com.meditrack.back.app.model.Sesion;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {

    private final SecretKey key;
    private final long expiration;

    public JwtUtil(@Value("${jwt.secret}") String secret, @Value("${jwt.expiration:28800000}") long expiration) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiration = expiration;
    }

    public String generarToken(String id, String email, String nombre, Role role) {
        return Jwts.builder()
            .subject(email)
            .claim("id", id)
            .claim("nombre", nombre)
            .claim("role", role.name())
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expiration))
            .signWith(key)
            .compact();
    }

    public Sesion validar(String token) {
        try {
            Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

            String email  = claims.getSubject();
            String id     = claims.get("id", String.class);
            String nombre = claims.get("nombre", String.class);
            Role   role   = Role.valueOf(claims.get("role", String.class));

            return new Sesion(id, email, nombre, role);
        } catch (JwtException | IllegalArgumentException e) {
            throw new RuntimeException("Token inválido o expirado");
        }
    }

}
