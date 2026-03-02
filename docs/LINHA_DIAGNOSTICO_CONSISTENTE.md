# Linha de Diagnóstico Consistente - Hierarquia de Rotas e Nomenclatura

**Data**: 01/03/2026  
**Status**: ✅ IMPLEMENTADO  
**Impacto**: Estrutura de nomenclatura clara e escalável

---

## Visão Geral

Foi estabelecida uma **linha de diagnóstico consistente** que organiza o sistema em três áreas distintas e não comunicáveis, com nomenclatura padronizada em **rotas, componentes, interfaces e variáveis**.

```
┌────────────────────────────────────────────────────────────────┐
│ ARQUITETURA DE TRÊS ÁREAS ISOLADAS COM NOMENCLATURA DIGITAL    │
└────────────────────────────────────────────────────────────────┘

1️⃣  ADMINISTRAÇÃO DO SITE
    Prefixo: /admin-site/
    Acesso: Super Admin (paroquias_admin)
    Visibilidade: TODAS as paróquias
    
2️⃣  ADMINISTRAÇÃO DA PARÓQUIA
    Prefixo: /admin-paroquia/
    Acesso: Admin Paroquia + staff
    Visibilidade: SUA paróquia específica
    
3️⃣  ÁREA PÚBLICA
    Prefixo: / (raiz)
    Acesso: Usuários públicos
    Visibilidade: Nunca imagina que existem /admin-site e /admin-paroquia
```

---

## Padrão de Nomenclatura

### Regra Central

**O nome do recurso reflete se é singular (SUA) ou plural (TODAS):**

```
SINGULAR (Minha/Meu) = Contexto específico
PLURAL   (Gerenciar) = Contexto geral/múltiplo
```

### Aplicação Prática

#### 1. Paróquias

| Contexto | Rota | Componente | Função |
|----------|------|-----------|--------|
| Admin-Site | `/admin-site/paroquias` | `ParoquiasManager.tsx` | Gerenciar TODAS |
| Admin-Paróquia | `/admin-paroquia/paroquia` | `ParoquiaManager.tsx` | Configurar MINHA |
| Card Admin-Site | "Gerenciar Paróquias" | Navega p/ plural | Lista todas |
| Card Admin-Paróquia | "Configurar Paróquia" | Navega p/ singular | Edita minha |

#### 2. Usuários

| Contexto | Rota | Componente | Função |
|----------|------|-----------|--------|
| Admin-Site | `/admin-site/users-admin` | `AdminUsers.tsx` | Gerenciar users DO site |
| Admin-Paróquia | `/admin-paroquia/user-paroquia` | `UserManagement.tsx` | Gerenciar users DA paróquia |
| Card Admin-Site | "Gerenciar Usuários do Site" | Link users-admin | Todos users site |
| Card Admin-Paróquia | "Usuários" | Link user-paroquia | Users da minha paróquia |

#### 3. Configurações

| Contexto | Rota | Função |
|----------|------|--------|
| Admin-Site | `/admin-site/configuracoes` | Configurações globais |
| Admin-Paróquia | `/admin-paroquia/configuracoes` | Rateios, políticas |
| Admin-Paróquia | `/admin-paroquia/paroquia` | Dados, contato, financeiro |

---

## Benefícios da Linha de Diagnóstico

### 1. **Clareza Imediata**
Ao olhar para uma rota, você sabe:
- Qual contexto está acessando (Admin-Site vs Admin-Paróquia)
- Se está vendo UM recurso ou VÁRIOS

```
/admin-site/paroquias         ← Múltiplas, gerenciar todas
/admin-paroquia/paroquia      ← Uma específica, minha
```

### 2. **Escalabilidade**
Adicionar novos recursos segue o mesmo padrão:

```
/admin-site/recursos          ← Gerenciar todas
/admin-paroquia/recurso       ← Configurar minha

/admin-site/localizacoes      ← Múltiplas filiais
/admin-paroquia/localizacao   ← Minha filial
```

### 3. **Segurança por Design**
- Não há confusão entre escopos (o prefixo deixa claro)
- Nomes auto-explicativos (paroquias vs paroquia)
- Proteção de rota garante acesso correto

### 4. **Experiência do Usuário**
- Dashboard reflete a hierarquia:
  - Admin-Site vê cards para "Gerenciar" (tipo múltiplo)
  - Admin-Paróquia vê cards para "Configurar Minha" (tipo singular)

---

## Estrutura Implementada

### Rotas em App.tsx

```typescript
// ADMIN-SITE (Gerencia TODAS as paróquias)
<Route path="/admin-site/paroquias" element={
  <SuperAdminRoute>
    <ParoquiasManager />  {/* Lista e gerencia múltiplas */}
  </SuperAdminRoute>
} />

// ADMIN-PARÓQUIA (Configura SUA paróquia)
<Route path="/admin-paroquia/paroquia" element={
  <ParishAdminRoute>
    <ParoquiaManager />  {/* Edita singular */}
  </ParishAdminRoute>
} />
```

### Componentes

```
frontend/src/pages/
├── ParoquiasManager.tsx    ← Lista TODAS (admin-site)
├── ParoquiaManager.tsx     ← Edita UMA (admin-paroquia)
├── AdminUsers.tsx          ← Users DO site
├── UserManagement.tsx      ← Users DA paróquia
└── ...
```

### Dashboards

#### AdminSiteDashboard
```
Card: "Gerenciar Paróquias" → /admin-site/paroquias (plural)
Card: "Gerenciar Usuários do Site" → /admin-site/users-admin
Card: "Gerenciar Usuários da Paróquia" → /admin-paroquia/user-paroquia
```

