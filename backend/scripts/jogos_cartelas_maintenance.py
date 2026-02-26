#!/usr/bin/env python3
"""
Rotina de manutenção para encerramento de jogos/cartelas.

Fluxo sugerido:
1) lock         -> bloqueia novas escritas por alguns minutos
2) snapshot     -> gera foto rápida dos resultados do jogo
3) backup       -> executa backup completo consistente
4) unlock       -> libera escritas
"""

from __future__ import annotations

import argparse
import json
import os
import sqlite3
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import timedelta
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy.engine import make_url

from src.db.base import DATABASE_URL, SessionLocal
from src.models.models import (
    Cartela,
    CategoriaConfiguracao,
    Configuracao,
    Sorteio,
    StatusCartela,
    TipoConfiguracao,
)
from src.utils.time_manager import get_fortaleza_time


CARD_COLS = [f"n{i}" for i in range(1, 25)]


def get_or_create_config(db, chave: str, valor_padrao: str, descricao: str) -> Configuracao:
    row = db.query(Configuracao).filter(Configuracao.chave == chave).first()
    if row:
        return row
    row = Configuracao(
        chave=chave,
        valor=valor_padrao,
        tipo=TipoConfiguracao.STRING,
        categoria=CategoriaConfiguracao.SEGURANCA,
        descricao=descricao,
    )
    db.add(row)
    db.flush()
    return row


def set_lock(minutes: int, reason: str):
    db = SessionLocal()
    try:
        now = get_fortaleza_time()
        lock_until = now + timedelta(minutes=minutes)

        mode = get_or_create_config(db, "maintenance_mode", "false", "Flag de manutenção")
        reason_row = get_or_create_config(db, "maintenance_reason", "", "Motivo da manutenção")
        until = get_or_create_config(db, "maintenance_lock_until", "", "Timestamp ISO limite da manutenção")

        mode.valor = "true"
        reason_row.valor = reason
        until.valor = lock_until.isoformat()
        mode.alterado_em = now
        reason_row.alterado_em = now
        until.alterado_em = now

        db.commit()
        print(f"✅ Manutenção ativada até {lock_until.isoformat()} | motivo: {reason}")
    finally:
        db.close()


def unset_lock():
    db = SessionLocal()
    try:
        now = get_fortaleza_time()
        mode = get_or_create_config(db, "maintenance_mode", "false", "Flag de manutenção")
        until = get_or_create_config(db, "maintenance_lock_until", "", "Timestamp ISO limite da manutenção")

        mode.valor = "false"
        until.valor = ""
        mode.alterado_em = now
        until.alterado_em = now

        db.commit()
        print("✅ Manutenção desativada")
    finally:
        db.close()


def emit_alert(message: str) -> Path:
    alerts_dir = Path("backend/data/alerts")
    alerts_dir.mkdir(parents=True, exist_ok=True)
    stamp = get_fortaleza_time().strftime("%Y%m%d_%H%M%S")
    path = alerts_dir / f"maintenance_alert_{stamp}.log"
    path.write_text(message + "\n", encoding="utf-8")
    print(f"🚨 ALERTA OPERACIONAL: {message}")
    print(f"📄 Alerta salvo em: {path}")
    return path


def snapshot_game(game_id: str, output_dir: str | None = None) -> Path:
    db = SessionLocal()
    try:
        jogo = db.query(Sorteio).filter(Sorteio.id == game_id).first()
        if not jogo:
            raise RuntimeError(f"Jogo não encontrado: {game_id}")

        vencedoras = db.query(Cartela).filter(
            Cartela.sorteio_id == game_id,
            Cartela.status == StatusCartela.VENCEDORA,
        ).all()

        base_dir = Path(output_dir) if output_dir else Path("backend/data/snapshots")
        base_dir.mkdir(parents=True, exist_ok=True)

        stamp = get_fortaleza_time().strftime("%Y%m%d_%H%M%S")
        target = base_dir / f"snapshot_{game_id}_{stamp}.json"

        payload = {
            "snapshot_at": get_fortaleza_time().isoformat(),
            "game": {
                "id": jogo.id,
                "titulo": jogo.titulo,
                "status": jogo.status.value if hasattr(jogo.status, "value") else str(jogo.status),
                "horario_sorteio": jogo.horario_sorteio.isoformat() if jogo.horario_sorteio else None,
                "total_arrecadado": float(jogo.total_arrecadado or 0),
                "total_premio": float(jogo.total_premio or 0),
                "total_cartelas_vendidas": int(jogo.total_cartelas_vendidas or 0),
            },
            "winner_cards": [
                {
                    "id": c.id,
                    "usuario_id": c.usuario_id,
                    "numbers": [
                        c.n1, c.n2, c.n3, c.n4, c.n5, c.n6,
                        c.n7, c.n8, c.n9, c.n10, c.n11, c.n12,
                        c.n13, c.n14, c.n15, c.n16, c.n17, c.n18,
                        c.n19, c.n20, c.n21, c.n22, c.n23, c.n24,
                    ],
                    "valor_premio": float(c.valor_premio or 0),
                }
                for c in vencedoras
            ],
        }

        target.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"✅ Snapshot gerado: {target}")
        return target
    finally:
        db.close()


