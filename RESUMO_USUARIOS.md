# 👥 Resumo da Aplicação - Gestão de Usuários

## 🎯 Visão Geral

**Bingo da Comunidade** é um sistema de gerenciamento de bingos para igrejas/paróquias com suporte a:
- ✅ Múltiplas paróquias independentes
- ✅ Hierarquia de permissões (5 tipos de usuário)
- ✅ Autenticação segura com timeout de inatividade (5 min)
- ✅ Sistema de feedback integrado
- ✅ Gerenciamento administrativo centralizado

---

## 🏛️ Estrutura de Usuários - DUAS TABELAS SEPARADAS

### 📊 Tabela 1: Usuario_Comum (FIEL)
**Para Apostadores, Clientes, Participantes**

```
CARACTERÍSTICAS:
✅ Auto-cadastro (acesso público)
✅ Todos são IGUAIS - sem hierarquia
✅ Única diferença: ativo (true/false) ou banido (true/false)
✅ Email OBRIGATÓRIO (recuperação de senha)
✅ Telefone OBRIGATÓRIO (2FA via SMS)
✅ WhatsApp OBRIGATÓRIO (notificações de prêmios)
❌ NÃO podem ser admins
❌ NÃO participam de funções administrativas

RESPONSABILIDADES:
├─ Participar de bingos
├─ Comprar cartelas
├─ Criar carrinhos de compras
├─ Ver cartelas de concorrentes
├─ Recuperar senha (via email)
├─ Receber notificações de vitórias (WhatsApp)
├─ Alterar dados pessoais
└─ Enviar feedback

PERMISSÕES:
├─ Dashboard pessoal (/dashboard)
├─ Visualizar bingos (/games)
├─ Participar de bingos (/games/:id)
├─ Gerenciar cartelas
├─ Carrinho de compras
├─ Enviar feedback (/send-feedback)
└─ Perfil pessoal (/profile)

ADMINISTRAÇÃO:
├─ Admin-Site pode: VISUALIZAR, ATIVAR, DESATIVAR
├─ Admin-Paróquia pode: VISUALIZAR, ATIVAR, DESATIVAR (da paróquia)
└─ Nenhum outro usuário acessa dados de comum
```

---

### 🔑 Tabela 2: Usuario_Administrativo (ADMIN)
**Para Administradores Sistema e Paróquias**

```
CARACTERÍSTICAS:
✅ SEM auto-cadastro (criado apenas por superior)
✅ COM hierarquia rigorosa
✅ Dois níveis: ADMIN_SITE ou ADMIN_PAROQUIA
✅ Email PODE estar vazio (usa login/usuário)
✅ Telefone OPCIONAL
✅ WhatsApp OPCIONAL
❌ NÃO podem participar de bingos
❌ NÃO podem comprar cartelas
❌ NÃO podem jogar

HIERARQUIA:
┌─ ADMIN_SITE (Super Admin)
│  ├─ Pode criar: ADMIN_SITE (revezamento)
│  └─ Pode criar: ADMIN_PAROQUIA (para novas paróquias)
│
└─ ADMIN_PAROQUIA (Admin da Paróquia)
   ├─ Vinculado a UMA paróquia
   ├─ Pode criar: ADMIN_PAROQUIA (subordinados mesma paróquia)
   └─ Só gerencia sua paróquia

RESPONSABILIDADES (ADMIN_SITE):
├─ Gerenciar configurações globais do sistema
├─ Criar/remover ADMIN_SITE (revezamento)
├─ Criar ADMIN_PAROQUIA para novas paróquias
├─ Gerenciar paróquias
├─ Visualizar/ativar/desativar usuários comuns
├─ Gerenciar feedbacks do sistema
├─ Resetar senha de ADMIN_PAROQUIA
└─ Acessar relatórios consolidados

RESPONSABILIDADES (ADMIN_PAROQUIA):
├─ Gerenciar usuários comuns (apenas sua paróquia)
├─ Ativar/desativar participantes
├─ Banir participantes
├─ Criar e gerenciar bingos
├─ Gerenciar cartelas
├─ Resetar senha de usuários comuns
├─ Enviar notificações de prêmios
└─ Ver relatórios da paróquia

PERMISSÕES:
├─ Dashboard administrativo (/admin-site ou /admin-paroquia)
├─ Gerenciar paróquias (apenas ADMIN_SITE)
├─ Gerenciar usuários
├─ Gerenciar bingos
├─ Sistema de feedback
├─ Configurações
└─ Relatórios

REGRAS DE SENHA:
├─ ADMIN_SITE: pode resetar senha de ADMIN_PAROQUIA
├─ ADMIN_PAROQUIA: pode resetar senha de usuários comuns
├─ Admin NÃO pode resetar própria senha (faz no sistema)
└─ Sempre por email ou token do superior
```

