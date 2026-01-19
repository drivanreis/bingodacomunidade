"""
Pydantic Schemas - Validação e Serialização de Dados
==================================================
Define os schemas para validação de entrada e saída da API.

Responsabilidades:
- Validação de dados de entrada
- Serialização de dados de saída
- Documentação automática da API (OpenAPI)
"""

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
import re

from src.models.models import TipoUsuario, StatusSorteio, StatusCartela


# ============================================================================
# VALIDATORS REUTILIZÁVEIS
# ============================================================================

def validate_whatsapp(v: Optional[str]) -> Optional[str]:
    """Valida formato de WhatsApp brasileiro (+55DDNNNNNNNNN)."""
    if v is None:
        return v
    
    # Remove caracteres não numéricos
    v = re.sub(r'\D', '', v)
    
    # Valida formato brasileiro
    if not re.match(r'^55\d{10,11}$', v):
        raise ValueError('WhatsApp deve estar no formato +55DDNNNNNNNNN (11 ou 12 dígitos após +55)')
    
    return f"+{v}"


def validate_chave_pix(v: Optional[str]) -> Optional[str]:
    """Valida formato básico de chave PIX (CPF, Email, Telefone, Aleatória)."""
    if v is None:
        return v
    
    v = v.strip()
    
    if len(v) == 0:
        raise ValueError('Chave PIX não pode estar vazia')
    
    # Aceita qualquer formato por enquanto (CPF, email, telefone, chave aleatória)
    # Em produção, adicionar validações específicas por tipo
    return v


def validate_cpf(v: Optional[str]) -> Optional[str]:
    """
    Valida e formata CPF brasileiro usando o algoritmo Módulo 11.
    
    Implementa validação COMPLETA conforme Receita Federal:
    - Remove caracteres não numéricos
    - Verifica se tem exatamente 11 dígitos
    - Rejeita sequências repetidas (111.111.111-11, etc)
    - Valida dígitos verificadores usando algoritmo Módulo 11
    
    Algoritmo Módulo 11 (Receita Federal):
    
    1º Dígito Verificador (posição 10):
       - Multiplica os 9 primeiros dígitos por: 10, 9, 8, 7, 6, 5, 4, 3, 2
       - Soma todos os resultados
       - Calcula: resto = soma % 11
       - Se resto < 2: dígito = 0, senão: dígito = 11 - resto
    
    2º Dígito Verificador (posição 11):
       - Multiplica os 10 primeiros dígitos por: 11, 10, 9, 8, 7, 6, 5, 4, 3, 2
       - Soma todos os resultados
       - Calcula: resto = soma % 11
       - Se resto < 2: dígito = 0, senão: dígito = 11 - resto
    
    Exemplos válidos:
    - "12345678909" ✓
    - "111.444.777-35" ✓ (será retornado como "11144477735")
    
    Exemplos inválidos:
    - "12345678901" ✗ (dígitos verificadores incorretos)
    - "111.111.111-11" ✗ (sequência repetida)
    - "123.456.789" ✗ (apenas 9 dígitos)
    
    Args:
        v: CPF em qualquer formato (com ou sem pontuação)
        
    Returns:
        CPF validado contendo apenas números (11 dígitos)
        
    Raises:
        ValueError: Se CPF for inválido
    """
    if v is None:
        return v
    
    # Remove caracteres não numéricos (aceita XXX.XXX.XXX-XX ou XXXXXXXXXXX)
    cpf = re.sub(r'\D', '', v)
    
    # Verifica se tem exatamente 11 dígitos
    if len(cpf) != 11:
        raise ValueError('CPF deve ter 11 dígitos')
    
    # Rejeita sequências de números iguais (000.000.000-00 até 999.999.999-99)
    if cpf == cpf[0] * 11:
        raise ValueError('CPF inválido (sequência de números iguais)')
    
    # ========================================================================
    # VALIDAÇÃO DOS DÍGITOS VERIFICADORES - ALGORITMO MÓDULO 11
    # ========================================================================
    
    def calc_digito(cpf_parcial: str) -> str:
        """
        Calcula um dígito verificador usando o algoritmo Módulo 11.
        
        Para 9 dígitos: multiplica por 10, 9, 8, 7, 6, 5, 4, 3, 2
        Para 10 dígitos: multiplica por 11, 10, 9, 8, 7, 6, 5, 4, 3, 2
        """
        soma = 0
        for i, digit in enumerate(cpf_parcial):
            # Peso começa em len+1 e decresce: 10→2 ou 11→2
            peso = len(cpf_parcial) + 1 - i
            soma += int(digit) * peso
        
        resto = soma % 11
        
        # Regra do Módulo 11: se resto < 2, dígito = 0, senão dígito = 11 - resto
        return '0' if resto < 2 else str(11 - resto)
    
    # Valida primeiro dígito verificador (10ª posição)
    if cpf[9] != calc_digito(cpf[:9]):
        raise ValueError('CPF inválido (primeiro dígito verificador incorreto)')
    
    # Valida segundo dígito verificador (11ª posição)
    if cpf[10] != calc_digito(cpf[:10]):
        raise ValueError('CPF inválido (segundo dígito verificador incorreto)')
    
    # Retorna CPF validado (apenas números, sem formatação)
    return cpf


