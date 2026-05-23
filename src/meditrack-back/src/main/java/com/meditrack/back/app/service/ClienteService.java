package com.meditrack.back.app.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.meditrack.back.app.model.Cliente;
import com.meditrack.back.app.model.TipoEstablecimiento;
import com.meditrack.back.app.repository.ClienteRepository;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public ClienteService(ClienteRepository clienteRepository){
        this.clienteRepository = clienteRepository;
    }

    public List<Cliente> listarTodos() {
        return clienteRepository.findAll();
    }

    public Cliente obtenerPorId(String id) {
        return clienteRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Cliente no encontrado")
                );
    }

    public Cliente crear(Map<String, Object> datos, String usuario) {
        Cliente nuevo = new Cliente();

        mapDataToCliente(datos, nuevo, usuario);

        return clienteRepository.save(nuevo);
    }

    public Cliente actualizar(String id, Map<String, Object> body, String usuario) {
        Cliente updateCliente = clienteRepository.findById(id)
                                                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        mapDataToCliente(body, updateCliente, usuario);

        return clienteRepository.save(updateCliente);
    }

    public Cliente cambiarEstado(String id) {
        Cliente updateCliente = clienteRepository.findById(id)
                                                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        Boolean isActivo = updateCliente.isEstadoActivo();

        updateCliente.setEstadoActivo(!isActivo);

        return clienteRepository.save(updateCliente);
    }

    private void mapDataToCliente(Map<String, Object> body, Cliente cliente, String usuario) {
        cliente.setNombre(body.get("nombre").toString());
        cliente.setDireccion(body.get("direccion").toString());
        cliente.setPlaceId(body.get("placeId").toString());

        cliente.setTipoEstablecimiento(
                TipoEstablecimiento.valueOf(
                        body.get("tipoEstablecimiento").toString()));

        cliente.setUsuarioResponsable(usuario);

        if (body.get("latitud") != null) {
            cliente.setLatitud(
                    new BigDecimal(body.get("latitud").toString()));
        }

        if (body.get("longitud") != null) {
            cliente.setLongitud(
                    new BigDecimal(body.get("longitud").toString()));
        }
    }

}
