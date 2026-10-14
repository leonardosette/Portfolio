# SCU Paciente — Flutter Android

Aplicativo exclusivo do paciente, aditivo ao backend Spring Boot e ao frontend React. Inclui autocadastro/login, início, agendamento em três passos, consultas e cancelamento, prontuário/prescrições, perfil, convênios e notificações in-app.

## Executar

Ambiente validado: Flutter **3.47.4**, Dart **3.13.3**, JDK **21** (bytecode Java 17), Android SDK **36**, minSdk **24**. Instale Flutter/Android SDK ou configure os caminhos existentes e execute `flutter doctor -v`.

Na pasta `src/clinic-system/mobile`:

```powershell
flutter pub get
flutter run --dart-define=SCU_BASE_URL=http://10.0.2.2:8080 --dart-define=SCU_DEV=true
```

O endereço é obrigatório: não há URL de produção embutida. O backend precisa estar em execução conforme [COMO_RODAR](../../COMO_RODAR.md). O login padrão do seed é superadmin e será recusado; use **Cadastrar** para criar um paciente. Senhas são usadas somente durante o envio e nunca persistidas.

| Cenário | SCU_BASE_URL |
| --- | --- |
| Android Studio AVD | `http://10.0.2.2:8080` |
| Aparelho/AVD com `adb reverse tcp:8080 tcp:8080` | `http://localhost:8080` |
| Genymotion | `http://10.0.3.2:8080` |
| Aparelho no Wi-Fi do PC | `http://IP-REAL-DO-PC:8080` |
| Release | URL HTTPS real fornecida pela infraestrutura |

No Wi-Fi, acrescente o **IP exato** ao `android/app/src/debug/res/xml/network_security_config.xml`, no mesmo domain-config, e recompile o debug. Android não interpreta `192.168.0.0` como faixa de IPs. Em rede da faculdade, prefira `adb reverse`. O firewall do PC pode precisar permitir apenas a porta 8080; não exponha a porta do banco.

Não use `backend`, `host.docker.internal` ou `10.0.2.15` como host no Android. No aparelho, `localhost` só chega ao PC quando houver reverse ativo.

Todos os horários são locais, sem offset. Configure o processo Java no mesmo fuso da clínica (por exemplo, America/Sao_Paulo); o cliente não pode corrigir divergência de fuso num contrato LocalDateTime sem offset.

## Verificar

```powershell
dart format --set-exit-if-changed .
flutter analyze
flutter test --coverage
flutter pub outdated
flutter build apk --debug --dart-define=SCU_BASE_URL=http://10.0.2.2:8080 --dart-define=SCU_DEV=true
```

Os testes unitários e de interface usam API simulada, com o Dio real e adapters controlados/mocktail. O fluxo completo usa seletores reais de data/hora e verifica o POST, a listagem e o DELETE.

Para repetir esse fluxo em Android disponível:

```powershell
flutter test integration_test/patient_flow_test.dart -d ID-DO-ANDROID --dart-define=SCU_BASE_URL=http://10.0.2.2:8080
```

O teste de integração acima também usa dados sintéticos: valida o aplicativo em runtime Android, não a integração com um banco clínico real. Testes manuais com backend, persistência no Keystore após encerrar o processo e TalkBack têm roteiro em [aceite](docs/aceite.md).

As versões diretas foram resolvidas e conferidas com `flutter pub outdated` em 2026-09-13. O lockfile permanece ignorado por determinação do prompt (Q9); a equipe pode rever essa decisão para obter builds reproduzíveis.

## Organização

- `lib/app`: bootstrap, ambiente e guarda go_router.
- `lib/core`: HTTP, falhas, parsing defensivo, datas e sessão.
- `lib/features/*/data`: modelos e repositórios dos 22 endpoints.
- `lib/features/*/domain`: regras de sessão, status, tipo e sangue.
- `lib/features/*/presentation`: providers e telas.
- `lib/shared`: Material 3, componentes acessíveis e estados de carregamento.
- `lib/l10n/strings.dart`: fonte dos textos em português; `app_pt.arb` registra o catálogo inicial sem geração de código.
- `assets/fonts`: Inter e Poppins incluídas com licença, sem download durante o uso.
- `test`, `integration_test`: contratos e fluxos.
- [CI](../../../.github/workflows/mobile-ci.yml): formatação, análise, testes e APK debug somente quando o módulo mudar.

Providers são declarados à mão, sem get_it, freezed ou geração de modelos. Não há banco local, log de payloads nem analytics. Alterações de sessão invalidam os providers; as cinco abas preservam estado durante a sessão.

## Cuidados do contrato

- Login exige literalmente `ROLE_PATIENT`; o perfil é buscado imediatamente para obter os dois IDs.
- O Dio solicita `String` para impedir decodificação prematura de texto puro com Content-Type JSON. Só os repositórios decodificam respostas de sucesso.
- 401 autenticado encerra a sessão; 401 do login mostra credenciais inválidas. 500 nas rotas do paciente informa sessão inválida.
- Datas de consulta são enviadas como `yyyy-MM-ddTHH:mm`, sem segundos/UTC. Datas puras não mudam de fuso.
- Filtros são locais, com paginação em memória. Prontuários são ordenados localmente e abertos pelo appointmentId.
- Após cada escrita, o repositório faz GET. Se a criação já foi salva e só a recarga falhar, a UI informa isso sem oferecer repetir o POST.
- Perfil envia strings vazias para limpar campos; o backend ignora null. **Tipo sanguíneo já preenchido não pode ser apagado pela API atual**.
- Convênio envia todos os campos, incluindo titular/principal. Excluir o principal pode deixar a lista sem principal.
- Notificações não usam push nem polling; contagem atualiza ao retomar o app e ao atualizar a tela.
- Token fica em flutter_secure_storage. Apenas nome/e-mail vão para preferências; CPF, prontuário e carteirinha não são gravados.
- Backup Android e capturas da janela são bloqueados. A dependência AndroidX pode inserir uma permissão de assinatura privada `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`; ela não é uma permissão de acesso a dados do usuário.

## Google Play e entrega acadêmica

O pacote é `com.scu.app`, com versão `1.0.0+1`, ícone SCU, assinatura externa e suporte a AAB. Não existe conexão com o Play Console. Confira [google-play.md](docs/google-play.md) antes de configurar a chave definitiva ou enviar qualquer build.

A validação em emulador/aparelho físico foi adiada por autorização do usuário. [Evidências](../../../sprints/evidencias-mobile-flutter.md) distinguem testes locais de pendências externas. [Rascunho do PR](docs/pr-draft.md) registra Q1–Q10 e a falta de issue/sprint/review, sem declarar essas etapas concluídas.
