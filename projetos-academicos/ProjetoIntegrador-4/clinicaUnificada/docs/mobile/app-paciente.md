# App Mobile do Paciente — Esqueleto (Documento Vivo)

> **Status do documento:** rascunho em evolução
> **Versão:** 0.2.0
> **Última atualização:** 2026-09-14
> **Responsáveis:** equipe SCU (ver [README](../../README.md))
> **Escopo:** aplicativo móvel do **paciente**, complementar ao sistema web já existente em [src/clinic-system](../../src/clinic-system/)

---

## 0. Como este documento se mantém vivo

> **Atualização da v1:** a equipe decidiu Flutter para Android, conforme [ADR 001](../decisoes/adr-001-flutter-paciente-android.md) e [prompt de execução](prompt-porte-flutter-paciente.md). O módulo está em [mobile](../../src/clinic-system/mobile/README.md). As seções 7.1–7.11 e 8 abaixo preservam a proposta histórica Expo e não definem a implementação atual. Na v1, o agendamento tem três passos, não há push, biometria, mapa, recuperação/refresh de senha ou cache clínico offline. Validações em dispositivo e revisão estão pendentes, conforme [evidências](../../sprints/evidencias-mobile-flutter.md). A estrutura para Play Console foi solicitada, sem conexão ou publicação.

Este arquivo **não é uma especificação congelada**. Ele é a fonte de verdade do app mobile e deve mudar junto com o produto.

### Regras de manutenção

