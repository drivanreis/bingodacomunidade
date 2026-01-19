"""
Exemplo Rápido: Validador de CPF com Módulo 11
==============================================

Copie e cole este código no Python para testar o algoritmo.
"""

import re
from typing import Optional


def validate_cpf(v: Optional[str]) -> Optional[str]:
    """Valida CPF usando algoritmo Módulo 11 completo."""
    if v is None:
        return v
    
    # Remove formatação
    cpf = re.sub(r'\D', '', v)
    
    # Deve ter 11 dígitos
    if len(cpf) != 11:
        raise ValueError(f'CPF deve ter 11 dígitos (recebido: {len(cpf)})')
    
    # Rejeita sequências repetidas
    if cpf == cpf[0] * 11:
        raise ValueError(f'CPF inválido: {cpf[0]*3}.{cpf[0]*3}.{cpf[0]*3}-{cpf[0]*2}')
    
    # Calcula dígito verificador usando Módulo 11
    def calc_digito(cpf_parcial: str) -> str:
        soma = 0
        for i, digit in enumerate(cpf_parcial):
            peso = len(cpf_parcial) + 1 - i
            soma += int(digit) * peso
        resto = soma % 11
        return '0' if resto < 2 else str(11 - resto)
    
    # Valida 1º dígito
    if cpf[9] != calc_digito(cpf[:9]):
        raise ValueError(f'1º dígito verificador incorreto (esperado: {calc_digito(cpf[:9])}, recebido: {cpf[9]})')
    
    # Valida 2º dígito
    if cpf[10] != calc_digito(cpf[:10]):
        raise ValueError(f'2º dígito verificador incorreto (esperado: {calc_digito(cpf[:10])}, recebido: {cpf[10]})')
    
    return cpf


# ============================================================================
# TESTES
# ============================================================================

print("🧪 TESTANDO VALIDADOR DE CPF - ALGORITMO MÓDULO 11\n")

# CPFs VÁLIDOS
print("✅ CPFs VÁLIDOS:")
cpfs_validos = [
    "12345678909",
    "111.444.777-35",
    "529.982.247-25",
]

for cpf in cpfs_validos:
    try:
        resultado = validate_cpf(cpf)
        print(f"   ✓ {cpf:20s} → {resultado}")
    except ValueError as e:
        print(f"   ✗ {cpf:20s} → ERRO: {e}")

print("\n❌ CPFs INVÁLIDOS:")
cpfs_invalidos = [
    "12345678901",       # Dígitos errados
    "111.111.111-11",    # Sequência repetida
    "123.456.789",       # Apenas 9 dígitos
]

for cpf in cpfs_invalidos:
    try:
        resultado = validate_cpf(cpf)
        print(f"   ✗ {cpf:20s} → PASSOU (deveria falhar!)")
    except ValueError as e:
        print(f"   ✓ {cpf:20s} → REJEITADO: {e}")

print("\n" + "="*70)
print("🎯 VALIDAÇÃO MÓDULO 11 FUNCIONANDO CORRETAMENTE!")
print("="*70)
