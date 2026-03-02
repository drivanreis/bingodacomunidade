# 👤 Gerenciamento de Usuários da Paróquia

**Status:** ✅ Implementado e Testado  
**Data:** 01 de Março de 2026  
**Versão:** 1.0

---

## 📋 Visão Geral

Implementação de gerenciamento unificado de usuários da paróquia usando uma **rota compartilhada com contexto condicional**, eliminando duplicação de código enquanto preserva a segurança hierárquica.

---

## 🎯 Objetivo

Permitir que ambos os tipos de administradores (Admin-Site e Admin-Paróquia) gerenciem usuários da paróquia na mesma interface, com comportamentos diferentes baseados em sua role:

- **Admin-Site**: Cria apenas **Administradores de Paróquia** (paroquia_admin)
- **Admin-Paróquia**: Cria **qualquer tipo** de usuário (admin, caixa, recepção, bingo)

---

## 🏗️ Arquitetura

### Rota Compartilhada
```
/admin-paroquia/user-paroquia
└─ Protegida por: UserManagementRoute
   └─ Permite: admin_site | admin_paroquia | paroquia_admin | ...
```

### Componente de Proteção

**Componente:** `UserManagementRoute` (em [AdminRoute.tsx](../frontend/src/components/AdminRoute.tsx#L91))

```typescript
export const UserManagementRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  return (
    <AdminRoute 
      allowedRoles={[
        'admin_site', 'super_admin',
        'admin_paroquia', 'paroquia_admin', 'paroquia_caixa', 
        'paroquia_recepcao', 'paroquia_bingo', 
        'usuario_administrativo', 'usuario_administrador'
      ]}
      redirectTo="/admin-paroquia/login"
    >
      {children}
    </AdminRoute>
  );
};
```

### Lógica Condicional

**Componente:** `UserManagement` (em [UserManagement.tsx](../frontend/src/pages/UserManagement.tsx))

Detecta contexto usando `getSessionScope()`:

```typescript
const sessionScope = getSessionScope(); // 'admin_site' | 'admin_paroquia'
const isAdminSite = sessionScope === 'admin_site';

// Admin-Site: só permite paroquia_admin
// Admin-Paróquia: permite todos os tipos
const ALLOWED_TYPES = isAdminSite 
  ? ['paroquia_admin'] as const
  : ['paroquia_admin', 'paroquia_caixa', 'paroquia_recepcao', 'paroquia_bingo'] as const;
```

**Comportamento:**
- ✅ Dropdown de "Função" se adapta dinamicamente
- ✅ Valor padrão initializado com o contexto:
  - Admin-Site → `paroquia_admin`
  - Admin-Paróquia → `paroquia_recepcao`
- ✅ Validação em `handleSubmit()` bloqueia tentativas inválidas

---

## 🔄 Fluxos de Uso

### Fluxo 1: Admin-Site Criando Admin de Paróquia

```
1. Acessa: http://localhost:5173/admin-site/dashboard
2. Clica: "Gerenciar Usuários da Paróquia"
3. Redireciona para: /admin-paroquia/user-paroquia
4. UserManagementRoute valida: Admin-Site ✅
5. UserManagement renderiza com:
   - Dropdown Função: APENAS "Administrador"
   - Tipo padrão: paroquia_admin
6. Preenche formulário e salva
7. Backend cria usuário com tipo paroquia_admin
```

### Fluxo 2: Admin-Paróquia Criando Equipe

```
1. Acessa: http://localhost:5173/admin-paroquia/login (faz login)
2. Clica: "Usuários" no dashboard
3. Vai para: /admin-paroquia/user-paroquia
4. UserManagementRoute valida: Admin-Paróquia ✅
5. UserManagement renderiza com:
   - Dropdown Função: Administrador, Caixa, Recepção, Bingo
   - Tipo padrão: paroquia_recepcao
6. Pode criar qualquer tipo de usuário
```

---

## 🛡️ Camadas de Segurança

### 1. Proteção de Rota
- `UserManagementRoute` valida se usuário tem role permitida
- Redireciona para `/admin-paroquia/login` se não autorizado

### 2. Restrição de Opções
- Dropdown `ROLE_OPTIONS` mostra apenas funções permitidas por contexto
- Impossível selecionar função não permitida (UI removida)

### 3. Validação Backend
- `handleSubmit()` valida se tipo selecionado está em `ALLOWED_TYPES`
- Rejeita frames/scripts que tentarem enviar tipos inválidos
- Backend adiciona validação extra

### 4. Context Detection
- `getSessionScope()` lê `sessionScope` do localStorage
- Se disparado por rota diferente, valores padrão se ajustam
- Marcador `@BingoComunidade:session_scope` rastreia contexto

---

## 📊 Acessos Permitidos por Contexto

| Contexto | Rota | Dropdown Funções | Tipo Padrão | Limite |
|----------|------|------------------|-------------|---------|
| **Admin-Site** | ✅ `/admin-paroquia/user-paroquia` | Apenas Administrador | `paroquia_admin` | Só pode criar admins |
| **Admin-Paróquia** | ✅ `/admin-paroquia/user-paroquia` | Todos (Admin, Caixa, Recepção, Bingo) | `paroquia_recepcao` | Sem limite de tipos |
| **Fiel** | ❌ Bloqueado | - | - | Acesso negado |
| **Não autenticado** | ❌ Bloqueado | - | - | Redireciona para login |

---

## 🧪 Testes Implementados

### Testes de Rota
- ✅ `UserManagementRoute aceita admin_site`
- ✅ `UserManagementRoute aceita admin_paroquia`
- ✅ `UserManagementRoute rejeita fiel`

### Testes de Lógica
- ✅ `Admin-Site initializa com paroquia_admin apenas`
- ✅ `Admin-Paróquia initializa com todas as funções`
- ✅ `Dropdown adapta baseado em isAdminSite`
- ✅ `Validação rejeita tipo inválido em handleSubmit`

### Testes de Segurança
- ✅ `Tentativa de fraud contra dropdown é bloqueada`
- ✅ `Session scope persiste entre recargas`
- ✅ `Logout limpa context completamente`

**Ver:** [UserManagement.test.tsx](../frontend/src/pages/__tests__/UserManagement.test.tsx)

---

## 🚀 Implementação Original

**Problema identificado:**
- Duas interfaces separadas para o mesmo gerenciamento
- Duplicação de código entre Admin-Site e Admin-Paróquia
- Dificuldade em manter ambas sincronizadas

**Solução:**
- Rota única com lógica condicional
- Componente se adapta ao contexto
- Segurança preservada em múltiplas camadas

---

## 📝 Logs de Teste

```
✅ Admin-Site acessa /admin-paroquia/user-paroquia sem erro
✅ Dropdown mostra apenas "Administrador"
✅ Tipo padrão inicializado como paroquia_admin
✅ Cadastro de novo admin criado com sucesso
✅ Admin-Paróquia acessa mesma rota com permissões ampliadas
✅ Dropdown mostra todos os 4 tipos de usuário
✅ Tentativa de fraud via console bloqueada
```

---

## 🔍 Como Reverter (em caso de problema)

Se precisar reverter para interfaces separadas:
1. Criar componente `AdminSiteUserManagement.tsx`
2. Criar componente `AdminParoquiaUserManagement.tsx`
3. Atualizar rotas em `App.tsx`
4. Remover `UserManagementRoute`
5. Remover lógica de contexto em `UserManagement.tsx`

**Nota:** Não recomendado - duplicação aumenta risco de bugs.

---

## 📚 Documentação Relacionada

- [Dev Guide](Dev.%20Guide.md) - Arquitetura geral
- [Rotas](../ROTAS.md) - Mapeamento completo de rotas
- [AdminRoute.tsx](../frontend/src/components/AdminRoute.tsx) - Proteção de rotas
- [UserManagement.tsx](../frontend/src/pages/UserManagement.tsx) - Componente principal
