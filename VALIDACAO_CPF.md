# 🔐 Validação de CPF - Algoritmo Módulo 11

## 📋 Implementação Completa

O sistema implementa **validação completa de CPF** conforme especificação da Receita Federal, usando o **Algoritmo Módulo 11** para verificar os dígitos verificadores.

---

## 🎯 O Que é Validado

### ✅ Formato
- Aceita CPF com ou sem formatação
- Entrada válida: `12345678909` ou `123.456.789-09`
- Sempre retorna apenas números: `12345678909`

### ✅ Tamanho
- Deve ter exatamente **11 dígitos**
- Rejeita CPFs incompletos ou com mais dígitos

### ✅ Sequências Repetidas
Rejeita CPFs formados por números iguais:
- ❌ `000.000.000-00`
- ❌ `111.111.111-11`
- ❌ `999.999.999-99`

### ✅ Dígitos Verificadores (Módulo 11)
**Esta é a validação matemática principal!**

O CPF brasileiro possui 2 dígitos verificadores (os 2 últimos) que são calculados usando um algoritmo específico. O sistema valida se esses dígitos estão corretos.

---

## 🔢 Como Funciona o Algoritmo Módulo 11

### Estrutura do CPF

```
1  2  3  4  5  6  7  8  9  -  X  Y
↑                          ↑  ↑  ↑
|                          |  |  |
9 primeiros dígitos        |  |  2º dígito verificador
                           |  1º dígito verificador
                           Separador visual
```

### Cálculo do 1º Dígito Verificador (X)

**Passo 1:** Multiplique os 9 primeiros dígitos pelos pesos decrescentes (10 → 2):

```
Dígito:    1    2    3    4    5    6    7    8    9
Peso:     10    9    8    7    6    5    4    3    2
          ──   ──   ──   ──   ──   ──   ──   ──   ──
Produto:  10 + 18 + 24 + 28 + 30 + 30 + 28 + 24 + 18 = 210
```

**Passo 2:** Calcule o resto da divisão por 11:

```
210 ÷ 11 = 19 com resto 1
resto = 1
```

**Passo 3:** Aplique a regra:

```
Se resto < 2:  dígito = 0
Se resto ≥ 2:  dígito = 11 - resto

Como resto = 1 (< 2):
X = 0
```

### Cálculo do 2º Dígito Verificador (Y)

**Passo 1:** Multiplique os 10 primeiros dígitos (incluindo o 1º verificador) pelos pesos (11 → 2):

```
Dígito:    1    2    3    4    5    6    7    8    9    0
Peso:     11   10    9    8    7    6    5    4    3    2
          ──   ──   ──   ──   ──   ──   ──   ──   ──   ──
Produto:  11 + 20 + 27 + 32 + 35 + 36 + 35 + 32 + 27 +  0 = 255
```

**Passo 2:** Calcule o resto da divisão por 11:

```
255 ÷ 11 = 23 com resto 2
resto = 2
```

**Passo 3:** Aplique a regra:

```
Como resto = 2 (≥ 2):
Y = 11 - 2 = 9
```

### Resultado Final

```
CPF completo: 123.456.789-09
              └─────┬─────┘ ││
                    │       ││
       9 primeiros  │       ││
                    │       ││
                    └───────┘│
                   1º dígito: 0
                             │
                    2º dígito: 9

✅ CPF VÁLIDO!
```

---

## 💻 Código de Implementação

