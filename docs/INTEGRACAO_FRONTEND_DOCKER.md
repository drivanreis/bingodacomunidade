# Integração Frontend + Docker

## ✅ Concluído

A arquitetura Docker agora possui **3 containers** orquestrados:

### 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                  Docker Compose                      │
├──────────────┬──────────────────┬────────────────────┤
│   Backend    │     Frontend     │      Database      │
│  (FastAPI)   │  (Vite+React)    │     (SQLite)       │
│  Porta 8000  │   Porta 5173     │  Volume Persistente│
└──────────────┴──────────────────┴────────────────────┘
```

### 📦 Container 1: Backend
- **Imagem**: Python 3.11-slim
- **Porta**: 8000
- **Framework**: FastAPI
- **Banco**: SQLite em volume persistente (`./backend/data`)
- **Healthcheck**: Verifica endpoint `/ping`
- **Hot-reload**: `./backend/src` montado como volume

### 📦 Container 2: Frontend
- **Imagem**: Node 20 Alpine
- **Porta**: 5173
- **Framework**: Vite + React 19.2 + TypeScript 5.9
- **Dependências**: axios para consumir API
- **Variáveis**:
  - `VITE_API_URL=http://localhost:8000`
  - `NODE_ENV=development`
- **Hot-reload**: 
  - `./frontend/src` (código fonte)
  - `./frontend/public` (assets estáticos)
  - `./frontend/index.html`
- **Depends on**: Aguarda backend estar saudável

### 📦 Container 3: Database (Embutido)
- **Tipo**: SQLite
- **Localização**: `./backend/data/bingo.db`
- **Persistência**: Volume bind mount
- **Migrations**: Auto-executadas no startup do backend

---

## 🚀 Como Usar

### 1️⃣ Primeira Instalação

```powershell
# 1. Instalar dependências do frontend (apenas primeira vez)
cd frontend
npm install
cd ..

# 2. Criar arquivo .env no frontend (copiar do exemplo)
Copy-Item frontend\.env.example frontend\.env

# 3. Subir todos os containers
docker compose up --build
```

### 2️⃣ Uso Diário

```powershell
# Iniciar sistema
docker compose up

# Parar sistema (mantém dados)
docker compose down

# Ver logs em tempo real
docker compose logs -f

# Ver logs apenas do backend
docker compose logs -f backend

# Ver logs apenas do frontend
docker compose logs -f frontend

# Reconstruir containers após mudanças no Dockerfile
docker compose up --build
```

### 3️⃣ Acessar Aplicação

- **Frontend**: http://localhost:5173
- **Backend (API)**: http://localhost:8000
- **Documentação Swagger**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

---

## 📂 Estrutura de Pastas

```
frontend/
├── src/
│   ├── components/      # Componentes reutilizáveis
│   │   └── Header.tsx   # Mostra nome da paróquia (GET /paroquia/me)
│   ├── pages/           # Páginas completas
│   │   └── Home.tsx     # Página inicial
│   ├── services/        # Camada de API
│   │   └── api.ts       # Cliente axios + serviços
│   ├── types/           # Definições TypeScript
│   │   └── index.ts     # Interfaces que refletem backend
│   ├── App.tsx          # Componente raiz
│   └── main.tsx         # Entry point
├── public/              # Assets estáticos
├── .env                 # Variáveis de ambiente (não commitado)
├── .env.example         # Template de variáveis
├── Dockerfile           # Container do frontend
├── package.json         # Dependências (axios incluído)
└── vite.config.ts       # Configuração Vite
```

---

## 🔧 Configuração

### Variáveis de Ambiente - Backend
Ver `docker-compose.yml` (todas declaradas explicitamente):
- `USE_SQLITE=true`
- `DATABASE_URL=sqlite:////app/data/bingo.db`
- `TIMEZONE=America/Fortaleza`
- Dados de seed (owner, paróquia padrão)

### Variáveis de Ambiente - Frontend
Ver `frontend/.env.example`:
- `VITE_API_URL=http://localhost:8000`
- `NODE_ENV=development`

---

## 🧪 Testando Integração

### 1. Verificar Backend
```powershell
# Ping básico
curl http://localhost:8000/ping

# Health check
curl http://localhost:8000/health

# Dados da paróquia (sem autenticação)
curl http://localhost:8000/paroquia/me
```

### 2. Verificar Frontend
- Acessar http://localhost:5173
- Deve carregar a página inicial
- Header deve mostrar nome da paróquia (Paróquia São José)

### 3. Testar Hot-Reload

