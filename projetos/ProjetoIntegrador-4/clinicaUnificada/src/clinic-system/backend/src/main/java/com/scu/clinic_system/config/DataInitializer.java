package com.scu.clinic_system.config;

import com.scu.clinic_system.model.Role;
import com.scu.clinic_system.model.User;
import com.scu.clinic_system.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@scu.local}")
    private String adminEmail;

    @Value("${app.admin.password:Admin#123}")
    private String adminPassword;

    @Value("${app.admin.name:Administrador SCU}")
    private String adminName;

    @Value("${app.admin.cpf:00000000000}")
    private String adminCpf;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.existsByEmail(adminEmail)) {
            log.info("SCU >> Super Admin já existe: {}", adminEmail);
            return;
        }

        User superAdmin = new User();
        superAdmin.setName(adminName);
        superAdmin.setEmail(adminEmail);
        superAdmin.setCpf(adminCpf);
        superAdmin.setBirthDate(LocalDate.of(1990, 1, 1));
        superAdmin.setPassword(passwordEncoder.encode(adminPassword));
        superAdmin.setRole(Role.superadmin);
        superAdmin.setActive(true);
        userRepository.save(superAdmin);

        log.info("SCU >> Super Admin da plataforma criado automaticamente: {}", adminEmail);
    }
}
