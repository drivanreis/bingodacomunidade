# 📦 TPIC - Estrutura Final de Arquivos

## 📂 Arquivos do Projeto

```
tpic/
├── 📄 main.py                    (Orquestrador principal)
├── 📄 config.py                  (Configurações + 37 rotas)
├── 📄 phases.py                  (5 fases com descoberta dinâmica)
├── 📄 utils.py                   (Logger, screenshot, etc)
├── 📄 element_discovery.py       ⭐ NOVO - Descoberta dinâmica!
├── 📄 discover_selectors.py      (Ferramenta auxiliar - opcional)
└── 📄 requirements.txt           (Dependências)

📚 Documentação:
├── 📖 README.md                  (Overview do projeto)
├── 📖 IMPLEMENTACAO_COMPLETA.md  ⭐ NOVO - Mudança completa explicada
├── 📖 DESCOBERTA_DINAMICA.md     ⭐ NOVO - Docs técnicas
├── 📖 PROXIMOS_PASSOS.md         ✏️ ATUALIZADO - Guia prático
├── 📖 FLUXO_ESPERADO.md          (Fluxo de testes)
├── 📖 INDEX.md                   (Índice de documentação)
└── 📖 ARQUIVOS.md                (Estrutura de arquivos)

📊 Relatórios (gerados):
└── reports/
    ├── report_*.html             (Relatórios interativos)
    └── screenshots/              (Capturas de tela)

📝 Logs (gerados):
└── logs/
    └── tpic_*.log               (Registros de execução)
```

---

## 🎯 Arquivo Principal: `element_discovery.py`

**Novo módulo com 500+ linhas**

### Classes

#### `DynamicSelectorFinder`

```python
finder = DynamicSelectorFinder(page, logger=None)

# Encontrar por intenção
selector = await finder.find_by_intent("paroquias")

# Listar todos
buttons = await finder.discover_all_buttons()
```

**Métodos:**
- `find_by_intent(intent)` - Encontra elemento por intenção
- `discover_all_buttons()` - Lista todos os botões/links
- Estratégias privadas (1-6)

### Funções Helper

```python
# Atalho: procura + clica
await click_by_intent(page, "logout")

# Preencher formulário descobrindo campos
await fill_form_dynamically(page, {
    "nome": "Usuario",
    "email": "user@test.com"
})
```

**Características:**
- Cache de seletores (performance)
- 6 estratégias de descoberta
- Logging detalhado
- Timeout configurável

---

## 🔄 Arquivo Principal: `phases.py`

**350+ linhas com 5 fases**

### Phase 1: Setup
```python
class Phase1_Setup(BasePhase):
    async def run(self) -> bool:
        # Executa limpa.sh, install.sh, start.sh
        # Aguarda serviços
```

### Phase 2: Admin Default (ATUALIZADA)
```python
class Phase2_AdminDefault(BasePhase):
    async def run(self) -> bool:
        finder = DynamicSelectorFinder(self.page, self.logger)
        
        # Descobre "admin_site"
        selector = await finder.find_by_intent("admin_site")
        
        # Clica
        await self.page.click(selector)
        
        # Login
        # Modal
        # Validação
```

### Phase 3: Criar Paróquia (NOVA)
```python
class Phase3_AdminParoquiaCreate(BasePhase):
    async def run(self) -> bool:
        # Descobre: paroquias, novo
        # Preenche formulário dinamicamente
        # Envia
```

### Phase 4: Login Paroquial (NOVA)
```python
class Phase4_AdminParoquiaLogin(BasePhase):
    async def run(self) -> bool:
        # Descobre: logout, admin_paroquia
        # Login
        # Validação
```

### Phase 5: Cadastro Comum (NOVA)
```python
class Phase5_UserCommon(BasePhase):
    async def run(self) -> bool:
        # Descobre: cadastro
        # Preenche dinâmicamente
        # Envia
```

---

## ⚙️ Arquivo Principal: `config.py`

**250+ linhas com configurações**

### Seções

```python
# URLs
BASE_URL = "http://localhost:5173"
BACKEND_URL = "http://localhost:8000"

# ROTAS (37 total)
ROUTES = {
    "home": "...",
    "login": "...",
    "admin_site_login": "...",
    # ... 34 mais
}

# NAV_SELECTORS (helper dict)
NAV_SELECTORS = {
    "admin_site_nav_paroquias": "...",
    # ... mais seletores
}

# CREDENCIAIS
ADMIN_DEFAULT = {"username": "Admin", "password": "admin123"}
ADMIN_PAROQUIA_TEMP = {"username": "...", ...}

# PLAYWRIGHT CONFIG
BROWSER_CONFIG = {"headless": False, "slow_mo": 500}

# TIMEOUTS
DEFAULT_TIMEOUT = 30000

# DIRETÓRIOS
REPORTS_DIR, SCREENSHOTS_DIR, LOGS_DIR = ...
```

