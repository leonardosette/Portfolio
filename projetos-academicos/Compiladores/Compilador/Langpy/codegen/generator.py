"""
generator.py — Gerador de Código Python da linguagem LangPy.

Percorre a AST e emite código Python válido como string.
Usa indentação controlada para garantir que o Python gerado
seja sintaticamente correto.

Mapeamento de tipos LangPy → Python:
  int    → int
  float  → float
  string → str
  bool   → bool (true → True, false → False)
"""

from __future__ import annotations

from parser.ast_nodes import (
    ASTNode, Program,
    IntLiteral, FloatLiteral, StringLiteral, BoolLiteral,
    Identifier, BinaryOp, UnaryOp, Assign, FunctionCall,
    VarDeclaration, FunctionDeclaration,
    IfStatement, WhileStatement, ForStatement,
    SwitchStatement, CaseClause,
    ReturnStatement, BreakStatement, PrintStatement, InputStatement,
)


# ─────────────────────────────────────────────
#  Exceção do Gerador
# ─────────────────────────────────────────────

class CodeGenError(Exception):
    """Lançada quando o gerador encontra um nó inesperado."""
    pass


# ─────────────────────────────────────────────
#  Gerador de Código
# ─────────────────────────────────────────────

class CodeGenerator:
    """
    Gera código Python a partir da AST da LangPy.

    Uso:
        gen    = CodeGenerator()
        output = gen.generate(ast)
        print(output)                  # código Python gerado
    """

    # operadores que mudam entre LangPy e Python
    OP_MAP = {
        "and": "and",
        "or":  "or",
        "not": "not",
        "==":  "==",
        "!=":  "!=",
        ">":   ">",
        "<":   "<",
        ">=":  ">=",
        "<=":  "<=",
        "+":   "+",
        "-":   "-",
        "*":   "*",
        "/":   "/",
    }

    def __init__(self, indent_size: int = 4):
        self._indent_size  = indent_size
        self._indent_level = 0
        self._lines: list[str] = []

    # ─────────────────────────────────────────
    #  API pública
    # ─────────────────────────────────────────

    def generate(self, node: ASTNode) -> str:
        """Gera o código Python e retorna como string."""
        self._lines        = []
        self._indent_level = 0
        self._emit_node(node)
        return "\n".join(self._lines)

    # ─────────────────────────────────────────
    #  Controle de indentação e emissão
    # ─────────────────────────────────────────

    @property
    def _indent(self) -> str:
        return " " * (self._indent_size * self._indent_level)

    def _write(self, line: str) -> None:
        """Escreve uma linha com a indentação atual."""
        self._lines.append(f"{self._indent}{line}")

    def _write_blank(self) -> None:
        """Escreve uma linha em branco."""
        self._lines.append("")

    def _indent_in(self)  -> None: self._indent_level += 1
    def _indent_out(self) -> None: self._indent_level -= 1

    # ─────────────────────────────────────────
    #  Dispatcher
    # ─────────────────────────────────────────

    def _emit_node(self, node: ASTNode) -> None:
        """Despacha para o método _emit_* correto (para statements)."""
        method_name = "_emit_" + node.__class__.__name__.lower()
        method = getattr(self, method_name, None)
        if method is None:
            raise CodeGenError(f"Gerador não implementado para: {node.__class__.__name__}")
        method(node)

    def _expr(self, node: ASTNode) -> str:
        """Gera e retorna a representação de uma expressão como string."""
        method_name = "_expr_" + node.__class__.__name__.lower()
        method = getattr(self, method_name, None)
        if method is None:
            raise CodeGenError(f"Expressão não implementada para: {node.__class__.__name__}")
        return method(node)

    # ─────────────────────────────────────────
    #  Programa
    # ─────────────────────────────────────────

    def _emit_program(self, node: Program) -> None:
        # separar funções do restante para emiti-las primeiro
        functions = [n for n in node.body if isinstance(n, FunctionDeclaration)]
        rest      = [n for n in node.body if not isinstance(n, FunctionDeclaration)]

        for func in functions:
            self._emit_node(func)
            self._write_blank()

        # ponto de entrada protegido
        if rest:
            self._write('if __name__ == "__main__":')
            self._indent_in()
            for stmt in rest:
                self._emit_node(stmt)
            self._indent_out()

    # ─────────────────────────────────────────
    #  Funções
    # ─────────────────────────────────────────

    def _emit_functiondeclaration(self, node: FunctionDeclaration) -> None:
        params = ", ".join(name for name, _ in node.params)
        self._write(f"def {node.name}({params}):")
        self._indent_in()
        if node.body:
            for stmt in node.body:
                self._emit_node(stmt)
        else:
            self._write("pass")
        self._indent_out()

    # ─────────────────────────────────────────
    #  Declaração de variável
    # ─────────────────────────────────────────

    def _emit_vardeclaration(self, node: VarDeclaration) -> None:
        if node.initializer:
            value = self._expr(node.initializer)
            self._write(f"{node.name} = {value}")
        else:
            # valor padrão por tipo
            defaults = {"int": "0", "float": "0.0", "string": '""', "bool": "False"}
            default  = defaults.get(node.var_type, "None")
            self._write(f"{node.name} = {default}")

    # ─────────────────────────────────────────
    #  Atribuição
    # ─────────────────────────────────────────

    def _emit_assign(self, node: Assign) -> None:
        self._write(f"{node.name} = {self._expr(node.value)}")

    # ─────────────────────────────────────────
    #  Estruturas de controle
    # ─────────────────────────────────────────

    def _emit_ifstatement(self, node: IfStatement) -> None:
        self._write(f"if {self._expr(node.condition)}:")
        self._indent_in()
        if node.then_branch:
            for stmt in node.then_branch:
                self._emit_node(stmt)
        else:
            self._write("pass")
        self._indent_out()

        if node.else_branch:
            # else if → elif
            if (len(node.else_branch) == 1 and
                    isinstance(node.else_branch[0], IfStatement)):
                inner = node.else_branch[0]
                self._write(f"elif {self._expr(inner.condition)}:")
                self._indent_in()
                for stmt in inner.then_branch:
                    self._emit_node(stmt)
                self._indent_out()
                # recursão para o else do elif
                if inner.else_branch:
                    fake = IfStatement(
                        condition=inner.condition,
                        then_branch=[],
                        else_branch=inner.else_branch,
                    )
                    self._emit_else_tail(fake)
            else:
                self._emit_else_tail(node)

    def _emit_else_tail(self, node: IfStatement) -> None:
        """Emite o bloco else de um IfStatement."""
        self._write("else:")
        self._indent_in()
        if node.else_branch:
            for stmt in node.else_branch:
                self._emit_node(stmt)
        else:
            self._write("pass")
        self._indent_out()

    def _emit_whilestatement(self, node: WhileStatement) -> None:
        self._write(f"while {self._expr(node.condition)}:")
        self._indent_in()
        if node.body:
            for stmt in node.body:
                self._emit_node(stmt)
        else:
            self._write("pass")
        self._indent_out()

    def _emit_forstatement(self, node: ForStatement) -> None:
        # Emite como while com inicializador e incremento
        # for (var i: int = 0; i < 10; i = i + 1) → while equivalente
        if node.initializer:
            self._emit_node(node.initializer)

        condition = self._expr(node.condition) if node.condition else "True"
        self._write(f"while {condition}:")
        self._indent_in()

        if node.body:
            for stmt in node.body:
                self._emit_node(stmt)
        else:
            self._write("pass")

        if node.increment:
            self._emit_node(node.increment)

        self._indent_out()

    def _emit_switchstatement(self, node: SwitchStatement) -> None:
        """
        Converte switch/case para cadeia de if/elif/else em Python.
        Python 3.10+ tem match/case, mas usamos if/elif para compatibilidade.
        """
        expr    = self._expr(node.expression)
        first   = True
        default_case: CaseClause | None = None

        for case in node.cases:
            if case.is_default:
                default_case = case
                continue

            keyword = "if" if first else "elif"
            first   = False
            self._write(f"{keyword} {expr} == {self._expr(case.value)}:")
            self._indent_in()
            body_stmts = [s for s in case.body if not isinstance(s, BreakStatement)]
            if body_stmts:
                for stmt in body_stmts:
                    self._emit_node(stmt)
            else:
                self._write("pass")
            self._indent_out()

        if default_case:
            self._write("else:")
            self._indent_in()
            body_stmts = [s for s in default_case.body if not isinstance(s, BreakStatement)]
            if body_stmts:
                for stmt in body_stmts:
                    self._emit_node(stmt)
            else:
                self._write("pass")
            self._indent_out()

    # ─────────────────────────────────────────
    #  Comandos
    # ─────────────────────────────────────────

    def _emit_returnstatement(self, node: ReturnStatement) -> None:
        if node.value:
            self._write(f"return {self._expr(node.value)}")
        else:
            self._write("return")

    def _emit_breakstatement(self, node: BreakStatement) -> None:
        self._write("break")

    def _emit_printstatement(self, node: PrintStatement) -> None:
        self._write(f"print({self._expr(node.value)})")

    def _emit_functioncall(self, node: FunctionCall) -> None:
        """FunctionCall usado como statement (ex: minhaFunc();)"""
        self._write(self._expr_functioncall(node))

    # ─────────────────────────────────────────
    #  Expressões → string
    # ─────────────────────────────────────────

    def _expr_intliteral(self, node: IntLiteral) -> str:
        return str(node.value)

    def _expr_floatliteral(self, node: FloatLiteral) -> str:
        return str(node.value)

    def _expr_stringliteral(self, node: StringLiteral) -> str:
        # escapa aspas internas
        escaped = node.value.replace("\\", "\\\\").replace('"', '\\"')
        return f'"{escaped}"'

    def _expr_boolliteral(self, node: BoolLiteral) -> str:
        return "True" if node.value else "False"

    def _expr_identifier(self, node: Identifier) -> str:
        return node.name

    def _expr_assign(self, node: Assign) -> str:
        # atribuição como expressão (dentro de for, por exemplo)
        return f"{node.name} = {self._expr(node.value)}"

    def _expr_binaryop(self, node: BinaryOp) -> str:
        left  = self._expr_with_parens(node.left,  node.operator)
        right = self._expr_with_parens(node.right, node.operator)
        op    = self.OP_MAP.get(node.operator, node.operator)
        return f"{left} {op} {right}"

    def _expr_with_parens(self, node: ASTNode, parent_op: str) -> str:
        """Adiciona parênteses quando necessário para preservar precedência."""
        expr = self._expr(node)
        if isinstance(node, BinaryOp):
            if self._needs_parens(node.operator, parent_op):
                return f"({expr})"
        return expr

    def _needs_parens(self, child_op: str, parent_op: str) -> bool:
        """Retorna True se o operador filho precisa de parênteses."""
        precedence = {
            "or":  1, "and": 2,
            "==":  3, "!=": 3, ">": 3, "<": 3, ">=": 3, "<=": 3,
            "+":   4, "-":  4,
            "*":   5, "/":  5,
        }
        return precedence.get(child_op, 99) < precedence.get(parent_op, 99)

    def _expr_unaryop(self, node: UnaryOp) -> str:
        operand = self._expr(node.operand)
        if node.operator == "not":
            return f"not {operand}"
        if node.operator == "-":
            return f"-{operand}"
        return operand

    def _expr_functioncall(self, node: FunctionCall) -> str:
        args = ", ".join(self._expr(arg) for arg in node.args)
        return f"{node.name}({args})"

    def _expr_inputstatement(self, node: InputStatement) -> str:
        prompt = self._expr(node.prompt)
        return f"input({prompt})"