# 🎉 Sistema de Bingo Comunitário

> **Sistema completo de gestão de bingos para paróquias e comunidades**  
> Transparente • Seguro • Fácil de usar • Pronto para produção

**Status:** ✅ 100% Funcional | **Versão:** 1.0.0 | **Data:** 25/01/2026

**🆕 NOVIDADE:** Sistema de Primeiro Acesso Seguro implementado!

---

## 🚀 Início Rápido (3 Comandos)

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/bingodacomunidade.git
cd bingodacomunidade

# 2. Suba os containers
docker compose up -d --build

# 3. Acesse o sistema
# Frontend: http://localhost:5173
# Backend:  http://localhost:8000/docs
```

### 🔐 Primeiro Acesso (NOVO!)

**Desenvolvimento (Padrão):**
- Sistema cria 3 usuários de teste automaticamente
- Login: CPF `111.444.777-35` / Senha `Fiel@123`

**Produção:**
1. Altere `SEED_ENABLED=false` no docker-compose.yml
2. Acesse http://localhost:5173
3. Tela de configuração aparece automaticamente
4. Crie sua conta de Desenvolvedor
5. Esta tela **só aparece uma vez**

📚 **Documentação completa:** `SISTEMA_PRIMEIRO_ACESSO.md`

---

## 📋 Funcionalidades

### ✅ Implementado

- **🔐 Segurança de Nível Bancário** (NOVO!)
  - Primeiro acesso protegido (só funciona uma vez)
  - Inatividade automática (15 minutos)
  - Proteção brute-force (5 tentativas)
  - Token JWT (16 horas)
  - Verificação de email obrigatória
  - Senha forte validada

- **Autenticação JWT** - Login seguro com tokens
- **Gestão de Jogos** - Criar, editar, listar e visualizar jogos
- **Compra de Cartelas** - Sistema completo de vendas
- **Perfis de Usuário** - Super Admin, Parish Admin e Fiel
- **Rateio Financeiro** - Distribuição configurável (4 destinos)
- **Interface Moderna** - React + TypeScript, responsiva
- **Navegação Completa** - Rotas protegidas e públicas
- **Dockerizado** - Pronto para deploy

### 🔄 Próximas Features

- Sistema de sorteio ao vivo (WebSocket)
- Integração PIX para pagamentos
- Notificações em tempo real
- Dashboard com estatísticas
- Relatórios exportáveis

---

## 🏗️ Arquitetura

### Backend
- **FastAPI** 0.109.0 (Python 3.11+)
- **SQLAlchemy** ORM
- **Pydantic** v2 para validações
- **JWT** para autenticação
- **bcrypt** para senhas
- **SQLite** banco de dados

### Frontend
- **React** 19.2.0
- **TypeScript** 5.9.3
- **Vite** 7.2.4
- **React Router** 7.1.3
- **Axios** para API

### DevOps
- **Docker** & Docker Compose
- **PowerShell** scripts
- Hot-reload em desenvolvimento

---

## 📂 Estrutura do Projeto

```
bingodacomunidade/
├── backend/
│   ├── src/
│   │   ├── db/          # Banco de dados
│   │   ├── models/      # Modelos ORM
│   │   ├── schemas/     # Validações
│   │   ├── utils/       # Auth, helpers
│   │   └── main.py      # API FastAPI
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/       # 7 páginas
│   │   ├── components/  # Componentes
│   │   ├── contexts/    # Auth context
│   │   ├── services/    # API client
│   │   └── App.tsx      # Rotas
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── *.md                 # Documentação
```

---

## 🎯 Como Usar

### 1. Usuário Comum (Fiel)

1. Acesse http://localhost:5173
2. Faça login ou crie uma conta
3. Vá em **"Jogos"**
4. Escolha um jogo e clique em **"Comprar Cartela"**
5. Sua cartela será gerada automaticamente!

### 2. Administrador da Paróquia

1. Faça login com conta de admin
2. Clique em **"Criar Novo Jogo"**
3. Preencha:
   - Título, descrição e data
   - Valor da cartela
  - Rateio financeiro (deve somar 100%)
    - Prêmio: mínimo 49%
    - Operação: mínimo 1/3 do percentual da Paróquia
    - Seguro Operacional (campo técnico `evolution_percent`): mínimo 1%
   - Limite de cartelas (opcional)
4. Publique o jogo
5. Acompanhe as vendas e participantes

---

## 🔐 Segurança

- ✅ Senhas criptografadas com bcrypt
- ✅ Tokens JWT com expiração
- ✅ Rotas protegidas por autenticação
- ✅ Validação de CPF (Módulo 11)
- ✅ IDs temporais imutáveis
- ✅ CORS configurado

---

## 📊 Endpoints da API

### Autenticação
```
POST /auth/login          # Login (retorna JWT)
```

### Usuários
```
GET  /users/me            # Dados do usuário
PUT  /users/me            # Atualizar perfil
POST /users/register      # Criar conta
```

### Jogos
```
GET    /games             # Listar jogos
POST   /games             # Criar jogo (Admin)
GET    /games/{id}        # Detalhes do jogo
PUT    /games/{id}        # Atualizar (Admin)
DELETE /games/{id}        # Deletar (Admin)
```

### Cartelas
```
POST /games/{id}/cards    # Comprar cartela
GET  /games/{id}/cards    # Listar cartelas do jogo
GET  /users/me/cards      # Minhas cartelas
```

Documentação completa: http://localhost:8000/docs

---

## 🛠️ Comandos Úteis

```powershell
# Iniciar sistema
docker compose up -d

# Ver logs
docker compose logs -f

# Parar sistema
docker compose down

# Reconstruir containers
docker compose up --build -d

# Ver containers rodando
docker compose ps

# Acessar backend
docker compose exec backend bash

# Acessar frontend
docker compose exec frontend sh
```

---

## 📚 Documentação Completa

- [START_HERE.md](START_HERE.md) - Guia de início rápido
- [APLICACAO_FINALIZADA.md](APLICACAO_FINALIZADA.md) - Resumo completo
- [IMPLEMENTACAO_AUTENTICACAO.md](IMPLEMENTACAO_AUTENTICACAO.md) - Sistema de auth
- [Briefing.md](Briefing.md) - Conceito e visão do projeto
- [COMANDOS_RAPIDOS.md](COMANDOS_RAPIDOS.md) - Referência de comandos

---

## 🎨 Screenshots

### Home Page
Landing page moderna com gradientes e call-to-action.

### Dashboard
Painel principal com informações do usuário e ações rápidas.

### Listagem de Jogos
Filtros por status, cards informativos, dados em tempo real.

### Detalhes do Jogo
Informações completas, rateio, botão de compra, lista de participantes.

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Add: Nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é **código aberto** e está disponível sob a licença MIT.

---

## 👨‍💻 Autor

Desenvolvido com ❤️ para comunidades paroquiais

---

## 🙏 Agradecimentos

Este sistema foi criado pensando em proporcionar **transparência absoluta** e **facilidade de uso** para paróquias e comunidades que desejam realizar bingos beneficentes de forma justa e segura.

**"Não é apenas um jogo. É um espetáculo de fé, transparência e tecnologia."**

---

## 📞 Suporte

- 📧 Email: suporte@bingodacomunidade.com.br
- 📱 WhatsApp: (85) 99999-9999
- 🌐 Site: www.bingodacomunidade.com.br

---

**⭐ Se este projeto foi útil, considere dar uma estrela no GitHub!**
