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

from src.models.models import UsuarioLegado, TipoUsuario
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
# VERIFICAÇÕES DE PERMISSÃO (DESCONTINUADO - USE NOVA ARQUITETURA)
# ============================================================================
# As funções abaixo foram descontinuadas com a migração para UsuarioComum e UsuarioAdministrativo
# Mantidas aqui apenas para compatibilidade


# ============================================================================
# DEPENDÊNCIAS FASTAPI (DESCONTINUADO)
# ============================================================================
# As dependências e funções abaixo eram usadas com a tabela Usuario legada.
# Para a nova arquitetura, implemente novas dependências conforme necessário.
# Este arquivo será descontinuado em futuras versões.
