"""
Rotas de Jogos e Cartelas
=========================
Fluxo principal:
- Admin (site/paróquia) cria jogos
- Fiel cria cartelas sob demanda (personalizada ou aleatória)
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timedelta
from random import sample
from typing import Any, List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, model_validator
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.db.base import get_db
from src.models.models import (
    Cartela,
    CategoriaConfiguracao,
    Configuracao,
    Paroquia,
    Sorteio,
    StatusCartela,
    StatusSorteio,
    TipoConfiguracao,
    UsuarioComum,
)
from src.utils.auth import get_current_user
from src.utils.time_manager import generate_temporal_id_with_microseconds, get_fortaleza_time

router = APIRouter(tags=["Jogos e Cartelas"])
logger = logging.getLogger(__name__)


STATUS_TO_PUBLIC = {
    StatusSorteio.AGENDADO.value: "scheduled",
    StatusSorteio.EM_ANDAMENTO.value: "active",
    StatusSorteio.FINALIZADO.value: "finished",
    StatusSorteio.CANCELADO.value: "cancelled",
}


class GameCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    data_inicio_vendas: datetime
    data_sorteio: datetime
    card_price: float = Field(..., gt=0)
    max_cards: Optional[int] = Field(None, ge=1)
    prize_percent: float = Field(50.0, ge=0, le=100)
    parish_percent: float = Field(30.0, ge=0, le=100)
    operation_percent: float = Field(15.0, ge=0, le=100)
    evolution_percent: float = Field(5.0, ge=0, le=100)

    @model_validator(mode="after")
    def validate_business_rules(self):
        total = (
            self.prize_percent
            + self.parish_percent
            + self.operation_percent
            + self.evolution_percent
        )
        if abs(total - 100.0) > 0.01:
            raise ValueError("A soma dos percentuais deve ser 100%")
        if self.prize_percent < 49.0:
            raise ValueError("Prêmio não pode ser menor que 49%")
        if self.evolution_percent < 1.0:
            raise ValueError("Seguro operacional não pode ser menor que 1%")
        if self.operation_percent < (self.parish_percent / 3):
            raise ValueError("Operação não pode ser menor que 1/3 do percentual da Paróquia")
        if self.data_inicio_vendas >= self.data_sorteio:
            raise ValueError("A data de início das vendas deve ser anterior à data do sorteio")
        return self


class CardCreateRequest(BaseModel):
    modo: str = Field("aleatoria", description="aleatoria ou personalizada")
    numeros: Optional[List[str]] = None


class MaintenanceLockRequest(BaseModel):
    reason: str = Field("Manutenção de encerramento de jogo")
    minutes: int = Field(5, ge=1, le=120)


class CloseSalesRequest(BaseModel):
    iniciar_sorteio: bool = Field(
        True, description="Se true, move jogo para em_andamento após fechamento"
    )


class GameRescheduleRequest(BaseModel):
    novo_horario_sorteio: datetime
    mode: Literal["single", "cascade"] = Field(
        "single", description="single = somente este jogo | cascade = este + próximos"
    )
    preview: bool = Field(False, description="Quando true, apenas simula impacto sem persistir")


class GameUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = None
    card_price: Optional[float] = Field(None, gt=0)
    max_cards: Optional[int] = Field(None, ge=1)
    prize_percent: Optional[float] = Field(None, ge=0, le=100)
    parish_percent: Optional[float] = Field(None, ge=0, le=100)
    operation_percent: Optional[float] = Field(None, ge=0, le=100)
    evolution_percent: Optional[float] = Field(None, ge=0, le=100)

    @model_validator(mode="after")
    def validate_at_least_one_field(self):
        if all(
            value is None
            for value in (
                self.title,
                self.description,
                self.card_price,
                self.max_cards,
                self.prize_percent,
                self.parish_percent,
                self.operation_percent,
                self.evolution_percent,
            )
        ):
            raise ValueError("Informe ao menos um campo para atualização")
        return self


def _normalize_datetime_for_compare(value: Optional[datetime]) -> Optional[datetime]:
    if value is None:
        return None
    return value.replace(tzinfo=None) if value.tzinfo else value


def _is_admin_payload(user_payload: dict[str, Any]) -> bool:
    nivel = (user_payload.get("nivel_acesso") or "").strip().lower()
    tipo = (user_payload.get("tipo") or "").strip().lower()
    return nivel in {"admin_site", "admin_paroquia"} or tipo in {
        "admin_site",
        "usuario_paroquia",
        "usuario_administrativo",
    }


def _is_fiel_payload(user_payload: dict[str, Any]) -> bool:
    tipo = (user_payload.get("tipo") or "").strip().lower()
    return tipo == "usuario_comum"


def _resolve_single_paroquia(db: Session) -> Paroquia:
    paroquias = db.query(Paroquia).all()
    if not paroquias:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Nenhuma paróquia cadastrada"
        )
    if len(paroquias) > 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Configuração inválida: o sistema deve possuir apenas uma paróquia",
        )
    return paroquias[0]


def _extract_card_numbers(card: Cartela) -> list[str]:
    return [
        str(card.n1),
        str(card.n2),
        str(card.n3),
        str(card.n4),
        str(card.n5),
        str(card.n6),
        str(card.n7),
        str(card.n8),
        str(card.n9),
        str(card.n10),
        str(card.n11),
        str(card.n12),
        str(card.n13),
        str(card.n14),
        str(card.n15),
        str(card.n16),
        str(card.n17),
        str(card.n18),
        str(card.n19),
        str(card.n20),
        str(card.n21),
        str(card.n22),
        str(card.n23),
        str(card.n24),
    ]


def _card_columns_from_numbers(numbers_24: list[str]) -> dict[str, str]:
    return {f"n{idx}": numbers_24[idx - 1] for idx in range(1, 25)}


def _validate_24_numbers(values: list[str]) -> list[str]:
    if len(values) != 24:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A cartela deve conter exatamente 24 números",
        )

    normalized: list[str] = []
    seen = set()
    for raw in values:
        digits = "".join(ch for ch in str(raw) if ch.isdigit())
        if not digits:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Todos os campos da cartela devem ser numéricos",
            )
        num = int(digits)
        if num < 1 or num > 75:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Os números da cartela devem estar entre 01 e 75",
            )
        token = f"{num:02d}"
        if token in seen:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="A cartela não pode repetir números"
            )
        seen.add(token)
        normalized.append(token)

    return normalized


def _cartela_signature(numbers_24: list[str]) -> str:
    return "|".join(numbers_24)


def _cartela_signature_checkout(numbers_24: list[str]) -> str:
    return "|".join(sorted(numbers_24))


def _build_paid_card_lock_key(game_id: str, numbers_24: list[str]) -> str:
    return f"paid_card_unique::{game_id}::{_cartela_signature_checkout(numbers_24)}"


def _raise_persona_http_error(
    status_code: int,
    *,
    leigo: str,
    medio: str,
    codigo: str,
    technical: str | None = None,
):
    if technical:
        logger.error("%s :: %s", codigo, technical)
    raise HTTPException(
        status_code=status_code,
        detail={
            "leigo": leigo,
            "medio": medio,
            "codigo": codigo,
        },
    )


def _existing_signatures_for_game(db: Session, sorteio_id: str) -> set[str]:
    signatures = set()
    cartelas = db.query(Cartela).filter(Cartela.sorteio_id == sorteio_id).all()
    for cartela in cartelas:
        flattened = _extract_card_numbers(cartela)
        if len(flattened) == 24:
            signatures.add(_cartela_signature(flattened))
    return signatures


def _is_cartela_unique_violation(exc: IntegrityError) -> bool:
    message = str(exc.orig).lower() if getattr(exc, "orig", None) else str(exc).lower()
    return "uq_cartela_sorteio_n1_n24" in message or (
        "unique constraint failed" in message
        and "cartelas.sorteio_id" in message
        and "cartelas.n1" in message
    )


def _is_paid_card_lock_violation(exc: IntegrityError) -> bool:
    message = str(exc.orig).lower() if getattr(exc, "orig", None) else str(exc).lower()
    return "paid_card_unique::" in message or (
        "unique constraint failed" in message and "configuracoes.chave" in message
    )


def _get_or_create_config(
    db: Session, chave: str, valor_padrao: str, descricao: str
) -> Configuracao:
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


def _is_maintenance_write_locked(db: Session) -> bool:
    mode = db.query(Configuracao).filter(Configuracao.chave == "maintenance_mode").first()
    until = db.query(Configuracao).filter(Configuracao.chave == "maintenance_lock_until").first()

    mode_enabled = (mode.valor.strip().lower() == "true") if mode and mode.valor else False
    if mode_enabled:
        return True

    if until and until.valor:
        try:
            locked_until = datetime.fromisoformat(until.valor)
            now = get_fortaleza_time()
            return now <= locked_until
        except Exception:
            return False

    return False


def _ensure_not_in_maintenance(db: Session):
    if _is_maintenance_write_locked(db):
        reason_row = (
            db.query(Configuracao).filter(Configuracao.chave == "maintenance_reason").first()
        )
        reason = (
            reason_row.valor
            if reason_row and reason_row.valor
            else "Sistema em manutenção para processamento de resultados"
        )
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=reason,
        )


def _ensure_sales_open_for_game(game: Sorteio, now: datetime):
    now_cmp = _normalize_datetime_for_compare(now)
    inicio_vendas_cmp = _normalize_datetime_for_compare(game.inicio_vendas)
    fim_vendas_cmp = _normalize_datetime_for_compare(game.fim_vendas)

    if game.status in {StatusSorteio.CANCELADO, StatusSorteio.FINALIZADO}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Jogo não está disponível para compra de cartelas",
        )
    if inicio_vendas_cmp and now_cmp and now_cmp < inicio_vendas_cmp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="As vendas ainda não iniciaram"
        )
    if fim_vendas_cmp and now_cmp and now_cmp >= fim_vendas_cmp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="As vendas para este jogo já foram encerradas",
        )


def _snapshot_path_for_game(game_id: str) -> str:
    if os.path.exists("/app/data"):
        snapshot_dir = "/app/data/snapshots"
    else:
        snapshot_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data", "snapshots")
        snapshot_dir = os.path.abspath(snapshot_dir)

    os.makedirs(snapshot_dir, exist_ok=True)
    now = get_fortaleza_time().strftime("%Y%m%d_%H%M%S")
    return os.path.join(snapshot_dir, f"snapshot_{game_id}_{now}.json")


def _future_games_for_reschedule(db: Session, game: Sorteio) -> list[Sorteio]:
    return (
        db.query(Sorteio)
        .filter(
            Sorteio.horario_sorteio > game.horario_sorteio,
            Sorteio.status.in_([StatusSorteio.AGENDADO, StatusSorteio.EM_ANDAMENTO]),
        )
        .order_by(Sorteio.horario_sorteio.asc())
        .all()
    )


def _to_dt_compare(value: Optional[datetime]) -> Optional[datetime]:
    return _normalize_datetime_for_compare(value)


def _build_reschedule_preview(
    game: Sorteio, new_draw_datetime: datetime, mode: str, future_games: list[Sorteio]
) -> dict[str, Any]:
    base_draw_cmp = _to_dt_compare(game.horario_sorteio)
    new_draw_cmp = _to_dt_compare(new_draw_datetime)
    if not base_draw_cmp or not new_draw_cmp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Datas inválidas para remarcação"
        )

    delta = new_draw_cmp - base_draw_cmp
    conflicts: list[dict[str, Any]] = []
    affected_games: list[dict[str, Any]] = []

    target_new_sales_end = new_draw_datetime - timedelta(minutes=1)
    affected_games.append(
        {
            "id": game.id,
            "title": game.titulo,
            "old_draw": game.horario_sorteio.isoformat() if game.horario_sorteio else None,
            "new_draw": new_draw_datetime.isoformat(),
            "old_sales_end": game.fim_vendas.isoformat() if game.fim_vendas else None,
            "new_sales_end": target_new_sales_end.isoformat(),
            "shifted": True,
            "is_target": True,
        }
    )

    for future_game in future_games:
        old_draw = future_game.horario_sorteio
        if mode == "cascade":
            new_draw = old_draw + delta
            shifted = True
        else:
            new_draw = old_draw
            shifted = False

        affected_games.append(
            {
                "id": future_game.id,
                "title": future_game.titulo,
                "old_draw": old_draw.isoformat() if old_draw else None,
                "new_draw": new_draw.isoformat() if new_draw else None,
                "old_sales_end": (
                    future_game.fim_vendas.isoformat() if future_game.fim_vendas else None
                ),
                "new_sales_end": (
                    (future_game.fim_vendas + delta).isoformat()
                    if (mode == "cascade" and future_game.fim_vendas)
                    else (future_game.fim_vendas.isoformat() if future_game.fim_vendas else None)
                ),
                "shifted": shifted,
                "is_target": False,
            }
        )

        if mode == "single":
            old_draw_cmp = _to_dt_compare(old_draw)
            new_target_cmp = _to_dt_compare(new_draw_datetime)
            if old_draw_cmp and new_target_cmp and old_draw_cmp <= new_target_cmp:
                conflicts.append(
                    {
                        "id": future_game.id,
                        "title": future_game.titulo,
                        "draw_date": old_draw.isoformat() if old_draw else None,
                        "reason": "Conflito de cronograma: próximo jogo ocorre no mesmo horário ou antes da nova data proposta.",  # noqa: E501
                    }
                )

    return {
        "mode": mode,
        "delta_minutes": int(delta.total_seconds() // 60),
        "conflict_count": len(conflicts),
        "conflicts": conflicts,
        "affected_games": affected_games,
    }


def _to_game_response(game: Sorteio) -> dict[str, Any]:
    status_public = STATUS_TO_PUBLIC.get(
        game.status.value if hasattr(game.status, "value") else str(game.status), "scheduled"
    )
    return {
        "id": game.id,
        "title": game.titulo,
        "description": game.descricao or "",
        "scheduled_date": game.horario_sorteio.isoformat() if game.horario_sorteio else None,
        "data_inicio_vendas": game.inicio_vendas.isoformat() if game.inicio_vendas else None,
        "data_sorteio": game.horario_sorteio.isoformat() if game.horario_sorteio else None,
        "status": status_public,
        "card_price": float(game.valor_cartela or 0),
        "total_prize": float(game.total_premio or 0),
        "cards_sold": int(game.total_cartelas_vendidas or 0),
        "max_cards": int(game.max_cards) if game.max_cards else None,
        "prize_percent": float(game.rateio_premio or 0),
        "parish_percent": float(game.rateio_paroquia or 0),
        "operation_percent": float(game.rateio_operacao or 0),
        "evolution_percent": float(game.rateio_evolucao or 0),
        "created_at": game.criado_em.isoformat() if game.criado_em else None,
    }


def _to_sorteio_response(game: Sorteio) -> dict[str, Any]:
    return {
        "id": game.id,
        "paroquia_id": game.paroquia_id,
        "titulo": game.titulo,
        "descricao": game.descricao,
        "valor_cartela": float(game.valor_cartela or 0),
        "rateio_premio": float(game.rateio_premio or 0),
        "rateio_paroquia": float(game.rateio_paroquia or 0),
        "rateio_operacao": float(game.rateio_operacao or 0),
        "rateio_evolucao": float(game.rateio_evolucao or 0),
        "status": game.status.value if hasattr(game.status, "value") else str(game.status),
        "total_arrecadado": float(game.total_arrecadado or 0),
        "total_premio": float(game.total_premio or 0),
        "total_cartelas_vendidas": int(game.total_cartelas_vendidas or 0),
        "max_cards": int(game.max_cards) if game.max_cards else None,
        "inicio_vendas": game.inicio_vendas.isoformat() if game.inicio_vendas else None,
        "fim_vendas": game.fim_vendas.isoformat() if game.fim_vendas else None,
        "horario_sorteio": game.horario_sorteio.isoformat() if game.horario_sorteio else None,
        "pedras_sorteadas": game.pedras_sorteadas or [],
        "hash_integridade": game.hash_integridade,
        "vencedores_ids": game.vencedores_ids or [],
        "criado_em": game.criado_em.isoformat() if game.criado_em else None,
        "atualizado_em": game.atualizado_em.isoformat() if game.atualizado_em else None,
    }


@router.get("/games")
def list_games(
    db: Session = Depends(get_db),
    _: dict[str, Any] = Depends(get_current_user),
):
    games = db.query(Sorteio).order_by(Sorteio.horario_sorteio.desc()).all()
    return [_to_game_response(game) for game in games]


@router.get("/sorteios")
def list_sorteios(
    db: Session = Depends(get_db),
    _: dict[str, Any] = Depends(get_current_user),
):
    jogos = db.query(Sorteio).order_by(Sorteio.horario_sorteio.desc()).all()
    return [_to_sorteio_response(jogo) for jogo in jogos]


@router.post("/games", status_code=status.HTTP_201_CREATED)
def create_game(
    payload: GameCreateRequest,
    db: Session = Depends(get_db),
    user_payload: dict[str, Any] = Depends(get_current_user),
):
    if not _is_admin_payload(user_payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Apenas administradores podem criar jogos"
        )

    _ensure_not_in_maintenance(db)

    paroquia_id = user_payload.get("paroquia_id")
    if not paroquia_id:
        paroquia_id = _resolve_single_paroquia(db).id

    fim_vendas = payload.data_sorteio - timedelta(minutes=1)
    if payload.data_inicio_vendas >= fim_vendas:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Início das vendas deve ser antes do fim das vendas (1 minuto antes do sorteio)",
        )

    novo = Sorteio(
        id=generate_temporal_id_with_microseconds("SOR"),
        paroquia_id=paroquia_id,
        titulo=payload.title,
        descricao=payload.description,
        valor_cartela=payload.card_price,
        rateio_premio=payload.prize_percent,
        rateio_paroquia=payload.parish_percent,
        rateio_operacao=payload.operation_percent,
        rateio_evolucao=payload.evolution_percent,
        total_arrecadado=0.0,
        total_premio=0.0,
        total_cartelas_vendidas=0,
        max_cards=payload.max_cards,
        inicio_vendas=payload.data_inicio_vendas,
        fim_vendas=fim_vendas,
        horario_sorteio=payload.data_sorteio,
        status=StatusSorteio.AGENDADO,
        pedras_sorteadas=[],
        vencedores_ids=[],
        criado_em=get_fortaleza_time(),
        atualizado_em=get_fortaleza_time(),
    )

    db.add(novo)
    db.commit()
    db.refresh(novo)
    return _to_game_response(novo)


@router.get("/games/{game_id}")
def get_game(
    game_id: str,
    db: Session = Depends(get_db),
    _: dict[str, Any] = Depends(get_current_user),
):
    game = db.query(Sorteio).filter(Sorteio.id == game_id).first()
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jogo não encontrado")
    return _to_game_response(game)


@router.put("/games/{game_id}", status_code=status.HTTP_200_OK)
def update_game(
    game_id: str,
    payload: GameUpdateRequest,
    db: Session = Depends(get_db),
    user_payload: dict[str, Any] = Depends(get_current_user),
):
    if not _is_admin_payload(user_payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem editar jogos",
        )

    _ensure_not_in_maintenance(db)

    game = db.query(Sorteio).filter(Sorteio.id == game_id).first()
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jogo não encontrado")

    if game.status in {StatusSorteio.FINALIZADO, StatusSorteio.CANCELADO}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível editar jogo finalizado ou cancelado",
        )

    next_title = payload.title if payload.title is not None else game.titulo
    next_description = payload.description if payload.description is not None else game.descricao
    next_card_price = (
        payload.card_price if payload.card_price is not None else float(game.valor_cartela or 0)
    )
    next_max_cards = payload.max_cards if payload.max_cards is not None else game.max_cards
    next_prize_percent = (
        payload.prize_percent
        if payload.prize_percent is not None
        else float(game.rateio_premio or 0)
    )
    next_parish_percent = (
        payload.parish_percent
        if payload.parish_percent is not None
        else float(game.rateio_paroquia or 0)
    )
    next_operation_percent = (
        payload.operation_percent
        if payload.operation_percent is not None
        else float(game.rateio_operacao or 0)
    )
    next_evolution_percent = (
        payload.evolution_percent
        if payload.evolution_percent is not None
        else float(game.rateio_evolucao or 0)
    )

    total = (
        next_prize_percent + next_parish_percent + next_operation_percent + next_evolution_percent
    )
    if abs(total - 100.0) > 0.01:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="A soma dos percentuais deve ser 100%"
        )
    if next_prize_percent < 49.0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Prêmio não pode ser menor que 49%"
        )
    if next_evolution_percent < 1.0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seguro operacional não pode ser menor que 1%",
        )
    if next_operation_percent < (next_parish_percent / 3):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Operação não pode ser menor que 1/3 do percentual da Paróquia",
        )
    if next_card_price <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valor da cartela deve ser maior que zero",
        )

    sold_cards = int(game.total_cartelas_vendidas or 0)
    if next_max_cards is not None and int(next_max_cards) < sold_cards:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"max_cards não pode ser menor que cartelas vendidas ({sold_cards})",
        )

    game.titulo = next_title
    game.descricao = next_description
    game.valor_cartela = next_card_price
    game.max_cards = next_max_cards
    game.rateio_premio = next_prize_percent
    game.rateio_paroquia = next_parish_percent
    game.rateio_operacao = next_operation_percent
    game.rateio_evolucao = next_evolution_percent
    game.atualizado_em = get_fortaleza_time()

    db.commit()
    db.refresh(game)
    return _to_game_response(game)


@router.post("/games/{game_id}/reschedule", status_code=status.HTTP_200_OK)
def reschedule_game(
    game_id: str,
    request: GameRescheduleRequest,
    db: Session = Depends(get_db),
    user_payload: dict[str, Any] = Depends(get_current_user),
):
    if not _is_admin_payload(user_payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem remarcar jogos",
        )

    _ensure_not_in_maintenance(db)

    game = db.query(Sorteio).filter(Sorteio.id == game_id).first()
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jogo não encontrado")

    if game.status in {StatusSorteio.CANCELADO, StatusSorteio.FINALIZADO}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível remarcar jogo finalizado ou cancelado",
        )

    if not game.horario_sorteio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Jogo sem horário de sorteio definido"
        )

    now = get_fortaleza_time()
    new_draw_cmp = _to_dt_compare(request.novo_horario_sorteio)
    now_cmp = _to_dt_compare(now)
    inicio_vendas_cmp = _to_dt_compare(game.inicio_vendas)

    if not new_draw_cmp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Nova data/hora de sorteio inválida"
        )

    if now_cmp and new_draw_cmp <= now_cmp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A nova data/hora do sorteio deve ser futura",
        )

    if inicio_vendas_cmp and new_draw_cmp <= inicio_vendas_cmp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A nova data/hora do sorteio deve ser posterior ao início das vendas",
        )

    old_draw_cmp = _to_dt_compare(game.horario_sorteio)
    if old_draw_cmp and new_draw_cmp == old_draw_cmp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="A nova data/hora é igual à data atual"
        )

    effective_new_draw = new_draw_cmp
    if not effective_new_draw:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Nova data/hora de sorteio inválida"
        )

    future_games = _future_games_for_reschedule(db, game)
    preview = _build_reschedule_preview(game, effective_new_draw, request.mode, future_games)

    if request.preview:
        return {
            "preview": True,
            "applied": False,
            "game_id": game.id,
            **preview,
        }

    if request.mode == "single" and preview["conflict_count"] > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "A remarcação deste jogo gera conflito com jogos futuros. Use modo cascade para remarcar próximos jogos.",  # noqa: E501
                "conflicts": preview["conflicts"],
            },
        )

    if not old_draw_cmp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Horário atual de sorteio inválido"
        )

    delta = effective_new_draw - old_draw_cmp

    game.horario_sorteio = effective_new_draw
    game.fim_vendas = effective_new_draw - timedelta(minutes=1)
    game.atualizado_em = now

    if request.mode == "cascade":
        for future_game in future_games:
            future_game.horario_sorteio = future_game.horario_sorteio + delta
            if future_game.inicio_vendas:
                future_game.inicio_vendas = future_game.inicio_vendas + delta
            if future_game.fim_vendas:
                future_game.fim_vendas = future_game.fim_vendas + delta
            future_game.atualizado_em = now

    db.commit()

    return {
        "preview": False,
        "applied": True,
        "game_id": game.id,
        **preview,
    }


@router.get("/sorteios/{sorteio_id}")
def get_sorteio(
    sorteio_id: str,
    db: Session = Depends(get_db),
    _: dict[str, Any] = Depends(get_current_user),
):
    jogo = db.query(Sorteio).filter(Sorteio.id == sorteio_id).first()
    if not jogo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sorteio não encontrado")
    return _to_sorteio_response(jogo)


@router.get("/games/{game_id}/cards")
def list_game_cards(
    game_id: str,
    db: Session = Depends(get_db),
    _: dict[str, Any] = Depends(get_current_user),
):
    game = db.query(Sorteio).filter(Sorteio.id == game_id).first()
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jogo não encontrado")

    cards = (
        db.query(Cartela)
        .filter(Cartela.sorteio_id == game_id)
        .order_by(Cartela.criado_em.desc())
        .all()
    )
    return [
        {
            "id": card.id,
            "numbers": _extract_card_numbers(card),
            "status": card.status.value if hasattr(card.status, "value") else str(card.status),
            "purchase_date": card.criado_em.isoformat() if card.criado_em else None,
            "owner_name": card.usuario.nome if card.usuario else "Usuário",
            "owner_id": card.usuario_id,
        }
        for card in cards
    ]


@router.post("/games/{game_id}/cards", status_code=status.HTTP_201_CREATED)
def create_card(
    game_id: str,
    request: Optional[CardCreateRequest] = None,
    db: Session = Depends(get_db),
    user_payload: dict[str, Any] = Depends(get_current_user),
):
    if not _is_fiel_payload(user_payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Somente usuário comum (fiel) pode criar cartela",
        )

    _ensure_not_in_maintenance(db)

    user_id = user_payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário inválido")

    fiel = db.query(UsuarioComum).filter(UsuarioComum.id == user_id).first()
    if not fiel or not fiel.ativo:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Fiel não autorizado")

    game = db.query(Sorteio).filter(Sorteio.id == game_id).first()
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jogo não encontrado")

    now = get_fortaleza_time()
    _ensure_sales_open_for_game(game, now)

    body = request or CardCreateRequest()
    modo = (body.modo or "aleatoria").strip().lower()
    if modo == "personalizada":
        if not body.numeros:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Informe os 24 números da cartela personalizada",
            )
        requested_numbers = _validate_24_numbers(body.numeros)
        numbers_24 = requested_numbers.copy()
        signature = _cartela_signature(requested_numbers)
        attempts_limit = 25
    else:
        requested_numbers = []
        numbers_24 = []
        signature = ""
        attempts_limit = 25

    for attempt in range(1, attempts_limit + 1):
        if modo != "personalizada":
            generated = [f"{n:02d}" for n in sample(range(1, 76), 24)]
            numbers_24 = generated
            signature = _cartela_signature(generated)
        elif attempt > 1:
            numbers_24 = sample(requested_numbers, len(requested_numbers))

        card_columns = _card_columns_from_numbers(numbers_24)

        nova = Cartela(
            id=generate_temporal_id_with_microseconds("CAR"),
            sorteio_id=game.id,
            usuario_id=fiel.id,
            status=StatusCartela.NO_CARRINHO,
            numeros_marcados=[],
            criado_em=get_fortaleza_time(),
            atualizado_em=get_fortaleza_time(),
            **card_columns,
        )

        db.add(nova)
        game.atualizado_em = get_fortaleza_time()

        try:
            db.commit()
            db.refresh(nova)
            return {
                "id": nova.id,
                "game_id": game.id,
                "user_id": fiel.id,
                "numbers": numbers_24,
                "signature": signature,
                "status": nova.status.value if hasattr(nova.status, "value") else str(nova.status),
                "purchase_date": nova.criado_em.isoformat() if nova.criado_em else None,
            }
        except IntegrityError as exc:
            db.rollback()
            if _is_cartela_unique_violation(exc):
                continue

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao salvar cartela no banco",
            )

    _raise_persona_http_error(
        status_code=status.HTTP_409_CONFLICT,
        leigo="Não foi possível reservar sua cartela agora. Tente novamente.",
        medio="A reserva de cartela não conseguiu persistir uma combinação válida após múltiplas tentativas.",  # noqa: E501
        codigo="CARD_RESERVATION_RETRY_EXHAUSTED",
    )


@router.post("/sorteios/{sorteio_id}/cartelas", status_code=status.HTTP_201_CREATED)
def create_cartela_legacy(
    sorteio_id: str,
    request: Optional[CardCreateRequest] = None,
    db: Session = Depends(get_db),
    user_payload: dict[str, Any] = Depends(get_current_user),
):
    return create_card(
        game_id=sorteio_id,
        request=request,
        db=db,
        user_payload=user_payload,
    )


@router.get("/users/me/cards")
def list_my_cards(
    db: Session = Depends(get_db),
    user_payload: dict[str, Any] = Depends(get_current_user),
):
    if not _is_fiel_payload(user_payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Somente usuário comum (fiel) possui cartelas",
        )

    user_id = user_payload.get("sub")
    cards = (
        db.query(Cartela)
        .filter(Cartela.usuario_id == user_id)
        .order_by(Cartela.criado_em.desc())
        .all()
    )

    return [
        {
            "id": card.id,
            "game_id": card.sorteio_id,
            "numbers": _extract_card_numbers(card),
            "status": card.status.value if hasattr(card.status, "value") else str(card.status),
            "purchase_date": card.criado_em.isoformat() if card.criado_em else None,
        }
        for card in cards
    ]


@router.post("/games/{game_id}/cards/{card_id}/pay", status_code=status.HTTP_200_OK)
def pay_card(
    game_id: str,
    card_id: str,
    db: Session = Depends(get_db),
    user_payload: dict[str, Any] = Depends(get_current_user),
):
    if not _is_fiel_payload(user_payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Somente usuário comum (fiel) pode pagar cartela",
        )

    _ensure_not_in_maintenance(db)

    user_id = user_payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário inválido")

    card = db.query(Cartela).filter(Cartela.id == card_id, Cartela.sorteio_id == game_id).first()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cartela não encontrada")
    if card.usuario_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você só pode pagar suas próprias cartelas",
        )

    game = db.query(Sorteio).filter(Sorteio.id == game_id).first()
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jogo não encontrado")

    now = get_fortaleza_time()
    _ensure_sales_open_for_game(game, now)

    if card.status in {StatusCartela.PAGA, StatusCartela.ATIVA}:
        return {
            "message": "Cartela já está paga",
            "card_id": card.id,
            "status": StatusCartela.PAGA.value,
        }

    if card.status != StatusCartela.NO_CARRINHO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cartela não está disponível para pagamento",
        )

    if game.max_cards and int(game.total_cartelas_vendidas or 0) >= int(game.max_cards):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Limite máximo de cartelas atingido para este jogo",
        )

    current_numbers = _extract_card_numbers(card)
    paid_lock_key = _build_paid_card_lock_key(game.id, current_numbers)
    paid_lock_row = Configuracao(
        chave=paid_lock_key,
        valor=card.id,
        tipo=TipoConfiguracao.STRING,
        categoria=CategoriaConfiguracao.CARRINHO,
        descricao="Trava de unicidade de cartela no checkout (primeiro pagamento vence)",
    )
    db.add(paid_lock_row)

    card.status = StatusCartela.PAGA
    card.atualizado_em = now

    game.total_cartelas_vendidas = int(game.total_cartelas_vendidas or 0) + 1
    game.total_arrecadado = float(game.total_arrecadado or 0) + float(game.valor_cartela or 0)
    game.total_premio = float(game.total_arrecadado or 0) * (float(game.rateio_premio or 0) / 100.0)
    game.atualizado_em = now

    try:
        db.commit()
        db.refresh(card)
    except IntegrityError as exc:
        db.rollback()
        if _is_paid_card_lock_violation(exc):
            _raise_persona_http_error(
                status_code=status.HTTP_409_CONFLICT,
                leigo="Esta cartela já foi adquirida por outro jogador. Escolha novos números.",
                medio="Checkout rejeitado por cartela duplicada: a combinação de 24 números já foi confirmada em pagamento anterior.",  # noqa: E501
                codigo="CARD_ALREADY_SOLD",
                technical=str(exc),
            )

        _raise_persona_http_error(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            leigo="Não foi possível confirmar o pagamento agora. Tente novamente.",
            medio="Falha de integridade ao concluir checkout da cartela.",
            codigo="CHECKOUT_INTEGRITY_ERROR",
            technical=str(exc),
        )

    return {
        "message": "Pagamento confirmado",
        "card_id": card.id,
        "game_id": game.id,
        "status": card.status.value if hasattr(card.status, "value") else str(card.status),
        "paid_at": card.atualizado_em.isoformat() if card.atualizado_em else None,
    }


@router.post("/games/{game_id}/close-sales", status_code=status.HTTP_200_OK)
def close_sales_for_game(
    game_id: str,
    payload: CloseSalesRequest,
    db: Session = Depends(get_db),
    user_payload: dict[str, Any] = Depends(get_current_user),
):
    if not _is_admin_payload(user_payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem encerrar vendas",
        )

    game = db.query(Sorteio).filter(Sorteio.id == game_id).first()
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jogo não encontrado")

    now = get_fortaleza_time()
    now_cmp = _normalize_datetime_for_compare(now)
    fim_vendas_cmp = _normalize_datetime_for_compare(game.fim_vendas)
    if fim_vendas_cmp and now_cmp and now_cmp < fim_vendas_cmp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ainda não é possível encerrar: o horário de fim das vendas não foi atingido",
        )

    carts_in_cart = (
        db.query(Cartela)
        .filter(
            Cartela.sorteio_id == game_id,
            Cartela.status == StatusCartela.NO_CARRINHO,
        )
        .all()
    )

    canceled_count = 0
    for card in carts_in_cart:
        card.status = StatusCartela.CANCELADA
        card.atualizado_em = now
        canceled_count += 1

    paid_count = (
        db.query(Cartela)
        .filter(
            Cartela.sorteio_id == game_id,
            Cartela.status.in_([StatusCartela.PAGA, StatusCartela.ATIVA]),
        )
        .count()
    )

    if payload.iniciar_sorteio and game.status == StatusSorteio.AGENDADO:
        game.status = StatusSorteio.EM_ANDAMENTO
        game.iniciado_em = game.iniciado_em or now

    game.atualizado_em = now
    db.commit()

    return {
        "message": "Vendas encerradas e carrinhos invalidados com sucesso",
        "game_id": game_id,
        "canceled_cards": canceled_count,
        "eligible_paid_cards": int(paid_count),
        "game_status": game.status.value if hasattr(game.status, "value") else str(game.status),
        "closed_at": now.isoformat(),
    }


@router.post("/games/{game_id}/snapshot", status_code=status.HTTP_201_CREATED)
def snapshot_game_results(
    game_id: str,
    db: Session = Depends(get_db),
    user_payload: dict[str, Any] = Depends(get_current_user),
):
    if not _is_admin_payload(user_payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem gerar snapshot",
        )

    game = db.query(Sorteio).filter(Sorteio.id == game_id).first()
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jogo não encontrado")

    vencedoras = (
        db.query(Cartela)
        .filter(
            Cartela.sorteio_id == game_id,
            Cartela.status == StatusCartela.VENCEDORA,
        )
        .all()
    )

    payload = {
        "snapshot_at": get_fortaleza_time().isoformat(),
        "game": _to_sorteio_response(game),
        "winner_cards": [
            {
                "card_id": card.id,
                "user_id": card.usuario_id,
                "numbers": _extract_card_numbers(card),
                "prize_value": float(card.valor_premio or 0),
            }
            for card in vencedoras
        ],
    }

    path = _snapshot_path_for_game(game_id)
    with open(path, "w", encoding="utf-8") as fp:
        json.dump(payload, fp, ensure_ascii=False, indent=2)

    return {
        "message": "Snapshot criado com sucesso",
        "snapshot_file": path,
        "winner_cards_count": len(vencedoras),
    }


@router.post("/maintenance/lock", status_code=status.HTTP_200_OK)
def lock_writes_for_maintenance(
    payload: MaintenanceLockRequest,
    db: Session = Depends(get_db),
    user_payload: dict[str, Any] = Depends(get_current_user),
):
    if not _is_admin_payload(user_payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem ativar manutenção",
        )

    now = get_fortaleza_time()
    lock_until = now + timedelta(minutes=payload.minutes)

    mode = _get_or_create_config(
        db,
        "maintenance_mode",
        "false",
        "Flag global de manutenção para bloquear escritas temporariamente",
    )
    reason = _get_or_create_config(
        db,
        "maintenance_reason",
        "Sistema em manutenção para processamento de resultados",
        "Motivo exibido para bloqueio de manutenção",
    )
    until = _get_or_create_config(
        db,
        "maintenance_lock_until",
        "",
        "Timestamp ISO até quando as escritas ficam bloqueadas",
    )

    mode.valor = "true"
    reason.valor = payload.reason
    until.valor = lock_until.isoformat()
    mode.alterado_em = now
    reason.alterado_em = now
    until.alterado_em = now

    db.commit()

    return {
        "message": "Modo manutenção ativado",
        "reason": payload.reason,
        "lock_until": lock_until.isoformat(),
    }


@router.post("/maintenance/unlock", status_code=status.HTTP_200_OK)
def unlock_writes_after_maintenance(
    db: Session = Depends(get_db),
    user_payload: dict[str, Any] = Depends(get_current_user),
):
    if not _is_admin_payload(user_payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem desativar manutenção",
        )

    now = get_fortaleza_time()
    mode = _get_or_create_config(
        db,
        "maintenance_mode",
        "false",
        "Flag global de manutenção para bloquear escritas temporariamente",
    )
    until = _get_or_create_config(
        db,
        "maintenance_lock_until",
        "",
        "Timestamp ISO até quando as escritas ficam bloqueadas",
    )

    mode.valor = "false"
    until.valor = ""
    mode.alterado_em = now
    until.alterado_em = now

    db.commit()

    return {
        "message": "Modo manutenção desativado",
    }


@router.get("/minhas-cartelas")
def list_my_cards_legacy(
    db: Session = Depends(get_db),
    user_payload: dict[str, Any] = Depends(get_current_user),
):
    return list_my_cards(db=db, user_payload=user_payload)
