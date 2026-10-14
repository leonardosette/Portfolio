/* Portfólio de Leonardo Sette: dados, renderização, tema e vídeo */
"use strict";

/* ===== EDITE AQUI ===== */
const CONFIG = {
  usuario: "leonardosette",
  repo: "Portfolio",
  linkedin: "https://www.linkedin.com/in/leonardo-sette-7843a9422/",
};

// url: link do repositório original de cada projeto no GitHub.
const projetos = [
  { materia: "Compiladores", nome: "Compilador", url: "https://github.com/leonardosette/Compilador",
    desc: "Compilador desenvolvido na disciplina de Compiladores." },
  { materia: "Dispositivos Móveis", nome: "Projeto final de Dispositivos Móveis", url: "https://github.com/leonardosette/projetoFinalDispositivosMoveis",
    desc: "Projeto final da disciplina de Dispositivos Móveis." },
  { materia: "Paradigmas", nome: "Paradigmas The Boys", url: "https://github.com/Guilin-Git/Paradigmas_The_Boys",
    desc: "Projeto da disciplina de Paradigmas de Programação." },
  { materia: "Programação Web", nome: "Programação Web", url: "https://github.com/leonardosette/programacao_web_cc_b",
    desc: "Projeto web da disciplina de Programação Web." },
  { materia: "Projeto Integrador I", nome: "Projeto Integrador V2", url: "https://github.com/Guilin-Git/Projeto-Integrador-V2",
    desc: "Projeto do Projeto Integrador I." },
  { materia: "Projeto Integrador III", nome: "Sistema Clínico Unificado", url: "https://github.com/leonardosette/SistemaClinicoUnificado",
    desc: "Sistema clínico unificado, com painel administrativo." },
  { materia: "Projeto Integrador IV", nome: "Clínica Unificada", url: "https://github.com/leonardosette/clinicaUnificada",
    desc: "Projeto do Projeto Integrador IV." }
];

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
      <a class="btn btn-sm btn-line" href="${esc(p.url)}" target="_blank" rel="noopener">Abrir no GitHub</a>
    </article>`).join("");
}
render();

// Links do repositório e do LinkedIn
document.getElementById("linkRepo").href = `https://github.com/${CONFIG.usuario}/${CONFIG.repo}`;
document.getElementById("linkGithub").href = `https://github.com/${CONFIG.usuario}`;
const li = document.getElementById("linkLinkedin");
if (CONFIG.linkedin) li.href = CONFIG.linkedin; else li.classList.add("disabled");

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