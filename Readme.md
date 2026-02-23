# 🎱 Sistema de Bingo Comunitário

> **"Não é apenas um jogo. É um espetáculo de fé, transparência e tecnologia."**

---

## ⛪ MISSÃO PASTORAL

**Este sistema é uma ferramenta de evangelização e retenção de fé.**

Em tempos onde jogos comunitários são banidos e a frieza digital afasta os fiéis, o **Bingo da Comunidade** reúne famílias, fortalece laços comunitários e financia obras concretas da paróquia.

### 🔥 Evangelizar é Preciso

O bingo **não é o fim** — é o **meio**:
- 💒 Atração: Famílias se reúnem presencialmente
- 🎊 Convivência: Comunidade se fortalece
- ⛪ Testemunho: Transparência gera confiança
- 🤝 Missão: Recursos financiam evangelização

📖 **[Leia a documentação completa sobre a Missão Pastoral](MISSAO_PASTORAL.md)**

---

## 📖 O QUE É ESTE SISTEMA?

O **Sistema de Bingo Comunitário** é uma plataforma digital **gratuita e de código aberto**, projetada especificamente para **paróquias, igrejas e comunidades** que desejam realizar bingos beneficentes de forma **totalmente transparente, segura e justa**.

### 🌟 Nossa Visão

Este não é um sistema de sorteio comum. É uma **máquina de confiança e evangelização** onde:

- 🙏 **O fiel se diverte e permanece na comunidade** com segurança e transparência absoluta
- ⛪ **A paróquia arrecada e evangeliza** recursos para suas obras e missões sociais
- 🔐 **A tecnologia garante justiça e confiança** — ninguém pode trapacear
- 📊 **Cada centavo é auditável** — do início ao fim
- 💒 **A comunidade se fortalece** — famílias reunidas em nome da fé

### 💎 O Diferencial

#### 1️⃣ **Transparência Total**
Qualquer participante pode **ver a cartela de qualquer outro jogador** em tempo real. Se alguém tentar trapacear, **todos verão**.

#### 2️⃣ **IDs Temporais Imutáveis**
Cada bingo, cartela e transação recebe um **ID baseado em data e hora** (exemplo: `BNG_20260113153045`). Isso funciona como um **carimbo de tempo inviolável**, tornando impossível alterar registros retroativamente.

#### 3️⃣ **Rateio Justo e Configurável**
O sistema divide automaticamente a arrecadação em **4 partes configuráveis**:
- 💰 **Prêmio** (quanto vai para o vencedor)
- ⛪ **Paróquia** (arrecadação para a igreja)
- 💻 **Operação/TI** (manutenção do sistema)
- 🚀 **Evolução** (melhorias futuras)

#### 4️⃣ **Fuso Horário Oficial (Fortaleza-CE)**
Todos os registros usam o **fuso horário de Fortaleza** como única fonte de verdade. Isso elimina manipulações de horário e garante sincronização perfeita.

#### 5️⃣ **Prêmio Pulsante**
O valor do prêmio **cresce em tempo real** conforme mais pessoas compram cartelas. Não existe prêmio fixo — quanto mais participação, maior o prêmio!

---

## 🎭 Quem São os Usuários?

### 👑 **Super Admin** (O Guardião)
- Gerencia a infraestrutura técnica
- **NÃO interfere nos jogos**
- Garante que o sistema funcione sempre

### ⛪ **Administrador da Paróquia** (O Operador)
- Funcionário autorizado pela igreja
- Agenda os bingos
- Define o rateio financeiro
- Efetua pagamentos via PIX
- **Controla o ritmo, mas não pode manipular resultados**

### 🙏 **Fiel** (O Participante)
- Cria conta com e-mail ou WhatsApp
- Registra sua chave PIX
- Compra cartelas
- Acompanha o prêmio crescer
- Recebe automaticamente em caso de vitória
- **Vê tudo — transparência absoluta**

