# TPIC - Teste Prático de Integração Contínua
## Com Playwright 1.58.0 + Claude Haiku 4.5 Vision

Um agente automatizado inteligente que testa sua aplicação Bingo usando:
- **Playwright**: Automação de navegador
- **Claude Haiku 4.5 API**: Análise visual inteligente de screenshots
- **Análise Híbrida**: Combina controle de navegador com decisões inteligentes baseadas em visão

---

## 🎯 Objetivo

Testar automaticamente os fluxos principais da aplicação:

1. **Admin Site** (Super Admin): Bootstrap do primeiro admin do site
2. **Admin Paróquia**: Bootstrap e gerenciamento de partidas
3. **Usuário Comum**: Cadastro, login e jogo

Cada teste usa Claude para:
- ✅ Analisar screenshots visualmente
- ✅ Detectar campos, botões e formulários
- ✅ Identificar erros e mensagens
- ✅ Decidir a próxima ação de forma inteligente
- ✅ Gerar relatórios detalhados com evidências visuais

---

## 📋 Pré-requisitos

### 1. Dependências Python
```bash
pip install -r requirements.txt
```

Inclui:
- `playwright==1.58.0` - Automação de navegador
- `anthropic==0.18.0` - SDK Claude API
- `python-dotenv==1.0.1` - Gerenciamento de variáveis de ambiente
- `colorama==0.4.6` - Cores no terminal
- `requests==2.31.0` - Requisições HTTP
- `pillow==10.1.0` - Processamento de imagens

### 2. Servidor Rodando
A aplicação deve estar rodando em `http://localhost:5173`:
```bash
# Na raiz do projeto
./start.sh
```

### 3. Claude API Key
Obtenha em: https://console.anthropic.com/api/keys

---

## 🚀 Quick Start

### 1. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar .env e adicionar sua chave Claude
# ANTHROPIC_API_KEY=sk-ant-xxx
```

### 2. Executar o TPIC Completo

```bash
# Executar todos os testes
python run_tpic.py

# OU com variáveis de ambiente na mesma linha
ANTHROPIC_API_KEY=sk-ant-xxx HEADLESS=false python run_tpic.py
```

### 3. Testes Individuais

```bash
# Apenas Admin Site
python test_admin_site.py

# Apenas Admin Paróquia
python test_admin_paroquia.py

# Apenas Usuário Comum
python test_usuario_comum.py
```

---

## 📁 Estrutura do Projeto

```
tpic/
├── run_tpic.py                 # 🎯 Orquestrador principal
├── config.py                   # 📝 Configurações globais
├── browser.py                  # 🌐 Automação Playwright
├── claude_vision.py            # 🤖 Análise visual Claude
├── utils.py                    # 🛠️ Funções auxiliares
│
├── test_admin_site.py          # 👤 Testes Admin Site
├── test_admin_paroquia.py      # 🏛️ Testes Admin Paróquia
├── test_usuario_comum.py       # 👥 Testes Usuário Comum
│
├── requirements.txt            # 📦 Dependências
├── .env.example                # 🔑 Template de configuração
│
├── screenshots/                # 📸 Screenshots dos testes
├── logs/                       # 📋 Logs detalhados
└── reports/                    # 📊 Relatórios HTML
```

---

## 🔧 Configuração Detalhada

### config.py

Define URLs, rotas, credenciais default e seletores:

```python
# URLs
BASE_URL = "http://localhost:5173"
ADMIN_SITE_URL = f"{BASE_URL}/admin-site"
ADMIN_PAROQUIA_URL = f"{BASE_URL}/admin-paroquia"

# Credenciais
ADMIN_SITE_USER = "Admin"
ADMIN_SITE_PASSWORD = "admin123"

