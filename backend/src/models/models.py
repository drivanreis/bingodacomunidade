"""
Database Models - Modelos de Banco de Dados
==========================================
Define todas as entidades do sistema usando SQLAlchemy ORM.

Regras de Ouro:
- Todas as PKs são Strings (IDs temporais)
- Todos os timestamps usam timezone de Fortaleza
- JSON para estruturas complexas (cartelas)
- Hash de integridade em entidades críticas
"""

from sqlalchemy import Column, String, Float, DateTime, Boolean, Integer, ForeignKey, Text, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from typing import Optional
import enum

from src.db.base import Base
from src.utils.time_manager import FORTALEZA_TZ


# ============================================================================
# ENUMS
# ============================================================================

class TipoUsuario(str, enum.Enum):
    """
    Hierarquia de Usuários do Sistema
    
    SUPER_ADMIN (Nível 1 - Guardião da Infraestrutura)
    └── Gerencia configurações globais
    └── Cria/gerencia outros SUPER_ADMINs
    └── Cadastra primeiro usuário de cada paróquia
    
    PAROQUIA_ADMIN (Nível 2 - Administrador Paroquial)
    └── Criado pelo SUPER_ADMIN
    └── Gerencia usuários da paróquia
    └── Pode criar outros PAROQUIA_ADMINs
    └── Define papéis operacionais
    └── Pode banir FIELs
    
    PAROQUIA_CAIXA (Nível 3 - Operacional)
    └── Criado pelo PAROQUIA_ADMIN
    └── Recebe e envia PIX
    └── Não gerencia usuários
    
    PAROQUIA_RECEPCAO (Nível 3 - Operacional)
    └── Criado pelo PAROQUIA_ADMIN
    └── Cadastra participantes presenciais
    └── Não gerencia finanças
    
    PAROQUIA_BINGO (Nível 3 - Operacional)
    └── Criado pelo PAROQUIA_ADMIN
    └── Conduz sorteios
    └── Não gerencia usuários ou finanças
    
    FIEL (Nível 4 - Participante)
    └── Auto-cadastro (rota pública)
    └── Participa de bingos
    └── Pode ser banido por PAROQUIA_ADMIN
    """
    SUPER_ADMIN = "super_admin"           # Nível 1: Guardião do Sistema
    PAROQUIA_ADMIN = "paroquia_admin"     # Nível 2: Administrador Paroquial
    PAROQUIA_CAIXA = "paroquia_caixa"     # Nível 3: Operador Financeiro
    PAROQUIA_RECEPCAO = "paroquia_recepcao"  # Nível 3: Operador de Cadastro
    PAROQUIA_BINGO = "paroquia_bingo"     # Nível 3: Operador de Sorteios
    FIEL = "fiel"                         # Nível 4: Participante Comum


class StatusSorteio(str, enum.Enum):
    """Status do sorteio/bingo."""
    AGENDADO = "agendado"         # Criado, vendas abertas
    EM_ANDAMENTO = "em_andamento" # Sorteio em execução
    FINALIZADO = "finalizado"     # Concluído
    CANCELADO = "cancelado"       # Cancelado antes de iniciar


class StatusCartela(str, enum.Enum):
    """Status da cartela."""
    ATIVA = "ativa"               # Participando do sorteio
    VENCEDORA = "vencedora"       # Venceu o sorteio
    PERDEDORA = "perdedora"       # Não venceu


# ============================================================================
# MODELO: PARÓQUIA
# ============================================================================

class Paroquia(Base):
    """
    Representa uma paróquia/igreja que usa o sistema.
    
    Cada paróquia tem autonomia para gerenciar seus próprios bingos,
    mas todos os dados ficam centralizados para auditoria.
    """
    __tablename__ = "paroquias"
    
    # Primary Key (ID Temporal)
    id = Column(String(50), primary_key=True, index=True)
    
    # Dados da Paróquia
    nome = Column(String(200), nullable=False, index=True)
    email = Column(String(200), nullable=False, unique=True, index=True)
    telefone = Column(String(20), nullable=True)
    
    # Endereço
    endereco = Column(String(300), nullable=True)
    cidade = Column(String(100), nullable=True)
    estado = Column(String(2), nullable=True, default="CE")
    cep = Column(String(10), nullable=True)
    
    # Dados Financeiros
    chave_pix = Column(String(200), nullable=False)  # Chave PIX da paróquia
    
    # Status
    ativa = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    criado_em = Column(
        DateTime(timezone=True), 
        nullable=False, 
        server_default=func.now(),
        comment="Timestamp de criação (timezone: America/Fortaleza)"
    )
    atualizado_em = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="Timestamp de atualização (timezone: America/Fortaleza)"
    )
    
    # Relacionamentos
    usuarios = relationship("Usuario", back_populates="paroquia")
    sorteios = relationship("Sorteio", back_populates="paroquia")
    
    def __repr__(self):
        return f"<Paroquia(id={self.id}, nome={self.nome})>"


