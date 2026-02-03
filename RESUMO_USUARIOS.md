# 👥 Resumo da Aplicação - Gestão de Usuários

## 🎯 Visão Geral

**Bingo da Comunidade** é um sistema de gerenciamento de bingos para igrejas/paróquias com suporte a:
- ✅ Múltiplas paróquias independentes
- ✅ Hierarquia de permissões (5 tipos de usuário)
- ✅ Autenticação segura com timeout de inatividade (5 min)
- ✅ Sistema de feedback integrado
- ✅ Gerenciamento administrativo centralizado

---

## 🏛️ Hierarquia de Usuários

### Nível 1: SUPER_ADMIN 👑
**Guardião da Infraestrutura**

```
Responsabilidades:
├─ Gerenciar configurações globais do sistema
├─ Criar/promover outros Super Admins
├─ Cadastrar primeiro usuário de cada paróquia
├─ Auditar todas as operações do sistema
├─ Gerenciar feedbacks do sistema
└─ Acessar relatórios consolidados

Permissões de Acesso:
├─ Dashboard administrativo completo (/admin-site/dashboard)
├─ Gerenciar paróquias (/admin-site/paroquias)
├─ Gerenciar usuários (/admin-site/usuarios)
├─ Sistema de feedback (/admin-site/feedback)
├─ Gerenciar admins (/admin-site/admins) ← NOVO
├─ Configurações globais (/admin-site/configuracoes)
├─ Relatórios e auditoria (/admin-site/relatorios)
└─ Logs de auditoria (/admin-site/auditoria)

Exemplo: Admin (ID: BOOTSTRAP_20260202215443_448455)
```

---

### Nível 2: PAROQUIA_ADMIN 👨‍💼
**Administrador Paroquial**

```
Responsabilidades:
├─ Gerenciar todos os usuários da paróquia
├─ Criar operadores (caixa, recepção, bingo)
├─ Promover/rebaixar outros admins paroquiais
├─ Criar e gerenciar bingos
├─ Banir participantes (FIELs)
└─ Enviar relatórios da paróquia

Permissões de Acesso:
├─ Dashboard da paróquia (/admin-paroquia/dashboard)
├─ Gerenciar usuários da paróquia
├─ Criar bingos
├─ Visualizar relatórios
└─ Acessar central de atendimento

Vinculação: Obrigatoriamente vinculado a uma paróquia
```

---

### Nível 3: Operadores Paroquiais
**Funções Especializadas**

#### PAROQUIA_CAIXA 💰
```
Responsabilidades:
├─ Receber PIX de vendas de cartelas
├─ Enviar prêmios via PIX
└─ Registrar transações

Permissões:
├─ Visualizar cartelas vendidas
├─ Processar pagamentos
└─ Ver histórico de transações

Restrições: NÃO pode gerenciar usuários
```

#### PAROQUIA_RECEPCAO 📋
```
Responsabilidades:
├─ Cadastrar participantes presenciais
├─ Validar CPF
└─ Emitir comprovantes

Permissões:
├─ Criar cartelas
├─ Validar dados de participantes
└─ Imprimir recibos

Restrições: NÃO pode gerenciar finanças
```

#### PAROQUIA_BINGO 🎲
```
Responsabilidades:
├─ Conduzir sorteios
├─ Marcar números sorteados
└─ Declarar vencedores

Permissões:
├─ Acessar cartelas do sorteio
├─ Registrar números sorteados
└─ Confirmar vencedor

Restrições: NÃO pode gerenciar usuários ou finanças
```

---

### Nível 4: FIEL 👤
**Participante Comum**

