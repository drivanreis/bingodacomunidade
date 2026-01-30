# 🧪 Guia de Testes - Sistema Dockerizado

Execute estes comandos para validar que a integração está funcionando corretamente.

---

## 🚀 Passo 1: Instalação

```powershell
# Execute o script de instalação
.\install.ps1
```

**Resultado esperado:**
```
✓ Docker encontrado
✓ Docker Compose encontrado
✓ Dependências do frontend instaladas
✓ Arquivo .env criado
✓ INSTALAÇÃO CONCLUÍDA COM SUCESSO!
```

---

## 🐳 Passo 2: Subir Containers

```powershell
docker compose up --build
```

**Aguarde até ver:**
```
bingo_backend   | INFO:     Uvicorn running on http://0.0.0.0:8000
bingo_frontend  | VITE v7.2.4  ready in 1234 ms
bingo_frontend  | ➜  Local:   http://localhost:5173/
```

---

## ✅ Passo 3: Testes Básicos

### 3.1 Backend Health Check
```powershell
curl http://localhost:8000/health
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "timezone": "America/Fortaleza",
  "current_time": "2026-01-13T15:30:45-03:00",
  "database": "connected",
  "version": "1.0.0"
}
```

### 3.2 Backend Ping
```powershell
curl http://localhost:8000/ping
```

**Resposta esperada:**
```json
{
  "message": "pong"
}
```

### 3.3 Paróquia Padrão
```powershell
curl http://localhost:8000/paroquia/me
```

**Resposta esperada:**
```json
{
  "id": "PAR_20260113000000",
  "nome": "Paróquia São José",
  "email": "contato@paroquiasaojose.com.br",
  ...
}
```

### 3.4 Frontend Carregando
1. Abra o navegador: http://localhost:5173
2. Deve aparecer a página inicial
3. Header deve mostrar: **"Paróquia São José"**
4. Abra o console (F12) → Não deve ter erros

### 3.5 Documentação Swagger
Abra no navegador: http://localhost:8000/docs

Você deve ver a interface Swagger com todos os endpoints:
- ✅ POST `/auth/signup`
- ✅ POST `/auth/login`
- ✅ GET `/paroquia/me`
- ✅ GET `/health`
- ✅ GET `/ping`

---

## 🔥 Passo 4: Teste de Hot-Reload

### 4.1 Backend Hot-Reload

**Teste:**
1. Abra `backend/src/main.py`
2. Localize o endpoint `/ping`
3. Mude `"pong"` para `"pong-teste"`
4. Salve o arquivo

**Verificação:**
```powershell
# Aguarde 2-3 segundos
curl http://localhost:8000/ping
```

**Deve retornar:**
```json
{
  "message": "pong-teste"
}
```

**Reverter:**
Desfaça a mudança e salve novamente.

### 4.2 Frontend Hot-Reload

**Teste:**
1. Abra `frontend/src/components/Header.tsx`
2. Localize a linha: `<h1>...</h1>`
3. Mude para: `<h1>🎱 {paroquia.nome} - TESTE</h1>`
4. Salve o arquivo

**Verificação:**
- Vá ao navegador (http://localhost:5173)
- A página deve atualizar automaticamente
- Header deve mostrar: **"🎱 Paróquia São José - TESTE"**

**Reverter:**
Desfaça a mudança e salve.

---

## 🧪 Passo 5: Teste de Autenticação

### 5.1 Cadastro de Fiel (Signup)

```powershell
$body = @{
    nome = "João Silva"
    cpf = "12345678909"
    email = "joao@example.com"
    telefone = "85987654321"
    chave_pix = "joao@example.com"
    senha = "Senha@123"
} | ConvertTo-Json

curl -X POST http://localhost:8000/auth/signup `
     -H "Content-Type: application/json" `
     -d $body
```

**Resposta esperada:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 604800
}
```

### 5.2 Login de Fiel

```powershell
$body = @{
    cpf = "12345678909"
    senha = "Senha@123"
} | ConvertTo-Json

curl -X POST http://localhost:8000/auth/login `
     -H "Content-Type: application/json" `
     -d $body
```