# ============================================================================
# MODELO: USUÁRIO
# ============================================================================

class Usuario(Base):
    """
    Representa qualquer usuário do sistema.
    
    Hierarquia:
    - Super Admin: Gerencia infraestrutura (1 por sistema)
    - Parish Admin: Gerencia bingos da paróquia (N por paróquia)
    - Fiel: Participa dos bingos (ilimitado)
    """
    __tablename__ = "usuarios"
    
    # Primary Key (ID Temporal)
    id = Column(String(50), primary_key=True, index=True)
    
    # Dados Pessoais
    nome = Column(String(200), nullable=False, index=True)
    cpf = Column(String(11), nullable=True, unique=True, index=True)  # CPF (apenas números)
    email = Column(String(200), nullable=True, unique=True, index=True)
    whatsapp = Column(String(20), nullable=True, index=True)
    
    # Tipo e Permissões
    tipo = Column(SQLEnum(TipoUsuario), nullable=False, index=True)
    
    # Associação com Paróquia (NULL para Super Admin)
    paroquia_id = Column(String(50), ForeignKey("paroquias.id"), nullable=True, index=True)
    
    # Dados Financeiros (para Fiéis)
    chave_pix = Column(String(200), nullable=True)  # Chave PIX do fiel para receber prêmios
    
    # Autenticação (simplificado por enquanto)
    senha_hash = Column(String(255), nullable=True)  # Hash bcrypt
    
    # Recuperação de Senha
    token_recuperacao = Column(String(100), nullable=True, index=True)  # Token único para recuperação
    token_expiracao = Column(DateTime(timezone=True), nullable=True)    # Validade do token (1 hora)
    
    # Verificação de Email
    email_verificado = Column(Boolean, default=False, nullable=False)  # Email foi verificado?
    token_verificacao_email = Column(String(100), nullable=True, index=True)  # Token para verificar email
    token_verificacao_expiracao = Column(DateTime(timezone=True), nullable=True)  # Validade do token (24 horas)
    
    # Segurança de Login
    tentativas_login = Column(Integer, default=0, nullable=False)  # Contador de falhas
    bloqueado_ate = Column(DateTime(timezone=True), nullable=True) # Timestamp de desbloqueio
    
    # Status
    ativo = Column(Boolean, default=True, nullable=False)
    banido = Column(Boolean, default=False, nullable=False)  # Banido pela paróquia
    motivo_banimento = Column(Text, nullable=True)  # Razão do banimento
    banido_por_id = Column(String(50), nullable=True)  # ID do admin que baniu
    banido_em = Column(DateTime(timezone=True), nullable=True)  # Quando foi banido
    
    # Bootstrap (usuário temporário)
    is_bootstrap = Column(Boolean, default=False, nullable=False)  # Marca Admin/admin123
    
    # Timestamps
    criado_em = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        comment="Timestamp de criação (timezone: America/Fortaleza)"
    )
    atualizado_em = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="Timestamp de atualização (timezone: America/Fortaleza)"
    )
    ultimo_acesso = Column(DateTime(timezone=True), nullable=True)
    
    # Relacionamentos
    paroquia = relationship("Paroquia", back_populates="usuarios")
    cartelas = relationship("Cartela", back_populates="usuario")
    
    def __repr__(self):
        return f"<Usuario(id={self.id}, nome={self.nome}, tipo={self.tipo})>"


# ============================================================================
# MODELO: SORTEIO (BINGO)
# ============================================================================

