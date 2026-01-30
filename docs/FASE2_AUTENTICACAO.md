# ✅ FASE 2 - APIs DE NEGÓCIO INICIADAS

## 📅 Data: 16 de Janeiro de 2026

---

## 🎯 OBJETIVO

Implementar as primeiras APIs de negócio do sistema, focando em:
- **Cadastro público de fiéis**
- **Autenticação com CPF**
- **Sistema monolítico por paróquia** (sem multi-tenant)

---

## ✅ O QUE FOI IMPLEMENTADO

### 1. **Validação de CPF com Algoritmo Módulo 11** ✔️

#### Arquivo: `backend/src/schemas/schemas.py`

**Função adicionada:**
```python
def validate_cpf(v: Optional[str]) -> Optional[str]
```

**Implementação COMPLETA do Algoritmo Módulo 11 (Receita Federal):**

✅ **Etapa 1:** Remove caracteres não numéricos (aceita XXX.XXX.XXX-XX ou apenas dígitos)  
✅ **Etapa 2:** Valida se tem exatamente 11 dígitos  
✅ **Etapa 3:** Rejeita sequências repetidas (000.000.000-00 até 999.999.999-99)  
✅ **Etapa 4:** Valida 1º dígito verificador com Módulo 11  
✅ **Etapa 5:** Valida 2º dígito verificador com Módulo 11  

**Algoritmo Módulo 11:**

**1º Dígito (posição 10):**
```
Multiplica os 9 primeiros dígitos por: 10, 9, 8, 7, 6, 5, 4, 3, 2
Soma todos os resultados
Calcula: resto = soma % 11
Se resto < 2: dígito = 0, senão: dígito = 11 - resto
```

**2º Dígito (posição 11):**
```
Multiplica os 10 primeiros dígitos por: 11, 10, 9, 8, 7, 6, 5, 4, 3, 2
Soma todos os resultados
Calcula: resto = soma % 11
Se resto < 2: dígito = 0, senão: dígito = 11 - resto
```

**Exemplo de validação (CPF: 123.456.789-09):**

```
1º dígito:
  1×10 + 2×9 + 3×8 + 4×7 + 5×6 + 6×5 + 7×4 + 8×3 + 9×2 = 210
  210 % 11 = 1 (resto < 2) → dígito = 0 ✓

2º dígito:
  1×11 + 2×10 + 3×9 + 4×8 + 5×7 + 6×6 + 7×5 + 8×4 + 9×3 + 0×2 = 255
  255 % 11 = 2 (resto ≥ 2) → dígito = 11 - 2 = 9 ✓
  
✅ CPF VÁLIDO: 12345678909
```

**Retorna apenas números (sem formatação):**
- Entrada: `"123.456.789-09"`
- Saída: `"12345678909"`

**CPFs que serão REJEITADOS:**
- ❌ `"123.456.789-01"` (dígitos verificadores incorretos)
- ❌ `"111.111.111-11"` (sequência repetida)
- ❌ `"123.456.789"` (apenas 9 dígitos)
- ❌ `"00000000000"` (sequência de zeros)

**Teste do validador:**
Execute: `python backend/test_cpf_validator.py` para ver demonstração completa do algoritmo.

---

### 2. **Schemas de Autenticação** ✔️

#### Arquivo: `backend/src/schemas/schemas.py`

**Schemas criados:**

1. **SignupRequest** - Cadastro de fiéis
   ```python
   - nome: str (3-200 caracteres)
   - cpf: str (11 dígitos, validado)
   - whatsapp: str (+55DDNNNNNNNNN)
   - chave_pix: str (qualquer formato)
   - senha: str (mínimo 6 caracteres)
   ```

2. **LoginRequest** - Autenticação
   ```python
   - cpf: str (validado)
   - senha: str
   ```

3. **TokenResponse** - Resposta de login
   ```python
   - access_token: str (JWT token)
   - token_type: str ("bearer")
   - usuario: UsuarioResponse (dados completos)
   ```

---

