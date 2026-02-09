# 🐳 Docker - Sistema de Bingo Comunitário

## 📋 RESUMO EXECUTIVO

Este sistema **abandonou completamente** o ambiente local Windows (.venv + .bat) em favor de **Docker**.

### Por quê?
- ✅ **Funciona em qualquer ambiente** (Windows, Linux, Mac)
- ✅ **Configuração transparente** (tudo no docker-compose.yml)
- ✅ **Sem conflitos** de versões Python/dependências
- ✅ **Reinício limpo** sempre (sem processos travados)
- ✅ **Dados persistentes** (banco SQLite em volume)

---

## 🚀 INÍCIO RÁPIDO (3 COMANDOS)

```powershell
# 1. Instale Docker Desktop (se ainda não tem)
# Download: https://docs.docker.com/desktop/install/windows-install/

# 2. Execute o script de inicialização
.\start.ps1

# 3. Acesse a documentação
# http://localhost:8000/docs
```

**Pronto!** O sistema já está rodando com dados iniciais! 🎉

---

## 📁 ARQUITETURA DOCKER

```
┌─────────────────────────────────────────────────────────────┐
│                    DOCKER COMPOSE                           │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Container: bingo_backend                │  │
│  │                                                      │  │
│  │  ┌────────────────────────────────────────────┐     │  │
│  │  │         Python 3.11-slim                   │     │  │
│  │  │                                            │     │  │
│  │  │  • FastAPI (uvicorn)                       │     │  │
│  │  │  • SQLAlchemy ORM                          │     │  │
│  │  │  • SQLite Database                         │     │  │
│  │  │  • Pytz (Timezone Fortaleza)               │     │  │
│  │  │  • Passlib (Hash senhas)                   │     │  │
│  │  │                                            │     │  │
│  │  └────────────────────────────────────────────┘     │  │
│  │                                                      │  │
│  │  Porta: 8000 → 8000                                 │  │
│  │  Volume: ./backend/data → /app/data                 │  │
│  │  Volume: ./backend/src → /app/src (hot-reload)      │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
         │                                    │
         │                                    │
    📂 backend/data/bingo.db          🌐 http://localhost:8000
    (Persistente)                         (Acesso público)
```

---

## ⚙️ VARIÁVEIS DE AMBIENTE (docker-compose.yml)

### Banco de Dados
```yaml
- USE_SQLITE=true                              # SQLite ou PostgreSQL
- DATABASE_URL=sqlite:////app/data/bingo.db    # Caminho do banco
```

### Timezone
```yaml
- TIMEZONE=America/Fortaleza                   # Única fonte de verdade
```

### Seed Automático
```yaml
- SEED_ENABLED=true                            # Cria dados iniciais
```

### Dados do Proprietário (Super Admin)
Definidos no fluxo de primeiro acesso após login bootstrap (Admin/admin123).

### Dados da Paróquia Padrão
```yaml
- PARISH_NAME=Paróquia São José
- PARISH_EMAIL=contato@paroquiasaojose.com.br
- PARISH_PHONE=85999999999
- PARISH_PIX=contato@paroquiasaojose.com.br
- PARISH_CITY=Fortaleza
- PARISH_STATE=CE
```

### Configurações da API
```yaml
- API_TITLE=Bingo da Comunidade - API
- API_VERSION=1.0.0
- LOG_LEVEL=info                               # debug, info, warning, error
```

---

## 🔧 COMANDOS DOCKER

### Inicialização
```powershell
# Iniciar (modo normal)
docker-compose up -d

# Iniciar com rebuild
docker-compose up -d --build

# Iniciar e ver logs em tempo real
docker-compose up
```

### Gerenciamento
```powershell
# Ver status
docker-compose ps

# Ver logs
docker-compose logs -f backend

# Parar
docker-compose down

# Reiniciar
docker-compose restart

# Recriar do zero (APAGA DADOS!)
docker-compose down -v
docker-compose up -d --build
```

### Debug
```powershell
# Entrar no container
docker exec -it bingo_backend bash

# Ver logs de erro
docker-compose logs backend | Select-String "ERROR"

# Inspecionar container
docker inspect bingo_backend
```

---

## 📂 VOLUMES E PERSISTÊNCIA

### Volume de Dados (Persistente)
```yaml
volumes:
  - ./backend/data:/app/data
```

**Conteúdo:**
- `bingo.db` - Banco SQLite
- **Persiste** mesmo se recriar o container

### Volume de Código (Hot-reload)
```yaml
volumes:
  - ./backend/src:/app/src
```

**Função:**
- Qualquer mudança em `.py` **reinicia automaticamente** a API
- **Remover em produção** para melhor performance

---

## 🔍 HEALTH CHECKS

### Configuração
```yaml
healthcheck:
  test: ["CMD-SHELL", "python -c 'import urllib.request; urllib.request.urlopen(\"http://localhost:8000/ping\")'"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Verificar Status
```powershell
# Via Docker
docker ps

