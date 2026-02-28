# 🎯 COMO USAR - Sistema de Bingo Comunitário

## 🐳 **VOCÊ ABANDONOU O .venv E OS .bat**

**Decisão correta!** Agora tudo roda em Docker. Sem dor de cabeça, sem ambiente virtual, sem conflitos.

---

## 📦 INSTALAÇÃO (PRIMEIRA VEZ)

### 1️⃣ Instale o Docker Desktop

**Baixe aqui:** https://docs.docker.com/desktop/install/windows-install/

Após instalar:
- Abra o **Docker Desktop**
- Aguarde aparecer **"Docker is running"** no canto inferior esquerdo
- Pronto!

---

### 2️⃣ Clone ou baixe este projeto

Se ainda não tem o projeto:

**Opção A - Git:**
```powershell
cd C:\Users\EU\Documents\GitHub
git clone https://github.com/seu-usuario/bingodacomunidade.git
cd bingodacomunidade
```

**Opção B - Download ZIP:**
- Baixe e extraia na pasta desejada
- Abra PowerShell nessa pasta

---

### 3️⃣ Inicie o sistema

```powershell
# Entre na pasta do projeto
cd C:\Users\EU\Documents\GitHub\bingodacomunidade

# Inicie o Docker Compose
docker-compose up -d --build
```

**O que acontece:**
1. Docker baixa a imagem Python 3.11-slim
2. Instala todas as dependências do `requirements.txt`
3. Cria o banco SQLite em `backend/data/bingo.db`
4. Popula o banco com dados iniciais (seed)
5. Inicia a API na porta 8000

**Aguarde 20-30 segundos** para o sistema inicializar completamente.

---

## ✅ VERIFICAR SE ESTÁ FUNCIONANDO

### **Opção 1: Script de Teste Automático**

```powershell
.\test_system.ps1
```

Este script testa automaticamente:
- ✅ API está respondendo?
- ✅ Banco de dados conectado?
- ✅ Timezone configurado corretamente?
- ✅ Documentação acessível?

---

### **Opção 2: Teste Manual**

Abra o navegador e acesse:

```
http://localhost:8000/docs
```

Se aparecer a documentação interativa (Swagger), **está funcionando!** 🎉

---

## 👤 CREDENCIAIS INICIAIS (BOOTSTRAP)

O sistema inicia apenas com o administrador temporário de primeiro acesso:

### 👑 **Admin do Site (temporário)**
```
Usuário: Admin
Senha: admin123
```

Após o login, finalize o cadastro real do SUPER_ADMIN.

---

## 🔧 PERSONALIZANDO O SISTEMA

### **Definir Dados do Proprietário**

Após o primeiro login (Admin/admin123), preencha o cadastro real do Administrador no fluxo de primeiro acesso.

---

### **Mudar Dados da Paróquia**

No mesmo arquivo `docker-compose.yml`:

```yaml
# Paróquia Padrão
- PARISH_NAME=Nome da Sua Paróquia
- PARISH_EMAIL=contato@suaparoquia.com.br
- PARISH_PHONE=85987654321
- PARISH_PIX=sua_chave_pix_aqui
- PARISH_CITY=Fortaleza
- PARISH_STATE=CE
```

---

### **Aplicar as Mudanças**

Depois de editar `docker-compose.yml`:

```powershell
# 1. Parar o sistema
docker-compose down

# 2. Apagar o banco antigo
Remove-Item backend\data\bingo.db

# 3. Reiniciar (vai recriar com novos dados)
docker-compose up -d --build
```

---

## 📊 COMANDOS ÚTEIS

---

## 👥 REGRA OFICIAL - CADASTRO E EDIÇÃO DE USUÁRIOS

Para gestão de usuários (site/paróquia), adote sempre duas etapas de trabalho:

1. **Tela de Cadastro**
  - Criar novo usuário com todos os dados iniciais.
  - Definir CPF apenas no momento do cadastro.

2. **Tela de Edição**
  - Ajustar dados operacionais do usuário já existente.

### 🔒 Campos imutáveis após cadastro

- **ID** do usuário
- **CPF** do usuário

### ✏️ Campos que podem ser alterados na edição

- Nome
- Função/cargo
- Senha
- Telefone
- E-mail
- Status (ativo/inativo)

> Regra de negócio: depois que o usuário foi criado, CPF e ID não podem ser alterados.

---

## 🧭 REGRA OFICIAL - NAVEGAÇÃO POR CONTEXTO

- Se o usuário está no painel da paróquia, a navegação deve ficar em `/admin-paroquia/*`.
- Exemplo correto:
  - Dashboard paroquial: `/admin-paroquia/dashboard`
  - Lista de jogos paroquial: `/admin-paroquia/games`
  - Detalhe de jogo paroquial: `/admin-paroquia/games/:id`
