# 🤖 TPIC - Sistema de Descoberta Dinâmica

## ✨ Mudança Fundamental

Você estava absolutamente certo! O TPIC **NÃO DEVERIA** descobrir seletores uma única vez manualmente.

Em vez disso, **AUTOMATICAMENTE encontra seletores toda vez que executa**, porque:

- ✅ Site está em desenvolvimento
- ✅ Botões podem desaparecer, ser renomeados, criados
- ✅ Novas rotas aparecem constantemente
- ✅ Precisa se adaptar sem reescrever código

---

## 🎯 Como Funciona Agora

### Arquitetura: Intent-Based Navigation

```
┌────────────────────────────────────────┐
│  Phase executa                         │
└─────────────────┬──────────────────────┘
                  │
┌─────────────────▼──────────────────────┐
│  DynamicSelectorFinder.find_by_intent  │
│  ("paroquias")                         │
└─────────────────┬──────────────────────┘
                  │
         ┌────────┴────────┐
         │  Procura com:   │
         │  1. Texto exato │
         │  2. Parcial     │
         │  3. aria-label  │
         │  4. Classe CSS  │
         │  5. href        │
         └────────┬────────┘
                  │
      ┌───────────▼──────────────┐
      │  Retorna seletor que     │
      │  funciona (ou None)      │
      └───────────┬──────────────┘
                  │
       ┌──────────▼──────────┐
       │ page.click(selector)│
       │ ("como usuário      │
       │  real faz")         │
       └─────────────────────┘
```

### Exemplo de Código

**Antes (Hardcoded):**
```python
# ❌ Brittle - quebra quando botão muda
admin_site_selectors = [
    "button:has-text('Admin do Site')",
    "a:has-text('Admin do Site')",
    "button:has-text('Admin Site')",
]

for selector in admin_site_selectors:
    if await validate_element(self.page, selector):
        await self.page.click(selector)
        break
```

**Depois (Dinâmico):**
```python
# ✅ Robusto - adapta-se automaticamente
finder = DynamicSelectorFinder(self.page, self.logger)
selector = await finder.find_by_intent("admin_site")

if selector:
    await self.page.click(selector)
```

---

## 🔍 Estratégias de Descoberta (Ordem de Prioridade)

O `DynamicSelectorFinder` tenta encontrar o elemento em várias formas:

### 1. **Texto Exato** (Mais preciso)
```python
# Procura por: "paroquias", "Paroquias", "PAROQUIAS", etc.
selector = "button:has-text('Paroquias')"
```

### 2. **Texto Parcial** (Mais flexível)
```python
# Se botão diz "Gerenciar Paroquias", procura por qualquer elemento com "paroquias"
if "paroquias" in button_text.lower():
    return selector
```

### 3. **Aria-Label** (Acessibilidade)
```python
# Procura em atributos ARIA
selector = "button[aria-label*='paroquias']"
```

### 4. **Title Attribute** (Tooltip)
```python
# Procura em tooltips
selector = "button[title*='paroquias']"
```

### 5. **Padrões de Classe** (CSS Classes)
```python
patterns = {
    "logout": ["logout-button", "logout-btn", "sign-out"],
    "novo": ["btn-new", "new-button", "btn-create"],
    "voltar": ["btn-back", "back-button"],
}
```

### 6. **Padrões de Href** (Links)
```python
# Se é um link, procura por padrão de URL
if href and "paroquias" in href:
    return selector
```

---

## 🎉 Conclusão

Agora o TPIC é **verdadeiramente inteligente**:

> "Você tem que se passar por mim"

- ✅ Clica em botões (não URLs)
- ✅ Descobre intents, não seletores
- ✅ Adapta-se ao site em desenvolvimento
- ✅ Sem manutenção manual
- ✅ Logs detalhados de descoberta

**Pronto para executar! 🚀**
