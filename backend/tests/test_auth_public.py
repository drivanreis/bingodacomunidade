import pytest
from httpx import AsyncClient

from src.models.models import UsuarioComum
from src.utils.auth import hash_password
from src.utils.time_manager import get_fortaleza_time


@pytest.mark.asyncio
async def test_signup_fiel_success(test_app, db_session):
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
