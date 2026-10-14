# Como testar o SCU Paciente no seu Android

Este manual ensina a executar o aplicativo em um **celular Android conectado por USB ao seu computador Windows**, usando o PostgreSQL e o backend do projeto no Docker. Não é necessário conectar o Google Play Console.

Os comandos são para o **PowerShell**, que pode ser aberto pelo terminal do VS Code. Execute cada bloco na ordem indicada.

## 1. Entenda onde ficam os dados

```text
App Flutter no celular ─┐
                       ├── Backend Spring Boot (porta 8080) ── PostgreSQL (porta 5432)
Sistema web React ─────┘                                      dentro do Docker
```

O app usa o mesmo backend e o mesmo banco do sistema web. Ao cadastrar um paciente ou solicitar uma consulta pelo celular, o backend salva os dados no PostgreSQL. O sistema web pode consultar esses mesmos dados, conforme as permissões do usuário.

Você não instala PostgreSQL nem Docker no celular. O app guarda a sessão de login, mas não mantém um banco local com prontuários e convênios. O volume Docker `postgres_data` preserva os dados entre reinicializações dos containers.

Durante este teste, o computador funciona como servidor. Ele precisa continuar ligado, com Docker e backend funcionando. O cabo USB permite que o celular acesse esse servidor. O Google Play distribui o aplicativo; não hospeda o banco nem o backend.

## 2. Confira o que você precisa

- Celular com **Android 7.0 ou superior** (API 24).
- Cabo USB que transmita dados; alguns cabos apenas carregam.
- Docker Desktop instalado e aberto no computador.
- Projeto em `C:\Users\PC\clinicaUnificada`.
- Flutter, Android SDK e Java instalados.

Neste computador, as ferramentas usadas na implementação estão nestes caminhos:

| Ferramenta | Caminho |
| --- | --- |
| Flutter | `C:\tmp\scu-flutter` |
| Android SDK | `C:\tmp\scu-android-sdk` |
| Java 21 | `C:\tmp\scu-jdk\jdk-21.0.12.1+1` |
| Cache de pacotes Dart | `C:\tmp\scu-pub-cache` |
| Cache Gradle | `C:\tmp\scu-gradle` |

Essas pastas são temporárias e não fazem parte do Git. Em outro computador, ou se elas forem apagadas, instale as ferramentas e ajuste os caminhos dos comandos. Não é necessário instalar um emulador para seguir este manual.

## 3. Inicie o PostgreSQL e o backend

Abra o Docker Desktop e aguarde o mecanismo Docker ficar disponível. No PowerShell:

```powershell
cd C:\Users\PC\clinicaUnificada\src\clinic-system
docker compose version
```

Prepare o `.env` somente se ele ainda não existir:

```powershell
if (-not (Test-Path -LiteralPath '.env')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env'
}
```

Para o teste local, o modelo fornece a configuração de desenvolvimento. Preserve `DDL_AUTO=update` e as credenciais de um banco já existente. Não use `create` para testar sobre dados que deseja manter. O `.env` não deve ser versionado.

Inicie os dois serviços:

```powershell
docker compose up --build -d db backend
docker compose ps
docker compose logs -f backend
```

No primeiro build, o download e a compilação podem demorar alguns minutos. Aguarde a mensagem `Started ClinicSystemApplication`. Pressione **Ctrl+C** para sair da visualização dos logs; isso não encerra os containers.

O backend fica acessível no computador em `http://localhost:8080`. Abrir esse endereço no navegador pode mostrar erro ou acesso negado, pois ele é uma API, não a interface do sistema.

Para também abrir o sistema web e preparar clínicas e médicos:

```powershell
docker compose up --build -d frontend
```

Depois acesse `http://localhost` no navegador do computador. Use a conta administrativa configurada no seu ambiente. O administrador e o paciente têm acessos diferentes.

## 4. Ative a depuração USB no celular

1. Abra **Configurações → Sobre o telefone**.
2. Localize **Número da versão** ou **Número de compilação**. Em alguns aparelhos fica dentro de **Informações do software**.
3. Toque nesse item sete vezes e informe o PIN, se solicitado.
4. Volte às configurações e abra **Opções do desenvolvedor**.
5. Ative **Depuração USB**.
6. Conecte o celular ao computador e mantenha a tela desbloqueada.
7. Aceite a mensagem **Permitir depuração USB?** no celular.

