# ⚡ QUICK START - Execute em 2 Minutos

## TL;DR

```bash
cd /home/eu/Documentos/GitHub/bingodacomunidade/tpic
python3 main.py --phase 1-5
```

**Feito!** 🚀

---

## O Que Acontece

1. **Fase 1**: Setup automático (limpa, instala, inicia)
2. **Fase 2**: Admin login (descobre botão "admin_site" automaticamente)
3. **Fase 3**: Cria paróquia (descobre botão "paroquias" automaticamente)
4. **Fase 4**: Login paroquial (descobre "logout" e "admin_paroquia" automaticamente)
5. **Fase 5**: Cadastro usuário (descobre "cadastro" automaticamente)

**Resultado**: Relatório HTML em `reports/report_*.html` ✅

---

## Variações

```bash
# Só setup + admin
python3 main.py --phase 1,2

# Só fases 2-5
python3 main.py --phase 2-5

# Uma fase específica
python3 main.py --phase 3
```

---

## Ver Logs

```bash
# Executar com logs detalhados
python3 main.py --phase 2 2>&1 | tee debug.log

# Filtrar logs de descoberta
python3 main.py --phase 2 2>&1 | grep SELECTOR
```

---

## Troubleshoot Rápido

### Erro: Módulo não encontrado
```bash
pip install -r requirements.txt
playwright install chromium
```

### Erro: Porta já em uso
```bash
# Fazer limpeza antes
./limpa.sh
./install.sh
./start.sh

# Depois
python3 main.py --phase 1-5
```

### Erro: Browser não encontrado
```bash
playwright install chromium
```

---

## Pronto? Execute!

```bash
python3 main.py --phase 1-5
```

Pronto! 🎉