class Sorteio(Base):
    """
    Representa um evento de bingo/sorteio.
    
    Cada sorteio tem:
    - Rateio configurável (4 partes)
    - Hash de integridade
    - Prêmio dinâmico que cresce com as vendas
    """
    __tablename__ = "sorteios"
    
    # Primary Key (ID Temporal)
    id = Column(String(50), primary_key=True, index=True)
    
    # Associação com Paróquia
    paroquia_id = Column(String(50), ForeignKey("paroquias.id"), nullable=False, index=True)
    
    # Informações do Sorteio
    titulo = Column(String(200), nullable=False)
    descricao = Column(Text, nullable=True)
    
    # Configuração Financeira
    valor_cartela = Column(Float, nullable=False)  # Preço de cada cartela em R$
    
    # Rateio (soma deve ser 100.0)
    rateio_premio = Column(Float, nullable=False, default=25.0)      # % para o prêmio
    rateio_paroquia = Column(Float, nullable=False, default=25.0)    # % para a paróquia
    rateio_operacao = Column(Float, nullable=False, default=25.0)    # % para operação/TI
    rateio_evolucao = Column(Float, nullable=False, default=25.0)    # % para evolução
    
    # Totais Calculados (atualizados a cada venda)
    total_arrecadado = Column(Float, nullable=False, default=0.0)
    total_premio = Column(Float, nullable=False, default=0.0)
    total_cartelas_vendidas = Column(Integer, nullable=False, default=0)
    
    # Datas e Horários
    inicio_vendas = Column(DateTime(timezone=True), nullable=False)
    fim_vendas = Column(DateTime(timezone=True), nullable=False)
    horario_sorteio = Column(DateTime(timezone=True), nullable=False)
    
    # Status
    status = Column(SQLEnum(StatusSorteio), nullable=False, default=StatusSorteio.AGENDADO, index=True)
    
    # Integridade e Auditoria
    hash_integridade = Column(String(64), nullable=True, index=True)  # SHA-256 dos dados críticos
    pedras_sorteadas = Column(JSON, nullable=True, default=[])       # Lista de pedras sorteadas
    vencedores_ids = Column(JSON, nullable=True, default=[])         # IDs dos vencedores
    
    # Timestamps
    criado_em = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        comment="Timestamp de criação (timezone: America/Fortaleza)"
    )
    atualizado_em = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="Timestamp de atualização (timezone: America/Fortaleza)"
    )
    iniciado_em = Column(DateTime(timezone=True), nullable=True)
    finalizado_em = Column(DateTime(timezone=True), nullable=True)
    
    # Relacionamentos
    paroquia = relationship("Paroquia", back_populates="sorteios")
    cartelas = relationship("Cartela", back_populates="sorteio")
    
    def __repr__(self):
        return f"<Sorteio(id={self.id}, titulo={self.titulo}, status={self.status})>"


# ============================================================================
# MODELO: CARTELA
# ============================================================================

class Cartela(Base):
    """
    Representa uma cartela de bingo comprada por um fiel.
    
    A cartela contém:
    - Matriz de números (JSON)
    - Rastreamento de números marcados
    - Associação com usuário e sorteio
    """
    __tablename__ = "cartelas"
    
    # Primary Key (ID Temporal)
    id = Column(String(50), primary_key=True, index=True)
    
    # Associações
    sorteio_id = Column(String(50), ForeignKey("sorteios.id"), nullable=False, index=True)
    usuario_id = Column(String(50), ForeignKey("usuarios.id"), nullable=False, index=True)
    
    # Dados da Cartela
    numeros = Column(
        JSON, 
        nullable=False,
        comment="Matriz 5x5 de números do bingo. Formato: [[n1,n2,n3,n4,n5], [n6,n7,...], ...]"
    )
    numeros_marcados = Column(
        JSON,
        nullable=False,
        default=[],
        comment="Lista de números já sorteados que estão nesta cartela"
    )
    
    # Status
    status = Column(SQLEnum(StatusCartela), nullable=False, default=StatusCartela.ATIVA, index=True)
    
    # Prêmio (se vencedora)
    valor_premio = Column(Float, nullable=True)  # Valor recebido (pode ser dividido)
    
    # Timestamps
    criado_em = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        comment="Timestamp de compra (timezone: America/Fortaleza)"
    )
    atualizado_em = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="Timestamp de atualização (timezone: America/Fortaleza)"
    )
    
    # Relacionamentos
    sorteio = relationship("Sorteio", back_populates="cartelas")
    usuario = relationship("Usuario", back_populates="cartelas")
    
    def __repr__(self):
        return f"<Cartela(id={self.id}, usuario_id={self.usuario_id}, status={self.status})>"


# ============================================================================
# EXPORTAÇÕES
# ============================================================================

__all__ = [
    'Base',
    'TipoUsuario',
    'StatusSorteio',
    'StatusCartela',
    'Paroquia',
    'Usuario',
    'Sorteio',
    'Cartela',
]
