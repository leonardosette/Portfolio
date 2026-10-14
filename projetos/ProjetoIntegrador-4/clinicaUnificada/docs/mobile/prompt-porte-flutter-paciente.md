# Prompt de execução — Porte do App do Paciente para Flutter (Android)

> **Tipo deste documento:** prompt de execução para agente de codificação.
> **Versão:** 1.0.0 · **Data:** 2026-09-13
> **Projeto:** Sistema Clínico Unificado (SCU) — CEUB
> **Repositório:** raiz em `clinicaUnificada`, branch `main`
> **Documento irmão:** [app-paciente.md](app-paciente.md) — visão de produto e roadmap de longo prazo

---

## 0. Como usar este documento

Você é um agente de codificação encarregado de **criar um aplicativo Flutter para Android** que entrega as funcionalidades do **paciente** do SCU.

Regras de uso deste prompt:

1. **Leia o documento inteiro antes de escrever a primeira linha de código.** As seções 3 e 5 contêm armadilhas verificadas no código-fonte que quebram implementações ingênuas.
2. **Não invente contrato de API.** Tudo na seção 5 foi lido diretamente do backend Java. Se algo não estiver aqui, **não existe** — não presuma.
3. **Não altere o backend Spring Boot nem o frontend React.** Este porte é aditivo. A única exceção autorizada é a correção de `.gitignore` da seção 12.2, que é obrigatória.
4. **Siga o roteiro da seção 13 na ordem.** Cada etapa tem critério de aceite verificável. Não pule para as telas antes de a camada de rede funcionar.
5. Quando este documento disser **OBRIGATÓRIO**, não há espaço para julgamento. Quando disser **RECOMENDADO**, você pode divergir se justificar por escrito no pull request.
6. As decisões da seção 16 **não são suas**. Se esbarrar numa delas, pare, aplique o contorno indicado e registre a pendência.

---

## 1. Missão

Construir `src/clinic-system/mobile/` — um aplicativo Flutter que dá ao **paciente** do SCU, pelo celular Android, tudo que ele já consegue fazer no portal web hoje.

O critério de sucesso da v1 é **paridade funcional com o dashboard web do paciente**, com qualidade de app nativo: tratamento de erro real, estados de carregamento explícitos, sessão persistida com segurança e navegação por abas.

---

## 2. Escopo

### 2.1 Dentro do escopo

| # | Funcionalidade | Endpoint principal |
| --- | --- | --- |
| 1 | Autocadastro do paciente | `POST /api/pacients/register` |
| 2 | Login com e-mail e senha | `POST /api/auth/login` |
| 3 | Visão geral com indicadores e próxima consulta | lista de consultas |
| 4 | Agendar consulta (assistente de 3 passos) | `POST /api/patient/appointments` |
| 5 | Minhas consultas: lista, filtros, detalhe e cancelamento | `/api/patient/appointments` |
| 6 | Meu prontuário: histórico e prescrições | `/api/patient/records` |
| 7 | Meus convênios: CRUD e definir principal | `/api/patient/insurance` |
| 8 | Meu perfil: visualizar e editar dados clínicos | `/api/patient/profile` |
| 9 | Notificações com contador de não lidas | `/api/patient/notifications` |
| 10 | Sessão segura, logout e guarda de rota por papel | JWT |

### 2.2 Fora do escopo — não implemente

- **Telas de médico, administrador, gestor e recepcionista.** O app é exclusivo do paciente.
- **iOS e web.** Gere apenas a plataforma Android.
- **Mapa e rede credenciada.** Depende de coordenadas em `Clinic`, que não existem no backend. Ver seção 16.
- **Notificação push (FCM/APNs).** Não há entidade `DeviceToken` nem disparo no backend. Use apenas notificações in-app lidas por consulta ao servidor.
- **Teleconsulta, exames, dependentes, carteira de vacinas, reembolso, chatbot de triagem.**
- **Biometria** na v1. Depende de sessão longa, que não existe. Ver seção 16.
- **Carteirinha digital offline.** Depende de cache criptografado de dado sensível — decisão de LGPD pendente. Ver seção 16.

---

## 3. Regras inegociáveis

Estas regras vêm de leitura direta do backend. Violar qualquer uma gera defeito garantido.

### 3.1 O cabeçalho de autorização é literal

O login devolve o JWT **cru, sem prefixo**. O `JwtAuthenticationFilter` faz `header.startsWith("Bearer ")` — com B maiúsculo e **exatamente um espaço** — e depois `substring(7)`.

`"bearer "`, `"Bearer  "` com dois espaços ou `"Token "` fazem o filtro **ignorar o cabeçalho em silêncio**, e a requisição volta 401 sem corpo.

```dart
options.headers['Authorization'] = 'Bearer $token'; // exatamente assim
```

### 3.2 O papel vem com prefixo

`LoginResponse.role` vem como `"ROLE_PATIENT"`, não `"patient"`. O enum Java é minúsculo (`Role.patient`), mas o `AuthController` monta `"ROLE_" + role.name().toUpperCase()`.

Comparar com `"patient"`, `"PATIENT"` ou `"Patient"` quebra o roteamento pós-login.

### 3.3 O app precisa recusar quem não é paciente

`POST /api/auth/login` é **único para todos os perfis** e não filtra nada. Um médico ou recepcionista consegue logar no app do paciente, recebe token válido, e então toma **403 em todas as telas**.

**OBRIGATÓRIO:** após login bem-sucedido, se `role != "ROLE_PATIENT"`, descarte o token, não persista sessão e exiba:

> Este aplicativo é exclusivo para pacientes. Use o portal web para acessar sua conta.

### 3.4 Erros do backend vêm em TEXTO PURO, não JSON

Nove casos verificados usam `ResponseEntity.badRequest().body(String)`:

| Status | Corpo literal |
| --- | --- |
| 401 | `Credenciais inválidas` |
| 400 | `Email já cadastrado.` |
| 400 | `CPF já cadastrado.` |
| 400 | `Clínica não encontrada.` |
| 400 | `Médico não encontrado.` |
| 400 | `Médico não pertence à clínica selecionada.` |
| 400 | `Médico indisponível para agendamentos.` |
| 400 | `Formato de data inválido. Use: yyyy-MM-ddTHH:mm` |
| 400 | `A data deve ser futura.` |

Pior: mesmo com `Accept: application/json`, o `StringHttpMessageConverter` escreve texto cru e o `Content-Type` pode sair como `application/json`. **O cabeçalho não salva você.**

**OBRIGATÓRIO:** ao extrair mensagem de erro, tente `jsonDecode`; se lançar, use o corpo cru como mensagem.

### 3.5 Existem quatro formatos diferentes de resposta de erro

| Situação | Status | Corpo |
| --- | --- | --- |
| Regra de negócio | 400 | **texto puro** |
| Falha de `@Valid`, enum inválido, UUID malformado, JSON inválido | 400 | **JSON padrão do Spring**, com `message` vazia |
| Token ausente, inválido ou expirado | 401 | **zero bytes** |
| Papel errado | 403 | **JSON padrão do Spring** |
| Recurso não encontrado | 404 | **zero bytes** |
| `RuntimeException` interna | 500 | **JSON padrão do Spring**, `message` vazia |

Chamar `jsonDecode(response.body)` em 401 ou 404 lança `FormatException` em string vazia. **Trate sempre pelo `statusCode` primeiro.**

Não existe `@ControllerAdvice` no projeto inteiro, e `server.error.include-message` está no padrão `never` — portanto **o app nunca descobre qual campo falhou** numa validação. Toda validação de formulário tem que ser duplicada no Flutter.

### 3.6 O formato de data e hora do agendamento é rígido

`scheduledAt` é parseado com `LocalDateTime.parse()`. O sufixo `Z` **faz o parse falhar**.

```dart
// ERRADO — gera "2026-09-20T17:30:00.000Z" e devolve 400 "Formato de data inválido"
final ruim = dataHora.toUtc().toIso8601String();

// CERTO — gera "2026-09-20T14:30"
final bom = DateFormat("yyyy-MM-dd'T'HH:mm").format(dataHora);
```

Na leitura, os formatos são **inconsistentes na mesma API**: `scheduledAt` vem como `"2026-09-20T14:30"` (sem segundos, porque `LocalDateTime.toString()` os omite quando são zero) e `createdAt` de notificação vem como `"2026-09-13T16:13:22.123456"` (com microssegundos).

**OBRIGATÓRIO:** use `DateTime.parse()`, que tolera os dois. Nunca use `DateFormat(...).parse()` para ler da API.

### 3.7 Datas puras não podem sofrer conversão de fuso

`birthDate`, `dataInicio` e `dataValidade` vêm como `"yyyy-MM-dd"`. Interpretá-las como UTC faz a data exibida **voltar um dia** em UTC-3. Faça o parse como data local, sem conversão.

### 3.8 Armadilha de fuso no agendamento

O servidor compara `scheduledAt.isBefore(LocalDateTime.now())` usando o fuso **do processo Java**. Se o backend rodar em UTC e o celular enviar hora local do Brasil (UTC-3), um horário 2h no futuro para o usuário é 1h no passado para o servidor, e a resposta é `400 A data deve ser futura.` sem explicação.

Todos os `LocalDateTime` da API são ingênuos (sem offset, sem `Z`). **Não os interprete como UTC.**

### 3.9 Um endpoint devolve número cru

`GET /api/patient/notifications/unread-count` tem retorno Java `long`. O corpo é literalmente `3`, não `{"count":3}`.

```dart
final count = int.parse(response.data.toString().trim());
```

### 3.10 Quatro endpoints devolvem 200 com corpo vazio

`POST /notifications/mark-all-read`, `POST /notifications/{id}/read`, `DELETE /appointments/{id}` e `DELETE /insurance/{id}`.

Nenhum devolve o recurso atualizado. **Sempre refaça o GET correspondente depois de qualquer escrita.**

Pior: `POST /notifications/{id}/read` devolve **200 mesmo quando não faz nada** — id inexistente ou notificação de outro usuário retornam 200 sem marcar. O 200 não é confirmação de efeito.

### 3.11 As duas semânticas de atualização são contraditórias

| Endpoint | Semântica | Consequência |
| --- | --- | --- |
| `PUT /api/patient/profile` | Grava só `if (campo != null)` | Mandar `null` **não limpa**. Para apagar, mande `""` |
| `PUT /api/patient/insurance/{id}` | Grava tudo incondicionalmente | **Apaga o que você não mandar.** Sempre envie o objeto inteiro |

Além disso, `titular` e `principal` no `InsuranceRequest` são `boolean` primitivos. **Omitir a chave grava `false`** — esquecer `titular` transforma o paciente em dependente, contrariando o padrão `true` da entidade. Envie sempre os dois explicitamente.

### 3.12 A sessão cai em 1 hora, sem aviso e sem refresh

