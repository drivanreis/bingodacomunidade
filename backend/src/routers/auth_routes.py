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

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from datetime import timedelta
import re
import logging
import secrets
import asyncio
import hashlib

from src.db.base import get_db
from src.models.models import UsuarioComum
from src.models.models import UsuarioAdministrativo
from src.models.models import AdminSiteUser
from src.models.models import UsuarioParoquia
from src.models.models import RoleParoquia
from src.models.models import RoleParoquiaCodigo
from src.models.models import TentativaCadastroDispositivo
from src.models.models import NivelAcessoAdmin
from src.models.models import Paroquia
from src.models.models import Configuracao
from src.models.models import TipoConfiguracao
from src.models.models import CategoriaConfiguracao
from src.schemas.schemas import SignupFielRequest
from src.schemas.schemas import LoginFielRequest
from src.schemas.schemas import ForgotPasswordRequest
from src.schemas.schemas import ResetPasswordRequest
from src.schemas.schemas import AdminSiteLoginRequest
from src.schemas.schemas import AdminParoquiaLoginRequest
from src.schemas.schemas import AdminInitialPasswordChangeRequest
from src.schemas.schemas import TokenResponse
from src.schemas.schemas import CreateAdminSiteRequest
from src.schemas.schemas import CreateAdminParoquiaRequest
from src.schemas.schemas import ChangeOwnAdminSitePasswordRequest
from src.schemas.schemas import SetAdminSitePasswordRequest
from src.utils.auth import (
    verify_password,
    create_access_token,
    hash_password,
    get_current_user
)
from src.utils.time_manager import get_fortaleza_time, generate_temporal_id_with_microseconds, FORTALEZA_TZ
from src.utils.email_service import email_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Autenticação"])

# --- BLOQUEIO GLOBAL POR BOOTSTRAP EXPIRADO ---
def check_bootstrap_block(db: Session):
    bootstrap = db.query(UsuarioAdministrativo).filter(
        UsuarioAdministrativo.login == "Admin",
        UsuarioAdministrativo.ativo == True
    ).first()
    if bootstrap:
        criado_em = bootstrap.criado_em
        if criado_em and criado_em.tzinfo is None:
            criado_em = FORTALEZA_TZ.localize(criado_em)
        agora = get_fortaleza_time()
        if (agora - criado_em).days >= 30:
            return True
    return False


def is_public_maintenance_active(db: Session) -> bool:
    role_admin = db.query(RoleParoquia).filter(
        RoleParoquia.codigo == RoleParoquiaCodigo.ADMIN.value,
        RoleParoquia.ativo == True,
    ).first()

    admin_paroquia_novo = None
    if role_admin:
        admin_paroquia_novo = db.query(UsuarioParoquia).filter(
            UsuarioParoquia.role_id == role_admin.id,
            UsuarioParoquia.ativo == True
        ).first()

    admin_paroquia_legado = db.query(UsuarioAdministrativo).filter(
        UsuarioAdministrativo.nivel_acesso == NivelAcessoAdmin.ADMIN_PAROQUIA,
        UsuarioAdministrativo.ativo == True
    ).first()

    return (admin_paroquia_novo is None) and (admin_paroquia_legado is None)


def ensure_public_access_enabled(db: Session):
    if is_public_maintenance_active(db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sistema em manutenção: acesso público liberado apenas após configuração do primeiro Admin-Paróquia."
        )


def normalize_admin_site_identity(email: str, nome: str | None = None):
    email_norm = email.strip().lower()
    nome_norm = (nome or "").strip()
    return {
        "nome": nome_norm if len(nome_norm) >= 3 else "Admin Site",
        "login": email_norm,
        "email": email_norm,
    }


def normalize_cpf(cpf: str | None) -> str:
    return re.sub(r'\D', '', cpf or '')[:11]


def normalize_phone(phone: str | None) -> str:
    digits = re.sub(r'\D', '', phone or '')
    if digits.startswith('55') and len(digits) in (12, 13):
        digits = digits[2:]
    return digits[:12]


def find_admin_site_conflict(db: Session, *, email: str, telefone: str, cpf: str):
    email_norm = (email or '').strip().lower()
    telefone_norm = normalize_phone(telefone)
    cpf_norm = normalize_cpf(cpf)

    novos = db.query(AdminSiteUser).all()
    legados = db.query(UsuarioAdministrativo).filter(
        UsuarioAdministrativo.nivel_acesso == NivelAcessoAdmin.ADMIN_SITE,
    ).all()

    for row in [*novos, *legados]:
        row_email = (row.email or '').strip().lower()
        row_phone = normalize_phone(getattr(row, 'telefone', None))
        row_cpf = normalize_cpf(getattr(row, 'cpf', None))

        if email_norm and row_email and row_email == email_norm:
            return "email"
        if telefone_norm and row_phone and row_phone == telefone_norm:
            return "telefone"
        if cpf_norm and row_cpf and row_cpf == cpf_norm:
            return "cpf"

    return None


def normalize_device_fingerprint(raw_value: str | None) -> str:
    value = (raw_value or "").strip().lower()
    if not value:
        return ""
    value = re.sub(r"[^a-z0-9:_\-\.]+", "", value)
    return value[:128]


def build_fallback_device_fingerprint(http_request: Request) -> str:
    ua = (http_request.headers.get("user-agent") or "").strip().lower()
    lang = (http_request.headers.get("accept-language") or "").strip().lower()
    platform = (http_request.headers.get("sec-ch-ua-platform") or "").strip().lower()
    mobile = (http_request.headers.get("sec-ch-ua-mobile") or "").strip().lower()
    base = f"{ua}|{lang}|{platform}|{mobile}"
    if not base.replace("|", ""):
        return "anon-device"
    return hashlib.sha256(base.encode("utf-8")).hexdigest()[:64]


