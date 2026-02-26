#!/usr/bin/env python3
"""
Teste de Stress e Integridade - Jogos/Cartelas

Fluxo automatizado:
1) (Opcional) Executa migração para validar sintaxe/compatibilidade local
2) Simula carga: cria N cartelas rapidamente via API
3) Ativa lock de manutenção
4) Tenta criar +1 cartela durante lock e valida barreira (423/503)
5) Executa snapshot e backup completo
6) Desativa lock
7) Verifica quantidade de cartelas e testa duplicata (índice único)

Uso (exemplo):
python3 backend/scripts/stress_integrity_test.py \
  --base-url http://localhost:8000 \
  --game-id SOR_20260223190000 \
  --admin-token "SEU_JWT_ADMIN" \
  --faithful-token "SEU_JWT_FIEL"
"""

from __future__ import annotations

import argparse
import json
import random
import subprocess
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
MAINTENANCE_SCRIPT = REPO_ROOT / "backend" / "scripts" / "jogos_cartelas_maintenance.py"
MIGRATION_SCRIPT = REPO_ROOT / "backend" / "scripts" / "migrate_jogos_cartelas_schema.py"


class TestFailure(RuntimeError):
    pass


def now_s() -> float:
    return time.perf_counter()


def http_request(
    base_url: str,
    method: str,
    path: str,
    token: str,
    body: dict | None = None,
    timeout: int = 30,
) -> tuple[int, dict | str]:
    url = f"{base_url.rstrip('/')}{path}"
    payload = None
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    if body is not None:
        payload = json.dumps(body).encode("utf-8")

    req = urllib.request.Request(url, data=payload, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="ignore")
            try:
                data = json.loads(raw) if raw else {}
            except Exception:
                data = raw
            return resp.status, data
    except urllib.error.HTTPError as err:
        raw = err.read().decode("utf-8", errors="ignore") if err.fp else ""
        try:
            data = json.loads(raw) if raw else {}
        except Exception:
            data = raw
        return err.code, data


def run_cmd(cmd: list[str], label: str) -> subprocess.CompletedProcess:
    print(f"\n▶ {label}")
    print("$", " ".join(cmd))
    completed = subprocess.run(
        cmd,
        cwd=str(REPO_ROOT),
        capture_output=True,
        text=True,
        check=False,
    )
    if completed.stdout.strip():
        print(completed.stdout.strip())
    if completed.stderr.strip():
        print(completed.stderr.strip())
    return completed


def generate_personalized_numbers() -> list[str]:
    nums = random.sample(range(1, 76), 24)
    return [f"{n:02d}" for n in nums]


def create_card(base_url: str, game_id: str, faithful_token: str, mode: str = "aleatoria", numbers: list[str] | None = None):
    body = {"modo": mode}
    if numbers is not None:
        body["numeros"] = numbers
    return http_request(
        base_url=base_url,
        method="POST",
        path=f"/games/{game_id}/cards",
        token=faithful_token,
        body=body,
        timeout=30,
    )


