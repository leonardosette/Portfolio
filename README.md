# Portfólio de Leonardo Sette

Repositório que reúne meus projetos acadêmicos e a página de apresentação publicada com **GitHub Pages**. Foi desenvolvido como entrega intermediária do **Bootcamp I** (Ciência da Computação, UniCEUB).

**Página publicada:** https://leonardosette.github.io/Portifolio/

## Sobre

Sou Leonardo Sette Tôrres de Oliveira, estudante de Ciência da Computação no UniCEUB (Centro Universitário de Brasília), com foco em arquitetura de soluções. Este portfólio mostra os projetos que desenvolvi ao longo do curso, cada um no seu repositório original, com código e documentação.

## Projetos

| Disciplina | Projeto | Repositório |
|---|---|---|
| Compiladores | Compilador | [Ver no GitHub](https://github.com/leonardosette/Compilador) |
| Dispositivos Móveis | Projeto final de Dispositivos Móveis | [Ver no GitHub](https://github.com/leonardosette/projetoFinalDispositivosMoveis) |
| Paradigmas | Paradigmas The Boys | [Ver no GitHub](https://github.com/leonardosette/Paradigmas_The_Boys) |
| Programação Web | Programação Web | [Ver no GitHub](https://github.com/leonardosette/programacao_web_cc_b) |
| Projeto Integrador I | Projeto Integrador V2 | [Ver no GitHub](https://github.com/leonardosette/Projeto-Integrador-V2) |
| Projeto Integrador III | Sistema Clínico Unificado | [Ver no GitHub](https://github.com/leonardosette/SistemaClinicoUnificado) |
| Projeto Integrador IV | Clínica Unificada | [Ver no GitHub](https://github.com/leonardosette/clinicaUnificada) |

## Estrutura do repositório

```
Portifolio/
├── index.html      # estrutura da página
├── css/
│   └── style.css   # estilos e tema claro/escuro
├── js/
│   └── main.js     # lista de projetos, tema claro/escuro e vídeo
└── README.md       # este arquivo
```

## Tecnologias

- HTML5 e CSS3
- JavaScript (sem frameworks)
- [Bootstrap 5](https://getbootstrap.com/) para layout responsivo
- Git e GitHub para versionamento
- GitHub Pages para publicação

## Como executar localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/leonardosette/Portifolio.git
   ```
2. Entre na pasta:
   ```bash
   cd Portifolio
   ```
3. Abra o arquivo `index.html` no navegador, ou use a extensão Live Server do VS Code.

Não é necessário instalar nenhuma dependência.

## Como adicionar um projeto

Abra `js/main.js` e inclua um novo bloco na lista `projetos`:

```js
{ materia: "Nome da disciplina", nome: "Nome do projeto", url: "https://github.com/leonardosette/nome-do-repositorio",
  desc: "Breve descrição do que o projeto faz." },
```

Depois, envie a alteração:

```bash
git add .
git commit -m "feat: adiciona novo projeto"
git push
```

## Publicação

A página é servida pelo GitHub Pages a partir da branch `main`, na pasta raiz. Para ativar: **Settings → Pages → Branch: `main` → `/ (root)` → Save**.

## Boas práticas adotadas

- HTML, CSS e JavaScript em arquivos separados.
- HTML semântico e página responsiva, com suporte a tema claro e escuro.
- Um repositório por projeto, com README próprio em cada um.
- Commits com mensagens curtas e descritivas.

## Contato

- GitHub: [@leonardosette](https://github.com/leonardosette)
- LinkedIn: [adicione aqui o link do seu perfil]