`security.jwt.expiration-ms=3600000`, fixo no `application.properties`. Não existe endpoint de refresh, de logout nem de `/me`.

Depois de 60 minutos, qualquer requisição volta **401 com corpo vazio**. Não há como renovar.

**OBRIGATÓRIO:** o interceptor trata 401 como sessão expirada — limpa o armazenamento seguro, redireciona para o login e exibe:

> Sua sessão expirou. Entre novamente.

Nunca tente renovar o token: o endpoint não existe. **Nunca guarde a senha do usuário no dispositivo** para relogin automático.

### 3.13 Demais armadilhas verificadas

| Armadilha | Consequência prática |
| --- | --- |
| Token continua válido após a conta ser desativada | O filtro não checa `isActive()`. O bloqueio só aparece no próximo login |
| Conta inativa é indistinguível de senha errada | Ambas devolvem 401 `Credenciais inválidas`. Não prometa diagnóstico ao usuário |
| `?status=` inválido é ignorado em silêncio | `valueOf()` lança e o `catch` engole. Devolve a lista **completa** e o app acha que filtrou. **Filtre no cliente** |
| Zero paginação em toda a API do paciente | `/appointments`, `/records`, `/notifications` devolvem a lista inteira sempre. Pagine na memória |
| Zero validação de conflito de horário | Não existe endpoint de horários disponíveis. Dois pacientes podem marcar o mesmo médico no mesmo minuto |
| `birthDate` malformado devolve **500**, não 400 | `LocalDate.parse` sem `try/catch`. Valide no cliente antes de enviar |
| `/records` não tem ordenação | Sem `OrderBy`; a ordem do Postgres pode variar entre chamadas. **Ordene localmente** por `scheduledAt` |
| `/records` e `/records/{id}` discordam | A lista filtra por `COMPLETED`; o detalhe não filtra por status nenhum |
| `doctorId` é o id da entidade `Doctor` | Não é o `userId` do médico. Use o `id` devolvido por `/booking/.../doctors` |
| Dois ids no perfil | `id` é o UUID do **User** (é ele que casa com consultas); `patientProfileId` é o da linha **Patient**. Nenhum vem no login |
| 500 nas rotas do paciente | `resolveUser` lança `RuntimeException` crua. Trate 500 nessas rotas como "sessão inválida", não como "erro do servidor, tente de novo" |
| Escrita de convênio deixa o cache incoerente | `clearPrincipalForPatient` é um UPDATE em massa e a resposta traz só o convênio alterado. **Sempre refaça o GET da lista** |
| Apagar o convênio principal não promove ninguém | O paciente fica sem principal. Trate esse estado na interface |

---

## 4. Ponto de partida

### 4.1 O que já existe no repositório

```text
clinicaUnificada/
├── docs/mobile/app-paciente.md        # visão de produto (leia; não é contrato de API)
├── src/
│   ├── BACKLOG.md                      # Épico › Feature › Backlog Item › Task
│   ├── COMO_RODAR.md                   # instruções de execução do backend
│   └── clinic-system/
│       ├── backend/                    # Spring Boot 3 + PostgreSQL + JWT  (NÃO ALTERAR)
│       ├── frontend/                   # React 19 + Vite                    (NÃO ALTERAR)
│       └── mobile/                     # ←  VOCÊ CRIA ISTO
```

### 4.2 Arquivos do backend que definem o contrato

Consulte-os quando tiver dúvida; eles são a fonte de verdade:

- `backend/src/main/java/com/scu/clinic_system/controller/PatientSelfController.java` — todas as rotas do paciente
- `backend/src/main/java/com/scu/clinic_system/controller/AuthController.java` — login
- `backend/src/main/java/com/scu/clinic_system/controller/PacientController.java` — autocadastro
- `backend/src/main/java/com/scu/clinic_system/service/PacientService.java` — o record `PatientResponse`
- `backend/src/main/java/com/scu/clinic_system/model/` — entidades e enums
- `backend/src/main/java/com/scu/clinic_system/config/SecurityConfig.java` — autorização

### 4.3 Referência de paridade

`frontend/sistema-clinico-unificado-frontend/src/pages/DashBoardPaciente.jsx` (1252 linhas) é o **dashboard web do paciente**. A seção 9 já traduziu o comportamento dele; consulte o arquivo se precisar de detalhe visual.

### 4.4 Não existe paciente de teste

O `DataInitializer` cria **apenas um superadmin** (`admin@scu.local`). Esse usuário recebe `ROLE_SUPERADMIN` e toma **403** em todas as rotas `/api/patient/**`.

> Atenção: o `COMO_RODAR.md` afirma que o seed cria um "Manager global" com papel `manager`. O código diz `Role.superadmin`. **Confie no código.**

Crie o paciente de teste pelo endpoint público:

```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/pacients/register" `
  -Method Post -ContentType "application/json" `
  -Body '{"name":"Paciente Teste","email":"paciente@teste.com","cpf":"12345678901","birthDate":"1990-05-20","password":"Senha#123"}'
```

---

## 5. Contrato da API

Base: `{baseUrl}` + caminho. Porta padrão **8080** (`server.port` não está definido). Não há prefixo de versão (`/v1`) nem OpenAPI/Swagger no projeto.

Todas as rotas `/api/patient/**` exigem `ROLE_PATIENT` (verificado em dois lugares: `SecurityConfig` e `@PreAuthorize` na classe).

### 5.1 Mapa dos 22 endpoints

| # | Método | Caminho | Autenticação |
| --- | --- | --- | --- |
| 1 | POST | `/api/auth/login` | pública |
| 2 | POST | `/api/pacients/register` | pública |
| 3 | GET | `/api/patient/profile` | paciente |
| 4 | PUT | `/api/patient/profile` | paciente |
| 5 | GET | `/api/patient/appointments?status=` | paciente |
| 6 | GET | `/api/patient/appointments/{id}` | paciente |
| 7 | POST | `/api/patient/appointments` | paciente |
| 8 | DELETE | `/api/patient/appointments/{id}` | paciente |
| 9 | GET | `/api/patient/records` | paciente |
| 10 | GET | `/api/patient/records/{appointmentId}` | paciente |
| 11 | GET | `/api/patient/notifications` | paciente |
| 12 | GET | `/api/patient/notifications/unread-count` | paciente |
| 13 | POST | `/api/patient/notifications/mark-all-read` | paciente |
| 14 | POST | `/api/patient/notifications/{id}/read` | paciente |
| 15 | GET | `/api/patient/booking/clinics` | paciente |
| 16 | GET | `/api/patient/booking/clinics/{clinicId}/specialties` | paciente |
| 17 | GET | `/api/patient/booking/clinics/{clinicId}/doctors?specialtyId=` | paciente |
| 18 | GET | `/api/patient/insurance` | paciente |
| 19 | POST | `/api/patient/insurance` | paciente |
| 20 | PUT | `/api/patient/insurance/{id}` | paciente |
| 21 | DELETE | `/api/patient/insurance/{id}` | paciente |
| 22 | POST | `/api/patient/insurance/{id}/set-principal` | paciente |

> Os endpoints 6 e 10 **existem no backend mas não são usados pela web**. Use-os no app: são a forma correta de abrir o detalhe de uma consulta e o prontuário dela.

### 5.2 Autenticação

#### `POST /api/auth/login`

```jsonc
// requisição
{ "email": "paciente@teste.com", "password": "Senha#123" }
```

```jsonc
// 200
{
  "token": "eyJhbGciOi...",   // JWT cru, sem prefixo
  "name":  "Paciente Teste",
  "email": "paciente@teste.com",
  "role":  "ROLE_PATIENT"     // sempre com prefixo ROLE_
}
```

- **401** — texto puro `Credenciais inválidas` (sem ponto final).
- O método **não tem `@Valid`**: os `@NotBlank` do record nunca executam. Valide no cliente.
- Não devolve `expiresIn`, `userId` nem `refreshToken`.
- **OBRIGATÓRIO:** chame `GET /api/patient/profile` logo após o login — é a única forma de obter os ids.

#### `POST /api/pacients/register`

```jsonc
// requisição — TEM @Valid
{
  "name":      "Paciente Teste",   // @NotBlank
  "email":     "p@teste.com",      // @Email @NotBlank
  "cpf":       "12345678901",      // @NotBlank @Size(min=11,max=11) — só dígitos, SEM máscara
  "birthDate": "1990-05-20",       // @NotBlank, ISO yyyy-MM-dd
  "password":  "Senha#123"         // @NotBlank, sem regra de força
}
```

- **201** — devolve `PatientResponse` (seção 5.3), com os 6 campos clínicos em `null`. **Não devolve token**: chame o login em seguida.
- **400** texto puro `Email já cadastrado.` ou `CPF já cadastrado.`
- **400** JSON do Spring se `@Valid` falhar — **sem indicar qual campo**.
- **500** se `birthDate` não for ISO. Valide antes.
- O backend cria automaticamente uma notificação de boas-vindas, então a lista de notificações nunca vem vazia para conta nova.

### 5.3 Perfil

```jsonc
// PatientResponse — GET e PUT /api/patient/profile, e POST /api/pacients/register
{
  "id":                    "uuid",   // UUID do USER — é este que casa com consultas
  "patientProfileId":      "uuid",   // UUID da linha Patient — usado pelos convênios
  "name":                  "string",
  "email":                 "string",
  "cpf":                   "string", // 11 dígitos, sem máscara
  "birthDate":             "1990-05-20",
  "active":                true,
  "phone":                 "string|null",
  "address":               "string|null",
  "bloodType":             "A_POS|A_NEG|B_POS|B_NEG|AB_POS|AB_NEG|O_POS|O_NEG|null",
  "allergies":             "string|null",
  "emergencyContactName":  "string|null",
  "emergencyContactPhone": "string|null"
}
```

```jsonc
// PUT /api/patient/profile — semântica de PATCH (ver 3.11)
{
  "phone": "", "address": "", "bloodType": "O_NEG",
  "allergies": "", "emergencyContactName": "", "emergencyContactPhone": ""
}
```

- Devolve o `PatientResponse` completo e atualizado.
- **Não permite alterar** `name`, `email`, `cpf`, `birthDate` nem senha.
- **Não existe endpoint de troca de senha para o paciente**, nem "esqueci minha senha".
- **404 com corpo vazio** se o `User` não tiver linha `Patient`.

### 5.4 Consultas

```jsonc
// AppointmentSummary — raiz é ARRAY, não objeto envelopado
[{
  "id":          "uuid",
  "scheduledAt": "2026-09-20T14:30",  // sem segundos quando são zero
  "status":      "PENDING",
  "type":        "FIRST_VISIT",
  "clinicName":  "Clínica Central",
  "doctor": { "id": "uuid", "name": "Dr. Carlos Lima", "specialtyName": "Cardiologia" }
}]
```

