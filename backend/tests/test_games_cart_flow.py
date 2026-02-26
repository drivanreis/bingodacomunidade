from datetime import timedelta, timezone

import pytest
from httpx import AsyncClient

from src.models.models import Cartela, Paroquia, Sorteio, StatusCartela, StatusSorteio, UsuarioComum
from src.utils.auth import get_current_user
from src.utils.time_manager import get_fortaleza_time


@pytest.fixture
def auth_payload_state(test_app):
    state = {"payload": {"sub": "", "tipo": ""}}

    async def override_current_user():
        return state["payload"]

    test_app.dependency_overrides[get_current_user] = override_current_user
    try:
        yield state
    finally:
        test_app.dependency_overrides.pop(get_current_user, None)


def _seed_game_base(db_session):
    now = get_fortaleza_time()

    paroquia = Paroquia(
        id="PAR-GAME-1",
        nome="Paróquia Game",
        email="par-game@example.com",
        telefone="85990000000",
        endereco="Rua A",
        cidade="Fortaleza",
        estado="CE",
        cep="60000000",
        chave_pix="pix@paroquia.com",
        ativa=True,
    )

    fiel = UsuarioComum(
        id="FIEL-GAME-1",
        nome="Fiel Teste",
        cpf="12345678901",
        email="fiel-game@example.com",
        telefone="85991111111",
        whatsapp="85991111111",
        senha_hash="hash",
        tipo="usuario_comum",
        paroquia_id=paroquia.id,
        ativo=True,
        criado_em=now,
        atualizado_em=now,
    )

    jogo = Sorteio(
        id="SOR-GAME-1",
        paroquia_id=paroquia.id,
        titulo="Bingo Teste",
        descricao="Teste de fluxo",
        valor_cartela=10.0,
        rateio_premio=50.0,
        rateio_paroquia=30.0,
        rateio_operacao=15.0,
        rateio_evolucao=5.0,
        total_arrecadado=0.0,
        total_premio=0.0,
        total_cartelas_vendidas=0,
        max_cards=None,
        inicio_vendas=now - timedelta(minutes=30),
        fim_vendas=now + timedelta(minutes=30),
        horario_sorteio=now + timedelta(hours=1),
        status=StatusSorteio.AGENDADO,
        pedras_sorteadas=[],
        vencedores_ids=[],
        criado_em=now,
        atualizado_em=now,
    )

    db_session.add(paroquia)
    db_session.add(fiel)
    db_session.add(jogo)
    db_session.commit()

    return paroquia, fiel, jogo


def _seed_future_game(db_session, paroquia_id: str, game_id: str, title: str, draw_datetime):
    now = get_fortaleza_time()
    future_game = Sorteio(
        id=game_id,
        paroquia_id=paroquia_id,
        titulo=title,
        descricao="Jogo futuro",
        valor_cartela=10.0,
        rateio_premio=50.0,
        rateio_paroquia=30.0,
        rateio_operacao=15.0,
        rateio_evolucao=5.0,
        total_arrecadado=0.0,
        total_premio=0.0,
        total_cartelas_vendidas=0,
        max_cards=None,
        inicio_vendas=draw_datetime - timedelta(hours=2),
        fim_vendas=draw_datetime - timedelta(minutes=1),
        horario_sorteio=draw_datetime,
        status=StatusSorteio.AGENDADO,
        pedras_sorteadas=[],
        vencedores_ids=[],
        criado_em=now,
        atualizado_em=now,
    )
    db_session.add(future_game)
    db_session.commit()
    return future_game


@pytest.mark.asyncio
async def test_create_card_stays_in_cart_without_financial_count(test_app, db_session, auth_payload_state):
    _, fiel, jogo = _seed_game_base(db_session)
    auth_payload_state["payload"] = {"sub": fiel.id, "tipo": "usuario_comum"}

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(f"/games/{jogo.id}/cards", json={"modo": "aleatoria"})

    assert response.status_code == 201
    payload = response.json()
    assert payload["status"] == StatusCartela.NO_CARRINHO.value

    db_session.refresh(jogo)
    assert int(jogo.total_cartelas_vendidas or 0) == 0
    assert float(jogo.total_arrecadado or 0) == 0.0
    assert float(jogo.total_premio or 0) == 0.0


@pytest.mark.asyncio
async def test_pay_card_marks_paid_and_updates_totals(test_app, db_session, auth_payload_state):
    _, fiel, jogo = _seed_game_base(db_session)
    auth_payload_state["payload"] = {"sub": fiel.id, "tipo": "usuario_comum"}

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        create_response = await client.post(f"/games/{jogo.id}/cards", json={"modo": "aleatoria"})
        card_id = create_response.json()["id"]

        pay_response = await client.post(f"/games/{jogo.id}/cards/{card_id}/pay")

    assert pay_response.status_code == 200
    assert pay_response.json()["status"] == StatusCartela.PAGA.value

    db_session.refresh(jogo)
    assert int(jogo.total_cartelas_vendidas or 0) == 1
    assert float(jogo.total_arrecadado or 0) == pytest.approx(10.0)
    assert float(jogo.total_premio or 0) == pytest.approx(5.0)