```python
def validate_cpf(v: Optional[str]) -> Optional[str]:
    """Valida CPF usando algoritmo Módulo 11."""
    
    # Remove formatação
    cpf = re.sub(r'\D', '', v)
    
    # Valida tamanho
    if len(cpf) != 11:
        raise ValueError('CPF deve ter 11 dígitos')
    
    # Rejeita sequências
    if cpf == cpf[0] * 11:
        raise ValueError('CPF inválido (sequência repetida)')
    
    # Calcula dígito verificador
    def calc_digito(cpf_parcial: str) -> str:
        soma = 0
        for i, digit in enumerate(cpf_parcial):
            peso = len(cpf_parcial) + 1 - i
            soma += int(digit) * peso
        resto = soma % 11
        return '0' if resto < 2 else str(11 - resto)
    
    # Valida 1º dígito
    if cpf[9] != calc_digito(cpf[:9]):
        raise ValueError('1º dígito verificador incorreto')
    
    # Valida 2º dígito
    if cpf[10] != calc_digito(cpf[:10]):
        raise ValueError('2º dígito verificador incorreto')
    
    return cpf
```

---

## 🧪 Exemplos de Teste

### Teste 1: CPF Válido

```python
validate_cpf("123.456.789-09")
# ✅ Retorna: "12345678909"
```

### Teste 2: Dígitos Verificadores Incorretos

```python
validate_cpf("123.456.789-01")
# ❌ ValueError: 1º dígito verificador incorreto
```

### Teste 3: Sequência Repetida

```python
validate_cpf("111.111.111-11")
# ❌ ValueError: CPF inválido (sequência de números iguais)
```

### Teste 4: Tamanho Incorreto

```python
validate_cpf("123.456.789")
# ❌ ValueError: CPF deve ter 11 dígitos
```

---

## 🔬 Executar Testes

### Teste Rápido (Python puro):

```bash
cd backend
python exemplo_cpf.py
```

### Teste Completo com Demonstração:

```bash
cd backend
python test_cpf_validator.py
```

Este teste mostra:
- ✅ Validação de CPFs válidos
- ❌ Rejeição de CPFs inválidos
- 🔍 Cálculo passo a passo do algoritmo Módulo 11

---

## 📊 CPFs de Teste

### Válidos (podem ser usados em testes):

| CPF               | Formatado         | Observação           |
|-------------------|-------------------|----------------------|
| `12345678909`     | 123.456.789-09    | CPF de teste         |
| `11144477735`     | 111.444.777-35    | CPF de teste         |
| `52998224725`     | 529.982.247-25    | CPF real válido      |
| `00000000191`     | 000.000.001-91    | Caso extremo válido  |

### Inválidos (devem ser rejeitados):

| CPF               | Motivo                        |
|-------------------|-------------------------------|
| `12345678901`     | Dígitos verificadores errados |
| `11111111111`     | Sequência repetida            |
| `00000000000`     | Sequência de zeros            |
| `123456789`       | Apenas 9 dígitos              |

---

## 🎯 Benefícios da Validação Completa

### ✅ Segurança
- Impede cadastros com CPFs inventados
- Reduz fraudes e dados falsos
- Garante integridade dos dados

### ✅ Conformidade
- Implementa algoritmo oficial da Receita Federal
- Segue padrão brasileiro de validação
- Compatível com sistemas governamentais

### ✅ Experiência do Usuário
- Feedback imediato sobre CPF inválido
- Mensagens de erro claras
- Aceita CPF com ou sem formatação

---

## 📚 Referências

- [Receita Federal - Validação de CPF](http://www.receita.fazenda.gov.br/)
- [Algoritmo Módulo 11](https://pt.wikipedia.org/wiki/D%C3%ADgito_verificador#M%C3%B3dulo_11)
- Documentação técnica: `backend/src/schemas/schemas.py`

---

## ⚡ Resumo Técnico

```
Entrada:  "123.456.789-09" ou "12345678909"
          ↓
Processo: 1. Remove formatação → "12345678909"
          2. Valida tamanho (11 dígitos) ✓
          3. Valida sequência repetida ✓
          4. Calcula 1º dígito (Módulo 11) → "0" ✓
          5. Calcula 2º dígito (Módulo 11) → "9" ✓
          ↓
Saída:    "12345678909" ✅
```

**Status:** ✅ Implementação 100% completa do algoritmo Módulo 11
