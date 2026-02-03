"""
Rotas Administrativas
=====================
Endpoints para gerenciamento de paróquias, usuários e jogos.
Acesso restrito para SUPER_ADMIN.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from pydantic import BaseModel

from src.db.base import get_db
from src.models.models import Paroquia, Usuario, Sorteio, TipoUsuario, Configuracao, Feedback, TipoFeedback, StatusFeedback
from src.utils.auth import hash_password
from src.utils.time_manager import generate_temporal_id_with_microseconds

router = APIRouter(tags=["Admin"])


# ============================================================================
# SCHEMAS
# ============================================================================

class UpdateUserTipo(BaseModel):
    tipo: str


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
                "responsavel": None,  # Campo não existe no modelo
                "email": p.email,
                "telefone": p.telefone or "",
                "ativa": p.ativa,
                "criado_em": p.criado_em.isoformat() if p.criado_em else None
            }
            for p in paroquias
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar paróquias: {str(e)}"
        )


@router.post("/paroquias", tags=["Admin - Paróquias"])
def criar_paroquia(
    nome: str,
    cidade: str,
    estado: str,
    responsavel: str = None,
    email: str = None,
    telefone: str = None,
    ativa: bool = True,
    db: Session = Depends(get_db)
):
    """Cria uma nova paróquia"""
    try:
        nova_paroquia = Paroquia(
            nome=nome,
            cidade=cidade,
            estado=estado,
            responsavel=responsavel,
            email=email,
            telefone=telefone,
            ativa=ativa,
            criado_em=datetime.utcnow()
        )
        
        db.add(nova_paroquia)
        db.commit()
        db.refresh(nova_paroquia)
        
        return {
            "id": nova_paroquia.id,
            "nome": nova_paroquia.nome,
            "cidade": nova_paroquia.cidade,
            "estado": nova_paroquia.estado,
            "responsavel": nova_paroquia.responsavel,
            "email": nova_paroquia.email,
            "telefone": nova_paroquia.telefone,
            "ativa": nova_paroquia.ativa,
            "criado_em": nova_paroquia.criado_em.isoformat()
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar paróquia: {str(e)}"
        )


@router.put("/paroquias/{paroquia_id}", tags=["Admin - Paróquias"])
def atualizar_paroquia(
    paroquia_id: int,
    nome: str = None,
    cidade: str = None,
    estado: str = None,
    responsavel: str = None,
    email: str = None,
    telefone: str = None,
    ativa: bool = None,
    db: Session = Depends(get_db)
):
    """Atualiza uma paróquia existente"""
    try:
        paroquia = db.query(Paroquia).filter(Paroquia.id == paroquia_id).first()
        
        if not paroquia:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Paróquia não encontrada"
            )
        
        if nome is not None:
            paroquia.nome = nome
        if cidade is not None:
            paroquia.cidade = cidade
        if estado is not None:
            paroquia.estado = estado
        if responsavel is not None:
            paroquia.responsavel = responsavel
        if email is not None:
            paroquia.email = email
        if telefone is not None:
            paroquia.telefone = telefone
        if ativa is not None:
            paroquia.ativa = ativa
        
        db.commit()
        db.refresh(paroquia)
        
        return {
            "id": paroquia.id,
            "nome": paroquia.nome,
            "cidade": paroquia.cidade,
            "estado": paroquia.estado,
            "responsavel": paroquia.responsavel,
            "email": paroquia.email,
            "telefone": paroquia.telefone,
            "ativa": paroquia.ativa,
            "criado_em": paroquia.criado_em.isoformat() if paroquia.criado_em else None
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar paróquia: {str(e)}"
        )


@router.delete("/paroquias/{paroquia_id}", tags=["Admin - Paróquias"])
def excluir_paroquia(paroquia_id: int, db: Session = Depends(get_db)):
    """Exclui uma paróquia"""
    try:
        paroquia = db.query(Paroquia).filter(Paroquia.id == paroquia_id).first()
        
        if not paroquia:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Paróquia não encontrada"
            )
        
        # Verificar se há usuários vinculados
        usuarios_vinculados = db.query(Usuario).filter(
            Usuario.paroquia_id == paroquia_id
        ).count()
        
        if usuarios_vinculados > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Não é possível excluir. Existem {usuarios_vinculados} usuário(s) vinculados a esta paróquia."
            )
        
        db.delete(paroquia)
        db.commit()
        
        return {"message": "Paróquia excluída com sucesso"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao excluir paróquia: {str(e)}"
        )


# ============================================================================
# USUÁRIOS - CRUD
# ============================================================================

@router.get("/usuarios", tags=["Admin - Usuários"])
def listar_usuarios(db: Session = Depends(get_db)):
    """Lista todos os usuários do sistema"""
    try:
        usuarios = db.query(Usuario).all()
        return [
            {
                "id": u.id,
                "nome": u.nome,
                "email": u.email,
                "cpf": u.cpf,
                "tipo": u.tipo.value if u.tipo else None,
                "paroquia_id": u.paroquia_id,
                "paroquia_nome": u.paroquia.nome if u.paroquia else None,
                "ativo": u.ativo,
                "is_bootstrap": u.is_bootstrap,
                "criado_em": u.criado_em.isoformat() if u.criado_em else None
            }
            for u in usuarios
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar usuários: {str(e)}"
        )


@router.post("/usuarios", tags=["Admin - Usuários"])
def criar_usuario(
    nome: str,
    tipo: str,
    senha: str,
    email: str = None,
    cpf: str = None,
    paroquia_id: int = None,
    ativo: bool = True,
    db: Session = Depends(get_db)
):
    """Cria um novo usuário"""
    try:
        # Validação de tipo
        try:
            tipo_usuario = TipoUsuario(tipo)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tipo de usuário inválido: {tipo}"
            )
        
        # Validações
        if tipo_usuario == TipoUsuario.SUPER_ADMIN and not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="E-mail é obrigatório para Super Admin"
            )
        
        if tipo_usuario != TipoUsuario.SUPER_ADMIN and not cpf:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CPF é obrigatório para este tipo de usuário"
            )
        
        # Verificar duplicatas
        if email:
            existe = db.query(Usuario).filter(Usuario.email == email).first()
            if existe:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="E-mail já cadastrado"
                )
        
        if cpf:
            existe = db.query(Usuario).filter(Usuario.cpf == cpf).first()
            if existe:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="CPF já cadastrado"
                )
        
        # Criar usuário
        novo_usuario = Usuario(
            nome=nome,
            email=email,
            cpf=cpf,
            senha_hash=hash_password(senha),
            tipo=tipo_usuario,
            paroquia_id=paroquia_id,
            ativo=ativo,
            criado_em=datetime.utcnow()
        )
        
        db.add(novo_usuario)
        db.commit()
        db.refresh(novo_usuario)
        
        return {
            "id": novo_usuario.id,
            "nome": novo_usuario.nome,
            "email": novo_usuario.email,
            "cpf": novo_usuario.cpf,
            "tipo": novo_usuario.tipo.value,
            "paroquia_id": novo_usuario.paroquia_id,
            "ativo": novo_usuario.ativo,
            "criado_em": novo_usuario.criado_em.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar usuário: {str(e)}"
        )


@router.put("/usuarios/{usuario_id}", tags=["Admin - Usuários"])
def atualizar_usuario(
    usuario_id: int,
    nome: str = None,
    email: str = None,
    cpf: str = None,
    senha: str = None,
    tipo: str = None,
    paroquia_id: int = None,
    ativo: bool = None,
    db: Session = Depends(get_db)
):
    """Atualiza um usuário existente"""
    try:
        usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
        
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado"
            )
        
        if nome is not None:
            usuario.nome = nome
        if email is not None:
            usuario.email = email
        if cpf is not None:
            usuario.cpf = cpf
        if senha is not None:
            usuario.senha_hash = hash_password(senha)
        if tipo is not None:
            try:
                usuario.tipo = TipoUsuario(tipo)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Tipo de usuário inválido: {tipo}"
                )
        if paroquia_id is not None:
            usuario.paroquia_id = paroquia_id
        if ativo is not None:
            usuario.ativo = ativo
        
        db.commit()
        db.refresh(usuario)
        
        return {
            "id": usuario.id,
            "nome": usuario.nome,
            "email": usuario.email,
            "cpf": usuario.cpf,
            "tipo": usuario.tipo.value,
            "paroquia_id": usuario.paroquia_id,
            "ativo": usuario.ativo,
            "criado_em": usuario.criado_em.isoformat() if usuario.criado_em else None
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar usuário: {str(e)}"
        )


@router.put("/usuarios/{usuario_id}/tipo", tags=["Admin - Usuários"])
def atualizar_tipo_usuario(
    usuario_id: str,
    dados: UpdateUserTipo,
    db: Session = Depends(get_db)
):
    """Atualiza apenas o tipo de usuário"""
    try:
        usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
        
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado"
            )
        
        novo_tipo = dados.tipo
        
        # Validar tipo
        tipos_validos = ['super_admin', 'parish_admin', 'paroquia_admin', 'faithful']
        if novo_tipo not in tipos_validos:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tipo inválido. Deve ser um de: {', '.join(tipos_validos)}"
            )
        
        usuario.tipo = novo_tipo
        db.commit()
        db.refresh(usuario)
        
        return {
            "id": usuario.id,
            "nome": usuario.nome,
            "email": usuario.email,
            "cpf": usuario.cpf,
            "tipo": usuario.tipo,
            "criado_em": usuario.criado_em.isoformat() if usuario.criado_em else None
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar tipo de usuário: {str(e)}"
        )


@router.delete("/usuarios/{usuario_id}", tags=["Admin - Usuários"])
def excluir_usuario(usuario_id: int, db: Session = Depends(get_db)):
    """Exclui um usuário"""
    try:
        usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
        
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado"
            )
        
        # Proteção do usuário bootstrap
        if usuario.is_bootstrap:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Não é possível excluir o usuário bootstrap"
            )
        
        db.delete(usuario)
        db.commit()
        
        return {"message": "Usuário excluído com sucesso"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao excluir usuário: {str(e)}"
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
                "criado_em": j.criado_em.isoformat() if j.criado_em else None
            }
            for j in jogos
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar jogos: {str(e)}"
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
                "valor": c.valor,
                "tipo": c.tipo.value,
                "categoria": c.categoria.value,
                "descricao": c.descricao,
                "alterado_em": c.alterado_em.isoformat() if c.alterado_em else None,
                "alterado_por_id": c.alterado_por_id
            }
            for c in configs
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar configurações: {str(e)}"
        )


@router.put("/configuracoes/{chave}", tags=["Admin - Configurações"])
def atualizar_configuracao(
    chave: str,
    valor: str,
    db: Session = Depends(get_db)
):
    """Atualiza o valor de uma configuração"""
    try:
        config = db.query(Configuracao).filter(Configuracao.chave == chave).first()
        
        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Configuração '{chave}' não encontrada"
            )
        
        # Atualiza o valor
        config.valor = valor
        config.alterado_em = datetime.now()
        # TODO: Pegar ID do usuário autenticado do token JWT
        # config.alterado_por_id = usuario_id_do_token
        
        db.commit()
        db.refresh(config)
        
        return {
            "chave": config.chave,
            "valor": config.valor,
            "tipo": config.tipo.value,
            "categoria": config.categoria.value,
            "descricao": config.descricao,
            "alterado_em": config.alterado_em.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar configuração: {str(e)}"
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
    db: Session = Depends(get_db)
):
    """
    Cria um novo feedback (usado por qualquer usuário autenticado).
    
    Parâmetros preparados para análise futura por IA.
    """
    try:
        # Valida satisfacao
        if satisfacao < 1 or satisfacao > 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Satisfação deve ser entre 1 e 5"
            )
        
        # Valida tipo
        try:
            tipo_enum = TipoFeedback(tipo)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tipo inválido. Use: {', '.join([t.value for t in TipoFeedback])}"
            )
        
        # Verifica se usuário existe
        usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado"
            )
        
        # Cria feedback
        feedback = Feedback(
            id=generate_temporal_id_with_microseconds('FDB'),
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
            prioridade_ia=None  # Futuramente calculado por IA
        )
        
        db.add(feedback)
        db.commit()
        db.refresh(feedback)
        
        return {
            "id": feedback.id,
            "tipo": feedback.tipo.value,
            "assunto": feedback.assunto,
            "status": feedback.status.value,
            "criado_em": feedback.criado_em.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar feedback: {str(e)}"
        )


@router.get("/feedbacks", tags=["Admin - Feedbacks"])
def listar_feedbacks(db: Session = Depends(get_db)):
    """Lista todos os feedbacks (apenas Super Admin)"""
    try:
        feedbacks = db.query(Feedback).order_by(Feedback.criado_em.desc()).all()
        
        resultado = []
        for f in feedbacks:
            # Busca dados do usuário
            usuario = db.query(Usuario).filter(Usuario.id == f.usuario_id).first()
            usuario_nome = usuario.nome if usuario else "Usuário Desconhecido"
            
            # Busca paróquia do usuário (se tiver)
            paroquia_nome = None
            if usuario and usuario.paroquia_id:
                paroquia = db.query(Paroquia).filter(Paroquia.id == usuario.paroquia_id).first()
                paroquia_nome = paroquia.nome if paroquia else None
            
            # Busca quem respondeu (se foi respondido)
            respondido_por_nome = None
            if f.respondido_por_id:
                respondido_por = db.query(Usuario).filter(Usuario.id == f.respondido_por_id).first()
                respondido_por_nome = respondido_por.nome if respondido_por else None
            
            resultado.append({
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
                "prioridade_ia": f.prioridade_ia
            })
        
        return resultado
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar feedbacks: {str(e)}"
        )


@router.put("/feedbacks/{feedback_id}/responder", tags=["Admin - Feedbacks"])
def responder_feedback(
    feedback_id: str,
    resposta: str,
    respondido_por_id: str,
    db: Session = Depends(get_db)
):
    """Responde a um feedback (apenas Super Admin)"""
    try:
        feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
        
        if not feedback:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Feedback não encontrado"
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
            "respondido_em": feedback.respondido_em.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao responder feedback: {str(e)}"
        )


@router.put("/feedbacks/{feedback_id}/status", tags=["Admin - Feedbacks"])
def atualizar_status_feedback(
    feedback_id: str,
    novo_status: str,
    db: Session = Depends(get_db)
):
    """Atualiza o status de um feedback"""
    try:
        feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
        
        if not feedback:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Feedback não encontrado"
            )
        
        # Valida status
        try:
            status_enum = StatusFeedback(novo_status)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Status inválido. Use: {', '.join([s.value for s in StatusFeedback])}"
            )
        
        feedback.status = status_enum
        db.commit()
        db.refresh(feedback)
        
        return {
            "id": feedback.id,
            "status": feedback.status.value
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar status: {str(e)}"
        )
