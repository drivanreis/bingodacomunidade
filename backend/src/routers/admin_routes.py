"""
Rotas Administrativas
=====================
Endpoints para gerenciamento de paróquias, usuários (fiéis), administradores e jogos.
Acesso restrito para SUPER_ADMIN (via UsuarioAdministrativo com nivel_acesso=ADMIN_SITE).
"""

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel, EmailStr
import asyncio

from src.db.base import get_db
from src.models.models import (
    Paroquia,
    UsuarioComum,
    UsuarioParoquia,
    RoleParoquia,
    RoleParoquiaCodigo,
    Sorteio,
    Configuracao,
    TipoConfiguracao,
    CategoriaConfiguracao,
    Feedback,
    TipoFeedback,
    StatusFeedback,
)
from src.utils.auth import hash_password, verify_password
from src.utils.time_manager import generate_temporal_id_with_microseconds
from src.utils.email_service import email_service

router = APIRouter(tags=["Admin"])


# ============================================================================
# SCHEMAS
# ============================================================================


class UpdateUserTipo(BaseModel):
    tipo: str


class CreateParoquiaRequest(BaseModel):
    nome: str
    email: str
    chave_pix: str
    telefone: str | None = None
    endereco: str | None = None
    cidade: str | None = None
    estado: str | None = "CE"
    cep: str | None = None
    ativa: bool = True


class UpdateParoquiaRequest(BaseModel):
    nome: str | None = None
    email: str | None = None
    chave_pix: str | None = None
    telefone: str | None = None
    endereco: str | None = None
    cidade: str | None = None
    estado: str | None = None
    cep: str | None = None
    ativa: bool | None = None


class EmailTestRequest(BaseModel):
    to_email: EmailStr


class CreateUsuarioRequest(BaseModel):
    nome: str
    tipo: str
    senha: str
    email: str | None = None
    cpf: str | None = None
    telefone: str | None = None
    whatsapp: str | None = None
    paroquia_id: str | None = None
    ativo: bool = True


class UpdateUsuarioRequest(BaseModel):
    nome: str | None = None
    email: str | None = None
    cpf: str | None = None
    telefone: str | None = None
    whatsapp: str | None = None
    senha: str | None = None
    senha_atual: str | None = None
    nova_senha: str | None = None
    tipo: str | None = None
    paroquia_id: str | None = None
    ativo: bool | None = None


ALLOWED_ADMIN_SITE_USER_TYPES = {
    RoleParoquiaCodigo.ADMIN.value,
    RoleParoquiaCodigo.CAIXA.value,
    RoleParoquiaCodigo.RECEPCAO.value,
    RoleParoquiaCodigo.BINGO.value,
    RoleParoquiaCodigo.PORTEIRO.value,
    "super_admin",
}


def _get_single_paroquia_or_raise(db: Session) -> Paroquia:
    paroquias = db.query(Paroquia).all()
    if len(paroquias) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nenhuma paróquia cadastrada. Edite a paróquia seed antes de cadastrar usuários.",  # noqa: E501
        )
    if len(paroquias) > 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Configuração inválida: o sistema deve possuir apenas uma paróquia.",
        )
    return paroquias[0]


def _get_or_create_role_paroquia(db: Session, codigo: str) -> RoleParoquia:
    role = (
        db.query(RoleParoquia)
        .filter(
            RoleParoquia.codigo == codigo,
        )
        .first()
    )
    if role:
        if not role.ativo:
            role.ativo = True
        return role

    nomes = {
        "paroquia_admin": "Administrador Paroquial",
        "paroquia_caixa": "Caixa",
        "paroquia_recepcao": "Recepção",
        "paroquia_bingo": "Bingo",
        "paroquia_porteiro": "Porteiro",
    }
    role = RoleParoquia(
        id=generate_temporal_id_with_microseconds("ROL"),
        codigo=codigo,
        nome=nomes.get(codigo, codigo.replace("paroquia_", "").title()),
        descricao=f"Role auto-criada para {codigo}",
        ativo=True,
        criado_em=datetime.utcnow(),
        atualizado_em=datetime.utcnow(),
    )
    db.add(role)
    db.flush()
    return role


# ============================================================================
# PARÓQUIAS - CRUD
# ============================================================================


@router.get("/paroquias", tags=["Admin - Paróquias"])
def listar_paroquias(db: Session = Depends(get_db)):
    """Lista todas as paróquias cadastradas"""
    try:
        paroquias = db.query(Paroquia).all()
        return [
            {
                "id": p.id,
                "nome": p.nome,
                "cidade": p.cidade or "",
                "estado": p.estado or "CE",
                "email": p.email,
                "telefone": p.telefone or "",
                "endereco": p.endereco or "",
                "cep": p.cep or "",
                "chave_pix": p.chave_pix,
                "ativa": p.ativa,
                "criado_em": p.criado_em.isoformat() if p.criado_em else None,
            }
            for p in paroquias
        ]
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro ao listar paróquias"
        )


