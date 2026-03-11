# 🚀 ini_test.sh - Script de Inicialização

## O Que Faz

Um script shell que **inicia e executa o TPIC automaticamente** sem precisar lembrar comandos.

---

## Como Usar

### Opção 1: Executar Tudo

```bash
cd /home/eu/Documentos/GitHub/bingodacomunidade/tpic
./ini_test.sh
```

**Executa:** Todas as 5 fases (1-5)

### Opção 2: Fases Específicas

```bash
./ini_test.sh 2,3        # Fases 2 e 3
./ini_test.sh 2-5        # Fases 2 a 5
./ini_test.sh 1          # Só fase 1
```

---

## O Que o Script Faz

1. ✅ **Verifica Python** - Garante que Python3 está instalado
2. ✅ **Instala dependências** - pip install -r requirements.txt
3. ✅ **Instala navegadores** - playwright install chromium
4. ✅ **Cria diretórios** - reports/, logs/, screenshots/
5. ✅ **Executa testes** - python3 main.py --phase X-Y
6. ✅ **Abre relatório** - Automático no navegador padrão
7. ✅ **Salva logs** - Em logs/tpic_*.log

---

## Output Esperado

```
════════════════════════════════════════════════════════════
INICIANDO TPIC
════════════════════════════════════════════════════════════

✅ Projeto TPIC encontrado em: /home/.../tpic
✅ Python encontrado: Python 3.10.12
✅ Requisitos OK
✅ Navegadores OK
✅ Todos os arquivos encontrados

════════════════════════════════════════════════════════════
EXECUTANDO TESTES
════════════════════════════════════════════════════════════

ℹ️  Logs serão salvos em: logs/tpic_20260310_214700.log
ℹ️  Relatório será gerado em: reports/
ℹ️  Executando todas as fases (1-5)...

[Phase.Setup] ✓ Fase 1 concluída
[Phase.Admin] ✓ Fase 2 concluída
...

════════════════════════════════════════════════════════════
✅ TUDO PRONTO!
════════════════════════════════════════════════════════════

📊 Verifique:
   - Relatório: reports/report_*.html
   - Screenshots: reports/screenshots/
   - Logs: logs/tpic_*.log
```

---

## Arquivos Gerados

Após executar, você terá:

```
tpic/
├── reports/
│   ├── report_20260310_214700.html  ← Abra no navegador
│   └── screenshots/
│       ├── phase1_01_cleanup.png
│       ├── phase2_01_login.png
│       └── ...
├── logs/
│   └── tpic_20260310_214700.log     ← Verifique se algo falhou
└── ini_test.sh                       ← Este script
```

---

## Comandos Rápidos

```bash
# Executar tudo
./ini_test.sh

# Só admin login (Fase 2)
./ini_test.sh 2

# Admin + Paróquia (Fases 2-3)
./ini_test.sh 2,3

# Tudo exceto setup (se já rodou antes)
./ini_test.sh 2-5

# Ver último log
tail -50 logs/tpic_*.log

# Ver screenshots
ls -la reports/screenshots/
```

---

## Se Algo Falhar

O script salva **logs detalhados** em `logs/tpic_*.log`:

```bash
# Ver últimas 50 linhas do log
tail -50 logs/tpic_*.log

# Ou abrir no editor
nano logs/tpic_*.log
```

---

## Compatibilidade

- ✅ Linux (qualquer distro)
- ✅ macOS
- ⚠️ Windows (use WSL2 ou Git Bash)

---

## TL;DR

```bash
./ini_test.sh
```

Pronto! Tudo feito automaticamente. 🚀
