import pytest
from httpx import AsyncClient

from src.models.models import UsuarioComum
from src.models.models import UsuarioAdministrativo, NivelAcessoAdmin
from src.utils.auth import hash_password
from src.utils.time_manager import get_fortaleza_time


def liberar_acesso_publico(db_session):
    admin_paroquia = UsuarioAdministrativo(
        id="ADM-PAROQ-1",
        nome="Admin Paroquia",
        login="admin_paroquia",
        senha_hash=hash_password("Senha@123"),
        email="admin.paroquia@example.com",
        nivel_acesso=NivelAcessoAdmin.ADMIN_PAROQUIA,
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(admin_paroquia)
    db_session.commit()


@pytest.mark.asyncio
async def test_signup_fiel_success(test_app, db_session):
    liberar_acesso_publico(db_session)
    payload = {
        "nome": "João da Silva",
        "cpf": "12345678909",
        "email": "joao@example.com",
        "telefone": "85999998888",
        "whatsapp": "+5585999998888",
        "chave_pix": "joao@example.com",
        "senha": "Senha@123",
    }

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post("/auth/signup", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["access_token"]
    assert data["usuario"]["cpf"] == "12345678909"


@pytest.mark.asyncio
async def test_signup_fiel_duplicate_cpf(test_app, db_session):
    liberar_acesso_publico(db_session)
    user = UsuarioComum(
        id="USR-1",
        nome="João da Silva",
        cpf="12345678909",
        email="joao1@example.com",
        telefone="85999998888",
        whatsapp="+5585999998888",
        chave_pix="joao1@example.com",
        senha_hash=hash_password("Senha@123"),
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(user)
    db_session.commit()

    payload = {
        "nome": "João da Silva",
        "cpf": "12345678909",
        "email": "joao2@example.com",
        "telefone": "85999998888",
        "whatsapp": "+5585999998888",
        "chave_pix": "joao2@example.com",
        "senha": "Senha@123",
    }

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post("/auth/signup", json=payload)

    assert response.status_code == 409


@pytest.mark.asyncio
async def test_login_fiel_success(test_app, db_session):
    liberar_acesso_publico(db_session)
    user = UsuarioComum(
        id="USR-2",
        nome="Maria",
        cpf="11144477735",
        email="maria@example.com",
        telefone="85988887777",
        whatsapp="+5585988887777",
        chave_pix="maria@example.com",
        senha_hash=hash_password("Senha@123"),
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(user)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/login",
            json={"cpf": "111.444.777-35", "senha": "Senha@123"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["access_token"]
    assert data["usuario"]["cpf"] == "11144477735"


@pytest.mark.asyncio
async def test_login_fiel_wrong_password(test_app, db_session):
    liberar_acesso_publico(db_session)
    user = UsuarioComum(
        id="USR-3",
        nome="Maria",
        cpf="12345678909",
        email="maria2@example.com",
        telefone="85988887777",
        whatsapp="+5585988887777",
        chave_pix="maria2@example.com",
        senha_hash=hash_password("Senha@123"),
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(user)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/login",
            json={"cpf": "12345678909", "senha": "SenhaErrada"},
        )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_signup_fiel_blocked_when_public_in_maintenance(test_app, db_session):
    payload = {
        "nome": "João da Silva",
        "cpf": "12345678909",
        "email": "joao@example.com",
        "telefone": "85999998888",
        "whatsapp": "+5585999998888",
        "chave_pix": "joao@example.com",
        "senha": "Senha@123",
    }

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post("/auth/signup", json=payload)

    assert response.status_code == 403
    assert "manutenção" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_public_status_reports_maintenance_without_admin_paroquia(test_app):
    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.get("/auth/public-status")

    assert response.status_code == 200
    data = response.json()
    assert data["maintenance_mode"] is True


@pytest.mark.asyncio
async def test_public_status_reports_maintenance_false_with_active_admin_paroquia(test_app, db_session):
    admin_paroquia = UsuarioAdministrativo(
        id="ADM-PUBLIC-READY",
        nome="Admin Paroquia",
        login="admin_paroquia_real",
        senha_hash=hash_password("Senha@123"),
        email="paroquia@exemplo.com",
        nivel_acesso=NivelAcessoAdmin.ADMIN_PAROQUIA,
        paroquia_id="PAR-1",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(admin_paroquia)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.get("/auth/public-status")

    assert response.status_code == 200
    data = response.json()
    assert data["maintenance_mode"] is False


@pytest.mark.asyncio
async def test_persona_usuario_comum_inteligente_signup_success(test_app, db_session):
    liberar_acesso_publico(db_session)
    payload = {
        "nome": "João da Silva",
        "cpf": "12345678909",
        "email": "joao.inteligente@example.com",
        "telefone": "85999998888",
        "whatsapp": "+5585999998888",
        "chave_pix": "joao.inteligente@example.com",
        "senha": "Senha@123",
    }

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post("/auth/signup", json=payload)

    assert response.status_code == 201


@pytest.mark.asyncio
async def test_persona_usuario_comum_burro_signup_duplicate_cpf(test_app, db_session):
    liberar_acesso_publico(db_session)
    user = UsuarioComum(
        id="USR-BURRO-1",
        nome="João Burro",
        cpf="98765432100",
        email="joao.burro1@example.com",
        telefone="85999998888",
        whatsapp="+5585999998888",
        chave_pix="joao.burro1@example.com",
        senha_hash=hash_password("Senha@123"),
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(user)
    db_session.commit()

    payload = {
        "nome": "João Burro",
        "cpf": "98765432100",
        "email": "joao.burro2@example.com",
        "telefone": "85999998888",
        "whatsapp": "+5585999998888",
        "chave_pix": "joao.burro2@example.com",
        "senha": "Senha@123",
    }

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post("/auth/signup", json=payload)

    assert response.status_code == 409


@pytest.mark.asyncio
async def test_persona_usuario_comum_hacker_signup_script_injection_blocked(test_app, db_session):
    liberar_acesso_publico(db_session)
    payload = {
        "nome": "<script>alert('xss')</script>",
        "cpf": "12345678909",
        "email": "hacker@example.com",
        "telefone": "85999998888",
        "whatsapp": "+5585999998888",
        "chave_pix": "hacker@example.com",
        "senha": "Senha@123",
    }

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post("/auth/signup", json=payload)

    assert response.status_code in (400, 422)
