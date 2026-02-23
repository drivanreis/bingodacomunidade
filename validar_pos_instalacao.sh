#!/bin/bash

# ===========================================================================
# Validação pós-instalação (reset completo + subida + cobertura)
# ===========================================================================
# Fluxo oficial de homologação final em máquina limpa:
#   1) git clone <repo>
#   2) ./validar_pos_instalacao.sh
# Todo o restante (configurações funcionais) deve ocorrer via navegador,
# com a aplicação já executando em contêineres.
# Uso:
#   ./validar_pos_instalacao.sh
#   ./validar_pos_instalacao.sh --yes
#
# O que faz:
#   1) Executa limpeza total do Docker (limpa.sh)
#   2) Executa instalação (install.sh)
#   3) Sobe o sistema em background (start.sh -d)
#   4) Aguarda backend ficar saudável
#   5) Roda cobertura backend e frontend

set -euo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

YES_MODE=false
if [[ "${1:-}" == "--yes" ]]; then
  YES_MODE=true
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${BLUE}==================================================================${NC}"
echo -e "${BLUE}🔁 VALIDAÇÃO PÓS-INSTALAÇÃO (RESET + TESTES DE COBERTURA)${NC}"
echo -e "${BLUE}==================================================================${NC}"
echo

echo -e "${YELLOW}Este processo vai:${NC}"
echo "  • Executar limpeza total do Docker"
echo "  • Reinstalar dependências"
echo "  • Subir sistema com Docker Compose"
echo "  • Rodar cobertura do backend e frontend"
echo

if [[ "$YES_MODE" != true ]]; then
  read -p "Confirma execução completa? (digite 'sim' para continuar): " -r
  if [[ "$REPLY" != "sim" ]]; then
    echo "Operação cancelada."
    exit 0
  fi
fi

echo
echo -e "${YELLOW}[1/6] Limpeza total do Docker...${NC}"
printf 'sim\n' | ./limpa.sh

echo
echo -e "${YELLOW}[2/6] Instalação do ambiente...${NC}"
./install.sh

echo
echo -e "${YELLOW}[3/6] Subindo stack em background...${NC}"
./start.sh -d

echo
echo -e "${YELLOW}[4/6] Aguardando backend ficar saudável...${NC}"
BACKEND_CONTAINER="bingo_backend"

MAX_TRIES=30
for ((i=1; i<=MAX_TRIES; i++)); do
  STATUS=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$BACKEND_CONTAINER" 2>/dev/null || true)

  if [[ "$STATUS" == "healthy" || "$STATUS" == "running" ]]; then
    echo -e "${GREEN}✓ Backend pronto: ${STATUS}${NC}"
    break
  fi

  if [[ $i -eq $MAX_TRIES ]]; then
    echo -e "${RED}❌ Backend não ficou pronto a tempo.${NC}"
    docker compose ps
    exit 1
  fi

  echo "   Tentativa $i/$MAX_TRIES: status atual = ${STATUS:-indisponível}"
  sleep 2
done

echo
echo -e "${YELLOW}[5/6] Cobertura backend (com banco recém-instalado)...${NC}"
docker compose exec -e PYTHONPATH=/app backend pytest --cov=src --cov-report=term

echo
echo -e "${YELLOW}[6/6] Cobertura frontend...${NC}"
(
  cd frontend
  npm run test:coverage
)

echo
echo -e "${GREEN}==================================================================${NC}"
echo -e "${GREEN}✅ VALIDAÇÃO PÓS-INSTALAÇÃO CONCLUÍDA${NC}"
echo -e "${GREEN}==================================================================${NC}"
echo
echo "Comandos úteis:"
echo "  • Status da stack: docker compose ps"
echo "  • Logs:            docker compose logs -f"
echo "  • Parar stack:     docker compose down"
echo