---

## 💻 COMO INSTALAR

### 🐳 **Instalação com Docker (RECOMENDADO)**

A forma **mais rápida e fácil** de rodar o sistema completo (Backend + Frontend + Banco).

#### 📋 Pré-Requisitos
- **Docker Desktop** instalado
  - Windows: https://www.docker.com/products/docker-desktop
  - Requer Windows 10 64-bit (Pro, Enterprise ou Education) ou Windows 11
- **Node.js 18+** (para instalação inicial das dependências)
  - https://nodejs.org/

#### ⚡ Instalação Rápida

```powershell
# 1. Clone o repositório
git clone https://github.com/seu-usuario/bingodacomunidade.git
cd bingodacomunidade

# 2. Execute o script de instalação
.\install.ps1

# 3. Inicie o sistema completo
docker compose up --build
```

#### ✅ Fluxo Oficial de Homologação Final (Máquina Limpa)

O fluxo final de validação do projeto é intencionalmente mínimo, usando apenas:

```bash
git clone https://github.com/seu-usuario/bingodacomunidade.git
cd bingodacomunidade
./validar_pos_instalacao.sh
```

Regra de ouro:
- Não rodar testes fora dos contêineres.
- Após a validação, os ajustes operacionais devem ser feitos via navegador com a aplicação já funcionando.

#### 🎯 Acesse o Sistema

Após alguns segundos, o sistema estará disponível:

- **Frontend (Interface)**: http://localhost:5173
- **Backend (API)**: http://localhost:8000
- **Documentação Swagger**: http://localhost:8000/docs

#### 📦 O que está rodando?

```
┌─────────────────────────────────────────────────┐
│         3 Containers Docker Orquestrados         │
├──────────────┬──────────────┬────────────────────┤
│   Backend    │   Frontend   │     Database       │
│   FastAPI    │ Vite+React   │    SQLite em       │
│  Porta 8000  │  Porta 5173  │  Volume Persistente│
└──────────────┴──────────────┴────────────────────┘
```

#### 🔧 Comandos Úteis

```powershell
# Ver logs em tempo real
docker compose logs -f

# Parar o sistema (mantém dados)
docker compose down

# Reiniciar após mudanças no código
docker compose restart

# Limpar tudo e recomeçar
docker compose down -v
docker compose up --build
```

#### 🧪 Como Rodar Testes (Direto no Contêiner)

```bash
# Backend (Pytest)
docker compose exec backend pytest -q

# Frontend (Vitest)
docker compose exec frontend npm run test -- --run

# Cobertura (atalho do projeto)
./test.sh --coverage
```

A execução é feita diretamente no ambiente do contêiner.

#### 📚 Documentação Completa Docker
- [DOCKER_QUICKSTART.md](DOCKER_QUICKSTART.md) - Guia rápido
- [INTEGRACAO_FRONTEND_DOCKER.md](INTEGRACAO_FRONTEND_DOCKER.md) - Arquitetura completa

---

### 💻 Instalação Manual (Sem Docker)

Se preferir rodar o sistema sem Docker, siga as instruções abaixo:

### 📋 Pré-Requisitos

Antes de iniciar, certifique-se de ter:

#### ✅ **Windows 10 ou superior**
- O sistema funciona no Windows (start.bat automatiza tudo)

#### ✅ **Python 3.11 ou superior**
**Como instalar Python:**

1. Acesse: https://www.python.org/downloads/
2. Baixe a versão mais recente (botão amarelo)
3. **IMPORTANTE:** Durante a instalação, marque:
   - ☑️ **"Add Python to PATH"** (caixa na parte inferior)
4. Clique em "Install Now"
5. Aguarde a instalação
6. Reinicie o computador

**Como verificar se Python está instalado:**
1. Pressione `Windows + R`
2. Digite `cmd` e pressione Enter
3. Digite: `python --version`
4. Deve aparecer algo como: `Python 3.11.5`