@router.post("/paroquias", tags=["Admin - Paróquias"])
def criar_paroquia(payload: CreateParoquiaRequest, db: Session = Depends(get_db)):
    """Cria uma nova paróquia"""
    try:
        existe_paroquia = db.query(Paroquia).count() > 0
        if existe_paroquia:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Já existe uma paróquia cadastrada. Neste sistema, a paróquia seed deve apenas ser editada.",  # noqa: E501
            )

        nova_paroquia = Paroquia(
            id=generate_temporal_id_with_microseconds("PAR"),
            nome=payload.nome,
            email=payload.email,
            chave_pix=payload.chave_pix,
            telefone=payload.telefone,
            endereco=payload.endereco,
            cidade=payload.cidade,
            estado=payload.estado,
            cep=payload.cep,
            ativa=payload.ativa,
        )

        db.add(nova_paroquia)
        db.commit()
        db.refresh(nova_paroquia)

        return {
            "id": nova_paroquia.id,
            "nome": nova_paroquia.nome,
            "cidade": nova_paroquia.cidade,
            "estado": nova_paroquia.estado,
            "email": nova_paroquia.email,
            "telefone": nova_paroquia.telefone,
            "endereco": nova_paroquia.endereco,
            "cep": nova_paroquia.cep,
            "chave_pix": nova_paroquia.chave_pix,
            "ativa": nova_paroquia.ativa,
            "criado_em": nova_paroquia.criado_em.isoformat(),
        }
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro ao criar paróquia"
        )


@router.put("/paroquias/{paroquia_id}", tags=["Admin - Paróquias"])
def atualizar_paroquia(
    paroquia_id: str, payload: UpdateParoquiaRequest, db: Session = Depends(get_db)
):
    """Atualiza uma paróquia existente"""
    try:
        paroquia = db.query(Paroquia).filter(Paroquia.id == paroquia_id).first()

        if not paroquia:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Paróquia não encontrada"
            )

        if payload.nome is not None:
            paroquia.nome = payload.nome
        if payload.cidade is not None:
            paroquia.cidade = payload.cidade
        if payload.estado is not None:
            paroquia.estado = payload.estado
        if payload.email is not None:
            paroquia.email = payload.email
        if payload.telefone is not None:
            paroquia.telefone = payload.telefone
        if payload.endereco is not None:
            paroquia.endereco = payload.endereco
        if payload.cep is not None:
            paroquia.cep = payload.cep
        if payload.chave_pix is not None:
            paroquia.chave_pix = payload.chave_pix
        if payload.ativa is not None:
            paroquia.ativa = payload.ativa

        db.commit()
        db.refresh(paroquia)

        return {
            "id": paroquia.id,
            "nome": paroquia.nome,
            "cidade": paroquia.cidade,
            "estado": paroquia.estado,
            "email": paroquia.email,
            "telefone": paroquia.telefone,
            "endereco": paroquia.endereco,
            "cep": paroquia.cep,
            "chave_pix": paroquia.chave_pix,
            "ativa": paroquia.ativa,
            "criado_em": paroquia.criado_em.isoformat() if paroquia.criado_em else None,
        }
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro ao atualizar paróquia"
        )


@router.delete("/paroquias/{paroquia_id}", tags=["Admin - Paróquias"])
def excluir_paroquia(paroquia_id: str, db: Session = Depends(get_db)):
    """Exclui uma paróquia"""
    try:
        paroquia = db.query(Paroquia).filter(Paroquia.id == paroquia_id).first()

        if not paroquia:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Paróquia não encontrada"
            )

        if bool(getattr(paroquia, "is_seed", False)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="A paróquia seed não pode ser excluída. Apenas edição é permitida.",
            )

        usuarios_comuns_vinculados = (
            db.query(UsuarioComum).filter(UsuarioComum.paroquia_id == paroquia_id).count()
        )
        usuarios_paroquia_vinculados = (
            db.query(UsuarioParoquia).filter(UsuarioParoquia.paroquia_id == paroquia_id).count()
        )

        if usuarios_comuns_vinculados > 0 or usuarios_paroquia_vinculados > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Não é possível excluir paróquia com usuários vinculados",
            )

        db.delete(paroquia)
        db.commit()

        return {
            "message": "Paróquia excluída com sucesso",
            "id": paroquia_id,
        }
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro ao excluir paróquia"
        )


# ============================================================================
# USUÁRIOS - CRUD
# ============================================================================


