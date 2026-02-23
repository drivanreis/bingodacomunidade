from datetime import datetime, timedelta

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from src.utils import auth as auth_utils
from src.utils import time_manager


def test_hash_and_verify_password_roundtrip():
    password = "Senha@123"
    hashed = auth_utils.hash_password(password)

    assert hashed != password
    assert auth_utils.verify_password(password, hashed) is True
    assert auth_utils.verify_password("Senha@124", hashed) is False


def test_create_and_decode_access_token():
    token = auth_utils.create_access_token({"sub": "USR-123"}, expires_delta=timedelta(minutes=5))
    payload = auth_utils.decode_access_token(token)

    assert payload is not None
    assert payload["sub"] == "USR-123"
    assert "exp" in payload
    assert "iat" in payload


def test_decode_access_token_invalid_returns_none():
    assert auth_utils.decode_access_token("token.invalido") is None


def test_aliases_get_password_hash_and_verify_password_hash():
    hashed = auth_utils.get_password_hash("Senha@123")
    assert auth_utils.verify_password_hash("Senha@123", hashed) is True


def test_generate_tokens_and_expirations_have_expected_shape():
    recovery_1 = auth_utils.generate_recovery_token()
    recovery_2 = auth_utils.generate_recovery_token()
    verify_token = auth_utils.generate_email_verification_token()

    assert isinstance(recovery_1, str) and len(recovery_1) >= 32
    assert isinstance(verify_token, str) and len(verify_token) >= 32
    assert recovery_1 != recovery_2

    now = auth_utils.get_fortaleza_time()
    recovery_exp = auth_utils.get_recovery_token_expiration()
    email_exp = auth_utils.get_email_verification_token_expiration()

    assert now + timedelta(minutes=29) <= recovery_exp <= now + timedelta(minutes=31)
    assert now + timedelta(hours=23, minutes=59) <= email_exp <= now + timedelta(hours=24, minutes=1)


@pytest.mark.asyncio
async def test_get_current_user_raises_for_invalid_token(monkeypatch):
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="invalid-token")
    monkeypatch.setattr(auth_utils, "decode_access_token", lambda _: None)

    with pytest.raises(HTTPException) as exc_info:
        await auth_utils.get_current_user(credentials=credentials, db=None)

    assert exc_info.value.status_code == 401
    assert "Token inválido" in exc_info.value.detail


@pytest.mark.asyncio
async def test_get_current_user_raises_when_sub_missing(monkeypatch):
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="valid-token")
    monkeypatch.setattr(auth_utils, "decode_access_token", lambda _: {"role": "fiel"})

    with pytest.raises(HTTPException) as exc_info:
        await auth_utils.get_current_user(credentials=credentials, db=None)

    assert exc_info.value.status_code == 401
    assert "user_id não encontrado" in exc_info.value.detail


def test_generate_temporal_id_with_and_without_prefix():
    value_no_prefix = time_manager.generate_temporal_id()
    value_with_prefix = time_manager.generate_temporal_id("USR")

    assert value_no_prefix.isdigit()
    assert len(value_no_prefix) == 14
    assert value_with_prefix.startswith("USR_")
    assert len(value_with_prefix.split("_", 1)[1]) == 14


def test_generate_temporal_id_with_microseconds_format():
    value = time_manager.generate_temporal_id_with_microseconds("TXN")
    prefix, rest = value.split("_", 1)
    dt_part, micro_part = rest.split("_")

    assert prefix == "TXN"
    assert len(dt_part) == 14
    assert len(micro_part) == 6


def test_format_to_iso_handles_naive_and_aware_datetime():
    naive = datetime(2026, 2, 17, 12, 0, 0)
    aware = time_manager.FORTALEZA_TZ.localize(datetime(2026, 2, 17, 13, 0, 0))

    naive_iso = time_manager.format_to_iso(naive)
    aware_iso = time_manager.format_to_iso(aware)

    assert "-03:00" in naive_iso
    assert "-03:00" in aware_iso


def test_parse_temporal_id_valid_and_invalid():
    dt = time_manager.parse_temporal_id("USR_20260217120000")
    assert dt.year == 2026
    assert dt.month == 2
    assert dt.day == 17

    dt_micro = time_manager.parse_temporal_id("TXN_20260217120000_123456")
    assert dt_micro.hour == 12

    with pytest.raises(ValueError):
        time_manager.parse_temporal_id("INVALIDO")


def test_get_time_until_next_second_range():
    value = time_manager.get_time_until_next_second()
    assert 0 < value <= 1
