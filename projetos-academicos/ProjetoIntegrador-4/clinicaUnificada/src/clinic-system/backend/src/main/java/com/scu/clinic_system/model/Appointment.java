package com.scu.clinic_system.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "appointment", indexes = {
        @Index(name = "idx_appt_doctor",   columnList = "doctor_id"),
        @Index(name = "idx_appt_patient",  columnList = "patient_id"),
        @Index(name = "idx_appt_status",   columnList = "status"),
        @Index(name = "idx_appt_scheduled",columnList = "scheduled_at")
})
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinic_id", nullable = false)
    private Clinic clinic;

    @NotNull
    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AppointmentStatus status = AppointmentStatus.SCHEDULED;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AppointmentType type = AppointmentType.FIRST_VISIT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "insurance_id")
    private PatientInsurance insuranceUsed;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public UUID getId() { return id; }

    public User getPatient() { return patient; }
    public void setPatient(User patient) { this.patient = patient; }

    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }

    public Clinic getClinic() { return clinic; }
    public void setClinic(Clinic clinic) { this.clinic = clinic; }

    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }

    public AppointmentStatus getStatus() { return status; }
    public void setStatus(AppointmentStatus status) { this.status = status; }

    public AppointmentType getType() { return type; }
    public void setType(AppointmentType type) { this.type = type; }

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }

    public PatientInsurance getInsuranceUsed() { return insuranceUsed; }
    public void setInsuranceUsed(PatientInsurance insuranceUsed) { this.insuranceUsed = insuranceUsed; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
