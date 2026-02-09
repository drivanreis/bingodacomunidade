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

from src.models.models import (
    UsuarioAdministrativo,
    NivelAcessoAdmin,
    UsuarioLegado,
    Paroquia,
    Configuracao,
    TipoConfiguracao,
    CategoriaConfiguracao,
    SistemaAuditoria
)
from src.utils.time_manager import generate_temporal_id_with_microseconds, get_fortaleza_time

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
    Verifica se precisa criar dados de bootstrap.
    
    Returns:
        True se precisa criar seed, False se já existe ADMIN_SITE
    """
    total_admins = db.query(UsuarioAdministrativo).count()
    return total_admins == 0


def registrar_auditoria_sistema(db: Session) -> None:
    """
    Registra/atualiza informações globais de auditoria do sistema.
    """
    agora = get_fortaleza_time()
    registro = db.query(SistemaAuditoria).filter(SistemaAuditoria.id == "SYSTEM").first()

    seed_ativo = db.query(UsuarioAdministrativo).filter(
        UsuarioAdministrativo.login == "Admin"
    ).first() is not None

    if registro:
        registro.ultima_inicializacao_em = agora
        registro.contagem_inicializacoes += 1
        registro.ambiente = os.getenv("APP_ENV", "dev")
        registro.versao_api = os.getenv("API_VERSION", "2.0.0")
        registro.timezone = os.getenv("TIMEZONE", "America/Fortaleza")
        registro.seed_ativo = seed_ativo
    else:
        registro = SistemaAuditoria(
            id="SYSTEM",
            iniciado_em=agora,
            ultima_inicializacao_em=agora,
            contagem_inicializacoes=1,
            ambiente=os.getenv("APP_ENV", "dev"),
            versao_api=os.getenv("API_VERSION", "2.0.0"),
            timezone=os.getenv("TIMEZONE", "America/Fortaleza"),
            seed_ativo=seed_ativo
        )
        db.add(registro)

    db.commit()


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
        # Verificar se já existe ADMIN_SITE
        if not check_seed_needed(db):
            logger.info("✓ Sistema já possui ADMIN_SITE - Bootstrap não necessário")
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
        # REMOVER BOOTSTRAP LEGADO (SE EXISTIR)
        # ====================================================================
        db.query(UsuarioLegado).filter(UsuarioLegado.is_bootstrap == True).delete()

        # ====================================================================
        # CRIAR ADMIN SITE TEMPORÁRIO (BOOTSTRAP)
        # ====================================================================
        bootstrap_admin = UsuarioAdministrativo(
            id=generate_temporal_id_with_microseconds('ADM'),
            nome="Admin",
            login="Admin",
            senha_hash=hash_password("admin123"),
            email=None,
            telefone=None,
            whatsapp=None,
            nivel_acesso=NivelAcessoAdmin.ADMIN_SITE,
            paroquia_id=None,
            criado_por_id=None,
            ativo=True
        )

        db.add(bootstrap_admin)
        db.commit()
        
        logger.info("=" * 70)
        logger.info("🔐 SISTEMA DE BOOTSTRAP INICIALIZADO")
        logger.info("=" * 70)
        logger.info("")
        logger.info("  ✓ Paróquia padrão criada")
        logger.info("  ✓ Admin do Site temporário criado")
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
        
        # ====================================================================
        # CRIAR CONFIGURAÇÕES PADRÃO DO SISTEMA
        # ====================================================================
        
        logger.info("🔧 Criando configurações padrão do sistema...")
        
        configs_default = [
            # MENSAGENS E NOTIFICAÇÕES
            Configuracao(
                chave="errorMessageDuration",
                valor="3.0",
                tipo=TipoConfiguracao.NUMBER,
                categoria=CategoriaConfiguracao.MENSAGENS,
                descricao="Duração de exibição de mensagens de erro (em segundos)"
            ),
            Configuracao(
                chave="successMessageDuration",
                valor="2.0",
                tipo=TipoConfiguracao.NUMBER,
                categoria=CategoriaConfiguracao.MENSAGENS,
                descricao="Duração de exibição de mensagens de sucesso (em segundos)"
            ),
            
            # SEGURANÇA E AUTENTICAÇÃO
            Configuracao(
                chave="maxLoginAttempts",
                valor="5",
                tipo=TipoConfiguracao.NUMBER,
                categoria=CategoriaConfiguracao.SEGURANCA,
                descricao="Máximo de tentativas de login antes de bloquear temporariamente"
            ),
            Configuracao(
                chave="lockoutDuration",
                valor="15",
                tipo=TipoConfiguracao.NUMBER,
                categoria=CategoriaConfiguracao.SEGURANCA,
                descricao="Tempo de bloqueio após exceder tentativas (em minutos)"
            ),
            Configuracao(
                chave="tokenExpirationHours",
                valor="16",
                tipo=TipoConfiguracao.NUMBER,
                categoria=CategoriaConfiguracao.SEGURANCA,
                descricao="Tempo de validade do token JWT (em horas) - Máximo 16 horas"
            ),
            Configuracao(
                chave="inactivityTimeout",
                valor="15",
                tipo=TipoConfiguracao.NUMBER,
                categoria=CategoriaConfiguracao.SEGURANCA,
                descricao="Tempo de inatividade antes de logout automático (em minutos)"
            ),
            Configuracao(
                chave="inactivityWarningMinutes",
                valor="2",
                tipo=TipoConfiguracao.NUMBER,
                categoria=CategoriaConfiguracao.SEGURANCA,
                descricao="Avisar usuário X minutos antes de logout por inatividade"
            ),
            
            # CARRINHO DE CARTELAS
            Configuracao(
                chave="cartExpirationMinutes",
                valor="30",
                tipo=TipoConfiguracao.NUMBER,
                categoria=CategoriaConfiguracao.CARRINHO,
                descricao="Tempo máximo que cartelas não pagas ficam no carrinho (em minutos)"
            ),
            Configuracao(
                chave="autoCleanExpiredCarts",
                valor="true",
                tipo=TipoConfiguracao.BOOLEAN,
                categoria=CategoriaConfiguracao.CARRINHO,
                descricao="Limpar automaticamente carrinhos de jogos que já iniciaram"
            ),
            Configuracao(
                chave="autoCleanFinishedGameCarts",
                valor="true",
                tipo=TipoConfiguracao.BOOLEAN,
                categoria=CategoriaConfiguracao.CARRINHO,
                descricao="Limpar automaticamente carrinhos de jogos finalizados"
            ),
            
            # FORMULÁRIOS E RASCUNHOS
            Configuracao(
                chave="warnOnUnsavedForm",
                valor="true",
                tipo=TipoConfiguracao.BOOLEAN,
                categoria=CategoriaConfiguracao.FORMULARIOS,
                descricao="Avisar ao sair de formulário não salvo"
            ),
            Configuracao(
                chave="autoSaveDraftSeconds",
                valor="0",
                tipo=TipoConfiguracao.NUMBER,
                categoria=CategoriaConfiguracao.FORMULARIOS,
                descricao="Salvar rascunho automaticamente a cada X segundos (0 = desabilitado)"
            ),
            
            # RECUPERAÇÃO DE SENHA
            Configuracao(
                chave="passwordResetTokenMinutes",
                valor="30",
                tipo=TipoConfiguracao.NUMBER,
                categoria=CategoriaConfiguracao.RECUPERACAO_SENHA,
                descricao="Tempo de validade do token de recuperação de senha (em minutos)"
            ),
            Configuracao(
                chave="emailVerificationTokenHours",
                valor="24",
                tipo=TipoConfiguracao.NUMBER,
                categoria=CategoriaConfiguracao.RECUPERACAO_SENHA,
                descricao="Tempo de validade do token de verificação de email (em horas)"
            ),
        ]
        
        for config in configs_default:
            db.add(config)
        
        db.commit()
        
        logger.info(f"✓ {len(configs_default)} configurações padrão criadas")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Erro ao criar seed: {str(e)}")
        db.rollback()
        raise


# Exportações
__all__ = ['seed_database', 'check_seed_needed', 'hash_password']
