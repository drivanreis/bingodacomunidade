import pytest
from datetime import timedelta
from httpx import AsyncClient

from src.models.models import UsuarioComum, UsuarioParoquia, RoleParoquia, RoleParoquiaCodigo
from src.utils.auth import hash_password
from src.utils.time_manager import get_fortaleza_time


def liberar_acesso_publico(db_session):
    role_admin = RoleParoquia(
        id="ROL-REC-1",
        codigo=RoleParoquiaCodigo.ADMIN.value,
        nome="Administrador Paroquial",
        descricao="Role admin para liberar recuperação de senha",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    admin_paroquia = UsuarioParoquia(
        id="ADM-REC-1",
        nome="Admin Paroquia",
        login="admin_paroquia_recuperacao",
        senha_hash=hash_password("Senha@123"),
        email="admin.paroquia.recuperacao@example.com",
        paroquia_id="PAR-REC-1",
        role_id=role_admin.id,
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add_all([role_admin, admin_paroquia])
    db_session.commit()


@pytest.mark.asyncio
async def test_forgot_password_rejects_unknown_user(test_app, db_session):
    liberar_acesso_publico(db_session)
    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/forgot-password",
            json={"cpf": "12345678909"},
        )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_usuario_comum_burro_forgot_password_with_nonexistent_email(test_app, db_session):
    liberar_acesso_publico(db_session)
    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/forgot-password",
            json={"email": "naoexiste@exemplo.com"},
        )

    assert response.status_code in (200, 404)


@pytest.mark.asyncio
async def test_forgot_password_accepts_email(test_app, db_session):
    liberar_acesso_publico(db_session)
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
    liberar_acesso_publico(db_session)
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
    liberar_acesso_publico(db_session)
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
    liberar_acesso_publico(db_session)
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


@pytest.mark.asyncio
async def test_usuario_comum_hacker_reset_with_expired_token_is_blocked(test_app, db_session):
    liberar_acesso_publico(db_session)
    user = UsuarioComum(
        id="USR-REC-5",
        nome="Ester",
        cpf="44455566677",
        email="ester@example.com",
        telefone="85999998888",
        whatsapp="+5585999998888",
        chave_pix="ester@example.com",
        senha_hash=hash_password("Senha@123"),
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    user.token_recuperacao = "token-hacker-expirado"
    user.token_expiracao = get_fortaleza_time() - timedelta(minutes=5)

    db_session.add(user)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/reset-password",
            json={"token": "token-hacker-expirado", "nova_senha": "Nova@123"},
        )

    assert response.status_code in (400, 401, 403)
