# ===========================================================================
# Script de Teste - Sistema de Bingo Comunitário
# ===========================================================================
# Valida que o sistema está funcionando corretamente após docker-compose up

Write-Host "=" -ForegroundColor Cyan -NoNewline; Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host "  🧪 TESTE AUTOMÁTICO - SISTEMA DE BINGO COMUNITÁRIO" -ForegroundColor Yellow
Write-Host "=" -ForegroundColor Cyan -NoNewline; Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host ""

# Aguardar sistema inicializar
Write-Host "[1/5] ⏳ Aguardando sistema inicializar (10 segundos)..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Teste 1: Ping
Write-Host "[2/5] 🏓 Testando endpoint /ping..." -ForegroundColor Cyan
try {
    $ping = Invoke-RestMethod -Uri "http://localhost:8000/ping" -Method Get
    if ($ping.message -eq "pong") {
        Write-Host "      ✅ SUCESSO: API está respondendo!" -ForegroundColor Green
    } else {
        Write-Host "      ❌ FALHA: Resposta inesperada" -ForegroundColor Red
    }
} catch {
    Write-Host "      ❌ FALHA: Não foi possível conectar à API" -ForegroundColor Red
    Write-Host "      Verifique se executou: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

# Teste 2: Health Check
Write-Host "[3/5] 💚 Testando endpoint /health..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get
    
    if ($health.status -eq "healthy" -and $health.database -eq "connected") {
        Write-Host "      ✅ SUCESSO: Sistema saudável e banco conectado!" -ForegroundColor Green
        Write-Host "      📍 Timezone: $($health.timezone)" -ForegroundColor Gray
        Write-Host "      🕒 Horário Fortaleza: $($health.timestamp_fortaleza)" -ForegroundColor Gray
    } else {
        Write-Host "      ⚠️  AVISO: Sistema respondeu mas há problemas" -ForegroundColor Yellow
    }
} catch {
    Write-Host "      ❌ FALHA: Health check falhou" -ForegroundColor Red
}

# Teste 3: Root
Write-Host "[4/5] 🏠 Testando endpoint raiz /..." -ForegroundColor Cyan
try {
    $root = Invoke-RestMethod -Uri "http://localhost:8000/" -Method Get
    
    if ($root.status -match "ONLINE") {
        Write-Host "      ✅ SUCESSO: Sistema está ONLINE!" -ForegroundColor Green
    }
} catch {
    Write-Host "      ❌ FALHA: Endpoint raiz não respondeu" -ForegroundColor Red
}

# Teste 4: Documentação
Write-Host "[5/5] 📖 Verificando documentação..." -ForegroundColor Cyan
try {
    $docs = Invoke-WebRequest -Uri "http://localhost:8000/docs" -Method Get -UseBasicParsing
    
    if ($docs.StatusCode -eq 200) {
        Write-Host "      ✅ SUCESSO: Documentação acessível!" -ForegroundColor Green
    }
} catch {
    Write-Host "      ❌ FALHA: Documentação não acessível" -ForegroundColor Red
}

Write-Host ""
Write-Host "=" -ForegroundColor Cyan -NoNewline; Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host "  ✅ TESTES CONCLUÍDOS!" -ForegroundColor Green
Write-Host "=" -ForegroundColor Cyan -NoNewline; Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Acesse a documentação interativa:" -ForegroundColor Yellow
Write-Host "   http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "👤 CREDENCIAIS PADRÃO:" -ForegroundColor Yellow
Write-Host "   Super Admin:" -ForegroundColor White
Write-Host "   - Email: admin@bingodacomunidade.com.br" -ForegroundColor Gray
Write-Host "   - Senha: Admin@2026" -ForegroundColor Gray
Write-Host ""
Write-Host "   Parish Admin:" -ForegroundColor White
Write-Host "   - Email: admin@paroquiasaojose.com.br" -ForegroundColor Gray
Write-Host "   - Senha: Admin@2026" -ForegroundColor Gray
Write-Host ""
Write-Host "   Fiel (Exemplo):" -ForegroundColor White
Write-Host "   - Email: joao.exemplo@email.com" -ForegroundColor Gray
Write-Host "   - Senha: Fiel@123" -ForegroundColor Gray
Write-Host ""
Write-Host "=" -ForegroundColor Cyan -NoNewline; Write-Host ("=" * 69) -ForegroundColor Cyan
