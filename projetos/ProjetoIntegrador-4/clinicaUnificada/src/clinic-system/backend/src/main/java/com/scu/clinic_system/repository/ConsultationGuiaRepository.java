package com.scu.clinic_system.repository;

import com.scu.clinic_system.model.ConsultationGuia;
import com.scu.clinic_system.model.GuiaStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConsultationGuiaRepository extends JpaRepository<ConsultationGuia, UUID> {

    Optional<ConsultationGuia> findByAppointmentId(UUID appointmentId);

    List<ConsultationGuia> findByStatusOrderByCreatedAtDesc(GuiaStatus status);

    @Query("SELECT g FROM ConsultationGuia g ORDER BY g.createdAt DESC")
    List<ConsultationGuia> findAllOrderByCreatedAtDesc();

    @Query("SELECT g FROM ConsultationGuia g WHERE g.insurance.patient.id = :patientId ORDER BY g.createdAt DESC")
    List<ConsultationGuia> findByPatientId(@Param("patientId") UUID patientId);

    long countByStatus(GuiaStatus status);
}