@router.get("/usuarios", tags=["Admin - Usuários"])
def listar_usuarios(db: Session = Depends(get_db)):
    """Lista todos os usuários do sistema"""
    try:
        usuarios_paroquia = db.query(UsuarioParoquia).all()
        usuarios_comuns = db.query(UsuarioComum).all()

        dados_paroquia = [
            {
                "id": u.id,
                "nome": u.nome,
                "email": u.email,
                "cpf": u.cpf,
                "telefone": u.telefone,
                "whatsapp": u.whatsapp,
                "tipo": (u.role.codigo if u.role else "paroquia_recepcao"),
                "paroquia_id": u.paroquia_id,
                "paroquia_nome": u.paroquia.nome if u.paroquia else None,
                "ativo": u.ativo,
                "is_bootstrap": False,
                "criado_em": u.criado_em.isoformat() if u.criado_em else None,
            }
            for u in usuarios_paroquia
        ]

        dados_comuns = [
            {
                "id": u.id,
                "nome": u.nome,
                "email": u.email,
                "cpf": u.cpf,
                "telefone": u.telefone,
                "whatsapp": u.whatsapp,
                "tipo": u.tipo.value if hasattr(u.tipo, "value") else u.tipo,
                "paroquia_id": u.paroquia_id,
                "paroquia_nome": u.paroquia.nome if u.paroquia else None,
                "ativo": u.ativo,
                "is_bootstrap": bool(getattr(u, "is_bootstrap", False)),
                "criado_em": u.criado_em.isoformat() if u.criado_em else None,
            }
            for u in usuarios_comuns
        ]

        return dados_paroquia + dados_comuns
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro ao listar usuários"
        )


@router.post("/usuarios", tags=["Admin - Usuários"])
def criar_usuario(
    payload: CreateUsuarioRequest | None = Body(None),
    nome: str | None = Query(None),
    tipo: str | None = Query(None),
    senha: str | None = Query(None),
    email: str | None = Query(None),
    cpf: str | None = Query(None),
    telefone: str | None = Query(None),
    whatsapp: str | None = Query(None),
    paroquia_id: str | None = Query(None),
    ativo: bool | None = Query(None),
    db: Session = Depends(get_db),
):
    """Cria um novo usuário"""
    try:
        if payload is None:
            if not nome or not tipo or not senha:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Campos obrigatórios ausentes",
                )
            payload = CreateUsuarioRequest(
                nome=nome,
                tipo=tipo,
                senha=senha,
                email=email,
                cpf=cpf,
                telefone=telefone,
                whatsapp=whatsapp,
                paroquia_id=paroquia_id,
                ativo=True if ativo is None else bool(ativo),
            )

        paroquia_unica = _get_single_paroquia_or_raise(db)

        tipo_usuario = (payload.tipo or "").strip().lower()
        if tipo_usuario not in ALLOWED_ADMIN_SITE_USER_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tipo de usuário inválido para esta área. Permitidos: paroquia_admin, paroquia_caixa, paroquia_recepcao, paroquia_bingo, paroquia_porteiro",  # noqa: E501
            )

        # Validações
        if not payload.email or not payload.email.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="E-mail é obrigatório"
            )

        if not payload.telefone or not payload.telefone.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Telefone com DDD é obrigatório"
            )

        if not payload.cpf:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CPF é obrigatório para usuário da paróquia",
            )

        # Verificar duplicatas
        if payload.email:
            existe = (
                db.query(UsuarioParoquia).filter(UsuarioParoquia.email == payload.email).first()
            )
            if not existe:
                existe = db.query(UsuarioComum).filter(UsuarioComum.email == payload.email).first()
            if existe:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, detail="E-mail já cadastrado"
                )

        if payload.cpf:
            existe = db.query(UsuarioParoquia).filter(UsuarioParoquia.cpf == payload.cpf).first()
            if not existe:
                existe = db.query(UsuarioComum).filter(UsuarioComum.cpf == payload.cpf).first()
            if existe:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, detail="CPF já cadastrado"
                )

        role = _get_or_create_role_paroquia(db, tipo_usuario)

        # Criar usuário
        login = payload.email.strip().lower()

        novo_usuario = UsuarioParoquia(
            id=generate_temporal_id_with_microseconds("USR"),
            nome=payload.nome,
            login=login,
            email=payload.email,
            cpf=payload.cpf,
            telefone=payload.telefone,
            whatsapp=payload.whatsapp,
            senha_hash=hash_password(payload.senha),
            paroquia_id=paroquia_unica.id,
            role_id=role.id,
            ativo=True,
            criado_em=datetime.utcnow(),
        )

        db.add(novo_usuario)
        db.commit()
        db.refresh(novo_usuario)

        return {
            "id": novo_usuario.id,
            "nome": novo_usuario.nome,
            "email": novo_usuario.email,
            "cpf": novo_usuario.cpf,
            "tipo": role.codigo,
            "paroquia_id": novo_usuario.paroquia_id,
            "ativo": novo_usuario.ativo,
            "criado_em": novo_usuario.criado_em.isoformat(),
        }
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro ao criar usuário"
        )


