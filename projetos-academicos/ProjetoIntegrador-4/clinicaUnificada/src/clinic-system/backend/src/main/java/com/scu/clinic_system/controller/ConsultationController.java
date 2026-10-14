package com.scu.clinic_system.controller;

import com.scu.clinic_system.model.*;
import com.scu.clinic_system.repository.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/doctor")
@PreAuthorize("hasRole('DOCTOR')")
public class ConsultationController {

    private final AppointmentRepository appointments;
    private final ConsultationRecordRepository records;
    private final DoctorRepository doctors;
    private final UserRepository users;
    private final ClinicRepository clinics;

    public ConsultationController(AppointmentRepository appointments,
                                   ConsultationRecordRepository records,
                                   DoctorRepository doctors,
                                   UserRepository users,
                                   ClinicRepository clinics) {
        this.appointments = appointments;
        this.records = records;
        this.doctors = doctors;
        this.users = users;
        this.clinics = clinics;
    }

    // ── DTOs ──────────────────────────────────────────────────────────────

    record PatientDto(String id, String name, String cpf, String email, String birthDate, int age) {}

    record PrescriptionItemDto(String id, String medicationName, String dosage, String duration, String notes) {}

    record AppointmentDto(
            String id, String status, String type, String scheduledAt,
            PatientDto patient, String clinicName,
            String chiefComplaint, String personalHistory, String physicalExam,
            String diagnosis, String cid10, String treatment, String notes,
            List<PrescriptionItemDto> prescriptionItems
    ) {}

    record WalkInRequest(
            @NotBlank String patientId,
            AppointmentType type
    ) {}

    record RecordRequest(
            String chiefComplaint, String personalHistory, String physicalExam,
            String diagnosis, String cid10, String treatment, String notes,
            List<PrescriptionItemRequest> prescriptionItems
    ) {}

    record PrescriptionItemRequest(String medicationName, String dosage, String duration, String notes) {}

    // ── helpers ───────────────────────────────────────────────────────────

    private PatientDto toPatientDto(User u) {
        int age = u.getBirthDate() != null ? Period.between(u.getBirthDate(), LocalDate.now()).getYears() : 0;
        return new PatientDto(u.getId().toString(), u.getName(), u.getCpf(), u.getEmail(),
                u.getBirthDate() != null ? u.getBirthDate().toString() : null, age);
    }

    private AppointmentDto toDto(Appointment a) {
        ConsultationRecord rec = records.findByAppointmentId(a.getId()).orElse(null);
        List<PrescriptionItemDto> items = rec == null ? List.of() :
                rec.getPrescriptionItems().stream()
                        .map(i -> new PrescriptionItemDto(i.getId().toString(),
                                i.getMedicationName(), i.getDosage(), i.getDuration(), i.getNotes()))
                        .toList();
        return new AppointmentDto(
                a.getId().toString(),
                a.getStatus().name(),
                a.getType().name(),
                a.getScheduledAt().toString(),
                toPatientDto(a.getPatient()),
                a.getClinic().getName(),
                rec == null ? null : rec.getChiefComplaint(),
                rec == null ? null : rec.getPersonalHistory(),
                rec == null ? null : rec.getPhysicalExam(),
                rec == null ? null : rec.getDiagnosis(),
                rec == null ? null : rec.getCid10(),
                rec == null ? null : rec.getTreatment(),
                rec == null ? null : rec.getNotes(),
                items
        );
    }

    private Doctor resolveDoctor(Authentication auth) {
        return doctors.findByUserEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Médico não encontrado."));
    }

    // ── GET: agenda de hoje ────────────────────────────────────────────────
    @GetMapping("/consultations/today")
    @Transactional(readOnly = true)
    public List<AppointmentDto> today(Authentication auth) {
        return appointments.findTodayByDoctorEmail(auth.getName())
                .stream().map(this::toDto).toList();
    }