---

## ⚙️ Fluxo de Criação/Gerenciamento

### Usuários Comuns
```
Fluxo:
1. Usuário acessa /signup (acesso público)
2. Preenche: nome, email, telefone, whatsapp, cpf, senha
3. Valida: CPF único, email único
4. Auto-ativa na hora (ativo = true)
5. Recebe email de confirmação
6. Pode fazer login imediatamente

Gerenciamento:
├─ Admin-Site acessa: /admin-site/usuarios
├─ Admin-Paroquia acessa: /admin-paroquia/usuarios
└─ Pode: visualizar, ativar, desativar, banir (com motivo)

Status:
├─ ativo = true → participando de bingos
├─ ativo = false → bloqueado (não pode jogar)
├─ banido = true → banido da paróquia (registra por quem)
└─ Histórico de banimentos é auditado
```

### Usuários Administrativos
```
Fluxo Admin-Site:
1. Admin-Site acessa: /admin-site/users-admin
2. Gerencia Usuários do Site (pares ADMIN_SITE)
3. Cria usuário do site (reserva):
   ├─ Email (identidade)
   ├─ Telefone (2FA)
   ├─ WhatsApp (opcional)
   └─ Senha inicial
4. Lista contas ativas/inativas e identifica o usuário atual
5. Ativa/inativa reservas conforme a passagem do bastão

Fluxo Admin-Paroquia:
1. Admin-Paroquia acessa: /admin-paroquia/admins
2. Cria novo admin:
   ├─ Nome
   ├─ Email (opcional)
   ├─ Login/Usuário (único)
   ├─ Telefone (opcional)
   └─ Nível: ADMIN_PAROQUIA (subordinado)
3. Idem admin-site

Regras:
├─ Cada admin criado registra: criado_por_id
├─ Admin-Paroquia vê apenas seus subordinados
├─ No Admin-Site: não pode inativar o próprio usuário
├─ No Admin-Site: não pode inativar o último ADMIN_SITE ativo
├─ Pode ativar/desativar reservas
├─ Senha resetada por superior via token
└─ Histórico de todas operações auditado
```

---

## 🔐 Sistema de Autenticação

### Fluxo de Login

```
1. Usuário acessa /login (para fiéis) ou /admin-site/login (para admins)
2. Submete CPF/Email + Senha
3. Backend valida:
   ├─ Usuário existe?
   ├─ Senha está correta?
   ├─ Usuário está ativo?
   ├─ Usuário está banido?
   └─ Conta desbloqueada? (após 3 tentativas falhas)
4. Se válido: gera JWT token
5. Token armazenado em localStorage
6. Token enviado em cada requisição (header Authorization)
7. Frontend redireciona para dashboard apropriado
```

### Segurança Implementada

```
✅ JWT (JSON Web Tokens) com assinatura
✅ Senhas com hash bcrypt (não reversível)
✅ Timeout de inatividade: 5 minutos
✅ Bloqueio automático após 3 tentativas de login
✅ Tokens de recuperação de senha (1 hora válidos)
✅ Tokens de verificação de email (24 horas válidos)
✅ Logout completo limpa localStorage + sessionStorage
✅ Proteção contra CSRF
✅ Validação de CPF no banco de dados
```

### Inatividade (5 minutos)

```
- Hook: useInactivityTimeout
- Monitora: cliques, digitação, scroll
- Ao atingir 5 min sem atividade:
  ├─ Exibe aviso: "Você será desconectado em 30 seg"
  ├─ Conta regressiva visual
  ├─ Se continuar inativo: logout automático
  └─ Redireciona para /login
- Reset: qualquer atividade do usuário reinicia contador
```

---

## 📊 Campos do Banco de Dados

