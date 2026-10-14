"""
compiler.py — Orquestrador das fases do compilador LangPy.
"""

from lexer.lexer import Lexer
from parser.parser import Parser
from semantic.analyzer import SemanticAnalyzer
from codegen.generator import CodeGenerator


class Compiler:
    """
    Orquestra todas as fases do compilador LangPy.

    Uso:
        compiler = Compiler()
        output   = compiler.compile(source_code)
        print(output)
    """

    def __init__(self, verbose: bool = False):
        self.verbose = verbose   # se True, imprime informações de cada fase

    def compile(self, source: str) -> str:
        # ── Fase 1: Análise Léxica ──────────────────────
        lexer  = Lexer(source)
        tokens = lexer.tokenize()
        if self.verbose:
            print("=== TOKENS ===")
            for t in tokens:
                print(" ", t)
            print()

        # ── Fase 2: Análise Sintática ───────────────────
        parser = Parser(tokens)
        ast    = parser.parse()
        if self.verbose:
            print("=== AST ===")
            print(ast)
            print()

        # ── Fase 3: Análise Semântica ───────────────────
        analyzer = SemanticAnalyzer()
        analyzer.analyze(ast)
        if self.verbose:
            print("=== SEMÂNTICO: OK ===\n")

        # ── Fase 4: Geração de Código ───────────────────
        generator = CodeGenerator()
        output    = generator.generate(ast)
        if self.verbose:
            print("=== CÓDIGO GERADO ===")
            print(output)
            print()

        return output

    def compile_file(self, input_path: str, output_path: str | None = None) -> str:
        """
        Compila um arquivo .lpy e salva o resultado em um .py.
        Se output_path não for fornecido, usa o mesmo nome com extensão .py.
        """
        with open(input_path, "r", encoding="utf-8") as f:
            source = f.read()

        output = self.compile(source)

        if output_path is None:
            output_path = input_path.rsplit(".", 1)[0] + ".py"

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(output)

        print(f"✔ Compilado: {input_path} → {output_path}")
        return output