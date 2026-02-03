"""
FastAPI Application - Ponto de Entrada da API
============================================
API principal do Sistema de Bingo Comunitário.

Este é o concentrador de todas as operações do sistema.
"""

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
import traceback
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict
from datetime import timedelta
import logging

from src.db.base import get_db, verify_connection, init_db
from src.utils.time_manager import get_fortaleza_time, format_to_iso, FORTALEZA_TZ, generate_temporal_id_with_microseconds
from src.schemas.schemas import (
    HealthCheckResponse,
    SignupRequest,
    LoginRequest,
    TokenResponse,
    UsuarioResponse,
    ParoquiaResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    VerifyEmailRequest,
    MessageResponse,
    UpdateProfileRequest,
    FirstAccessSetupRequest,
    FirstAccessResponse
)
from src.models.models import Usuario, UsuarioLegado, Paroquia, TipoUsuario, UsuarioComum, UsuarioAdministrativo
from src.utils.auth import (
    hash_password,
    verify_password,
    create_access_token,
    generate_recovery_token,
    get_recovery_token_expiration,
    generate_email_verification_token,
    get_email_verification_token_expiration
)
from src.utils.email_service import email_service

# Importar routers
from src.routers.auth_routes import router as auth_router
from src.routers.user_management import router as user_management_router
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
# INCLUIR ROUTERS
# ============================================================================

app.include_router(auth_router)
app.include_router(user_management_router)
app.include_router(admin_router)


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
    # SISTEMA DE BOOTSTRAP - CRIAÇÃO DE USUÁRIO TEMPORÁRIO
    # ========================================================================
    # Sistema SEMPRE verifica se precisa criar usuário bootstrap (Admin/admin123)
    # Este usuário é temporário e será deletado após criar o primeiro SUPER_ADMIN
    
    logger.info("🔧 Verificando necessidade de bootstrap...")
    
    # Cria uma sessão temporária para o seed
    from src.db.base import SessionLocal
    db = SessionLocal()
    
    try:
        if check_seed_needed(db):
            logger.info("🌱 Criando usuário bootstrap (Admin/admin123)...")
            seed_database(db)
        else:
            logger.info("✓ Sistema já possui usuários - Bootstrap não necessário")
    except Exception as e:
        logger.error(f"✗ Erro ao criar bootstrap: {e}")
        raise
    finally:
        db.close()
    
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
        db.execute(text("SELECT 1"))
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

@app.get(
    "/auth/first-access",
    response_model=FirstAccessResponse,
    tags=["Autenticação"],
    summary="Verifica se precisa configurar primeiro acesso"
)
def check_first_access(db: Session = Depends(get_db)):
    """
    ## 🔐 Verificação de Primeiro Acesso
    
    Verifica se o sistema precisa ser configurado pela primeira vez.
    
    ### Lógica:
    - ✅ Se NÃO existe nenhum Super Admin → `needs_setup: true`
    - ✅ Se existe pelo menos um Super Admin → `needs_setup: false`
    
    ### Uso:
    - Frontend chama esta rota ao carregar o app
    - Se `needs_setup: true`, mostra tela de primeiro acesso
    - Se `needs_setup: false`, mostra tela de login normal
    
    ### Segurança:
    - Rota pública (sem autenticação)
    - Apenas consulta (sem efeitos colaterais)
    """
    
    # Contar quantos Super Admins existem
    super_admin_count = db.query(Usuario).filter(
        Usuario.tipo == TipoUsuario.SUPER_ADMIN
    ).count()
    
    if super_admin_count == 0:
        return FirstAccessResponse(
            needs_setup=True,
            message="Sistema precisa ser configurado. Crie sua conta de desenvolvedor."
        )
    else:
        return FirstAccessResponse(
            needs_setup=False,
            message="Sistema já configurado. Use a tela de login."
        )