- As rotas `/games` e `/games/:id` são da área pública autenticada (usuário comum/fiel).

### Área exclusiva do fiel (raiz autenticada)

- Após login comum (`/login`), o fiel usa:
  - `/dashboard`
  - `/games`
  - `/games/:id`
  - `/minhas-cartelas` (área para ver/pagar cartelas)
- Essas rotas **não** devem ser usadas por admin-site/admin-paróquia.

### Troca de perfil sem confusão

- Para sair de admin-paróquia e entrar como fiel:
  1. clicar em **Sair**;
  2. acessar `http://localhost:5173/login`;
  3. autenticar como usuário comum.
- Mesmo usando CPF/email iguais em contextos diferentes, cada login deve acontecer na rota correta do contexto:
  - admin-site: `/admin-site/login`
  - admin-paróquia: `/admin-paroquia/login`
  - fiel: `/login`

### **Ver logs em tempo real**
```powershell
docker-compose logs -f backend
```
*Pressione Ctrl+C para sair*

---

### **Parar o sistema**
```powershell
docker-compose down
```

---

### **Reiniciar o sistema**
```powershell
docker-compose restart
```

---

### **Recriar tudo do zero (APAGA DADOS!)**
```powershell
docker-compose down -v
Remove-Item backend\data\bingo.db
docker-compose up -d --build
```

---

### **Ver status dos containers**
```powershell
docker-compose ps
```

---

### **Entrar dentro do container (debug)**
```powershell
docker exec -it bingo_backend bash
```

---

## 📂 ONDE ESTÃO MEUS DADOS?

### **Banco de Dados SQLite:**
```
backend/data/bingo.db
```

Este arquivo **persiste** mesmo se você recriar o container.

Para fazer backup:
```powershell
Copy-Item backend\data\bingo.db backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').db
```

---

## 🐛 PROBLEMAS COMUNS

### ❌ **"Porta 8000 já está em uso"**

**Solução 1:** Matar o processo que está usando a porta
```powershell
# Encontrar o processo
netstat -ano | findstr :8000

# Matar (substitua <PID>)
taskkill /PID <PID> /F
```

**Solução 2:** Usar outra porta

Edite `docker-compose.yml`:
```yaml
ports:
  - "8001:8000"  # Muda para porta 8001
```

Depois acesse: `http://localhost:8001/docs`

---

### ❌ **"Cannot connect to Docker daemon"**

**Solução:**
1. Abra o **Docker Desktop**
2. Aguarde inicializar completamente
3. Execute `docker-compose up -d` novamente

---

### ❌ **"Container fica reiniciando infinitamente"**

**Diagnóstico:**
```powershell
docker-compose logs backend
```

Leia os logs para identificar o erro.

**Erros comuns:**
- **Import error:** Falta dependência no `requirements.txt`
- **Permission denied:** Execute PowerShell como Administrador
- **Syntax error:** Código Python com erro

---

### ❌ **"Banco de dados vazio"**

**Causa:** Seed automático pode estar desabilitado

**Solução:**

Verifique no `docker-compose.yml`:
```yaml
- SEED_ENABLED=true  # ← Deve estar "true"
```

Se estava `false`, mude para `true` e:
```powershell
docker-compose down
Remove-Item backend\data\bingo.db
docker-compose up -d
```

---

## 🎯 PRÓXIMOS PASSOS

Agora que o sistema está rodando:

1. ✅ Acesse: http://localhost:8000/docs
2. ✅ Familiarize-se com os endpoints
3. ✅ Teste as credenciais iniciais
4. ✅ Comece a implementar as APIs de negócio (Fase 2)

---

## 📚 DOCUMENTAÇÃO COMPLETA

- **Guia Rápido Docker:** [DOCKER_QUICKSTART.md](DOCKER_QUICKSTART.md)
- **README Completo:** [Readme.md](Readme.md)
- **Briefing Conceitual:** [Briefing.md](Briefing.md)
- **Guia de Desenvolvimento:** [Dev. Guide.md](Dev.%20Guide.md)

---

## 🎱 FILOSOFIA DO PROJETO

> **"Transparência total. Sem configurações escondidas. Sem scripts mágicos. Se é comunitário, deve ser compreensível."**

Todas as configurações estão **visíveis** no `docker-compose.yml`.  
Todos os dados estão **acessíveis** em `backend/data/`.  
Todo o código está **documentado** e **aberto**.

---

**🎱 Desenvolvido com fé, transparência e tecnologia.**

**Que Deus abençoe cada bingo realizado com este sistema!** 🙏
