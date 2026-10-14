package com.scu.clinic_system.config;

import com.scu.clinic_system.repository.UserRepository;
import com.scu.clinic_system.security.JwtAuthenticationFilter;
import com.scu.clinic_system.security.JwtService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpStatus;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService(UserRepository repo) {
        return username -> repo.findByEmail(username)
                .map(u -> User.builder()
                        .username(u.getEmail())
                        .password(u.getPassword())
                        // Role.admin -> "ROLE_ADMIN", Role.manager -> "ROLE_MANAGER", etc.
                        .authorities("ROLE_" + u.getRole().name().toUpperCase())
                        .accountLocked(!u.isActive())
                        .build())
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));
    }

    @Bean
    public AuthenticationManager authManager(UserDetailsService uds, PasswordEncoder enc) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(uds);
        provider.setPasswordEncoder(enc);
        return new ProviderManager(provider);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtService jwt, UserRepository repo) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(
                        new JwtAuthenticationFilter(jwt, repo),
                        org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class)
                .authorizeHttpRequests(auth -> auth
                        // Rotas publicas
                        .requestMatchers("/api/auth/login").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/pacients/register").permitAll()

                        // Plataforma — apenas Super Admin
                        .requestMatchers("/api/platform/**").hasRole("SUPERADMIN")

                        // Rotas restritas por role
                        .requestMatchers("/api/admin/**").hasAnyRole("SUPERADMIN", "ADMIN", "MANAGER")
                        .requestMatchers("/api/doctor/**").hasRole("DOCTOR")
                        .requestMatchers("/api/reception/**").hasAnyRole("RECEPTIONIST","MANAGER","ADMIN","SUPERADMIN")
                        .requestMatchers("/api/management/**").hasAnyRole("SUPERADMIN", "ADMIN")
                        .requestMatchers("/api/specialties/**").hasAnyRole("SUPERADMIN", "ADMIN", "MANAGER", "DOCTOR")

                        // Paciente — self-service
                        .requestMatchers("/api/patient/**").hasRole("PATIENT")

                        // Pacientes — gerenciamento pelo staff
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/pacients/**")
                            .hasAnyRole("DOCTOR", "RECEPTIONIST", "MANAGER", "ADMIN", "SUPERADMIN")
                        .requestMatchers("/api/pacients/**")
                            .hasAnyRole("RECEPTIONIST", "MANAGER", "ADMIN", "SUPERADMIN")

                        .anyRequest().authenticated()
                )
                // Retorna 401 JSON ao invés de abrir popup de Basic Auth no navegador
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)));
        return http.build();
    }
}
