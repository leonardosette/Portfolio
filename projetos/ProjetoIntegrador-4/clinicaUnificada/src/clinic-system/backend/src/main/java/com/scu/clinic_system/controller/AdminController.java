package com.scu.clinic_system.controller;

import com.scu.clinic_system.model.*;
import com.scu.clinic_system.repository.*;
import com.scu.clinic_system.service.DoctorService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'MANAGER')")
public class AdminController {

    private final PasswordEncoder encoder;
    private final UserRepository users;
    private final DoctorRepository doctors;
    private final ClinicRepository clinics;
    private final SpecialtyRepository specialties;
    private final DoctorService doctorService;

    public AdminController(PasswordEncoder encoder, UserRepository users,
                           DoctorRepository doctors, ClinicRepository clinics,
                           SpecialtyRepository specialties, DoctorService doctorService) {
        this.encoder = encoder;
        this.users = users;
        this.doctors = doctors;
        this.clinics = clinics;
        this.specialties = specialties;
        this.doctorService = doctorService;
    }

    // ── DTO de resposta (evita lazy loading na serialização JSON) ──────────
    record DoctorResponse(
            String id,
            String userName, String userEmail, String userCpf, String userBirthDate,
            String specialtyId, String specialtyName, String clinicId, String clinicName,
            String councilType, String councilNumber, String councilState, String councilStatus,
            String rqe, String formation, String languages, String areasOfPractice,
            boolean profileEnabled
    ) {
        static DoctorResponse from(Doctor d) {
            return new DoctorResponse(
                    d.getId().toString(),
                    d.getUser().getName(), d.getUser().getEmail(), d.getUser().getCpf(),
                    d.getUser().getBirthDate().toString(),
                    d.getSpecialty().getId().toString(), d.getSpecialty().getName(),
                    d.getClinic().getId().toString(), d.getClinic().getName(),
                    d.getCouncilType().name(), d.getCouncilNumber(),
                    d.getCouncilState(), d.getCouncilStatus().name(),
                    d.getRqe(), d.getFormation(), d.getLanguages(), d.getAreasOfPractice(),
                    d.isProfileEnabled()
            );
        }
    }

    // ── GET: lista médicos filtrado por escopo do usuário ─────────────────
    @GetMapping("/staff/doctors")
    @Transactional(readOnly = true)
    public List<DoctorResponse> listDoctors(Authentication authentication) {
        User currentUser = users.findByEmail(authentication.getName()).orElse(null);
        if (currentUser == null) return List.of();

        if (currentUser.getRole() == Role.manager && currentUser.getClinic() != null) {
            UUID clinicId = currentUser.getClinic().getId();
            return doctors.findAll().stream()
                    .filter(d -> d.getClinic().getId().equals(clinicId))
                    .map(DoctorResponse::from).toList();
        }
        if (currentUser.getRole() == Role.admin && currentUser.getNetwork() != null) {
            UUID networkId = currentUser.getNetwork().getId();
            return doctors.findAll().stream()
                    .filter(d -> d.getClinic().getNetwork() != null
                            && d.getClinic().getNetwork().getId().equals(networkId))
                    .map(DoctorResponse::from).toList();
        }
        // superadmin vê todos
        return doctors.findAll().stream().map(DoctorResponse::from).toList();
    }

    // ── POST: cria médico + usuário vinculado ──────────────────────────────
    record CreateDoctorRequest(
            String name, String email, String cpf, String birthDate, String password,
            UUID specialtyId, UUID clinicId,
            String councilNumber, String councilState, CouncilType councilType,
            String rqe, String formation, String languages, String areasOfPractice
    ) {}

    @PostMapping("/staff/doctor")
    @Transactional
    public ResponseEntity<?> createDoctor(@Valid @RequestBody CreateDoctorRequest req, Authentication authentication) {
        if (users.existsByEmail(req.email()))
            return ResponseEntity.badRequest().body("Email já cadastrado.");
        if (users.existsByCpf(req.cpf()))
            return ResponseEntity.badRequest().body("CPF já cadastrado.");
        if (doctors.existsByCouncilTypeAndCouncilNumberAndCouncilState(req.councilType(), req.councilNumber(), req.councilState()))
            return ResponseEntity.badRequest().body("Conselho Regional já cadastrado para outro médico.");

        User currentUser = users.findByEmail(authentication.getName()).orElse(null);
        UUID clinicId = req.clinicId();

        if (currentUser != null && currentUser.getRole() == Role.manager && currentUser.getClinic() != null) {
            // MANAGER: força a clínica dele
            clinicId = currentUser.getClinic().getId();
        } else if (currentUser != null && currentUser.getRole() == Role.admin && currentUser.getNetwork() != null) {
            // ADMIN: valida que a clínica pertence à sua rede
            Clinic targetClinic = clinics.findById(clinicId).orElse(null);
            if (targetClinic == null || !targetClinic.getNetwork().getId().equals(currentUser.getNetwork().getId()))
                return ResponseEntity.status(403).body("Clínica não pertence à sua rede.");
        }

        Specialty specialty = specialties.findById(req.specialtyId())
                .orElseThrow(() -> new RuntimeException("Especialidade não encontrada"));
        Clinic clinic = clinics.findById(clinicId)
                .orElseThrow(() -> new RuntimeException("Clínica não encontrada"));

        User user = new User();
        user.setName(req.name());
        user.setEmail(req.email());
        user.setCpf(req.cpf());
        user.setBirthDate(LocalDate.parse(req.birthDate()));
        user.setPassword(encoder.encode(req.password()));
        user.setRole(Role.doctor);
        user.setActive(true);
        User savedUser = users.save(user);

        Doctor doctor = new Doctor();
        doctor.setUser(savedUser);
        doctor.setSpecialty(specialty);
        doctor.setClinic(clinic);
        doctor.setCouncilType(req.councilType());
        doctor.setCouncilNumber(req.councilNumber());
        doctor.setCouncilState(req.councilState());
        doctor.setCouncilStatus(CouncilStatus.active);
        doctor.setRqe(req.rqe());
        doctor.setFormation(req.formation());
        doctor.setLanguages(req.languages());
        doctor.setAreasOfPractice(req.areasOfPractice());
        Doctor saved = doctors.save(doctor);

        return ResponseEntity.ok(DoctorResponse.from(saved));
    }

