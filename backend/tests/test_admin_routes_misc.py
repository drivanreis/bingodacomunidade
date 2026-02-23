from datetime import timedelta

import pytest
from httpx import AsyncClient

from src.models.models import (
    CategoriaConfiguracao,
    Configuracao,
    Feedback,
    NivelAcessoAdmin,
    Paroquia,
    Sorteio,
    StatusFeedback,
    StatusSorteio,
    TipoConfiguracao,
    TipoFeedback,
    TipoUsuario,
    UsuarioAdministrativo,
    UsuarioComum,
)
from src.utils.auth import hash_password, verify_password
from src.utils.time_manager import get_fortaleza_time


def _seed_base_paroquia(db_session, paroquia_id: str = "PAR-MISC-1"):
    paroquia = Paroquia(
        id=paroquia_id,
        nome="Paróquia Teste",
        email=f"{paroquia_id.lower()}@example.com",
        telefone="85999990000",
        endereco="Rua Teste",
        cidade="Fortaleza",
        estado="CE",
        cep="60000000",
        chave_pix=f"pix-{paroquia_id.lower()}@example.com",
        ativa=True,
    )
    db_session.add(paroquia)
    db_session.commit()
    return paroquia


@pytest.mark.asyncio
async def test_usuarios_crud_and_tipo_flow(test_app, db_session):
    paroquia = _seed_base_paroquia(db_session)

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        create_response = await client.post(
            "/usuarios",
            params={
                "nome": "José da Silva",
                "tipo": "paroquia_admin",
                "senha": "Senha@123",
                "email": "jose.paroquia@example.com",
                "cpf": "11144477735",
                "telefone": "85999990000",
                "whatsapp": "85999990000",
                "paroquia_id": paroquia.id,
                "ativo": True,
            },
        )

    assert create_response.status_code == 200
    created = create_response.json()
    assert created["id"].startswith("USR")
    assert created["tipo"] == "paroquia_admin"

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        list_response = await client.get("/usuarios")

    assert list_response.status_code == 200
    usuarios = list_response.json()
    assert any(u["id"] == created["id"] for u in usuarios)

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        update_response = await client.put(
            f"/usuarios/{created['id']}",
            params={"nome": "José Atualizado", "tipo": "super_admin", "ativo": False},
        )

    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["nome"] == "José Atualizado"
    assert updated["tipo"] == "super_admin"
    assert updated["ativo"] is False

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        tipo_response = await client.put(
            f"/usuarios/{created['id']}/tipo",
            json={"tipo": "paroquia_admin"},
        )

    assert tipo_response.status_code == 200
    assert tipo_response.json()["tipo"] == "paroquia_admin"

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        delete_response = await client.delete(f"/usuarios/{created['id']}")

    assert delete_response.status_code == 200
    assert "sucesso" in delete_response.json()["message"].lower()


@pytest.mark.asyncio
async def test_criar_usuario_invalidations(test_app, db_session):
    _seed_base_paroquia(db_session, "PAR-MISC-2")

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        invalid_tipo = await client.post(
            "/usuarios",
            params={"nome": "A", "tipo": "desconhecido", "senha": "Senha@123", "cpf": "12345678909"},
        )
        missing_cpf = await client.post(
            "/usuarios",
            params={
                "nome": "B",
                "tipo": "paroquia_admin",
                "senha": "Senha@123",
                "email": "b@example.com",
                "telefone": "85999990000",
                "whatsapp": "85999990000",
            },
        )
        forbidden_tipo = await client.post(
            "/usuarios",
            params={
                "nome": "C",
                "tipo": "fiel",
                "senha": "Senha@123",
                "cpf": "98765432100",
            },
        )

    assert invalid_tipo.status_code == 400
    assert "inválido" in invalid_tipo.json()["detail"].lower()
    assert missing_cpf.status_code == 400
    assert "cpf" in missing_cpf.json()["detail"].lower()
    assert forbidden_tipo.status_code == 400
    assert "permitidos" in forbidden_tipo.json()["detail"].lower()


