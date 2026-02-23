# 🎨 Frontend - Sistema Bingo da Comunidade

**Stack**: Vite 7.2.4 + React 19.2.0 + TypeScript 5.9.3  
**Status**: ✅ Base Implementada (100%)

---

## 📦 Tecnologias

- **Build Tool**: Vite 7.2.4 (HMR ultra-rápido)
- **Framework**: React 19.2.0 (Compiler ativado)
- **Linguagem**: TypeScript 5.9.3
- **HTTP Client**: Axios 1.7.0
- **Package Manager**: npm
- **Linting**: ESLint 9.39.1

---

## 📂 Estrutura de Pastas

```
frontend/
├── src/
│   ├── main.tsx                 # Entry point da aplicação
│   ├── App.tsx                  # Componente raiz
│   │
│   ├── types/                   # Definições TypeScript
│   │   └── index.ts             # Interfaces que refletem backend
│   │
│   ├── services/                # Camada de API
│   │   └── api.ts               # Cliente axios + serviços
│   │
│   ├── components/              # Componentes reutilizáveis
│   │   └── Header.tsx           # Header com dados da paróquia
│   │
│   ├── pages/                   # Páginas completas
│   │   └── Home.tsx             # Página inicial
│   │
│   └── assets/                  # Assets estáticos
│
├── public/                      # Assets públicos
│
├── index.html                   # HTML base
├── vite.config.ts               # Configuração Vite
├── tsconfig.json                # Configuração TypeScript
├── package.json                 # Dependências
├── Dockerfile                   # Container Docker
├── .dockerignore                # Exclusões Docker
├── .env                         # Variáveis de ambiente
└── .env.example                 # Template de variáveis
```

---

## 🔧 Configuração

### Variáveis de Ambiente

Arquivo `.env`:
```env
# URL da API Backend
VITE_API_URL=http://localhost:8000

# Ambiente
NODE_ENV=development
```

⚠️ **IMPORTANTE**: Variáveis Vite devem começar com `VITE_` para serem expostas ao navegador.

---

## 🚀 Como Rodar

### Fluxo Oficial (Docker)
```bash
# Na raiz do projeto
docker compose up --build
```

Acesse: http://localhost:5173

### Testes (Direto no Contêiner)
```bash
# Frontend (Vitest)
docker compose exec frontend npm run test -- --run

# Backend (Pytest)
docker compose exec backend pytest -q
```

As execuções devem ocorrer no contêiner, sem criação/ativação de ambiente virtual local.

---

## 📡 Camada de API (`services/api.ts`)

### Serviço de Autenticação

```typescript
import { authService } from '@/services/api'

// Cadastro
const token = await authService.signup({
  nome: 'João Silva',
  cpf: '12345678909',
  email: 'joao@example.com',
  telefone: '85987654321',
  chave_pix: 'joao@example.com',
  senha: 'Senha@123'
})

// Login
const token = await authService.login({
  cpf: '12345678909',
  senha: 'Senha@123'
})

// Logout
authService.logout()
```

### Serviço de Paróquia

```typescript
import { paroquiaService } from '@/services/api'

// Buscar paróquia atual
const paroquia = await paroquiaService.getParoquiaAtual()
console.log(paroquia.nome) // "Paróquia São José"
```

---

## 📘 Types TypeScript

Todas as interfaces em `types/index.ts` refletem exatamente os schemas do backend:

```typescript
export interface Paroquia {
  id: string
  nome: string
  email: string
  telefone: string
  chave_pix: string
  cidade: string
  estado: string
  ativa: boolean
  criado_em: string
}

export interface SignupRequest {
  nome: string
  cpf: string
  email: string
  telefone: string
  chave_pix: string
  senha: string
}
```

---

## 🔥 Hot Module Replacement

O Vite oferece HMR ultra-rápido. Mudanças no código aparecem instantaneamente no navegador.

Volumes Docker configurados:
```yaml
volumes:
  - ./frontend/src:/app/src
  - ./frontend/public:/app/public
  - ./frontend/index.html:/app/index.html
  - /app/node_modules
```

---

## 🚀 Próximos Passos

1. **React Router** - Adicionar roteamento
2. **Páginas Auth** - Login e Cadastro
3. **AuthContext** - Context API para auth
4. **Estilização** - Tailwind/MUI/Styled Components
5. **Protected Routes** - Rotas protegidas

---

## 📚 Documentação

- [INTEGRACAO_FRONTEND_DOCKER.md](../INTEGRACAO_FRONTEND_DOCKER.md) - Arquitetura completa
- [TESTES_SISTEMA.md](../TESTES_SISTEMA.md) - Testes de validação
- [COMANDOS_RAPIDOS.md](../COMANDOS_RAPIDOS.md) - Comandos úteis

---

**Versão**: 1.0.0  
**Criado em**: 13/01/2026
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
