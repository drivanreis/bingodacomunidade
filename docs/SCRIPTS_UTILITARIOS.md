# 🛠️ Scripts Utilitários (Enxuto)

## ✅ Scripts oficiais de uso diário

| Script | Comando | Quando usar |
|---|---|---|
| Limpeza total | `./limpa.sh` | Reset completo do ambiente Docker |
| Instalação | `./install.sh` | Preparar ambiente na primeira execução |
| Inicialização | `./start.sh` | Subir stack (foreground/detached) |
| Diagnóstico | `./test.sh` | Verificar saúde geral do sistema |
| Cobertura | `./test.sh --coverage` | Obter cobertura backend + frontend |
| Homologação limpa | `./validar_pos_instalacao.sh` | Validar fluxo completo em máquina limpa |

---

## 🚀 Fluxo recomendado

```bash
# 1) Instalar (uma vez)
./install.sh

# 2) Iniciar
./start.sh -d

# 3) Diagnóstico
./test.sh

# 4) Cobertura
./test.sh --coverage
```

---

## 🧹 Scripts removidos (faxina)

Os scripts abaixo foram removidos por redundância operacional:

- `alternar_modo.sh`
- `menu.sh`
- `verificar_sistema.sh`
- `test_first_access.sh`

As funcionalidades úteis foram absorvidas no fluxo principal (`limpa/install/start/test`) e no fluxo de homologação (`validar_pos_instalacao.sh`).
