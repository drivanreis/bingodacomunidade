#!/usr/bin/env python3
"""
Migração técnica de Jogos/Cartelas para schema blindado.

Objetivos:
- Adicionar max_cards em sorteios
- Adicionar n1..n24 em cartelas
- Migrar dados legados de cartelas.numeros (JSON) para n1..n24
- Criar índice único composto (sorteio_id + n1..n24)
- Normalizar status legado de cartelas para o novo fluxo
"""

from __future__ import annotations

import json
import sys
from typing import Any
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import inspect, text

from src.db.base import engine


CARD_COLS = [f"n{i}" for i in range(1, 25)]
UNIQUE_INDEX_NAME = "uq_cartela_sorteio_n1_n24"


def get_columns(table: str) -> set[str]:
    insp = inspect(engine)
    return {col["name"] for col in insp.get_columns(table)}


def add_column_if_missing(table: str, column_ddl: str, column_name: str):
    cols = get_columns(table)
    if column_name in cols:
        return
    with engine.begin() as conn:
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column_ddl}"))
    print(f"✅ Coluna adicionada: {table}.{column_name}")


def migrate_legacy_numbers():
    cols = get_columns("cartelas")
    if "numeros" not in cols:
        print("ℹ️ Coluna legada cartelas.numeros não existe; nada para migrar")
        return

    select_cols = "id, numeros, " + ", ".join(CARD_COLS)
    with engine.begin() as conn:
        rows = conn.execute(text(f"SELECT {select_cols} FROM cartelas")).mappings().all()

        migrated = 0
        for row in rows:
            existing = [row.get(c) for c in CARD_COLS]
            if all(existing):
                continue

            raw = row.get("numeros")
            if raw is None:
                continue

            parsed: Any = raw
            if isinstance(raw, str):
                try:
                    parsed = json.loads(raw)
                except Exception:
                    parsed = None

            numbers: list[str] = []
            if isinstance(parsed, list):
                for item in parsed:
                    if isinstance(item, list):
                        for sub in item:
                            numbers.append(str(sub).zfill(2))
                    else:
                        numbers.append(str(item).zfill(2))

            if len(numbers) != 24:
                continue

            set_clause = ", ".join([f"{c} = :{c}" for c in CARD_COLS])
            params = {c: numbers[idx] for idx, c in enumerate(CARD_COLS)}
            params["id"] = row["id"]
            conn.execute(text(f"UPDATE cartelas SET {set_clause} WHERE id = :id"), params)
            migrated += 1

    print(f"✅ Cartelas legadas migradas para n1..n24: {migrated}")


def check_duplicates_before_unique_index() -> None:
    group_cols = ", ".join(["sorteio_id", *CARD_COLS])
    query = f"""
        SELECT {group_cols}, COUNT(*) AS c
        FROM cartelas
        GROUP BY {group_cols}
        HAVING COUNT(*) > 1
        LIMIT 5
    """

    with engine.connect() as conn:
        dups = conn.execute(text(query)).fetchall()

    if dups:
        print("❌ Duplicatas detectadas. Resolva antes de criar índice único.")
        for item in dups:
            print("  DUP:", item)
        raise RuntimeError("Existem cartelas duplicadas para o mesmo jogo")


def create_unique_index_if_missing():
    with engine.begin() as conn:
        conn.execute(text(
            f"CREATE UNIQUE INDEX IF NOT EXISTS {UNIQUE_INDEX_NAME} "
            f"ON cartelas (sorteio_id, {', '.join(CARD_COLS)})"
        ))
    print(f"✅ Índice único criado/verificado: {UNIQUE_INDEX_NAME}")


def normalize_legacy_statuses():
    """
    Regras de normalização:
    - ativa -> paga (cartela historicamente válida para sorteio)
    - vencedora/perdedora permanecem inalteradas
    - demais valores permanecem para análise manual
    """
    with engine.begin() as conn:
        updated = conn.execute(text(
            "UPDATE cartelas SET status = 'paga' WHERE status = 'ativa'"
        )).rowcount or 0
    print(f"✅ Status legados normalizados (ativa -> paga): {updated}")


def main():
    print("🚀 Iniciando migração Jogos/Cartelas...")

    add_column_if_missing("sorteios", "max_cards INTEGER", "max_cards")

    for card_col in CARD_COLS:
        add_column_if_missing("cartelas", f"{card_col} CHAR(2)", card_col)

    migrate_legacy_numbers()

    # Garantir que não existem nulls nas colunas novas para criar índice confiável
    with engine.connect() as conn:
        null_check = conn.execute(text(
            "SELECT COUNT(*) FROM cartelas WHERE " + " OR ".join([f"{c} IS NULL" for c in CARD_COLS])
        )).scalar() or 0

    if int(null_check) > 0:
        print(f"⚠️ Existem {null_check} cartelas com n1..n24 incompletos. O índice único será criado mesmo assim, mas revise esses registros.")

    normalize_legacy_statuses()

    check_duplicates_before_unique_index()
    create_unique_index_if_missing()

    print("✅ Migração concluída")


if __name__ == "__main__":
    main()
