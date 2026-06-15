package com.meditrack.back.app.service;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.meditrack.back.app.model.Medicamento;
import com.meditrack.back.app.repository.MedicamentoRepository;

@Service
public class MedicamentoService {
    
    private final MedicamentoRepository medicamentoRepository;

    public MedicamentoService(MedicamentoRepository medicamentoRepository) {
        this.medicamentoRepository = medicamentoRepository;
    }

    public List<Medicamento> listarTodos() {
        return medicamentoRepository.findAll();
    }

    public Medicamento obtenerPorId(String id) {
        return medicamentoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicamento no encontrado"));
    }

    public Medicamento crear(Map<String, String> datos, String usuario){
        Medicamento nuevo = new Medicamento();
        
        mapDataToMedicamento(datos, nuevo);

        return medicamentoRepository.save(nuevo);
    }

    public Medicamento actualizar(String id, Map<String, String> body, String usuario){
        Medicamento updateMedicamento = medicamentoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicamento no encontrado"));

        mapDataToMedicamento(body, updateMedicamento);

        return medicamentoRepository.save(updateMedicamento);
    }

    public Medicamento cambiarEstado(String id) {
        Medicamento updateMedicamento = medicamentoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicamento no encontrado"));

        Boolean isActivo = updateMedicamento.isEstadoActivo();
        updateMedicamento.setEstadoActivo(!isActivo);

        return medicamentoRepository.save(updateMedicamento);
    }

    private void mapDataToMedicamento(Map<String, String> body, Medicamento medicamento) {
        medicamento.setDescripcion(body.get("descripcion"));
        medicamento.setNombre(body.get("nombre"));
        medicamento.setPresentacion(body.get("presentacion"));
        medicamento.setMonodroga(body.get("monodroga"));
        medicamento.setUnidadMedida(body.get("unidadMedida"));
        medicamento.setCantidad(Integer.parseInt(body.get("cantidad")));
        medicamento.setLaboratorio(body.get("laboratorio"));
        medicamento.setCadenaFrio(Boolean.parseBoolean(body.get("cadenaFrio")));
        
        medicamento.setVolumenCm3(Integer.parseInt(body.getOrDefault("volumenCm3", "0")));
        medicamento.setPesoGramos(Integer.parseInt(body.getOrDefault("pesoGramos", "0")));

        if (body.get("imagenUrl") != null && !body.get("imagenUrl").isBlank()) 
            medicamento.setImagenUrl(body.get("imagenUrl"));
    }

}
