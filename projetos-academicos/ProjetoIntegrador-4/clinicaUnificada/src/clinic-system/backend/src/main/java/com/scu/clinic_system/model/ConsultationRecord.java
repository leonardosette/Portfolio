package com.scu.clinic_system.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "consultation_record")
public class ConsultationRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false, unique = true)
    private Appointment appointment;

    @Column(name = "chief_complaint", columnDefinition = "TEXT")
    private String chiefComplaint;

    @Column(name = "personal_history", columnDefinition = "TEXT")
    private String personalHistory;

    @Column(name = "physical_exam", columnDefinition = "TEXT")
    private String physicalExam;

    @Column(columnDefinition = "TEXT")
    private String diagnosis;

    @Column(name = "cid10", length = 20)
    private String cid10;

    @Column(columnDefinition = "TEXT")
    private String treatment;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "record", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PrescriptionItem> prescriptionItems = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public UUID getId() { return id; }

    public Appointment getAppointment() { return appointment; }
    public void setAppointment(Appointment appointment) { this.appointment = appointment; }

    public String getChiefComplaint() { return chiefComplaint; }
    public void setChiefComplaint(String chiefComplaint) { this.chiefComplaint = chiefComplaint; }

    public String getPersonalHistory() { return personalHistory; }
    public void setPersonalHistory(String personalHistory) { this.personalHistory = personalHistory; }

    public String getPhysicalExam() { return physicalExam; }
    public void setPhysicalExam(String physicalExam) { this.physicalExam = physicalExam; }

    public String getDiagnosis() { return diagnosis; }
    public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }

    public String getCid10() { return cid10; }
    public void setCid10(String cid10) { this.cid10 = cid10; }

    public String getTreatment() { return treatment; }
    public void setTreatment(String treatment) { this.treatment = treatment; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public List<PrescriptionItem> getPrescriptionItems() { return prescriptionItems; }
    public void setPrescriptionItems(List<PrescriptionItem> items) { this.prescriptionItems = items; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