### Tabela: usuario_comum
```sql
UsuarioComum {
  -- Identificação
  id: String(50)                    ← ID temporal único
  nome: String(200)                 ← Nome completo
  cpf: String(11)                   ← CPF (apenas números, ÚNICO)
  
  -- Contato (OBRIGATÓRIOS para comunicação)
  email: String(200)                ← Email (ÚNICO, para recuperação de senha)
  telefone: String(20)              ← Telefone (OBRIGATÓRIO, para 2FA via SMS)
  whatsapp: String(20)              ← WhatsApp (OBRIGATÓRIO, notificações de prêmios)
  
  -- Dados Financeiros
  chave_pix: String(200)            ← PIX do usuário (para receber prêmios)
  
  -- Autenticação
  senha_hash: String(255)           ← Hash bcrypt da senha
  
  -- Recuperação de Senha (por email)
  token_recuperacao: String(100)    ← Token único para reset
  token_expiracao: DateTime         ← Validade (1 hora)
  
  -- Verificação de Email
  email_verificado: Boolean         ← Email confirmado?
  token_verificacao_email: String   ← Token para confirmar
  token_verificacao_expiracao: DateTime ← Validade (24 horas)
  
  -- 2FA via SMS
  telefone_verificado: Boolean      ← Telefone confirmado?
  token_2fa: String(6)              ← Código de 6 dígitos
  token_2fa_expiracao: DateTime     ← Validade (5 minutos)
  
  -- Segurança de Login
  tentativas_login: Integer         ← Contador de falhas
  bloqueado_ate: DateTime           ← Desbloqueio automático
  
  -- Status
  ativo: Boolean                    ← true=pode jogar | false=bloqueado
  banido: Boolean                   ← true=banido da plataforma
  motivo_banimento: Text            ← Razão do banimento
  banido_por_id: String(50)         ← Admin que baniu
  banido_em: DateTime               ← Quando foi banido
  
  -- Paróquia (opcional, se em programa específico)
  paroquia_id: String(50)           ← FK para paróquia (opcional)
  
  -- Timestamps (Timezone: America/Fortaleza)
  criado_em: DateTime               ← Quando se registrou
  atualizado_em: DateTime           ← Última atualização
  ultimo_acesso: DateTime           ← Último login
}
```

### Tabela: usuario_administrativo
```sql
UsuarioAdministrativo {
  -- Identificação
  id: String(50)                    ← ID temporal único
  nome: String(200)                 ← Nome completo
  
  -- Autenticação
  login: String(100)                ← Usuário único (sem email)
  senha_hash: String(255)           ← Hash bcrypt da senha
  
  -- Contato (OPCIONAIS)
  email: String(200)                ← Email (opcional, para notificações)
  telefone: String(20)              ← Telefone (opcional)
  whatsapp: String(20)              ← WhatsApp (opcional)
  
  -- Hierarquia & Permissões
  nivel_acesso: Enum                ← "admin_site" ou "admin_paroquia"
  paroquia_id: String(50)           ← FK paróquia (se admin_paroquia, obrigatório)
  
  -- Quem Criou
  criado_por_id: String(50)         ← ID do superior que criou
  
  -- Recuperação de Senha (por superior, não por email)
  token_recuperacao: String(100)    ← Token enviado por superior
  token_expiracao: DateTime         ← Validade (24 horas)
  
  -- Status
  ativo: Boolean                    ← true=pode acessar | false=desativado
  
  -- Timestamps (Timezone: America/Fortaleza)
  criado_em: DateTime               ← Quando foi criado
  atualizado_em: DateTime           ← Última atualização
  ultimo_acesso: DateTime           ← Último login
}
```

### Diferenças Críticas

| Aspecto | Usuario_Comum | Usuario_Administrativo |
|---------|---------------|------------------------|
| **Cadastro** | Auto-cadastro público | Criado apenas por superior |
| **Email** | ✅ OBRIGATÓRIO (recupera senha) | ❌ OPCIONAL |
| **Telefone** | ✅ OBRIGATÓRIO (2FA, prêmios) | ❌ OPCIONAL |
| **WhatsApp** | ✅ OBRIGATÓRIO (notificações) | ❌ OPCIONAL |
| **CPF** | ✅ OBRIGATÓRIO, ÚNICO | ❌ NÃO tem |
| **Pode Jogar** | ✅ SIM | ❌ NÃO |
| **Login** | CPF + Senha | Login + Senha |
| **Recuperação Senha** | Por email (token) | Por superior (token) |
| **Hierarquia** | Nenhuma (todos iguais) | ✅ Rígida (ADMIN_SITE > ADMIN_PAROQUIA) |
| **Status** | ativo/banido | ativo/desativado |
| **Pode Criar Outros** | ❌ NÃO | ✅ SIM (respeitando hierarquia) |

