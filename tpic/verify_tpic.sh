#!/bin/bash

################################################################################
# TPIC - Checklist de Verificação
# Verifica se tudo está pronto para executar os testes
################################################################################

echo ""
echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                    TPIC - Checklist de Verificação                         ║"
echo "║          Teste Prático de Integração Contínua com Playwright + Groq        ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "config.py" ]; then
    echo "❌ Script deve ser executado DE DENTRO do diretório tpic/"
    echo ""
    echo "Use:"
    echo "  cd tpic"
    echo "  bash verify_tpic.sh"
    exit 1
fi

TPIC_DIR=$(pwd)
CHECKS_PASSED=0
CHECKS_FAILED=0

# Função para verificar
check_item() {
    local description=$1
    local command=$2
    
    printf "%-60s " "$description"
    
    if eval "$command" > /dev/null 2>&1; then
        echo "✅ OK"
        ((CHECKS_PASSED++))
        return 0
    else
        echo "❌ FALHOU"
        ((CHECKS_FAILED++))
        return 1
    fi
}

# ============================================================================
# Verificações de Arquivos
# ============================================================================
echo "📋 VERIFICANDO ARQUIVOS ESSENCIAIS..."
echo ""

check_item "├─ config.py" "test -f config.py"
check_item "├─ browser.py" "test -f browser.py"
check_item "├─ claude_vision.py" "test -f claude_vision.py"
check_item "├─ groq_vision.py" "test -f groq_vision.py"
check_item "├─ utils.py" "test -f utils.py"
check_item "├─ run_tpic.py" "test -f run_tpic.py"
check_item "├─ test_admin_site.py" "test -f test_admin_site.py"
check_item "├─ test_admin_paroquia.py" "test -f test_admin_paroquia.py"
check_item "├─ test_usuario_comum.py" "test -f test_usuario_comum.py"
check_item "├─ run_tpic.sh" "test -f run_tpic.sh"
check_item "├─ requirements.txt" "test -f requirements.txt"
check_item "├─ .env.example" "test -f .env.example"
check_item "├─ TPIC_README.md" "test -f TPIC_README.md"
check_item "└─ IMPLEMENTACAO_TPIC.md" "test -f IMPLEMENTACAO_TPIC.md"

echo ""

# ============================================================================
# Verificações de Dependências Python
# ============================================================================
echo "🐍 VERIFICANDO DEPENDÊNCIAS PYTHON..."
echo ""

check_item "├─ playwright (1.58.0)" "pip show playwright | grep -q Version"
check_item "├─ groq" "python3 -c 'import groq'"
check_item "├─ anthropic" "python3 -c 'import anthropic'"
check_item "├─ python-dotenv" "python3 -c 'import dotenv'"
check_item "├─ colorama" "python3 -c 'import colorama'"
check_item "├─ aiohttp" "python3 -c 'import aiohttp'"
check_item "├─ requests" "python3 -c 'import requests'"
check_item "└─ PIL (pillow)" "python3 -c 'from PIL import Image'"

echo ""

# ============================================================================
# Verificações de Ambiente
# ============================================================================
echo "⚙️  VERIFICANDO AMBIENTE..."
echo ""

check_item "├─ Python 3 instalado" "command -v python3"
check_item "├─ Python 3.8 ou superior" "python3 -c 'import sys; print(sys.version_info >= (3, 8))' | grep -q True"
check_item "├─ Diretório snapshots/" "test -d screenshots"
check_item "├─ Diretório logs/" "test -d logs"
check_item "└─ Diretório reports/" "test -d reports"

echo ""

# ============================================================================
# Verificações de Configuração
# ============================================================================
echo "🔑 VERIFICANDO CONFIGURAÇÃO..."
echo ""

