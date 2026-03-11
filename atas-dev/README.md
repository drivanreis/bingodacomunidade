# 📋 ATAS DE DESENVOLVIMENTO

Sistema de documentação de reuniões/sessões de desenvolvimento do projeto.

## O Que É

Assim como as atas de reunião corporativas, aqui criamos um registro de:
- Problemas identificados
- Decisões tomadas
- Código produzido
- Documentação criada
- Próximos passos

Para manter contexto histórico e facilitar onboarding de novos devs.

## Estrutura

```
atas-dev/
├── 00-TEMPLATE-PROMPT.txt      ← ESTE ARQUIVO (como usar)
├── 2026-03-10.txt              ← Ata do dia 10 de março
├── 2026-03-11.txt              ← Ata do dia 11 de março
└── README.md                   ← Este arquivo
```

## Como Usar

### 1. No Final de Cada Dia/Reunião

```bash
# Copie o prompt de 00-TEMPLATE-PROMPT.txt
# Personalize a data e contexto
# Execute com qualquer IA (Copilot, Claude, ChatGPT, etc)
# Copie a resposta para novo arquivo
```

### 2. Nomeação de Arquivos

**Formato:** `YYYY-MM-DD.txt`

**Exemplos:**
- `2026-03-10.txt` - Reunião de 10 de março de 2026
- `2026-03-11.txt` - Reunião de 11 de março de 2026

### 3. Estrutura da Ata

```
================================================================================
ATA DE DESENVOLVIMENTO - DATA
================================================================================

DATA: DD de mês de YYYY
LOCAL/CONTEXTO: [Descrição]
PARTICIPANTE: [Dev + IA]

================================================================================
ASSUNTO PRINCIPAL
================================================================================

[Descrição do objetivo principal da reunião]

================================================================================
PROBLEMA IDENTIFICADO
================================================================================

[Quais problemas foram encontrados?]
[Como foram identificados?]
[Qual era o impacto?]

... (mais seções)
```

Veja `2026-03-10.txt` para exemplo completo.

## Benefícios

✅ **Histórico**: Saber exatamente o que foi feito em cada dia
✅ **Contexto**: Entender decisões tomadas e por quê
✅ **Onboarding**: Novo dev pode entender evolução do projeto
✅ **Referência**: Quando algo quebra, saber quando/como foi implementado
✅ **Retrospectiva**: Analisar progresso e padrões

## Exemplo de Busca

```bash
# Ver todas as atas
ls -la

# Ver ata específica
cat 2026-03-10.txt

# Procurar por palavra-chave em todas as atas
grep -r "DynamicSelector" .

# Contar linhas de código por dia
grep "linhas" *.txt
```

## Checklist Diário

Antes de terminar o dia, pergunte-se:

- [ ] Quais problemas foram identificados?
- [ ] Quais decisões foram tomadas?
- [ ] Quantas linhas de código foram escritas?
- [ ] Quais arquivos foram criados/modificados?
- [ ] Documentação foi criada?
- [ ] Tudo foi testado?
- [ ] Há próximos passos claros?

Se respondeu SIM para a maioria, você tem conteúdo para a ata!

## Integração com Git

Recomendado fazer commit das atas:

```bash
git add atas-dev/2026-03-10.txt
git commit -m "docs: ata de desenvolvimento 2026-03-10"
git push
```

## Dicas de Redação

### ✅ SIM:
- Seja específico (não "fez código", mas "criou element_discovery.py com DynamicSelectorFinder")
- Inclua números (500 linhas, 37 rotas, 6 estratégias)
- Documente problemas E soluções
- Destaque insights críticos
- Use bullet points para listas

### ❌ NÃO:
- Atas genéricas ou vagas
- Omitir problemas encontrados
- Esquecer próximos passos
- Deixar atas incompletas

## Exemplo de Referência

**Arquivo:** `2026-03-10.txt`

Contém ata real de:
- Identificação de 3 flaws do TPIC
- Decisão de arquitetura (intent-based discovery)
- 500+ linhas de novo codigo
- 1,200+ linhas de documentação
- Validação de imports
- Próximos passos

Use como referência!

## Prompt para Usar

**Arquivo:** `00-TEMPLATE-PROMPT.txt`

Contém o prompt completo pronto para:
1. Copiar
2. Personalizar data
3. Executar com IA
4. Salvar resultado

## Histórico do Projeto

Com este sistema, você consegue:

```
2026-03-10 ← Implementação do TPIC com descoberta dinâmica
2026-03-11 ← Testes contra aplicação rodando
2026-03-12 ← Bug fixes e otimizações
...
```

Sempre sabendo exatamente o que foi feito cada dia!

## FAQ

**P: É obrigatório criar ata todo dia?**
R: Não, mas recomendado. Crie ao final de cada sessão/reunião significativa.

**P: E se esquecer de criar ata?**
R: Crie retroativamente! Melhor tarde do que nunca.

**P: Posso editar ata depois?**
R: Sim, mas documente a edição (adicione nota no final).

**P: Como compartilhar com time?**
R: Através do Git. Pull, vê as atas, e sempre atualizado.

---

**Comece hoje! Crie a primeira ata usando o template em `00-TEMPLATE-PROMPT.txt`** 🚀