    // ── POST: ativar/desativar médico ──────────────────────────────────────
    @PostMapping("/staff/doctor/{id}/toggle")
    @Transactional
    public ResponseEntity<?> toggleDoctor(@PathVariable UUID id, Authentication authentication) {
        User currentUser = users.findByEmail(authentication.getName()).orElse(null);
        return doctors.findById(id).map(d -> {
            if (currentUser != null && currentUser.getRole() == Role.manager && currentUser.getClinic() != null) {
                if (!d.getClinic().getId().equals(currentUser.getClinic().getId()))
                    return ResponseEntity.status(403).body("Acesso negado: médico não pertence à sua clínica.");
            } else if (currentUser != null && currentUser.getRole() == Role.admin && currentUser.getNetwork() != null) {
                if (d.getClinic().getNetwork() == null || !d.getClinic().getNetwork().getId().equals(currentUser.getNetwork().getId()))
                    return ResponseEntity.status(403).body("Acesso negado: médico não pertence à sua rede.");
            }
            d.setProfileEnabled(!d.isProfileEnabled());
            d.getUser().setActive(!d.getUser().isActive());
            return ResponseEntity.ok(DoctorResponse.from(doctors.save(d)));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── PUT: atualizar dados do médico ─────────────────────────────────────
    record UpdateDoctorRequest(
            String name, String cpf, String birthDate, String password,
            UUID specialtyId, UUID clinicId,
            String councilNumber, String councilState, CouncilType councilType,
            String rqe, String formation, String languages, String areasOfPractice
    ) {}

    @PutMapping("/staff/doctor/{id}")
    @Transactional
    public ResponseEntity<?> updateDoctor(@PathVariable UUID id,
                                          @RequestBody UpdateDoctorRequest req,
                                          Authentication authentication) {
        Doctor doctor = doctors.findById(id).orElse(null);
        if (doctor == null) return ResponseEntity.notFound().build();

        User currentUser = users.findByEmail(authentication.getName()).orElse(null);
        if (currentUser != null && currentUser.getRole() == Role.manager && currentUser.getClinic() != null) {
            if (!doctor.getClinic().getId().equals(currentUser.getClinic().getId()))
                return ResponseEntity.status(403).body("Acesso negado: médico não pertence à sua clínica.");
        }

        User user = doctor.getUser();
        if (req.name() != null && !req.name().isBlank()) user.setName(req.name());
        if (req.birthDate() != null && !req.birthDate().isBlank()) user.setBirthDate(LocalDate.parse(req.birthDate()));
        if (req.password() != null && !req.password().isBlank()) user.setPassword(encoder.encode(req.password()));
        if (req.cpf() != null && !req.cpf().isBlank()) {
            String newCpf = req.cpf().replaceAll("\\D", "");
            if (!newCpf.equals(user.getCpf()) && users.existsByCpf(newCpf))
                return ResponseEntity.badRequest().body("CPF já cadastrado para outro usuário.");
            user.setCpf(newCpf);
        }

        if (req.specialtyId() != null)
            doctor.setSpecialty(specialties.findById(req.specialtyId())
                    .orElseThrow(() -> new RuntimeException("Especialidade não encontrada")));

        // Transferência de clínica: admin valida rede, superadmin livre
        if (req.clinicId() != null && currentUser != null
                && (currentUser.getRole() == Role.admin || currentUser.getRole() == Role.superadmin)) {
            Clinic newClinic = clinics.findById(req.clinicId())
                    .orElseThrow(() -> new RuntimeException("Clínica não encontrada"));
            if (currentUser.getRole() == Role.admin && currentUser.getNetwork() != null
                    && !newClinic.getNetwork().getId().equals(currentUser.getNetwork().getId()))
                return ResponseEntity.status(403).body("Clínica não pertence à sua rede.");
            doctor.setClinic(newClinic);
        }

        // Valida unicidade do conselho apenas se houve mudança
        CouncilType newCt = req.councilType() != null ? req.councilType() : doctor.getCouncilType();
        String newCn = req.councilNumber() != null && !req.councilNumber().isBlank() ? req.councilNumber() : doctor.getCouncilNumber();
        String newCs = req.councilState() != null && !req.councilState().isBlank() ? req.councilState() : doctor.getCouncilState();
        boolean councilChanged = !newCt.equals(doctor.getCouncilType())
                || !newCn.equals(doctor.getCouncilNumber())
                || !newCs.equals(doctor.getCouncilState());
        if (councilChanged && doctors.existsByCouncilTypeAndCouncilNumberAndCouncilState(newCt, newCn, newCs))
            return ResponseEntity.badRequest().body("Conselho Regional já cadastrado para outro médico.");

        doctor.setCouncilType(newCt);
        doctor.setCouncilNumber(newCn);
        doctor.setCouncilState(newCs);
        if (req.rqe() != null) doctor.setRqe(req.rqe());
        if (req.formation() != null) doctor.setFormation(req.formation());
        if (req.languages() != null) doctor.setLanguages(req.languages());
        if (req.areasOfPractice() != null) doctor.setAreasOfPractice(req.areasOfPractice());

        return ResponseEntity.ok(DoctorResponse.from(doctors.save(doctor)));
    }
}