#### ✅ **PostgreSQL 14 ou superior** (Opcional para primeiros testes)
**Como instalar PostgreSQL:**

1. Acesse: https://www.postgresql.org/download/windows/
2. Baixe o instalador para Windows
3. Durante a instalação:
   - Defina uma **senha** (anote em lugar seguro!)
   - Porta: `5432` (padrão)
   - Marque todas as opções padrão
4. Após instalar, abra o **pgAdmin** (vem junto)
5. Crie o banco de dados:
   - Clique com botão direito em "Databases"
   - "Create" → "Database"
   - Nome: `bingo_comunidade`
   - Clique em "Save"

---

### 📥 Baixar o Sistema

#### **Opção 1: Via Git (Recomendado)**
```bash
git clone https://github.com/seu-usuario/bingodacomunidade.git
cd bingodacomunidade
```

#### **Opção 2: Download ZIP**
1. Acesse o repositório no GitHub
2. Clique no botão verde **"Code"**
3. Clique em **"Download ZIP"**
4. Extraia o arquivo ZIP em uma pasta de sua escolha
5. Exemplo: `C:\Users\SeuNome\Documents\bingodacomunidade\`

---

### ⚙️ Configurar o Sistema

#### 1️⃣ **Criar arquivo de configuração (.env)**

1. Navegue até a pasta: `bingodacomunidade\backend\`
2. Encontre o arquivo: `.env.example`
3. **Copie** este arquivo e renomeie para: `.env`
4. Abra o arquivo `.env` com o Bloco de Notas
5. **Edite as configurações:**

```env
# ============================================================================
# CONFIGURAÇÃO DO BANCO DE DADOS
# ============================================================================

DB_USER=postgres
DB_PASSWORD=SUA_SENHA_AQUI          # ← Coloque a senha do PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bingo_comunidade

# ============================================================================
# SEGURANÇA
# ============================================================================

SECRET_KEY=sua-chave-secreta-aleatoria-muito-longa
# ⚠️ GERE UMA CHAVE ALEATÓRIA EM PRODUÇÃO!
# Use: https://randomkeygen.com/
```

6. **Salve o arquivo**

---

## 🚀 COMO INICIAR (O Botão Mágico)

### ⚡ Para Windows: Use o start.bat

Este é o **ponto de entrada único** do sistema. Ele automatiza **tudo**:

#### 🎯 **Passo a Passo:**

1. **Navegue até a pasta:**
   ```
   C:\Users\SeuNome\Documents\bingodacomunidade\backend\
   ```

2. **Dê dois cliques no arquivo:**
   ```
   start.bat
   ```

3. **Aguarde a mágica acontecer!**

O script irá automaticamente:
- ✅ Verificar se o Python está instalado
- ✅ Instalar todas as dependências necessárias no ambiente do contêiner
- ✅ Iniciar o servidor FastAPI
- ✅ Abrir o navegador automaticamente

#### 📺 **O que você verá:**

```
======================================================================
    🎱 BINGO DA COMUNIDADE - Sistema Inteligente
======================================================================

[1/5] Verificando se o sistema ja esta em execucao...
      ✓ Nenhuma instancia detectada. Prosseguindo...

[2/5] Detectando interpretador Python...
      ✓ Python encontrado: Python 3.11.5

[3/5] Preparando dependências no contêiner...
   ✓ Dependências prontas no ambiente do contêiner

[4/5] Verificando dependencias...
      ✓ Todas as dependencias estao instaladas

[5/5] Iniciando servidor FastAPI...

======================================================================
    ✓ SISTEMA PRONTO!
======================================================================

    API:            http://localhost:8000
    Documentacao:   http://localhost:8000/docs
    Health Check:   http://localhost:8000/health

🎱 BINGO DA COMUNIDADE ONLINE!

