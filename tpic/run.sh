#!/bin/bash

# ===========================================================================
# TPIC - Script de Execução
# ===========================================================================

set -e

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "=================================================================="
echo "🤖 TPIC - Testador Prático de Integração Contínua"
echo "=================================================================="
echo -e "${NC}"

# ===========================================================================
# VERIFICAÇÕES
# ===========================================================================

# Verificar se está no diretório tpic
if [ ! -f "config.py" ] || [ ! -f "main.py" ]; then
    echo -e "${RED}❌ Erro: Execute este script do diretório tpic/${NC}"
    echo "   cd tpic && bash run.sh"
    exit 1
fi

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 não encontrado!${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version)
echo -e "${GREEN}✓ ${PYTHON_VERSION}${NC}"

# ===========================================================================
# INSTALAÇÃO SE NECESSÁRIO
# ===========================================================================

if [ ! -d "venv" ]; then
    echo -e "${YELLOW}[1/3] Criando ambiente virtual...${NC}"
    python3 -m venv venv
fi

echo -e "${YELLOW}[2/3] Ativando ambiente virtual...${NC}"
source venv/bin/activate

echo -e "${YELLOW}[3/3] Instalando dependências...${NC}"
pip install -q -r requirements.txt 2>/dev/null || pip install -r requirements.txt

# Verificar Playwright
if ! python3 -c "from playwright.async_api import async_playwright" 2>/dev/null; then
    echo -e "${YELLOW}Instalando navegador Chromium...${NC}"
    playwright install chromium
fi

# ===========================================================================
# EXECUTAR TPIC
# ===========================================================================

echo ""
echo -e "${GREEN}✓ Tudo pronto!${NC}"
echo ""

# Passar argumentos para main.py
python3 main.py "$@"
