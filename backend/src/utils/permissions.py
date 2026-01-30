"""
Sistema de Permissões e Controle de Acesso
==========================================
Define decorators e funções para controlar acesso baseado em papéis.

Hierarquia de Permissões:
Nível 1: SUPER_ADMIN (pode tudo)
Nível 2: PAROQUIA_ADMIN (gerencia paróquia)
Nível 3: Operacionais (CAIXA, RECEPCAO, BINGO)
Nível 4: FIEL (participante)
"""

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Callable, List
from functools import wraps

from src.models.models import Usuario, TipoUsuario
from src.utils.auth import get_current_user
from src.db.base import get_db


# ============================================================================
# HIERARQUIA DE PERMISSÕES
# ============================================================================

# Mapa de níveis de permissão (quanto menor, mais poder)
PERMISSION_LEVELS = {
    TipoUsuario.SUPER_ADMIN: 1,
    TipoUsuario.PAROQUIA_ADMIN: 2,
    TipoUsuario.PAROQUIA_CAIXA: 3,
    TipoUsuario.PAROQUIA_RECEPCAO: 3,
    TipoUsuario.PAROQUIA_BINGO: 3,
    TipoUsuario.FIEL: 4,
}


def get_permission_level(tipo: TipoUsuario) -> int:
    """Retorna o nível de permissão de um tipo de usuário."""
    return PERMISSION_LEVELS.get(tipo, 999)  # 999 = sem permissão


def has_higher_or_equal_permission(user_type: TipoUsuario, required_type: TipoUsuario) -> bool:
    """
    Verifica se o usuário tem permissão igual ou superior.
    
    Exemplo:
    - SUPER_ADMIN tem permissão >= qualquer tipo (retorna True)
    - PAROQUIA_ADMIN tem permissão >= PAROQUIA_CAIXA (retorna True)
    - FIEL não tem permissão >= PAROQUIA_ADMIN (retorna False)
    """
    user_level = get_permission_level(user_type)
    required_level = get_permission_level(required_type)
    return user_level <= required_level


# ============================================================================
# VERIFICAÇÕES DE PERMISSÃO
# ============================================================================

def check_user_active(user: Usuario):
    """Verifica se o usuário está ativo e não está banido."""
    if not user.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo. Entre em contato com o administrador."
        )
    
    if user.banido:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Usuário banido. Motivo: {user.motivo_banimento or 'Não especificado'}"
        )
    
    if user.is_bootstrap:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário temporário. Complete o primeiro acesso do sistema."
        )


def check_user_type(user: Usuario, allowed_types: List[TipoUsuario]):
    """Verifica se o usuário tem um dos tipos permitidos."""
    if user.tipo not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Acesso negado. Requer papel: {', '.join([t.value for t in allowed_types])}"
        )


def check_same_paroquia(user: Usuario, target_paroquia_id: str):
    """Verifica se o usuário pertence à mesma paróquia."""
    # SUPER_ADMIN pode acessar qualquer paróquia
    if user.tipo == TipoUsuario.SUPER_ADMIN:
        return
    
    if user.paroquia_id != target_paroquia_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar dados de outra paróquia"
        )


# ============================================================================
# DEPENDÊNCIAS FASTAPI
# ============================================================================

async def require_super_admin(
    current_user: Usuario = Depends(get_current_user)
) -> Usuario:
    """Dependência que exige SUPER_ADMIN."""
    check_user_active(current_user)
    check_user_type(current_user, [TipoUsuario.SUPER_ADMIN])
    return current_user


async def require_paroquia_admin(
    current_user: Usuario = Depends(get_current_user)
) -> Usuario:
    """Dependência que exige PAROQUIA_ADMIN ou superior."""
    check_user_active(current_user)
    
    if not has_higher_or_equal_permission(current_user.tipo, TipoUsuario.PAROQUIA_ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Requer papel: Administrador Paroquial ou superior"
        )
    
    return current_user


async def require_paroquia_caixa(
    current_user: Usuario = Depends(get_current_user)
) -> Usuario:
    """Dependência que exige PAROQUIA_CAIXA ou superior."""
    check_user_active(current_user)
    
    allowed_types = [
        TipoUsuario.SUPER_ADMIN,
        TipoUsuario.PAROQUIA_ADMIN,
        TipoUsuario.PAROQUIA_CAIXA
    ]
    
    if current_user.tipo not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Requer papel: Caixa, Administrador Paroquial ou superior"
        )
    
    return current_user


async def require_paroquia_recepcao(
    current_user: Usuario = Depends(get_current_user)
) -> Usuario:
    """Dependência que exige PAROQUIA_RECEPCAO ou superior."""
    check_user_active(current_user)
    
    allowed_types = [
        TipoUsuario.SUPER_ADMIN,
        TipoUsuario.PAROQUIA_ADMIN,
        TipoUsuario.PAROQUIA_RECEPCAO
    ]
    
    if current_user.tipo not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Requer papel: Recepção, Administrador Paroquial ou superior"
        )
    
    return current_user


