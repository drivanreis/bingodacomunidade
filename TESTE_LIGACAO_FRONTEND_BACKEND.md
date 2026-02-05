# 🔗 Teste de Ligação Frontend-Backend

## ✅ Verificações Realizadas

### Backend (main.py)
- ✅ Está limpo conforme acordado (Opção A)
- ✅ Apenas health checks + routers incluídos
- ✅ Arquivo: [backend/src/main.py](backend/src/main.py)
- ✅ CORS ativado para testes (allow_origins=["*"])
- ✅ Router de autenticação incluído

### Frontend (FirstAccessChecker)
- ✅ Componente desativado (retorna null)
- ✅ Nenhuma chamada a `/auth/first-access` mais no código
- ✅ Arquivo: [frontend/src/components/FirstAccessChecker.tsx](frontend/src/components/FirstAccessChecker.tsx)

### Páginas de Login
- ✅ AdminSiteLogin.tsx - Corretos (campo: login, nivel_acesso)
- ✅ FirstAccessSetup.tsx - Corretos (endpoint: /auth/bootstrap)

---

## 🔄 Como Testar a Ligação

### Passo 1: Limpar Cache do Browser
```bash
# Chrome/Edge: Ctrl+Shift+R (Windows) ou Cmd+Shift+R (Mac)
# Firefox: Ctrl+F5 (Windows) ou Cmd+Shift+R (Mac)
# Safari: Cmd+Shift+R
```

**OU** abra em modo incógnito (Ctrl+Shift+N no Chrome).

### Passo 2: Verificar Se Backend Está Rodando
```bash
# Terminal 1: Vá para a pasta backend
cd backend

# Execute o servidor
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

Você verá:
```
🚀 INICIANDO SERVIDOR - BINGO DA COMUNIDADE
✅ Banco de dados conectado com sucesso
✅ Schema de banco de dados inicializado
✅ SERVIDOR INICIADO COM SUCESSO
📍 Acesse a API em: http://localhost:8000
📖 Documentação em: http://localhost:8000/docs
```

### Passo 3: Verificar Se Frontend Está Rodando
```bash
# Terminal 2: Vá para a pasta frontend
cd frontend

# Instale dependências (primeira vez)
npm install

# Execute o servidor de desenvolvimento
npm run dev
```

Você verá:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

### Passo 4: Testar Primeira Ligação
1. Abra o browser: **http://localhost:5173**
2. Você deve estar na página inicial (Home)
3. Clique em "Admin-Site" ou vá para **http://localhost:5173/admin-site/login**

### Passo 5: Fazer o Primeiro Login
Na página de Admin-Site Login:
- **Usuário (login):** `Admin`
- **Senha:** `admin123`

**Resultado Esperado:**
- ✅ Login bem-sucedido
- ✅ Redirecionar para `/admin-site/dashboard`
- ✅ No console do browser, nenhum erro de CORS

### Passo 6: Se Não Funcionar, Fazer Bootstrap
Se der erro "Usuário não encontrado", significa que o banco está vazio. Faça bootstrap:

1. Vá para **http://localhost:5173/first-access-setup**
2. Preencha:
   - **Nome:** Admin
   - **Login:** Admin
   - **Email:** admin@test.com
   - **Senha:** admin123
3. Clique em "Criar Admin"

**Resultado Esperado:**
- ✅ Usuário criado
- ✅ Redirecionar para `/admin-site/dashboard` já autenticado

---

## 🐛 Diagnosticar Problemas

### Se Ver Erro CORS:
```
Access to XMLHttpRequest at 'http://localhost:8000/...' 
from origin 'http://localhost:5173' has been blocked by CORS policy.
```

**Solução:**
1. Verifique se o backend está rodando em `http://localhost:8000`
2. Verifique se em [backend/src/main.py](backend/src/main.py) tem `allow_origins=["*"]`
3. Hard refresh do browser (Ctrl+Shift+R)

### Se Ver Erro "Servidor indisponível ou bloqueio de segurança":
**Possíveis causas:**
1. Backend não está rodando → Execute `python -m uvicorn src.main:app --reload`
2. Backend está na porta errada → Deve estar em `8000`
3. Frontend está tentando porta errada → Verifique [frontend/src/services/api.ts](frontend/src/services/api.ts)

### Se Ver Erro 404 em `/auth/first-access`:
**Isso é do cache antigo!**
1. Hard refresh: Ctrl+Shift+R
2. Limpar dados do site:
   - Chrome: DevTools → Application → Clear site data
   - Firefox: Storage → Clear All
3. Abrir em incógnito
4. Limpar localStorage: `localStorage.clear()` no console

### Se Ver Erro "usuário não encontrado":
**Isso é esperado se o banco está vazio!**
1. Vá para `/first-access-setup`
2. Crie o primeiro admin seguindo os passos acima

---

## 📋 Checklist de Funcionamento

- [ ] Backend rodando em http://localhost:8000
- [ ] Frontend rodando em http://localhost:5173
- [ ] Acessar http://localhost:5173 mostra página inicial (sem erros de CORS)
- [ ] Clicar em Admin-Site leva a /admin-site/login
- [ ] Fazer bootstrap em /first-access-setup cria usuário com sucesso
- [ ] Fazer login com admin/admin123 leva a /admin-site/dashboard
- [ ] Dashboard mostra dados do usuário autenticado
- [ ] Console do browser não mostra erros de CORS
- [ ] Network tab mostra requisições sendo feitas em http://localhost:8000

---

## 🚀 Próximas Etapas

Após confirmar que tudo funciona:
1. ✅ Testar logout
2. ✅ Testar criação de Admin-Paroquia pelo Admin-Site
3. ✅ Testar login de FIEL (signup + login)
4. ✅ Testar recuperação de senha
5. ✅ Testar inatividade (logout automático)