| Regra | Detalhe |
| --- | --- |
| Toda alteração vira PR | Nada é editado direto na `main`; a alteração passa por revisão como código. |
| Sempre atualizar o cabeçalho | Ao alterar o conteúdo, subir a **Versão** e a **Última atualização**. |
| Registrar no changelog | Toda mudança relevante entra na seção [12. Changelog](#12-changelog-do-documento). |
| Decisão técnica fechada vira ADR | Quando uma escolha da seção [7. Stack](#7-stack-de-tecnologias) for oficializada, criar um ADR em [docs/decisoes](../decisoes/) usando o [template](../decisoes/template-adr.md) e linkar aqui. |
| Status por item | Cada funcionalidade carrega um marcador de status (tabela abaixo). |
| Pergunta em aberto não some | Dúvidas vão para a seção [11. Perguntas em aberto](#11-perguntas-em-aberto); só saem quando viram decisão ou ADR. |

### Legenda de status usada no documento inteiro

| Marcador | Significado |
| --- | --- |
| ✅ Pronto | Já existe e funciona (web e/ou backend). |
| 🟡 Parcial | Existe backend mas não existe tela, ou existe tela incompleta. |
| 🔵 Planejado | Decidido que entra, ainda não construído. |
| 💡 Ideia | Levantado no benchmarking, ainda não priorizado. |
| ⛔ Fora de escopo | Decidido que **não** entra no mobile (fica só na web). |

---

## 1. Visão do produto mobile

O SCU já tem uma aplicação web multi-perfil (superadmin, admin, gestor, médico, recepcionista, paciente). O **web continua sendo a plataforma operacional da clínica**; o mobile é a plataforma **do paciente**.

### 1.1 Tese do produto

> O paciente não quer "usar um sistema de clínica". Ele quer resolver quatro coisas: **descobrir onde ser atendido**, **marcar**, **lembrar** e **consultar o que aconteceu**. O app existe para resolver isso em poucos toques, com o cartão do convênio sempre à mão.

### 1.2 Divisão de responsabilidades entre plataformas

| Perfil | Web | Mobile |
| --- | --- | --- |
| Superadmin / Admin / Gestor | ✅ Plataforma principal | ⛔ Fora de escopo |
| Médico | ✅ Plataforma principal (PEP, prescrição, agenda) | 💡 Futuro: agenda de leitura + teleconsulta |
| Recepcionista | ✅ Plataforma principal (confirmação, guias TISS) | ⛔ Fora de escopo |
| **Paciente** | 🟡 Existe, mas é secundária | ✅ **Plataforma principal** |

### 1.3 Princípios de design do app

1. **Paridade primeiro, inovação depois.** A v1 entrega tudo que o paciente já faz na web. Só então entram as funcionalidades novas.
2. **Offline tolerante.** Carteirinha do convênio, próxima consulta e endereço da clínica precisam abrir sem internet — é exatamente o momento em que o paciente está no estacionamento do hospital sem sinal.
3. **Menos formulário, mais contexto.** O app já sabe quem é o paciente, qual o convênio principal e qual foi a última clínica; não perguntar de novo.
4. **Dado sensível não vaza para log.** Prontuário, CPF e carteirinha nunca entram em analytics, crash report ou console.
5. **Acessibilidade não é opcional.** O público inclui idosos: fonte escalável, contraste AA, alvos de toque de 44pt, leitor de tela nas ações críticas.

### 1.4 Personas

| Persona | Perfil | Dor principal | O que o app resolve |
| --- | --- | --- | --- |
| **Dona Marlene, 68** | Aposentada, 3 convênios (um como dependente), baixa familiaridade digital | Não lembra qual carteirinha usar, perde papel | Carteirinha digital, lembrete de consulta, "qual convênio usar aqui" |
| **Rafael, 34** | CLT, plano da empresa, muda de cidade a trabalho | Não sabe quais clínicas aceitam o plano dele | **Mapa da rede credenciada por geolocalização** |
| **Camila, 29** | Mãe de dependente menor, gerencia a saúde da família | Precisa acompanhar consultas de outra pessoa | 💡 Perfis dependentes (fase 3) |
| **Sr. João, 57** | Crônico (hipertensão, diabetes), consultas recorrentes | Perde prescrição, esquece retorno | Histórico de prontuário, prescrições, lembrete de retorno |

---

## 2. Mapa de paridade — o que já existe hoje

Levantado diretamente do código em [PatientSelfController.java](../../src/clinic-system/backend/src/main/java/com/scu/clinic_system/controller/PatientSelfController.java) e [DashBoardPaciente.jsx](../../src/clinic-system/frontend/sistema-clinico-unificado-frontend/src/pages/DashBoardPaciente.jsx).

**Boa notícia: o backend do paciente já está bem servido.** A maior parte da v1 do app é consumo de API que já existe.

| Funcionalidade | Endpoint existente | Web | Mobile v1 | Tela mobile |
| --- | --- | --- | --- | --- |
| Login | `POST /api/auth/login` (público) | ✅ | 🔵 | `Auth/Login` |
| Autocadastro | `POST /api/pacients/register` (público) | ✅ | 🔵 | `Auth/Register` (stepper) |
| Ver perfil | `GET /api/patient/profile` | ✅ | 🔵 | `Perfil` |
| Editar perfil (telefone, endereço, tipo sanguíneo, alergias, contato de emergência) | `PUT /api/patient/profile` | ✅ | 🔵 | `Perfil/Editar` |
| Listar consultas | `GET /api/patient/appointments` | ✅ | 🔵 | `Consultas` |
| Detalhe da consulta | `GET /api/patient/appointments/{id}` | ✅ | 🔵 | `Consultas/Detalhe` |
| Solicitar consulta | `POST /api/patient/appointments` | ✅ | 🔵 | `Agendar` (fluxo 4 passos) |
| Cancelar consulta | `DELETE /api/patient/appointments/{id}` | ✅ | 🔵 | `Consultas/Detalhe` |
| Listar clínicas para agendar | `GET /api/patient/booking/clinics` | ✅ | 🔵 | `Agendar/Passo 1` |
| Especialidades por clínica | `GET /api/patient/booking/clinics/{id}/specialties` | ✅ | 🔵 | `Agendar/Passo 2` |
| Médicos por clínica | `GET /api/patient/booking/clinics/{id}/doctors` | ✅ | 🔵 | `Agendar/Passo 3` |
| Histórico de prontuário | `GET /api/patient/records` | ✅ | 🔵 | `Prontuário` |
| Prontuário de uma consulta (diagnóstico, CID-10, tratamento, prescrições) | `GET /api/patient/records/{appointmentId}` | ✅ | 🔵 | `Prontuário/Detalhe` |
| Notificações in-app | `GET /api/patient/notifications` | ✅ | 🔵 | `Notificações` |
| Contador de não lidas | `GET /api/patient/notifications/unread-count` | ✅ | 🔵 | Badge do tab bar |
| Marcar lida / todas lidas | `POST /api/patient/notifications/{id}/read`, `/mark-all-read` | ✅ | 🔵 | `Notificações` |
| Listar convênios | `GET /api/patient/insurance` | ✅ | 🔵 | `Convênios` |
| Adicionar convênio | `POST /api/patient/insurance` | ✅ | 🔵 | `Convênios/Novo` |
| Editar convênio | `PUT /api/patient/insurance/{id}` | ✅ | 🔵 | `Convênios/Editar` |
| Remover convênio | `DELETE /api/patient/insurance/{id}` | ✅ | 🔵 | `Convênios` |
| Definir convênio principal | `POST /api/patient/insurance/{id}/set-principal` | ✅ | 🔵 | `Convênios` |

### 2.1 O ciclo de vida da consulta (regra de negócio já implementada)

O app precisa refletir fielmente esta máquina de estados, definida em `AppointmentStatus`:

```text
PENDING ──(recepção confirma)──► SCHEDULED ──(médico inicia)──► IN_PROGRESS ──► COMPLETED
   │                                  │
   └────────(recepção rejeita)────────┴──(paciente/recepção cancela)──► CANCELLED
```

**Implicação de UX importante:** quando o paciente agenda pelo app, o status é `PENDING`, **não** `SCHEDULED`. A tela precisa deixar claro que é uma *solicitação aguardando confirmação da recepção*, e não um horário garantido. Confirmação e rejeição já geram `Notification` no backend — é exatamente o gancho para o push notification.

### 2.2 Guia TISS — contexto que o paciente não vê hoje

O sistema já modela `ConsultationGuia` (guia de consulta TISS) com ciclo `GERADA → ASSINADA → ENVIADA → APROVADA | GLOSADA_PARCIAL | GLOSADA_TOTAL`, hoje operada só pela recepção. Isso abre uma funcionalidade nativa de mobile: **assinatura da guia pelo celular do paciente no check-in**, substituindo a assinatura em papel na recepção (ver [4.5](#45-detalhe-do-check-in-digital)).

---

## 3. Benchmarking — o que o mercado já resolveu

Pesquisa feita em agosto/2026 sobre plataformas com o mesmo público (paciente/beneficiário). Fontes na seção [13](#13-fontes-e-referências).

### 3.1 Plataformas analisadas

| Plataforma | Categoria | O que faz muito bem | O que vale trazer para o SCU |
| --- | --- | --- | --- |
| **App Unimed Cliente** | Operadora | Mais de 74 funcionalidades; carteirinha do titular **e dos dependentes**; guia médico da rede credenciada; 2ª via de cartão | Carteirinha de dependentes; favoritar prestadores |
| **Unimed CNU** | Operadora | Rede credenciada **por geolocalização**; reembolso online com pagamento no mesmo dia | Geolocalização como entrada principal da busca |
| **Amil Clientes** | Operadora | Mapa com **traçado de rota** até a rede credenciada mais próxima; teleconsulta; carteirinha digital; agendamento | Mapa + rota — referência direta da nossa feature-âncora |
| **Conecte SUS / RNDS** | Governo | Histórico clínico nacional, vacinas, exames; base do padrão HL7 FHIR obrigatório no Brasil | Padrão de interoperabilidade a seguir no longo prazo |
| **Epic MyChart** | PEP (EUA) | Referência mundial em portal do paciente: resultados, mensagens ao médico, check-in antecipado | Check-in antecipado; timeline clínica |
| **Zocdoc / Doctolib** | Marketplace | Descoberta e agendamento com filtro por convênio e horário real disponível | Filtro "aceita meu plano"; slots reais de horário |
| **Practo** | Marketplace (Índia) | Busca por sintoma → especialidade → médico | Ponte sintoma → especialidade |
| **Ada Health** | Triagem | Triagem por sintomas guiada e conversacional | Chatbot de triagem (já está no nosso backlog) |
| **Dr. Consulta** | Clínica popular BR | Preço transparente antes de agendar; fluxo de agendamento curtíssimo | Transparência de custo/cobertura |
| **Alice / Sami** | Healthtech BR | Time de saúde dedicado, jornada proativa, app como canal único | Proatividade (lembrete de retorno, preventivo) |

### 3.2 Matriz de funcionalidades: mercado × SCU

| Funcionalidade | Unimed | Amil | Conecte SUS | MyChart | Zocdoc | **SCU hoje** | **SCU mobile** |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Carteirinha digital | ✔ | ✔ | ✔ | — | — | 🟡 dados existem | 🔵 v1 |
| Rede credenciada com mapa | ✔ | ✔ | ✔ | — | ✔ | ❌ | 🔵 **v2 (destaque)** |
| Rota até a clínica | — | ✔ | — | — | ✔ | ❌ | 🔵 v2 |
| Agendamento online | ✔ | ✔ | — | ✔ | ✔ | ✅ | 🔵 v1 |
| Slots reais de horário | ✔ | ✔ | — | ✔ | ✔ | ❌ (texto livre) | 🔵 v2 |
| Histórico clínico / prontuário | 🟡 | 🟡 | ✔ | ✔ | — | ✅ | 🔵 v1 |
| Prescrição digital assinada | 🟡 | 🟡 | ✔ | ✔ | — | 🟡 sem assinatura | 🔵 v2 |
| Resultado de exames | ✔ | ✔ | ✔ | ✔ | — | ❌ | 💡 v3 |
| Teleconsulta | ✔ | ✔ | — | ✔ | ✔ | ❌ | 💡 v3 |
| Push de lembrete | ✔ | ✔ | ✔ | ✔ | ✔ | ❌ (só in-app) | 🔵 v1 |
| Check-in antecipado | — | 🟡 | — | ✔ | ✔ | ❌ | 💡 v3 |
| Dependentes | ✔ | ✔ | ✔ | ✔ | — | ❌ | 💡 v3 |
| Triagem por sintomas | — | 🟡 | — | — | ✔ | 🔵 no backlog | 💡 v3 |
| Reembolso | ✔ | ✔ | — | — | — | ❌ | 💡 v4 |
| Carteira de vacinas | — | — | ✔ | ✔ | — | ❌ | 💡 v4 |
| Login biométrico | ✔ | ✔ | ✔ | ✔ | — | ❌ | 🔵 v1 |

**Leitura desta matriz:** a lacuna nº 1 do SCU frente ao mercado é **descoberta de rede credenciada com mapa** — exatamente a funcionalidade que motivou este documento. A lacuna nº 2 é **push notification**, barata de implementar e com alto impacto na redução de faltas.

---

## 4. Backlog de funcionalidades do mobile

Priorização **MoSCoW** (Must / Should / Could / Won't) por fase.

### 4.1 Fase 0 — Fundação (sprint de setup)

| Item | Prioridade | Nota |
| --- | --- | --- |
| Setup do projeto, lint, CI, build de desenvolvimento | Must | Ver [8. Estrutura de pastas](#8-estrutura-de-pastas-proposta) |
| Design system / tokens (cores, tipografia, espaçamento) | Must | Derivar da identidade já usada no web |
| Cliente HTTP + interceptor JWT + tratamento de 401 | Must | Espelha o `apiFetch` de [auth.js](../../src/clinic-system/frontend/sistema-clinico-unificado-frontend/src/utils/auth.js) |
| Armazenamento seguro do token | Must | Keychain/Keystore — **nunca** `AsyncStorage` puro |
| Navegação base + tab bar | Must | Ver [5. Esqueleto de navegação](#5-esqueleto-de-navegação) |

### 4.2 Fase 1 — Paridade com a web (MVP)

| Item | Prioridade | Depende de backend novo? |
| --- | --- | --- |
| Login + logout | Must | Não |
| Autocadastro (stepper) | Must | Não |
| Home / Visão geral | Must | Não |
| Agendar consulta (clínica → especialidade → médico → data) | Must | Não |
| Minhas consultas + detalhe + cancelar | Must | Não |
| Meu prontuário + detalhe + prescrições | Must | Não |
| Meus convênios (CRUD + definir principal) | Must | Não |
| **Carteirinha digital** (visual de cartão, disponível offline) | Must | Não — usa `PatientInsurance` |
| Meu perfil + edição | Must | Não |
| Notificações in-app | Should | Não |
| Login biométrico (Face ID / digital) | Should | Não |
| **Push notification** de confirmação/cancelamento | Should | **Sim** — `DeviceToken` + disparo |
| Refresh token / sessão longa | Should | **Sim** — hoje o JWT expira em 1h sem refresh |
| Modo offline de leitura (próxima consulta + carteirinha) | Could | Não |

### 4.3 Fase 2 — Mapa e rede credenciada (feature-âncora)

> **Esta é a funcionalidade que diferencia o mobile do web.** Merece detalhamento próprio.

#### Jornada alvo

```text
[Tab "Rede"] → mapa abre centrado na localização do paciente
             → chip no topo: "Filtrando por: Unimed Nacional ▾"  (convênio principal pré-selecionado)
             → pins das clínicas que aceitam esse convênio
             → filtros: especialidade · distância · aceita agendamento online
             → toque no pin → bottom sheet: nome, endereço, distância, telefone, especialidades
             → [Traçar rota]  → abre o app de mapas nativo
             → [Agendar aqui] → entra no fluxo de agendamento já com a clínica escolhida
```

| Item | Prioridade | Depende de backend novo? |
| --- | --- | --- |
| Mapa com clínicas da rede | Must | **Sim** — `latitude`/`longitude` em `Clinic` |
| Filtro por convênio do paciente | Must | **Sim** — vínculo clínica ↔ operadora aceita |
| Permissão e uso de geolocalização | Must | Não |
| Ordenação por distância + lista alternativa ao mapa | Must | Sim (cálculo no backend) |
| Traçar rota (deep link para Google/Apple Maps) | Should | Não |
| Filtro por especialidade | Should | Não (já existe `Specialty`) |
| Buscar clínica por nome/endereço | Should | Não |
| Favoritar clínica | Could | Sim (`PatientFavoriteClinic`) |
| Mostrar clínicas fora da rede com aviso "particular" | Could | Sim |
| Slots reais de horário no agendamento | Should | **Sim** — agenda/disponibilidade do médico |
| Prescrição com assinatura digital / QR verificável | Should | **Sim** — ICP-Brasil ou integração Memed |

#### ⚠️ Bloqueio técnico conhecido (importante)

Duas ausências no modelo atual impedem a feature de mapa como está hoje:

1. **`Clinic` não tem coordenadas.** [Clinic.java](../../src/clinic-system/backend/src/main/java/com/scu/clinic_system/model/Clinic.java) guarda `address` como `TEXT` livre. Sem `latitude`/`longitude` não há pin no mapa nem cálculo de distância.
2. **Não existe vínculo entre clínica e operadora aceita.** `PatientInsurance` guarda a operadora *do paciente*, mas nada diz quais operadoras *a clínica atende*. Sem esse vínculo, "clínicas que aceitam meu plano" é impossível.

Ambos estão detalhados em [6. Lacunas de backend](#6-lacunas-de-backend-a-preencher).

### 4.4 Fase 3 — Diferenciação

| Item | Prioridade | Nota |
| --- | --- | --- |
| **Check-in por QR / assinatura digital da guia TISS** | Should | Usa `ConsultationGuia`; substitui assinatura em papel |
| Resultado de exames (PDF/imagem) | Should | Precisa de storage de arquivos |
| Teleconsulta (vídeo) | Could | Regulada pela Resolução CFM 2.314/2022 |
| Perfis dependentes (gerenciar familiares) | Could | Impacto forte no modelo de autorização |
| Chatbot de triagem | Could | Já previsto no [BACKLOG.md](../../src/BACKLOG.md) (Feature 3.5) |
| Lembrete de medicação | Could | Deriva de `PrescriptionItem` |
| Widget de próxima consulta | Won't (v3) | iOS WidgetKit / Android Glance |

### 4.5 Detalhe do check-in digital

O fluxo hoje é: paciente chega → recepção gera a guia → paciente assina em papel → recepção envia lote ao convênio. No mobile:

```text
Paciente chega na clínica
  → app detecta consulta em até 2h (ou o paciente lê o QR do balcão)
  → mostra a guia gerada com os dados do convênio
  → paciente assina na tela (canvas)
  → requisição marca a guia como ASSINADA (preenche assinadaEm)
  → recepção vê o check-in concluído; a fila anda sem papel
```

### 4.6 Fase 4 — Exploratório

| Item | Nota |
| --- | --- |
| Integração RNDS/FHIR | Traz o histórico do SUS para dentro do app; exige sistema compatível com FHIR e homologado pelo Ministério da Saúde |
| Carteira de vacinas | Depende da RNDS |
| Reembolso de consulta particular | Foto do recibo + acompanhamento do pedido |
| Apple HealthKit / Health Connect | Passos, batimentos e pressão disponíveis para o médico no PEP |
| Programa de crônicos / jornada proativa | Inspirado em Alice e Sami |

---

## 5. Esqueleto de navegação

### 5.1 Árvore de telas

```text
RootNavigator
│
├── (auth)                            [não autenticado]
│   ├── /welcome                      Onboarding (3 slides, pulável)
│   ├── /login                        E-mail + senha · biometria · "esqueci a senha"
│   ├── /register                     Stepper: 1 Dados pessoais → 2 Convênio → 3 Confirmação
│   └── /forgot-password              🔵 exige endpoint novo
│
└── (app)                             [autenticado, ROLE_PATIENT]
    │
    ├── [Tab 1] Início        /home
    │   ├── Card "Próxima consulta"   → data, médico, clínica, status, ação rápida
    │   ├── Card "Carteirinha"        → convênio principal, abre em tela cheia
    │   ├── Atalhos                   → Agendar · Rede · Prontuário
    │   ├── Avisos                    → últimas notificações não lidas
    │   └── /notifications            Lista completa
    │
    ├── [Tab 2] Agendar      /booking
    │   ├── /booking/clinic           Passo 1 — escolher clínica (lista + "ver no mapa")
    │   ├── /booking/specialty        Passo 2 — especialidade
    │   ├── /booking/doctor           Passo 3 — médico
    │   ├── /booking/datetime         Passo 4 — data/hora + tipo (1ª vez / retorno)
    │   ├── /booking/review           Revisão + convênio a utilizar
    │   └── /booking/success          "Solicitação enviada — aguardando confirmação"
    │
    ├── [Tab 3] Rede         /network            🔵 fase 2
    │   ├── /network (mapa)           Mapa + filtro por convênio + busca
    │   ├── /network/list             Mesma busca em lista, ordenada por distância
    │   └── /network/clinic/[id]      Detalhe: especialidades, telefone, rota, agendar
    │
    ├── [Tab 4] Saúde        /health
    │   ├── /health/appointments      Minhas consultas (Próximas · Anteriores)
    │   ├── /health/appointments/[id] Detalhe + cancelar + rota até a clínica
    │   ├── /health/records           Prontuário (timeline)
    │   ├── /health/records/[id]      Diagnóstico, CID-10, tratamento, prescrições
    │   ├── /health/prescriptions     Prescrições agrupadas          🔵 fase 2
    │   └── /health/exams             Exames e resultados            💡 fase 3
    │
    └── [Tab 5] Perfil       /profile
        ├── /profile                  Dados pessoais + clínicos
        ├── /profile/edit             Edição (campos permitidos ao paciente)
        ├── /profile/insurance        Meus convênios
        ├── /profile/insurance/[id]   Detalhe / editar / definir principal
        ├── /profile/card             Carteirinha digital em tela cheia
        ├── /profile/settings         Notificações, biometria, tema, acessibilidade
        ├── /profile/privacy          LGPD: consentimentos, exportar e excluir dados
        └── /profile/about            Versão, termos, suporte
```

### 5.2 Wireframe textual das telas-chave

#### `/home` — Início

```text
┌─────────────────────────────────────┐
│  Olá, Marlene 👋            🔔 (3)  │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │ PRÓXIMA CONSULTA              │  │
│  │ Qui, 28/ago · 14:30           │  │
│  │ Dr. Carlos Lima · Cardiologia │  │
│  │ Clínica Central — Asa Norte   │  │
│  │ ● Aguardando confirmação      │  │
│  │ [Ver detalhes]  [Como chegar] │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 💳 Unimed Nacional            │  │
│  │ ●●●● ●●●● 4821 · Titular      │  │
│  │             [Ver carteirinha] │  │
│  └───────────────────────────────┘  │
│                                     │
│  [+ Agendar] [🗺 Rede] [📋 Prontuário] │
│                                     │
│  AVISOS                             │
│  • Consulta de 28/ago confirmada    │
│  • Convênio Amil vence em 12 dias   │
├─────────────────────────────────────┤
│  🏠     📅     🗺     ❤️     👤     │
└─────────────────────────────────────┘
```

#### `/network` — Rede credenciada (feature-âncora)

```text
┌─────────────────────────────────────┐
│  🔍 Buscar clínica ou especialidade │
│  [Unimed Nacional ▾][Todas ▾][5km ▾]│
├─────────────────────────────────────┤
│                                     │
│            📍 você                  │
│      📌         📌                  │
│              📌       📌            │
│         (mapa interativo)           │
│                                     │
├─────────────────────────────────────┤
│ ▲ 4 clínicas na sua rede            │
│ ┌─────────────────────────────────┐ │
│ │ Clínica Central        1,2 km   │ │
│ │ Cardio · Ortopedia · Clínica G. │ │
│ │ ✓ Aceita Unimed Nacional        │ │
│ │ [Rota]           [Agendar aqui] │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### `/profile/card` — Carteirinha digital

```text
┌─────────────────────────────────────┐
│  ‹ Carteirinha                      │
│  ┌───────────────────────────────┐  │
│  │  UNIMED NACIONAL              │  │
│  │                               │  │
│  │  MARLENE S. OLIVEIRA          │  │
│  │  0123 4567 8910 4821          │  │
│  │                               │  │
│  │  Plano    Nacional Enfermaria │  │
│  │  ANS      123456              │  │
│  │  Titular  Sim                 │  │
│  │  Validade 12/2027             │  │
│  │                    [  QR  ]   │  │
│  └───────────────────────────────┘  │
│  ● Disponível offline               │
│  [Compartilhar]  [Trocar convênio]  │
└─────────────────────────────────────┘
```

### 5.3 Estados obrigatórios de cada tela

Toda tela de lista implementa os quatro estados — nada de tela branca:

| Estado | Tratamento |
| --- | --- |
| Carregando | Skeleton com o formato do conteúdo real (não spinner genérico) |
| Vazio | Ilustração + frase + ação ("Você ainda não tem consultas. [Agendar agora]") |
| Erro | Mensagem humana + botão "Tentar de novo"; nunca mostrar stack trace |
| Offline | Banner "Sem conexão — mostrando dados de {data}" + conteúdo em cache |

---

## 6. Lacunas de backend a preencher

O que o app vai precisar e **ainda não existe** em [src/clinic-system/backend](../../src/clinic-system/backend/).

### 6.1 Bloqueadores da feature de mapa

| # | Lacuna | Proposta | Fase |
| --- | --- | --- | --- |
| B1 | `Clinic` sem coordenadas | Adicionar `latitude`/`longitude` (`DECIMAL(9,6)`); popular via geocoding do `address` no cadastro da clínica | 2 |
| B2 | Sem vínculo clínica ↔ operadora aceita | Novas entidades `InsuranceOperator` (operadora normalizada, com código ANS) e `ClinicAcceptedInsurance` (clínica × operadora × plano × ativo) | 2 |
| B3 | Operadora do paciente é texto livre | `PatientInsurance.operadora` é `String`; normalizar contra `InsuranceOperator` para o filtro do mapa funcionar | 2 |
| B4 | Sem busca geográfica | `GET /api/patient/network/clinics?lat&lng&radiusKm&operatorId&specialtyId`; Haversine em SQL ou PostGIS | 2 |

> **Decisão pendente:** B3 é a peça mais delicada. Enquanto `operadora` for texto livre, "Unimed", "unimed" e "UNIMED NACIONAL" são operadoras diferentes para o sistema. Ou normalizamos na escrita (autocomplete com base ANS no cadastro do convênio), ou fazemos o matching por `codigoAns`. Ver [11. Perguntas em aberto](#11-perguntas-em-aberto).

### 6.2 Lacunas de plataforma mobile

| # | Lacuna | Proposta | Fase |
| --- | --- | --- | --- |
| M1 | Sem push notification | Entidade `DeviceToken` (usuário, token, plataforma, ativo) + `POST/DELETE /api/patient/devices`; disparo via FCM sempre que uma `Notification` for criada | 1 |
| M2 | JWT expira em 1h, sem refresh | `security.jwt.expiration-ms=3600000` e não existe refresh token. No mobile isso derruba a sessão a cada hora. Implementar refresh de longa duração com rotação | 1 |
| M3 | Sem recuperação de senha | `POST /api/auth/forgot-password` + `POST /api/auth/reset-password` com token por e-mail | 1 |
| M4 | CORS fixo em `localhost:5173` | [WebConfig.java](../../src/clinic-system/backend/src/main/java/com/scu/clinic_system/config/WebConfig.java) não afeta app nativo, mas afeta o build web do Expo e os ambientes de homologação; tornar configurável por variável de ambiente. Observação: `PATCH` também está fora de `allowedMethods` | 1 |
| M5 | Sem documentação OpenAPI | Adicionar `springdoc-openapi` (já previsto no [BACKLOG.md](../../src/BACKLOG.md), item 2.4.1) para gerar o client tipado do app automaticamente | 0 |
| M6 | Sem versionamento de API | App publicado não atualiza junto com o servidor. Definir política (`/api/v1/...`) **antes** da primeira publicação em loja | 0 |
| M7 | Sem storage de arquivos | Exames, PDFs e foto de perfil precisam de S3/MinIO + URLs assinadas | 3 |
| M8 | Sem slots de agenda | Hoje o `scheduledAt` é enviado como string livre pelo app. Modelar `DoctorSchedule`/`AvailableSlot` para agendamento real | 2 |
| M9 | Prescrição sem assinatura | `PrescriptionItem` guarda os dados, mas não há PDF nem assinatura ICP-Brasil. Integrar Memed ou certificado digital próprio | 2 |
| M10 | Sem force-update | Endpoint de versão mínima suportada, para bloquear apps antigos após breaking change | 1 |

### 6.3 Modelo de dados proposto (adições)

```text
InsuranceOperator                  ClinicAcceptedInsurance
├── id: UUID                       ├── id: UUID
├── nome: String                   ├── clinic → Clinic
├── codigoAns: String (unique)     ├── operator → InsuranceOperator
├── logoUrl: String                ├── planos: String[]  (vazio = todos)
└── ativo: boolean                 ├── ativo: boolean
                                   └── observacao: String

Clinic (alterações)                DeviceToken
+ latitude: BigDecimal             ├── id: UUID
+ longitude: BigDecimal            ├── user → User
+ cep: String                      ├── token: String
+ cidade: String                   ├── platform: enum(IOS, ANDROID)
+ uf: String                       ├── ativo: boolean
                                   └── lastSeenAt: LocalDateTime

PatientFavoriteClinic              RefreshToken
├── patient → Patient              ├── id: UUID
├── clinic → Clinic                ├── user → User
└── createdAt: LocalDateTime       ├── tokenHash: String
                                   ├── expiresAt: LocalDateTime
                                   └── revokedAt: LocalDateTime
```

---

## 7. Stack de tecnologias

Esta seção é a mais volátil do documento. Cada linha marcada como **Recomendado** vira um ADR quando a equipe bater o martelo.

### 7.1 Decisão nº 1 — qual framework mobile

| Opção | Prós | Contras | Veredito |
| --- | --- | --- | --- |
| **React Native + Expo** | O time **já domina React** (o frontend web é React 19); reaproveita hooks, padrões e mentalidade; maior ecossistema de bibliotecas (npm) para integrações de saúde, mapas e push; Expo entrega build na nuvem sem Mac; OTA update sem passar pela loja | Performance de animação pesada abaixo do Flutter; algumas libs nativas exigem `expo-dev-client` | ✅ **Recomendado** |
| **Flutter** | UI idêntica entre plataformas; excelente performance gráfica; forte em telas de monitoramento e telessaúde | Exige aprender **Dart** do zero; ecossistema menor (~50 mil pacotes no pub.dev contra milhões no npm); zero reaproveitamento do que o time já sabe | Alternativa séria, mas custo de aprendizado alto para o prazo do semestre |
| **Nativo (Kotlin + Swift)** | Melhor performance e acesso imediato a APIs novas | **Duas** bases de código, dois times, dobro do esforço | ⛔ Inviável no contexto acadêmico |
| **Kotlin Multiplatform** | Compartilha lógica, UI nativa em cada plataforma | Curva alta; UI ainda duplicada em muitos casos | ⛔ Fora de escopo |
| **PWA (o React atual instalável)** | Custo quase zero; reaproveita 100% do web | Sem push confiável no iOS, sem biometria nativa, sem loja, mapa e geolocalização limitados | ⛔ Não atende às features-âncora |

> **Racional resumido:** a escolha certa de framework é a que o time consegue manter. Como todo o frontend do SCU já é React, **React Native com Expo** transforma conhecimento existente em velocidade de entrega. Flutter só compensaria se a equipe já tivesse Dart.

### 7.2 Núcleo do aplicativo

| Categoria | Recomendado | Alternativas | Por quê |
| --- | --- | --- | --- |
| Framework | **React Native 0.8x + Expo SDK (managed + dev client)** | Flutter, RN CLI puro | Build na nuvem via EAS, sem depender de Mac para iOS |
| Linguagem | **TypeScript (modo `strict`)** | JavaScript | Contratos de API tipados evitam erro em dado clínico |
| Navegação | **Expo Router** (file-based) | React Navigation puro | A árvore de arquivos vira a árvore de rotas da seção 5; deep link nativo |
| Estado de servidor | **TanStack Query (React Query)** | SWR, RTK Query | Cache, revalidação, retry e persistência offline prontos |
| Estado de cliente | **Zustand** | Redux Toolkit, Context puro | Leve; guarda sessão, convênio selecionado e preferências |
| Formulários | **React Hook Form** | Formik | Performance em formulários longos (cadastro em 3 passos) |
| Validação | **Zod** | Yup | Mesmo schema valida formulário e resposta da API |
| HTTP | **Axios** com interceptors | `ky`, `fetch` nativo | Interceptor de JWT/refresh espelha o `apiFetch` do web |
| Client tipado da API | **OpenAPI Generator** ou **Orval**, a partir do `springdoc-openapi` | Escrever à mão | Backend passa a ser a fonte de verdade dos tipos |
| Datas | **date-fns** + `date-fns/locale/pt-BR` | Day.js, Luxon | Formatação e cálculo de datas de consulta |
| Máscaras BR | **react-native-mask-input** | `react-native-masked-text` | CPF, telefone, CEP, carteirinha |

### 7.3 Persistência local, offline e segurança no dispositivo

| Categoria | Recomendado | Alternativas | Por quê |
| --- | --- | --- | --- |
| Token e segredos | **expo-secure-store** (Keychain no iOS, Keystore no Android) | `react-native-keychain` | Token JWT **nunca** em `AsyncStorage` sem criptografia |
| Cache rápido chave-valor | **react-native-mmkv** | `AsyncStorage` | Ordens de magnitude mais rápido; suporta criptografia |
| Banco local | **expo-sqlite** + **Drizzle ORM** | WatermelonDB, Realm | Guarda consultas, prontuário e carteirinha para uso offline |
| Persistência do cache de API | **@tanstack/query-async-storage-persister** sobre MMKV | Manual | Abre o app offline com o último estado conhecido |
| Biometria | **expo-local-authentication** | `react-native-biometrics` | Face ID / digital para reabrir a sessão |
| Criptografia em repouso | **AES-256** no banco local (SQLCipher ou MMKV com chave) | — | Exigência para dado sensível de saúde sob a LGPD |
| Detecção de root/jailbreak | **jail-monkey** | Freerasp | Bloquear prontuário em dispositivo comprometido |

### 7.4 Mapas e localização (feature-âncora)

| Categoria | Recomendado | Alternativas | Nota |
| --- | --- | --- | --- |
| Mapa | **react-native-maps** (Google Maps no Android, Apple Maps no iOS) | Mapbox SDK, MapLibre + OpenStreetMap | `react-native-maps` é o caminho mais curto; MapLibre + OSM evita custo de API se o volume crescer |
| Localização do usuário | **expo-location** | `react-native-geolocation-service` | Permissão "durante o uso"; **nunca** rastrear em background |
| Geocoding (endereço → coordenada) | **Google Geocoding API** no cadastro da clínica | Nominatim (OSM, gratuito), Mapbox Geocoding | Roda no **backend**, uma vez por clínica — não no app |
| CEP → endereço | **ViaCEP** | BrasilAPI | Autopreenchimento no cadastro |
| Cálculo de distância | **Haversine no PostgreSQL** | PostGIS (`ST_DWithin`) | Haversine resolve o MVP; PostGIS se a base de clínicas crescer |
| Agrupamento de pins | **react-native-map-clustering** | Supercluster | Evita mapa poluído em região densa |
| Traçar rota | **Deep link** para Google Maps / Apple Maps / Waze | SDK de navegação embutido | Não reinventar navegação; abrir o app que o usuário já usa |

> **Atenção a custo:** Google Maps Platform cobra por carregamento de mapa acima da cota gratuita. Para um projeto acadêmico, **MapLibre + tiles do OpenStreetMap** é a opção sem cartão de crédito. Registrar essa escolha em ADR.

### 7.5 Notificações

| Categoria | Recomendado | Alternativas | Por quê |
| --- | --- | --- | --- |
| Push | **expo-notifications** sobre FCM (Android) e APNs (iOS) | OneSignal, Notifee | Integra com o build do Expo sem configuração nativa manual |
| Envio pelo servidor | **Firebase Admin SDK (Java)** no Spring Boot | Expo Push API, OneSignal REST | Dispara no mesmo ponto em que a `Notification` é gravada |
| Notificação local | **expo-notifications** (agendada) | — | Lembrete "sua consulta é amanhã" sem depender de rede |
| Deep link da notificação | **Expo Router linking** | — | Push abre direto a tela da consulta |

### 7.6 Interface, design e acessibilidade

| Categoria | Recomendado | Alternativas | Por quê |
| --- | --- | --- | --- |
| Estilo | **NativeWind** (Tailwind em RN) | StyleSheet puro, Tamagui, Restyle | Tokens consistentes; sintaxe familiar a quem veio do web |
| Componentes | **React Native Reusables** ou **Gluestack UI** | React Native Paper, Tamagui | Base acessível já pronta |
| Ícones | **lucide-react-native** | `@expo/vector-icons` | O web usa Bootstrap Icons; alinhar o visual |
| Animação | **react-native-reanimated** | Moti | Transições fluidas de bottom sheet e cartões |
| Gestos | **react-native-gesture-handler** | — | Requisito do Reanimated e do bottom sheet |
| Bottom sheet | **@gorhom/bottom-sheet** | Modal nativo | Padrão do detalhe da clínica no mapa |
| Listas longas | **FlashList (Shopify)** | `FlatList` | Prontuário e histórico com muitos itens |
| Skeletons | **react-content-loader** / Reanimated | — | Estado de carregamento da seção 5.3 |
| Gráficos | **victory-native XL** | `react-native-gifted-charts` | Evolução de pressão, peso, glicemia (fase 3) |
| Tipografia | **expo-font** + Poppins/Inter | — | O web já usa Poppins nos títulos |
| Tema claro/escuro | **NativeWind + `useColorScheme`** | — | Respeitar a preferência do sistema |
| Acessibilidade | Props `accessibilityLabel`/`accessibilityRole`, `Dynamic Type`, contraste AA | — | Público idoso; auditar com Accessibility Inspector e TalkBack |
| Internacionalização | **i18next + react-i18next** | `expo-localization` puro | pt-BR agora; deixa a porta aberta |

### 7.7 Mídia, documentos e integrações clínicas

| Categoria | Recomendado | Alternativas | Uso |
| --- | --- | --- | --- |
| Câmera e QR | **expo-camera** | `react-native-vision-camera` | Check-in por QR; foto de documento |
| Galeria e upload | **expo-image-picker** | — | Foto de perfil, recibo de reembolso |
| Arquivos | **expo-file-system** | — | Download de prescrição e exame |
| Visualizar PDF | **react-native-pdf** | `expo-web-browser` | Prescrição, atestado, resultado de exame |
| Gerar PDF | **expo-print** (cliente) ou **iText/OpenPDF** (servidor) | — | Preferir gerar no **servidor** para documento com validade legal |
| Compartilhar | **expo-sharing** | — | Enviar carteirinha ou receita |
| Assinatura em tela | **react-native-signature-canvas** | — | Assinatura da guia TISS no check-in |
| Prescrição digital | **API Memed** | Nexodata, Prescrição Eletrônica do CFM, certificado ICP-Brasil próprio | Assinatura ICP-Brasil dá validade em farmácia conforme a Lei 14.510/2022 |
| Teleconsulta (fase 3) | **LiveKit** (open source, auto-hospedável) | Daily.co, Twilio Video, Jitsi Meet, `react-native-webrtc` puro | Precisa gravar a prescrição no prontuário (Resolução CFM 2.314/2022) |
| Dados de wearables (fase 4) | **Apple HealthKit** / **Health Connect (Android)** | `react-native-health` | Passos, pressão e batimentos visíveis no PEP |

### 7.8 Qualidade e testes

| Categoria | Recomendado | Alternativas | Escopo |
| --- | --- | --- | --- |
| Teste unitário | **Jest** | Vitest | Regras de negócio, formatadores, hooks |
| Teste de componente | **@testing-library/react-native** | — | Telas críticas: login, agendamento, carteirinha |
| Mock de API | **MSW (Mock Service Worker)** | `nock` | Testar sem backend de pé |
| Teste E2E | **Maestro** | Detox | Fluxos: cadastrar → agendar → ver consulta |
| Lint | **ESLint** (`eslint-config-expo`) | — | Alinhar com o `eslint.config.js` do frontend web |
| Formatação | **Prettier** | Biome | — |
| Hooks de commit | **Husky + lint-staged** | — | Barrar código quebrado antes do commit |
| Padrão de commit | **Commitlint (Conventional Commits)** | — | Alinhado ao [CONTRIBUTING.md](../../CONTRIBUTING.md) |
| Tipos | **TypeScript `strict: true`** | — | — |

### 7.9 Build, entrega e operação

| Categoria | Recomendado | Alternativas | Nota |
| --- | --- | --- | --- |
| Build | **EAS Build** | Fastlane + runners próprios | Gera IPA e APK/AAB na nuvem, sem Mac |
| Submissão às lojas | **EAS Submit** | Fastlane `deliver`/`supply` | App Store Connect e Google Play Console |
| Atualização OTA | **EAS Update** | CodePush | Corrige JS sem esperar revisão da loja |
| Distribuição de teste | **TestFlight** (iOS) + **Play Internal Testing** (Android) | Firebase App Distribution | Professor e equipe testam o build real |
| CI | **GitHub Actions** | — | Lint, testes e build de PR; o repo já tem [.github](../../.github/) |
| Ambientes | `development`, `staging`, `production` via **app variants** | — | Três URLs de API distintas |
| Variáveis de ambiente | **expo-constants** + `app.config.ts` + EAS Secrets | `.env` versionado | Segredo **nunca** entra no git |
| Erros e crashes | **Sentry (`@sentry/react-native`)** | Firebase Crashlytics, Bugsnag | Com **scrubbing** de dado clínico |
| Produto e analytics | **PostHog** | Firebase Analytics, Amplitude | Só evento de uso; **nunca** conteúdo de prontuário |
| Feature flags | **Firebase Remote Config** | Unleash, ConfigCat | Ligar a aba "Rede" só quando o backend estiver pronto |

### 7.10 O que muda no backend

| Item | Tecnologia | Motivo |
| --- | --- | --- |
| Documentação de API | **springdoc-openapi** | Gera o client tipado do app |
| Migração de schema | **Flyway** | Hoje é `ddl-auto=update`, o que é arriscado com app publicado em loja |
| Push | **Firebase Admin SDK (Java)** | Enviar notificação ao criar a `Notification` |
| Cache e rate limit | **Redis** + **Bucket4j** | Proteger o login (já previsto no [BACKLOG.md](../../src/BACKLOG.md) 2.4.1) |
| Storage de arquivos | **MinIO** (dev) / **S3** (produção) | Exames, PDFs, fotos |
| Busca geográfica | **PostGIS** ou Haversine em SQL | Consulta "clínicas em um raio de X km" |
| E-mail transacional | **Spring Mail** + Mailhog (dev) | Recuperação de senha |
| Observabilidade | **Spring Actuator** + Prometheus/Grafana | Latência das rotas que o app consome |

### 7.11 Ferramentas de produto e design

| Categoria | Ferramenta | Uso |
| --- | --- | --- |
| Design de telas | **Figma** | Wireframes da seção 5 viram alta fidelidade |
| Protótipo navegável | Figma Prototype | Validar o fluxo com usuários reais antes de codar |
| Ícone e splash | `expo-splash-screen` + Figma | Identidade alinhada ao logo do web |
| Backlog | GitHub Projects (formato Épico › Feature › Backlog Item › Task) | Espelha o [BACKLOG.md](../../src/BACKLOG.md) |
| Diagramas | Mermaid ou Excalidraw | Arquitetura e fluxos em [docs/arquitetura.md](../arquitetura.md) |

---

## 8. Estrutura de pastas proposta

O app entra no monorepo existente, ao lado de `backend/` e `frontend/`:

```text
src/clinic-system/
├── backend/                       # Spring Boot (já existe)
├── frontend/                      # React + Vite (já existe)
└── mobile/                        # 🔵 NOVO — React Native + Expo
    ├── app/                       # Expo Router: cada arquivo é uma rota
    │   ├── _layout.tsx            # Provedores globais (Query, Auth, Tema)
    │   ├── (auth)/
    │   │   ├── _layout.tsx
    │   │   ├── welcome.tsx
    │   │   ├── login.tsx
    │   │   ├── register.tsx
    │   │   └── forgot-password.tsx
    │   └── (app)/
    │       ├── _layout.tsx        # Tab bar + guarda de rota (ROLE_PATIENT)
    │       ├── home/
    │       ├── booking/
    │       ├── network/
    │       ├── health/
    │       └── profile/
    │
    ├── src/
    │   ├── api/                   # Camada HTTP
    │   │   ├── client.ts          # Axios + interceptor JWT/refresh
    │   │   ├── endpoints.ts       # Constantes das rotas
    │   │   └── generated/         # Tipos gerados do OpenAPI
    │   │
    │   ├── features/              # Organizado por domínio, não por tipo de arquivo
    │   │   ├── auth/              # hooks, componentes, schemas
    │   │   ├── appointments/
    │   │   ├── records/
    │   │   ├── insurance/
    │   │   ├── network/           # mapa e rede credenciada
    │   │   └── notifications/
    │   │
    │   ├── components/            # UI compartilhada
    │   │   ├── ui/                # Button, Card, Input, Sheet...
    │   │   ├── feedback/          # Skeleton, EmptyState, ErrorState, OfflineBanner
    │   │   └── layout/
    │   │
    │   ├── hooks/                 # useAuth, useLocation, useOnlineStatus, useBiometrics
    │   ├── store/                 # Zustand (sessão, preferências, convênio ativo)
    │   ├── lib/                   # secure-storage, date, cpf, distance, deeplink
    │   ├── theme/                 # tokens, cores, tipografia, espaçamento
    │   ├── types/                 # Modelos de domínio (Appointment, Insurance...)
    │   └── i18n/                  # pt-BR
    │
    ├── assets/                    # fontes, ícones, ilustrações, splash
    ├── __tests__/                 # Jest + Testing Library
    ├── .maestro/                  # Fluxos E2E
    ├── app.config.ts              # Configuração por ambiente
    ├── eas.json                   # Perfis de build
    ├── tsconfig.json
    └── package.json
```

### 8.1 Convenções de código

| Regra | Detalhe |
| --- | --- |
| Organização por feature | Tudo de um domínio mora junto (`features/appointments/`), não espalhado em `components/`, `hooks/`, `services/` |
| Componente não chama HTTP | Toda chamada passa por um hook de `features/*/hooks` sobre o TanStack Query |
| Sem texto solto na tela | Todo texto vem do `i18n/`, o que já prepara acessibilidade e revisão de conteúdo |
| Sem `any` | `strict: true`; tipo de API vem do OpenAPI gerado |
| Dado sensível não vai para log | Regra de lint proibindo `console.log` de campos de prontuário, CPF e carteirinha |

---

## 9. Segurança, privacidade e conformidade

O app trata **dado pessoal sensível** na definição da LGPD (art. 5º, II): dado de saúde. O nível de exigência é maior que o de um app comum.

### 9.1 Requisitos técnicos mínimos

| Requisito | Implementação |
| --- | --- |
| Criptografia em trânsito | **TLS 1.3** obrigatório; HTTP puro bloqueado (`usesCleartextTraffic=false`) |
| Criptografia em repouso | **AES-256** no banco local e no cache; token no Keychain/Keystore |
| Autenticação | JWT + refresh com rotação; **biometria** como segundo fator local |
| MFA | 💡 Avaliar para fase 3 (código por e-mail ou SMS no login em dispositivo novo) |
| Bloqueio automático | Exigir biometria ao voltar do background após N minutos |
| Certificate pinning | Fixar o certificado da API para evitar interceptação |
| Sem dado sensível em log | Scrubbing no Sentry; analytics só com evento, nunca conteúdo |
| Sem screenshot em tela sensível | `FLAG_SECURE` no Android; máscara no app switcher do iOS |
| Root/jailbreak | Aviso ou bloqueio do prontuário |
| Sessão | Logout revoga o refresh token no servidor |

### 9.2 Conformidade regulatória

| Norma | O que exige | Impacto no app |
| --- | --- | --- |
| **LGPD (Lei 13.709/2018)** | Base legal, consentimento granular, minimização, direito de acesso e exclusão | Tela `/profile/privacy` com consentimentos, exportação e exclusão de conta |
| **ANPD** | Diretrizes de tratamento e de dado biométrico | Nunca armazenar biometria bruta — a validação fica no Secure Enclave/TEE do aparelho |
| **Resolução CFM 2.314/2022** | Telemedicina: prontuário deve registrar todas as prescrições emitidas | Teleconsulta só entra com gravação no PEP |
| **Lei 14.510/2022** | Validade da prescrição eletrônica assinada com ICP-Brasil | Prescrição digital precisa de assinatura NGS2 |
| **SNCR (a partir de jun/2026)** | Controle digital em tempo real de receituário de controlados | Se o SCU emitir controlados, a integração é obrigatória |
| **RNDS / HL7 FHIR** | Padrão obrigatório de interoperabilidade nacional | Direciona o modelo de dados na fase 4 |
| **TISS / ANS** | Padrão de troca com operadoras | Já refletido em `ConsultationGuia` |
| **Políticas de loja** | Apple e Google exigem política de privacidade, rótulo de dados e justificativa de permissões | Bloqueia publicação se faltar |
| **OWASP MASVS** | Referência de segurança mobile | Checklist antes do release |

### 9.3 Permissões solicitadas e justificativa

| Permissão | Quando é pedida | Justificativa mostrada ao usuário |
| --- | --- | --- |
| Localização (durante o uso) | Ao abrir a aba "Rede" pela primeira vez | "Para mostrar as clínicas mais próximas de você" |
| Notificações | Após o primeiro agendamento | "Para avisar quando sua consulta for confirmada" |
| Câmera | Ao usar check-in por QR ou enviar documento | "Para ler o QR do balcão" |
| Biometria | Nas configurações, opcional | "Para entrar mais rápido com segurança" |
| Galeria | Ao anexar documento | "Para anexar seu exame" |

> **Regra:** nenhuma permissão é pedida na abertura do app. Cada uma é pedida **no momento em que faz sentido**, com uma tela de contexto antes do diálogo do sistema.

---

## 10. Roadmap e backlog

### 10.1 Fases

| Fase | Nome | Entrega verificável | Depende de |
| --- | --- | --- | --- |
| **0** | Fundação | App roda, autentica e navega; CI verde; build distribuído para a equipe | `springdoc-openapi` |
| **1** | Paridade (MVP) | Tudo que o paciente faz na web, feito pelo celular | Refresh token, push |
| **2** | Rede credenciada | Mapa com filtro por convênio + rota + agendar a partir do pin | B1–B4 da seção 6.1 |
| **3** | Diferenciação | Check-in digital, exames, teleconsulta | Storage, LiveKit |
| **4** | Exploratório | RNDS/FHIR, vacinas, reembolso, wearables | Homologação MS |

### 10.2 Definition of Done do app

Uma funcionalidade só está pronta quando:

- [ ] Funciona em **iOS e Android** físicos (não só no simulador)
- [ ] Trata os **quatro estados** da seção 5.3 (carregando, vazio, erro, offline)
- [ ] Tem teste automatizado do caminho feliz
- [ ] Passa em lint, types e CI
- [ ] Está acessível (leitor de tela nas ações principais, contraste AA, toque ≥ 44pt)
- [ ] Não registra dado sensível em log nem em analytics
- [ ] Tem evidência anexada ao relatório da sprint (ver [sprints/](../../sprints/))
- [ ] Este documento foi atualizado (status e changelog)

### 10.3 Épico para o backlog do projeto

Segue o formato já usado em [src/BACKLOG.md](../../src/BACKLOG.md) — pronto para virar itens no GitHub Projects.

```text
🟣 ÉPICO 4 — Aplicativo Mobile do Paciente

🔵 Feature 4.1 — Fundação do App
   📗 4.1.1 Setup do projeto Expo + TypeScript + CI
   📗 4.1.2 Design system e componentes base
   📗 4.1.3 Camada de API com JWT, refresh e tratamento de 401
   📗 4.1.4 Navegação, tab bar e guarda de rota por role

🔵 Feature 4.2 — Autenticação Mobile
   📗 4.2.1 Backend: refresh token e recuperação de senha
   📗 4.2.2 Mobile: login, autocadastro em stepper e biometria

🔵 Feature 4.3 — Consultas no Mobile
   📗 4.3.1 Listagem, detalhe e cancelamento
   📗 4.3.2 Fluxo de agendamento em 4 passos
   📗 4.3.3 Estado PENDING comunicado com clareza ao paciente

🔵 Feature 4.4 — Prontuário e Prescrições no Mobile
   📗 4.4.1 Timeline do histórico clínico
   📗 4.4.2 Detalhe da consulta com CID-10 e prescrições

🔵 Feature 4.5 — Convênios e Carteirinha Digital
   📗 4.5.1 CRUD de convênios e definição de principal
   📗 4.5.2 Carteirinha digital com acesso offline

🔵 Feature 4.6 — Notificações Push
   📗 4.6.1 Backend: entidade DeviceToken e envio via FCM
   📗 4.6.2 Mobile: registro do token, deep link e preferências

🔵 Feature 4.7 — Rede Credenciada com Mapa
   📗 4.7.1 Backend: coordenadas em Clinic e geocoding no cadastro
   📗 4.7.2 Backend: InsuranceOperator e ClinicAcceptedInsurance
   📗 4.7.3 Backend: busca geográfica com filtro por operadora
   📗 4.7.4 Mobile: mapa, filtros, lista por distância e rota
   📗 4.7.5 Mobile: agendar a partir da clínica escolhida no mapa
```

---

## 11. Perguntas em aberto

Nada aqui é decisão. São pontos que precisam de resposta da equipe ou do professor.

| # | Pergunta | Quem responde | Impacto se ficar sem resposta |
| --- | --- | --- | --- |
| Q1 | Confirmamos **React Native + Expo**? | Equipe | Bloqueia a fase 0 inteira |
| Q2 | Mapa com **Google Maps** (pago acima da cota) ou **MapLibre/OSM** (gratuito)? | Equipe | Bloqueia a fase 2 e pode gerar custo |
| Q3 | Como normalizar a **operadora** do convênio: autocomplete com base ANS ou matching por `codigoAns`? | Equipe + backend | Sem isso o filtro do mapa não funciona (B3) |
| Q4 | Quem cadastra as **coordenadas e a rede aceita** de cada clínica: geocoding automático ou o gestor no painel? | Produto | Define escopo do painel web na fase 2 |
| Q5 | O app é publicado nas **lojas** ou distribuído só como build de teste na disciplina? | Professor | Muda esforço: conta de desenvolvedor, política de privacidade, revisão |
| Q6 | Teleconsulta entra no escopo do semestre? | Professor + equipe | Alto custo; impacto regulatório (CFM 2.314/2022) |
| Q7 | Quanto tempo o prontuário pode ficar em **cache offline** no aparelho? | Equipe + LGPD | Trade-off entre usabilidade e risco em caso de perda do celular |
| Q8 | Vamos emitir **receita de controlado**? | Produto | Se sim, integração com o SNCR passa a ser obrigatória a partir de jun/2026 |
| Q9 | Perfis **dependentes** entram em qual fase? | Produto | Reescreve o modelo de autorização |

---

## 12. Changelog do documento

| Versão | Data | Autor | Mudança |
| --- | --- | --- | --- |
| 0.1.0 | 2026-08-21 | Equipe SCU | Versão inicial: visão, paridade com a web, benchmarking, backlog em 5 fases, esqueleto de navegação, lacunas de backend, stack completa, estrutura de pastas, segurança e roadmap |
| 0.2.0 | 2026-09-14 | Equipe SCU | Port Flutter Android e ADR 001: seção 7.1 superada; stack e árvore Expo mantidas como histórico. Épico 4 transposto para src/BACKLOG. V1 sem cache clínico, mapa, push ou biometria; estrutura de APK/AAB sem conexão ao Play Console. Aceite físico e revisão permanecem pendentes. |

---

## 13. Fontes e referências

### Benchmarking

- [App Unimed Cliente](https://www.appunimed.com/beneficiario/dist/index.html) — funcionalidades do beneficiário
- [Unimed Federação/RS — App Cliente](https://www.unimed.coop.br/site/web/unimedrs/app-cliente) — guia médico e rede credenciada
- [Unimed CNU (App Store)](https://apps.apple.com/BR/app/id1485921071) — rede credenciada por geolocalização e reembolso
- [App Amil Clientes](https://institucional.amil.com.br/app-amil-clientes) — mapa com rota, teleconsulta e carteirinha digital
- [Minha Amil — carteirinha digital e serviços](https://amil.queirozbeneficios.com.br/app.html)

### Interoperabilidade e regulação

- [RNDS — Ministério da Saúde](https://www.gov.br/saude/pt-br/composicao/seidigi/rnds)
- [Guia de implementação FHIR da RNDS](https://rnds-fhir.saude.gov.br/)
- [Guia de integração da RNDS](https://rnds-guia.saude.gov.br/)
- [Prescrição Eletrônica — CFM](https://prescricaoeletronica.cfm.org.br/)
- [O que diz o CFM sobre a receita digital](https://telemedicinamorsch.com.br/blog/cfm-receita-digital) — Resolução CFM 2.314/2022 e ICP-Brasil NGS2
- [Prescrição eletrônica: obrigatoriedade e SNCR](https://institutocdt.com.br/blog/prescricao-eletronica-obrigatoriedade/)
- [Integração Memed com prontuário e telemedicina](https://bydoctor.com.br/blog/integracao-memed-prontuario-telemedicina-como-funciona)

### Segurança e LGPD

- [Desenvolver aplicativo de saúde: LGPD e ANVISA em 2026](https://www.mestresdaweb.com.br/tecnologias/como-desenvolver-aplicativo-de-saude) — AES-256 em repouso, TLS 1.3 em trânsito, MFA
- [LGPD na saúde](https://octo.legal/blog/lgpd-na-saude/)
- [LGPD e dados biométricos](https://confidata.com.br/blog/lgpd-dados-biometricos-reconhecimento-facial-digital) — nunca armazenar biometria bruta
- [Adequação à LGPD em dispositivos móveis](https://www.mobiltec.com.br/adequacao-lgpd-conformidade-dispositivos-moveis/)

### Escolha de framework

- [React Native vs Flutter em 2026 — comparação de engenharia](https://www.bolderapps.com/blog-posts/react-native-vs-flutter-2026) — tamanho de ecossistema e contratação
- [React Native vs Flutter para apps de saúde](https://www.tactionsoft.com/react-native-vs-flutter-healthcare/)
- [React Native vs Flutter em aplicações de saúde](https://emorphis.health/blogs/react-native-vs-flutter/)

### Documentos internos do projeto

- [README do repositório](../../README.md)
- [Backlog do SCU](../../src/BACKLOG.md) — Épico 3 (Sistema voltado para o paciente)
- [Documentação do sistema](../../src/DOCUMENTACAO.md)
- [Requisitos](../requisitos.md) · [Arquitetura](../arquitetura.md) · [ADRs](../decisoes/)
