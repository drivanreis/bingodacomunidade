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
import os

from src.utils.time_manager import get_fortaleza_now


# ============================================================================
# CONFIGURAÇÕES
# ============================================================================

# Secret key para JWT (em produção, usar variável de ambiente)
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 dias

# Contexto para hashing de senhas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ============================================================================
# FUNÇÕES DE HASHING
# ============================================================================

def hash_password(password: str) -> str:
    """
    Gera hash bcrypt de uma senha.
    
    Args:
        password: Senha em texto plano
        
    Returns:
        Hash bcrypt da senha
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica se uma senha corresponde ao hash.
    
    Args:
        plain_password: Senha em texto plano
        hashed_password: Hash bcrypt armazenado
        
    Returns:
        True se a senha está correta, False caso contrário
    """
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
        expire = get_fortaleza_now() + expires_delta
    else:
        expire = get_fortaleza_now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": get_fortaleza_now()  # Issued at
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
