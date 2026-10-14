
# 📘 Projeto Integrador

Sistema web desenvolvido como parte do Projeto Integrador de Ciência da Computação, com foco em gerenciamento de atendimentos médicos e administrativos em ambiente clínico. A aplicação utiliza Blazor Server, autenticação por perfis (roles), e persistência via Entity Framework Core com SQL Server.

---

## ⚙️ Tecnologias Utilizadas

- [.NET 8](https://dotnet.microsoft.com/)
- Blazor Server (ASP.NET Core)
- Entity Framework Core
- SQL Server
- Identity com Roles (Administrador, Médico, Recepcionista, Paciente)
- Injeção de Dependência
- HTTP Client e REST APIs

---

## 🧱 Estrutura do Projeto

```
ProjetoIntegrador/
├── Controllers/
│   └── AuthController.cs
├── Models/
│   ├── Usuario.cs
│   ├── Agendamento.cs
│   ├── Consulta.cs
│   ├── Exame.cs
│   └── ...
├── Data/
│   └── ApplicationDbContext.cs
├── Program.cs
├── appsettings.json
└── ...
```

---

## 🔐 Controle de Acesso (Roles)

A aplicação define as seguintes políticas de autorização:

- `Administrador`
- `Médico`
- `Recepcionista`
- `Paciente`

Essas roles são atribuídas aos usuários durante o processo de cadastro e utilizadas para controlar o acesso a páginas e funcionalidades específicas.

---

## 🗄️ Banco de Dados

O projeto utiliza o `ApplicationDbContext` para integrar os modelos ao banco de dados SQL Server. As strings de conexão são definidas em:

```json
// appsettings.json
"ConnectionStrings": {
  "DefaultConnection": "Server=...;Database=ProjetoIntegradorDb;..."
}
```

As migrações estão armazenadas em `Migrations/`, garantindo versionamento do schema.

---

## 🔐 Autenticação e Autorização

O projeto implementa autenticação baseada em `Identity<Usuario, IdentityRole>`, com autenticação persistente e gerenciamento de cookies:

```csharp
builder.Services.AddIdentity<Usuario, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();
```

---

## 🧪 Funcionalidades Principais

- Login/Cadastro com Identity
- Controle de agendamentos
- Anamneses e exames clínicos
- Relatórios
- Painel administrativo com controle de usuários por cargo
- Sistema com perfis separados (role-based access control)

---

## 🏃 Como Executar

1. **Clonar o repositório:**

```bash
git clone https://github.com/seu-usuario/ProjetoIntegrador.git
cd ProjetoIntegrador
```

2. **Restaurar pacotes:**

```bash
dotnet restore
```

3. **Aplicar migrações e criar o banco:**

```bash
dotnet ef database update
```

4. **Executar o projeto:**

```bash
dotnet run --project ProjetoIntegrador/ProjetoIntegrador.csproj
```

---

## 🛠️ Observações Técnicas

- O projeto usa renderização interativa com Blazor Server (sem WebAssembly).
- Os serviços de `HttpClient`, `Authorization`, `Identity` e `DbContext` são injetados automaticamente via DI.
- A aplicação possui controle completo de erros detalhados em ambiente de desenvolvimento.

---

## 📁 Caminhos Úteis

- `Controllers/AuthController.cs`: lógica de login e autenticação.
- `Models/`: contém todos os modelos de dados, como `Consulta`, `Usuario`, `Agendamento`, etc.
- `Program.cs`: configurações principais da aplicação.

---