async def require_paroquia_bingo(
    current_user: Usuario = Depends(get_current_user)
) -> Usuario:
    """Dependência que exige PAROQUIA_BINGO ou superior."""
    check_user_active(current_user)
    
    allowed_types = [
        TipoUsuario.SUPER_ADMIN,
        TipoUsuario.PAROQUIA_ADMIN,
        TipoUsuario.PAROQUIA_BINGO
    ]
    
    if current_user.tipo not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Requer papel: Operador de Bingo, Administrador Paroquial ou superior"
        )
    
    return current_user


async def require_authenticated(
    current_user: Usuario = Depends(get_current_user)
) -> Usuario:
    """Dependência que exige apenas autenticação (qualquer tipo)."""
    check_user_active(current_user)
    return current_user


# ============================================================================
# FUNÇÕES AUXILIARES
# ============================================================================

def can_manage_user(manager: Usuario, target_tipo: TipoUsuario, target_paroquia_id: str = None) -> bool:
    """
    Verifica se um usuário pode gerenciar outro de determinado tipo.
    
    Regras:
    - SUPER_ADMIN pode gerenciar qualquer usuário
    - PAROQUIA_ADMIN pode gerenciar usuários da sua paróquia (exceto SUPER_ADMIN)
    - Operacionais não podem gerenciar ninguém
    """
    # Verificar se está ativo
    if not manager.ativo or manager.banido:
        return False
    
    # SUPER_ADMIN pode tudo
    if manager.tipo == TipoUsuario.SUPER_ADMIN:
        return True
    
    # PAROQUIA_ADMIN pode gerenciar usuários da sua paróquia
    if manager.tipo == TipoUsuario.PAROQUIA_ADMIN:
        # Não pode gerenciar SUPER_ADMIN
        if target_tipo == TipoUsuario.SUPER_ADMIN:
            return False
        
        # Deve ser da mesma paróquia
        if target_paroquia_id and manager.paroquia_id != target_paroquia_id:
            return False
        
        return True
    
    # Outros tipos não podem gerenciar
    return False


def can_create_user_type(creator: Usuario, target_tipo: TipoUsuario) -> bool:
    """
    Verifica se um usuário pode criar outro de determinado tipo.
    
    Regras:
    - SUPER_ADMIN pode criar: SUPER_ADMIN, PAROQUIA_ADMIN
    - PAROQUIA_ADMIN pode criar: PAROQUIA_ADMIN, PAROQUIA_*, FIEL
    - Outros não podem criar usuários
    """
    if not creator.ativo or creator.banido:
        return False
    
    # SUPER_ADMIN pode criar SUPER_ADMIN e primeiro PAROQUIA_ADMIN
    if creator.tipo == TipoUsuario.SUPER_ADMIN:
        return target_tipo in [TipoUsuario.SUPER_ADMIN, TipoUsuario.PAROQUIA_ADMIN]
    
    # PAROQUIA_ADMIN pode criar usuários paroquiais
    if creator.tipo == TipoUsuario.PAROQUIA_ADMIN:
        paroquial_types = [
            TipoUsuario.PAROQUIA_ADMIN,
            TipoUsuario.PAROQUIA_CAIXA,
            TipoUsuario.PAROQUIA_RECEPCAO,
            TipoUsuario.PAROQUIA_BINGO,
            TipoUsuario.FIEL
        ]
        return target_tipo in paroquial_types
    
    # Outros não podem criar
    return False


def can_ban_user(banner: Usuario, target: Usuario) -> bool:
    """
    Verifica se um usuário pode banir outro.
    
    Regras:
    - SUPER_ADMIN pode banir qualquer usuário
    - PAROQUIA_ADMIN pode banir FIELs e operacionais da sua paróquia
    - Não pode banir usuário de nível igual ou superior
    """
    if not banner.ativo or banner.banido:
        return False
    
    # SUPER_ADMIN pode banir qualquer um
    if banner.tipo == TipoUsuario.SUPER_ADMIN:
        return True
    
    # PAROQUIA_ADMIN pode banir usuários da sua paróquia
    if banner.tipo == TipoUsuario.PAROQUIA_ADMIN:
        # Deve ser da mesma paróquia
        if banner.paroquia_id != target.paroquia_id:
            return False
        
        # Não pode banir SUPER_ADMIN ou outro PAROQUIA_ADMIN
        if target.tipo in [TipoUsuario.SUPER_ADMIN, TipoUsuario.PAROQUIA_ADMIN]:
            return False
        
        return True
    
    return False