def enforce_signup_device_rate_limit(db: Session, device_fingerprint: str):
    agora = get_fortaleza_time()
    janela_inicio = agora - timedelta(minutes=20)
    tentativas = db.query(TentativaCadastroDispositivo).filter(
        TentativaCadastroDispositivo.device_fingerprint == device_fingerprint,
        TentativaCadastroDispositivo.criado_em >= janela_inicio,
    ).count()

    if tentativas >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Dispositivo bloqueado temporariamente: limite de 5 cadastros em 20 minutos"
        )


def registrar_tentativa_signup(db: Session, device_fingerprint: str, sucesso: bool = False):
    db.add(TentativaCadastroDispositivo(
        id=generate_temporal_id_with_microseconds('DEV'),
        device_fingerprint=device_fingerprint,
        sucesso=bool(sucesso),
        criado_em=get_fortaleza_time(),
    ))


def get_current_admin_site_actor(db: Session, user_id: str):
    admin_site = db.query(AdminSiteUser).filter(AdminSiteUser.id == user_id).first()
    if admin_site:
        return "new", admin_site

    legacy = db.query(UsuarioAdministrativo).filter(
        UsuarioAdministrativo.id == user_id,
        UsuarioAdministrativo.nivel_acesso == NivelAcessoAdmin.ADMIN_SITE,
    ).first()
    if legacy:
        return "legacy", legacy
    return None, None


def get_admin_site_by_id_any(db: Session, admin_id: str):
    admin_new = db.query(AdminSiteUser).filter(AdminSiteUser.id == admin_id).first()
    if admin_new:
        return "new", admin_new

    admin_legacy = db.query(UsuarioAdministrativo).filter(
        UsuarioAdministrativo.id == admin_id,
        UsuarioAdministrativo.nivel_acesso == NivelAcessoAdmin.ADMIN_SITE,
    ).first()
    if admin_legacy:
        return "legacy", admin_legacy
    return None, None


def list_admin_site_any(db: Session):
    novos = db.query(AdminSiteUser).all()
    legados = db.query(UsuarioAdministrativo).filter(
        UsuarioAdministrativo.nivel_acesso == NivelAcessoAdmin.ADMIN_SITE,
    ).all()

    por_id = {a.id: ("new", a) for a in novos}
    for l in legados:
        if l.id not in por_id:
            por_id[l.id] = ("legacy", l)

    return sorted(
        por_id.values(),
        key=lambda item: item[1].criado_em or get_fortaleza_time(),
        reverse=True,
    )


def count_admin_site_ativos_any(db: Session, excluding_id: str | None = None) -> int:
    ativos_novos = db.query(AdminSiteUser).filter(AdminSiteUser.ativo == True).all()
    ativos_legados = db.query(UsuarioAdministrativo).filter(
        UsuarioAdministrativo.nivel_acesso == NivelAcessoAdmin.ADMIN_SITE,
        UsuarioAdministrativo.ativo == True,
    ).all()

    ids = {a.id for a in ativos_novos}
    ids.update({a.id for a in ativos_legados})

    if excluding_id:
        ids.discard(excluding_id)
    return len(ids)


def get_current_admin_paroquia_actor(db: Session, user_id: str):
    usuario_paroquia = db.query(UsuarioParoquia).filter(
        UsuarioParoquia.id == user_id,
        UsuarioParoquia.ativo == True,
    ).first()
    if usuario_paroquia:
        return "new", usuario_paroquia

    legacy = db.query(UsuarioAdministrativo).filter(
        UsuarioAdministrativo.id == user_id,
        UsuarioAdministrativo.nivel_acesso == NivelAcessoAdmin.ADMIN_PAROQUIA,
        UsuarioAdministrativo.ativo == True,
    ).first()
    if legacy:
        return "legacy", legacy
    return None, None


def build_admin_site_token_response_user(admin):
    return {
        "id": admin.id,
        "nome": admin.nome,
        "login": admin.login,
        "email": admin.email,
        "cpf": getattr(admin, "cpf", None),
        "whatsapp": admin.whatsapp,
        "nivel_acesso": "admin_site",
        "tipo": "usuario_administrativo",
        "paroquia_id": None,
        "ativo": bool(admin.ativo),
        "criado_em": admin.criado_em,
        "ultimo_acesso": admin.ultimo_acesso,
    }


def build_admin_paroquia_token_response_user(admin, nivel_acesso: str = "admin_paroquia"):
    return {
        "id": admin.id,
        "nome": admin.nome,
        "login": admin.login,
        "email": admin.email,
        "whatsapp": admin.whatsapp,
        "nivel_acesso": nivel_acesso,
        "tipo": "usuario_administrativo",
        "paroquia_id": admin.paroquia_id,
        "ativo": bool(admin.ativo),
        "criado_em": admin.criado_em,
        "ultimo_acesso": admin.ultimo_acesso,
    }


def admin_site_password_pending_key(admin_id: str) -> str:
    return f"admin_site_initial_password_pending::{admin_id}"


def admin_password_pending_key(admin_id: str) -> str:
    return f"admin_initial_password_pending::{admin_id}"


def is_admin_password_pending(db: Session, admin_id: str) -> bool:
    key_generic = admin_password_pending_key(admin_id)
    key_legacy_site = admin_site_password_pending_key(admin_id)

    rows = db.query(Configuracao).filter(
        Configuracao.chave.in_([key_generic, key_legacy_site])
    ).all()

    for row in rows:
        if (row.valor or "").strip().lower() == "true":
            return True
    return False


def set_admin_password_pending(db: Session, admin_id: str, pending: bool):
    chave = admin_password_pending_key(admin_id)
    registro = db.query(Configuracao).filter(Configuracao.chave == chave).first()
    if not registro:
        registro = Configuracao(
            chave=chave,
            valor="true" if pending else "false",
            tipo=TipoConfiguracao.BOOLEAN,
            categoria=CategoriaConfiguracao.SEGURANCA,
            descricao="Conta administrativa com senha temporária pendente de troca",
        )
        db.add(registro)
    else:
        registro.valor = "true" if pending else "false"
        registro.alterado_em = get_fortaleza_time()


