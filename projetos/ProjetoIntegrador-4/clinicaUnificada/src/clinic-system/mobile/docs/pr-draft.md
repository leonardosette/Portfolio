# feat: portar aplicativo Android do paciente para Flutter

Issue: pendente de identificação pela equipe. Sprint: pendente.

O paciente passa a acessar login/autocadastro, visão geral, agendamento em três passos, consultas, prontuário, perfil, convênios e notificações pelo módulo Flutter Android. O port consome os endpoints existentes sem alterar backend ou frontend.

A rede preserva mensagens em texto puro, lida com respostas vazias/número cru, usa Bearer literal, recusa papéis diferentes de ROLE_PATIENT e encerra sessões inválidas. Datas de agendamento não incluem UTC nem segundos. Escritas recarregam os dados; criações concluídas não são oferecidas novamente quando só o GET seguinte falha.

Inclui navegação de cinco abas, estados de erro/recarga/offline, assinatura Android externa, estrutura para AAB, CI restrita ao módulo, ADR, backlog e guias de execução/Play Console.

## Como validar

Execute os comandos do README e consulte as evidências em `sprints/evidencias-mobile-flutter.md`. Testes automatizados usam dados sintéticos e não exigem backend.

## Pendências e decisões

- Q1: sem refresh; novo login após expiração.
- Q2: sem recuperação de senha; suporte pela recepção.
- Q3: horário livre, solicitação pendente de recepção.
- Q4: nenhum cache clínico persistido.
- Q5: API HTTPS real depende da infraestrutura.
- Q6: estrutura para Console solicitada pelo usuário; nenhuma conexão/publicação.
- Q7: migrações pertencem ao backend.
- Q8: mapa fora da v1.
- Q9: lockfile ignorado conforme o contorno definido.
- Q10: equipe deve fornecer issue, sprint e vínculo no GitHub Projects.
- Validações no emulador, dispositivo físico, TalkBack e backend real pendentes, conforme autorização do usuário.
- O servidor não permite limpar tipo sanguíneo; documentado na tela e no ADR.
- Para atender ao pedido de envio do mobile, a branch adotada é `feature/mobile-flutter-paciente`. O número da issue não foi informado e a consulta autenticada não ficou disponível; o nome sem número é uma divergência do padrão de CONTRIBUTING.md, a regularizar com a equipe antes do PR. Nenhum commit ou merge foi feito diretamente na main.
- JDK 21 foi usado com bytecode Java 17 e Flutter 3.47.4, conforme SDKs compatíveis disponíveis.
- Providers Riverpod declarados à mão; riverpod_annotation está disponível, mas o projeto não depende de codegen.

## Documentos alterados

README raiz, src/README, src/BACKLOG, visão de produto mobile, ADR 001, documentação do módulo e evidências da entrega.