@app.post(
    "/auth/first-access-setup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Autenticação"],
    summary="Configura primeiro acesso (cria Desenvolvedor)"
)
def setup_first_access(
    request: FirstAccessSetupRequest,
    db: Session = Depends(get_db)
):
    """
    ## 👨‍💻 Configuração do Primeiro Acesso
    
    Cria o primeiro usuário Desenvolvedor do sistema.
    
    ### ⚠️ IMPORTANTE - Segurança Crítica:
    - ✅ Só funciona se NÃO existe nenhum Super Admin
    - ✅ Após criar o primeiro admin, esta rota se torna inoperante
    - ✅ Validação de senha forte obrigatória
    - ✅ CPF único no sistema
    
    ### Campos Obrigatórios:
    - Nome completo
    - CPF (usado para login)
    - Email
    - WhatsApp (+55DDNNNNNNNNN)
    - Senha forte (min 6 caracteres, maiúscula, minúscula, número, especial)
    
    ### Retorna:
    - JWT token de acesso (login automático)
    - Dados do desenvolvedor criado
    
    ### Esta Tela Aparece Apenas Uma Vez:
    - Na primeira vez que o sistema é iniciado
    - Quando o banco de dados está vazio
    - Nunca mais aparece após criar o primeiro admin
    """
    
    # 🔒 PROTEÇÃO CRÍTICA: Verificar se já existe Super Admin
    super_admin_count = db.query(Usuario).filter(
        Usuario.tipo == TipoUsuario.SUPER_ADMIN
    ).count()
    
    if super_admin_count > 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sistema já foi configurado. Use a tela de login."
        )
    
    # Verificar se CPF já existe (proteção adicional)
    existing_user = db.query(Usuario).filter(Usuario.cpf == request.cpf).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CPF já cadastrado no sistema"
        )
    
    # Gerar ID temporal
    user_id = generate_temporal_id_with_microseconds("USR")
    
    # Criar primeiro Desenvolvedor
    desenvolvedor = Usuario(
        id=user_id,
        nome=request.nome,
        email=request.email,
        cpf=request.cpf,
        whatsapp=request.whatsapp,
        senha_hash=hash_password(request.senha),
        tipo=TipoUsuario.SUPER_ADMIN,
        paroquia_id=None,  # Super Admin não pertence a nenhuma paróquia
        ativo=True,
        email_verificado=True,  # ✅ Primeiro admin já vem verificado
        chave_pix=None  # Desenvolvedor não recebe prêmios
    )
    
    db.add(desenvolvedor)
    db.commit()
    db.refresh(desenvolvedor)
    
    logger.info("=" * 70)
    logger.info("🎉 PRIMEIRO ACESSO CONFIGURADO COM SUCESSO!")
    logger.info(f"👨‍💻 Desenvolvedor criado: {desenvolvedor.nome}")
    logger.info(f"📧 Email: {desenvolvedor.email}")
    logger.info(f"📱 WhatsApp: {desenvolvedor.whatsapp}")
    logger.info("=" * 70)
    
    # Gerar JWT token para login automático
    access_token = create_access_token(
        data={
            "sub": desenvolvedor.id,
            "cpf": desenvolvedor.cpf,
            "tipo": desenvolvedor.tipo.value,
            "paroquia_id": None
        }
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        usuario=UsuarioResponse.model_validate(desenvolvedor)
    )


@app.post(
    "/auth/signup",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Autenticação"],
    summary="Cadastro público com verificação de email"
)
async def signup(
    request: SignupRequest,
    db: Session = Depends(get_db)
):
    """
    ## 📝 Cadastro Público de Fiéis (Com Verificação de Email)
    
    Permite que qualquer pessoa se cadastre como FIEL no sistema.
    
    ### NOVO: Verificação de Email Obrigatória
    - ✅ Usuário se cadastra
    - ✅ Email de verificação é enviado
    - ✅ Usuário clica no link do email
    - ✅ Somente após verificar pode fazer login
    - ⏰ Link expira em 24 horas
    
    ### Regras:
    - ✅ Cadastro aberto ao público
    - ✅ Email deve ser verificado antes de fazer login
    - ✅ Role automático: FIEL
    - ✅ Vínculo automático à única paróquia do sistema
    - ✅ CPF único no sistema
    - ✅ WhatsApp único no sistema
    - ✅ Email único e verificado
    - ✅ Requer chave PIX para receber prêmios
    
    ### Campos Obrigatórios:
    - Nome completo
    - Email (será verificado)
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
    
    # Verificar se Email já existe
    existing_email = db.query(Usuario).filter(Usuario.email == request.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado no sistema"
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
    user_id = generate_temporal_id_with_microseconds("USR")
    
    # Gerar token de verificação de email
    token_verificacao = generate_email_verification_token()
    token_expiracao = get_email_verification_token_expiration()
    
    # Criar novo usuário (não verificado por padrão)
    novo_usuario = Usuario(
        id=user_id,
        nome=request.nome,
        email=request.email,
        cpf=request.cpf,
        whatsapp=request.whatsapp,
        chave_pix=request.chave_pix,
        senha_hash=hash_password(request.senha),
        tipo=TipoUsuario.FIEL,
        paroquia_id=paroquia.id,
        ativo=True,
        email_verificado=False,  # ⚠️ Email não verificado ainda
        token_verificacao_email=token_verificacao,
        token_verificacao_expiracao=token_expiracao
    )
    
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    
    # Enviar email de verificação
    email_enviado = await email_service.send_email_verification(
        to_email=novo_usuario.email,
        user_name=novo_usuario.nome,
        verification_token=token_verificacao
    )
    
    if email_enviado:
        logger.info(f"✅ Novo fiel cadastrado (aguardando verificação): {novo_usuario.nome} (CPF: {request.cpf})")
        logger.info(f"📧 Email de verificação enviado para: {novo_usuario.email}")
    else:
        logger.error(f"❌ Falha ao enviar email de verificação para: {novo_usuario.email}")
    
    return MessageResponse(
        message="✅ Cadastro realizado com sucesso! Verifique seu email para ativar sua conta."
    )


# ============================================================================
# ENDPOINT DE LOGIN ANTIGO - COMENTADO (MOVIDO PARA auth_routes.py)
# ============================================================================
# O sistema agora usa 3 rotas de login separadas em src/routers/auth_routes.py


"""
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
# Endpoint removido - ver auth_routes.py


