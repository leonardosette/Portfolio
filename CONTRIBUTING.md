# Guia de Colaboração

Obrigado por querer contribuir com o Portifolio. Siga estas práticas para manter o repositório organizado.

## Fluxo de trabalho

1. Crie uma branch a partir da `main`:
   ```bash
   git checkout -b feat/nome-da-alteracao
   ```
2. Faça as alterações e commits pequenos e claros.
3. Envie a branch:
   ```bash
   git push -u origin feat/nome-da-alteracao
   ```
4. Abra um **Pull Request** para a `main`, preenchendo o modelo.
5. Aguarde a revisão. Depois de aprovado, o PR é mesclado e a branch é apagada.

A branch `main` é protegida: não é permitido enviar alterações direto para ela.

## Nome de branches

| Prefixo | Uso |
|---|---|
| `feat/` | nova funcionalidade ou novo projeto na lista |
| `fix/` | correção de erro |
| `docs/` | mudanças em documentação |
| `style/` | ajustes visuais sem mudar o comportamento |

## Mensagens de commit

Formato: `tipo: descrição curta no presente`

```
feat: adiciona projeto de Compiladores
fix: corrige link quebrado do LinkedIn
docs: atualiza README
```

## Boas práticas

- Teste a página no navegador antes de abrir o PR (veja `docs/testes.md`).
- Não envie senhas, tokens, chaves ou arquivos `.env`.
- Mantenha HTML, CSS e JavaScript em arquivos separados.
- Escreva descrições curtas e claras nos PRs.

## Papéis e acesso

As permissões dos colaboradores estão descritas em `docs/configuracao-seguranca-acesso.md`.
