# 🧪 Teste Manual - Sistema de Primeiro Acesso

## 🎯 Objetivo

Testar o fluxo completo do sistema de primeiro acesso diretamente no navegador.

---

## 📋 Pré-requisitos

1. Sistema rodando:
   ```bash
   docker compose up -d
   ```

2. Navegador moderno (Chrome, Firefox, Edge)

---

## 🧪 Teste 1: Modo Desenvolvimento (SEED_ENABLED=true)

### Configuração Atual (Padrão)

```yaml
# docker-compose.yml
environment:
  - SEED_ENABLED=true  # ← Modo desenvolvimento
```

### Passos

1. **Acessar:** http://localhost:5173

2. **Resultado Esperado:**
   - ✅ Tela de **Home** ou **Login** aparece
   - ✅ NUNCA mostra tela de "Primeiro Acesso"
   - ✅ Sistema já tem 3 usuários de teste criados

3. **Fazer Login:**
   - CPF: `111.444.777-35`
   - Senha: `Fiel@123`
   - ✅ Login funciona normalmente

4. **Verificar API diretamente:**
   ```
   http://localhost:8000/auth/first-access
   ```
   
   **Resposta esperada:**
   ```json
   {
     "needs_setup": false,
     "message": "Sistema já configurado. Use a tela de login."
   }
   ```

### ✅ Checklist

- [ ] Home/Login aparece (não mostra primeiro acesso)
- [ ] Login com usuário de teste funciona
- [ ] API retorna `needs_setup: false`

---

## 🧪 Teste 2: Modo Produção (SEED_ENABLED=false)

### Alternar para Modo Produção

**Opção A - Script Automático:**
```bash
./alternar_modo.sh
# Escolher opção 2 (Modo PRODUÇÃO)
```

**Opção B - Manual:**

1. **Parar sistema:**
   ```bash
   docker compose down
   ```

2. **Editar `docker-compose.yml`:**
   ```yaml
   environment:
     - SEED_ENABLED=false  # ← Trocar de true para false
   ```

3. **Reiniciar:**
   ```bash
   docker compose up -d --build
   ```

4. **Aguardar 10 segundos** para backend inicializar

### Passos do Teste

#### 1️⃣ Verificar API

```
http://localhost:8000/auth/first-access
```

**Resposta esperada:**
```json
{
  "needs_setup": true,
  "message": "Sistema precisa ser configurado. Crie sua conta de desenvolvedor."
}
```

✅ **Checklist:**
- [ ] API retorna `needs_setup: true`

#### 2️⃣ Acessar Frontend

```
http://localhost:5173
```

**Resultado esperado:**
- ✅ Sistema detecta needs_setup=true
- ✅ Redireciona AUTOMATICAMENTE para `/first-access-setup`
- ✅ Aparece tela: **"🎉 Bem-vindo! Configure sua conta de Desenvolvedor"**

✅ **Checklist:**
- [ ] Redirecionamento automático funciona
- [ ] Tela de primeiro acesso aparece

#### 3️⃣ Preencher Formulário

**Dados de teste:**
- Nome: `Desenvolvedor Teste`
- CPF: `123.456.789-09` (válido)
- Email: `dev@teste.com`
- WhatsApp: `+55 (85) 98765-4321`
- Senha: `Teste@123`
- Confirmar Senha: `Teste@123`

**Validações a testar:**

a) **Senha Fraca:**
   - Digite: `senha123` (sem maiúscula e especial)
   - ❌ Deve mostrar erro

b) **Senhas Diferentes:**
   - Senha: `Teste@123`
   - Confirmar: `Teste@456`
   - ❌ Deve mostrar: "As senhas não coincidem"

c) **CPF Inválido:**
   - Digite: `111.111.111-11`
   - ❌ Deve mostrar erro de validação

d) **Dados Válidos:**
   - Preencher todos os campos corretamente
   - ✅ Botão fica habilitado

✅ **Checklist:**
- [ ] Validação de senha fraca funciona
- [ ] Validação de senhas diferentes funciona
- [ ] Validação de CPF funciona
- [ ] Formatação automática de CPF funciona (XXX.XXX.XXX-XX)
- [ ] Formatação automática de WhatsApp funciona (+55 XX XXXXX-XXXX)
- [ ] Botões de mostrar/ocultar senha funcionam

#### 4️⃣ Enviar Formulário

1. **Clicar em:** `🚀 Criar Conta e Começar`

2. **Resultado esperado:**
   - ✅ Loading: "Configurando..."
   - ✅ Request enviado para POST /auth/first-access-setup
   - ✅ Backend cria usuário
   - ✅ Retorna JWT token
   - ✅ Frontend faz login automático
   - ✅ Redireciona para `/dashboard`

3. **Verificar Console do Navegador (F12):**
   ```
   Network → POST /auth/first-access-setup
   Status: 201 Created
   Response: {access_token: "...", usuario: {...}}
   ```

✅ **Checklist:**
- [ ] Formulário enviado com sucesso
- [ ] Login automático funciona
- [ ] Redireciona para Dashboard
- [ ] Dados do usuário aparecem no Dashboard

#### 5️⃣ Verificar Proteção

