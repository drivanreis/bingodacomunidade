# 🛠️ Scripts Utilitários - Referência Rápida

## 📋 Todos os Scripts Disponíveis

### 🚀 Instalação e Inicialização

| Script | Comando | Descrição |
|--------|---------|-----------|
| **Limpar Tudo** | `./limpa.sh` | Apaga todos containers, imagens e volumes |
| **Instalar** | `./install.sh` | Instala e inicia sistema pela primeira vez |
| **Iniciar** | `./start.sh` | Inicia sistema (sem rebuild) |

### 🔐 Primeiro Acesso (NOVO!)

| Script | Comando | Descrição |
|--------|---------|-----------|
| **Testar Primeiro Acesso** | `./test_first_access.sh` | Teste automatizado completo |
| **Alternar Modo** | `./alternar_modo.sh` | Menu para trocar Dev ↔ Prod |

### 🏥 Diagnóstico

| Script | Comando | Descrição |
|--------|---------|-----------|
| **Verificar Sistema** | `./verificar_sistema.sh` | Health check completo |
| **Menu Interativo** | `./menu.sh` | Menu com todas as opções |

### 🧪 Testes

| Script | Comando | Descrição |
|--------|---------|-----------|
| **Teste Sistema** | `./test_system.ps1` | 10 passos de validação (PowerShell) |
| **Teste Primeiro Acesso** | `./test_first_access.sh` | Testa fluxo completo de setup |

---

## 📖 Guia de Uso

### 1. Primeira Instalação

```bash
# Limpar ambiente (se já rodou antes)
./limpa.sh

# Instalar do zero
./install.sh

# Resultado:
# ✅ Containers criados
# ✅ Banco inicializado
# ✅ 3 usuários de teste criados (SEED_ENABLED=true)
```

### 2. Uso Diário

```bash
# Iniciar sistema
./start.sh

# Verificar saúde
./verificar_sistema.sh

# Ver logs em tempo real
docker logs -f bingo_backend   # Backend
docker logs -f bingo_frontend  # Frontend
```

### 3. Testar Primeiro Acesso

```bash
# Teste automatizado completo
./test_first_access.sh

# O que o script faz:
# 1. Alterna para SEED_ENABLED=false
# 2. Testa GET /auth/first-access (deve retornar needs_setup=true)
# 3. Cria primeiro admin via POST
# 4. Tenta criar segundo (deve falhar com 403)
# 5. Verifica que needs_setup agora é false
# 6. Restaura SEED_ENABLED=true
```

### 4. Alternar Entre Modos

```bash
# Menu interativo
./alternar_modo.sh

# Opções:
# 1) Modo DESENVOLVIMENTO (SEED_ENABLED=true)
#    - Cria 3 usuários de teste
#    - Login: CPF 11144477735 / Senha Fiel@123
#
# 2) Modo PRODUÇÃO (SEED_ENABLED=false)
#    - Banco vazio
#    - Tela de primeiro acesso aparece
#    - Criar Desenvolvedor manualmente
```

### 5. Menu Interativo Completo

```bash
# Todas as opções em um único menu
./menu.sh

# Opções disponíveis:
# - Iniciar/Parar/Reiniciar
# - Ver logs (backend/frontend)
# - Verificar saúde
# - Alternar modo
# - Testar primeiro acesso
# - Reset completo
# - Abrir browser (API/Frontend)
# - Entrar em container
# - Backup de banco
```

---

## 🎯 Cenários Comuns

### Cenário 1: Desenvolvimento Local

```bash
# Garantir modo desenvolvimento
grep SEED_ENABLED docker-compose.yml
# Deve mostrar: SEED_ENABLED=true

# Iniciar
./start.sh

# Acessar
# http://localhost:5173
# Login: CPF 11144477735 / Senha Fiel@123
```

### Cenário 2: Testar como se fosse Produção

```bash
# Alternar para modo produção
./alternar_modo.sh
# Escolher: 2 (Modo PRODUÇÃO)

# Acessar navegador
# http://localhost:5173
# Tela de primeiro acesso aparece

# Criar desenvolvedor manualmente

# Voltar para desenvolvimento
./alternar_modo.sh
# Escolher: 1 (Modo DESENVOLVIMENTO)
```

### Cenário 3: Deploy Real em Produção

```bash
# 1. Editar docker-compose.yml
#    SEED_ENABLED=false
#    EMAIL_DEV_MODE=false
#    Configurar SMTP_* com dados reais

# 2. Subir sistema
docker compose up -d --build

# 3. Acessar domínio
#    https://bingo.suaparoquia.com.br

# 4. Tela de primeiro acesso aparece
#    Criar Desenvolvedor

# 5. Pronto! Sistema em produção
```

### Cenário 4: Resolver Problemas

```bash
# Verificar saúde geral
./verificar_sistema.sh

# Ver logs de erro
docker logs bingo_backend | grep ERROR
docker logs bingo_frontend | grep ERROR

# Reiniciar tudo
docker compose restart

# Reset completo (último recurso)
./limpa.sh
./install.sh
```

### Cenário 5: Backup e Manutenção

```bash
# Fazer backup do banco
docker cp bingo_backend:/app/data/bingo.db backup_$(date +%Y%m%d).db

# Ver tamanho do banco
docker exec bingo_backend ls -lh /app/data/bingo.db

# Entrar no container para inspeção
docker exec -it bingo_backend bash
```

