package com.scu.clinic_system.repository;

import com.scu.clinic_system.model.Network;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface NetworkRepository extends JpaRepository<Network, UUID> {
    boolean existsByCnpj(String cnpj);
}