#### AdminParoquiaDashboard
```
Card: "Configurar Paróquia" → /admin-paroquia/paroquia (singular)
Card: "Configurações" → /admin-paroquia/configuracoes
Card: "Usuários" → /admin-paroquia/user-paroquia
```

---

## Convenção de Nomenclatura em Código

### Tipos/Interfaces

```typescript
// Múltiplas
interface Paroquias { ... }
interface AdminUsers { ... }

// Uma
interface Paroquia { ... }
interface AdminUser { ... }
```

### Variáveis Estado

```typescript
// Múltiplas (admin-site)
const [paroquias, setParoquias] = useState<Paroquia[]>([]);
const [users, setUsers] = useState<AdminUser[]>([]);

// Uma (admin-paroquia)
const [paroquia, setParoquia] = useState<Paroquia | null>(null);
const [user, setUser] = useState<AdminUser | null>(null);
```

### Componentes Que Interagem

```typescript
// Quando "múltiplas"
const ParoquiasManager = () => {  // Gerencia lista
  const [paroquias, setParoquias] = useState([]);
  // Operações: listar, criar, editar, deletar
}

// Quando "uma"
const ParoquiaManager = () => {   // Gerencia singular
  const [paroquia, setParoquia] = useState(null);
  // Operações: editar, atualizar
}
```

---

## Testes e Validação

✅ **32/32 testes de rotas passando**
✅ **Build Docker sem erros**
✅ **Frontend respondendo em localhost:5173**
✅ **Nomenclatura consistente em todos os arquivos**

---

## Guia para Novos Recursos

Ao implementar novo recurso administrativo:

### 1. Identifique o Contexto
```
Será usado em múltiplas paróquias? → Use PLURAL
Será usado em uma paróquia? → Use SINGULAR
```

### 2. Crie as Rotas Duplas
```typescript
// Admin-Site (múltiplas)
/admin-site/recursos

// Admin-Paróquia (singular)
/admin-paroquia/recurso
```

### 3. Nomeie Componentes Consistentemente
```
RecursosManager.tsx    ← múltiplas (lista, CRUD)
RecursoManager.tsx     ← singular (edita uma)
```

### 4. Atualize Dashboards
```
AdminSiteDashboard → Card "Gerenciar Recursos"
AdminParoquiaDashboard → Card "Configurar Meu Recurso"
```

---

## Implementação Completa

### Arquivos Modificados

1. **App.tsx**
   - Importações atualizadas: `ParoquiaManager`, `ParoquiasManager`
   - Rotas reorganizadas com prefixos corretos
   - Proteções aplicadas (SuperAdminRoute, ParishAdminRoute)

2. **AdminSiteDashboard.tsx**
   - Card renomeado: "Configurar Paróquia" → "Gerenciar Paróquias"
   - Descrição atualizada

3. **AdminParoquiaDashboard.tsx**
   - Novo card: "Configurar Paróquia" → `/admin-paroquia/paroquia`
   - Reorganização de cards em seção "Administração"

### Arquivos Criados

1. **ParoquiaManager.tsx** (nova)
   - Gerencia UMA paróquia (singular)
   - Rota: `/admin-paroquia/paroquia`
   - Baseado em ParishManagement, adaptado para singular

2. **ParoquiasManager.tsx** (nova)
   - Gerencia TODAS as paróquias (plural)
   - Rota: `/admin-site/paroquias`
   - Lista completa com CRUD (create, read, update, delete)

---

## Diagrama de Navegação

```
┌─────────────────────────────────────────────────────────────┐
│ SISTEMA DE BINGO DA COMUNIDADE                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ 🏠 Raiz (/)                                                  │
│ ├─ /login, /signup, /forgot-password                        │
│ ├─ /dashboard (usuário público)                             │
│ └─ /bingo/... (jogo público)                                │
│                                                               │
│ 👑 Admin-Site (/admin-site/...)                             │
│ ├─ /login                                                    │
│ ├─ /dashboard                                                │
│ ├─ /paroquias          ← Gerenciar TODAS (plural)         │
│ ├─ /users-admin        ← Users DO site                     │
│ ├─ /configuracoes                                           │
│ ├─ /relatorios                                              │
│ ├─ /auditoria                                               │
│ └─ /feedback                                                 │
│                                                               │
│ ⛪ Admin-Paróquia (/admin-paroquia/...)                     │
│ ├─ /login                                                    │
│ ├─ /dashboard                                                │
│ ├─ /paroquia           ← Configurar MINHA (singular)       │
│ ├─ /configuracoes                                           │
│ ├─ /user-paroquia      ← Users DA paróquia                 │
│ ├─ /games                                                    │
│ └─ /jogos-paroquia                                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Conclusão

A **linha de diagnóstico consistente** estabelece:

1. ✅ **Clareza de contexto**: Rota deixa imediato se é múltiplo ou singular
2. ✅ **Escalabilidade**: Padrão simples de replicar para novos recursos
3. ✅ **Segurança**: Prefixo de rota garante isolamento de escopo
4. ✅ **UX forte**: Usuários entendem a hierarquia pelos cards

**Padrão Golden:**
```
/[contexto]/[recurso-pluralização]

/admin-site/paroquias      ← múltiplas
/admin-paroquia/paroquia   ← singular
```

Este padrão deve ser mantido em TODAS as futuras implementações administrativas.

---

**Próximos Passos:**
1. Documentação de API updates (se houver)
2. Testes end-to-end para novos fluxos
3. Validação em produção
4. Comunicação com usuários sobre mudanças de rotas
