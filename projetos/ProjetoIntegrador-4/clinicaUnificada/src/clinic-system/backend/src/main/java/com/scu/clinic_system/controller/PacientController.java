package com.scu.clinic_system.controller;

import com.scu.clinic_system.model.BloodType;
import com.scu.clinic_system.service.PacientService;
import com.scu.clinic_system.service.PacientService.PatientResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/pacients")
public class PacientController {

    private final PacientService pacientService;

    public PacientController(PacientService pacientService) {
        this.pacientService = pacientService;
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────

    record RegisterRequest(
            @NotBlank String name,
            @Email @NotBlank String email,
            @NotBlank @Size(min = 11, max = 11) String cpf,
            @NotBlank String birthDate,
            @NotBlank String password
    ) {}

    record UpdatePatientRequest(
            String name,
            String cpf,
            String birthDate,
            String password,
            String phone,
            String address,
            BloodType bloodType,
            String allergies,
            String emergencyContactName,
            String emergencyContactPhone
    ) {}

    // ── POST: auto-cadastro publico ────────────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        if (pacientService.emailExists(req.email()))
            return ResponseEntity.badRequest().body("Email já cadastrado.");
        if (pacientService.cpfExists(req.cpf()))
            return ResponseEntity.badRequest().body("CPF já cadastrado.");

        PatientResponse created = pacientService.register(
                req.name(), req.email(), req.cpf(),
                LocalDate.parse(req.birthDate()), req.password()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ── GET: listar todos os pacientes ────────────────────────────────────────
    @GetMapping
    @PreAuthorize("hasAnyRole('DOCTOR','RECEPTIONIST','MANAGER','ADMIN','SUPERADMIN')")
    public List<PatientResponse> listPatients() {
        return pacientService.findAll();
    }

    // ── GET: busca por nome, CPF ou email ─────────────────────────────────────
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('DOCTOR','RECEPTIONIST','MANAGER','ADMIN','SUPERADMIN')")
    public List<PatientResponse> search(@RequestParam String q) {
        return pacientService.search(q);
    }

    // ── GET: detalhe de um paciente por userId ────────────────────────────────
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR','RECEPTIONIST','MANAGER','ADMIN','SUPERADMIN')")
    public ResponseEntity<PatientResponse> getPatient(@PathVariable UUID id) {
        return pacientService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── PUT: editar dados do paciente ─────────────────────────────────────────
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST','MANAGER','ADMIN','SUPERADMIN')")
    public ResponseEntity<?> updatePatient(@PathVariable UUID id,
                                           @RequestBody UpdatePatientRequest req) {
        return pacientService.updateByStaff(
                id, req.name(), req.cpf(), req.birthDate(),
                req.phone(), req.address(), req.bloodType(),
                req.allergies(), req.emergencyContactName(),
                req.emergencyContactPhone(), req.password()
        ).map(ResponseEntity::ok)
         .orElse(ResponseEntity.notFound().build());
    }

    // ── POST: ativar/desativar paciente ────────────────────────────────────────
    @PostMapping("/{id}/toggle")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN','SUPERADMIN')")
    public ResponseEntity<?> toggleActive(@PathVariable UUID id) {
        return pacientService.toggleActive(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
