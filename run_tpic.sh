#!/bin/bash

################################################################################
# TPIC - Teste Prático de Integração Contínua
# Executa os testes automatizados com Playwright + Groq API
# Pré-requisito: limpa.sh, install.sh e start.sh já foram executados
################################################################################

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Verificar se estamos na raiz
if [ ! -d "tpic" ]; then
    echo -e "${RED}❌ Erro: Pasta 'tpic' não encontrada${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         TPIC - TESTES AUTOMATIZADOS                           ║${NC}"
echo -e "${BLUE}║   Playwright + Groq API (Consumo em tempo real)                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Verificar se aplicação está disponível
echo -e "${BLUE}▶ Verificando se aplicação está disponível...${NC}"
if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${RED}✗ Erro: Aplicação não está respondendo em http://localhost:5173${NC}"
    echo -e "${YELLOW}Você executou os scripts limpa.sh, install.sh e start.sh?${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Aplicação disponível!${NC}"
echo ""

# Executar testes
cd tpic
bash run_tpic.sh "$@"
