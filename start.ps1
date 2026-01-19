# ===========================================================================
# 🚀 START - Sistema de Bingo Comunitário (Versão Docker)
# ===========================================================================
# Script automatizado que inicia o sistema com validações
# Substitui completamente os antigos scripts .bat e .venv

param(
    [switch]$Rebuild,  # Força rebuild da imagem
    [switch]$Clean     # Limpa tudo e reinicia do zero
)

Write-Host ""
Write-Host "=" -ForegroundColor Cyan -NoNewline; Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host "    🎱 BINGO DA COMUNIDADE - Sistema Docker" -ForegroundColor Yellow
Write-Host "=" -ForegroundColor Cyan -NoNewline; Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host ""

# ===========================================================================
# 1. VERIFICAR DOCKER
# ===========================================================================

Write-Host "[1/6] 🐳 Verificando Docker..." -ForegroundColor Cyan

try {
    $dockerVersion = docker --version
    Write-Host "      ✅ Docker instalado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "      ❌ Docker não está instalado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "      📥 Baixe o Docker Desktop:" -ForegroundColor Yellow
    Write-Host "      https://docs.docker.com/desktop/install/windows-install/" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

# Verificar se Docker está rodando
try {
    docker ps | Out-Null
    Write-Host "      ✅ Docker está rodando" -ForegroundColor Green
} catch {
    Write-Host "      ❌ Docker não está rodando!" -ForegroundColor Red
    Write-Host ""
    Write-Host "      🔧 Solução:" -ForegroundColor Yellow
    Write-Host "      1. Abra o Docker Desktop" -ForegroundColor White
    Write-Host "      2. Aguarde aparecer 'Docker is running'" -ForegroundColor White
    Write-Host "      3. Execute este script novamente" -ForegroundColor White
    Write-Host ""
    
    # Tentar abrir Docker Desktop
    Write-Host "      🚀 Tentando abrir Docker Desktop..." -ForegroundColor Cyan
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -ErrorAction SilentlyContinue
    
    Write-Host "      ⏳ Aguardando Docker inicializar (30 segundos)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    # Tentar novamente
    try {
        docker ps | Out-Null
        Write-Host "      ✅ Docker iniciado com sucesso!" -ForegroundColor Green
    } catch {
        Write-Host "      ❌ Docker ainda não está pronto. Execute novamente mais tarde." -ForegroundColor Red
        exit 1
    }
}

# ===========================================================================
# 2. VERIFICAR DOCKER COMPOSE
# ===========================================================================

Write-Host "[2/6] 📦 Verificando Docker Compose..." -ForegroundColor Cyan

try {
    $composeVersion = docker-compose --version
    Write-Host "      ✅ Docker Compose instalado: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "      ❌ Docker Compose não encontrado!" -ForegroundColor Red
    Write-Host "      (Geralmente vem junto com Docker Desktop)" -ForegroundColor Yellow
    exit 1
}

# ===========================================================================
# 3. LIMPAR SE NECESSÁRIO
# ===========================================================================

if ($Clean) {
    Write-Host "[3/6] 🧹 Limpando sistema..." -ForegroundColor Cyan
    
    Write-Host "      🛑 Parando containers..." -ForegroundColor Yellow
    docker-compose down -v 2>$null
    
    Write-Host "      🗑️  Removendo banco de dados..." -ForegroundColor Yellow
    if (Test-Path "backend\data\bingo.db") {
        Remove-Item "backend\data\bingo.db" -Force
        Write-Host "      ✅ Banco removido" -ForegroundColor Green
    } else {
        Write-Host "      ℹ️  Banco não existia" -ForegroundColor Gray
    }
    
    Write-Host "      🧹 Limpeza concluída!" -ForegroundColor Green
} else {
    Write-Host "[3/6] ℹ️  Modo normal (sem limpeza)" -ForegroundColor Gray
    Write-Host "      Dica: Use -Clean para resetar tudo" -ForegroundColor Gray
}

# ===========================================================================
# 4. VERIFICAR PORTA 8000
# ===========================================================================

Write-Host "[4/6] 🔍 Verificando porta 8000..." -ForegroundColor Cyan

$portInUse = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue

if ($portInUse) {
    Write-Host "      ⚠️  Porta 8000 já está em uso!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "      🔧 Opções:" -ForegroundColor Yellow
    Write-Host "      1. Parar o processo atual: docker-compose down" -ForegroundColor White
    Write-Host "      2. Usar outra porta no docker-compose.yml" -ForegroundColor White
    Write-Host ""
    
    $response = Read-Host "      Deseja parar o container atual? (S/N)"
    
    if ($response -eq "S" -or $response -eq "s") {
        Write-Host "      🛑 Parando containers..." -ForegroundColor Cyan
        docker-compose down
        Start-Sleep -Seconds 3
        Write-Host "      ✅ Container parado" -ForegroundColor Green
    } else {
        Write-Host "      ❌ Cancelado pelo usuário" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "      ✅ Porta 8000 está livre" -ForegroundColor Green
}

# ===========================================================================
# 5. INICIAR SISTEMA
# ===========================================================================

Write-Host "[5/6] 🚀 Iniciando sistema..." -ForegroundColor Cyan

if ($Rebuild) {
    Write-Host "      🔨 Rebuild forçado (pode demorar)..." -ForegroundColor Yellow
    docker-compose up -d --build
} else {
    docker-compose up -d
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "      ❌ Erro ao iniciar o sistema!" -ForegroundColor Red
    Write-Host ""
    Write-Host "      📋 Veja os logs:" -ForegroundColor Yellow
    Write-Host "      docker-compose logs backend" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host "      ✅ Containers iniciados!" -ForegroundColor Green

# ===========================================================================
# 6. AGUARDAR E VALIDAR
# ===========================================================================

Write-Host "[6/6] ⏳ Aguardando sistema inicializar..." -ForegroundColor Cyan

$maxAttempts = 20
$attempt = 0
$isReady = $false

while ($attempt -lt $maxAttempts -and -not $isReady) {
    $attempt++
    Start-Sleep -Seconds 2
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8000/ping" -Method Get -TimeoutSec 2
        if ($response.message -eq "pong") {
            $isReady = $true
        }
    } catch {
        Write-Host "      ⏳ Tentativa $attempt/$maxAttempts..." -ForegroundColor Gray
    }
}

Write-Host ""

if ($isReady) {
    Write-Host "=" -ForegroundColor Green -NoNewline; Write-Host ("=" * 69) -ForegroundColor Green
    Write-Host "    ✅ SISTEMA PRONTO E FUNCIONANDO!" -ForegroundColor Green
    Write-Host "=" -ForegroundColor Green -NoNewline; Write-Host ("=" * 69) -ForegroundColor Green
    Write-Host ""
    
    Write-Host "🌐 ACESSE:" -ForegroundColor Yellow
    Write-Host "   📖 Documentação: " -NoNewline; Write-Host "http://localhost:8000/docs" -ForegroundColor Cyan
    Write-Host "   💚 Health Check:  " -NoNewline; Write-Host "http://localhost:8000/health" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "👤 CREDENCIAIS PADRÃO:" -ForegroundColor Yellow
    Write-Host "   Super Admin:" -ForegroundColor White
    Write-Host "   • Email: admin@bingodacomunidade.com.br" -ForegroundColor Gray
    Write-Host "   • Senha: Admin@2026" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "📊 COMANDOS ÚTEIS:" -ForegroundColor Yellow
    Write-Host "   Ver logs:      " -NoNewline; Write-Host "docker-compose logs -f backend" -ForegroundColor Cyan
    Write-Host "   Parar:         " -NoNewline; Write-Host "docker-compose down" -ForegroundColor Cyan
    Write-Host "   Reiniciar:     " -NoNewline; Write-Host "docker-compose restart" -ForegroundColor Cyan
    Write-Host "   Testar:        " -NoNewline; Write-Host ".\test_system.ps1" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "=" -ForegroundColor Green -NoNewline; Write-Host ("=" * 69) -ForegroundColor Green
    
    # Abrir navegador automaticamente
    Write-Host ""
    $openBrowser = Read-Host "Deseja abrir a documentação no navegador? (S/N)"
    
    if ($openBrowser -eq "S" -or $openBrowser -eq "s") {
        Start-Process "http://localhost:8000/docs"
        Write-Host "✅ Navegador aberto!" -ForegroundColor Green
    }
    
} else {
    Write-Host "=" -ForegroundColor Red -NoNewline; Write-Host ("=" * 69) -ForegroundColor Red
    Write-Host "    ❌ SISTEMA NÃO RESPONDEU A TEMPO" -ForegroundColor Red
    Write-Host "=" -ForegroundColor Red -NoNewline; Write-Host ("=" * 69) -ForegroundColor Red
    Write-Host ""
    
    Write-Host "🔍 DIAGNÓSTICO:" -ForegroundColor Yellow
    Write-Host "   1. Veja os logs: " -NoNewline; Write-Host "docker-compose logs backend" -ForegroundColor Cyan
    Write-Host "   2. Verifique containers: " -NoNewline; Write-Host "docker-compose ps" -ForegroundColor Cyan
    Write-Host "   3. Reinicie: " -NoNewline; Write-Host ".\start.ps1 -Rebuild" -ForegroundColor Cyan
    Write-Host ""
    
    exit 1
}
