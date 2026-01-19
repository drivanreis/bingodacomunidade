"""
Database Seed - Carga Inicial de Dados
======================================
Popula o banco de dados com dados iniciais necessários para
o sistema funcionar imediatamente após a primeira execução.

Dados criados:
- Super Admin (proprietário do sistema)
- Paróquia padrão
- Parish Admin para a paróquia
"""

import os
import logging
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from src.models.models import Paroquia, Usuario, TipoUsuario
from src.utils.time_manager import generate_temporal_id

logger = logging.getLogger(__name__)

# Contexto para hash de senhas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Gera hash bcrypt da senha."""
    return pwd_context.hash(password)


def seed_database(db: Session) -> bool:
    """
    Popula o banco com dados iniciais.
    
    Args:
        db: Sessão do banco de dados
        
    Returns:
        bool: True se dados foram criados, False se já existiam
    """
    try:
        # ====================================================================
        # VERIFICAR SE JÁ EXISTE DADOS
        # ====================================================================
        
        existing_admin = db.query(Usuario).filter(
            Usuario.tipo == TipoUsuario.SUPER_ADMIN
        ).first()
        
        if existing_admin:
            logger.info("✓ Dados iniciais já existem no banco")
            return False
        
        logger.info("📦 Iniciando carga de dados iniciais...")
        
        # ====================================================================
        # LER VARIÁVEIS DE AMBIENTE
        # ====================================================================
        
        # Dados do Super Admin
        owner_name = os.getenv('OWNER_NAME', 'Administrador Sistema')
        owner_email = os.getenv('OWNER_EMAIL', 'admin@bingodacomunidade.com.br')
        owner_password = os.getenv('OWNER_PASSWORD', 'Admin@2026')
        
        # Dados da Paróquia
        parish_name = os.getenv('PARISH_NAME', 'Paróquia São José')
        parish_email = os.getenv('PARISH_EMAIL', 'contato@paroquiasaojose.com.br')
        parish_phone = os.getenv('PARISH_PHONE', '85999999999')
        parish_pix = os.getenv('PARISH_PIX', parish_email)
        parish_city = os.getenv('PARISH_CITY', 'Fortaleza')
        parish_state = os.getenv('PARISH_STATE', 'CE')
        
        # ====================================================================
        # 1. CRIAR SUPER ADMIN
        # ====================================================================
        
        super_admin = Usuario(
            id=generate_temporal_id('USR'),
            nome=owner_name,
            email=owner_email,
            tipo=TipoUsuario.SUPER_ADMIN,
            paroquia_id=None,  # Super Admin não tem paróquia
            senha_hash=hash_password(owner_password),
            ativo=True
        )
        
        db.add(super_admin)
        db.flush()  # Garante que o ID seja gerado
        
        logger.info(f"✓ Super Admin criado: {super_admin.email}")
        logger.info(f"  ID: {super_admin.id}")
        logger.info(f"  Senha inicial: {owner_password}")
        
        # ====================================================================
        # 2. CRIAR PARÓQUIA PADRÃO
        # ====================================================================
        
        paroquia = Paroquia(
            id=generate_temporal_id('PAR'),
            nome=parish_name,
            email=parish_email,
            telefone=parish_phone,
            cidade=parish_city,
            estado=parish_state,
            chave_pix=parish_pix,
            ativa=True
        )
        
        db.add(paroquia)
        db.flush()
        
        logger.info(f"✓ Paróquia criada: {paroquia.nome}")
        logger.info(f"  ID: {paroquia.id}")
        logger.info(f"  Email: {paroquia.email}")
        logger.info(f"  PIX: {paroquia.chave_pix}")
        
        # ====================================================================
        # 3. CRIAR PARISH ADMIN PARA A PARÓQUIA
        # ====================================================================
        
        parish_admin = Usuario(
            id=generate_temporal_id('USR'),
            nome=f"Administrador - {parish_name}",
            email=f"admin@{parish_email.split('@')[1]}",
            tipo=TipoUsuario.PARISH_ADMIN,
            paroquia_id=paroquia.id,
            senha_hash=hash_password(owner_password),  # Mesma senha inicial
            ativo=True
        )
        
        db.add(parish_admin)
        db.flush()
        
        logger.info(f"✓ Parish Admin criado: {parish_admin.email}")
        logger.info(f"  ID: {parish_admin.id}")
        logger.info(f"  Paróquia: {paroquia.nome}")
        
        # ====================================================================
        # 4. CRIAR USUÁRIO FIEL DE EXEMPLO
        # ====================================================================
        
        fiel_exemplo = Usuario(
            id=generate_temporal_id('USR'),
            nome="João Silva (Exemplo)",
            cpf="12345678901",  # CPF de exemplo (não validado)
            email="joao.exemplo@email.com",
            whatsapp="+5585987654321",
            tipo=TipoUsuario.FIEL,
            paroquia_id=paroquia.id,
            chave_pix="joao.exemplo@email.com",
            senha_hash=hash_password("Fiel@123"),
            ativo=True
        )
        
        db.add(fiel_exemplo)
        db.flush()
        
        logger.info(f"✓ Fiel de exemplo criado: {fiel_exemplo.email}")
        logger.info(f"  Senha: Fiel@123")
        
        # ====================================================================
        # COMMIT FINAL
        # ====================================================================
        
        db.commit()
        
        logger.info("=" * 70)
        logger.info("✅ CARGA INICIAL CONCLUÍDA COM SUCESSO!")
        logger.info("=" * 70)
        logger.info("")
        logger.info("📋 CREDENCIAIS CRIADAS:")
        logger.info("")
        logger.info(f"1️⃣  SUPER ADMIN (Guardião da Infraestrutura)")
        logger.info(f"    Email: {owner_email}")
        logger.info(f"    Senha: {owner_password}")
        logger.info(f"    ID: {super_admin.id}")
        logger.info("")
        logger.info(f"2️⃣  PARISH ADMIN (Operador da Paróquia)")
        logger.info(f"    Email: {parish_admin.email}")
        logger.info(f"    Senha: {owner_password}")
        logger.info(f"    Paróquia: {parish_name}")
        logger.info(f"    ID: {parish_admin.id}")
        logger.info("")
        logger.info(f"3️⃣  FIEL (Exemplo de Participante)")
        logger.info(f"    Email: joao.exemplo@email.com")
        logger.info(f"    CPF: 12345678901")
        logger.info(f"    Senha: Fiel@123")
        logger.info(f"    ID: {fiel_exemplo.id}")
        logger.info("")
        logger.info("=" * 70)
        logger.info("⚠️  IMPORTANTE: Mude as senhas em produção!")
        logger.info("=" * 70)
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Erro ao criar dados iniciais: {e}")
        db.rollback()
        raise


def check_seed_needed(db: Session) -> bool:
    """
    Verifica se é necessário fazer seed do banco.
    
    Args:
        db: Sessão do banco de dados
        
    Returns:
        bool: True se seed é necessário, False caso contrário
    """
    try:
        count = db.query(Usuario).filter(
            Usuario.tipo == TipoUsuario.SUPER_ADMIN
        ).count()
        
        return count == 0
        
    except Exception:
        # Se der erro (ex: tabela não existe), precisa seed
        return True


# Exportações
__all__ = ['seed_database', 'check_seed_needed', 'hash_password']
