import pytest
from datetime import timedelta
from httpx import AsyncClient

from src.models.models import UsuarioComum
from src.utils.auth import hash_password
from src.utils.time_manager import get_fortaleza_time


@pytest.mark.asyncio
async def test_forgot_password_rejects_unknown_user(test_app):
    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/forgot-password",
            json={"cpf": "12345678909"},
        )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_forgot_password_accepts_email(test_app, db_session):
    user = UsuarioComum(
        id="USR-REC-1",
        nome="João",
        cpf="12345678909",
        email="joao@example.com",
        telefone="85999998888",
        whatsapp="+5585999998888",
        chave_pix="joao@example.com",
        senha_hash=hash_password("Senha@123"),
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(user)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/forgot-password",
            json={"email": "joao@example.com"},
        )

    assert response.status_code == 200

    db_session.refresh(user)
    assert user.token_recuperacao
    assert user.token_expiracao


@pytest.mark.asyncio
async def test_forgot_password_accepts_cpf(test_app, db_session):
    user = UsuarioComum(
        id="USR-REC-2",
        nome="Maria",
        cpf="11144477735",
        email="maria@example.com",
        telefone="85999998888",
        whatsapp="+5585999998888",
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
            "/auth/forgot-password",
            json={"cpf": "11144477735"},
        )

    assert response.status_code == 200

    db_session.refresh(user)
    assert user.token_recuperacao
    assert user.token_expiracao


@pytest.mark.asyncio
async def test_reset_password_with_valid_token_and_single_use(test_app, db_session):
    user = UsuarioComum(
        id="USR-REC-3",
        nome="Carlos",
        cpf="22233344455",
        email="carlos@example.com",
        telefone="85999998888",
        whatsapp="+5585999998888",
        chave_pix="carlos@example.com",
        senha_hash=hash_password("Senha@123"),
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(user)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/forgot-password",
            json={"email": "carlos@example.com"},
        )

    assert response.status_code == 200
    db_session.refresh(user)

    token = user.token_recuperacao
    assert token

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        reset_response = await client.post(
            "/auth/reset-password",
            json={"token": token, "nova_senha": "Nova@123"},
        )

    assert reset_response.status_code == 200

    db_session.refresh(user)
    assert user.token_recuperacao is None
    assert user.token_expiracao is None

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        reused_response = await client.post(
            "/auth/reset-password",
            json={"token": token, "nova_senha": "Nova@123"},
        )

    assert reused_response.status_code == 400


@pytest.mark.asyncio
async def test_reset_password_rejects_expired_token(test_app, db_session):
    user = UsuarioComum(
        id="USR-REC-4",
        nome="Ana",
        cpf="33344455566",
        email="ana@example.com",
        telefone="85999998888",
        whatsapp="+5585999998888",
        chave_pix="ana@example.com",
        senha_hash=hash_password("Senha@123"),
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    user.token_recuperacao = "token-expirado"
    user.token_expiracao = get_fortaleza_time() - timedelta(minutes=1)

    db_session.add(user)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/reset-password",
            json={"token": "token-expirado", "nova_senha": "Nova@123"},
        )

    assert response.status_code == 400
