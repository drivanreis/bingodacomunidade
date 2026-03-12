# 🚀 Como Usar Google Gemini (GRÁTIS) ao invés de Claude

**Status**: API gratuita + análise visual integrada  
**Custo**: ZERO! 🎉  
**Limite**: 60 requisições por minuto (suficiente para testes)

---

## ✅ Passo 1: Obter Chave Gratuita do Gemini

### 1️⃣ Acesse: https://ai.google.dev/

### 2️⃣ Clique em **"Get API Key"**

### 3️⃣ Selecione seu projeto (ou crie um novo)

### 4️⃣ Copie a chave gerada

---

## 🔧 Passo 2: Atualizar Arquivo .env

Edite seu `.env`:

```env
# Claude (se quiser usar ainda)
# ANTHROPIC_API_KEY=sk-ant-xxxxx

# Google Gemini (NOVO)
GOOGLE_GEMINI_API_KEY=AIz...sua_chave_aqui
```

---

## 📦 Passo 3: Instalar Dependência

```bash
pip install google-generativeai
```

Ou instale todas:
```bash
pip install -r requirements.txt
```

---

## 🧪 Passo 4: Testar Gemini

```bash
python3 test_gemini.py
```

Deve aparecer:
```
✅ Chave Gemini carregada com sucesso!
✅ Google Gemini API está FUNCIONANDO PERFEITAMENTE!
```

---

## 🔄 Passo 5: Adaptar o Código (2 opções)

### Opção A: Usar Gemini (Recomendado - GRÁTIS) ⭐

Edite `browser.py`:

**Antes:**
```python
from claude_vision import ClaudeVisionAnalyzer, VisionTestFlow

class PlaywrightBrowser:
    def __init__(self, headless: bool = False):
        self.headless = headless
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.vision_analyzer = ClaudeVisionAnalyzer()  # ← MUDAR
        self.test_flow = VisionTestFlow()
```

**Depois:**
```python
from gemini_vision import GeminiVisionAnalyzer  # ← NOVO

class PlaywrightBrowser:
    def __init__(self, headless: bool = False):
        self.headless = headless
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.vision_analyzer = GeminiVisionAnalyzer()  # ← MUDADO
        # Note: VisionTestFlow não precisa mudar, é compatível!
```

**É só isso!** ✨ O resto funciona igual porque ambas têm a mesma interface.

---

### Opção B: Usar Claude (Pago)

Se você adicionar créditos no Claude:

Deixe como está (usa `claude_vision.py` automaticamente).

---

## 🚀 Passo 6: Rodar os Testes com Gemini

```bash
bash run_tpic.sh
```

Escolha opção **1** para TPIC completo.

---

## 📊 Comparação: Gemini vs Claude

| Aspecto | Gemini | Claude |
|---------|--------|--------|
| **Custo** | 🎉 GRÁTIS | 💰 Pago |
| **Visualização** | ✅ Excelente | ✅ Excelente |
| **Velocidade** | ⚡ Muito rápida | ⚡ Rápida |
| **JSON Output** | ✅ Funciona bem | ✅ Funciona bem |
| **Limite Gratuito** | 60 req/min | Nenhum (sem crédito) |
| **Qualidade Análise** | 9/10 | 10/10 |

**Conclusão**: Gemini é perfeito para testes! 👍

---

## 🔧 Modelos Disponíveis no Gemini

```python
# Mais rápido (recomendado para testes)
model = genai.GenerativeModel('gemini-2.0-flash-exp')

# Mais preciso (mais lento)
model = genai.GenerativeModel('gemini-1.5-pro')

# Bom balanço
model = genai.GenerativeModel('gemini-1.5-flash')
```

**Padrão em `gemini_vision.py`**: `gemini-2.0-flash-exp` (mais rápido)

---

## 💡 Troubleshooting

### Erro: "API Key não encontrada"

```bash
# Verificar .env
cat .env | grep GOOGLE_GEMINI

# Se não aparecer, adicione:
echo "GOOGLE_GEMINI_API_KEY=AIz...sua_chave" >> .env
```

### Erro: "Rate limit"

```
Aguarde 1-2 minutos e tente novamente.
Limite: 60 requisições por minuto (vs 9 testes = OK)
```

### Erro: "Invalid model"

```python
# Em gemini_vision.py, linha ~21:
model = genai.GenerativeModel('gemini-1.5-flash')  # Tente este ao invés
```

### Imagem não sendo analisada

Certifique-se que:
- Screenshot foi criado (`screenshots/` existe)
- Arquivo PNG é válido
- Caminho está correto

---

## 🚀 Resumo Rápido

```bash
# 1. Obter chave em https://ai.google.dev/
# 2. Adicionar ao .env
echo "GOOGLE_GEMINI_API_KEY=AIz..." >> .env

# 3. Instalar
pip install google-generativeai

# 4. Testar
python3 test_gemini.py

# 5. Editar browser.py (mudar import)
# from claude_vision import... → from gemini_vision import...

# 6. Rodar
bash run_tpic.sh
```

---

## 📚 Documentação

- **Google AI Studio**: https://aistudio.google.com/
- **Gemini API Docs**: https://ai.google.dev/docs
- **Pricing**: https://ai.google.dev/pricing (grátis!)

---

## ✨ Próximo Passo

Quando estiver pronto:

```bash
bash run_tpic.sh
```

Escolha opção `1` e veja a magia acontecer! 🎉

---

**Versão**: 1.0  
**Data**: 11 de março de 2026  
**Status**: ✅ Pronto para usar
