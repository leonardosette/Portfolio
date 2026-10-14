# ADR 001 — Flutter para o aplicativo Android do paciente

## Título

Adotar Flutter e Dart para o SCU Paciente, com Android como primeira plataforma.

## Status

Aprovado quanto à escolha de stack pelo pedido de implementação de 2026-09-13. Revisão do código e integração via pull request continuam pendentes.

## Data

2026-09-13.

## Contexto

O portal React e a API Spring Boot já atendem ao paciente. A equipe decidiu portar essas funcionalidades para um app Android durante o semestre, em módulo aditivo. O documento de produto recomendava React Native com Expo na seção 7.1, mas o prompt de execução e a decisão da equipe especificam Flutter.

O time vem de React e ainda não domina Dart. O prazo acadêmico favorece paridade funcional com os 22 endpoints existentes e documentação de padrões, evitando ampliar o backend durante o port.

O usuário já criou um aplicativo no Google Play Console para a disciplina. Solicitou estrutura compatível com uma futura publicação, sem conexão nem envio nesta entrega.

## Decisão

Criar `src/clinic-system/mobile/` com Flutter estável, apenas Android, Material 3, Riverpod, go_router, Dio, modelos defensivos escritos à mão e token em flutter_secure_storage. Organizar funcionalidades em data/domain/presentation conforme a árvore do prompt.

Usar `com.scu.app`, minSdk 24, targetSdk pelo menos 36, versionamento no pubspec e assinatura externa ao repositório. APK e App Bundle são artefatos locais; não haverá credencial Google, Firebase, Fastlane Supply ou publicação automática.

Dados clínicos, CPF e carteirinha permanecem em memória; preferências guardam apenas nome/e-mail e o token fica no armazenamento seguro. HTTP é permitido somente em debug para destinos locais explícitos.

A seção 7.1 e a arquitetura Expo da seção 8 do documento de produto ficam superadas para a v1. As funcionalidades futuras permanecem no roadmap, sem entrar neste port.

## Alternativas consideradas

- React Native + Expo: menor curva para a equipe, mas não corresponde à decisão explícita para esta entrega.
- Kotlin nativo: boa integração Android, porém diverge da stack escolhida.
- PWA: reaproveita a web, mas não executa o port Flutter solicitado.

## Consequências

- Aprender Dart, widgets, ciclo de vida e Riverpod será necessário; os testes e o README orientam manutenção.
- Não há reaproveitamento direto de componentes React. Backend e frontend permanecem intactos.
- Sessão de uma hora sem refresh; expiração exige novo login.
- Agendamento é uma solicitação PENDING, sem garantia de horário.
- A API não permite apagar tipo sanguíneo já salvo. O app informa a limitação e preserva o valor.
- Infraestrutura HTTPS, assinatura definitiva, vínculo com a issue/sprint e revisão humana antecedem uma publicação.
- O usuário autorizou continuar sem emulador/aparelho disponível, registrando essas validações como pendentes.
- pubspec.lock permanece ignorado conforme Q9; Flutter e limites de versões estão documentados, mas não tornam a resolução de dependências totalmente reproduzível.

## Links relacionados

- [Prompt de execução](../mobile/prompt-porte-flutter-paciente.md)
- [Visão do produto](../mobile/app-paciente.md)
- [Módulo Flutter](../../src/clinic-system/mobile/README.md)
- [Preparação Google Play](../../src/clinic-system/mobile/docs/google-play.md)
- [Backlog — Épico 4](../../src/BACKLOG.md)