@app.post(
    "/auth/forgot-password",
    response_model=MessageResponse,
    tags=["Autenticação"],
    summary="Solicitar recuperação de senha"
)
async def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    ## 🔑 Solicitar Recuperação de Senha
    
    Gera um token de recuperação e envia por email.
    
    **SEGURANÇA:**
    - Token válido por 30 minutos
    - Mensagens transparentes (informa se CPF não existe)
    - Link único: http://localhost:5173/reset-password?token=ABC123
    
    ### Fluxo Transparente:
    1. Usuário informa seu CPF
    2. Sistema valida se CPF existe e tem email cadastrado
    3. Se não existir: retorna erro 404 "CPF não cadastrado"
    4. Se conta banida: retorna erro 403 "Conta desativada"
    5. Se sem email: retorna erro 400 "Sem email cadastrado"
    6. Se OK: Gera token único válido por 30 minutos
    7. Envia email com link de recuperação
    8. Retorna sucesso com email parcialmente oculto
    """
    
    # Buscar usuário por CPF
    usuario = db.query(Usuario).filter(Usuario.cpf == request.cpf).first()
    
    # Validação 1: CPF não existe
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CPF não cadastrado no sistema. Verifique se digitou corretamente ou cadastre-se."
        )
    
    # Validação 2: Usuário está banido/inativo
    if not usuario.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta desativada. Entre em contato com o administrador da paróquia."
        )
    
    # Validação 3: Usuário não tem email cadastrado
    if not usuario.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seu cadastro não possui email. Entre em contato com o administrador para atualizar."
        )
    
    # Gerar token de recuperação
    token = generate_recovery_token()
    expiracao = get_recovery_token_expiration()
    
    # Salvar token no banco
    usuario.token_recuperacao = token
    usuario.token_expiracao = expiracao
    db.commit()
    
    logger.info(f"🔑 Token de recuperação gerado para: {usuario.nome} (CPF: {request.cpf})")
    
    # Enviar email com link de recuperação
    email_sent = await email_service.send_password_reset_email(
        to_email=usuario.email,
        user_name=usuario.nome,
        reset_token=token
    )
    
    if email_sent:
        logger.info(f"📧 Email de recuperação enviado para: {usuario.email}")
        return MessageResponse(
            message=f"✅ Link de recuperação enviado para {usuario.email[:3]}***@{usuario.email.split('@')[1]}. Verifique sua caixa de entrada e spam."
        )
    else:
        logger.error(f"❌ Falha ao enviar email para: {usuario.email}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao enviar email. Tente novamente mais tarde ou entre em contato com o suporte."
        )


@app.post(
    "/auth/reset-password",
    response_model=MessageResponse,
    tags=["Autenticação"],
    summary="Redefinir senha com token"
)
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    ## 🔐 Redefinir Senha com Token
    
    Redefine a senha do usuário usando o token de recuperação.
    
    ### Validações:
    - Token deve existir no banco
    - Token não pode estar expirado (máximo 30 minutos)
    - Nova senha deve atender aos requisitos de segurança
    
    ### Após redefinição:
    - Token é removido do banco (uso único)
    - Usuário pode fazer login com a nova senha
    """
    
    # Buscar usuário pelo token
    usuario = db.query(Usuario).filter(
        Usuario.token_recuperacao == request.token
    ).first()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido ou expirado"
        )
    
    # Verificar se token expirou
    if not usuario.token_expiracao or get_fortaleza_time() > usuario.token_expiracao:
        # Limpar token expirado
        usuario.token_recuperacao = None
        usuario.token_expiracao = None
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token expirado. Solicite um novo token de recuperação."
        )
    
    # Atualizar senha
    usuario.senha_hash = hash_password(request.nova_senha)
    
    # Limpar token (token de uso único)
    usuario.token_recuperacao = None
    usuario.token_expiracao = None
    
    db.commit()
    
    logger.info(f"✅ Senha redefinida com sucesso para: {usuario.nome} (CPF: {usuario.cpf})")
    
    return MessageResponse(
        message="Senha redefinida com sucesso! Você já pode fazer login com sua nova senha."
    )


