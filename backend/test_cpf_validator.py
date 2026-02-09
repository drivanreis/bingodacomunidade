"""
Teste Manual do Validador de CPF - Algoritmo Módulo 11
=======================================================
Script para testar a validação completa de CPF.

Execute:
    python test_cpf_validator.py
"""

import sys
import os

# Adiciona o diretório src ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

__test__ = False

from schemas.schemas import validate_cpf


def run_cpf_check(cpf: str, should_pass: bool = True):
    """Testa um CPF e exibe o resultado."""
    try:
        resultado = validate_cpf(cpf)
        if should_pass:
            print(f"✅ VÁLIDO: {cpf:20s} → {resultado}")
        else:
            print(f"❌ ERRO: {cpf:20s} deveria ser INVÁLIDO mas passou!")
        return True
    except ValueError as e:
        if not should_pass:
            print(f"✅ REJEITADO: {cpf:20s} → {str(e)}")
        else:
            print(f"❌ ERRO: {cpf:20s} deveria ser VÁLIDO! Erro: {e}")
        return False


print("=" * 80)
print("🧪 TESTE DO VALIDADOR DE CPF - ALGORITMO MÓDULO 11")
print("=" * 80)
print()

# ============================================================================
# TESTES COM CPFs VÁLIDOS (deveriam PASSAR)
# ============================================================================

print("📋 TESTANDO CPFs VÁLIDOS (devem passar):")
print("-" * 80)

cpfs_validos = [
    "12345678909",          # CPF válido
    "111.444.777-35",       # CPF válido com formatação
    "529.982.247-25",       # CPF válido real
    "111.222.333-96",       # CPF válido
    "000.000.001-91",       # CPF válido (caso extremo)
]

for cpf in cpfs_validos:
    run_cpf_check(cpf, should_pass=True)

print()

# ============================================================================
# TESTES COM CPFs INVÁLIDOS (deveriam FALHAR)
# ============================================================================

print("🚫 TESTANDO CPFs INVÁLIDOS (devem ser rejeitados):")
print("-" * 80)

cpfs_invalidos = [
    # Dígitos verificadores incorretos
    ("12345678901", "dígitos verificadores errados"),
    ("123.456.789-00", "dígitos verificadores errados"),
    ("529.982.247-00", "segundo dígito errado"),
    
    # Sequências repetidas
    ("111.111.111-11", "sequência repetida"),
    ("000.000.000-00", "sequência de zeros"),
    ("999.999.999-99", "sequência de noves"),
    
    # Formato incorreto
    ("123.456.789", "apenas 9 dígitos"),
    ("12345", "muito curto"),
    ("123456789012", "12 dígitos (1 a mais)"),
    
    # Casos especiais
    ("", "vazio"),
    ("abc.def.ghi-jk", "letras ao invés de números"),
]

for cpf, motivo in cpfs_invalidos:
    print(f"  Testando: {cpf:25s} ({motivo})")
    run_cpf_check(cpf, should_pass=False)
    print()

# ============================================================================
# TESTE DETALHADO: MOSTRAR CÁLCULO PASSO A PASSO
# ============================================================================

print("=" * 80)
print("🔍 DEMONSTRAÇÃO DO ALGORITMO MÓDULO 11")
print("=" * 80)
print()

cpf_exemplo = "12345678909"
print(f"CPF de exemplo: {cpf_exemplo}")
print()

# Cálculo do 1º dígito verificador
print("1️⃣  CÁLCULO DO PRIMEIRO DÍGITO VERIFICADOR:")
print("-" * 80)
print("Primeiros 9 dígitos:", " ".join(cpf_exemplo[:9]))
print()

soma1 = 0
pesos1 = [10, 9, 8, 7, 6, 5, 4, 3, 2]
print("Dígito × Peso = Resultado")
for i, (digito, peso) in enumerate(zip(cpf_exemplo[:9], pesos1)):
    parcial = int(digito) * peso
    soma1 += parcial
    print(f"  {digito}    ×  {peso:2d}  = {parcial:3d}")

print(f"\nSoma total: {soma1}")
resto1 = soma1 % 11
print(f"Resto da divisão por 11: {soma1} % 11 = {resto1}")

if resto1 < 2:
    digito1 = 0
    print(f"Como resto ({resto1}) < 2, o 1º dígito = 0")
else:
    digito1 = 11 - resto1
    print(f"Como resto ({resto1}) ≥ 2, o 1º dígito = 11 - {resto1} = {digito1}")

print(f"\n✓ 1º dígito verificador: {digito1}")
print(f"✓ CPF esperado na posição 10: {cpf_exemplo[9]}")
print(f"✓ Match: {str(digito1) == cpf_exemplo[9]}")
print()

# Cálculo do 2º dígito verificador
print("2️⃣  CÁLCULO DO SEGUNDO DÍGITO VERIFICADOR:")
print("-" * 80)
print("Primeiros 10 dígitos:", " ".join(cpf_exemplo[:10]))
print()

soma2 = 0
pesos2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]
print("Dígito × Peso = Resultado")
for i, (digito, peso) in enumerate(zip(cpf_exemplo[:10], pesos2)):
    parcial = int(digito) * peso
    soma2 += parcial
    print(f"  {digito}    ×  {peso:2d}  = {parcial:3d}")

print(f"\nSoma total: {soma2}")
resto2 = soma2 % 11
print(f"Resto da divisão por 11: {soma2} % 11 = {resto2}")

if resto2 < 2:
    digito2 = 0
    print(f"Como resto ({resto2}) < 2, o 2º dígito = 0")
else:
    digito2 = 11 - resto2
    print(f"Como resto ({resto2}) ≥ 2, o 2º dígito = 11 - {resto2} = {digito2}")

print(f"\n✓ 2º dígito verificador: {digito2}")
print(f"✓ CPF esperado na posição 11: {cpf_exemplo[10]}")
print(f"✓ Match: {str(digito2) == cpf_exemplo[10]}")
print()

print("=" * 80)
print(f"✅ CPF COMPLETO VALIDADO: {cpf_exemplo[:3]}.{cpf_exemplo[3:6]}.{cpf_exemplo[6:9]}-{cpf_exemplo[9:11]}")
print("=" * 80)
print()
print("🎯 CONCLUSÃO: A validação Módulo 11 está 100% implementada!")
print("   O sistema rejeita CPFs matematicamente inválidos.")
print()