@pytest.mark.asyncio
async def test_pay_at_exact_sales_deadline_is_blocked(test_app, db_session, auth_payload_state):
    _, fiel, jogo = _seed_game_base(db_session)
    auth_payload_state["payload"] = {"sub": fiel.id, "tipo": "usuario_comum"}

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        create_response = await client.post(f"/games/{jogo.id}/cards", json={"modo": "aleatoria"})
        card_id = create_response.json()["id"]

    jogo.fim_vendas = get_fortaleza_time()
    db_session.commit()

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        pay_response = await client.post(f"/games/{jogo.id}/cards/{card_id}/pay")

    assert pay_response.status_code == 400
    assert "encerradas" in pay_response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_close_sales_cancels_cart_and_keeps_paid(test_app, db_session, auth_payload_state):
    _, fiel, jogo = _seed_game_base(db_session)

    auth_payload_state["payload"] = {"sub": fiel.id, "tipo": "usuario_comum"}
    async with AsyncClient(app=test_app, base_url="http://test") as client:
        c1 = await client.post(f"/games/{jogo.id}/cards", json={"modo": "aleatoria"})
        c2 = await client.post(f"/games/{jogo.id}/cards", json={"modo": "aleatoria"})
        card_paid_id = c1.json()["id"]
        card_cart_id = c2.json()["id"]
        pay_response = await client.post(f"/games/{jogo.id}/cards/{card_paid_id}/pay")

    assert pay_response.status_code == 200

    jogo.fim_vendas = get_fortaleza_time() - timedelta(seconds=1)
    db_session.commit()

    auth_payload_state["payload"] = {"sub": "ADMIN-1", "tipo": "usuario_administrativo", "nivel_acesso": "admin_paroquia"}
    async with AsyncClient(app=test_app, base_url="http://test") as client:
        close_response = await client.post(f"/games/{jogo.id}/close-sales", json={"iniciar_sorteio": True})

    assert close_response.status_code == 200
    close_payload = close_response.json()
    assert int(close_payload["canceled_cards"]) == 1
    assert int(close_payload["eligible_paid_cards"]) == 1
    assert close_payload["game_status"] == StatusSorteio.EM_ANDAMENTO.value

    card_paid = db_session.query(Cartela).filter(Cartela.id == card_paid_id).first()
    card_cart = db_session.query(Cartela).filter(Cartela.id == card_cart_id).first()
    assert card_paid.status in {StatusCartela.PAGA, StatusCartela.ATIVA}
    assert card_cart.status == StatusCartela.CANCELADA


@pytest.mark.asyncio
async def test_reschedule_preview_single_reports_conflict(test_app, db_session, auth_payload_state):
    paroquia, _, jogo = _seed_game_base(db_session)
    _seed_future_game(
        db_session,
        paroquia.id,
        "SOR-GAME-2",
        "Bingo Futuro",
        jogo.horario_sorteio + timedelta(hours=1),
    )

    auth_payload_state["payload"] = {"sub": "ADMIN-1", "tipo": "usuario_administrativo", "nivel_acesso": "admin_paroquia"}

    new_draw = jogo.horario_sorteio + timedelta(hours=1, minutes=30)

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            f"/games/{jogo.id}/reschedule",
            json={
                "novo_horario_sorteio": new_draw.isoformat(),
                "mode": "single",
                "preview": True,
            },
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["preview"] is True
    assert payload["applied"] is False
    assert int(payload["conflict_count"]) == 1
    assert payload["conflicts"][0]["id"] == "SOR-GAME-2"


@pytest.mark.asyncio
async def test_reschedule_cascade_shifts_next_games(test_app, db_session, auth_payload_state):
    paroquia, _, jogo = _seed_game_base(db_session)
    jogo_futuro = _seed_future_game(
        db_session,
        paroquia.id,
        "SOR-GAME-3",
        "Bingo Futuro 2",
        jogo.horario_sorteio + timedelta(hours=2),
    )

    old_main_draw = jogo.horario_sorteio
    old_future_draw = jogo_futuro.horario_sorteio
    old_future_start = jogo_futuro.inicio_vendas
    old_future_end = jogo_futuro.fim_vendas

    auth_payload_state["payload"] = {"sub": "ADMIN-1", "tipo": "usuario_administrativo", "nivel_acesso": "admin_paroquia"}

    new_draw = old_main_draw + timedelta(hours=1)

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            f"/games/{jogo.id}/reschedule",
            json={
                "novo_horario_sorteio": new_draw.isoformat(),
                "mode": "cascade",
                "preview": False,
            },
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["applied"] is True
    assert payload["mode"] == "cascade"

    db_session.refresh(jogo)
    db_session.refresh(jogo_futuro)

    assert jogo.horario_sorteio == new_draw
    assert jogo.fim_vendas == new_draw - timedelta(minutes=1)

    assert jogo_futuro.horario_sorteio == old_future_draw + timedelta(hours=1)
    assert jogo_futuro.inicio_vendas == old_future_start + timedelta(hours=1)
    assert jogo_futuro.fim_vendas == old_future_end + timedelta(hours=1)


@pytest.mark.asyncio
async def test_reschedule_accepts_utc_datetime_payload_without_500(test_app, db_session, auth_payload_state):
    _, _, jogo = _seed_game_base(db_session)

    auth_payload_state["payload"] = {"sub": "ADMIN-1", "tipo": "usuario_administrativo", "nivel_acesso": "admin_paroquia"}

    new_draw_base = jogo.horario_sorteio + timedelta(hours=1)
    if new_draw_base.tzinfo is None:
        new_draw_utc = new_draw_base.replace(tzinfo=timezone.utc)
    else:
        new_draw_utc = new_draw_base.astimezone(timezone.utc)

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.post(
            f"/games/{jogo.id}/reschedule",
            json={
                "novo_horario_sorteio": new_draw_utc.isoformat().replace("+00:00", "Z"),
                "mode": "single",
                "preview": False,
            },
        )

    assert response.status_code == 200
    assert response.json()["applied"] is True