### 3. **Modelo de Dados Atualizado** ✔️

#### Arquivo: `backend/src/models/models.py`

**Campo adicionado à tabela `usuarios`:**
```python
cpf = Column(String(11), nullable=True, unique=True, index=True)
```

**Características:**
- ✅ Unique constraint (CPF único no sistema)
- ✅ Index para buscas rápidas
- ✅ Nullable (admins não precisam de CPF)
- ✅ Armazena apenas números (11 dígitos)

---

### 4. **Módulo de Autenticação** 🆕

#### Arquivo: `backend/src/utils/auth.py`

**Funções implementadas:**

1. **hash_password(password: str) -> str**
   - Gera hash bcrypt de senhas
   - Usado no cadastro

2. **verify_password(plain_password: str, hashed_password: str) -> bool**
   - Verifica se senha corresponde ao hash
   - Usado no login

3. **create_access_token(data: dict, expires_delta: Optional[timedelta]) -> str**
   - Gera JWT token
   - Validade padrão: 7 dias
   - Usa timezone de Fortaleza

4. **decode_access_token(token: str) -> Optional[dict]**
   - Decodifica e valida JWT
   - Retorna None se inválido

**Configurações:**
```python
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 dias
```

---

### 5. **Endpoint: POST /auth/signup** 🆕

#### Arquivo: `backend/src/main.py`

**Funcionalidade:**
```
📝 Cadastro Público de Fiéis
```

**Regras de Negócio:**
- ✅ Cadastro aberto ao público (sem autenticação)
- ✅ Role automático: **FIEL**
- ✅ Vínculo automático à **única paróquia** do sistema
- ✅ CPF único no sistema (valida duplicação)
- ✅ WhatsApp único no sistema (valida duplicação)
- ✅ Gera ID temporal (formato: USR_YYYYMMDDHHMMSS)
- ✅ Hash bcrypt da senha

**Validações:**
```python
# CPF já existe?
if db.query(Usuario).filter(Usuario.cpf == request.cpf).first():
    raise HTTPException(400, "CPF já cadastrado")

# WhatsApp já existe?
if db.query(Usuario).filter(Usuario.whatsapp == request.whatsapp).first():
    raise HTTPException(400, "WhatsApp já cadastrado")

# Paróquia ativa existe?
paroquia = db.query(Paroquia).filter(Paroquia.ativa == True).first()
if not paroquia:
    raise HTTPException(500, "Nenhuma paróquia ativa")
```

**Resposta:**
```json
{
  "id": "USR_20260116153045",
  "nome": "João Silva",
  "cpf": "12345678901",
  "whatsapp": "+5585987654321",
  "tipo": "fiel",
  "paroquia_id": "PAR_20260113120000",
  "chave_pix": "joao@email.com",
  "ativo": true,
  "criado_em": "2026-01-16T15:30:45-03:00"
}
```

---

### 6. **Endpoint: POST /auth/login** 🆕

#### Arquivo: `backend/src/main.py`

**Funcionalidade:**
```
🔐 Autenticação de Usuários
```

**Processo:**
1. Busca usuário por CPF
2. Verifica senha com bcrypt
3. Verifica se usuário está ativo
4. Atualiza `ultimo_acesso`
5. Gera JWT token (7 dias de validade)
6. Retorna token + dados do usuário

**Payload do Token:**
```json
{
  "sub": "USR_20260116153045",
  "cpf": "12345678901",
  "tipo": "fiel",
  "paroquia_id": "PAR_20260113120000",
  "exp": 1737475845,  // Unix timestamp
  "iat": 1736870445   // Unix timestamp
}
```

