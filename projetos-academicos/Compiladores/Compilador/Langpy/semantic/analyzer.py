"""
analyzer.py — Analisador Semântico da linguagem LangPy.

Percorre a AST e verifica:
  - Variáveis usadas antes de serem declaradas
  - Redeclaração de variáveis no mesmo escopo
  - Compatibilidade de tipos em atribuições e operações
  - Chamadas de função com número correto de argumentos
  - Return com tipo compatível com o retorno da função
  - Break fora de loop ou switch
  - Funções registradas antes de serem usadas (hoisting simples)
"""

from __future__ import annotations
from typing import Optional

from parser.ast_nodes import (
    ASTNode, Program,
    IntLiteral, FloatLiteral, StringLiteral, BoolLiteral,
    Identifier, BinaryOp, UnaryOp, Assign, FunctionCall,
    VarDeclaration, FunctionDeclaration,
    IfStatement, WhileStatement, ForStatement,
    SwitchStatement, CaseClause,
    ReturnStatement, BreakStatement, PrintStatement, InputStatement,
)
from semantic.symbol_table import Symbol, SymbolTable


# ─────────────────────────────────────────────
#  Exceção Semântica
# ─────────────────────────────────────────────

class SemanticError(Exception):
    """Lançada quando o analisador encontra um ou mais erros semânticos."""

    def __init__(self, message: str, line: int = 0):
        super().__init__(f"[SemanticError] Linha {line}: {message}")
        self.line = line


# ─────────────────────────────────────────────
#  Analisador Semântico
# ─────────────────────────────────────────────