Os nomes dos menus variam conforme o fabricante. Se necessário, selecione o modo USB **Transferência de arquivos**. Consulte também o [guia oficial de execução em aparelho Android](https://developer.android.com/studio/run/device).

## 5. Confira a conexão USB

No PowerShell:

```powershell
& C:\tmp\scu-android-sdk\platform-tools\adb.exe devices
```

O resultado esperado é semelhante a:

```text
List of devices attached
R58XXXXXXXX    device
```

O código da primeira coluna identifica seu aparelho. O estado deve ser **device**.

| Resultado | O que fazer |
| --- | --- |
| `device` | Continue para o próximo passo |
| `unauthorized` | Desbloqueie o celular e aceite a autorização de depuração |
| `offline` | Reconecte o cabo e confira a depuração USB |
| Lista vazia | Confira cabo de dados, porta USB, modo de transferência e driver do fabricante |

Para simplificar, mantenha apenas um aparelho conectado e feche emuladores durante o teste.

## 6. Faça o celular alcançar o backend pelo cabo

Execute:

```powershell
& C:\tmp\scu-android-sdk\platform-tools\adb.exe reverse tcp:8080 tcp:8080
& C:\tmp\scu-android-sdk\platform-tools\adb.exe reverse --list
```

A lista deve conter o encaminhamento `tcp:8080 tcp:8080`. Esse comando faz o acesso do app a `http://localhost:8080` chegar à porta 8080 do computador. Sem o encaminhamento, `localhost` seria o próprio celular.

Não é necessário colocar o celular e o computador na mesma rede Wi-Fi para esse encaminhamento por USB. Repita o comando após desconectar/reconectar o aparelho. [Referência oficial sobre `adb reverse`](https://developer.android.com/develop/ui/views/layout/webapps/access-local-server).

## 7. Compile, instale e abra o aplicativo

No mesmo PowerShell, execute:

```powershell
cd C:\Users\PC\clinicaUnificada\src\clinic-system\mobile

$env:PUB_CACHE='C:\tmp\scu-pub-cache'
$env:ANDROID_HOME='C:\tmp\scu-android-sdk'
$env:ANDROID_USER_HOME='C:\tmp\scu-android-user'
$env:JAVA_HOME='C:\tmp\scu-jdk\jdk-21.0.12.1+1'
$env:GRADLE_USER_HOME='C:\tmp\scu-gradle'

& C:\tmp\scu-flutter\bin\flutter.bat pub get
& C:\tmp\scu-flutter\bin\flutter.bat devices
& C:\tmp\scu-flutter\bin\flutter.bat run --dart-define=SCU_BASE_URL=http://localhost:8080 --dart-define=SCU_DEV=true
```

Se aparecer uma seleção de dispositivos, escolha seu Android. O Flutter compila a versão de desenvolvimento, instala e abre o **SCU Paciente** no aparelho. Mantenha esse terminal aberto durante o teste.

Se precisar selecionar explicitamente o dispositivo, substitua `ID-DO-CELULAR` pelo código exibido no passo 5:

```powershell
& C:\tmp\scu-flutter\bin\flutter.bat run -d ID-DO-CELULAR --dart-define=SCU_BASE_URL=http://localhost:8080 --dart-define=SCU_DEV=true
```

As variáveis `$env:...` valem para esse terminal. Se abrir outro PowerShell, execute novamente o bloco de configuração.

**Use o build deste passo para testar por USB.** O APK debug gerado originalmente apontava para `10.0.2.2`, endereço usado pelo emulador. Os releases de validação apontavam para uma URL fictícia. Instalar aqueles arquivos sem recompilar não configura a conexão com seu backend pelo cabo.

## 8. Faça o primeiro acesso

1. Na tela de login, toque em **Cadastrar**.
2. Preencha os dados de um paciente fictício de teste. Use CPF de 11 dígitos, nascimento passado e senha com pelo menos oito caracteres.
3. Conclua o cadastro e confira a entrada automática.
4. Saia e entre novamente com o e-mail e a senha desse paciente.

O mobile é exclusivo para pacientes. Tentar entrar com o administrador do sistema web deve exibir a recusa de acesso.

Uma conta de paciente já cadastrada no mesmo backend também pode ser utilizada. Não é necessário criar outro banco para o celular.

## 9. Teste os principais fluxos

Use somente dados fictícios. Para agendar, cadastre previamente clínica, especialidade e médico pelo sistema web, conforme os acessos disponíveis no ambiente.

| Teste | Como testar | Resultado esperado |
| --- | --- | --- |
| Início | Abra a aba Início | Indicadores e próxima consulta, ou mensagem de lista vazia |
| Agendamento | Escolha clínica, especialidade/médico e data/hora futura | Solicitação enviada com status Aguardando; recepção ainda precisa confirmar |
| Consultas | Abra a lista e o detalhe | A solicitação aparece e os filtros funcionam |
| Cancelamento | Cancele uma consulta pendente pelo diálogo de confirmação | Lista atualizada e status correspondente |
| Perfil | Edite um campo permitido, salve e reabra | Alteração carregada do backend |
| Convênios | Crie, edite, defina principal e exclua um convênio de teste | Lista atualizada após cada operação |
| Notificações | Abra o sino e marque notificações como lidas | Estado e contador atualizados |
| Prontuário | Abra após a equipe clínica concluir um atendimento e registrar informações | Registro e prescrições disponíveis; sem dados, aparece estado vazio |
| Sessão | Feche o aplicativo e abra pelo ícone | Sessão restaurada enquanto válida; perfil recarregado |
| Acessibilidade | Amplie a fonte e percorra as ações com TalkBack | Conteúdo legível e ações identificáveis |

Para conferir a integração, procure no sistema web a solicitação feita pelo celular, com uma conta autorizada a visualizar aquele paciente/clínica. Os dados passam pelo mesmo backend e PostgreSQL.

Para testar servidor indisponível, em **outro terminal**:

```powershell
cd C:\Users\PC\clinicaUnificada\src\clinic-system
docker compose stop backend
```

Atualize uma tela do app: ela deve mostrar erro e permitir tentar novamente. Depois restaure o backend, aguarde a inicialização e tente de novo:

```powershell
docker compose start backend
```

Parar o backend testa indisponibilidade do servidor; não necessariamente faz aparecer a faixa de aparelho sem conexão. Modo avião também pode manter o túnel USB funcionando, portanto não é uma prova isolada de falha da API nesse cenário.

O app bloqueia capturas de tela no Android. Para evidências visuais com dados sintéticos, consulte as [capturas dos testes](sprints/evidencias-mobile-flutter.md). O [roteiro completo de aceite](src/clinic-system/mobile/docs/aceite.md) inclui outras verificações.

## 10. Problemas comuns

| Problema | Como resolver |
| --- | --- |
| Docker informa que não consegue conectar ao daemon | Abra o Docker Desktop e aguarde sua inicialização |
| Porta 8080 ou 5432 já está em uso | Confira se já existe backend/PostgreSQL em execução; não inicie duas instâncias na mesma porta |
| Backend não inicia ou falha na autenticação do banco | Consulte `docker compose logs --tail 100 backend db`; confira o `.env` e as credenciais do volume existente |
| Caminho do Flutter, Java ou adb não existe | Confira as pastas do passo 2; ajuste para a instalação atual |
| Flutter mostra erro de licença Android | Execute `& C:\tmp\scu-android-sdk\cmdline-tools\latest\bin\sdkmanager.bat --sdk_root=C:\tmp\scu-android-sdk --licenses` com o Java configurado; leia e aceite os termos aplicáveis |
| Aparelho não é encontrado | Volte ao passo 5; confira cabo, autorização e driver USB do fabricante |
| Há mais de um dispositivo | Use `adb -s ID-DO-CELULAR reverse tcp:8080 tcp:8080` com o caminho completo do adb e `flutter run -d ID-DO-CELULAR ...` |
| Login/cadastro mostra erro de conexão | Confira backend em execução, estado `device`, `adb reverse --list` e URL `http://localhost:8080` no comando de execução |
| Aparece erro de HTTP não permitido | Execute a versão debug deste manual; release exige HTTPS |
| Login administrativo é recusado | Use uma conta de paciente; o comportamento é esperado |
| Cadastro informa e-mail ou CPF existente | Entre com a conta existente ou use outro paciente fictício |
| Não aparece clínica ou médico | Cadastre os dados necessários no sistema web do mesmo ambiente |
| Prontuário está vazio | Prepare um atendimento concluído e registrado pela equipe clínica no backend |
| Sessão expirada | Entre novamente; o backend não oferece renovação automática do token |
| Funcionava antes de retirar o cabo | Reconecte, confirme `adb devices` e repita `adb reverse` |

Se precisar compartilhar um erro, envie a mensagem exibida e a etapa em que ocorreu. Não inclua senhas, tokens ou dados reais de pacientes.

## 11. Encerrar e testar novamente

Para encerrar a execução controlada pelo Flutter, pressione **q** no terminal de `flutter run`. O aplicativo continua instalado; você pode iniciá-lo novamente pelo ícone. Para usar seus dados, o backend e o encaminhamento USB precisam estar disponíveis.

Para parar os serviços sem apagar o banco:

```powershell
cd C:\Users\PC\clinicaUnificada\src\clinic-system
docker compose stop
```

Não use `docker compose down -v` para encerrar os testes: o `-v` remove o volume do banco.

Na próxima sessão:

1. Abra o Docker Desktop e execute `docker compose up -d db backend` na pasta `src\clinic-system`.
2. Conecte o aparelho e confirme `adb devices`.
3. Repita `adb reverse tcp:8080 tcp:8080`, usando o caminho completo do passo 6.
4. Abra o SCU Paciente pelo ícone. Se mudou o código ou precisa acompanhar a execução, repita o passo 7.

## 12. Registre o resultado do teste

Preencha ao executar no aparelho; este manual não declara os testes físicos concluídos:

```text
Data:
Modelo do celular:
Versão do Android:
Versão do app: 1.0.0+1 (ou a versão atual do pubspec.yaml)
Backend: computador local, via USB, porta 8080
Cadastro e login:
Agendamento e cancelamento:
Perfil e convênios:
Prontuário e notificações:
Sessão após fechar e reabrir:
Fonte ampliada e TalkBack:
Erros encontrados:
```

Guarde o registro em `sprints/`, junto às [evidências da implementação](sprints/evidencias-mobile-flutter.md).

Para distribuição futura, siga o [guia Google Play](src/clinic-system/mobile/docs/google-play.md). O teste por USB não exige assinatura de release, upload de AAB ou acesso ao Console.
