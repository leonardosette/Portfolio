package com.scu.clinic_system.controller;

import com.scu.clinic_system.model.Network;
import com.scu.clinic_system.model.Role;
import com.scu.clinic_system.model.User;
import com.scu.clinic_system.repository.NetworkRepository;
import com.scu.clinic_system.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/platform")
@PreAuthorize("hasRole('SUPERADMIN')")
public class PlatformController {

    private final NetworkRepository networks;
    private final UserRepository users;
    private final PasswordEncoder encoder;

    public PlatformController(NetworkRepository networks, UserRepository users, PasswordEncoder encoder) {
        this.networks = networks;
        this.users = users;
        this.encoder = encoder;
    }

    // ── DTO de resposta ────────────────────────────────────────────────────
    record NetworkResponse(String id, String name, String cnpj, String createdAt, long adminCount) {}

    record CreateNetworkRequest(
            @NotBlank String networkName,
            String cnpj,
            @NotBlank String adminName,
            @NotBlank @Email String adminEmail,
            @NotBlank String adminPassword,
            @NotBlank @Size(min = 11, max = 11) String adminCpf,
            @NotBlank String adminBirthDate
    ) {}

    // ── GET: listar todas as redes ─────────────────────────────────────────
    @GetMapping("/networks")
    public List<NetworkResponse> listNetworks() {
        return networks.findAll().stream().map(n -> new NetworkResponse(
                n.getId().toString(),
                n.getName(),
                n.getCnpj(),
                n.getCreatedAt().toString(),
                users.findAll().stream()
                        .filter(u -> u.getRole() == Role.admin
                                && u.getNetwork() != null
                                && u.getNetwork().getId().equals(n.getId()))
                        .count()
        )).toList();
    }

    // ── POST: criar rede + admin da rede ───────────────────────────────────
    @PostMapping("/networks")
    @Transactional
    public ResponseEntity<?> createNetwork(@Valid @RequestBody CreateNetworkRequest req) {
        if (req.cnpj() != null && !req.cnpj().isBlank() && networks.existsByCnpj(req.cnpj()))
            return ResponseEntity.badRequest().body("CNPJ já cadastrado para outra rede.");
        if (users.existsByEmail(req.adminEmail()))
            return ResponseEntity.badRequest().body("E-mail já está em uso.");
        if (users.existsByCpf(req.adminCpf()))
            return ResponseEntity.badRequest().body("CPF já está em uso.");

        Network network = new Network();
        network.setName(req.networkName());
        if (req.cnpj() != null && !req.cnpj().isBlank())
            network.setCnpj(req.cnpj().replaceAll("\\D", ""));
        Network saved = networks.save(network);

        User admin = new User();
        admin.setName(req.adminName());
        admin.setEmail(req.adminEmail());
        admin.setCpf(req.adminCpf().replaceAll("\\D", ""));
        admin.setBirthDate(LocalDate.parse(req.adminBirthDate()));
        admin.setPassword(encoder.encode(req.adminPassword()));
        admin.setRole(Role.admin);
        admin.setNetwork(saved);
        admin.setActive(true);
        users.save(admin);

        return ResponseEntity.ok(new NetworkResponse(
                saved.getId().toString(), saved.getName(), saved.getCnpj(),
                saved.getCreatedAt().toString(), 1L));
    }

    // ── POST: adicionar admin extra a uma rede existente ───────────────────
    record AddAdminRequest(
            @NotBlank String name,
            @NotBlank @Email String email,
            @NotBlank String password,
            @NotBlank @Size(min = 11, max = 11) String cpf,
            @NotBlank String birthDate
    ) {}

    @PostMapping("/networks/{networkId}/admins")
    @Transactional
    public ResponseEntity<?> addAdmin(@PathVariable UUID networkId,
                                       @Valid @RequestBody AddAdminRequest req) {
        Network network = networks.findById(networkId)
                .orElseThrow(() -> new RuntimeException("Rede não encontrada."));
        if (users.existsByEmail(req.email()))
            return ResponseEntity.badRequest().body("E-mail já está em uso.");
        if (users.existsByCpf(req.cpf()))
            return ResponseEntity.badRequest().body("CPF já está em uso.");

        User admin = new User();
        admin.setName(req.name());
        admin.setEmail(req.email());
        admin.setCpf(req.cpf().replaceAll("\\D", ""));
        admin.setBirthDate(LocalDate.parse(req.birthDate()));
        admin.setPassword(encoder.encode(req.password()));
        admin.setRole(Role.admin);
        admin.setNetwork(network);
        admin.setActive(true);
        users.save(admin);

        return ResponseEntity.ok("Admin '" + req.name() + "' adicionado à rede '" + network.getName() + "'.");
    }
}