**Resposta esperada:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 604800
}
```

---

## 📊 Passo 6: Verificar Logs

### Ver todos os logs
```powershell
docker compose logs
```

### Ver apenas backend
```powershell
docker compose logs backend
```

### Ver apenas frontend
```powershell
docker compose logs frontend
```

### Seguir logs em tempo real
```powershell
docker compose logs -f
```

### Últimas 50 linhas
```powershell
docker compose logs --tail=50
```

---

## 🛑 Passo 7: Parar Sistema

### Parar e manter dados
```powershell
docker compose down
```

### Parar e limpar volumes (apaga banco!)
```powershell
docker compose down -v
```

---

## 🔄 Passo 8: Reiniciar Sistema

### Reiniciar tudo
```powershell
docker compose restart
```

### Reiniciar apenas backend
```powershell
docker compose restart backend
```

### Reiniciar apenas frontend
```powershell
docker compose restart frontend
```

---

## 📦 Passo 9: Verificar Status dos Containers

```powershell
docker compose ps
```

**Saída esperada:**
```
NAME             COMMAND                  STATUS         PORTS
bingo_backend    "uvicorn src.main:ap…"   Up 2 minutes   0.0.0.0:8000->8000/tcp
bingo_frontend   "npm run dev"            Up 2 minutes   0.0.0.0:5173->5173/tcp
```

---

## 🗄️ Passo 10: Verificar Banco de Dados

### Verificar arquivo SQLite
```powershell
Test-Path backend\data\bingo.db
```

**Deve retornar:** `True`

### Ver tamanho do banco
```powershell
(Get-Item backend\data\bingo.db).Length / 1KB
```

**Deve retornar:** Algo entre 20-100 KB (banco com seed inicial)

---

## 🐛 Diagnóstico de Problemas

### Frontend não carrega (página em branco)
```powershell
# Ver erros do frontend
docker compose logs frontend | Select-String "error"

# Verificar se porta está sendo usada
netstat -ano | findstr :5173

# Reiniciar container
docker compose restart frontend
```

### Backend retorna 500 Internal Server Error
```powershell
# Ver erros do backend
docker compose logs backend | Select-String "error"

# Verificar conexão com banco
docker compose exec backend python -c "from src.db.base import engine; engine.connect()"

# Reiniciar container
docker compose restart backend
```

### Frontend não conecta ao backend (CORS)
```powershell
# Verificar se backend está rodando
curl http://localhost:8000/health

# Verificar variável de ambiente do frontend
docker compose exec frontend env | findstr VITE_API_URL
# Deve retornar: VITE_API_URL=http://localhost:8000
```

### Banco de dados vazio (sem paróquia)
```powershell
# Verificar se seed foi executado
docker compose logs backend | Select-String "seed"

# Recriar banco
docker compose down
Remove-Item backend\data\bingo.db
docker compose up
```

---

## ✅ Checklist Final

Execute todos os testes e marque:

- [ ] `.\install.ps1` executou sem erros
- [ ] `docker compose up --build` subiu os 3 containers
- [ ] GET `/health` retorna status healthy
- [ ] GET `/ping` retorna pong
- [ ] GET `/paroquia/me` retorna dados da paróquia
- [ ] Frontend carrega em http://localhost:5173
- [ ] Header mostra "Paróquia São José"
- [ ] Swagger UI carrega em http://localhost:8000/docs
- [ ] POST `/auth/signup` cria novo fiel
- [ ] POST `/auth/login` autentica fiel
- [ ] Backend hot-reload funciona
- [ ] Frontend hot-reload funciona
- [ ] `docker compose logs` mostra logs sem erros críticos
- [ ] Arquivo `backend/data/bingo.db` existe

---

## 🎉 Parabéns!

Se todos os testes passaram, sua instalação está **100% funcional**!

**Próximos passos:**
1. Implementar página de Login
2. Implementar página de Cadastro
3. Adicionar React Router
4. Estilizar com Tailwind/MUI

**Documentação:**
- [INTEGRACAO_FRONTEND_DOCKER.md](INTEGRACAO_FRONTEND_DOCKER.md)
- [RESUMO_INTEGRACAO.md](RESUMO_INTEGRACAO.md)
- [Dev. Guide.md](Dev.%20Guide.md)
