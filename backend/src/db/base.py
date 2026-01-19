"""
Database Base Configuration - Configuração Base do Banco de Dados
================================================================
Módulo responsável por:
- Configurar o engine SQLAlchemy com PostgreSQL
- Definir a sessão de banco de dados
- Forçar timezone de Fortaleza em todas as conexões
- Fornecer a classe Base para todos os modelos
"""

from typing import Generator
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
import os


# ============================================================================
# CONFIGURAÇÃO DE CONEXÃO COM BANCO DE DADOS
# ============================================================================

# Detecta se deve usar SQLite (desenvolvimento) ou PostgreSQL (produção)
USE_SQLITE = os.getenv('USE_SQLITE', 'true').lower() == 'true'

if USE_SQLITE:
    # SQLite para testes locais (não requer instalação de PostgreSQL)
    # No Docker, salva em /app/data (volume persistente)
    os.makedirs('/app/data', exist_ok=True) if os.path.exists('/app') else os.makedirs('./data', exist_ok=True)
    DATABASE_URL = "sqlite:////app/data/bingo.db" if os.path.exists('/app') else "sqlite:///./data/bingo.db"
    print("⚠️  MODO DESENVOLVIMENTO: Usando SQLite local")
    print(f"   Arquivo: {'data/bingo.db' if not os.path.exists('/app') else '/app/data/bingo.db'}")
else:
    # PostgreSQL para produção
    DB_USER = os.getenv('DB_USER', 'postgres')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'postgres')
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '5432')
    DB_NAME = os.getenv('DB_NAME', 'bingo_comunidade')
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    print(f"✓ MODO PRODUÇÃO: Usando PostgreSQL")
    print(f"   Banco: {DB_NAME}@{DB_HOST}:{DB_PORT}")

# ============================================================================
# ENGINE CONFIGURATION
# ============================================================================

# Configuração do engine (diferente para SQLite vs PostgreSQL)
if USE_SQLITE:
    # SQLite: Mais simples, sem pool de conexões
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},  # Necessário para SQLite com FastAPI
        echo=False,  # Não logar SQL (ative para debug)
        future=True,  # Usar SQLAlchemy 2.0 style
    )
else:
    # PostgreSQL: Com pool de conexões
    engine = create_engine(
        DATABASE_URL,
        poolclass=QueuePool,
        pool_size=10,              # Número de conexões mantidas no pool
        max_overflow=20,            # Conexões extras permitidas além do pool_size
        pool_timeout=30,            # Timeout para obter conexão do pool (segundos)
        pool_recycle=3600,          # Reciclar conexões a cada 1 hora
        pool_pre_ping=True,         # Testar conexão antes de usar
        echo=False,                 # Não logar SQL (ative para debug)
        future=True,                # Usar SQLAlchemy 2.0 style
    )


# ============================================================================
# FORÇAR TIMEZONE DE FORTALEZA EM TODAS AS CONEXÕES
# ============================================================================

# Event listener para timezone (apenas PostgreSQL)
if not USE_SQLITE:
    @event.listens_for(engine, "connect")
    def set_fortaleza_timezone(dbapi_conn, connection_record):
        """
        Event listener que força o timezone de Fortaleza em toda nova conexão.
        
        Isto garante que TODAS as operações de data/hora no PostgreSQL
        usem o fuso horário correto, independente da configuração do servidor.
        
        Args:
            dbapi_conn: Conexão DBAPI
            connection_record: Registro da conexão
        """
        cursor = dbapi_conn.cursor()
        cursor.execute("SET timezone='America/Fortaleza';")
        cursor.close()
else:
    # SQLite não suporta SET timezone, mas usamos datetime com tzinfo em Python
    print("   ℹ️  SQLite: Timezone gerenciado pelo Python (pytz)")


# ============================================================================
# SESSION CONFIGURATION
# ============================================================================

# Factory para criar sessões de banco de dados
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,  # Não expirar objetos após commit (útil para retornar objetos da API)
)


# ============================================================================
# BASE CLASS PARA MODELOS
# ============================================================================

# Classe base para todos os modelos ORM
Base = declarative_base()


# ============================================================================
# DEPENDENCY INJECTION PARA FASTAPI
# ============================================================================

def get_db() -> Generator[Session, None, None]:
    """
    Dependency injection para FastAPI.
    
    Cria uma sessão de banco de dados para cada request,
    garante que seja fechada após o uso, e faz rollback em caso de erro.
    
    Yields:
        Session: Sessão do SQLAlchemy
        
    Example:
        @app.get("/users/")
        def read_users(db: Session = Depends(get_db)):
            return db.query(User).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================================================
# FUNÇÕES AUXILIARES
# ============================================================================

def init_db() -> None:
    """
    Inicializa o banco de dados criando todas as tabelas.
    
    Esta função deve ser chamada apenas uma vez, no início da aplicação.
    Em produção, use Alembic para migrations.
    """
    # Import de todos os modelos para garantir que estejam registrados
    from src.models import models  # noqa: F401
    
    # Cria todas as tabelas
    Base.metadata.create_all(bind=engine)
    print("✓ Banco de dados inicializado com sucesso")


def drop_all_tables() -> None:
    """
    Remove todas as tabelas do banco de dados.
    
    ⚠️ CUIDADO: Esta função é DESTRUTIVA e deve ser usada apenas em desenvolvimento.
    """
    Base.metadata.drop_all(bind=engine)
    print("✗ Todas as tabelas foram removidas")


def verify_connection() -> bool:
    """
    Verifica se a conexão com o banco está funcionando.
    
    Returns:
        bool: True se conectado, False caso contrário
    """
    try:
        # Tenta executar uma query simples
        with engine.connect() as conn:
            result = conn.execute("SELECT 1")
            result.fetchone()
        return True
    except Exception as e:
        print(f"✗ Erro ao conectar no banco: {e}")
        return False


# Exportações públicas do módulo
__all__ = [
    'engine',
    'SessionLocal',
    'Base',
    'get_db',
    'init_db',
    'drop_all_tables',
    'verify_connection',
    'DATABASE_URL',
]