def main():
    parser = argparse.ArgumentParser(description="Teste de stress e integridade para lock/snapshot/backup/cartelas")
    parser.add_argument("--base-url", required=True, help="Ex: http://localhost:8000")
    parser.add_argument("--game-id", required=True, help="ID do jogo alvo")
    parser.add_argument("--admin-token", required=True, help="JWT de admin_site/admin_paroquia")
    parser.add_argument("--faithful-token", required=True, help="JWT de usuário comum")
    parser.add_argument("--load", type=int, default=10, help="Quantidade de cartelas na carga inicial")
    parser.add_argument("--lock-minutes", type=int, default=5, help="Minutos do lock")
    parser.add_argument("--run-migration-check", action="store_true", help="Executa migração antes do teste")
    args = parser.parse_args()

    base_url = args.base_url
    game_id = args.game_id

    print("\n=== TESTE DE STRESS E INTEGRIDADE ===")
    print(f"Base URL: {base_url}")
    print(f"Game ID : {game_id}")

    # 0) opcional: valida migração
    if args.run_migration_check:
        cp = run_cmd(["python3", str(MIGRATION_SCRIPT)], "Validação da migração (migrate_jogos_cartelas_schema.py)")
        if cp.returncode != 0:
            raise TestFailure("Migração falhou. Interrompendo teste para evitar resultado inválido.")

    # baseline
    status, cards_before_payload = http_request(
        base_url=base_url,
        method="GET",
        path=f"/games/{game_id}/cards",
        token=args.admin_token,
        body=None,
        timeout=30,
    )
    if status != 200 or not isinstance(cards_before_payload, list):
        raise TestFailure(f"Falha ao obter cartelas iniciais: HTTP {status} | payload={cards_before_payload}")

    cards_before = len(cards_before_payload)
    print(f"\nCartelas antes do teste: {cards_before}")

    # 1) simular carga (10 rápidas)
    print(f"\n[1/6] Simulando carga: criando {args.load} cartelas rapidamente...")
    load_t0 = now_s()
    success_responses: list[dict] = []
    failures: list[tuple[int, dict | str]] = []

    with ThreadPoolExecutor(max_workers=min(args.load, 10)) as executor:
        futures = [executor.submit(create_card, base_url, game_id, args.faithful_token, "aleatoria", None) for _ in range(args.load)]
        for fut in as_completed(futures):
            code, payload = fut.result()
            if code == 201 and isinstance(payload, dict):
                success_responses.append(payload)
            else:
                failures.append((code, payload))

    load_elapsed = now_s() - load_t0
    print(f"Carga concluída em {load_elapsed:.3f}s | sucesso={len(success_responses)} | falhas={len(failures)}")

    if failures:
        print("Falhas de carga:")
        for code, payload in failures:
            print(f"- HTTP {code}: {payload}")
        raise TestFailure("Carga inicial não completou 100% com sucesso.")

    if len(success_responses) < 1:
        raise TestFailure("Nenhuma cartela foi criada na carga inicial.")

    sample_numbers = success_responses[0].get("numbers")
    if not isinstance(sample_numbers, list) or len(sample_numbers) != 24:
        raise TestFailure("Não foi possível capturar números de uma cartela para teste de duplicata.")

    # 2) lock
    print("\n[2/6] Ativando lock de manutenção...")
    lock_status, lock_payload = http_request(
        base_url=base_url,
        method="POST",
        path="/maintenance/lock",
        token=args.admin_token,
        body={"reason": "Teste de stress/integridade", "minutes": args.lock_minutes},
        timeout=30,
    )
    print(f"Lock response: HTTP {lock_status} | {lock_payload}")
    if lock_status != 200:
        raise TestFailure("Falha ao ativar lock de manutenção.")

    try:
        # 3) barreira de lock
        print("\n[3/6] Testando barreira de lock (tentativa de +1 cartela)...")
        lock_try_status, lock_try_payload = create_card(base_url, game_id, args.faithful_token, "aleatoria", None)
        print(f"Inserção durante lock: HTTP {lock_try_status} | {lock_try_payload}")
        if lock_try_status not in (423, 503):
            raise TestFailure(
                "Barreira de lock falhou: esperado HTTP 423/503 ao inserir durante manutenção. "
                f"Recebido HTTP {lock_try_status}."
            )

        # 4) snapshot + backup
        print("\n[4/6] Validando backup: executando snapshot e backup completo...")
        snap_t0 = now_s()
        cp_snap = run_cmd(
            ["python3", str(MAINTENANCE_SCRIPT), "snapshot", "--game-id", game_id],
            "Snapshot",
        )
        snap_elapsed = now_s() - snap_t0
        if cp_snap.returncode != 0:
            raise TestFailure("Snapshot falhou.")

        backup_t0 = now_s()
        cp_backup = run_cmd(
            ["python3", str(MAINTENANCE_SCRIPT), "backup"],
            "Backup completo",
        )
        backup_elapsed = now_s() - backup_t0
        if cp_backup.returncode != 0:
            raise TestFailure("Backup completo falhou.")

        print(f"Tempo snapshot: {snap_elapsed:.3f}s")
        print(f"Tempo backup  : {backup_elapsed:.3f}s")

    finally:
        # 5) unlock
        print("\n[5/6] Destravando manutenção...")
        unlock_status, unlock_payload = http_request(
            base_url=base_url,
            method="POST",
            path="/maintenance/unlock",
            token=args.admin_token,
            body=None,
            timeout=30,
        )
        print(f"Unlock response: HTTP {unlock_status} | {unlock_payload}")
        if unlock_status != 200:
            raise TestFailure("Falha ao desativar lock de manutenção.")

    # 6) verificação final + duplicata
    print("\n[6/6] Verificando integridade pós-unlock...")
    status_after, cards_after_payload = http_request(
        base_url=base_url,
        method="GET",
        path=f"/games/{game_id}/cards",
        token=args.admin_token,
        body=None,
        timeout=30,
    )
    if status_after != 200 or not isinstance(cards_after_payload, list):
        raise TestFailure(f"Falha ao obter cartelas finais: HTTP {status_after} | payload={cards_after_payload}")

    cards_after = len(cards_after_payload)
    expected_min = cards_before + args.load
    print(f"Cartelas após teste: {cards_after} | esperado mínimo: {expected_min}")
    if cards_after < expected_min:
        raise TestFailure("Quantidade final de cartelas menor que o esperado.")

    print("\nTestando duplicata personalizada (mesmos 24 números)...")
    dup_status, dup_payload = create_card(
        base_url=base_url,
        game_id=game_id,
        faithful_token=args.faithful_token,
        mode="personalizada",
        numbers=sample_numbers,
    )
    print(f"Duplicata response: HTTP {dup_status} | {dup_payload}")
    if dup_status != 409:
        raise TestFailure(
            "Índice/regra de unicidade não confirmou duplicata como esperado (HTTP 409). "
            f"Recebido HTTP {dup_status}."
        )

    print("\n✅ TESTE APROVADO")
    print("- Carga inicial criada com sucesso")
    print("- Lock bloqueou inserção (423/503)")
    print("- Snapshot e backup executados")
    print("- Unlock concluído")
    print("- Integridade mantida e duplicata bloqueada (409)")


if __name__ == "__main__":
    try:
        main()
    except TestFailure as exc:
        print(f"\n❌ TESTE REPROVADO: {exc}")
        sys.exit(2)
    except Exception as exc:
        print(f"\n❌ ERRO INESPERADO: {type(exc).__name__}: {exc}")
        sys.exit(1)