O servidor esta rodando. Para encerrar, pressione Ctrl+C
```

4. **O navegador abrirá automaticamente** mostrando a documentação da API

---

### 🌐 Acessando o Sistema

Após o start.bat executar, você pode acessar:

#### 📖 **Documentação Interativa (Swagger)**
```
http://localhost:8000/docs
```
- Interface gráfica para testar todas as funcionalidades
- Perfeito para a equipe técnica

#### ✅ **Health Check** (Verificação de Saúde)
```
http://localhost:8000/
```
- Mostra se o sistema está online
- Exibe o horário oficial de Fortaleza
- Testa conexão com o banco de dados

---

### 🛑 Como Encerrar o Sistema

1. Vá ao terminal onde o `start.bat` está rodando
2. Pressione **Ctrl + C**
3. Digite **S** (Sim) para confirmar

Ou simplesmente **feche a janela do terminal**.

---

## 📚 MANUAL DE OPERAÇÃO (Para a Paróquia)

Esta seção é para o **Administrador da Paróquia** — a pessoa responsável por gerenciar os bingos.

### 🏁 Primeiros Passos

#### 1️⃣ **Criar a Conta da Paróquia**

Acesse a documentação da API:
```
http://localhost:8000/docs
```

1. Localize a seção **"Paróquias"**
2. Clique em **POST /paroquias** (criar paróquia)
3. Clique em **"Try it out"**
4. Preencha os dados:

```json
{
  "nome": "Paróquia São José",
  "email": "contato@paroquiasaojose.com.br",
  "telefone": "85999999999",
  "endereco": "Rua das Flores, 123",
  "cidade": "Fortaleza",
  "estado": "CE",
  "cep": "60000-000",
  "chave_pix": "contato@paroquiasaojose.com.br"
}
```

5. Clique em **"Execute"**
6. **Anote o ID retornado** (exemplo: `PAR_20260113120000`)

---

#### 2️⃣ **Criar seu Usuário de Administrador**

1. Na documentação, localize **"Usuários"**
2. Clique em **POST /usuarios**
3. Preencha:

```json
{
  "nome": "Pe. João Silva",
  "email": "padre@paroquiasaojose.com.br",
  "tipo": "parish_admin",
  "paroquia_id": "PAR_20260113120000",
  "senha": "SuaSenhaSegura123"
}
```

4. Execute e **anote seu ID de usuário**

---

### 🎯 Criar o Primeiro Bingo

#### **Passo a Passo Completo:**

1. Acesse: `http://localhost:8000/docs`
2. Localize a seção **"Sorteios"**
3. Clique em **POST /sorteios**
4. Clique em **"Try it out"**
5. Preencha os dados:

```json
{
  "paroquia_id": "PAR_20260113120000",
  "titulo": "Bingo da Festa Junina 2026",
  "descricao": "Bingo beneficente para reforma da capela",
  "valor_cartela": 10.00,
  "rateio_premio": 40.0,
  "rateio_paroquia": 35.0,
  "rateio_operacao": 15.0,
  "rateio_evolucao": 10.0,
  "inicio_vendas": "2026-06-20T08:00:00",
  "fim_vendas": "2026-06-24T17:59:00",
  "horario_sorteio": "2026-06-24T19:00:00"
}
```

**Explicação dos campos:**

- **titulo**: Nome do bingo (ex: "Bingo da Festa Junina")
- **valor_cartela**: Preço de cada cartela em R$ (ex: 10.00)
- **rateio_premio**: % que vai para o prêmio (ex: 40%)
- **rateio_paroquia**: % que fica na paróquia (ex: 35%)
- **rateio_operacao**: % para manutenção do sistema (ex: 15%)
- **rateio_evolucao**: % para melhorias futuras (ex: 10%)
- ⚠️ **IMPORTANTE:** A soma dos rateios deve ser **100%**

6. Clique em **"Execute"**
7. **Anote o ID do sorteio** (exemplo: `BNG_20260113150000`)

