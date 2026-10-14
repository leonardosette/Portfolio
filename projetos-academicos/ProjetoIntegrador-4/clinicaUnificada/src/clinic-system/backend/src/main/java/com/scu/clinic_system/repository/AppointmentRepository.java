package com.scu.clinic_system.repository;

import com.scu.clinic_system.model.Appointment;
import com.scu.clinic_system.model.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {

    @Query("SELECT a FROM Appointment a WHERE a.doctor.user.email = :email AND CAST(a.scheduledAt AS date) = CURRENT_DATE AND a.status != 'CANCELLED' ORDER BY a.scheduledAt ASC")
    List<Appointment> findTodayByDoctorEmail(@Param("email") String email);

    @Query("SELECT a FROM Appointment a WHERE a.doctor.user.email = :email AND a.scheduledAt > CURRENT_TIMESTAMP AND a.status = 'SCHEDULED' ORDER BY a.scheduledAt ASC")
    List<Appointment> findUpcomingByDoctorEmail(@Param("email") String email);

    @Query("SELECT a FROM Appointment a WHERE a.doctor.user.email = :email AND a.status = :status ORDER BY a.scheduledAt DESC")
    List<Appointment> findByDoctorEmailAndStatus(@Param("email") String email, @Param("status") AppointmentStatus status);

    Optional<Appointment> findByIdAndDoctorUserEmail(UUID id, String email);

    long countByDoctorUserEmailAndStatus(String email, AppointmentStatus status);

    List<Appointment> findByPatientIdOrderByScheduledAtDesc(UUID patientId);

    Optional<Appointment> findByIdAndPatientId(UUID id, UUID patientId);

    List<Appointment> findByPatientIdAndStatus(UUID patientId, AppointmentStatus status);

    List<Appointment> findByStatusOrderByScheduledAtAsc(AppointmentStatus status);

    @Query("SELECT a FROM Appointment a WHERE a.doctor.clinic.id = :clinicId AND a.status = :status ORDER BY a.scheduledAt ASC")
    List<Appointment> findByClinicIdAndStatus(@Param("clinicId") UUID clinicId, @Param("status") AppointmentStatus status);
}