# ============================================================================
# SCHEMAS: PARÓQUIA
# ============================================================================

class ParoquiaBase(BaseModel):
    """Schema base para Paróquia."""
    nome: str = Field(..., min_length=3, max_length=200, description="Nome da paróquia")
    email: EmailStr = Field(..., description="Email de contato da paróquia")
    telefone: Optional[str] = Field(None, max_length=20, description="Telefone de contato")
    endereco: Optional[str] = Field(None, max_length=300, description="Endereço completo")
    cidade: Optional[str] = Field(None, max_length=100, description="Cidade")
    estado: Optional[str] = Field("CE", max_length=2, description="Estado (sigla)")
    cep: Optional[str] = Field(None, max_length=10, description="CEP")
    chave_pix: str = Field(..., description="Chave PIX para recebimento")
    
    # Validadores usando @field_validator (Pydantic v2)
    @field_validator('chave_pix')
    @classmethod
    def _validate_pix(cls, v):
        return validate_chave_pix(v)


class ParoquiaCreate(ParoquiaBase):
    """Schema para criação de Paróquia."""
    pass


class ParoquiaUpdate(BaseModel):
    """Schema para atualização de Paróquia."""
    nome: Optional[str] = Field(None, min_length=3, max_length=200)
    email: Optional[EmailStr] = None
    telefone: Optional[str] = Field(None, max_length=20)
    endereco: Optional[str] = Field(None, max_length=300)
    cidade: Optional[str] = Field(None, max_length=100)
    estado: Optional[str] = Field(None, max_length=2)
    cep: Optional[str] = Field(None, max_length=10)
    chave_pix: Optional[str] = None
    ativa: Optional[bool] = None
    
    # Validadores
    @field_validator('chave_pix')
    @classmethod
    def _validate_pix(cls, v):
        if v is None:
            return v
        return validate_chave_pix(v)


class ParoquiaResponse(ParoquiaBase):
    """Schema de resposta para Paróquia."""
    id: str
    ativa: bool
    criado_em: datetime
    atualizado_em: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# SCHEMAS: USUÁRIO
# ============================================================================

class UsuarioBase(BaseModel):
    """Schema base para Usuário."""
    nome: str = Field(..., min_length=3, max_length=200, description="Nome completo")
    email: Optional[EmailStr] = Field(None, description="Email (obrigatório para admins)")
    whatsapp: Optional[str] = Field(None, description="WhatsApp (+55DDNNNNNNNNN)")
    tipo: TipoUsuario = Field(..., description="Tipo de usuário")
    paroquia_id: Optional[str] = Field(None, description="ID da paróquia (NULL para Super Admin)")
    chave_pix: Optional[str] = Field(None, description="Chave PIX para receber prêmios")
    
    # Validadores
    @field_validator('whatsapp')
    @classmethod
    def _validate_whatsapp(cls, v):
        return validate_whatsapp(v)
    
    @field_validator('chave_pix')
    @classmethod
    def _validate_pix(cls, v):
        return validate_chave_pix(v)
    
    @model_validator(mode='after')
    def validate_user_type(self):
        """Valida regras específicas por tipo de usuário."""
        # Super Admin não deve ter paroquia_id
        if self.tipo == TipoUsuario.SUPER_ADMIN and self.paroquia_id:
            raise ValueError('Super Admin não pode estar associado a uma paróquia')
        
        # Parish Admin e Fiel devem ter paroquia_id
        if self.tipo in [TipoUsuario.PARISH_ADMIN, TipoUsuario.FIEL] and not self.paroquia_id:
            raise ValueError(f'{self.tipo.value} deve estar associado a uma paróquia')
        
        # Admins precisam de email
        if self.tipo in [TipoUsuario.SUPER_ADMIN, TipoUsuario.PARISH_ADMIN] and not self.email:
            raise ValueError('Administradores precisam ter email')
        
        # Fiel precisa de email OU whatsapp
        if self.tipo == TipoUsuario.FIEL and not (self.email or self.whatsapp):
            raise ValueError('Fiel precisa ter email ou WhatsApp')
        
        # Fiel precisa de chave PIX para receber prêmios
        if self.tipo == TipoUsuario.FIEL and not self.chave_pix:
            raise ValueError('Fiel precisa ter chave PIX para receber prêmios')
        
        return self


