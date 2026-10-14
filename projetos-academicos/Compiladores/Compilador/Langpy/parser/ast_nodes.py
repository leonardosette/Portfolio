"""
ast_nodes.py — Nós da Árvore Sintática Abstrata (AST) da linguagem LangPy.

Cada construção da linguagem tem sua própria classe.
Todas herdam de ASTNode, que fornece o método accept() para o padrão Visitor
(usado pelo analisador semântico e pelo gerador de código).
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional


# ─────────────────────────────────────────────
#  Nó base
# ─────────────────────────────────────────────

class ASTNode:
    """Classe base para todos os nós da AST."""

    def accept(self, visitor):
        """
        Padrão Visitor: delega a visita ao método correspondente do visitor.
        Ex: um VarDeclaration chama visitor.visit_var_declaration(self)
        """
        method_name = "visit_" + self.__class__.__name__.lower()
        method = getattr(visitor, method_name, visitor.generic_visit)
        return method(self)

    def __repr__(self) -> str:
        attrs = ", ".join(f"{k}={v!r}" for k, v in self.__dict__.items())
        return f"{self.__class__.__name__}({attrs})"


# ─────────────────────────────────────────────
#  Programa (raiz da AST)
# ─────────────────────────────────────────────

@dataclass
class Program(ASTNode):
    """Nó raiz — representa o programa inteiro."""
    body: list[ASTNode] = field(default_factory=list)


# ─────────────────────────────────────────────
#  Literais
# ─────────────────────────────────────────────

@dataclass
class IntLiteral(ASTNode):
    """Ex: 42"""
    value: int

@dataclass
class FloatLiteral(ASTNode):
    """Ex: 3.14"""
    value: float

@dataclass
class StringLiteral(ASTNode):
    """Ex: "hello" """
    value: str

@dataclass
class BoolLiteral(ASTNode):
    """Ex: true | false"""
    value: bool


# ─────────────────────────────────────────────
#  Identificador
# ─────────────────────────────────────────────

@dataclass
class Identifier(ASTNode):
    """
    Referência a uma variável ou função.
    Ex: x, nome, soma
    """
    name: str
    line: int = 0
    column: int = 0


# ─────────────────────────────────────────────
#  Expressões
# ─────────────────────────────────────────────

@dataclass
class BinaryOp(ASTNode):
    """
    Operação binária: aritmética, comparação ou lógica.
    Ex: x + 1, a == b, x > 0 and y < 10
    Operadores: + - * / == != > < >= <= and or
    """
    left:     ASTNode
    operator: str
    right:    ASTNode

@dataclass
class UnaryOp(ASTNode):
    """
    Operação unária.
    Ex: not ativo, -x
    Operadores: not -
    """
    operator: str
    operand:  ASTNode

@dataclass
class Assign(ASTNode):
    """
    Atribuição a variável já declarada.
    Ex: x = x + 1;
    """
    name:  str
    value: ASTNode
    line:  int = 0

@dataclass
class FunctionCall(ASTNode):
    """
    Chamada de função.
    Ex: soma(a, b), print("oi")
    """
    name: str
    args: list[ASTNode] = field(default_factory=list)
    line: int = 0


# ─────────────────────────────────────────────
#  Declarações
# ─────────────────────────────────────────────

@dataclass
class VarDeclaration(ASTNode):
    """
    Declaração de variável com tipo e valor inicial opcional.
    Ex: var x: int = 10;
        var nome: string;
    """
    name:        str
    var_type:    str                  # "int" | "float" | "string" | "bool"
    initializer: Optional[ASTNode]   # pode ser None
    line:        int = 0

@dataclass
class FunctionDeclaration(ASTNode):
    """
    Declaração de função.
    Ex: func soma(a: int, b: int): int { return a + b; }
    """
    name:        str
    params:      list[tuple[str, str]]   # [(nome, tipo), ...]
    return_type: str                     # "int" | "float" | "string" | "bool" | "void"
    body:        list[ASTNode] = field(default_factory=list)
    line:        int = 0


# ─────────────────────────────────────────────
#  Estruturas de controle
# ─────────────────────────────────────────────

@dataclass
class IfStatement(ASTNode):
    """
    Condicional if / else.
    Ex:
        if (x > 0) { ... }
        if (x > 0) { ... } else { ... }
    """
    condition:   ASTNode
    then_branch: list[ASTNode] = field(default_factory=list)
    else_branch: list[ASTNode] = field(default_factory=list)   # vazio se não houver else

@dataclass
class WhileStatement(ASTNode):
    """
    Loop while.
    Ex: while (x > 0) { x = x - 1; }
    """
    condition: ASTNode
    body:      list[ASTNode] = field(default_factory=list)

@dataclass
class ForStatement(ASTNode):
    """
    Loop for com inicializador, condição e incremento.
    Ex: for (var i: int = 0; i < 10; i = i + 1) { print(i); }
    """
    initializer: Optional[ASTNode]   # VarDeclaration ou Assign
    condition:   Optional[ASTNode]
    increment:   Optional[ASTNode]   # geralmente um Assign
    body:        list[ASTNode] = field(default_factory=list)

@dataclass
class CaseClause(ASTNode):
    """
    Um case dentro do switch.
    Ex: case 1: print("um"); break;
    """
    value: Optional[ASTNode]       # None para o default
    body:  list[ASTNode] = field(default_factory=list)
    is_default: bool = False

@dataclass
class SwitchStatement(ASTNode):
    """
    Estrutura switch/case.
    Ex:
        switch (x) {
            case 1: print("um"); break;
            default: print("outro"); break;
        }
    """
    expression: ASTNode
    cases:      list[CaseClause] = field(default_factory=list)


# ─────────────────────────────────────────────
#  Comandos
# ─────────────────────────────────────────────

@dataclass
class ReturnStatement(ASTNode):
    """
    Retorno de função.
    Ex: return x + 1;
        return;
    """
    value: Optional[ASTNode] = None   # None para return sem valor
    line:  int = 0

@dataclass
class BreakStatement(ASTNode):
    """
    Break dentro de switch ou loop.
    Ex: break;
    """
    line: int = 0

@dataclass
class PrintStatement(ASTNode):
    """
    Impressão de valor.
    Ex: print("hello");  print(x + 1);
    """
    value: ASTNode
    line:  int = 0

@dataclass
class InputStatement(ASTNode):
    """
    Leitura de entrada do usuário (retorna string).
    Ex: var nome: string = input("Digite: ");
    """
    prompt: ASTNode
    line:   int = 0