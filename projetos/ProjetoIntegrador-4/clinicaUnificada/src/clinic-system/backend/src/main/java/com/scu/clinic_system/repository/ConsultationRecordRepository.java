package com.scu.clinic_system.repository;

import com.scu.clinic_system.model.ConsultationRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ConsultationRecordRepository extends JpaRepository<ConsultationRecord, UUID> {
    Optional<ConsultationRecord> findByAppointmentId(UUID appointmentId);
}
