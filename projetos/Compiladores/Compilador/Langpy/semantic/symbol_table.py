"""
symbol_table.py — Tabela de Símbolos da linguagem LangPy.

A tabela de símbolos é usada pelo analisador semântico para rastrear
variáveis e funções declaradas, seus tipos e em qual escopo estão.

Suporta escopos aninhados (global, função, if, while, for, switch).
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional


# ─────────────────────────────────────────────
#  Símbolo
# ─────────────────────────────────────────────

@dataclass
class Symbol:
    """Representa uma entrada na tabela de símbolos."""
    name:        str
    symbol_type: str              # "int" | "float" | "string" | "bool" | "func"
    is_function: bool = False
    params:      list[tuple[str, str]] = field(default_factory=list)  # [(nome, tipo)]
    return_type: str = "void"
    line:        int = 0


# ─────────────────────────────────────────────
#  Escopo
# ─────────────────────────────────────────────

class Scope:
    """
    Representa um escopo léxico (bloco de código).
    Cada escopo tem referência ao escopo pai (enclosing).
    """

    def __init__(self, name: str, parent: Optional[Scope] = None):
        self.name    = name                    # nome do escopo (ex: "global", "func:soma")
        self.parent  = parent                  # escopo pai
        self.symbols: dict[str, Symbol] = {}   # símbolos declarados neste escopo

    def define(self, symbol: Symbol) -> None:
        """Declara um símbolo neste escopo."""
        self.symbols[symbol.name] = symbol

    def resolve(self, name: str) -> Optional[Symbol]:
        """
        Busca um símbolo pelo nome neste escopo e nos escopos pai.
        Retorna None se não encontrado.
        """
        if name in self.symbols:
            return self.symbols[name]
        if self.parent:
            return self.parent.resolve(name)
        return None

    def resolve_local(self, name: str) -> Optional[Symbol]:
        """Busca apenas no escopo atual, sem subir para o pai."""
        return self.symbols.get(name)

    def __repr__(self) -> str:
        return f"Scope({self.name}, symbols={list(self.symbols.keys())})"


# ─────────────────────────────────────────────
#  Tabela de Símbolos
# ─────────────────────────────────────────────

class SymbolTable:
    """
    Gerencia a pilha de escopos durante a análise semântica.

    Uso:
        table = SymbolTable()
        table.push_scope("func:soma")
        table.define(Symbol(name="x", symbol_type="int"))
        sym = table.resolve("x")
        table.pop_scope()
    """

    def __init__(self):
        self.global_scope  = Scope("global")
        self.current_scope = self.global_scope
        self._scope_stack: list[Scope] = [self.global_scope]

    # ─────────────────────────────────────────
    #  Gerenciamento de escopos
    # ─────────────────────────────────────────

    def push_scope(self, name: str) -> Scope:
        """Cria e empilha um novo escopo filho."""
        new_scope = Scope(name=name, parent=self.current_scope)
        self._scope_stack.append(new_scope)
        self.current_scope = new_scope
        return new_scope

    def pop_scope(self) -> Scope:
        """Remove e retorna o escopo atual, voltando ao pai."""
        if len(self._scope_stack) <= 1:
            raise RuntimeError("Tentativa de remover o escopo global.")
        scope = self._scope_stack.pop()
        self.current_scope = self._scope_stack[-1]
        return scope

    # ─────────────────────────────────────────
    #  Definição e busca de símbolos
    # ─────────────────────────────────────────

    def define(self, symbol: Symbol) -> None:
        """Declara um símbolo no escopo atual."""
        self.current_scope.define(symbol)

    def resolve(self, name: str) -> Optional[Symbol]:
        """Busca um símbolo pelo nome nos escopos (atual → global)."""
        return self.current_scope.resolve(name)

    def resolve_local(self, name: str) -> Optional[Symbol]:
        """Busca apenas no escopo atual (para detectar redeclaração)."""
        return self.current_scope.resolve_local(name)

    def is_global_scope(self) -> bool:
        return self.current_scope is self.global_scope

    @property
    def depth(self) -> int:
        """Profundidade atual do escopo (0 = global)."""
        return len(self._scope_stack) - 1

    def __repr__(self) -> str:
        return (
            f"SymbolTable(depth={self.depth}, "
            f"current={self.current_scope.name})"
        )