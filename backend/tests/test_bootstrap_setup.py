import pytest
from httpx import AsyncClient

from src.models.models import AdminSiteUser
from src.utils.auth import hash_password
from src.utils.time_manager import get_fortaleza_time


@pytest.mark.asyncio
async def test_bootstrap_setup_creates_first_admin(test_app, db_session):
    payload = {
        "nome": "Admin Inicial",
        "email": "admin@exemplo.com",
        "cpf": "11144477735",
        "senha": "Senha@123",
        "telefone": "85999998888",
    }

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post("/auth/bootstrap", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["access_token"]
    assert data["usuario"]["login"] == "admin@exemplo.com"


@pytest.mark.asyncio
async def test_bootstrap_setup_updates_existing_bootstrap(test_app, db_session):
    bootstrap = AdminSiteUser(
        id="ADM-BOOT",
        nome="Bootstrap",
        login="Admin",
        senha_hash=hash_password("admin123"),
        email=None,
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(bootstrap)
    db_session.commit()

    payload = {
        "nome": "Admin Inicial",
        "email": "admin@exemplo.com",
        "cpf": "98765432100",
        "senha": "Senha@123",
        "telefone": "85999998888",
    }

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post("/auth/bootstrap", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["usuario"]["login"] == "admin@exemplo.com"

    bootstrap_after = db_session.query(AdminSiteUser).filter(
        AdminSiteUser.login == "Admin"
    ).first()
    assert bootstrap_after is not None
    assert bootstrap_after.ativo is False

    novo_lider = db_session.query(AdminSiteUser).filter(
        AdminSiteUser.login == "admin@exemplo.com"
    ).first()
    assert novo_lider is not None
    assert novo_lider.ativo is True


@pytest.mark.asyncio
async def test_bootstrap_setup_conflict_when_admin_exists(test_app, db_session):
    admin = AdminSiteUser(
        id="ADM-REAL",
        nome="Admin Real",
        login="admin_real",
        senha_hash=hash_password("Senha@123"),
        email="admin@exemplo.com",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(admin)
    db_session.commit()

    payload = {
        "nome": "Admin Inicial",
        "email": "outro@exemplo.com",
        "cpf": "12345678909",
        "senha": "Senha@123",
        "telefone": "85999998888",
    }

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post("/auth/bootstrap", json=payload)

    assert response.status_code == 409


@pytest.mark.asyncio
async def test_bootstrap_login_returns_404_after_seed_inactivation(test_app, db_session):
    bootstrap = AdminSiteUser(
        id="ADM-BOOT-2",
        nome="Bootstrap",
        login="Admin",
        senha_hash=hash_password("admin123"),
        email=None,
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(bootstrap)
    db_session.commit()

    payload = {
        "nome": "Admin Inicial",
        "email": "novo@exemplo.com",
        "cpf": "52998224725",
        "senha": "Senha@123",
        "telefone": "85999998888",
    }

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        bootstrap_setup_response = await client.post("/auth/bootstrap", json=payload)
        assert bootstrap_setup_response.status_code == 201

        bootstrap_login_response = await client.post(
            "/auth/bootstrap/login",
            json={"login": "Admin", "senha": "admin123"},
        )

    assert bootstrap_login_response.status_code == 404


@pytest.mark.asyncio
async def test_bootstrap_setup_keeps_seed_id_1_and_inactivates_it(test_app, db_session):
    bootstrap = AdminSiteUser(
        id="1",
        nome="Bootstrap",
        login="Admin",
        senha_hash=hash_password("admin123"),
        email=None,
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(bootstrap)
    db_session.commit()

    payload = {
        "nome": "Admin Inicial",
        "email": "lider@exemplo.com",
        "cpf": "39053344705",
        "senha": "Senha@123",
        "telefone": "85999998888",
    }

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post("/auth/bootstrap", json=payload)

    assert response.status_code == 201

    seed_after = db_session.query(AdminSiteUser).filter(
        AdminSiteUser.id == "1"
    ).first()
    assert seed_after is not None
    assert seed_after.login == "Admin"
    assert seed_after.ativo is False