# Via API
Invoke-RestMethod http://localhost:8000/health
```

---

## 🌱 SEED AUTOMÁTICO

### Como Funciona

1. Container inicia
2. FastAPI executa evento `@app.on_event("startup")`
3. Verifica variável `SEED_ENABLED=true`
4. Chama `seed_database()` de `src/db/seed.py`
5. Cria:
   - ✅ Super Admin
   - ✅ Paróquia padrão
   - ✅ Parish Admin
   - ✅ Fiel de exemplo
6. Exibe credenciais no log

### Desabilitar Seed

Edite `docker-compose.yml`:
```yaml
- SEED_ENABLED=false
```

### Re-executar Seed

```powershell
# 1. Parar sistema
docker-compose down

# 2. Apagar banco
Remove-Item backend\data\bingo.db

# 3. Reiniciar
docker-compose up -d
```

---

## 🔐 SEGURANÇA

### Senhas
- ✅ **Hash bcrypt** (passlib)
- ✅ Nunca armazenadas em texto puro
- ✅ Salt automático por senha

### Variáveis Sensíveis
- ⚠️ **ATENÇÃO:** Senhas estão no `docker-compose.yml`
- ⚠️ **Em produção:** Use Docker Secrets ou variáveis de ambiente externas

### CORS
```python
# DESENVOLVIMENTO
allow_origins=["*"]

# PRODUÇÃO (mudar em main.py)
allow_origins=["https://seudominio.com"]
```

---

## 🐛 TROUBLESHOOTING

### ❌ Porta 8000 em uso

**Diagnóstico:**
```powershell
netstat -ano | findstr :8000
```

**Solução 1:** Matar processo
```powershell
taskkill /PID <PID> /F
```

**Solução 2:** Usar outra porta
```yaml
ports:
  - "8001:8000"  # docker-compose.yml
```

---

### ❌ Container reiniciando infinitamente

**Diagnóstico:**
```powershell
docker-compose logs backend
```

**Causas comuns:**
- Import error (dependência faltando)
- Syntax error no código Python
- Banco de dados corrompido

**Solução:**
```powershell
.\start.ps1 -Clean
```

---

### ❌ Banco de dados vazio

**Verificar:**
```powershell
docker-compose logs backend | Select-String "Seed"
```

**Se não aparecer logs de seed:**
```yaml
# Verificar no docker-compose.yml
- SEED_ENABLED=true  # ← Deve estar "true"
```

**Recriar:**
```powershell
.\start.ps1 -Clean
```

---

### ❌ Hot-reload não funciona

**Verificar volume:**
```yaml
volumes:
  - ./backend/src:/app/src  # ← Deve estar presente
```

**Reiniciar:**
```powershell
docker-compose restart
```

---

## 📊 MONITORAMENTO

### Logs em Tempo Real
```powershell
# Todos os logs
docker-compose logs -f

# Apenas backend
docker-compose logs -f backend

# Apenas erros
docker-compose logs backend | Select-String "ERROR"

# Últimas 50 linhas
docker-compose logs --tail=50 backend
```

### Métricas do Container
```powershell
# Uso de CPU/RAM
docker stats bingo_backend

# Inspecionar
docker inspect bingo_backend
```

---

## 🚀 DEPLOY EM PRODUÇÃO

### Ajustes Necessários

1. **Remover hot-reload**
```yaml
volumes:
  - ./backend/data:/app/data
  # - ./backend/src:/app/src  # ← Comentar
```

2. **Mudar CORS**
```python
# main.py
allow_origins=["https://seudominio.com"]
```

3. **Usar PostgreSQL**
```yaml
- USE_SQLITE=false
- DB_HOST=seu_postgres_host
- DB_NAME=bingo_comunidade
- DB_USER=postgres
- DB_PASSWORD=senha_forte
```

4. **Mudar senhas padrão**
```yaml
- OWNER_PASSWORD=SenhaSuperForte@2026!
```

5. **Usar Docker Secrets**
```yaml
secrets:
  - db_password
  - owner_password
```

---

## 📚 DOCUMENTAÇÃO RELACIONADA

- **[COMO_USAR.md](../COMO_USAR.md)** - Guia de uso completo
- **[DOCKER_QUICKSTART.md](../DOCKER_QUICKSTART.md)** - Referência rápida
- **[FASE2_INICIADA.md](../FASE2_INICIADA.md)** - Changelog da dockerização
- **[Readme.md](../Readme.md)** - Manual completo do projeto

---

## 🎯 BENEFÍCIOS DO DOCKER

| Antes (Windows Local) | Depois (Docker) |
|----------------------|-----------------|
| ❌ .venv problemático | ✅ Container isolado |
| ❌ Scripts .bat complexos | ✅ Um comando simples |
| ❌ Conflitos de Python | ✅ Versão garantida |
| ❌ Processos travados | ✅ Reinício limpo |
| ❌ .env escondido | ✅ docker-compose.yml transparente |
| ❌ Difícil debug | ✅ Logs estruturados |

---

**🎱 Desenvolvido com fé, transparência e tecnologia.**

**Que Deus abençoe cada bingo realizado com este sistema!** 🙏
