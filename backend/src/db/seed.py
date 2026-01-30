"""
Database Seed - Carga Inicial de Dados
======================================
Cria usuário temporário de bootstrap que força configuração
do primeiro SUPER_ADMIN.

⚠️ ATENÇÃO - Sistema de Bootstrap Seguro:
- Cria usuário temporário: Admin / admin123
- Usuário temporário NÃO tem acesso ao sistema
- No primeiro login, FORÇA criação do primeiro SUPER_ADMIN
- Após criar SUPER_ADMIN, o usuário temporário é DELETADO automaticamente
- Este usuário temporário NÃO PODE continuar existindo após o bootstrap
"""

import os
import logging
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from src.models.models import Usuario, TipoUsuario, Paroquia
from src.utils.time_manager import generate_temporal_id_with_microseconds

logger = logging.getLogger(__name__)

# Contexto para hash de senhas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Gera hash bcrypt da senha.
    
    Bcrypt tem limite de 72 bytes, então truncamos se necessário.
    """
    # Garantir que senha não ultrapasse 72 bytes
    if isinstance(password, str):
        password = password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_context.hash(password)


def check_seed_needed(db: Session) -> bool:
    """
    Verifica se precisa criar usuário de bootstrap.
    
    Returns:
        True se precisa criar seed, False se já existe qualquer usuário
    """
    total_users = db.query(Usuario).count()
    return total_users == 0


def seed_database(db: Session) -> bool:
    """
    Cria usuário temporário de bootstrap para configuração inicial.
    
    ⚠️ IMPORTANTE:
    - Este usuário é TEMPORÁRIO
    - Serve APENAS para forçar a criação do primeiro SUPER_ADMIN
    - Será DELETADO automaticamente após o primeiro acesso
    - NÃO tem acesso real ao sistema (flag is_bootstrap=True)
    
    Args:
        db: Sessão do banco de dados
        
    Returns:
        bool: True se dados foram criados, False se já existiam
    """
    try:
        # Verificar se já existe algum usuário
        if not check_seed_needed(db):
            logger.info("✓ Sistema já possui usuários - Bootstrap não necessário")
            return False
        
        logger.info("🔧 Criando paróquia padrão e usuário temporário de bootstrap...")
        
        # ====================================================================
        # CRIAR PARÓQUIA PADRÃO
        # ====================================================================
        # Necessária para permitir cadastro de FIELs desde o início
        
        paroquia_default = Paroquia(
            id=generate_temporal_id_with_microseconds('PAR'),
            nome="Paróquia Padrão",
            email="contato@paroquia.padrao.com.br",
            telefone="8599999999",
            endereco="A definir",
            cidade="Fortaleza",
            estado="CE",
            cep="60000000",
            chave_pix="contato@paroquia.padrao.com.br",
            ativa=True
        )
        
        db.add(paroquia_default)
        db.flush()  # Garante que o ID está disponível
        
        logger.info(f"✓ Paróquia padrão criada: {paroquia_default.nome}")
        
        # ====================================================================
        # CRIAR USUÁRIO TEMPORÁRIO DE BOOTSTRAP
        # ====================================================================
        
        bootstrap_user = Usuario(
            id=generate_temporal_id_with_microseconds('BOOTSTRAP'),
            nome="Admin",
            cpf=None,  # Sem CPF (temporário)
            email="bootstrap@system.temp",  # Email temporário
            whatsapp=None,
            tipo=TipoUsuario.SUPER_ADMIN,  # Temporariamente SUPER_ADMIN
            paroquia_id=None,
            chave_pix=None,
            senha_hash=hash_password("admin123"),
            ativo=True,
            is_bootstrap=True,  # 🚨 MARCA COMO TEMPORÁRIO
            email_verificado=False
        )
        
        db.add(bootstrap_user)
        db.commit()
        
        logger.info("=" * 70)
        logger.info("🔐 SISTEMA DE BOOTSTRAP INICIALIZADO")
        logger.info("=" * 70)
        logger.info("")
        logger.info("  ✓ Paróquia padrão criada")
        logger.info("  ✓ Usuário temporário de bootstrap criado")
        logger.info("")
        logger.info("  📌 Este é um usuário TEMPORÁRIO para configuração inicial")
        logger.info("")
        logger.info("  🔑 Credenciais Bootstrap:")
        logger.info("     Username: Admin")
        logger.info("     Password: admin123")
        logger.info("")
        logger.info("  ⚠️  IMPORTANTE:")
        logger.info("     - Este usuário NÃO tem acesso ao sistema")
        logger.info("     - Ao fazer login, você DEVE criar o primeiro SUPER_ADMIN")
        logger.info("     - Após criar o SUPER_ADMIN, este usuário será DELETADO")
        logger.info("")
        logger.info("  🎯 Próximos Passos:")
        logger.info("     1. Acesse: /admin-site/login")
        logger.info("     2. Login: Admin / admin123")
        logger.info("     3. Complete o formulário de primeiro acesso")
        logger.info("     4. Seu SUPER_ADMIN será criado")
        logger.info("     5. Usuário temporário será excluído automaticamente")
        logger.info("")
        logger.info("  🌐 FIELs podem se cadastrar imediatamente em /auth/signup")
        logger.info("")
        logger.info("=" * 70)
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Erro ao criar seed: {str(e)}")
        db.rollback()
        raise


# Exportações
__all__ = ['seed_database', 'check_seed_needed', 'hash_password']