@router.put("/usuarios/{usuario_id}", tags=["Admin - Usuários"])
def atualizar_usuario(
    usuario_id: str,
    payload: UpdateUsuarioRequest | None = Body(None),
    nome: str | None = Query(None),
    email: str | None = Query(None),
    cpf: str | None = Query(None),
    telefone: str | None = Query(None),
    whatsapp: str | None = Query(None),
    senha: str | None = Query(None),
    senha_atual: str | None = Query(None),
    nova_senha: str | None = Query(None),
    tipo: str | None = Query(None),
    paroquia_id: str | None = Query(None),
    ativo: bool | None = Query(None),
    db: Session = Depends(get_db),
):
    """Atualiza um usuário existente"""
    try:
        if payload is None:
            payload = UpdateUsuarioRequest(
                nome=nome,
                email=email,
                cpf=cpf,
                telefone=telefone,
                whatsapp=whatsapp,
                senha=senha,
                senha_atual=senha_atual,
                nova_senha=nova_senha,
                tipo=tipo,
                paroquia_id=paroquia_id,
                ativo=ativo,
            )

        usuario = db.query(UsuarioParoquia).filter(UsuarioParoquia.id == usuario_id).first()
        usuario_legacy = None
        if not usuario:
            usuario_legacy = db.query(UsuarioComum).filter(UsuarioComum.id == usuario_id).first()

        if not usuario and not usuario_legacy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado"
            )

        paroquia_unica = _get_single_paroquia_or_raise(db)

        usuario_ref = usuario if usuario is not None else usuario_legacy

        if payload.nome is not None:
            usuario_ref.nome = payload.nome
        if payload.email is not None:
            usuario_ref.email = payload.email
        if payload.cpf is not None:
            if payload.cpf != usuario_ref.cpf:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="CPF não pode ser alterado após o cadastro",
                )
        if payload.telefone is not None:
            usuario_ref.telefone = payload.telefone
        if payload.whatsapp is not None:
            usuario_ref.whatsapp = payload.whatsapp
        if payload.senha is not None and (
            payload.senha_atual is not None or payload.nova_senha is not None
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Informe apenas um fluxo de troca de senha por vez",
            )

        if payload.senha_atual is not None or payload.nova_senha is not None:
            if not payload.senha_atual or not payload.nova_senha:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Para trocar a senha, informe senha atual e nova senha",
                )

            if not verify_password(payload.senha_atual, usuario_ref.senha_hash):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, detail="Senha atual inválida"
                )

            if verify_password(payload.nova_senha, usuario_ref.senha_hash):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A nova senha deve ser diferente da senha atual",
                )

            usuario_ref.senha_hash = hash_password(payload.nova_senha)
        elif payload.senha is not None:
            usuario_ref.senha_hash = hash_password(payload.senha)
        if payload.tipo is not None:
            try:
                novo_tipo = payload.tipo.strip().lower()
            except Exception:
                novo_tipo = ""
            if novo_tipo not in ALLOWED_ADMIN_SITE_USER_TYPES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Tipo de usuário inválido para esta área. Permitidos: paroquia_admin, paroquia_caixa, paroquia_recepcao, paroquia_bingo, paroquia_porteiro",  # noqa: E501
                )
            if usuario is not None:
                role = _get_or_create_role_paroquia(db, novo_tipo)
                usuario.role_id = role.id
            else:
                usuario_legacy.tipo = novo_tipo
        usuario_ref.paroquia_id = paroquia_unica.id
        if payload.ativo is not None:
            usuario_ref.ativo = payload.ativo

        db.commit()
        db.refresh(usuario_ref)

        return {
            "id": usuario_ref.id,
            "nome": usuario_ref.nome,
            "email": usuario_ref.email,
            "cpf": usuario_ref.cpf,
            "telefone": usuario_ref.telefone,
            "whatsapp": usuario_ref.whatsapp,
            "tipo": (
                usuario.role.codigo
                if usuario is not None and usuario.role
                else (
                    usuario_ref.tipo.value
                    if hasattr(usuario_ref.tipo, "value")
                    else usuario_ref.tipo
                )
            ),
            "paroquia_id": usuario_ref.paroquia_id,
            "ativo": usuario_ref.ativo,
            "criado_em": usuario_ref.criado_em.isoformat() if usuario_ref.criado_em else None,
        }
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro ao atualizar usuário"
        )


