# 🐳 Guia Rápido - Docker (Sistema de Bingo Comunitário)

> **"Sem mais .venv, sem mais scripts .bat, sem mais dor de cabeça no Windows!"**

---

## 🚀 INÍCIO RÁPIDO (3 COMANDOS)

### 1️⃣ Certifique-se de ter Docker instalado

```powershell
# Verifique se o Docker está rodando
docker --version
docker-compose --version
```

**Não tem Docker?** [Baixe aqui](https://docs.docker.com/desktop/install/windows-install/)

---

### 2️⃣ Entre na pasta do projeto

```powershell
cd C:\Users\EU\Documents\GitHub\bingodacomunidade
```

---

### 3️⃣ Inicie o sistema

```powershell
# Construir e iniciar em modo background
docker-compose up -d --build
```

**Pronto!** O sistema já está rodando! 🎉

---

## 🌐 ACESSANDO O SISTEMA

Após executar `docker-compose up -d`, acesse:

### 📖 **Documentação Interativa (Swagger)**
```
http://localhost:8000/docs
```
Interface gráfica para testar todas as APIs

### ✅ **Health Check**
```
http://localhost:8000/health
```
Verifica se o sistema está saudável

### 🔍 **Verificação Simples**
```
http://localhost:8000/ping
```
Resposta rápida "pong"

---

## 👤 CREDENCIAIS INICIAIS

O sistema já vem com usuários pré-cadastrados!

### 👑 **Super Admin** (Guardião da Infraestrutura)
- **Email:** `admin@bingodacomunidade.com.br`
- **Senha:** `Admin@2026`
- **Tipo:** Super Admin (acesso total)

### ⛪ **Parish Admin** (Operador da Paróquia)
- **Email:** `admin@paroquiasaojose.com.br`
- **Senha:** `Admin@2026`
- **Tipo:** Parish Admin
- **Paróquia:** Paróquia São José

### 🙏 **Fiel** (Exemplo de Participante)
- **Email:** `joao.exemplo@email.com`
- **Senha:** `Fiel@123`
- **Tipo:** Fiel

⚠️ **IMPORTANTE:** Mude essas senhas em produção!

---

## 📊 COMANDOS ÚTEIS

### Ver logs em tempo real
```powershell
docker-compose logs -f backend
```

### Parar o sistema
```powershell
docker-compose down
```

### Reiniciar o sistema
```powershell
docker-compose restart
```

### Reconstruir do zero (apaga dados!)
```powershell
docker-compose down -v
docker-compose up -d --build
```

### Ver status dos containers
```powershell
docker-compose ps
```

### Entrar no container (para debug)
```powershell
docker exec -it bingo_backend bash
```

---

## 📂 ONDE ESTÃO OS DADOS?

### 📁 **Banco de Dados SQLite**
```
backend/data/bingo.db
```

Este arquivo **persiste** mesmo se você recriar o container.

Para resetar tudo:
```powershell
# 1. Para o sistema
docker-compose down

# 2. Apague o banco
Remove-Item backend\data\bingo.db

# 3. Inicie novamente (recriará o banco)
docker-compose up -d
```

---

## ⚙️ PERSONALIZANDO A CONFIGURAÇÃO

Todas as configurações estão **transparentes** no arquivo:
```
docker-compose.yml
```

### Exemplo: Mudar dados do proprietário

Edite o arquivo `docker-compose.yml`:

```yaml
environment:
  # Seed Inicial - DADOS DO PROPRIETÁRIO
  - OWNER_NAME=Seu Nome Aqui
  - OWNER_EMAIL=seuemail@exemplo.com
  - OWNER_PASSWORD=SuaSenhaForte@2026
  
  # Paróquia Padrão
  - PARISH_NAME=Nome da Sua Paróquia
  - PARISH_EMAIL=contato@suaparoquia.com.br
  - PARISH_PIX=sua_chave_pix_aqui
```

Depois, reconstrua:
```powershell
docker-compose down
Remove-Item backend\data\bingo.db  # Apaga o banco antigo
docker-compose up -d --build
```

---

## 🐛 RESOLUÇÃO DE PROBLEMAS

### ❌ "Porta 8000 já está em uso"

**Causa:** Outro processo está usando a porta 8000

**Solução 1:** Parar o processo que está usando a porta
```powershell
# Encontrar o processo
netstat -ano | findstr :8000

# Matar o processo (substitua <PID> pelo número encontrado)
taskkill /PID <PID> /F
```

**Solução 2:** Usar outra porta no `docker-compose.yml`
```yaml
ports:
  - "8001:8000"  # Muda para 8001
```

---

### ❌ "Cannot connect to Docker daemon"

**Causa:** Docker Desktop não está rodando

**Solução:**
1. Abra o Docker Desktop
2. Aguarde aparecer "Docker is running"
3. Execute `docker-compose up -d` novamente

---

### ❌ "Container keeps restarting"

**Diagnóstico:** Ver logs para identificar o erro
```powershell
docker-compose logs backend
```

Erros comuns:
- **Import error:** Verifique se não falta nenhuma dependência
- **Permission denied:** Execute PowerShell como Administrador
- **Syntax error:** Verifique se o código Python está correto

---

## 🔥 MODO HOT-RELOAD (Desenvolvimento)

O sistema já está configurado para hot-reload! 

Qualquer mudança em arquivos `.py` dentro de `backend/src/` **reinicia automaticamente** a API.

Para desabilitar (produção), comente no `docker-compose.yml`:
```yaml
volumes:
  - ./backend/data:/app/data
  # - ./backend/src:/app/src  # <-- Comentar esta linha
```

---

## 🎯 PRÓXIMOS PASSOS

Agora que o sistema está rodando:

1. ✅ Acesse a documentação: http://localhost:8000/docs
2. ✅ Teste as credenciais iniciais
3. ✅ Familiarize-se com os endpoints
4. ✅ Comece a implementar as APIs de negócio (Fase 2)

---

## 📞 AJUDA

Se tiver problemas, verifique:
1. Docker Desktop está rodando?
2. Porta 8000 está livre?
3. Você está na pasta correta?
4. Executou `docker-compose up -d --build`?

**Logs são seus amigos:**
```powershell
docker-compose logs -f backend
```

---

**🎱 Desenvolvido com fé, transparência e tecnologia.**

**Que Deus abençoe cada bingo realizado com este sistema!** 🙏
