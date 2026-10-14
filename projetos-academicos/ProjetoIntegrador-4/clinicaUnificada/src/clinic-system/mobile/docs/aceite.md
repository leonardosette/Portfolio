# Roteiro de aceite com Android e backend

Use somente dados fictícios. Anote dispositivo, Android, versão do APK, URL/fuso do backend, data, resultado e evidência no relatório da sprint.

## Fluxo principal

1. Cadastrar um paciente com CPF de 11 dígitos, senha de pelo menos oito caracteres e nascimento passado.
2. Confirmar entrada automática. Repetir cadastro com e-mail/CPF existentes e conferir a mensagem literal.
3. Sair. Tentar login com o superadmin e confirmar recusa sem sessão.
4. Entrar como paciente. Encerrar o processo e reabrir: token deve ser restaurado pelo Keystore e perfil buscado novamente.
5. Agendar: clínica → especialidade (inclusive Todas as especialidades) → médico → data/hora futura.
6. Conferir Solicitação enviada, status Aguardando e ausência de afirmação de confirmação.
7. Abrir consultas e detalhe; cancelar com confirmação; conferir recarga e notificação.
8. Com consulta concluída previamente pela equipe clínica, abrir prontuário e prescrição. Campos vazios não devem aparecer.
9. Editar perfil, apagar campo textual e salvar; reabrir e confirmar. Voltar antes de salvar precisa pedir descarte.
10. Criar/editar/excluir convênio, alternar titular/dependente e definir principal. Conferir zeros à esquerda da carteirinha.
11. Marcar uma/todas as notificações e confirmar contador. Voltar do segundo plano deve atualizar contagem sem polling.
12. Esperar expiração ou usar token inválido no ambiente de teste: 401 deve voltar ao login com mensagem, sem renovar senha/token.

## Estados e acessibilidade

- Simular servidor indisponível, timeout, erro de negócio, lista vazia e modo avião. Conferir skeleton, mensagem específica, Tentar de novo e faixa offline.
- Fazer o percurso com TalkBack: login, agendamento, cancelar, salvar perfil, excluir convênio e sair.
- Usar fonte ampliada e orientação alterada; campos devem continuar acessíveis por rolagem.
- Verificar alvos de 48 dp e contraste dos textos. Status deve ser lido em voz alta, sem depender só de cor.
- Confirmar que a tentativa de captura da tela Android é bloqueada.
- Sem prontuário/cache clínico disponível após reiniciar sem rede.

## Release e loja

- Assinar com keystore fora do Git.
- Instalar APK em aparelho físico, com API HTTPS real.
- Conferir certificado, pacote e versionCode no artefato.
- Verificar manifesto mesclado de release: sem networkSecurityConfig de debug ou liberação de HTTP.
- Confirmar checklist do Console com o professor; não enviar automaticamente.

Essas verificações manuais permanecem pendentes até haver dispositivo/ambiente. A suíte automatizada não substitui TalkBack ou um teste com backend real.