    // ── GET: próximas consultas agendadas (futuras) ────────────────────────
    @GetMapping("/consultations/upcoming")
    @Transactional(readOnly = true)
    public List<AppointmentDto> upcoming(Authentication auth) {
        return appointments.findUpcomingByDoctorEmail(auth.getName())
                .stream().map(this::toDto).toList();
    }

    // ── GET: buscar pacientes ──────────────────────────────────────────────
    @GetMapping("/patients/search")
    public List<PatientDto> searchPatients(@RequestParam String q) {
        if (q == null || q.trim().length() < 2) return List.of();
        return users.searchByRoleAndQuery(Role.patient, q.trim())
                .stream().map(this::toPatientDto).toList();
    }

    // ── GET: detalhes de uma consulta ──────────────────────────────────────
    @GetMapping("/consultations/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<AppointmentDto> get(@PathVariable UUID id, Authentication auth) {
        return appointments.findByIdAndDoctorUserEmail(id, auth.getName())
                .map(a -> ResponseEntity.ok(toDto(a)))
                .orElse(ResponseEntity.notFound().build());
    }

    // ── GET: KPIs do overview ──────────────────────────────────────────────
    record OverviewDto(long todayTotal, long todayCompleted, long todayPending, AppointmentDto nextPending) {}

    @GetMapping("/consultations/overview")
    @Transactional(readOnly = true)
    public OverviewDto overview(Authentication auth) {
        List<Appointment> today = appointments.findTodayByDoctorEmail(auth.getName());
        long completed = today.stream().filter(a -> a.getStatus() == AppointmentStatus.COMPLETED).count();
        long pending   = today.stream().filter(a -> a.getStatus() != AppointmentStatus.COMPLETED
                                                 && a.getStatus() != AppointmentStatus.CANCELLED).count();
        Appointment next = today.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.SCHEDULED || a.getStatus() == AppointmentStatus.IN_PROGRESS)
                .findFirst().orElse(null);
        return new OverviewDto(today.size(), completed, pending, next == null ? null : toDto(next));
    }

    // ── POST: iniciar consulta avulsa (walk-in) ────────────────────────────
    @PostMapping("/consultations/walkin")
    @Transactional
    public ResponseEntity<?> walkIn(@Valid @RequestBody WalkInRequest req, Authentication auth) {
        Doctor doctor = resolveDoctor(auth);
        User patient = users.findById(UUID.fromString(req.patientId()))
                .orElseThrow(() -> new RuntimeException("Paciente não encontrado."));
        if (patient.getRole() != Role.patient)
            return ResponseEntity.badRequest().body("Usuário não é um paciente.");

        Appointment appt = new Appointment();
        appt.setPatient(patient);
        appt.setDoctor(doctor);
        appt.setClinic(doctor.getClinic());
        appt.setScheduledAt(LocalDateTime.now());
        appt.setStatus(AppointmentStatus.IN_PROGRESS);
        appt.setType(req.type() != null ? req.type() : AppointmentType.FIRST_VISIT);
        appt.setCreatedBy(doctor.getUser());
        Appointment saved = appointments.save(appt);

        // Cria prontuário vazio imediatamente
        ConsultationRecord rec = new ConsultationRecord();
        rec.setAppointment(saved);
        records.save(rec);

        return ResponseEntity.ok(toDto(saved));
    }

    // ── POST: iniciar consulta agendada ────────────────────────────────────
    @PostMapping("/consultations/{id}/start")
    @Transactional
    public ResponseEntity<?> start(@PathVariable UUID id, Authentication auth) {
        Appointment appt = appointments.findByIdAndDoctorUserEmail(id, auth.getName())
                .orElse(null);
        if (appt == null) return ResponseEntity.notFound().build();
        if (appt.getStatus() != AppointmentStatus.SCHEDULED)
            return ResponseEntity.badRequest().body("Consulta não está com status SCHEDULED.");

        appt.setStatus(AppointmentStatus.IN_PROGRESS);
        appointments.save(appt);

        if (records.findByAppointmentId(id).isEmpty()) {
            ConsultationRecord rec = new ConsultationRecord();
            rec.setAppointment(appt);
            records.save(rec);
        }

        return ResponseEntity.ok(toDto(appt));
    }

    // ── POST: salvar rascunho do prontuário ───────────────────────────────
    @PostMapping("/consultations/{id}/save")
    @Transactional
    public ResponseEntity<?> saveRecord(@PathVariable UUID id,
                                         @RequestBody RecordRequest req,
                                         Authentication auth) {
        Appointment appt = appointments.findByIdAndDoctorUserEmail(id, auth.getName())
                .orElse(null);
        if (appt == null) return ResponseEntity.notFound().build();
        if (appt.getStatus() == AppointmentStatus.COMPLETED)
            return ResponseEntity.badRequest().body("Consulta já foi finalizada.");

        ConsultationRecord rec = records.findByAppointmentId(id)
                .orElseGet(() -> { ConsultationRecord r = new ConsultationRecord(); r.setAppointment(appt); return r; });

        applyRecord(rec, req);
        records.save(rec);
        return ResponseEntity.ok(toDto(appt));
    }

    // ── POST: finalizar consulta ───────────────────────────────────────────
    @PostMapping("/consultations/{id}/finalize")
    @Transactional
    public ResponseEntity<?> finalize(@PathVariable UUID id,
                                       @RequestBody RecordRequest req,
                                       Authentication auth) {
        Appointment appt = appointments.findByIdAndDoctorUserEmail(id, auth.getName())
                .orElse(null);
        if (appt == null) return ResponseEntity.notFound().build();
        if (appt.getStatus() == AppointmentStatus.COMPLETED)
            return ResponseEntity.badRequest().body("Consulta já foi finalizada.");

        ConsultationRecord rec = records.findByAppointmentId(id)
                .orElseGet(() -> { ConsultationRecord r = new ConsultationRecord(); r.setAppointment(appt); return r; });

        applyRecord(rec, req);
        records.save(rec);

        appt.setStatus(AppointmentStatus.COMPLETED);
        appointments.save(appt);

        return ResponseEntity.ok(toDto(appt));
    }

    // ── POST: cancelar consulta ────────────────────────────────────────────
    @PostMapping("/consultations/{id}/cancel")
    @Transactional
    public ResponseEntity<?> cancel(@PathVariable UUID id, Authentication auth) {
        Appointment appt = appointments.findByIdAndDoctorUserEmail(id, auth.getName())
                .orElse(null);
        if (appt == null) return ResponseEntity.notFound().build();
        if (appt.getStatus() == AppointmentStatus.COMPLETED)
            return ResponseEntity.badRequest().body("Consulta já foi finalizada.");

        appt.setStatus(AppointmentStatus.CANCELLED);
        appointments.save(appt);
        return ResponseEntity.ok(toDto(appt));
    }

    // ── helper: aplica dados do request no prontuário ─────────────────────
    private void applyRecord(ConsultationRecord rec, RecordRequest req) {
        if (req.chiefComplaint() != null) rec.setChiefComplaint(req.chiefComplaint());
        if (req.personalHistory() != null) rec.setPersonalHistory(req.personalHistory());
        if (req.physicalExam() != null) rec.setPhysicalExam(req.physicalExam());
        if (req.diagnosis() != null) rec.setDiagnosis(req.diagnosis());
        if (req.cid10() != null) rec.setCid10(req.cid10());
        if (req.treatment() != null) rec.setTreatment(req.treatment());
        if (req.notes() != null) rec.setNotes(req.notes());
        rec.setUpdatedAt(LocalDateTime.now());

        if (req.prescriptionItems() != null) {
            rec.getPrescriptionItems().clear();
            for (PrescriptionItemRequest item : req.prescriptionItems()) {
                if (item.medicationName() == null || item.medicationName().isBlank()) continue;
                PrescriptionItem pi = new PrescriptionItem();
                pi.setRecord(rec);
                pi.setMedicationName(item.medicationName());
                pi.setDosage(item.dosage());
                pi.setDuration(item.duration());
                pi.setNotes(item.notes());
                rec.getPrescriptionItems().add(pi);
            }
        }
    }
}
