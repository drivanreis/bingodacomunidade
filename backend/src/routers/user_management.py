"""
Endpoints de Gerenciamento de Usuários
======================================
SUPER_ADMIN cria usuários paroquiais
PAROQUIA_ADMIN cria operacionais e gerencia FIELs
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
import logging

from src.db.base import get_db
from src.models.models import UsuarioLegado, TipoUsuario, Paroquia, UsuarioComum
from src.schemas.schemas import UsuarioResponse, UsuarioCreate
from src.utils.permissions import (
    require_super_admin,
    require_paroquia_admin,
    can_create_user_type,
    can_ban_user
)
from src.utils.auth import hash_password
from src.utils.time_manager import get_fortaleza_time, generate_temporal_id_with_microseconds

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["Gerenciamento de Usuários"])


# ============================================================================
# SUPER_ADMIN: Criar primeiro usuário paroquial
# ============================================================================

@router.post(
    "/create-paroquia-admin",
    response_model=UsuarioResponse,
    status_code=status.HTTP_201_CREATED,
    summary="👑 SUPER_ADMIN cria primeiro administrador paroquial"
)
def create_paroquia_admin(
    nome: str,
    email: str,
    senha: str,
    paroquia_id: str,
    cpf: str = None,
    whatsapp: str = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_super_admin)
):
    """SUPER_ADMIN cria primeiro PAROQUIA_ADMIN para uma paróquia."""
    
    # Verificar se paróquia existe
    paroquia = db.query(Paroquia).filter(Paroquia.id == paroquia_id).first()
    if not paroquia:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paróquia não encontrada")
    
    # Verificar duplicatas
    if db.query(Usuario).filter(Usuario.email == email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email já cadastrado")
    
    if cpf and db.query(Usuario).filter(Usuario.cpf == cpf).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CPF já cadastrado")
    
    novo_admin = Usuario(
        id=generate_temporal_id_with_microseconds('USR'),
        nome=nome,
        email=email,
        cpf=cpf,
        whatsapp=whatsapp,
        tipo=TipoUsuario.PAROQUIA_ADMIN,
        paroquia_id=paroquia_id,
        senha_hash=hash_password(senha),
        ativo=True,
        email_verificado=True,
        banido=False
    )
    
    try:
        db.add(novo_admin)
        db.commit()
        db.refresh(novo_admin)
    except IntegrityError as e:
        db.rollback()
        logger.error(f"❌ Erro de integridade ao criar PAROQUIA_ADMIN: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email ou CPF já em uso por outro usuário"
        )
    
    logger.info(f"✅ SUPER_ADMIN criou PAROQUIA_ADMIN: {novo_admin.email}")
    
    return novo_admin


# ============================================================================
# PAROQUIA_ADMIN: Criar usuários operacionais
# ============================================================================

@router.post(
    "/create-operacional",
    response_model=UsuarioResponse,
    status_code=status.HTTP_201_CREATED,
    summary="🏛️ PAROQUIA_ADMIN cria usuários operacionais"
)
def create_operacional(
    nome: str,
    email: str,
    senha: str,
    tipo: TipoUsuario,
    cpf: str = None,
    whatsapp: str = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_paroquia_admin)
):
    """PAROQUIA_ADMIN cria CAIXA, RECEPCAO, BINGO ou outro PAROQUIA_ADMIN."""
    
    # Validar tipo permitido
    allowed_types = [
        TipoUsuario.PAROQUIA_ADMIN,
        TipoUsuario.PAROQUIA_CAIXA,
        TipoUsuario.PAROQUIA_RECEPCAO,
        TipoUsuario.PAROQUIA_BINGO
    ]
    
    if tipo not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo não permitido. Use: {', '.join([t.value for t in allowed_types])}"
        )
    
    # Verificar permissão
    if not can_create_user_type(current_user, tipo):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão para criar este tipo")
    
    # Verificar duplicatas
    if db.query(Usuario).filter(Usuario.email == email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email já cadastrado")
    
    if cpf and db.query(Usuario).filter(Usuario.cpf == cpf).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CPF já cadastrado")
    
    novo_usuario = Usuario(
        id=generate_temporal_id_with_microseconds('USR'),
        nome=nome,
        email=email,
        cpf=cpf,
        whatsapp=whatsapp,
        tipo=tipo,
        paroquia_id=current_user.paroquia_id,
        senha_hash=hash_password(senha),
        ativo=True,
        email_verificado=True,
        banido=False
    )
    
    try:
        db.add(novo_usuario)
        db.commit()
        db.refresh(novo_usuario)
    except IntegrityError as e:
        db.rollback()
        logger.error(f"❌ Erro de integridade ao criar {tipo.value}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email ou CPF já em uso por outro usuário"
        )
    
    logger.info(f"✅ PAROQUIA_ADMIN criou {tipo.value}: {novo_usuario.email}")
    
    return novo_usuario


# ============================================================================
# PAROQUIA_ADMIN: Banir FIEL
# ============================================================================

@router.post(
    "/ban-user/{user_id}",
    response_model=UsuarioResponse,
    summary="🚫 Banir usuário"
)
def ban_user(
    user_id: str,
    motivo: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_paroquia_admin)
):
    """PAROQUIA_ADMIN bane FIEL ou operacional da sua paróquia."""
    
    target = db.query(Usuario).filter(Usuario.id == user_id).first()
    
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
    
    # Verificar permissão
    if not can_ban_user(current_user, target):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão para banir este usuário")
    
    target.banido = True
    target.motivo_banimento = motivo
    target.banido_por_id = current_user.id
    target.banido_em = get_fortaleza_time()
    target.ativo = False
    
    db.commit()
    db.refresh(target)
    
    logger.info(f"🚫 {current_user.nome} baniu {target.nome}: {motivo}")
    
    return target


# ============================================================================
# PAROQUIA_ADMIN: Desbanir usuário
# ============================================================================

@router.post(
    "/unban-user/{user_id}",
    response_model=UsuarioResponse,
    summary="✅ Desbanir usuário"
)
def unban_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_paroquia_admin)
):
    """PAROQUIA_ADMIN desbane usuário da sua paróquia."""
    
    target = db.query(Usuario).filter(Usuario.id == user_id).first()
    
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
    
    # Verificar mesma paróquia
    if current_user.paroquia_id != target.paroquia_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuário de outra paróquia")
    
    target.banido = False
    target.motivo_banimento = None
    target.banido_por_id = None
    target.banido_em = None
    target.ativo = True
    
    db.commit()
    db.refresh(target)
    
    logger.info(f"✅ {current_user.nome} desbaniu {target.nome}")
    
    return target


# ============================================================================
# Listar usuários da paróquia
# ============================================================================

@router.get(
    "/my-paroquia",
    response_model=List[UsuarioResponse],
    summary="📋 Listar usuários da minha paróquia"
)
def list_paroquia_users(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_paroquia_admin)
):
    """PAROQUIA_ADMIN lista todos usuários da sua paróquia."""
    
    usuarios = db.query(Usuario).filter(
        Usuario.paroquia_id == current_user.paroquia_id
    ).all()
    
    return usuarios
