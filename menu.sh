#!/bin/bash

# ===========================================================================
# 🎱 Bingo da Comunidade - Comandos Rápidos (ATUALIZADO)
# ===========================================================================

echo ""
echo "===================================================================="
echo "🎱 COMANDOS RÁPIDOS - Sistema de Bingo da Comunidade"
echo "===================================================================="
echo ""
echo "NOVO! Sistema com Primeiro Acesso Seguro implementado"
echo ""
echo "===================================================================="
echo ""

# ===========================================================================
# MENU PRINCIPAL
# ===========================================================================
echo "Escolha uma opção:"
echo ""
echo "  BÁSICOS:"
echo "    1) Iniciar sistema"
echo "    2) Parar sistema"
echo "    3) Reiniciar sistema"
echo "    4) Ver logs (backend)"
echo "    5) Ver logs (frontend)"
echo ""
echo "  UTILITÁRIOS:"
echo "    6) Verificar saúde do sistema"
echo "    7) Alternar modo (Dev/Prod)"
echo "    8) Testar primeiro acesso"
echo "    9) Reset completo (limpa tudo)"
echo ""
echo "  AVANÇADOS:"
echo "    10) Abrir API Docs"
echo "    11) Abrir Frontend"
echo "    12) Entrar no backend (bash)"
echo "    13) Backup do banco de dados"
echo ""
echo "    0) Sair"
echo ""
echo "===================================================================="
echo -n "Digite sua opção: "
read opcao

case $opcao in
    1)
        echo ""
        echo "🚀 Iniciando sistema..."
        docker compose up -d
        echo ""
        echo "✅ Sistema iniciado!"
        echo "   Frontend: http://localhost:5173"
        echo "   Backend:  http://localhost:8000/docs"
        ;;
    
    2)
        echo ""
        echo "🛑 Parando sistema..."
        docker compose down
        echo "✅ Sistema parado"
        ;;
    
    3)
        echo ""
        echo "🔄 Reiniciando sistema..."
        docker compose restart
        echo "✅ Sistema reiniciado"
        ;;
    
    4)
        echo ""
        echo "📋 Logs do backend (Ctrl+C para sair):"
        echo ""
        docker logs -f bingo_backend
        ;;
    
    5)
        echo ""
        echo "📋 Logs do frontend (Ctrl+C para sair):"
        echo ""
        docker logs -f bingo_frontend
        ;;
    
    6)
        echo ""
        ./verificar_sistema.sh
        ;;
    
    7)
        echo ""
        ./alternar_modo.sh
        ;;
    
    8)
        echo ""
        ./test_first_access.sh
        ;;
    
    9)
        echo ""
        echo "⚠️  ATENÇÃO: Isto vai APAGAR TUDO!"
        echo -n "Tem certeza? (s/N): "
        read confirma
        
        if [ "$confirma" = "s" ] || [ "$confirma" = "S" ]; then
            echo ""
            echo "🧹 Executando limpeza completa..."
            ./limpa.sh
            echo ""
            echo "✅ Sistema limpo!"
            echo ""
            echo "Para reinstalar:"
            echo "  ./install.sh"
        else
            echo ""
            echo "❌ Operação cancelada"
        fi
        ;;
    
    10)
        echo ""
        echo "📚 Abrindo documentação da API..."
        xdg-open http://localhost:8000/docs 2>/dev/null || echo "Abra manualmente: http://localhost:8000/docs"
        ;;
    
    11)
        echo ""
        echo "🎨 Abrindo frontend..."
        xdg-open http://localhost:5173 2>/dev/null || echo "Abra manualmente: http://localhost:5173"
        ;;
    
    12)
        echo ""
        echo "💻 Entrando no container do backend..."
        docker exec -it bingo_backend bash
        ;;
    
    13)
        echo ""
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        BACKUP_FILE="backup_bingo_${TIMESTAMP}.db"
        
        echo "💾 Fazendo backup do banco de dados..."
        docker cp bingo_backend:/app/data/bingo.db "$BACKUP_FILE"
        
        if [ -f "$BACKUP_FILE" ]; then
            SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
            echo ""
            echo "✅ Backup criado com sucesso!"
            echo "   Arquivo: $BACKUP_FILE"
            echo "   Tamanho: $SIZE"
        else
            echo "❌ Erro ao criar backup"
        fi
        ;;
    
    0)
        echo ""
        echo "👋 Até logo!"
        echo ""
        exit 0
        ;;
    
    *)
        echo ""
        echo "❌ Opção inválida"
        ;;
esac

echo ""
