"""
parser.py — Analisador Sintático da linguagem LangPy.

Recebe a lista de tokens gerada pelo Lexer e constrói a AST.
Utiliza a técnica de Recursive Descent Parsing (Parser Descendente Recursivo).

Gramática resumida da LangPy:
    program         → declaration* EOF
    declaration     → func_decl | var_decl | statement
    func_decl       → "func" IDENTIFIER "(" params? ")" ":" type block
    var_decl        → "var" IDENTIFIER ":" type ("=" expression)? ";"
    statement       → if_stmt | while_stmt | for_stmt | switch_stmt
                    | return_stmt | break_stmt | print_stmt | expr_stmt
    block           → "{" declaration* "}"
    expression      → assignment
    assignment      → IDENTIFIER "=" expression | logic_or
    logic_or        → logic_and ("or" logic_and)*
    logic_and       → equality ("and" equality)*
    equality        → comparison (("==" | "!=") comparison)*
    comparison      → term ((">" | "<" | ">=" | "<=") term)*
    term            → factor (("+" | "-") factor)*
    factor          → unary (("*" | "/") unary)*
    unary           → ("not" | "-") unary | primary
    primary         → INTEGER | FLOAT | STRING | BOOL | IDENTIFIER
                    | func_call | "(" expression ")" | input_expr
"""

from lexer.tokens import Token, TokenType
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
#  Exceção Sintática
# ─────────────────────────────────────────────

class ParseError(Exception):
    """Lançada quando o parser encontra uma construção inválida."""

    def __init__(self, message: str, token: Token):
        super().__init__(
            f"[ParseError] Linha {token.line}, Coluna {token.column}: {message} "
            f"(encontrado: {token.type.name} '{token.value}')"
        )
        self.token = token


# ─────────────────────────────────────────────
#  Parser
# ─────────────────────────────────────────────

