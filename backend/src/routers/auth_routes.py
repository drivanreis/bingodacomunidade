"""
Endpoints de Autenticação - Sistema com 2 Tipos de Usuário
===========================================================
Implementa sistema de autenticação com separação explícita:



1. USUÁRIO COMUM (FIEL)
   - Auto-cadastro público
   - Login: CPF + Senha
   - Recuperação: por Email
   
2. USUÁRIO ADMINISTRATIVO
   - Sem auto-cadastro (criado apenas por superior)
   - Login: Login + Senha
   - Hierarquia: ADMIN_SITE > ADMIN_PAROQUIA
   - Recuperação: por ADMIN_SITE

Rotas de Login:
1. POST /auth/signup - Cadastro público de FIEL (novo)
2. POST /auth/login - Login de FIEL com CPF
3. POST /auth/admin-paroquia/login - Login de Admin-Paroquia
4. POST /auth/admin-site/login - Login de Admin-Site
5. POST /auth/admin-site/criar-admin-site - Admin-Site cria outro Admin-Site
6. POST /auth/admin-site/criar-admin-paroquia - Admin-Site cria Admin-Paroquia
7. POST /auth/admin-paroquia/criar-admin-paroquia - Admin-Paroquia cria Admin-Paroquia subordinado
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from datetime import timedelta
import re
import logging
import secrets

from src.db.base import get_db
from src.models.models import UsuarioComum
from src.models.models import UsuarioAdministrativo
from src.models.models import NivelAcessoAdmin
from src.models.models import Paroquia
from src.schemas.schemas import SignupFielRequest
from src.schemas.schemas import LoginFielRequest
from src.schemas.schemas import ForgotPasswordRequest
from src.schemas.schemas import ResetPasswordRequest
from src.schemas.schemas import AdminSiteLoginRequest
from src.schemas.schemas import AdminParoquiaLoginRequest
from src.schemas.schemas import TokenResponse
from src.schemas.schemas import CreateAdminSiteRequest
from src.schemas.schemas import CreateAdminParoquiaRequest
from src.utils.auth import (
    verify_password,
    create_access_token,
    hash_password,
    get_current_user
)
from src.utils.time_manager import get_fortaleza_time, generate_temporal_id_with_microseconds, FORTALEZA_TZ

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Autenticação"])

# --- BLOQUEIO GLOBAL POR BOOTSTRAP EXPIRADO ---
def check_bootstrap_block(db: Session):
    bootstrap = db.query(UsuarioAdministrativo).filter(
        UsuarioAdministrativo.login == "Admin"
    ).first()
    if bootstrap:
        criado_em = bootstrap.criado_em
        if criado_em and criado_em.tzinfo is None:
            criado_em = FORTALEZA_TZ.localize(criado_em)
        agora = get_fortaleza_time()
        if (agora - criado_em).days >= 30:
            return True
    return False


@router.post(
    "/bootstrap/login",
    response_model=dict,
    summary="🔧 Login Bootstrap - Admin Temporário"
)
def bootstrap_login(request: AdminSiteLoginRequest, db: Session = Depends(get_db)):
    """
    Login exclusivo para o usuário temporário (Admin/admin123).
    Permite acesso ao fluxo de primeiro acesso.
    """
    try:
        bootstrap = db.query(UsuarioAdministrativo).filter(
            UsuarioAdministrativo.login == "Admin"
        ).first()

        if not bootstrap:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário bootstrap não encontrado"
            )

        login_informado = request.login.strip().lower()
        nome_bootstrap = (bootstrap.login or "").strip().lower()
        email_bootstrap = (bootstrap.email or "").strip().lower()

        if login_informado not in [nome_bootstrap, email_bootstrap]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Login ou senha incorretos"
            )

        if not verify_password(request.senha, bootstrap.senha_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Login ou senha incorretos"
            )

        agora = get_fortaleza_time()
        criado_em = bootstrap.criado_em
        if criado_em and criado_em.tzinfo is None:
            criado_em = FORTALEZA_TZ.localize(criado_em)
        dias_desde = (agora - criado_em).days
        dias_restantes = max(0, 30 - dias_desde)

        return {
            "message": "Bootstrap autenticado",
            "bootstrap": True,
            "dias_restantes": dias_restantes
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao autenticar bootstrap: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao processar login bootstrap"
        )


# ============================================================================
# SEÇÃO 1: FLUXOS DE USUÁRIO COMUM (FIEL)
# ============================================================================

@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="📝 Cadastro Público - Novo FIEL"
)
def signup_fiel(request: SignupFielRequest, db: Session = Depends(get_db)):
    """
    Cadastro público de novos FIELs (participantes/apostadores).
    
    Qualquer pessoa pode se registrar. Campos obrigatórios:
    - nome: nome completo
    - cpf: CPF único (11 dígitos)
    - email: email único (necessário para recuperação de senha)
    - telefone: telefone (necessário para 2FA via SMS)
    - whatsapp: WhatsApp (necessário para notificação de prêmios)
    - senha: mínimo 6 caracteres
    
    Retorna JWT com acesso imediato (login automático após signup).
    """
    try:
        # Normalizar CPF
        cpf_limpo = request.cpf.replace(".", "").replace("-", "").replace("/", "")
        
        # Validar unicidade de CPF
        cpf_existe = db.query(UsuarioComum).filter(
            UsuarioComum.cpf == cpf_limpo
        ).first()
        if cpf_existe:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="CPF já cadastrado no sistema"
            )
        
        # Validar unicidade de email
        email_existe = db.query(UsuarioComum).filter(
            UsuarioComum.email == request.email
        ).first()
        if email_existe:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email já cadastrado no sistema"
            )
        
        # Criar novo FIEL
        novo_fiel = UsuarioComum(
            id=generate_temporal_id_with_microseconds('USR'),
            nome=request.nome,
            cpf=cpf_limpo,
            email=request.email,
            telefone=request.telefone,
            whatsapp=request.whatsapp,
            chave_pix=request.chave_pix,
            senha_hash=hash_password(request.senha),
            ativo=True,
            email_verificado=False,  # Verificação futura
            telefone_verificado=False,
            banido=False,
            criado_em=get_fortaleza_time(),
            atualizado_em=get_fortaleza_time()
        )
        
        db.add(novo_fiel)
        db.commit()
        db.refresh(novo_fiel)
        
        logger.info(f"✅ Novo FIEL cadastrado: {novo_fiel.nome} ({novo_fiel.cpf})")
        
        # Login automático
        access_token = create_access_token(
            data={
                "sub": novo_fiel.id,
                "cpf": novo_fiel.cpf,
                "email": novo_fiel.email,
                "tipo": "usuario_comum"
            },
            expires_delta=timedelta(hours=24)
        )
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            usuario=novo_fiel
        )
        
    except HTTPException:
        raise
    except IntegrityError as e:
        db.rollback()
        logger.error(f"❌ Erro de integridade ao cadastrar FIEL: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Erro ao processar cadastro - dados duplicados"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Erro ao cadastrar FIEL: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao processar cadastro"
        )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="🔑 Login - Usuário Comum (FIEL)"
)
def login_fiel(request: LoginFielRequest, db: Session = Depends(get_db)):
    """
    Login público para FIELs usando CPF ou email e senha.
    
    - CPF: números apenas (11 dígitos)
    - Email: email cadastrado
    - Senha: senha cadastrada
    
    Validações:
    - Usuário ativo
    - Não banido
    - Desbloqueio por tentativas (máx 5 falhas em 5 min)
    
    Retorna JWT com acesso.
    """
    # Verificar bloqueio global por bootstrap expirado
    if check_bootstrap_block(db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sistema bloqueado: o cadastro real do Administrador não foi concluído em 30 dias."
        )
    try:
        identifier = request.login or request.email or request.cpf

        if not identifier:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CPF ou Email é obrigatório"
            )

        if "@" in identifier:
            fiel = db.query(UsuarioComum).filter(
                UsuarioComum.email == identifier
            ).first()
        else:
            cpf_limpo = re.sub(r"\D", "", identifier)
            if len(cpf_limpo) != 11:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="CPF inválido"
                )
            fiel = db.query(UsuarioComum).filter(
                UsuarioComum.cpf == cpf_limpo
            ).first()
        
        if not fiel:
            logger.warning(f"❌ Login: usuário não encontrado ({identifier})")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="CPF ou Email não encontrado"
            )
        
        # Validar bloqueio por tentativas
        if fiel.bloqueado_ate:
            agora = get_fortaleza_time()
            if agora < fiel.bloqueado_ate:
                logger.warning(f"❌ Login bloqueado: tentativas excessivas ({fiel.id})")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Muitas tentativas. Tente novamente em 5 minutos."
                )
            else:
                # Desbloquear
                fiel.bloqueado_ate = None
                fiel.tentativas_login = 0
                db.commit()
        
        # Validar status
        if not fiel.ativo:
            logger.warning(f"❌ Login: usuário inativo ({fiel.id})")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuário inativo"
            )
        
        if fiel.banido:
            logger.warning(f"❌ Login: usuário banido ({fiel.id})")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Usuário banido: {fiel.motivo_banimento or 'Sem motivo informado'}"
            )
        
        # Validar senha
        if not verify_password(request.senha, fiel.senha_hash):
            fiel.tentativas_login += 1
            
            # Bloquear após 5 tentativas (5 minutos)
            if fiel.tentativas_login >= 5:
                fiel.bloqueado_ate = get_fortaleza_time() + timedelta(minutes=5)
                logger.warning(f"⚠️ FIEL bloqueado por 5 min: {fiel.id}")
            
            db.commit()
            logger.warning(f"❌ Login: senha incorreta ({fiel.id})")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="CPF ou senha incorretos"
            )
        
        # Login bem-sucedido
        fiel.tentativas_login = 0
        fiel.ultimo_acesso = get_fortaleza_time()
        db.commit()
        db.refresh(fiel)
        
        access_token = create_access_token(
            data={
                "sub": fiel.id,
                "cpf": fiel.cpf,
                "email": fiel.email,
                "tipo": "usuario_comum"
            },
            expires_delta=timedelta(hours=24)
        )
        
        logger.info(f"✅ Login FIEL bem-sucedido: {fiel.id}")
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            usuario=fiel
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao fazer login FIEL: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao processar login"
        )


@router.post(
    "/forgot-password",
    summary="🔐 Recuperação de Senha - FIEL"
)
def forgot_password_fiel(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Inicia recuperação de senha por email para FIELs.
    
    Gera token válido por 1 hora. Não retorna erro se email
    não existe (segurança - evita descoberta de emails).
    """
    try:
        identifier = request.login or request.email or request.cpf
        if not identifier:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CPF ou Email é obrigatório"
            )

        if "@" in identifier:
            fiel = db.query(UsuarioComum).filter(
                UsuarioComum.email == identifier
            ).first()
        else:
            cpf_limpo = re.sub(r"\D", "", identifier)
            if len(cpf_limpo) != 11:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="CPF inválido"
                )
            fiel = db.query(UsuarioComum).filter(
                UsuarioComum.cpf == cpf_limpo
            ).first()

        if not fiel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="CPF ou Email não encontrado"
            )

        # Gerar token de recuperação (1 hora)
        token_reset = secrets.token_urlsafe(32)
        agora = get_fortaleza_time()
        
        fiel.token_recuperacao = token_reset
        fiel.token_expiracao = agora + timedelta(hours=1)
        db.commit()
        
        logger.info(f"✅ Token de recuperação gerado: {fiel.id}")
        # TODO: Enviar email com link contendo token_reset
        
        return {
            "message": "Se o email está registrado, você receberá um link de recuperação"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao processar forgot-password: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao processar solicitação"
        )


