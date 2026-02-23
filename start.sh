#!/bin/bash

# ===========================================================================
# Script de Inicialização - Sistema de Bingo Comunitário
# ===========================================================================
# Plataforma: Linux
# Descrição: Inicia o sistema completo com Docker Compose
# Uso: ./start.sh [opção]
#
# Opções:
#   (sem opção)  - Inicia em modo detached (background)
#   -d           - Inicia em modo detached (background)
#   -f|--attach  - Inicia em foreground (logs no terminal)
#   --build      - Força rebuild das imagens
#   --fresh      - Remove tudo e inicia do zero
#   -h|--help    - Mostra esta ajuda

set -e

# Cores
GREEN=$'\033[0;32m'
BLUE=$'\033[0;34m'
YELLOW=$'\033[1;33m'
RED=$'\033[0;31m'
NC=$'\033[0m'

echo -e "${BLUE}"
echo "=================================================================="
echo "🎱 SISTEMA DE BINGO COMUNITÁRIO"
echo "=================================================================="
echo -e "${NC}"

# ===========================================================================
# VERIFICAÇÕES RÁPIDAS
# ===========================================================================

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker não encontrado!${NC}"
    echo "   Execute primeiro: ./install.sh"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose não encontrado!${NC}"
    exit 1
fi

# ===========================================================================
# PROCESSAMENTO DE ARGUMENTOS
# ===========================================================================

MODE="detached"
BUILD_FLAG=""
FRESH_MODE=false

show_help() {
    echo "Uso: ./start.sh [opções]"
    echo
    echo "Opções:"
    echo "  (sem opção)   Inicia em modo detached (background)"
    echo "  -d            Inicia em modo detached (background)"
    echo "  -f, --attach  Inicia em foreground (logs no terminal)"
    echo "  --build       Força rebuild das imagens"
    echo "  --fresh       Remove stack/volumes e inicia do zero"
    echo "  -h, --help    Mostra esta ajuda"
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        -d)
            MODE="detached"
            ;;
        -f|--attach)
            MODE="normal"
            ;;
        --build)
            BUILD_FLAG="--build"
            ;;
        --fresh)
            FRESH_MODE=true
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Opção inválida: $1${NC}"
            echo
            show_help
            exit 1
            ;;
    esac
    shift
done

if [[ "$FRESH_MODE" == true ]]; then
    echo -e "${YELLOW}⚠️  Modo FRESH: Isso vai remover todos os containers, volumes e imagens!${NC}"
    read -p "Tem certeza? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo -e "${YELLOW}Removendo containers e volumes...${NC}"
        docker compose down -v
        echo -e "${GREEN}✓ Limpeza concluída${NC}"
        BUILD_FLAG="--build"
    else
        echo "Operação cancelada"
        exit 0
    fi
fi

# ===========================================================================
# VERIFICAÇÃO DE INSTALAÇÃO
# ===========================================================================

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Dependências do frontend não encontradas${NC}"
    echo "   Execute primeiro: ./install.sh"
    read -p "Executar instalação agora? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        ./install.sh
    else
        exit 1
    fi
fi

if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado${NC}"
    echo "   Execute primeiro: ./install.sh"
    exit 1
fi

# ===========================================================================
# INICIALIZAÇÃO DO SISTEMA
# ===========================================================================

echo ""
echo -e "${YELLOW}🚀 Iniciando sistema...${NC}"
echo ""

if [ "$MODE" = "detached" ]; then
    echo "   Modo: Background (detached)"
    docker compose up -d $BUILD_FLAG
    
    echo ""
    echo -e "${GREEN}✅ Sistema iniciado em background!${NC}"
    echo ""
    echo "Para ver os logs:"
    echo "   ${GREEN}docker compose logs -f${NC}"
    echo ""
    echo "Para parar:"
    echo "   ${GREEN}docker compose down${NC}"
    
else
    echo "   Modo: Foreground (logs no terminal)"
    echo "   Pressione Ctrl+C para parar"
    echo ""
    docker compose up $BUILD_FLAG
fi

# ===========================================================================
# INFORMAÇÕES DE ACESSO
# ===========================================================================

if [ "$MODE" = "detached" ]; then
    echo ""
    echo -e "${BLUE}=================================================================="
    echo "📱 ACESSE O SISTEMA:"
    echo "=================================================================="
    echo -e "${NC}"
    echo ""
    echo "   Frontend: ${GREEN}http://localhost:5173${NC}"
    echo "   Backend:  ${GREEN}http://localhost:8000${NC}"
    echo "   API Docs: ${GREEN}http://localhost:8000/docs${NC}"
    echo ""
    echo "   Testes (direto no contêiner):"
    echo "   Backend:  ${GREEN}docker compose exec backend pytest -q${NC}"
    echo "   Frontend: ${GREEN}docker compose exec frontend npm run test -- --run${NC}"
    echo ""
    echo -e "${BLUE}=================================================================="
    echo "🔐 PRIMEIRO ACESSO (BOOTSTRAP):"
    echo "=================================================================="
    echo -e "${NC}"
    echo ""
    echo "   Login seed: ${GREEN}Admin${NC}"
    echo "   Senha seed: ${GREEN}admin123${NC}"
    echo ""
    echo "   Observação: o público permanece em manutenção até existir"
    echo "   o primeiro ${GREEN}Admin-Paróquia${NC} ativo."
    echo ""
    echo "=================================================================="
fi
