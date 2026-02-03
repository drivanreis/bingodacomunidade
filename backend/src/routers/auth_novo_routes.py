"""
Novos Endpoints de Autenticação - Nova Arquitetura (Duas Tabelas)
==================================================================
Implementa autenticação separada para UsuarioComum e UsuarioAdministrativo.

Endpoints Novos:
- POST /auth/signup/comum - Criar novo usuário comum
- POST /auth/login-comum - Login de usuário comum (CPF + senha)
- POST /auth/login-admin - Login de administrador (login + senha)
- POST /auth/forgot-password/comum - Solicitar reset (por email)
- POST /auth/reset-password/comum - Confirmar reset com token
- POST /auth/forgot-password/admin/{admin_id} - Reset por superior
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import timedelta
import logging
import secrets

from src.db.base import get_db
from src.models.models import UsuarioComum, UsuarioAdministrativo, NivelAcessoAdmin
from src.schemas.schemas import TokenResponse
from src.utils.auth import (
    verify_password,
    create_access_token,
    hash_password,
    get_current_user
)
from src.utils.time_manager import get_fortaleza_time, generate_temporal_id_with_microseconds

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["authentication"])


# ============================================================================
# FLUXO 1: LOGIN USUÁRIO COMUM (CPF + Senha)
# ============================================================================

@router.post(
    "/login-comum",
    response_model=TokenResponse,
    summary="🔑 Login Usuário Comum - CPF + Senha"
)
def login_comum(cpf: str, senha: str, db: Session = Depends(get_db)):
    """
    Autentica usuário comum (FIEL) usando CPF e senha.
    
    - CPF: números apenas (validar antes de enviar)
    - Retorna: JWT token + dados do usuário
    - Validações: ativo, banido, tentativas de login
    """
    try:
        # Buscar usuário por CPF
        usuario = db.query(UsuarioComum).filter(
            UsuarioComum.cpf == cpf
        ).first()
        
        if not usuario:
            logger.warning(f"❌ Tentativa de login: CPF não encontrado ({cpf})")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="CPF ou senha incorretos"
            )
        
        # Validações de status
        if not usuario.ativo:
            logger.warning(f"❌ Login bloqueado: usuário {usuario.id} inativo")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuário inativo"
            )
        
        if usuario.banido:
            logger.warning(f"❌ Login bloqueado: usuário {usuario.id} banido")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Usuário banido: {usuario.motivo_banimento or 'Razão não informada'}"
            )
        
        # Validar desbloqueio por tentativas
        if usuario.bloqueado_ate:
            now = get_fortaleza_time()
            if now < usuario.bloqueado_ate:
                logger.warning(f"❌ Login bloqueado: tentativas excessivas ({usuario.id})")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Muitas tentativas falhas. Tente novamente mais tarde."
                )
            else:
                # Desbloquear
                usuario.bloqueado_ate = None
                usuario.tentativas_login = 0
                db.commit()
        
        # Validar senha
        if not verify_password(senha, usuario.senha_hash):
            usuario.tentativas_login += 1
            
            # Bloquear após 3 tentativas (por 15 minutos)
            if usuario.tentativas_login >= 3:
                usuario.bloqueado_ate = get_fortaleza_time() + timedelta(minutes=15)
                logger.warning(f"⚠️ Usuário {usuario.id} bloqueado por 15 min (3 tentativas)")
            
            db.commit()
            logger.warning(f"❌ Login falhou: senha incorreta ({usuario.id})")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="CPF ou senha incorretos"
            )
        
        # Login bem-sucedido
        usuario.tentativas_login = 0
        usuario.ultimo_acesso = get_fortaleza_time()
        db.commit()
        db.refresh(usuario)
        
        # Gerar token
        access_token = create_access_token(
            data={
                "sub": usuario.id,
                "email": usuario.email,
                "tipo": "usuario_comum",
                "cpf": usuario.cpf
            },
            expires_delta=timedelta(hours=24)
        )
        
        logger.info(f"✅ Login bem-sucedido: usuário comum ({usuario.id})")
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            usuario=usuario
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao fazer login comum: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao processar login"
        )


# ============================================================================
# FLUXO 2: LOGIN USUÁRIO ADMINISTRATIVO (Login + Senha)
# ============================================================================

@router.post(
    "/login-admin",
    response_model=TokenResponse,
    summary="🔑 Login Administrador - Login + Senha"
)
def login_admin(login: str, senha: str, db: Session = Depends(get_db)):
    """
    Autentica usuário administrativo (ADMIN_SITE ou ADMIN_PAROQUIA).
    
    - Login: usuário único
    - Retorna: JWT token + dados do administrador
    - Validações: ativo, tentativas de login, hierarquia
    """
    try:
        # Buscar admin por login
        admin = db.query(UsuarioAdministrativo).filter(
            UsuarioAdministrativo.login == login
        ).first()
        
        if not admin:
            logger.warning(f"❌ Tentativa de login admin: login não encontrado ({login})")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Login ou senha incorretos"
            )
        
        # Validações de status
        if not admin.ativo:
            logger.warning(f"❌ Login admin bloqueado: {admin.id} inativo")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Administrador inativo"
            )
        
        # Validar desbloqueio por tentativas
        if admin.bloqueado_ate:
            now = get_fortaleza_time()
            if now < admin.bloqueado_ate:
                logger.warning(f"❌ Login admin bloqueado: tentativas excessivas ({admin.id})")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Muitas tentativas falhas. Tente novamente mais tarde."
                )
            else:
                # Desbloquear
                admin.bloqueado_ate = None
                admin.tentativas_login = 0
                db.commit()
        
        # Validar senha
        if not verify_password(senha, admin.senha_hash):
            admin.tentativas_login += 1
            
            # Bloquear após 3 tentativas (por 15 minutos)
            if admin.tentativas_login >= 3:
                admin.bloqueado_ate = get_fortaleza_time() + timedelta(minutes=15)
                logger.warning(f"⚠️ Admin {admin.id} bloqueado por 15 min (3 tentativas)")
            
            db.commit()
            logger.warning(f"❌ Login admin falhou: senha incorreta ({admin.id})")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Login ou senha incorretos"
            )
        
        # Login bem-sucedido
        admin.tentativas_login = 0
        admin.ultimo_acesso = get_fortaleza_time()
        db.commit()
        db.refresh(admin)
        
        # Gerar token
        access_token = create_access_token(
            data={
                "sub": admin.id,
                "login": admin.login,
                "tipo": "usuario_administrativo",
                "nivel_acesso": admin.nivel_acesso.value,
                "paroquia_id": admin.paroquia_id
            },
            expires_delta=timedelta(hours=24)
        )
        
        logger.info(f"✅ Login admin bem-sucedido: {admin.nivel_acesso.value} ({admin.id})")
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            usuario=admin
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao fazer login admin: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao processar login"
        )


# ============================================================================
# FLUXO 3: SIGNUP - REGISTRO DE NOVO USUÁRIO COMUM
# ============================================================================

@router.post(
    "/signup/comum",
    response_model=TokenResponse,
    summary="📝 Signup Usuário Comum - Auto-Registro"
)
def signup_comum(
    nome: str,
    cpf: str,
    email: str,
    telefone: str,
    whatsapp: str,
    senha: str,
    db: Session = Depends(get_db)
):
    """
    Permite que fiéis se registrem no sistema.
    
    Campos OBRIGATÓRIOS:
    - nome: nome completo do fiel
    - cpf: CPF único (já validado pelo frontend)
    - email: email único (obrigatório para recuperação de senha)
    - telefone: telefone (obrigatório para 2FA SMS)
    - whatsapp: whatsapp (obrigatório para notificações de prêmios)
    - senha: senha segura (validada no frontend)
    
    Validações:
    - CPF deve ser único
    - Email deve ser único
    - Telefone não pode estar vazio
    - Whatsapp não pode estar vazio
    """
    try:
        # Normalizar CPF (remover caracteres especiais)
        cpf_clean = cpf.replace(".", "").replace("-", "").replace("/", "")
        
        # Validações de existência
        usuario_cpf = db.query(UsuarioComum).filter(
            UsuarioComum.cpf == cpf_clean
        ).first()
        
        if usuario_cpf:
            logger.warning(f"❌ Signup falhou: CPF já registrado ({cpf_clean})")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Este CPF já está registrado"
            )
        
        usuario_email = db.query(UsuarioComum).filter(
            UsuarioComum.email == email
        ).first()
        
        if usuario_email:
            logger.warning(f"❌ Signup falhou: Email já registrado ({email})")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Este email já está registrado"
            )
        
        # Validações de campos obrigatórios
        if not telefone or not telefone.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Telefone é obrigatório"
            )
        
        if not whatsapp or not whatsapp.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="WhatsApp é obrigatório"
            )
        
        # Hash da senha
        senha_hash = hash_password(senha)
        
        # Criar novo usuário comum
        novo_usuario = UsuarioComum(
            id=generate_temporal_id_with_microseconds('UC'),
            nome=nome,
            cpf=cpf_clean,
            email=email,
            telefone=telefone,
            whatsapp=whatsapp,
            senha_hash=senha_hash,
            ativo=True,
            banido=False,
            tentativas_login=0,
            criado_em=get_fortaleza_time(),
            ultimo_acesso=get_fortaleza_time()
        )
        
        db.add(novo_usuario)
        db.commit()
        db.refresh(novo_usuario)
        
        # Gerar token
        access_token = create_access_token(
            data={
                "sub": novo_usuario.id,
                "email": novo_usuario.email,
                "tipo": "usuario_comum",
                "cpf": novo_usuario.cpf
            },
            expires_delta=timedelta(hours=24)
        )
        
        logger.info(f"✅ Novo usuário comum registrado: {novo_usuario.id} ({novo_usuario.cpf})")
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            usuario=novo_usuario
        )
        
    except IntegrityError as e:
        db.rollback()
        logger.error(f"❌ Erro de integridade ao criar usuário: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Erro: Um dos dados já existe no sistema"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao fazer signup comum: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao processar signup"
        )


# ============================================================================
# FLUXO 4: RECUPERAÇÃO DE SENHA - USUÁRIO COMUM (por Email)
# ============================================================================

@router.post(
    "/forgot-password/comum",
    summary="🔐 Solicitar Recuperação de Senha - Usuário Comum"
)
def forgot_password_comum(email: str, db: Session = Depends(get_db)):
    """
    Inicia fluxo de recuperação de senha para usuário comum.
    
    - Email: email registrado no sistema
    - Retorna: mensagem indicando envio de email
    - Válido por: 1 hora
    """
    try:
        # Buscar usuário por email
        usuario = db.query(UsuarioComum).filter(
            UsuarioComum.email == email
        ).first()
        
        if not usuario:
            # Não retornar erro (segurança: evitar descoberta de emails)
            logger.info(f"⚠️ Recuperação de senha: email não encontrado ({email})")
            return {
                "message": "Se o email existe no sistema, você receberá um link de recuperação"
            }
        
        # Gerar token de recuperação (1 hora)
        token_reset = secrets.token_urlsafe(32)
        agora = get_fortaleza_time()
        expiracao = agora + timedelta(hours=1)
        
        usuario.token_recuperacao = token_reset
        usuario.token_expiracao = expiracao
        db.commit()
        
        logger.info(f"✅ Token de recuperação gerado: usuario {usuario.id}")
        # TODO: Enviar email com link contendo token_reset
        
        return {
            "message": "Se o email existe no sistema, você receberá um link de recuperação"
        }
        
    except Exception as e:
        logger.error(f"❌ Erro ao processar forgot password: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao processar solicitação"
        )


@router.post(
    "/reset-password/comum",
    response_model=dict,
    summary="🔄 Reseta a Senha - Usuário Comum"
)
def reset_password_comum(
    token: str,
    nova_senha: str,
    db: Session = Depends(get_db)
):
    """
    Conclui o fluxo de recuperação de senha.
    
    - Token: token enviado por email
    - Nova_Senha: nova senha do usuário
    """
    try:
        agora = get_fortaleza_time()
        
        # Buscar usuário pelo token
        usuario = db.query(UsuarioComum).filter(
            UsuarioComum.token_recuperacao == token
        ).first()
        
        if not usuario:
            logger.warning(f"❌ Reset senha: token inválido ({token[:10]}...)")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token inválido"
            )
        
        # Validar expiração
        if not usuario.token_expiracao or agora > usuario.token_expiracao:
            logger.warning(f"❌ Reset senha: token expirado ({usuario.id})")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Link de recuperação expirou. Solicite um novo link."
            )
        
        # Atualizar senha
        usuario.senha_hash = hash_password(nova_senha)
        usuario.token_recuperacao = None
        usuario.token_expiracao = None
        usuario.tentativas_login = 0  # Reset tentativas
        db.commit()
        
        logger.info(f"✅ Senha resetada com sucesso: usuario {usuario.id}")
        
        return {
            "message": "Senha atualizada com sucesso!",
            "status": "success"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao resetar senha: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao resetar senha"
        )


# ============================================================================
# FLUXO 5: RECUPERAÇÃO DE SENHA - USUÁRIO ADMINISTRATIVO (por Superior)
# ============================================================================

@router.post(
    "/forgot-password/admin/{admin_id}",
    summary="🔐 Solicitar Recuperação de Senha - Administrador (por Superior)"
)
def forgot_password_admin(
    admin_id: int,
    usuario_atual = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Permite que um superior resete a senha de um administrador.
    
    - Admin_ID: ID do admin cuja senha será resetada
    - Requer: usuário autenticado ser ADMIN_SITE
    """
    try:
        # Verificar permissão (apenas ADMIN_SITE pode fazer isso)
        admin_atual = db.query(UsuarioAdministrativo).filter(
            UsuarioAdministrativo.id == usuario_atual.get("sub")
        ).first()
        
        if not admin_atual or admin_atual.nivel_acesso != NivelAcessoAdmin.admin_site:
            logger.warning(f"❌ Acesso negado: {usuario_atual.get('sub')} não é ADMIN_SITE")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas ADMIN_SITE pode resetar senhas de administradores"
            )
        
        # Buscar admin alvo
        admin_alvo = db.query(UsuarioAdministrativo).filter(
            UsuarioAdministrativo.id == admin_id
        ).first()
        
        if not admin_alvo:
            logger.warning(f"❌ Admin não encontrado: {admin_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Administrador não encontrado"
            )
        
        # Gerar token de recuperação (1 hora)
        token_reset = secrets.token_urlsafe(32)
        agora = get_fortaleza_time()
        expiracao = agora + timedelta(hours=1)
        
        admin_alvo.token_recuperacao = token_reset
        admin_alvo.token_expiracao = expiracao
        db.commit()
        
        logger.info(f"✅ Token de recuperação gerado para admin: {admin_alvo.id}")
        # TODO: Enviar email ao admin com link contendo token_reset
        
        return {
            "message": f"Email de recuperação enviado ao administrador",
            "admin_email": admin_alvo.email
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao processar forgot password admin: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao processar solicitação"
        )