---

## 🎮 Páginas Principais

### Para Usuários Comuns (Fiéis)

| Página | Rota | Descrição |
|--------|------|-----------|
| **Cadastro** | `/signup` | Auto-registro com CPF + Email |
| **Login** | `/login` | Autenticação com CPF + Senha |
| **Dashboard** | `/dashboard` | Meus bingos, cartelas compradas |
| **Bingos** | `/games` | Lista de bingos disponíveis |
| **Detalhe Bingo** | `/games/:id` | Participar, ver cartelas |
| **Perfil** | `/profile` | Editar dados (email, telefone, whatsapp) |
| **Enviar Feedback** | `/send-feedback` | Sugestões, bugs, reclamações |
| **Recuperar Senha** | `/forgot-password` | Reset por email com token |

### Para Admins Sistema

| Página | Rota | Descrição |
|--------|------|-----------|
| **Login Admin** | `/admin-site/login` | Autenticação com login + senha |
| **Dashboard** | `/admin-site/dashboard` | Visão geral do sistema |
| **Gerenciar Usuários da Paróquia** | `/admin-site/usuarios` | Criar e gerenciar equipe paroquial (Admin-Site/Admin-Paróquia) |
| **Gerenciar Usuários do Site** | `/admin-site/users-admin` | Sucessão Admin-Site, reservas e gestão de status |
| **Paróquias** | `/admin-site/paroquias` | CRUD de paróquias |
| **Bingos** | `/admin-site/bingos` | Gerenciar bingos globalmente |
| **Feedbacks** | `/admin-site/feedback` | Ver/responder feedbacks |
| **Configurações** | `/admin-site/configuracoes` | Config globais do sistema |
| **Relatórios** | `/admin-site/relatorios` | Estatísticas consolidadas |
| **Auditoria** | `/admin-site/auditoria` | Log de todas as ações |

### Para Admins Paróquia

| Página | Rota | Descrição |
|--------|------|-----------|
| **Login Admin** | `/admin-paroquia/login` | Autenticação com login + senha |
| **Dashboard** | `/admin-paroquia/dashboard` | Visão geral da paróquia |
| **Usuários** | `/admin-paroquia/usuarios` | Ver, ativar, desativar fiéis da paróquia |
| **Administradores** | `/admin-paroquia/admins` | Criar, editar admins subordinados |
| **Bingos** | `/admin-paroquia/bingos` | Gerenciar bingos da paróquia |
| **Relatórios** | `/admin-paroquia/relatorios` | Estatísticas da paróquia |
| **Atendimento** | `/admin-paroquia/suporte` | Resetar senhas, suporte a fiéis |

---

## ✨ Funcionalidades Recentes

### Sistema de Feedback (Novo!)
```
✅ Usuários podem enviar feedback
   ├─ Tipo: sugestão | elogio | reclamação | bug
   ├─ Satisfação: 1-5 estrelas
   ├─ Assunto e mensagem detalhada
   └─ Timestamp automático

✅ Super Admin gerencia feedback
   ├─ Visualiza todos os feedbacks
   ├─ Filtra por status e tipo
   ├─ Responde feedback do usuário
   ├─ Marca como: pendente | em_análise | resolvido | arquivado
   └─ Vê estatísticas (média de satisfação)

📊 Campos do Feedback:
   ├─ id: ID temporal único
   ├─ usuario_id: Quem enviou
   ├─ tipo: sugestao | elogio | reclamacao | bug
   ├─ assunto: Título
   ├─ mensagem: Descrição
   ├─ satisfacao: 1-5
   ├─ status: pendente | em_analise | resolvido | arquivado
   ├─ resposta: Resposta do admin
   ├─ respondido_por_id: ID do admin
   ├─ criado_em: Timestamp
   ├─ respondido_em: Timestamp
   └─ tags, sentimento_score, categoria_ia (futuros para IA)
```

### Gerenciamento de Admins (Novo!)
```
✅ Página dedicada: /admin-site/users-admin
✅ Super Admin pode:
   ├─ Visualizar usuários do site (ADMIN_SITE) ativos e inativos
   ├─ Criar usuário do site reserva
   ├─ Ativar/inativar reservas
   └─ Garantir continuidade operacional em férias e sucessão
   ├─ Ver histórico de criação
   └─ Interface segura com aviso de privilégio

🔒 Segurança:
   ├─ Apenas Super Admin acessa
   ├─ Aviso amarelo ao promover para Super Admin
   ├─ Confirmação ao salvar mudanças
   └─ Sugestão na tabela de usuários
```