1. **Abrir nova aba anônima (Ctrl+Shift+N)**

2. **Acessar:** http://localhost:5173

3. **Resultado esperado:**
   - ✅ Mostra tela de **Login** (NÃO mostra primeiro acesso)
   - ✅ Sistema detecta que já tem admin

4. **Verificar API:**
   ```
   http://localhost:8000/auth/first-access
   ```
   
   **Resposta esperada:**
   ```json
   {
     "needs_setup": false,
     "message": "Sistema já configurado. Use a tela de login."
   }
   ```

✅ **Checklist:**
- [ ] Tela de primeiro acesso NÃO aparece mais
- [ ] API retorna `needs_setup: false`
- [ ] Login normal funciona

#### 6️⃣ Tentar Burlar Sistema (Teste de Segurança)

**Teste A - Via API Direta:**
```bash
curl -X POST http://localhost:8000/auth/first-access-setup \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Hacker",
    "cpf": "98765432100",
    "email": "hacker@teste.com",
    "whatsapp": "+5585912345678",
    "senha": "Hack@123"
  }'
```

**Resposta esperada:**
```json
{
  "detail": "Sistema já foi configurado. Use a tela de login."
}
```

**Teste B - Via URL Direta:**
1. Acessar manualmente: http://localhost:5173/first-access-setup
2. Preencher formulário
3. Clicar em "Criar Conta"

**Resposta esperada:**
- ❌ Erro: "Sistema já foi configurado. Use a tela de login."

✅ **Checklist:**
- [ ] API bloqueia tentativa de criar segundo admin (403)
- [ ] Frontend mostra erro apropriado
- [ ] Proteção backend funciona

---

## 🔄 Restaurar Modo Desenvolvimento

### Opção A - Script Automático

```bash
./alternar_modo.sh
# Escolher opção 1 (Modo DESENVOLVIMENTO)
```

### Opção B - Manual

1. **Parar sistema:**
   ```bash
   docker compose down
   ```

2. **Editar `docker-compose.yml`:**
   ```yaml
   environment:
     - SEED_ENABLED=true  # ← Voltar para true
   ```

3. **Reiniciar:**
   ```bash
   docker compose up -d --build
   ```

---

## 📊 Resumo de Testes

### ✅ O Que Deve Funcionar

| Teste | SEED=true (Dev) | SEED=false (Prod) |
|-------|-----------------|-------------------|
| GET /auth/first-access | needs_setup: false | needs_setup: true |
| Tela de primeiro acesso | Nunca aparece | Aparece UMA vez |
| Login com CPF 11144477735 | ✅ Funciona | ❌ Não existe |
| POST /auth/first-access-setup | ❌ Erro 403 | ✅ Cria admin |
| Segundo POST /auth/first-access-setup | ❌ Erro 403 | ❌ Erro 403 |

---

## 🐛 Possíveis Problemas

### Problema 1: Tela de Primeiro Acesso não Aparece (SEED=false)

**Causa:** Frontend pode estar com cache

**Solução:**
```bash
# Limpar cache do navegador (Ctrl+Shift+Del)
# OU
docker compose restart frontend
# Aguardar 5 segundos e recarregar página (Ctrl+F5)
```

### Problema 2: API Retorna 404

**Causa:** Backend não recarregou os novos endpoints

**Solução:**
```bash
docker compose restart backend
sleep 5
# Testar novamente
```

### Problema 3: Erro 500 ao Criar Desenvolvedor

**Causa:** Validação de senha ou CPF falhou

**Solução:**
- Verificar logs: `docker logs bingo_backend`
- Verificar se senha tem: MAIÚSCULA, minúscula, número, especial
- Verificar se CPF tem 11 dígitos válidos

---

## 🎉 Checklist Final

### Backend
- [ ] GET /auth/first-access retorna needs_setup correto
- [ ] POST /auth/first-access-setup cria admin em banco vazio
- [ ] POST /auth/first-access-setup bloqueia segundo admin (403)
- [ ] Validação de senha forte funciona
- [ ] Logs mostram mensagens corretas

### Frontend
- [ ] FirstAccessChecker detecta needs_setup
- [ ] Redireciona automaticamente para /first-access-setup
- [ ] Formulário valida todos os campos
- [ ] Formatação de CPF funciona
- [ ] Formatação de WhatsApp funciona
- [ ] Login automático após sucesso
- [ ] Redireciona para Dashboard após criar conta

### Segurança
- [ ] Impossível criar segundo Super Admin
- [ ] Senha forte obrigatória
- [ ] CPF validado com Módulo 11
- [ ] Tela aparece apenas UMA vez
- [ ] Proteção funciona via API e via UI

---

## 📚 Referências

- **Documentação Técnica:** `SISTEMA_PRIMEIRO_ACESSO.md`
- **Deploy em Produção:** `DEPLOY_PRODUCAO.md`
- **Teste Automatizado:** `./test_first_access.sh`
- **Alternar Modos:** `./alternar_modo.sh`

---

**Status:** ✅ Testes aprovados  
**Ambiente:** Desenvolvimento restaurado  
**Próximo Passo:** Deploy em produção