class SemanticAnalyzer:
    """
    Percorre a AST usando o padrão Visitor e valida as regras semânticas.

    Uso:
        analyzer = SemanticAnalyzer()
        analyzer.analyze(ast)   # lança SemanticError se houver problema
    """

    NUMERIC_TYPES = {"int", "float"}

    def __init__(self):
        self.table                              = SymbolTable()
        self._current_function: Optional[Symbol] = None
        self._loop_depth                        = 0
        self._errors: list[str]                 = []

    # ─────────────────────────────────────────
    #  API pública
    # ─────────────────────────────────────────

    def analyze(self, node: ASTNode) -> None:
        """
        Ponto de entrada. Faz duas passagens:
          1ª: registra todas as funções globais (hoisting)
          2ª: analisa o programa completo
        """
        if isinstance(node, Program):
            self._hoist_functions(node)
        self._visit(node)

        if self._errors:
            raise SemanticError("\n".join(self._errors))

    # ─────────────────────────────────────────
    #  Visitor
    # ─────────────────────────────────────────

    def _visit(self, node: ASTNode) -> str:
        """Despacha para o método _visit_* correto. Retorna o tipo da expressão."""
        method_name = "_visit_" + node.__class__.__name__.lower()
        method = getattr(self, method_name, self._generic_visit)
        return method(node)

    def _generic_visit(self, node: ASTNode) -> str:
        return "void"

    # ─────────────────────────────────────────
    #  Hoisting de funções
    # ─────────────────────────────────────────

    def _hoist_functions(self, program: Program) -> None:
        """Registra todas as funções globais antes da análise completa."""
        for node in program.body:
            if isinstance(node, FunctionDeclaration):
                self._register_function(node)

    def _register_function(self, node: FunctionDeclaration) -> None:
        if self.table.resolve_local(node.name):
            self._error(f"Função '{node.name}' já foi declarada neste escopo.", node.line)
            return
        self.table.define(Symbol(
            name=node.name,
            symbol_type="func",
            is_function=True,
            params=node.params,
            return_type=node.return_type,
            line=node.line,
        ))

    # ─────────────────────────────────────────
    #  Programa e Funções
    # ─────────────────────────────────────────

    def _visit_program(self, node: Program) -> str:
        for stmt in node.body:
            self._visit(stmt)
        return "void"

    def _visit_functiondeclaration(self, node: FunctionDeclaration) -> str:
        func_symbol            = self.table.resolve(node.name)
        prev_function          = self._current_function
        self._current_function = func_symbol

        self.table.push_scope(f"func:{node.name}")

        for param_name, param_type in node.params:
            if self.table.resolve_local(param_name):
                self._error(f"Parâmetro '{param_name}' duplicado em '{node.name}'.", node.line)
            else:
                self.table.define(Symbol(name=param_name, symbol_type=param_type, line=node.line))

        for stmt in node.body:
            self._visit(stmt)

        self.table.pop_scope()
        self._current_function = prev_function
        return "void"

    # ─────────────────────────────────────────
    #  Declaração de variável
    # ─────────────────────────────────────────

    def _visit_vardeclaration(self, node: VarDeclaration) -> str:
        if self.table.resolve_local(node.name):
            self._error(f"Variável '{node.name}' já declarada neste escopo.", node.line)
            return node.var_type

        if node.initializer:
            init_type = self._visit(node.initializer)
            if not self._compatible(node.var_type, init_type):
                self._error(
                    f"Tipo incompatível em '{node.name}': "
                    f"esperado '{node.var_type}', recebido '{init_type}'.",
                    node.line,
                )

        self.table.define(Symbol(name=node.name, symbol_type=node.var_type, line=node.line))
        return node.var_type

    # ─────────────────────────────────────────
    #  Literais
    # ─────────────────────────────────────────

    def _visit_intliteral(self,    node: IntLiteral)    -> str: return "int"
    def _visit_floatliteral(self,  node: FloatLiteral)  -> str: return "float"
    def _visit_stringliteral(self, node: StringLiteral) -> str: return "string"
    def _visit_boolliteral(self,   node: BoolLiteral)   -> str: return "bool"

    # ─────────────────────────────────────────
    #  Expressões
    # ─────────────────────────────────────────

    def _visit_identifier(self, node: Identifier) -> str:
        symbol = self.table.resolve(node.name)
        if not symbol:
            self._error(f"Variável '{node.name}' não declarada.", node.line)
            return "unknown"
        return symbol.symbol_type

    def _visit_assign(self, node: Assign) -> str:
        symbol = self.table.resolve(node.name)
        if not symbol:
            self._error(f"Variável '{node.name}' não declarada.", node.line)
            return "unknown"
        value_type = self._visit(node.value)
        if not self._compatible(symbol.symbol_type, value_type):
            self._error(
                f"Atribuição inválida em '{node.name}': "
                f"esperado '{symbol.symbol_type}', recebido '{value_type}'.",
                node.line,
            )
        return symbol.symbol_type

    def _visit_binaryop(self, node: BinaryOp) -> str:
        left_t  = self._visit(node.left)
        right_t = self._visit(node.right)
        op      = node.operator
        line    = getattr(node.left, "line", 0)

        if op in ("and", "or"):
            if left_t != "bool" or right_t != "bool":
                self._error(f"'{op}' requer bool, recebido '{left_t}' e '{right_t}'.", line)
            return "bool"

        if op in ("==", "!=", ">", "<", ">=", "<="):
            if not self._compatible(left_t, right_t):
                self._error(f"Comparação entre tipos incompatíveis: '{left_t}' e '{right_t}'.", line)
            return "bool"

        if op in ("+", "-", "*", "/"):
            if op == "+" and left_t == "string" and right_t == "string":
                return "string"
            if left_t in self.NUMERIC_TYPES and right_t in self.NUMERIC_TYPES:
                return "float" if "float" in (left_t, right_t) else "int"
            self._error(f"Operador '{op}' inválido para '{left_t}' e '{right_t}'.", line)
            return "unknown"

        return "unknown"

    def _visit_unaryop(self, node: UnaryOp) -> str:
        t = self._visit(node.operand)
        if node.operator == "not":
            if t != "bool":
                self._error(f"'not' requer bool, recebido '{t}'.", 0)
            return "bool"
        if node.operator == "-":
            if t not in self.NUMERIC_TYPES:
                self._error(f"'-' unário requer numérico, recebido '{t}'.", 0)
            return t
        return "unknown"

    def _visit_functioncall(self, node: FunctionCall) -> str:
        symbol = self.table.resolve(node.name)
        if not symbol:
            self._error(f"Função '{node.name}' não declarada.", node.line)
            return "unknown"
        if not symbol.is_function:
            self._error(f"'{node.name}' não é uma função.", node.line)
            return "unknown"

        if len(node.args) != len(symbol.params):
            self._error(
                f"'{node.name}' espera {len(symbol.params)} argumento(s), "
                f"recebeu {len(node.args)}.",
                node.line,
            )
        else:
            for i, (arg, (_, param_type)) in enumerate(zip(node.args, symbol.params)):
                arg_type = self._visit(arg)
                if not self._compatible(param_type, arg_type):
                    self._error(
                        f"Argumento {i+1} de '{node.name}': "
                        f"esperado '{param_type}', recebido '{arg_type}'.",
                        node.line,
                    )

        return symbol.return_type

    # ─────────────────────────────────────────
    #  Estruturas de controle
    # ─────────────────────────────────────────

    def _visit_ifstatement(self, node: IfStatement) -> str:
        cond = self._visit(node.condition)
        if cond != "bool":
            self._error(f"Condição do 'if' deve ser bool, recebido '{cond}'.", 0)

        self.table.push_scope("if")
        for stmt in node.then_branch:
            self._visit(stmt)
        self.table.pop_scope()

        if node.else_branch:
            self.table.push_scope("else")
            for stmt in node.else_branch:
                self._visit(stmt)
            self.table.pop_scope()

        return "void"

    def _visit_whilestatement(self, node: WhileStatement) -> str:
        cond = self._visit(node.condition)
        if cond != "bool":
            self._error(f"Condição do 'while' deve ser bool, recebido '{cond}'.", 0)

        self._loop_depth += 1
        self.table.push_scope("while")
        for stmt in node.body:
            self._visit(stmt)
        self.table.pop_scope()
        self._loop_depth -= 1
        return "void"

    def _visit_forstatement(self, node: ForStatement) -> str:
        self.table.push_scope("for")

        if node.initializer:
            self._visit(node.initializer)
        if node.condition:
            cond = self._visit(node.condition)
            if cond != "bool":
                self._error(f"Condição do 'for' deve ser bool, recebido '{cond}'.", 0)

        self._loop_depth += 1
        for stmt in node.body:
            self._visit(stmt)
        self._loop_depth -= 1

        if node.increment:
            self._visit(node.increment)

        self.table.pop_scope()
        return "void"

    def _visit_switchstatement(self, node: SwitchStatement) -> str:
        self._visit(node.expression)
        self._loop_depth += 1

        for case in node.cases:
            self.table.push_scope("case")
            if case.value:
                self._visit(case.value)
            for stmt in case.body:
                self._visit(stmt)
            self.table.pop_scope()

        self._loop_depth -= 1
        return "void"

    # ─────────────────────────────────────────
    #  Comandos
    # ─────────────────────────────────────────

    def _visit_returnstatement(self, node: ReturnStatement) -> str:
        if not self._current_function:
            self._error("'return' fora de uma função.", node.line)
            return "void"

        expected = self._current_function.return_type
        if node.value is None:
            if expected != "void":
                self._error(
                    f"Função '{self._current_function.name}' deve retornar '{expected}', "
                    f"mas return está sem valor.",
                    node.line,
                )
        else:
            actual = self._visit(node.value)
            if not self._compatible(expected, actual):
                self._error(
                    f"Retorno de '{self._current_function.name}': "
                    f"esperado '{expected}', recebido '{actual}'.",
                    node.line,
                )
        return "void"

    def _visit_breakstatement(self, node: BreakStatement) -> str:
        if self._loop_depth == 0:
            self._error("'break' fora de loop ou switch.", node.line)
        return "void"

    def _visit_printstatement(self, node: PrintStatement) -> str:
        self._visit(node.value)
        return "void"

    def _visit_inputstatement(self, node: InputStatement) -> str:
        self._visit(node.prompt)
        return "string"

    # ─────────────────────────────────────────
    #  Utilitários
    # ─────────────────────────────────────────

    def _compatible(self, expected: str, actual: str) -> bool:
        """
        Compatibilidade de tipos:
          - tipos iguais → sempre ok
          - int → float (promoção numérica)
          - unknown → qualquer coisa (evita cascata de erros)
        """
        if expected == actual:
            return True
        if "unknown" in (expected, actual):
            return True
        if expected == "float" and actual == "int":
            return True
        return False

    def _error(self, message: str, line: int = 0) -> None:
        """Acumula um erro semântico para reportar no final."""
        self._errors.append(f"[SemanticError] Linha {line}: {message}")