### Proteção de Rotas
```
✅ PrivateRoute: protege rotas de fiéis
   └─ Redireciona deslogados para /login

✅ SuperAdminRoute: protege rotas admin
   ├─ Verifica se é super_admin
   ├─ Redireciona para /admin-site/login se não
   └─ Redireciona para dashboard apropriado se acesso negado

✅ /admin-site → redireciona para /admin-site/login
   └─ Segurança: não expõe dashboard sem autenticação
```

---

## 🚀 Fluxo de Usuário Típico

### Novo Fiel
```
1. Acessa localhost:5173
2. Clica em "Cadastrar"
3. Preenche: Nome, CPF, Email, Senha
4. Confirma email
5. Pode fazer login com CPF + Senha
6. Acessa dashboard pessoal
7. Vê bingos disponíveis
8. Compra cartelas
9. Participa de sorteios
10. Pode enviar feedback sobre a experiência
```

### Super Admin (First Time)
```
1. Acessa localhost:5173/admin-site/login
2. Usa credenciais bootstrap: Admin / admin123
3. Acessa dashboard administrativo
4. Pode:
   ├─ Criar novas paróquias
   ├─ Cadastrar admins paroquiais
   ├─ Ver feedbacks dos usuários
   ├─ Gerenciar outros Admins do Sistema
   └─ Configurar sistema globalmente
5. Se inativo 5 min: desconecta automaticamente
6. Deve fazer login novamente
```

---

## 📈 Estatísticas & Monitoramento

### Rastreamento por Usuário
```
✅ Último acesso registrado
✅ CPF único (previne duplicatas)
✅ Email único (com confirmação)
✅ Tentativas de login rastreadas
✅ Bloqueio automático após 3 tentativas
✅ Banimentos registram quem, quando, por quê
✅ Todos os acessos são auditados (logs)
```

### Timestamps com Timezone
```
Todos os timestamps usam: America/Fortaleza
├─ criado_em: quando conta foi criada
├─ atualizado_em: última modificação
├─ ultimo_acesso: último login
├─ bloqueado_ate: desbloqueio automático
└─ banido_em: quando foi banido
```

---

## � Mudanças Necessárias no Código

### 1. Banco de Dados - CRIAR DUAS TABELAS

#### Tabela: usuario_comum
```python
# backend/src/models/models.py

class UsuarioComum(Base):
    __tablename__ = "usuarios_comuns"
    
    id = Column(String(50), primary_key=True)
    nome = Column(String(200), nullable=False)
    cpf = Column(String(11), nullable=False, unique=True)
    email = Column(String(200), nullable=False, unique=True)
    telefone = Column(String(20), nullable=False)  # OBRIGATÓRIO
    whatsapp = Column(String(20), nullable=False)  # OBRIGATÓRIO
    chave_pix = Column(String(200), nullable=True)
    senha_hash = Column(String(255), nullable=False)
    
    # Recuperação
    token_recuperacao = Column(String(100), nullable=True)
    token_expiracao = Column(DateTime(timezone=True), nullable=True)
    
    # Verificação Email
    email_verificado = Column(Boolean, default=False)
    token_verificacao = Column(String(100), nullable=True)
    
    # 2FA SMS
    telefone_verificado = Column(Boolean, default=False)
    token_2fa = Column(String(6), nullable=True)
    token_2fa_expiracao = Column(DateTime(timezone=True), nullable=True)
    
    # Segurança
    tentativas_login = Column(Integer, default=0)
    bloqueado_ate = Column(DateTime(timezone=True), nullable=True)
    
    # Status
    ativo = Column(Boolean, default=True)
    banido = Column(Boolean, default=False)
    motivo_banimento = Column(Text, nullable=True)
    banido_por_id = Column(String(50), nullable=True)
    banido_em = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())
    ultimo_acesso = Column(DateTime(timezone=True), nullable=True)
```