class UsuarioCreate(UsuarioBase):
    """Schema para criação de Usuário."""
    senha: str = Field(..., min_length=6, description="Senha (mínimo 6 caracteres)")


class UsuarioUpdate(BaseModel):
    """Schema para atualização de Usuário."""
    nome: Optional[str] = Field(None, min_length=3, max_length=200)
    email: Optional[EmailStr] = None
    whatsapp: Optional[str] = None
    chave_pix: Optional[str] = None
    senha: Optional[str] = Field(None, min_length=6)
    ativo: Optional[bool] = None
    
    # Validadores
    @field_validator('whatsapp')
    @classmethod
    def _validate_whatsapp(cls, v):
        return validate_whatsapp(v)
    
    @field_validator('chave_pix')
    @classmethod
    def _validate_pix(cls, v):
        if v is None:
            return v
        return validate_chave_pix(v)


class UsuarioResponse(BaseModel):
    """Schema de resposta para Usuário."""
    id: str
    nome: str
    cpf: Optional[str]
    email: Optional[str]
    whatsapp: Optional[str]
    tipo: TipoUsuario
    paroquia_id: Optional[str]
    chave_pix: Optional[str]
    ativo: bool
    criado_em: datetime
    ultimo_acesso: Optional[datetime]
    
    class Config:
        from_attributes = True


# ============================================================================
# SCHEMAS: SORTEIO (BINGO)
# ============================================================================

class SorteioBase(BaseModel):
    """Schema base para Sorteio."""
    paroquia_id: str = Field(..., description="ID da paróquia organizadora")
    titulo: str = Field(..., min_length=3, max_length=200, description="Título do sorteio")
    descricao: Optional[str] = Field(None, description="Descrição detalhada")
    valor_cartela: float = Field(..., gt=0, description="Valor da cartela em R$")
    
    # Rateio (deve somar 100.0)
    rateio_premio: float = Field(25.0, ge=0, le=100, description="% para prêmio")
    rateio_paroquia: float = Field(25.0, ge=0, le=100, description="% para paróquia")
    rateio_operacao: float = Field(25.0, ge=0, le=100, description="% para operação/TI")
    rateio_evolucao: float = Field(25.0, ge=0, le=100, description="% para evolução")
    
    # Datas
    inicio_vendas: datetime = Field(..., description="Início das vendas")
    fim_vendas: datetime = Field(..., description="Fim das vendas")
    horario_sorteio: datetime = Field(..., description="Horário do sorteio")
    
    @field_validator('rateio_premio', 'rateio_paroquia', 'rateio_operacao', 'rateio_evolucao')
    @classmethod
    def validate_percentage(cls, v):
        """Valida que percentuais estão entre 0 e 100."""
        if not 0 <= v <= 100:
            raise ValueError('Percentual deve estar entre 0 e 100')
        return v
    
    @model_validator(mode='after')
    def validate_rateio_sum(self):
        """Valida que a soma dos rateios é 100%."""
        rateio_total = (
            self.rateio_premio +
            self.rateio_paroquia +
            self.rateio_operacao +
            self.rateio_evolucao
        )
        
        if abs(rateio_total - 100.0) > 0.01:  # Tolerância para erros de ponto flutuante
            raise ValueError(f'Soma dos rateios deve ser 100%. Atual: {rateio_total}%')
        
        return self
    
    @model_validator(mode='after')
    def validate_dates(self):
        """Valida ordem lógica das datas."""
        if self.inicio_vendas and self.fim_vendas and self.inicio_vendas >= self.fim_vendas:
            raise ValueError('Início das vendas deve ser antes do fim')
        
        if self.fim_vendas and self.horario_sorteio and self.horario_sorteio < self.fim_vendas:
            raise ValueError('Horário do sorteio deve ser após o fim das vendas')
        
        return self