@pytest.mark.asyncio
async def test_criar_usuario_duplicate_email_and_cpf(test_app, db_session):
    paroquia = _seed_base_paroquia(db_session, "PAR-MISC-3")
    db_session.add(
        UsuarioComum(
            id="USR-DUP-1",
            nome="Duplicado",
            cpf="98765432100",
            email="dup@example.com",
            telefone="85999998888",
            whatsapp="85999998888",
            senha_hash=hash_password("Senha@123"),
            tipo=TipoUsuario.FIEL.value,
            paroquia_id=paroquia.id,
            ativo=True,
            criado_em=get_fortaleza_time(),
            atualizado_em=get_fortaleza_time(),
        )
    )
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        duplicate_email = await client.post(
            "/usuarios",
            params={
                "nome": "Teste",
                "tipo": "paroquia_admin",
                "senha": "Senha@123",
                "email": "dup@example.com",
                "cpf": "12345678909",
                "telefone": "85999990000",
                "whatsapp": "85999990000",
                "paroquia_id": paroquia.id,
            },
        )
        duplicate_cpf = await client.post(
            "/usuarios",
            params={
                "nome": "Teste 2",
                "tipo": "paroquia_admin",
                "senha": "Senha@123",
                "email": "novo@example.com",
                "cpf": "98765432100",
                "telefone": "85999990000",
                "whatsapp": "85999990000",
                "paroquia_id": paroquia.id,
            },
        )

    assert duplicate_email.status_code == 400
    assert "e-mail já cadastrado" in duplicate_email.json()["detail"].lower()
    assert duplicate_cpf.status_code == 400
    assert "cpf já cadastrado" in duplicate_cpf.json()["detail"].lower()


@pytest.mark.asyncio
async def test_usuarios_update_and_delete_missing_returns_404(test_app):
    async with AsyncClient(app=test_app, base_url="http://test") as client:
        update_response = await client.put("/usuarios/USR-404", params={"nome": "X"})
        tipo_response = await client.put("/usuarios/USR-404/tipo", json={"tipo": "paroquia_admin"})
        delete_response = await client.delete("/usuarios/USR-404")

    assert update_response.status_code == 404
    assert tipo_response.status_code == 404
    assert delete_response.status_code == 404


