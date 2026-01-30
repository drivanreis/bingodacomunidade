"""
Endpoints de Autenticação - Sistema com 3 Rotas de Login
========================================================
Implementa sistema de autenticação hierárquico com separação
explícita por papéis.

Rotas de Login:
1. /login - Público (FIEL)
2. /admin-paroquia/login - Não público (usuários paroquiais)
3. /admin-site/login - Não público (SUPER_ADMIN)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import timedelta
import logging

from src.db.base import get_db
from src.models.models import Usuario, TipoUsuario, Paroquia
from src.schemas.schemas import (
    SignupRequest,
    LoginRequest,
    AdminSiteLoginRequest,
    AdminParoquiaLoginRequest,
    TokenResponse,
    BootstrapSetupRequest
)
from src.utils.auth import (
    verify_password,
    create_access_token,
    hash_password,
    get_current_user
)
from src.utils.time_manager import get_fortaleza_time, generate_temporal_id_with_microseconds

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Autenticação"])


# ============================================================================
# ROTA 0: CADASTRO PÚBLICO - NOVO FIEL
# ============================================================================

@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="📝 Cadastro Público - Novo FIEL"
)
def signup_fiel(
    request: SignupRequest,
    db: Session = Depends(get_db)
):
    """
    Cadastro público de novos FIELs (participantes).
    
    Qualquer pessoa pode se cadastrar e começar a participar dos bingos.
    O usuário é automaticamente associado à paróquia padrão.
    
    Validações:
    - CPF único no sistema
    - Email único no sistema
    - WhatsApp no formato brasileiro
    - Senha mínima 6 caracteres
    
    Após cadastro, retorna token de acesso (login automático).
    """
    try:
        # ====================================================================
        # VALIDAÇÕES DE UNICIDADE
        # ====================================================================
        
        # Verificar CPF único
        cpf_exists = db.query(Usuario).filter(Usuario.cpf == request.cpf).first()
        if cpf_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CPF já cadastrado no sistema"
            )
        
        # Verificar email único
        email_exists = db.query(Usuario).filter(Usuario.email == request.email).first()
        if email_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email já cadastrado no sistema"
            )
        
        # ====================================================================
        # BUSCAR PARÓQUIA PADRÃO
        # ====================================================================
        
        paroquia_default = db.query(Paroquia).filter(Paroquia.ativa == True).first()
        if not paroquia_default:
            logger.error("❌ Nenhuma paróquia ativa encontrada no sistema")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Sistema não configurado corretamente - sem paróquia disponível"
            )
        
        # ====================================================================
        # CRIAR NOVO FIEL
        # ====================================================================
        
        novo_fiel = Usuario(
            id=generate_temporal_id_with_microseconds('USR'),
            nome=request.nome,
            cpf=request.cpf,
            email=request.email,
            whatsapp=request.whatsapp,
            tipo=TipoUsuario.FIEL,
            paroquia_id=paroquia_default.id,
            chave_pix=request.chave_pix,
            senha_hash=hash_password(request.senha),
            ativo=True,
            email_verificado=False,  # Requer verificação futura
            banido=False,
            is_bootstrap=False
        )
        
        try:
            db.add(novo_fiel)
            db.commit()
            db.refresh(novo_fiel)
        except IntegrityError as e:
            db.rollback()
            logger.error(f"❌ Erro de integridade ao cadastrar FIEL: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CPF ou email já cadastrado no sistema"
            )
        
        logger.info(f"✓ Novo FIEL cadastrado: {novo_fiel.nome} ({novo_fiel.cpf})")
        
        # ====================================================================
        # LOGIN AUTOMÁTICO
        # ====================================================================
        
        access_token = create_access_token(
            data={
                "sub": novo_fiel.id,
                "cpf": novo_fiel.cpf,
                "tipo": novo_fiel.tipo.value,
                "paroquia_id": novo_fiel.paroquia_id
            },
            expires_delta=timedelta(hours=16)
        )
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            usuario=novo_fiel
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao cadastrar FIEL: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar cadastro: {str(e)}"
        )


# ============================================================================
# ROTA 1: LOGIN PÚBLICO - FIEL
# ============================================================================

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="🌐 Login Público - Usuário Comum (FIEL)"
)
def login_fiel(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    """Login público para FIELs usando CPF e senha."""
    
    usuario = db.query(Usuario).filter(Usuario.cpf == request.cpf).first()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="CPF ou senha incorretos"
        )
    
    if usuario.tipo != TipoUsuario.FIEL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta rota é apenas para usuários comuns. Use a rota administrativa correta."
        )
    
    if not verify_password(request.senha, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="CPF ou senha incorretos"
        )
    
    if not usuario.ativo or usuario.banido:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Acesso negado. {usuario.motivo_banimento if usuario.banido else 'Usuário inativo'}"
        )
    
    usuario.ultimo_acesso = get_fortaleza_time()
    db.commit()
    
    access_token = create_access_token(
        data={"sub": usuario.id, "cpf": usuario.cpf, "tipo": usuario.tipo.value, "paroquia_id": usuario.paroquia_id}
    )
    
    logger.info(f"✅ Login FIEL: {usuario.nome}")
    
    return TokenResponse(access_token=access_token, token_type="bearer", usuario=usuario)


# ============================================================================
# ROTA 2: LOGIN ADMINISTRATIVO - PARÓQUIA
# ============================================================================

@router.post(
    "/admin-paroquia/login",
    response_model=TokenResponse,
    summary="🏛️ Login Administrativo - Usuários Paroquiais",
    include_in_schema=False
)
def login_paroquia(
    request: AdminParoquiaLoginRequest,
    db: Session = Depends(get_db)
):
    """Login não público para usuários paroquiais via email."""
    
    usuario = db.query(Usuario).filter(Usuario.email == request.email).first()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos"
        )
    
    paroquial_types = [
        TipoUsuario.PAROQUIA_ADMIN,
        TipoUsuario.PAROQUIA_CAIXA,
        TipoUsuario.PAROQUIA_RECEPCAO,
        TipoUsuario.PAROQUIA_BINGO
    ]
    
    if usuario.tipo not in paroquial_types:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta rota é apenas para usuários paroquiais"
        )
    
    if not verify_password(request.senha, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos"
        )
    
    if not usuario.ativo or usuario.banido:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado"
        )
    
    usuario.ultimo_acesso = get_fortaleza_time()
    db.commit()
    
    access_token = create_access_token(
        data={"sub": usuario.id, "email": usuario.email, "tipo": usuario.tipo.value, "paroquia_id": usuario.paroquia_id}
    )
    
    logger.info(f"✅ Login Paroquial: {usuario.nome} ({usuario.tipo.value})")
    
    return TokenResponse(access_token=access_token, token_type="bearer", usuario=usuario)


# ============================================================================
# ROTA 3: LOGIN ADMINISTRATIVO - SUPER ADMIN
# ============================================================================

@router.post(
    "/admin-site/login",
    response_model=TokenResponse,
    summary="👑 Login Administrativo - Super Admin",
    include_in_schema=False
)
def login_super_admin(
    request: AdminSiteLoginRequest,
    db: Session = Depends(get_db)
):
    """Login não público para SUPER_ADMIN. Aceita Admin/admin123 (bootstrap) ou email/senha."""
    
    if request.username.lower() == "admin":
        usuario = db.query(Usuario).filter(
            Usuario.nome == "Admin",
            Usuario.is_bootstrap == True
        ).first()
    else:
        usuario = db.query(Usuario).filter(Usuario.email == request.username).first()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais incorretas"
        )
    
    if usuario.tipo != TipoUsuario.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta rota é exclusiva para Super Admins"
        )
    
    if not verify_password(request.senha, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais incorretas"
        )
    
    # Se é bootstrap, retorna com flag especial
    if usuario.is_bootstrap:
        logger.info("🔧 Login com usuário bootstrap - Forçando primeiro acesso")
        
        access_token = create_access_token(
            data={"sub": usuario.id, "tipo": usuario.tipo.value, "is_bootstrap": True}
        )
        
        return TokenResponse(access_token=access_token, token_type="bearer", usuario=usuario)
    
    # Login normal
    if not usuario.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo"
        )
    
    usuario.ultimo_acesso = get_fortaleza_time()
    db.commit()
    
    access_token = create_access_token(
        data={"sub": usuario.id, "email": usuario.email, "tipo": usuario.tipo.value}
    )
    
    logger.info(f"✅ Login SUPER_ADMIN: {usuario.nome}")
    
    return TokenResponse(access_token=access_token, token_type="bearer", usuario=usuario)


# ============================================================================
# ENDPOINT: CRIAR PRIMEIRO SUPER_ADMIN (BOOTSTRAP)
# ============================================================================

@router.post(
    "/admin-site/setup-first-admin",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="👑 Criar Primeiro Super Admin",
    include_in_schema=False
)
def setup_first_super_admin(
    request: BootstrapSetupRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Cria primeiro SUPER_ADMIN e deleta usuário bootstrap.
    Só funciona se logado com Admin/admin123.
    """
    
    if not current_user.is_bootstrap:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Este endpoint é apenas para configuração inicial do sistema"
        )
    
    # Verificar se já existe outro SUPER_ADMIN
    existing_admin = db.query(Usuario).filter(
        Usuario.tipo == TipoUsuario.SUPER_ADMIN,
        Usuario.is_bootstrap == False
    ).first()
    
    if existing_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um Super Admin no sistema"
        )
    
    # Verificar duplicatas
    if request.email:
        if db.query(Usuario).filter(Usuario.email == request.email).first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email já cadastrado")
    
    if request.cpf:
        if db.query(Usuario).filter(Usuario.cpf == request.cpf).first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CPF já cadastrado")
    
    # Criar novo SUPER_ADMIN
    novo_admin = Usuario(
        id=generate_temporal_id_with_microseconds('SUPERADMIN'),
        nome=request.nome,
        email=request.email,
        cpf=request.cpf,
        whatsapp=request.whatsapp,
        tipo=TipoUsuario.SUPER_ADMIN,
        paroquia_id=None,
        senha_hash=hash_password(request.senha),
        ativo=True,
        is_bootstrap=False,
        email_verificado=True,
        banido=False,
        chave_pix=None
    )
    
    try:
        db.add(novo_admin)
        db.delete(current_user)  # Deletar bootstrap
        db.commit()
        db.refresh(novo_admin)
    except IntegrityError as e:
        db.rollback()
        logger.error(f"❌ Erro de integridade ao criar primeiro SUPER_ADMIN: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email ou CPF já cadastrado no sistema"
        )
    
    logger.info("🎉 PRIMEIRO SUPER_ADMIN CRIADO - Usuário bootstrap DELETADO")
    
    access_token = create_access_token(
        data={"sub": novo_admin.id, "email": novo_admin.email, "tipo": novo_admin.tipo.value}
    )
    
    return TokenResponse(access_token=access_token, token_type="bearer", usuario=novo_admin)
