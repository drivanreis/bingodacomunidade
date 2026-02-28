import pytest
from httpx import AsyncClient

from src.models.models import (
    AdminSiteUser,
    UsuarioParoquia,
    Paroquia,
    RoleParoquia,
    Configuracao,
    TipoConfiguracao,
    CategoriaConfiguracao,
)
from src.utils.auth import hash_password, verify_password
from src.utils.time_manager import get_fortaleza_time
from src.routers import auth_routes


@pytest.mark.asyncio
async def test_admin_site_login_by_login(test_app, db_session):
    admin = AdminSiteUser(
        id="ADM-1",
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
    admin = AdminSiteUser(
        id="ADM-2",
        nome="Admin Email",
        login="admin_email",
        senha_hash=hash_password("Senha@123"),
        email="admin@email.com",
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
    admin = AdminSiteUser(
        id="ADM-3",
        nome="Admin Errado",
        login="admin_errado",
        senha_hash=hash_password("Senha@123"),
        email="admin@errado.com",
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
    role_admin_paroquia = RoleParoquia(
        id="ROL-ADM-SITE-REJECT-1",
        codigo="paroquia_admin",
        nome="Administrador Paroquial",
        descricao="Role admin paroquial para teste",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    admin = UsuarioParoquia(
        id="ADM-4",
        nome="Admin Paroquia",
        login="paroquia_admin",
        senha_hash=hash_password("Senha@123"),
        email="paroquia@admin.com",
        paroquia_id="PAR-ADM-SITE-REJECT-1",
        role_id=role_admin_paroquia.id,
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add_all([role_admin_paroquia, admin])
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/admin-site/login",
            json={"login": "paroquia_admin", "senha": "Senha@123"},
        )

    assert response.status_code == 401


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

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/bootstrap/login",
            json={"login": "Admin", "senha": "admin123"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["bootstrap"] is True


@pytest.mark.asyncio
async def test_persona_admin_site_inteligente_login_success(test_app, db_session):
    admin = AdminSiteUser(
        id="ADM-PER-1",
        nome="Admin Inteligente",
        login="admin_inteligente",
        senha_hash=hash_password("Senha@123"),
        email="admin.inteligente@example.com",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(admin)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/admin-site/login",
            json={"login": "admin_inteligente", "senha": "Senha@123"},
        )

    assert response.status_code == 200


@pytest.mark.asyncio
async def test_persona_admin_site_burro_wrong_password_returns_401(test_app, db_session):
    admin = AdminSiteUser(
        id="ADM-PER-2",
        nome="Admin Burro",
        login="admin_burro",
        senha_hash=hash_password("Senha@123"),
        email="admin.burro@example.com",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(admin)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/admin-site/login",
            json={"login": "admin_burro", "senha": "senha_errada"},
        )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_persona_admin_site_hacker_admin_paroquia_forbidden(test_app, db_session):
    role_admin_paroquia = RoleParoquia(
        id="ROL-ADM-SITE-REJECT-2",
        codigo="paroquia_admin",
        nome="Administrador Paroquial",
        descricao="Role admin paroquial para teste",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    admin = UsuarioParoquia(
        id="ADM-PER-3",
        nome="Admin Paroquia",
        login="admin_paroquia_hacker",
        senha_hash=hash_password("Senha@123"),
        email="admin.paroquia.hacker@example.com",
        paroquia_id="PAR-ADM-SITE-REJECT-2",
        role_id=role_admin_paroquia.id,
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add_all([role_admin_paroquia, admin])
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/admin-site/login",
            json={"login": "admin_paroquia_hacker", "senha": "Senha@123"},
        )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_admin_site_lista_admins_para_sucessao(test_app, db_session):
    admin_atual = AdminSiteUser(
        id="ADM-LST-1",
        nome="Admin Atual",
        login="admin_atual",
        senha_hash=hash_password("Senha@123"),
        email="atual@example.com",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    admin_reserva = AdminSiteUser(
        id="ADM-LST-2",
        nome="Admin Reserva",
        login="admin_reserva",
        senha_hash=hash_password("Senha@123"),
        email="reserva@example.com",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add_all([admin_atual, admin_reserva])
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        login_response = await client.post(
            "/auth/admin-site/login",
            json={"login": "admin_atual", "senha": "Senha@123"},
        )
        token = login_response.json()["access_token"]

        response = await client.get(
            "/auth/admin-site/admins",
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 200
    payload = response.json()
    assert "admins" in payload
    assert any(a["login"] == "admin_atual" and a["is_current"] is True for a in payload["admins"])
    assert any(a["login"] == "admin_reserva" for a in payload["admins"])


@pytest.mark.asyncio
async def test_admin_site_inativa_reserva_sem_perder_ultimo_ativo(test_app, db_session):
    admin_atual = AdminSiteUser(
        id="ADM-STS-1",
        nome="Admin Atual",
        login="admin_sts_atual",
        senha_hash=hash_password("Senha@123"),
        email="sts.atual@example.com",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    admin_reserva = AdminSiteUser(
        id="ADM-STS-2",
        nome="Admin Reserva",
        login="admin_sts_reserva",
        senha_hash=hash_password("Senha@123"),
        email="sts.reserva@example.com",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add_all([admin_atual, admin_reserva])
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        login_response = await client.post(
            "/auth/admin-site/login",
            json={"login": "admin_sts_atual", "senha": "Senha@123"},
        )
        token = login_response.json()["access_token"]

        response = await client.put(
            f"/auth/admin-site/admins/{admin_reserva.id}/status",
            params={"ativo": False},
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 200
    assert response.json()["ativo"] is False


@pytest.mark.asyncio
async def test_admin_site_cria_reserva_com_entrega_manual_de_senha_temporaria(test_app, db_session):
    admin_atual = AdminSiteUser(
        id="ADM-CRT-1",
        nome="Admin Criador",
        login="admin_criador",
        senha_hash=hash_password("Senha@123"),
        email="criador@example.com",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(admin_atual)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        login_response = await client.post(
            "/auth/admin-site/login",
            json={"login": "admin_criador", "senha": "Senha@123"},
        )
        token = login_response.json()["access_token"]

        response = await client.post(
            "/auth/admin-site/criar-admin-site",
            json={
                "nome": "Admin Reserva",
                "email": "reserva@example.com",
                "cpf": "11144477735",
                "telefone": "85999990000",
                "whatsapp": "85999990000",
                "senha": "SenhaTemp@123",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 201
    payload = response.json()
    assert payload["email_sent"] is False
    assert payload["credential_delivery"] == "manual"

    admin_reserva = db_session.query(AdminSiteUser).filter(
        AdminSiteUser.login == "reserva@example.com"
    ).first()
    assert admin_reserva is not None
    assert admin_reserva.login == "reserva@example.com"
    assert admin_reserva.ativo is True

    pending_cfg = db_session.query(Configuracao).filter(
        Configuracao.chave == f"admin_initial_password_pending::{admin_reserva.id}"
    ).first()
    assert pending_cfg is not None
    assert (pending_cfg.valor or "").lower() == "true"


@pytest.mark.asyncio
async def test_admin_site_login_exige_troca_de_senha_temporaria_quando_pendente(test_app, db_session):
    admin = AdminSiteUser(
        id="ADM-PEND-1",
        nome="Admin Pendente",
        login="admin_pendente",
        senha_hash=hash_password("Temp@123"),
        email="pendente@example.com",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(admin)
    db_session.add(
        Configuracao(
            chave="admin_initial_password_pending::ADM-PEND-1",
            valor="true",
            tipo=TipoConfiguracao.BOOLEAN,
            categoria=CategoriaConfiguracao.SEGURANCA,
            descricao="Pendente troca inicial",
        )
    )
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/admin-site/login",
            json={"login": "admin_pendente", "senha": "Temp@123"},
        )

    assert response.status_code == 428
    detail = response.json()["detail"]
    assert detail["needs_password_change"] is True
    assert detail["nivel_acesso"] == "admin_site"


@pytest.mark.asyncio
async def test_admin_site_troca_senha_inicial_libera_login(test_app, db_session):
    admin = AdminSiteUser(
        id="ADM-PEND-2",
        nome="Admin Pendente 2",
        login="admin_pendente_2",
        senha_hash=hash_password("Temp@123"),
        email="pendente2@example.com",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(admin)
    db_session.add(
        Configuracao(
            chave="admin_initial_password_pending::ADM-PEND-2",
            valor="true",
            tipo=TipoConfiguracao.BOOLEAN,
            categoria=CategoriaConfiguracao.SEGURANCA,
            descricao="Pendente troca inicial",
        )
    )
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        troca = await client.post(
            "/auth/admin-site/troca-senha-inicial",
            json={
                "login": "admin_pendente_2",
                "senha_atual": "Temp@123",
                "nova_senha": "NovaTemp@123",
            },
        )

        assert troca.status_code == 200

        login = await client.post(
            "/auth/admin-site/login",
            json={"login": "admin_pendente_2", "senha": "NovaTemp@123"},
        )

    assert login.status_code == 200


@pytest.mark.asyncio
async def test_admin_site_reenvia_senha_temporaria_com_sucesso(test_app, db_session, monkeypatch):
    admin_atual = AdminSiteUser(
        id="ADM-RS-1",
        nome="Admin Atual",
        login="admin_reenvio",
        senha_hash=hash_password("Senha@123"),
        email="atual@example.com",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    admin_reserva = AdminSiteUser(
        id="ADM-RS-2",
        nome="Admin Reserva",
        login="admin_reserva_reenvio",
        senha_hash=hash_password("SenhaAntiga@123"),
        email="reserva.reenvio@example.com",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )

    db_session.add_all([
        admin_atual,
        admin_reserva,
        Configuracao(
            chave="emailDevMode",
            valor="false",
            tipo=TipoConfiguracao.BOOLEAN,
            categoria=CategoriaConfiguracao.MENSAGENS,
            descricao="Modo de envio real",
        ),
        Configuracao(
            chave="smtpValidatedAt",
            valor=get_fortaleza_time().isoformat(),
            tipo=TipoConfiguracao.STRING,
            categoria=CategoriaConfiguracao.MENSAGENS,
            descricao="Validação SMTP",
        ),
    ])
    db_session.commit()

    chamada = {"ok": False, "senha": None}

    async def fake_send_admin_site_initial_password(to_email: str, user_name: str, login: str, temporary_password: str, db=None):
        chamada["ok"] = True
        chamada["senha"] = temporary_password
        return True

    monkeypatch.setattr(
        auth_routes.email_service,
        "send_admin_site_initial_password",
        fake_send_admin_site_initial_password,
    )

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        login_response = await client.post(
            "/auth/admin-site/login",
            json={"login": "admin_reenvio", "senha": "Senha@123"},
        )
        token = login_response.json()["access_token"]

        response = await client.post(
            "/auth/admin-site/admins/ADM-RS-2/reenviar-senha",
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 200
    assert response.json()["email_sent"] is True
    assert chamada["ok"] is True
    assert chamada["senha"]

    admin_reserva_atualizado = db_session.query(AdminSiteUser).filter(
        AdminSiteUser.id == "ADM-RS-2"
    ).first()
    assert admin_reserva_atualizado is not None
    assert verify_password(chamada["senha"], admin_reserva_atualizado.senha_hash)


@pytest.mark.asyncio
async def test_admin_site_altera_propria_senha_com_sucesso(test_app, db_session):
    admin_atual = AdminSiteUser(
        id="ADM-PWD-1",
        nome="Admin Atual",
        login="admin_pwd_atual",
        senha_hash=hash_password("Atual@123"),
        email="admin.pwd.atual@example.com",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(admin_atual)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        login_response = await client.post(
            "/auth/admin-site/login",
            json={"login": "admin_pwd_atual", "senha": "Atual@123"},
        )
        token = login_response.json()["access_token"]

        response = await client.post(
            "/auth/admin-site/minha-senha",
            json={"senha_atual": "Atual@123", "nova_senha": "Nova@1234"},
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 200

    admin_atualizado = db_session.query(AdminSiteUser).filter(
        AdminSiteUser.id == "ADM-PWD-1"
    ).first()
    assert admin_atualizado is not None
    assert verify_password("Nova@1234", admin_atualizado.senha_hash)


@pytest.mark.asyncio
async def test_admin_site_define_senha_de_substituto_com_sucesso(test_app, db_session):
    admin_atual = AdminSiteUser(
        id="ADM-PWD-2",
        nome="Admin Atual",
        login="admin_pwd_def",
        senha_hash=hash_password("Atual@123"),
        email="admin.pwd.def@example.com",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    admin_substituto = AdminSiteUser(
        id="ADM-PWD-3",
        nome="Admin Substituto",
        login="admin_sub_pwd",
        senha_hash=hash_password("Antiga@123"),
        email="admin.sub.pwd@example.com",
        ativo=False,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add_all([admin_atual, admin_substituto])
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        login_response = await client.post(
            "/auth/admin-site/login",
            json={"login": "admin_pwd_def", "senha": "Atual@123"},
        )
        token = login_response.json()["access_token"]

        response = await client.post(
            "/auth/admin-site/admins/ADM-PWD-3/definir-senha",
            json={"nova_senha": "NovaSub@123"},
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 200

    admin_sub_atualizado = db_session.query(AdminSiteUser).filter(
        AdminSiteUser.id == "ADM-PWD-3"
    ).first()
    assert admin_sub_atualizado is not None
    assert verify_password("NovaSub@123", admin_sub_atualizado.senha_hash)


@pytest.mark.asyncio
async def test_admin_site_cria_admin_paroquia_em_tabela_dedicada(test_app, db_session):
    admin_site = AdminSiteUser(
        id="ADM-CP-1",
        nome="Admin Site Criador",
        login="admin_site_criador",
        senha_hash=hash_password("Senha@123"),
        email="admin.site.criador@example.com",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    paroquia = Paroquia(
        id="PAR-CP-1",
        nome="Paróquia São Pedro",
        email="saopedro@example.com",
        telefone="85999990000",
        endereco="Rua Central",
        cidade="Fortaleza",
        estado="CE",
        cep="60000000",
        chave_pix="pix-saopedro@example.com",
        ativa=True,
    )
    role_admin = RoleParoquia(
        id="ROL-CP-1",
        codigo="paroquia_admin",
        nome="Administrador Paroquial",
        descricao="Admin da paróquia",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add_all([admin_site, paroquia, role_admin])
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        login_response = await client.post(
            "/auth/admin-site/login",
            json={"login": "admin_site_criador", "senha": "Senha@123"},
        )
        token = login_response.json()["access_token"]

        response = await client.post(
            "/auth/admin-site/criar-admin-paroquia",
            json={
                "nome": "Admin Paroquial Novo",
                "login": "admin_paroquial_novo",
                "senha": "SenhaTemp@123",
                "email": "paroquial.novo@example.com",
                "telefone": "85988887777",
                "whatsapp": "85988887777",
                "paroquia_id": "PAR-CP-1",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 201
    data = response.json()
    assert data["paroquia_id"] == "PAR-CP-1"

    admin_paroquia = db_session.query(UsuarioParoquia).filter(
        UsuarioParoquia.login == "admin_paroquial_novo"
    ).first()
    assert admin_paroquia is not None
    assert admin_paroquia.paroquia_id == "PAR-CP-1"


@pytest.mark.asyncio
async def test_admin_site_criar_reserva_rejeita_email_duplicado(test_app, db_session):
    admin_atual = AdminSiteUser(
        id="ADM-DUP-E-1",
        nome="Admin Atual",
        login="admin_dup_email",
        senha_hash=hash_password("Senha@123"),
        email="atual.dup.email@example.com",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    existente = AdminSiteUser(
        id="ADM-DUP-E-2",
        nome="Admin Existente",
        login="admin_existente_email",
        senha_hash=hash_password("Senha@123"),
        email="duplicado@example.com",
        cpf="11144477735",
        telefone="85999991111",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add_all([admin_atual, existente])
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        login_response = await client.post(
            "/auth/admin-site/login",
            json={"login": "admin_dup_email", "senha": "Senha@123"},
        )
        token = login_response.json()["access_token"]

        response = await client.post(
            "/auth/admin-site/criar-admin-site",
            json={
                "nome": "Novo Admin",
                "email": "duplicado@example.com",
                "cpf": "39053344705",
                "telefone": "85998887777",
                "whatsapp": "85998887777",
                "senha": "SenhaTemp@123",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 409
    assert "e-mail" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_admin_site_criar_reserva_rejeita_telefone_duplicado(test_app, db_session):
    admin_atual = AdminSiteUser(
        id="ADM-DUP-T-1",
        nome="Admin Atual",
        login="admin_dup_tel",
        senha_hash=hash_password("Senha@123"),
        email="atual.dup.tel@example.com",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    existente = AdminSiteUser(
        id="ADM-DUP-T-2",
        nome="Admin Existente",
        login="admin_existente_tel",
        senha_hash=hash_password("Senha@123"),
        email="existente.tel@example.com",
        cpf="11144477735",
        telefone="85999992222",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add_all([admin_atual, existente])
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        login_response = await client.post(
            "/auth/admin-site/login",
            json={"login": "admin_dup_tel", "senha": "Senha@123"},
        )
        token = login_response.json()["access_token"]

        response = await client.post(
            "/auth/admin-site/criar-admin-site",
            json={
                "nome": "Novo Admin",
                "email": "novo.tel@example.com",
                "cpf": "39053344705",
                "telefone": "85999992222",
                "whatsapp": "85999992222",
                "senha": "SenhaTemp@123",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 409
    assert "telefone" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_admin_site_criar_reserva_rejeita_cpf_duplicado(test_app, db_session):
    admin_atual = AdminSiteUser(
        id="ADM-DUP-C-1",
        nome="Admin Atual",
        login="admin_dup_cpf",
        senha_hash=hash_password("Senha@123"),
        email="atual.dup.cpf@example.com",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    existente = AdminSiteUser(
        id="ADM-DUP-C-2",
        nome="Admin Existente",
        login="admin_existente_cpf",
        senha_hash=hash_password("Senha@123"),
        email="existente.cpf@example.com",
        cpf="11144477735",
        telefone="85999993333",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add_all([admin_atual, existente])
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        login_response = await client.post(
            "/auth/admin-site/login",
            json={"login": "admin_dup_cpf", "senha": "Senha@123"},
        )
        token = login_response.json()["access_token"]

        response = await client.post(
            "/auth/admin-site/criar-admin-site",
            json={
                "nome": "Novo Admin",
                "email": "novo.cpf@example.com",
                "cpf": "11144477735",
                "telefone": "85999994444",
                "whatsapp": "85999994444",
                "senha": "SenhaTemp@123",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 409
    assert "cpf" in response.json()["detail"].lower()