```
Responsabilidades:
├─ Participar de bingos
├─ Comprar cartelas
├─ Enviar feedback
└─ Gerenciar perfil

Permissões:
├─ Dashboard pessoal (/dashboard)
├─ Visualizar bingos disponíveis (/games)
├─ Participar de bingos (/games/:id)
├─ Ver cartelas compradas
├─ Enviar feedback (/send-feedback)
└─ Gerenciar perfil (/profile)

Restrições:
├─ Sem acesso a áreas administrativas
├─ Pode ser banido por PAROQUIA_ADMIN
└─ Dados restritos à paróquia

Criar Conta:
├─ Auto-cadastro via signup
├─ Validação de CPF
├─ Confirmação de email
└─ Login com CPF + senha
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

## 📊 Campos do Usuário no Banco de Dados

```sql
Usuario {
  -- Identificação
  id: String(50)                    ← ID temporal único
  nome: String(200)                 ← Nome completo
  cpf: String(11)                   ← CPF (apenas números, único)
  email: String(200)                ← Email (único, permite NULL)
  whatsapp: String(20)              ← WhatsApp (opcional)
  
  -- Acesso
  tipo: TipoUsuario                 ← super_admin | paroquia_admin | 
                                       paroquia_caixa | paroquia_recepcao |
                                       paroquia_bingo | fiel
  paroquia_id: String(50)           ← FK para paróquia (NULL para Super Admin)
  
  -- Dados Financeiros
  chave_pix: String(200)            ← PIX do fiel (para receber prêmios)
  
  -- Autenticação
  senha_hash: String(255)           ← Hash bcrypt da senha
  
  -- Recuperação
  token_recuperacao: String(100)    ← Token para reset de senha
  token_expiracao: DateTime          ← Validade do token (1h)
  
  -- Verificação de Email
  email_verificado: Boolean         ← Email confirmado?
  token_verificacao_email: String   ← Token para confirmar email
  token_verificacao_expiracao: DateTime ← Validade (24h)
  
  -- Segurança de Login
  tentativas_login: Integer         ← Contador de tentativas falhas
  bloqueado_ate: DateTime           ← Desbloqueio automático
  
  -- Status
  ativo: Boolean                    ← Ativado?
  banido: Boolean                   ← Banido pela paróquia?
  motivo_banimento: Text            ← Razão do banimento
  banido_por_id: String(50)         ← Quem baniu
  banido_em: DateTime               ← Quando foi banido
  
  -- Sistema
  is_bootstrap: Boolean             ← Marca usuário "Admin/admin123"
  
  -- Timestamps (Timezone: America/Fortaleza)
  criado_em: DateTime               ← Quando foi criado
  atualizado_em: DateTime           ← Última atualização
  ultimo_acesso: DateTime           ← Último login
}
```

---

## 🎮 Páginas Principais Relacionadas a Usuários

### Para Fiéis (Participantes)

| Página | Rota | Descrição |
|--------|------|-----------|
| **Cadastro** | `/signup` | Auto-registro com CPF + Email |
| **Login** | `/login` | Autenticação com CPF/Email |
| **Dashboard** | `/dashboard` | Visão geral pessoal, meus bingos |
| **Bingos Disponíveis** | `/games` | Lista de bingos para participar |
| **Detalhe Bingo** | `/games/:id` | Dados e cartelas do bingo |
| **Meu Perfil** | `/profile` | Editar dados pessoais |
| **Enviar Feedback** | `/send-feedback` | Sugestões, bugs, reclamações |

### Para Super Admin

| Página | Rota | Descrição |
|--------|------|-----------|
| **Login Admin** | `/admin-site/login` | Autenticação (Admin/admin123) |
| **Dashboard** | `/admin-site/dashboard` | Visão geral do sistema |
| **Gerenciar Usuários** | `/admin-site/usuarios` | Criar/editar usuários |
| **Gerenciar Admins** | `/admin-site/admins` | Promover/rebaixar Super Admins |
| **Gerenciar Paróquias** | `/admin-site/paroquias` | CRUD de paróquias |
| **Sistema de Feedback** | `/admin-site/feedback` | Ver/responder feedbacks |
| **Configurações** | `/admin-site/configuracoes` | Config globais |
| **Relatórios** | `/admin-site/relatorios` | Estatísticas do sistema |
| **Auditoria** | `/admin-site/auditoria` | Log de todas as ações |

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
✅ Página dedicada: /admin-site/admins
✅ Super Admin pode:
   ├─ Visualizar todos os usuários do sistema
   ├─ Promover qualquer usuário a Super Admin
   ├─ Rebaixar Super Admin para outro tipo
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
   ├─ Gerenciar outros Super Admins
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

## 🔄 Renovações Futuras (Roadmap)

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