---

### 💳 Configurar a Chave PIX da Igreja

A chave PIX é **essencial** para receber a arrecadação.

#### **Tipos de Chave PIX aceitos:**
- 📧 E-mail (ex: `financeiro@paroquiasaojose.com.br`)
- 📱 Telefone (ex: `85999999999`)
- 🆔 CPF/CNPJ (ex: `12.345.678/0001-90`)
- 🔑 Chave aleatória (gerada pelo banco)

#### **Como configurar:**

1. Já foi configurado ao criar a paróquia
2. Para **alterar**, use a rota **PUT /paroquias/{id}**
3. Atualize o campo `chave_pix`

**⚠️ IMPORTANTE:**
- Use uma chave vinculada à **conta oficial da paróquia**
- **Nunca use chave pessoal** do padre ou tesoureiro
- Teste a chave antes do primeiro bingo

---

### 🎫 Como o Fiel Compra a Cartela

#### **Instruções para orientar os fiéis:**

**Passo 1: Criar Conta**
```
O fiel acessa: http://localhost:8000/docs
(ou a interface web quando estiver pronta)
```

**Passo 2: Registrar Dados**
- Nome completo
- E-mail **OU** WhatsApp
- **Chave PIX pessoal** (para receber prêmio)

**Passo 3: Comprar Cartela**
- Escolhe o bingo desejado
- Faz o pagamento via PIX
- Recebe a cartela automaticamente

**Passo 4: Acompanhar o Sorteio**
- No dia do evento, acessa o sistema
- Vê o sorteio ao vivo
- Acompanha sua cartela sendo marcada automaticamente

---

### 📊 Como Funciona o Sorteio

1. **No horário agendado**, o sistema inicia automaticamente
2. **A cada 15 segundos**, uma pedra é sorteada
3. **O sistema marca automaticamente** todas as cartelas
4. **Quando alguém ganha**, o sistema:
   - Detecta instantaneamente
   - Para o sorteio
   - Registra o(s) vencedor(es)
   - **Se houver empate:** Divide o prêmio igualmente

---

## 🔐 AUDITORIA E TRANSPARÊNCIA (O Diferencial)

Esta seção explica **por que este sistema é confiável** de forma técnica, mas acessível.

### 🕒 IDs Temporais: A Prova da Verdade

#### **O que são?**

Cada entidade do sistema recebe um **ID baseado em data e hora**:

```
BNG_20260113153045
│   │  │  │  │  │
│   │  │  │  │  └── Segundos (45)
│   │  │  │  └───── Minutos (30)
│   │  │  └──────── Hora (15)
│   │  └─────────── Dia (13)
│   └────────────── Mês (01)
└────────────────── Ano (2026)

Prefixo: BNG (Bingo)
```

#### **Por que isso é importante?**

1. **Imutabilidade**
   - O ID está "gravado" no momento da criação
   - Não pode ser alterado retroativamente
   - É como um **carimbo de tempo inviolável**

2. **Rastreabilidade**
   - Qualquer um pode ver quando algo foi criado
   - A ordem cronológica é automática
   - Impossível "inserir" um registro no passado

3. **Auditoria Simples**
   - Basta ler o ID para saber quando aconteceu
   - Não depende de logs complexos
   - Transparente para leigos

#### **Exemplos Práticos:**

```
Bingo criado em:      BNG_20260113120000  (13/01/2026 às 12:00:00)
Cartela comprada em:  CRT_20260113150030  (13/01/2026 às 15:00:30)
Usuário criado em:    USR_20260110093015  (10/01/2026 às 09:30:15)
```

Se o tesoureiro verificar os registros e ver:
- **Cartela vendida DEPOIS do fim das vendas?** ❌ Impossível — o ID denuncia
- **Registro "editado"?** ❌ Impossível — o ID permanece o original

---

