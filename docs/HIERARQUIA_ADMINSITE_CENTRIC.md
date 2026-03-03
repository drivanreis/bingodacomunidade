# 🏛️ Hierarquia AdminSite-Centric

## Estrutura de Relacionamento

```
┌─────────────────────────────────────────────────────────┐
│                    users_admin_site                      │
│              (Centro da Aplicação - VÁRIOS)              │
│          (Gerenciadores da plataforma inteira)           │
└──────────────────────────┬──────────────────────────────┘
                           │
                    1 admin pode ter N
                           │
                           ▼
            ┌──────────────────────────────┐
            │       paroquias              │
            │   (Criadas pelos admins)     │
            │   (Múltiplas por admin)      │
            └──────────────┬───────────────┘
                           │
                    1 paróquia pode ter N
                           │
                           ▼
            ┌──────────────────────────────┐
            │   users (Fiéis)              │
            │   (De cada paróquia)         │
            │   (Públicos, Admin, etc)     │
            └──────────────────────────────┘
```

## Modelo de Dados

### 1. **users_admin_site** (NOVO - CENTRO)
```sql
CREATE TABLE users_admin_site (
    id INTEGER PRIMARY KEY
    username VARCHAR(255) UNIQUE NOT NULL
    password_hash VARCHAR(255) NOT NULL
    email VARCHAR(255) UNIQUE
    is_active BOOLEAN DEFAULT TRUE
    created_at TIMESTAMP
    updated_at TIMESTAMP
)
```

**Responsabilidades:**
- Gerenciar a plataforma inteira
- Criar/editar/deletar paroquias
- Ver relatórios globais
- Configurações gerais do sistema
- **Credencial Bootstrap:** admin / admin123

---

### 2. **paroquias** (ALTERADA - Agora tem FK para users_admin_site)
```sql
ALTER TABLE paroquias ADD COLUMN:
    admin_site_user_id INTEGER NOT NULL (FK → users_admin_site.id)
```

**Relacionamento:**
- `1 users_admin_site → N paroquias`
- Cada paróquia pertence a exatamente 1 admin de site
- Admin de site pode gerenciar múltiplas paroquias

---

### 3. **users** (SEM ALTERAÇÃO - Referencia paroquias)
```sql
-- Já existe
-- users.paroquia_id → paroquias.id (sem mudança)
```

**Hierarquia completa:**
- users_admin_site (1 admin)
  → paroquias (N paroquias deste admin)
    → users (N usuários desta paróquia)

---

## Impacto no Backend

### Arquivos que precisam ser ajustados:

1. **models/models.py**
   - Criar modelo `UserAdminSite`
   - Atualizar modelo `Paroquia` (adicionar FK)
   - Atualizar relacionamentos

2. **db/seed.py**
   - Criar table `users_admin_site` (se não existir)
   - Criar apenas 1 user admin (admin/admin123)
   - NÃO criar paoquias no seed
   - NÃO criar user fiéis no seed

3. **routers/admin_routes.py** (RENOMEAR para admin_site_routes.py?)
   - Rotas para gerenciar users_admin_site
   - Rotas para criar/gerenciar paroquias
   - Filtrar paroquias pelo admin_site_user_id

4. **routers/auth_routes.py**
   - Login para users_admin_site
   - Token deverá incluir admin_site_user_id

5. **utils/permissions.py**
   - Verificar se user é admin de site
   - Verificar se admin de site pode acessar paróquia específica

6. **schemas/schemas.py**
   - Criar schema para UserAdminSite
   - Criar schema para criar/editar paróquia com admin_site_user_id

---

## Impacto no Frontend

### AuthContext
```typescript
interface AuthContext {
    user: {
        id: string
        username: string
        email: string
        role: 'admin_site' | 'admin_paroquia' | 'paroquia_user' | 'usuario_publico'
        admin_site_user_id?: string  // NOVO
        paroquia_id?: string
    }
    isAuthenticated: boolean
    login(credentials): Promise<void>
    logout(): void
}
```

### Rotas e Componentes Afetados

1. **AdminSiteDashboard** → Mostrar todas as paroquias do admin
2. **ParoquiasManager** → Listar paroquias gerenciadas por este admin
3. **PrivateRoute** → Validar admin_site_user_id
4. **Login** → Login específico para users_admin_site

---

## Fases de Implementação

### FASE 1: Database
- [ ] Criar tabela `users_admin_site`
- [ ] Alterar tabela `paroquias` (adicionar FK)
- [ ] Criar migration Alembic
- [ ] Atualizar seed.py

### FASE 2: Backend Models & Routes
- [ ] Criar modelo UserAdminSite
- [ ] Criar schemas
- [ ] Implementar rotas admin_site
- [ ] Atualizar permissões

### FASE 3: Frontend Context
- [ ] Atualizar AuthContext com admin_site_user_id
- [ ] Atualizar componentes

### FASE 4: Testes
- [ ] Atualizar mocks
- [ ] Novos testes para fluxo
- [ ] Verificar cobertura

### FASE 5: Validação
- [ ] E2E testing
- [ ] Documentação final

---

## Bootstrap Simplificado

**Seed cria:**
1. ✅ Tabela `users_admin_site`
2. ✅ Usuário: username=`admin`, password=`admin123`, role=`admin_site`
3. ✅ Sistema pronto para que admin crie primeiras paroquias

**Seed NÃO cria:**
1. ❌ Paroquias (admin cria depois)
2. ❌ Usuários de paróquias (paróquias criarão)

---

## Queries Importantes

```sql
-- Listar todas as paroquias de um admin
SELECT p.* FROM paroquias p
WHERE p.admin_site_user_id = ?

-- Listar todos os fiéis de uma paróquia de um admin
SELECT u.* FROM users u
WHERE u.paroquia_id = ?
AND u.paroquia_id IN (
    SELECT id FROM paroquias 
    WHERE admin_site_user_id = ?
)
```

---

## Status: ✅ Documentação Completa - Pronto para FASE 1
