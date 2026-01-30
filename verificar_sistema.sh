#!/bin/bash

# ===========================================================================
# Verificação Rápida do Sistema - Health Check Completo
# ===========================================================================

echo ""
echo "===================================================================="
echo "🏥 VERIFICAÇÃO DE SAÚDE DO SISTEMA"
echo "===================================================================="
echo ""

# ===========================================================================
# 1. CONTAINERS
# ===========================================================================
echo "1️⃣  Verificando containers..."
echo ""
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "NAMES|bingo"
echo ""

# ===========================================================================
# 2. BACKEND HEALTH
# ===========================================================================
echo "2️⃣  Verificando backend..."
echo ""

if curl -s http://localhost:8000/ping > /dev/null 2>&1; then
    echo "   ✅ Backend está ONLINE"
    
    # Verificar health completo
    HEALTH=$(curl -s http://localhost:8000/health)
    echo "   Detalhes:"
    echo "$HEALTH" | python3 -m json.tool 2>/dev/null || echo "$HEALTH"
else
    echo "   ❌ Backend NÃO está respondendo"
    echo "   Execute: docker compose up -d"
fi
echo ""

# ===========================================================================
# 3. FRONTEND
# ===========================================================================
echo "3️⃣  Verificando frontend..."
echo ""

if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "   ✅ Frontend está ONLINE"
    TITLE=$(curl -s http://localhost:5173 | grep -o '<title>.*</title>')
    echo "   $TITLE"
else
    echo "   ❌ Frontend NÃO está respondendo"
    echo "   Execute: docker compose up -d"
fi
echo ""

# ===========================================================================
# 4. MODO DE OPERAÇÃO
# ===========================================================================
echo "4️⃣  Verificando modo de operação..."
echo ""

SEED_MODE=$(grep 'SEED_ENABLED=' docker-compose.yml | grep -o 'SEED_ENABLED=.*' | head -1)
echo "   $SEED_MODE"

if echo "$SEED_MODE" | grep -q "true"; then
    echo "   🔧 Modo DESENVOLVIMENTO"
    echo "   - 3 usuários de teste criados automaticamente"
    echo "   - Login: CPF 11144477735 / Senha Fiel@123"
else
    echo "   🔒 Modo PRODUÇÃO"
    echo "   - Banco vazio, usa primeiro acesso seguro"
    echo "   - Tela de setup aparece na primeira vez"
fi
echo ""

# ===========================================================================
# 5. SISTEMA DE PRIMEIRO ACESSO
# ===========================================================================
echo "5️⃣  Testando sistema de primeiro acesso..."
echo ""

FIRST_ACCESS=$(curl -s http://localhost:8000/auth/first-access 2>/dev/null)

if [ -n "$FIRST_ACCESS" ]; then
    echo "   Resposta da API:"
    echo "$FIRST_ACCESS" | python3 -m json.tool 2>/dev/null || echo "$FIRST_ACCESS"
    echo ""
    
    if echo "$FIRST_ACCESS" | grep -q '"needs_setup":true'; then
        echo "   ⚠️  Sistema PRECISA de configuração"
        echo "   Acesse: http://localhost:5173"
        echo "   Tela de primeiro acesso aparecerá"
    else
        echo "   ✅ Sistema JÁ configurado"
        echo "   Use tela de login normal"
    fi
else
    echo "   ❌ Endpoint /auth/first-access não respondeu"
fi
echo ""

# ===========================================================================
# 6. LOGS RECENTES
# ===========================================================================
echo "6️⃣  Verificando logs recentes do backend..."
echo ""

if docker ps | grep -q bingo_backend; then
    echo "   Últimas 5 linhas do log:"
    echo ""
    docker logs bingo_backend 2>&1 | grep -E "(INFO|ERROR|WARNING)" | tail -5 | sed 's/^/   /'
else
    echo "   ❌ Container do backend não está rodando"
fi
echo ""

# ===========================================================================
# RESUMO FINAL
# ===========================================================================
echo "===================================================================="
echo "📊 RESUMO"
echo "===================================================================="
echo ""

# Contar serviços rodando
RUNNING=$(docker ps | grep -c bingo)

if [ "$RUNNING" -eq 2 ]; then
    echo "✅ Sistema SAUDÁVEL - Todos os serviços online"
    echo ""
    echo "Acesse:"
    echo "  Frontend: http://localhost:5173"
    echo "  Backend:  http://localhost:8000/docs"
    echo ""
elif [ "$RUNNING" -eq 1 ]; then
    echo "⚠️  Sistema PARCIAL - Apenas 1 de 2 serviços rodando"
    echo ""
    echo "Execute: docker compose up -d"
    echo ""
else
    echo "❌ Sistema PARADO - Nenhum serviço rodando"
    echo ""
    echo "Execute: docker compose up -d"
    echo ""
fi

echo "===================================================================="
echo ""
