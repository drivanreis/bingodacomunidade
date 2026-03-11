# 📚 TPIC - Índice de Documentação

Bem-vindo ao **TPIC (Testador Prático de Integração Contínua)** - um agente automatizado que simula todo o fluxo manual de testes da sua aplicação Bingo Comunitário!

## 🚀 Comece Aqui

### Quick Start (5 minutos)

```bash
cd tpic
bash run.sh
```

Isto vai:
1. Instalar dependências automaticamente
2. Iniciar o navegador
3. Executar todas as fases
4. Gerar relatório HTML

## 📖 Documentação

| Arquivo | Objetivo | Audiência |
|---------|----------|-----------|
| **[README.md](README.md)** | Guia geral de uso, instalação e configuração | Todos |
| **[FLUXO_ESPERADO.md](FLUXO_ESPERADO.md)** | Detalhes de cada fase, O QUE é testado, critérios de sucesso | Developers, QA |
| **[config.py](../tpic/config.py)** | Configurações centralizadas (URLs, credenciais, timeouts) | Developers |
| **[main.py](../tpic/main.py)** | Orquestrador principal e menu de fases | Developers |
| **[phases.py](../tpic/phases.py)** | Implementação de cada fase (Phase1_Setup, Phase2_AdminDefault, etc) | Developers |
| **[utils.py](../tpic/utils.py)** | Funções utilitárias (logger, screenshots, API, relatórios) | Developers |

## 🎯 Fases do Teste

### ✅ Fase 1: Setup Automático
Execute scripts de limpeza, instalação e inicialização
- **Arquivo**: `phases.py` → `class Phase1_Setup`
- **Duração**: ~5-10 minutos
- **Resultado**: Backend + Frontend prontos

### ✅ Fase 2: Teste Admin Padrão
Login com credencial padrão (Admin/admin123) e primeiro acesso
- **Arquivo**: `phases.py` → `class Phase2_AdminDefault`
- **Duração**: ~2 minutos
- **Resultado**: Admin logado no /admin-site/dashboard

### ✅ Fase 3: Cadastro Admin Paróquia
Criar paróquia e registrar primeiro administrador paroquial
- **Arquivo**: `phases.py` → `class Phase3_AdminParoquiaCreate`
- **Duração**: ~2 minutos
- **Resultado**: Paróquia criada com admin

### ✅ Fase 4: Teste Admin Paróquia
Login como administrador paroquial
- **Arquivo**: `phases.py` → `class Phase4_AdminParoquiaLogin`
- **Duração**: ~1 minuto
- **Resultado**: Admin paroquial no /admin-paroquia/dashboard

### ✅ Fase 5: Teste Usuário Comum
Cadastro de usuário comum na plataforma pública
- **Arquivo**: `phases.py` → `class Phase5_UserCommon`
- **Duração**: ~1 minuto
- **Resultado**: Usuário comum cadastrado e logado

## 📊 Linhas de Código

```
config.py      ~250 linhas - Configurações e constantes
utils.py       ~350 linhas - Sistema de logging, API, relatórios
phases.py      ~1200 linhas - 5 fases completas com validações
main.py        ~200 linhas - Orquestrador e menu
```

**Total**: ~2000 linhas de código Python para automação completa

## 🔧 Como Usar

### Executar Tudo
```bash
python3 main.py
```

### Executar Fase Específica
```bash
python3 main.py --phase 2      # Apenas fase 2
python3 main.py --phase 1,2    # Fases 1 e 2
python3 main.py --phase 2-5    # Fases 2 a 5
```

### Ver Ajuda
```bash
python3 main.py --help
```

## 📂 Estrutura de Diretórios