#### Tabela: usuario_administrativo
```python
class UsuarioAdministrativo(Base):
    __tablename__ = "usuarios_administrativos"
    
    id = Column(String(50), primary_key=True)
    nome = Column(String(200), nullable=False)
    login = Column(String(100), nullable=False, unique=True)
    senha_hash = Column(String(255), nullable=False)
    
    # Contato (OPCIONAIS)
    email = Column(String(200), nullable=True)
    telefone = Column(String(20), nullable=True)
    whatsapp = Column(String(20), nullable=True)
    
    # Hierarquia
    nivel_acesso = Column(SQLEnum(NivelAcessoAdmin), nullable=False)
    paroquia_id = Column(String(50), ForeignKey("paroquias.id"), nullable=True)
    
    # Quem criou
    criado_por_id = Column(String(50), nullable=True)
    
    # Recuperação (por superior)
    token_recuperacao = Column(String(100), nullable=True)
    token_expiracao = Column(DateTime(timezone=True), nullable=True)
    
    # Status
    ativo = Column(Boolean, default=True)
    
    # Timestamps
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())
    ultimo_acesso = Column(DateTime(timezone=True), nullable=True)
    
    # Enum para hierarquia
    class NivelAcessoAdmin(str, enum.Enum):
        ADMIN_SITE = "admin_site"
        ADMIN_PAROQUIA = "admin_paroquia"
```

### 2. Autenticação - Dois Fluxos

```python
# backend/src/routers/auth.py

# Fluxo 1: Usuário Comum (CPF + Senha)
@router.post("/auth/login-comum")
def login_comum(cpf: str, senha: str):
    usuario = db.query(UsuarioComum).filter(UsuarioComum.cpf == cpf).first()
    # Valida: ativo, banido, tentativas_login
    # Gera JWT token
    # Registra último_acesso

# Fluxo 2: Administrador (Login + Senha)
@router.post("/auth/login-admin")
def login_admin(login: str, senha: str):
    admin = db.query(UsuarioAdministrativo).filter(UsuarioAdministrativo.login == login).first()
    # Valida: ativo, tentativas_login
    # Gera JWT token
    # Registra último_acesso
```

### 3. Recuperação de Senha

```python
# Usuário Comum: por EMAIL
@router.post("/auth/recover-password/comum")
def recover_comum(email: str):
    usuario = db.query(UsuarioComum).filter(UsuarioComum.email == email).first()
    # Gera token
    # Envia EMAIL com link
    # Token válido 1 hora

# Administrador: por SUPERIOR
@router.post("/auth/recover-password/admin/{admin_id}")
def recover_admin(admin_id: str, reset_by_id: str):
    # Valida que reset_by_id é superior hierárquico
    admin = db.query(UsuarioAdministrativo).filter(...).first()
    # Gera token
    # Envia ao superior
    # Superior comunica ao admin
```

### 4. Criar Usuário Comum (Auto-cadastro)

```python
# frontend/src/pages/Signup.tsx

// Campos:
// Nome
// CPF (validado, único)
// Email (confirmação)
// Telefone (OBRIGATÓRIO)
// WhatsApp (OBRIGATÓRIO)
// Senha

// Backend retorna: usuário criado com ativo=true
// Email de confirmação enviado
```

### 5. Criar Administrador (Apenas por Superior)

```python
# frontend/src/pages/AdminUsers.tsx (admin-site)

// Admin-Site cria novo admin:
// ├─ Nome
// ├─ Login (único)
// ├─ Email (opcional)
// ├─ Nível: ADMIN_SITE ou ADMIN_PAROQUIA
// └─ Paróquia (se ADMIN_PAROQUIA)

// Backend:
// ├─ Gera senha temporária
// ├─ Registra criado_por_id
// ├─ Marca ativo=true
// └─ Envia credenciais por email
```

### 6. Proteção de Rotas

```typescript
// Fiéis: CPF no localStorage
// Admins: Login/Token no localStorage

// Cada rota verifica tipo de usuário
// /dashboard → UsuarioComum
// /admin-site → UsuarioAdministrativo (admin_site)
// /admin-paroquia → UsuarioAdministrativo (admin_paroquia)
```

```
⏳ Sistema de 2FA (Autenticação de Dois Fatores)
⏳ Análise de feedback com IA (sentimento, categorização, prioridade)
⏳ Sistema de permissões granulares
⏳ Dashboard personalizado por tipo de usuário
⏳ Integração com Google/Facebook login
⏳ Histórico detalhado de cada usuário
⏳ Sistema de convites via email
⏳ Controle de acesso baseado em paróquia
```

---

**Sistema: Bingo da Comunidade**  
**Data: 2 de fevereiro de 2026**  
**Timezone: America/Fortaleza**
