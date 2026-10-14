package com.scu.clinic_system.repository;

import com.scu.clinic_system.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PatientRepository extends JpaRepository<Patient, UUID> {

    Optional<Patient> findByUserId(UUID userId);

    @Query("SELECT p FROM Patient p WHERE p.user.email = :email")
    Optional<Patient> findByUserEmail(@Param("email") String email);

    boolean existsByUserId(UUID userId);

    @Query("SELECT p FROM Patient p WHERE " +
           "LOWER(p.user.name) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "p.user.cpf LIKE CONCAT('%', :q, '%') OR " +
           "LOWER(p.user.email) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Patient> searchByQuery(@Param("q") String q);
}
