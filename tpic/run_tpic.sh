#!/bin/bash

################################################################################
# TPIC - Teste Prático de Integração Contínua
# Script de execução rápida
################################################################################

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função de print colorido
print_header() {
    echo -e "${BLUE}=================================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}=================================================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Detectar se estamos no diretório correto
if [ ! -f "config.py" ]; then
    print_error "Script deve ser executado DE DENTRO do diretório tpic/"
    echo ""
    echo "Use:"
    echo "  cd tpic"
    echo "  bash run_tpic.sh"
    echo ""
    echo "OU, execute da raiz do projeto:"
    echo "  bash run_tpic.sh"
    exit 1
fi

# Verificar Python 3
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 não encontrado"
    exit 1
fi

print_header "TPIC - Teste Prático de Integração Contínua"

# Verificar .env
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        print_warning "Arquivo .env não encontrado"
        echo "Criando .env a partir de .env.example..."
        cp .env.example .env
        print_success ".env criado com sucesso"
        echo ""
        echo "IMPORTANTE: Edite o arquivo .env e adicione sua ANTHROPIC_API_KEY:"
        echo "  $EDITOR .env"
        echo ""
        echo "  OU defina como variável de ambiente:"
        echo "  export ANTHROPIC_API_KEY=sk-ant-xxxxx"
        echo ""
    else
        print_error ".env não encontrado e .env.example também não existe"
        exit 1
    fi
fi

# Verificar dependências Python
print_header "Verificando dependências"

if python3 -c "import playwright" 2>/dev/null; then
    print_success "playwright instalado"
else
    print_warning "playwright não encontrado, instalando..."
    pip3 install playwright==1.58.0
fi

if python3 -c "import anthropic" 2>/dev/null; then
    print_success "anthropic instalado"
else
    print_warning "anthropic não encontrado, instalando..."
    pip3 install anthropic==0.18.0
fi

if python3 -c "import dotenv" 2>/dev/null; then
    print_success "python-dotenv instalado"
else
    print_warning "python-dotenv não encontrado, instalando..."
    pip3 install python-dotenv==1.0.1
fi

# Criar diretórios necessários
print_header "Preparando ambiente"

mkdir -p screenshots
mkdir -p logs
mkdir -p reports
print_success "Diretórios criados"

# Selecionar modo de execução
echo ""
echo -e "${BLUE}Selecione o modo de execução:${NC}"
echo "  1. TPIC Completo (todos os testes)"
echo "  2. Admin Site"
echo "  3. Admin Paróquia"
echo "  4. Usuário Comum"
echo "  5. Teste único (customizado)"
echo ""
read -p "Opção [1-5]: " option

case $option in
    1)
        print_header "Executando: TPIC Completo"
        python3 run_tpic.py
        ;;
    2)
        print_header "Executando: Admin Site"
        python3 test_admin_site.py
        ;;
    3)
        print_header "Executando: Admin Paróquia"
        python3 test_admin_paroquia.py
        ;;
    4)
        print_header "Executando: Usuário Comum"
        python3 test_usuario_comum.py
        ;;
    5)
        read -p "Qual teste? (teste_admin_site, test_admin_paroquia, test_usuario_comum): " test_name
        print_header "Executando: $test_name"
        python3 "${test_name}.py"
        ;;
    *)
        print_error "Opção inválida"
        exit 1
        ;;
esac

# Verificar resultado
if [ $? -eq 0 ]; then
    print_success "Testes executados com sucesso!"
    echo ""
    echo "Relatórios disponíveis em:"
    echo "  📊 $PWD/reports/"
    echo ""
    echo "Screenshots disponíveis em:"
    echo "  📸 $PWD/screenshots/"
    echo ""
    echo "Logs disponíveis em:"
    echo "  📋 $PWD/logs/"
else
    print_error "Testes falharam"
    exit 1
fi
