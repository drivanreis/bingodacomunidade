# 📋 TPIC - Fluxo Esperado das Fases

## Resumo Visual do Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│ FASE 1: Setup Automático                                    │
├─────────────────────────────────────────────────────────────┤
│ 1. Executar limpa.sh (reset Docker total)                   │
│ 2. Executar install.sh (instalar dependências)              │
│ 3. Executar start.sh (iniciar aplicação)                    │
│ 4. Aguardar backend (localhost:8000)                        │
│ 5. Aguardar frontend (localhost:5173)                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ FASE 2: Teste Admin Padrão                                  │
├─────────────────────────────────────────────────────────────┤
│ 1. Acessar http://localhost:5173/                           │
│ 2. Navegar para /admin-site (redireciona para login)        │
│ 3. Login: Admin / admin123                                  │
│ 4. Responder "mude sua senha"                               │
│ 5. Preencher primeiro acesso em first-access-setup          │
│ 6. Redireciona para /admin-site/dashboard                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ FASE 3: Cadastro Admin Paróquia                             │
├─────────────────────────────────────────────────────────────┤
│ 1. Acessar /admin-site/paroquias (gerenciadordor)           │
│ 2. Clique em "+ Nova Paróquia"                              │
│ 3. Preenche dados:                                          │
│    - Nome: "Paróquia TPIC HHMMSS"                           │
│    - Email: "paroquia@tpic.test"                            │
│    - Telefone: "(85) 99999-9999"                            │
│    - Chave PIX: "chave-pix@tpic"                            │
│ 4. Submit do formulário                                      │
│ 5. Criar usuário admin para a paróquia (se houver opção)    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ FASE 4: Teste Admin Paróquia                                │
├─────────────────────────────────────────────────────────────┤
│ 1. Logout do admin anterior                                 │
│ 2. Acessar /admin-paroquia/login                            │
│ 3. Login: admin_paroquia@paroquia.com / senha123            │
│ 4. Redireciona para /admin-paroquia/dashboard               │
│ 5. Validar elementos do dashboard                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ FASE 5: Teste Usuário Comum                                 │
├─────────────────────────────────────────────────────────────┤
│ 1. Logout (limpar localStorage)                             │
│ 2. Acessar http://localhost:5173/ (home pública)            │
│ 3. Navegar para /signup (formulário de cadastro)            │
│ 4. Preencher:                                               │
│    - Nome: "Usuário TPIC HHMMSS"                            │
│    - Email: "userHHMMSS@tpic.test"                          │
│    - CPF: "12345678901"                                     │
│    - Telefone: "85999999999"                                │
│    - Senha: "Senha@123"                                     │
│ 5. Submit do formulário                                      │
│ 6. Validar sucesso (mensagem ou redirecionamento)           │
└─────────────────────────────────────────────────────────────┘
```

## Detalhes de Cada Fase

### FASE 1: Setup Automático

**O que é testado:**
- Capacidade de criar ambiente limpo
- Instalação de dependências funciona
- Aplicação inicia e fica acessível

**URLs esperadas:**
```
Backend: http://localhost:8000 (deve retornar 200 em /docs)
Frontend: http://localhost:5173 (deve carregar página)
```

**Critério de sucesso:**
- ✓ limpa.sh executado com sucesso
- ✓ install.sh executado com sucesso
- ✓ start.sh iniciado
- ✓ Backend acessível
- ✓ Frontend carrega

**Se falhar:**
- Verificar se Docker está instalado e rodando: `docker --version`
- Verificar se Docker Compose está instalado: `docker compose version`
- Verificar logs: `docker compose logs`
- Aumentar timeout em `config.py`: `NAVIGATION_TIMEOUT = 120000`

---

### FASE 2: Teste Admin Padrão (Bootstrap)

**O que é testado:**
- Sistema de bootstrap com Admin/admin123 funciona
- Primeiro acesso obriga troca de senha
- Fluxo completo de setup inicial

**Credenciais:**
- Usuário: `Admin`
- Senha: `admin123`
- Email: (será preenchido no primeiro acesso)

**URLs esperadas:**
```
Home: http://localhost:5173/
Admin Site: http://localhost:5173/admin-site → redireciona para login
Login: http://localhost:5173/admin-site/login
First Access: http://localhost:5173/admin-site/first-access-setup
Dashboard: http://localhost:5173/admin-site/dashboard
```

**Seletores esperados:**
```javascript
Login:
- input[name='username'] (ou input[type='text'])
- input[name='password'] (ou input[type='password'])
- button[type='submit']

