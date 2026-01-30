# 🔒 SISTEMA DE SEGURANÇA NÍVEL BANCÁRIO - IMPLEMENTADO

**Data:** 25/01/2026  
**Versão:** 1.0.0

---

## 🎯 VISÃO GERAL

O Sistema de Bingo Comunitário agora possui segurança equivalente a aplicativos bancários, pois **lida com dinheiro real**. Todas as configurações estão centralizadas e podem ser ajustadas pelo Super Admin.

---

## ⚙️ CONFIGURAÇÕES IMPLEMENTADAS

### 📍 Local: `frontend/src/config/appConfig.ts`

Todas as configurações de segurança estão neste arquivo e podem ser ajustadas:

```typescript
{
  // SEGURANÇA
  tokenExpirationHours: 16,        // Token JWT válido por 16 horas
  inactivityTimeout: 15,           // Logout após 15 min de inatividade
  inactivityWarningMinutes: 2,     // Avisa 2 min antes de deslogar
  maxLoginAttempts: 5,             // Bloqueia após 5 tentativas
  lockoutDuration: 15,             // Bloqueio de 15 minutos
  
  // CARRINHO
  cartExpirationMinutes: 30,       // Cartelas não pagas expiram em 30 min
  autoCleanExpiredCarts: true,     // Limpa jogos que já iniciaram
  autoCleanFinishedGameCarts: true, // Limpa jogos finalizados
  
  // FORMULÁRIOS
  warnOnUnsavedForm: true,         // Avisa ao sair sem salvar
  
  // RECUPERAÇÃO DE SENHA
  passwordResetTokenMinutes: 30,   // Token válido por 30 min
}
```

---

## 🔐 FUNCIONALIDADES DE SEGURANÇA

### 1. Token JWT com Expiração Curta

**Backend:** `backend/src/utils/auth.py`
```python
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 16  # 16 horas
```

**Benefício:**
- ✅ Mesmo padrão de bancos digitais
- ✅ Reduz janela de ataque se token for roubado
- ✅ Força renovação periódica

---

### 2. Logout Automático por Inatividade

**Hook:** `frontend/src/hooks/useInactivityTimeout.ts`

**Comportamento:**
1. Monitora atividade do usuário (mouse, teclado, scroll, touch)
2. Após 15 minutos sem atividade, mostra aviso
3. Conta regressiva de 2 minutos
4. Se usuário não interagir, faz logout automático

**Eventos monitorados:**
- ✅ Movimento do mouse
- ✅ Cliques
- ✅ Teclas pressionadas
- ✅ Scroll da página
- ✅ Touch (mobile)

**Componente:** `frontend/src/components/InactivityWarning.tsx`

Modal visual que exibe:
```
⚠️ Sessão Expirando

Por segurança, você será desconectado em:
2:00

Mova o mouse ou pressione qualquer tecla para continuar.
```

---

### 3. Proteção de Formulários Não Salvos

**Hook:** `frontend/src/hooks/useFormProtection.ts`

**Comportamento:**
```typescript
// Uso em componente
const [isDirty, setIsDirty] = useState(false);
useFormProtection(isDirty);

// Quando modificar formulário:
setIsDirty(true);

// Após salvar:
setIsDirty(false);
```

**Proteções:**
- ✅ Avisa ao navegar para outra página
- ✅ Avisa ao fechar aba/navegador
- ✅ Mensagem: "Você tem alterações não salvas. Se sair, perderá tudo. Tem certeza?"

---

## 🛒 GERENCIAMENTO INTELIGENTE DE CARRINHO

### Analogia com Leilão

**"Quando o martelo bate, acabou para todos!"**

### Regras do Carrinho

**Arquivo:** `frontend/src/utils/carrinhoManager.ts`

#### 1️⃣ Cartelas PAGAS
```
✅ Salvam no BANCO DE DADOS
✅ Associadas ao usuário
✅ Permanentes
✅ Não expiram
```

#### 2️⃣ Cartelas NÃO PAGAS (Jogos Futuros)
```
📦 Salvam no localStorage
⏰ Expiram após 30 minutos
🔄 Podem ser recuperadas se navegador não for fechado
```

#### 3️⃣ Limpeza Automática

O sistema limpa automaticamente:

```typescript
// Limpa a cada 1 minuto
setInterval(limparItensExpirados, 60000);
```

**Remove cartelas não pagas quando:**
- ⏰ Passou dos 30 minutos no carrinho
- 🔨 Jogo já iniciou (status = 'active')
- 🏁 Jogo finalizou (status = 'finished')
- 📅 Data de início do jogo já passou

**Exemplo de log:**
```
🔨 Removendo cartela de jogo que já iniciou: Bingo de São João
⏰ Removendo cartela de jogo que já deveria ter começado: Bingo da Páscoa
✅ Carrinho limpo: 3 itens removidos
```