- Nenhum campo vem `null`. Lista vazia é `[]`.
- Ordenação fixa: `scheduledAt` **decrescente**.
- `?status=` aceita qualquer caixa, mas **valor inválido é ignorado em silêncio** (ver 3.13). **Filtre no cliente.**

```jsonc
// POST /api/patient/appointments — TEM @Valid
{
  "clinicId":    "uuid",              // @NotNull
  "doctorId":    "uuid",              // @NotNull — id da entidade Doctor
  "scheduledAt": "2026-09-20T14:30",  // @NotBlank — formato rígido, ver 3.6
  "type":        "FIRST_VISIT"        // @NotNull — FIRST_VISIT | RETURN
}
```

- **201** devolve o `AppointmentSummary` criado, **sempre com `status: "PENDING"`**.
- Erros 400 em texto puro: clínica/médico não encontrado, médico de outra clínica, médico indisponível, formato de data inválido, data no passado.
- **Não é possível escolher convênio no agendamento.** O `BookingRequest` não tem esse campo.
- Gera notificação automática: título `Solicitação enviada!`.

`DELETE /api/patient/appointments/{id}` devolve **200 com corpo vazio**. Se o status não for `PENDING` nem `SCHEDULED`, devolve **400 texto puro** `Apenas consultas pendentes ou agendadas podem ser canceladas.` Gera notificação `Consulta cancelada`.

### 5.5 Prontuário

```jsonc
// ConsultationRecordDto
{
  "id":            "uuid",   // id do PRONTUÁRIO
  "appointmentId": "uuid",   // id da CONSULTA — é este que vai no path de /records/{id}
  "scheduledAt":   "2026-09-01T10:00",
  "doctorName":    "Dr. Carlos Lima",
  "specialtyName": "Cardiologia",
  "clinicName":    "Clínica Central",
  "chiefComplaint": "string|null",
  "diagnosis":      "string|null",
  "cid10":          "string|null",
  "treatment":      "string|null",
  "notes":          "string|null",
  "prescriptionItems": [
    { "id": "uuid", "medicationName": "string", "dosage": "string|null",
      "duration": "string|null", "notes": "string|null" }
  ]
}
```

- `GET /records` devolve só consultas `COMPLETED`, **sem ordenação garantida**. Ordene localmente.
- `GET /records/{appointmentId}` recebe o id da **consulta**, não do prontuário. Trocar dá **404 vazio**.

### 5.6 Notificações

```jsonc
// NotificationDto
[{
  "id":        "uuid",
  "title":     "string",
  "body":      "string",
  "link":      "string|null",
  "read":      false,
  "createdAt": "2026-09-13T16:13:22.123456"  // com microssegundos
}]
```

- Ordenação: `createdAt` decrescente.
- `GET /notifications/unread-count` devolve **número cru** (ver 3.9).
- Os dois POSTs devolvem **200 vazio** (ver 3.10).

### 5.7 Agendamento — listas em cascata

```jsonc
// GET /booking/clinics
[{ "id": "uuid", "name": "string", "address": "string|null", "phone": "string|null" }]

// GET /booking/clinics/{clinicId}/specialties
[{ "id": "uuid", "name": "string" }]

// GET /booking/clinics/{clinicId}/doctors?specialtyId={uuid}
[{ "id": "uuid", "name": "string", "specialtyName": "string", "specialtyId": "uuid" }]
```

- `specialtyId` é **opcional**: sem ele, lista todos os médicos ativos da clínica.
- `clinicId` inexistente devolve **200 com `[]`**, nunca 404.

### 5.8 Convênios

```jsonc
// InsuranceDto — resposta
{
  "id": "uuid", "operadora": "Unimed", "numeroCarteirinha": "0123456789",
  "plano": "string|null", "codigoAns": "string|null",
  "dataInicio": "2024-01-01|null", "dataValidade": "2027-12-31|null",
  "titular": true, "nomeTitular": "string|null",
  "principal": true, "ativo": true,
  "vencido": false          // CALCULADO pelo backend; não é coluna
}
```

```jsonc
// InsuranceRequest — POST e PUT. TEM @Valid
{
  "operadora":         "Unimed",       // @NotBlank, máx 100
  "numeroCarteirinha": "0123456789",   // @NotBlank, máx 60
  "plano":             "Nacional",     // opcional, máx 100
  "codigoAns":         "123456",       // opcional, máx 10
  "dataInicio":        "2024-01-01",   // opcional, ISO — formato errado dá 500
  "dataValidade":      "2027-12-31",   // opcional, ISO
  "titular":           true,           // OBRIGATÓRIO enviar — boolean primitivo, ver 3.11
  "nomeTitular":       null,           // opcional
  "principal":         false           // OBRIGATÓRIO enviar
}
```

- Ordenação do GET: principal primeiro, depois operadora alfabética.
- `PUT` **apaga o que você não mandar** (ver 3.11).
- `DELETE` devolve 200 vazio e é exclusão física; não promove outro principal.
- Se o `User` não tiver linha `Patient`: `GET` devolve `200 []`, mas `POST`/`PUT`/`DELETE`/`set-principal` devolvem **404 vazio**.

---

## 6. Enums e tradução para português

### 6.1 Valores literais do backend

| Enum | Valores exatos |
| --- | --- |
| `AppointmentStatus` | `PENDING`, `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |
| `AppointmentType` | `FIRST_VISIT`, `RETURN` |
| `BloodType` | `A_POS`, `A_NEG`, `B_POS`, `B_NEG`, `AB_POS`, `AB_NEG`, `O_POS`, `O_NEG` |
| `Role` (no token) | `ROLE_SUPERADMIN`, `ROLE_ADMIN`, `ROLE_MANAGER`, `ROLE_DOCTOR`, `ROLE_NURSE`, `ROLE_RECEPTIONIST`, `ROLE_PATIENT` |

**OBRIGATÓRIO:** todo enum Dart precisa de caminho de fallback para valor desconhecido. O servidor pode ganhar valores novos; o app não pode quebrar.

```dart
enum AppointmentStatus {
  pending('PENDING', 'Aguardando'),
  scheduled('SCHEDULED', 'Agendada'),
  inProgress('IN_PROGRESS', 'Em andamento'),
  completed('COMPLETED', 'Concluída'),
  cancelled('CANCELLED', 'Cancelada'),
  unknown('', '');

  const AppointmentStatus(this.wire, this.label);
  final String wire;
  final String label;

  static AppointmentStatus fromWire(String? value) => values.firstWhere(
        (e) => e.wire == value,
        orElse: () => AppointmentStatus.unknown,
      );

  /// Só estes dois estados permitem cancelamento pelo paciente.
  bool get cancelavel => this == pending || this == scheduled;
}
```

Quando `unknown`, exiba a string crua vinda da API — é o que a web faz.

### 6.2 Rótulos em português — use exatamente estes

Estes textos são os que o portal web já usa. **Reaproveite-os** para manter consistência de linguagem entre web e app.

| Valor da API | Texto na tela |
| --- | --- |
| `PENDING` | Aguardando |
| `SCHEDULED` | Agendada |
| `IN_PROGRESS` | Em andamento |
| `COMPLETED` | Concluída |
| `CANCELLED` | Cancelada |
| `FIRST_VISIT` | Primeira Consulta |
| `RETURN` | Retorno |

Filtros da lista de consultas: `Todas` · `Aguardando` · `Agendadas` · `Concluídas` · `Canceladas`.

> A web **não tem filtro para `IN_PROGRESS`** — essas consultas só aparecem em "Todas". Mantenha o mesmo comportamento.

| `BloodType` | Rótulo |
| --- | --- |
| *(null)* | Não informado |
| `A_POS` / `A_NEG` | A+ / A- |
| `B_POS` / `B_NEG` | B+ / B- |
| `AB_POS` / `AB_NEG` | AB+ / AB- |
| `O_POS` / `O_NEG` | O+ / O- |

**Nunca envie `"A+"` para a API** — causa 400. Envie `"A_POS"`.

### 6.3 Formatação

| Uso | Formato | Exemplo |
| --- | --- | --- |
| Data | `dd/MM/yyyy` | `13/09/2026` |
| Data e hora | `dd/MM/yyyy, HH:mm` (com vírgula) | `13/09/2026, 14:30` |
| Hora | `HH:mm` | `14:30` |
| Caixa de data da lista | dia 2 dígitos + mês abreviado em maiúsculas, sem ponto | `13` / `SET` |
| Valor nulo em data | travessão em dash | `—` |
| Tempo relativo | `< 1min` → `agora`; `< 60min` → `há {m}min`; `< 24h` → `há {h}h`; senão `há {d}d` | `há 12min` |
| Iniciais do avatar | primeira letra das 2 primeiras palavras, maiúsculas; sem nome → `?` | `Ana Paula` → `AP` |

**Melhoria autorizada sobre a web:** a web exibe CPF e telefone crus e a data de nascimento em ISO. No app, aplique máscara de exibição em CPF (`000.000.000-00`) e telefone (`(00) 00000-0000`) e formate a data de nascimento como `dd/MM/yyyy`. Mantenha os mesmos rótulos.

---

## 7. Arquitetura exigida

### 7.1 Decisões fechadas

| Aspecto | Decisão | Motivo |
| --- | --- | --- |
| Arquitetura | **Clean Architecture pragmática em 3 camadas por feature** (`data` / `domain` / `presentation`) | Isola o contrato instável da API do resto do app |
| Estado | **Riverpod** (`flutter_riverpod` + `riverpod_annotation`) | `AsyncValue` modela carregando/erro/dado num tipo só, que é exatamente o que esta API exige. Conceitualmente próximo dos hooks do React, que o time já conhece |
| Injeção de dependência | **Os próprios providers do Riverpod** | Não adicione `get_it`: duplicaria o grafo de dependências |
| Rotas | **go_router** com `redirect` como guarda de autenticação | Rotas declarativas e deep link nativo |
| HTTP | **dio** com interceptors | Precisamos de interceptor de token, de 401 e de log com redação |
| Serialização | **`fromJson` escrito à mão**, com helpers defensivos | Ver 7.2 |
| Armazenamento do token | **`flutter_secure_storage`** (Keystore do Android) | Token JWT **nunca** em `SharedPreferences` sem criptografia |
| Igualdade de valor | **`equatable`** | Evita rebuild desnecessário sem o peso de codegen |

### 7.2 Por que não usar geração de código nos modelos

`json_serializable` e `freezed` geram `fromJson` que **lança exceção** quando um campo não-nulo chega `null`. Esta API tem nulabilidade irregular e sem contrato versionado (`ddl-auto=update`, sem OpenAPI). Um campo que hoje vem preenchido pode vir `null` amanhã e derrubar o app inteiro.

**OBRIGATÓRIO:** escreva `fromJson` à mão, usando helpers que degradam com elegância:

```dart
/// lib/core/json.dart
String? asStringOrNull(dynamic v) => v?.toString();

