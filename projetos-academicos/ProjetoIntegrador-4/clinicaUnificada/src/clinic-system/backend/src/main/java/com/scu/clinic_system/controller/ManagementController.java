package com.scu.clinic_system.controller;

import com.scu.clinic_system.dto.ClinicRegistrationRequest;
import com.scu.clinic_system.model.Clinic;
import com.scu.clinic_system.model.Network;
import com.scu.clinic_system.model.Role;
import com.scu.clinic_system.model.User;
import com.scu.clinic_system.repository.ClinicRepository;
import com.scu.clinic_system.repository.NetworkRepository;
import com.scu.clinic_system.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import com.scu.clinic_system.dto.ManagerRegistrationRequest;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/management")
@PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
public class ManagementController {

    private final ClinicRepository clinicRepository;
    private final NetworkRepository networkRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder encoder;

    public ManagementController(ClinicRepository clinicRepository,
                                NetworkRepository networkRepository,
                                UserRepository userRepository,
                                PasswordEncoder encoder) {
        this.clinicRepository = clinicRepository;
        this.networkRepository = networkRepository;
        this.userRepository = userRepository;
        this.encoder = encoder;
    }

    // ── GET: listar clínicas ───────────────────────────────────────────────
    @GetMapping("/clinics")
    @Transactional(readOnly = true)
    public ResponseEntity<?> listClinics(Authentication authentication) {
        User currentUser = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (currentUser == null) return ResponseEntity.ok(List.of());

        if (currentUser.getRole() == Role.superadmin) {
            return ResponseEntity.ok(clinicRepository.findAll());
        }

        // ADMIN vê todas as clínicas da sua rede
        if (currentUser.getRole() == Role.admin && currentUser.getNetwork() != null) {
            return ResponseEntity.ok(clinicRepository.findByNetworkId(currentUser.getNetwork().getId()));
        }

        return ResponseEntity.ok(List.of());
    }

    // ── POST: criar clínica ────────────────────────────────────────────────
    @PostMapping("/create-clinic")
    @Transactional
    public ResponseEntity<?> createClinic(@RequestBody @Valid ClinicRegistrationRequest req,
                                           Authentication authentication) {
        if (clinicRepository.existsByCnpj(req.cnpj()))
            return ResponseEntity.badRequest().body("Erro: CNPJ já cadastrado.");

        User currentUser = userRepository.findByEmail(authentication.getName()).orElse(null);

        // Resolve a rede conforme o papel do usuário
        Network network = null;
        if (currentUser != null && currentUser.getRole() == Role.admin) {
            if (currentUser.getNetwork() == null)
                return ResponseEntity.badRequest().body("Admin sem rede associada.");
            network = currentUser.getNetwork();
        } else if (currentUser != null && currentUser.getRole() == Role.superadmin) {
            if (req.networkId() == null)
                return ResponseEntity.badRequest().body("networkId é obrigatório para Super Admin.");
            network = networkRepository.findById(req.networkId())
                    .orElseThrow(() -> new RuntimeException("Rede não encontrada."));
        }

        Clinic clinic = new Clinic();
        clinic.setName(req.clinicName());
        clinic.setCnpj(req.cnpj());
        clinic.setAddress(req.address());
        clinic.setPhone(req.phone());
        clinic.setNetwork(network);

        if (req.parentClinicId() != null) {
            Clinic parent = clinicRepository.findById(req.parentClinicId())
                    .orElseThrow(() -> new RuntimeException("Clínica matriz não encontrada."));
            // Garante que a matriz pertence à mesma rede
            if (network != null && !parent.getNetwork().getId().equals(network.getId()))
                return ResponseEntity.badRequest().body("Clínica matriz não pertence à sua rede.");
            clinic.setParentClinic(parent);
        }

        return ResponseEntity.ok(clinicRepository.save(clinic));
    }

    // ── POST: criar manager de clínica ────────────────────────────────────
    @PostMapping("/create-manager")
    @Transactional
    public ResponseEntity<?> createManager(@RequestBody @Valid ManagerRegistrationRequest req,
                                            Authentication authentication) {
        if (userRepository.existsByEmail(req.email()))
            return ResponseEntity.badRequest().body("Erro: E-mail já está em uso.");
        if (userRepository.existsByCpf(req.cpf()))
            return ResponseEntity.badRequest().body("Erro: CPF já está em uso.");

        Clinic clinic = clinicRepository.findById(req.clinicId())
                .orElseThrow(() -> new RuntimeException("Clínica não encontrada."));

        User currentUser = userRepository.findByEmail(authentication.getName()).orElse(null);

        // ADMIN só pode criar manager para clínicas da sua rede
        if (currentUser != null && currentUser.getRole() == Role.admin && currentUser.getNetwork() != null) {
            if (!clinic.getNetwork().getId().equals(currentUser.getNetwork().getId()))
                return ResponseEntity.status(403).body("Clínica não pertence à sua rede.");
        }

        User manager = new User();
        manager.setName(req.name());
        manager.setEmail(req.email());
        manager.setCpf(req.cpf());
        manager.setBirthDate(LocalDate.parse(req.birthDate()));
        manager.setPassword(encoder.encode(req.password()));
        manager.setRole(Role.manager);
        manager.setClinic(clinic);
        manager.setActive(true);
        userRepository.save(manager);

        return ResponseEntity.ok("Manager '" + req.name() + "' criado com sucesso!");
    }

    // ── GET: listar managers ───────────────────────────────────────────────
    @GetMapping("/managers")
    public ResponseEntity<?> listManagers(Authentication authentication) {
        User currentUser = userRepository.findByEmail(authentication.getName()).orElse(null);

        return ResponseEntity.ok(userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.manager)
                .filter(u -> {
                    if (currentUser == null || currentUser.getRole() == Role.superadmin) return true;
                    // ADMIN só vê managers de clínicas da sua rede
                    return u.getClinic() != null
                            && u.getClinic().getNetwork() != null
                            && currentUser.getNetwork() != null
                            && u.getClinic().getNetwork().getId().equals(currentUser.getNetwork().getId());
                })
                .map(u -> new ManagerResponse(
                        u.getId().toString(),
                        u.getName(),
                        u.getEmail(),
                        u.getCpf(),
                        u.getClinic() != null ? u.getClinic().getName() : "Sem Clínica",
                        u.isActive()
                ))
                .toList());
    }

    record ManagerResponse(String id, String name, String email, String cpf, String clinicName, boolean active) {}
}
