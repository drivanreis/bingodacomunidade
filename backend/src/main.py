"""
FastAPI Application - Ponto de Entrada da API
============================================
API principal do Sistema de Bingo Comunitário.

Este é o concentrador de todas as operações do sistema.
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Dict
import logging

from src.db.base import get_db, verify_connection, init_db
from src.utils.time_manager import get_fortaleza_time, format_to_iso, FORTALEZA_TZ, generate_time_id
from src.schemas.schemas import (
    HealthCheckResponse,
    SignupRequest,
    LoginRequest,
    TokenResponse,
    UsuarioResponse,
    ParoquiaResponse
)
from src.models.models import Usuario, Paroquia, TipoUsuario
from src.utils.auth import hash_password, verify_password, create_access_token


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
    - **Super Admin**: Guardião da infraestrutura
    - **Parish Admin**: Operador da paróquia
    - **Fiel**: Participante do bingo
    """,
    version="1.0.0",
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
# EVENTOS DE INICIALIZAÇÃO
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """
    Executado quando a aplicação inicia.
    Verifica conexão com banco e inicializa estruturas.
    """
    import os
    from src.db.seed import seed_database, check_seed_needed
    
    logger.info("=" * 70)
    logger.info("🚀 INICIANDO SISTEMA DE BINGO COMUNITÁRIO")
    logger.info("=" * 70)
    
    # Verifica conexão com banco
    if verify_connection():
        logger.info("✓ Conexão com banco de dados estabelecida")
    else:
        logger.error("✗ Falha ao conectar no banco de dados")
        raise Exception("Não foi possível conectar ao banco de dados")
    
    # Inicializa banco (cria tabelas se não existirem)
    try:
        init_db()
        logger.info("✓ Estrutura do banco de dados criada")
    except Exception as e:
        logger.error(f"✗ Erro ao inicializar banco: {e}")
        raise
    
    # ========================================================================
    # SEED DE DADOS INICIAIS (se habilitado)
    # ========================================================================
    seed_enabled = os.getenv('SEED_ENABLED', 'false').lower() == 'true'
    
    if seed_enabled:
        logger.info("📦 Verificando necessidade de carga inicial de dados...")
        
        # Cria uma sessão temporária para o seed
        from src.db.base import SessionLocal
        db = SessionLocal()
        
        try:
            if check_seed_needed(db):
                logger.info("🌱 Executando seed do banco de dados...")
                seed_database(db)
            else:
                logger.info("✓ Dados iniciais já existem no banco")
        except Exception as e:
            logger.error(f"✗ Erro ao fazer seed do banco: {e}")
            raise
        finally:
            db.close()
    else:
        logger.info("ℹ️  Seed automático desabilitado (SEED_ENABLED=false)")
    
    # Log de configuração
    now = get_fortaleza_time()
    logger.info("=" * 70)
    logger.info("✅ SISTEMA INICIALIZADO COM SUCESSO")
    logger.info("=" * 70)
    logger.info(f"⏰ Timezone: {FORTALEZA_TZ}")
    logger.info(f"🕒 Horário atual em Fortaleza: {format_to_iso(now)}")
    logger.info(f"🌐 Documentação: http://localhost:8000/docs")
    logger.info(f"💚 Health Check: http://localhost:8000/health")
    logger.info("=" * 70)
    logger.info("🎱 API PRONTA PARA RECEBER REQUISIÇÕES!")
    logger.info("=" * 70)


@app.on_event("shutdown")
async def shutdown_event():
    """
    Executado quando a aplicação está sendo encerrada.
    """
    logger.info("🛑 Encerrando Sistema de Bingo Comunitário...")


# ============================================================================
# ROTAS - HEALTH CHECK
# ============================================================================

@app.get("/", response_model=HealthCheckResponse, tags=["Health"])
async def root() -> HealthCheckResponse:
    """
    Rota raiz - Health check básico.
    
    Retorna o status da API e o horário atual de Fortaleza.
    Use esta rota para verificar se o fuso horário está configurado corretamente.
    """
    now = get_fortaleza_time()
    
    return HealthCheckResponse(
        status="🎱 Sistema de Bingo Comunitário está ONLINE",
        timestamp_fortaleza=format_to_iso(now),
        timezone=str(FORTALEZA_TZ)
    )


@app.get("/health", response_model=Dict[str, str], tags=["Health"])
async def health_check(db: Session = Depends(get_db)) -> Dict[str, str]:
    """
    Health check completo.
    
    Verifica:
    - Status da API
    - Conexão com banco de dados
    - Horário atual de Fortaleza
    """
    now = get_fortaleza_time()
    
    # Testa query no banco
    try:
        db.execute("SELECT 1")
        db_status = "connected"
    except Exception as e:
        logger.error(f"Erro ao verificar banco: {e}")
        db_status = "disconnected"
        raise HTTPException(status_code=503, detail="Banco de dados indisponível")
    
    return {
        "status": "healthy",
        "api": "online",
        "database": db_status,
        "timezone": str(FORTALEZA_TZ),
        "timestamp_fortaleza": format_to_iso(now),
        "version": "1.0.0"
    }


@app.get("/ping", tags=["Health"])
async def ping() -> Dict[str, str]:
    """
    Ping simples para verificar se a API está respondendo.
    """
    return {"message": "pong"}