String asString(dynamic v, {String fallback = ''}) => v?.toString() ?? fallback;

bool asBool(dynamic v, {bool fallback = false}) =>
    v is bool ? v : (v?.toString().toLowerCase() == 'true' ? true : fallback);

/// Data e hora vinda de LocalDateTime (sem fuso). Tolera com e sem segundos.
DateTime? asDateTimeOrNull(dynamic v) {
  final s = v?.toString();
  if (s == null || s.isEmpty) return null;
  return DateTime.tryParse(s);
}

/// Data pura "yyyy-MM-dd" — NUNCA converter fuso (ver regra 3.7).
DateTime? asDateOrNull(dynamic v) {
  final s = v?.toString();
  if (s == null || s.length < 10) return null;
  final p = s.substring(0, 10).split('-');
  if (p.length != 3) return null;
  final y = int.tryParse(p[0]), m = int.tryParse(p[1]), d = int.tryParse(p[2]);
  if (y == null || m == null || d == null) return null;
  return DateTime(y, m, d); // local, meia-noite
}

List<Map<String, dynamic>> asObjectList(dynamic v) =>
    v is List ? v.whereType<Map>().map((e) => e.cast<String, dynamic>()).toList() : const [];
```

### 7.3 Tipo de falha

**OBRIGATÓRIO:** um tipo selado cobrindo os casos reais desta API, e apenas eles.

```dart
/// lib/core/failure.dart
sealed class Failure implements Exception {
  const Failure(this.mensagem);
  final String mensagem;
}

/// Sem internet, DNS, conexão recusada.
class FalhaDeRede extends Failure {
  const FalhaDeRede([super.mensagem = 'Sem conexão. Verifique sua internet.']);
}

class FalhaDeTimeout extends Failure {
  const FalhaDeTimeout([super.mensagem = 'O servidor demorou a responder. Tente de novo.']);
}

/// 400 — regra de negócio (texto puro) ou validação (JSON sem detalhe).
class FalhaDeRequisicao extends Failure {
  const FalhaDeRequisicao(super.mensagem);
}

/// 401 — token ausente, inválido ou expirado. SEMPRE derruba a sessão.
class SessaoExpirada extends Failure {
  const SessaoExpirada([super.mensagem = 'Sua sessão expirou. Entre novamente.']);
}

/// 403 — papel errado.
class AcessoNegado extends Failure {
  const AcessoNegado([super.mensagem = 'Você não tem permissão para esta ação.']);
}

/// 404 — sempre com corpo vazio nesta API.
class NaoEncontrado extends Failure {
  const NaoEncontrado([super.mensagem = 'Registro não encontrado.']);
}

/// 5xx. Nas rotas /api/patient/** costuma significar sessão inválida (ver 3.13).
class FalhaDoServidor extends Failure {
  const FalhaDoServidor([super.mensagem = 'Erro no servidor. Tente mais tarde.']);
}

/// Resposta que não casa com o contrato esperado.
class FalhaDeContrato extends Failure {
  const FalhaDeContrato([super.mensagem = 'Resposta inesperada do servidor.']);
}
```

Conversão de `DioException` em `Failure` — repare no tratamento de texto puro:

```dart
/// lib/core/error_mapper.dart
Failure mapearErro(Object erro) {
  if (erro is Failure) return erro;
  if (erro is! DioException) return const FalhaDeContrato();

  switch (erro.type) {
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.sendTimeout:
    case DioExceptionType.receiveTimeout:
      return const FalhaDeTimeout();
    case DioExceptionType.connectionError:
    case DioExceptionType.unknown:
      return const FalhaDeRede();
    default:
      break;
  }

  final status = erro.response?.statusCode ?? 0;
  return switch (status) {
    400 => FalhaDeRequisicao(_extrairMensagem(erro.response?.data)),
    401 => const SessaoExpirada(),
    403 => const AcessoNegado(),
    404 => const NaoEncontrado(),
    >= 500 => const FalhaDoServidor(),
    _ => const FalhaDeContrato(),
  };
}

/// Regra 3.4: tente JSON; se falhar, o corpo cru É a mensagem.
String _extrairMensagem(dynamic corpo) {
  const padrao = 'Não foi possível concluir a operação.';
  if (corpo == null) return padrao;

  if (corpo is Map) {
    final m = corpo['message'];
    // O Spring manda message vazia (include-message=never).
    if (m is String && m.trim().isNotEmpty) return m;
    return padrao;
  }

  final texto = corpo.toString().trim();
  if (texto.isEmpty) return padrao;

  // Pode ser JSON que o dio não decodificou por causa do Content-Type.
  try {
    final decodificado = jsonDecode(texto);
    if (decodificado is Map) {
      final m = decodificado['message'];
      if (m is String && m.trim().isNotEmpty) return m;
      return padrao;
    }
  } on FormatException {
    // Era mesmo texto puro — é este o caminho normal desta API.
  }
  return texto;
}
```

### 7.4 Cliente HTTP

```dart
/// lib/core/api_client.dart
Dio criarDio({required String baseUrl, required SessionStore sessao}) {
  final dio = Dio(BaseOptions(
    baseUrl: baseUrl,
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 20),
    contentType: Headers.jsonContentType,
    // Não lance para 4xx/5xx: nós decidimos no mapeador.
    validateStatus: (s) => s != null && s < 500,
    // A API devolve texto puro em erros e número cru em unread-count.
    responseType: ResponseType.json,
  ));

  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) async {
      final token = await sessao.lerToken();
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token'; // regra 3.1
      }
      handler.next(options);
    },
    onResponse: (response, handler) {
      // 401 nunca tem corpo. Derruba a sessão sem tentar renovar (regra 3.12).
      if (response.statusCode == 401) {
        sessao.encerrarPorExpiracao();
        return handler.reject(DioException(
          requestOptions: response.requestOptions,
          response: response,
          type: DioExceptionType.badResponse,
        ));
      }
      if (response.statusCode != null && response.statusCode! >= 400) {
        return handler.reject(DioException(
          requestOptions: response.requestOptions,
          response: response,
          type: DioExceptionType.badResponse,
        ));
      }
      handler.next(response);
    },
  ));

  return dio;
}
```

**OBRIGATÓRIO sobre log:** se adicionar `LogInterceptor`, habilite **apenas em modo de desenvolvimento** e **nunca** registre corpo de resposta de `/profile`, `/records` ou `/insurance`. São dado pessoal sensível de saúde sob a LGPD. Redija `Authorization`, `cpf`, `numeroCarteirinha`, `diagnosis`, `cid10` e `allergies`.

### 7.5 Guarda de rota

```dart
/// lib/app/router.dart — trecho essencial
redirect: (context, state) {
  final estado = ref.read(sessaoProvider);
  final autenticado = estado.valueOrNull?.autenticado ?? false;
  final indoParaAuth = state.matchedLocation.startsWith('/auth');

  if (!autenticado && !indoParaAuth) return '/auth/login';
  if (autenticado && indoParaAuth) return '/inicio';
  return null;
},
```

E no caso de uso de login, a regra 3.3:

```dart
Future<void> entrar(String email, String senha) async {
  final resposta = await _repo.login(email, senha);
  if (resposta.role != 'ROLE_PATIENT') {
    throw const FalhaDeRequisicao(
      'Este aplicativo é exclusivo para pacientes. '
      'Use o portal web para acessar sua conta.',
    );
  }
  await _sessao.salvar(resposta);
  await _carregarPerfil(); // obrigatório: só aqui vêm os ids
}
```

### 7.6 Cache e comportamento offline na v1

Escopo proporcional: **não** construa banco local.

- Guarde em `SharedPreferences` (dados não sensíveis) apenas `name` e `email` do usuário, para a saudação da tela inicial abrir instantaneamente.
- Toda lista é carregada do servidor. Use `AsyncValue` com `refresh` por gesto de puxar para atualizar.
- Detecte ausência de conexão com `connectivity_plus` e exiba a faixa de "sem conexão" descrita na seção 9.2.
- **Não persista prontuário, CPF nem carteirinha em disco** na v1. Ver seção 16.

---

## 8. Estrutura de pastas

Crie exatamente esta árvore em `src/clinic-system/mobile/`:

```text
mobile/
├── android/                          # gerado pelo flutter create
├── lib/
│   ├── main.dart                     # bootstrap + ProviderScope
│   │
│   ├── app/
│   │   ├── app.dart                  # MaterialApp.router
│   │   ├── router.dart               # go_router + guarda de rota
│   │   └── env.dart                  # configuração por ambiente (dart-define)
│   │
│   ├── core/
│   │   ├── api_client.dart           # dio + interceptors
│   │   ├── endpoints.dart            # constantes dos 22 caminhos
│   │   ├── failure.dart              # sealed class de falha
│   │   ├── error_mapper.dart         # DioException -> Failure
│   │   ├── json.dart                 # helpers defensivos de parse
│   │   ├── session_store.dart        # flutter_secure_storage
│   │   └── formatters.dart           # datas, CPF, telefone, iniciais, tempo relativo
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── data/    auth_repository.dart, login_response.dart, register_request.dart
│   │   │   ├── domain/  session_state.dart
│   │   │   └── presentation/ login_page.dart, register_page.dart, session_provider.dart
│   │   │
│   │   ├── profile/
│   │   │   ├── data/    profile_repository.dart, patient.dart, update_profile_request.dart
│   │   │   └── presentation/ profile_page.dart, profile_provider.dart
│   │   │
│   │   ├── appointments/
│   │   │   ├── data/    appointment_repository.dart, appointment.dart, booking_request.dart
│   │   │   ├── domain/  appointment_status.dart, appointment_type.dart
│   │   │   └── presentation/ appointments_page.dart, appointment_detail_sheet.dart,
│   │   │                     appointments_provider.dart
│   │   │
│   │   ├── booking/
│   │   │   ├── data/    booking_repository.dart, clinic.dart, specialty.dart, doctor_option.dart
│   │   │   └── presentation/ booking_flow_page.dart, step_clinic.dart, step_doctor.dart,
│   │   │                     step_datetime.dart, booking_provider.dart
│   │   │
│   │   ├── records/
│   │   │   ├── data/    record_repository.dart, consultation_record.dart, prescription_item.dart
│   │   │   └── presentation/ records_page.dart, records_provider.dart
│   │   │
│   │   ├── insurance/
│   │   │   ├── data/    insurance_repository.dart, insurance.dart, insurance_request.dart
│   │   │   └── presentation/ insurance_page.dart, insurance_form_page.dart, insurance_provider.dart
│   │   │
│   │   ├── notifications/
│   │   │   ├── data/    notification_repository.dart, app_notification.dart
│   │   │   └── presentation/ notifications_page.dart, notifications_provider.dart
│   │   │
│   │   └── home/
│   │       └── presentation/ home_page.dart, home_provider.dart
│   │
│   ├── shared/
│   │   ├── theme/       app_theme.dart, colors.dart, typography.dart, spacing.dart
│   │   └── widgets/     status_badge.dart, empty_state.dart, error_state.dart,
│   │                    loading_skeleton.dart, offline_banner.dart, app_text_field.dart,
│   │                    primary_button.dart, section_card.dart, async_value_view.dart
│   │
│   └── l10n/            app_pt.arb
│
├── test/                             # espelha a árvore de lib/
├── .gitignore
├── analysis_options.yaml
├── pubspec.yaml
└── README.md
```

### 8.1 Convenções de código

| Regra | Detalhe |
| --- | --- |
| Organização por feature | Tudo de um domínio mora junto. Não crie pastas globais `models/`, `services/`, `screens/` |
| Widget não chama HTTP | Toda chamada passa por um repositório, exposto por um provider |
| Nomes de arquivo | `snake_case.dart`. Classes em `PascalCase` |
| Idioma | Identificadores e código em inglês; textos de interface e mensagens de erro em português |
| Sem `print` | Proibido pelo lint. Use `debugPrint` e só em desenvolvimento |
| Sem `dynamic` solto | Só nos helpers de `json.dart`, que existem justamente para conter isso |
| Texto na interface | Centralize em `l10n/` ou num arquivo de constantes. Nada de literal espalhado em widget |

---

## 9. Telas exigidas

### 9.1 Árvore de navegação

```text
/auth/login                  E-mail + senha
/auth/register               Autocadastro