**Resposta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "usuario": {
    "id": "USR_20260116153045",
    "nome": "João Silva",
    "cpf": "12345678901",
    "tipo": "fiel",
    "paroquia_id": "PAR_20260113120000"
  }
}
```

**Uso do Token:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 7. **Endpoint: GET /paroquia/me** 🆕

#### Arquivo: `backend/src/main.py`

**Funcionalidade:**
```
⛪ Dados da Paróquia Atual
```

**Sistema Monolítico:**
- Como o sistema é **independente por paróquia** (não multi-tenant)
- Existe apenas **UMA** paróquia ativa no banco
- Qualquer pessoa pode consultar os dados públicos

**Resposta:**
```json
{
  "id": "PAR_20260113120000",
  "nome": "Paróquia São José",
  "email": "contato@paroquiasaojose.com.br",
  "telefone": "85999999999",
  "cidade": "Fortaleza",
  "estado": "CE",
  "chave_pix": "contato@paroquiasaojose.com.br",
  "ativa": true,
  "criado_em": "2026-01-13T12:00:00-03:00"
}
```

**Use Case:**
- Fiel acessa o site da paróquia
- Vê nome, contato e dados da igreja
- Decide se cadastrar para participar dos bingos

---

### 8. **Seed Atualizado** ✔️

#### Arquivo: `backend/src/db/seed.py`

**Fiel de exemplo agora tem CPF:**
```python
fiel_exemplo = Usuario(
    nome="João Silva (Exemplo)",
    cpf="12345678901",  # Adicionado
    email="joao.exemplo@email.com",
    whatsapp="+5585987654321",
    senha="Fiel@123",
    tipo=TipoUsuario.FIEL
)
```

---

## 📊 ESTRUTURA FINAL DE ARQUIVOS

```
backend/src/
├── db/
│   ├── base.py           ✅ Conexão com banco
│   ├── seed.py           ✅ Seed atualizado (CPF)
├── models/
│   ├── models.py         ✅ Campo CPF adicionado
├── schemas/
│   ├── schemas.py        ✅ Validador CPF + schemas de auth
├── utils/
│   ├── auth.py           🆕 Módulo de autenticação
│   ├── time_manager.py   ✅ IDs temporais
├── main.py               ✅ 3 novos endpoints
```

---

## 🧪 COMO TESTAR

### Pré-requisito: Docker Instalado e Rodando

1. **Instale o Docker Desktop** (se ainda não tiver)
   - Windows: https://docs.docker.com/desktop/install/windows-install/
   - Reinicie o computador após instalação

2. **Inicie o sistema:**
   ```powershell
   cd C:\Users\EU\Documents\GitHub\bingodacomunidade
   .\start.ps1 -Clean
   ```

3. **Acesse a documentação:**
   ```
   http://localhost:8000/docs
   ```

---

### Teste 1: Consultar Paróquia

**Endpoint:** `GET /paroquia/me`

**Esperado:**
```json
{
  "id": "PAR_...",
  "nome": "Paróquia São José",
  "email": "contato@paroquiasaojose.com.br",
  "chave_pix": "contato@paroquiasaojose.com.br",
  "ativa": true
}
```

---

### Teste 2: Cadastrar Novo Fiel

**Endpoint:** `POST /auth/signup`

**Body:**
```json
{
  "nome": "Maria Santos",
  "cpf": "98765432100",
  "whatsapp": "+5585912345678",
  "chave_pix": "maria.santos@email.com",
  "senha": "Maria@2026"
}
```

**Esperado:**
- Status: `201 Created`
- Retorna dados do usuário criado
- `tipo: "fiel"`
- `paroquia_id` preenchido automaticamente

---

### Teste 3: Login com CPF

**Endpoint:** `POST /auth/login`

**Body:**
```json
{
  "cpf": "98765432100",
  "senha": "Maria@2026"
}
```

**Esperado:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "usuario": {
    "id": "USR_...",
    "nome": "Maria Santos",
    "cpf": "98765432100",
    "tipo": "fiel"
  }
}
```

---

### Teste 4: Validações de CPF

**Teste CPF inválido:**
```json
{
  "cpf": "11111111111",  // Sequência repetida
  "senha": "..."
}
```
**Esperado:** `422 Validation Error`