@app.get(
    "/auth/verify-email",
    response_model=MessageResponse,
    tags=["Autenticação"],
    summary="Verificar email do usuário"
)
def verify_email(
    token: str,
    db: Session = Depends(get_db)
):
    """
    ## ✅ Verificar Email
    
    Valida o token enviado por email e ativa a conta do usuário.
    
    ### Validações:
    - Token deve existir
    - Token não pode estar expirado (24h)
    
    ### Ações:
    - Marca email como verificado
    - Limpa o token de verificação
    """
    # Buscar usuário pelo token
    usuario = db.query(Usuario).filter(
        Usuario.token_verificacao_email == token
    ).first()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token de verificação inválido ou não encontrado."
        )
        
    # Verificar expiração
    if not usuario.token_verificacao_expiracao or get_fortaleza_time() > usuario.token_verificacao_expiracao:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Link de verificação expirado. Solicite um novo email de verificação."
        )
        
    # Ativar email
    usuario.email_verificado = True
    usuario.token_verificacao_email = None
    usuario.token_verificacao_expiracao = None
    
    db.commit()
    
    logger.info(f"✅ Email verificado com sucesso para: {usuario.nome} (CPF: {usuario.cpf})")
    
    return MessageResponse(
        message="Email verificado com sucesso! Sua conta está ativa."
    )



@app.put(
    "/auth/profile/{cpf}",
    response_model=UsuarioResponse,
    tags=["Autenticação"],
    summary="Atualizar perfil do usuário"
)
def update_profile(
    cpf: str,
    request: UpdateProfileRequest,
    db: Session = Depends(get_db)
):
    """
    ## ✏️ Atualizar Perfil do Usuário
    
    Permite que o usuário atualize suas informações pessoais.
    
    ### O que pode ser alterado:
    - ✅ Nome completo
    - ✅ WhatsApp
    - ✅ Chave PIX
    - ✅ Senha (requer senha atual)
    - ❌ CPF (NUNCA pode ser alterado - é a identidade única)
    
    ### Validações:
    - Nome: mínimo 3 caracteres
    - WhatsApp: formato +55DDNNNNNNNNN e único no sistema
    - Senha: 6-16 caracteres, maiúscula, minúscula, número, especial
    - Para trocar senha: deve informar senha atual correta
    """
    
    # Buscar usuário pelo CPF
    usuario = db.query(Usuario).filter(Usuario.cpf == cpf).first()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Atualizar nome
    if request.nome:
        usuario.nome = request.nome
    
    # Atualizar Email (verificar se já não está em uso por outro usuário)
    if request.email:
        existing_email = db.query(Usuario).filter(
            Usuario.email == request.email,
            Usuario.id != usuario.id
        ).first()
        
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este email já está cadastrado por outro usuário"
            )
        
        usuario.email = request.email
    
    # Atualizar WhatsApp (verificar se já não está em uso por outro usuário)
    if request.whatsapp:
        existing_whatsapp = db.query(Usuario).filter(
            Usuario.whatsapp == request.whatsapp,
            Usuario.id != usuario.id
        ).first()
        
        if existing_whatsapp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este WhatsApp já está cadastrado por outro usuário"
            )
        
        usuario.whatsapp = request.whatsapp
    
    # Atualizar Chave PIX
    if request.chave_pix:
        usuario.chave_pix = request.chave_pix
    
    # Atualizar senha (se fornecida)
    if request.nova_senha:
        # Verificar senha atual
        if not request.senha_atual:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Senha atual é obrigatória para trocar a senha"
            )
        
        if not verify_password(request.senha_atual, usuario.senha_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Senha atual incorreta"
            )
        
        # Atualizar para nova senha
        usuario.senha_hash = hash_password(request.nova_senha)
    
    # Atualizar timestamp
    usuario.atualizado_em = get_fortaleza_time()
    
    # Salvar alterações
    db.commit()
    db.refresh(usuario)
    
    logger.info(f"✅ Perfil atualizado: {usuario.nome} (CPF: {cpf})")
    
    return usuario


@app.get(
    "/auth/profile/{cpf}",
    response_model=UsuarioResponse,
    tags=["Autenticação"],
    summary="Obter dados do perfil do usuário"
)
def get_profile(
    cpf: str,
    db: Session = Depends(get_db)
):
    """
    ## 👤 Obter Dados do Perfil
    
    Retorna os dados completos do usuário pelo CPF.
    
    Usado para carregar os dados do perfil na tela de edição.
    """
    
    # Buscar usuário pelo CPF
    usuario = db.query(Usuario).filter(Usuario.cpf == cpf).first()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    return usuario


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