def set_admin_site_password_pending(db: Session, admin_id: str, pending: bool):
    set_admin_password_pending(db, admin_id, pending)

    chave_legacy = admin_site_password_pending_key(admin_id)
    registro_legacy = db.query(Configuracao).filter(Configuracao.chave == chave_legacy).first()
    if not registro_legacy:
        registro_legacy = Configuracao(
            chave=chave_legacy,
            valor="true" if pending else "false",
            tipo=TipoConfiguracao.BOOLEAN,
            categoria=CategoriaConfiguracao.SEGURANCA,
            descricao="Conta Admin-Site com senha inicial pendente de troca",
        )
        db.add(registro_legacy)
    else:
        registro_legacy.valor = "true" if pending else "false"
        registro_legacy.alterado_em = get_fortaleza_time()


DDD_UF_MAP = {
    "11": "SP", "12": "SP", "13": "SP", "14": "SP", "15": "SP", "16": "SP", "17": "SP", "18": "SP", "19": "SP",
    "21": "RJ", "22": "RJ", "24": "RJ",
    "27": "ES", "28": "ES",
    "31": "MG", "32": "MG", "33": "MG", "34": "MG", "35": "MG", "37": "MG", "38": "MG",
    "41": "PR", "42": "PR", "43": "PR", "44": "PR", "45": "PR", "46": "PR",
    "47": "SC", "48": "SC", "49": "SC",
    "51": "RS", "53": "RS", "54": "RS", "55": "RS",
    "61": "DF",
    "62": "GO", "64": "GO",
    "63": "TO",
    "65": "MT", "66": "MT",
    "67": "MS",
    "68": "AC",
    "69": "RO",
    "71": "BA", "73": "BA", "74": "BA", "75": "BA", "77": "BA",
    "79": "SE",
    "81": "PE", "87": "PE",
    "82": "AL",
    "83": "PB",
    "84": "RN",
    "85": "CE", "88": "CE",
    "86": "PI", "89": "PI",
    "91": "PA", "93": "PA", "94": "PA",
    "92": "AM", "97": "AM",
    "95": "RR",
    "96": "AP",
    "98": "MA", "99": "MA",
}


def extract_ddd_from_contact(contact_value: str) -> str | None:
    digits = re.sub(r"\D", "", contact_value or "")
    if digits.startswith("55") and len(digits) >= 12:
        digits = digits[2:]
    if len(digits) < 10:
        return None
    return digits[:2]


def ensure_signup_uf_allowed(db: Session, request: SignupFielRequest):
    config = db.query(Configuracao).filter(Configuracao.chave == "signup_ufs_permitidas").first()
    if not config or not config.valor or config.valor.upper() == "ALL":
        return

    ddd = extract_ddd_from_contact(request.whatsapp or request.telefone)
    if not ddd:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="DDD invalido"
        )

    uf = DDD_UF_MAP.get(ddd)
    if not uf:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="DDD invalido"
        )

    ufs_permitidas = {item.strip().upper() for item in config.valor.split(",") if item.strip()}
    if uf not in ufs_permitidas:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cadastro público bloqueado para o estado {uf} nesta paróquia"
        )


