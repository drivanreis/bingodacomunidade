import pytest
from httpx import AsyncClient

from src.models.models import UsuarioAdministrativo, NivelAcessoAdmin
from src.utils.auth import hash_password
from src.utils.time_manager import get_fortaleza_time


@pytest.mark.asyncio
async def test_admin_site_login_by_login(test_app, db_session):
    admin = UsuarioAdministrativo(
        id="ADM-1",
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

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/admin-site/login",
            json={"login": "admin_real", "senha": "Senha@123"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["access_token"]
    assert data["usuario"]["login"] == "admin_real"


@pytest.mark.asyncio
async def test_admin_site_login_by_email(test_app, db_session):
    admin = UsuarioAdministrativo(
        id="ADM-2",
        nome="Admin Email",
        login="admin_email",
        senha_hash=hash_password("Senha@123"),
        email="admin@email.com",
        nivel_acesso=NivelAcessoAdmin.ADMIN_SITE,
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(admin)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/admin-site/login",
            json={"login": "admin@email.com", "senha": "Senha@123"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["usuario"]["login"] == "admin_email"


@pytest.mark.asyncio
async def test_admin_site_login_wrong_password(test_app, db_session):
    admin = UsuarioAdministrativo(
        id="ADM-3",
        nome="Admin Errado",
        login="admin_errado",
        senha_hash=hash_password("Senha@123"),
        email="admin@errado.com",
        nivel_acesso=NivelAcessoAdmin.ADMIN_SITE,
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(admin)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/admin-site/login",
            json={"login": "admin_errado", "senha": "SenhaErrada"},
        )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_admin_site_login_rejects_admin_paroquia(test_app, db_session):
    admin = UsuarioAdministrativo(
        id="ADM-4",
        nome="Admin Paroquia",
        login="paroquia_admin",
        senha_hash=hash_password("Senha@123"),
        email="paroquia@admin.com",
        nivel_acesso=NivelAcessoAdmin.ADMIN_PAROQUIA,
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(admin)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/admin-site/login",
            json={"login": "paroquia_admin", "senha": "Senha@123"},
        )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_bootstrap_login_not_found(test_app):
    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/bootstrap/login",
            json={"login": "Admin", "senha": "admin123"},
        )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_bootstrap_login_success(test_app, db_session):
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

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/bootstrap/login",
            json={"login": "Admin", "senha": "admin123"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["bootstrap"] is True
