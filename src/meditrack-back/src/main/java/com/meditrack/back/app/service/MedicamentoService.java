package com.meditrack.back.app.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.meditrack.back.app.model.Medicamento;

@Service
public class MedicamentoService {

    private List<Medicamento> medicamentos = new ArrayList<>();

    public MedicamentoService() {
        medicamentos.add(new Medicamento("Ibuprofeno 400mg", "test", "Comprimidos", 500, "mg", "Bayer", "Ibuprofeno", true, "/uploads/6a84ff89-02b6-49a4-b722-5a55a3a7b175_actron_400_1.jpg"));
        medicamentos.add(new Medicamento("Amoxicilina 500mg", "test", "Cápsulas", 200, "mg", "Pfizer", "Amoxicilina", true, "/uploads/c3521887-b0a1-4af3-918a-4b1a22a28108_F_000001106329.jpg"));
    }

    public List<Medicamento> listarTodos() {
        return medicamentos;
    }

    public Medicamento crear(Map<String, String> datos, String usuario){
        Medicamento nuevo = new Medicamento();
        
        mapDataToMedicamento(datos, nuevo);

        medicamentos.add(nuevo);
        return nuevo;
    }

    public Medicamento actualizar(String id, Map<String, String> body, String usuario){
        Medicamento updateMedicamento = this.medicamentos.stream().filter(e -> e.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Envío no encontrado"));

        mapDataToMedicamento(body, updateMedicamento);

        return updateMedicamento;
    }

    public Medicamento cambiarEstado(String id) {
        Medicamento updateMedicamento = this.medicamentos.stream().filter(e -> e.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Envío no encontrado"));
        
        Boolean isActivo = updateMedicamento.isEstadoActivo();
        updateMedicamento.setEstadoActivo(!isActivo);

        return updateMedicamento;
    }

    private void mapDataToMedicamento(Map<String, String> body, Medicamento medicamento) {
        medicamento.setDescripcion(body.get("descripcion"));
        medicamento.setNombre(body.get("nombre"));
        medicamento.setPresentacion(body.get("presentacion"));
        medicamento.setPrincipioActivo(body.get("principioActivo"));
        medicamento.setUnidadMedida(body.get("unidadMedida"));
        medicamento.setStock(Integer.parseInt(body.get("stock")));
        medicamento.setLaboratorio(body.get("laboratorio"));
        medicamento.setCadenaFrio(Boolean.getBoolean(body.get("cadenaFrio")));

        if (body.get("imagenUrl") != null && !body.get("imagenUrl").isBlank()) 
            medicamento.setImagenUrl(body.get("imagenUrl"));
    }
}