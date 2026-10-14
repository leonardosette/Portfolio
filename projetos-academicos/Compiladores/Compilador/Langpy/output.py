def fatorial(n):
    if n <= 1:
        return 1
    return n * fatorial(n - 1)

def saudacao(nome):
    return "Olá, " + nome

if __name__ == "__main__":
    num = 5
    resultado = fatorial(num)
    print("Fatorial de 5:")
    print(resultado)
    nome = "LangPy"
    print(saudacao(nome))
    i = 1
    while i <= 3:
        print(i)
        i = i + 1
    j = 0
    while j < 3:
        print(j)
        j = j + 1
    opcao = 2
    if opcao == 1:
        print("um")
    elif opcao == 2:
        print("dois")
    else:
        print("outro")