class SorteioCreate(SorteioBase):
    """Schema para criação de Sorteio."""
    pass


class SorteioUpdate(BaseModel):
    """Schema para atualização de Sorteio."""
    titulo: Optional[str] = Field(None, min_length=3, max_length=200)
    descricao: Optional[str] = None
    status: Optional[StatusSorteio] = None


class SorteioResponse(SorteioBase):
    """Schema de resposta para Sorteio."""
    id: str
    status: StatusSorteio
    total_arrecadado: float
    total_premio: float
    total_cartelas_vendidas: int
    hash_integridade: Optional[str]
    vencedores_ids: List[str]
    criado_em: datetime
    atualizado_em: datetime
    iniciado_em: Optional[datetime]
    finalizado_em: Optional[datetime]
    
    class Config:
        from_attributes = True


# ============================================================================
# SCHEMAS: CARTELA
# ============================================================================

class CartelaBase(BaseModel):
    """Schema base para Cartela."""
    sorteio_id: str = Field(..., description="ID do sorteio")
    usuario_id: str = Field(..., description="ID do usuário comprador")


class CartelaCreate(CartelaBase):
    """Schema para criação de Cartela."""
    pass


class CartelaResponse(CartelaBase):
    """Schema de resposta para Cartela."""
    id: str
    numeros: List[List[int]] = Field(..., description="Matriz 5x5 de números")
    numeros_marcados: List[int] = Field(..., description="Números já sorteados")
    status: StatusCartela
    valor_premio: Optional[float]
    criado_em: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# SCHEMAS: AUTENTICAÇÃO
# ============================================================================

class SignupRequest(BaseModel):
    """Schema para cadastro público de fiéis."""
    nome: str = Field(..., min_length=3, max_length=200, description="Nome completo")
    cpf: str = Field(..., description="CPF (11 dígitos)")
    whatsapp: str = Field(..., description="WhatsApp (+55DDNNNNNNNNN)")
    chave_pix: str = Field(..., description="Chave PIX para receber prêmios")
    senha: str = Field(..., min_length=6, description="Senha (mínimo 6 caracteres)")
    
    # Validadores
    @field_validator('cpf')
    @classmethod
    def _validate_cpf(cls, v):
        return validate_cpf(v)
    
    @field_validator('whatsapp')
    @classmethod
    def _validate_whatsapp(cls, v):
        return validate_whatsapp(v)
    
    @field_validator('chave_pix')
    @classmethod
    def _validate_pix(cls, v):
        return validate_chave_pix(v)


class LoginRequest(BaseModel):
    """Schema para autenticação."""
    cpf: str = Field(..., description="CPF do usuário")
    senha: str = Field(..., description="Senha do usuário")
    
    @field_validator('cpf')
    @classmethod
    def _validate_cpf(cls, v):
        return validate_cpf(v)


class TokenResponse(BaseModel):
    """Schema de resposta para autenticação."""
    access_token: str = Field(..., description="JWT token de acesso")
    token_type: str = Field(default="bearer", description="Tipo do token")
    usuario: UsuarioResponse = Field(..., description="Dados do usuário autenticado")


# ============================================================================
# SCHEMAS AUXILIARES
# ============================================================================

class HealthCheckResponse(BaseModel):
    """Schema de resposta para health check."""
    status: str = Field(..., description="Status da API")
    timestamp_fortaleza: str = Field(..., description="Horário atual em Fortaleza")
    timezone: str = Field(..., description="Timezone configurado")


# ============================================================================
# EXPORTAÇÕES
# ============================================================================

__all__ = [
    # Paróquia
    'ParoquiaCreate',
    'ParoquiaUpdate',
    'ParoquiaResponse',
    
    # Usuário
    'UsuarioCreate',
    'UsuarioUpdate',
    'UsuarioResponse',
    
    # Sorteio
    'SorteioCreate',
    'SorteioUpdate',
    'SorteioResponse',
    
    # Cartela
    'CartelaCreate',
    'CartelaResponse',
    
    # Autenticação
    'SignupRequest',
    'LoginRequest',
    'TokenResponse',
    
    # Auxiliares
    'HealthCheckResponse',
]