@router.post(
    "/bootstrap/login",
    response_model=dict,
    summary="🔧 Login Bootstrap - Admin Seed de Instalação"
)
def bootstrap_login(request: AdminSiteLoginRequest, db: Session = Depends(get_db)):
    """
    Login exclusivo para o usuário seed de instalação (Admin/admin123).
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

        if not bootstrap.ativo:
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


@router.get(
    "/bootstrap/status",
    response_model=dict,
    summary="📊 Status do Bootstrap de Instalação"
)
def bootstrap_status(db: Session = Depends(get_db)):
    """
    Retorna se o usuário bootstrap ainda está ativo.
    Usado pela UI para exibir/ocultar credenciais temporárias de primeiro acesso.
    """
    bootstrap = db.query(UsuarioAdministrativo).filter(
        UsuarioAdministrativo.login == "Admin",
        UsuarioAdministrativo.ativo == True
    ).first()

    if not bootstrap:
        return {
            "bootstrap_available": False,
            "dias_restantes": 0,
            "message": "Primeiro acesso já concluído"
        }

    agora = get_fortaleza_time()
    criado_em = bootstrap.criado_em
    if criado_em and criado_em.tzinfo is None:
        criado_em = FORTALEZA_TZ.localize(criado_em)
    dias_desde = (agora - criado_em).days if criado_em else 0
    dias_restantes = max(0, 30 - dias_desde)

    return {
        "bootstrap_available": True,
        "dias_restantes": dias_restantes,
        "message": "Primeiro acesso pendente"
    }


@router.get(
    "/public-status",
    response_model=dict,
    summary="📊 Status Público (Manutenção/Liberação)"
)
def public_status(db: Session = Depends(get_db)):
    maintenance_mode = is_public_maintenance_active(db)
    return {
        "maintenance_mode": maintenance_mode,
        "message": (
            "Acesso público bloqueado até configuração do primeiro Admin-Paróquia"
            if maintenance_mode
            else "Acesso público liberado"
        )
    }


# ============================================================================
# SEÇÃO 1: FLUXOS DE USUÁRIO COMUM (FIEL)
# ============================================================================

@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="📝 Cadastro Público - Novo FIEL"
)
def signup_fiel(request: SignupFielRequest, http_request: Request, db: Session = Depends(get_db)):
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
    ensure_public_access_enabled(db)
    ensure_signup_uf_allowed(db, request)
    try:
        fp_request = normalize_device_fingerprint(getattr(request, "device_fingerprint", None))
        fp_header = normalize_device_fingerprint(http_request.headers.get("x-device-fingerprint"))
        device_fingerprint = fp_request or fp_header

        if not device_fingerprint:
            device_fingerprint = build_fallback_device_fingerprint(http_request)

        enforce_signup_device_rate_limit(db, device_fingerprint)
        registrar_tentativa_signup(db, device_fingerprint, sucesso=False)

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

        tentativa_atual = db.query(TentativaCadastroDispositivo).filter(
            TentativaCadastroDispositivo.device_fingerprint == device_fingerprint
        ).order_by(TentativaCadastroDispositivo.criado_em.desc()).first()
        if tentativa_atual:
            tentativa_atual.sucesso = True
            db.commit()
        
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
            detail="Sistema bloqueado: a senha bootstrap expirou após 30 dias sem conclusão do cadastro real do Administrador."
        )
    ensure_public_access_enabled(db)
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
    ensure_public_access_enabled(db)
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
    ensure_public_access_enabled(db)
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
            detail="Sistema bloqueado: a senha bootstrap expirou após 30 dias sem conclusão do cadastro real do Administrador."
        )
    try:
        role_admin = db.query(RoleParoquia).filter(
            RoleParoquia.codigo == RoleParoquiaCodigo.ADMIN.value,
            RoleParoquia.ativo == True,
        ).first()

        admin = None
        source = None

        if role_admin:
            admin = db.query(UsuarioParoquia).filter(
                UsuarioParoquia.role_id == role_admin.id,
                or_(
                    UsuarioParoquia.login == request.login,
                    UsuarioParoquia.email == request.login
                )
            ).first()
            if admin:
                source = "new"

        if not admin:
            admin = db.query(UsuarioAdministrativo).filter(
                or_(
                    UsuarioAdministrativo.login == request.login,
                    UsuarioAdministrativo.email == request.login
                )
            ).first()
            if admin:
                source = "legacy"
        
        if not admin:
            logger.warning(f"❌ Login admin: login não encontrado ({request.login})")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Login ou senha incorretos"
            )
        
        if source == "legacy" and admin.nivel_acesso != NivelAcessoAdmin.ADMIN_PAROQUIA:
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

        if is_admin_password_pending(db, admin.id):
            raise HTTPException(
                status_code=status.HTTP_428_PRECONDITION_REQUIRED,
                detail={
                    "message": "Troca obrigatória de senha temporária antes do acesso",
                    "needs_password_change": True,
                    "nivel_acesso": "admin_paroquia",
                    "login_hint": admin.login,
                }
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
                "nivel_acesso": "admin_paroquia",
                "paroquia_id": admin.paroquia_id,
                "tipo": "usuario_paroquia"
            },
            expires_delta=timedelta(hours=24)
        )
        
        logger.info(f"✅ Login Admin-Paroquia bem-sucedido: {admin.id}")
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            usuario=build_admin_paroquia_token_response_user(admin, "admin_paroquia")
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
            detail="Sistema bloqueado: a senha bootstrap expirou após 30 dias sem conclusão do cadastro real do Administrador."
        )
    try:
        admin = db.query(AdminSiteUser).filter(
            or_(
                AdminSiteUser.login == request.login,
                AdminSiteUser.email == request.login
            )
        ).first()
        source = "new" if admin else "legacy"

        if not admin:
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
        
        if source == "legacy" and admin.nivel_acesso != NivelAcessoAdmin.ADMIN_SITE:
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

        if is_admin_password_pending(db, admin.id):
            raise HTTPException(
                status_code=status.HTTP_428_PRECONDITION_REQUIRED,
                detail={
                    "message": "Troca obrigatória de senha temporária antes do acesso",
                    "needs_password_change": True,
                    "nivel_acesso": "admin_site",
                    "login_hint": admin.login,
                }
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
                "nivel_acesso": "admin_site",
                "tipo": "admin_site"
            },
            expires_delta=timedelta(hours=24)
        )
        
        logger.info(f"✅ Login Admin-Site bem-sucedido: {admin.id}")
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            usuario=build_admin_site_token_response_user(admin)
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
    "/admin-site/troca-senha-inicial",
    response_model=dict,
    summary="👑 Troca inicial de senha temporária (Admin-Site)"
)
def trocar_senha_inicial_admin_site(
    request: AdminInitialPasswordChangeRequest,
    db: Session = Depends(get_db)
):
    try:
        admin = db.query(UsuarioAdministrativo).filter(
            or_(
                UsuarioAdministrativo.login == request.login,
                UsuarioAdministrativo.email == request.login,
            ),
            UsuarioAdministrativo.nivel_acesso == NivelAcessoAdmin.ADMIN_SITE,
        ).first()

        if not admin:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Administrador do site não encontrado"
            )

        if not admin.ativo:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Administrador inativo"
            )

        if not verify_password(request.senha_atual, admin.senha_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Senha atual inválida"
            )

        if verify_password(request.nova_senha, admin.senha_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A nova senha deve ser diferente da senha atual"
            )

        admin.senha_hash = hash_password(request.nova_senha)
        admin.tentativas_login = 0
        admin.bloqueado_ate = None
        admin.atualizado_em = get_fortaleza_time()
        set_admin_site_password_pending(db, admin.id, False)
        db.commit()

        return {"message": "Senha alterada com sucesso. Faça login novamente."}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Erro na troca inicial de senha admin-site: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao trocar senha inicial"
        )


@router.post(
    "/admin-paroquia/troca-senha-inicial",
    response_model=dict,
    summary="🏛️ Troca inicial de senha temporária (Admin-Paróquia)"
)
def trocar_senha_inicial_admin_paroquia(
    request: AdminInitialPasswordChangeRequest,
    db: Session = Depends(get_db)
):
    try:
        admin = db.query(UsuarioAdministrativo).filter(
            or_(
                UsuarioAdministrativo.login == request.login,
                UsuarioAdministrativo.email == request.login,
            ),
            UsuarioAdministrativo.nivel_acesso == NivelAcessoAdmin.ADMIN_PAROQUIA,
        ).first()

        if not admin:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Administrador paroquial não encontrado"
            )

        if not admin.ativo:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Administrador inativo"
            )

        if not verify_password(request.senha_atual, admin.senha_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Senha atual inválida"
            )

        if verify_password(request.nova_senha, admin.senha_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A nova senha deve ser diferente da senha atual"
            )

        admin.senha_hash = hash_password(request.nova_senha)
        admin.tentativas_login = 0
        admin.bloqueado_ate = None
        admin.atualizado_em = get_fortaleza_time()
        set_admin_password_pending(db, admin.id, False)
        db.commit()

        return {"message": "Senha alterada com sucesso. Faça login novamente."}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Erro na troca inicial de senha admin-paroquia: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao trocar senha inicial"
        )

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
    - Identidade via Email (login derivado automaticamente)
    - Telefone para 2FA (SMS/WhatsApp)
    - Senha inicial (hash)
    
    Registra quem criou (criado_por_id).
    """
    try:
        # Verificar permissão
        _, admin_atual = get_current_admin_site_actor(db, usuario_atual.get("sub"))

        if not admin_atual:
            logger.warning(f"❌ Acesso negado: criar admin-site por {usuario_atual.get('sub')}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas ADMIN_SITE pode criar outros ADMIN_SITE"
            )
        
        nome_reserva = (request.nome or "").strip()
        if len(nome_reserva) < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nome/apelido do usuário de reserva é obrigatório (mínimo 3 caracteres)"
            )

        identidade = normalize_admin_site_identity(request.email, nome_reserva)
        telefone_norm = normalize_phone(request.telefone)
        whatsapp_norm = normalize_phone(request.whatsapp or request.telefone)
        cpf_norm = normalize_cpf(request.cpf)

        # Validar login único (novo + legado)
        login_existe = db.query(AdminSiteUser).filter(
            AdminSiteUser.login == identidade["login"]
        ).first()
        if not login_existe:
            login_existe = db.query(UsuarioAdministrativo).filter(
                UsuarioAdministrativo.login == identidade["login"],
                UsuarioAdministrativo.nivel_acesso == NivelAcessoAdmin.ADMIN_SITE,
            ).first()
        
        if login_existe:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Login já existe no sistema. No Admin-Site, o login é o e-mail informado."
            )

        conflito = find_admin_site_conflict(
            db,
            email=identidade["email"],
            telefone=telefone_norm,
            cpf=cpf_norm,
        )
        if conflito == "email":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="E-mail já cadastrado para outro Admin-Site"
            )
        if conflito == "telefone":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Telefone já cadastrado para outro Admin-Site"
            )
        if conflito == "cpf":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="CPF já cadastrado para outro Admin-Site"
            )

        # Criar novo ADMIN_SITE
        novo_admin = AdminSiteUser(
            id=generate_temporal_id_with_microseconds('ADM'),
            nome=identidade["nome"],
            login=identidade["login"],
            senha_hash=hash_password(request.senha),
            email=identidade["email"],
            cpf=cpf_norm,
            telefone=telefone_norm,
            whatsapp=whatsapp_norm,
            paroquia_referencia_id=None,
            criado_por_id=admin_atual.id,
            ativo=True,
            criado_em=get_fortaleza_time(),
            atualizado_em=get_fortaleza_time()
        )
        
        db.add(novo_admin)

        # Espelho legado para compatibilidade durante transição
        legado_admin = UsuarioAdministrativo(
            id=novo_admin.id,
            nome=novo_admin.nome,
            login=novo_admin.login,
            senha_hash=novo_admin.senha_hash,
            email=novo_admin.email,
            cpf=novo_admin.cpf,
            telefone=novo_admin.telefone,
            whatsapp=novo_admin.whatsapp,
            nivel_acesso=NivelAcessoAdmin.ADMIN_SITE,
            paroquia_id=None,
            ativo=bool(novo_admin.ativo),
            criado_por_id=admin_atual.id,
            criado_em=novo_admin.criado_em,
            atualizado_em=novo_admin.atualizado_em,
        )
        db.add(legado_admin)

        set_admin_site_password_pending(db, novo_admin.id, True)
        db.commit()
        db.refresh(novo_admin)
        
        logger.info(f"✅ Novo ADMIN_SITE criado: {novo_admin.id} por {admin_atual.id}")
        
        return {
            "message": "ADMIN_SITE criado com sucesso. Entregue a senha temporária ao usuário e solicite troca no primeiro login.",
            "admin_id": novo_admin.id,
            "login": novo_admin.login,
            "cpf": novo_admin.cpf,
            "email_sent": False,
            "credential_delivery": "manual",
            "ativo": bool(novo_admin.ativo),
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


@router.get(
    "/admin-site/admins",
    response_model=dict,
    summary="👑 Listar Admin-Site"
)
def listar_admins_site(
    usuario_atual = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lista contas ADMIN_SITE (incluindo ativas e inativas) para gestão de sucessão.
    """
    try:
        _, admin_atual = get_current_admin_site_actor(db, usuario_atual.get("sub"))

        if not admin_atual:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas ADMIN_SITE pode listar administradores do site"
            )

        admins_any = list_admin_site_any(db)

        pending_rows = db.query(Configuracao).filter(
            or_(
                Configuracao.chave.like("admin_site_initial_password_pending::%"),
                Configuracao.chave.like("admin_initial_password_pending::%")
            )
        ).all()
        pending_map = {
            row.chave.replace("admin_site_initial_password_pending::", "").replace("admin_initial_password_pending::", ""): (row.valor or "").strip().lower() == "true"
            for row in pending_rows
        }

        return {
            "admins": [
                {
                    "id": a.id,
                    "nome": a.nome,
                    "login": a.login,
                    "email": a.email,
                    "cpf": getattr(a, "cpf", None),
                    "telefone": a.telefone,
                    "whatsapp": a.whatsapp,
                    "ativo": bool(a.ativo),
                    "criado_por_id": a.criado_por_id,
                    "criado_em": a.criado_em.isoformat() if a.criado_em else None,
                    "is_current": a.id == admin_atual.id,
                    "can_resend_initial_password": bool(pending_map.get(a.id, False)),
                }
                for _, a in admins_any
            ],
            "current_admin_id": admin_atual.id,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao listar admins do site: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao listar administradores do site"
        )


@router.put(
    "/admin-site/admins/{admin_id}/status",
    response_model=dict,
    summary="👑 Ativar/Inativar Admin-Site"
)
def atualizar_status_admin_site(
    admin_id: str,
    ativo: bool,
    usuario_atual = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Permite ativar/inativar ADMIN_SITE para gestão de sucessão.
    """
    try:
        _, admin_atual = get_current_admin_site_actor(db, usuario_atual.get("sub"))

        if not admin_atual:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas ADMIN_SITE pode alterar status de administradores do site"
            )

        alvo_kind, admin_alvo = get_admin_site_by_id_any(db, admin_id)

        if not admin_alvo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Administrador do site não encontrado"
            )

        if not ativo and admin_alvo.id == admin_atual.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Você não pode inativar seu próprio usuário"
            )

        if not ativo:
            outros_ativos = count_admin_site_ativos_any(db, excluding_id=admin_alvo.id)

            if outros_ativos == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Não é possível inativar o último ADMIN_SITE ativo"
                )

        admin_alvo.ativo = ativo
        admin_alvo.atualizado_em = get_fortaleza_time()
        if alvo_kind == "new":
            espelho = db.query(UsuarioAdministrativo).filter(
                UsuarioAdministrativo.id == admin_alvo.id,
                UsuarioAdministrativo.nivel_acesso == NivelAcessoAdmin.ADMIN_SITE,
            ).first()
            if espelho:
                espelho.ativo = ativo
                espelho.atualizado_em = admin_alvo.atualizado_em
        else:
            espelho = db.query(AdminSiteUser).filter(AdminSiteUser.id == admin_alvo.id).first()
            if espelho:
                espelho.ativo = ativo
                espelho.atualizado_em = admin_alvo.atualizado_em
        db.commit()
        db.refresh(admin_alvo)

        return {
            "message": "Status atualizado com sucesso",
            "admin_id": admin_alvo.id,
            "ativo": bool(admin_alvo.ativo),
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Erro ao atualizar status de admin-site: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao atualizar status do administrador"
        )


