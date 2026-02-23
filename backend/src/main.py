"""
FastAPI Application - Ponto de Entrada da API
============================================
API principal do Sistema de Bingo Comunitário.

Este é o concentrador de todas as operações do sistema.
Todos os endpoints estão nos routers. Main.py apenas:
- Configura middlewares e exceptions
- Inicializa banco de dados
- Inclui routers
"""

from fastapi import FastAPI, Request, status, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
import traceback
import logging
from typing import Dict

from src.db.base import get_db, verify_connection, init_db, SessionLocal
from src.db.seed import seed_database, registrar_auditoria_sistema
from src.schemas.schemas import HealthCheckResponse
from src.utils.time_manager import get_fortaleza_time

# Importar routers
from src.routers.auth_routes import router as auth_router
from src.routers.admin_routes import router as admin_router

# ============================================================================
# CONFIGURAÇÃO DE LOGGING
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============================================================================
# INSTÂNCIA FASTAPI
# ============================================================================

app = FastAPI(
    title="Bingo da Comunidade - API",
    description="""
    ## 🎱 Sistema de Bingo Comunitário
    
    Uma plataforma digital de bingo transparente para paróquias e igrejas.
    
    ### Características Principais:
    - 🕒 **IDs Temporais**: Todos os registros usam timestamps de Fortaleza-CE
    - 💰 **Rateio Dinâmico**: Divisão automática em 4 partes configuráveis
    - 🔐 **Transparência Total**: Todos os dados auditáveis
    - ⛪ **Multi-Paróquia**: Sistema centralizado para múltiplas igrejas
    
    ### Hierarquia de Usuários:
    - **Admin-Site**: Guardião da infraestrutura
    - **Admin-Paroquia**: Operador da paróquia
    - **FIEL**: Participante do bingo
    """,
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


# ============================================================================
# MIDDLEWARE CORS - LIBERADO PARA TESTES
# ============================================================================
# ⚠️ ATENÇÃO: Em produção, substituir "*" por domínios específicos!

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Libera todas as origens (apenas para desenvolvimento!)
    allow_credentials=True,
    allow_methods=["*"],  # Libera todos os métodos (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Libera todos os headers
    expose_headers=["*"],  # Expõe todos os headers na resposta
)


# ============================================================================
# TRATAMENTO GLOBAL DE ERROS (EXCEPTION HANDLERS)
# ============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Captura qualquer erro 500 não tratado e retorna uma resposta JSON amigável.
    """
    error_msg = str(exc)
    error_trace = traceback.format_exc()
    
    # Log detalhado no servidor
    logger.error(f"FATAL ERROR 500 em {request.url.path}: {error_msg}")
    logger.error(error_trace)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Erro interno do servidor. O administrador foi notificado.",
            "type": "INTERNAL_ERROR",
            # Mensagem técnica apenas incluída porque estamos em ambiente de testes/homologação
            "debug_error": error_msg 
        }
    )


# ============================================================================
# EVENTOS DE INICIALIZAÇÃO
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """
    Executado quando a aplicação inicia.
    
    Responsabilidades:
    - Verificar conexão com banco de dados
    - Criar tabelas se não existirem (init_db)
    - Logs de inicialização
    """
    logger.info("=" * 70)
    logger.info("🚀 INICIANDO SERVIDOR - BINGO DA COMUNIDADE")
    logger.info("=" * 70)
    
    try:
        # Verificar conexão com banco
        is_connected = verify_connection()
        
        if is_connected:
            logger.info("✅ Banco de dados conectado com sucesso")
        else:
            logger.warning("⚠️ Falha ao conectar com banco de dados")
            return
        
        # Inicializar banco (criar tabelas)
        init_db()
        logger.info("✅ Schema de banco de dados inicializado")

        # Executar seed bootstrap (Admin/admin123 + paróquia) se necessário
        db = SessionLocal()
        try:
            seed_database(db)
            registrar_auditoria_sistema(db)
        finally:
            db.close()
        
        logger.info("=" * 70)
        logger.info("✅ SERVIDOR INICIADO COM SUCESSO")
        logger.info("📍 Acesse a API em: http://localhost:8000")
        logger.info("📖 Documentação em: http://localhost:8000/docs")
        logger.info("=" * 70)
        
    except Exception as e:
        logger.error(f"❌ ERRO CRÍTICO ao iniciar servidor: {str(e)}")
        logger.error(traceback.format_exc())
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Executado quando a aplicação desliga."""
    logger.info("=" * 70)
    logger.info("🛑 DESLIGANDO SERVIDOR - BINGO DA COMUNIDADE")
    logger.info("=" * 70)


# ============================================================================
# ROUTERS
# ============================================================================

# Incluir router de autenticação (novo sistema com UsuarioComum + UsuarioAdministrativo)
app.include_router(auth_router)
app.include_router(admin_router)


# ============================================================================
# HEALTH CHECKS
# ============================================================================

@app.get("/", response_model=HealthCheckResponse, tags=["Health"])
async def root() -> HealthCheckResponse:
    """
    Verificação de status da API.
    
    Endpoint raiz que retorna informações básicas de saúde da API.
    """
    agora = get_fortaleza_time()
    return HealthCheckResponse(
        status="healthy",
        timestamp_fortaleza=agora.isoformat(),
        timezone="America/Fortaleza",
    )


@app.get("/health", response_model=Dict[str, str], tags=["Health"])
async def health_check(db: Session = Depends(get_db)) -> Dict[str, str]:
    """
    Verificação detalhada de saúde (com banco de dados).
    
    Valida conexão com banco de dados e retorna status completo.
    """
    try:
        # Testar conexão com banco
        result = db.execute(text("SELECT 1"))
        
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": get_fortaleza_time().isoformat()
        }
    except Exception as e:
        logger.error(f"❌ Health check falhou: {str(e)}")
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }


@app.get("/ping", tags=["Health"])
async def ping() -> Dict[str, str]:
    """
    Ping simples para verificar se a API está respondendo.
    """
    return {"message": "pong"}


# ============================================================================
# PONTO DE ENTRADA
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    # Configuração para desenvolvimento
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,           # Auto-reload em desenvolvimento
        log_level="info",
    )