@router.put("/usuarios/{usuario_id}/tipo", tags=["Admin - Usuários"])
def atualizar_tipo_usuario(usuario_id: str, dados: UpdateUserTipo, db: Session = Depends(get_db)):
    """Atualiza apenas o tipo de usuário"""
    try:
        usuario = db.query(UsuarioParoquia).filter(UsuarioParoquia.id == usuario_id).first()
        usuario_legacy = None
        if not usuario:
            usuario_legacy = db.query(UsuarioComum).filter(UsuarioComum.id == usuario_id).first()

        if not usuario and not usuario_legacy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado"
            )

        novo_tipo = dados.tipo

        # Validar tipo
        tipos_validos = [
            "paroquia_admin",
            "paroquia_caixa",
            "paroquia_recepcao",
            "paroquia_bingo",
            "paroquia_porteiro",
        ]
        if novo_tipo not in tipos_validos:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tipo inválido. Deve ser um de: {', '.join(tipos_validos)}",
            )

        if usuario is not None:
            role = _get_or_create_role_paroquia(db, novo_tipo)
            usuario.role_id = role.id
        else:
            usuario_legacy.tipo = novo_tipo
        db.commit()
        if usuario is not None:
            db.refresh(usuario)
            tipo_retorno = usuario.role.codigo if usuario.role else novo_tipo
            id_retorno = usuario.id
            nome_retorno = usuario.nome
            email_retorno = usuario.email
            cpf_retorno = usuario.cpf
            criado_em_retorno = usuario.criado_em
        else:
            db.refresh(usuario_legacy)
            tipo_retorno = (
                usuario_legacy.tipo.value
                if hasattr(usuario_legacy.tipo, "value")
                else usuario_legacy.tipo
            )
            id_retorno = usuario_legacy.id
            nome_retorno = usuario_legacy.nome
            email_retorno = usuario_legacy.email
            cpf_retorno = usuario_legacy.cpf
            criado_em_retorno = usuario_legacy.criado_em

        return {
            "id": id_retorno,
            "nome": nome_retorno,
            "email": email_retorno,
            "cpf": cpf_retorno,
            "tipo": tipo_retorno,
            "criado_em": criado_em_retorno.isoformat() if criado_em_retorno else None,
        }
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao atualizar tipo de usuário",
        )


@router.delete("/usuarios/{usuario_id}", tags=["Admin - Usuários"])
def excluir_usuario(usuario_id: str, db: Session = Depends(get_db)):
    """Exclui um usuário"""
    try:
        usuario = db.query(UsuarioParoquia).filter(UsuarioParoquia.id == usuario_id).first()
        usuario_legacy = None
        if not usuario:
            usuario_legacy = db.query(UsuarioComum).filter(UsuarioComum.id == usuario_id).first()

        if not usuario and not usuario_legacy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado"
            )

        db.delete(usuario if usuario is not None else usuario_legacy)
        db.commit()

        return {"message": "Usuário excluído com sucesso"}
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro ao excluir usuário"
        )


# ============================================================================
# JOGOS - LISTAGEM
# ============================================================================


@router.get("/jogos", tags=["Admin - Jogos"])
def listar_jogos(db: Session = Depends(get_db)):
    """Lista todos os jogos (sorteios) cadastrados"""
    try:
        jogos = db.query(Sorteio).all()
        return [
            {
                "id": j.id,
                "paroquia_id": j.paroquia_id,
                "paroquia_nome": j.paroquia.nome if j.paroquia else None,
                "nome": j.titulo,
                "data_sorteio": j.horario_sorteio.isoformat() if j.horario_sorteio else None,
                "valor_cartela": float(j.valor_cartela) if j.valor_cartela else 0,
                "quantidade_cartelas": j.total_cartelas_vendidas,
                "status": j.status.value if j.status else None,
                "criado_em": j.criado_em.isoformat() if j.criado_em else None,
            }
            for j in jogos
        ]
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro ao listar jogos"
        )


# ============================================================================
# CONFIGURAÇÕES - CRUD
# ============================================================================


@router.get("/configuracoes", tags=["Admin - Configurações"])
def listar_configuracoes(db: Session = Depends(get_db)):
    """Lista todas as configurações do sistema"""
    try:
        configs = db.query(Configuracao).all()
        return [
            {
                "chave": c.chave,
                "valor": email_service.mask_if_sensitive(c.chave, c.valor),
                "tipo": c.tipo.value,
                "categoria": c.categoria.value,
                "descricao": c.descricao,
                "sensitive": email_service.is_sensitive_config_key(c.chave),
                "alterado_em": c.alterado_em.isoformat() if c.alterado_em else None,
                "alterado_por_id": c.alterado_por_id,
            }
            for c in configs
        ]
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro ao listar configurações"
        )


