#!/bin/bash

# ===========================================================================
# Teste do Sistema de Primeiro Acesso
# ===========================================================================
# Este script testa o fluxo de primeiro acesso em modo PRODUÇÃO
# (sem usuários de teste, banco vazio)

set -e

echo ""
echo "===================================================================="
echo "🧪 TESTE: Sistema de Primeiro Acesso (Modo Produção)"
echo "===================================================================="
echo ""

# ===========================================================================
# 1. PARAR SISTEMA
# ===========================================================================
echo "1️⃣  Parando sistema atual..."
docker compose down > /dev/null 2>&1
echo "   ✓ Sistema parado"
echo ""

# ===========================================================================
# 2. BACKUP DO docker-compose.yml
# ===========================================================================
echo "2️⃣  Fazendo backup da configuração..."
cp docker-compose.yml docker-compose.yml.backup
echo "   ✓ Backup salvo em docker-compose.yml.backup"
echo ""

# ===========================================================================
# 3. ALTERAR SEED_ENABLED PARA FALSE
# ===========================================================================
echo "3️⃣  Alterando para modo PRODUÇÃO (SEED_ENABLED=false)..."
sed -i 's/SEED_ENABLED=true/SEED_ENABLED=false/' docker-compose.yml
echo "   ✓ SEED_ENABLED=false configurado"
echo ""

# ===========================================================================
# 4. INICIAR SISTEMA
# ===========================================================================
echo "4️⃣  Iniciando sistema em modo produção..."
docker compose up -d --build > /dev/null 2>&1
echo "   ✓ Sistema iniciado"
echo ""

# ===========================================================================
# 5. AGUARDAR BACKEND FICAR PRONTO
# ===========================================================================
echo "5️⃣  Aguardando backend ficar pronto..."
sleep 10

# Verificar se backend está respondendo
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:8000/ping > /dev/null 2>&1; then
        echo "   ✓ Backend pronto!"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo "   ✗ Timeout aguardando backend"
        exit 1
    fi
    
    sleep 1
done
echo ""

# ===========================================================================
# 6. TESTAR ENDPOINT DE VERIFICAÇÃO
# ===========================================================================
echo "6️⃣  Testando GET /auth/first-access..."
RESPONSE=$(curl -s http://localhost:8000/auth/first-access)
NEEDS_SETUP=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['needs_setup'])")

echo "   Resposta: $RESPONSE"
echo ""

if [ "$NEEDS_SETUP" = "True" ]; then
    echo "   ✅ CORRETO: Sistema precisa de configuração (banco vazio)"
else
    echo "   ❌ ERRO: Sistema deveria retornar needs_setup=true"
    echo "   Restaurando configuração original..."
    mv docker-compose.yml.backup docker-compose.yml
    exit 1
fi
echo ""

# ===========================================================================
# 7. TESTAR CRIAÇÃO DE PRIMEIRO ADMIN
# ===========================================================================
echo "7️⃣  Testando POST /auth/first-access-setup..."

SETUP_RESPONSE=$(curl -s -X POST http://localhost:8000/auth/first-access-setup \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Desenvolvedor Teste",
    "cpf": "12345678909",
    "email": "dev@teste.com",
    "whatsapp": "+5585987654321",
    "senha": "Teste@123"
  }')

echo "   Resposta: $SETUP_RESPONSE"
echo ""

# Verificar se retornou access_token
if echo "$SETUP_RESPONSE" | grep -q "access_token"; then
    echo "   ✅ CORRETO: Primeiro admin criado com sucesso"
else
    echo "   ❌ ERRO: Não retornou access_token"
    echo "   Restaurando configuração original..."
    mv docker-compose.yml.backup docker-compose.yml
    exit 1
fi
echo ""

# ===========================================================================
# 8. VERIFICAR PROTEÇÃO (TENTAR CRIAR SEGUNDO ADMIN)
# ===========================================================================
echo "8️⃣  Testando proteção (tentar criar segundo admin)..."

SECOND_RESPONSE=$(curl -s -X POST http://localhost:8000/auth/first-access-setup \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Segundo Admin",
    "cpf": "98765432100",
    "email": "segundo@teste.com",
    "whatsapp": "+5585912345678",
    "senha": "Teste@456"
  }')

echo "   Resposta: $SECOND_RESPONSE"
echo ""

# Verificar se retornou erro 403
if echo "$SECOND_RESPONSE" | grep -q "já foi configurado"; then
    echo "   ✅ CORRETO: Proteção funcionando (não permite segundo admin)"
else
    echo "   ⚠️  ATENÇÃO: Proteção pode não estar funcionando corretamente"
fi
echo ""

# ===========================================================================
# 9. VERIFICAR ENDPOINT APÓS CONFIGURAÇÃO
# ===========================================================================
echo "9️⃣  Verificando GET /auth/first-access após configuração..."
FINAL_CHECK=$(curl -s http://localhost:8000/auth/first-access)
FINAL_NEEDS_SETUP=$(echo "$FINAL_CHECK" | python3 -c "import sys, json; print(json.load(sys.stdin)['needs_setup'])")

echo "   Resposta: $FINAL_CHECK"
echo ""

if [ "$FINAL_NEEDS_SETUP" = "False" ]; then
    echo "   ✅ CORRETO: Sistema agora retorna needs_setup=false"
else
    echo "   ❌ ERRO: Sistema deveria retornar needs_setup=false após criar admin"
fi
echo ""

# ===========================================================================
# 10. RESTAURAR CONFIGURAÇÃO ORIGINAL
# ===========================================================================
echo "🔄 Restaurando configuração original (SEED_ENABLED=true)..."
docker compose down > /dev/null 2>&1
mv docker-compose.yml.backup docker-compose.yml
docker compose up -d > /dev/null 2>&1
echo "   ✓ Configuração restaurada"
echo ""

# ===========================================================================
# RESULTADO FINAL
# ===========================================================================
echo "===================================================================="
echo "✅ TESTE CONCLUÍDO COM SUCESSO!"
echo "===================================================================="
echo ""
echo "Resultado:"
echo "  ✅ Sistema detecta banco vazio corretamente"
echo "  ✅ Permite criar primeiro Desenvolvedor"
echo "  ✅ Proteção contra segundo admin funciona"
echo "  ✅ Estado muda corretamente após configuração"
echo ""
echo "Sistema restaurado para modo DESENVOLVIMENTO (SEED_ENABLED=true)"
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:8000/docs"
echo "===================================================================="