class Parser:
    """
    Parser Descendente Recursivo para a linguagem LangPy.

    Uso:
        parser = Parser(tokens)
        ast    = parser.parse()
    """

    def __init__(self, tokens: list[Token]):
        self.tokens  = tokens
        self.pos     = 0

    # ─────────────────────────────────────────
    #  API pública
    # ─────────────────────────────────────────

    def parse(self) -> Program:
        """Ponto de entrada — retorna o nó raiz Program."""
        body = []
        while not self._is_at_end():
            body.append(self._declaration())
        return Program(body=body)

    # ─────────────────────────────────────────
    #  Navegação nos tokens
    # ─────────────────────────────────────────

    def _is_at_end(self) -> bool:
        return self._peek().type == TokenType.EOF

    def _peek(self, offset: int = 0) -> Token:
        idx = self.pos + offset
        if idx >= len(self.tokens):
            return self.tokens[-1]  # retorna EOF
        return self.tokens[idx]

    def _advance(self) -> Token:
        token = self.tokens[self.pos]
        if not self._is_at_end():
            self.pos += 1
        return token

    def _check(self, *types: TokenType) -> bool:
        return self._peek().type in types

    def _match(self, *types: TokenType) -> bool:
        """Consome o token atual se ele for de um dos tipos fornecidos."""
        if self._check(*types):
            self._advance()
            return True
        return False

    def _expect(self, type: TokenType, message: str) -> Token:
        """Consome e retorna o token esperado, ou lança ParseError."""
        if self._check(type):
            return self._advance()
        raise ParseError(message, self._peek())

    def _previous(self) -> Token:
        return self.tokens[self.pos - 1]

    # ─────────────────────────────────────────
    #  Declarações
    # ─────────────────────────────────────────

    def _declaration(self) -> ASTNode:
        if self._check(TokenType.FUNC):
            return self._func_declaration()
        if self._check(TokenType.VAR):
            return self._var_declaration()
        return self._statement()

    def _func_declaration(self) -> FunctionDeclaration:
        """func nome(params): tipo { corpo }"""
        self._expect(TokenType.FUNC, "Esperado 'func'")
        name_token = self._expect(TokenType.IDENTIFIER, "Esperado nome da função")
        line       = name_token.line

        self._expect(TokenType.LPAREN, "Esperado '(' após nome da função")
        params = self._parse_params()
        self._expect(TokenType.RPAREN, "Esperado ')' após parâmetros")
        self._expect(TokenType.COLON, "Esperado ':' após ')'")
        return_type = self._parse_type()
        body        = self._block()

        return FunctionDeclaration(
            name=name_token.value,
            params=params,
            return_type=return_type,
            body=body,
            line=line,
        )

    def _parse_params(self) -> list[tuple[str, str]]:
        """Lê a lista de parâmetros: nome: tipo, nome: tipo, ..."""
        params = []
        if self._check(TokenType.RPAREN):
            return params

        while True:
            name = self._expect(TokenType.IDENTIFIER, "Esperado nome do parâmetro").value
            self._expect(TokenType.COLON, "Esperado ':' após nome do parâmetro")
            ptype = self._parse_type()
            params.append((name, ptype))
            if not self._match(TokenType.COMMA):
                break

        return params

    def _parse_type(self) -> str:
        """Lê um tipo: int | float | string | bool | void."""
        type_tokens = {
            TokenType.TYPE_INT:    "int",
            TokenType.TYPE_FLOAT:  "float",
            TokenType.TYPE_STRING: "string",
            TokenType.TYPE_BOOL:   "bool",
        }
        for token_type, type_name in type_tokens.items():
            if self._match(token_type):
                return type_name

        # aceita identificador "void" como tipo de retorno
        if self._check(TokenType.IDENTIFIER) and self._peek().value == "void":
            self._advance()
            return "void"

        raise ParseError("Esperado um tipo (int, float, string, bool)", self._peek())

    def _var_declaration(self) -> VarDeclaration:
        """var nome: tipo = valor;"""
        self._expect(TokenType.VAR, "Esperado 'var'")
        name_token  = self._expect(TokenType.IDENTIFIER, "Esperado nome da variável")
        self._expect(TokenType.COLON, "Esperado ':' após nome da variável")
        var_type    = self._parse_type()

        initializer = None
        if self._match(TokenType.EQUAL):
            initializer = self._expression()

        self._expect(TokenType.SEMICOLON, "Esperado ';' após declaração de variável")
        return VarDeclaration(
            name=name_token.value,
            var_type=var_type,
            initializer=initializer,
            line=name_token.line,
        )

    # ─────────────────────────────────────────
    #  Statements
    # ─────────────────────────────────────────

    def _statement(self) -> ASTNode:
        if self._check(TokenType.IF):
            return self._if_statement()
        if self._check(TokenType.WHILE):
            return self._while_statement()
        if self._check(TokenType.FOR):
            return self._for_statement()
        if self._check(TokenType.SWITCH):
            return self._switch_statement()
        if self._check(TokenType.RETURN):
            return self._return_statement()
        if self._check(TokenType.BREAK):
            return self._break_statement()
        if self._check(TokenType.PRINT):
            return self._print_statement()
        return self._expression_statement()

    def _block(self) -> list[ASTNode]:
        """{ declarações* }"""
        self._expect(TokenType.LBRACE, "Esperado '{'")
        stmts = []
        while not self._check(TokenType.RBRACE) and not self._is_at_end():
            stmts.append(self._declaration())
        self._expect(TokenType.RBRACE, "Esperado '}' para fechar bloco")
        return stmts

    def _if_statement(self) -> IfStatement:
        """if (cond) { ... } else { ... }"""
        self._expect(TokenType.IF, "Esperado 'if'")
        self._expect(TokenType.LPAREN, "Esperado '(' após 'if'")
        condition = self._expression()
        self._expect(TokenType.RPAREN, "Esperado ')' após condição")
        then_branch = self._block()

        else_branch = []
        if self._match(TokenType.ELSE):
            # suporta: else if { ... } ou else { ... }
            if self._check(TokenType.IF):
                else_branch = [self._if_statement()]
            else:
                else_branch = self._block()

        return IfStatement(condition=condition, then_branch=then_branch, else_branch=else_branch)

    def _while_statement(self) -> WhileStatement:
        """while (cond) { ... }"""
        self._expect(TokenType.WHILE, "Esperado 'while'")
        self._expect(TokenType.LPAREN, "Esperado '(' após 'while'")
        condition = self._expression()
        self._expect(TokenType.RPAREN, "Esperado ')' após condição")
        body = self._block()
        return WhileStatement(condition=condition, body=body)

    def _for_statement(self) -> ForStatement:
        """for (var i: int = 0; i < 10; i = i + 1) { ... }"""
        self._expect(TokenType.FOR, "Esperado 'for'")
        self._expect(TokenType.LPAREN, "Esperado '(' após 'for'")

        # inicializador
        initializer = None
        if self._check(TokenType.VAR):
            initializer = self._var_declaration()          # já consome o ;
        elif not self._check(TokenType.SEMICOLON):
            initializer = self._expression_statement()    # consome o ;
        else:
            self._advance()  # consome ;

        # condição
        condition = None
        if not self._check(TokenType.SEMICOLON):
            condition = self._expression()
        self._expect(TokenType.SEMICOLON, "Esperado ';' após condição do for")

        # incremento
        increment = None
        if not self._check(TokenType.RPAREN):
            increment = self._expression()

        self._expect(TokenType.RPAREN, "Esperado ')' após incremento do for")
        body = self._block()

        return ForStatement(initializer=initializer, condition=condition, increment=increment, body=body)

    def _switch_statement(self) -> SwitchStatement:
        """switch (expr) { case x: ... break; default: ... break; }"""
        self._expect(TokenType.SWITCH, "Esperado 'switch'")
        self._expect(TokenType.LPAREN, "Esperado '(' após 'switch'")
        expression = self._expression()
        self._expect(TokenType.RPAREN, "Esperado ')' após expressão do switch")
        self._expect(TokenType.LBRACE, "Esperado '{' após switch")

        cases = []
        while not self._check(TokenType.RBRACE) and not self._is_at_end():
            if self._match(TokenType.CASE):
                value = self._expression()
                self._expect(TokenType.COLON, "Esperado ':' após valor do case")
                body = self._case_body()
                cases.append(CaseClause(value=value, body=body, is_default=False))
            elif self._match(TokenType.DEFAULT):
                self._expect(TokenType.COLON, "Esperado ':' após 'default'")
                body = self._case_body()
                cases.append(CaseClause(value=None, body=body, is_default=True))
            else:
                raise ParseError("Esperado 'case' ou 'default' dentro do switch", self._peek())

        self._expect(TokenType.RBRACE, "Esperado '}' para fechar switch")
        return SwitchStatement(expression=expression, cases=cases)

    def _case_body(self) -> list[ASTNode]:
        """Lê statements até encontrar outro case, default ou }."""
        stmts = []
        while (not self._check(TokenType.CASE) and
               not self._check(TokenType.DEFAULT) and
               not self._check(TokenType.RBRACE) and
               not self._is_at_end()):
            stmts.append(self._statement())
        return stmts

    def _return_statement(self) -> ReturnStatement:
        """return expr?;"""
        token = self._expect(TokenType.RETURN, "Esperado 'return'")
        value = None
        if not self._check(TokenType.SEMICOLON):
            value = self._expression()
        self._expect(TokenType.SEMICOLON, "Esperado ';' após return")
        return ReturnStatement(value=value, line=token.line)

    def _break_statement(self) -> BreakStatement:
        """break;"""
        token = self._expect(TokenType.BREAK, "Esperado 'break'")
        self._expect(TokenType.SEMICOLON, "Esperado ';' após break")
        return BreakStatement(line=token.line)

    def _print_statement(self) -> PrintStatement:
        """print(expr);"""
        token = self._expect(TokenType.PRINT, "Esperado 'print'")
        self._expect(TokenType.LPAREN, "Esperado '(' após 'print'")
        value = self._expression()
        self._expect(TokenType.RPAREN, "Esperado ')' após expressão do print")
        self._expect(TokenType.SEMICOLON, "Esperado ';' após print")
        return PrintStatement(value=value, line=token.line)

    def _expression_statement(self) -> ASTNode:
        """Expressão usada como statement (ex: atribuição). Consome o ;"""
        expr = self._expression()
        self._expect(TokenType.SEMICOLON, "Esperado ';' após expressão")
        return expr

    # ─────────────────────────────────────────
    #  Expressões (ordem de precedência)
    # ─────────────────────────────────────────

    def _expression(self) -> ASTNode:
        return self._assignment()

    def _assignment(self) -> ASTNode:
        """IDENTIFIER = expr  |  logic_or"""
        # lookahead: verifica se é uma atribuição (id seguido de =)
        if (self._check(TokenType.IDENTIFIER) and
                self._peek(1).type == TokenType.EQUAL):
            name_token = self._advance()   # consome IDENTIFIER
            self._advance()                # consome =
            value = self._expression()
            return Assign(name=name_token.value, value=value, line=name_token.line)

        return self._logic_or()

    def _logic_or(self) -> ASTNode:
        """logic_and ("or" logic_and)*"""
        left = self._logic_and()
        while self._match(TokenType.OR):
            right = self._logic_and()
            left  = BinaryOp(left=left, operator="or", right=right)
        return left

    def _logic_and(self) -> ASTNode:
        """equality ("and" equality)*"""
        left = self._equality()
        while self._match(TokenType.AND):
            right = self._equality()
            left  = BinaryOp(left=left, operator="and", right=right)
        return left

    def _equality(self) -> ASTNode:
        """comparison (("==" | "!=") comparison)*"""
        left = self._comparison()
        while self._check(TokenType.EQUAL_EQUAL, TokenType.NOT_EQUAL):
            op    = self._advance().value
            right = self._comparison()
            left  = BinaryOp(left=left, operator=op, right=right)
        return left

    def _comparison(self) -> ASTNode:
        """term ((">" | "<" | ">=" | "<=") term)*"""
        left = self._term()
        while self._check(TokenType.GREATER, TokenType.LESS,
                          TokenType.GREATER_EQ, TokenType.LESS_EQ):
            op    = self._advance().value
            right = self._term()
            left  = BinaryOp(left=left, operator=op, right=right)
        return left

    def _term(self) -> ASTNode:
        """factor (("+" | "-") factor)*"""
        left = self._factor()
        while self._check(TokenType.PLUS, TokenType.MINUS):
            op    = self._advance().value
            right = self._factor()
            left  = BinaryOp(left=left, operator=op, right=right)
        return left

    def _factor(self) -> ASTNode:
        """unary (("*" | "/") unary)*"""
        left = self._unary()
        while self._check(TokenType.STAR, TokenType.SLASH):
            op    = self._advance().value
            right = self._unary()
            left  = BinaryOp(left=left, operator=op, right=right)
        return left

    def _unary(self) -> ASTNode:
        """("not" | "-") unary  |  primary"""
        if self._match(TokenType.NOT):
            operand = self._unary()
            return UnaryOp(operator="not", operand=operand)
        if self._match(TokenType.MINUS):
            operand = self._unary()
            return UnaryOp(operator="-", operand=operand)
        return self._primary()

    def _primary(self) -> ASTNode:
        """Literais, identificadores, chamadas de função, input e agrupamentos."""

        # ── Literais numéricos ────────────────
        if self._check(TokenType.INTEGER):
            token = self._advance()
            return IntLiteral(value=int(token.value))

        if self._check(TokenType.FLOAT):
            token = self._advance()
            return FloatLiteral(value=float(token.value))

        # ── String ───────────────────────────
        if self._check(TokenType.STRING):
            token = self._advance()
            return StringLiteral(value=token.value)

        # ── Bool ─────────────────────────────
        if self._check(TokenType.BOOL):
            token = self._advance()
            return BoolLiteral(value=(token.value == "true"))

        # ── input(prompt) ─────────────────────
        if self._check(TokenType.INPUT):
            token = self._advance()
            self._expect(TokenType.LPAREN, "Esperado '(' após 'input'")
            prompt = self._expression()
            self._expect(TokenType.RPAREN, "Esperado ')' após prompt do input")
            return InputStatement(prompt=prompt, line=token.line)

        # ── Identificador ou chamada de função ─
        if self._check(TokenType.IDENTIFIER):
            token = self._advance()

            # chamada de função: nome(args)
            if self._match(TokenType.LPAREN):
                args = self._parse_args()
                self._expect(TokenType.RPAREN, "Esperado ')' após argumentos")
                return FunctionCall(name=token.value, args=args, line=token.line)

            # simples referência a variável
            return Identifier(name=token.value, line=token.line, column=token.column)

        # ── Agrupamento: (expr) ───────────────
        if self._match(TokenType.LPAREN):
            expr = self._expression()
            self._expect(TokenType.RPAREN, "Esperado ')' para fechar agrupamento")
            return expr

        raise ParseError("Expressão inválida ou inesperada", self._peek())

    def _parse_args(self) -> list[ASTNode]:
        """Lê lista de argumentos de uma chamada de função."""
        args = []
        if self._check(TokenType.RPAREN):
            return args
        while True:
            args.append(self._expression())
            if not self._match(TokenType.COMMA):
                break
        return args