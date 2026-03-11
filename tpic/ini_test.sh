#!/bin/bash

###############################################################################
# TPIC - Test Initialization Script
# Inicia e executa o teste automaticamente
###############################################################################

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções
print_header() {
    echo -e "\n${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# 1. Verificar se está no diretório certo
print_header "INICIANDO TPIC"

TPIC_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$TPIC_DIR"

if [ ! -f "main.py" ]; then
    print_error "main.py não encontrado em $TPIC_DIR"
    print_info "Procurando em diretórios pai..."
    
    # Procura em diretórios pai
    if [ -f "../tpic/main.py" ]; then
        cd ../tpic
        TPIC_DIR="$(pwd)"
        print_success "Encontrado em: $TPIC_DIR"
    else
        print_error "Não conseguiu encontrar o projeto TPIC"
        exit 1
    fi
else
    print_success "Projeto TPIC encontrado em: $TPIC_DIR"
fi

cd "$TPIC_DIR"

# 2. Verificar Python
print_info "Verificando Python..."
if ! command -v python3 &> /dev/null; then
    print_error "Python3 não instalado"
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1)
print_success "Python encontrado: $PYTHON_VERSION"

# 3. Verificar requisitos
print_info "Verificando requisitos..."
if [ -f "requirements.txt" ]; then
    # Verificar se playwright está instalado
    if ! python3 -c "import playwright" 2>/dev/null; then
        print_error "Dependências não instaladas"
        print_info "Instalando requisitos..."
        pip install -r requirements.txt -q
        print_success "Requisitos instalados"
    else
        print_success "Requisitos OK"
    fi
    
    # Instalar browsers
    if [ ! -d "$HOME/.cache/ms-playwright" ] && [ ! -d "$HOME/.wdm" ]; then
        print_info "Instalando navegadores (primeira vez)..."
        playwright install chromium -q
        print_success "Navegadores instalados"
    else
        print_success "Navegadores OK"
    fi
else
    print_error "requirements.txt não encontrado"
    exit 1
fi

# 4. Verificar se os arquivos necessários existem
print_info "Verificando arquivos..."
REQUIRED_FILES=("config.py" "phases.py" "utils.py" "element_discovery.py" "main.py")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Arquivo não encontrado: $file"
        exit 1
    fi
done
print_success "Todos os arquivos encontrados"

# 5. Criar diretórios necessários
mkdir -p reports screenshots logs

# 6. Executar testes
print_header "EXECUTANDO TESTES"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/tpic_${TIMESTAMP}.log"

print_info "Logs serão salvos em: $LOG_FILE"
print_info "Relatório será gerado em: reports/"

echo "Iniciando testes em $(date)" >> "$LOG_FILE"

# Executar com ou sem argumentos
if [ $# -eq 0 ]; then
    # Sem argumentos: executa todas as fases
    print_info "Executando todas as fases (1-5)..."
    python3 main.py --phase 1-5 2>&1 | tee -a "$LOG_FILE"
else
    # Com argumentos: passa para main.py
    print_info "Executando fases: $@"
    python3 main.py --phase "$@" 2>&1 | tee -a "$LOG_FILE"
fi

RESULT=$?

echo "Testes finalizados em $(date)" >> "$LOG_FILE"

if [ $RESULT -eq 0 ]; then
    print_success "Testes concluídos com sucesso!"
    
    # Procurar pelo relatório HTML mais recente
    LATEST_REPORT=$(find reports -name "report_*.html" -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)
    
    if [ -n "$LATEST_REPORT" ]; then
        print_success "Relatório gerado: $LATEST_REPORT"
        
        # Tentar abrir no navegador
        if command -v xdg-open &> /dev/null; then
            print_info "Abrindo relatório no navegador..."
            xdg-open "$LATEST_REPORT" 2>/dev/null || true
        elif command -v open &> /dev/null; then
            print_info "Abrindo relatório no navegador..."
            open "$LATEST_REPORT" 2>/dev/null || true
        fi
    fi
    
    echo -e "\n${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ TUDO PRONTO!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "📊 Verifique:"
    echo "   - Relatório: reports/report_*.html"
    echo "   - Screenshots: reports/screenshots/"
    echo "   - Logs: logs/tpic_*.log"
    echo ""
else
    print_error "Testes falharam. Verifique os logs."
    echo ""
    echo "📝 Último log:"
    tail -20 "$LOG_FILE"
    exit 1
fi