/  (ShellRoute com BottomNavigationBar de 5 abas)
├── /inicio                  [Aba 1] Visão geral
├── /agendar                 [Aba 2] Assistente de 3 passos
├── /consultas               [Aba 3] Lista + filtros + detalhe + cancelar
├── /prontuario              [Aba 4] Histórico e prescrições
└── /perfil                  [Aba 5] Dados + convênios + sair
    ├── /perfil/editar
    ├── /perfil/convenios
    └── /perfil/convenios/form
/notificacoes                Empilhada, aberta pelo sino
```

> A web usa 6 itens de menu lateral. No celular, **Meus Convênios** entra dentro de **Perfil** para caber em 5 abas. As funcionalidades são as mesmas.

### 9.2 Os quatro estados obrigatórios

**OBRIGATÓRIO em toda tela que carrega dado.** A web falha exatamente aqui — várias telas ficam presas em "Carregando..." para sempre quando a chamada falha. Não repita esse defeito.

| Estado | Tratamento |
| --- | --- |
| Carregando | Esqueleto com a forma do conteúdo real, não um giro genérico |
| Vazio | Ícone + frase + ação, com os textos literais das seções abaixo |
| Erro | `failure.mensagem` + botão **Tentar de novo** que refaz a chamada |
| Sem conexão | Faixa no topo: `Sem conexão com a internet.` |

Encapsule isso num widget único e use em todas as telas:

```dart
/// lib/shared/widgets/async_value_view.dart
class AsyncValueView<T> extends StatelessWidget {
  const AsyncValueView({
    super.key,
    required this.value,
    required this.onData,
    required this.onRetry,
    this.skeleton,
    this.emptyBuilder,
    this.isEmpty,
  });

  final AsyncValue<T> value;
  final Widget Function(T data) onData;
  final VoidCallback onRetry;
  final Widget? skeleton;
  final WidgetBuilder? emptyBuilder;
  final bool Function(T data)? isEmpty;

  @override
  Widget build(BuildContext context) => value.when(
        loading: () => skeleton ?? const LoadingSkeleton(),
        error: (e, _) => ErrorState(
          mensagem: e is Failure ? e.mensagem : 'Algo deu errado.',
          onRetry: onRetry,
        ),
        data: (d) => (isEmpty?.call(d) ?? false)
            ? (emptyBuilder?.call(context) ?? const EmptyState())
            : onData(d),
      );
}
```

### 9.3 Login — `/auth/login`

```text
┌─────────────────────────────────┐
│         ❤  SCU                  │
│      Área do Paciente           │
│                                 │
│  Bem-vindo de volta!            │
│  Insira suas credenciais        │
│                                 │
│  E-mail                         │
│  ┌───────────────────────────┐  │
│  │ ✉  seu@email.com          │  │
│  └───────────────────────────┘  │
│  Senha                          │
│  ┌───────────────────────────┐  │
│  │ 🔒 ••••••••           👁  │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │        Entrar             │  │
│  └───────────────────────────┘  │
│  ⚠ Credenciais inválidas        │
│                                 │
│  Ainda não possui uma conta?    │
│           Cadastrar             │
└─────────────────────────────────┘
```

| Campo | Validação no cliente | Mensagem |
| --- | --- | --- |
| E-mail | não vazio, formato de e-mail | `Informe um e-mail válido.` |
| Senha | não vazia | `Informe sua senha.` |

- Ambas obrigatórias porque o backend **não valida nada** (regra 3.4 / 3.12).
- Botão mostra `Entrando...` e fica desabilitado durante o envio.
- Erro do backend (`Credenciais inválidas`) aparece em faixa vermelha abaixo do botão.
- Se o papel não for `ROLE_PATIENT`, exiba a mensagem da regra 3.3 e **não navegue**.
- Adicione alternância de visibilidade da senha — a web não tem, e é padrão em app.
- **Não** ofereça "esqueci minha senha": o endpoint não existe. Ver seção 16.

### 9.4 Autocadastro — `/auth/register`

| Campo | Tipo | Obrigatório | Validação no cliente |
| --- | --- | --- | --- |
| Nome completo | texto | Sim | não vazio |
| E-mail | e-mail | Sim | formato válido |
| CPF | texto com máscara `000.000.000-00` | Sim | **11 dígitos**; remova a máscara antes de enviar |
| Data de nascimento | seletor de data | Sim | data no passado; envie ISO `yyyy-MM-dd` |
| Senha | senha | Sim | mínimo 8 caracteres (regra do app; o backend não exige) |
| Confirmar senha | senha | Sim | igual à senha |

**OBRIGATÓRIO:** valide CPF e data localmente. `birthDate` malformado devolve **500** (regra 3.13), e o backend não diz qual campo falhou.

- Envie o CPF **sem pontuação** — `@Size(min=11,max=11)` conta caracteres.
- Erros esperados em faixa vermelha: `Email já cadastrado.`, `CPF já cadastrado.`
- Em sucesso (**201**), o backend **não devolve token**. Faça o login automaticamente com as credenciais recém-digitadas e navegue para `/inicio`. Se esse login falhar, mande para `/auth/login` com a mensagem `Conta criada! Faça login para continuar.`

### 9.5 Início — `/inicio`

```text
┌─────────────────────────────────┐
│ Olá, Marlene 👋           🔔(3) │
├─────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐        │
│  │  2  │ │  4  │ │ 17  │        │
│  │Cons.│ │Cons.│ │Total│        │
│  │Agen.│ │ Mês │ │Cons.│        │
│  └─────┘ └─────┘ └─────┘        │
│                                 │
│  ┌───────────────────────────┐  │
│  │ PRÓXIMA CONSULTA          │  │
│  │ Dr. Carlos Lima           │  │
│  │ Cardiologia               │  │
│  │ 📅 20/09/2026  🕐 14:30   │  │
│  │ 🏥 Clínica Central        │  │
│  │ 🔄 Primeira Consulta      │  │
│  └───────────────────────────┘  │
│                                 │
│  Próximas Consultas             │
│  ┌───────────────────────────┐  │
│  │ 28 │ Dr. Ana Paula        │  │
│  │ SET │ Derma · Central     │  │
│  │     │ 09:00   [Agendada]  │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

Cálculos, replicados exatamente da web:

- `proximas` = status `SCHEDULED` **ou** `IN_PROGRESS`, ordenadas por `scheduledAt` **crescente**.
- `esteMes` = consultas cujo `scheduledAt` cai no mês e ano correntes, **de qualquer status** (inclusive canceladas e passadas).
- `total` = tamanho da lista inteira.

| Indicador | Rótulo exato |
| --- | --- |
| `proximas.length` | Consultas Agendadas |
| `esteMes` | Consultas este Mês |
| `total` | Total de Consultas |

- O cartão "Próxima Consulta" usa `proximas.first`.
- A lista "Próximas Consultas" mostra `proximas` da 2ª à 4ª (máximo 3), e **só aparece se houver mais de uma**.
- Vazio: `Nenhuma consulta agendada no momento.`
- Puxar para atualizar refaz `GET /appointments` e `GET /notifications/unread-count`.

### 9.6 Agendar — `/agendar`

Assistente de **3 passos**, com indicador no topo: `1. Clínica` · `2. Médico` · `3. Data e Hora`.

#### Passo 1 — Escolha a Clínica

- Chama `GET /booking/clinics` ao entrar na aba.
- Item: ícone + nome da clínica + endereço (**só se existir**) + seta.
- Ao escolher: **zera** especialidade, médico e lista de médicos, dispara `GET /booking/clinics/{id}/specialties` e vai ao passo 2.
- Vazio: `Nenhuma clínica disponível no momento.`

> **Defeito da web a não repetir:** lá a condição de carregamento é `clinics.length === 0`, então uma lista vazia fica presa em "Carregando..." para sempre. Separe `carregando` de `vazio`.

#### Passo 2 — Especialidade e Médico

- Seletor **Especialidade**. Escolher dispara `GET /booking/clinics/{clinicId}/doctors?specialtyId={id}` e limpa o médico selecionado.
- Antes de escolher: `Selecione uma especialidade para ver os médicos disponíveis.`
- Sem médicos: `Nenhum médico disponível para essa especialidade.`
- Lista de médicos: avatar com iniciais, nome e especialidade. O selecionado ganha borda destacada e marca de confirmação.
- Botão **Continuar** só aparece depois que um médico é escolhido.

> **Defeito da web a corrigir:** voltar à opção "Todas as especialidades" não faz nada lá. No app, essa opção **deve** listar todos os médicos da clínica — o backend já suporta, basta omitir `specialtyId`.

#### Passo 3 — Data, Hora e Tipo

| Campo | Tipo | Obrigatório | Regra |
| --- | --- | --- | --- |
| Data da consulta | seletor de data | Sim | mínimo: hoje |
| Horário | seletor de hora | Sim | sem grade de horários — ver aviso |
| Tipo de consulta | seletor | Não (padrão `FIRST_VISIT`) | Primeira Consulta / Retorno |

> **Não existe endpoint de horários disponíveis.** O paciente digita qualquer horário e o servidor aceita, inclusive em conflito com outro paciente. **OBRIGATÓRIO** exibir a nota: `O horário escolhido será confirmado pela recepção da clínica.`

