package com.meditrack.back.app.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.meditrack.back.app.model.Medicamento;
import com.meditrack.back.app.model.Role;
import com.meditrack.back.app.model.Usuario;
import com.meditrack.back.app.repository.MedicamentoRepository;
import com.meditrack.back.app.repository.UsuarioRepository;

@Component
public class DataSeed implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final MedicamentoRepository medicamentoRepository;

    public DataSeed(UsuarioRepository usuarioRepository, MedicamentoRepository medicamentoRepository) {
        this.usuarioRepository = usuarioRepository;
        this.medicamentoRepository = medicamentoRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        generateUsers();
        generateMedicamentos();
    }

    private void generateUsers() {
        if (usuarioRepository.count() == 0) {
            Usuario admin = new Usuario("admin@meditrack.com", "Admin Principal", "12156236", "admin123",
                    Role.ADMINISTRADOR);
            Usuario supervisor = new Usuario("supervisor@meditrack.com", "Admin MediTrack", "30156256", "1234",
                    Role.SUPERVISOR);
            Usuario operador = new Usuario("operador@meditrack.com", "Carlos Ruiz", "42156236", "1234", Role.OPERADOR);
            Usuario repartidor = new Usuario("repartidor@meditrack.com", "Diego Torres", "41156236", "1234",
                    Role.REPARTIDOR);

            usuarioRepository.save(admin);
            usuarioRepository.save(supervisor);
            usuarioRepository.save(operador);
            usuarioRepository.save(repartidor);

            System.out.println("✅ Usuarios de prueba sembrados en la base de datos con éxito.");
        } else {
            System.out.println("ℹ️ La base de datos ya tiene usuarios. Se omite el sembrado.");
        }
    }

    private void generateMedicamentos() {
        if (medicamentoRepository.count() == 0) {
            Medicamento ibuprofeno = new Medicamento(
                    "Ibuprofeno 400mg", "Antiinflamatorio no esteroideo",
                    "Comprimidos", 500,
                    "mg", "Bayer",
                    "Ibuprofeno", true,
                    "/uploads/6a84ff89-02b6-49a4-b722-5a55a3a7b175_actron_400_1.jpg");

            Medicamento amoxicilina = new Medicamento(
                    "Amoxicilina 500mg", "Antibiótico de amplio espectro",
                    "Cápsulas", 200,
                    "mg", "Pfizer",
                    "Amoxicilina", true,
                    "/uploads/c3521887-b0a1-4af3-918a-4b1a22a28108_F_000001106329.jpg");

            medicamentoRepository.save(ibuprofeno);
            medicamentoRepository.save(amoxicilina);

            System.out.println("✅ Medicamentos de prueba sembrados con éxito.");

        } else {
            System.out.println("ℹ️ La base de datos ya tiene medicamentos. Se omite el sembrado.");
        }
    }

}
