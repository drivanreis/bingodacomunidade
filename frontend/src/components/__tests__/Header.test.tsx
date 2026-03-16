import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

import { Header } from '../Header'
import { paroquiaService } from '../../services/api'

describe('Header', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('exibe nome da paróquia quando o serviço responde com sucesso', async () => {
    const mockParoquia = { nome: 'Paróquia Santa', cidade: 'Fortaleza', estado: 'CE' }
    const getParoquiaSpy = vi
      .spyOn(paroquiaService, 'getParoquiaAtual')
      .mockResolvedValue(mockParoquia)

    render(<Header />)

    expect(screen.getByText('🎱 Sistema de Bingo Comunitário')).toBeInTheDocument()
    expect(screen.getByText('Carregando...')).toBeInTheDocument()

    await waitFor(() => {
      expect(getParoquiaSpy).toHaveBeenCalledTimes(1)
      expect(screen.getByText('⛪ Paróquia Santa')).toBeInTheDocument()
      expect(screen.getByText('Fortaleza - CE')).toBeInTheDocument()
    })
  })

  it('exibe mensagem de erro quando o serviço falha', async () => {
    vi.spyOn(paroquiaService, 'getParoquiaAtual').mockRejectedValue(new Error('falha'))

    render(<Header />)

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar dados da paróquia')).toBeInTheDocument()
    })
  })

  it('não chama o serviço quando showParoquia é false', async () => {
    const getParoquiaSpy = vi.spyOn(paroquiaService, 'getParoquiaAtual')

    render(<Header showParoquia={false} />)

    await waitFor(() => {
      expect(getParoquiaSpy).not.toHaveBeenCalled()
      expect(screen.queryByText('Carregando...')).not.toBeInTheDocument()
    })
  })
})
