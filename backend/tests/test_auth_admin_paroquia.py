import pytest
from httpx import AsyncClient
from datetime import timedelta
from datetime import datetime

from src.models.models import (
    UsuarioAdministrativo,
    AdminSiteUser,
    NivelAcessoAdmin,
    Configuracao,
    TipoConfiguracao,
    CategoriaConfiguracao,
    RoleParoquia,
    RoleParoquiaCodigo,
    UsuarioParoquia,
)
from src.utils.auth import hash_password
from src.utils.auth import get_current_user
from src.utils.time_manager import get_fortaleza_time
from src.routers.auth_routes import normalize_admin_site_identity, normalize_phone, find_admin_site_conflict


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


@pytest.mark.asyncio
async def test_admin_paroquia_login_bloqueado_retorna_429(test_app, db_session):
    admin = UsuarioAdministrativo(
        id="ADM-P-BLOCK-1",
        nome="Admin Paroquia Bloqueado",
        login="admin_par_bloq",
        senha_hash=hash_password("Senha@123"),
        email="admin.par.bloq@example.com",
        nivel_acesso=NivelAcessoAdmin.ADMIN_PAROQUIA,
        paroquia_id="PAR-BLK-1",
        ativo=True,
        tentativas_login=3,
        bloqueado_ate=datetime.utcnow() + timedelta(minutes=10),
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(admin)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/admin-paroquia/login",
            json={"login": "admin_par_bloq", "senha": "Senha@123"},
        )

    assert response.status_code == 429
    assert "muitas tentativas" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_admin_paroquia_login_inativo_retorna_403(test_app, db_session):
    admin = UsuarioAdministrativo(
        id="ADM-P-INAT-1",
        nome="Admin Paroquia Inativo",
        login="admin_par_inativo",
        senha_hash=hash_password("Senha@123"),
        email="admin.par.inativo@example.com",
        nivel_acesso=NivelAcessoAdmin.ADMIN_PAROQUIA,
        paroquia_id="PAR-INAT-1",
        ativo=False,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(admin)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/admin-paroquia/login",
            json={"login": "admin_par_inativo", "senha": "Senha@123"},
        )

    assert response.status_code == 403
    assert "inativo" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_admin_paroquia_login_senha_errada_bloqueia_na_terceira_tentativa(test_app, db_session):
    admin = UsuarioAdministrativo(
        id="ADM-P-LOCK-3",
        nome="Admin Paroquia Lock",
        login="admin_par_lock",
        senha_hash=hash_password("Senha@123"),
        email="admin.par.lock@example.com",
        nivel_acesso=NivelAcessoAdmin.ADMIN_PAROQUIA,
        paroquia_id="PAR-LOCK-3",
        ativo=True,
        tentativas_login=2,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(admin)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/admin-paroquia/login",
            json={"login": "admin_par_lock", "senha": "Errada@123"},
        )

    assert response.status_code == 401
    db_session.refresh(admin)
    assert admin.tentativas_login >= 3
    assert admin.bloqueado_ate is not None


@pytest.mark.asyncio
async def test_admin_paroquia_login_desbloqueia_quando_bloqueio_expirou(test_app, db_session):
    admin = UsuarioAdministrativo(
        id="ADM-P-UNLOCK-1",
        nome="Admin Paroquia Unlock",
        login="admin_par_unlock",
        senha_hash=hash_password("Senha@123"),
        email="admin.par.unlock@example.com",
        nivel_acesso=NivelAcessoAdmin.ADMIN_PAROQUIA,
        paroquia_id="PAR-UNLOCK-1",
        ativo=True,
        tentativas_login=3,
        bloqueado_ate=(get_fortaleza_time() - timedelta(minutes=1)).replace(tzinfo=None),
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(admin)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/admin-paroquia/login",
            json={"login": "admin_par_unlock", "senha": "Senha@123"},
        )

    assert response.status_code == 200
    db_session.refresh(admin)
    assert admin.bloqueado_ate is None
    assert admin.tentativas_login == 0


