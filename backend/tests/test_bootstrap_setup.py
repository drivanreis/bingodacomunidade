import pytest
from httpx import AsyncClient

from src.models.models import UsuarioAdministrativo, NivelAcessoAdmin
from src.utils.auth import hash_password
from src.utils.time_manager import get_fortaleza_time


@pytest.mark.asyncio
async def test_bootstrap_setup_creates_first_admin(test_app, db_session):
    payload = {
        "nome": "Admin Real",
        "login": "75568241368",
        "email": "admin@exemplo.com",
        "senha": "Senha@123",
        "telefone": "85999998888",
        "whatsapp": "+5585999998888",
    }

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post("/auth/bootstrap", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["access_token"]
    assert data["usuario"]["login"] == "75568241368"


@pytest.mark.asyncio
async def test_bootstrap_setup_updates_existing_bootstrap(test_app, db_session):
    bootstrap = UsuarioAdministrativo(
        id="ADM-BOOT",
        nome="Bootstrap",
        login="Admin",
        senha_hash=hash_password("admin123"),
        email=None,
        nivel_acesso=NivelAcessoAdmin.ADMIN_SITE,
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(bootstrap)
    db_session.commit()

    payload = {
        "nome": "Admin Real",
        "login": "admin_real",
        "email": "admin@exemplo.com",
        "senha": "Senha@123",
        "telefone": "85999998888",
        "whatsapp": "+5585999998888",
    }

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post("/auth/bootstrap", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["usuario"]["login"] == "admin_real"


@pytest.mark.asyncio
async def test_bootstrap_setup_conflict_when_admin_exists(test_app, db_session):
    admin = UsuarioAdministrativo(
        id="ADM-REAL",
        nome="Admin Real",
        login="admin_real",
        senha_hash=hash_password("Senha@123"),
        email="admin@exemplo.com",
        nivel_acesso=NivelAcessoAdmin.ADMIN_SITE,
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(admin)
    db_session.commit()

    payload = {
        "nome": "Outro Admin",
        "login": "admin_outro",
        "email": "outro@exemplo.com",
        "senha": "Senha@123",
        "telefone": "85999998888",
        "whatsapp": "+5585999998888",
    }

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post("/auth/bootstrap", json=payload)

    assert response.status_code == 409
