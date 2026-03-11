# 🤖 TPIC - Testador Prático de Integração Contínua

Um agente automatizado que simula exatamente o que você faz manualmente para validar se a aplicação está realmente pronta para produção.

## 📋 O que é TPIC?

O TPIC é um **robô de testes** que:

✅ Executa os scripts de setup (limpa.sh, install.sh, start.sh)  
✅ Abre o navegador e visualiza tudo em tempo real  
✅ Faz login com credenciais de teste  
✅ Preenche formulários automaticamente  
✅ Valida redirecionamentos e comportamentos esperados  
✅ Gera relatórios com screenshots de cada etapa  
✅ Encontra bugs, problemas de lógica e usabilidade  

## 🚀 Instalação

### 1. Instalar dependências do TPIC

```bash
cd tpic
pip install -r requirements.txt
```

### 2. Instalar navegador Chromium (Playwright)

```bash
playwright install chromium
```

## 📖 Como usar

### Executar todas as fases

```bash
python main.py
```

Isto vai:
1. Limpeza total (limpa.sh)
2. Instalação (install.sh)
3. Iniciar aplicação (start.sh)
4. Abrir navegador e executar testes

### Executar apenas uma fase

```bash
# Apenas setup (fase 1)
python main.py --phase 1

# Apenas teste do admin (fase 2)
python main.py --phase 2

# Fases 1 e 2
python main.py --phase 1,2

# Fases 2 a 4
python main.py --phase 2-4
```

### Ver ajuda

```bash
python main.py --help
```

## 📊 Fases do Teste

### Fase 1: Setup Automático
- Executa `limpa.sh` (reset total)
- Executa `install.sh` (instalação)
- Executa `start.sh` (inicia aplicação)
- Valida se backend e frontend ficaram disponíveis

### Fase 2: Teste Admin Padrão
- Acessa `http://localhost:5173/`
- Navega para `/admin-site`
- Valida redirecionamento para `/admin-site/login`
- Faz login com Admin/admin123
- Responde mensagem de "mude sua senha"
- Valida acesso a `/admin-site/first-access-setup`

### Fase 3: Cadastro Admin Paróquia *(implementado)*
- Acessa `/admin-site/paroquias`
- Clica em "Nova Paróquia"
- Preenche dados da paróquia (nome, email, telefone, PIX)
- Submete formulário
- Procura por opção para criar usuário admin paroquial

### Fase 4: Teste Admin Paróquia *(implementado)*
- Faz logout da sessão anterior
- Acessa `/admin-paroquia/login`
- Faz login com credenciais do admin paroquial
- Valida redirecionamento para `/admin-paroquia/dashboard`

### Fase 5: Teste Usuário Comum *(implementado)*
- Limpa session para acesso público
- Acessa `/` (homepage pública)
- Navega para formulário de cadastro (`/signup`)
- Preenche dados do usuário comum
- Submete formulário
- Valida sucesso (mensagem ou redirecionamento)

## 📁 Estrutura de Arquivos

```
tpic/
├── main.py              # Orquestrador principal
├── phases.py            # Classes das fases (Phase1, Phase2, etc)
├── config.py            # Configurações (URLs, credenciais, etc)
├── utils.py             # Funções utilitárias (logging, screenshots, etc)
├── requirements.txt     # Dependências Python
├── README.md            # Este arquivo
├── run.sh              # Script para executar com facilidade
├── logs/               # Logs de execução
├── reports/            # Relatórios HTML gerados
└── reports/screenshots/# Screenshots de cada step
```

## 📝 Logs e Relatórios

Após cada execução, o TPIC gera:

### Logs detalhados
```
tpic/logs/tpic_20260310_143022.log
```

Contém:
- Todos os passos executados
- Erros e avisos
- Timestamps de cada ação

### Relatório HTML
```
tpic/reports/report_20260310_143022.html
```

Contém:
- Resumo visual dos resultados
- Screenshots de cada etapa
- Status de cada step (✓ sucesso, ✗ falha, ⚠ aviso)
- Clique em qualquer imagem para expandir

Abra no navegador:
```
open tpic/reports/report_*.html
```

## 🎯 Exemplo de Uso Completo

