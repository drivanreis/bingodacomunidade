import json

import pytest
from httpx import AsyncClient
from starlette.requests import Request

from src import main


@pytest.mark.asyncio
async def test_root_endpoint_returns_health_payload(test_app):
    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.get("/")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["timezone"] == "America/Fortaleza"
    assert "timestamp_fortaleza" in data


@pytest.mark.asyncio
async def test_health_endpoint_connected(test_app):
    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert "timestamp" in data


@pytest.mark.asyncio
async def test_ping_endpoint_returns_pong(test_app):
    async with AsyncClient(app=test_app, base_url="http://test") as client:
        response = await client.get("/ping")

    assert response.status_code == 200
    assert response.json() == {"message": "pong"}


@pytest.mark.asyncio
async def test_global_exception_handler_returns_structured_500():
    request = Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/explodir",
            "headers": [],
            "query_string": b"",
            "scheme": "http",
            "http_version": "1.1",
            "server": ("test", 80),
            "client": ("test", 12345),
        }
    )

    response = await main.global_exception_handler(request, RuntimeError("falha controlada"))

    assert response.status_code == 500
    payload = json.loads(response.body.decode("utf-8"))
    assert payload["detail"] == "Erro interno do servidor. O administrador foi notificado."
    assert payload["type"] == "INTERNAL_ERROR"
    assert "debug_error" not in payload


@pytest.mark.asyncio
async def test_startup_event_executes_bootstrap_flow(monkeypatch):
    calls = {
        "init": False,
        "seed": False,
        "audit": False,
        "closed": False,
    }

    class FakeDB:
        def close(self):
            calls["closed"] = True

    monkeypatch.setattr(main, "verify_connection", lambda: True)
    monkeypatch.setattr(main, "init_db", lambda: calls.__setitem__("init", True))
    monkeypatch.setattr(main, "seed_database", lambda db: calls.__setitem__("seed", db is not None))
    monkeypatch.setattr(main, "registrar_auditoria_sistema", lambda db: calls.__setitem__("audit", db is not None))
    monkeypatch.setattr(main, "SessionLocal", lambda: FakeDB())

    await main.startup_event()

    assert calls["init"] is True
    assert calls["seed"] is True
    assert calls["audit"] is True
    assert calls["closed"] is True


@pytest.mark.asyncio
async def test_startup_event_returns_early_when_db_unavailable(monkeypatch):
    state = {"init_called": False, "session_called": False}

    monkeypatch.setattr(main, "verify_connection", lambda: False)
    monkeypatch.setattr(main, "init_db", lambda: state.__setitem__("init_called", True))
    monkeypatch.setattr(main, "SessionLocal", lambda: state.__setitem__("session_called", True))

    await main.startup_event()

    assert state["init_called"] is False
    assert state["session_called"] is False


@pytest.mark.asyncio
async def test_shutdown_event_runs_without_errors():
    await main.shutdown_event()