Mensagem de troca de senha:
- button:has-text('OK')
- button:has-text('Entendido')
- .modal ou .dialog

First Access Form:
- input para nome
- input para email
- input para CPF
- input para DDD
- input para telefone
- input para senha
- input para confirmar senha
- button[type='submit']
```

**Critério de sucesso:**
- ✓ Homepage carrega
- ✓ Redirecionamento para login funciona
- ✓ Login com Admin/admin123 funciona
- ✓ Mensagem de mudança de senha aparece
- ✓ Primeiro acesso pode ser preenchido
- ✓ Redirecionamento para dashboard

**Se falhar:**
- Verificar credenciais no backend (verificar bootstrap)
- Verificar se a página de login tem os campos corretos
- Verificar console do navegador para erros JavaScript
- Aumentar `slow_mo` em `config.py` para ver ações mais lentamente

---

### FASE 3: Cadastro Admin Paróquia

**O que é testado:**
- Criação de paróquia no admin-site
- Preenchimento de formulário de paróquia
- Possivelmente criação de admin paroquial

**URLs esperadas:**
```
Paroquias: http://localhost:5173/admin-site/paroquias
Modal/Form: dinâmico (pode ser modal ou nova página)
```

**Dados de teste:**
```python
Nome: "Paróquia TPIC HHMMSS" (timestamp dinâmico)
Email: "paroquia@tpic.test"
Telefone: "(85) 99999-9999"
Chave PIX: "chave-pix@tpic"
```

**Seletores esperados:**
```javascript
Gerenciador:
- button:has-text('Nova Paróquia')
- button:has-text('+ Nova')
- button:has-text('Criar')

Formulário:
- input para nome
- input para email
- input para telefone
- input para chave PIX
- input para CNPJ (opcional)
- button[type='submit']

Usuários (se houver):
- inputs para nome, email, CPF, telefone
- button para criar usuário
```

**Critério de sucesso:**
- ✓ Acessa /admin-site/paroquias
- ✓ Formulário de paróquia abre
- ✓ Formulário pode ser preenchido
- ✓ Paróquia é criada (validação: retorna ao gerenciador)
- ✓ Opção para criar admin paroquial (opcional)

**Se falhar:**
- Verificar se API de paróquias está funcionando
- Verificar se há permissão para criar paróquias
- Verificar se formulário tem todos os campos esperados
- Consultar console do navegador

---

### FASE 4: Teste Admin Paróquia

**O que é testado:**
- Login como administrador paroquial funciona
- Dashboard paroquial é acessível
- Permissões e papéis funcionam corretamente

**Credenciais (criadas na Fase 3):**
- Email: `admin_paroquia@paroquia.com`
- Senha: `senha123`

**URLs esperadas:**
```
Login: http://localhost:5173/admin-paroquia/login
Dashboard: http://localhost:5173/admin-paroquia/dashboard
```

**Seletores esperados:**
```javascript
Login:
- input[type='text'] ou input[type='email'] (username/email)
- input[type='password']
- button[type='submit']

