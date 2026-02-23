import pytest
from httpx import AsyncClient

from src.models.models import Paroquia, UsuarioComum
from src.utils.auth import hash_password
from src.utils.time_manager import get_fortaleza_time


@pytest.mark.asyncio
async def test_paroquia_crud_flow(test_app):
    payload = {
        "nome": "Paróquia São José",
        "email": "saojose@example.com",
        "chave_pix": "pix-saojose@example.com",
        "telefone": "85999990000",
        "endereco": "Rua A",
        "cidade": "Fortaleza",
        "estado": "CE",
        "cep": "60000000",
        "ativa": True,
    }

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        create_response = await client.post("/paroquias", json=payload)

    assert create_response.status_code == 200
    created = create_response.json()
    assert created["id"].startswith("PAR")
    assert created["nome"] == "Paróquia São José"

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        list_response = await client.get("/paroquias")

    assert list_response.status_code == 200
    listed = list_response.json()
    assert any(item["id"] == created["id"] for item in listed)

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        update_response = await client.put(
            f"/paroquias/{created['id']}",
            json={"nome": "Paróquia São José Atualizada", "cidade": "Caucaia"},
        )

    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["nome"] == "Paróquia São José Atualizada"
    assert updated["cidade"] == "Caucaia"

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        delete_response = await client.delete(f"/paroquias/{created['id']}")

    assert delete_response.status_code == 200
    assert "sucesso" in delete_response.json()["message"].lower()


@pytest.mark.asyncio
async def test_excluir_paroquia_retorna_400_quando_ha_usuarios_vinculados(test_app, db_session):
    paroquia = Paroquia(
        id="PAR-LINK-1",
        nome="Paróquia Vinculada",
        email="vinculada@example.com",
        telefone="85999990000",
        endereco="Rua B",
        cidade="Fortaleza",
        estado="CE",
        cep="60000001",
        chave_pix="pix-vinculada@example.com",
        ativa=True,
    )
    db_session.add(paroquia)
    db_session.flush()

    usuario = UsuarioComum(
        id="USR-LINK-1",
        nome="Usuário Vinculado",
        cpf="12345678909",
        email="usuario.vinculado@example.com",
        telefone="85999998888",
        whatsapp="+5585999998888",
        chave_pix="usuario.vinculado@example.com",
        senha_hash=hash_password("Senha@123"),
        tipo="fiel",
        paroquia_id=paroquia.id,
        ativo=True,
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )
    db_session.add(usuario)
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.delete(f"/paroquias/{paroquia.id}")

    assert response.status_code == 400
    assert "vinculados" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_atualizar_paroquia_inexistente_retorna_404(test_app):
    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.put("/paroquias/PAR-INEXISTENTE", json={"nome": "Novo Nome"})

    assert response.status_code == 404