### 🌍 Fuso Horário Oficial: Fortaleza-CE

#### **Por que Fortaleza?**

- O servidor está configurado para **sempre** usar o fuso de Fortaleza (`America/Fortaleza`)
- Não importa onde o usuário está: **Manaus, São Paulo, Rio**
- Todos os horários são **convertidos e gravados** em Fortaleza

#### **Como isso protege?**

Imagine este cenário **SEM** fuso fixo:
1. Vendas encerram às 18:00 (horário de Fortaleza)
2. Alguém em Manaus (fuso diferente) tenta comprar às 18:05
3. O sistema poderia aceitar (se usasse horário local)
4. ❌ **Fraude!**

**COM** fuso fixo de Fortaleza:
1. Vendas encerram às 18:00 (horário de Fortaleza)
2. Alguém em Manaus tenta comprar às 18:05
3. O sistema **rejeita** — já passou das 18:00 no fuso oficial
4. ✅ **Justo para todos!**

---

### ✅ Como o Tesoureiro Valida Quem Ganhou

#### **Processo de Auditoria Completo:**

**1. Acessar o relatório do sorteio**
```
http://localhost:8000/docs
GET /sorteios/{id}
```

**2. Verificar os dados do sorteio**
```json
{
  "id": "BNG_20260113150000",
  "status": "finalizado",
  "pedras_sorteadas": [15, 22, 38, 44, 59, 7, 18, 35, ...],
  "vencedores_ids": ["USR_20260113120001"],
  "total_premio": 1500.00,
  "hash_integridade": "a3f5e8c9b2d1..."
}
```

**3. Verificar a cartela vencedora**
```
GET /cartelas/{id}
```

**4. Conferir manualmente** (opcional):
- Pegue os números da cartela
- Compare com as pedras sorteadas
- Confirme que todos os números foram sorteados

**5. Verificar o fiel vencedor**
```
GET /usuarios/{id}
```
- Confirme o nome
- Confirme a chave PIX
- Efetue o pagamento

---

### 🔒 Hash de Integridade

Cada sorteio tem um **hash SHA-256** calculado sobre:
- Todas as cartelas vendidas
- Todas as pedras sorteadas
- Horários de início e fim
- Vencedores

Se **qualquer dado** for alterado, o hash **muda completamente**.

**Como usar:**
1. Anote o hash no início do sorteio
2. Após o fim, recalcule o hash
3. Se for diferente ➜ **Algo foi alterado!**

---

## ❓ RESOLUÇÃO DE PROBLEMAS (FAQ)

### 🔴 "O sistema não abre"

#### **Causa 1: Python não instalado**
**Solução:**
1. Abra o terminal (cmd)
2. Digite: `python --version`
3. Se aparecer erro:
   - Instale Python: https://www.python.org/downloads/
   - **Marque "Add Python to PATH"**
   - Reinicie o computador

