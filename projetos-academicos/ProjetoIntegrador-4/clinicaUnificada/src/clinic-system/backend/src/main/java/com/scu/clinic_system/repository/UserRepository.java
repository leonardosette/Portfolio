package com.scu.clinic_system.repository;

import com.scu.clinic_system.model.Role;
import com.scu.clinic_system.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByCpf(String cpf);
    boolean existsByEmail(String email);
    boolean existsByCpf(String cpf);

    @Query("SELECT u FROM User u WHERE u.role = :role AND (LOWER(u.name) LIKE LOWER(CONCAT('%', :q, '%')) OR u.cpf LIKE CONCAT('%', :q, '%'))")
    List<User> searchByRoleAndQuery(@Param("role") Role role, @Param("q") String q);
}
