package com.scu.clinic_system.repository;

import com.scu.clinic_system.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DoctorRepository extends JpaRepository<Doctor, UUID> {
    Optional<Doctor> findByUserId(UUID userId);
    List<Doctor> findByClinicId(UUID clinicId);

    @Query("SELECT d FROM Doctor d WHERE d.user.email = :email")
    Optional<Doctor> findByUserEmail(@Param("email") String email);
    List<Doctor> findBySpecialtyId(UUID specialtyId);
    boolean existsByCouncilTypeAndCouncilNumberAndCouncilState(
            com.scu.clinic_system.model.CouncilType type, String number, String state);

    @Query("SELECT d FROM Doctor d WHERE d.clinic.id = :clinicId AND d.specialty.id = :specialtyId AND d.profileEnabled = true")
    List<Doctor> findActiveByClinicAndSpecialty(@Param("clinicId") UUID clinicId, @Param("specialtyId") UUID specialtyId);

    @Query("SELECT d FROM Doctor d WHERE d.clinic.id = :clinicId AND d.profileEnabled = true")
    List<Doctor> findActiveByClinic(@Param("clinicId") UUID clinicId);
}