---

## 🔄 FLUXO COMPLETO DE SEGURANÇA

### Cenário 1: Usuário Normal

```
1. Usuário faz login
   ↓
2. Recebe token JWT válido por 16 horas
   ↓
3. Sistema monitora inatividade
   ↓
4. Se ficar 15 min sem usar:
   → Mostra aviso com countdown (2 min)
   → Se não interagir, faz logout
   → Se interagir, reseta timer
   ↓
5. Ao fechar navegador:
   → Token persiste no localStorage
   → Ao reabrir, continua logado (se não expirou 16h)
```

### Cenário 2: Carrinho de Cartelas

```
1. Usuário adiciona cartelas ao carrinho
   ↓
2. Cartelas ficam no localStorage
   ↓
3. Sistema verifica a cada 1 minuto:
   ✅ Jogo ainda não começou? → Mantém
   ❌ Jogo já iniciou? → Remove automaticamente
   ❌ Passou 30 min? → Remove automaticamente
   ↓
4. Usuário paga as cartelas:
   → Movem do localStorage para o banco
   → Ficam permanentemente associadas ao usuário
```

### Cenário 3: Formulário Não Salvo

```
1. Admin está criando um jogo
   ↓
2. Preenche campos (isDirty = true)
   ↓
3. Tenta sair da página:
   → Sistema bloqueia navegação
   → Mostra: "Tem certeza? Perderá tudo!"
   → Usuário confirma ou cancela
   ↓
4. Se fechar aba:
   → Navegador mostra aviso nativo
   → "Você tem alterações não salvas"
```

---

## 📊 INTEGRAÇÃO COM BACKEND

### Token JWT

**Backend gera:**
```python
create_access_token(
    data={
        "sub": usuario.id,
        "cpf": usuario.cpf,
        "tipo": usuario.tipo.value
    }
)
# Expira em 16 horas
```

**Frontend valida:**
```typescript
// Interceptor verifica em cada requisição
if (error.response?.status === 401) {
  // Token expirado ou inválido
  logout();
  redirect('/login');
}
```

---

## 🎨 COMPONENTES CRIADOS

| Arquivo | Descrição |
|---------|-----------|
| `config/appConfig.ts` | Configurações centralizadas |
| `hooks/useInactivityTimeout.ts` | Monitor de inatividade |
| `hooks/useFormProtection.ts` | Proteção de formulários |
| `components/InactivityWarning.tsx` | Modal de aviso |
| `utils/carrinhoManager.ts` | Gerenciador de carrinho |
| `contexts/AuthContext.tsx` | Integração completa (atualizado) |

---

## ✅ CHECKLIST DE SEGURANÇA

- [x] Token JWT com expiração de 16 horas
- [x] Logout automático por inatividade (15 min)
- [x] Aviso visual antes de logout (2 min)
- [x] Proteção de formulários não salvos
- [x] Limpeza automática de carrinho
- [x] Bloqueio após 5 tentativas de login
- [x] Persistência inteligente (localStorage vs banco)
- [x] Monitoramento de atividade do usuário
- [x] Configurações centralizadas e ajustáveis

---

## 🚀 PRÓXIMOS PASSOS

### Fase 2: Backend de Configurações

1. Criar endpoint `/api/config` (apenas Super Admin)
2. Salvar configurações no banco de dados
3. Sincronizar frontend com backend
4. Painel de admin para ajustar configurações

### Fase 3: Auditoria

1. Log de todas as ações críticas
2. Histórico de logins
3. Rastreamento de transações
4. Alertas de segurança

---

## 📝 NOTAS IMPORTANTES

### ⚠️ Diferença: localStorage vs Banco

**localStorage (Temporário):**
- Cartelas não pagas
- Configurações de UI
- Tema escuro/claro
- Rascunhos de formulários

**Banco de Dados (Permanente):**
- Cartelas pagas
- Dados de usuário
- Histórico de transações
- Jogos e sorteios

### 🔒 Segurança em Produção

Antes de colocar em produção, configurar:

```bash
# .env
JWT_SECRET_KEY="chave-super-secreta-de-producao-muito-longa"
DATABASE_URL="postgresql://user:pass@host/db"
CORS_ORIGINS="https://seu-dominio.com"
```

---

## 📚 DOCUMENTAÇÃO RELACIONADA

- [MENSAGENS_ERRO.md](MENSAGENS_ERRO.md) - Guia de erros
- [QUEM_RESOLVE_O_QUE.md](QUEM_RESOLVE_O_QUE.md) - Suporte
- [INDICE_DOCUMENTACAO.md](INDICE_DOCUMENTACAO.md) - Índice geral

---

**Sistema implementado com segurança nível bancário! 🔒**