Aviso verde, exibido quando data e hora estiverem preenchidas:

> Sua solicitação será enviada para a recepção de **{clínica}**. Você receberá uma notificação quando for confirmada.

Montagem do envio — regra 3.6:

```dart
final scheduledAt = DateFormat("yyyy-MM-dd'T'HH:mm").format(
  DateTime(data.year, data.month, data.day, hora.hour, hora.minute),
);
```

Botão **Solicitar Agendamento** → `Enviando...` durante o envio; desabilitado se faltar data ou hora.

**Sucesso:** exiba uma tela de confirmação **antes** de navegar (na web ela é engolida pela troca de aba):

- Título: `Solicitação enviada!`
- Corpo: `Sua consulta com {médico} aguarda confirmação da recepção. Você receberá uma notificação quando for confirmada.`
- Ações: `Ver minhas consultas` e `Agendar outra consulta`

**OBRIGATÓRIO:** o texto nunca pode dizer "consulta marcada" ou "confirmada". O status nasce `PENDING`.

Mensagens de erro possíveis — use as literais do backend (regra 3.4), mais estas do cliente:

| Origem | Texto |
| --- | --- |
| Cliente | `Escolha a data e o horário.` |
| Rede | `Sem conexão. Verifique sua internet.` |
| Fallback | `Erro ao agendar. Tente novamente.` |

### 9.7 Minhas Consultas — `/consultas`

- Fonte: `GET /appointments`, já ordenado `scheduledAt` decrescente pelo backend.
- **Filtre no cliente** (regra 3.13): `Todas` · `Aguardando` · `Agendadas` · `Concluídas` · `Canceladas`. Padrão `Todas`.
- Item: caixa de data (dia + mês abreviado), nome do médico, linha `{especialidade} · {clínica} · {dd/MM/yyyy, HH:mm}`, selo de status e ações.
- **Botão cancelar aparece somente se o status for `PENDING` ou `SCHEDULED`.**
- Vazio: `Nenhuma consulta encontrada.`

**Detalhe** — abra uma folha inferior (ou rota `/consultas/{id}`) usando `GET /appointments/{id}`:

| Rótulo | Conteúdo |
| --- | --- |
| Médico | `{nome} — {especialidade}` |
| Data e Hora | `dd/MM/yyyy, HH:mm` |
| Clínica | nome |
| Tipo | tipo traduzido |
| Status | selo colorido |

**Cancelamento:**

1. Diálogo de confirmação: `Deseja cancelar esta solicitação de consulta?` com as ações `Voltar` e `Sim, cancelar`.
2. `DELETE /api/patient/appointments/{id}`.
3. **OBRIGATÓRIO verificar o resultado** — a web não verifica. Em 400, exiba a mensagem do backend (`Apenas consultas pendentes ou agendadas podem ser canceladas.`) numa barra de aviso.
4. Em sucesso: `Consulta cancelada.` e **refaça o GET da lista** (o DELETE devolve corpo vazio — regra 3.10).

### 9.8 Meu Prontuário — `/prontuario`

- `GET /records` ao entrar. **Ordene localmente** por `scheduledAt` decrescente (regra 3.13).
- Lista em sanfona: um item expandido por vez.
- Cabeçalho: nome do médico + `{especialidade} · {dd/MM/yyyy} · {clínica}`.
- Corpo expandido — **cada campo só aparece se tiver valor**:

| Rótulo | Campo |
| --- | --- |
| Queixa Principal | `chiefComplaint` |
| Diagnóstico | `diagnosis` |
| CID-10 | `cid10` |
| Conduta | `treatment` |
| Observações | `notes` |

- Bloco **Prescrição** só se `prescriptionItems` não for vazio. Cada item: nome do medicamento (sempre), `Dose: {dosage}` e `Duração: {duration}` (só se houver), observação sem prefixo (só se houver).
- Vazio: `Nenhum prontuário disponível ainda.`

> Só aparecem prontuários de consultas `COMPLETED` — é filtro do backend. Se a lista vier vazia mas houver consultas concluídas, ainda assim é comportamento correto: o médico pode não ter registrado.

### 9.9 Meu Perfil — `/perfil`

**Cartão 1 — Dados da Conta** (somente leitura, visualmente desabilitado):

| Rótulo | Campo | Formatação |
| --- | --- | --- |
| Nome completo | `name` | crua |
| E-mail | `email` | crua |
| CPF | `cpf` | **com máscara** `000.000.000-00` |
| Data de nascimento | `birthDate` | **`dd/MM/yyyy`** |

Rodapé: `Para alterar nome, e-mail ou CPF, entre em contato com a recepção.`

**Cartão 2 — Dados Clínicos** (editáveis via `PUT /profile`):

| Rótulo | Tipo | Placeholder |
| --- | --- | --- |
| Telefone | texto com máscara `(00) 00000-0000` | `(11) 99999-9999` |
| Tipo Sanguíneo | seletor | `Não informado` + as 8 opções |
| Endereço | texto | `Rua, número, bairro, cidade` |
| Alergias | texto multilinha (3 linhas) | `Liste suas alergias conhecidas...` |
| Contato de Emergência — Nome | texto | `Nome completo` |
| Contato de Emergência — Telefone | texto com máscara | `(11) 99999-9999` |

- Botão **Salvar Alterações** → `Salvando...` durante o envio.
- Envie `bloodType` como `null` quando "Não informado" estiver escolhido.
- **Regra 3.11:** para apagar um campo, envie `""`, não `null`.
- Sucesso: `Perfil atualizado!`
- **OBRIGATÓRIO tratar erro** — a web não trata: se o `PUT` falhar, o botão volta ao normal sem nenhum aviso. Exiba a mensagem da falha.
- Avise antes de sair com alterações não salvas.

**Rodapé do perfil:** acesso a **Meus Convênios**, versão do app e botão **Sair**.

O botão **Sair** deve pedir confirmação (`Deseja sair da sua conta?`), limpar o armazenamento seguro e voltar ao login. Não há logout no servidor — o token continua tecnicamente válido até expirar.

### 9.10 Meus Convênios — `/perfil/convenios`

- `GET /insurance` ao entrar e **após cada escrita** (regra 3.13).
- Ordenação vem do backend: principal primeiro, depois operadora alfabética.
- Cartão: borda esquerda destacada se `principal`; nome da operadora; selos **Principal** e **Vencido** (use o campo `vencido`, calculado pelo backend); `Carteirinha: {numeroCarteirinha}`; plano, `Titular: {nomeTitular}` (só quando `!titular`), `Válido até: {dd/MM/yyyy}` e `ANS: {codigoAns}` — todos condicionais.
- Ações: **Principal** (só se `!principal`, sem confirmação), **Editar**, **Excluir** (confirmação `Remover este convênio?`).
- Vazio: `Nenhum convênio cadastrado.` + `Adicione seus planos de saúde para agilizar a confirmação de consultas.`

**Formulário** (`Novo Convênio` / `Editar Convênio`):

| Rótulo | Obrigatório | Detalhe |
| --- | --- | --- |
| Operadora | **Sim** | `Ex: Unimed, Amil, Bradesco Saúde` |
| Número da Carteirinha | **Sim** | `Número do cartão/carteirinha` |
| Plano | Não | `Ex: Nacional, Especial, QD-20` |
| Código ANS | Não | máximo 10 caracteres |
| Início da Vigência | Não | seletor de data, envia ISO |
| Validade | Não | seletor de data, envia ISO |
| Sou o titular deste plano | — | **padrão marcado** |
| Definir como convênio principal | — | **padrão desmarcado** |
| Nome do Titular | Não | **só aparece quando "Sou o titular" está desmarcado** |

- Validação no cliente: `Operadora e número da carteirinha são obrigatórios.`
- **Regra 3.11:** no `PUT`, carregue o convênio, altere e envie **o objeto inteiro** — inclusive `titular` e `principal` explicitamente.
- Validação adicional recomendada: `A validade deve ser posterior ao início da vigência.` (o backend não valida).

### 9.11 Notificações — `/notificacoes`

- Aberta pelo sino do cabeçalho. `GET /notifications` a cada abertura.
- Ponto vermelho no sino quando `unread-count > 0`. Mostre o número quando for menor que 10.
- Item: ícone, título, corpo, tempo relativo (`há 12min`), destaque visual quando não lida.
- Tocar numa **não lida** chama `POST /notifications/{id}/read`. **Marque como lida no estado local também** — o 200 não confirma efeito (regra 3.10).
- Ação **Marcar todas como lidas** → `POST /notifications/mark-all-read`, depois refaça o GET.
- Vazio: `Nenhuma notificação.`

> Não há push. A contagem só atualiza quando o app consulta o servidor. Atualize ao voltar do segundo plano e ao puxar para atualizar. **Não** faça polling em intervalo curto: cada chamada baixa a lista inteira, sem paginação.

---

## 10. Design system

Derive do visual do portal web para que os dois produtos pareçam o mesmo sistema.

| Token | Valor |
| --- | --- |
| Primária (verde) | `#20C997` |
| Primária escura | `#17A97E` |
| Destaque (azul) | `#0D6EFD` |
| Texto principal | `#212529` |
| Texto secundário | `#6C757D` |
| Texto terciário | `#ADB5BD` |
| Fundo da tela | `#F0F8F5` |
| Fundo suave | `#F4FBF8` |
| Superfície de cartão | `#FFFFFF` |
| Gradiente de cabeçalho | `#0A2A1E` → `#0F3D2A` |

Cores dos selos de status:

| Status | Fundo | Texto |
| --- | --- | --- |
| Aguardando | `#F3E8FF` | `#6F42C1` |
| Agendada | `#E8F4FD` | `#0B5ED7` |
| Em andamento | `#FFF3CD` | `#856404` |
| Concluída | `#D1F5EA` | `#0F6848` |
| Cancelada | `#F8D7DA` | `#842029` |

- **Material 3** (`useMaterial3: true`), `ColorScheme.fromSeed(seedColor: Color(0xFF20C997))`.
- Tipografia: **Poppins** para títulos, **Inter** para corpo (via `google_fonts`).
- Raio: 16px em cartões, 8–12px em botões e campos. Selos com raio 20px.
- Tema claro na v1. Se implementar escuro, defina a paleta completa nos dois modos — nunca deixe uma cor definida só num deles.

### 10.1 Acessibilidade — OBRIGATÓRIO

O público inclui idosos.

