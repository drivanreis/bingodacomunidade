# 📂 ESTRUTURA DO PROJETO

## 🎯 Visão Geral

```
bingodacomunidade/
│
├── 📋 START_HERE.md              ⭐ COMECE AQUI! Guia de 3 passos
├── 📋 COMO_USAR.md               📖 Manual completo de uso
├── 📋 DOCKER_QUICKSTART.md       🐳 Referência rápida Docker
├── 📋 FASE2_INICIADA.md          📝 Changelog da dockerização
│
├── 🚀 start.ps1                  ⚡ Script de inicialização inteligente
├── 🧪 test_system.ps1            ✅ Testes automatizados
│
├── 🐳 docker-compose.yml         🔧 Configuração TRANSPARENTE
├── 📄 .gitignore                 🚫 Arquivos ignorados pelo Git
│
├── 📚 Briefing.md                💡 Visão conceitual do projeto
├── 📚 Dev. Guide.md              🛠️ Guia de desenvolvimento
├── 📚 Readme.md                  📖 Manual completo (852 linhas)
│
├── 📁 backend/                   🏗️ Backend (FastAPI + SQLAlchemy)
│   ├── 📄 Dockerfile             🐳 Imagem Docker
│   ├── 📄 .dockerignore          🚫 Arquivos ignorados no build
│   ├── 📄 .gitignore             🚫 Arquivos ignorados pelo Git
│   ├── 📄 requirements.txt       📦 Dependências Python
│   ├── 📋 README_DOCKER.md       🐳 Documentação Docker técnica
│   │
│   ├── 📁 data/                  💾 Dados persistentes
│   │   ├── .gitkeep              🔒 Mantém pasta no Git
│   │   └── bingo.db              🗄️ Banco SQLite (criado automaticamente)
│   │
│   └── 📁 src/                   💻 Código fonte
│       ├── __init__.py           🔧 Módulo Python
│       ├── main.py               🚀 Ponto de entrada da API
│       │
│       ├── 📁 db/                🗄️ Camada de banco de dados
│       │   ├── __init__.py       🔧
│       │   ├── base.py           🔧 Configuração SQLAlchemy
│       │   └── seed.py           🌱 Carga inicial de dados
│       │
│       ├── 📁 models/            🏗️ Modelos ORM (4 tabelas)
│       │   ├── __init__.py       🔧
│       │   └── models.py         📊 Paroquia, Usuario, Sorteio, Cartela
│       │
│       ├── 📁 schemas/           ✅ Validação Pydantic
│       │   ├── __init__.py       🔧
│       │   └── schemas.py        📋 Schemas de entrada/saída
│       │
│       └── 📁 utils/             🛠️ Utilitários
│           ├── __init__.py       🔧
│           └── time_manager.py   ⏰ IDs temporais + Timezone
│
└── 📁 frontend/                  🎨 Frontend (ainda não iniciado)
    └── (vazio)
```

---

## 📋 ARQUIVOS DE DOCUMENTAÇÃO

### ⭐ **START_HERE.md** - COMECE AQUI
- Guia de 3 passos
- Instalação rápida
- Credenciais padrão
- Comandos essenciais

### 📖 **COMO_USAR.md** - Manual Completo
- Instalação detalhada do Docker
- Personalização de configurações
- Comandos úteis
- Resolução de problemas

### 🐳 **DOCKER_QUICKSTART.md** - Referência Docker
- Comandos Docker
- Health checks
- Volumes e persistência
- Troubleshooting

### 📝 **FASE2_INICIADA.md** - Changelog
- O que foi implementado
- Benefícios alcançados
- Próximos passos
- Estatísticas do projeto

### 💡 **Briefing.md** - Visão Conceitual
- Propósito do sistema
- Estrutura de governança
- Dinâmica do jogo
- Filosofia

### 🛠️ **Dev. Guide.md** - Guia de Desenvolvimento
- Fases de implementação
- Arquitetura técnica
- Padrões de código

### 📖 **Readme.md** - Manual Geral (852 linhas!)
- Visão geral completa
- Instalação
- Uso
- LGPD
- FAQ

---

## 🚀 SCRIPTS AUTOMATIZADOS

### ⚡ **start.ps1** - Inicialização Inteligente
**Funcionalidades:**
- ✅ Verifica Docker instalado
- ✅ Verifica Docker rodando
- ✅ Abre Docker Desktop se necessário
- ✅ Verifica porta 8000
- ✅ Inicia containers
- ✅ Aguarda API ficar pronta
- ✅ Testa endpoint
- ✅ Abre navegador (opcional)

**Parâmetros:**
```powershell
.\start.ps1           # Normal
.\start.ps1 -Rebuild  # Rebuild forçado
.\start.ps1 -Clean    # Limpa e reinicia
```

---

### 🧪 **test_system.ps1** - Testes Automatizados
**Testa:**
- ✅ Endpoint `/ping`
- ✅ Endpoint `/health`
- ✅ Endpoint `/` (root)
- ✅ Documentação `/docs`
- ✅ Exibe credenciais

---

## 🐳 CONFIGURAÇÃO DOCKER

### **docker-compose.yml** - Configuração Transparente
**Seções:**
- 🔧 Variáveis de ambiente (todas visíveis!)
- 💾 Volumes para persistência
- 🌐 Portas expostas
- 💚 Health checks
- 🔄 Política de reinicialização

**Variáveis configuráveis:**
```yaml
# Banco de Dados
USE_SQLITE, DATABASE_URL

# Timezone
TIMEZONE

# Seed
SEED_ENABLED

# Proprietário
OWNER_NAME, OWNER_EMAIL, OWNER_PASSWORD

# Paróquia
PARISH_NAME, PARISH_EMAIL, PARISH_PHONE, 
PARISH_PIX, PARISH_CITY, PARISH_STATE

# API
API_TITLE, API_VERSION, LOG_LEVEL
```