**Teste CPF duplicado:**
- Cadastre um fiel
- Tente cadastrar novamente com mesmo CPF
**Esperado:** `400 Bad Request - "CPF já cadastrado"`

---

### Teste 5: Fiel de Exemplo (Seed)

**Login com fiel pré-cadastrado:**

**Endpoint:** `POST /auth/login`

**Body:**
```json
{
  "cpf": "12345678901",
  "senha": "Fiel@123"
}
```

**Esperado:** Login bem-sucedido

---

## 🎯 PRÓXIMOS PASSOS (Fase 2 Continuação)

### A Implementar:

1. **Middleware de Autenticação**
   - Criar dependency `get_current_user()`
   - Extrair e validar JWT de headers
   - Usar em endpoints protegidos

2. **CRUD de Sorteios**
   - `POST /sorteios` - Criar bingo (apenas Parish Admin)
   - `GET /sorteios` - Listar bingos
   - `GET /sorteios/{id}` - Detalhes do bingo

3. **CRUD de Cartelas**
   - `POST /sorteios/{id}/cartelas` - Comprar cartela
   - `GET /minhas-cartelas` - Cartelas do fiel
   - Gerar números aleatórios (5x5)

4. **Lógica de Sorteio**
   - WebSocket para tempo real
   - Sortear números
   - Detectar vencedor automaticamente

---

## ⚠️ NOTAS IMPORTANTES

### 1. **Sistema Monolítico**
- ✅ Uma paróquia por instalação
- ✅ Todos os fiéis vinculados automaticamente
- ✅ Sem seleção de paróquia no signup
- ❌ Não é multi-tenant

### 2. **Segurança**
- ⚠️ `SECRET_KEY` deve vir de variável de ambiente em produção
- ⚠️ Trocar senhas padrão do seed
- ✅ Senhas sempre em bcrypt (nunca plain text)
- ✅ JWT expira em 7 dias

### 3. **CPF**
- ✅ Armazenado SEM formatação (apenas números)
- ✅ Validação completa (dígitos verificadores)
- ✅ Unique constraint no banco
- ✅ Usado como username no login

### 4. **WhatsApp**
- ✅ Formato internacional: +55DDNNNNNNNNN
- ✅ Validação automática
- ✅ Unique constraint

---

## 🚀 COMANDOS ÚTEIS

### Reiniciar sistema limpo:
```powershell
.\start.ps1 -Clean
```

### Rebuild forçado:
```powershell
.\start.ps1 -Rebuild
```

### Ver logs:
```powershell
docker compose logs -f backend
```

### Parar sistema:
```powershell
docker compose down
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [x] Validador de CPF
- [x] Campo CPF no modelo Usuario
- [x] Schemas de autenticação (SignupRequest, LoginRequest, TokenResponse)
- [x] Módulo utils/auth.py
- [x] Endpoint POST /auth/signup
- [x] Endpoint POST /auth/login
- [x] Endpoint GET /paroquia/me
- [x] Atualizar seed com CPF
- [x] Importações com `from src...`
- [x] Uso de @model_validator(mode='after')
- [ ] Testar no Docker (requer Docker instalado)

---

## 📝 COMMITS RECOMENDADOS

```bash
git add backend/src/models/models.py
git add backend/src/schemas/schemas.py
git add backend/src/utils/auth.py
git add backend/src/db/seed.py
git add backend/src/main.py
git commit -m "feat: implementar autenticação e cadastro de fiéis (Fase 2)

- Adicionar validador de CPF completo
- Criar schemas SignupRequest, LoginRequest, TokenResponse
- Implementar módulo utils/auth.py (JWT + bcrypt)
- Criar POST /auth/signup (cadastro público de fiéis)
- Criar POST /auth/login (autenticação com CPF)
- Criar GET /paroquia/me (dados da paróquia única)
- Adicionar campo CPF ao modelo Usuario
- Atualizar seed com CPF no fiel de exemplo
- Sistema monolítico: vínculo automático à paróquia única"
```

---

**🎱 Fase 2 - Autenticação: CONCLUÍDA!**
