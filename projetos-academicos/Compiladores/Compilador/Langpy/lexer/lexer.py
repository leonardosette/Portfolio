from lexer.tokens import Token, TokenType, KEYWORDS, SYMBOLS


# ─────────────────────────────────────────────
#  Exceção Léxica
# ─────────────────────────────────────────────

class LexerError(Exception):
    """Lançada quando o lexer encontra um caractere ou sequência inválida."""

    def __init__(self, message: str, line: int, column: int):
        super().__init__(f"[LexerError] Linha {line}, Coluna {column}: {message}")
        self.line   = line
        self.column = column


# ─────────────────────────────────────────────
#  Lexer
# ─────────────────────────────────────────────

class Lexer:
    """
    Analisador léxico da linguagem LangPy.

    Recebe o código fonte como string e produz uma lista de Tokens
    através do método `tokenize()`.

    Uso:
        lexer  = Lexer(source_code)
        tokens = lexer.tokenize()
    """

    def __init__(self, source: str):
        self.source  = source        # código fonte completo
        self.pos     = 0             # posição atual no source
        self.line    = 1             # linha atual (1-indexado)
        self.column  = 1             # coluna atual (1-indexado)
        self.tokens: list[Token] = []

    # ─────────────────────────────────────────
    #  API pública
    # ─────────────────────────────────────────

    def tokenize(self) -> list[Token]:
        """Percorre todo o source e retorna a lista de tokens."""
        while not self._is_at_end():
            self._skip_whitespace_and_comments()
            if self._is_at_end():
                break
            token = self._next_token()
            if token is not None:
                self.tokens.append(token)

        self.tokens.append(self._make_token(TokenType.EOF, ""))
        return self.tokens

    # ─────────────────────────────────────────
    #  Navegação no source
    # ─────────────────────────────────────────

    def _is_at_end(self) -> bool:
        return self.pos >= len(self.source)

    def _peek(self, offset: int = 0) -> str:
        """Retorna o caractere em pos+offset sem avançar."""
        idx = self.pos + offset
        return self.source[idx] if idx < len(self.source) else "\0"

    def _advance(self) -> str:
        """Consome e retorna o caractere atual, atualizando linha/coluna."""
        char = self.source[self.pos]
        self.pos    += 1
        if char == "\n":
            self.line  += 1
            self.column = 1
        else:
            self.column += 1
        return char

    def _match(self, expected: str) -> bool:
        """Consome o próximo caractere apenas se for igual a `expected`."""
        if self._is_at_end() or self._peek() != expected:
            return False
        self._advance()
        return True

    # ─────────────────────────────────────────
    #  Helpers
    # ─────────────────────────────────────────

    def _make_token(self, type: TokenType, value: str,
                    line: int | None = None,
                    column: int | None = None) -> Token:
        return Token(type, value, line or self.line, column or self.column)

    def _skip_whitespace_and_comments(self):
        """Ignora espaços, tabs, quebras de linha e comentários de linha (//)."""
        while not self._is_at_end():
            ch = self._peek()

            # espaços em branco
            if ch in (" ", "\t", "\r", "\n"):
                self._advance()

            # comentário de linha: // até o fim da linha
            elif ch == "/" and self._peek(1) == "/":
                while not self._is_at_end() and self._peek() != "\n":
                    self._advance()

            else:
                break

    # ─────────────────────────────────────────
    #  Reconhecimento de tokens
    # ─────────────────────────────────────────

    def _next_token(self) -> Token | None:
        """Identifica e retorna o próximo token a partir da posição atual."""
        start_line   = self.line
        start_column = self.column
        ch           = self._peek()

        # ── String literal ───────────────────
        if ch == '"':
            return self._read_string(start_line, start_column)

        # ── Número (int ou float) ─────────────
        if ch.isdigit():
            return self._read_number(start_line, start_column)

        # ── Identificador ou palavra-chave ────
        if ch.isalpha() or ch == "_":
            return self._read_identifier(start_line, start_column)

        # ── Símbolos (tenta match de 2 chars primeiro) ──
        two_char = self._peek(0) + self._peek(1)
        if two_char in SYMBOLS:
            self._advance()
            self._advance()
            return Token(SYMBOLS[two_char], two_char, start_line, start_column)

        one_char = ch
        if one_char in SYMBOLS:
            self._advance()
            return Token(SYMBOLS[one_char], one_char, start_line, start_column)

        # ── Caractere desconhecido ────────────
        self._advance()
        raise LexerError(f"Caractere inesperado: {ch!r}", start_line, start_column)

    # ─────────────────────────────────────────
    #  Leitura de literais
    # ─────────────────────────────────────────

    def _read_string(self, line: int, column: int) -> Token:
        """Lê uma string delimitada por aspas duplas com suporte a \\n e \\t."""
        self._advance()  # consome a aspa de abertura "
        chars = []

        while not self._is_at_end() and self._peek() != '"':
            ch = self._advance()
            if ch == "\\":                  # escape
                esc = self._advance()
                escape_map = {"n": "\n", "t": "\t", "\\": "\\", '"': '"'}
                if esc in escape_map:
                    chars.append(escape_map[esc])
                else:
                    raise LexerError(f"Sequência de escape inválida: \\{esc}", self.line, self.column)
            else:
                chars.append(ch)

        if self._is_at_end():
            raise LexerError("String não fechada (falta '\"')", line, column)

        self._advance()  # consome a aspa de fechamento "
        return Token(TokenType.STRING, "".join(chars), line, column)

    def _read_number(self, line: int, column: int) -> Token:
        """Lê um inteiro ou float (ex: 42, 3.14)."""
        start = self.pos
        while not self._is_at_end() and self._peek().isdigit():
            self._advance()

        is_float = self._peek() == "." and self._peek(1).isdigit()
        if is_float:
            self._advance()  # consome o ponto
            while not self._is_at_end() and self._peek().isdigit():
                self._advance()

        lexeme = self.source[start:self.pos]
        token_type = TokenType.FLOAT if is_float else TokenType.INTEGER
        return Token(token_type, lexeme, line, column)

    def _read_identifier(self, line: int, column: int) -> Token:
        """Lê um identificador ou palavra-chave."""
        start = self.pos
        while not self._is_at_end() and (self._peek().isalnum() or self._peek() == "_"):
            self._advance()

        lexeme      = self.source[start:self.pos]
        token_type  = KEYWORDS.get(lexeme, TokenType.IDENTIFIER)
        return Token(token_type, lexeme, line, column)