---

## 🏗️ BACKEND (FastAPI)

### 📁 **src/** - Código Fonte

#### 🚀 **main.py** - API Principal
- Configuração FastAPI
- Middleware CORS
- Evento startup (seed automático)
- Evento shutdown
- Health checks
- Documentação Swagger

#### 🗄️ **db/** - Banco de Dados
**base.py:**
- Configuração SQLAlchemy
- Engine (SQLite ou PostgreSQL)
- SessionLocal factory
- Dependency injection
- Timezone forçado (Fortaleza)

**seed.py:**
- Popula dados iniciais
- Cria Super Admin
- Cria Paróquia padrão
- Cria Parish Admin
- Cria Fiel de exemplo
- Hash de senhas (bcrypt)

#### 🏗️ **models/** - ORM
**models.py (4 tabelas):**
1. **Paroquia** - Igreja/paróquia
2. **Usuario** - Super Admin, Parish Admin, Fiel
3. **Sorteio** - Evento de bingo
4. **Cartela** - Cartela comprada

**Características:**
- IDs temporais (PK)
- Timestamps com timezone
- Relacionamentos configurados
- Enums para status

#### ✅ **schemas/** - Validação
**schemas.py:**
- Schemas Pydantic v2
- Validadores customizados
- WhatsApp brasileiro
- Chave PIX
- Rateio (soma = 100%)
- Validação de datas

#### 🛠️ **utils/** - Utilitários
**time_manager.py:**
- Timezone de Fortaleza (única verdade)
- Gerador de IDs temporais
- Funções de conversão
- Parse de IDs

---

## 💾 DADOS PERSISTENTES

### 📁 **backend/data/**
```
bingo.db          # Banco SQLite
.gitkeep          # Mantém pasta no Git
```

**Características:**
- ✅ Persiste entre reinicializações
- ✅ Criado automaticamente no primeiro start
- ✅ Populado com dados iniciais (seed)
- ✅ Mapeado como volume Docker

---

## 🎨 FRONTEND (Futuro)

### 📁 **frontend/** - (Ainda Vazio)
**Próximos passos:**
- [ ] Escolher framework (React/Vue/Svelte)
- [ ] Desenhar telas
- [ ] Implementar componentes
- [ ] Integrar com API

---

## 🔑 DADOS INICIAIS (Seed)

### 👤 Usuário Temporário (Bootstrap)

#### 👑 **Admin do Site (temporário)**
```
Usuário: Admin
Senha: admin123
Tipo: bootstrap
```

Após o login, conclua o cadastro real do SUPER_ADMIN.

### ⛪ **Paróquia Criada**
```
Nome: Paróquia São José
Email: contato@paroquiasaojose.com.br
Telefone: 85999999999
PIX: contato@paroquiasaojose.com.br
Cidade: Fortaleza
Estado: CE
```

---

## 📊 ESTATÍSTICAS

| Métrica | Quantidade |
|---------|------------|
| **Arquivos criados** | 25+ |
| **Linhas de código (backend)** | ~2.500 |
| **Linhas de documentação** | ~2.000 |
| **Scripts PowerShell** | 2 |
| **Tabelas no banco** | 4 |
| **Endpoints API** | 3 |
| **Usuários seed** | 3 |
| **Dependências Python** | 17 |

---

## 🎯 FLUXO DE EXECUÇÃO

```
1. Usuário executa: .\start.ps1
   ↓
2. Script verifica Docker
   ↓
3. Script verifica porta 8000
   ↓
4. docker-compose up -d
   ↓
5. Docker constrói imagem (se necessário)
   ↓
6. Container inicia
   ↓
7. FastAPI inicia (main.py)
   ↓
8. Evento @app.on_event("startup")
   ↓
9. Verifica conexão com banco
   ↓
10. Cria estrutura do banco (tabelas)
    ↓
11. Verifica SEED_ENABLED=true
    ↓
12. Executa seed.py
    ↓
13. Cria Super Admin
    ↓
14. Cria Paróquia
    ↓
15. Cria Parish Admin
    ↓
16. Cria Fiel
    ↓
17. Exibe credenciais no log
    ↓
18. API fica disponível
    ↓
19. Script testa /ping
    ↓
20. ✅ SUCESSO! Sistema pronto!
```

---

## 🚀 PRÓXIMAS FASES

### **Fase 2 (Atual)** - APIs de Negócio
- [ ] CRUD de Paróquias
- [ ] CRUD de Usuários
- [ ] CRUD de Sorteios
- [ ] CRUD de Cartelas
- [ ] Autenticação JWT

### **Fase 3** - Lógica de Sorteio
- [ ] Gerador de cartelas
- [ ] Motor de sorteio
- [ ] Detector de vencedores
- [ ] WebSocket

### **Fase 4** - Frontend
- [ ] Escolher framework
- [ ] Telas
- [ ] Componentes
- [ ] Integração

### **Fase 5** - Pagamentos
- [ ] Integração PIX
- [ ] Pagamento de prêmios
- [ ] Relatórios financeiros

---

## 🎱 FILOSOFIA

> **"Transparência total. Sem configurações escondidas. Sem scripts mágicos. Se é comunitário, deve ser compreensível."**

**Princípios:**
- ✅ Código documentado
- ✅ Configuração transparente
- ✅ Logs informativos
- ✅ Fácil de usar
- ✅ Fácil de manter

---

**🎱 Desenvolvido com fé, transparência e tecnologia.**

**Que Deus abençoe cada bingo realizado com este sistema!** 🙏