# Claude
CLAUDE_MODEL = "claude-3-5-haiku-20241022"
```

### .env

Variáveis sensíveis (não commitadas):

```bash
ANTHROPIC_API_KEY=sk-ant-...
HEADLESS=false  # true para rodar sem janela
```

---

## 🤖 Como Funciona A Análise Claude

### Fluxo de Teste Inteligente

1. **Captura**: Playwright tira screenshot da página atual
2. **Análise**: Envia screenshot para Claude Haiku 4.5 API
3. **Decisão**: Claude analisa visualmente e decide próxima ação
4. **Execução**: Playwright executa a ação (click, fill, select, etc)
5. **Repetição**: Continua até completar ou encontrar erro

### Exemplo de Prompt Claude

```python
custom_instructions = """
Você está testando o processo de bootstrap do admin do site.

FLUXO ESPERADO:
1. Acessa /admin-site
2. Login com Admin/admin123
3. Confirma modal de mudança de senha
4. Preenche cadastro do 1º admin
5. Entra no painel

Analise a screenshot e retorne JSON com:
- page_loaded: true/false
- current_page: identificação da página
- errors: [lista de erros visíveis]
- next_recommended_action: qual ação fazer próximo
- issues_detected: problemas encontrados
"""
```

### Análise Inteligente

Claude detecta automaticamente:
- ✅ Campos de formulário (tipo, label, obrigatoriedade)
- ✅ Botões e elementos clicáveis
- ✅ Mensagens de erro e validação
- ✅ Modais, popups e diálogos
- ✅ Erros HTTP, exceções, comportamentos inesperados
- ✅ Problemas de usabilidade e UX

---

## 📊 Relatórios e Logs

### Estrutura de Saída

```
reports/
├── report_admin_site_bootstrap_20260311_120000.html
├── report_admin_paroquia_bootstrap_20260311_120500.html
└── tpic_report_20260311_121000.html  # Relatório consolidado

screenshots/
├── admin_site_bootstrap_step1_120001.png
├── admin_site_bootstrap_step2_120005.png
└── ...

logs/
├── tpic_20260311_120000.log
└── ...
```

### Relatório HTML Consolidado

O arquivo `tpic_report_*.html` contém:
- 📈 Dashboard com estatísticas
- ✓/✗ Status de cada teste
- 📸 Screenshots agrupados por teste
- 🔍 Análises detalhadas em JSON
- 📋 Log de execução completo
- ⏱️ Duração e performance

Abra no navegador:
```bash
open reports/tpic_report_*.html
# ou
firefox reports/tpic_report_*.html
```

---

## 🧪 Fluxos de Teste

### Fluxo 1: Admin Site (Bootstrap)

**Arquivo**: `test_admin_site.py`

```
Inicio: http://localhost:5173
  ↓
Navega: /admin-site
  ↓
Login: Admin / admin123
  ↓
Modal: Confirma "Mude sua senha"
  ↓
Setup: Preenche dados do 1º admin
  ↓
Painel: Confirma entrada no dashboard
```

**Testes**:
1. `test_admin_site_bootstrap()` - Fluxo completo
2. `test_admin_site_login()` - Apenas login

---

### Fluxo 2: Admin Paróquia (Bootstrap)

**Arquivo**: `test_admin_paroquia.py`

```
Início: http://localhost:5173/admin-paroquia
  ↓
Seleção: Escolhe paróquia (se houver múltiplas)
  ↓
Login: Credenciais admin paróquia
  ↓
Setup: Preenche dados do 1º admin paróquia
  ↓
Painel: Dashboard admin paróquia
  ↓
Jogo: Cria nova partida/jogo
```

**Testes**:
1. `test_admin_paroquia_bootstrap()` - Bootstrap completo
2. `test_admin_paroquia_login()` - Apenas login
3. `test_admin_paroquia_game_creation()` - Criar novo jogo

---

### Fluxo 3: Usuário Comum

**Arquivo**: `test_usuario_comum.py`

```
Início: http://localhost:5173
  ↓
Cadastro: Registra novo usuário
  ↓
Login: Acessa como usuário
  ↓
Jogos: Vê partidas disponíveis
  ↓
Bingo: Participa de partida
  ↓
Perfil: Visualiza dados do perfil
```

**Testes**:
1. `test_usuario_cadastro()` - Registro novo usuário
2. `test_usuario_login()` - Apenas login
3. `test_usuario_jogar_bingo()` - Participar de jogo
4. `test_usuario_perfil()` - Visualizar perfil

---

## 🎬 Executando Exemplos

### Exemplo 1: Teste Completo

```bash
python run_tpic.py
```

**Output esperado**:
```
======================================================================
  TPIC - Teste Prático de Integração Contínua
  Bingo da Comunidade com Claude Haiku 4.5 + Playwright
======================================================================

[INFO] ETAPA 1: Configuração do Ambiente
[✓] limpa.sh executado com sucesso
[✓] install.sh executado com sucesso
[✓] start.sh executado com sucesso

[INFO] ETAPA 2: Testes Admin Site
[✓] Fluxo Admin Site completado!
  Passos executados: 8
  Relatório: ./reports/report_admin_site_bootstrap_20260311_120000.html

...

======================================================================
✓ TPIC CONCLUÍDO
  Total: 8 testes
  Sucesso: 7
  Falhas: 1
  Relatório: ./reports/tpic_report_20260311_121000.html
