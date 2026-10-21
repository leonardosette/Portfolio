# Política de Segurança

Este documento descreve como a segurança do repositório **Portifolio** é tratada e como reportar problemas.

## Versões com suporte

| Versão | Suporte |
|---|---|
| Branch `main` (página publicada) | Sim |
| Outras branches | Não |

## Como reportar uma vulnerabilidade

Não abra uma issue pública para falhas de segurança.

1. Acesse a aba **Security** do repositório.
2. Clique em **Report a vulnerability** e descreva o problema (o que é, onde está e como reproduzir).

A denúncia fica visível apenas para o responsável pelo repositório. A resposta inicial deve acontecer em até 7 dias.

## Medidas de segurança adotadas

- Autenticação em dois fatores (2FA) ativada na conta do responsável.
- Branch `main` protegida: alterações entram por pull request.
- Permissões por papel: cada colaborador recebe só o acesso necessário.
- Alertas do Dependabot e verificação de segredos (secret scanning) ativados.
- Nenhuma senha, token ou chave é versionada. Arquivos sensíveis ficam no `.gitignore`.
- A página não coleta dados pessoais e não usa backend.

## O que fazer se um segredo for enviado por engano

1. Revogue ou troque a credencial imediatamente.
2. Remova o segredo do código e faça um novo commit.
3. Considere reescrever o histórico se o repositório for público.