Dashboard:
- h1:has-text('Admin Paróquia')
- h1:has-text('Dashboard')
- .apd-title (ou classe do dashboard)
- button:has-text('🚪 Sair')
```

**Critério de sucesso:**
- ✓ Logout funciona
- ✓ Acessa /admin-paroquia/login
- ✓ Login com credenciais de admin paroquial funciona
- ✓ Redirecionamento para dashboard
- ✓ Dashboard paroquial carrega com elementos esperados

**Se falhar:**
- Verificar se admin paroquial foi criado na Fase 3
- Verificar credenciais em `config.py` (`ADMIN_PAROQUIA_TEMP`)
- Verificar permissões/papéis do usuário no backend
- Verificar se /admin-paroquia/login existe e é acessível

---

### FASE 5: Teste Usuário Comum

**O que é testado:**
- Cadastro de usuário comum funciona
- Fluxo público está aberto
- Formulário de signup/cadastro funciona

**URLs esperadas:**
```
Home: http://localhost:5173/
Signup: http://localhost:5173/signup (ou /cadastro, /register)
Dashboard: http://localhost:5173/dashboard (após sucesso)
```

**Dados de teste:**
```python
Nome: "Usuário TPIC HHMMSS"
Email: "userHHMMSS@tpic.test"
CPF: "12345678901"
Telefone: "85999999999"
Senha: "Senha@123"
```

**Seletores esperados:**
```javascript
Home:
- button:has-text('Cadastro')
- button:has-text('Criar Conta')
- a:has-text('Cadastre-se')
- a[href*='signup']

Signup Form:
- input para nome
- input para email
- input para CPF
- input para telefone
- input para senha
- input para confirmar senha
- button[type='submit']

Sucesso:
- text com "Cadastro realizado"
- text com "Bem-vindo"
- .alert-success
- Redirecionamento para /dashboard
```

**Critério de sucesso:**
- ✓ Homepage carrega com opcão de cadastro
- ✓ Formulário de cadastro acessível
- ✓ Todos os campos podem ser preenchidos
- ✓ Formulário pode ser submetido
- ✓ Mensagem de sucesso aparece ou redireciona

**Se falhar:**
- Verificar se /signup existe ou tem outro path
- Verificar validações de CPF/Email/Telefone
- Verificar se há captcha ou outras barreiras
- Verificar logs do backend para erros de validação

---

## Troubleshooting Geral

### Problema: "Página não carregou"
```bash
# Aumentar timeout em config.py
NAVIGATION_TIMEOUT = 60000  # 60s ao invés de 30s
```

### Problema: "Botão não encontrado"
```python
# TPIC tenta cada seletor em ordem. Se nenhum funcionar, avisoé gerado.
# Solução: Inspecionar página e adicionar seletor correto em config ou phases.py
```

### Problema: "Elemento não visível"
```python
# Adicionar delay antes de clicar
await asyncio.sleep(1)  # Aguardar 1 segundo
```

### Problema: "CPF/Email inválido"
```python
# Usar dados reais para teste, ou ajustar validação no frontend
# Verificare config.py para dados de teste
```

### Problema: "Arquivo de screenshot não criado"
```bash
# Verificar permissões
chmod -R 777 tpic/reports/screenshots
```

---

## Dicas de Debugging

### 1. Executar apenas uma fase
```bash
python main.py --phase 2  # Apenas fase 2
python main.py --phase 3-5  # Fases 3, 4 e 5
```

### 2. Ver logs em tempo real
```bash
tail -f tpic/logs/tpic_*.log
```

### 3. Inspecionar relatório
```bash
open tpic/reports/report_*.html  # macOS
xdg-open tpic/reports/report_*.html  # Linux
start tpic/reports/report_*.html  # Windows
```

### 4. Aumentar visibilidade
```python
# Em config.py
BROWSER_CONFIG = {
    "headless": False,    # Ver navegador
    "slow_mo": 2000,      # Delay 2s entre ações
}
```

### 5. Adicionar breakpoint
```python
# Em phases.py, dentro de async run():
import pdb; await asyncio.sleep(0)  # Pausar para debug
```

---

## Checklist Antes de Executar

- [ ] Docker instalado e rodando
- [ ] Docker Compose instalado
- [ ] Python 3.8+ instalado
- [ ] Dependências instaladas: `pip install -r requirements.txt`
- [ ] Chromium instalado: `python -m playwright install chromium`
- [ ] Porta 5173 e 8000 livres (não usadas por outro processo)
- [ ] Internet estável (para downloads iniciais)
- [ ] Espaço em disco (Docker + imagens)

---

**Última atualização:** 10 de março de 2026
