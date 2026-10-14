package com.scu.clinic_system.model;

public enum GuiaStatus {
    GERADA,          // gerada pela recepção, aguardando assinatura do paciente
    ASSINADA,        // paciente assinou — pronta para envio ao convênio
    ENVIADA,         // enviada ao convênio para cobrança
    APROVADA,        // convênio aprovou o valor integral
    GLOSADA_PARCIAL, // convênio aprovou parte e recusou outra parte
    GLOSADA_TOTAL    // convênio recusou o pagamento integralmente
}