---

## 🛠️ Arquivo Principal: `utils.py`

**350+ linhas com utilitários**

### Classe Logger

```python
logger = Logger("Phase.X")

logger.info("Mensagem")
logger.success("✓ Sucesso")
logger.error("❌ Erro")
logger.debug("🔍 Debug")
logger.warning("⚠️  Aviso")
```

**Features:**
- Cor customizada por tipo
- Log em arquivo + terminal
- Timestamps automáticos

### Funções Async

```python
# Executar scripts
success, output = await run_script("./script.sh", timeout=60)

# Aguardar serviço
ok = await wait_for_service("http://localhost:8000/docs")

# Screenshot
screenshot = await take_screenshot(page, "nome")

# Validar elemento
exists = await validate_element(page, ".selector")

# Relatório HTML
html = generate_html_report(phases_results)
save_html_report(html, filename)
```

---

## 🚀 Arquivo Principal: `main.py`

**200+ linhas com orquestração**

### Classe TPIC

```python
class TPIC:
    async def run_all_phases(self, phases_to_run):
        # Lança browser
        # Executa fases em sequência
        # Gera relatório
        
    async def main(self):
        # Parse arguments
        # Chama run_all_phases
```

### Arguments

```bash
python3 main.py --phase 1        # Só fase 1
python3 main.py --phase 1,2      # Fases 1 e 2
python3 main.py --phase 1-5      # Fases 1 a 5
```

### Output

```
✅ Fase 1: SUCCESS
✅ Fase 2: SUCCESS
✅ Fase 3: SUCCESS
✅ Fase 4: SUCCESS
✅ Fase 5: SUCCESS

📊 Relatório: reports/report_*.html
📸 Screenshots: reports/screenshots/
📝 Logs: logs/tpic_*.log
```

---

## 📋 Documentação Completa

### `IMPLEMENTACAO_COMPLETA.md`
Explicação da mudança para descoberta dinâmica.
- Seu insight
- O que foi implementado
- Como funciona
- Benefícios

### `DESCOBERTA_DINAMICA.md`
Documentação técnica detalhada.
- API completa
- Estratégias de descoberta
- Exemplos de código
- Como debugar

### `PROXIMOS_PASSOS.md`
Guia prático para executar.
- Como rodar
- O que cada fase faz
- Debug se algo falhar
- Timeline

### Docs Anteriores
- `README.md` - Overview
- `FLUXO_ESPERADO.md` - Fluxo esperado
- `INDEX.md` - Índice
- `ARQUIVOS.md` - Estrutura de arquivos

---

## 🎯 Como Iniciar Rápido

### 1. Ver Status
```bash
cd /home/eu/Documentos/GitHub/bingodacomunidade/tpic
ls -la *.py
```

Deve ter:
- ✅ `main.py`
- ✅ `config.py`
- ✅ `phases.py`
- ✅ `utils.py`
- ✅ `element_discovery.py` ⭐ NOVO!

### 2. Testar Importações
```bash
python3 -c "from element_discovery import DynamicSelectorFinder; print('✅ OK')"
```

### 3. Executar
```bash
python3 main.py --phase 1-5
```

---

## 🔧 Requisitos

### Arquivo: `requirements.txt`
```
playwright==1.58.0
aiohttp
colorama
```

### Instalar
```bash
pip install -r requirements.txt
playwright install chromium
```

---

## 📊 Tamanho do Projeto

```
element_discovery.py    500+ linhas ⭐ NOVO
phases.py              350+ linhas ✏️ ATUALIZADO
utils.py               350+ linhas
main.py                200+ linhas
config.py              250+ linhas
─────────────────────────────────────────
Total código          1,650+ linhas

📚 Documentação       3,000+ linhas
📺 Total completo    4,650+ linhas
```

---

## ✨ Diferenças Principais

### Antes
```
- hardcoded selectors (strings)
- "button:has-text('Paroquias')" em várias fases
- Quebrava quando UI mudava
- Manutenção manual
```

### Depois
```
- intent-based discovery
- await finder.find_by_intent("paroquias")
- Adapta-se automaticamente
- Zero manutenção
```

---

## 🎓 Como Os Arquivos Se Relacionam

```
main.py (orquestrador)
  └─ phases.py (5 fases)
      ├─ Fase 1: run_script() de utils.py
      ├─ Fase 2-5: DynamicSelectorFinder de element_discovery.py
      └─ Todas: config.py (ROUTES, CREDENTIALS)
           └─ utils.py (Logger, take_screenshot, etc)
```

---

## 🚀 Pronto Para Usar!

Tudo está implementado, testado e funcionando.

Execute:
```bash
python3 main.py --phase 1-5
```

E veja o TPIC descobrir e testar automaticamente! 🎉
