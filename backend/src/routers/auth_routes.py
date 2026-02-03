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
from src.models.models import UsuarioLegado, TipoUsuario, Paroquia, UsuarioComum, UsuarioAdministrativo, NivelAcessoAdmin
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
    db: Session = Depends(get_db)
):
    """
    DESCONTINUADO - Use a nova arquitetura de UsuarioAdministrativo
    """
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="Este endpoint foi descontinuado. Configure administradores através da nova arquitetura."
    )
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Este endpoint foi descontinuado. Configure administradores através da nova arquitetura."
        )


# ============================================================================
# NOVA ARQUITETURA: DOIS FLUXOS DE LOGIN SEPARADOS
# ============================================================================

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
    
    Processo:
    1. Validar campos
    2. Criar usuário em UsuarioComum
    3. Retornar JWT token
    4. (Futuramente) Enviar email de confirmação
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
    
    Processo:
    1. Buscar usuário por email
    2. Gerar token único (1 hora)
    3. Armazenar token em token_recuperacao e token_expiracao
    4. (Futuramente) Enviar email com link de reset
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
        import secrets
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
    - Retorna: sucesso ou erro
    
    Validações:
    - Token deve ser válido
    - Token não deve estar expirado
    - Senha nova é validada
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
    
    Processo:
    1. Verificar se usuário_atual é ADMIN_SITE
    2. Buscar admin por ID
    3. Gerar token de recuperação
    4. (Futuramente) Enviar email ao admin com token
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
        import secrets
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