@router.put("/configuracoes/{chave}", tags=["Admin - Configurações"])
def atualizar_configuracao(chave: str, valor: str, db: Session = Depends(get_db)):
    """Atualiza o valor de uma configuração"""
    try:
        smtp_dependency_keys = {
            "emailDevMode",
            "smtpHost",
            "smtpPort",
            "smtpSecurity",
            "smtpUser",
            "smtpPasswordEncrypted",
            "fromEmail",
            "fromName",
            "frontendUrl",
        }

        def invalidar_validacao_smtp_se_necessario(config_key: str):
            if config_key not in smtp_dependency_keys:
                return

            validacao = (
                db.query(Configuracao).filter(Configuracao.chave == "smtpValidatedAt").first()
            )

            if not validacao:
                validacao = Configuracao(
                    chave="smtpValidatedAt",
                    valor="",
                    tipo=TipoConfiguracao.STRING,
                    categoria=CategoriaConfiguracao.MENSAGENS,
                    descricao="Timestamp ISO da última validação SMTP com envio real",
                )
                db.add(validacao)
            else:
                validacao.valor = ""
                validacao.alterado_em = datetime.now()

        config_defaults = {
            "signup_ufs_permitidas": {
                "tipo": TipoConfiguracao.STRING,
                "categoria": CategoriaConfiguracao.FORMULARIOS,
                "descricao": "UFs permitidas para cadastro público (ALL ou lista CSV, ex: CE,PB,RN,PI)",  # noqa: E501
            },
            "default_rateio_premio": {
                "tipo": TipoConfiguracao.NUMBER,
                "categoria": CategoriaConfiguracao.FORMULARIOS,
                "descricao": "Percentual padrão de prêmio para novos jogos",
            },
            "default_rateio_paroquia": {
                "tipo": TipoConfiguracao.NUMBER,
                "categoria": CategoriaConfiguracao.FORMULARIOS,
                "descricao": "Percentual padrão da paróquia para novos jogos",
            },
            "default_rateio_operacao": {
                "tipo": TipoConfiguracao.NUMBER,
                "categoria": CategoriaConfiguracao.FORMULARIOS,
                "descricao": "Percentual padrão de operação para novos jogos",
            },
            "default_rateio_evolucao": {
                "tipo": TipoConfiguracao.NUMBER,
                "categoria": CategoriaConfiguracao.FORMULARIOS,
                "descricao": "Percentual padrão de seguro operacional para novos jogos",
            },
            "politica_remarcacao_modo": {
                "tipo": TipoConfiguracao.STRING,
                "categoria": CategoriaConfiguracao.FORMULARIOS,
                "descricao": "Modo padrão de remarcação de sorteios (single, cascade, assistida)",
            },
            "politica_remarcacao_janela_dias": {
                "tipo": TipoConfiguracao.NUMBER,
                "categoria": CategoriaConfiguracao.FORMULARIOS,
                "descricao": "Janela em dias para sugerir cascata automática/assistida",
            },
            "comunicacao_operacional_canal": {
                "tipo": TipoConfiguracao.STRING,
                "categoria": CategoriaConfiguracao.MENSAGENS,
                "descricao": "Canal operacional preferencial (whatsapp, email, sms, ambos, todos ou CSV ex.: whatsapp,sms)",  # noqa: E501
            },
            "comunicacao_operacional_alerta_conflito": {
                "tipo": TipoConfiguracao.BOOLEAN,
                "categoria": CategoriaConfiguracao.MENSAGENS,
                "descricao": "Ativa alerta operacional quando houver conflito de cronograma",
            },
            "comunicacao_operacional_resumo_diario": {
                "tipo": TipoConfiguracao.BOOLEAN,
                "categoria": CategoriaConfiguracao.MENSAGENS,
                "descricao": "Ativa envio de resumo diário operacional",
            },
            "emailDevMode": {
                "tipo": TipoConfiguracao.BOOLEAN,
                "categoria": CategoriaConfiguracao.MENSAGENS,
                "descricao": "Se true, não envia e-mail real (apenas log). Para produção, use false",  # noqa: E501
            },
            "smtpHost": {
                "tipo": TipoConfiguracao.STRING,
                "categoria": CategoriaConfiguracao.MENSAGENS,
                "descricao": "Servidor SMTP para envio de e-mails",
            },
            "smtpPort": {
                "tipo": TipoConfiguracao.NUMBER,
                "categoria": CategoriaConfiguracao.MENSAGENS,
                "descricao": "Porta SMTP (geralmente 587 com TLS)",
            },
            "smtpSecurity": {
                "tipo": TipoConfiguracao.STRING,
                "categoria": CategoriaConfiguracao.MENSAGENS,
                "descricao": "Segurança SMTP: tls (porta 587), ssl (porta 465) ou none",
            },
            "smtpUser": {
                "tipo": TipoConfiguracao.STRING,
                "categoria": CategoriaConfiguracao.MENSAGENS,
                "descricao": "Usuário SMTP (normalmente seu e-mail remetente)",
            },
            "smtpPasswordEncrypted": {
                "tipo": TipoConfiguracao.STRING,
                "categoria": CategoriaConfiguracao.MENSAGENS,
                "descricao": "Senha SMTP protegida (criptografada no backend)",
            },
            "fromEmail": {
                "tipo": TipoConfiguracao.STRING,
                "categoria": CategoriaConfiguracao.MENSAGENS,
                "descricao": "E-mail remetente exibido no envio",
            },
            "fromName": {
                "tipo": TipoConfiguracao.STRING,
                "categoria": CategoriaConfiguracao.MENSAGENS,
                "descricao": "Nome exibido como remetente",
            },
            "frontendUrl": {
                "tipo": TipoConfiguracao.STRING,
                "categoria": CategoriaConfiguracao.MENSAGENS,
                "descricao": "URL pública do frontend usada em links de e-mail",
            },
            "smtpValidatedAt": {
                "tipo": TipoConfiguracao.STRING,
                "categoria": CategoriaConfiguracao.MENSAGENS,
                "descricao": "Timestamp ISO da última validação SMTP com envio real",
            },
        }

        config = db.query(Configuracao).filter(Configuracao.chave == chave).first()

        if not config:
            if chave in config_defaults:
                valor_inicial = valor
                if email_service.is_sensitive_config_key(chave):
                    valor_inicial = email_service.encrypt_secret(valor)

                config = Configuracao(
                    chave=chave,
                    valor=valor_inicial,
                    tipo=config_defaults[chave]["tipo"],
                    categoria=config_defaults[chave]["categoria"],
                    descricao=config_defaults[chave]["descricao"],
                )
                db.add(config)
                invalidar_validacao_smtp_se_necessario(chave)
                db.commit()
                db.refresh(config)
                return {
                    "chave": config.chave,
                    "valor": email_service.mask_if_sensitive(config.chave, config.valor),
                    "tipo": config.tipo.value,
                    "categoria": config.categoria.value,
                    "descricao": config.descricao,
                    "alterado_em": config.alterado_em.isoformat() if config.alterado_em else None,
                }

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Configuração '{chave}' não encontrada",
            )

        # Atualiza o valor
        if email_service.is_sensitive_config_key(chave):
            if valor == email_service._mask_secret():
                valor_final = config.valor
            else:
                valor_final = email_service.encrypt_secret(valor)
        else:
            valor_final = valor

        config.valor = valor_final
        config.alterado_em = datetime.now()
        invalidar_validacao_smtp_se_necessario(chave)
        # TODO: Pegar ID do usuário autenticado do token JWT
        # config.alterado_por_id = usuario_id_do_token

        db.commit()
        db.refresh(config)

        return {
            "chave": config.chave,
            "valor": email_service.mask_if_sensitive(config.chave, config.valor),
            "tipo": config.tipo.value,
            "categoria": config.categoria.value,
            "descricao": config.descricao,
            "alterado_em": config.alterado_em.isoformat(),
        }
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao atualizar configuração",
        )