@router.post(
    "/reset-password",
    summary="🔄 Resetar Senha - FIEL"
)
def reset_password_fiel(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Conclui recuperação de senha usando token do email.
    
    Validações:
    - Token deve ser válido
    - Token não deve estar expirado (1 hora)
    """
    try:
        agora = get_fortaleza_time()
        
        fiel = db.query(UsuarioComum).filter(
            UsuarioComum.token_recuperacao == request.token
        ).first()
        
        if not fiel:
            logger.warning(f"❌ Reset senha: token inválido")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token inválido"
            )
        
        # Validar expiração
        expiracao = fiel.token_expiracao
        if expiracao and expiracao.tzinfo is None:
            expiracao = FORTALEZA_TZ.localize(expiracao)
        if not expiracao or agora > expiracao:
            logger.warning(f"❌ Reset senha: token expirado ({fiel.id})")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Link de recuperação expirou. Solicite um novo."
            )
        
        # Atualizar senha
        fiel.senha_hash = hash_password(request.nova_senha)
        fiel.token_recuperacao = None
        fiel.token_expiracao = None
        fiel.tentativas_login = 0
        db.commit()
        
        logger.info(f"✅ Senha resetada: {fiel.id}")
        
        return {"message": "Senha atualizada com sucesso!"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao resetar senha: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao resetar senha"
        )


# ============================================================================
# SEÇÃO 2: FLUXOS DE USUÁRIO ADMINISTRATIVO
# ============================================================================

@router.post(
    "/admin-paroquia/login",
    response_model=TokenResponse,
    summary="🏛️ Login - Admin-Paroquia"
)
def login_admin_paroquia(request: AdminParoquiaLoginRequest, db: Session = Depends(get_db)):
    """
    Login para Administradores de Paróquia.
    
    - Login: login único (ex: admin@paroquia1)
    - Senha: senha do administrador
    
    Validações:
    - Deve ser ADMIN_PAROQUIA
    - Usuário ativo
    - Desbloqueio por tentativas (máx 3 falhas em 15 min)
    
    Retorna JWT com info da paróquia.
    """
    if check_bootstrap_block(db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sistema bloqueado: o cadastro real do Administrador não foi concluído em 30 dias."
        )
    try:
        # Buscar admin por login ou email
        admin = db.query(UsuarioAdministrativo).filter(
            or_(
                UsuarioAdministrativo.login == request.login,
                UsuarioAdministrativo.email == request.login
            )
        ).first()
        
        if not admin:
            logger.warning(f"❌ Login admin: login não encontrado ({request.login})")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Login ou senha incorretos"
            )
        
        # Validar que é ADMIN_PAROQUIA
        if admin.nivel_acesso != NivelAcessoAdmin.ADMIN_PAROQUIA:
            logger.warning(f"❌ Login admin: não é ADMIN_PAROQUIA ({admin.id})")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Esta rota é apenas para Administradores de Paroquia"
            )
        
        # Validar bloqueio por tentativas
        if admin.bloqueado_ate:
            agora = get_fortaleza_time()
            if agora < admin.bloqueado_ate:
                logger.warning(f"❌ Login admin bloqueado: tentativas ({admin.id})")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Muitas tentativas. Tente novamente em alguns minutos."
                )
            else:
                admin.bloqueado_ate = None
                admin.tentativas_login = 0
                db.commit()
        
        # Validar status
        if not admin.ativo:
            logger.warning(f"❌ Login admin: inativo ({admin.id})")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Administrador inativo"
            )
        
        # Validar senha
        if not verify_password(request.senha, admin.senha_hash):
            admin.tentativas_login += 1
            
            if admin.tentativas_login >= 3:
                admin.bloqueado_ate = get_fortaleza_time() + timedelta(minutes=15)
                logger.warning(f"⚠️ Admin bloqueado por 15 min: {admin.id}")
            
            db.commit()
            logger.warning(f"❌ Login admin: senha incorreta ({admin.id})")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Login ou senha incorretos"
            )
        
        # Login bem-sucedido
        admin.tentativas_login = 0
        admin.ultimo_acesso = get_fortaleza_time()
        db.commit()
        db.refresh(admin)
        
        access_token = create_access_token(
            data={
                "sub": admin.id,
                "login": admin.login,
                "nivel_acesso": admin.nivel_acesso.value,
                "paroquia_id": admin.paroquia_id,
                "tipo": "usuario_administrativo"
            },
            expires_delta=timedelta(hours=24)
        )
        
        logger.info(f"✅ Login Admin-Paroquia bem-sucedido: {admin.id}")
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            usuario=admin
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao fazer login admin-paroquia: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao processar login"
        )


@router.post(
    "/admin-site/login",
    response_model=TokenResponse,
    summary="👑 Login - Admin-Site"
)
def login_admin_site(request: AdminSiteLoginRequest, db: Session = Depends(get_db)):
    """
    Login para Administradores do Site (SUPER_ADMIN).
    
    - Login: login único ou email
    - Senha: senha do administrador
    
    Validações:
    - Deve ser ADMIN_SITE
    - Usuário ativo
    - Desbloqueio por tentativas
    
    Retorna JWT com acesso total.
    """
    if check_bootstrap_block(db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sistema bloqueado: o cadastro real do Administrador não foi concluído em 30 dias."
        )
    try:
        # Buscar admin por login ou email
        admin = db.query(UsuarioAdministrativo).filter(
            or_(
                UsuarioAdministrativo.login == request.login,
                UsuarioAdministrativo.email == request.login
            )
        ).first()
        
        if not admin:
            logger.warning(f"❌ Login admin-site: login não encontrado ({request.login})")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Login ou senha incorretos"
            )
        
        # Validar que é ADMIN_SITE
        if admin.nivel_acesso != NivelAcessoAdmin.ADMIN_SITE:
            logger.warning(f"❌ Login admin-site: não é ADMIN_SITE ({admin.id})")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Esta rota é exclusiva para Administradores do Site"
            )
        
        # Validar bloqueio por tentativas
        if admin.bloqueado_ate:
            agora = get_fortaleza_time()
            if agora < admin.bloqueado_ate:
                logger.warning(f"❌ Login admin-site bloqueado: tentativas ({admin.id})")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Muitas tentativas. Tente novamente em alguns minutos."
                )
            else:
                admin.bloqueado_ate = None
                admin.tentativas_login = 0
                db.commit()
        
        # Validar status
        if not admin.ativo:
            logger.warning(f"❌ Login admin-site: inativo ({admin.id})")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Administrador inativo"
            )
        
        # Validar senha
        if not verify_password(request.senha, admin.senha_hash):
            admin.tentativas_login += 1
            
            if admin.tentativas_login >= 3:
                admin.bloqueado_ate = get_fortaleza_time() + timedelta(minutes=15)
                logger.warning(f"⚠️ Admin-site bloqueado por 15 min: {admin.id}")
            
            db.commit()
            logger.warning(f"❌ Login admin-site: senha incorreta ({admin.id})")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Login ou senha incorretos"
            )
        
        # Login bem-sucedido
        admin.tentativas_login = 0
        admin.ultimo_acesso = get_fortaleza_time()
        db.commit()
        db.refresh(admin)
        
        access_token = create_access_token(
            data={
                "sub": admin.id,
                "login": admin.login,
                "nivel_acesso": admin.nivel_acesso.value,
                "tipo": "usuario_administrativo"
            },
            expires_delta=timedelta(hours=24)
        )
        
        logger.info(f"✅ Login Admin-Site bem-sucedido: {admin.id}")
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            usuario=admin
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao fazer login admin-site: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao processar login"
        )


# ============================================================================
# SEÇÃO 3: CRIAÇÃO HIERÁRQUICA DE ADMINISTRADORES
# ============================================================================

@router.post(
    "/admin-site/criar-admin-site",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="👑 Criar Admin-Site (por Admin-Site)"
)
def criar_admin_site(
    request: CreateAdminSiteRequest,
    usuario_atual = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ADMIN_SITE cria outro ADMIN_SITE.
    
    Requer:
    - Usuário autenticado seja ADMIN_SITE
    
    Criar:
    - Nome do novo administrador
    - Login único
    - Senha inicial (hash)
    - Email (opcional)
    
    Registra quem criou (criado_por_id).
    """
    try:
        # Verificar permissão
        admin_atual = db.query(UsuarioAdministrativo).filter(
            UsuarioAdministrativo.id == usuario_atual.get("sub")
        ).first()
        
        if not admin_atual or admin_atual.nivel_acesso != NivelAcessoAdmin.ADMIN_SITE:
            logger.warning(f"❌ Acesso negado: criar admin-site por {usuario_atual.get('sub')}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas ADMIN_SITE pode criar outros ADMIN_SITE"
            )
        
        # Validar login único
        login_existe = db.query(UsuarioAdministrativo).filter(
            UsuarioAdministrativo.login == request.login
        ).first()
        
        if login_existe:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Login já existe no sistema"
            )
        
        # Criar novo ADMIN_SITE
        novo_admin = UsuarioAdministrativo(
            id=generate_temporal_id_with_microseconds('ADM'),
            nome=request.nome,
            login=request.login,
            senha_hash=hash_password(request.senha),
            email=request.email,
            telefone=request.telefone,
            whatsapp=request.whatsapp,
            nivel_acesso=NivelAcessoAdmin.ADMIN_SITE,
            paroquia_id=None,  # ADMIN_SITE não tem paróquia
            criado_por_id=admin_atual.id,
            ativo=True,
            criado_em=get_fortaleza_time(),
            atualizado_em=get_fortaleza_time()
        )
        
        db.add(novo_admin)
        db.commit()
        db.refresh(novo_admin)
        
        logger.info(f"✅ Novo ADMIN_SITE criado: {novo_admin.id} por {admin_atual.id}")
        
        return {
            "message": "ADMIN_SITE criado com sucesso",
            "admin_id": novo_admin.id,
            "login": novo_admin.login
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Erro ao criar admin-site: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao criar administrador"
        )


