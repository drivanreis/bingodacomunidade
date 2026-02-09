# 🚀 Guia de Comandos Rápidos

Referência rápida para operações comuns do sistema.  
**Última Atualização:** 21/01/2026

---

## 🌐 URLs de Acesso

```
Frontend (Interface):     http://localhost:5173
Backend API:              http://localhost:8000
Documentação Swagger:     http://localhost:8000/docs
```

**Credenciais de Primeiro Acesso:**
- Admin do Site (temporário): `Admin` / `admin123`

Após o login, conclua o cadastro real do SUPER_ADMIN.

---

## 📦 Instalação

```powershell
# Instalação completa (primeira vez)
.\install.ps1
```

---

## 🐳 Docker Compose

### Iniciar Sistema
```powershell
# Iniciar com build
docker compose up --build

# Iniciar normal
docker compose up

# Iniciar em background
docker compose up -d
```

### Parar Sistema
```powershell
# Parar e remover containers (mantém volumes)
docker compose down

# Parar e remover volumes (apaga banco!)
docker compose down -v

# Parar um serviço específico
docker compose stop backend
docker compose stop frontend
```

### Reiniciar
```powershell
# Reiniciar tudo
docker compose restart

# Reiniciar serviço específico
docker compose restart backend
docker compose restart frontend
```

### Rebuild
```powershell
# Rebuild todos os containers
docker compose up --build

# Rebuild apenas backend
docker compose up --build backend

# Rebuild apenas frontend
docker compose up --build frontend
```

---

## 📊 Logs

```powershell
# Ver todos os logs
docker compose logs

# Ver logs em tempo real
docker compose logs -f

# Ver apenas backend
docker compose logs backend
docker compose logs -f backend

# Ver apenas frontend
docker compose logs frontend
docker compose logs -f frontend

# Últimas N linhas
docker compose logs --tail=50

# Logs com timestamp
docker compose logs -t

# Filtrar por palavra
docker compose logs | Select-String "error"
```

---

## 🔍 Status e Informações

```powershell
# Ver status dos containers
docker compose ps

# Ver detalhes de um container
docker inspect bingo_backend
docker inspect bingo_frontend

# Ver uso de recursos
docker stats

# Ver imagens criadas
docker images | Select-String "bingo"

# Ver volumes
docker volume ls
```

---

## 🧪 Testes da API

### Health Check
```powershell
curl http://localhost:8000/health
```

### Ping
```powershell
curl http://localhost:8000/ping
```

### Paróquia
```powershell
curl http://localhost:8000/paroquia/me
```

### Cadastro de Fiel
```powershell
$body = @{
    nome = "João Silva"
    cpf = "12345678909"
    email = "joao@example.com"
    telefone = "85987654321"
    chave_pix = "joao@example.com"
    senha = "Senha@123"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:8000/auth/signup `
                  -Method POST `
                  -ContentType "application/json" `
                  -Body $body