@router.post(
    "/admin-site/minha-senha",
    response_model=dict,
    summary="👑 Alterar minha senha (Admin-Site)"
)
def alterar_minha_senha_admin_site(
    request: ChangeOwnAdminSitePasswordRequest,
    usuario_atual = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        _, admin_atual = get_current_admin_site_actor(db, usuario_atual.get("sub"))

        if not admin_atual:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas ADMIN_SITE pode alterar a própria senha"
            )

        if not verify_password(request.senha_atual, admin_atual.senha_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Senha atual inválida"
            )

        if verify_password(request.nova_senha, admin_atual.senha_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A nova senha deve ser diferente da senha atual"
            )

        admin_atual.senha_hash = hash_password(request.nova_senha)
        admin_atual.atualizado_em = get_fortaleza_time()
        set_admin_site_password_pending(db, admin_atual.id, False)
        db.commit()

        return {"message": "Senha alterada com sucesso"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Erro ao alterar senha do admin-site atual: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao alterar senha"
        )


@router.post(
    "/admin-site/admins/{admin_id}/definir-senha",
    response_model=dict,
    summary="👑 Definir senha de substituto (Admin-Site)"
)
def definir_senha_admin_site(
    admin_id: str,
    request: SetAdminSitePasswordRequest,
    usuario_atual = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        _, admin_atual = get_current_admin_site_actor(db, usuario_atual.get("sub"))

        if not admin_atual:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas ADMIN_SITE pode definir senha de administradores do site"
            )

        alvo_kind, admin_alvo = get_admin_site_by_id_any(db, admin_id)

        if not admin_alvo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Administrador do site não encontrado"
            )

        if admin_alvo.id == admin_atual.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Para trocar a própria senha, use o endpoint de alteração da sua conta"
            )

        admin_alvo.senha_hash = hash_password(request.nova_senha)
        admin_alvo.atualizado_em = get_fortaleza_time()
        if alvo_kind == "new":
            espelho = db.query(UsuarioAdministrativo).filter(
                UsuarioAdministrativo.id == admin_alvo.id,
                UsuarioAdministrativo.nivel_acesso == NivelAcessoAdmin.ADMIN_SITE,
            ).first()
            if espelho:
                espelho.senha_hash = admin_alvo.senha_hash
                espelho.atualizado_em = admin_alvo.atualizado_em
        else:
            espelho = db.query(AdminSiteUser).filter(AdminSiteUser.id == admin_alvo.id).first()
            if espelho:
                espelho.senha_hash = admin_alvo.senha_hash
                espelho.atualizado_em = admin_alvo.atualizado_em
        set_admin_site_password_pending(db, admin_alvo.id, True)
        db.commit()

        return {
            "message": "Senha do administrador atualizada com sucesso",
            "admin_id": admin_alvo.id,
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Erro ao definir senha de admin-site: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao definir senha do administrador"
        )


