package com.scu.clinic_system.repository;

import com.scu.clinic_system.model.PatientInsurance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PatientInsuranceRepository extends JpaRepository<PatientInsurance, UUID> {

    List<PatientInsurance> findByPatientIdOrderByPrincipalDescOperadoraAsc(UUID patientId);

    List<PatientInsurance> findByPatientIdAndAtivoTrue(UUID patientId);

    Optional<PatientInsurance> findByIdAndPatientId(UUID id, UUID patientId);

    @Modifying
    @Query("UPDATE PatientInsurance i SET i.principal = false WHERE i.patient.id = :patientId")
    void clearPrincipalForPatient(@Param("patientId") UUID patientId);
}
