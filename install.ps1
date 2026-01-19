# ===========================================================================
# Script de Instalação - Sistema Bingo da Comunidade
# ===========================================================================
# Prepara o ambiente para primeira execução com Docker Compose
# Uso: .\install.ps1

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║    INSTALAÇÃO - Sistema de Bingo da Comunidade                 ║" -ForegroundColor Cyan
Write-Host "║    Preparando ambiente Docker...                               ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar se Docker está instalado
Write-Host "[1/5] Verificando Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker encontrado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker não encontrado!" -ForegroundColor Red
    Write-Host "  Instale Docker Desktop em: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Verificar se Docker Compose está disponível
Write-Host "[2/5] Verificando Docker Compose..." -ForegroundColor Yellow
try {
    $composeVersion = docker compose version
    Write-Host "✓ Docker Compose encontrado: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker Compose não encontrado!" -ForegroundColor Red
    exit 1
}

# Instalar dependências do Frontend
Write-Host "[3/5] Instalando dependências do Frontend (npm install)..." -ForegroundColor Yellow
Set-Location frontend
try {
    npm install
    Write-Host "✓ Dependências do frontend instaladas com sucesso" -ForegroundColor Green
} catch {
    Write-Host "✗ Erro ao instalar dependências!" -ForegroundColor Red
    Write-Host "  Certifique-se de ter Node.js instalado: https://nodejs.org/" -ForegroundColor Yellow
    Set-Location ..
    exit 1
}
Set-Location ..

# Criar arquivo .env para o frontend
Write-Host "[4/5] Criando arquivo de configuração (.env)..." -ForegroundColor Yellow
if (Test-Path "frontend\.env") {
    Write-Host "  Arquivo .env já existe, mantendo configuração atual" -ForegroundColor Yellow
} else {
    Copy-Item "frontend\.env.example" "frontend\.env"
    Write-Host "✓ Arquivo .env criado a partir do .env.example" -ForegroundColor Green
}

# Criar diretório de dados do backend (se não existir)
Write-Host "[5/5] Preparando diretório de dados..." -ForegroundColor Yellow
if (-not (Test-Path "backend\data")) {
    New-Item -Path "backend\data" -ItemType Directory -Force | Out-Null
    Write-Host "✓ Diretório backend/data criado" -ForegroundColor Green
} else {
    Write-Host "  Diretório backend/data já existe" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║    ✓ INSTALAÇÃO CONCLUÍDA COM SUCESSO!                         ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Para iniciar o sistema:" -ForegroundColor Cyan
Write-Host "  docker compose up --build" -ForegroundColor White
Write-Host ""
Write-Host "Após iniciar, acesse:" -ForegroundColor Cyan
Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "  Backend:   http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs:  http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Credenciais padrão (MUDE EM PRODUÇÃO!):" -ForegroundColor Yellow
Write-Host "  Email: admin@bingodacomunidade.com.br" -ForegroundColor White
Write-Host "  Senha: Admin@2026" -ForegroundColor White
Write-Host ""
