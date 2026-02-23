import pytest
from httpx import AsyncClient

from src.models.models import UsuarioAdministrativo, NivelAcessoAdmin, Configuracao, TipoConfiguracao, CategoriaConfiguracao
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


@pytest.mark.asyncio
async def test_persona_admin_paroquia_inteligente_login_success(test_app, db_session):
    admin = UsuarioAdministrativo(
        id="ADM-PER-P-1",
        nome="Admin Paroquia Inteligente",
        login="admin_paroquia_inteligente",
        senha_hash=hash_password("Senha@123"),
        email="admin.paroquia.inteligente@example.com",
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
            json={"login": "admin_paroquia_inteligente", "senha": "Senha@123"},
        )

    assert response.status_code == 200


@pytest.mark.asyncio
async def test_persona_admin_paroquia_burro_wrong_password_returns_401(test_app, db_session):
    admin = UsuarioAdministrativo(
        id="ADM-PER-P-2",
        nome="Admin Paroquia Burro",
        login="admin_paroquia_burro",
        senha_hash=hash_password("Senha@123"),
        email="admin.paroquia.burro@example.com",
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
            json={"login": "admin_paroquia_burro", "senha": "senha_errada"},
        )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_persona_admin_paroquia_hacker_admin_site_forbidden(test_app, db_session):
    admin = UsuarioAdministrativo(
        id="ADM-PER-P-3",
        nome="Admin Site",
        login="admin_site_hacker",
        senha_hash=hash_password("Senha@123"),
        email="admin.site.hacker@example.com",
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
            json={"login": "admin_site_hacker", "senha": "Senha@123"},
        )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_paroquia_login_exige_troca_de_senha_temporaria_quando_pendente(test_app, db_session):
    admin = UsuarioAdministrativo(
        id="ADM-PAR-PEND-1",
        nome="Admin Paroquia Pendente",
        login="admin_par_pendente",
        senha_hash=hash_password("Temp@123"),
        email="admin.par.pendente@example.com",
        nivel_acesso=NivelAcessoAdmin.ADMIN_PAROQUIA,
        paroquia_id="PAR-1",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(admin)
    db_session.add(
        Configuracao(
            chave="admin_initial_password_pending::ADM-PAR-PEND-1",
            valor="true",
            tipo=TipoConfiguracao.BOOLEAN,
            categoria=CategoriaConfiguracao.SEGURANCA,
            descricao="Pendente troca inicial",
        )
    )
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/admin-paroquia/login",
            json={"login": "admin_par_pendente", "senha": "Temp@123"},
        )

    assert response.status_code == 428
    detail = response.json()["detail"]
    assert detail["needs_password_change"] is True
    assert detail["nivel_acesso"] == "admin_paroquia"


@pytest.mark.asyncio
async def test_admin_paroquia_troca_senha_inicial_libera_login(test_app, db_session):
    admin = UsuarioAdministrativo(
        id="ADM-PAR-PEND-2",
        nome="Admin Paroquia Pendente 2",
        login="admin_par_pendente_2",
        senha_hash=hash_password("Temp@123"),
        email="admin.par.pendente2@example.com",
        nivel_acesso=NivelAcessoAdmin.ADMIN_PAROQUIA,
        paroquia_id="PAR-2",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(admin)
    db_session.add(
        Configuracao(
            chave="admin_initial_password_pending::ADM-PAR-PEND-2",
            valor="true",
            tipo=TipoConfiguracao.BOOLEAN,
            categoria=CategoriaConfiguracao.SEGURANCA,
            descricao="Pendente troca inicial",
        )
    )
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        troca = await client.post(
            "/auth/admin-paroquia/troca-senha-inicial",
            json={
                "login": "admin_par_pendente_2",
                "senha_atual": "Temp@123",
                "nova_senha": "NovaTemp@123",
            },
        )

        assert troca.status_code == 200

        login = await client.post(
            "/auth/admin-paroquia/login",
            json={"login": "admin_par_pendente_2", "senha": "NovaTemp@123"},
        )

    assert login.status_code == 200
