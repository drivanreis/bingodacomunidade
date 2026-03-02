# Padrão CSS com Bootstrap 5

## Objetivo

Manter consistência visual e funcional em todos os componentes de administração, utilizando classes Bootstrap 5 em vez de inline styles.

## Motivação

- **Manutenibilidade**: Bootstrap classes são mais fáceis de manter do que inline styles espalhados pelo código
- **Consistência**: Padrão visual uniforme em toda a aplicação
- **Performance**: Melhor compilação CSS com classes reutilizáveis
- **Responsividade**: Bootstrap fornece breakpoints e utilidades prontas

## Padrões CSS por Componente

### Containers e Layout

```tsx
// Container principal com padding
<div className="container py-3" style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

// Submenu dentro do container 
<div className="card mb-4 flex-grow-1">
  <div className="card-body p-0" style={{ overflow: 'auto' }}>
    {/* conteúdo */}
  </div>
</div>
```

**Classes aplicadas:**
- `container` - largura máxima responsiva
- `py-3` - padding vertical (1rem)
- `card` - card com bordas e sombra
- `card-body` - espaçamento interno do card
- `p-0` - remove padding do card-body
- `mb-4` - margin-bottom (1.5rem)
- `flex-grow-1` - ocupa espaço disponível flexbox

### Tabelas

```tsx
<div className="table-responsive">
  <table className="table table-hover mb-0">
    <thead className="table-light">
      <tr>
        <th className="text-start">Coluna</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td className="text-start align-middle">Conteúdo</td>
      </tr>
    </tbody>
  </table>
</div>
```

**Classes aplicadas:**
- `table-responsive` - wrapper com scroll horizontal em telas pequenas
- `table` - estilos básicos da tabela
- `table-hover` - destaca linha ao passar mouse
- `table-light` - fundo cinzento no thead
- `text-start` - alinha texto à esquerda
- `align-middle` - alinha verticalmente ao meio
- `mb-0` - remove margin-bottom

### Botões

```tsx
// Botão primário
<button className="btn btn-primary fw-bold">Ação Principal</button>

// Botão secundário
<button className="btn btn-secondary">Cancelar</button>

// Botão de ação (pequeno)
<button className="btn btn-sm btn-primary">Reenviar</button>

// Botão perigoso
<button className="btn btn-danger">Inativar</button>

// Botão sucesso
<button className="btn btn-success">Ativar</button>

// Link como botão
<button className="btn btn-link p-0 text-decoration-underline fw-semibold">
  Abrir detalhes
</button>
```

**Classes aplicadas:**
- `btn` - estilos básicos
- `btn-primary`, `btn-secondary`, `btn-danger`, `btn-success`, `btn-warning` - variantes de cor
- `btn-sm` - tamanho pequeno
- `btn-link` - sem background, texto azul
- `fw-bold` - negrito
- `p-0` - remove padding
- `text-decoration-underline` - adiciona underline
- `ms-2` - margin-start (espaçamento esquerda)

### Badges

```tsx
// Badge de status ativo
<span className="badge bg-success">Ativo</span>

// Badge de status inativo  
<span className="badge bg-secondary">Inativo</span>

// Badge informação
<span className="badge bg-info ms-2">você</span>
```

**Classes aplicadas:**
- `badge` - estilos de badge
- `bg-success` - fundo verde
- `bg-secondary` - fundo cinzento
- `bg-info` - fundo azul claro
- `ms-2` - margin-start

### Alertas

```tsx
// Alerta de erro
<div className="alert alert-danger mb-4" role="alert">
  ⚠️ Mensagem de erro
</div>

// Alerta de aviso
<div className="alert alert-warning mt-2 mb-0" role="note">
  <strong>Importante:</strong> Aviso
</div>

// Alerta de informação
<div className="alert alert-info mb-0" role="status">
  Informação
</div>

// Alerta secundário
<div className="alert alert-secondary mt-3 mb-0" role="status">
  Informação secundária
</div>
```

**Classes aplicadas:**
- `alert` - estilos básicos
- `alert-danger` - fundo vermelho claro
- `alert-warning` - fundo amarelo
- `alert-info` - fundo azul claro
- `alert-secondary` - fundo cinzento claro
- `mb-0`, `mb-4`, `mt-2`, `mt-3` - margins
- `role` - atributo de acessibilidade

### Modais

```tsx
<div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
  <div className="modal-dialog modal-lg">
    <div className="modal-content">
      <div className="modal-header">
        <h5 className="modal-title">Título</h5>
        <button type="button" className="btn-close" onClick={handleClose}></button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {/* Formulário */}
        </div>
        <div className="modal-footer d-flex justify-content-between">
          <div className="d-flex gap-2 flex-wrap">
            <button className="btn btn-primary">Ação</button>
          </div>
          <button className="btn btn-secondary">Fechar</button>
        </div>
      </form>
    </div>
  </div>
</div>
```