@router.post("/configuracoes/email/teste", tags=["Admin - Configurações"])
def testar_envio_email_configurado(payload: EmailTestRequest, db: Session = Depends(get_db)):
    """Envia e-mail de teste usando a configuração SMTP salva no sistema."""
    try:
        enviado = asyncio.run(
            email_service.send_email(
                to_email=payload.to_email,
                subject="🧪 Teste de Configuração SMTP - Bingo da Comunidade",
                html_content="<p>Configuração de e-mail validada com sucesso.</p>",
                text_content="Configuração de e-mail validada com sucesso.",
                db=db,
            )
        )

        if not enviado:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Falha ao enviar e-mail de teste. Verifique SMTP_HOST/PORT/USER/PASSWORD e EMAIL_DEV_MODE.",  # noqa: E501
            )

        validacao = db.query(Configuracao).filter(Configuracao.chave == "smtpValidatedAt").first()
        if not validacao:
            validacao = Configuracao(
                chave="smtpValidatedAt",
                valor=datetime.now().isoformat(),
                tipo=TipoConfiguracao.STRING,
                categoria=CategoriaConfiguracao.MENSAGENS,
                descricao="Timestamp ISO da última validação SMTP com envio real",
            )
            db.add(validacao)
        else:
            validacao.valor = datetime.now().isoformat()
            validacao.alterado_em = datetime.now()
        db.commit()

        return {
            "message": "E-mail de teste enviado com sucesso",
            "to_email": payload.to_email,
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao testar envio de e-mail",
        )


# ============================================================================
# FEEDBACKS - CRUD
# ============================================================================


