package com.scu.clinic_system.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Guia de Consulta TISS — documento gerado pela recepção para faturamento
 * junto à operadora do plano de saúde do paciente.
 *
 * Ciclo de vida:
 *   GERADA → ASSINADA (paciente assina ao chegar) → ENVIADA (lote ao convênio)
 *   → APROVADA | GLOSADA_PARCIAL | GLOSADA_TOTAL
 */
@Entity
@Table(name = "consultation_guia", indexes = {
        @Index(name = "idx_guia_appointment", columnList = "appointment_id", unique = true),
        @Index(name = "idx_guia_status",      columnList = "status"),
        @Index(name = "idx_guia_insurance",   columnList = "insurance_id")
})
public class ConsultationGuia {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false, unique = true)
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "insurance_id", nullable = false)
    private PatientInsurance insurance;

    @Column(name = "numero_guia", length = 40)
    private String numeroGuia;

    // Código de autorização obtido da operadora (pré-autorização, quando exigido)
    @Column(name = "codigo_autorizacao", length = 60)
    private String codigoAutorizacao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GuiaStatus status = GuiaStatus.GERADA;

    // Valores para faturamento
    @Column(name = "valor_apresentado", precision = 10, scale = 2)
    private BigDecimal valorApresentado;

    @Column(name = "valor_aprovado", precision = 10, scale = 2)
    private BigDecimal valorAprovado;

    @Column(name = "valor_glosado", precision = 10, scale = 2)
    private BigDecimal valorGlosado;

    // Motivo da glosa ou observações da operadora
    @Column(name = "motivo_glosa", columnDefinition = "TEXT")
    private String motivoGlosa;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "assinada_em")
    private LocalDateTime assinadaEm;

    @Column(name = "enviada_em")
    private LocalDateTime enviadaEm;

    @Column(name = "resolvida_em")
    private LocalDateTime resolvidaEm;

    // ── getters / setters ─────────────────────────────────────────────────────

    public UUID getId() { return id; }

    public Appointment getAppointment() { return appointment; }
    public void setAppointment(Appointment appointment) { this.appointment = appointment; }

    public PatientInsurance getInsurance() { return insurance; }
    public void setInsurance(PatientInsurance insurance) { this.insurance = insurance; }

    public String getNumeroGuia() { return numeroGuia; }
    public void setNumeroGuia(String numeroGuia) { this.numeroGuia = numeroGuia; }

    public String getCodigoAutorizacao() { return codigoAutorizacao; }
    public void setCodigoAutorizacao(String codigoAutorizacao) { this.codigoAutorizacao = codigoAutorizacao; }

    public GuiaStatus getStatus() { return status; }
    public void setStatus(GuiaStatus status) { this.status = status; }

    public BigDecimal getValorApresentado() { return valorApresentado; }
    public void setValorApresentado(BigDecimal valorApresentado) { this.valorApresentado = valorApresentado; }

    public BigDecimal getValorAprovado() { return valorAprovado; }
    public void setValorAprovado(BigDecimal valorAprovado) { this.valorAprovado = valorAprovado; }

    public BigDecimal getValorGlosado() { return valorGlosado; }
    public void setValorGlosado(BigDecimal valorGlosado) { this.valorGlosado = valorGlosado; }

    public String getMotivoGlosa() { return motivoGlosa; }
    public void setMotivoGlosa(String motivoGlosa) { this.motivoGlosa = motivoGlosa; }

    public String getObservacoes() { return observacoes; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public LocalDateTime getAssinadaEm() { return assinadaEm; }
    public void setAssinadaEm(LocalDateTime assinadaEm) { this.assinadaEm = assinadaEm; }

    public LocalDateTime getEnviadaEm() { return enviadaEm; }
    public void setEnviadaEm(LocalDateTime enviadaEm) { this.enviadaEm = enviadaEm; }

    public LocalDateTime getResolvidaEm() { return resolvidaEm; }
    public void setResolvidaEm(LocalDateTime resolvidaEm) { this.resolvidaEm = resolvidaEm; }
}
