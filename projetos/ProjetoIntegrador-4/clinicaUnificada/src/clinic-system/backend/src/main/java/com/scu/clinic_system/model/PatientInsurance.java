package com.scu.clinic_system.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "patient_insurance", indexes = {
        @Index(name = "idx_insurance_patient", columnList = "patient_id")
})
public class PatientInsurance {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(nullable = false, length = 100)
    private String operadora;

    @Column(name = "numero_carteirinha", nullable = false, length = 60)
    private String numeroCarteirinha;

    @Column(length = 100)
    private String plano;

    @Column(name = "codigo_ans", length = 10)
    private String codigoAns;

    @Column(name = "data_inicio")
    private LocalDate dataInicio;

    @Column(name = "data_validade")
    private LocalDate dataValidade;

    // true = paciente é o titular; false = paciente é dependente
    @Column(nullable = false)
    private boolean titular = true;

    // nome do titular quando o paciente for dependente
    @Column(name = "nome_titular", length = 100)
    private String nomeTitular;

    // convênio marcado como principal para este paciente
    @Column(nullable = false)
    private boolean principal = false;

    @Column(nullable = false)
    private boolean ativo = true;

    public UUID getId() { return id; }

    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }

    public String getOperadora() { return operadora; }
    public void setOperadora(String operadora) { this.operadora = operadora; }

    public String getNumeroCarteirinha() { return numeroCarteirinha; }
    public void setNumeroCarteirinha(String numeroCarteirinha) { this.numeroCarteirinha = numeroCarteirinha; }

    public String getPlano() { return plano; }
    public void setPlano(String plano) { this.plano = plano; }

    public String getCodigoAns() { return codigoAns; }
    public void setCodigoAns(String codigoAns) { this.codigoAns = codigoAns; }

    public LocalDate getDataInicio() { return dataInicio; }
    public void setDataInicio(LocalDate dataInicio) { this.dataInicio = dataInicio; }

    public LocalDate getDataValidade() { return dataValidade; }
    public void setDataValidade(LocalDate dataValidade) { this.dataValidade = dataValidade; }

    public boolean isTitular() { return titular; }
    public void setTitular(boolean titular) { this.titular = titular; }

    public String getNomeTitular() { return nomeTitular; }
    public void setNomeTitular(String nomeTitular) { this.nomeTitular = nomeTitular; }

    public boolean isPrincipal() { return principal; }
    public void setPrincipal(boolean principal) { this.principal = principal; }

    public boolean isAtivo() { return ativo; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }

    public boolean isVencido() {
        return dataValidade != null && dataValidade.isBefore(LocalDate.now());
    }
}