@router.post(
    "/admin-site/criar-admin-paroquia",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="👑 Criar Admin-Paroquia (por Admin-Site)"
)
def criar_admin_paroquia(
    request: CreateAdminParoquiaRequest,
    usuario_atual = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ADMIN_SITE cria ADMIN_PAROQUIA.
    
    Requer:
    - Usuário autenticado seja ADMIN_SITE
    - Paróquia deve existir e estar ativa
    
    Criar:
    - Nome do novo administrador
    - Login único
    - Senha inicial
    - Email (opcional)
    - paroquia_id: ID da paróquia que administrará
    
    Registra quem criou (criado_por_id).
    """
    try:
        # Verificar permissão
        admin_atual = db.query(UsuarioAdministrativo).filter(
            UsuarioAdministrativo.id == usuario_atual.get("sub")
        ).first()
        
        if not admin_atual or admin_atual.nivel_acesso != NivelAcessoAdmin.ADMIN_SITE:
            logger.warning(f"❌ Acesso negado: criar admin-paroquia por {usuario_atual.get('sub')}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas ADMIN_SITE pode criar ADMIN_PAROQUIA"
            )
        
        # Validar que paróquia existe e está ativa
        paroquia = db.query(Paroquia).filter(
            Paroquia.id == request.paroquia_id
        ).first()
        
        if not paroquia or not paroquia.ativa:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Paróquia não encontrada ou inativa"
            )
        
        # Validar login único
        login_existe = db.query(UsuarioAdministrativo).filter(
            UsuarioAdministrativo.login == request.login
        ).first()
        
        if login_existe:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Login já existe no sistema"
            )
        
        # Criar novo ADMIN_PAROQUIA
        novo_admin = UsuarioAdministrativo(
            id=generate_temporal_id_with_microseconds('ADM'),
            nome=request.nome,
            login=request.login,
            senha_hash=hash_password(request.senha),
            email=request.email,
            telefone=request.telefone,
            whatsapp=request.whatsapp,
            nivel_acesso=NivelAcessoAdmin.ADMIN_PAROQUIA,
            paroquia_id=request.paroquia_id,
            criado_por_id=admin_atual.id,
            ativo=True,
            criado_em=get_fortaleza_time(),
            atualizado_em=get_fortaleza_time()
        )
        
        db.add(novo_admin)
        db.commit()
        db.refresh(novo_admin)
        
        logger.info(f"✅ Novo ADMIN_PAROQUIA criado: {novo_admin.id} (paroquia: {paroquia.nome})")
        
        return {
            "message": "ADMIN_PAROQUIA criado com sucesso",
            "admin_id": novo_admin.id,
            "login": novo_admin.login,
            "paroquia_id": paroquia.id,
            "paroquia_nome": paroquia.nome
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Erro ao criar admin-paroquia: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao criar administrador"
        )


@router.post(
    "/admin-paroquia/criar-admin-paroquia",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="🏛️ Criar Admin-Paroquia Subordinado (por Admin-Paroquia)"
)
def admin_paroquia_criar_subordinado(
    request: CreateAdminParoquiaRequest,
    usuario_atual = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ADMIN_PAROQUIA cria outro ADMIN_PAROQUIA (subordinado).
    
    Requer:
    - Usuário autenticado seja ADMIN_PAROQUIA
    - paroquia_id deve ser a MESMA paróquia do criador
    
    Criar:
    - Nome do novo administrador
    - Login único
    - Senha inicial
    - Email (opcional)
    
    Registra quem criou (criado_por_id) para hierarquia.
    """
    try:
        # Verificar permissão
        admin_atual = db.query(UsuarioAdministrativo).filter(
            UsuarioAdministrativo.id == usuario_atual.get("sub")
        ).first()
        
        if not admin_atual or admin_atual.nivel_acesso != NivelAcessoAdmin.ADMIN_PAROQUIA:
            logger.warning(f"❌ Acesso negado: criar admin por {usuario_atual.get('sub')}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas ADMIN_PAROQUIA pode criar outros administradores paroquiais"
            )
        
        # Validar que novo admin é para MESMA paróquia
        if request.paroquia_id != admin_atual.paroquia_id:
            logger.warning(f"❌ Acesso negado: tentativa de criar admin em paróquia diferente")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você só pode criar administradores para sua própria paróquia"
            )
        
        # Validar login único
        login_existe = db.query(UsuarioAdministrativo).filter(
            UsuarioAdministrativo.login == request.login
        ).first()
        
        if login_existe:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Login já existe no sistema"
            )
        
        # Criar novo ADMIN_PAROQUIA subordinado
        novo_admin = UsuarioAdministrativo(
            id=generate_temporal_id_with_microseconds('ADM'),
            nome=request.nome,
            login=request.login,
            senha_hash=hash_password(request.senha),
            email=request.email,
            telefone=request.telefone,
            whatsapp=request.whatsapp,
            nivel_acesso=NivelAcessoAdmin.ADMIN_PAROQUIA,
            paroquia_id=request.paroquia_id,
            criado_por_id=admin_atual.id,  # Hierarquia
            ativo=True,
            criado_em=get_fortaleza_time(),
            atualizado_em=get_fortaleza_time()
        )
        
        db.add(novo_admin)
        db.commit()
        db.refresh(novo_admin)
        
        logger.info(f"✅ Novo Admin-Paroquia subordinado criado: {novo_admin.id}")
        
        return {
            "message": "Administrador paroquial subordinado criado com sucesso",
            "admin_id": novo_admin.id,
            "login": novo_admin.login,
            "criado_por": admin_atual.login
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Erro ao criar admin subordinado: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao criar administrador"
        )


