package com.scu.clinic_system.service;

import com.scu.clinic_system.model.*;
import com.scu.clinic_system.repository.NotificationRepository;
import com.scu.clinic_system.repository.PatientRepository;
import com.scu.clinic_system.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PacientService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder encoder;

    public PacientService(UserRepository userRepository,
                          PatientRepository patientRepository,
                          NotificationRepository notificationRepository,
                          PasswordEncoder encoder) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.notificationRepository = notificationRepository;
        this.encoder = encoder;
    }

    // ── DTO de resposta ──────────────────────────────────────────────────────

    public record PatientResponse(
            String id,
            String patientProfileId,
            String name,
            String email,
            String cpf,
            String birthDate,
            boolean active,
            String phone,
            String address,
            String bloodType,
            String allergies,
            String emergencyContactName,
            String emergencyContactPhone
    ) {
        public static PatientResponse from(Patient p) {
            return new PatientResponse(
                    p.getUser().getId().toString(),
                    p.getId().toString(),
                    p.getUser().getName(),
                    p.getUser().getEmail(),
                    p.getUser().getCpf(),
                    p.getUser().getBirthDate().toString(),
                    p.getUser().isActive(),
                    p.getPhone(),
                    p.getAddress(),
                    p.getBloodType() != null ? p.getBloodType().name() : null,
                    p.getAllergies(),
                    p.getEmergencyContactName(),
                    p.getEmergencyContactPhone()
            );
        }
    }

    // ── Registro atomico: cria User + Patient ────────────────────────────────

    @Transactional
    public PatientResponse register(String name, String email, String cpf,
                                    LocalDate birthDate, String rawPassword) {
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setCpf(cpf);
        user.setBirthDate(birthDate);
        user.setPassword(encoder.encode(rawPassword));
        user.setRole(Role.patient);
        user.setActive(true);
        User savedUser = userRepository.save(user);

        Patient patient = new Patient();
        patient.setUser(savedUser);
        Patient savedPatient = patientRepository.save(patient);

        Notification welcome = new Notification();
        welcome.setUser(savedUser);
        welcome.setTitle("Bem-vindo ao Sistema Clínico!");
        welcome.setBody("Seu cadastro foi realizado com sucesso. Complete seu perfil para uma melhor experiência.");
        notificationRepository.save(welcome);

        return PatientResponse.from(savedPatient);
    }

    // ── Listagem ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<PatientResponse> findAll() {
        return patientRepository.findAll().stream()
                .map(PatientResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<PatientResponse> findById(UUID userId) {
        return patientRepository.findByUserId(userId)
                .map(PatientResponse::from);
    }

    @Transactional(readOnly = true)
    public Optional<PatientResponse> findByEmail(String email) {
        return patientRepository.findByUserEmail(email)
                .map(PatientResponse::from);
    }

    @Transactional(readOnly = true)
    public List<PatientResponse> search(String q) {
        if (q == null || q.trim().length() < 2) return List.of();
        return patientRepository.searchByQuery(q.trim())
                .stream().map(PatientResponse::from).toList();
    }

    // ── Edicao pelo staff ────────────────────────────────────────────────────

    @Transactional
    public Optional<PatientResponse> updateByStaff(UUID userId, String name, String cpf,
                                                    String birthDate, String phone, String address,
                                                    BloodType bloodType, String allergies,
                                                    String emergencyContactName, String emergencyContactPhone,
                                                    String rawPassword) {
        return patientRepository.findByUserId(userId).map(patient -> {
            User user = patient.getUser();
            if (name != null && !name.isBlank()) user.setName(name);
            if (cpf != null && !cpf.isBlank()) user.setCpf(cpf.replaceAll("\\D", ""));
            if (birthDate != null && !birthDate.isBlank()) user.setBirthDate(LocalDate.parse(birthDate));
            if (rawPassword != null && !rawPassword.isBlank()) user.setPassword(encoder.encode(rawPassword));

            if (phone != null) patient.setPhone(phone);
            if (address != null) patient.setAddress(address);
            if (bloodType != null) patient.setBloodType(bloodType);
            if (allergies != null) patient.setAllergies(allergies);
            if (emergencyContactName != null) patient.setEmergencyContactName(emergencyContactName);
            if (emergencyContactPhone != null) patient.setEmergencyContactPhone(emergencyContactPhone);

            return PatientResponse.from(patientRepository.save(patient));
        });
    }

    // ── Edicao pelo proprio paciente ─────────────────────────────────────────

    @Transactional
    public Optional<PatientResponse> updateSelf(String email, String phone, String address,
                                                 BloodType bloodType, String allergies,
                                                 String emergencyContactName, String emergencyContactPhone) {
        return patientRepository.findByUserEmail(email).map(patient -> {
            if (phone != null) patient.setPhone(phone);
            if (address != null) patient.setAddress(address);
            if (bloodType != null) patient.setBloodType(bloodType);
            if (allergies != null) patient.setAllergies(allergies);
            if (emergencyContactName != null) patient.setEmergencyContactName(emergencyContactName);
            if (emergencyContactPhone != null) patient.setEmergencyContactPhone(emergencyContactPhone);
            return PatientResponse.from(patientRepository.save(patient));
        });
    }

    // ── Toggle ativo/inativo ─────────────────────────────────────────────────

    @Transactional
    public Optional<PatientResponse> toggleActive(UUID userId) {
        return patientRepository.findByUserId(userId).map(patient -> {
            patient.getUser().setActive(!patient.getUser().isActive());
            return PatientResponse.from(patientRepository.save(patient));
        });
    }

    // ── Notificacao pelo sistema ─────────────────────────────────────────────

    @Transactional
    public void sendNotification(User user, String title, String body) {
        Notification n = new Notification();
        n.setUser(user);
        n.setTitle(title);
        n.setBody(body);
        notificationRepository.save(n);
    }

    public boolean emailExists(String email) {
        return userRepository.existsByEmail(email);
    }

    public boolean cpfExists(String cpf) {
        return userRepository.existsByCpf(cpf);
    }
}