@router.post(
    "/admin-site/admins/{admin_id}/reenviar-senha",
    response_model=dict,
    summary="👑 Reenviar senha inicial de Admin-Site"
)
def reenviar_senha_admin_site(
    admin_id: str,
    usuario_atual = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Regera senha temporária para um ADMIN_SITE e envia por e-mail.
    Útil para casos em que a senha inicial anterior não foi entregue.
    """
    try:
        _, admin_atual = get_current_admin_site_actor(db, usuario_atual.get("sub"))

        if not admin_atual:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas ADMIN_SITE pode reenviar senha de administradores do site"
            )

        alvo_kind, admin_alvo = get_admin_site_by_id_any(db, admin_id)

        if not admin_alvo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Administrador do site não encontrado"
            )

        if not admin_alvo.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Administrador alvo não possui e-mail cadastrado"
            )

        email_dev_mode_config = db.query(Configuracao).filter(
            Configuracao.chave == "emailDevMode"
        ).first()
        smtp_validated_config = db.query(Configuracao).filter(
            Configuracao.chave == "smtpValidatedAt"
        ).first()

        email_dev_mode_valor = (
            (email_dev_mode_config.valor if email_dev_mode_config else "true")
            .strip()
            .lower()
        )
        email_dev_mode_ativo = email_dev_mode_valor in {"1", "true", "yes", "y", "on"}

        if email_dev_mode_ativo:
            raise HTTPException(
                status_code=status.HTTP_412_PRECONDITION_FAILED,
                detail="Para reenviar senha, configure emailDevMode=false e valide o SMTP com envio de teste."
            )

        if not smtp_validated_config or not (smtp_validated_config.valor or "").strip():
            raise HTTPException(
                status_code=status.HTTP_412_PRECONDITION_FAILED,
                detail="SMTP ainda não validado. Use o botão 'Testar e-mail' nas Configurações antes de reenviar senha."
            )

        charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*_-"
        senha_temporaria = "".join(secrets.choice(charset) for _ in range(18))

        email_enviado = asyncio.run(
            email_service.send_admin_site_initial_password(
                to_email=admin_alvo.email,
                user_name=admin_alvo.nome or "Admin Site",
                login=admin_alvo.login,
                temporary_password=senha_temporaria,
                db=db,
            )
        )

        if not email_enviado:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Não foi possível reenviar a senha por e-mail. Tente novamente."
            )

        admin_alvo.senha_hash = hash_password(senha_temporaria)
        admin_alvo.atualizado_em = get_fortaleza_time()
        if alvo_kind == "new":
            espelho = db.query(UsuarioAdministrativo).filter(
                UsuarioAdministrativo.id == admin_alvo.id,
                UsuarioAdministrativo.nivel_acesso == NivelAcessoAdmin.ADMIN_SITE,
            ).first()
            if espelho:
                espelho.senha_hash = admin_alvo.senha_hash
                espelho.atualizado_em = admin_alvo.atualizado_em
        else:
            espelho = db.query(AdminSiteUser).filter(AdminSiteUser.id == admin_alvo.id).first()
            if espelho:
                espelho.senha_hash = admin_alvo.senha_hash
                espelho.atualizado_em = admin_alvo.atualizado_em
        set_admin_site_password_pending(db, admin_alvo.id, True)
        db.commit()

        return {
            "message": "Senha temporária reenviada com sucesso por e-mail",
            "admin_id": admin_alvo.id,
            "email_sent": True,
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Erro ao reenviar senha de admin-site: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao reenviar senha do administrador"
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
        _, admin_atual = get_current_admin_site_actor(db, usuario_atual.get("sub"))

        if not admin_atual:
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
        login_existe = db.query(UsuarioParoquia).filter(
            UsuarioParoquia.login == request.login
        ).first()
        
        if login_existe:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Login já existe no sistema. No Admin-Site, o login é o e-mail informado."
            )
        
        # Criar novo ADMIN_PAROQUIA
        role_admin = db.query(RoleParoquia).filter(
            RoleParoquia.codigo == RoleParoquiaCodigo.ADMIN.value,
            RoleParoquia.ativo == True,
        ).first()

        if not role_admin:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role paroquia_admin não encontrada ou inativa"
            )

        novo_admin = UsuarioParoquia(
            id=generate_temporal_id_with_microseconds('ADM'),
            nome=request.nome,
            login=request.login,
            senha_hash=hash_password(request.senha),
            email=request.email,
            cpf=None,
            telefone=request.telefone,
            whatsapp=request.whatsapp,
            paroquia_id=request.paroquia_id,
            role_id=role_admin.id,
            criado_por_id=admin_atual.id,
            ativo=True,
            criado_em=get_fortaleza_time(),
            atualizado_em=get_fortaleza_time()
        )
        
        db.add(novo_admin)
        set_admin_password_pending(db, novo_admin.id, True)
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
        _, admin_atual = get_current_admin_paroquia_actor(db, usuario_atual.get("sub"))

        if not admin_atual:
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
        login_existe = db.query(UsuarioParoquia).filter(
            UsuarioParoquia.login == request.login
        ).first()
        
        if login_existe:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Login já existe no sistema"
            )
        
        # Criar novo ADMIN_PAROQUIA subordinado
        role_admin = db.query(RoleParoquia).filter(
            RoleParoquia.codigo == RoleParoquiaCodigo.ADMIN.value,
            RoleParoquia.ativo == True,
        ).first()

        if not role_admin:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role paroquia_admin não encontrada ou inativa"
            )

        novo_admin = UsuarioParoquia(
            id=generate_temporal_id_with_microseconds('ADM'),
            nome=request.nome,
            login=request.login,
            senha_hash=hash_password(request.senha),
            email=request.email,
            cpf=None,
            telefone=request.telefone,
            whatsapp=request.whatsapp,
            paroquia_id=request.paroquia_id,
            role_id=role_admin.id,
            criado_por_id=admin_atual.id,  # Hierarquia
            ativo=True,
            criado_em=get_fortaleza_time(),
            atualizado_em=get_fortaleza_time()
        )
        
        db.add(novo_admin)
        set_admin_password_pending(db, novo_admin.id, True)
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
        admin_existe_new = db.query(AdminSiteUser).first()
        admin_existe_legacy = db.query(UsuarioAdministrativo).filter(
            UsuarioAdministrativo.nivel_acesso == NivelAcessoAdmin.ADMIN_SITE,
            UsuarioAdministrativo.login != "Admin"
        ).first()
        admin_existe = admin_existe_new or admin_existe_legacy

        if admin_existe:
            logger.warning("❌ Bootstrap: ADMIN_SITE já existe no sistema")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Sistema já foi configurado com um ADMIN_SITE"
            )

        nome_bootstrap = (request.nome or "").strip()
        if len(nome_bootstrap) < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nome/apelido é obrigatório no primeiro acesso (mínimo 3 caracteres)"
            )

        identidade = normalize_admin_site_identity(request.email, nome_bootstrap)
        telefone_norm = normalize_phone(request.telefone)
        whatsapp_norm = normalize_phone(request.whatsapp or request.telefone)
        cpf_norm = normalize_cpf(request.cpf)

        # Login reservado para o seed de instalação
        if identidade["login"] == "admin":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Login reservado para usuário seed"
            )

        # Buscar Admin bootstrap
        bootstrap_admin = db.query(UsuarioAdministrativo).filter(
            UsuarioAdministrativo.login == "Admin"
        ).first()

        # Validar login único (se mudar login)
        login_existe = db.query(AdminSiteUser).filter(
            AdminSiteUser.login == identidade["login"]
        ).first()
        if not login_existe:
            login_existe = db.query(UsuarioAdministrativo).filter(
                UsuarioAdministrativo.login == identidade["login"],
                UsuarioAdministrativo.nivel_acesso == NivelAcessoAdmin.ADMIN_SITE,
            ).first()
        if login_existe:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Login já existe no sistema"
            )

        conflito = find_admin_site_conflict(
            db,
            email=identidade["email"],
            telefone=telefone_norm,
            cpf=cpf_norm,
        )
        if conflito == "email":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="E-mail já cadastrado para outro Admin-Site"
            )
        if conflito == "telefone":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Telefone já cadastrado para outro Admin-Site"
            )
        if conflito == "cpf":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="CPF já cadastrado para outro Admin-Site"
            )

        if bootstrap_admin and bootstrap_admin.ativo:
            # Mantém o usuário seed para integridade dos testes de instalação,
            # porém inativo após o primeiro acesso real.
            bootstrap_admin.ativo = False
            bootstrap_admin.atualizado_em = get_fortaleza_time()

            primeiro_admin = AdminSiteUser(
                id=generate_temporal_id_with_microseconds('ADM'),
                nome=identidade["nome"],
                login=identidade["login"],
                senha_hash=hash_password(request.senha),
                email=identidade["email"],
                cpf=cpf_norm,
                telefone=telefone_norm,
                whatsapp=whatsapp_norm,
                paroquia_referencia_id=None,
                criado_por_id=bootstrap_admin.id,
                ativo=True,
                criado_em=get_fortaleza_time(),
                atualizado_em=get_fortaleza_time()
            )
            db.add(primeiro_admin)

            legado_primeiro_admin = UsuarioAdministrativo(
                id=primeiro_admin.id,
                nome=primeiro_admin.nome,
                login=primeiro_admin.login,
                senha_hash=primeiro_admin.senha_hash,
                email=primeiro_admin.email,
                cpf=primeiro_admin.cpf,
                telefone=primeiro_admin.telefone,
                whatsapp=primeiro_admin.whatsapp,
                nivel_acesso=NivelAcessoAdmin.ADMIN_SITE,
                paroquia_id=None,
                ativo=True,
                criado_por_id=bootstrap_admin.id,
                criado_em=primeiro_admin.criado_em,
                atualizado_em=primeiro_admin.atualizado_em,
            )
            db.add(legado_primeiro_admin)
            db.commit()
            db.refresh(primeiro_admin)
        else:
            # Criar primeiro ADMIN_SITE (fallback)
            primeiro_admin = AdminSiteUser(
                id=generate_temporal_id_with_microseconds('ADM'),
                nome=identidade["nome"],
                login=identidade["login"],
                senha_hash=hash_password(request.senha),
                email=identidade["email"],
                cpf=cpf_norm,
                telefone=telefone_norm,
                whatsapp=whatsapp_norm,
                paroquia_referencia_id=None,
                criado_por_id=None,
                ativo=True,
                criado_em=get_fortaleza_time(),
                atualizado_em=get_fortaleza_time()
            )
            db.add(primeiro_admin)

            legado_primeiro_admin = UsuarioAdministrativo(
                id=primeiro_admin.id,
                nome=primeiro_admin.nome,
                login=primeiro_admin.login,
                senha_hash=primeiro_admin.senha_hash,
                email=primeiro_admin.email,
                cpf=primeiro_admin.cpf,
                telefone=primeiro_admin.telefone,
                whatsapp=primeiro_admin.whatsapp,
                nivel_acesso=NivelAcessoAdmin.ADMIN_SITE,
                paroquia_id=None,
                ativo=True,
                criado_por_id=None,
                criado_em=primeiro_admin.criado_em,
                atualizado_em=primeiro_admin.atualizado_em,
            )
            db.add(legado_primeiro_admin)
            db.commit()
            db.refresh(primeiro_admin)

        logger.info(f"✅ ADMIN_SITE configurado: {primeiro_admin.id}")
        
        # Gerar token para login automático
        access_token = create_access_token(
            data={
                "sub": primeiro_admin.id,
                "login": primeiro_admin.login,
                "nivel_acesso": "admin_site",
                "tipo": "admin_site"
            },
            expires_delta=timedelta(hours=24)
        )
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            usuario=build_admin_site_token_response_user(primeiro_admin)
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
