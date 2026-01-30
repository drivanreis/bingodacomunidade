# 🚀 Deploy em Produção - Sistema de Primeiro Acesso

## 🎯 Objetivo

Este guia mostra como colocar o sistema em produção **SEM usuários de teste**, usando o sistema de primeiro acesso seguro.

---

## 📋 Checklist de Deploy

### 1️⃣ Configurar Variável de Ambiente

Edite `docker-compose.yml` e altere:

```yaml
environment:
  - SEED_ENABLED=false  # ← Mudança crítica para produção
```

### 2️⃣ Desabilitar Email de Desenvolvimento

```yaml
environment:
  - EMAIL_DEV_MODE=false
  - SMTP_HOST=smtp.gmail.com
  - SMTP_PORT=587
  - SMTP_USER=seu_email@gmail.com
  - SMTP_PASSWORD=sua_senha_de_app
  - FROM_EMAIL=seu_email@gmail.com
  - FROM_NAME=Bingo da Comunidade
```

### 3️⃣ Iniciar Sistema

```bash
docker compose up -d --build
```

### 4️⃣ Acessar Sistema Pela Primeira Vez

1. Abra o navegador em: `http://seu-servidor.com:5173`
2. Sistema detecta que está vazio
3. Aparece tela de **"Primeiro Acesso"**
4. Preencha os dados do Desenvolvedor:
   - Nome completo
   - CPF (usado para login)
   - Email
   - WhatsApp
   - Senha forte (maiúscula, minúscula, número, especial)

5. Clique em **"Criar Conta e Começar"**
6. Login automático → Dashboard

### 5️⃣ Verificar Logs

```bash
docker logs bingo_backend
```

Você deve ver:

```
🔒 SEED_ENABLED=false → Modo Produção
   Use o sistema de 'primeiro acesso' para criar o administrador
```

---

## 🔐 Segurança Crítica

### Esta Tela Aparece Apenas UMA Vez

✅ Sistema verifica: `SELECT COUNT(*) FROM usuario WHERE tipo = 'SUPER_ADMIN'`

✅ Se COUNT = 0 → Mostra tela de primeiro acesso  
✅ Se COUNT > 0 → Redireciona para login normal

### Proteções Implementadas

1. **Verificação Dupla:**
   - Frontend checa `GET /auth/first-access`
   - Backend valida no `POST /auth/first-access-setup`

2. **Impossível Criar Segundo Admin:**
   ```python
   if super_admin_count > 0:
       raise HTTPException(403, "Sistema já foi configurado")
   ```

3. **Senha Forte Obrigatória:**
   - Mínimo 6 caracteres
   - Maiúscula + minúscula
   - Número + caractere especial

---

## 🧪 Testar Sistema de Primeiro Acesso

### Modo 1: Desenvolvimento com Seed (Padrão)

```yaml
environment:
  - SEED_ENABLED=true
```

✅ Cria 3 usuários de teste automaticamente  
✅ Login com: CPF `111.444.777-35` / Senha `Fiel@123`

### Modo 2: Produção sem Seed

```yaml
environment:
  - SEED_ENABLED=false
```

✅ Banco vazio  
✅ Tela de primeiro acesso aparece  
✅ Você cria o Desenvolvedor manualmente

---

## 🔄 Resetar Sistema (Testar Primeiro Acesso)

Para testar a tela de primeiro acesso em ambiente local:

```bash
# 1. Parar sistema
docker compose down

# 2. Alterar SEED_ENABLED para false
# Edite docker-compose.yml:
#   - SEED_ENABLED=false

# 3. Reiniciar
docker compose up -d --build

# 4. Acessar
# Navegador: http://localhost:5173
# Você verá a tela de "Bem-vindo! Configure sua conta de Desenvolvedor"
```

---

## 📊 Comparação: Desenvolvimento vs Produção

| Aspecto | DESENVOLVIMENTO | PRODUÇÃO |
|---------|----------------|----------|
| **SEED_ENABLED** | `true` | `false` |
| **Usuários iniciais** | 3 criados automaticamente | Nenhum (banco vazio) |
| **Primeiro acesso** | Ignorado (já tem admin) | Tela de setup aparece |
| **Credenciais** | Hardcoded no seed.py | Criadas pelo usuário |
| **Segurança** | Senhas de teste conhecidas | Senha forte do admin |

---

## ⚠️ Importante

### Em Produção NUNCA:
- ❌ Deixe `SEED_ENABLED=true`
- ❌ Use senhas de teste do seed.py
- ❌ Exponha credenciais na documentação
- ❌ Esqueça de configurar SMTP real

### Em Produção SEMPRE:
- ✅ Use `SEED_ENABLED=false`
- ✅ Configure SMTP real (EMAIL_DEV_MODE=false)
- ✅ Crie primeiro admin pela tela de setup
- ✅ Use senhas fortes e únicas
- ✅ Faça backup do banco de dados

---

## 🎉 Pronto!

Seu sistema está configurado com segurança de nível bancário:
- 🔒 Primeiro acesso protegido (só funciona uma vez)
- 🕒 Inatividade automática (15 minutos)
- 🔑 Token JWT (16 horas)
- 🛡️ Proteção contra brute-force
- 📧 Verificação de email obrigatória

**Logs do Backend:**
```bash
docker logs -f bingo_backend
```

**Acesso ao Sistema:**
```
Frontend: http://localhost:5173
Backend API: http://localhost:8000/docs
```
