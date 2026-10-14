package com.scu.clinic_system.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

@Entity
@Table(name = "prescription_item")
public class PrescriptionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "record_id", nullable = false)
    private ConsultationRecord record;

    @NotBlank
    @Column(name = "medication_name", nullable = false, length = 300)
    private String medicationName;

    @Column(length = 300)
    private String dosage;

    @Column(length = 100)
    private String duration;

    @Column(columnDefinition = "TEXT")
    private String notes;

    public UUID getId() { return id; }

    public ConsultationRecord getRecord() { return record; }
    public void setRecord(ConsultationRecord record) { this.record = record; }

    public String getMedicationName() { return medicationName; }
    public void setMedicationName(String medicationName) { this.medicationName = medicationName; }

    public String getDosage() { return dosage; }
    public void setDosage(String dosage) { this.dosage = dosage; }

    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