@pytest.mark.asyncio
async def test_usuario_comum_pode_ser_editado_inativado_e_excluido(test_app, db_session):
    paroquia = _seed_base_paroquia(db_session, "PAR-MISC-COM-1")
    usuario = UsuarioComum(
        id="USR-COM-1",
        nome="Fiel Comum",
        cpf="33322211100",
        email="fiel.comum@example.com",
        telefone="85970000000",
        whatsapp="85970000000",
        senha_hash=hash_password("Senha@123"),
        tipo=TipoUsuario.FIEL.value,
        paroquia_id=paroquia.id,
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(usuario)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        update_response = await client.put(
            "/usuarios/USR-COM-1",
            params={"nome": "Fiel Comum Atualizado", "ativo": False},
        )
        delete_response = await client.delete("/usuarios/USR-COM-1")

    assert update_response.status_code == 200
    payload = update_response.json()
    assert payload["nome"] == "Fiel Comum Atualizado"
    assert payload["ativo"] is False
    assert payload["tipo"] == "fiel"

    assert delete_response.status_code == 200
    assert "sucesso" in delete_response.json()["message"].lower()


@pytest.mark.asyncio
async def test_atualizar_usuario_troca_senha_exige_senha_atual(test_app, db_session):
    paroquia = _seed_base_paroquia(db_session, "PAR-MISC-7")
    usuario = UsuarioComum(
        id="USR-SENHA-1",
        nome="Usuário Senha",
        cpf="55566677788",
        email="senha@example.com",
        telefone="85944445555",
        whatsapp="85944445555",
        senha_hash=hash_password("SenhaAtual@123"),
        tipo=TipoUsuario.PAROQUIA_ADMIN.value,
        paroquia_id=paroquia.id,
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(usuario)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        invalid_response = await client.put(
            f"/usuarios/{usuario.id}",
            json={"nova_senha": "NovaSenha@123"},
        )
        valid_response = await client.put(
            f"/usuarios/{usuario.id}",
            json={"senha_atual": "SenhaAtual@123", "nova_senha": "NovaSenha@123"},
        )

    assert invalid_response.status_code == 400
    assert "senha atual" in invalid_response.json()["detail"].lower()

    assert valid_response.status_code == 200
    db_session.refresh(usuario)
    assert verify_password("NovaSenha@123", usuario.senha_hash)


@pytest.mark.asyncio
async def test_atualizar_tipo_usuario_invalid_tipo_returns_400(test_app, db_session):
    paroquia = _seed_base_paroquia(db_session, "PAR-MISC-4")
    usuario = UsuarioComum(
        id="USR-TIPO-1",
        nome="Tipo Inválido",
        cpf="22233344455",
        email="tipo@example.com",
        telefone="85911112222",
        whatsapp="85911112222",
        senha_hash=hash_password("Senha@123"),
        tipo=TipoUsuario.PAROQUIA_ADMIN.value,
        paroquia_id=paroquia.id,
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(usuario)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.put(
            f"/usuarios/{usuario.id}/tipo",
            json={"tipo": "inexistente"},
        )

    assert response.status_code == 400
    assert "tipo inválido" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_configuracoes_list_and_update(test_app, db_session):
    config = Configuracao(
        chave="login_max_tentativas",
        valor="5",
        tipo=TipoConfiguracao.NUMBER,
        categoria=CategoriaConfiguracao.SEGURANCA,
        descricao="Máximo de tentativas de login",
    )
    db_session.add(config)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        list_response = await client.get("/configuracoes")
        update_response = await client.put("/configuracoes/login_max_tentativas", params={"valor": "7"})
        not_found_response = await client.put("/configuracoes/nao_existe", params={"valor": "1"})

    assert list_response.status_code == 200
    assert any(c["chave"] == "login_max_tentativas" for c in list_response.json())
    assert update_response.status_code == 200
    assert update_response.json()["valor"] == "7"
    assert not_found_response.status_code == 404


@pytest.mark.asyncio
async def test_jogos_listing_returns_payload(test_app, db_session):
    paroquia = _seed_base_paroquia(db_session, "PAR-MISC-5")
    now = get_fortaleza_time()
    sorteio = Sorteio(
        id="SOR-MISC-1",
        paroquia_id=paroquia.id,
        titulo="Bingo Solidário",
        descricao="Edição especial",
        valor_cartela=10.0,
        rateio_premio=25.0,
        rateio_paroquia=25.0,
        rateio_operacao=25.0,
        rateio_evolucao=25.0,
        total_arrecadado=100.0,
        total_premio=25.0,
        total_cartelas_vendidas=10,
        inicio_vendas=now,
        fim_vendas=now + timedelta(hours=1),
        horario_sorteio=now + timedelta(hours=2),
        status=StatusSorteio.AGENDADO,
    )
    db_session.add(sorteio)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.get("/jogos")

    assert response.status_code == 200
    jogos = response.json()
    assert jogos[0]["id"] == "SOR-MISC-1"
    assert jogos[0]["nome"] == "Bingo Solidário"


@pytest.mark.asyncio
async def test_feedback_routes_main_flows(test_app, db_session):
    paroquia = _seed_base_paroquia(db_session, "PAR-MISC-6")
    usuario = UsuarioComum(
        id="USR-FDB-1",
        nome="Usuário Feedback",
        cpf="33344455566",
        email="feedback@example.com",
        telefone="85922223333",
        whatsapp="85922223333",
        senha_hash=hash_password("Senha@123"),
        tipo=TipoUsuario.FIEL.value,
        paroquia_id=paroquia.id,
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    responded_by = UsuarioComum(
        id="USR-FDB-2",
        nome="Admin Resposta",
        cpf="44455566677",
        email="resposta@example.com",
        telefone="85933334444",
        whatsapp="85933334444",
        senha_hash=hash_password("Senha@123"),
        tipo=TipoUsuario.PAROQUIA_ADMIN.value,
        paroquia_id=paroquia.id,
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(usuario)
    db_session.add(responded_by)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        bad_satisfaction = await client.post(
            "/feedbacks",
            params={
                "usuario_id": usuario.id,
                "tipo": "bug",
                "assunto": "Erro",
                "mensagem": "Detalhes",
                "satisfacao": 0,
            },
        )
        invalid_tipo = await client.post(
            "/feedbacks",
            params={
                "usuario_id": usuario.id,
                "tipo": "nao_existe",
                "assunto": "Erro",
                "mensagem": "Detalhes",
                "satisfacao": 3,
            },
        )
        not_found_user = await client.post(
            "/feedbacks",
            params={
                "usuario_id": "USR-404",
                "tipo": "bug",
                "assunto": "Erro",
                "mensagem": "Detalhes",
                "satisfacao": 3,
            },
        )

    assert bad_satisfaction.status_code == 400
    assert invalid_tipo.status_code == 400
    assert not_found_user.status_code == 404

    feedback = Feedback(
        id="FDB-MANUAL-1",
        usuario_id=usuario.id,
        tipo=TipoFeedback.BUG,
        assunto="Falha no cadastro",
        mensagem="Mensagem longa",
        satisfacao=2,
        status=StatusFeedback.PENDENTE,
    )
    db_session.add(feedback)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        list_response = await client.get("/feedbacks")
        responder_response = await client.put(
            f"/feedbacks/{feedback.id}/responder",
            params={"resposta": "Corrigido", "respondido_por_id": responded_by.id},
        )
        status_response = await client.put(
            f"/feedbacks/{feedback.id}/status",
            params={"novo_status": "em_analise"},
        )
        invalid_status = await client.put(
            f"/feedbacks/{feedback.id}/status",
            params={"novo_status": "invalid"},
        )
        missing_feedback = await client.put(
            "/feedbacks/FDB-404/responder",
            params={"resposta": "x", "respondido_por_id": responded_by.id},
        )

    assert list_response.status_code == 200
    assert any(item["id"] == feedback.id for item in list_response.json())
    assert responder_response.status_code == 200
    assert responder_response.json()["status"] == "resolvido"
    assert status_response.status_code == 200
    assert status_response.json()["status"] == "em_analise"
    assert invalid_status.status_code == 400
    assert missing_feedback.status_code == 404
