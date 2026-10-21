# Configuração de Segurança e Controle de Acesso

Passo a passo das configurações aplicadas ao repositório **Portifolio** no GitHub. Marque cada item ao concluir e anexe um print como evidência.

## 1. Autenticação em dois fatores (2FA)

Caminho: **foto do perfil → Settings → Password and authentication → Two-factor authentication**

- [ ] 2FA ativado (aplicativo autenticador ou chave de segurança)
- [ ] Códigos de recuperação guardados em local seguro

## 2. Gestão de usuários e papéis

Caminho: **repositório → Settings → Collaborators → Add people**

| Papel | O que pode fazer | Uso neste projeto |
|---|---|---|
| Read | Ver e clonar | Avaliadores e visitantes |
| Triage | Gerenciar issues e PRs | Revisores |
| Write | Enviar branches e abrir PRs | Colaboradores |
| Maintain | Gerenciar o repositório, sem ações destrutivas | Coordenação |
| Admin | Controle total | Somente o dono |

Princípio aplicado: **menor privilégio**. Cada pessoa recebe só o papel necessário.

- [ ] Colaborador adicionado: __________ (papel: ________)
- [ ] Convite aceito

## 3. Proteção da branch `main`

Caminho: **Settings → Branches → Add branch ruleset** (ou *Add classic branch protection rule*), alvo `main`

- [ ] Exigir pull request antes de mesclar
- [ ] Bloquear force push
- [ ] Bloquear exclusão da branch

Observação: com um único responsável, exigir aprovação obrigatória trava o próprio dono. Com pelo menos um colaborador, ative **Require approvals (1)**.

## 4. Alertas de segurança

Caminho: **Settings → Code security**

- [ ] Dependabot alerts
- [ ] Secret scanning
- [ ] Push protection (bloqueia envio de segredos)
- [ ] Private vulnerability reporting (usado pelo SECURITY.md)

## 5. Visibilidade e compartilhamento

- [ ] Repositório público (exigência do desafio)
- [ ] GitHub Pages ativo: **Settings → Pages → Branch `main` → `/ (root)`**
- [ ] Link de compartilhamento: https://github.com/leonardosette/Portifolio
- [ ] Página publicada: https://leonardosette.github.io/Portifolio/

## 6. Práticas de colaboração

Descritas no `CONTRIBUTING.md`: branches por tipo de alteração, commits padronizados, pull request com revisão e modelo de PR em `.github/pull_request_template.md`.

## Registro da configuração

| Item | Data | Evidência (print) |
|---|---|---|
| 2FA | | |
| Colaborador adicionado | | |
| Proteção da `main` | | |
| Dependabot e secret scanning | | |
| Pull request de teste mesclado | | |