- Alvo de toque mínimo **48×48 dp**.
- Contraste mínimo **AA (4.5:1)** para texto normal. Verifique `#ADB5BD` sobre branco: **reprova** — use-o só em texto decorativo de 16sp ou mais, ou escureça.
- Respeite a escala de fonte do sistema. Use `sp` via `MediaQuery.textScalerOf`; **nunca** fixe `textScaleFactor: 1.0`.
- `Semantics` com rótulo em todas as ações críticas: cancelar consulta, salvar perfil, excluir convênio, sair.
- Selo de status **não pode depender só de cor** — o texto sempre acompanha.
- Todo campo de formulário tem `label` visível, não apenas placeholder.

---

## 11. Configuração Android e ambientes

### 11.1 Endereço do backend por cenário

O erro nº 1 é apontar o app para `http://localhost:8080`. **No Android, `localhost` é o próprio aparelho**, não o seu PC.

| Cenário | Base URL | Precisa liberar firewall? |
| --- | --- | --- |
| Emulador AVD + backend local ou Docker | `http://10.0.2.2:8080` | Não |
| Emulador ou aparelho **com `adb reverse`** | `http://localhost:8080` | Não |
| Aparelho físico no mesmo Wi-Fi | `http://<IP-DO-PC>:8080` | **Sim** |
| Emulador Genymotion | `http://10.0.3.2:8080` | Não |
| **Nunca use** | `http://backend:8080`, `http://host.docker.internal:8080`, `http://10.0.2.15:8080` | — |

`10.0.2.2` é o alias do emulador do Android Studio para o loopback da máquina hospedeira. Rodar o backend por `mvnw.cmd` ou por Docker Compose **não muda o endereço** — o Compose publica `8080:8080` no host.

Teste antes de mexer no app: abra `http://10.0.2.2:8080/api/auth/login` no navegador do emulador. **405** significa "chegou".

Opção mais robusta em rede de faculdade:

```powershell
adb reverse tcp:8080 tcp:8080
```

Descobrir o IP do PC e liberar a porta (PowerShell como Administrador):

```powershell
Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } |
  Select-Object IPAddress, InterfaceAlias

New-NetFirewallRule -DisplayName "SCU backend 8080 (dev)" `
  -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8080 -Profile Private
```

> Libere **somente a 8080**. Não libere a 5432 — o Compose publica o Postgres com credenciais `postgres/postgres`.

### 11.2 Ambientes sem segredo no git

Use `--dart-define`. **Nunca** coloque URL de produção ou chave no código.

```dart
/// lib/app/env.dart
class Env {
  static const String baseUrl = String.fromEnvironment(
    'SCU_BASE_URL',
    defaultValue: 'http://10.0.2.2:8080',
  );
  static const bool isDev = bool.fromEnvironment('SCU_DEV', defaultValue: true);
}
```

```powershell
# emulador
flutter run --dart-define=SCU_BASE_URL=http://10.0.2.2:8080 --dart-define=SCU_DEV=true

# aparelho físico
flutter run --dart-define=SCU_BASE_URL=http://192.168.1.53:8080 --dart-define=SCU_DEV=true
```

### 11.3 Android

| Configuração | Valor | Motivo |
| --- | --- | --- |
| `applicationId` | `br.edu.ceub.scu.paciente` | Segue a instituição |
| `minSdk` | **24** (Android 7.0) | Cobre praticamente todo o parque; abaixo disso o TLS moderno complica |
| `targetSdk` / `compileSdk` | **34** ou superior | Exigência da Play Store |
| Nome do app | `SCU Paciente` | — |

`AndroidManifest.xml` — permissões da v1, e só estas:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

**Tráfego em texto puro.** O Android bloqueia HTTP sem TLS desde a API 28, e o backend do SCU **não tem HTTPS**. Para desenvolvimento, crie `android/app/src/debug/res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="true">10.0.2.2</domain>
    <domain includeSubdomains="true">localhost</domain>
    <domain includeSubdomains="true">192.168.0.0</domain>
  </domain-config>
</network-security-config>
```

E referencie **apenas no manifesto de debug** (`android/app/src/debug/AndroidManifest.xml`):

```xml
<application android:networkSecurityConfig="@xml/network_security_config" />
```

**OBRIGATÓRIO:** o manifesto de release **nunca** pode permitir texto puro, nem via `android:usesCleartextTraffic="true"` global. Colocar a configuração em `src/debug/` garante isso estruturalmente.

**Assinatura de release:** gere a keystore fora do repositório e referencie por `key.properties`, que entra no `.gitignore`. **Nunca** versione `.jks`, `.keystore` ou `key.properties`.

### 11.4 Dependências

Escreva o `pubspec.yaml` com estas dependências. **Confirme as versões com `flutter pub outdated` antes de fixar** — não copie números de versão deste documento como se fossem verdade atual.

| Pacote | Para quê |
| --- | --- |
| `flutter_riverpod` | Estado e injeção de dependência |
| `go_router` | Rotas e guarda de autenticação |
| `dio` | HTTP com interceptors |
| `flutter_secure_storage` | Token JWT no Keystore |
| `shared_preferences` | Preferências não sensíveis |
| `intl` | Datas e `pt_BR` |
| `equatable` | Igualdade de valor nos modelos |
| `connectivity_plus` | Detecção de ausência de conexão |
| `mask_text_input_formatter` | CPF e telefone |
| `google_fonts` | Poppins e Inter |
| `flutter_svg` | Ilustrações de estado vazio |

Desenvolvimento: `flutter_lints`, `mocktail`, `flutter_test`, `integration_test`.

`analysis_options.yaml` — mínimo exigido:

```yaml
include: package:flutter_lints/flutter.yaml

analyzer:
  language:
    strict-casts: true
    strict-raw-types: true
  errors:
    avoid_print: error
    invalid_annotation_target: ignore

linter:
  rules:
    - always_declare_return_types
    - prefer_const_constructors
    - prefer_final_locals
    - avoid_dynamic_calls
    - require_trailing_commas
    - unawaited_futures
    - use_super_parameters
```

---

## 12. Convenções do repositório

### 12.1 Fluxo de trabalho

Definido em `CONTRIBUTING.md` e **obrigatório**:

1. Issue vinculada à sprint, com critérios de aceite.
2. Branch no padrão `feature/<numero-issue>-descricao`, `docs/<numero-issue>-descricao` ou `fix/<numero-issue>-descricao`. **O número da issue é obrigatório.**
3. Commits pequenos, prefixo em inglês e descrição em português — é a prática vigente no histórico:

   ```text
   feat: adicionar camada de rede do app do paciente
   fix: corrigir formato de data no agendamento
   docs: documentar contrato da API no README do mobile
   ```

4. Pull request com link da issue, resumo, como validar, evidências e documentos alterados.
5. Review de pelo menos uma pessoa antes do merge.

**Nada entra direto na `main`.**

`.editorconfig`: UTF-8, fim de linha **LF**, nova linha final, sem espaço no fim, **espaços** em vez de tabs.

### 12.2 Correção obrigatória de `.gitignore`

**Isto é um bloqueio real, verificado com `git check-ignore`:**

```text
src/.gitignore:17:lib/    src/clinic-system/mobile/lib/main.dart
```

O arquivo `src/.gitignore` é um template de Python e contém `lib/` na linha 17. **Todo o código Dart do app seria silenciosamente ignorado pelo git** — você criaria o projeto inteiro e nada seria versionado.

**OBRIGATÓRIO, antes do primeiro commit de código Dart**, crie `src/clinic-system/mobile/.gitignore` começando por uma regra de desfazimento:

```gitignore
# Anula o "lib/" herdado de src/.gitignore, que é um template de Python
# e ignoraria TODO o código-fonte Dart deste módulo.
!/lib/

# Flutter / Dart
.dart_tool/
.packages
build/
.flutter-plugins
.flutter-plugins-dependencies
pubspec.lock

# Android
android/.gradle/
android/local.properties
android/key.properties
*.jks
*.keystore