======================================================================
```

### Exemplo 2: Teste Individual

```bash
python test_admin_site.py
```

---

## 🐛 Troubleshooting

### Erro: "ANTHROPIC_API_KEY não está definida"

```bash
# Solução: Definir no .env
echo "ANTHROPIC_API_KEY=sk-ant-xxxxx" > .env

# Ou via variável de ambiente
export ANTHROPIC_API_KEY=sk-ant-xxxxx
python run_tpic.py
```

### Erro: "Playwright não instalado"

```bash
# Instalar Playwright
pip install playwright==1.58.0

# Instalar navegador Chromium
playwright install chromium
```

### Erro: "Servidor não está rodando"

```bash
# Verificar se o servidor está em http://localhost:5173
# Se não, iniciar:
./start.sh

# Ou aguardar (TPIC tenta conectar automaticamente)
python run_tpic.py  # Vai aguardar o servidor
```

### Erro: "Timeout ao aguardar elemento"

- Aumentar timeout em `config.py`: `DEFAULT_TIMEOUT = 60000`
- Verificar se o elemento realmente aparece
- Consultar screenshot em `screenshots/`

### Erro: "401 Unauthorized" na API Claude

- Validar chave API em https://console.anthropic.com
- Verificar se tem créditos disponíveis
- Confirmar que não há espaços/quebras de linha na chave

---

## 📈 Interpretar Resultados

### Status dos Testes

| Status | Significado | Ação |
|--------|-------------|------|
| ✓ | Teste passou | Nenhuma ação necessária |
| ✗ | Teste falhou | Verificar logs e screenshot |
| ⚠ | Aviso não-crítico | Revisar comportamento |
| 🔴 | Erro crítico | Parar execução |

### Analisar Falhas

1. **Abrir relatório HTML**: `reports/tpic_report_*.html`
2. **Visualizar screenshot**: Seção "Ver análise completa"
3. **Ler análise JSON**: Ver `next_recommended_action` e `issues_detected`
4. **Verificar logs**: `logs/tpic_*.log`

### Exemplo de JSON de Análise

```json
{
  "page_loaded": true,
  "current_page": "admin-site/login",
  "errors": [
    "Email inválido"
  ],
  "visible_elements": {
    "buttons": ["Entrar", "Esqueci minha senha"],
    "input_fields": ["email", "password"]
  },
  "next_recommended_action": {
    "type": "fill",
    "target": "input[name='email']",
    "value": "Admin",
    "reasoning": "Campo de email vazio, preenchendo com credencial"
  },
  "issues_detected": [],
  "observations": "Login form visível e pronto"
}
```

---

## 🚀 Desenvolvimento

### Adicionar Novo Fluxo

1. Criar arquivo `test_novo_fluxo.py`:
   ```python
   async def test_novo_fluxo() -> Dict[str, Any]:
       agent = SmartTestAgent(headless=False)
       result = await agent.execute_intelligent_flow(
           start_url="http://localhost:5173/nova-rota",
           flow_name="novo_fluxo",
           custom_instructions="Instruções customizadas..."
       )
       return result
   ```

2. Adicionar em `run_tpic.py`:
   ```python
   def run_novos_testes(self) -> List[Dict[str, Any]]:
       from test_novo_fluxo import test_novo_fluxo
       # ...
   ```

### Customizar Análise Claude

Editar `custom_instructions` em cada teste:

```python
custom_instructions = """
Seu prompt customizado aqui.

Retorne JSON com estructura:
{
    "page_loaded": bool,
    "current_page": string,
    "errors": [array],
    "next_recommended_action": {
        "type": "click|fill|select|navigate|wait",
        "target": "seletor ou descrição",
        "value": "valor se necessário"
    }
}
"""
```

---

## 📚 Referências

### Documentação
- [Playwright Python Documentation](https://playwright.dev/python/)
- [Claude API Documentation](https://docs.anthropic.com)
- [Claude Vision Examples](https://docs.anthropic.com/vision)

### API Claude
- Modelo: `claude-3-5-haiku-20241022`
- Max tokens: 1500
- Suporta imagens PNG, JPEG, GIF, WebP

---

## 📝 Licença e Créditos

Desenvolvido para testes automatizados da aplicação **Bingo da Comunidade**.

---

## 🤝 Suporte

Para problemas:
1. Verificar `logs/tpic_*.log`
2. Analisar screenshots em `screenshots/`
3. Consultar relatório HTML em `reports/`
4. Verificar Google console errors (F12 no browser)

---

**Versão**: 1.0  
**Data**: 11 de março de 2026  
**Última atualização**: 11/03/2026
