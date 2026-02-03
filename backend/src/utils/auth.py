"""
Authentication Utilities - Autenticação e Segurança
=================================================
Gerencia autenticação JWT e hashing de senhas.

Responsabilidades:
- Hash de senhas com bcrypt
- Verificação de senhas
- Geração de JWT tokens
- Validação de JWT tokens
"""

from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import os
import secrets

from src.utils.time_manager import get_fortaleza_time
from src.db.base import get_db


# Security scheme
security = HTTPBearer()


# ============================================================================
# CONFIGURAÇÕES
# ============================================================================

# Secret key para JWT (em produção, usar variável de ambiente)
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production-2026")
ALGORITHM = "HS256"

# Token JWT válido por 16 horas (segurança nível bancário)
# Bingo lida com dinheiro real, então usamos padrão conservador
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 16  # 16 horas

# Contexto para hashing de senhas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ============================================================================
# FUNÇÕES DE HASHING
# ============================================================================

def hash_password(password: str) -> str:
    """
    Gera hash bcrypt de uma senha.
    
    Bcrypt tem limite de 72 bytes, então truncamos se necessário.
    
    Args:
        password: Senha em texto plano
        
    Returns:
        Hash bcrypt da senha
    """
    # Garantir que senha não ultrapasse 72 bytes
    if isinstance(password, str):
        password = password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica se uma senha corresponde ao hash.
    
    Args:
        plain_password: Senha em texto plano
        hashed_password: Hash bcrypt armazenado
        
    Returns:
        bool: True se a senha está correta
    """
    # Garantir que senha não ultrapasse 72 bytes
    if isinstance(plain_password, str):
        plain_password = plain_password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_context.verify(plain_password, hashed_password)


# ============================================================================
# FUNÇÕES JWT
# ============================================================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Cria um JWT token de acesso.
    
    Args:
        data: Dados a serem codificados no token (ex: {"sub": user_id})
        expires_delta: Tempo de expiração customizado (opcional)
        
    Returns:
        JWT token codificado
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = get_fortaleza_time() + expires_delta
    else:
        expire = get_fortaleza_time() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": get_fortaleza_time()  # Issued at
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decodifica e valida um JWT token.
    
    Args:
        token: JWT token a ser decodificado
        
    Returns:
        Payload do token se válido, None se inválido
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


# ============================================================================
# FUNÇÕES AUXILIARES
# ============================================================================

def get_password_hash(password: str) -> str:
    """Alias para hash_password (compatibilidade)."""
    return hash_password(password)


def verify_password_hash(plain_password: str, hashed_password: str) -> bool:
    """Alias para verify_password (compatibilidade)."""
    return verify_password(plain_password, hashed_password)


# ============================================================================
# RECUPERAÇÃO DE SENHA
# ============================================================================

def generate_recovery_token() -> str:
    """
    Gera um token seguro para recuperação de senha.
    
    Returns:
        Token aleatório de 32 caracteres hexadecimais
    """
    return secrets.token_urlsafe(32)


def get_recovery_token_expiration() -> datetime:
    """
    Retorna o horário de expiração para token de recuperação (30 minutos a partir de agora).
    
    Returns:
        Datetime de expiração em timezone de Fortaleza
    """
    return get_fortaleza_time() + timedelta(minutes=30)


# ============================================================================
# VERIFICAÇÃO DE EMAIL
# ============================================================================

def generate_email_verification_token() -> str:
    """
    Gera um token seguro para verificação de email.
    
    Returns:
        Token aleatório de 32 caracteres hexadecimais
    """
    return secrets.token_urlsafe(32)


def get_email_verification_token_expiration() -> datetime:
    """
    Retorna o horário de expiração para token de verificação de email (24 horas a partir de agora).
    
    Returns:
        Datetime de expiração em timezone de Fortaleza
    """
    return get_fortaleza_time() + timedelta(hours=24)


# ============================================================================
# AUTENTICAÇÃO DE USUÁRIO ATUAL
# ============================================================================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Extrai e valida o usuário atual a partir do JWT token.
    
    Dependência FastAPI que pode ser usada em qualquer endpoint.
    
    Args:
        credentials: Credenciais HTTP Bearer (token JWT)
        db: Sessão do banco de dados
        
    Returns:
        Usuario: Objeto do usuário autenticado
        
    Raises:
        HTTPException: Se token inválido ou usuário não encontrado
    """
    from src.models.models import UsuarioLegado
    
    # Extrair token
    token = credentials.credentials
    
    # Decodificar token
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extrair user_id
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido: user_id não encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Buscar usuário no banco
    usuario = db.query(Usuario).filter(Usuario.id == user_id).first()
    
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return usuario