**Backend:**
```powershell
# Edite backend/src/main.py
# O servidor FastAPI recarrega automaticamente
docker compose logs -f backend
```

**Frontend:**
```powershell
# Edite frontend/src/components/Header.tsx
# Vite atualiza no navegador instantaneamente
docker compose logs -f frontend
```

---

## 📝 Arquivos Criados/Modificados

### ✅ Criados
1. `frontend/Dockerfile` - Container Node 20 Alpine + Vite
2. `frontend/.dockerignore` - Exclusões de build
3. `frontend/.env.example` - Template de variáveis
4. `frontend/src/types/index.ts` - Interfaces TypeScript
5. `frontend/src/services/api.ts` - Cliente axios + API layer
6. `frontend/src/components/Header.tsx` - Componente de header
7. `frontend/src/pages/Home.tsx` - Página inicial

### ✅ Modificados
1. `docker-compose.yml` - Adicionado serviço frontend
2. `frontend/package.json` - Adicionado axios 1.7.0
3. `frontend/src/App.tsx` - Importa página Home
4. `frontend/src/main.tsx` - Remove import de CSS removido

### ✅ Removidos
1. `frontend/src/App.css` - CSS padrão do Vite
2. `frontend/src/index.css` - CSS global padrão
3. `frontend/src/assets/react.svg` - Logo Vite

---

## 🎯 Próximos Passos Sugeridos

1. **Criar página de Login** (`frontend/src/pages/Login.tsx`)
   - Formulário com input de CPF
   - Validação Módulo 11 no frontend
   - Integração com `authService.login()`

2. **Criar página de Cadastro** (`frontend/src/pages/Signup.tsx`)
   - Formulário completo de fiel
   - Integração com `authService.signup()`

3. **Implementar roteamento** (React Router)
   - `/` - Home pública
   - `/login` - Login de fiéis
   - `/signup` - Cadastro de novos fiéis
   - `/admin` - Dashboard administrativo (protegido)

4. **Adicionar Context API para autenticação**
   - `AuthContext` para gerenciar estado do usuário logado
   - Protected Routes
   - Redirecionamento automático

5. **Estilização**
   - Adicionar Tailwind CSS ou Material-UI
   - Design system da paróquia

---

## 🐛 Troubleshooting

### Frontend não conecta ao backend
```powershell
# Verificar se backend está rodando
docker compose ps

# Verificar logs do backend
docker compose logs backend

# Verificar variável de ambiente
cat frontend\.env
# Deve ter: VITE_API_URL=http://localhost:8000
```

### Erro "Cannot find module 'axios'"
```powershell
# Reinstalar dependências
cd frontend
npm install
cd ..

# Recriar container
docker compose up --build frontend
```

### Hot-reload não funciona
```powershell
# Verificar volumes no docker-compose.yml
# Devem estar mapeados:
# - ./frontend/src:/app/src
# - /app/node_modules (anônimo)

# Reiniciar container
docker compose restart frontend
```

### Banco de dados sumiu
```powershell
# Verificar volume
ls backend\data\bingo.db

# Se não existir, recriar
docker compose down
docker compose up
```

---

## 📊 Status Atual

| Componente | Status | Observações |
|------------|--------|-------------|
| Backend Docker | ✅ Funcionando | FastAPI + SQLite |
| Frontend Docker | ✅ Funcionando | Vite + React + TS |
| Orquestração | ✅ Funcionando | 3 containers |
| Hot-reload Backend | ✅ Funcionando | Volume src/ |
| Hot-reload Frontend | ✅ Funcionando | Volumes src/, public/ |
| API Service Layer | ✅ Implementado | axios + interceptors |
| TypeScript Types | ✅ Completo | Reflete backend schemas |
| Componente Header | ✅ Funcionando | Consome /paroquia/me |
| Autenticação Frontend | ⏳ Pendente | Criar páginas Login/Signup |
| Roteamento | ⏳ Pendente | Adicionar React Router |
| Estilização | ⏳ Pendente | CSS/Tailwind/MUI |

---

## 📖 Documentação Relacionada

- [DOCKER_QUICKSTART.md](../DOCKER_QUICKSTART.md) - Guia rápido Docker
- [ESTRUTURA_PROJETO.md](../ESTRUTURA_PROJETO.md) - Arquitetura geral
- [backend/README_DOCKER.md](../backend/README_DOCKER.md) - Detalhes do backend
- [Dev. Guide.md](../Dev.%20Guide.md) - Guia completo de desenvolvimento