@pytest.mark.asyncio
async def test_admin_paroquia_troca_inicial_rejeita_senha_atual_invalida(test_app, db_session):
    admin = UsuarioAdministrativo(
        id="ADM-P-TSI-1",
        nome="Admin Paroquia Troca",
        login="admin_par_troca1",
        senha_hash=hash_password("Temp@123"),
        email="admin.par.troca1@example.com",
        nivel_acesso=NivelAcessoAdmin.ADMIN_PAROQUIA,
        paroquia_id="PAR-TSI-1",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(admin)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/admin-paroquia/troca-senha-inicial",
            json={
                "login": "admin_par_troca1",
                "senha_atual": "Errada@123",
                "nova_senha": "NovaTemp@123",
            },
        )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_admin_paroquia_troca_inicial_admin_nao_encontrado_retorna_404(test_app):
    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/admin-paroquia/troca-senha-inicial",
            json={
                "login": "nao_existe_admin_par",
                "senha_atual": "Temp@123",
                "nova_senha": "NovaTemp@123",
            },
        )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_admin_paroquia_troca_inicial_admin_inativo_retorna_403(test_app, db_session):
    admin = UsuarioAdministrativo(
        id="ADM-P-TSI-3",
        nome="Admin Paroquia Inativo Troca",
        login="admin_par_troca3",
        senha_hash=hash_password("Temp@123"),
        email="admin.par.troca3@example.com",
        nivel_acesso=NivelAcessoAdmin.ADMIN_PAROQUIA,
        paroquia_id="PAR-TSI-3",
        ativo=False,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(admin)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/admin-paroquia/troca-senha-inicial",
            json={
                "login": "admin_par_troca3",
                "senha_atual": "Temp@123",
                "nova_senha": "NovaTemp@123",
            },
        )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_paroquia_troca_inicial_rejeita_nova_senha_igual(test_app, db_session):
    admin = UsuarioAdministrativo(
        id="ADM-P-TSI-2",
        nome="Admin Paroquia Troca 2",
        login="admin_par_troca2",
        senha_hash=hash_password("Temp@123"),
        email="admin.par.troca2@example.com",
        nivel_acesso=NivelAcessoAdmin.ADMIN_PAROQUIA,
        paroquia_id="PAR-TSI-2",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(admin)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/admin-paroquia/troca-senha-inicial",
            json={
                "login": "admin_par_troca2",
                "senha_atual": "Temp@123",
                "nova_senha": "Temp@123",
            },
        )

    assert response.status_code == 400
    assert "diferente" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_admin_paroquia_cria_subordinado_com_sucesso(test_app, db_session):
    criador = UsuarioAdministrativo(
        id="ADM-P-CR-1",
        nome="Admin Paroquia Criador",
        login="admin_par_criador",
        senha_hash=hash_password("Senha@123"),
        email="admin.par.criador@example.com",
        nivel_acesso=NivelAcessoAdmin.ADMIN_PAROQUIA,
        paroquia_id="PAR-CR-1",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    role_admin = RoleParoquia(
        id="ROL-P-CR-1",
        codigo=RoleParoquiaCodigo.ADMIN.value,
        nome="Administrador Paroquial",
        descricao="Role admin paroquia",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add_all([criador, role_admin])
    db_session.commit()

    async def override_current_user():
        return {"sub": "ADM-P-CR-1", "nivel_acesso": "admin_paroquia", "tipo": "usuario_administrativo"}

    test_app.dependency_overrides[get_current_user] = override_current_user
    try:
        async with AsyncClient(app=test_app, base_url="http://test") as client:
            response = await client.post(
                "/auth/admin-paroquia/criar-admin-paroquia",
                json={
                    "nome": "Subordinado 1",
                    "login": "sub_admin_par_1",
                    "senha": "SenhaTemp@123",
                    "email": "sub1@example.com",
                    "telefone": "85999990001",
                    "whatsapp": "85999990001",
                    "paroquia_id": "PAR-CR-1",
                },
            )
    finally:
        test_app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 201
    payload = response.json()
    assert payload["senha_temporaria"] is True
    assert payload["trocar_senha_proximo_login"] is True

    criado = db_session.query(UsuarioParoquia).filter(UsuarioParoquia.login == "sub_admin_par_1").first()
    assert criado is not None
    assert criado.criado_por_id == "ADM-P-CR-1"
    assert criado.paroquia_id == "PAR-CR-1"


@pytest.mark.asyncio
async def test_admin_paroquia_cria_subordinado_rejeita_paroquia_diferente(test_app, db_session):
    criador = UsuarioAdministrativo(
        id="ADM-P-CR-2",
        nome="Admin Paroquia Criador 2",
        login="admin_par_criador2",
        senha_hash=hash_password("Senha@123"),
        email="admin.par.criador2@example.com",
        nivel_acesso=NivelAcessoAdmin.ADMIN_PAROQUIA,
        paroquia_id="PAR-CR-2",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    role_admin = RoleParoquia(
        id="ROL-P-CR-2",
        codigo=RoleParoquiaCodigo.ADMIN.value,
        nome="Administrador Paroquial",
        descricao="Role admin paroquia",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add_all([criador, role_admin])
    db_session.commit()

    async def override_current_user():
        return {"sub": "ADM-P-CR-2", "nivel_acesso": "admin_paroquia", "tipo": "usuario_administrativo"}

    test_app.dependency_overrides[get_current_user] = override_current_user
    try:
        async with AsyncClient(app=test_app, base_url="http://test") as client:
            response = await client.post(
                "/auth/admin-paroquia/criar-admin-paroquia",
                json={
                    "nome": "Subordinado 2",
                    "login": "sub_admin_par_2",
                    "senha": "SenhaTemp@123",
                    "email": "sub2@example.com",
                    "paroquia_id": "PAR-OUTRA",
                },
            )
    finally:
        test_app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 403
    assert "própria paróquia" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_admin_paroquia_cria_subordinado_rejeita_login_duplicado(test_app, db_session):
    criador = UsuarioAdministrativo(
        id="ADM-P-CR-3",
        nome="Admin Paroquia Criador 3",
        login="admin_par_criador3",
        senha_hash=hash_password("Senha@123"),
        email="admin.par.criador3@example.com",
        nivel_acesso=NivelAcessoAdmin.ADMIN_PAROQUIA,
        paroquia_id="PAR-CR-3",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    role_admin = RoleParoquia(
        id="ROL-P-CR-3",
        codigo=RoleParoquiaCodigo.ADMIN.value,
        nome="Administrador Paroquial",
        descricao="Role admin paroquia",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    existente = UsuarioParoquia(
        id="UP-DUP-1",
        nome="Admin Existente",
        login="sub_admin_dup",
        senha_hash=hash_password("Senha@123"),
        email="dup@example.com",
        paroquia_id="PAR-CR-3",
        role_id="ROL-P-CR-3",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add_all([criador, role_admin, existente])
    db_session.commit()

    async def override_current_user():
        return {"sub": "ADM-P-CR-3", "nivel_acesso": "admin_paroquia", "tipo": "usuario_administrativo"}

    test_app.dependency_overrides[get_current_user] = override_current_user
    try:
        async with AsyncClient(app=test_app, base_url="http://test") as client:
            response = await client.post(
                "/auth/admin-paroquia/criar-admin-paroquia",
                json={
                    "nome": "Subordinado 3",
                    "login": "sub_admin_dup",
                    "senha": "SenhaTemp@123",
                    "email": "sub3@example.com",
                    "paroquia_id": "PAR-CR-3",
                },
            )
    finally:
        test_app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 409
    assert "login já existe" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_admin_paroquia_cria_subordinado_rejeita_sem_role_admin(test_app, db_session):
    criador = UsuarioAdministrativo(
        id="ADM-P-CR-4",
        nome="Admin Paroquia Criador 4",
        login="admin_par_criador4",
        senha_hash=hash_password("Senha@123"),
        email="admin.par.criador4@example.com",
        nivel_acesso=NivelAcessoAdmin.ADMIN_PAROQUIA,
        paroquia_id="PAR-CR-4",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(criador)
    db_session.commit()

    async def override_current_user():
        return {"sub": "ADM-P-CR-4", "nivel_acesso": "admin_paroquia", "tipo": "usuario_administrativo"}

    test_app.dependency_overrides[get_current_user] = override_current_user
    try:
        async with AsyncClient(app=test_app, base_url="http://test") as client:
            response = await client.post(
                "/auth/admin-paroquia/criar-admin-paroquia",
                json={
                    "nome": "Subordinado 4",
                    "login": "sub_admin_sem_role",
                    "senha": "SenhaTemp@123",
                    "email": "sub4@example.com",
                    "paroquia_id": "PAR-CR-4",
                },
            )
    finally:
        test_app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 400
    assert "role paroquia_admin" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_admin_paroquia_cria_subordinado_rejeita_sem_permissao(test_app):
    async def override_current_user():
        return {"sub": "NAO-EXISTE", "nivel_acesso": "fiel", "tipo": "usuario_comum"}

    test_app.dependency_overrides[get_current_user] = override_current_user
    try:
        async with AsyncClient(app=test_app, base_url="http://test") as client:
            response = await client.post(
                "/auth/admin-paroquia/criar-admin-paroquia",
                json={
                    "nome": "Subordinado 5",
                    "login": "sub_admin_sem_perm",
                    "senha": "SenhaTemp@123",
                    "email": "sub5@example.com",
                    "paroquia_id": "PAR-CR-5",
                },
            )
    finally:
        test_app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 403
    assert "apenas admin_paroquia" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_admin_paroquia_login_sucesso_usuario_paroquia_novo(test_app, db_session):
    role_admin = RoleParoquia(
        id="ROL-P-NEW-LOGIN-1",
        codigo=RoleParoquiaCodigo.ADMIN.value,
        nome="Administrador Paroquial",
        descricao="Role admin paroquia",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    admin_novo = UsuarioParoquia(
        id="UP-NEW-LOGIN-1",
        nome="Admin Novo Login",
        login="admin_novo_login",
        senha_hash=hash_password("Senha@123"),
        email="admin.novo.login@example.com",
        paroquia_id="PAR-NEW-LOGIN-1",
        role_id=role_admin.id,
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add_all([role_admin, admin_novo])
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/admin-paroquia/login",
            json={"login": "admin_novo_login", "senha": "Senha@123"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["usuario"]["id"] == "UP-NEW-LOGIN-1"
    assert data["usuario"]["nivel_acesso"] == "admin_paroquia"


@pytest.mark.asyncio
async def test_admin_paroquia_login_sem_role_admin_ativo_retorna_401(test_app, db_session):
    role_sem_admin = RoleParoquia(
        id="ROL-P-NEW-LOGIN-2",
        codigo=RoleParoquiaCodigo.CAIXA.value,
        nome="Operador",
        descricao="Role operador",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    admin_novo = UsuarioParoquia(
        id="UP-NEW-LOGIN-2",
        nome="Usuario Paroquia Sem Role Admin",
        login="admin_sem_role_admin",
        senha_hash=hash_password("Senha@123"),
        email="admin.sem.role@example.com",
        paroquia_id="PAR-NEW-LOGIN-2",
        role_id=role_sem_admin.id,
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add_all([role_sem_admin, admin_novo])
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            "/auth/admin-paroquia/login",
            json={"login": "admin_sem_role_admin", "senha": "Senha@123"},
        )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_admin_paroquia_cria_subordinado_com_actor_novo_usuario_paroquia(test_app, db_session):
    role_admin = RoleParoquia(
        id="ROL-P-NEW-CR-1",
        codigo=RoleParoquiaCodigo.ADMIN.value,
        nome="Administrador Paroquial",
        descricao="Role admin paroquia",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    criador_novo = UsuarioParoquia(
        id="UP-NEW-CR-1",
        nome="Criador Novo",
        login="criador_novo",
        senha_hash=hash_password("Senha@123"),
        email="criador.novo@example.com",
        paroquia_id="PAR-NEW-CR-1",
        role_id=role_admin.id,
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add_all([role_admin, criador_novo])
    db_session.commit()

    async def override_current_user():
        return {"sub": "UP-NEW-CR-1", "nivel_acesso": "admin_paroquia", "tipo": "usuario_paroquia"}

    test_app.dependency_overrides[get_current_user] = override_current_user
    try:
        async with AsyncClient(app=test_app, base_url="http://test") as client:
            response = await client.post(
                "/auth/admin-paroquia/criar-admin-paroquia",
                json={
                    "nome": "Subordinado Novo",
                    "login": "sub_admin_novo_1",
                    "senha": "SenhaTemp@123",
                    "email": "sub.novo.1@example.com",
                    "paroquia_id": "PAR-NEW-CR-1",
                },
            )
    finally:
        test_app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 201
    criado = db_session.query(UsuarioParoquia).filter(UsuarioParoquia.login == "sub_admin_novo_1").first()
    assert criado is not None
    assert criado.criado_por_id == "UP-NEW-CR-1"


def test_helpers_normalizacao_admin_site():
    identidade = normalize_admin_site_identity("  ADMIN@SITE.COM  ", "  Al  ")
    assert identidade["email"] == "admin@site.com"
    assert identidade["login"] == "admin@site.com"
    assert identidade["nome"] == "Admin Site"

    assert normalize_phone("+55 (85) 99999-0001") == "85999990001"


def test_find_admin_site_conflict_detecta_email_telefone_cpf(db_session):
    novo = AdminSiteUser(
        id="ADM-S-CONF-1",
        nome="Admin Site Novo",
        login="admin.site.novo@example.com",
        senha_hash=hash_password("Senha@123"),
        email="admin.site.novo@example.com",
        cpf="12345678901",
        telefone="85999990001",
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    legado = UsuarioAdministrativo(
        id="ADM-S-CONF-2",
        nome="Admin Site Legado",
        login="admin_site_legado_conf",
        senha_hash=hash_password("Senha@123"),
        email="admin.site.legado@example.com",
        cpf="11122233344",
        telefone="85999990002",
        nivel_acesso=NivelAcessoAdmin.ADMIN_SITE,
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add_all([novo, legado])
    db_session.commit()

    assert find_admin_site_conflict(
        db_session,
        email="ADMIN.SITE.NOVO@EXAMPLE.COM",
        telefone="",
        cpf="",
    ) == "email"

    assert find_admin_site_conflict(
        db_session,
        email="",
        telefone="+55 (85) 99999-0002",
        cpf="",
    ) == "telefone"

    assert find_admin_site_conflict(
        db_session,
        email="",
        telefone="",
        cpf="111.222.333-44",
    ) == "cpf"