if test -f ".env"; then
    check_item "├─ Arquivo .env existe" "test -f .env"
    
    if grep -q "GROQ_API_KEY" .env; then
        check_item "├─ GROQ_API_KEY definida" "grep -q 'GROQ_API_KEY=' .env && [[ $(grep 'GROQ_API_KEY=' .env) != \"GROQ_API_KEY=\" ]]"
    else
        echo "│  ├─ GROQ_API_KEY não definida                          ❌ FALTANDO"
        ((CHECKS_FAILED++))
    fi
else
    echo "├─ Arquivo .env NÃO ENCONTRADO                            ⚠️  TENTAR COPIAR"
    
    if test -f ".env.example"; then
        echo "│  └─ Copiando .env.example para .env..."
        cp .env.example .env
        echo "│     ✅ Arquivo .env criado"
        echo "│     ⚠️  Edite .env e adicione sua GROQ_API_KEY"
        ((CHECKS_FAILED++))
    fi
fi

echo ""

# ============================================================================
# Verificações de Servidor
# ============================================================================
echo "🌐 VERIFICANDO SERVIDOR..."
echo ""

if curl -s http://localhost:5173 > /dev/null 2>&1; then
    check_item "└─ Servidor em localhost:5173" "curl -s http://localhost:5173"
else
    echo "└─ Servidor em localhost:5173                              ⚠️  OFFLINE"
    echo "   Certifique-se de executar: ./start.sh"
    ((CHECKS_FAILED++))
fi

echo ""

# ============================================================================
# Script Executável
# ============================================================================
echo "🚀 VERIFICANDO SCRIPTS..."
echo ""

if test -x "run_tpic.sh"; then
    check_item "└─ run_tpic.sh é executável" "test -x run_tpic.sh"
else
    echo "└─ run_tpic.sh NÃO É EXECUTÁVEL                           ⚠️  CORRIGINDO"
    chmod +x run_tpic.sh
    echo "   ✅ Permissões ajustadas"
fi

echo ""

# ============================================================================
# Resumo Final
# ============================================================================
TOTAL=$((CHECKS_PASSED + CHECKS_FAILED))

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                              RESUMO                                        ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

echo "✅ Verificações Passou:  $CHECKS_PASSED/$TOTAL"
echo "❌ Verificações Falhou:  $CHECKS_FAILED/$TOTAL"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo "╔════════════════════════════════════════════════════════════════════════════╗"
    echo "║  ✅ TUDO PRONTO! Você pode executar os testes                            ║"
    echo "╚════════════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Para começar:"
    echo ""
    echo "  1. COMPLETO (todos os testes):"
    echo "     python3 run_tpic.py"
    echo ""
    echo "  2. OU, USE O SCRIPT INTERATIVO:"
    echo "     bash run_tpic.sh"
    echo ""
    echo "  3. OU, TESTE INDIVIDUAL:"
    echo "     python3 test_admin_site.py"
    echo "     python3 test_admin_paroquia.py"
    echo "     python3 test_usuario_comum.py"
    echo ""
    echo "Relatórios estarão em: ./reports/"
    echo ""
    exit 0
else
    echo "╔════════════════════════════════════════════════════════════════════════════╗"
    echo "║  ⚠️  PROBLEMAS ENCONTRADOS                                               ║"
    echo "║  Corrija os itens marcados com ❌ ou ⚠️ acima                            ║"
    echo "╚════════════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "PRÓXIMOS PASSOS:"
    echo ""
    
    if grep -q "Arquivo .env NÃO ENCONTRADO" <(echo ""); then
        echo "  1. Copie .env.example para .env:"
        echo "     cp .env.example .env"
        echo ""
    fi
    
    echo "  2. Edite .env e adicione sua GROQ_API_KEY:"
    echo "     nano .env  (ou seu editor preferido)"
    echo ""
    echo "  3. Certifique-se de que o servidor está rodando:"
    echo "     ./start.sh"
    echo ""
    echo "  4. Execute este checklist novamente:"
    echo "     bash verify_tpic.sh"
    echo ""
    exit 1
fi