def backup_database(output_file: str | None = None) -> Path:
    now = get_fortaleza_time().strftime("%Y%m%d_%H%M%S")

    if DATABASE_URL.startswith("sqlite"):
        sqlite_path = Path("backend/data/bingo.db")
        if not sqlite_path.exists():
            sqlite_path = Path("data/bingo.db")
        if not sqlite_path.exists():
            raise RuntimeError("Arquivo SQLite não encontrado")

        out = Path(output_file) if output_file else Path(f"backend/data/backup_bingo_{now}.db")
        out.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(sqlite_path, out)
        print(f"✅ Backup SQLite criado: {out}")
        return out

    # PostgreSQL via pg_dump
    out = Path(output_file) if output_file else Path(f"backend/data/backup_bingo_{now}.sql")
    out.parent.mkdir(parents=True, exist_ok=True)

    url = make_url(DATABASE_URL)
    env = os.environ.copy()
    if url.password:
        env["PGPASSWORD"] = url.password

    cmd = [
        "pg_dump",
        "-h", url.host or "localhost",
        "-p", str(url.port or 5432),
        "-U", url.username or "postgres",
        "-d", url.database or "postgres",
        "-f", str(out),
    ]

    completed = subprocess.run(cmd, env=env, check=False, capture_output=True, text=True)
    if completed.returncode != 0:
        raise RuntimeError(f"Falha no pg_dump: {completed.stderr.strip()}")

    print(f"✅ Backup PostgreSQL criado: {out}")
    return out


def _sqlite_has_unique_index_on_cards(conn: sqlite3.Connection) -> bool:
    idx_rows = conn.execute("PRAGMA index_list('cartelas')").fetchall()
    unique_indices = [r[1] for r in idx_rows if len(r) >= 3 and int(r[2]) == 1]

    expected = ["sorteio_id", *CARD_COLS]
    for idx_name in unique_indices:
        cols = conn.execute(f"PRAGMA index_info('{idx_name}')").fetchall()
        ordered_cols = [c[2] for c in cols]
        if ordered_cols == expected:
            return True
    return False


def validate_restore_consistency(backup_path: Path) -> dict[str, str]:
    """
    Valida consistência do backup com restauração em base temporária.
    - SQLite: restaura via cópia para temp e valida schema.
    - PostgreSQL: restaura dump em DB temporário e valida schema.
    """
    if DATABASE_URL.startswith("sqlite"):
        tmp_dir = Path("backend/data/restore-check")
        tmp_dir.mkdir(parents=True, exist_ok=True)
        restored_db = tmp_dir / f"restore_check_{get_fortaleza_time().strftime('%Y%m%d_%H%M%S')}.db"
        shutil.copy2(backup_path, restored_db)

        conn = sqlite3.connect(str(restored_db))
        try:
            table_cols = conn.execute("PRAGMA table_info('cartelas')").fetchall()
            col_names = {r[1] for r in table_cols}
            missing = [c for c in CARD_COLS if c not in col_names]
            if missing:
                raise RuntimeError(f"Restore inválido: colunas ausentes em cartelas: {missing}")

            if not _sqlite_has_unique_index_on_cards(conn):
                raise RuntimeError("Restore inválido: índice único (sorteio_id + n1..n24) não encontrado")
        finally:
            conn.close()

        return {
            "engine": "sqlite",
            "restored_target": str(restored_db),
            "status": "ok",
        }

    url = make_url(DATABASE_URL)
    stamp = get_fortaleza_time().strftime("%Y%m%d_%H%M%S")
    temp_db = f"bingo_restore_check_{stamp}"

    env = os.environ.copy()
    if url.password:
        env["PGPASSWORD"] = url.password

    host = url.host or "localhost"
    port = str(url.port or 5432)
    user = url.username or "postgres"

    createdb_cmd = ["createdb", "-h", host, "-p", port, "-U", user, temp_db]
    restore_cmd = ["psql", "-h", host, "-p", port, "-U", user, "-d", temp_db, "-f", str(backup_path)]
    schema_check_cmd = [
        "psql", "-h", host, "-p", port, "-U", user, "-d", temp_db,
        "-t", "-A",
        "-c",
        (
            "SELECT "
            "(SELECT COUNT(*) FROM information_schema.columns "
            " WHERE table_name='cartelas' AND column_name IN ("
            + ",".join([f"'{c}'" for c in CARD_COLS])
            + "))::text || '|' || "
            "(SELECT COUNT(*) FROM pg_indexes "
            " WHERE tablename='cartelas' "
            "   AND indexdef ILIKE '%UNIQUE%' "
            "   AND indexdef ILIKE '%(sorteio_id, n1, n2, n3, n4, n5, n6, n7, n8, n9, n10, n11, n12, n13, n14, n15, n16, n17, n18, n19, n20, n21, n22, n23, n24)%')"
        ),
    ]
    dropdb_cmd = ["dropdb", "-h", host, "-p", port, "-U", user, temp_db]

    try:
        created = subprocess.run(createdb_cmd, env=env, check=False, capture_output=True, text=True)
        if created.returncode != 0:
            raise RuntimeError(f"Falha ao criar DB temporário de restore: {created.stderr.strip()}")

        restored = subprocess.run(restore_cmd, env=env, check=False, capture_output=True, text=True)
        if restored.returncode != 0:
            raise RuntimeError(f"Falha ao restaurar dump: {restored.stderr.strip()}")

        checked = subprocess.run(schema_check_cmd, env=env, check=False, capture_output=True, text=True)
        if checked.returncode != 0:
            raise RuntimeError(f"Falha na validação do schema restaurado: {checked.stderr.strip()}")

        output = (checked.stdout or "").strip()
        parts = output.split("|")
        if len(parts) != 2:
            raise RuntimeError(f"Saída inesperada na validação do restore: {output}")

        cols_count = int(parts[0])
        unique_count = int(parts[1])
        if cols_count < 24:
            raise RuntimeError("Restore inválido: colunas n1..n24 incompletas em cartelas")
        if unique_count < 1:
            raise RuntimeError("Restore inválido: índice único composto não encontrado")

        return {
            "engine": "postgresql",
            "restored_target": temp_db,
            "status": "ok",
        }
    finally:
        subprocess.run(dropdb_cmd, env=env, check=False, capture_output=True, text=True)


