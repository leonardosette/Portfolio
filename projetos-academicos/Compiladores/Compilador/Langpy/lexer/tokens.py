from enum import Enum, auto


# ─────────────────────────────────────────────
#  Tipos de Token
# ─────────────────────────────────────────────

class TokenType(Enum):

    # ── Literais ──────────────────────────────
    INTEGER     = auto()   # 42
    FLOAT       = auto()   # 3.14
    STRING      = auto()   # "hello"
    BOOL        = auto()   # true | false

    # ── Identificador ─────────────────────────
    IDENTIFIER  = auto()   # nome de variável ou função

    # ── Palavras-chave ────────────────────────
    VAR         = auto()   # var
    FUNC        = auto()   # func
    RETURN      = auto()   # return
    IF          = auto()   # if
    ELSE        = auto()   # else
    WHILE       = auto()   # while
    FOR         = auto()   # for
    SWITCH      = auto()   # switch
    CASE        = auto()   # case
    DEFAULT     = auto()   # default
    BREAK       = auto()   # break
    PRINT       = auto()   # print
    INPUT       = auto()   # input

    # ── Tipos de dados ────────────────────────
    TYPE_INT    = auto()   # int
    TYPE_FLOAT  = auto()   # float
    TYPE_STRING = auto()   # string
    TYPE_BOOL   = auto()   # bool

    # ── Operadores aritméticos ────────────────
    PLUS        = auto()   # +
    MINUS       = auto()   # -
    STAR        = auto()   # *
    SLASH       = auto()   # /

    # ── Operadores de comparação ──────────────
    EQUAL_EQUAL = auto()   # ==
    NOT_EQUAL   = auto()   # !=
    GREATER     = auto()   # >
    LESS        = auto()   # <
    GREATER_EQ  = auto()   # >=
    LESS_EQ     = auto()   # <=

    # ── Operadores lógicos ────────────────────
    AND         = auto()   # and
    OR          = auto()   # or
    NOT         = auto()   # not

    # ── Atribuição ────────────────────────────
    EQUAL       = auto()   # =

    # ── Pontuação / Delimitadores ─────────────
    LPAREN      = auto()   # (
    RPAREN      = auto()   # )
    LBRACE      = auto()   # {
    RBRACE      = auto()   # }
    LBRACKET    = auto()   # [
    RBRACKET    = auto()   # ]
    SEMICOLON   = auto()   # ;
    COLON       = auto()   # :
    COMMA       = auto()   # ,

    # ── Controle ──────────────────────────────
    EOF         = auto()   # fim do arquivo
    UNKNOWN     = auto()   # caractere não reconhecido


# ─────────────────────────────────────────────
#  Mapeamento: palavra-chave → TokenType
# ─────────────────────────────────────────────

KEYWORDS: dict[str, TokenType] = {
    "var":     TokenType.VAR,
    "func":    TokenType.FUNC,
    "return":  TokenType.RETURN,
    "if":      TokenType.IF,
    "else":    TokenType.ELSE,
    "while":   TokenType.WHILE,
    "for":     TokenType.FOR,
    "switch":  TokenType.SWITCH,
    "case":    TokenType.CASE,
    "default": TokenType.DEFAULT,
    "break":   TokenType.BREAK,
    "print":   TokenType.PRINT,
    "input":   TokenType.INPUT,
    "int":     TokenType.TYPE_INT,
    "float":   TokenType.TYPE_FLOAT,
    "string":  TokenType.TYPE_STRING,
    "bool":    TokenType.TYPE_BOOL,
    "true":    TokenType.BOOL,
    "false":   TokenType.BOOL,
    "and":     TokenType.AND,
    "or":      TokenType.OR,
    "not":     TokenType.NOT,
}


# ─────────────────────────────────────────────
#  Mapeamento: símbolo(s) → TokenType
#  (ordenado do maior para o menor para match guloso)
# ─────────────────────────────────────────────

SYMBOLS: dict[str, TokenType] = {
    "==": TokenType.EQUAL_EQUAL,
    "!=": TokenType.NOT_EQUAL,
    ">=": TokenType.GREATER_EQ,
    "<=": TokenType.LESS_EQ,
    "+":  TokenType.PLUS,
    "-":  TokenType.MINUS,
    "*":  TokenType.STAR,
    "/":  TokenType.SLASH,
    ">":  TokenType.GREATER,
    "<":  TokenType.LESS,
    "=":  TokenType.EQUAL,
    "(":  TokenType.LPAREN,
    ")":  TokenType.RPAREN,
    "{":  TokenType.LBRACE,
    "}":  TokenType.RBRACE,
    "[":  TokenType.LBRACKET,
    "]":  TokenType.RBRACKET,
    ";":  TokenType.SEMICOLON,
    ":":  TokenType.COLON,
    ",":  TokenType.COMMA,
}


# ─────────────────────────────────────────────
#  Classe Token
# ─────────────────────────────────────────────

class Token:
    """Representa uma unidade léxica (token) extraída do código fonte."""

    def __init__(self, type: TokenType, value: str, line: int, column: int):
        self.type   = type    # tipo do token (TokenType)
        self.value  = value   # lexema original (texto)
        self.line   = line    # linha no código fonte (1-indexado)
        self.column = column  # coluna no código fonte (1-indexado)

    def __repr__(self) -> str:
        return (
            f"Token({self.type.name}, "
            f"value={self.value!r}, "
            f"line={self.line}, "
            f"col={self.column})"
        )

    def is_type(self, *types: TokenType) -> bool:
        """Atalho para verificar se o token é de um dos tipos fornecidos."""
        return self.type in types