@router.post("/feedbacks", tags=["Feedbacks"])
def criar_feedback(
    usuario_id: str,
    tipo: str,
    assunto: str,
    mensagem: str,
    satisfacao: int,
    user_agent: str = None,
    url_origem: str = None,
    db: Session = Depends(get_db),
):
    """
    Cria um novo feedback (usado por qualquer usuário autenticado).

    Parâmetros preparados para análise futura por IA.
    """
    try:
        # Valida satisfacao
        if satisfacao < 1 or satisfacao > 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Satisfação deve ser entre 1 e 5"
            )

        # Valida tipo
        try:
            tipo_enum = TipoFeedback(tipo)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tipo inválido. Use: {', '.join([t.value for t in TipoFeedback])}",
            )

        # Verifica se usuário existe
        usuario = db.query(UsuarioComum).filter(UsuarioComum.id == usuario_id).first()
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado"
            )

        # Cria feedback
        feedback = Feedback(
            id=generate_temporal_id_with_microseconds("FDB"),
            usuario_id=usuario_id,
            tipo=tipo_enum,
            assunto=assunto,
            mensagem=mensagem,
            satisfacao=satisfacao,
            status=StatusFeedback.PENDENTE,
            user_agent=user_agent,
            url_origem=url_origem,
            tags=[],  # Futuramente preenchido por IA
            sentimento_score=None,  # Futuramente calculado por IA
            categoria_ia=None,  # Futuramente classificado por IA
            prioridade_ia=None,  # Futuramente calculado por IA
        )

        db.add(feedback)
        db.commit()
        db.refresh(feedback)

        return {
            "id": feedback.id,
            "tipo": feedback.tipo.value,
            "assunto": feedback.assunto,
            "status": feedback.status.value,
            "criado_em": feedback.criado_em.isoformat(),
        }
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro ao criar feedback"
        )


@router.get("/feedbacks", tags=["Admin - Feedbacks"])
def listar_feedbacks(db: Session = Depends(get_db)):
    """Lista todos os feedbacks (apenas Super Admin)"""
    try:
        feedbacks = db.query(Feedback).order_by(Feedback.criado_em.desc()).all()

        resultado = []
        for f in feedbacks:
            # Busca dados do usuário
            usuario = db.query(UsuarioComum).filter(UsuarioComum.id == f.usuario_id).first()
            usuario_nome = usuario.nome if usuario else "Usuário Desconhecido"

            # Busca paróquia do usuário (se tiver)
            paroquia_nome = None
            if usuario and usuario.paroquia_id:
                paroquia = db.query(Paroquia).filter(Paroquia.id == usuario.paroquia_id).first()
                paroquia_nome = paroquia.nome if paroquia else None

            # Busca quem respondeu (se foi respondido)
            respondido_por_nome = None
            if f.respondido_por_id:
                respondido_por = (
                    db.query(UsuarioComum).filter(UsuarioComum.id == f.respondido_por_id).first()
                )
                respondido_por_nome = respondido_por.nome if respondido_por else None

            resultado.append(
                {
                    "id": f.id,
                    "usuario_id": f.usuario_id,
                    "usuario_nome": usuario_nome,
                    "paroquia_nome": paroquia_nome,
                    "tipo": f.tipo.value,
                    "assunto": f.assunto,
                    "mensagem": f.mensagem,
                    "satisfacao": f.satisfacao,
                    "status": f.status.value,
                    "resposta": f.resposta,
                    "respondido_por": respondido_por_nome,
                    "respondido_em": f.respondido_em.isoformat() if f.respondido_em else None,
                    "criado_em": f.criado_em.isoformat(),
                    # Campos para IA (futuros)
                    "tags": f.tags or [],
                    "sentimento_score": f.sentimento_score,
                    "categoria_ia": f.categoria_ia,
                    "prioridade_ia": f.prioridade_ia,
                }
            )

        return resultado
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro ao listar feedbacks"
        )


@router.put("/feedbacks/{feedback_id}/responder", tags=["Admin - Feedbacks"])
def responder_feedback(
    feedback_id: str, resposta: str, respondido_por_id: str, db: Session = Depends(get_db)
):
    """Responde a um feedback (apenas Super Admin)"""
    try:
        feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()

        if not feedback:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Feedback não encontrado"
            )

        # Atualiza feedback
        feedback.resposta = resposta
        feedback.respondido_por_id = respondido_por_id
        feedback.respondido_em = datetime.now()
        feedback.status = StatusFeedback.RESOLVIDO

        db.commit()
        db.refresh(feedback)

        return {
            "id": feedback.id,
            "status": feedback.status.value,
            "resposta": feedback.resposta,
            "respondido_em": feedback.respondido_em.isoformat(),
        }
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro ao responder feedback"
        )


@router.put("/feedbacks/{feedback_id}/status", tags=["Admin - Feedbacks"])
def atualizar_status_feedback(feedback_id: str, novo_status: str, db: Session = Depends(get_db)):
    """Atualiza o status de um feedback"""
    try:
        feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()

        if not feedback:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Feedback não encontrado"
            )

        # Valida status
        try:
            status_enum = StatusFeedback(novo_status)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Status inválido. Use: {', '.join([s.value for s in StatusFeedback])}",
            )

        feedback.status = status_enum
        db.commit()
        db.refresh(feedback)

        return {"id": feedback.id, "status": feedback.status.value}
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro ao atualizar status"
        )
