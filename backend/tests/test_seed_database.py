from src.db.seed import check_seed_needed, seed_database, registrar_auditoria_sistema
from src.models.models import (
    UsuarioAdministrativo,
    NivelAcessoAdmin,
    Paroquia,
    Configuracao,
    SistemaAuditoria,
)
from src.utils.auth import hash_password
from src.utils.time_manager import get_fortaleza_time


def test_check_seed_needed_true_when_no_admins(db_session):
    assert check_seed_needed(db_session) is True


def test_check_seed_needed_false_when_admin_exists(db_session):
    admin = UsuarioAdministrativo(
        id="ADM-SEED-1",
        nome="Admin",
        login="admin_existente",
        senha_hash=hash_password("Senha@123"),
        email="admin@example.com",
        nivel_acesso=NivelAcessoAdmin.ADMIN_SITE,
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(admin)
    db_session.commit()

    assert check_seed_needed(db_session) is False


def test_seed_database_creates_bootstrap_admin_paroquia_and_configs(db_session):
    created = seed_database(db_session)

    assert created is True

    admin = db_session.query(UsuarioAdministrativo).filter(UsuarioAdministrativo.login == "Admin").first()
    paroquia = db_session.query(Paroquia).first()
    configs_count = db_session.query(Configuracao).count()

    assert admin is not None
    assert admin.ativo is True
    assert paroquia is not None
    assert configs_count > 0

    # segunda execução não deve recriar seed
    created_again = seed_database(db_session)
    assert created_again is False


def test_registrar_auditoria_sistema_create_and_update(db_session):
    # Primeiro registro
    registrar_auditoria_sistema(db_session)
    audit = db_session.query(SistemaAuditoria).filter(SistemaAuditoria.id == "SYSTEM").first()

    assert audit is not None
    first_count = audit.contagem_inicializacoes

    # Inserir seed ativo para refletir seed_ativo=True
    admin = UsuarioAdministrativo(
        id="ADM-SEED-AUD-1",
        nome="Admin",
        login="Admin",
        senha_hash=hash_password("admin123"),
        email=None,
        nivel_acesso=NivelAcessoAdmin.ADMIN_SITE,
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(admin)
    db_session.commit()

    registrar_auditoria_sistema(db_session)
    updated = db_session.query(SistemaAuditoria).filter(SistemaAuditoria.id == "SYSTEM").first()

    assert updated is not None
    assert updated.contagem_inicializacoes == first_count + 1
    assert updated.seed_ativo is True
