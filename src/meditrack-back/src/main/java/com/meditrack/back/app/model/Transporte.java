package com.meditrack.back.app.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(
    name = "transportes",
    uniqueConstraints = @UniqueConstraint(name = "uk_transporte_patente", 
    columnNames = "patente")
)
public class Transporte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_transporte")
    private Long id;

    @NotBlank(message = "La patente es obligatoria")
    @Column(nullable = false, length = 20, unique = true)
    private String patente;

    @NotBlank(message = "El tipo de vehículo es obligatorio")
    @Column(name = "tipo_vehiculo", nullable = false, length = 40)
    private String tipoVehiculo;

    @NotNull(message = "La capacidad de carga es obligatoria")
    @Min(value = 1, message = "La capacidad debe ser mayor a 0")
    @Column(name = "capacidad_kg", nullable = false)
    private Integer capacidadKg;

    @NotNull(message = "El estado operativo es obligatorio")
    @Enumerated(EnumType.STRING)
    @Column(name = "estado_operativo", nullable = false, length = 20)
    private EstadoOperativo estadoOperativo = EstadoOperativo.ACTIVO;

    @NotNull(message = "La capacidad de volumen es obligatoria")
    @Min(value = 1, message = "La capacidad de volumen debe ser mayor a 0")
    @Column(name = "capacidad_litros", nullable = false)
    private Integer capacidadLitros;

    @Column(name = "capacidad_m3")
    private Double capacidadM3;

    public Transporte () {}
    
    // Getters y Setters

    public Long getId() {
        return id;
    }

    public String getPatente() {
        return patente;
    }
    public void setPatente(String patente) {
        this.patente = patente;
    }

    public String getTipoVehiculo() {
        return tipoVehiculo;
    }
    public void setTipoVehiculo(String tipoVehiculo) {
        this.tipoVehiculo = tipoVehiculo;
    }

    public Integer getCapacidadKg() {
        return capacidadKg;
    }
    public void setCapacidadKg(Integer capacidadKg) {
        this.capacidadKg = capacidadKg;
    }

    public EstadoOperativo getEstadoOperativo() {
        return estadoOperativo;
    }
    public void setEstadoOperativo(EstadoOperativo estadoOperativo) {
        this.estadoOperativo = estadoOperativo;
    }

    public Integer getCapacidadLitros() {
        return capacidadLitros;
    }
    public void setCapacidadLitros(Integer capacidadLitros) {
        this.capacidadLitros = capacidadLitros;
    }

    public Double getCapacidadM3() {
        return capacidadM3;
    }
    public void setCapacidadM3(Double capacidadM3) {
        this.capacidadM3 = capacidadM3;
    }

}