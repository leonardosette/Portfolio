"""
main.py — Ponto de entrada do compilador LangPy.
"""

from compiler import Compiler

# ─── Código de exemplo na linguagem LangPy ───────────────────

code = """
func fatorial(n: int): int {
    if (n <= 1) {
        return 1;
    }
    return n * fatorial(n - 1);
}

func saudacao(nome: string): string {
    return "Olá, " + nome;
}

// Programa principal
var num: int = 5;
var resultado: int = fatorial(num);
print("Fatorial de 5:");
print(resultado);

var nome: string = "LangPy";
print(saudacao(nome));

// Teste de while
var i: int = 1;
while (i <= 3) {
    print(i);
    i = i + 1;
}

// Teste de for
for (var j: int = 0; j < 3; j = j + 1) {
    print(j);
}

// Teste de switch
var opcao: int = 2;
switch (opcao) {
    case 1: print("um"); break;
    case 2: print("dois"); break;
    default: print("outro"); break;
}
"""

# ─── Compilação ──────────────────────────────────────────────

compiler = Compiler(verbose=True)

try:
    python_code = compiler.compile(code)

    # salva o código gerado
    with open("output.py", "w", encoding="utf-8") as f:
        f.write(python_code)
    print("✔ Código salvo em output.py")
    print()
    print("=== EXECUTANDO output.py ===")
    exec(compile(python_code, "<langpy>", "exec"))

except Exception as e:
    print(f"\n✗ Erro: {e}")