def simulate_insert_during_lock(base_url: str, game_id: str, faithful_token: str) -> dict[str, str]:
    payload = json.dumps({"modo": "aleatoria"}).encode("utf-8")
    target = f"{base_url.rstrip('/')}/games/{game_id}/cards"

    req = urllib.request.Request(
        target,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {faithful_token}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            body = resp.read().decode("utf-8", errors="ignore")
            return {
                "status": str(resp.status),
                "detail": body,
            }
    except urllib.error.HTTPError as err:
        detail = err.read().decode("utf-8", errors="ignore") if err.fp else ""
        return {
            "status": str(err.code),
            "detail": detail,
        }


def run_cycle(game_id: str, minutes: int, reason: str, snapshot_dir: str | None, backup_file: str | None):
    set_lock(minutes=minutes, reason=reason)
    try:
        snap_t0 = time.perf_counter()
        snapshot_target = snapshot_game(game_id=game_id, output_dir=snapshot_dir)
        snap_elapsed = time.perf_counter() - snap_t0

        backup_t0 = time.perf_counter()
        backup_target = backup_database(output_file=backup_file)
        backup_elapsed = time.perf_counter() - backup_t0

        restore_t0 = time.perf_counter()
        restore_check = validate_restore_consistency(backup_target)
        restore_elapsed = time.perf_counter() - restore_t0

        print("✅ Ciclo de encerramento concluído com sucesso")
        print(f"⏱️ Snapshot: {snap_elapsed:.3f}s | arquivo: {snapshot_target}")
        print(f"⏱️ Backup: {backup_elapsed:.3f}s | arquivo: {backup_target}")
        print(f"⏱️ Restore-check: {restore_elapsed:.3f}s | destino: {restore_check['restored_target']}")
        unset_lock()
    except Exception as exc:
        alert_message = (
            "Falha no ciclo de manutenção. Acionando auto-unlock failsafe. "
            f"Erro: {type(exc).__name__}: {exc}"
        )
        emit_alert(alert_message)
        try:
            unset_lock()
        except Exception as unlock_exc:
            emit_alert(f"Falha crítica ao destravar manutenção: {type(unlock_exc).__name__}: {unlock_exc}")
        raise


def run_drill(
    game_id: str,
    minutes: int,
    reason: str,
    snapshot_dir: str | None,
    backup_file: str | None,
    base_url: str,
    faithful_token: str,
):
    print("🧪 Iniciando simulação operacional (4 pontos)")
    set_lock(minutes=minutes, reason=reason)

    try:
        print("\n[1/4] Integridade do Lock: testando inserção de cartela durante lock...")
        lock_result = simulate_insert_during_lock(base_url=base_url, game_id=game_id, faithful_token=faithful_token)
        print(f"Resultado inserção durante lock: HTTP {lock_result['status']}")
        if lock_result["status"] != "423":
            raise RuntimeError(
                "Teste de lock falhou: esperado HTTP 423 durante manutenção, "
                f"obtido HTTP {lock_result['status']}"
            )

        print("\n[2/4] Velocidade do Snapshot: cronometrando...")
        snap_t0 = time.perf_counter()
        snapshot_target = snapshot_game(game_id=game_id, output_dir=snapshot_dir)
        snap_elapsed = time.perf_counter() - snap_t0
        print(f"Snapshot concluído em {snap_elapsed:.3f}s | arquivo: {snapshot_target}")

        print("\n[3/4] Consistência do Backup: backup + restore-check em base temporária...")
        backup_t0 = time.perf_counter()
        backup_target = backup_database(output_file=backup_file)
        backup_elapsed = time.perf_counter() - backup_t0

        restore_t0 = time.perf_counter()
        restore_check = validate_restore_consistency(backup_target)
        restore_elapsed = time.perf_counter() - restore_t0

        print(f"Backup em {backup_elapsed:.3f}s | arquivo: {backup_target}")
        print(f"Restore-check em {restore_elapsed:.3f}s | destino: {restore_check['restored_target']}")

        print("\n[4/4] Auto-Unlock: validado no fluxo normal (unlock ao final)")
        unset_lock()
        print("✅ Simulação concluída com sucesso")
    except Exception as exc:
        print("\n[4/4] Auto-Unlock: validando failsafe após falha...")
        emit_alert(
            "Falha durante simulação de manutenção. "
            f"Ativando auto-unlock failsafe. Erro: {type(exc).__name__}: {exc}"
        )
        try:
            unset_lock()
            print("✅ Failsafe executado: manutenção destravada")
        except Exception as unlock_exc:
            emit_alert(f"Falha crítica no failsafe de unlock: {type(unlock_exc).__name__}: {unlock_exc}")
        raise


def main():
    parser = argparse.ArgumentParser(description="Operações de manutenção para Jogos/Cartelas")
    sub = parser.add_subparsers(dest="command", required=True)

    p_lock = sub.add_parser("lock", help="Ativa lock de manutenção")
    p_lock.add_argument("--minutes", type=int, default=5)
    p_lock.add_argument("--reason", type=str, default="Sistema em manutenção para processamento de resultados")

    sub.add_parser("unlock", help="Desativa lock de manutenção")

    p_snapshot = sub.add_parser("snapshot", help="Gera snapshot de um jogo")
    p_snapshot.add_argument("--game-id", required=True)
    p_snapshot.add_argument("--output-dir", default=None)

    p_backup = sub.add_parser("backup", help="Gera backup completo do banco")
    p_backup.add_argument("--output-file", default=None)

    p_cycle = sub.add_parser("close-cycle", help="Executa lock + snapshot + backup + unlock")
    p_cycle.add_argument("--game-id", required=True)
    p_cycle.add_argument("--minutes", type=int, default=5)
    p_cycle.add_argument("--reason", type=str, default="Sistema em manutenção para processamento de resultados")
    p_cycle.add_argument("--snapshot-dir", default=None)
    p_cycle.add_argument("--backup-file", default=None)

    p_drill = sub.add_parser("drill", help="Simulação operacional validando 4 pontos críticos")
    p_drill.add_argument("--game-id", required=True)
    p_drill.add_argument("--minutes", type=int, default=5)
    p_drill.add_argument("--reason", type=str, default="Simulação operacional de encerramento")
    p_drill.add_argument("--snapshot-dir", default=None)
    p_drill.add_argument("--backup-file", default=None)
    p_drill.add_argument("--base-url", type=str, default="http://localhost:8000")
    p_drill.add_argument("--faithful-token", required=True, help="Token JWT de usuário comum para testar compra durante lock")

    args = parser.parse_args()

    if args.command == "lock":
        set_lock(minutes=args.minutes, reason=args.reason)
    elif args.command == "unlock":
        unset_lock()
    elif args.command == "snapshot":
        snapshot_game(game_id=args.game_id, output_dir=args.output_dir)
    elif args.command == "backup":
        backup_database(output_file=args.output_file)
    elif args.command == "close-cycle":
        run_cycle(
            game_id=args.game_id,
            minutes=args.minutes,
            reason=args.reason,
            snapshot_dir=args.snapshot_dir,
            backup_file=args.backup_file,
        )
    elif args.command == "drill":
        run_drill(
            game_id=args.game_id,
            minutes=args.minutes,
            reason=args.reason,
            snapshot_dir=args.snapshot_dir,
            backup_file=args.backup_file,
            base_url=args.base_url,
            faithful_token=args.faithful_token,
        )


if __name__ == "__main__":
    main()
