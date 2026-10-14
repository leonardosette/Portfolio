package com.scu.clinic_system.controller;

import com.scu.clinic_system.model.*;
import com.scu.clinic_system.repository.*;
import com.scu.clinic_system.service.PacientService;
import com.scu.clinic_system.service.PacientService.PatientResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/patient")
@PreAuthorize("hasRole('PATIENT')")
public class PatientSelfController {

    private final PacientService pacientService;
    private final UserRepository users;
    private final AppointmentRepository appointments;
    private final ConsultationRecordRepository records;
    private final NotificationRepository notifications;
    private final ClinicRepository clinics;
    private final SpecialtyRepository specialties;
    private final DoctorRepository doctors;
    private final PatientRepository patients;
    private final PatientInsuranceRepository insurances;

    public PatientSelfController(PacientService pacientService,
                                  UserRepository users,
                                  AppointmentRepository appointments,
                                  ConsultationRecordRepository records,
                                  NotificationRepository notifications,
                                  ClinicRepository clinics,
                                  SpecialtyRepository specialties,
                                  DoctorRepository doctors,
                                  PatientRepository patients,
                                  PatientInsuranceRepository insurances) {
        this.pacientService = pacientService;
        this.users = users;
        this.appointments = appointments;
        this.records = records;
        this.notifications = notifications;
        this.clinics = clinics;
        this.specialties = specialties;
        this.doctors = doctors;
        this.patients = patients;
        this.insurances = insurances;
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────

    record ClinicDto(String id, String name, String address, String phone) {}

    record SpecialtyDto(String id, String name) {}

    record DoctorOptionDto(String id, String name, String specialtyName, String specialtyId) {}

    record BookingRequest(
            @NotNull UUID clinicId,
            @NotNull UUID doctorId,
            @NotBlank String scheduledAt,
            @NotNull AppointmentType type
    ) {}

    record DoctorSummary(String id, String name, String specialtyName) {}

    record AppointmentSummary(
            String id, String scheduledAt, String status, String type,
            String clinicName, DoctorSummary doctor
    ) {}

    record PrescriptionItemDto(
            String id, String medicationName, String dosage, String duration, String notes
    ) {}

    record ConsultationRecordDto(
            String id, String appointmentId, String scheduledAt,
            String doctorName, String specialtyName, String clinicName,
            String chiefComplaint, String diagnosis, String cid10,
            String treatment, String notes,
            List<PrescriptionItemDto> prescriptionItems
    ) {}

    record NotificationDto(
            String id, String title, String body, String link,
            boolean read, String createdAt
    ) {}

    record UpdateProfileRequest(
            String phone, String address,
            BloodType bloodType,
            String allergies,
            String emergencyContactName, String emergencyContactPhone
    ) {}

    record InsuranceDto(
            String id,
            String operadora,
            String numeroCarteirinha,
            String plano,
            String codigoAns,
            String dataInicio,
            String dataValidade,
            boolean titular,
            String nomeTitular,
            boolean principal,
            boolean ativo,
            boolean vencido
    ) {
        static InsuranceDto from(PatientInsurance i) {
            return new InsuranceDto(
                    i.getId().toString(),
                    i.getOperadora(),
                    i.getNumeroCarteirinha(),
                    i.getPlano(),
                    i.getCodigoAns(),
                    i.getDataInicio() != null ? i.getDataInicio().toString() : null,
                    i.getDataValidade() != null ? i.getDataValidade().toString() : null,
                    i.isTitular(),
                    i.getNomeTitular(),
                    i.isPrincipal(),
                    i.isAtivo(),
                    i.isVencido()
            );
        }
    }

    record InsuranceRequest(
            @NotBlank String operadora,
            @NotBlank String numeroCarteirinha,
            String plano,
            String codigoAns,
            String dataInicio,
            String dataValidade,
            boolean titular,
            String nomeTitular,
            boolean principal
    ) {}

    // ── helpers ───────────────────────────────────────────────────────────────

    private User resolveUser(Authentication auth) {
        return users.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));
    }

    private AppointmentSummary toSummary(Appointment a) {
        Doctor d = a.getDoctor();
        return new AppointmentSummary(
                a.getId().toString(),
                a.getScheduledAt().toString(),
                a.getStatus().name(),
                a.getType().name(),
                a.getClinic().getName(),
                new DoctorSummary(
                        d.getId().toString(),
                        d.getUser().getName(),
                        d.getSpecialty().getName()
                )
        );
    }

    private ConsultationRecordDto toRecordDto(ConsultationRecord rec) {
        Appointment appt = rec.getAppointment();
        Doctor d = appt.getDoctor();
        List<PrescriptionItemDto> items = rec.getPrescriptionItems().stream()
                .map(i -> new PrescriptionItemDto(
                        i.getId().toString(),
                        i.getMedicationName(), i.getDosage(),
                        i.getDuration(), i.getNotes()))
                .toList();
        return new ConsultationRecordDto(
                rec.getId().toString(),
                appt.getId().toString(),
                appt.getScheduledAt().toString(),
                d.getUser().getName(),
                d.getSpecialty().getName(),
                appt.getClinic().getName(),
                rec.getChiefComplaint(),
                rec.getDiagnosis(),
                rec.getCid10(),
                rec.getTreatment(),
                rec.getNotes(),
                items
        );
    }

    // ── GET: meu perfil ────────────────────────────────────────────────────────
    @GetMapping("/profile")
    public ResponseEntity<PatientResponse> myProfile(Authentication auth) {
        return pacientService.findByEmail(auth.getName())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── PUT: editar meu perfil (apenas dados clinicos) ─────────────────────────
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody UpdateProfileRequest req,
                                           Authentication auth) {
        return pacientService.updateSelf(
                auth.getName(),
                req.phone(), req.address(), req.bloodType(),
                req.allergies(), req.emergencyContactName(), req.emergencyContactPhone()
        ).map(ResponseEntity::ok)
         .orElse(ResponseEntity.notFound().build());
    }

    // ── GET: minhas consultas ──────────────────────────────────────────────────
    @GetMapping("/appointments")
    @Transactional(readOnly = true)
    public List<AppointmentSummary> myAppointments(
            @RequestParam(required = false) String status,
            Authentication auth) {
        User user = resolveUser(auth);
        List<Appointment> all = appointments.findByPatientIdOrderByScheduledAtDesc(user.getId());
        if (status != null && !status.isBlank()) {
            try {
                AppointmentStatus s = AppointmentStatus.valueOf(status.toUpperCase());
                all = all.stream().filter(a -> a.getStatus() == s).toList();
            } catch (IllegalArgumentException ignored) {}
        }
        return all.stream().map(this::toSummary).toList();
    }

    // ── GET: detalhe de uma consulta ───────────────────────────────────────────
    @GetMapping("/appointments/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<AppointmentSummary> myAppointmentDetail(
            @PathVariable UUID id, Authentication auth) {
        User user = resolveUser(auth);
        return appointments.findByIdAndPatientId(id, user.getId())
                .map(a -> ResponseEntity.ok(toSummary(a)))
                .orElse(ResponseEntity.notFound().build());
    }

    // ── GET: meu prontuario de uma consulta ────────────────────────────────────
    @GetMapping("/records/{appointmentId}")
    @Transactional(readOnly = true)
    public ResponseEntity<ConsultationRecordDto> myRecord(
            @PathVariable UUID appointmentId, Authentication auth) {
        User user = resolveUser(auth);
        return appointments.findByIdAndPatientId(appointmentId, user.getId())
                .flatMap(a -> records.findByAppointmentId(a.getId()))
                .map(rec -> ResponseEntity.ok(toRecordDto(rec)))
                .orElse(ResponseEntity.notFound().build());
    }

    // ── GET: todos os meus prontuarios ─────────────────────────────────────────
    @GetMapping("/records")
    @Transactional(readOnly = true)
    public List<ConsultationRecordDto> myRecords(Authentication auth) {
        User user = resolveUser(auth);
        return appointments.findByPatientIdAndStatus(user.getId(), AppointmentStatus.COMPLETED)
                .stream()
                .map(a -> records.findByAppointmentId(a.getId()).orElse(null))
                .filter(r -> r != null)
                .map(this::toRecordDto)
                .toList();
    }

    // ── GET: minhas notificacoes ───────────────────────────────────────────────
    @GetMapping("/notifications")
    public List<NotificationDto> myNotifications(Authentication auth) {
        User user = resolveUser(auth);
        return notifications.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(n -> new NotificationDto(
                        n.getId().toString(),
                        n.getTitle(), n.getBody(), n.getLink(),
                        n.isRead(), n.getCreatedAt().toString()))
                .toList();
    }

    // ── GET: contagem de nao lidas ─────────────────────────────────────────────
    @GetMapping("/notifications/unread-count")
    public long unreadCount(Authentication auth) {
        User user = resolveUser(auth);
        return notifications.countByUserIdAndReadFalse(user.getId());
    }

    // ── POST: marcar todas como lidas ──────────────────────────────────────────
    @PostMapping("/notifications/mark-all-read")
    @Transactional
    public ResponseEntity<Void> markAllRead(Authentication auth) {
        User user = resolveUser(auth);
        notifications.markAllReadByUserId(user.getId());
        return ResponseEntity.ok().build();
    }

    // ── GET: listar clinicas disponiveis ───────────────────────────────────────
    @GetMapping("/booking/clinics")
    @Transactional(readOnly = true)
    public List<ClinicDto> listClinics() {
        return clinics.findAll().stream()
                .map(c -> new ClinicDto(c.getId().toString(), c.getName(),
                        c.getAddress(), c.getPhone()))
                .toList();
    }

    // ── GET: listar especialidades de uma clinica ───────────────────────────────
    @GetMapping("/booking/clinics/{clinicId}/specialties")
    @Transactional(readOnly = true)
    public List<SpecialtyDto> listSpecialtiesByClinic(@PathVariable UUID clinicId) {
        return doctors.findActiveByClinic(clinicId).stream()
                .map(d -> d.getSpecialty())
                .distinct()
                .map(s -> new SpecialtyDto(s.getId().toString(), s.getName()))
                .toList();
    }

    // ── GET: listar medicos de uma clinica (e especialidade opcional) ────────────
    @GetMapping("/booking/clinics/{clinicId}/doctors")
    @Transactional(readOnly = true)
    public List<DoctorOptionDto> listDoctorsByClinic(
            @PathVariable UUID clinicId,
            @RequestParam(required = false) UUID specialtyId) {
        List<Doctor> result = specialtyId != null
                ? doctors.findActiveByClinicAndSpecialty(clinicId, specialtyId)
                : doctors.findActiveByClinic(clinicId);
        return result.stream()
                .map(d -> new DoctorOptionDto(
                        d.getId().toString(),
                        d.getUser().getName(),
                        d.getSpecialty().getName(),
                        d.getSpecialty().getId().toString()))
                .toList();
    }

    // ── POST: solicitar agendamento (cria PENDING) ─────────────────────────────
    @PostMapping("/appointments")
    @Transactional
    public ResponseEntity<?> bookAppointment(@Valid @RequestBody BookingRequest req,
                                              Authentication auth) {
        User patient = resolveUser(auth);

        Clinic clinic = clinics.findById(req.clinicId()).orElse(null);
        if (clinic == null) return ResponseEntity.badRequest().body("Clínica não encontrada.");

        Doctor doctor = doctors.findById(req.doctorId()).orElse(null);
        if (doctor == null) return ResponseEntity.badRequest().body("Médico não encontrado.");
        if (!doctor.getClinic().getId().equals(req.clinicId()))
            return ResponseEntity.badRequest().body("Médico não pertence à clínica selecionada.");
        if (!doctor.isProfileEnabled())
            return ResponseEntity.badRequest().body("Médico indisponível para agendamentos.");

        LocalDateTime scheduledAt;
        try {
            scheduledAt = LocalDateTime.parse(req.scheduledAt());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Formato de data inválido. Use: yyyy-MM-ddTHH:mm");
        }
        if (scheduledAt.isBefore(LocalDateTime.now()))
            return ResponseEntity.badRequest().body("A data deve ser futura.");

        Appointment appt = new Appointment();
        appt.setPatient(patient);
        appt.setDoctor(doctor);
        appt.setClinic(clinic);
        appt.setScheduledAt(scheduledAt);
        appt.setStatus(AppointmentStatus.PENDING);
        appt.setType(req.type());
        appt.setCreatedBy(patient);
        Appointment saved = appointments.save(appt);

        pacientService.sendNotification(patient,
                "Solicitação enviada!",
                "Sua consulta com " + doctor.getUser().getName() + " aguarda confirmação da recepção.");

        return ResponseEntity.status(HttpStatus.CREATED).body(toSummary(saved));
    }

    // ── DELETE: cancelar agendamento pendente ──────────────────────────────────
    @DeleteMapping("/appointments/{id}")
    @Transactional
    public ResponseEntity<?> cancelBooking(@PathVariable UUID id, Authentication auth) {
        User patient = resolveUser(auth);
        return appointments.findByIdAndPatientId(id, patient.getId()).map(appt -> {
            if (appt.getStatus() != AppointmentStatus.PENDING && appt.getStatus() != AppointmentStatus.SCHEDULED)
                return ResponseEntity.badRequest().body("Apenas consultas pendentes ou agendadas podem ser canceladas.");
            appt.setStatus(AppointmentStatus.CANCELLED);
            appointments.save(appt);
            pacientService.sendNotification(patient, "Consulta cancelada",
                    "Sua consulta com " + appt.getDoctor().getUser().getName() + " foi cancelada.");
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── POST: marcar uma notificacao como lida ─────────────────────────────────
    @PostMapping("/notifications/{id}/read")
    @Transactional
    public ResponseEntity<Void> markOneRead(@PathVariable UUID id, Authentication auth) {
        User user = resolveUser(auth);
        notifications.findById(id).ifPresent(n -> {
            if (n.getUser().getId().equals(user.getId())) {
                n.setRead(true);
                notifications.save(n);
            }
        });
        return ResponseEntity.ok().build();
    }

    // ── GET: meus convenios ────────────────────────────────────────────────────
    @GetMapping("/insurance")
    @Transactional(readOnly = true)
    public List<InsuranceDto> myInsurances(Authentication auth) {
        User user = resolveUser(auth);
        Patient patient = patients.findByUserId(user.getId()).orElse(null);
        if (patient == null) return List.of();
        return insurances.findByPatientIdOrderByPrincipalDescOperadoraAsc(patient.getId())
                .stream().map(InsuranceDto::from).toList();
    }

    // ── POST: adicionar convenio ───────────────────────────────────────────────
    @PostMapping("/insurance")
    @Transactional
    public ResponseEntity<?> addInsurance(@Valid @RequestBody InsuranceRequest req,
                                          Authentication auth) {
        User user = resolveUser(auth);
        Patient patient = patients.findByUserId(user.getId()).orElse(null);
        if (patient == null) return ResponseEntity.notFound().build();

        if (req.principal()) {
            insurances.clearPrincipalForPatient(patient.getId());
        }

        PatientInsurance ins = new PatientInsurance();
        ins.setPatient(patient);
        ins.setOperadora(req.operadora());
        ins.setNumeroCarteirinha(req.numeroCarteirinha());
        ins.setPlano(req.plano());
        ins.setCodigoAns(req.codigoAns());
        ins.setTitular(req.titular());
        ins.setNomeTitular(req.nomeTitular());
        ins.setPrincipal(req.principal());
        if (req.dataInicio() != null && !req.dataInicio().isBlank())
            ins.setDataInicio(LocalDate.parse(req.dataInicio()));
        if (req.dataValidade() != null && !req.dataValidade().isBlank())
            ins.setDataValidade(LocalDate.parse(req.dataValidade()));

        return ResponseEntity.status(HttpStatus.CREATED).body(InsuranceDto.from(insurances.save(ins)));
    }

    // ── PUT: atualizar convenio ────────────────────────────────────────────────
    @PutMapping("/insurance/{id}")
    @Transactional
    public ResponseEntity<?> updateInsurance(@PathVariable UUID id,
                                              @Valid @RequestBody InsuranceRequest req,
                                              Authentication auth) {
        User user = resolveUser(auth);
        Patient patient = patients.findByUserId(user.getId()).orElse(null);
        if (patient == null) return ResponseEntity.notFound().build();

        return insurances.findByIdAndPatientId(id, patient.getId()).map(ins -> {
            if (req.principal() && !ins.isPrincipal()) {
                insurances.clearPrincipalForPatient(patient.getId());
            }
            ins.setOperadora(req.operadora());
            ins.setNumeroCarteirinha(req.numeroCarteirinha());
            ins.setPlano(req.plano());
            ins.setCodigoAns(req.codigoAns());
            ins.setTitular(req.titular());
            ins.setNomeTitular(req.nomeTitular());
            ins.setPrincipal(req.principal());
            ins.setDataInicio(req.dataInicio() != null && !req.dataInicio().isBlank()
                    ? LocalDate.parse(req.dataInicio()) : null);
            ins.setDataValidade(req.dataValidade() != null && !req.dataValidade().isBlank()
                    ? LocalDate.parse(req.dataValidade()) : null);
            return ResponseEntity.ok(InsuranceDto.from(insurances.save(ins)));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── DELETE: remover convenio ───────────────────────────────────────────────
    @DeleteMapping("/insurance/{id}")
    @Transactional
    public ResponseEntity<Void> removeInsurance(@PathVariable UUID id, Authentication auth) {
        User user = resolveUser(auth);
        Patient patient = patients.findByUserId(user.getId()).orElse(null);
        if (patient == null) return ResponseEntity.notFound().build();

        return insurances.findByIdAndPatientId(id, patient.getId()).map(ins -> {
            insurances.delete(ins);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── POST: definir convenio principal ──────────────────────────────────────
    @PostMapping("/insurance/{id}/set-principal")
    @Transactional
    public ResponseEntity<?> setPrincipal(@PathVariable UUID id, Authentication auth) {
        User user = resolveUser(auth);
        Patient patient = patients.findByUserId(user.getId()).orElse(null);
        if (patient == null) return ResponseEntity.notFound().build();

        return insurances.findByIdAndPatientId(id, patient.getId()).map(ins -> {
            insurances.clearPrincipalForPatient(patient.getId());
            ins.setPrincipal(true);
            return ResponseEntity.ok(InsuranceDto.from(insurances.save(ins)));
        }).orElse(ResponseEntity.notFound().build());
    }
}