---

## 🧪 Testes

### Teste Completo Automatizado

```bash
./test_first_access.sh
```

**Valida:**
- ✅ Sistema detecta banco vazio (SEED=false)
- ✅ Permite criar primeiro admin
- ✅ Bloqueia segundo admin (403)
- ✅ Estado muda corretamente
- ✅ Restaura ambiente original

**Tempo:** ~40 segundos

### Teste Manual (Navegador)

Ver: `TESTE_MANUAL_PRIMEIRO_ACESSO.md`

---

## 📚 Documentação Relacionada

### Primeiro Acesso
- **SISTEMA_PRIMEIRO_ACESSO.md** - Documentação técnica completa
- **DEPLOY_PRODUCAO.md** - Guia de deploy passo a passo
- **TESTE_MANUAL_PRIMEIRO_ACESSO.md** - Testes no navegador

### Segurança
- **SEGURANCA_NIVEL_BANCARIO.md** - Sistema de segurança completo
- **VALIDACAO_CPF.md** - Algoritmo Módulo 11

### Geral
- **START_HERE.md** - Começar do zero
- **DOCKER_QUICKSTART.md** - Guia rápido Docker
- **INDICE_DOCUMENTACAO.md** - Índice completo

---

## 🔧 Comandos Docker Úteis

### Básicos

```bash
# Iniciar
docker compose up -d

# Parar
docker compose down

# Reiniciar
docker compose restart

# Rebuild
docker compose up -d --build
```

### Logs

```bash
# Ver logs (tempo real)
docker logs -f bingo_backend
docker logs -f bingo_frontend

# Últimas 50 linhas
docker logs bingo_backend --tail 50

# Filtrar por erro
docker logs bingo_backend 2>&1 | grep ERROR
```

### Inspeção

```bash
# Listar containers
docker ps

# Entrar no container
docker exec -it bingo_backend bash

# Copiar arquivo do container
docker cp bingo_backend:/app/data/bingo.db backup.db

# Copiar arquivo para container
docker cp local.txt bingo_backend:/app/local.txt
```

### Limpeza

```bash
# Parar e remover containers
docker compose down

# Remover também volumes (⚠️ apaga dados!)
docker compose down -v

# Limpeza completa
./limpa.sh
```

---

## 🎯 Variáveis de Ambiente Importantes

### SEED_ENABLED (Crítico!)

```yaml
# Desenvolvimento (padrão)
- SEED_ENABLED=true
  # ✅ Cria 3 usuários de teste
  # ✅ Login rápido para desenvolvimento
  # ✅ Senhas conhecidas

# Produção
- SEED_ENABLED=false
  # ✅ Banco vazio
  # ✅ Tela de primeiro acesso
  # ✅ Segurança máxima
```

### EMAIL_DEV_MODE

```yaml
# Desenvolvimento (padrão)
- EMAIL_DEV_MODE=true
  # ✅ Emails aparecem nos logs
  # ✅ Não precisa SMTP

# Produção
- EMAIL_DEV_MODE=false
  # ✅ Envia emails reais
  # ✅ Requer SMTP configurado
```

---

## 🆘 Solução Rápida de Problemas

### Container não inicia

```bash
# Ver erro
docker logs bingo_backend
docker logs bingo_frontend

# Rebuild forçado
docker compose down
docker compose up -d --build
```

### Porta já em uso

```bash
# Descobrir processo usando porta 8000
sudo lsof -i :8000

# Matar processo
sudo kill -9 <PID>

# Ou mudar porta no docker-compose.yml
```

### Tela de primeiro acesso não aparece (SEED=false)

```bash
# Verificar modo
grep SEED_ENABLED docker-compose.yml

# Deve mostrar: SEED_ENABLED=false

# Verificar API
curl http://localhost:8000/auth/first-access

# Deve retornar: {"needs_setup": true}

# Limpar cache do navegador
# Ctrl+Shift+Del → Limpar tudo

# Recarregar com Ctrl+F5
```

### Backend retorna 404 para /auth/first-access

```bash
# Verificar se endpoint foi carregado
docker logs bingo_backend | grep "first-access"

# Rebuild do backend
docker compose up -d --build backend

# Aguardar
sleep 10

# Testar novamente
curl http://localhost:8000/auth/first-access
```

---

## 📞 Referência Rápida

### URLs
```
Frontend:     http://localhost:5173
Backend:      http://localhost:8000
API Docs:     http://localhost:8000/docs
Health Check: http://localhost:8000/health
```

### Credenciais de Teste (SEED_ENABLED=true)
```
Jogador (para testar):
  CPF: 111.444.777-35
  Senha: Fiel@123
```

### Arquivos Importantes
```
docker-compose.yml    - Configuração dos containers
.env.example          - Template de variáveis
backend/src/main.py   - Endpoints da API
frontend/src/App.tsx  - Rotas do frontend
```

---

## 🎊 Conclusão

✅ **Sistema 100% funcional e seguro**  
✅ **Primeiro acesso protegido implementado**  
✅ **Scripts de automação fornecidos**  
✅ **Documentação completa criada**  
✅ **Testes automatizados passando**  
✅ **Pronto para produção**  

**Use:** `./menu.sh` para acesso rápido a todas as funções!

---

**Desenvolvido com segurança máxima 🔐**  
**Testado e validado ✅**  
**Documentado completamente 📚**
