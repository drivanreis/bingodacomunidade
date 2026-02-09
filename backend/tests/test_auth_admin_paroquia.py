import pytest
from httpx import AsyncClient

from src.models.models import UsuarioAdministrativo, NivelAcessoAdmin
from src.utils.auth import hash_password
from src.utils.time_manager import get_fortaleza_time


@pytest.mark.asyncio
async def test_admin_paroquia_login_by_login(test_app, db_session):
    admin = UsuarioAdministrativo(
        id="ADM-P1",
        nome="Admin Paroquia",
        login="paroquia_admin",
        senha_hash=hash_password("Senha@123"),
        email="paroquia@admin.com",
        nivel_acesso=NivelAcessoAdmin.ADMIN_PAROQUIA,
        paroquia_id="PAR-1",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(admin)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/admin-paroquia/login",
            json={"login": "paroquia_admin", "senha": "Senha@123"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["usuario"]["login"] == "paroquia_admin"


@pytest.mark.asyncio
async def test_admin_paroquia_login_by_email(test_app, db_session):
    admin = UsuarioAdministrativo(
        id="ADM-P2",
        nome="Admin Paroquia",
        login="paroquia_admin2",
        senha_hash=hash_password("Senha@123"),
        email="paroquia2@admin.com",
        nivel_acesso=NivelAcessoAdmin.ADMIN_PAROQUIA,
        paroquia_id="PAR-2",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(admin)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/admin-paroquia/login",
            json={"login": "paroquia2@admin.com", "senha": "Senha@123"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["usuario"]["login"] == "paroquia_admin2"


@pytest.mark.asyncio
async def test_admin_paroquia_login_rejects_admin_site(test_app, db_session):
    admin = UsuarioAdministrativo(
        id="ADM-S1",
        nome="Admin Site",
        login="admin_site",
        senha_hash=hash_password("Senha@123"),
        email="admin@site.com",
        nivel_acesso=NivelAcessoAdmin.ADMIN_SITE,
        paroquia_id=None,
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(admin)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/admin-paroquia/login",
            json={"login": "admin_site", "senha": "Senha@123"},
        )

    assert response.status_code == 403