# IDE
.idea/
*.iml
.vscode/
```

Confirme antes de commitar:

```bash
git check-ignore -v src/clinic-system/mobile/lib/main.dart
# não deve retornar nada
```

> `pubspec.lock` fica ignorado por ser um aplicativo de um projeto acadêmico com múltiplos ambientes. Se a equipe preferir builds reproduzíveis, versione-o — decisão da seção 16.

### 12.3 Documentação a atualizar

Ao concluir o porte, atualize:

- `README.md` — adicionar o app mobile na tabela de estrutura do repositório.
- `src/README.md` — referenciar `clinic-system/mobile/`.
- `src/BACKLOG.md` — transpor o **Épico 4**.
- `docs/mobile/app-paciente.md` — registrar no changelog que a stack mudou e que a seção 7.1 foi superada.
- `src/clinic-system/mobile/README.md` — como rodar, com os endereços da seção 11.1.

**Sobre o `src/BACKLOG.md`:** o próximo número livre é o **Épico 4**, e ele já está pré-reservado e rascunhado na seção 10.3 de `docs/mobile/app-paciente.md` como "Aplicativo Mobile do Paciente", com sete features. **Reutilize essa numeração**; não crie um Épico 5 paralelo. Siga o formato exato do arquivo (emojis, história `Como/Quero/Para que`, tasks com `*Descrição técnica:*`).

### 12.4 Divergência de stack a registrar

`docs/mobile/app-paciente.md`, seção 7.1, recomenda **React Native + Expo** e classifica Flutter como "alternativa séria, mas custo de aprendizado alto". A equipe decidiu **Flutter**.

**OBRIGATÓRIO:** crie um ADR em `docs/decisoes/` usando `template-adr.md`, registrando a decisão por Flutter, o contexto (Android primeiro, prazo do semestre) e as consequências — inclusive que o time não domina Dart. Sem esse registro, o documento vivo e o código ficam contraditórios.

---

## 13. Roteiro de implementação

Siga na ordem. **Não avance sem o critério de aceite da etapa anterior.**

| # | Etapa | Entrega | Critério de aceite |
| --- | --- | --- | --- |
| 1 | Criar o projeto | `flutter create --org br.edu.ceub.scu --project-name scu_paciente --platforms android src/clinic-system/mobile` | `flutter run` abre o app padrão no emulador |
| 2 | `.gitignore` e versionamento | Arquivo da seção 12.2 | `git check-ignore -v .../mobile/lib/main.dart` **não retorna nada** |
| 3 | Dependências e lint | `pubspec.yaml`, `analysis_options.yaml` | `flutter pub get` e `flutter analyze` sem erro |
| 4 | Tema e estrutura de pastas | `shared/theme/`, árvore da seção 8 | App abre com a paleta da seção 10 |
| 5 | Ambiente e cliente HTTP | `env.dart`, `api_client.dart`, `failure.dart`, `error_mapper.dart`, `json.dart` | Teste unitário provando que 400 com **texto puro** vira `FalhaDeRequisicao` com a mensagem correta |
| 6 | Sessão e armazenamento seguro | `session_store.dart`, `session_provider.dart` | Token sobrevive ao fechamento do app; logout limpa tudo |
| 7 | Login | Repositório, tela, guarda de rota | Login de paciente entra; **login de superadmin é recusado** com a mensagem da regra 3.3 |
| 8 | Autocadastro | Tela com validação de CPF e data | Cadastro cria a conta e entra direto; `Email já cadastrado.` aparece corretamente |
| 9 | Navegação por abas | `router.dart`, casca com 5 abas | As 5 abas navegam e preservam estado |
| 10 | Consultas: lista e filtros | Repositório, modelos, tela com os 4 estados | Lista carrega, filtra no cliente, mostra vazio e erro com **Tentar de novo** |
| 11 | Detalhe e cancelamento | Folha de detalhe, diálogo | Cancelar consulta `PENDING` funciona e recarrega; cancelar `COMPLETED` exibe a mensagem do backend |
| 12 | Início | Indicadores, cartão de próxima consulta | Os três cálculos batem com os da seção 9.5 |
| 13 | Agendamento | Assistente de 3 passos | Consulta criada com status `PENDING`; a tela **não** diz "confirmada"; data enviada no formato da regra 3.6 |
| 14 | Prontuário | Sanfona com prescrições | Ordenado localmente; campos vazios não aparecem |
| 15 | Perfil | Visualizar e editar | Salvar funciona; **erro exibe mensagem**; campo limpo envia `""` |
| 16 | Convênios | CRUD + definir principal | `PUT` envia o objeto inteiro; lista recarrega após cada escrita |
| 17 | Notificações | Lista + contador | Ponto no sino aparece; marcar como lida atualiza o estado local |
| 18 | Acessibilidade | Rótulos, alvos, contraste | Navegação completa com o TalkBack nos fluxos críticos |
| 19 | Testes | Unitários, de widget e de integração | `flutter test` verde |
| 20 | CI | Workflow do GitHub Actions | Pipeline verde no pull request |
| 21 | APK de release | `flutter build apk --release --dart-define=...` | APK instala e funciona em aparelho físico |

---

## 14. Testes e integração contínua

### 14.1 O que testar

| Tipo | Alvo mínimo |
| --- | --- |
| Unitário | `mapearErro` com os 4 formatos de erro da seção 3.5; `AppointmentStatus.fromWire` com valor desconhecido; `asDateOrNull` sem deslocamento de fuso; formatação de `scheduledAt` para envio; validador de CPF |
| Widget | Login (sucesso, credencial inválida, papel não-paciente); lista de consultas nos 4 estados; passo 3 do agendamento |
| Integração | Fluxo completo: cadastrar → login → agendar → ver na lista → cancelar |

Use `mocktail` com um `Dio` falso. **Não** dependa do backend de pé nos testes unitários e de widget.

Teste obrigatório — o caso que mais quebra clientes desta API:

```dart
test('400 com texto puro vira FalhaDeRequisicao com a mensagem do backend', () {
  final erro = DioException(
    requestOptions: RequestOptions(path: '/api/patient/appointments'),
    response: Response(
      requestOptions: RequestOptions(path: '/api/patient/appointments'),
      statusCode: 400,
      data: 'A data deve ser futura.', // texto puro, não JSON
    ),
    type: DioExceptionType.badResponse,
  );

  final falha = mapearErro(erro);

  expect(falha, isA<FalhaDeRequisicao>());
  expect(falha.mensagem, 'A data deve ser futura.');
});

test('401 vira SessaoExpirada mesmo com corpo vazio', () {
  final erro = DioException(
    requestOptions: RequestOptions(path: '/api/patient/profile'),
    response: Response(
      requestOptions: RequestOptions(path: '/api/patient/profile'),
      statusCode: 401,
      data: '', // zero bytes — jsonDecode aqui lançaria FormatException
    ),
    type: DioExceptionType.badResponse,
  );

  expect(mapearErro(erro), isA<SessaoExpirada>());
});
```

### 14.2 Integração contínua

**Não existe nenhum workflow em `.github/workflows/` hoje** — `.github/` só tem templates de issue e de pull request. Criar a CI é trabalho novo, não reaproveitamento.

Crie `.github/workflows/mobile-ci.yml`, disparando **apenas quando o diretório do mobile mudar**:

```yaml
name: Mobile CI

on:
  push:
    branches: [main]
    paths: ['src/clinic-system/mobile/**', '.github/workflows/mobile-ci.yml']
  pull_request:
    paths: ['src/clinic-system/mobile/**', '.github/workflows/mobile-ci.yml']

jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: src/clinic-system/mobile
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '17'

      - uses: subosito/flutter-action@v2
        with:
          channel: stable
          cache: true

      - name: Instalar dependências
        run: flutter pub get

      - name: Verificar formatação
        run: dart format --set-exit-if-changed .

      - name: Análise estática
        run: flutter analyze

      - name: Testes
        run: flutter test

      - name: Build de APK (debug)
        run: flutter build apk --debug --dart-define=SCU_BASE_URL=http://10.0.2.2:8080
```

---

## 15. Definition of Done

Uma funcionalidade do app só está pronta quando:

- [ ] Funciona em **aparelho Android físico**, não só no emulador
- [ ] Trata os **quatro estados** da seção 9.2 — carregando, vazio, erro e sem conexão
- [ ] Usa os **textos em português** da seção 6.2 e das telas da seção 9
- [ ] Toda escrita é seguida do **GET de recarga** correspondente
- [ ] Erros de 400 exibem a **mensagem do backend**, não um texto genérico
- [ ] 401 derruba a sessão e leva ao login com a mensagem de sessão expirada
- [ ] Tem teste automatizado do caminho feliz
- [ ] Passa em `dart format`, `flutter analyze` e `flutter test`
- [ ] Acessível: alvo de toque ≥ 48dp, contraste AA, rótulo de leitor de tela nas ações críticas
- [ ] **Nenhum dado clínico, CPF ou carteirinha em log**, em analytics ou em disco
- [ ] Evidência anexada ao relatório da sprint, em `sprints/`
- [ ] Pull request com issue vinculada e review aprovado

---

## 16. Decisões que você não pode tomar sozinho

Se esbarrar em qualquer uma destas, **pare, aplique o contorno e registre a pendência** no pull request. Não decida por conta própria.

| # | Questão | Quem responde | Contorno na v1 | Impacto se ficar sem resposta |
| --- | --- | --- | --- | --- |
| Q1 | Sessão cai em 1h sem refresh. Implementamos refresh token no backend? | Equipe + backend | Tratar 401 como sessão expirada e pedir login de novo | Experiência ruim: o usuário é deslogado no meio do uso |
| Q2 | Não existe "esqueci minha senha". Criamos o endpoint? | Equipe + backend | **Não exiba o link.** Paciente que perder a senha depende da recepção | Suporte manual para todo esquecimento de senha |
| Q3 | Não existe grade de horários do médico. Criamos `DoctorSchedule`? | Produto + backend | Campo livre de data e hora, com aviso de que a recepção confirma | Agendamentos em conflito e retrabalho da recepção |
| Q4 | Podemos guardar prontuário e carteirinha em cache no aparelho? | Equipe + LGPD | **Não persistir.** Tudo vem do servidor | Sem modo offline; o app não abre sem rede |
| Q5 | Backend sem HTTPS. Haverá TLS em homologação? | Professor + infra | Texto puro **apenas** no build de debug | Token trafega em claro; não pode ir para loja assim |
| Q6 | O app vai para a Play Store ou fica em build de teste? | Professor | Gerar APK de release para instalação direta | Muda esforço: conta de desenvolvedor, política de privacidade, revisão |
| Q7 | `ddl-auto=update` sem migrations. Adotamos Flyway? | Backend | Nenhum — risco assumido | Mudança de schema pode quebrar o app publicado sem aviso |
| Q8 | O mapa do Épico 4 substitui ou complementa o item 3.4.2 do Épico 3? | Produto | Mapa fora do escopo da v1 | Trabalho duplicado entre portal web e app |
| Q9 | Versionamos `pubspec.lock`? | Equipe | Ignorado | Builds podem divergir entre máquinas |
| Q10 | Quem cria as issues do Épico 4 no GitHub Projects? | Equipe | Transpor o épico para `src/BACKLOG.md` | Sem rastreabilidade entre código e sprint |

---

## 17. Glossário React → Flutter

Para o time que vem do frontend web do SCU.

| React | Flutter | Observação |
| --- | --- | --- |
| Componente | `Widget` | `StatelessWidget` / `ConsumerWidget` |
| `useState` | `StateProvider` / `useState` do `flutter_hooks` | Preferimos providers do Riverpod |
| `useEffect` | `ref.listen`, `initState`, `ref.onDispose` | Não há array de dependências |
| `props` | parâmetros do construtor | Sempre `final` |
| `Context` / `Provider` | `ProviderScope` + `ref.watch` | O Riverpod substitui os dois |
| `useQuery` (TanStack) | `FutureProvider` + `AsyncValue` | `AsyncValue` já modela carregando/erro/dado |
| `fetch` / `axios` | `dio` | Mesmo conceito de interceptor |
| `react-router` | `go_router` | Rotas declarativas |
| `localStorage` | `flutter_secure_storage` / `shared_preferences` | Token **sempre** no seguro |
| CSS / classe | `ThemeData` + parâmetros de estilo | Sem folha de estilo separada |
| `map()` em JSX | `ListView.builder` | Constrói só o que está visível |
| Renderização condicional `&&` | `if` dentro de lista de widgets, ou `Visibility` | — |

---

## 18. Checklist final antes de abrir o pull request

- [ ] `git check-ignore -v src/clinic-system/mobile/lib/main.dart` não retorna nada
- [ ] `flutter analyze` sem erro nem aviso
- [ ] `dart format --set-exit-if-changed .` passa
- [ ] `flutter test` verde
- [ ] Nenhum `print` no código
- [ ] Nenhuma URL, IP ou segredo fixo no código — tudo por `--dart-define`
- [ ] `usesCleartextTraffic` não aparece no manifesto de release
- [ ] Nenhum `.jks`, `.keystore` ou `key.properties` versionado
- [ ] Login com o superadmin é recusado com a mensagem correta
- [ ] Agendamento envia `scheduledAt` sem `Z` e sem segundos
- [ ] Toda escrita é seguida de recarga
- [ ] ADR da escolha de Flutter criado em `docs/decisoes/`
- [ ] Épico 4 transposto para `src/BACKLOG.md`
- [ ] `README.md` e `src/README.md` referenciam o módulo mobile

---

## 19. Changelog

| Versão | Data | Mudança |
| --- | --- | --- |
| 1.0.0 | 2026-09-13 | Versão inicial: escopo, 13 regras inegociáveis verificadas no código, contrato dos 22 endpoints, arquitetura, 11 telas, design system, configuração Android, roteiro de 21 etapas, CI e questões em aberto |