```

### Login
```powershell
$body = @{
    cpf = "12345678909"
    senha = "Senha@123"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:8000/auth/login `
                  -Method POST `
                  -ContentType "application/json" `
                  -Body $body
```

---

## 🗄️ Banco de Dados

### Verificar Banco
```powershell
# Verificar se arquivo existe
Test-Path backend\data\bingo.db

# Ver tamanho
(Get-Item backend\data\bingo.db).Length / 1KB
```

### Backup Banco
```powershell
# Backup manual
Copy-Item backend\data\bingo.db backend\data\bingo_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').db

# Listar backups
Get-ChildItem backend\data\bingo_backup_*.db
```

### Resetar Banco
```powershell
# CUIDADO: Apaga todos os dados!
docker compose down
Remove-Item backend\data\bingo.db
docker compose up
```

---

## 🛠️ Desenvolvimento

### Executar Comandos no Container

**Backend:**
```powershell
# Entrar no container
docker compose exec backend bash

# Executar Python no container
docker compose exec backend python -c "print('Hello')"

# Executar script
docker compose exec backend python src/db/seed.py
```

**Frontend:**
```powershell
# Entrar no container
docker compose exec frontend sh

# Instalar nova dependência
docker compose exec frontend npm install axios

# Rodar comando npm
docker compose exec frontend npm run build
```

### Verificar Variáveis de Ambiente

**Backend:**
```powershell
docker compose exec backend env | Select-String "DATABASE"
docker compose exec backend env | Select-String "TIMEZONE"
```

**Frontend:**
```powershell
docker compose exec frontend env | Select-String "VITE"
```

---

## 🔥 Hot-Reload

### Backend
```powershell
# Edite arquivos em backend/src/
# Servidor reinicia automaticamente

# Ver logs de reinicialização
docker compose logs -f backend | Select-String "Reloading"
```

### Frontend
```powershell
# Edite arquivos em frontend/src/
# Vite atualiza navegador automaticamente

# Ver logs do Vite
docker compose logs -f frontend
```

---

## 🧹 Limpeza

### Limpar Containers
```powershell
# Remover containers parados
docker container prune

# Remover containers do projeto
docker compose down
docker rm -f bingo_backend bingo_frontend
```

### Limpar Imagens
```powershell
# Remover imagens não usadas
docker image prune

# Remover imagens do projeto
docker rmi bingodacomunidade-backend
docker rmi bingodacomunidade-frontend
```

### Limpar Volumes
```powershell
# CUIDADO: Remove volumes não usados (pode apagar dados!)
docker volume prune

# Remover volume específico
docker volume rm bingodacomunidade_backend_data
```

### Limpar Tudo
```powershell
# CUIDADO: Remove TUDO do Docker (não apenas deste projeto)
docker system prune -a --volumes
```

---

## 📦 NPM (Frontend)

### Instalar Dependência
```powershell
cd frontend
npm install nome-do-pacote
cd ..

# Rebuild container
docker compose up --build frontend
```

### Atualizar Dependências
```powershell
cd frontend
npm update
cd ..
```

### Verificar Dependências
```powershell
cd frontend
npm list
npm outdated
cd ..
```

---

## 🐍 Python (Backend)

### Instalar Dependência
```powershell
# Adicione ao requirements.txt
echo "nome-do-pacote==1.0.0" >> backend\requirements.txt

# Rebuild container
docker compose up --build backend
```

### Verificar Dependências
```powershell
docker compose exec backend pip list
docker compose exec backend pip show fastapi
```

---

## 🌐 Rede

### Verificar Portas
```powershell
# Ver portas em uso
netstat -ano | findstr :8000
netstat -ano | findstr :5173

# Ver conexões do Docker
docker port bingo_backend
docker port bingo_frontend
```

### Testar Conectividade
```powershell
# Testar backend
Test-NetConnection localhost -Port 8000

# Testar frontend
Test-NetConnection localhost -Port 5173
```

---

## 🔐 Segurança

### Gerar Nova Secret Key
```powershell
# Gerar chave aleatória
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})

# Usar em docker-compose.yml (variável SECRET_KEY)
```

### Ver Hashes de Senhas
```powershell
docker compose exec backend python -c "
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
print(pwd_context.hash('MinhaSenh@123'))
"
```

---

## 📝 Git

### Commits Úteis
```powershell
# Status
git status

# Adicionar arquivos modificados
git add .

# Commit com mensagem
git commit -m "feat: adiciona integração Docker frontend"

# Push
git push origin main
```

### Ignorar Arquivos Gerados
```powershell
# Já configurado no .gitignore:
# - backend/data/*.db
# - frontend/.env
# - frontend/node_modules/
# - __pycache__/
```

---

## 🆘 Troubleshooting

### Container não inicia
```powershell
# Ver erro completo
docker compose logs backend
docker compose logs frontend

# Verificar sintaxe do docker-compose.yml
docker compose config

# Rebuild do zero
docker compose down -v
docker compose up --build
```

### Porta já em uso
```powershell
# Identificar processo usando porta 8000
netstat -ano | findstr :8000

# Matar processo (substitua PID)
taskkill /F /PID 1234
```

### Banco corrompido
```powershell
# Backup do banco atual
Copy-Item backend\data\bingo.db backend\data\bingo_corrupted.db

# Recriar banco
Remove-Item backend\data\bingo.db
docker compose restart backend
```

### Frontend não conecta ao backend
```powershell
# Verificar variável de ambiente
cat frontend\.env
# Deve ter: VITE_API_URL=http://localhost:8000

# Verificar se backend está rodando
curl http://localhost:8000/health

# Rebuild frontend
docker compose up --build frontend
```

---

## 📚 Documentação

```powershell
# Abrir documentação Swagger
Start-Process http://localhost:8000/docs

# Abrir frontend
Start-Process http://localhost:5173

# Ver documentação do projeto
Get-ChildItem *.md
```

---

## 🎯 Atalhos Úteis

### PowerShell Aliases
```powershell
# Adicionar ao seu $PROFILE

# Docker Compose
Set-Alias dcu 'docker compose up'
Set-Alias dcd 'docker compose down'
Set-Alias dcl 'docker compose logs'
Set-Alias dcp 'docker compose ps'

# Testes
function Test-Api { curl http://localhost:8000/health }
function Test-Frontend { Start-Process http://localhost:5173 }

# Logs
function Logs-Backend { docker compose logs -f backend }
function Logs-Frontend { docker compose logs -f frontend }
```

---

## 📊 Monitoramento

### Ver Recursos em Tempo Real
```powershell
# CPU, Memória, Rede de cada container
docker stats

# Apenas containers do projeto
docker stats bingo_backend bingo_frontend
```

### Ver Logs com Timestamp
```powershell
docker compose logs -t -f
```

### Exportar Logs
```powershell
docker compose logs > logs_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt
```

---

**Última Atualização**: 13/01/2026