# ============================================================================
# ROTAS DE AUTENTICAÇÃO
# ============================================================================

@app.post(
    "/auth/signup",
    response_model=UsuarioResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Autenticação"],
    summary="Cadastro público de fiéis"
)
def signup(
    request: SignupRequest,
    db: Session = Depends(get_db)
):
    """
    ## 📝 Cadastro Público de Fiéis
    
    Permite que qualquer pessoa se cadastre como FIEL no sistema.
    
    ### Regras:
    - ✅ Cadastro aberto ao público
    - ✅ Role automático: FIEL
    - ✅ Vínculo automático à única paróquia do sistema
    - ✅ CPF único no sistema
    - ✅ WhatsApp único no sistema
    - ✅ Requer chave PIX para receber prêmios
    
    ### Campos Obrigatórios:
    - Nome completo
    - CPF (11 dígitos)
    - WhatsApp (+55DDNNNNNNNNN)
    - Chave PIX
    - Senha (mínimo 6 caracteres)
    """
    
    # Verificar se CPF já existe
    existing_user = db.query(Usuario).filter(Usuario.cpf == request.cpf).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CPF já cadastrado no sistema"
        )
    
    # Verificar se WhatsApp já existe
    existing_whatsapp = db.query(Usuario).filter(Usuario.whatsapp == request.whatsapp).first()
    if existing_whatsapp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="WhatsApp já cadastrado no sistema"
        )
    
    # Buscar a única paróquia do sistema
    paroquia = db.query(Paroquia).filter(Paroquia.ativa == True).first()
    if not paroquia:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Nenhuma paróquia ativa encontrada no sistema"
        )
    
    # Gerar ID temporal
    user_id = generate_time_id("USR")
    
    # Criar novo usuário
    novo_usuario = Usuario(
        id=user_id,
        nome=request.nome,
        cpf=request.cpf,
        whatsapp=request.whatsapp,
        chave_pix=request.chave_pix,
        senha_hash=hash_password(request.senha),
        tipo=TipoUsuario.FIEL,
        paroquia_id=paroquia.id,
        ativo=True
    )
    
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    
    logger.info(f"✅ Novo fiel cadastrado: {novo_usuario.nome} (CPF: {request.cpf})")
    
    return novo_usuario


@app.post(
    "/auth/login",
    response_model=TokenResponse,
    tags=["Autenticação"],
    summary="Autenticação de usuários"
)
def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    ## 🔐 Autenticação de Usuários
    
    Autentica um usuário usando CPF e senha.
    
    ### Retorna:
    - JWT token de acesso (válido por 7 dias)
    - Dados completos do usuário
    
    ### Uso do Token:
    Nas próximas requisições, envie o token no header:
    ```
    Authorization: Bearer <seu_token_aqui>
    ```
    """
    
    # Buscar usuário por CPF
    usuario = db.query(Usuario).filter(Usuario.cpf == request.cpf).first()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="CPF ou senha incorretos"
        )
    
    # Verificar senha
    if not verify_password(request.senha, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="CPF ou senha incorretos"
        )
    
    # Verificar se usuário está ativo
    if not usuario.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo. Entre em contato com o administrador."
        )
    
    # Atualizar último acesso
    usuario.ultimo_acesso = get_fortaleza_time()
    db.commit()
    
    # Gerar JWT token
    access_token = create_access_token(
        data={
            "sub": usuario.id,
            "cpf": usuario.cpf,
            "tipo": usuario.tipo.value,
            "paroquia_id": usuario.paroquia_id
        }
    )
    
    logger.info(f"✅ Login bem-sucedido: {usuario.nome} (CPF: {request.cpf})")
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        usuario=usuario
    )


# ============================================================================
# ROTAS DE PARÓQUIA
# ============================================================================

@app.get(
    "/paroquia/me",
    response_model=ParoquiaResponse,
    tags=["Paróquia"],
    summary="Dados da paróquia atual"
)
def get_paroquia_atual(db: Session = Depends(get_db)):
    """
    ## ⛪ Dados da Paróquia Atual
    
    Retorna os dados da única paróquia do sistema.
    
    ### Sistema Monolítico:
    Como este sistema é independente por paróquia (não multi-tenant),
    existe apenas UMA paróquia ativa no banco de dados.
    
    ### Retorna:
    - Dados completos da paróquia
    - Configurações de rateio (se houver sorteios)
    - Informações de contato
    - Chave PIX para recebimento
    """
    
    # Buscar a única paróquia ativa
    paroquia = db.query(Paroquia).filter(Paroquia.ativa == True).first()
    
    if not paroquia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nenhuma paróquia ativa encontrada no sistema"
        )
    
    return paroquia


# ============================================================================
# ROTAS FUTURAS
# ============================================================================

# TODO: Implementar CRUD de Paróquias (para Super Admin)
# TODO: Implementar CRUD de Usuários (gerenciar fiéis/admins)
# TODO: Implementar CRUD de Sorteios (criar bingos, configurar rateio)
# TODO: Implementar CRUD de Cartelas (comprar, validar)
# TODO: Implementar lógica de sorteio em tempo real
# TODO: Implementar WebSocket para atualizações em tempo real


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