```bash
# 1. Entrar no diretório
cd tpic

# 2. Se for primeira vez, instalar dependências
pip install -r requirements.txt
playwright install chromium

# 3. Executar todas as fases
python main.py

# 4. Acompanhar no terminal os logs em tempo real

# 5. Observar o navegador automático fazendo tudo

# 6. Ao final, abrir o relatório
open reports/report_*.html
```

## ⚙️ Configurações

Edite `config.py` para alterar:

```python
# URLs
BASE_URL = "http://localhost:5173"
BACKEND_URL = "http://localhost:8000"

# Navegador (headless = False para visualizar)
BROWSER_CONFIG = {
    "headless": False,  # ← Mude para True se não quiser ver o browser
    "slow_mo": 500,     # ← Aumentar para ver mais lentamente
}

# Credenciais de teste
ADMIN_DEFAULT = {
    "username": "Admin",
    "password": "admin123"
}
```

## 🔧 Troubleshooting

### Erro: "Docker não encontrado"

O TPIC precisa que Docker e Docker Compose estejam instalados.

```bash
# Linux (Ubuntu/Debian)
sudo apt-get install docker.io docker-compose
```

### Erro: "Playwright não instalado"

```bash
pip install playwright
playwright install chromium
```

### Navegador não abre

Verifique `config.py`:
```python
BROWSER_CONFIG = {
    "headless": False,  # Deve ser False para ver o navegador
}
```

### Timeout ao aguardar serviço

Se o backend/frontend está demorando muito para iniciar, aumente os valores em `config.py`:

```python
NAVIGATION_TIMEOUT = 60000  # 60 segundos
```

## 📚 Estrutura do Código

### BasePhase
Classe base para todas as fases. Define estrutura comum:

```python
class MyPhase(BasePhase):
    async def run(self) -> bool:
        """Executa a fase"""
        # 1. Navegar/fazer ação
        await self.page.goto(url)
        
        # 2. Interagir
        await self.page.fill("input", "valor")
        
        # 3. Capturar screenshot
        screenshot = await take_screenshot(self.page, "nome")
        
        # 4. Adicionar resultado
        self.add_result("Nome do Step", "✓", "Descrição", screenshot)
        
        return True
```

### Fases Implementadas

**Phase1_Setup**: Executa scripts de setup (limpa, instala, inicia)  
**Phase2_AdminDefault**: Login do admin padrão e primeiro acesso  
**Phase3_AdminParoquiaCreate**: Criação de paróquia e admin paroquial  
**Phase4_AdminParoquiaLogin**: Login como admin paroquial  
**Phase5_UserCommon**: Cadastro de usuário comum  

### Logger
Sistema de logging com cores:

```python
logger = Logger("meu_modulo")
logger.info("Informação")      # Azul
logger.success("Sucesso!")     # Verde
logger.error("Erro!")          # Vermelho
logger.warning("Aviso!")       # Amarelo
logger.debug("Debug")          # Magenta
```

Logs são salvos em `tpic/logs/tpic_YYYYMMDD_HHMMSS.log`

### Screenshots
Captura automática com:

```python
screenshot = await take_screenshot(page, "nome_do_step")
# Salva em: tpic/reports/screenshots/nome_do_step_HHMMSS.png
```

Usada em cada etapa importante para documentar o teste.

### Relatórios HTML
Automaticamente gerados após cada execução:

```
tpic/reports/report_YYYYMMDD_HHMMSS.html
```

Contém:
- Resumo de sucesso/falhas
- Timeline de cada step
- Screenshots interativas
- Clique em imagens para expandir

## 🤝 Extensões Futuras

- [ ] Validação de CPF com API (atualmente usa valores genéricos)
- [ ] Criação automática de admin paroquial via API (backend)
- [ ] Testes de roleplay de múltiplos usuários simultaneamente
- [ ] Testes de performance e load testing
- [ ] Validação de acessibilidade (WCAG)
- [ ] Teste de responsividade (mobile/tablet)
- [ ] Integração com CI/CD (GitHub Actions, GitLab CI, etc)
- [ ] Notificações por email/Slack de falhas
- [ ] Gravação de vídeo dos testes
- [ ] Teste de fluxos de erro esperados
- [ ] Validação de permissões e controle de acesso
- [ ] Teste de navegação completo do sitema

## 📄 Licença

Parte do projeto Bingo da Comunidade