**Classes aplicadas:**
- `modal show d-block` - exibe modal
- `modal-dialog` - container do modal
- `modal-lg` - tamanho grande
- `modal-content` - conteúdo
- `modal-header` - header do modal
- `modal-title` - título
- `btn-close` - botão de fechar
- `modal-body` - corpo do modal
- `modal-footer` - rodapé
- `d-flex` - display flex
- `justify-content-between` - espaçamento entre elementos
- `gap-2` - espaço entre elementos flex

### Formulários

```tsx
<div className="mb-3">
  <label htmlFor="id" className="form-label">Label</label>
  <input
    id="id"
    type="text"
    className="form-control"
    value={value}
    onChange={handleChange}
    required
  />
</div>

<div className="row g-2">
  <div className="col-md-6">
    {/* Campo esquerda */}
  </div>
  <div className="col-md-6">
    {/* Campo direita */}
  </div>
</div>
```

**Classes aplicadas:**
- `form-label` - estilo do label
- `form-control` - estilo do input
- `mb-3` - margin-bottom
- `row` - linha flexbox
- `g-2` - gap (espaço) entre colunas
- `col-md-6` - coluna de 50% em telas médias

### Utilitários de Flexbox

```tsx
<div className="d-flex gap-2 flex-wrap">
  {/* itens com gap e wrapping */}
</div>

<div className="d-flex justify-content-between align-items-center">
  {/* espaço entre e alinhamento vertical */}
</div>
```

**Classes aplicadas:**
- `d-flex` - display flex
- `gap-2` - espaço entre itens (0.5rem)
- `flex-wrap` - quebra itens em nova linha
- `justify-content-between` - espaço entre itens
- `align-items-center` - alinha verticalmente ao centro

### Utilitários de Espaçamento

```
m-{1-5} = margin (todas as direções)
mt-{1-5} = margin-top
mb-{1-5} = margin-bottom
ms-{1-5} = margin-start (esquerda)
me-{1-5} = margin-end (direita)

p-{1-5} = padding
pt-{1-5} = padding-top
pb-{1-5} = padding-bottom
px-{1-5} = padding horizontal
py-{1-5} = padding vertical

Valores: 1=0.25rem, 2=0.5rem, 3=1rem, 4=1.5rem, 5=3rem
```

## Componentes Refatorados

### AdminUsers.tsx ✅

- **Antes**: 752 linhas com inline styles complexos
- **Depois**: Mesma funcionalidade com Bootstrap classes
- **Mudanças principais**:
  - Container: `style={{...}}` → `className="container py-3"`
  - Tabela: inline styles → `className="table-responsive"` + `className="table table-hover"`
  - Botões: inline styles → `className="btn btn-primary"` etc
  - Badges: inline styles → `className="badge bg-success"` etc
  - Alertas: inline styles → `className="alert alert-danger"` etc
  - Modais: combinação de classes Bootstrap

### UserManagement.tsx ✅

Já segue o padrão Bootstrap desde a implementação inicial.

## Benefícios Alcançados

1. **Consistência Visual**: Ambos os componentes (AdminUsers e UserManagement) agora usam o mesmo padrão
2. **Manutenibilidade**: Redução de linhas de código com inline styles
3. **Escalabilidade**: Novos componentes podem reutilizar o mesmo padrão
4. **Responsividade**: Bootstrap fornece utilities prontas para responsive design
5. **Theme Consistency**: Cores, espaçamentos e tipografia uniformes

## Guia para Novos Componentes

Ao criar novos componentes de administração:

1. Use `container py-3` para o container principal
2. Use `card` + `card-body` para seções agrupadas
3. Use `table-responsive` + `table table-hover` para tabelas
4. Use `btn btn-{variante}` para botões
5. Use `badge bg-{cor}` para badges/tags
6. Use `alert alert-{tipo}` para alertas
7. Use classes utilitárias (`d-flex`, `gap-2`, `mb-3`, etc) para layout
8. Evite inline styles exceto para propriedades dinâmicas necessárias

## Testes

- ✅ 32 testes de rotas passando
- ✅ Sem erros de compilação TypeScript
- ✅ Frontend respondendo corretamente em localhost:5173

## Próximos Passos (Opcional)

1. Refatorar outros componentes de administração se houver
2. Documentar tema 3 customizado do Bootstrap se necessário
3. Considerar extrair componentes reutilizáveis (AdminTable, AdminButton, etc)
4. Adicionar CSS customizado apenas se necessário (evitar)

## Referências

- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.0/)
- [Bootstrap Utility Classes](https://getbootstrap.com/docs/5.0/utilities/)
- [GERENCIAMENTO_USUARIOS_PAROQUIA.md](./GERENCIAMENTO_USUARIOS_PAROQUIA.md) - Arquitetura de usuários
- [ROTAS.md](./ROTAS.md) - Mapeamento de rotas
