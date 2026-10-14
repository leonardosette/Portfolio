package com.scu.clinic_system.controller;

import com.scu.clinic_system.model.*;
import com.scu.clinic_system.repository.*;
import com.scu.clinic_system.service.PacientService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reception")
@PreAuthorize("hasAnyRole('RECEPTIONIST','MANAGER','ADMIN','SUPERADMIN')")
public class ReceptionistController {

    private final UserRepository users;
    private final AppointmentRepository appointments;
    private final NotificationRepository notifications;
    private final PacientService pacientService;
    private final PatientRepository patients;
    private final PatientInsuranceRepository insurances;
    private final ConsultationGuiaRepository guias;

    public ReceptionistController(UserRepository users,
                                   AppointmentRepository appointments,
                                   NotificationRepository notifications,
                                   PacientService pacientService,
                                   PatientRepository patients,
                                   PatientInsuranceRepository insurances,
                                   ConsultationGuiaRepository guias) {
        this.users = users;
        this.appointments = appointments;
        this.notifications = notifications;
        this.pacientService = pacientService;
        this.patients = patients;
        this.insurances = insurances;
        this.guias = guias;
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────

    record InsuranceOption(
            String id, String operadora, String numeroCarteirinha,
            String plano, boolean vencido, String dataValidade
    ) {
        static InsuranceOption from(PatientInsurance i) {
            return new InsuranceOption(
                    i.getId().toString(), i.getOperadora(),
                    i.getNumeroCarteirinha(), i.getPlano(),
                    i.isVencido(),
                    i.getDataValidade() != null ? i.getDataValidade().toString() : null
            );
        }
    }

    record PatientInfo(String id, String name, String cpf, String email,
                       List<InsuranceOption> insurances) {}

    record DoctorInfo(String id, String name, String specialtyName) {}

    record InsuranceUsedSummary(String id, String operadora, String plano) {}

    record PendingAppointmentDto(
            String id, String scheduledAt, String type, String clinicName,
            PatientInfo patient, DoctorInfo doctor, InsuranceUsedSummary insuranceUsed
    ) {
        static PendingAppointmentDto from(Appointment a, List<PatientInsurance> patientInsurances) {
            InsuranceUsedSummary insUsed = a.getInsuranceUsed() != null
                    ? new InsuranceUsedSummary(
                            a.getInsuranceUsed().getId().toString(),
                            a.getInsuranceUsed().getOperadora(),
                            a.getInsuranceUsed().getPlano())
                    : null;
            return new PendingAppointmentDto(
                    a.getId().toString(), a.getScheduledAt().toString(),
                    a.getType().name(), a.getClinic().getName(),
                    new PatientInfo(a.getPatient().getId().toString(),
                            a.getPatient().getName(), a.getPatient().getCpf(),
                            a.getPatient().getEmail(),
                            patientInsurances.stream().map(InsuranceOption::from).toList()),
                    new DoctorInfo(a.getDoctor().getId().toString(),
                            a.getDoctor().getUser().getName(),
                            a.getDoctor().getSpecialty().getName()),
                    insUsed
            );
        }
    }

    record GuiaDto(
            String id,
            String numeroGuia,
            String status,
            String appointmentId,
            String scheduledAt,
            String clinicName,
            // paciente
            String patientName, String patientCpf, String patientEmail, String patientBirthDate,
            // convênio
            String operadora, String numeroCarteirinha, String plano, String codigoAns,
            // médico
            String doctorName, String specialtyName,
            // tipo de consulta
            String appointmentType,
            // valores
            String valorApresentado, String valorAprovado, String valorGlosado,
            // outros
            String codigoAutorizacao, String motivoGlosa, String observacoes,
            String createdAt, String assinadaEm, String enviadaEm, String resolvidaEm
    ) {
        static GuiaDto from(ConsultationGuia g) {
            Appointment a = g.getAppointment();
            PatientInsurance ins = g.getInsurance();
            Doctor d = a.getDoctor();
            User pat = a.getPatient();
            return new GuiaDto(
                    g.getId().toString(),
                    g.getNumeroGuia(),
                    g.getStatus().name(),
                    a.getId().toString(),
                    a.getScheduledAt().toString(),
                    a.getClinic().getName(),
                    pat.getName(), pat.getCpf(), pat.getEmail(),
                    pat.getBirthDate() != null ? pat.getBirthDate().toString() : null,
                    ins.getOperadora(), ins.getNumeroCarteirinha(), ins.getPlano(), ins.getCodigoAns(),
                    d.getUser().getName(), d.getSpecialty().getName(),
                    a.getType().name(),
                    g.getValorApresentado() != null ? g.getValorApresentado().toPlainString() : null,
                    g.getValorAprovado()    != null ? g.getValorAprovado().toPlainString()    : null,
                    g.getValorGlosado()     != null ? g.getValorGlosado().toPlainString()     : null,
                    g.getCodigoAutorizacao(), g.getMotivoGlosa(), g.getObservacoes(),
                    g.getCreatedAt().toString(),
                    g.getAssinadaEm()  != null ? g.getAssinadaEm().toString()  : null,
                    g.getEnviadaEm()   != null ? g.getEnviadaEm().toString()   : null,
                    g.getResolvidaEm() != null ? g.getResolvidaEm().toString() : null
            );
        }
    }

    record ConfirmRequest(UUID insuranceId) {}
    record RejectionRequest(String reason) {}
    record AssinarRequest(String observacoes) {}
    record EnviarRequest(String codigoAutorizacao, String valorApresentado, String observacoes) {}
    record ResolverRequest(String resultado, String valorAprovado, String valorGlosado, String motivoGlosa) {}

    // ── helpers ───────────────────────────────────────────────────────────────

    private List<PatientInsurance> getActiveInsurancesForAppointment(Appointment a) {
        return patients.findByUserId(a.getPatient().getId())
                .map(p -> insurances.findByPatientIdAndAtivoTrue(p.getId()))
                .orElse(List.of());
    }

    private String gerarNumeroGuia(Appointment a) {
        String ano = String.valueOf(a.getScheduledAt().getYear());
        String suffix = a.getId().toString().replace("-", "").substring(0, 8).toUpperCase();
        return "GUIA-" + ano + "-" + suffix;
    }

    private String formatDate(LocalDateTime dt) {
        return dt.format(DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH:mm"));
    }

    // ── GET: listar receptionistas ────────────────────────────────────────────
    @GetMapping("/staff")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','SUPERADMIN')")
    public List<User> listReceptionists() {
        return users.findAll().stream()
                .filter(u -> u.getRole() == Role.receptionist)
                .toList();
    }

    // ── GET: consultas pendentes de aprovação ─────────────────────────────────
    @GetMapping("/appointments/pending")
    @Transactional(readOnly = true)
    public List<PendingAppointmentDto> listPending(Authentication auth) {
        User currentUser = users.findByEmail(auth.getName()).orElse(null);
        List<Appointment> pending;
        if (currentUser != null && currentUser.getRole() == Role.manager && currentUser.getClinic() != null) {
            pending = appointments.findByClinicIdAndStatus(currentUser.getClinic().getId(), AppointmentStatus.PENDING);
        } else {
            pending = appointments.findByStatusOrderByScheduledAtAsc(AppointmentStatus.PENDING);
        }
        return pending.stream()
                .map(a -> PendingAppointmentDto.from(a, getActiveInsurancesForAppointment(a)))
                .toList();
    }

    // ── GET: contagem de pendentes ────────────────────────────────────────────
    @GetMapping("/appointments/pending/count")
    public long pendingCount(Authentication auth) {
        User currentUser = users.findByEmail(auth.getName()).orElse(null);
        if (currentUser != null && currentUser.getRole() == Role.manager && currentUser.getClinic() != null) {
            return appointments.findByClinicIdAndStatus(currentUser.getClinic().getId(), AppointmentStatus.PENDING).size();
        }
        return appointments.findByStatusOrderByScheduledAtAsc(AppointmentStatus.PENDING).size();
    }

    // ── POST: confirmar agendamento ───────────────────────────────────────────
    @PostMapping("/appointments/{id}/confirm")
    @Transactional
    public ResponseEntity<?> confirmAppointment(@PathVariable UUID id,
                                                 @RequestBody(required = false) ConfirmRequest req) {
        return appointments.findById(id).map(appt -> {
            if (appt.getStatus() != AppointmentStatus.PENDING)
                return ResponseEntity.badRequest().body("Consulta não está com status PENDING.");

            String insuranceDetail = "";
            PatientInsurance selectedIns = null;

            if (req != null && req.insuranceId() != null) {
                PatientInsurance ins = insurances.findById(req.insuranceId()).orElse(null);
                if (ins == null)
                    return ResponseEntity.badRequest().body("Convênio não encontrado.");

                Patient apptPatient = patients.findByUserId(appt.getPatient().getId()).orElse(null);
                if (apptPatient == null || !ins.getPatient().getId().equals(apptPatient.getId()))
                    return ResponseEntity.badRequest().body("Convênio não pertence a este paciente.");

                if (ins.isVencido())
                    return ResponseEntity.badRequest().body(
                            "O convênio " + ins.getOperadora() + " está vencido desde "
                            + ins.getDataValidade() + ". Selecione outro ou confirme como particular.");

                appt.setInsuranceUsed(ins);
                selectedIns = ins;
                insuranceDetail = " pelo convênio " + ins.getOperadora()
                        + (ins.getPlano() != null ? " (" + ins.getPlano() + ")" : "");
            }

            appt.setStatus(AppointmentStatus.SCHEDULED);
            appointments.save(appt);

            // Gera a Guia de Consulta automaticamente quando há convênio
            if (selectedIns != null) {
                ConsultationGuia guia = new ConsultationGuia();
                guia.setAppointment(appt);
                guia.setInsurance(selectedIns);
                guia.setNumeroGuia(gerarNumeroGuia(appt));
                guias.save(guia);
            }

            pacientService.sendNotification(appt.getPatient(),
                    "Consulta confirmada!",
                    "Sua consulta com " + appt.getDoctor().getUser().getName() +
                    " foi confirmada para " + formatDate(appt.getScheduledAt()) + insuranceDetail + ".");

            return ResponseEntity.ok(PendingAppointmentDto.from(appt, getActiveInsurancesForAppointment(appt)));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── POST: recusar agendamento ─────────────────────────────────────────────
    @PostMapping("/appointments/{id}/reject")
    @Transactional
    public ResponseEntity<?> rejectAppointment(@PathVariable UUID id,
                                                @RequestBody(required = false) RejectionRequest req) {
        return appointments.findById(id).map(appt -> {
            if (appt.getStatus() != AppointmentStatus.PENDING)
                return ResponseEntity.badRequest().body("Consulta não está com status PENDING.");

            appt.setStatus(AppointmentStatus.CANCELLED);
            appointments.save(appt);

            String reason = req != null && req.reason() != null && !req.reason().isBlank()
                    ? " Motivo: " + req.reason() : "";
            pacientService.sendNotification(appt.getPatient(),
                    "Solicitação de consulta recusada",
                    "Sua consulta com " + appt.getDoctor().getUser().getName() +
                    " não pôde ser agendada." + reason);

            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    // ═════════════════════════════════════════════════════════════════════════
    // GUIAS DE CONVÊNIO — Ciclo de vida completo
    // ═════════════════════════════════════════════════════════════════════════

    // ── GET: listar todas as guias ────────────────────────────────────────────
    @GetMapping("/guias")
    @Transactional(readOnly = true)
    public List<GuiaDto> listGuias(@RequestParam(required = false) String status) {
        List<ConsultationGuia> result;
        if (status != null && !status.isBlank()) {
            try {
                result = guias.findByStatusOrderByCreatedAtDesc(GuiaStatus.valueOf(status.toUpperCase()));
            } catch (IllegalArgumentException e) {
                return List.of();
            }
        } else {
            result = guias.findAllOrderByCreatedAtDesc();
        }
        return result.stream().map(GuiaDto::from).toList();
    }

    // ── GET: contagem de guias aguardando assinatura ──────────────────────────
    @GetMapping("/guias/count")
    public long guiasCount() {
        return guias.countByStatus(GuiaStatus.GERADA) + guias.countByStatus(GuiaStatus.ASSINADA);
    }

    // ── GET: detalhe de uma guia (documento imprimível) ──────────────────────
    @GetMapping("/guias/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<GuiaDto> getGuia(@PathVariable UUID id) {
        return guias.findById(id)
                .map(g -> ResponseEntity.ok(GuiaDto.from(g)))
                .orElse(ResponseEntity.notFound().build());
    }

    // ── POST: marcar guia como assinada pelo paciente ─────────────────────────
    @PostMapping("/guias/{id}/assinar")
    @Transactional
    public ResponseEntity<?> assinarGuia(@PathVariable UUID id,
                                          @RequestBody(required = false) AssinarRequest req) {
        return guias.findById(id).map(g -> {
            if (g.getStatus() != GuiaStatus.GERADA)
                return ResponseEntity.badRequest().body("Guia não está no status GERADA.");

            g.setStatus(GuiaStatus.ASSINADA);
            g.setAssinadaEm(LocalDateTime.now());
            if (req != null && req.observacoes() != null) g.setObservacoes(req.observacoes());
            return ResponseEntity.ok(GuiaDto.from(guias.save(g)));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── POST: marcar guia como enviada ao convênio ────────────────────────────
    @PostMapping("/guias/{id}/enviar")
    @Transactional
    public ResponseEntity<?> enviarGuia(@PathVariable UUID id,
                                         @RequestBody(required = false) EnviarRequest req) {
        return guias.findById(id).map(g -> {
            if (g.getStatus() != GuiaStatus.ASSINADA)
                return ResponseEntity.badRequest().body("A guia precisa estar ASSINADA antes de ser enviada ao convênio.");

            g.setStatus(GuiaStatus.ENVIADA);
            g.setEnviadaEm(LocalDateTime.now());
            if (req != null) {
                if (req.codigoAutorizacao() != null) g.setCodigoAutorizacao(req.codigoAutorizacao());
                if (req.valorApresentado() != null && !req.valorApresentado().isBlank()) {
                    try { g.setValorApresentado(new BigDecimal(req.valorApresentado())); } catch (Exception ignored) {}
                }
                if (req.observacoes() != null) g.setObservacoes(req.observacoes());
            }

            // Notifica o paciente
            pacientService.sendNotification(
                    g.getAppointment().getPatient(),
                    "Guia enviada ao convênio",
                    "A guia da sua consulta de " + formatDate(g.getAppointment().getScheduledAt())
                    + " foi enviada à operadora " + g.getInsurance().getOperadora() + " para análise."
            );

            return ResponseEntity.ok(GuiaDto.from(guias.save(g)));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── POST: registrar resultado (aprovada / glosada) ────────────────────────
    @PostMapping("/guias/{id}/resolver")
    @Transactional
    public ResponseEntity<?> resolverGuia(@PathVariable UUID id,
                                           @RequestBody ResolverRequest req) {
        return guias.findById(id).map(g -> {
            if (g.getStatus() != GuiaStatus.ENVIADA)
                return ResponseEntity.badRequest().body("A guia precisa estar ENVIADA para registrar o resultado.");

            GuiaStatus novoStatus;
            try {
                novoStatus = GuiaStatus.valueOf(req.resultado().toUpperCase());
            } catch (Exception e) {
                return ResponseEntity.badRequest().body("Resultado inválido. Use: APROVADA, GLOSADA_PARCIAL ou GLOSADA_TOTAL.");
            }
            if (novoStatus != GuiaStatus.APROVADA && novoStatus != GuiaStatus.GLOSADA_PARCIAL
                    && novoStatus != GuiaStatus.GLOSADA_TOTAL)
                return ResponseEntity.badRequest().body("Resultado inválido. Use: APROVADA, GLOSADA_PARCIAL ou GLOSADA_TOTAL.");

            g.setStatus(novoStatus);
            g.setResolvidaEm(LocalDateTime.now());
            if (req.valorAprovado() != null && !req.valorAprovado().isBlank()) {
                try { g.setValorAprovado(new BigDecimal(req.valorAprovado())); } catch (Exception ignored) {}
            }
            if (req.valorGlosado() != null && !req.valorGlosado().isBlank()) {
                try { g.setValorGlosado(new BigDecimal(req.valorGlosado())); } catch (Exception ignored) {}
            }
            if (req.motivoGlosa() != null) g.setMotivoGlosa(req.motivoGlosa());

            // Notifica o paciente apenas em caso de glosa total (impacto direto para ele)
            if (novoStatus == GuiaStatus.GLOSADA_TOTAL) {
                pacientService.sendNotification(
                        g.getAppointment().getPatient(),
                        "Atenção: cobrança ao convênio recusada",
                        "O convênio " + g.getInsurance().getOperadora()
                        + " recusou a cobrança da sua consulta de "
                        + formatDate(g.getAppointment().getScheduledAt())
                        + ". Entre em contato com a recepção para mais informações."
                );
            }

            return ResponseEntity.ok(GuiaDto.from(guias.save(g)));
        }).orElse(ResponseEntity.notFound().build());
    }
}
