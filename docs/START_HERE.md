# 🎯 INÍCIO IMEDIATO - Sistema Full-Stack Dockerizado

> **Frontend + Backend + Banco em 3 comandos. Zero configuração manual.**

---

## 📦 PASSO 1: Instale as Ferramentas

### 🐳 Docker Desktop
**Windows 10/11:**
1. Baixe: https://docs.docker.com/desktop/install/windows-install/
2. Execute o instalador
3. Reinicie o computador
4. Abra o Docker Desktop
5. Aguarde aparecer **"Docker is running"**

### 📦 Node.js (para instalação inicial)
1. Baixe: https://nodejs.org/ (versão LTS)
2. Execute o instalador
3. Verifique: `node --version` no PowerShell

**Já tem Docker e Node?** Pule para o Passo 2.

---

## 🚀 PASSO 2: Instale o Sistema

Abra **PowerShell** na pasta do projeto:

```powershell
# Entre na pasta
cd C:\Users\EU\Documents\GitHub\bingodacomunidade

# Execute o script de instalação
.\install.ps1
```

**O que vai acontecer:**
```
✓ Verifica Docker e Docker Compose
✓ Instala dependências do frontend (npm install)
✓ Cria arquivo .env do frontend
✓ Prepara diretório de dados
```

---

## 🔥 PASSO 3: Inicie o Sistema Completo

```powershell
docker compose up --build
```

**O que vai acontecer:**
```
✓ Constrói imagem do backend (FastAPI + Python)
✓ Constrói imagem do frontend (Vite + React)
✓ Cria banco SQLite com seed inicial
✓ Inicia 3 containers orquestrados
✓ Backend escuta na porta 8000
✓ Frontend escuta na porta 5173
```

**Aguarde ver:**
```
bingo_backend   | INFO:     Uvicorn running on http://0.0.0.0:8000
bingo_frontend  | VITE ready in 1234 ms
bingo_frontend  | ➜  Local:   http://localhost:5173/
```

---

## 🌐 PASSO 4: Acesse o Sistema

### 🎨 Frontend (Interface do Usuário)
```
http://localhost:5173
```
- Página inicial com Header mostrando nome da paróquia
- Hot-reload ativado (mudanças aparecem instantaneamente)

### 📖 Backend - Documentação Interativa (Swagger)
```
http://localhost:8000/docs
```

### 👤 Credenciais de Primeiro Acesso

**Admin do Site (temporário):**
```
Usuário: Admin
Senha: admin123
```

Após o login, finalize o cadastro real do SUPER_ADMIN.

---

## ✅ PRONTO!

O sistema está rodando com:
- ✅ Banco SQLite criado
- ✅ 3 usuários cadastrados
- ✅ 1 paróquia cadastrada
- ✅ API documentada e funcionando

---

## 🔧 COMANDOS ÚTEIS

### Ver logs
```powershell
docker-compose logs -f backend
```

### Parar sistema
```powershell
docker-compose down
```

### Reiniciar
```powershell
docker-compose restart
```

### Testar
```powershell
.\test_system.ps1
```

### Resetar tudo
```powershell
.\start.ps1 -Clean
```

---

## ⚙️ PERSONALIZAR CONFIGURAÇÕES

Edite o arquivo:
```
docker-compose.yml
```

Procure por:
```yaml
# Seed Inicial - DADOS DO PROPRIETÁRIO
- OWNER_NAME=Seu Nome
- OWNER_EMAIL=seuemail@exemplo.com
- OWNER_PASSWORD=SuaSenha

# Paróquia Padrão
- PARISH_NAME=Sua Paróquia
- PARISH_EMAIL=contato@suaparoquia.com.br
- PARISH_PIX=sua_chave_pix
```

Depois:
```powershell
.\start.ps1 -Clean
```

---

## 🐛 PROBLEMAS?

### ❌ "Porta 8000 em uso"
```powershell
# Encontrar processo
netstat -ano | findstr :8000

# Matar processo
taskkill /PID <PID> /F

# Ou usar outra porta no docker-compose.yml
```

### ❌ "Docker não está rodando"
1. Abra Docker Desktop
2. Aguarde "Docker is running"
3. Execute `.\start.ps1` novamente

### ❌ "Container reiniciando"
```powershell
# Ver erro
docker-compose logs backend

# Resetar
.\start.ps1 -Clean
```

---

## 📚 DOCUMENTAÇÃO COMPLETA

- **[COMO_USAR.md](COMO_USAR.md)** - Guia completo
- **[DOCKER_QUICKSTART.md](DOCKER_QUICKSTART.md)** - Referência Docker
- **[Readme.md](Readme.md)** - Manual do projeto
- **[backend/README_DOCKER.md](backend/README_DOCKER.md)** - Docker técnico

---

## 🎯 O QUE MUDOU?

### ❌ Antes (Problemático)
- Ambiente virtual .venv
- Scripts .bat complexos
- Conflitos de Python
- Processos travados
- Configuração escondida

### ✅ Agora (Solução)
- Docker containers
- Um comando: `.\start.ps1`
- Versão Python garantida
- Reinício limpo
- Configuração transparente

---

**🎱 Desenvolvido com fé, transparência e tecnologia.**

**Que Deus abençoe cada bingo realizado com este sistema!** 🙏