#### **Causa 2: Arquivo .env não configurado**
**Solução:**
1. Vá em: `backend\`
2. Copie `.env.example` para `.env`
3. Edite o `.env` com suas configurações
4. Execute `start.bat` novamente

#### **Causa 3: PostgreSQL não rodando**
**Solução:**
1. Abra o "Serviços" do Windows (services.msc)
2. Procure: `PostgreSQL`
3. Clique em "Iniciar"

---

### 🔴 "O horário está errado"

**NÃO É UM BUG — É UMA FEATURE!** 😊

O sistema **sempre** usa o horário de **Fortaleza-CE** como referência.

#### **Por que?**
- Garante que todos estejam na mesma "régua" de tempo
- Evita manipulações de fuso horário
- Torna o sistema justo para todos

#### **Como funciona:**
1. Você está em São Paulo (fuso diferente de Fortaleza)
2. Compra uma cartela às 14:00 (seu horário)
3. O sistema registra como: **15:00** (horário de Fortaleza)
4. O ID temporal será: `CRT_20260113150000`

**Não se preocupe:** O sistema faz tudo automaticamente!

---

### 🔴 "Esqueci a senha do administrador"

**Solução (temporária):**
1. Acesse o banco de dados via pgAdmin
2. Localize a tabela `usuarios`
3. Encontre seu usuário
4. Gere um novo hash de senha (use bcrypt)
5. Atualize manualmente

**Solução (futura — a implementar):**
- Rota de "Esqueci minha senha"
- Envio de link de redefinição por e-mail

---

### 🔴 "O navegador não abre automaticamente"

**Solução:**
Abra manualmente:
```
http://localhost:8000/docs
```

Se não funcionar:
1. Verifique se o terminal mostra: `Uvicorn running on...`
2. Pode ser firewall bloqueando
3. Tente desativar firewall temporariamente

---

### 🔴 "As dependências não instalam"

**Causa comum:** Sem conexão com internet

**Solução:**
1. Verifique sua conexão
2. Se persistir, instale manualmente:
```powershell
cd backend
python -m pip install -r requirements.txt
```

---

### 🔴 "Erro ao criar o banco de dados"

**Solução:**
1. Abra o pgAdmin
2. Verifique se o PostgreSQL está rodando
3. Crie o banco manualmente:
   - Botão direito em "Databases"
   - "Create" → "Database"
   - Nome: `bingo_comunidade`

---

## 🛡️ DADOS E LGPD

Este sistema leva a **Lei Geral de Proteção de Dados (LGPD)** a sério.

### 📊 Que Dados São Coletados?

#### **Do Fiel:**
- ✅ Nome completo
- ✅ E-mail **OU** WhatsApp (opcional)
- ✅ Chave PIX (para pagamentos)
- ❌ **NÃO coletamos:** CPF, RG, endereço residencial

#### **Da Paróquia:**
- ✅ Nome da instituição
- ✅ E-mail de contato
- ✅ Telefone
- ✅ Endereço (da igreja, não de pessoas)
- ✅ Chave PIX institucional

---

### 🔐 Como os Dados São Protegidos?

#### **1. Senhas Criptografadas**
- Usamos **bcrypt** (algoritmo de criptografia forte)
- Mesmo os administradores **não conseguem ver** as senhas

#### **2. Acesso Restrito**
- Cada tipo de usuário vê **apenas** o necessário
- Fiel não vê dados de outros fiéis
- Parish Admin vê apenas dados de sua paróquia
- Super Admin tem acesso técnico, não aos dados pessoais

#### **3. Banco de Dados Local**
- Os dados ficam **no servidor da paróquia**
- Não enviamos nada para "nuvens" externas
- Você tem **controle total**

---

### 📝 Direitos do Fiel (LGPD)

Qualquer fiel pode solicitar:

1. **Acesso aos seus dados**
   - O que temos sobre ele
   
2. **Correção de dados**
   - Se algo estiver errado
   
3. **Exclusão de dados** (Direito ao Esquecimento)
   - Após o fim dos bingos ativos
   - ⚠️ **Dados de transações** devem ser mantidos por 5 anos (lei fiscal)

4. **Portabilidade**
   - Receber seus dados em formato legível (JSON/CSV)

---

### 📜 Termo de Consentimento

Ao criar uma conta, o fiel **concorda** que seus dados sejam usados para:
- ✅ Participação nos bingos
- ✅ Comunicação sobre sorteios
- ✅ Pagamento de prêmios

E **NÃO** serão usados para:
- ❌ Venda para terceiros
- ❌ Spam ou marketing agressivo
- ❌ Fins não relacionados aos bingos

---

### 🗑️ Retenção de Dados

- **Dados de usuários ativos:** Mantidos enquanto a conta existir
- **Dados de transações:** Mantidos por **5 anos** (legislação fiscal)
- **Após 5 anos:** Dados anonimizados ou excluídos

---

## 🤝 CONTRIBUINDO COM O PROJETO

Este é um projeto **open source** e **comunitário**!

### Como Ajudar?

1. **Reportar bugs**: Abra uma issue no GitHub
2. **Sugerir melhorias**: Compartilhe suas ideias
3. **Contribuir com código**: Faça um Pull Request
4. **Melhorar documentação**: Corrija erros, adicione exemplos
5. **Doar**: Se sua paróquia usar o sistema e quiser ajudar financeiramente

---

## 📞 SUPORTE E COMUNIDADE

### 💬 Canais de Ajuda

- 📧 **E-mail:** suporte@bingodacomunidade.com.br
- 💻 **GitHub Issues:** [Link para issues]
- 📱 **WhatsApp Comunitário:** [Link quando disponível]

### 📚 Documentação Técnica

- **Backend:** [backend/README.md](backend/README.md)
- **Como usar start.bat:** [backend/COMO_USAR_START_BAT.md](backend/COMO_USAR_START_BAT.md)
- **Fase 1 Completa:** [backend/FASE1_COMPLETA.md](backend/FASE1_COMPLETA.md)
- **Briefing Original:** [Briefing.md](Briefing.md)
- **Guia de Desenvolvimento:** [Dev. Guide.md](Dev. Guide.md)

---

## 📜 LICENÇA

Este projeto é **Software Livre** e **Código Aberto**.

Você pode:
- ✅ Usar gratuitamente
- ✅ Modificar conforme necessário
- ✅ Distribuir para outras paróquias
- ✅ Estudar o código

Com a condição de:
- ⚠️ Manter os créditos originais
- ⚠️ Compartilhar melhorias com a comunidade

---

## 🙏 AGRADECIMENTOS

Este sistema foi desenvolvido com **fé, dedicação e transparência** para servir às comunidades religiosas.

Agradecemos:
- 🙏 **Às paróquias** que confiaram nesta solução
- 💻 **Aos desenvolvedores** que contribuíram
- ⛪ **Aos fiéis** que participam com confiança
- 🌟 **A Deus** por nos guiar nesta missão

---

## 🎯 PRÓXIMAS FUNCIONALIDADES (Roadmap)

### 🚧 Em Desenvolvimento:

- [ ] Interface web completa (frontend)
- [ ] App mobile para os fiéis
- [ ] Sistema de notificações (WhatsApp/E-mail)
- [ ] Relatórios financeiros avançados
- [ ] Integração com sistemas de pagamento (PIX automático)
- [ ] Sistema de chat ao vivo durante sorteios
- [ ] Modo "multi-paróquia" (diocese)

### 💡 Ideias Futuras:

- [ ] Bingo temático (Natal, Páscoa, Santos)
- [ ] Modo "beneficente" (100% para caridade)
- [ ] Sistema de ranking dos participantes
- [ ] Badges e conquistas
- [ ] Sorteios especiais (super prêmios)

---

## 🎱 FILOSOFIA DO PROJETO

> "Este sistema não foi criado para gerar lucro.  
> Foi criado para gerar **confiança, transparência e comunidade**.  
> Cada linha de código é uma oração de gratidão.  
> Cada bingo é um momento de alegria compartilhada.  
> Cada real arrecadado é uma esperança de transformação."

**Que este sistema sirva bem às nossas comunidades e seja um instrumento de fé e união.**

---

## ✨ VERSÃO

**Versão Atual:** 1.0.0 (Fase 1 - Fundação do Concentrador)  
**Data de Lançamento:** 13 de Janeiro de 2026  
**Status:** Estável para testes e desenvolvimento

---

## 📞 Contato do Desenvolvedor

- **E-mail:** dev@bingodacomunidade.com.br
- **GitHub:** [Link do repositório]

---

**🎱 Desenvolvido com fé, transparência e tecnologia.**

**Que Deus abençoe cada bingo realizado com este sistema!** 🙏