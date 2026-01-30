#!/bin/bash

# ===========================================================================
# Alternar entre Modo Desenvolvimento e Produção
# ===========================================================================

show_menu() {
    echo ""
    echo "===================================================================="
    echo "🎱 Sistema de Bingo - Alternar Modo de Operação"
    echo "===================================================================="
    echo ""
    echo "Modo Atual: $(grep 'SEED_ENABLED=' docker-compose.yml | grep -o 'SEED_ENABLED=.*' | head -1)"
    echo ""
    echo "Escolha uma opção:"
    echo ""
    echo "  1) Modo DESENVOLVIMENTO (SEED_ENABLED=true)"
    echo "     - Cria 3 usuários de teste automaticamente"
    echo "     - Login com CPF: 11144477735 / Senha: Fiel@123"
    echo ""
    echo "  2) Modo PRODUÇÃO (SEED_ENABLED=false)"
    echo "     - Banco vazio, sem usuários de teste"
    echo "     - Tela de primeiro acesso aparece"
    echo "     - Criar Desenvolvedor manualmente"
    echo ""
    echo "  3) Sair"
    echo ""
    echo "===================================================================="
    echo -n "Digite sua opção [1-3]: "
}

# ===========================================================================
# FUNÇÃO: Alternar para Desenvolvimento
# ===========================================================================
set_dev_mode() {
    echo ""
    echo "📦 Alterando para Modo DESENVOLVIMENTO..."
    echo ""
    
    # Alterar SEED_ENABLED para true
    sed -i 's/SEED_ENABLED=false/SEED_ENABLED=true/' docker-compose.yml
    
    echo "   ✓ SEED_ENABLED=true configurado"
    echo ""
    echo "🔄 Reiniciando sistema..."
    docker compose down > /dev/null 2>&1
    docker compose up -d --build > /dev/null 2>&1
    
    echo ""
    echo "   Aguardando backend..."
    sleep 12
    
    echo ""
    echo "===================================================================="
    echo "✅ MODO DESENVOLVIMENTO ATIVADO"
    echo "===================================================================="
    echo ""
    echo "Usuários de teste criados:"
    echo "  1. Desenvolvedor: admin@bingodacomunidade.com.br / Admin@2026"
    echo "  2. Gerente: admin@paroquiasaojose.com.br / Admin@2026"
    echo "  3. Jogador: CPF 11144477735 / Fiel@123"
    echo ""
    echo "Acesse: http://localhost:5173"
    echo "===================================================================="
    echo ""
}

# ===========================================================================
# FUNÇÃO: Alternar para Produção
# ===========================================================================
set_prod_mode() {
    echo ""
    echo "🔒 Alterando para Modo PRODUÇÃO..."
    echo ""
    
    # Alterar SEED_ENABLED para false
    sed -i 's/SEED_ENABLED=true/SEED_ENABLED=false/' docker-compose.yml
    
    echo "   ✓ SEED_ENABLED=false configurado"
    echo ""
    echo "🔄 Reiniciando sistema..."
    docker compose down > /dev/null 2>&1
    docker compose up -d --build > /dev/null 2>&1
    
    echo ""
    echo "   Aguardando backend..."
    sleep 12
    
    echo ""
    echo "===================================================================="
    echo "✅ MODO PRODUÇÃO ATIVADO"
    echo "===================================================================="
    echo ""
    echo "⚠️  ATENÇÃO: Banco de dados vazio!"
    echo ""
    echo "Próximos passos:"
    echo "  1. Acesse: http://localhost:5173"
    echo "  2. Tela de 'Primeiro Acesso' aparecerá"
    echo "  3. Preencha os dados do Desenvolvedor"
    echo "  4. Senha forte obrigatória"
    echo "  5. Esta tela SÓ aparece UMA vez"
    echo ""
    echo "===================================================================="
    echo ""
}

# ===========================================================================
# LOOP PRINCIPAL
# ===========================================================================
while true; do
    show_menu
    read choice
    
    case $choice in
        1)
            set_dev_mode
            ;;
        2)
            set_prod_mode
            ;;
        3)
            echo ""
            echo "👋 Até logo!"
            echo ""
            exit 0
            ;;
        *)
            echo ""
            echo "❌ Opção inválida. Digite 1, 2 ou 3."
            sleep 2
            ;;
    esac
done
