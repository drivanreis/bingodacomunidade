from src.models.models import TipoUsuario
from src.utils.permissions import (
    get_permission_level,
    has_higher_or_equal_permission,
)


def test_get_permission_level_known_roles():
    assert get_permission_level(TipoUsuario.SUPER_ADMIN) == 1
    assert get_permission_level(TipoUsuario.PAROQUIA_ADMIN) == 2
    assert get_permission_level(TipoUsuario.PAROQUIA_CAIXA) == 3
    assert get_permission_level(TipoUsuario.PAROQUIA_RECEPCAO) == 3
    assert get_permission_level(TipoUsuario.PAROQUIA_BINGO) == 3
    assert get_permission_level(TipoUsuario.FIEL) == 4


def test_get_permission_level_unknown_fallback_999():
    assert get_permission_level("desconhecido") == 999


def test_has_higher_or_equal_permission_hierarchy_rules():
    assert has_higher_or_equal_permission(TipoUsuario.SUPER_ADMIN, TipoUsuario.PAROQUIA_ADMIN) is True
    assert has_higher_or_equal_permission(TipoUsuario.PAROQUIA_ADMIN, TipoUsuario.PAROQUIA_CAIXA) is True
    assert has_higher_or_equal_permission(TipoUsuario.FIEL, TipoUsuario.PAROQUIA_ADMIN) is False
    assert has_higher_or_equal_permission(TipoUsuario.PAROQUIA_CAIXA, TipoUsuario.PAROQUIA_CAIXA) is True