# ============================================================================
# ENDPOINT: BOOTSTRAP - CRIAR PRIMEIRO ADMIN_SITE
# ============================================================================

@router.post(
    "/bootstrap",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="🔧 Bootstrap - Criar Primeiro Admin-Site"
)
def bootstrap_setup(
    request: CreateAdminSiteRequest,
    db: Session = Depends(get_db)
):
    """
    Criar o primeiro ADMIN_SITE (apenas uma vez).
    
    Validação:
    - Sistema deve estar vazio (sem ADMIN_SITE)
    - Se já existe um, operação é negada
    
    Retorna JWT do novo administrador.
    """
    try:
        # Verificar se já existe ADMIN_SITE definitivo
        admin_existe = db.query(UsuarioAdministrativo).filter(
            UsuarioAdministrativo.nivel_acesso == NivelAcessoAdmin.ADMIN_SITE,
            UsuarioAdministrativo.login != "Admin"
        ).first()

        if admin_existe:
            logger.warning("❌ Bootstrap: ADMIN_SITE já existe no sistema")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Sistema já foi configurado com um ADMIN_SITE"
            )

        # Buscar Admin bootstrap
        bootstrap_admin = db.query(UsuarioAdministrativo).filter(
            UsuarioAdministrativo.login == "Admin"
        ).first()

        # Validar login único (se mudar login)
        login_existe = db.query(UsuarioAdministrativo).filter(
            UsuarioAdministrativo.login == request.login
        ).first()
        if login_existe and (not bootstrap_admin or login_existe.id != bootstrap_admin.id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Login já existe no sistema"
            )

        if bootstrap_admin:
            # Atualizar bootstrap para admin definitivo
            bootstrap_admin.nome = request.nome
            bootstrap_admin.login = request.login
            bootstrap_admin.senha_hash = hash_password(request.senha)
            bootstrap_admin.email = request.email
            bootstrap_admin.telefone = request.telefone
            bootstrap_admin.whatsapp = request.whatsapp
            bootstrap_admin.nivel_acesso = NivelAcessoAdmin.ADMIN_SITE
            bootstrap_admin.ativo = True
            bootstrap_admin.atualizado_em = get_fortaleza_time()
            db.commit()
            db.refresh(bootstrap_admin)
            primeiro_admin = bootstrap_admin
        else:
            # Criar primeiro ADMIN_SITE (fallback)
            primeiro_admin = UsuarioAdministrativo(
                id=generate_temporal_id_with_microseconds('ADM'),
                nome=request.nome,
                login=request.login,
                senha_hash=hash_password(request.senha),
                email=request.email,
                telefone=request.telefone,
                whatsapp=request.whatsapp,
                nivel_acesso=NivelAcessoAdmin.ADMIN_SITE,
                paroquia_id=None,
                criado_por_id=None,
                ativo=True,
                criado_em=get_fortaleza_time(),
                atualizado_em=get_fortaleza_time()
            )
            db.add(primeiro_admin)
            db.commit()
            db.refresh(primeiro_admin)

        logger.info(f"✅ ADMIN_SITE configurado: {primeiro_admin.id}")
        
        # Gerar token para login automático
        access_token = create_access_token(
            data={
                "sub": primeiro_admin.id,
                "login": primeiro_admin.login,
                "nivel_acesso": primeiro_admin.nivel_acesso.value,
                "tipo": "usuario_administrativo"
            },
            expires_delta=timedelta(hours=24)
        )
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            usuario=primeiro_admin
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Erro ao fazer bootstrap: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao configurar sistema"
        )
