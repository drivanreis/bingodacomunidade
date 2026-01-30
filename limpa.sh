#!/bin/bash

# ===========================================================================
# Script de Limpeza TOTAL - Sistema de Bingo Comunitário
# ===========================================================================
# Descrição: Remove TUDO do Docker como se nunca tivesse sido instalado
# Uso: ./limpa.sh

set -e

# Cores
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${RED}"
echo "=================================================================="
echo "🔥 LIMPEZA TOTAL DO DOCKER - RESET COMPLETO"
echo "=================================================================="
echo -e "${NC}"
echo ""
echo -e "${YELLOW}ATENÇÃO: Este script vai remover TUDO:${NC}"
echo "  • TODOS os containers (não só deste projeto)"
echo "  • TODAS as imagens Docker"
echo "  • TODAS as redes"
echo "  • TODOS os volumes"
echo "  • TODO o cache de build"
echo ""
echo -e "${RED}⚠️  O Docker ficará completamente limpo!${NC}"
echo ""
read -p "Tem CERTEZA ABSOLUTA? (digite 'sim' para confirmar): " -r
echo
echo ""

if [[ ! $REPLY == "sim" ]]; then
    echo "Operação cancelada."
    exit 0
fi

echo -e "${YELLOW}Iniciando limpeza TOTAL...${NC}"
echo ""

# 1. Parar TODOS os containers
echo "🛑 Parando TODOS os containers..."
docker stop $(docker ps -aq) 2>/dev/null || true

# 2. Remover TODOS os containers
echo "🗑️  Removendo TODOS os containers..."
docker rm -f $(docker ps -aq) 2>/dev/null || true

# 3. Remover TODAS as imagens
echo "🗑️  Removendo TODAS as imagens..."
docker rmi -f $(docker images -aq) 2>/dev/null || true

# 4. Remover TODAS as redes customizadas
echo "🗑️  Removendo TODAS as redes..."
docker network prune -f 2>/dev/null || true

# 5. Remover TODOS os volumes
echo "🗑️  Removendo TODOS os volumes..."
docker volume rm $(docker volume ls -q) 2>/dev/null || true

# 6. Limpar TODO o cache de build
echo "🗑️  Limpando TODO o cache de build..."
docker builder prune -af 2>/dev/null || true

# 7. Limpeza final (system prune)
echo "🗑️  Limpeza final do sistema..."
docker system prune -af --volumes 2>/dev/null || true

echo ""
echo -e "${GREEN}"
echo "=================================================================="
echo "✅ LIMPEZA TOTAL CONCLUÍDA!"
echo "=================================================================="
echo -e "${NC}"
echo ""
echo "Docker está agora completamente limpo."
echo "Como se nunca tivesse baixado nenhuma imagem."
echo ""
echo "Para reconstruir o sistema, execute:"
echo "  ${GREEN}docker compose up --build${NC}"
echo ""
