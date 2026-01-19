"""
Time Manager - Gerenciador de Tempo com Fuso Horário de Fortaleza
=================================================================
Módulo responsável por:
- Garantir que TODAS as operações temporais usem o fuso de Fortaleza-CE
- Gerar IDs temporais únicos baseados em timestamp
- Servir como Single Source of Truth para tempo no sistema
"""

from datetime import datetime
from typing import Optional
import pytz


# Fuso horário oficial do sistema (Fortaleza-CE)
FORTALEZA_TZ = pytz.timezone('America/Fortaleza')


def get_fortaleza_time() -> datetime:
    """
    Retorna o horário atual no fuso de Fortaleza-CE.
    
    Esta é a única fonte de verdade para tempo no sistema.
    Nunca use datetime.now() diretamente em outras partes do código.
    
    Returns:
        datetime: Horário atual com timezone de Fortaleza
    """
    return datetime.now(FORTALEZA_TZ)


def generate_temporal_id(prefix: Optional[str] = None) -> str:
    """
    Gera um ID temporal único no formato YYYYMMDDHHMMSS.
    
    Este ID serve como identificador único baseado em timestamp,
    garantindo rastreabilidade e ordenação cronológica automática.
    
    Args:
        prefix: Prefixo opcional para categorizar o ID (ex: 'BNG', 'CRT', 'USR')
        
    Returns:
        str: ID temporal no formato [PREFIX_]YYYYMMDDHHMMSS
        
    Examples:
        >>> generate_temporal_id()
        '20260113153045'
        >>> generate_temporal_id('BNG')
        'BNG_20260113153045'
    """
    now = get_fortaleza_time()
    temporal_id = now.strftime('%Y%m%d%H%M%S')
    
    if prefix:
        return f"{prefix}_{temporal_id}"
    
    return temporal_id


def generate_temporal_id_with_microseconds(prefix: Optional[str] = None) -> str:
    """
    Gera um ID temporal com microsegundos para maior precisão.
    
    Use esta função quando houver risco de colisão em IDs gerados
    no mesmo segundo (ex: importação em lote).
    
    Args:
        prefix: Prefixo opcional para categorizar o ID
        
    Returns:
        str: ID temporal no formato [PREFIX_]YYYYMMDDHHMMSS_MMMMMM
        
    Examples:
        >>> generate_temporal_id_with_microseconds('TXN')
        'TXN_20260113153045_123456'
    """
    now = get_fortaleza_time()
    temporal_id = now.strftime('%Y%m%d%H%M%S_%f')
    
    if prefix:
        return f"{prefix}_{temporal_id}"
    
    return temporal_id


def format_to_iso(dt: datetime) -> str:
    """
    Converte datetime para string ISO 8601 com timezone de Fortaleza.
    
    Args:
        dt: Datetime a ser formatado
        
    Returns:
        str: String no formato ISO 8601 com timezone
    """
    if dt.tzinfo is None:
        dt = FORTALEZA_TZ.localize(dt)
    else:
        dt = dt.astimezone(FORTALEZA_TZ)
    
    return dt.isoformat()


def parse_temporal_id(temporal_id: str) -> datetime:
    """
    Converte um ID temporal de volta para datetime.
    
    Args:
        temporal_id: ID temporal no formato YYYYMMDDHHMMSS ou PREFIX_YYYYMMDDHHMMSS
        
    Returns:
        datetime: Objeto datetime com timezone de Fortaleza
        
    Raises:
        ValueError: Se o formato do ID for inválido
    """
    # Remove prefixo se existir
    if '_' in temporal_id:
        temporal_id = temporal_id.split('_', 1)[1]
    
    # Remove microsegundos se existirem
    if len(temporal_id) > 14:
        temporal_id = temporal_id[:14]
    
    try:
        # Parse da string para datetime
        dt_naive = datetime.strptime(temporal_id, '%Y%m%d%H%M%S')
        # Adiciona timezone de Fortaleza
        return FORTALEZA_TZ.localize(dt_naive)
    except ValueError as e:
        raise ValueError(f"ID temporal inválido: {temporal_id}. Formato esperado: YYYYMMDDHHMMSS") from e


def get_time_until_next_second() -> float:
    """
    Retorna quantos segundos faltam para o próximo segundo completo.
    
    Útil para sincronização de sorteios e eventos temporais.
    
    Returns:
        float: Segundos até o próximo segundo (0.0 a 0.999...)
    """
    now = get_fortaleza_time()
    microseconds = now.microsecond
    return (1000000 - microseconds) / 1000000.0


# Exportações públicas do módulo
__all__ = [
    'FORTALEZA_TZ',
    'get_fortaleza_time',
    'generate_temporal_id',
    'generate_temporal_id_with_microseconds',
    'format_to_iso',
    'parse_temporal_id',
    'get_time_until_next_second',
]
