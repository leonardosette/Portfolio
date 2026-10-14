/* Portfólio de Leonardo Sette: dados, renderização, tema e vídeo */
"use strict";

/* ===== EDITE AQUI ===== */
const CONFIG = {
  usuario: "leonardosette",
  repo: "Portifolio",
  linkedin: "",          // cole o link do seu perfil, ex.: https://www.linkedin.com/in/seu-perfil
  youtubeId: ""          // cole só o ID do vídeo, ex.: dQw4w9WgXcQ
};

// pasta: caminho do projeto dentro do repositório.
const projetos = [
  { materia: "Compiladores", nome: "Compilador", pasta: "projetos/Compiladores/Compilador",
    desc: "Compilador desenvolvido na disciplina de Compiladores." },
  { materia: "Dispositivos Móveis", nome: "Projeto final de Dispositivos Móveis", pasta: "projetos/DispositivosMoveis/projetoFinalDispositivosMoveis",
    desc: "Projeto final da disciplina de Dispositivos Móveis." },
  { materia: "Paradigmas", nome: "Paradigmas The Boys", pasta: "projetos/Paradigmas/Paradigmas_The_Boys",
    desc: "Projeto da disciplina de Paradigmas de Programação." },
  { materia: "Programação Web", nome: "Programação Web", pasta: "projetos/ProgramacaoWeb/programacao_web_cc_b",
    desc: "Projeto web da disciplina de Programação Web." },
  { materia: "Projeto Integrador I", nome: "Projeto Integrador V2", pasta: "projetos/ProjetoIntegrador-1/Projeto-Integrador-V2",
    desc: "Projeto do Projeto Integrador I." },
  { materia: "Projeto Integrador III", nome: "Sistema Clínico Unificado", pasta: "projetos/ProjetoIntegrador-3/SistemaClinicoUnificado",
    desc: "Sistema clínico unificado, com painel administrativo." },
  { materia: "Projeto Integrador IV", nome: "Clínica Unificada", pasta: "projetos/ProjetoIntegrador-4/clinicaUnificada",
    desc: "Projeto do Projeto Integrador IV." }
  // Para adicionar outro projeto, copie uma linha acima e ajuste materia, nome, pasta e desc.
];
/* ====================== */

const base = `https://github.com/${CONFIG.usuario}/${CONFIG.repo}/tree/main/`;
const lista = document.getElementById("lista");

function esc(t) { const d = document.createElement("div"); d.textContent = t; return d.innerHTML; }

function render() {
  lista.innerHTML = projetos.map(p => `
    <article class="proj">
      <div class="materia">${esc(p.materia)}</div>
      <div>
        <h3>${esc(p.nome)}</h3>
        <p>${esc(p.desc)}</p>
      </div>
      <a class="btn btn-sm btn-line" href="${base + encodeURI(p.pasta)}" target="_blank" rel="noopener">Abrir no GitHub</a>
    </article>`).join("");
}
render();

// Links do repositório e do LinkedIn
document.getElementById("linkRepo").href = `https://github.com/${CONFIG.usuario}/${CONFIG.repo}`;
document.getElementById("linkGithub").href = `https://github.com/${CONFIG.usuario}`;
const li = document.getElementById("linkLinkedin");
if (CONFIG.linkedin) li.href = CONFIG.linkedin; else li.classList.add("disabled");

// Vídeo do YouTube
const box = document.getElementById("videoBox");
if (CONFIG.youtubeId) {
  box.innerHTML = `<iframe src="https://www.youtube.com/embed/${encodeURIComponent(CONFIG.youtubeId)}" title="Apresentação do portfólio" allowfullscreen loading="lazy"></iframe>`;
} else {
  box.innerHTML = `<div class="d-flex h-100 align-items-center justify-content-center p-4 text-center">O vídeo aparece aqui depois que você colar o ID do YouTube em <code>CONFIG.youtubeId</code>.</div>`;
}

// Tema claro/escuro
const html = document.documentElement, btnTema = document.getElementById("tema");
function aplicarTema(t) { html.setAttribute("data-bs-theme", t); btnTema.textContent = t === "dark" ? "Tema claro" : "Tema escuro"; }
let salvo = null; try { salvo = localStorage.getItem("tema"); } catch (e) {}
aplicarTema(salvo || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
btnTema.addEventListener("click", () => {
  const novo = html.getAttribute("data-bs-theme") === "dark" ? "light" : "dark";
  aplicarTema(novo); try { localStorage.setItem("tema", novo); } catch (e) {}
});

document.getElementById("ano").textContent = new Date().getFullYear();
