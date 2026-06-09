"""
Database Base Configuration - Configuração Base do Banco de Dados
================================================================
Módulo responsável por:
- Configurar o engine SQLAlchemy com PostgreSQL
- Definir a sessão de banco de dados
- Forçar timezone de Fortaleza em todas as conexões
- Fornecer a classe Base para todos os modelos
"""

from typing import Any, Generator
from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
import os
import json
import hashlib


# ============================================================================
# CONFIGURAÇÃO DE CONEXÃO COM BANCO DE DADOS
# ============================================================================

# Detecta se deve usar SQLite (desenvolvimento) ou PostgreSQL (produção)
USE_SQLITE = os.getenv("USE_SQLITE", "true").lower() == "true"

if USE_SQLITE:
    # SQLite para testes locais (não requer instalação de PostgreSQL)
    # No Docker, salva em /app/data (volume persistente)
    (
        os.makedirs("/app/data", exist_ok=True)
        if os.path.exists("/app")
        else os.makedirs("./data", exist_ok=True)
    )
    DATABASE_URL = (
        "sqlite:////app/data/bingo.db" if os.path.exists("/app") else "sqlite:///./data/bingo.db"
    )
    print("⚠️  MODO DESENVOLVIMENTO: Usando SQLite local")
    print(
        f"   Arquivo: {'data/bingo.db' if not os.path.exists('/app') else '/app/data/bingo.db'}"
    )  # noqa: F541  # noqa: E501
else:
    # PostgreSQL para produção
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "bingo_comunidade")
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    print("✓ MODO PRODUÇÃO: Usando PostgreSQL")
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
        pool_size=10,  # Número de conexões mantidas no pool
        max_overflow=20,  # Conexões extras permitidas além do pool_size
        pool_timeout=30,  # Timeout para obter conexão do pool (segundos)
        pool_recycle=3600,  # Reciclar conexões a cada 1 hora
        pool_pre_ping=True,  # Testar conexão antes de usar
        echo=False,  # Não logar SQL (ative para debug)
        future=True,  # Usar SQLAlchemy 2.0 style
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

    # Cria apenas tabelas gerenciadas (legados com managed=False ficam fora)
    managed_tables = [
        table for table in Base.metadata.sorted_tables if table.info.get("managed", True)
    ]
    Base.metadata.create_all(bind=engine, tables=managed_tables)

    # Compatibilidade com bancos legados sem migrations completas
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())

    if "sorteios" in table_names:
        sorteios_cols = {col["name"] for col in inspector.get_columns("sorteios")}
        if "max_cards" not in sorteios_cols:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE sorteios ADD COLUMN max_cards INTEGER"))
            print("✓ Migração automática aplicada: coluna sorteios.max_cards")

    if "sorteios" in table_names:
        sorteios_cols = {col["name"] for col in inspector.get_columns("sorteios")}
        with engine.begin() as conn:
            if "numeros_sorteados" not in sorteios_cols:
                conn.execute(text("ALTER TABLE sorteios ADD COLUMN numeros_sorteados JSON"))
                print("✓ Migração automática aplicada: coluna sorteios.numeros_sorteados")
            if "cartela_vencedora_id" not in sorteios_cols:
                conn.execute(text("ALTER TABLE sorteios ADD COLUMN cartela_vencedora_id VARCHAR(50)"))
                print("✓ Migração automática aplicada: coluna sorteios.cartela_vencedora_id")
            if "pedras_sorteadas" in sorteios_cols:
                conn.execute(text(
                    "UPDATE sorteios SET numeros_sorteados = pedras_sorteadas "
                    "WHERE numeros_sorteados IS NULL AND pedras_sorteadas IS NOT NULL"
                ))

    if "cartelas" in table_names:
        _migrate_cartelas_to_json_hash(inspector)

    print("✓ Banco de dados inicializado com sucesso")


def _normalize_card_numbers_for_storage(raw_numbers: Any) -> list[str]:
    normalized: list[str] = []
    seen: set[str] = set()

    if not isinstance(raw_numbers, list):
        return normalized

    flat_values: list[Any] = []
    for item in raw_numbers:
        if isinstance(item, list):
            flat_values.extend(item)
        else:
            flat_values.append(item)

    for raw in flat_values:
        digits = "".join(ch for ch in str(raw) if ch.isdigit())
        if not digits:
            return []
        token = f"{int(digits):02d}"
        if token in seen:
            return []
        seen.add(token)
        normalized.append(token)

    if len(normalized) != 24:
        return []

    return sorted(normalized)


def _cartela_hash(numbers: list[str]) -> str:
    payload = json.dumps(numbers, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _migrate_cartelas_to_json_hash(inspector) -> None:
    cartelas_cols = {col["name"] for col in inspector.get_columns("cartelas")}

    with engine.begin() as conn:
        if "numeros" not in cartelas_cols:
            conn.execute(text("ALTER TABLE cartelas ADD COLUMN numeros JSON"))
            print("✓ Migração automática aplicada: coluna cartelas.numeros")
        if "hash" not in cartelas_cols:
            conn.execute(text("ALTER TABLE cartelas ADD COLUMN hash VARCHAR(64)"))
            print("✓ Migração automática aplicada: coluna cartelas.hash")

    legacy_columns = [f"n{i}" for i in range(1, 25) if f"n{i}" in cartelas_cols]
    if not legacy_columns and "numeros" in cartelas_cols and "hash" in cartelas_cols:
        with engine.begin() as conn:
            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_cartela_sorteio_hash ON cartelas (sorteio_id, hash)"))
        return

    select_columns = ["id", "numeros", "hash", *legacy_columns]
    rows_query = ", ".join(select_columns)
    with engine.begin() as conn:
        rows = conn.execute(text(f"SELECT {rows_query} FROM cartelas")).mappings().all()
        migrated = 0
        for row in rows:
            normalized = _normalize_card_numbers_for_storage(row.get("numeros"))
            if not normalized and legacy_columns:
                normalized = _normalize_card_numbers_for_storage([row.get(col) for col in legacy_columns])

            if not normalized:
                continue

            current_hash = row.get("hash") or _cartela_hash(normalized)
            conn.execute(
                text("UPDATE cartelas SET numeros = :numeros, hash = :hash WHERE id = :id"),
                {
                    "id": row["id"],
                    "numeros": json.dumps(normalized, ensure_ascii=False),
                    "hash": current_hash,
                },
            )
            migrated += 1

        conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_cartela_sorteio_hash ON cartelas (sorteio_id, hash)"))

    if migrated:
        print(f"✓ Migração automática aplicada: cartelas normalizadas em JSON/hash ({migrated})")


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
            result = conn.execute(text("SELECT 1"))
            result.fetchone()
        return True
    except Exception as e:
        print(f"✗ Erro ao conectar no banco: {e}")
        return False


# Exportações públicas do módulo
__all__ = [
    "engine",
    "SessionLocal",
    "Base",
    "get_db",
    "init_db",
    "drop_all_tables",
    "verify_connection",
    "DATABASE_URL",
]
