# Preparação para o Google Play Console

Criar um app no Console reserva sua ficha de distribuição. O código Android é um projeto separado: a ligação acontece posteriormente ao enviar um Android App Bundle (`.aab`) assinado. Nenhuma conexão com o Console foi feita neste port.

## Estrutura pronta

| Item | Configuração |
| --- | --- |
| Nome | SCU Paciente |
| Pacote | `com.scu.app` |
| Versão inicial | `1.0.0+1` em pubspec.yaml |
| Android mínimo | API 24 |
| API alvo | Pelo menos 36, acompanhando o SDK Flutter |
| Artefato para loja | `flutter build appbundle --release` |
| Assinatura | Keystore externa + `android/key.properties` ignorado |
| API | `SCU_BASE_URL` por dart-define; release exige HTTPS |
| Permissões | INTERNET e ACCESS_NETWORK_STATE |
| Publicação automática | Não configurada |

Antes do primeiro upload, confira se o pacote já foi vinculado a um artefato no Console. Um pacote já publicado não pode ser trocado por outro para atualizar o mesmo app. A chave de assinatura também deve corresponder à configuração do aplicativo existente.

As exigências de API alvo mudam com o tempo; o projeto usa no mínimo API 36. Reconfira a [política oficial de API alvo](https://support.google.com/googleplay/android-developer/answer/11926878?hl=pt-BR) na data do envio.

## Assinatura

Use uma chave de upload sob responsabilidade da equipe e guarde uma cópia segura fora deste repositório. Se já existir chave do app no Console, use a configuração existente. Não substitua uma chave existente.

Exemplo para gerar uma chave nova, somente se a equipe ainda não tiver uma:

```powershell
keytool -genkeypair -v -keystore C:\SCU-signing\upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

O keytool pede as senhas interativamente. Crie `android/key.properties` a partir de `android/key.properties.example`. O caminho da keystore deve usar barras normais (`C:/SCU-signing/upload.jks`). Não coloque senhas em comandos de build, issues, screenshots ou logs.

O Gradle recusa um build de release sem essa configuração. Não usa automaticamente a chave de debug para release.

## Gerar os artefatos

Depois de configurar a assinatura e obter uma API HTTPS funcional:

```powershell
flutter build apk --release --dart-define=SCU_BASE_URL=https://SEU-SERVIDOR --dart-define=SCU_DEV=false
flutter build appbundle --release --dart-define=SCU_BASE_URL=https://SEU-SERVIDOR --dart-define=SCU_DEV=false
```

- APK: `build/app/outputs/flutter-apk/app-release.apk`.
- AAB: `build/app/outputs/bundle/release/app-release.aab`.
- Incremente o número após `+` em cada novo envio: `1.0.0+2`, `1.0.1+3`, etc.
- `SCU_DEV=true` não libera HTTP em release.
- Um endereço HTTPS fictício permite compilar, mas não permite validar login nem atendimento real.

## Pendências da ficha acadêmica

A preparação técnica não equivale a aprovação da loja. Antes de qualquer envio, a equipe/professor precisa definir e revisar:

- URL HTTPS real e testes em dispositivo.
- Política de privacidade hospedada e contato de suporte reais.
- Declaração de segurança de dados consistente com os dados de conta, saúde e convênios enviados ao backend.
- [Declaração de funcionalidades de saúde](https://support.google.com/googleplay/android-developer/answer/14738291?hl=pt-BR), classificação indicativa, público e acesso do revisor com conta de teste.
- Fluxo de solicitação de exclusão de conta dentro e fora do app. Como há autocadastro, esse requisito precisa ser atendido antes da distribuição na loja: veja a [política de exclusão de contas](https://support.google.com/googleplay/android-developer/answer/13327111?hl=pt-BR). O backend atual não oferece esse endpoint; a equipe deve definir o fluxo de suporte/solicitação e a URL reais.
- Ícone e capturas da versão final, usando apenas dados fictícios autorizados.
- Trilha de testes exigida pela modalidade da conta e pelo professor.

As capturas do Android são bloqueadas pelo app para proteger dados de saúde. Evidências de interface automatizadas devem usar as fixtures sintéticas dos testes, sem liberar capturas de dados reais.

Consulte [Build e release Android no Flutter](https://docs.flutter.dev/deployment/android), [configuração de app no Console](https://support.google.com/googleplay/android-developer/answer/9859152?hl=pt-BR) e as orientações vigentes mostradas na sua conta. Estas tarefas continuam externas ao port; não foi cadastrado serviço Google nem solicitado acesso à conta.

## Build de teste interno só com login Google

`lib/main_google.dart` é um ponto de entrada separado, com uma única tela "Entrar com Google" que mostra nome e e-mail da conta. Não usa o backend, então não depende de `SCU_BASE_URL`. O app completo continua em `lib/main.dart`.

```powershell
flutter build appbundle --release -t lib/main_google.dart --dart-define=GOOGLE_SERVER_CLIENT_ID=SEU_WEB_CLIENT_ID.apps.googleusercontent.com
```

O login só funciona no build instalado pela Play Store se o cliente OAuth Android (pacote `com.scu.app`) tiver cadastradas as SHA-1 de debug, da upload key e do certificado de assinatura do Play App Signing. Sem isso o erro é `DEVELOPER_ERROR`/código 10.