```
tpic/
├── main.py                 # Orquestrador
├── phases.py              # Fases 1-5
├── config.py              # Configurações
├── utils.py               # Utilitários
├── run.sh                 # Script facilitador
├── requirements.txt       # Dependências Python
├── README.md             # Guia principal
├── FLUXO_ESPERADO.md     # Detalhes de cada fase
│
├── logs/                  # Logs de execução (gerado)
│   └── tpic_YYYYMMDD_HHMMSS.log
│
├── reports/               # Relatórios (gerado)
│   ├── report_YYYYMMDD_HHMMSS.html
│   └── screenshots/
│       ├── phase1_01_cleanup.png
│       ├── phase2_01_homepage.png
│       └── ... (screenshots de cada step)
│
└── .gitignore            # Ignora arquivos temporários
```

## 📈 Performance

| Fase | Tempo | Status |
|------|-------|--------|
| Setup | 5-10 min | Variável (depende recursos) |
| Admin Padrão | ~2 min | Rápido |
| Admin Paróquia | ~2 min | Rápido |
| Login Paróquia | ~1 min | Rápido |
| Usuário Comum | ~1 min | Rápido |
| **TOTAL** | **~12-17 min** | ✅ Aceitável |

## 🎓 Extensões Possíveis

Você pode adicionar novas fases ou melhorar as existentes:

```python
# Exemplo: Nova Fase 6 - Teste de Jogos
class Phase6_GamesFlow(BasePhase):
    def __init__(self):
        super().__init__("Fluxo de Jogos")
    
    async def run(self) -> bool:
        # Implementar lógica de teste de jogos
        return True

# Registrar em main.py na função run_all_phases()
```

## 🐛 Debugging

### Ver Navegador Abrindo
Edite `config.py`:
```python
BROWSER_CONFIG = {
    "headless": False,  # Mude para True para esconder
    "slow_mo": 1000,    # Aumentar para 2000 para ver mais lentamenteVariar }
```

### Ver Logs em Tempo Real
```bash
tail -f tpic/logs/tpic_*.log
```

### Abrir Relatório HTML
```bash
# Após execução:
open tpic/reports/report_*.html
# ou
xdg-open tpic/reports/report_*.html
```

### Executar com Breakpoint
Edite a fase e adicione:
```python
self.logger.info("Pausar para debug")
await asyncio.sleep(30)  # Parar por 30 segundos
```

## ✅ Checklist de Implementação

- [x] Estrutura de projeto criada
- [x] Sistema de logging com cores
- [x] Fase 1: Setup automático
- [x] Fase 2: Admin padrão
- [x] Fase 3: Admin paróquia
- [x] Fase 4: Login paroquial
- [x] Fase 5: Usuário comum
- [x] Geração de relatórios HTML
- [x] Captura de screenshots
- [x] Validações de elementos
- [x] Documentação completa

## 🤝 Contribuindo

Para adicionar novos testes ou melhorar o código:

1. Edite `phases.py` para adicionar nova `BasePhase`
2. Registre em `main.py` na função `run_all_phases()`
3. Adicione configurações em `config.py` se necessário
4. Teste localmente: `python3 main.py --phase X`
5. Documente em `FLUXO_ESPERADO.md`

## 📞 Suporte

Se uma fase falhar:

1. Leia o log: `tail tpic/logs/tpic_*.log`
2. Verifique o relatório: `open tpic/reports/report_*.html`
3. Consulte `FLUXO_ESPERADO.md` para detalhes da fase
4. Verifique `config.py` para credenciais/URLs
5. Aumente timeouts se necessário

## 📝 Notas Importantes

- **Credenciais de teste**: Definidas em `config.py`
- **Timeouts**: Ajustáveis em `config.py`
- **Screenshots**: Salvos automaticamente em `reports/screenshots/`
- **Logs**: Salvos em `logs/` com timestamp
- **Relatórios**: HTML interativo em `reports/`

## 🎉 Pronto para Começar?

```bash
cd tpic
bash run.sh
```

Aproveite! 🚀

---

**Criado em**: 10 de março de 2026  
**Versão**: 1.0 (Completa com Fases 1-5)  
**Status**: ✅ Pronto para Produção
